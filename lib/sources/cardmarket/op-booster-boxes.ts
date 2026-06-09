/**
 * One Piece booster box links on Cardmarket.
 *
 * Cardmarket builds per-product slugs inconsistently (some use the set code
 * like `OP17-Booster-Box`, others the full name like
 * `Adventure-on-Kamis-Island-Booster-Box`), so guessing exact slugs is
 * unreliable. Instead we link to the Booster-Boxes listing filtered by the set
 * code via `?searchString=`, which always resolves and shows both the JP
 * (Non-English / Asia Region Legal) and EN variants for the buyer to pick.
 *
 * Italian locale because the supplier ships to Italy. Exact product pages can
 * still be pinned per set code in the `wholesale_cardmarket_links` table.
 */
export const CARDMARKET_IT_BOOSTER_BOX_BASE =
  "https://www.cardmarket.com/it/OnePiece/Products/Booster-Boxes";

/** Cardmarket uses un-dashed set codes in titles (OP16, EB04, PRB01). */
function toCardmarketCode(setCode: string): string {
  return setCode.replace("-", "");
}

/** Booster-Boxes search filtered to a set code, e.g. OP-16 -> ?searchString=OP16. */
export function cardmarketSearchUrl(setCode: string): string {
  const code = toCardmarketCode(setCode);
  return `${CARDMARKET_IT_BOOSTER_BOX_BASE}?searchString=${encodeURIComponent(code)}`;
}
