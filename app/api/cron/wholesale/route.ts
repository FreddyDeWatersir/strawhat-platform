import { NextRequest, NextResponse } from "next/server";
import { notifyWholesaleChangesDiscord } from "@/lib/notify/discord";
import { refreshWholesale } from "@/lib/sources/wholesale/refresh";

export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const authHeader = req.headers.get("authorization");
  if (authHeader === `Bearer ${secret}`) return true;

  const cronHeader = req.headers.get("x-cron-secret");
  return cronHeader === secret;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const refreshSummary = await refreshWholesale();
    const notifySummary = await notifyWholesaleChangesDiscord();

    return NextResponse.json({
      refresh: refreshSummary,
      notify: notifySummary,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Wholesale cron failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
