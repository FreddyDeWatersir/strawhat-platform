-- Straw Hat Platform — supply consolidation (2026-05-21)
-- Run in SQL Editor after 008_browse_fallback_plus_amazon_kakaku.sql
--
-- * Rename provider_tier italian_reseller → eu_reseller
-- * Deactivate broken / irrelevant Tier 1 retailers
-- * Fix Card Rush sealed BOX category URL
-- * Reclassify TCG Corner → eu_reseller; deactivate KanZenGames
-- * Seed Card Cosmos, Mirai Cards, Samurai Sword Tokyo, Anime Yokocho, Bustones
-- * Refresh category_url + notes for verified JP/EU operators

alter type provider_tier rename value 'italian_reseller' to 'eu_reseller';

-- Deactivate Tier 1 retailers without usable sealed BOX browse (HANDOFF 2026-05-21)
update providers set is_active = false
where name in (
  'Surugaya',
  'BigWeb',
  'Hareruya 2',
  'Card Lab',
  'Full Comp',
  'Premium Bandai'
);

update providers
set category_url = 'https://www.cardrush-op.jp/product-list/4',
    notes = 'OP-only site. Sealed BOX category (/product-list/4). Best Tier-1 scrape target when in stock.'
where name = 'Card Rush';

-- Reclassify + deactivate Tier 4 adjustments
update providers
set tier = 'eu_reseller'::provider_tier,
    country = 'PL',
    category_url = 'https://tcg-corner.com/it/collections/one-piece-pre-order',
    notes = 'Poland/EU retailer. Verified OP-17 JP preorder pipeline (sold out Apr 2026). Monitor for second-wave.',
    how_to_buy = E'**Verified 2026-05-21:** Listed OP-17 JP case preorders before release (now sold out).\n**Ships to Italy** from EU — VAT typically at checkout.\n**Tips:**\n- Subscribe to newsletter for OP-18 JP alerts.\n- Italian storefront: /it/collections/one-piece-pre-order'
where name = 'TCG Corner';

update providers set is_active = false where name = 'KanZenGames';

update providers
set category_url = 'https://www.fujicardshop.com/collections/one-piece-card-game',
    notes = 'JP-based. OP-16 case listed pre-release. Expect OP-17 listing ~1 month before Aug 2026 release.',
    how_to_buy = E'**Verified 2026-05-21:** Ships FedEx/DHL/UPS to Italy. VAT ~22% at Italian customs (DDU).\n**Tips:**\n- Watch newsletter + Instagram for new OP listings.\n- Case pre-orders ship on scheduled date (see product page).'
where name = 'Fuji Card Shop';

update providers
set category_url = 'https://jumpichiban.com/collections/one-piece-card-game',
    notes = 'JP-based (FedEx). DDP "No Customs or Fees in EU" option available. Strong pre-order track record.',
    how_to_buy = E'**Verified 2026-05-21:** Select DDP shipping for all-in EU price.\n**Italian locale:** jumpichiban.com/it/\n**Tips:**\n- OP-16 listed months before release; expect OP-17 in late June/July.'
where name = 'JumpIchiban';

update providers
set category_url = 'https://itsukijapan.com/collections/one-piece-games',
    notes = 'JP-based. Italian storefront (it.itsukijapan.com). DDU shipping — Italian VAT at delivery.',
    how_to_buy = E'**Verified 2026-05-21:** OP-16 BOX ~€114 pre-order.\n**Tips:**\n- DHL/FedEx 2–5 business days to Italy.'
where name = 'Itsuki Japan';

update providers
set category_url = 'https://rarecardsjapan.com/collections/one-piece-card-game',
    notes = 'HK/JP sourced. Trustpilot 4.5★ (634 reviews). Listed OP-16 pre-order before release.',
    how_to_buy = E'**Verified 2026-05-21:** Ships to 30+ countries including Italy.\n**Tips:**\n- VAT added by Italian customs at delivery.\n- WhatsApp support available.'
