import type { ListingProductType, ListingStatus } from "@/lib/supabase/server";

export type ScrapeProductType = Exclude<ListingProductType, "singles">;

export type ScrapeResult = {
  set_code: string;
  product_type: ScrapeProductType;
  price: number | null;
  currency: "JPY";
  status: ListingStatus;
  source_url: string;
  title: string;
};

export type Scraper = {
  /** Must match `providers.name` in Supabase. */
  providerName: string;
  run(): Promise<ScrapeResult[]>;
};

export type ScraperRunSummary = {
  provider: string;
  scraped: number;
  inserted: number;
  skipped: number;
  errors: string[];
};

export type RefreshSummary = {
  scraperResults: ScraperRunSummary[];
};

/** Shopify variant record from tcgwholesalehq.com */
export type WholesaleGame = "one_piece" | "pokemon" | "dragon_ball";

export type WholesaleScrapeRecord = {
  variant_id: number;
  product_id: number;
  sku: string | null;
  title: string;
  game: WholesaleGame;
  category: string;
  price: number | null;
  compare_at_price: number | null;
  currency: "AUD";
  available: boolean;
  source_url: string;
};

export type WholesaleChangeType =
  | "new"
  | "restock"
  | "sold_out"
  | "price_up"
  | "price_down";

export type WholesaleRefreshSummary = {
  scraped: number;
  inserted: number;
  skipped: number;
  changes: number;
  errors: string[];
};

export type WholesaleListingRow = {
  id: string;
  variant_id: number;
  product_id: number;
  sku: string | null;
  title: string;
  game: WholesaleGame;
  category: string | null;
  price: number | null;
  compare_at_price: number | null;
  currency: string;
  available: boolean;
  source_url: string | null;
  observed_at: string;
};

export type WholesaleChangeRow = {
  id: string;
  variant_id: number;
  title: string;
  game: WholesaleGame;
  change_type: WholesaleChangeType;
  old_value: string | null;
  new_value: string | null;
  source_url: string | null;
  detected_at: string;
  notified_at: string | null;
};
