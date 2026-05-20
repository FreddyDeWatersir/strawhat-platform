"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { TIER_ORDER, tierLabel } from "@/lib/sources/format";

const inputClass =
  "w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm";

export function ProviderForm() {
  const router = useRouter();
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
      tier: form.get("tier"),
      country: form.get("country"),
      language: form.get("language"),
      ships_internationally: form.get("ships_internationally") === "on",
      payment_methods,
      rating: form.get("rating"),
      notes: form.get("notes"),
      category_url: form.get("category_url"),
      search_url_template: form.get("search_url_template"),
      how_to_buy: form.get("how_to_buy"),
    };

    try {
      const res = await fetch("/api/providers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create provider");
        return;
      }

      router.push(`/sources/${data.provider.id}`);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-4 rounded-xl border border-card-border bg-card p-6"
    >
      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="name">
          Name *
        </label>
        <input id="name" name="name" required className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="url">
          Website URL
        </label>
        <input id="url" name="url" type="url" className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="tier">
          Tier *
        </label>
        <select id="tier" name="tier" required className={inputClass} defaultValue="raw_jp">
          {TIER_ORDER.map((t) => (
            <option key={t} value={t}>
              {tierLabel(t)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="country">
            Country
          </label>
          <input id="country" name="country" className={inputClass} placeholder="JP" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="language">
            Language
          </label>
          <input id="language" name="language" className={inputClass} placeholder="Japanese" />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="ships_internationally" className="rounded" />
        Ships internationally
      </label>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="payment_methods">
          Payment methods (comma-separated)
        </label>
        <input
          id="payment_methods"
          name="payment_methods"
          className={inputClass}
          placeholder="PayPal, Credit card"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="rating">
          Rating (0–5)
        </label>
        <input
          id="rating"
          name="rating"
          type="number"
          min={0}
          max={5}
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="category_url">
          OP TCG category URL (deep link, not homepage)
        </label>
        <input
          id="category_url"
          name="category_url"
          type="url"
          className={inputClass}
          placeholder="https://example.jp/op-card-game/sealed"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="search_url_template">
          Search URL template (use {"{q}"} for the query)
        </label>
        <input
          id="search_url_template"
          name="search_url_template"
          className={inputClass}
          placeholder="https://example.jp/search?q={q}"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="how_to_buy">
          How to buy (markdown supported)
        </label>
        <textarea
          id="how_to_buy"
          name="how_to_buy"
          rows={5}
          className={inputClass}
          placeholder={"**Payment:** ...\n**Tips:** ..."}
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="notes">
          Short note (1 line)
        </label>
        <textarea id="notes" name="notes" rows={2} className={inputClass} />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create provider"}
      </button>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
