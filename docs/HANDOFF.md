# Handoff — Sources / JP Tier 1 site investigation

Notes for the next agent. Read this **before** changing `app/(protected)/sources/`, `lib/sources/`, or `supabase/migrations/004…008`.

**Investigation date:** 2026-05-21 (server-side `fetch` from Windows, browser-like User-Agent).  
**Scope:** All 9 `raw_jp` (Tier 1) providers. Goal: where sealed BOX/case/preorder pages live, whether plain `fetch` works, and DOM selectors for scrapers.

---

## 1. Project status

The app has a full **Sources** feature: 26 seeded providers, hunt-by-set panel, manual price observations, compare view, cheatsheet, and a **Refresh prices now** button wired to `POST /api/sources/refresh`.

| Item | Status |
|------|--------|
| Migrations 001–008 | Applied — run `npm run verify:migrations` (13 OK lines) |
| Phase 2.1 scraper | `lib/sources/scrapers/surugaya.ts` exists; **Surugaya returns HTTP 403 Cloudflare** from server fetch — 0 rows scraped |
| Manual observations | Primary workflow until a working scraper lands |
| Sealed-only UI | Hunt-by-set appends `BOX` / `カートン` + 未開封 in search templates (migration 007) |

```bash
npm install
npm run build
npm run verify:migrations
npm run dev   # → /sources
```

---

## 2. The big constraint

JP TCG retail has **no consistent shape**. “Sealed” and “preorder” are expressed differently on every site:

| Signal | Examples |
|--------|----------|
| Sealed | `未開封`, `未開封BOX`, `新品`, `シュリンク付き` |
| Preorder | `予約`, `予約受付`, `発売前`, badge `新入荷` (sometimes preorder-ish) |
| Sold out | `品切れ`, `在庫なし`, `売り切れ`, Yuyu-tei `在庫 : ×` |
| Stock count | Card Rush `在庫数 44個`, Yuyu-tei `在庫 : N` |

**Do not assume** migration 005 URLs are still correct — several sites moved (Card Lab → `c-labo-online.jp`, Full Comp → `shopping.fullcomp.jp`, Yuyu-tei `/sealed/opc/` is **404**).

**Preorder reality (May 2026):** OP-16 releases **2026-05-30**; OP-17 ~August; OP-18 ~November. Many Tier 1 pages list **current** stock only — upcoming sets appear on `product-group` / lottery pages days or weeks before release. Card Rush homepage **did not** list an OP-16 `product-group` yet (latest booster group on nav: OP-15 = `119`).

---

## 3. Per-site reference (Tier 1)

Scrape verdict values: `easy` | `harder_needs_proxy` | `blocked` | `geo_locked`

---

### 3.1 Surugaya

| Field | Value |
|-------|--------|
| **Hub** | `https://www.suruga-ya.jp/` |
| **Sealed (OP TCG)** | `https://www.suruga-ya.jp/search?category=11202004` — category ID `11202004` = OP TCG sealed |
| **Preorders** | No dedicated preorder hub. Use sealed category + search `予約` or set code via `search_word={q}` |
| **Search template** | `https://www.suruga-ya.jp/search?category=11202004&search_word={q}` (append 未開封 in `{q}` from app) |
| **Reachability** | **403** ~5.8KB, title `Just a moment...`, Cloudflare challenge (`cf_chl_opt`) |
| **Scrape verdict** | **`blocked`** — needs browser automation (Playwright) or residential proxy; plain Vercel/`fetch` fails |
| **Ships internationally** | No — proxy required |
| **Payment** | JP cards, conbini |

**DOM selectors:** Not obtainable from server fetch. Historical pattern (when HTML loads): listing links `/product/detail/{shinaban}`, title in `<h3>`, price `新品：**￥{n}**税込`, sold out `品切れ`. See `lib/sources/scrapers/surugaya.ts` for parser skeleton.

**DB note:** `providers.category_url` still points at category `11202004` — URL is correct; fetch is blocked.

---

### 3.2 Yuyu-tei

