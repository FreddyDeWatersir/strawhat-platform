import type { ProviderTier } from "@/lib/supabase/server";

/**
 * Build a deep search URL by replacing `{q}` in a provider's template.
 * Falls back to a homepage-with-query string if no template is set.
 */
export function buildSearchUrl(
  template: string | null,
  query: string,
): string | null {
  const trimmed = query.trim();
  if (!trimmed) return null;
  if (!template) return null;
  const encoded = encodeURIComponent(trimmed);
  return template.replace(/\{q\}/g, encoded);
}

/** Wrap any URL in Google Translate (JP→EN). Falls back to original on empty. */
export function googleTranslateUrl(target: string | null | undefined): string | null {
  if (!target) return null;
  try {
    const u = new URL(target);
    return `https://translate.google.com/translate?sl=ja&tl=en&u=${encodeURIComponent(u.toString())}`;
  } catch {
    return null;
  }
}

export type GlossaryEntry = {
  ja: string;
  romaji?: string;
  en: string;
  note?: string;
};

export const JP_GLOSSARY: { section: string; entries: GlossaryEntry[] }[] = [
  {
    section: "Product names",
    entries: [
      { ja: "ワンピースカードゲーム", romaji: "Wan Pīsu Kādo Gēmu", en: "One Piece Card Game", note: "Use this exact phrase when searching JP sites." },
      { ja: "BOX", en: "Booster box (24 packs)", note: "Same in JP." },
      { ja: "カートン", romaji: "kāton", en: "Case (12 boxes)", note: "Most important word — this is what your friend buys." },
      { ja: "パック", romaji: "pakku", en: "Pack" },
      { ja: "スターターデッキ", romaji: "sutātā dekki", en: "Starter deck" },
      { ja: "プレミアムブースター", romaji: "puremiamu būsutā", en: "Premium booster", note: "Special sets, e.g. PRB-02." },
      { ja: "シングル", romaji: "shinguru", en: "Single card" },
    ],
  },
  {
    section: "Stock & status",
    entries: [
      { ja: "在庫あり", romaji: "zaiko ari", en: "In stock" },
      { ja: "在庫なし", romaji: "zaiko nashi", en: "Out of stock" },
      { ja: "売り切れ", romaji: "urikire", en: "Sold out" },
      { ja: "予約", romaji: "yoyaku", en: "Pre-order" },
      { ja: "予約受付中", romaji: "yoyaku uketsuke-chū", en: "Pre-orders open" },
      { ja: "入荷予定", romaji: "nyūka yotei", en: "Restock scheduled" },
      { ja: "残り", romaji: "nokori", en: "Remaining (often time or qty)" },
      { ja: "即決", romaji: "sokketsu", en: "Buy It Now (Yahoo Auctions)" },
    ],
  },
  {
    section: "Condition",
    entries: [
      { ja: "新品", romaji: "shinpin", en: "New" },
      { ja: "未開封", romaji: "mikaifū", en: "Sealed / unopened" },
      { ja: "新品未開封", romaji: "shinpin mikaifū", en: "New, sealed", note: "Search for this on Mercari/Yahoo." },
      { ja: "中古", romaji: "chūko", en: "Used" },
      { ja: "シュリンク付き", romaji: "shurinku tsuki", en: "With original shrink wrap", note: "Critical for resealed-box risk." },
      { ja: "美品", romaji: "bihin", en: "Mint / great condition (singles)" },
    ],
  },
  {
    section: "Shipping & checkout",
    entries: [
      { ja: "送料", romaji: "sōryō", en: "Shipping cost" },
      { ja: "送料無料", romaji: "sōryō muryō", en: "Free shipping" },
      { ja: "海外発送可", romaji: "kaigai hassō ka", en: "Ships overseas" },
      { ja: "海外発送不可", romaji: "kaigai hassō fuka", en: "JP only" },
      { ja: "決済", romaji: "kessai", en: "Payment / checkout" },
      { ja: "クレジットカード", romaji: "kurejitto kādo", en: "Credit card" },
      { ja: "代引", romaji: "daibiki", en: "Cash on delivery (JP only)" },
      { ja: "コンビニ決済", romaji: "konbini kessai", en: "Convenience-store payment (JP only)" },
    ],
  },
  {
    section: "Set codes worth knowing",
    entries: [
      { ja: "OP-15", en: "Adventure on the Island of God", note: "Enel / Skypiea theme." },
      { ja: "OP-16", en: "The Moment of Decisive Battle", note: "Releases 2026-05-30. Pre-orders open now." },
      { ja: "EB-02", en: "Extra Booster 02" },
      { ja: "PRB-02", en: "Premium Booster 02" },
    ],
  },
];

