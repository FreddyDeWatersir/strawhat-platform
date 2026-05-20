-- Straw Hat Platform — sourcing providers & price observations
-- Run in SQL Editor after 001_initial.sql, 002_pgvector.sql, and 003_cases.sql

do $$ begin
  create type provider_tier as enum (
    'raw_jp',
    'marketplace',
    'proxy',
    'jp_exporter',
    'italian_reseller'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type listing_product_type as enum (
    'box',
    'case',
    'starter_deck',
    'premium_booster',
    'singles'
  );
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type listing_status as enum (
    'preorder',
    'in_stock',
    'sold_out',
    'unknown'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text,
  tier provider_tier not null default 'raw_jp',
  country text,
  language text,
  ships_internationally boolean not null default false,
  payment_methods text[] default '{}',
  rating int check (rating is null or (rating >= 0 and rating <= 5)),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists provider_listings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references providers(id) on delete cascade,
  set_code text not null,
  product_type listing_product_type not null default 'case',
  price numeric,
  currency text,
  status listing_status not null default 'unknown',
  source_url text,
  notes text,
  observed_at timestamptz not null default now()
);

create index if not exists providers_tier_idx on providers (tier);
create index if not exists providers_is_active_idx on providers (is_active);
create index if not exists provider_listings_provider_id_idx on provider_listings (provider_id);
create index if not exists provider_listings_set_code_idx on provider_listings (set_code);
create index if not exists provider_listings_observed_at_idx on provider_listings (observed_at desc);

-- Seed known sourcing channels (idempotent: skip if name already exists)
insert into providers (name, url, tier, country, language, ships_internationally, payment_methods, notes)
select * from (values
  ('Surugaya', 'https://www.suruga-ya.jp/', 'raw_jp'::provider_tier, 'JP', 'Japanese', false, array['JP cards', 'conbini'], 'Major JP used/new shop. Usually needs JP payment or proxy.'),
  ('Yuyu-tei', 'https://yuyu-tei.jp/', 'raw_jp'::provider_tier, 'JP', 'Japanese', false, array['JP cards'], 'Strong singles and sealed. JP-only checkout.'),
  ('Card Rush', 'https://www.cardrush-op.jp/', 'raw_jp'::provider_tier, 'JP', 'Japanese', false, array['JP cards'], 'OP-focused JP retailer. Competitive when in stock.'),
  ('BigWeb', 'https://www.bigweb.co.jp/', 'raw_jp'::provider_tier, 'JP', 'Japanese', false, array['JP cards'], 'Large JP card marketplace. Check seller reputation.'),
  ('Hareruya 2', 'https://www.hareruya2.com/', 'raw_jp'::provider_tier, 'JP', 'Japanese', true, array['Credit card', 'PayPal'], 'Ships internationally for some products. Good for singles.'),
  ('Card Lab', 'https://www.c-labo.jp/', 'raw_jp'::provider_tier, 'JP', 'Japanese', false, array['JP cards'], 'Retail chain. Limited sealed allocation.'),
  ('Full Comp', 'https://fullcomp.jp/', 'raw_jp'::provider_tier, 'JP', 'Japanese', false, array['JP cards'], 'JP hobby shop chain.'),
  ('Premium Bandai', 'https://p-bandai.jp/', 'raw_jp'::provider_tier, 'JP', 'Japanese', true, array['Credit card'], 'Official limited products and pre-orders. Allocation lottery.'),
  ('Yahoo Auctions JP', 'https://auctions.yahoo.co.jp/', 'marketplace'::provider_tier, 'JP', 'Japanese', false, array['Via proxy'], 'Auctions — use Buyee/ZenMarket. Watch shipping + seller rating.'),
  ('Mercari JP', 'https://jp.mercari.com/', 'marketplace'::provider_tier, 'JP', 'Japanese', false, array['Via proxy'], 'C2C marketplace. Good deals but verify authenticity.'),
  ('Rakuten', 'https://www.rakuten.co.jp/', 'marketplace'::provider_tier, 'JP', 'Japanese', false, array['JP cards', 'Via proxy'], 'Various sellers. Compare shop ratings.'),
  ('Buyee', 'https://buyee.jp/', 'proxy'::provider_tier, 'JP', 'English', true, array['PayPal', 'Credit card'], 'Proxy for Yahoo/Mercari/Rakuten. Adds service + shipping fees.'),
  ('ZenMarket', 'https://zenmarket.jp/', 'proxy'::provider_tier, 'JP', 'English', true, array['PayPal', 'Credit card'], 'Proxy service with warehouse consolidation.'),
  ('FromJapan', 'https://www.fromjapan.co.jp/', 'proxy'::provider_tier, 'JP', 'English', true, array['PayPal', 'Credit card'], 'Proxy + optional personal shopper.'),
  ('Neokyo', 'https://neokyo.com/', 'proxy'::provider_tier, 'JP', 'English', true, array['PayPal', 'Credit card'], 'Proxy with EU-friendly shipping options.'),
  ('Rare Cards Japan', 'https://rarecardsjapan.com/', 'jp_exporter'::provider_tier, 'JP', 'English', true, array['PayPal', 'Credit card'], 'English-facing exporter. Higher prices, easy checkout.'),
  ('Itsuki Japan', 'https://itsukijapan.com/', 'jp_exporter'::provider_tier, 'JP', 'English', true, array['PayPal', 'Credit card'], 'Ships sealed OP product internationally.'),
  ('JumpIchiban', 'https://jumpichiban.com/', 'jp_exporter'::provider_tier, 'JP', 'English', true, array['PayPal', 'Credit card'], 'Pre-orders for upcoming sets. Compare vs raw JP.'),
  ('Sukezaemon', 'https://sukezaemononlinestore.com/', 'jp_exporter'::provider_tier, 'JP', 'English', true, array['PayPal', 'Credit card'], 'Ships from Chiba via FedEx.'),
  ('TCG Corner', 'https://tcg-corner.com/', 'jp_exporter'::provider_tier, 'JP', 'English', true, array['PayPal', 'Credit card'], 'Pre-order focused exporter.'),
  ('Fuji Card Shop', 'https://www.fujicardshop.com/', 'jp_exporter'::provider_tier, 'JP', 'English', true, array['PayPal', 'Credit card'], 'Case pre-orders. Track landed cost vs Tier 1.'),
  ('KanZenGames', 'https://kanzengames.com/', 'jp_exporter'::provider_tier, 'JP', 'English', true, array['PayPal', 'Credit card'], 'US-facing but ships internationally.'),
  ('Italian reseller (placeholder 1)', null, 'italian_reseller'::provider_tier, 'IT', 'Italian', true, array['Bank transfer', 'PayPal'], 'Edit: add the Italian contact your friend already uses.'),
  ('Italian reseller (placeholder 2)', null, 'italian_reseller'::provider_tier, 'IT', 'Italian', true, array['Bank transfer'], 'Edit: likely buying via JP proxy themselves — compare their price to Tier 1 + proxy fees.')
) as v(name, url, tier, country, language, ships_internationally, payment_methods, notes)
where not exists (
  select 1 from providers p where p.name = v.name
);
