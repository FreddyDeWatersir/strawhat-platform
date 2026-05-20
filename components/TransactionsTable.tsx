"use client";

import { useState } from "react";

export type TransactionWithDoc = {
  id: string;
  document_id: string;
  supplier: string | null;
  invoice_date: string | null;
  currency: string | null;
  amount: number | null;
  description: string | null;
  tracking_number: string | null;
  product_set: string | null;
  documents?: {
    filename: string;
    uploaded_at: string;
    doc_type: string;
    status: string;
  } | null;
};

export function TransactionsTable({
  transactions,
}: {
  transactions: TransactionWithDoc[];
}) {
  const [opening, setOpening] = useState<string | null>(null);

  async function openPdf(documentId: string) {
    setOpening(documentId);
    try {
      const res = await fetch(`/api/documents/${documentId}/url`);
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    } finally {
      setOpening(null);
    }
  }

  if (transactions.length === 0) {
    return (
      <p className="rounded-xl border border-card-border bg-card p-6 text-sm text-muted">
        No transactions yet. Upload a PDF on the Documents page.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead>
          <tr className="border-b border-card-border text-muted">
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Supplier</th>
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Tracking</th>
            <th className="px-4 py-3 font-medium">PDF</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((t) => (
            <tr
              key={t.id}
              className="border-b border-card-border/60 last:border-0"
            >
              <td className="px-4 py-3">{t.invoice_date ?? "—"}</td>
              <td className="px-4 py-3">{t.supplier ?? "—"}</td>
              <td className="px-4 py-3">{t.product_set ?? t.description ?? "—"}</td>
              <td className="px-4 py-3">
                {t.amount != null
                  ? `${t.currency ?? ""} ${t.amount}`.trim()
                  : "—"}
              </td>
              <td className="px-4 py-3 font-mono text-xs">
                {t.tracking_number ?? "—"}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => openPdf(t.document_id)}
                  disabled={opening === t.document_id}
                  className="text-gold hover:underline disabled:opacity-50"
                >
                  {t.documents?.filename ?? "Open"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
