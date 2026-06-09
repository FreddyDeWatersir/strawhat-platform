import { RefreshWholesaleButton } from "@/components/RefreshWholesaleButton";
import { getAudToEurRate } from "@/lib/fx/rate";
import {
  formatAudPrice,
  formatEurFromAud,
  formatObservedAge,
  wholesaleChangeClass,
  wholesaleChangeLabel,
  wholesaleGameLabel,
} from "@/lib/sources/format";
import type {
  WholesaleGame,
  WholesaleListingRow,
} from "@/lib/sources/scrapers/types";
import {
  cardmarketUrlForListing,
  loadCardmarketLinks,
} from "@/lib/sources/wholesale/cardmarket";
import {
  latestWholesaleListings,
  recentWholesaleChanges,
} from "@/lib/sources/wholesale/queries";

export const dynamic = "force-dynamic";

const GAME_ORDER: WholesaleGame[] = ["one_piece", "pokemon", "dragon_ball"];

function isSingle(category: string | null): boolean {
  return !!category && /single/i.test(category);
}

function sortListings(rows: WholesaleListingRow[]): WholesaleListingRow[] {
  return [...rows].sort((a, b) => {
    if (a.available !== b.available) return a.available ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
}

export default async function SourcesPage() {
  let error: string | null = null;
  let listings: WholesaleListingRow[] = [];
  let changes: Awaited<ReturnType<typeof recentWholesaleChanges>> = [];

  try {
    listings = await latestWholesaleListings();
    changes = await recentWholesaleChanges(30);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load wholesale data";
  }

  const fx = await getAudToEurRate();
  const cardmarketLinks = await loadCardmarketLinks();

  const inStock = listings.filter((l) => l.available);
  const outOfStock = listings.filter((l) => !l.available);

  const byGame = new Map<WholesaleGame, WholesaleListingRow[]>();
  for (const listing of listings) {
    const arr = byGame.get(listing.game) ?? [];
    arr.push(listing);
    byGame.set(listing.game, arr);
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gold">TCG Wholesale HQ</h1>
          <p className="text-sm text-muted">
            One Piece, Pokemon &amp; Dragon Ball from{" "}
            <a
              href="https://tcgwholesalehq.com/pages/tcg-wholesale-catalogue"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              tcgwholesalehq.com
            </a>
            . AUD prices with EUR reference. One Piece sealed boxes link to
            Cardmarket IT for manual price comparison. Daily cron + Discord when
            configured.
          </p>
        </div>
        <RefreshWholesaleButton />
      </div>

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
          {error}. Run migrations{" "}
          <code className="text-xs">010_wholesale_watch.sql</code> and{" "}
          <code className="text-xs">011_wholesale_dragon_ball.sql</code> in
          Supabase.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-card-border bg-card p-4">
          <p className="text-xs text-muted">Tracked variants</p>
          <p className="mt-1 text-2xl font-semibold">{listings.length}</p>
        </div>
        <div className="rounded-xl border border-emerald-900/50 bg-emerald-950/20 p-4">
          <p className="text-xs text-emerald-300">In stock</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-200">
            {inStock.length}
          </p>
        </div>
        <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4">
          <p className="text-xs text-red-300">Sold out</p>
          <p className="mt-1 text-2xl font-semibold text-red-200">
            {outOfStock.length}
          </p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold">Recent changes</h2>
        {changes.length === 0 ? (
          <p className="mt-3 rounded-xl border border-card-border bg-card p-6 text-sm text-muted">
            No changes recorded yet. Click &quot;Check now&quot; to scrape the
            catalogue and establish a baseline.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {changes.map((change) => (
              <li
                key={change.id}
                className="rounded-xl border border-card-border bg-card p-4 text-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{change.title}</p>
                    <p className="mt-1 text-xs text-muted">
                      {wholesaleGameLabel(change.game)} ·{" "}
                      {formatObservedAge(change.detected_at)}
                    </p>
                  </div>
                  <span
                    className={`rounded border px-2 py-0.5 text-xs ${wholesaleChangeClass(change.change_type)}`}
                  >
                    {wholesaleChangeLabel(change.change_type)}
                  </span>
                </div>
                {(change.old_value || change.new_value) && (
                  <p className="mt-2 text-xs text-muted">
                    {change.old_value ?? "—"} → {change.new_value ?? "—"}
                  </p>
                )}
                {change.source_url && (
                  <a
                    href={change.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block text-xs text-gold hover:underline"
                  >
                    View on TCG Wholesale HQ →
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-semibold">Current catalogue</h2>
          <p className="text-xs text-muted">
            EUR shown for reference · 1 AUD ≈ €{fx.rate.toFixed(3)}{" "}
            {fx.live
              ? `(ECB${fx.date ? ` ${fx.date}` : ""})`
              : "(approx — live rate unavailable)"}
          </p>
        </div>
        {listings.length === 0 ? (
          <p className="rounded-xl border border-card-border bg-card p-6 text-sm text-muted">
            No snapshots yet. Run a check to populate the catalogue.
          </p>
        ) : (
          GAME_ORDER.filter((game) => byGame.has(game)).map((game) => {
            const rows = byGame.get(game) ?? [];
            const gameInStock = rows.filter((r) => r.available).length;
            const sealed = sortListings(rows.filter((r) => !isSingle(r.category)));
            const singles = sortListings(rows.filter((r) => isSingle(r.category)));

            return (
              <div key={game} className="space-y-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-card-border pb-2">
                  <h3 className="text-base font-semibold text-gold">
                    {wholesaleGameLabel(game)}
                  </h3>
                  <span className="text-xs text-muted">
                    <span className="text-emerald-300">{gameInStock} in stock</span>{" "}
                    · {rows.length} tracked
                  </span>
                </div>

                {sealed.length > 0 && (
                  <CatalogueTable
                    label="Sealed boxes & sets"
                    rows={sealed}
                    audToEur={fx.rate}
                    cardmarketLinks={
                      game === "one_piece" ? cardmarketLinks : undefined
                    }
                  />
                )}
                {singles.length > 0 && (
                  <CatalogueTable
                    label="Singles"
                    rows={singles}
                    audToEur={fx.rate}
                  />
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}

function CatalogueTable({
  label,
  rows,
  audToEur,
  cardmarketLinks,
}: {
  label: string;
  rows: WholesaleListingRow[];
  audToEur: number;
  cardmarketLinks?: Awaited<ReturnType<typeof loadCardmarketLinks>>;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">
        {label} ({rows.length})
      </p>
      <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-card-border text-muted">
              <th className="px-4 py-3 font-medium">Product</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Price</th>
              {cardmarketLinks && (
                <th className="px-4 py-3 font-medium">Cardmarket</th>
              )}
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((listing) => {
              const cardmarketUrl = cardmarketLinks
                ? cardmarketUrlForListing(listing, cardmarketLinks)
                : null;

              return (
              <tr
                key={listing.variant_id}
                className="border-b border-card-border/60"
              >
                <td className="px-4 py-3">
                  {listing.source_url ? (
                    <a
                      href={listing.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-gold hover:underline"
                    >
                      {listing.title}
                    </a>
                  ) : (
                    <span className="font-medium">{listing.title}</span>
                  )}
                  {listing.sku && (
                    <span className="mt-0.5 block text-xs text-muted">
                      SKU: {listing.sku}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {listing.category ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <span className="font-medium">
                    {formatAudPrice(
                      listing.price == null ? null : Number(listing.price),
                    )}
                  </span>
                  {listing.price != null && (
                    <span className="mt-0.5 block text-xs text-muted">
                      {formatEurFromAud(Number(listing.price), audToEur)}
                    </span>
                  )}
                </td>
                {cardmarketLinks && (
                  <td className="px-4 py-3">
                    {cardmarketUrl ? (
                      <a
                        href={cardmarketUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gold hover:underline"
                        title="Open Cardmarket IT — check trend vs your EUR hint"
                      >
                        Compare →
                      </a>
                    ) : (
                      <span className="text-xs text-muted">—</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3">
                  <span
                    className={`rounded border px-2 py-0.5 text-xs ${
                      listing.available
                        ? "border-emerald-800 bg-emerald-950/60 text-emerald-300"
                        : "border-red-800 bg-red-950/60 text-red-300"
                    }`}
                  >
                    {listing.available ? "In stock" : "Sold out"}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-muted">
                  {formatObservedAge(listing.observed_at)}
                </td>
              </tr>
            );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
