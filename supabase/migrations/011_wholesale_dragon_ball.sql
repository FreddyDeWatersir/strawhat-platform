-- Straw Hat Platform — add Dragon Ball to wholesale watch (2026-06-09)
-- Run in SQL Editor after 010_wholesale_watch.sql
--
-- Extends the wholesale_game enum so the Dragon Ball TCG collection can be tracked.

alter type wholesale_game add value if not exists 'dragon_ball';
