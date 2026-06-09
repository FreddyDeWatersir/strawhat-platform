-- Straw Hat Platform — Cardmarket deep links for OP wholesale boxes (2026-06-09)
-- Run in SQL Editor after 011_wholesale_dragon_ball.sql
--
-- Optional per-set OVERRIDES for One Piece sealed boxes. When a set code is not
-- listed here, the app generates a reliable Cardmarket Booster-Boxes search URL
-- from the set code automatically (no slug guessing). Use this table only to
-- pin an exact product page for a set.
--
-- Example:
--   insert into wholesale_cardmarket_links (set_code, cardmarket_url)
--   values ('OP-16', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP16-Booster-Box')
--   on conflict (set_code) do update
--     set cardmarket_url = excluded.cardmarket_url, updated_at = now();

create table if not exists wholesale_cardmarket_links (
  set_code text primary key,
  cardmarket_url text not null,
  notes text,
  updated_at timestamptz not null default now()
);
