const SET_CODE_RE = /\b(OP|ST|EB|PRB)-?(\d{1,2})\b/i;

/** Extract normalized set code (e.g. OP-16) from wholesale title or SKU. */
export function extractOpSetCode(
  title: string,
  sku: string | null = null,
): string | null {
  for (const source of [title, sku ?? ""]) {
    const match = source.match(SET_CODE_RE);
    if (match) {
      const prefix = match[1].toUpperCase();
      const num = match[2].padStart(2, "0");
      return `${prefix}-${num}`;
    }
  }
  return null;
}
