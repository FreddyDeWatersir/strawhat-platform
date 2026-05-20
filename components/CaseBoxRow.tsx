"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMoney } from "@/lib/cases/format";
import type { CaseBoxRow as BoxRow } from "@/lib/supabase/server";

export function CaseBoxRow({
  caseId,
  box,
  defaultCurrency,
}: {
  caseId: string;
  box: BoxRow;
  defaultCurrency: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSellForm, setShowSellForm] = useState(false);

  const sold = box.sold_at != null;

  async function markSold(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);

    const form = new FormData(e.currentTarget);
    const body = {
      sale_price: form.get("sale_price"),
      sale_currency: form.get("sale_currency") || defaultCurrency,
      sold_at: form.get("sold_at") || undefined,
      notes: form.get("notes"),
    };

    try {
      const res = await fetch(
        `/api/cases/${caseId}/boxes/${box.box_number}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update");
        return;
      }
      setShowSellForm(false);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function markAvailable() {
    if (!confirm(`Mark box #${box.box_number} as available again?`)) return;
    setError(null);
    setBusy(true);

    try {
      const res = await fetch(
        `/api/cases/${caseId}/boxes/${box.box_number}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ unsell: true }),
        },
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update");
        return;
      }
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-card-border bg-background px-2 py-1.5 text-sm";

  return (
    <tr className="border-b border-card-border/60 last:border-0">
      <td className="px-4 py-3 font-medium">#{box.box_number}</td>
      <td className="px-4 py-3">
        <span
          className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
            sold
              ? "bg-emerald-950/60 text-emerald-400"
              : "bg-card-border/60 text-muted"
          }`}
        >
          {sold ? "Sold" : "Available"}
        </span>
      </td>
      <td className="px-4 py-3">{box.sold_at ?? "—"}</td>
      <td className="px-4 py-3">
        {sold && box.sale_price != null
          ? formatMoney(Number(box.sale_price), box.sale_currency)
          : "—"}
      </td>
      <td className="px-4 py-3 text-muted">{box.notes ?? "—"}</td>
      <td className="px-4 py-3">
        {sold ? (
          <button
            type="button"
            onClick={markAvailable}
            disabled={busy}
            className="text-sm text-muted hover:text-foreground disabled:opacity-50"
          >
            Mark available
          </button>
        ) : showSellForm ? (
          <form onSubmit={markSold} className="min-w-[200px] space-y-2">
            <input
              name="sale_price"
              type="number"
              step="0.01"
              min={0}
              required
              placeholder="Sale price"
              className={inputClass}
            />
            <input
              name="sale_currency"
              defaultValue={defaultCurrency ?? ""}
              placeholder="Currency"
              className={inputClass}
            />
            <input
              name="sold_at"
              type="date"
              defaultValue={new Date().toISOString().slice(0, 10)}
              className={inputClass}
            />
            <input name="notes" placeholder="Notes" className={inputClass} />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy}
                className="text-sm text-gold hover:underline disabled:opacity-50"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setShowSellForm(false)}
                className="text-sm text-muted hover:underline"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowSellForm(true)}
            disabled={busy}
            className="text-sm text-gold hover:underline disabled:opacity-50"
          >
            Mark sold
          </button>
        )}
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
      </td>
    </tr>
  );
}
