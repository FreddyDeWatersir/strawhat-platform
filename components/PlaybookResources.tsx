import Link from "next/link";
import {
  CATEGORY_META,
  PLAYBOOK_CATEGORIES_DEFAULT,
  type ResourceCategory,
  resourcesByCategories,
} from "@/lib/sources/resources";

function ResourceTile({
  title,
  url,
  description,
}: {
  title: string;
  url: string;
  description: string;
}) {
  const isInternal = url.startsWith("/");

  const className =
    "rounded-lg border border-card-border bg-card p-3 transition-colors hover:border-gold";

  if (isInternal) {
    return (
      <Link href={url} className={className}>
        <p className="text-sm font-medium text-gold">{title}</p>
        <p className="mt-1 line-clamp-2 text-xs text-muted">{description}</p>
      </Link>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      <p className="text-sm font-medium text-gold">{title}</p>
      <p className="mt-1 line-clamp-2 text-xs text-muted">{description}</p>
      <p className="mt-1 truncate text-[10px] text-muted/80">{url}</p>
    </a>
  );
}

export function PlaybookResources({
  categories = PLAYBOOK_CATEGORIES_DEFAULT,
  showMoreLink = true,
}: {
  categories?: ResourceCategory[];
  showMoreLink?: boolean;
}) {
  const groups = resourcesByCategories(categories);

  return (
    <section className="space-y-4 rounded-xl border border-card-border bg-card/50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-gold">Playbook resources</h2>
          <p className="text-sm text-muted">
            Verified links for OP-16 calibration, OP-17/18 monitoring, and proxy
            setup. Full list on the{" "}
            <Link href="/sources/cheatsheet" className="text-gold hover:underline">
              cheatsheet
            </Link>
            .
          </p>
        </div>
        <Link
          href="/docs/supply-strategy"
          className="rounded-lg border border-card-border px-3 py-1.5 text-xs text-gold hover:text-foreground"
        >
          Supply strategy →
        </Link>
      </div>

      {groups.map(({ category, resources }) => {
        const meta = CATEGORY_META[category];
        return (
          <div key={category}>
            <h3 className="text-sm font-semibold text-foreground">{meta.label}</h3>
            <p className="text-xs text-muted">{meta.blurb}</p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {resources.map((r) => (
                <ResourceTile
                  key={`${category}-${r.url}`}
                  title={r.title}
                  url={r.url}
                  description={r.description}
                />
              ))}
            </div>
          </div>
        );
      })}

      {showMoreLink && (
        <p className="text-xs text-muted">
          More categories (JP retail, tools, community):{" "}
          <Link href="/sources/cheatsheet" className="text-gold hover:underline">
            open cheatsheet
          </Link>
        </p>
      )}
    </section>
  );
}

/** All categories for cheatsheet page */
export function PlaybookResourcesFull() {
  const allCategories = (
    Object.keys(CATEGORY_META) as ResourceCategory[]
  ).sort((a, b) => CATEGORY_META[a].order - CATEGORY_META[b].order);

  return <PlaybookResources categories={allCategories} showMoreLink={false} />;
}
