/**
 * One Piece booster box slugs on Cardmarket (Italian locale).
 * Paths are relative to /it/OnePiece/Products/Booster-Boxes/
 *
 * JP wholesale boxes are matched to the closest Cardmarket listing
 * (usually *-JP … Non-English or Asia Region Legal). Slugs are best-effort;
 * override in `wholesale_cardmarket_links` if a link 404s.
 */
export const CARDMARKET_IT_BOOSTER_BOX_BASE =
  "https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes";

/** Static fallback when DB migration not applied yet. */
export const OP_BOOSTER_BOX_SLUGS: Record<string, string> = {
  "OP-01": "OP01-JP-Romance-Dawn-Booster-Box-Non-English",
  "OP-02": "OP02-JP-Paramount-War-Booster-Box-Non-English",
  "OP-03": "OP03-JP-Pillars-of-Strength-Booster-Box-Non-English",
  "OP-04": "OP04-JP-Kingdoms-of-Intrigue-Booster-Box-Non-English",
  "OP-05": "OP05-JP-Awakening-of-the-New-Era-Booster-Box-Non-English",
  "OP-06": "OP06-JP-Wings-of-the-Captain-Booster-Box-Non-English",
  "OP-07": "OP07-JP-500-Years-into-the-Future-Booster-Box-Non-English",
  "OP-08": "OP08-JP-Two-Legends-Booster-Box-Non-English",
  "OP-09": "OP09-JP-Emperors-in-the-New-World-Booster-Box-Non-English",
  "OP-10": "OP10-JP-Royal-Blood-Booster-Box-Non-English",
  "OP-11": "OP11-JP-A-Fist-of-Divine-Speed-Booster-Box-Non-English",
  "OP-12": "OP12-JP-Legacy-of-the-Master-Booster-Box-Non-English",
  "OP-13": "OP13-JP-Carrying-on-his-Will-Booster-Box-Non-English",
  "OP-14": "OP14-JP-The-Azure-Seas-Seven-Booster-Box-Asia-Region-Legal",
  "OP-15": "OP15-JP-Adventure-on-Kamis-Island-Booster-Box-Asia-Region-Legal",
  "OP-16": "OP16-Booster-Box",
  "OP-17": "OP17-Booster-Box",
  "EB-01": "EB01-JP-Memorial-Collection-Booster-Box-Non-English",
  "EB-02": "EB02-JP-Anime-25th-Collection-Booster-Box-Non-English",
  "EB-03": "EB03-JP-Heroines-Edition-Booster-Box-Asia-Region-Legal",
  "EB-04": "EB04-JP-Egghead-Crisis-Booster-Box-Asia-Region-Legal",
  "PRB-01": "PRB01-JP-The-Best-Booster-Box-Non-English",
  "PRB-02": "PRB02-The-Best-Vol-2-Booster-Box-Non-English",
};

export function cardmarketBoosterBoxUrl(slug: string): string {
  return `${CARDMARKET_IT_BOOSTER_BOX_BASE}/${slug}`;
}
