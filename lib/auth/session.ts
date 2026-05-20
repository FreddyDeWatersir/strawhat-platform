import { createHash } from "crypto";
import { cookies } from "next/headers";
import { SESSION_COOKIE, SESSION_PREFIX } from "@/lib/auth/constants";

export { SESSION_COOKIE } from "@/lib/auth/constants";

export function getSessionToken(): string {
  const password = process.env.SITE_PASSWORD ?? "";
  return createHash("sha256")
    .update(`${SESSION_PREFIX}${password}`)
    .digest("hex");
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token || !process.env.SITE_PASSWORD) return false;
  return token === getSessionToken();
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifySessionToken(cookieStore.get(SESSION_COOKIE)?.value);
}