where name = 'Rare Cards Japan';

update providers
set category_url = 'https://sukezaemononlinestore.com/en/collections/booster-boxes',
    notes = 'JP-based (Chiba). Competitive pricing on older sets; OP-16 not yet listed as of May 2026.',
    how_to_buy = E'**Verified 2026-05-21:** International express shipping.\n**Tips:**\n- Watch for new OP set listings on booster-boxes collection.'
where name = 'Sukezaemon';

-- New providers
insert into providers (name, url, tier, country, language, ships_internationally, payment_methods, category_url, search_url_template, notes, how_to_buy)
select * from (values
  (
    'Card Cosmos',
    'https://cardcosmos.de/en-eu/',
    'eu_reseller'::provider_tier,
    'DE',
    'English / German',
    true,
    array['Credit card', 'PayPal', 'Klarna', 'Apple Pay'],
    'https://cardcosmos.de/en-eu/collections/one-piece-card-game',
    null::text,
    'Germany-based EU retailer. OP-17 JP preorder listed and sold out before release (Apr 2026). Best calibration purchase for OP-16.',
    E'**Verified 2026-05-21:** Trusted Shops certified. VAT included at checkout for EU.\n**Tips:**\n- Subscribe for OP-18 JP alerts.\n- OP-17 JP was ~€102/box all-in when available.'
  ),
  (
    'Mirai Cards',
    'https://www.miraicards.com/',
    'eu_reseller'::provider_tier,
    'NL',
    'English',
    true,
    array['Credit card', 'PayPal'],
    'https://www.miraicards.com/',
    null::text,
    'Netherlands EU retailer. OP-16 JP listed; may catch second-wave OP-17/18 allocations.',
    E'**Verified 2026-05-21:** Ships within EU including Italy.\n**Tips:**\n- Monitor for restock notifications.'
  ),
  (
    'Samurai Sword Tokyo',
    'https://samuraiswordtokyo.com/',
    'jp_exporter'::provider_tier,
    'JP',
    'English',
    true,
    array['Wise', 'PayPal'],
    'https://samuraiswordtokyo.com/collections/one-piece-booster-boxjp',
    null::text,
    'Licensed Tokyo dealer. JP BOX catalog through OP-15; OP-16/17 not yet listed May 2026.',
    E'**Verified 2026-05-21:** Italy in country selector. FedEx 3–5 days Europe.\n**Tips:**\n- Payment often via Wise invoice or WhatsApp.'
  ),
  (
    'Anime Yokocho',
    'https://www.animeyokocho.com/',
    'proxy'::provider_tier,
    'JP',
    'English',
    true,
    array['Stripe', 'PayPal'],
    'https://www.animeyokocho.com/buy-for-me',
    null::text,
    'Boutique personal-shopper. ONLY verified 2026 service for 店頭予約 (in-store reservation) at JP card shops.',
    E'**Verified 2026-05-21:** 15% commission (min ¥1,500, cap ¥5,000/shop). In-store visit ¥3,000–5,000 + 20% on purchase.\n**Use for:** yuyu-tei MSRP lane and OP-17 reservation requests (~late June 2026).\n**Tips:**\n- Contact before Bandai opens OP-17 reservation window.'
  ),
  (
    'Bustones',
    null::text,
    'eu_reseller'::provider_tier,
    'IT',
    'Italian',
    false,
    array['Bank transfer', 'PayPal F&F'],
    null::text,
    null::text,
    'Italian private reseller (closed-circle). No public handle found 2026-05-21. Track prices manually once referred via community.',
    E'**Not publicly indexed.** Likely Telegram/Instagram group-buy upstream.\n**Action:** Ask in Italian OP TCG Discord/Facebook groups for referral.\n**Use as:** resale price ceiling benchmark once located.'
  )
) as v(name, url, tier, country, language, ships_internationally, payment_methods, category_url, search_url_template, notes, how_to_buy)
where not exists (
  select 1 from providers p where p.name = v.name
);
