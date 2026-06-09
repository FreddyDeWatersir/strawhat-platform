import { extractOpSetCode } from "@/lib/sources/cardmarket/extract-set-code";
import {
  cardmarketBoosterBoxUrl,
  OP_BOOSTER_BOX_SLUGS,
} from "@/lib/sources/cardmarket/op-booster-boxes";
import type { WholesaleListingRow } from "@/lib/sources/scrapers/types";
import { createServiceClient } from "@/lib/supabase/server";

export type CardmarketLinkMap = Map<string, string>;

function isSealedBox(category: string | null): boolean {
  if (!category) return true;
  if (/single/i.test(category)) return false;
  return /booster|limited|tcg/i.test(category) || !/single/i.test(category);
}

/** Load set_code → full Cardmarket URL (DB overrides static map). */
export async function loadCardmarketLinks(): Promise<CardmarketLinkMap> {
  const map = new Map<string, string>();

  for (const [setCode, slug] of Object.entries(OP_BOOSTER_BOX_SLUGS)) {
    map.set(setCode, cardmarketBoosterBoxUrl(slug));
  }

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
    // Table may not exist yet — static map only.
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

  return links.get(setCode) ?? null;
}
