"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
const inputClass =
  "w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm";

const SET_SUGGESTIONS = ["OP-15", "OP-16", "EB-02", "PRB-02", "OP-14", "OP-13"];

export function AddListingForm({
  providerId,
  defaultSetCode,
}: {
  providerId: string;
  defaultSetCode?: string;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const body = {
      set_code: form.get("set_code"),
      product_type: form.get("product_type"),
      price: form.get("price"),
      currency: form.get("currency"),
      status: form.get("status"),
      source_url: form.get("source_url"),
      notes: form.get("notes"),
    };

    try {
      const res = await fetch(`/api/providers/${providerId}/listings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to add observation");
        return;
      }

      (e.target as HTMLFormElement).reset();
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
      className="space-y-4 rounded-xl border border-card-border bg-card p-4"
    >
      <h3 className="font-medium text-gold">Add price observation</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="set_code">
            Set code *
          </label>
          <input
            id="set_code"
            name="set_code"
            required
            list="set-suggestions"
            defaultValue={defaultSetCode}
            className={inputClass}
            placeholder="OP-16"
          />
          <datalist id="set-suggestions">
            {SET_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="product_type">
            Product type
          </label>
          <select
            id="product_type"
            name="product_type"
            className={inputClass}
            defaultValue="case"
          >
            <option value="case">Case (12 boxes)</option>
            <option value="box">Box</option>
            <option value="starter_deck">Starter deck</option>
            <option value="premium_booster">Premium booster</option>
            <option value="singles">Singles</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="price">
            Price
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="1"
            min={0}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="currency">
            Currency
          </label>
          <select id="currency" name="currency" className={inputClass} defaultValue="JPY">
            <option value="JPY">JPY</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="status">
            Status
          </label>
          <select id="status" name="status" className={inputClass} defaultValue="unknown">
            <option value="preorder">Pre-order</option>
            <option value="in_stock">In stock</option>
            <option value="sold_out">Sold out</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="source_url">
          Product page URL
        </label>
        <input id="source_url" name="source_url" type="url" className={inputClass} />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="notes">
          Notes
        </label>
        <input id="notes" name="notes" className={inputClass} placeholder="Optional" />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {submitting ? "Saving…" : "Save observation"}
      </button>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
