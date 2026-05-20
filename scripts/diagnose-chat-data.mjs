/**
 * Run: node scripts/diagnose-chat-data.mjs
 * Loads .env.local from project root (no extra deps).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

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

if (!url || !key) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log("=== Straw Hat chat data diagnosis ===\n");

const { data: statusRows, error: statusErr } = await supabase
  .from("documents")
  .select("status");

if (statusErr) {
  console.error("documents query failed:", statusErr.message);
  process.exit(1);
}

const byStatus = (statusRows ?? []).reduce((acc, row) => {
  acc[row.status] = (acc[row.status] ?? 0) + 1;
  return acc;
}, /** @type {Record<string, number>} */ ({}));

console.log("Document counts by status:", byStatus);

const { count: chunkCount, error: chunkErr } = await supabase
  .from("document_chunks")
  .select("*", { count: "exact", head: true });

if (chunkErr) {
  console.error("document_chunks count failed:", chunkErr.message);
} else {
  console.log("document_chunks total:", chunkCount ?? 0);
}

const { data: sampleChunk, error: sampleErr } = await supabase
  .from("document_chunks")
  .select("content, document_id")
  .limit(1)
  .maybeSingle();

if (sampleErr) {
  console.error("sample chunk failed:", sampleErr.message);
} else if (sampleChunk) {
  const preview = (sampleChunk.content ?? "").slice(0, 120).replace(/\s+/g, " ");
  console.log("Sample chunk preview:", preview || "(empty content)");
} else {
  console.log("Sample chunk: none");
}

const testQueries = ["invoice", "FedEx", "Romance Dawn", "請求"];
for (const q of testQueries) {
  const { data, error } = await supabase.rpc("search_document_chunks", {
    search_query: q,
    match_count: 8,
  });
  if (error) {
    console.log(`FTS "${q}": ERROR — ${error.message}`);
  } else {
    console.log(`FTS "${q}": ${data?.length ?? 0} hits`);
    if (data?.length) {
      console.log(
        "  top:",
        data.slice(0, 2).map((r) => `${r.filename} (rank ${r.rank})`).join("; "),
      );
    }
  }
}

console.log("\nDone.");