| Field | Value |
|-------|--------|
| **Hub** | `https://yuyu-tei.jp/top/opc` — **use this** (migration 008 fixed from broken `/sealed/opc/`) |
| **Sealed singles by set** | `https://yuyu-tei.jp/sell/opc/s/{set}` — lowercase set slug, e.g. `op15`, `eb04`, `st30` — **singles**, not BOX |
| **Sealed BOX product page** | `https://yuyu-tei.jp/sell/opc/item/pack/{id}` — numeric ID per product (e.g. OP-02 BOX = `10015`). **Not derivable from set code alone** — must crawl hub or search |
| **Sealed category menu** | `https://yuyu-tei.jp/sell/opc/m/boosterbox` — linked from hub; returned small HTML (~9.5KB) in probe — may need cookies/JS |
| **Preorders** | No separate preorder section. BOX pages show stock; upcoming sets may appear on hub before `/sealed/` paths |
| **Search template** | **None reliable in DB** (`search_url_template` = NULL). Old template `/sell/opc/sell_price/{q}` is wrong. In-site search box on `/top/opc` is best for humans |
| **Reachability** | Hub **200** ~187KB, no CF. `/sealed/opc/` and `/sealed/opc/s/OP-16` → **404**. `/sell/opc/s/op16` → **200** but singles listing |
| **Scrape verdict** | **`easy`** for hub + pack pages; **discovery step** needed to map `OP-16` → `pack/{id}` |

**DOM selectors (BOX product page, e.g. `/sell/opc/item/pack/10015`):**

| Field | Selector / pattern |
|-------|-------------------|
| Card | Product detail layout (not grid cards) — parse main content block |
| Title | `<title>` contains `[OP-02] 「頂上決戦」 BOX` |
| Stock | Text `在庫 : ×` (sold out) or `在庫 : N` |
| Price | Yen in body — inspect `span` near buy button (page is mostly buy-side UI) |
| Set code | From title: `\[(OP|ST|EB|PRB)-\d+\]` |

**DOM selectors (hub `/top/opc`):**

| Field | Selector / pattern |
|-------|-------------------|
| Set links | `a[href*="/sell/opc/s/"]` — slug lowercase |
| BOX menu | `a[href*="/sell/opc/m/boosterbox"]` |
| Stock keyword | Page text `在庫` |

**Notes:** Strong singles retailer; sealed BOX is a **subset** with opaque numeric IDs. Restocks often ~11:00 JST weekdays (per old how_to_buy).

---

### 3.3 Card Rush

| Field | Value |
|-------|--------|
| **Hub** | `https://www.cardrush-op.jp/` — entire site is OP-only |
| **Sealed BOX (all)** | `https://www.cardrush-op.jp/product-list/4` — sidebar label `未開封BOX`, ~117 products (May 2026) |
| **Sealed packs** | `https://www.cardrush-op.jp/product-list/5` |
| **Per-set hub (singles + sealed SKUs)** | `https://www.cardrush-op.jp/product-group/{id}` — see table below |
| **Preorders** | No dedicated preorder URL. New sets get a `product-group` entry when announced; BOX SKU may appear on `/product-list/4` before or after release |
| **Search template** | **NULL in DB.** Site search exists but not verified for automation — prefer category + product-group |
| **Reachability** | **200**, ~313KB on `/product-list/4`, no CF |
| **Scrape verdict** | **`easy`** — best first scraper target |

**Product-group IDs (from homepage nav, 2026-05-21):**

| Set | product-group ID |
|-----|------------------|
| OP-13 受け継がれる意志 | 103 |
| OP-14 蒼海の七傑 | 113 |
| OP-15 神の島の冒険 | 119 |
| OP-12 師弟の絆 | 93 |
| PRB-02 | 102 |
| EB-03 | 112 |
| ST-30 | 123 |

**OP-16:** Not listed in nav yet — watch `/product-list/4` and homepage for new group ID.

**DOM selectors (`/product-list/4` listing):**

| Field | Selector |
|-------|----------|
| Card | `div.list_item_cell` or `div.item_data[data-product-id]` |
| Link | `a.item_data_link` → `href="/product/{id}"` |
| Title | `span.goods_name` |
| Model / type | `span.model_number_value` (often `未開封BOX`) |
| Price | `p.selling_price span.figure` + `span.tax_label` |
| Stock | `p.stock` — text `在庫数 {n}個` |
| Set code | Parse from title, e.g. `【OP-13】`, `OP13-` in singles |

