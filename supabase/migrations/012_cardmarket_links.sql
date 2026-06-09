-- Straw Hat Platform — Cardmarket deep links for OP wholesale boxes (2026-06-09)
-- Run in SQL Editor after 011_wholesale_dragon_ball.sql
--
-- Maps OP set codes to Cardmarket IT booster-box product pages (no scraping).
-- Edit rows here if a slug 404s — takes effect without redeploy.

create table if not exists wholesale_cardmarket_links (
  set_code text primary key,
  cardmarket_url text not null,
  notes text,
  updated_at timestamptz not null default now()
);

insert into wholesale_cardmarket_links (set_code, cardmarket_url, notes)
select * from (values
  ('OP-01', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP01-JP-Romance-Dawn-Booster-Box-Non-English', 'JP Romance Dawn'),
  ('OP-02', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP02-JP-Paramount-War-Booster-Box-Non-English', 'JP Paramount War'),
  ('OP-03', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP03-JP-Pillars-of-Strength-Booster-Box-Non-English', 'JP Pillars of Strength'),
  ('OP-04', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP04-JP-Kingdoms-of-Intrigue-Booster-Box-Non-English', 'JP Kingdoms of Intrigue'),
  ('OP-05', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP05-JP-Awakening-of-the-New-Era-Booster-Box-Non-English', 'JP Awakening of the New Era'),
  ('OP-06', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP06-JP-Wings-of-the-Captain-Booster-Box-Non-English', 'JP Wings of the Captain'),
  ('OP-07', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP07-JP-500-Years-into-the-Future-Booster-Box-Non-English', 'JP 500 Years into the Future'),
  ('OP-08', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP08-JP-Two-Legends-Booster-Box-Non-English', 'JP Two Legends'),
  ('OP-09', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP09-JP-Emperors-in-the-New-World-Booster-Box-Non-English', 'JP Emperors in the New World'),
  ('OP-10', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP10-JP-Royal-Blood-Booster-Box-Non-English', 'JP Royal Blood'),
  ('OP-11', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP11-JP-A-Fist-of-Divine-Speed-Booster-Box-Non-English', 'JP A Fist of Divine Speed'),
  ('OP-12', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP12-JP-Legacy-of-the-Master-Booster-Box-Non-English', 'JP Legacy of the Master'),
  ('OP-13', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP13-JP-Carrying-on-his-Will-Booster-Box-Non-English', 'JP Carrying on his Will'),
  ('OP-14', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP14-JP-The-Azure-Seas-Seven-Booster-Box-Asia-Region-Legal', 'JP Azure Sea''s Seven'),
  ('OP-15', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP15-JP-Adventure-on-Kamis-Island-Booster-Box-Asia-Region-Legal', 'JP Adventure on Kami''s Island'),
  ('OP-16', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP16-Booster-Box', 'OP-16 — verify slug if 404'),
  ('OP-17', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/OP17-Booster-Box', 'OP-17 preorder trend'),
  ('EB-01', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/EB01-JP-Memorial-Collection-Booster-Box-Non-English', 'JP Memorial Collection'),
  ('EB-02', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/EB02-JP-Anime-25th-Collection-Booster-Box-Non-English', 'JP Anime 25th'),
  ('EB-03', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/EB03-JP-Heroines-Edition-Booster-Box-Asia-Region-Legal', 'JP Heroines Edition'),
  ('EB-04', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/EB04-JP-Egghead-Crisis-Booster-Box-Asia-Region-Legal', 'JP Egghead Crisis'),
  ('PRB-01', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/PRB01-JP-The-Best-Booster-Box-Non-English', 'JP The Best'),
  ('PRB-02', 'https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes/PRB02-The-Best-Vol-2-Booster-Box-Non-English', 'JP The Best Vol.2')
) as v(set_code, cardmarket_url, notes)
where not exists (
  select 1 from wholesale_cardmarket_links w where w.set_code = v.set_code
);
