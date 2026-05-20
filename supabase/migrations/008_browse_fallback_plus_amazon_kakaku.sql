-- Straw Hat Platform — drop guessed search URLs, fix broken category URLs,
-- and add Amazon Japan + Kakaku.com (verified after the user reported broken links).
--
-- Run in SQL Editor after 007_sealed_only_filters.sql.
--
-- Strategy:
--   * Tier 1 raw JP retailers where I couldn't verify the in-site search URL
--     have their search_url_template set to NULL. The UI falls back to
--     category_url with a "Browse" label — always lands on a real page.
--   * Yuyu-tei category_url is fixed: /sealed/opc/ → /top/opc (the real hub).
--   * Card Rush category_url → /product-list (their all-products page).
--   * New providers seeded: Amazon Japan (raw_jp) and Kakaku.com (marketplace
--     aggregator) — both verified to surface OP-16 sealed boxes.

-- Fix broken category URLs ---------------------------------------------------
update providers
set category_url = 'https://yuyu-tei.jp/top/opc',
    search_url_template = null,
    how_to_buy = E'**Payment:** JP card / bank transfer only on direct checkout.\n**Workaround:** use a proxy (Buyee/ZenMarket) or watch their occasional EN shipping promos.\n**Tips:**\n- Hub: /top/opc. From there click into sealed products or per-set singles.\n- Very accurate stock counts; restocks happen ~11:00 JST weekdays.\n- Use the in-site search box (top right) for "未開封 OP-16" once on /top/opc.'
where name = 'Yuyu-tei';

update providers
set category_url = 'https://www.cardrush-op.jp/product-list',
    search_url_template = null
where name = 'Card Rush';

-- Drop guessed search templates for unverified Tier 1 sites ------------------
update providers set search_url_template = null
where name in ('BigWeb', 'Hareruya 2', 'Card Lab', 'Full Comp', 'Premium Bandai');

-- Add Amazon Japan (Tier 1, ships globally on many SKUs) ---------------------
insert into providers (name, url, tier, country, language, ships_internationally, payment_methods, category_url, search_url_template, notes, how_to_buy)
select * from (values
  (
    'Amazon Japan',
    'https://www.amazon.co.jp/',
    'raw_jp'::provider_tier,
    'JP',
    'Japanese / English',
    true,
    array['Credit card', 'Amazon Pay'],
    'https://www.amazon.co.jp/s?k=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+BOX&i=toys',
    'https://www.amazon.co.jp/s?k=%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0+%E6%9C%AA%E9%96%8B%E5%B0%81+{q}&i=toys',
    'Often the cheapest Tier-1 source. Confirmed OP-16 BOX listed at ¥5,280 MSRP.',
    E'**Payment:** Most foreign credit cards accepted. Switch the site to English from the language menu.\n**Ships internationally:** Many sealed TCG SKUs are eligible for Amazon Global. Check shipping eligibility on the product page.\n**Tips:**\n- "ほしい物リスト" = wishlist (track restocks).\n- "出荷元" = ships from; prefer "Amazon" over 3rd party for sealed authenticity.\n- Watch out for marketplace sellers reselling singles repackaged as BOX.'
  ),
  (
    'Kakaku.com',
    'https://kakaku.com/',
    'marketplace'::provider_tier,
    'JP',
    'Japanese',
    false,
    array['Compare only'],
    'https://search.kakaku.com/%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0%20BOX/',
    'https://search.kakaku.com/%E3%83%AF%E3%83%B3%E3%83%94%E3%83%BC%E3%82%B9%E3%82%AB%E3%83%BC%E3%83%89%E3%82%B2%E3%83%BC%E3%83%A0%20%E6%9C%AA%E9%96%8B%E5%B0%81%20{q}/',
    'JP price aggregator across Amazon, Rakuten, Yahoo Shopping. Use for instant cross-retailer price snapshot.',
    E'**Not a retailer — aggregates other JP retailers'' prices.**\n**Tips:**\n- Best place to anchor JP MSRP and current spread before buying anywhere.\n- Click through to whichever retailer has lowest price + shipping.\n- "最安価格" = lowest price across listed retailers.'
  )
) as v(name, url, tier, country, language, ships_internationally, payment_methods, category_url, search_url_template, notes, how_to_buy)
where not exists (
  select 1 from providers p where p.name = v.name
);
