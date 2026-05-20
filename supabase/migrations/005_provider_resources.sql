-- Straw Hat Platform — enrich providers with deep links + how-to-buy guides
-- Run in SQL Editor after 004_providers.sql

alter table providers
  add column if not exists category_url text,
  add column if not exists search_url_template text,
  add column if not exists how_to_buy text;

-- Backfill seeded JP retailers with real OP TCG category & search URLs and
-- multi-line how-to-buy guides. {q} is replaced at runtime with the search term.

update providers set
  category_url = 'https://www.suruga-ya.jp/search?category=11202004',
  search_url_template = 'https://www.suruga-ya.jp/search?category=11202004&search_word={q}',
  how_to_buy = E'**Payment:** JP-issued card or convenience-store payment. EU cards usually rejected.\n**Workaround:** order via Buyee or ZenMarket (proxy), or via a JP forwarder with their card.\n**Tips:**\n- Filter "中古" (used) vs "新品" (new) — sealed boxes are usually under 新品.\n- "予約" = pre-order, "在庫あり" = in stock, "売り切れ" = sold out.\n- Stock listed per physical shop; click a result to see which branch has it.'
where name = 'Surugaya';

update providers set
  category_url = 'https://yuyu-tei.jp/sealed/opc/',
  search_url_template = 'https://yuyu-tei.jp/sell/opc/sell_price/{q}',
  how_to_buy = E'**Payment:** JP card / bank transfer only on direct checkout.\n**Workaround:** use a proxy (Buyee/ZenMarket) or watch their occasional EN shipping promos.\n**Tips:**\n- "opc" in URLs = One Piece Card.\n- Sealed page: /sealed/opc/. Singles: /sell/opc/sell_price/{SET_CODE}.\n- Very accurate stock counts; restocks happen 11:00 JST weekdays.'
where name = 'Yuyu-tei';

update providers set
  category_url = 'https://www.cardrush-op.jp/',
  search_url_template = 'https://www.cardrush-op.jp/?keyword={q}',
  how_to_buy = E'**Payment:** JP cards / conbini / bank transfer.\n**Workaround:** proxy required from EU.\n**Tips:**\n- Domain is OP-only, so the homepage IS the category.\n- Strong on sealed at MSRP when allocations land; sells out in minutes for hyped sets.'
where name = 'Card Rush';

update providers set
  category_url = 'https://www.bigweb.co.jp/ja/products/onepiece/cardlist',
  search_url_template = 'https://www.bigweb.co.jp/ja/products/onepiece/cardlist?freeword={q}',
  how_to_buy = E'**Payment:** JP cards / conbini.\n**Workaround:** proxy.\n**Tips:**\n- Aggregator of many sellers — check each seller''s rating.\n- Useful for singles and reprints.'
where name = 'BigWeb';

update providers set
  category_url = 'https://www.hareruya2.com/categories/op',
  search_url_template = 'https://www.hareruya2.com/?keyword={q}',
  how_to_buy = E'**Payment:** Credit card, PayPal.\n**Ships internationally** for most products — one of the few Tier-1 sites that does.\n**Tips:**\n- Best Tier-1 entry point for non-JP buyers.\n- Set up an EN account; some product pages stay in JP.'
where name = 'Hareruya 2';

update providers set
  category_url = 'https://www.c-labo.jp/onlineshop/category/onepiece/',
  search_url_template = 'https://www.c-labo.jp/onlineshop/?s={q}',
  how_to_buy = E'**Payment:** JP cards mostly.\n**Workaround:** proxy.\n**Tips:** Retail chain — sealed allocation is small and goes to physical stores first.'
where name = 'Card Lab';

update providers set
  category_url = 'https://fullcomp.jp/SHOP/list.php?Search=ONE+PIECE',
  search_url_template = 'https://fullcomp.jp/SHOP/list.php?Search={q}',
  how_to_buy = E'**Payment:** JP cards / conbini.\n**Workaround:** proxy.\n**Tips:** Best for older sets and reprints.'
where name = 'Full Comp';

update providers set
  category_url = 'https://p-bandai.jp/onepiececard/',
  search_url_template = 'https://p-bandai.jp/onepiececard/?keyword={q}',
  how_to_buy = E'**Payment:** Credit card (some products accept foreign cards).\n**Ships internationally** for select items via Bandai global stores (US/EU/AU).\n**Tips:**\n- Limited products and pre-order lotteries — register early.\n- Many SKUs are JP-only — use a proxy if blocked.'
where name = 'Premium Bandai';

update providers set
  category_url = 'https://auctions.yahoo.co.jp/search/search?p=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+BOX',
  search_url_template = 'https://auctions.yahoo.co.jp/search/search?p={q}',
  how_to_buy = E'**Payment:** Buy via Buyee/ZenMarket only — direct accounts require a JP address.\n**Tips:**\n- Use JP search terms: ワンピースカードゲーム + BOX or カートン.\n- "即決" = Buy It Now. "残り" = time remaining.\n- Watch seller rating and shipping cost separately — JP domestic shipping then proxy adds international.'
where name = 'Yahoo Auctions JP';

update providers set
  category_url = 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0%20BOX',
  search_url_template = 'https://jp.mercari.com/search?keyword={q}',
  how_to_buy = E'**Payment:** Via proxy. Direct account requires JP phone.\n**Tips:**\n- C2C — verify seller reviews carefully.\n- Sealed boxes often resealed or weighed — ask for photos of the case seal.\n- "新品未開封" = new, sealed. "シュリンク付き" = with original shrink wrap.'
