import { SESSION_PREFIX } from "@/lib/auth/constants";

export async function getSessionTokenEdge(): Promise<string | null> {
  const password = process.env.SITE_PASSWORD;
  if (!password) return null;

  const data = new TextEncoder().encode(`${SESSION_PREFIX}${password}`);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifySessionTokenEdge(
  token: string | undefined,
): Promise<boolean> {
  if (!token) return false;
  const expected = await getSessionTokenEdge();
  return expected !== null && token === expected;
}
