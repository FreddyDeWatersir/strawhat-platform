-- Straw Hat Platform — pgvector + hybrid search (FTS + semantic via RRF)
-- Prerequisites: enable "vector" extension in Supabase Dashboard → Database → Extensions
-- Run in SQL Editor after 001_initial.sql

create extension if not exists vector;

alter table document_chunks
  add column if not exists embedding vector(512);

create index if not exists document_chunks_embedding_idx
  on document_chunks using hnsw (embedding vector_cosine_ops);

-- Hybrid search: Postgres FTS + cosine similarity, merged with Reciprocal Rank Fusion (k=60)
create or replace function search_document_chunks_hybrid(
  search_query text,
  query_embedding vector(512),
  match_count int default 8
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  filename text,
  rank real
)
language sql
stable
as $$
  with fts as (
    select
      dc.id,
      row_number() over (
        order by ts_rank(
          dc.search_vector,
          websearch_to_tsquery('english', search_query)
        ) desc
      ) as r
    from document_chunks dc
    inner join documents d on d.id = dc.document_id
    where d.status = 'ready'
      and search_query is not null
      and length(trim(search_query)) > 0
      and dc.search_vector @@ websearch_to_tsquery('english', search_query)
    limit 50
  ),
  vec as (
    select id, row_number() over (order by dist) as r
    from (
      select
        dc.id,
        (dc.embedding <=> query_embedding) as dist
      from document_chunks dc
      inner join documents d on d.id = dc.document_id
      where d.status = 'ready'
        and dc.embedding is not null
      order by dist
      limit 50
    ) top_vec
  ),
  combined as (
    select
      dc.id,
      dc.document_id,
      dc.chunk_index,
      dc.content,
      d.filename,
      (
        coalesce(1.0 / (60.0 + fts.r), 0.0)
        + coalesce(1.0 / (60.0 + vec.r), 0.0)
      )::real as rrf_score
    from document_chunks dc
    inner join documents d on d.id = dc.document_id
    left join fts on fts.id = dc.id
    left join vec on vec.id = dc.id
    where fts.id is not null or vec.id is not null
  )
  select
    combined.id,
    combined.document_id,
    combined.chunk_index,
    combined.content,
    combined.filename,
    combined.rrf_score as rank
  from combined
  order by combined.rrf_score desc
  limit greatest(match_count, 1);
$$;
