"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CaseRow } from "@/lib/supabase/server";

export function CaseEditForm({ caseRow }: { caseRow: CaseRow }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(e.currentTarget);
    const body = {
      label: form.get("label"),
      product_set: form.get("product_set"),
      purchase_currency: form.get("purchase_currency"),
      purchase_price: form.get("purchase_price"),
      purchased_at: form.get("purchased_at") || null,
      notes: form.get("notes"),
    };

    try {
      const res = await fetch(`/api/cases/${caseRow.id}`, {
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

  async function handleDelete() {
    if (!confirm(`Delete case "${caseRow.label}"? This cannot be undone.`)) {
      return;
    }
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/cases/${caseRow.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete");
        return;
      }
      router.push("/cases");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setDeleting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-card-border bg-background px-3 py-2 text-sm";

  if (!open) {
    return (
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="rounded-lg border border-card-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
        >
          Edit case
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-red-800 px-3 py-1.5 text-sm text-red-400 hover:bg-red-950/40 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete"}
        </button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl space-y-3 rounded-xl border border-card-border bg-card p-4"
    >
      <h3 className="font-medium text-gold">Edit case</h3>
      <input
        name="label"
        defaultValue={caseRow.label}
        required
        className={inputClass}
      />
      <input
        name="product_set"
        defaultValue={caseRow.product_set ?? ""}
        placeholder="Product set"
        className={inputClass}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name="purchase_price"
          type="number"
          step="0.01"
          defaultValue={caseRow.purchase_price ?? ""}
          placeholder="Purchase price"
          className={inputClass}
        />
        <input
          name="purchase_currency"
          defaultValue={caseRow.purchase_currency ?? ""}
          placeholder="Currency"
          className={inputClass}
        />
      </div>
      <input
        name="purchased_at"
        type="date"
        defaultValue={caseRow.purchased_at ?? ""}
        className={inputClass}
      />
      <textarea
        name="notes"
        rows={2}
        defaultValue={caseRow.notes ?? ""}
        className={inputClass}
      />
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
