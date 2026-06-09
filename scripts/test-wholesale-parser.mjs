/**
 * Quick parser smoke test (no network). Run: node scripts/test-wholesale-parser.mjs
 */
import { parseShopifyProducts } from "../lib/sources/scrapers/tcgwholesalehq.ts";

const fixture = {
  products: [
    {
      id: 9475650486412,
      title: "OP-16 The Moment of Decisive Battle",
      handle: "op-16-the-moment-of-decisive-battle-booster-box-japanese",
      tags: ["one-piece-booster-box"],
      variants: [
        {
          id: 50524979265676,
          product_id: 9475650486412,
          title: "Sealed",
          sku: "OP16",
          available: true,
          price: "146.83",
          compare_at_price: null,
        },
        {
          id: 50524979298444,
          product_id: 9475650486412,
          title: "Case",
          sku: "OP16Case",
          available: false,
          price: "2139.28",
          compare_at_price: null,
        },
      ],
    },
    {
      id: 9063554351244,
      title: "Pokemon 151 Booster Box",
      handle: "pokemon-151-booster-box",
      tags: ["pokemon-booster-box"],
      variants: [
        {
          id: 46881362215052,
          product_id: 9063554351244,
          title: "Sealed",
          sku: "PKM151",
          available: true,
          price: "100.16",
          compare_at_price: "120.00",
        },
      ],
    },
  ],
};

const results = parseShopifyProducts(
  fixture.products.slice(0, 1),
  "one_piece",
  "One Piece Booster Boxes",
);

if (results.length !== 2) {
  console.error("expected 2 OP variants, got", results.length, results);
  process.exit(1);
}

const sealed = results.find((r) => r.sku === "OP16");
const caseVariant = results.find((r) => r.sku === "OP16Case");

if (!sealed || sealed.price !== 146.83 || !sealed.available) {
  console.error("sealed variant parse failed", sealed);
  process.exit(1);
}

if (!caseVariant || caseVariant.price !== 2139.28 || caseVariant.available) {
  console.error("case variant parse failed", caseVariant);
  process.exit(1);
}

if (!sealed.title.includes("(Sealed)")) {
  console.error("expected variant title suffix", sealed.title);
  process.exit(1);
}

const pokemonResults = parseShopifyProducts(
  fixture.products.slice(1),
  "pokemon",
  "Pokemon Booster Boxes",
);

if (pokemonResults.length !== 1 || pokemonResults[0].game !== "pokemon") {
  console.error("pokemon parse failed", pokemonResults);
  process.exit(1);
}

if (pokemonResults[0].compare_at_price !== 120) {
  console.error("compare_at_price parse failed", pokemonResults[0]);
  process.exit(1);
}

console.log("OK — wholesale parser smoke test passed");
