/**
 * Run: node scripts/verify-migrations.mjs
 * Checks that Supabase has all expected tables/columns from migrations 001–008.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvLocal() {
  const path = join(root, ".env.local");
  if (!existsSync(path)) return;
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
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const checks = [];

async function check(name, fn) {
  try {
    const result = await fn();
    checks.push({ name, ok: true, detail: result });
    console.log(`OK  ${name}${result ? ` — ${result}` : ""}`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    checks.push({ name, ok: false, detail: msg });
    console.log(`FAIL ${name} — ${msg}`);
  }
}

console.log("Verifying Supabase migrations (001–008)…\n");

await check("001 documents table", async () => {
  const { error } = await supabase.from("documents").select("id").limit(1);
  if (error) throw new Error(error.message);
  return "exists";
});

await check("001 transactions table", async () => {
  const { error } = await supabase.from("transactions").select("id").limit(1);
  if (error) throw new Error(error.message);
  return "exists";
});

await check("002 hybrid search function", async () => {
  const { error } = await supabase.rpc("search_document_chunks_hybrid", {
    search_query: "test",
    query_embedding: Array(512).fill(0),
    match_count: 1,
  });
  if (error) throw new Error(error.message);
  return "callable";
});

await check("003 cases + case_boxes", async () => {
  const { error } = await supabase.from("cases").select("id, case_boxes(id)").limit(1);
  if (error) throw new Error(error.message);
  return "exists";
});

await check("004 providers table", async () => {
  const { count, error } = await supabase
    .from("providers")
    .select("*", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return `${count ?? 0} providers seeded`;
});

await check("004 provider_listings table", async () => {
  const { error } = await supabase.from("provider_listings").select("id").limit(1);
  if (error) throw new Error(error.message);
  return "exists";
});

await check("005 category_url + how_to_buy columns", async () => {
  const { data, error } = await supabase
    .from("providers")
    .select("name, category_url, how_to_buy")
    .eq("name", "Surugaya")
    .single();
  if (error) throw new Error(error.message);
  if (!data?.category_url) throw new Error("Surugaya category_url is null — run 005");
  if (!data?.how_to_buy) throw new Error("Surugaya how_to_buy is null — run 005");
  return "Surugaya has category_url + how_to_buy";
});

await check("006 search_url_template (Surugaya)", async () => {
  const { data, error } = await supabase
    .from("providers")
    .select("search_url_template")
    .eq("name", "Surugaya")
    .single();
  if (error) throw new Error(error.message);
  if (!data?.search_url_template?.includes("{q}"))
    throw new Error("Surugaya search template missing — run 006");
  return "template has {q}";
});

await check("007 sealed filter (Yahoo Auctions JP)", async () => {
  const { data, error } = await supabase
    .from("providers")
    .select("search_url_template")
    .eq("name", "Yahoo Auctions JP")
    .single();
  if (error) throw new Error(error.message);
  if (!data?.search_url_template?.includes("auccat"))
    throw new Error("Yahoo template missing auccat — run 007");
  return "OP TCG category pinned";
});

await check("008 Yuyu-tei category fix", async () => {
  const { data, error } = await supabase
    .from("providers")
    .select("category_url, search_url_template")
    .eq("name", "Yuyu-tei")
    .single();
  if (error) throw new Error(error.message);
  if (!data?.category_url?.includes("/top/opc"))
    throw new Error(`Yuyu-tei category_url wrong: ${data?.category_url} — run 008`);
  if (data?.search_url_template !== null)
    throw new Error("Yuyu-tei should have null search template — run 008");
  return "/top/opc, search cleared";
});

await check("008 Amazon Japan seeded", async () => {
  const { data, error } = await supabase
    .from("providers")
    .select("name, search_url_template")
    .eq("name", "Amazon Japan")
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Amazon Japan not found — run 008");
  return "present";
});

await check("008 Kakaku.com seeded", async () => {
  const { data, error } = await supabase
    .from("providers")
    .select("name")
    .eq("name", "Kakaku.com")
    .single();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Kakaku.com not found — run 008");
  return "present";
});

await check("008 Card Rush browse-only", async () => {
  const { data, error } = await supabase
    .from("providers")
    .select("category_url, search_url_template")
    .eq("name", "Card Rush")
    .single();
  if (error) throw new Error(error.message);
  if (!data?.category_url?.includes("product-list"))
    throw new Error("Card Rush category_url wrong — run 008");
  if (data?.search_url_template !== null)
    throw new Error("Card Rush should have null search — run 008");
  return "product-list, search cleared";
});

const failed = checks.filter((c) => !c.ok);
console.log("\n---");
if (failed.length === 0) {
  console.log(`All ${checks.length} checks passed.`);
  process.exit(0);
} else {
  console.log(`${failed.length}/${checks.length} checks FAILED.`);
  process.exit(1);
}
