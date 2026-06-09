import { fetchWholesaleCatalogue } from "@/lib/sources/scrapers/tcgwholesalehq";
import type {
  WholesaleChangeType,
  WholesaleListingRow,
  WholesaleRefreshSummary,
  WholesaleScrapeRecord,
} from "@/lib/sources/scrapers/types";
import { latestWholesaleListings } from "@/lib/sources/wholesale/queries";
import { createServiceClient } from "@/lib/supabase/server";

function formatPrice(value: number | null): string {
  if (value == null) return "—";
  return `$${value.toFixed(2)} AUD`;
}

function formatAvailability(available: boolean): string {
  return available ? "in stock" : "sold out";
}

function listingChanged(
  latest: WholesaleListingRow | undefined,
  scraped: WholesaleScrapeRecord,
): boolean {
  if (!latest) return true;

  const priceChanged =
    latest.price == null && scraped.price == null
      ? false
      : latest.price == null || scraped.price == null
        ? latest.price !== scraped.price
        : Number(latest.price) !== scraped.price;

  const availabilityChanged = latest.available !== scraped.available;

  return priceChanged || availabilityChanged;
}

function detectChanges(
  latest: WholesaleListingRow | undefined,
  scraped: WholesaleScrapeRecord,
): { change_type: WholesaleChangeType; old_value: string | null; new_value: string | null }[] {
  const events: {
    change_type: WholesaleChangeType;
    old_value: string | null;
    new_value: string | null;
  }[] = [];

  if (!latest) {
    events.push({
      change_type: "new",
      old_value: null,
      new_value: `${formatPrice(scraped.price)} · ${formatAvailability(scraped.available)}`,
    });
    return events;
  }

  if (!latest.available && scraped.available) {
    events.push({
      change_type: "restock",
      old_value: "sold out",
      new_value: "in stock",
    });
  } else if (latest.available && !scraped.available) {
    events.push({
      change_type: "sold_out",
      old_value: "in stock",
      new_value: "sold out",
    });
  }

  const oldPrice = latest.price == null ? null : Number(latest.price);
  const newPrice = scraped.price;

  if (
    oldPrice != null &&
    newPrice != null &&
    oldPrice !== newPrice
  ) {
    events.push({
      change_type: newPrice > oldPrice ? "price_up" : "price_down",
      old_value: formatPrice(oldPrice),
      new_value: formatPrice(newPrice),
    });
  } else if (oldPrice == null && newPrice != null) {
    events.push({
      change_type: "price_up",
      old_value: "—",
      new_value: formatPrice(newPrice),
    });
  } else if (oldPrice != null && newPrice == null) {
    events.push({
      change_type: "price_down",
      old_value: formatPrice(oldPrice),
      new_value: "—",
    });
  }

  return events;
}

export async function refreshWholesale(): Promise<WholesaleRefreshSummary> {
  const summary: WholesaleRefreshSummary = {
    scraped: 0,
    inserted: 0,
    skipped: 0,
    changes: 0,
    errors: [],
  };

  const supabase = createServiceClient();

  try {
    const scraped = await fetchWholesaleCatalogue();
    summary.scraped = scraped.length;

    const latestRows = await latestWholesaleListings();
    const latestByVariant = new Map<number, WholesaleListingRow>();
    for (const row of latestRows) {
      latestByVariant.set(row.variant_id, row);
    }

    for (const item of scraped) {
      const latest = latestByVariant.get(item.variant_id);

      if (!listingChanged(latest, item)) {
        summary.skipped += 1;
        continue;
      }

      const { error: insertListingError } = await supabase
        .from("wholesale_listings")
        .insert({
          variant_id: item.variant_id,
          product_id: item.product_id,
          sku: item.sku,
          title: item.title,
          game: item.game,
          category: item.category,
          price: item.price,
          compare_at_price: item.compare_at_price,
          currency: item.currency,
          available: item.available,
          source_url: item.source_url,
        });

      if (insertListingError) {
        summary.errors.push(
          `${item.title}: ${insertListingError.message}`,
        );
        continue;
      }

      summary.inserted += 1;

      const changeEvents = detectChanges(latest, item);
      for (const event of changeEvents) {
        const { error: changeError } = await supabase
          .from("wholesale_changes")
          .insert({
            variant_id: item.variant_id,
            title: item.title,
            game: item.game,
            change_type: event.change_type,
            old_value: event.old_value,
            new_value: event.new_value,
            source_url: item.source_url,
          });

        if (changeError) {
          summary.errors.push(
            `${item.title} (${event.change_type}): ${changeError.message}`,
          );
          continue;
        }

        summary.changes += 1;
      }
    }
  } catch (err) {
    summary.errors.push(
      err instanceof Error ? err.message : "Unknown wholesale refresh error",
    );
  }

  return summary;
}
