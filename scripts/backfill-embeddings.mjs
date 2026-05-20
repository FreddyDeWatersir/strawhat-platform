/**
 * Run: npm run backfill:embeddings
 * Embeds document_chunks rows where embedding IS NULL.
 * Requires .env.local with Supabase + VOYAGE_API_KEY.
 * Run migration 002_pgvector.sql in Supabase first.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const BATCH_SIZE = 128;
const EMBEDDING_MODEL = process.env.VOYAGE_EMBEDDING_MODEL ?? "voyage-4-lite";
const EMBEDDING_DIMENSION = 512;

function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) {
    console.warn("No .env.local found — using process.env only");
    return;
  }
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const voyageKey = process.env.VOYAGE_API_KEY;

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

if (!voyageKey) {
  console.error("Missing VOYAGE_API_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function embedDocuments(texts) {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${voyageKey}`,
    },
    body: JSON.stringify({
      input: texts,
      model: EMBEDDING_MODEL,
      input_type: "document",
      output_dimension: EMBEDDING_DIMENSION,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Voyage embed failed (${res.status}): ${body}`);
  }

  const json = await res.json();
  const embeddings = json.data?.map((row) => row.embedding) ?? [];
  if (embeddings.length !== texts.length) {
    throw new Error(
      `Expected ${texts.length} embeddings, got ${embeddings.length}`,
    );
  }
  return embeddings;
}

function embeddingToPgvector(embedding) {
  return `[${embedding.join(",")}]`;
}

console.log("=== Backfill chunk embeddings ===\n");
console.log("Model:", EMBEDDING_MODEL, "dims:", EMBEDDING_DIMENSION, "\n");

let totalUpdated = 0;

while (true) {
  const { data: rows, error } = await supabase
    .from("document_chunks")
    .select("id, content")
    .is("embedding", null)
    .limit(BATCH_SIZE);

  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }

  if (!rows?.length) {
    console.log("\nDone. Updated", totalUpdated, "chunk(s).");
    break;
  }

  console.log(`Embedding batch of ${rows.length} chunk(s)...`);

  const texts = rows.map((r) => r.content);
  let embeddings;
  try {
    embeddings = await embedDocuments(texts);
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  }

  for (let i = 0; i < rows.length; i++) {
    const { error: updateError } = await supabase
      .from("document_chunks")
      .update({ embedding: embeddingToPgvector(embeddings[i]) })
      .eq("id", rows[i].id);

    if (updateError) {
      console.error(`Update failed for ${rows[i].id}:`, updateError.message);
      process.exit(1);
    }
  }

  totalUpdated += rows.length;
  console.log(`  Updated ${rows.length} (total ${totalUpdated})`);
}
