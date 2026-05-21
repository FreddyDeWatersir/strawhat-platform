import type { ProviderTier } from "@/lib/supabase/server";

/**
 * Build a deep search URL by replacing `{q}` in a provider's template.
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

/** Wrap any URL in Google Translate (JP→EN). */
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
      {
        ja: "ワンピースカードゲーム",
        romaji: "Wan Pīsu Kādo Gēmu",
        en: "One Piece Card Game",
        note: "Use this exact phrase when searching JP sites.",
      },
      { ja: "BOX", en: "Booster box (24 packs)", note: "Same in JP." },
      {
        ja: "カートン",
        romaji: "kāton",
        en: "Case (12 boxes)",
        note: "Most important word — this is what your friend buys.",
      },
      { ja: "パック", romaji: "pakku", en: "Pack" },
      {
        ja: "スターターデッキ",
        romaji: "sutātā dekki",
        en: "Starter deck",
      },
      {
        ja: "プレミアムブースター",
        romaji: "puremiamu būsutā",
        en: "Premium booster",
        note: "Special sets, e.g. PRB-02.",
      },
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
      {
        ja: "新品未開封",
        romaji: "shinpin mikaifū",
        en: "New, sealed",
        note: "Search for this on Mercari/Yahoo.",
      },
      { ja: "中古", romaji: "chūko", en: "Used" },
      {
        ja: "シュリンク付き",
        romaji: "shurinku tsuki",
        en: "With original shrink wrap",
        note: "Critical for resealed-box risk.",
      },
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
      {
        ja: "クレジットカード",
        romaji: "kurejitto kādo",
        en: "Credit card",
      },
      { ja: "代引", romaji: "daibiki", en: "Cash on delivery (JP only)" },
      {
        ja: "コンビニ決済",
        romaji: "konbini kessai",
        en: "Convenience-store payment (JP only)",
      },
    ],
  },
  {
    section: "Set codes worth knowing",
    entries: [
      {
        ja: "OP-15",
        en: "Adventure on the Island of God",
        note: "Enel / Skypiea theme.",
      },
      {
        ja: "OP-16",
        en: "The Moment of Decisive Battle (決戦の刻)",
        note: "Releases 2026-05-30.",
      },
      {
        ja: "OP-17",
        en: "TBA — Aug 2026",
        note: "EU/JP preorders sold out at major exporters Apr 2026.",
      },
      {
        ja: "OP-18",
        en: "TBA — Nov 2026",
        note: "Subscribe to exporter newsletters now.",
      },
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
    body: "Three verified browse targets: Card Rush sealed category (/product-list/4), Yuyu-tei OP hub (/top/opc), Amazon JP sealed search. Everything else needs a proxy or private channel.",
    whenToUse:
      "Spot-buy at MSRP when stock appears. Use proxy for yuyu-tei checkout.",
  },
  marketplace: {
    headline: "Tier 2 — JP marketplaces",
    body: "Yahoo Auctions, Mercari, Rakuten, Kakaku.com. Verify sellers; buy via proxy.",
    whenToUse:
      "When Tier 1 is sold out or for price anchoring via Kakaku.",
  },
  proxy: {
    headline: "Tier 3 — Proxy / deputy services",
    body: "Bridge JP shops to non-JP buyers. Anime Yokocho is the only verified 2026 path for in-store reservations (店頭予約).",
    whenToUse:
      "Default path for yuyu-tei and MSRP-adjacent buys. Buyee for auctions/Mercari.",
  },
  jp_exporter: {
    headline: "Tier 4 — JP English-facing exporters",
    body: "JP shops with EN storefronts (Fuji, JumpIchiban, Itsuki, Rare Cards Japan, etc.). 30–60% markup vs MSRP but easy checkout.",
    whenToUse:
      "When you want sealed without running a proxy yourself.",
  },
  eu_reseller: {
    headline: "Tier 5 — EU resellers",
    body: "EU shops importing JP sealed (Card Cosmos, TCG Corner, Mirai). Some Italian operators (Bustones-class) are closed-circle Telegram — track as price ceiling.",
    whenToUse:
      "Best for calibration buys (VAT at checkout) and monitoring OP-17/18 preorder windows.",
  },
};

export type ResourceCategory =
  | "buy_now"
  | "watch"
  | "proxy"
  | "jp_retail"
  | "aggregator"
  | "calendar_meta"
  | "competitor"
  | "tools"
  | "community"
  | "docs";

