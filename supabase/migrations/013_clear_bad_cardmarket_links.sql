-- Straw Hat Platform — clear unverified Cardmarket link guesses (2026-06-09)
-- Run in SQL Editor after 012_cardmarket_links.sql
--
-- An earlier version of 012 seeded best-effort product slugs that were often
-- wrong. The app now generates reliable Cardmarket search URLs from the set
-- code, so those guessed rows must be removed to stop them overriding the
-- generated links. Re-add rows here only to pin a verified exact product page.

truncate table wholesale_cardmarket_links;
