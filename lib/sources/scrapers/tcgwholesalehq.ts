import type {
  WholesaleGame,
  WholesaleScrapeRecord,
} from "@/lib/sources/scrapers/types";

export const TCG_WHOLESALE_BASE = "https://tcgwholesalehq.com";

/** One Piece + Pokemon + Dragon Ball collection handles to monitor. */
export const WHOLESALE_COLLECTIONS: {
  handle: string;
  game: WholesaleGame;
  category: string;
}[] = [
  { handle: "one-piece-tcg", game: "one_piece", category: "One Piece TCG" },
  {
    handle: "one-piece-booster-boxes",
    game: "one_piece",
    category: "One Piece Booster Boxes",
  },
  {
    handle: "one-piece-single-cards",
    game: "one_piece",
    category: "One Piece Single Cards",
  },
  {
    handle: "pokemon-tcg",
    game: "pokemon",
    category: "Pokemon TCG",
  },
  {
    handle: "pokemon-booster-boxes",
    game: "pokemon",
    category: "Pokemon Booster Boxes",
  },
  {
    handle: "pokemon-limited-boxes-sets",
    game: "pokemon",
    category: "Pokemon Limited Boxes & Sets",
  },
  {
    handle: "pokemon-singles",
    game: "pokemon",
    category: "Pokemon Singles",
  },
  {
    handle: "dragon-ball-tcg",
    game: "dragon_ball",
    category: "Dragon Ball TCG",
  },
];

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export type ShopifyVariant = {
  id: number;
  product_id: number;
  title: string;
  sku: string | null;
  available: boolean;
  price: string;
  compare_at_price: string | null;
};

export type ShopifyProduct = {
  id: number;
  title: string;
  handle: string;
  tags: string[];
  variants: ShopifyVariant[];
};

export type ShopifyProductsResponse = {
  products: ShopifyProduct[];
};

function parsePrice(value: string | null | undefined): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function buildVariantTitle(productTitle: string, variantTitle: string): string {
  if (!variantTitle || variantTitle === "Default Title") {
    return productTitle;
  }
  if (variantTitle === "Sealed" || variantTitle === "Case") {
    return `${productTitle} (${variantTitle})`;
  }
  return `${productTitle} — ${variantTitle}`;
}

function buildSourceUrl(handle: string): string {
  return `${TCG_WHOLESALE_BASE}/products/${handle}`;
}

/** Flatten Shopify products into per-variant wholesale records. */
export function parseShopifyProducts(
  products: ShopifyProduct[],
  game: WholesaleGame,
  category: string,
): WholesaleScrapeRecord[] {
  const results: WholesaleScrapeRecord[] = [];

  for (const product of products) {
    const sourceUrl = buildSourceUrl(product.handle);

    for (const variant of product.variants) {
      results.push({
        variant_id: variant.id,
        product_id: product.id,
        sku: variant.sku || null,
        title: buildVariantTitle(product.title, variant.title),
        game,
        category,
        price: parsePrice(variant.price),
        compare_at_price: parsePrice(variant.compare_at_price),
        currency: "AUD",
        available: variant.available,
        source_url: sourceUrl,
      });
    }
  }

  return results;
}

async function fetchCollectionPage(
  handle: string,
  page: number,
): Promise<ShopifyProductsResponse> {
  const url = `${TCG_WHOLESALE_BASE}/collections/${handle}/products.json?limit=250&page=${page}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(
      `Shopify fetch failed for ${handle} page ${page}: HTTP ${res.status}`,
    );
  }

  return res.json() as Promise<ShopifyProductsResponse>;
}

async function fetchCollectionProducts(
  handle: string,
): Promise<ShopifyProduct[]> {
  const all: ShopifyProduct[] = [];
  const seenIds = new Set<number>();

  for (let page = 1; page <= 20; page += 1) {
    const data = await fetchCollectionPage(handle, page);
    if (!data.products.length) break;

    for (const product of data.products) {
      if (!seenIds.has(product.id)) {
        seenIds.add(product.id);
        all.push(product);
      }
    }

    if (data.products.length < 250) break;
  }

  return all;
}

/** Fetch all monitored variants from Shopify collections (fetched in parallel). */
export async function fetchWholesaleCatalogue(): Promise<
  WholesaleScrapeRecord[]
> {
  const byVariantId = new Map<number, WholesaleScrapeRecord>();

  const perCollection = await Promise.all(
    WHOLESALE_COLLECTIONS.map(async (collection) => {
      const products = await fetchCollectionProducts(collection.handle);
      return parseShopifyProducts(
        products,
        collection.game,
        collection.category,
      );
    }),
  );

  for (const records of perCollection) {
    for (const record of records) {
      byVariantId.set(record.variant_id, record);
    }
  }

  return [...byVariantId.values()];
}

export const tcgWholesaleHqScraper = {
  providerName: "TCG Wholesale HQ",
  async run() {
    return fetchWholesaleCatalogue();
  },
};
