"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UploadForm() {
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const form = e.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      setError("Choose a PDF file first.");
      return;
    }

    setUploading(true);
    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body,
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }

      setSuccess(`Uploaded ${file.name} (${data.chunks} chunks indexed).`);
      form.reset();
      router.refresh();
    } catch {
      setError("Network error during upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-card-border bg-card p-6"
    >
      <h2 className="mb-2 text-lg font-semibold text-gold">Upload PDF</h2>
      <p className="mb-4 text-sm text-muted">
        Digital PDFs only (selectable text). Max 20MB. Bills, FedEx invoices,
        etc.
      </p>
      <input
        type="file"
        name="file"
        accept="application/pdf,.pdf"
        className="mb-4 block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-accent-hover"
      />
      <button
        type="submit"
        disabled={uploading}
        className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {uploading ? "Processing…" : "Upload & index"}
      </button>
      {error && (
        <p className="mt-3 text-sm text-red-400" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 text-sm text-emerald-400" role="status">
          {success}
        </p>
      )}
    </form>
  );
}