where name = 'Mercari JP';

update providers set
  category_url = 'https://search.rakuten.co.jp/search/mall/%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9+%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+BOX/',
  search_url_template = 'https://search.rakuten.co.jp/search/mall/{q}/',
  how_to_buy = E'**Payment:** Foreign cards work on some shops; many require JP card.\n**Tips:**\n- Many independent shops — compare ratings.\n- Filter by shipping: 海外発送可 = ships overseas.'
where name = 'Rakuten';

update providers set
  category_url = 'https://buyee.jp/item/search/query/%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0',
  search_url_template = 'https://buyee.jp/item/search/query/{q}',
  how_to_buy = E'**Payment:** PayPal / Credit card. Full EN interface.\n**Ships internationally** with consolidation.\n**Tips:**\n- Service fee + JP domestic shipping + international shipping — model landed cost before bidding.\n- Use FedEx for cases (faster customs in EU) vs cheaper EMS.\n- Italian customs: VAT (22%) charged on declared value + shipping.'
where name = 'Buyee';

update providers set
  category_url = 'https://zenmarket.jp/en/search.aspx?q=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0',
  search_url_template = 'https://zenmarket.jp/en/yahoo.aspx?q={q}',
  how_to_buy = E'**Payment:** PayPal / Credit card / Wise.\n**Ships internationally** with multi-warehouse consolidation.\n**Tips:**\n- Slightly lower fees than Buyee on Yahoo Auctions.\n- Pre-pay then per-package shipping when warehouse fills.'
where name = 'ZenMarket';

update providers set
  category_url = 'https://www.fromjapan.co.jp/japan/en/yahoo/search/q-%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0/',
  search_url_template = 'https://www.fromjapan.co.jp/japan/en/yahoo/search/q-{q}/',
  how_to_buy = E'**Payment:** PayPal / Credit card.\n**Ships internationally.**\n**Tips:**\n- Personal-shopper option for shops without web checkout.\n- Higher per-item fee but useful for hard-to-reach JP-only stores.'
where name = 'FromJapan';

update providers set
  category_url = 'https://neokyo.com/en/yahoo-auctions/search?q=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0',
  search_url_template = 'https://neokyo.com/en/yahoo-auctions/search?q={q}',
  how_to_buy = E'**Payment:** PayPal / Credit card.\n**Ships internationally with EU-friendly options.**\n**Tips:**\n- Cheaper proxy fee than Buyee for low-value items.\n- Good for splitting a JP-only shop order.'
where name = 'Neokyo';

update providers set
  category_url = 'https://rarecardsjapan.com/collections/one-piece-boosters',
  search_url_template = 'https://rarecardsjapan.com/search?q={q}',
  how_to_buy = E'**Payment:** PayPal / Credit card. Full EN site.\n**Ships internationally** with tracking.\n**Tips:**\n- Easiest entry path — no JP needed.\n- Markup 30–60% over Tier 1, but no proxy/shipping math.'
where name = 'Rare Cards Japan';

update providers set
  category_url = 'https://itsukijapan.com/collections/one-piece-games',
  search_url_template = 'https://itsukijapan.com/search?q={q}',
  how_to_buy = E'**Payment:** PayPal / Credit card.\n**Ships internationally.**\n**Tips:** Compare per-box and per-case prices; case ordering sometimes cheaper per-box.'
where name = 'Itsuki Japan';

update providers set
  category_url = 'https://jumpichiban.com/collections/one-piece-card-game',
  search_url_template = 'https://jumpichiban.com/search?q={q}',
  how_to_buy = E'**Payment:** PayPal / Credit card.\n**Ships internationally.**\n**Tips:** Often the best Tier-4 price for new pre-orders.'
where name = 'JumpIchiban';

update providers set
  category_url = 'https://sukezaemononlinestore.com/collections/one-piece',
  search_url_template = 'https://sukezaemononlinestore.com/search?q={q}',
  how_to_buy = E'**Payment:** PayPal / Credit card.\n**Ships internationally via FedEx** from Chiba.\n**Tips:** Reliable for sealed singles cases. FedEx adds customs clearance but is fast.'
where name = 'Sukezaemon';

update providers set
  category_url = 'https://tcg-corner.com/collections/one-piece',
  search_url_template = 'https://tcg-corner.com/search?q={q}',
  how_to_buy = E'**Payment:** PayPal / Credit card.\n**Ships internationally.**\n**Tips:** Pre-order focused. Lock allocation early on hyped sets.'
where name = 'TCG Corner';

update providers set
  category_url = 'https://www.fujicardshop.com/product-category/one-piece-card-game/',
  search_url_template = 'https://www.fujicardshop.com/?s={q}',
  how_to_buy = E'**Payment:** PayPal / Credit card.\n**Ships internationally** with case-by-case shipping quotes.\n**Tips:** Strong on whole-case pre-orders. Compare landed cost vs Tier-1 + proxy.'
where name = 'Fuji Card Shop';

update providers set
  category_url = 'https://kanzengames.com/collections/one-piece-card-game',
  search_url_template = 'https://kanzengames.com/search?q={q}',
  how_to_buy = E'**Payment:** PayPal / Credit card.\n**Ships internationally** (US-based fulfillment).\n**Tips:** Premium pricing — use as a fallback when JP exporters are out of stock.'
where name = 'KanZenGames';
