"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ProviderRow, ProviderTier } from "@/lib/supabase/server";
import { TIER_ORDER, tierLabel } from "@/lib/sources/format";

const inputClass =
  "w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm";

export function ProviderEditForm({ provider }: { provider: ProviderRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const paymentRaw = String(form.get("payment_methods") ?? "");
    const payment_methods = paymentRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const body = {
      name: form.get("name"),
      url: form.get("url"),
      tier: form.get("tier") as ProviderTier,
      country: form.get("country"),
      language: form.get("language"),
      ships_internationally: form.get("ships_internationally") === "on",
      payment_methods,
      rating: form.get("rating"),
      notes: form.get("notes"),
      category_url: form.get("category_url"),
      search_url_template: form.get("search_url_template"),
      how_to_buy: form.get("how_to_buy"),
      is_active: form.get("is_active") === "on",
    };

    try {
      const res = await fetch(`/api/providers/${provider.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to update");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-card-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
      >
        Edit provider
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-3 rounded-xl border border-card-border bg-card p-4"
    >
      <h3 className="font-medium text-gold">Edit provider</h3>
      <input name="name" defaultValue={provider.name} required className={inputClass} />
      <input
        name="url"
        defaultValue={provider.url ?? ""}
        placeholder="Website URL"
        className={inputClass}
      />
      <select name="tier" defaultValue={provider.tier} className={inputClass}>
        {TIER_ORDER.map((t) => (
          <option key={t} value={t}>
            {tierLabel(t)}
          </option>
        ))}
      </select>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="country"
          defaultValue={provider.country ?? ""}
          placeholder="Country"
          className={inputClass}
        />
        <input
          name="language"
          defaultValue={provider.language ?? ""}
          placeholder="Language"
          className={inputClass}
        />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="ships_internationally"
          defaultChecked={provider.ships_internationally}
        />
        Ships internationally
      </label>
      <input
        name="payment_methods"
        defaultValue={(provider.payment_methods ?? []).join(", ")}
        placeholder="Payment methods (comma-separated)"
        className={inputClass}
      />
      <input
        name="rating"
        type="number"
        min={0}
        max={5}
        defaultValue={provider.rating ?? ""}
        placeholder="Rating 0–5"
        className={inputClass}
      />
      <input
        name="category_url"
        defaultValue={provider.category_url ?? ""}
        placeholder="OP TCG category URL (deep link)"
        className={inputClass}
      />
      <input
        name="search_url_template"
        defaultValue={provider.search_url_template ?? ""}
        placeholder="Search URL template with {q}"
        className={inputClass}
      />
      <textarea
        name="how_to_buy"
        rows={6}
        defaultValue={provider.how_to_buy ?? ""}
        placeholder="How to buy (markdown)"
        className={inputClass}
      />
      <textarea
        name="notes"
        rows={2}
        defaultValue={provider.notes ?? ""}
        placeholder="Short one-line note"
        className={inputClass}
      />
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={provider.is_active}
        />
        Active (show in directory)
      </label>
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-accent px-3 py-1.5 text-sm text-white disabled:opacity-50"
        >
          {submitting ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-muted hover:underline"
        >
          Cancel
        </button>
      </div>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