**Notes:** Listings mix sealed BOX (¥5k–40k) with high-end singles on product-group pages — filter titles containing `未開封BOX` or category `product-list/4` only for sealed scraper.

---

### 3.4 BigWeb

| Field | Value |
|-------|--------|
| **Hub** | `https://www.bigweb.co.jp/` → Angular SPA shell |
| **Sealed / OP list (migration)** | `https://www.bigweb.co.jp/ja/products/onepiece/cardlist` |
| **Search** | `?freeword={q}` on cardlist URL |
| **Preorders** | Unknown — content loaded client-side |
| **Reachability** | **200** but only **~1.8KB** HTML (`<base href="/ja/">`, GTM) — **no product markup in initial response** |
| **Scrape verdict** | **`harder_needs_proxy`** — requires headless browser (Playwright/Puppeteer) or internal API discovery |

**DOM selectors:** Not available without JS render. After render, expect marketplace-style seller cards — aggregate many sellers (check seller rating per old notes).

---

### 3.5 Hareruya 2

| Field | Value |
|-------|--------|
| **Hub** | `https://www.hareruya2.com/` |
| **OP category (migration)** | `https://www.hareruya2.com/categories/op` → **404** |
| **Search** | `https://www.hareruya2.com/?keyword={q}` — probe with `OP-16 BOX` returned **homepage** (Pokémon-focused), not filtered results |
| **Preorders** | No OP-specific preorder section found |
| **Reachability** | **200** ~1MB, Shopify, no CF |
| **Scrape verdict** | **`harder_needs_proxy`** for OP sealed — site is primarily **Pokémon**; OP sealed availability minimal. Some international shipping |

**DOM selectors (Shopify product grid, if OP collection URL found):**

| Field | Selector |
|-------|----------|
| Card | `div.product-card-wrapper` / `div.card-wrapper` |
| Link | `a[href*="/products/"]` |
| Title | `h3.card__heading` / `.card__heading a` |
| Price | Shopify price elements in card (inspect rendered collection) |
| Badge | `div.card__badge` — may show sold out / 予約 |

**Notes:** Hareruya 2 is Tier 1 in DB for historical OP singles; **low priority** for sealed BOX pipeline. Consider Hareruya 1 or other exporters for OP product instead.

---

### 3.6 Card Lab

| Field | Value |
|-------|--------|
| **Important** | **Online shop moved** to `https://www.c-labo-online.jp/` — **not** `www.c-labo.jp/onlineshop/...` (404 in probe) |
| **Hub** | `https://www.c-labo-online.jp/page/157` (ONE PIECE CARD GAME landing) |
| **Per-set list (example OP-13)** | `https://www.c-labo-online.jp/product-list/3164` |
| **Product detail** | `https://www.c-labo-online.jp/product/{id}` |
| **Preorders** | Mixed into product listings; store blogs announce 抽選 (lottery) — e.g. `c-labo.jp/shop/.../blog/` |
| **Search** | `https://www.c-labo-online.jp/onlineshop/?s={q}` — verify path on live site |
| **Reachability** | **200** ~1.7MB on product-list, no CF |
| **Scrape verdict** | **`easy`** once URLs in DB are updated to `c-labo-online.jp` |

**DOM selectors:**

| Field | Selector |
|-------|----------|
| Card | `a.item_data_link` wrapping `div.inner_item_data` |
| Link | `href="/product/{id}"` |
| Title / price | Inspect `inner_item_data` text nodes — price often `円(税込)` pattern |

**Notes:** Retail chain; sealed allocation often store-first. Update `providers.category_url` in a future migration.

---

### 3.7 Full Comp

| Field | Value |
|-------|--------|
| **Important** | **Online shop** is `https://shopping.fullcomp.jp/` (Shopify) — **not** `fullcomp.jp/SHOP/list.php` (broken — PHP warnings, 862 bytes) |
| **OP collection** | `https://shopping.fullcomp.jp/collections/onepiece` — mostly **singles** |
| **Per-set brand (example)** | `https://shopping.fullcomp.jp/shopbrand/op_op-01/` |
| **Preorders** | No dedicated section; check product titles / tags |
| **Reachability** | Shopify **200** ~1.1MB; legacy SHOP URL broken |
| **Scrape verdict** | **`easy`** on Shopify shop; **low sealed BOX density** — singles-focused |

