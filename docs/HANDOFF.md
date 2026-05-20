# Handoff — Sources / JP sourcing

Notes for the next agent picking up this project. Read this before changing anything in `app/(protected)/sources/`, `lib/sources/`, or `supabase/migrations/004…008`.

## Where we are

The app already has a full **Sources** feature: 26 seeded providers, hunt-by-set panel, manual price observations, compare view, cheatsheet with JP↔EN glossary. Migrations 001–008 are applied (run `npm run verify:migrations` to confirm against the user's Supabase). Latest commits as of this handoff:

- `f089fcd` Add verify:migrations script
- `e551aa9` Drop guessed Tier-1 search URLs, fix Yuyu-tei, add Amazon JP and Kakaku.com
- `ab54261` Scope JP searches to sealed only
- `3109503` Hunt-by-set panel + one-click chips
- `6926033` Initial Sources directory

## Why the user paused this thread

> "it's still really really hard to understand and crack the Japanese websites… a lot more scraping is going to be required at first, or for us to understand way more how these things work."

That assessment is correct. The hard part is **not** building a scraper; it's that the JP TCG retail landscape has no consistent shape:

- Surugaya uses category IDs (`category=11202004` = OP TCG sealed).
- Yuyu-tei uses slug paths (`/top/opc`, `/sealed/opc/s/{set}` — and the per-set sealed page may not exist for every set).
- BigWeb aggregates many sellers, each with its own listing format.
- Mercari and Yahoo Auctions need keyword + category + condition pinning to filter out singles.
- "Sealed" means different things on different platforms (`未開封`, `新品未開封`, `シュリンク付き`, condition=1 on Mercari, `auccat=2084346152` on Yahoo Auctions).

So the next step is **one site, deep — not all sites shallow.**

## Recommended next moves (in priority order)

### 1. Kakaku.com first (lowest effort, highest leverage)

Kakaku.com is a price aggregator across Amazon JP, Rakuten, Yahoo Shopping. One scrape of a Kakaku product page yields three retailers' prices. It's already seeded as a provider.

- Verify their per-product page URL shape (`https://kakaku.com/item/SXXXX/` for OP-16).
- Build a parser that extracts the price-comparison table (rows of retailer + price + stock).
- Write each row as a `provider_listings` insert (set `provider_id` to the matching provider if name matches, else create a new one tagged `marketplace` / `raw_jp` as appropriate).
- The schema already supports this — no migrations needed.

### 2. Then Surugaya (cleanest Tier 1 to scrape)

- Already category-pinned to OP TCG sealed (`11202004`).
- Static HTML, no Cloudflare, no JS rendering. Plain `fetch` works from Vercel functions.
- Build `lib/sources/scrapers/surugaya.ts` returning `{ set_code, price_jpy, status }[]`.
- Wire a Vercel Cron at `/api/sources/refresh` that runs every 30 min and writes new `provider_listings` rows only when something changed (price moved or status flipped).

### 3. Buyee / ZenMarket search APIs (cleanest path for marketplaces)

Both have affiliate APIs that return search results as JSON — much cleaner than scraping HTML. Worth investigating before writing a Mercari/Yahoo scraper.

### 4. Then think about alerts

Once we have a stream of observations landing in `provider_listings`, a Discord webhook on status flips (preorder→in_stock, in_stock→sold_out) is ~30 lines. Don't build it before there's data flowing — it's pointless on empty tables.

## What NOT to do

- Don't scrape Mercari JP or Premium Bandai directly. They have aggressive anti-bot. Use proxy/aggregator data instead.
- Don't expand to non-Japanese OP TCG sources yet. The user explicitly said the friend is only buying JP product for now.
- Don't track singles. The user said sealed boxes/cases only. The UI defaults reflect this; keep them that way.
- Don't add scraping infra without first checking `provider_listings` schema in `supabase/migrations/004_providers.sql` — it already handles everything; no schema changes should be needed for Phase 2.
- Don't break the manual-observation path. It's the user's friend's primary workflow until automation lands.

## Data model recap

- `providers` — one row per source channel. Hand-curated, ~26 rows pre-seeded.
- `provider_listings` — observations. Currently written by the **Add observation** form on `/sources/[id]`. A scraper would write here too.
- `category_url` — verified deep link to each provider's OP TCG hub. Used as Browse fallback when no search template.
- `search_url_template` — `{q}` placeholder, scoped to sealed product. NULL means "no reliable search, use category_url instead."
- `how_to_buy` — markdown notes per provider. Rendered by `components/MarkdownLite.tsx` (server component, no JS shipped).

## Files most relevant to a Phase-2 scraper

- `lib/sources/queries.ts` — already has `latestListingsBySet()` and the compare-matrix builder. Reuse don't rebuild.
- `lib/supabase/server.ts` — `ProviderListingRow` type. The scraper just needs to insert rows shaped like this.
- `app/api/providers/[id]/listings/route.ts` — POST handler that already validates and inserts. A scraper could call this internally or insert directly via service-role client.
- `app/(protected)/page.tsx` — the dashboard "Latest sourcing observations" strip will start populating automatically once a scraper writes rows. No UI changes needed.

## How to verify the project is healthy when you start

```bash
npm install
npm run build           # should succeed
npm run verify:migrations  # should print 13 OK lines
npm run dev             # then visit /sources
```

If `verify:migrations` fails, the user's Supabase is behind — re-run the missing `.sql` files in order from `supabase/migrations/`.

## Open questions to ask the user before doing Phase 2

1. Does the friend already have a Buyee or ZenMarket account? (changes whether we use affiliate API or scrape).
2. Is Discord acceptable for restock alerts, or does he prefer email / Telegram?
3. How often does he actually want to check? (every 15 min vs every 6 hours changes both scraper design and Vercel Cron cost).
4. Has he stuck with manual observations long enough that we know which 2–3 providers actually matter to automate? (don't auto-monitor everything).
