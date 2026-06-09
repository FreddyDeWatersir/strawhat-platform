"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type WholesaleRefreshSummary = {
  scraped: number;
  inserted: number;
  skipped: number;
  changes: number;
  errors: string[];
};

type DiscordNotifySummary = {
  sent: number;
  skipped: boolean;
  errors: string[];
};

type RefreshResponse = {
  refresh?: WholesaleRefreshSummary;
  notify?: DiscordNotifySummary;
  error?: string;
};

function formatSummary(
  refresh: WholesaleRefreshSummary,
  notify?: DiscordNotifySummary,
): string {
  const bits = [
    `${refresh.scraped} scraped`,
    `${refresh.inserted} updated`,
    `${refresh.skipped} unchanged`,
    `${refresh.changes} changes`,
  ];

  if (notify && !notify.skipped) {
    bits.push(`${notify.sent} Discord alerts`);
  }

  if (refresh.errors.length > 0) {
    bits.push(refresh.errors[0]);
  } else if (notify?.errors.length) {
    bits.push(notify.errors[0]);
  }

  return bits.join(" · ");
}

export function RefreshWholesaleButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleRefresh() {
    setPending(true);
    setMessage(null);
    setIsError(false);

    try {
      const res = await fetch("/api/wholesale/refresh", { method: "POST" });
      const data = (await res.json()) as RefreshResponse;

      if (!res.ok) {
        setIsError(true);
        setMessage(data.error ?? "Refresh failed");
        return;
      }

      const refresh = data.refresh;
      if (!refresh) {
        setIsError(true);
        setMessage("No refresh summary returned");
        return;
      }

      const hasErrors =
        refresh.errors.length > 0 || (data.notify?.errors.length ?? 0) > 0;
      setIsError(hasErrors && refresh.inserted === 0 && refresh.changes === 0);
      setMessage(formatSummary(refresh, data.notify));
      router.refresh();
    } catch {
      setIsError(true);
      setMessage("Network error while refreshing.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleRefresh}
        disabled={pending}
        className="rounded-lg border border-gold/40 px-4 py-2 text-sm font-medium text-gold hover:bg-gold/10 disabled:opacity-50"
      >
        {pending ? "Checking…" : "Check now"}
      </button>
      {message && (
        <p
          className={`max-w-xs text-right text-xs ${isError ? "text-red-300" : "text-muted"}`}
          role="status"
        >
          {message}
        </p>
      )}
    </div>
  );
}
