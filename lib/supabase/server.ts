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

export type CaseRow = {
  id: string;
  label: string;
  product_set: string | null;
  box_count: number;
  purchase_currency: string | null;
  purchase_price: number | null;
  purchased_at: string | null;
  document_id: string | null;
  transaction_id: string | null;
  notes: string | null;
  created_at: string;
};

export type CaseBoxRow = {
  id: string;
  case_id: string;
  box_number: number;
  sold_at: string | null;
  sale_price: number | null;
  sale_currency: string | null;
  notes: string | null;
};

export type CaseWithBoxes = CaseRow & { case_boxes: CaseBoxRow[] };

export type ProviderTier =
  | "raw_jp"
  | "marketplace"
  | "proxy"
  | "jp_exporter"
  | "eu_reseller";

export type ListingProductType =
  | "box"
  | "case"
  | "starter_deck"
  | "premium_booster"
  | "singles";

export type ListingStatus =
  | "preorder"
  | "in_stock"
  | "sold_out"
  | "unknown";

export type ProviderRow = {
  id: string;
  name: string;
  url: string | null;
  tier: ProviderTier;
  country: string | null;
  language: string | null;
  ships_internationally: boolean;
  payment_methods: string[];
  rating: number | null;
  notes: string | null;
  category_url: string | null;
  search_url_template: string | null;
  how_to_buy: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ProviderListingRow = {
  id: string;
  provider_id: string;
  set_code: string;
  product_type: ListingProductType;
  price: number | null;
  currency: string | null;
  status: ListingStatus;
  source_url: string | null;
  notes: string | null;
  observed_at: string;
};

export type ProviderListingWithProvider = ProviderListingRow & {
  providers: Pick<ProviderRow, "id" | "name" | "tier" | "url">;
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
