import { VoyageAIClient } from "voyageai";

const EMBEDDING_MODEL = process.env.VOYAGE_EMBEDDING_MODEL ?? "voyage-4-lite";
const EMBEDDING_DIMENSION = 512;

let client: VoyageAIClient | null = null;

function getVoyageClient(): VoyageAIClient {
  const apiKey = process.env.VOYAGE_API_KEY;
  if (!apiKey) {
    throw new Error("Missing VOYAGE_API_KEY");
  }

  if (!client) {
    client = new VoyageAIClient({ apiKey });
  }

  return client;
}

export async function embedDocument(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const vo = getVoyageClient();
  const result = await vo.embed({
    input: texts,
    model: EMBEDDING_MODEL,
    inputType: "document",
    outputDimension: EMBEDDING_DIMENSION,
  });

  return result.data?.map((row) => row.embedding ?? []) ?? [];
}

export async function embedQuery(text: string): Promise<number[]> {
  const vo = getVoyageClient();
  const result = await vo.embed({
    input: text,
    model: EMBEDDING_MODEL,
    inputType: "query",
    outputDimension: EMBEDDING_DIMENSION,
  });

  const embedding = result.data?.[0]?.embedding;
  if (!embedding || embedding.length === 0) {
    throw new Error("Voyage returned empty query embedding");
  }

  return embedding;
}

/** pgvector literal for Supabase RPC / insert */
export function embeddingToPgvector(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}
