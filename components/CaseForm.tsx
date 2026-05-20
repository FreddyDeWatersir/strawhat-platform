"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type LinkOption = { id: string; label: string };

export function CaseForm({
  documents,
  transactions,
}: {
  documents: LinkOption[];
  transactions: LinkOption[];
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
      label: form.get("label"),
      product_set: form.get("product_set"),
      box_count: Number(form.get("box_count") || 12),
      purchase_currency: form.get("purchase_currency"),
      purchase_price: form.get("purchase_price"),
      purchased_at: form.get("purchased_at") || null,
      document_id: form.get("document_id") || null,
      transaction_id: form.get("transaction_id") || null,
      notes: form.get("notes"),
    };

    try {
      const res = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create case");
        return;
      }

      router.push(`/cases/${data.case.id}`);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm";

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-4 rounded-xl border border-card-border bg-card p-6"
    >
      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="label">
          Label *
        </label>
        <input
          id="label"
          name="label"
          required
          className={inputClass}
          placeholder="OP-09 case #1"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="product_set">
          Product set
        </label>
        <input
          id="product_set"
          name="product_set"
          className={inputClass}
          placeholder="OP-09"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="box_count">
            Box count
          </label>
          <input
            id="box_count"
            name="box_count"
            type="number"
            min={1}
            max={100}
            defaultValue={12}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-muted" htmlFor="purchased_at">
            Purchased on
          </label>
          <input
            id="purchased_at"
            name="purchased_at"
            type="date"
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            className="mb-1 block text-sm text-muted"
            htmlFor="purchase_price"
          >
            Purchase price
          </label>
          <input
            id="purchase_price"
            name="purchase_price"
            type="number"
            step="0.01"
            min={0}
            className={inputClass}
          />
        </div>
        <div>
          <label
            className="mb-1 block text-sm text-muted"
            htmlFor="purchase_currency"
          >
            Currency
          </label>
          <input
            id="purchase_currency"
            name="purchase_currency"
            className={inputClass}
            placeholder="EUR"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="document_id">
          Link document (optional)
        </label>
        <select id="document_id" name="document_id" className={inputClass}>
          <option value="">— None —</option>
          {documents.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          className="mb-1 block text-sm text-muted"
          htmlFor="transaction_id"
        >
          Link transaction (optional)
        </label>
        <select id="transaction_id" name="transaction_id" className={inputClass}>
          <option value="">— None —</option>
          {transactions.map((t) => (
            <option key={t.id} value={t.id}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-muted" htmlFor="notes">
          Notes
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {submitting ? "Creating…" : "Create case"}
      </button>

      {error && (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
