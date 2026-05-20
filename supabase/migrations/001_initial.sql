-- Straw Hat Platform — initial schema
-- Run in Supabase SQL Editor after creating project.
-- Then create Storage bucket "pdfs" (private) in Dashboard → Storage.

create extension if not exists "pgcrypto";

do $$ begin
  create type doc_type as enum ('japan_invoice', 'fedex', 'other');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type document_status as enum ('processing', 'ready', 'failed');
exception
  when duplicate_object then null;
end $$;

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  storage_path text not null unique,
  uploaded_at timestamptz not null default now(),
  doc_type doc_type not null default 'other',
  full_text text,
  status document_status not null default 'processing',
  error_message text
);

create table if not exists document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  search_vector tsvector generated always as (to_tsvector('english', coalesce(content, ''))) stored,
  unique (document_id, chunk_index)
);

create index if not exists document_chunks_search_idx
  on document_chunks using gin (search_vector);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references documents(id) on delete cascade unique,
  supplier text,
  invoice_date date,
  currency text,
  amount numeric,
  description text,
  tracking_number text,
  product_set text,
  notes jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists documents_uploaded_at_idx on documents (uploaded_at desc);
create index if not exists transactions_invoice_date_idx on transactions (invoice_date desc nulls last);

-- Full-text search over chunks (joins filename for citations)
create or replace function search_document_chunks(
  search_query text,
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
  select
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    d.filename,
    ts_rank(dc.search_vector, websearch_to_tsquery('english', search_query))::real as rank
  from document_chunks dc
  inner join documents d on d.id = dc.document_id
  where d.status = 'ready'
    and search_query is not null
    and length(trim(search_query)) > 0
    and dc.search_vector @@ websearch_to_tsquery('english', search_query)
  order by rank desc
  limit greatest(match_count, 1);
$$;

-- Storage: create bucket "pdfs" in dashboard, then optional policy for service role only.
-- The app uses SUPABASE_SERVICE_ROLE_KEY server-side for uploads/downloads.
