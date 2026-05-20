import { AddListingForm } from "@/components/AddListingForm";
import { MarkdownLite } from "@/components/MarkdownLite";
import { ProviderEditForm } from "@/components/ProviderEditForm";
import { ProviderSearchBox } from "@/components/ProviderSearchBox";
import {
  formatListingPrice,
  formatObservedAge,
  productTypeLabel,
  statusClass,
  statusLabel,
  tierLabel,
} from "@/lib/sources/format";
import { TIER_GUIDES, googleTranslateUrl } from "@/lib/sources/resources";
import { getProvider, listListingsForProvider } from "@/lib/sources/queries";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProviderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const provider = await getProvider(id);

  if (!provider) {
    notFound();
  }

  const listings = await listListingsForProvider(id).catch(() => []);
  const browseUrl = provider.category_url ?? provider.url;
  const translateBrowse = googleTranslateUrl(browseUrl);
  const translateSite = googleTranslateUrl(provider.url);
  const guide = TIER_GUIDES[provider.tier];

  return (
    <div className="space-y-8">
      <div>
        <Link href="/sources" className="text-sm text-gold hover:underline">
          ← Sources
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gold">{provider.name}</h1>
            <p className="text-sm text-muted">
              {tierLabel(provider.tier)}
              {provider.country ? ` · ${provider.country}` : ""}
              {!provider.is_active && " · Inactive"}
            </p>
          </div>
          <ProviderEditForm provider={provider} />
        </div>
      </div>

      <div className="rounded-xl border border-card-border bg-card p-4 text-sm">
        <p className="font-medium text-gold">{guide.headline}</p>
        <p className="mt-1 text-muted">{guide.whenToUse}</p>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Open the site</h2>
        <div className="flex flex-wrap gap-2">
          {provider.category_url && (
            <a
              href={provider.category_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-accent px-3 py-1.5 text-sm font-medium text-white hover:bg-accent-hover"
            >
              Browse OP sealed (JP) →
            </a>
          )}
          {provider.url && (
            <a
              href={provider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-card-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
            >
              Homepage →
            </a>
          )}
          {translateBrowse && (
            <a
              href={translateBrowse}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-card-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
            >
              Auto-translate browse page
            </a>
          )}
          {translateSite && translateSite !== translateBrowse && (
            <a
              href={translateSite}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-card-border px-3 py-1.5 text-sm text-muted hover:text-foreground"
            >
              Auto-translate homepage
            </a>
          )}
        </div>
      </div>

      <div className="space-y-3 rounded-xl border border-card-border bg-card p-4">
        <h2 className="text-lg font-semibold">Quick search on this provider</h2>
        <ProviderSearchBox template={provider.search_url_template} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card p-4 text-sm">
          <h2 className="mb-2 text-lg font-semibold">At a glance</h2>
          {provider.language && (
            <p className="mt-1">
              <span className="text-muted">Language: </span>
              {provider.language}
            </p>
          )}
          <p className="mt-1">
            <span className="text-muted">Ships internationally: </span>
            {provider.ships_internationally ? "Yes" : "No"}
          </p>
          {(provider.payment_methods?.length ?? 0) > 0 && (
            <p className="mt-1">
              <span className="text-muted">Payment: </span>
              {provider.payment_methods.join(", ")}
            </p>
          )}
          {provider.rating != null && (
            <p className="mt-1">
              <span className="text-muted">Rating: </span>★ {provider.rating}/5
            </p>
          )}
          {provider.notes && (
            <p className="mt-3 whitespace-pre-wrap text-muted">{provider.notes}</p>
          )}
        </div>

        <div className="rounded-xl border border-card-border bg-card p-4">
          <h2 className="mb-2 text-lg font-semibold">How to buy</h2>
          {provider.how_to_buy ? (
            <MarkdownLite text={provider.how_to_buy} />
          ) : (
            <p className="text-sm text-muted">
              No how-to-buy guide yet. Click <span className="text-foreground">Edit provider</span>{" "}
              to add one — payment, shipping quirks, JP search tips.
            </p>
          )}
        </div>
      </div>

      <div id="add-observation">
        <AddListingForm providerId={provider.id} />
      </div>

      <div>
        <h2 className="mb-3 text-lg font-semibold">Observation history</h2>
        {listings.length === 0 ? (
          <p className="rounded-xl border border-card-border bg-card p-4 text-sm text-muted">
            No observations yet. Add one above while browsing their site.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead>
                <tr className="border-b border-card-border text-muted">
                  <th className="px-4 py-3 font-medium">When</th>
                  <th className="px-4 py-3 font-medium">Set</th>
                  <th className="px-4 py-3 font-medium">Type</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Link</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((l) => (
                  <tr key={l.id} className="border-b border-card-border/60">
                    <td className="px-4 py-3 text-muted">
                      {new Date(l.observed_at).toLocaleDateString()}
                      <span className="ml-1 text-xs">
                        ({formatObservedAge(l.observed_at)})
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{l.set_code}</td>
                    <td className="px-4 py-3">{productTypeLabel(l.product_type)}</td>
                    <td className="px-4 py-3">
                      {formatListingPrice(l.price, l.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded border px-2 py-0.5 text-xs ${statusClass(l.status)}`}
                      >
                        {statusLabel(l.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {l.source_url ? (
                        <a
                          href={l.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gold hover:underline"
                        >
                          Open
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted">{l.notes ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