export type SharedResource = {
  title: string;
  url: string;
  description: string;
  category: ResourceCategory;
};

export const CATEGORY_META: Record<
  ResourceCategory,
  { label: string; blurb: string; order: number }
> = {
  buy_now: {
    label: "Buy now (OP-16 calibration)",
    blurb: "Order 1 BOX this week to learn landed cost.",
    order: 1,
  },
  watch: {
    label: "Watch (OP-17 / OP-18)",
    blurb: "Subscribe / check weekly for preorder openings.",
    order: 2,
  },
  proxy: {
    label: "Proxy & personal shopper",
    blurb: "MSRP lane and in-store reservations.",
    order: 3,
  },
  aggregator: {
    label: "JP preorder aggregator",
    blurb: "Lottery + restock windows across JP retailers.",
    order: 4,
  },
  jp_retail: {
    label: "JP retail spot-check",
    blurb: "Public JP shops — often need proxy to buy.",
    order: 5,
  },
  calendar_meta: {
    label: "Calendars & meta",
    blurb: "Official release dates and meta context.",
    order: 6,
  },
  competitor: {
    label: "Competitor benchmark",
    blurb: "Italian resale price ceiling.",
    order: 7,
  },
  tools: {
    label: "Tools",
    blurb: "Payments, translate, customs.",
    order: 8,
  },
  community: {
    label: "Community (referral hunt)",
    blurb: "Find Bustones-class upstream via social.",
    order: 9,
  },
  docs: {
    label: "Platform docs",
    blurb: "Strategy and research write-ups.",
    order: 10,
  },
};

