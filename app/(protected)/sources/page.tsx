import { RefreshWholesaleButton } from "@/components/RefreshWholesaleButton";
import {
  formatAudPrice,
  formatObservedAge,
  wholesaleChangeClass,
  wholesaleChangeLabel,
  wholesaleGameLabel,
} from "@/lib/sources/format";
import {
  latestWholesaleListings,
  recentWholesaleChanges,
} from "@/lib/sources/wholesale/queries";

export const dynamic = "force-dynamic";

export default async function SourcesPage() {
  let error: string | null = null;
  let listings: Awaited<ReturnType<typeof latestWholesaleListings>> = [];
  let changes: Awaited<ReturnType<typeof recentWholesaleChanges>> = [];

  try {
    listings = await latestWholesaleListings();
    changes = await recentWholesaleChanges(30);
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load wholesale data";
  }

  const inStock = listings.filter((l) => l.available);
  const outOfStock = listings.filter((l) => !l.available);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gold">
            TCG Wholesale HQ
          </h1>
          <p className="text-sm text-muted">
            One Piece + Pokemon catalogue from{" "}
            <a
              href="https://tcgwholesalehq.com/pages/tcg-wholesale-catalogue"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              tcgwholesalehq.com
            </a>
            . Tracks restocks, sold-outs, and price changes. Daily cron + manual
            check. Discord alerts when configured.
          </p>
        </div>
        <RefreshWholesaleButton />
      </div>

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
          {error}. Run migration{" "}
          <code className="text-xs">010_wholesale_watch.sql</code> in Supabase.
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

      <section>
        <h2 className="text-lg font-semibold">Current catalogue</h2>
        {listings.length === 0 ? (
          <p className="mt-3 rounded-xl border border-card-border bg-card p-6 text-sm text-muted">
            No snapshots yet. Run a check to populate the catalogue.
          </p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-xl border border-card-border bg-card">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-card-border text-muted">
                  <th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Game</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Stock</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                </tr>
              </thead>
              <tbody>
                {[...listings]
                  .sort((a, b) => {
                    if (a.available !== b.available) {
                      return a.available ? -1 : 1;
                    }
                    return a.title.localeCompare(b.title);
                  })
                  .map((listing) => (
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
                      <td className="px-4 py-3 text-muted">
                        {wholesaleGameLabel(listing.game)}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted">
                        {listing.category ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatAudPrice(
                          listing.price == null ? null : Number(listing.price),
                        )}
                      </td>
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
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
