/**
 * Smoke test for OP set code extraction. Run: node scripts/test-op-set-code.mjs
 */
import { extractOpSetCode } from "../lib/sources/cardmarket/extract-set-code.ts";

const cases = [
  ["OP-16 The Moment of Decisive Battle", "OP16", "OP-16"],
  ["EB-04 EGGHEAD CRISIS", "EB04", "EB-04"],
  ["PRB-02 THE BEST vol.2", "PRB02", "PRB-02"],
  ["Some random product", null, null],
];

for (const [title, sku, expected] of cases) {
  const got = extractOpSetCode(title, sku);
  if (got !== expected) {
    console.error("FAIL", { title, sku, expected, got });
    process.exit(1);
  }
}

console.log("OK — OP set code extraction passed");
