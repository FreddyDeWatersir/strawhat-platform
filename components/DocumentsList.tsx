"use client";

import type { DocumentRow } from "@/lib/supabase/server";
import { useState } from "react";

export function DocumentsList({ documents }: { documents: DocumentRow[] }) {
  const [opening, setOpening] = useState<string | null>(null);

  async function openPdf(id: string) {
    setOpening(id);
    try {
      const res = await fetch(`/api/documents/${id}/url`);
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    } finally {
      setOpening(null);
    }
  }

  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted">No documents uploaded yet.</p>
    );
  }

  return (
    <ul className="divide-y divide-card-border rounded-xl border border-card-border bg-card">
      {documents.map((doc) => (
        <li
          key={doc.id}
          className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
        >
          <div>
            <p className="font-medium">{doc.filename}</p>
            <p className="text-xs text-muted">
              {new Date(doc.uploaded_at).toLocaleString()} · {doc.doc_type} ·{" "}
              <span
                className={
                  doc.status === "ready"
                    ? "text-emerald-400"
                    : doc.status === "failed"
                      ? "text-red-400"
                      : "text-gold"
                }
              >
                {doc.status}
              </span>
            </p>
            {doc.error_message && (
              <p className="mt-1 text-xs text-red-400">{doc.error_message}</p>
            )}
          </div>
          {doc.status === "ready" && (
            <button
              type="button"
              onClick={() => openPdf(doc.id)}
              disabled={opening === doc.id}
              className="text-sm text-gold hover:underline disabled:opacity-50"
            >
              View PDF
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
