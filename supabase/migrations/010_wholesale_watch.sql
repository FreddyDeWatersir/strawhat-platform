-- Straw Hat Platform — TCG Wholesale HQ watch (2026-06-09)
-- Run in SQL Editor after 009_supply_consolidation.sql
--
-- Dedicated tables for Shopify variant-level stock/price tracking.
-- Separate from provider_listings (set-code-centric OP observations).

do $$ begin
  create type wholesale_game as enum ('one_piece', 'pokemon');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type wholesale_change_type as enum (
    'new',
    'restock',
    'sold_out',
    'price_up',
    'price_down'
  );
exception
  when duplicate_object then null;
end $$;

create table if not exists wholesale_listings (
  id uuid primary key default gen_random_uuid(),
  variant_id bigint not null,
  product_id bigint not null,
  sku text,
  title text not null,
  game wholesale_game not null,
  category text,
  price numeric,
  compare_at_price numeric,
  currency text not null default 'AUD',
  available boolean not null default false,
  source_url text,
  observed_at timestamptz not null default now()
);

create table if not exists wholesale_changes (
  id uuid primary key default gen_random_uuid(),
  variant_id bigint not null,
  title text not null,
  game wholesale_game not null,
  change_type wholesale_change_type not null,
  old_value text,
  new_value text,
  source_url text,
  detected_at timestamptz not null default now(),
  notified_at timestamptz
);

create index if not exists wholesale_listings_variant_observed_idx
  on wholesale_listings (variant_id, observed_at desc);

create index if not exists wholesale_listings_game_idx
  on wholesale_listings (game);

create index if not exists wholesale_changes_detected_idx
  on wholesale_changes (detected_at desc);

create index if not exists wholesale_changes_unnotified_idx
  on wholesale_changes (notified_at)
  where notified_at is null;

-- Seed TCG Wholesale HQ provider (idempotent)
insert into providers (
  name,
  url,
  tier,
  country,
  language,
  ships_internationally,
  payment_methods,
  category_url,
  notes,
  how_to_buy
)
select * from (values
  (
    'TCG Wholesale HQ',
    'https://tcgwholesalehq.com/',
    'jp_exporter'::provider_tier,
    'AU',
    'English',
    true,
    array['Credit card', 'PayPal', 'Shop Pay'],
    'https://tcgwholesalehq.com/pages/tcg-wholesale-catalogue',
    'Australian wholesale Shopify store. Daily stock/price changes. Ships to Italy. Monitor via wholesale watch feed.',
    E'**Verified 2026-06-09:** Shopify catalogue with OP + Pokemon JP sealed.\n**Tips:**\n- Quick Order page shows live stock; scraper tracks available/price via Shopify JSON.\n- Contact them for bulk case pricing before first order.'
  )
) as v(name, url, tier, country, language, ships_internationally, payment_methods, category_url, notes, how_to_buy)
where not exists (
  select 1 from providers p where p.name = v.name
);
