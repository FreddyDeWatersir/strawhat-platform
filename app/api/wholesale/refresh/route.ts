import { NextResponse } from "next/server";
import { notifyWholesaleChangesDiscord } from "@/lib/notify/discord";
import { refreshWholesale } from "@/lib/sources/wholesale/refresh";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST() {
  try {
    const refreshSummary = await refreshWholesale();
    const notifySummary = await notifyWholesaleChangesDiscord();

    return NextResponse.json({
      refresh: refreshSummary,
      notify: notifySummary,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to refresh wholesale";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
