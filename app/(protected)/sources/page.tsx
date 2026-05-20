import { HuntBySet } from "@/components/HuntBySet";
import {
  groupProvidersByTier,
  latestListingsForProvider,
  listProviders,
} from "@/lib/sources/queries";
import {
  formatListingPrice,
  formatObservedAge,
  statusClass,
  statusLabel,
  tierLabel,
  tierShort,
} from "@/lib/sources/format";
import { TIER_GUIDES, googleTranslateUrl } from "@/lib/sources/resources";
import type { ProviderListingRow } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

const HIGHLIGHT_SETS = ["OP-15", "OP-16"];

export default async function SourcesPage() {
  let providers: Awaited<ReturnType<typeof listProviders>> = [];
  let error: string | null = null;
  const latestByProvider = new Map<string, ProviderListingRow[]>();

  try {
    providers = await listProviders(true);
    if (providers.length === 0) {
      providers = await listProviders(false);
    }
    await Promise.all(
      providers.map(async (p) => {
        const latest = await latestListingsForProvider(p.id, HIGHLIGHT_SETS);
        latestByProvider.set(p.id, latest);
      }),
    );
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load sources";
  }

  const grouped = groupProvidersByTier(providers);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gold">Sources</h1>
          <p className="text-sm text-muted">
            Find sealed OP TCG <span className="text-foreground">boxes &amp; cases</span>{" "}
            on Japanese channels. Searches are pre-filtered to sealed product —
            no singles or graded cards.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/sources/cheatsheet"
            className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
          >
            JP cheatsheet
          </Link>
          <Link
            href="/sources/compare"
            className="rounded-lg border border-card-border px-4 py-2 text-sm font-medium text-muted hover:text-foreground"
          >
            Compare prices
          </Link>
          <Link
            href="/sources/new"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Add provider
          </Link>
        </div>
      </div>

      <HuntBySet providers={providers} />

      <div className="rounded-xl border border-card-border bg-card p-4 text-sm">
        <p className="font-medium text-gold">New to JP sourcing?</p>
        <p className="mt-1 text-muted">
          Open the{" "}
          <Link href="/sources/cheatsheet" className="text-gold hover:underline">
            JP cheatsheet
          </Link>{" "}
          for tier workflows, JP search terms, and trusted external resources
          (Bandai calendar, Wise card, customs notes).
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
          {error}. Run migration{" "}
          <code className="text-xs">004_providers.sql</code> in Supabase.
        </p>
      )}

      {[...grouped.entries()].map(([tierNum, tierProviders]) => {
        const tier = tierProviders[0]?.tier;
        if (!tier) return null;

        const guide = TIER_GUIDES[tier];

        return (
          <section key={tierNum}>
            <div className="mb-3">
              <h2 className="text-lg font-semibold">
                {tierShort(tier)} — {tierLabel(tier)}
              </h2>
              <p className="mt-1 text-sm text-muted">{guide.body}</p>
              <p className="mt-1 text-xs text-muted">
                <span className="text-foreground">When to use: </span>
                {guide.whenToUse}
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {tierProviders.map((provider) => {
                const latest = latestByProvider.get(provider.id) ?? [];
                const browseUrl = provider.category_url ?? provider.url;
                const translateTarget = googleTranslateUrl(browseUrl);
                return (
                  <div
                    key={provider.id}
                    className="rounded-xl border border-card-border bg-card p-4"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <Link
                          href={`/sources/${provider.id}`}
                          className="font-semibold text-gold hover:underline"
                        >
                          {provider.name}
                        </Link>
                        {provider.country && (
                          <p className="text-xs text-muted">{provider.country}</p>
                        )}
                      </div>
                      {provider.rating != null && (
                        <span className="text-sm text-muted">
                          ★ {provider.rating}/5
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {browseUrl && (
                        <a
                          href={browseUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-card-border px-2.5 py-1 text-xs text-gold hover:text-foreground"
                        >
                          {provider.category_url ? "Browse OP sealed" : "Open site"} →
                        </a>
                      )}
                      {translateTarget && provider.language === "Japanese" && (
                        <a
                          href={translateTarget}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-card-border px-2.5 py-1 text-xs text-muted hover:text-foreground"
                        >
                          Auto-translate
                        </a>
                      )}
                    </div>

                    {provider.notes && (
                      <p className="mt-2 line-clamp-2 text-xs text-muted">
                        {provider.notes}
                      </p>
                    )}

                    {latest.length > 0 ? (
                      <ul className="mt-3 space-y-1 border-t border-card-border pt-3 text-xs">
                        {latest.map((l) => (
                          <li key={l.id} className="flex flex-wrap items-center gap-2">
                            <span className="font-medium">{l.set_code}</span>
                            <span className="text-muted">
                              {formatListingPrice(l.price, l.currency)}
                            </span>
                            <span
                              className={`rounded border px-1.5 py-0.5 ${statusClass(l.status)}`}
                            >
                              {statusLabel(l.status)}
                            </span>
                            <span className="text-muted">
                              {formatObservedAge(l.observed_at)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-xs text-muted">No observations yet</p>
                    )}

                    <div className="mt-3 flex flex-wrap gap-3">
                      <Link
                        href={`/sources/${provider.id}`}
                        className="text-xs text-gold hover:underline"
                      >
                        Details & how to buy →
                      </Link>
                      <Link
                        href={`/sources/${provider.id}#add-observation`}
                        className="text-xs text-muted hover:underline"
                      >
                        Add observation
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