export const TIER_GUIDES: Record<
  ProviderTier,
  { headline: string; body: string; whenToUse: string }
> = {
  raw_jp: {
    headline: "Tier 1 — Raw JP retailers",
    body: "Lowest prices, MSRP or close to it. JP-language sites, mostly JP-card-only checkout. You'll generally need a proxy (Tier 3) or a JP-issued payment method.",
    whenToUse: "Use when you want the cheapest sealed product and you're willing to add 1–2 weeks of proxy/forwarding time.",
  },
  marketplace: {
    headline: "Tier 2 — JP marketplaces",
    body: "Yahoo Auctions and Mercari are huge C2C/B2C marketplaces. Stock everywhere, prices all over the place. Verify each seller individually.",
    whenToUse: "Use when raw retailers are sold out, or for older sets / promo cards. Always buy through a proxy.",
  },
  proxy: {
    headline: "Tier 3 — Proxy / deputy services",
    body: "These bridge Tier 1 & 2 to a non-JP buyer. They charge a service fee + JP domestic shipping + international shipping, but accept PayPal/cards and offer EN interfaces.",
    whenToUse: "Default purchasing path for any Tier 1 or Tier 2 source. Pick Buyee for stability, ZenMarket for fees, Neokyo for small orders.",
  },
  jp_exporter: {
    headline: "Tier 4 — JP English-facing exporters",
    body: "JP shops that built an English store specifically for export. Easiest checkout, no proxy needed, but 30–60% markup vs Tier 1.",
    whenToUse: "Use when you need it fast, can't be bothered with a proxy, or want guaranteed authenticity from a known reseller.",
  },
  italian_reseller: {
    headline: "Tier 5 — Italian / EU resellers",
    body: "Local resellers your friend already buys from. They likely import via Tier 3 themselves and add a markup. Worth tracking to know the local-market spread.",
    whenToUse: "Use as a price benchmark. If a Tier 4 exporter + customs is cheaper than the local reseller, the arbitrage is real.",
  },
};

export type SharedResource = {
  title: string;
  url: string;
  description: string;
};

export const SHARED_RESOURCES: SharedResource[] = [
  {
    title: "Bandai official release calendar (JP)",
    url: "https://www.onepiece-cardgame.com/products/",
    description: "Source of truth for upcoming OP-XX sets, release dates, and product images.",
  },
  {
    title: "Bandai official release calendar (EN)",
    url: "https://en.onepiece-cardgame.com/products/",
    description: "Same calendar with English titles. Compare release windows before pre-ordering.",
  },
  {
    title: "Limitless TCG — One Piece meta",
    url: "https://play.limitlesstcg.com/decks?game=OP",
    description: "Current meta decks. Helps predict which leader cards will pull single-card demand and resale value.",
  },
  {
    title: "Google Translate (page-mode)",
    url: "https://translate.google.com/?sl=ja&tl=en&op=websites",
    description: "Drop in any JP product URL to translate the whole page. Use the per-provider auto-translate buttons for one-click access.",
  },
  {
    title: "Wise multi-currency card",
    url: "https://wise.com/",
    description: "JPY-balance debit card — accepted by many JP-card-only sites and avoids 3% FX markup on PayPal.",
  },
  {
    title: "Tenso (JP forwarder)",
    url: "https://www.tenso.com/en/",
    description: "Gives you a JP address. Useful for shops that ship JP-only but accept foreign cards.",
  },
  {
    title: "Italian import duty estimator",
    url: "https://www.adm.gov.it/portale/imp-cittadini",
    description: "EU/Italian customs reference. For sealed cards (TCG), expect 22% VAT on declared value + shipping over the threshold.",
  },
];
