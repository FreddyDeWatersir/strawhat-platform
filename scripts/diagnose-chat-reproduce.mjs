/**
 * Run: node scripts/diagnose-chat-reproduce.mjs [baseUrl]
 * Default baseUrl: http://localhost:3000
 * Requires dev server (npm run dev) and .env.local with SITE_PASSWORD + API keys.
 */
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

const base = process.argv[2] ?? "http://localhost:3000";
const password = process.env.SITE_PASSWORD;
const testMessage =
  process.argv[3] ?? "What is the total amount on the invoice?";

if (!password) {
  console.error("SITE_PASSWORD missing in .env.local");
  process.exit(1);
}

console.log("=== Chat reproduce test ===\n");
console.log("Base URL:", base);
console.log("Message:", testMessage, "\n");

const loginRes = await fetch(`${base}/api/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ password }),
});

if (!loginRes.ok) {
  console.error("Login failed:", loginRes.status, await loginRes.text());
  process.exit(1);
}

const cookie = loginRes.headers.get("set-cookie") ?? "";
const sessionMatch = cookie.match(/strawhat_session=[^;]+/);
if (!sessionMatch) {
  console.error("No session cookie in login response");
  process.exit(1);
}

console.log("Login OK\n");

const chatRes = await fetch(`${base}/api/chat`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Cookie: sessionMatch[0],
  },
  body: JSON.stringify({ message: testMessage }),
});

console.log("Chat status:", chatRes.status, chatRes.headers.get("content-type"));

if (!chatRes.ok) {
  console.error(await chatRes.text());
  process.exit(1);
}

const reader = chatRes.body?.getReader();
const decoder = new TextDecoder();
let buffer = "";
let fullText = "";
let sawError = false;

while (reader) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });

  const parts = buffer.split("\n\n");
  buffer = parts.pop() ?? "";

  for (const part of parts) {
    const line = part.split("\n").find((l) => l.startsWith("data: "));
    if (!line) continue;
    const payload = line.slice(6).trim();
    if (payload === "[DONE]") continue;
    try {
      const parsed = JSON.parse(payload);
      if (parsed.error) {
        sawError = true;
        console.error("Stream error frame:", parsed.error);
      }
      if (parsed.text) fullText += parsed.text;
    } catch {
      /* partial */
    }
  }
}

console.log("\n--- Classification ---");
if (sawError) {
  console.log("Outcome A: stream error (see above)");
} else if (!fullText.trim()) {
  console.log("Outcome B: empty completion (no content returned)");
} else if (
  /don't know|do not know|not in the excerpts/i.test(fullText)
) {
  console.log("Outcome D: poor retrieval / no relevant context");
  console.log("Preview:", fullText.slice(0, 400));
} else {
  console.log("Outcome C: real answer received");
  console.log("Preview:", fullText.slice(0, 400));
}

console.log("\nFull length:", fullText.length, "chars");
