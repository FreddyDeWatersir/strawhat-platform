import {
  type ChunkSearchResult,
  createServiceClient,
} from "@/lib/supabase/server";
import { embedQuery, embeddingToPgvector } from "@/lib/voyage/client";

export async function searchChunks(
  query: string,
  matchCount = 8,
): Promise<ChunkSearchResult[]> {
  const supabase = createServiceClient();
  const queryEmbedding = await embedQuery(query);

  const { data, error } = await supabase.rpc("search_document_chunks_hybrid", {
    search_query: query,
    query_embedding: embeddingToPgvector(queryEmbedding),
    match_count: matchCount,
  });

  if (error) {
    throw new Error(`Search failed: ${error.message}`);
  }

  return (data ?? []) as ChunkSearchResult[];
}

export function formatChunksForPrompt(chunks: ChunkSearchResult[]): string {
  if (chunks.length === 0) {
    return "No relevant document excerpts found.";
  }

  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] File: ${c.filename} (chunk ${c.chunk_index})\n${c.content}`,
    )
    .join("\n\n---\n\n");
}
