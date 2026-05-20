-- Straw Hat Platform — make provider search URLs return sealed BOX results
-- Run in SQL Editor after 005_provider_resources.sql
--
-- Why: searching "OP-16" alone returns mostly single cards on most JP sites.
-- These templates either narrow by category (Surugaya) or rely on the
-- {SET} BOX / {SET} カートン suffix that the UI now appends.

-- Surugaya: category 11202004 = OP TCG sealed; search_word is the user query
update providers
set search_url_template = 'https://www.suruga-ya.jp/search?category=11202004&search_word={q}'
where name = 'Surugaya';

-- Yuyu-tei: sealed area uses /sealed/opc/ with per-set sub-pages.
-- They lowercase the set code in the URL slug.
update providers
set search_url_template = 'https://yuyu-tei.jp/sealed/opc/s/{q}',
    how_to_buy = E'**Payment:** JP card / bank transfer only on direct checkout.\n**Workaround:** use a proxy (Buyee/ZenMarket) or watch their occasional EN shipping promos.\n**Tips:**\n- Sealed area: /sealed/opc/. Per-set: /sealed/opc/s/{lowercase set code}.\n- Quick-search appends "BOX" or "カートン" to filter sealed product.\n- Very accurate stock counts; restocks happen ~11:00 JST weekdays.'
where name = 'Yuyu-tei';

-- Card Rush: site search uses the homepage with ?word=...
update providers
set search_url_template = 'https://www.cardrush-op.jp/?word={q}'
where name = 'Card Rush';

-- BigWeb: site-wide search; queries with "BOX" appended return sealed products.
update providers
set search_url_template = 'https://www.bigweb.co.jp/ja/products/onepiece/cardlist?freeword={q}'
where name = 'BigWeb';

-- Hareruya 2: EN store search.
update providers
set search_url_template = 'https://www.hareruya2.com/search?type=product&q={q}'
where name = 'Hareruya 2';

-- Premium Bandai: OP card subdomain search.
update providers
set search_url_template = 'https://p-bandai.jp/onepiececard/?keyword={q}'
where name = 'Premium Bandai';

-- Yahoo Auctions JP: include the JP product term in the query to filter to OP TCG.
-- ワンピースカードゲーム is URL-encoded so it survives template substitution.
update providers
set search_url_template = 'https://auctions.yahoo.co.jp/search/search?p=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+{q}'
where name = 'Yahoo Auctions JP';

-- Mercari JP: same idea — prepend the product term.
update providers
set search_url_template = 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0%20{q}&status=on_sale'
where name = 'Mercari JP';

-- Rakuten: search-mall path, prepend JP term.
update providers
set search_url_template = 'https://search.rakuten.co.jp/search/mall/%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9+%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+{q}/'
where name = 'Rakuten';

-- Buyee: query path; prepend JP product term.
update providers
set search_url_template = 'https://buyee.jp/item/search/query/%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0%20{q}?translationType=1'
where name = 'Buyee';

-- ZenMarket: Yahoo Auctions search wrapper, embed JP product term.
update providers
set search_url_template = 'https://zenmarket.jp/en/yahoo.aspx?q=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+{q}'
where name = 'ZenMarket';

-- FromJapan: Yahoo search wrapper.
update providers
set search_url_template = 'https://www.fromjapan.co.jp/japan/en/yahoo/search/q-%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+{q}/'
where name = 'FromJapan';

-- Neokyo: Yahoo Auctions wrapper.
update providers
set search_url_template = 'https://neokyo.com/en/yahoo-auctions/search?q=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+{q}'
where name = 'Neokyo';

-- Tier 4 exporters: their search returns sealed product fine with just the set.
update providers
set search_url_template = 'https://rarecardsjapan.com/search?q={q}&type=product'
where name = 'Rare Cards Japan';

update providers
set search_url_template = 'https://itsukijapan.com/search?q={q}&type=product'
where name = 'Itsuki Japan';

update providers
set search_url_template = 'https://jumpichiban.com/search?q={q}&type=product'
where name = 'JumpIchiban';

update providers
set search_url_template = 'https://sukezaemononlinestore.com/search?q={q}&type=product'
where name = 'Sukezaemon';

update providers
set search_url_template = 'https://tcg-corner.com/search?q={q}&type=product'
where name = 'TCG Corner';

update providers
set search_url_template = 'https://www.fujicardshop.com/?s={q}&post_type=product'
where name = 'Fuji Card Shop';

update providers
set search_url_template = 'https://kanzengames.com/search?q={q}&type=product'
where name = 'KanZenGames';