**DOM selectors (Shopify):**

| Field | Selector |
|-------|----------|
| Card | `product-card` custom element / `.product-card` |
| Link | `a.product-card__link[href*="/products/"]` |
| Title | `.visually-hidden` inside link or card text |
| Product id | `data-product-id` on `product-card` |

---

### 3.8 Premium Bandai

| Field | Value |
|-------|--------|
| **Hub (JP)** | `https://p-bandai.jp/onepiececard/` |
| **Category** | `https://p-bandai.jp/category/?ca=onepiececg` |
| **Preorders** | **Lottery (抽選販売)** — not a normal cart preorder. Typical flow: application window → winner notification → pay → ship. OP-17 lottery **not open yet** (May 2026); OP-16 release 2026-05-30 |
| **Reachability** | **200** ~11KB but **`geo_locked`** — non-JP IPs get international region picker / access restriction (probe from EU/US) |
| **Scrape verdict** | **`geo_locked`** + **`blocked`** for automation — do not scrape directly |

**How the friend should use it (manual):**

1. Use **Japan VPN** or browse via **Buyee/ZenMarket** view of Premium Bandai.
2. Watch `https://p-bandai.jp/onepiececard/` for `抽選` / `予約` items when a set is announced.
3. Track lottery windows on aggregator **`https://nyuka-now.com/archives/97393`** (ONE PIECE 抽選・予約まとめ, updated frequently) — lists Premium Bandai + 40 retailers.
4. Official limited SKUs (Anniversary sets, etc.) often **not** the same as a standard booster BOX.

**DOM selectors:** N/A from server fetch.

**Payment:** Credit card; some items ship internationally via Bandai global stores.

---

### 3.9 Amazon Japan

| Field | Value |
|-------|--------|
| **Sealed search (scoped)** | `https://www.amazon.co.jp/s?k=ワンピースカードゲーム+未開封+{q}&i=toys` |
| **Category hub (migration)** | `https://www.amazon.co.jp/s?k=ワンピースカードゲーム+BOX&i=toys` |
| **Product** | `/dp/{ASIN}` |
| **Preorders** | Search results show `予約` / preorder delivery date in listing; filter by keyword |
| **Reachability** | **200** ~890KB search page, `data-asin` present, no CF in probe |
| **Scrape verdict** | **`easy`** today; **`harder_needs_proxy`** long-term — Amazon HTML changes often, captcha risk under load |

**DOM selectors (search results):**

| Field | Selector |
|-------|----------|
| Result row | `div[data-component-type="s-search-result"]` |
| ASIN | attribute `data-asin` on result row |
| Title | `h2 a span` or `h2 span.a-text-normal` |
| Price | `span.a-price .a-offscreen` (hidden text) or `span.a-price-whole` |
| Preorder | Text `予約` / delivery date in result card |
| Link | `h2 a.a-link-normal` → `/dp/...` |

**Notes:** Many marketplace sellers — prefer `出荷元 Amazon` / Bandai in title for sealed authenticity. Often cheapest Tier-1 when in stock; some SKUs ship internationally (Amazon Global).

---

## 4. Suggested next builds (priority)

| Priority | Target | Why |
|----------|--------|-----|
| **1** | **Card Rush** — `/product-list/4` + optional `product-group/{id}` | Clean HTML, sealed category, no CF, clear selectors |
| **2** | **Amazon JP** — sealed search URL | Works with `fetch`, good for OP-16 MSRP check; fragile markup |
| **3** | **Yuyu-tei** — crawl `/top/opc` → discover `/sell/opc/item/pack/{id}` for BOX | Reliable fetch; needs ID discovery layer |
| **4** | **c-labo-online.jp** | Fix provider URLs in DB + scraper (Card Lab) |
| **5** | **shopping.fullcomp.jp** | Shopify singles; optional for sealed |
| **Defer** | Surugaya | Playwright worker or paid proxy |
| **Defer** | BigWeb | Full JS render required |
| **Defer** | Hareruya 2 OP | OP category 404; Pokémon-first site |
| **Manual only** | Premium Bandai | Geo + lottery; use nyuka-now aggregator + manual observations |

