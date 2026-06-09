import { extractOpSetCode } from "@/lib/sources/cardmarket/extract-set-code";
import { cardmarketSearchUrl } from "@/lib/sources/cardmarket/op-booster-boxes";
import type { WholesaleListingRow } from "@/lib/sources/scrapers/types";
import { createServiceClient } from "@/lib/supabase/server";

/** set_code -> pinned exact Cardmarket product URL (optional overrides). */
export type CardmarketLinkMap = Map<string, string>;

function isSealedBox(category: string | null): boolean {
  if (!category) return true;
  return !/single/i.test(category);
}

/**
 * Load optional per-set Cardmarket overrides from the DB. When a set code is
 * absent, the caller falls back to the generated search URL.
 */
export async function loadCardmarketLinks(): Promise<CardmarketLinkMap> {
  const map = new Map<string, string>();

  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("wholesale_cardmarket_links")
      .select("set_code, cardmarket_url");

    if (error) return map;

    for (const row of data ?? []) {
      if (row.set_code && row.cardmarket_url) {
        map.set(row.set_code, row.cardmarket_url);
      }
    }
  } catch {
    // Table may not exist yet — search URLs still work.
  }

  return map;
}

export function cardmarketUrlForListing(
  listing: WholesaleListingRow,
  links: CardmarketLinkMap,
): string | null {
  if (listing.game !== "one_piece") return null;
  if (!isSealedBox(listing.category)) return null;

  const setCode = extractOpSetCode(listing.title, listing.sku);
  if (!setCode) return null;

  return links.get(setCode) ?? cardmarketSearchUrl(setCode);
}
