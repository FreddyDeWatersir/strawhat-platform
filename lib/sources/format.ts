import type {
  ListingProductType,
  ListingStatus,
  ProviderTier,
} from "@/lib/supabase/server";

/** Approximate JPY→EUR for compare-view hints only (not authoritative). */
export const JPY_TO_EUR_HINT = 0.0062;

export const TIER_ORDER: ProviderTier[] = [
  "raw_jp",
  "marketplace",
  "proxy",
  "jp_exporter",
  "eu_reseller",
];

export function tierLabel(tier: ProviderTier): string {
  const labels: Record<ProviderTier, string> = {
    raw_jp: "Raw JP retailer",
    marketplace: "JP marketplace",
    proxy: "Proxy / deputy",
    jp_exporter: "JP English-facing exporter",
    eu_reseller: "EU reseller",
  };
  return labels[tier];
}

export function tierShort(tier: ProviderTier): string {
  const labels: Record<ProviderTier, string> = {
    raw_jp: "Tier 1",
    marketplace: "Tier 2",
    proxy: "Tier 3",
    jp_exporter: "Tier 4",
    eu_reseller: "Tier 5",
  };
  return labels[tier];
}

export function productTypeLabel(type: ListingProductType): string {
  const labels: Record<ListingProductType, string> = {
    box: "Box",
    case: "Case (12 boxes)",
    starter_deck: "Starter deck",
    premium_booster: "Premium booster",
    singles: "Singles",
  };
  return labels[type];
}

export function statusLabel(status: ListingStatus): string {
  const labels: Record<ListingStatus, string> = {
    preorder: "Pre-order",
    in_stock: "In stock",
    sold_out: "Sold out",
    unknown: "Unknown",
  };
  return labels[status];
}

export function statusClass(status: ListingStatus): string {
  const classes: Record<ListingStatus, string> = {
    preorder: "bg-amber-950/60 text-amber-300 border-amber-800",
    in_stock: "bg-emerald-950/60 text-emerald-300 border-emerald-800",
    sold_out: "bg-red-950/60 text-red-300 border-red-800",
    unknown: "bg-card-border/60 text-muted border-card-border",
  };
  return classes[status];
}

export function formatListingPrice(
  price: number | null,
  currency: string | null,
): string {
  if (price == null) return "—";
  const formatted = price.toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });
  return currency ? `${currency} ${formatted}` : formatted;
}

export function formatPriceWithEurHint(
  price: number | null,
  currency: string | null,
): string {
  const base = formatListingPrice(price, currency);
  if (price == null || currency !== "JPY") return base;
  const eur = price * JPY_TO_EUR_HINT;
  return `${base} (~€${eur.toLocaleString(undefined, { maximumFractionDigits: 0 })})`;
}

export function formatObservedAge(observedAt: string): string {
  const then = new Date(observedAt).getTime();
  const now = Date.now();
  const days = Math.floor((now - then) / (1000 * 60 * 60 * 24));
  if (days < 1) return "today";
  if (days === 1) return "1 day ago";
  return `${days} days ago`;
}

export function wholesaleGameLabel(
  game: "one_piece" | "pokemon" | "dragon_ball",
): string {
  const labels = {
    one_piece: "One Piece",
    pokemon: "Pokemon",
    dragon_ball: "Dragon Ball",
  } as const;
  return labels[game];
}

export function wholesaleChangeLabel(
  type:
    | "new"
    | "restock"
    | "sold_out"
    | "price_up"
    | "price_down",
): string {
  const labels = {
    new: "New",
    restock: "Restock",
    sold_out: "Sold out",
    price_up: "Price up",
    price_down: "Price down",
  } as const;
  return labels[type];
}

export function wholesaleChangeClass(
  type:
    | "new"
    | "restock"
    | "sold_out"
    | "price_up"
    | "price_down",
): string {
  const classes = {
    new: "bg-blue-950/60 text-blue-300 border-blue-800",
    restock: "bg-emerald-950/60 text-emerald-300 border-emerald-800",
    sold_out: "bg-red-950/60 text-red-300 border-red-800",
    price_up: "bg-amber-950/60 text-amber-300 border-amber-800",
    price_down: "bg-violet-950/60 text-violet-300 border-violet-800",
  } as const;
  return classes[type];
}

export function formatAudPrice(price: number | null): string {
  if (price == null) return "—";
  return `$${price.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} AUD`;
}