export const SHARED_RESOURCES: SharedResource[] = [
  {
    category: "buy_now",
    title: "Card Cosmos — OP JP collection",
    url: "https://cardcosmos.de/en-eu/collections/one-piece-card-game",
    description: "EU VAT included. Best OP-16 calibration buy (~€102/box when listed).",
  },
  {
    category: "buy_now",
    title: "JumpIchiban — OP-16 product",
    url: "https://jumpichiban.com/products/one-piece-card-game-the-moment-of-decisive-battle-op-16-pack-or-box",
    description: "Use DDP shipping for all-in EU price (~€119).",
  },
  {
    category: "buy_now",
    title: "Fuji Card Shop — OP-16 sealed case",
    url: "https://www.fujicardshop.com/product/op-16-the-time-of-battle-sealed-case/",
    description: "JP-direct; VAT at Italian customs on delivery.",
  },
  {
    category: "buy_now",
    title: "Amazon JP — OP-16 BOX (ASIN B0GN5JV7JS)",
    url: "https://www.amazon.co.jp/dp/B0GN5JV7JS",
    description: "Invitation preorder; buy via Buyee if invited.",
  },
  {
    category: "watch",
    title: "TCG Corner — OP pre-order (IT)",
    url: "https://tcg-corner.com/it/collections/one-piece-pre-order",
    description: "OP-17 JP sold out; monitor for second-wave.",
  },
  {
    category: "watch",
    title: "Card Cosmos — OP-17 JP (reference)",
    url: "https://cardcosmos.de/en-eu/products/one-piece-card-game-op17-booster-display-the-worlds-strongest-warriors-japanisch",
    description: "Sold-out preorder page — confirms pipeline.",
  },
  {
    category: "watch",
    title: "Rare Cards Japan — OP collection",
    url: "https://rarecardsjapan.com/collections/one-piece-card-game",
    description: "Trustpilot 4.5★; expect OP-17 listing in July.",
  },
  {
    category: "watch",
    title: "Itsuki Japan — OP games",
    url: "https://itsukijapan.com/collections/one-piece-games",
    description: "Italian locale available.",
  },
  {
    category: "watch",
    title: "Mirai Cards",
    url: "https://www.miraicards.com/",
    description: "NL EU retailer; second-wave candidate.",
  },
  {
    category: "watch",
    title: "Samurai Sword Tokyo — OP JP boxes",
    url: "https://samuraiswordtokyo.com/collections/one-piece-booster-boxjp",
    description: "Licensed Tokyo dealer.",
  },
  {
    category: "watch",
    title: "Sukezaemon — booster boxes",
    url: "https://sukezaemononlinestore.com/en/collections/booster-boxes",
    description: "Watch for OP-16/17 listings.",
  },
  {
    category: "proxy",
    title: "Anime Yokocho — Buy For Me",
    url: "https://www.animeyokocho.com/buy-for-me",
    description: "Only verified 店頭予約 service in 2026. Contact before OP-17 window.",
  },
  {
    category: "proxy",
    title: "Buyee",
    url: "https://buyee.jp/",
    description: "Standard proxy; Yahoo/Mercari/Amazon JP.",
  },
  {
    category: "proxy",
    title: "ZenMarket",
    url: "https://zenmarket.jp/",
    description: "Low commission proxy.",
  },
  {
    category: "proxy",
    title: "FromJapan",
    url: "https://www.fromjapan.co.jp/",
    description: "Proxy + optional personal shopper.",
  },
  {
    category: "proxy",
    title: "Japan Rabbit",
    url: "https://japanrabbit.com/",
    description: "Online orders only; in-store pickup suspended 2026.",
  },
  {
    category: "jp_retail",
    title: "Card Rush — sealed BOX",
    url: "https://www.cardrush-op.jp/product-list/4",
    description: "117 sealed BOX listings; MSRP when in stock.",
  },
  {
    category: "jp_retail",
    title: "Yuyu-tei — OP hub",
    url: "https://yuyu-tei.jp/top/opc",
    description: "Domestic only — use Anime Yokocho or Buyee.",
  },
  {
    category: "jp_retail",
    title: "Amazon JP — sealed BOX search",
    url: "https://www.amazon.co.jp/s?k=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+BOX&i=toys",
    description: "Search all OP sealed BOX listings.",
  },
  {
    category: "aggregator",
    title: "nyuka-now — OP lottery & preorder hub",
    url: "https://nyuka-now.com/archives/97393",
    description: "JP aggregator for 抽選/予約 across 40+ retailers. Bookmark.",
  },
  {
    category: "calendar_meta",
    title: "Bandai release calendar (JP)",
    url: "https://www.onepiece-cardgame.com/products/",
    description: "Official JP product calendar.",
  },
  {
    category: "calendar_meta",
    title: "Bandai release calendar (EN)",
    url: "https://en.onepiece-cardgame.com/products/",
    description: "English titles and dates.",
  },
  {
    category: "calendar_meta",
    title: "Limitless TCG — OP meta",
    url: "https://play.limitlesstcg.com/decks?game=OP",
    description: "Meta demand signal for singles (context).",
  },
  {
    category: "competitor",
    title: "Cardmarket IT — One Piece",
    url: "https://www.cardmarket.com/it/OnePiece",
    description: "Italian market price reference.",
  },
  {
    category: "competitor",
    title: "Bustones (referral needed)",
    url: "https://www.reddit.com/r/OnePieceTCG/",
    description: "No public handle — ask Italian OP TCG communities for referral.",
  },
  {
    category: "tools",
    title: "Wise multi-currency card",
    url: "https://wise.com/",
    description: "JPY balance; accepted by some JP sites.",
  },
  {
    category: "tools",
    title: "Google Translate (JP→EN)",
    url: "https://translate.google.com/?sl=ja&tl=en&op=websites",
    description: "Translate any JP product page.",
  },
  {
    category: "tools",
    title: "Italian customs (ADM)",
    url: "https://www.adm.gov.it/portale/imp-cittadini",
    description: "IVA / import duty reference.",
  },
  {
    category: "community",
    title: "r/OnePieceTCG",
    url: "https://www.reddit.com/r/OnePieceTCG/",
    description: "EU import recommendations; ask for Italian group-buys.",
  },
  {
    category: "docs",
    title: "Supply strategy (in-app)",
    url: "/docs/supply-strategy",
    description: "Proxy ladder, shortlist, OP-17/18 playbook.",
  },
  {
    category: "docs",
    title: "TCG operators research (in-app)",
    url: "/docs/tcg-operators-research",
    description: "Verified operators table from May 2026 research.",
  },
  {
    category: "docs",
    title: "Platform handoff (in-app)",
    url: "/docs/handoff",
    description: "Technical notes for developers.",
  },
];

export const PLAYBOOK_CATEGORIES_DEFAULT: ResourceCategory[] = [
  "buy_now",
  "watch",
  "proxy",
  "aggregator",
  "docs",
];

export function resourcesByCategories(
  categories: ResourceCategory[],
): { category: ResourceCategory; resources: SharedResource[] }[] {
  return categories
    .slice()
    .sort((a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order)
    .map((category) => ({
      category,
      resources: SHARED_RESOURCES.filter((r) => r.category === category),
    }))
    .filter((g) => g.resources.length > 0);
}
