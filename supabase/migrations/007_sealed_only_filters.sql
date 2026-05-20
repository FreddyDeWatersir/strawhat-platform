-- Straw Hat Platform — make every search filter to sealed BOX / case only.
-- Run in SQL Editor after 006_search_box_tweaks.sql.
--
-- Strategy:
--   * Append 未開封 (unopened / sealed) to JP-language queries so single-card
--     lots and used product drop out.
--   * Where the platform supports a category filter, pin to OP TCG.
--   * Where the platform supports a condition filter (Mercari), pin to "new".
--   * Single-card retailers (Yuyu-tei sealed area) keep their sealed-only URL.

-- Yahoo Auctions JP — auccat=2084346152 is the OP card game category.
update providers
set search_url_template = 'https://auctions.yahoo.co.jp/search/search?auccat=2084346152&p=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+%E6%9C%AA%E9%96%8B%E5%B0%81+{q}',
    how_to_buy = E'**Payment:** Buy via Buyee/ZenMarket only — direct accounts require a JP address.\n**Searches are scoped to:** OP TCG category + 未開封 (sealed). Singles lots filtered out.\n**Tips:**\n- "即決" = Buy It Now. "残り" = time remaining.\n- "シュリンク付き" in listing = original shrink wrap (important for sealed integrity).\n- Watch seller rating and JP domestic + international shipping separately.'
where name = 'Yahoo Auctions JP';

-- Mercari JP — item_condition_id[]=1 pins to "New / Unused".
update providers
set search_url_template = 'https://jp.mercari.com/search?keyword=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0%20%E6%9C%AA%E9%96%8B%E5%B0%81%20{q}&status=on_sale&item_condition_id[]=1',
    how_to_buy = E'**Payment:** Via proxy. Direct account requires JP phone.\n**Searches are scoped to:** condition=新品/未使用 + keyword 未開封. Used and graded singles excluded.\n**Tips:**\n- Sealed boxes here are often resealed — always ask for photos of the case seal and shrink wrap.\n- "新品未開封" = new, sealed. "シュリンク付き" = with original shrink wrap.'
where name = 'Mercari JP';

-- Rakuten — keep keyword filter; no global condition filter without per-shop rules.
update providers
set search_url_template = 'https://search.rakuten.co.jp/search/mall/%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9+%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+%E6%9C%AA%E9%96%8B%E5%B0%81+{q}/'
where name = 'Rakuten';

-- Buyee — embed 未開封 + JP keyword.
update providers
set search_url_template = 'https://buyee.jp/item/search/query/%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0%20%E6%9C%AA%E9%96%8B%E5%B0%81%20{q}?translationType=1'
where name = 'Buyee';

-- ZenMarket — Yahoo Auctions wrapper with sealed keyword.
update providers
set search_url_template = 'https://zenmarket.jp/en/yahoo.aspx?q=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+%E6%9C%AA%E9%96%8B%E5%B0%81+{q}'
where name = 'ZenMarket';

-- FromJapan — Yahoo wrapper with sealed keyword.
update providers
set search_url_template = 'https://www.fromjapan.co.jp/japan/en/yahoo/search/q-%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+%E6%9C%AA%E9%96%8B%E5%B0%81+{q}/'
where name = 'FromJapan';

-- Neokyo — Yahoo Auctions wrapper with sealed keyword.
update providers
set search_url_template = 'https://neokyo.com/en/yahoo-auctions/search?q=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+%E6%9C%AA%E9%96%8B%E5%B0%81+{q}'
where name = 'Neokyo';

-- Surugaya — already category-pinned to OP TCG sealed (11202004). Keep.
-- Card Rush — single-product retailer, search is fine.
-- Yuyu-tei — points to /sealed/opc/s/{set} which is sealed-only by URL.
-- Hareruya 2 — primarily singles, but search returns sealed if available.
-- Tier 4 exporters — store-only-products parameter scopes correctly.

-- Default new provider_listings to 'case' going forward (column already defaults
-- to 'case' from migration 004; no schema change needed).
