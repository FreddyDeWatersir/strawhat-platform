import { createClient } from "@supabase/supabase-js";

export type DocumentRow = {
  id: string;
  filename: string;
  storage_path: string;
  uploaded_at: string;
  doc_type: "japan_invoice" | "fedex" | "other";
  full_text: string | null;
  status: "processing" | "ready" | "failed";
  error_message: string | null;
};

export type TransactionRow = {
  id: string;
  document_id: string;
  supplier: string | null;
  invoice_date: string | null;
  currency: string | null;
  amount: number | null;
  description: string | null;
  tracking_number: string | null;
  product_set: string | null;
  notes: Record<string, unknown> | null;
  created_at: string;
};

export type ChunkSearchResult = {
  id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  filename: string;
  rank: number;
};

export function createServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    );
  }

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