**Per-set preorder workflow (friend’s use case):** For OP-16 / OP-17, poll **Card Rush** `product-list/4` + **Amazon search** + manual **Italian reseller** rows in `provider_listings`. Do not expect OP-17 on JP Tier 1 until ~6–8 weeks before release.

---

## 5. Reference: existing schema and code

### Data model

- `providers` — `category_url`, `search_url_template`, `how_to_buy` (migrations 005, 006, 007, 008)
- `provider_listings` — observations (`set_code`, `product_type`, `price`, `status`, `source_url`, `notes`)
- Manual form: `/sources/[id]#add-observation`
- Refresh: `POST /api/sources/refresh` → `lib/sources/refresh.ts` → scrapers in `lib/sources/scrapers/`

### Files

| File | Purpose |
|------|---------|
| [lib/sources/queries.ts](../lib/sources/queries.ts) | `latestListingsForProvider`, compare matrix |
| [lib/sources/refresh.ts](../lib/sources/refresh.ts) | Diff + insert orchestrator |
| [lib/sources/scrapers/surugaya.ts](../lib/sources/scrapers/surugaya.ts) | Surugaya parser (blocked at fetch) |
| [app/api/providers/[id]/listings/route.ts](../app/api/providers/[id]/listings/route.ts) | Manual POST |
| [supabase/migrations/004_providers.sql](../supabase/migrations/004_providers.sql) | Schema |

### Provider URL fixes still needed (DB)

| Provider | Current DB issue | Verified target |
|----------|------------------|-----------------|
| Yuyu-tei | OK at `/top/opc` | — |
| Card Rush | `category_url` = `/product-list` | Prefer `/product-list/4` for sealed BOX |
| Card Lab | Points at `c-labo.jp/onlineshop` | Use `c-labo-online.jp` |
| Full Comp | Points at broken `fullcomp.jp/SHOP/` | Use `shopping.fullcomp.jp/collections/onepiece` |
| Hareruya 2 | `/categories/op` 404 | Find real OP collection URL or drop search automation |
| BigWeb | SPA shell | Playwright only |

### What NOT to do

- Do not scrape Mercari / Premium Bandai directly in Phase 2.
- Do not track singles — sealed boxes/cases only.
- Do not add schema before a scraper proves useful data.
- Do not break manual observations path.
- Do not assume Surugaya is “static HTML” — **Cloudflare as of 2026-05**.

### Probe artifacts (optional dev scripts)

- `scripts/probe-tier1-dom.mjs` — reachability matrix
- `scripts/probe-tier1-report.json` — raw probe output
- `scripts/extract-dom-samples.mjs` — HTML snippets for Card Rush / Amazon / etc.

---

## 6. Open questions for the user

1. Does the friend have Buyee/ZenMarket for Premium Bandai lottery entries?
2. Which 2–3 Tier 1 sites matter most after this investigation? (Recommendation: Card Rush + Amazon + manual Italian channel.)
3. Should we run a migration to fix `category_url` for Card Lab / Full Comp / Card Rush sealed path?

---

## 7. Preorder snapshot (2026-05-21)

**Docs:** [SUPPLY_STRATEGY.md](./SUPPLY_STRATEGY.md) (playbook) · [TCG_OPERATORS_RESEARCH.md](./TCG_OPERATORS_RESEARCH.md) (verified operators)

| Set | Status |
|-----|--------|
| **OP-16** (2026-05-30) | Late JP lotteries closing; buy 1 calibration BOX via Card Cosmos / JumpIchiban DDP / Fuji. Amazon JP ASIN `B0GN5JV7JS` = invitation preorder. |
| **OP-17** (2026-08-28) | EU preorder lane (TCG Corner, Card Cosmos) **sold out** Apr 2026. Watch second-wave ~July; JP-direct listings late June; Anime Yokocho for 店頭予約. |
| **OP-18** (2026-11-20) | Subscribe to newsletters now. |

**Tier 1 trim (migration 009):** Active = Card Rush (`/product-list/4`), Yuyu-tei (`/top/opc`), Amazon Japan. Deactivated = Surugaya, BigWeb, Hareruya 2, Card Lab, Full Comp, Premium Bandai.

**Aggregator:** [nyuka-now OP lottery summary](https://nyuka-now.com/archives/97393) — manual bookmark for JP lottery windows.

**Playbook links:** surfaced on `/sources` via categorized Playbook resources panel.
