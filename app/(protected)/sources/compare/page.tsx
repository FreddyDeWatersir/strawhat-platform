import { CompareFilters } from "@/components/CompareFilters";
import {
  buildCompareMatrix,
  latestListingsBySet,
  listProviders,
} from "@/lib/sources/queries";
import {
  formatObservedAge,
  formatPriceWithEurHint,
  productTypeLabel,
  statusClass,
  statusLabel,
  tierLabel,
} from "@/lib/sources/format";
import type { ProviderTier } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{
    tier?: string;
    set?: string;
    product_type?: string;
  }>;
}) {
  const params = await searchParams;
  let error: string | null = null;
  let providers: Awaited<ReturnType<typeof listProviders>> = [];
  let latest: Awaited<ReturnType<typeof latestListingsBySet>> = [];

  try {
    providers = await listProviders(true);
    latest = await latestListingsBySet();
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load compare data";
  }

  const tierFilter = params.tier as ProviderTier | undefined;
  const setFilter = params.set;
  const productTypeFilter = params.product_type;

  let filteredProviders = providers;
  if (tierFilter) {
    filteredProviders = filteredProviders.filter((p) => p.tier === tierFilter);
  }

  const { rows, cells } = buildCompareMatrix(filteredProviders, latest);

  let filteredRows = rows;
  if (setFilter) {
    filteredRows = filteredRows.filter((r) => r.set_code === setFilter);
  }
  if (productTypeFilter) {
    filteredRows = filteredRows.filter(
      (r) => r.product_type === productTypeFilter,
    );
  }

  const allSets = [...new Set(rows.map((r) => r.set_code))].sort();
  const allProductTypes = [...new Set(rows.map((r) => r.product_type))].sort();

  return (
    <div className="space-y-8">
      <div>
        <Link href="/sources" className="text-sm text-gold hover:underline">
          ← Sources
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gold">Compare prices</h1>
        <p className="text-sm text-muted">
          Latest observation per provider per set. JPY shows approximate EUR hint
          (not authoritative).
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      <Suspense fallback={<p className="text-sm text-muted">Loading filters…</p>}>
        <CompareFilters sets={allSets} productTypes={allProductTypes} />
      </Suspense>

      {filteredRows.length === 0 ? (
        <p className="rounded-xl border border-card-border bg-card p-6 text-sm text-muted">
          No observations to compare yet. Visit a provider, record a price on
          their detail page, then return here.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead>
              <tr className="border-b border-card-border text-muted">
                <th className="sticky left-0 z-10 bg-card px-4 py-3 font-medium">
                  Set / type
                </th>
                {filteredProviders.map((p) => (
                  <th key={p.id} className="min-w-[140px] px-4 py-3 font-medium">
                    <Link
                      href={`/sources/${p.id}`}
                      className="text-gold hover:underline"
                    >
                      {p.name}
                    </Link>
                    <span className="mt-0.5 block text-xs font-normal text-muted">
                      {tierLabel(p.tier)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => (
                <tr
                  key={`${row.set_code}-${row.product_type}`}
                  className="border-b border-card-border/60"
                >
                  <td className="sticky left-0 z-10 bg-card px-4 py-3 font-medium">
                    {row.set_code}
                    <span className="block text-xs font-normal text-muted">
                      {productTypeLabel(
                        row.product_type as Parameters<typeof productTypeLabel>[0],
                      )}
                    </span>
                  </td>
                  {filteredProviders.map((p) => {
                    const cellKey = `${row.set_code}\0${row.product_type}\0${p.id}`;
                    const listing = cells.get(cellKey);
                    return (
                      <td key={p.id} className="px-4 py-3 align-top">
                        {listing ? (
                          <div className="space-y-1">
                            <p className="font-medium">
                              {formatPriceWithEurHint(
                                listing.price,
                                listing.currency,
                              )}
                            </p>
                            <span
                              className={`inline-block rounded border px-1.5 py-0.5 text-xs ${statusClass(listing.status)}`}
                            >
                              {statusLabel(listing.status)}
                            </span>
                            <p className="text-xs text-muted">
                              {formatObservedAge(listing.observed_at)}
                            </p>
                            {listing.source_url && (
                              <a
                                href={listing.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs text-gold hover:underline"
                              >
                                Link
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
