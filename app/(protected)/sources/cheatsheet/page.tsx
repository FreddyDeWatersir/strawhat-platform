import { PlaybookResourcesFull } from "@/components/PlaybookResources";
import { JP_GLOSSARY, TIER_GUIDES } from "@/lib/sources/resources";
import { TIER_ORDER, tierShort } from "@/lib/sources/format";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function CheatsheetPage() {
  return (
    <div className="space-y-8">
      <div>
        <Link href="/sources" className="text-sm text-gold hover:underline">
          ← Sources
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gold">JP sourcing cheatsheet</h1>
        <p className="text-sm text-muted">
          The minimum survival kit for buying One Piece TCG{" "}
          <span className="text-foreground">sealed boxes &amp; cases</span> from
          Japan when you can&apos;t read Japanese. Singles are out of scope for
          now — every search in this app filters to sealed product.
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Tier workflows</h2>
        <p className="text-sm text-muted">
          Five tiers, ordered cheapest → easiest. Pick a path based on time vs
          money tradeoff.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          {TIER_ORDER.map((tier) => {
            const guide = TIER_GUIDES[tier];
            return (
              <div
                key={tier}
                className="rounded-xl border border-card-border bg-card p-4"
              >
                <p className="text-xs uppercase tracking-wide text-muted">
                  {tierShort(tier)}
                </p>
                <p className="mt-1 font-semibold text-gold">{guide.headline}</p>
                <p className="mt-2 text-sm text-muted">{guide.body}</p>
                <p className="mt-2 text-sm">
                  <span className="text-muted">When to use: </span>
                  {guide.whenToUse}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">JP ↔ EN glossary</h2>
        <p className="text-sm text-muted">
          Paste these into search bars when proxies/translators get confused.
          ワンピースカードゲーム + BOX or カートン is the most reliable query.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {JP_GLOSSARY.map((group) => (
            <div
              key={group.section}
              className="rounded-xl border border-card-border bg-card p-4"
            >
              <h3 className="mb-3 font-semibold text-gold">{group.section}</h3>
              <ul className="space-y-2 text-sm">
                {group.entries.map((entry) => (
                  <li
                    key={entry.ja}
                    className="border-b border-card-border/40 pb-2 last:border-0 last:pb-0"
                  >
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-base font-medium text-foreground">
                        {entry.ja}
                      </span>
                      {entry.romaji && (
                        <span className="text-xs italic text-muted">
                          {entry.romaji}
                        </span>
                      )}
                      <span className="text-muted">→</span>
                      <span>{entry.en}</span>
                    </div>
                    {entry.note && (
                      <p className="mt-1 text-xs text-muted">{entry.note}</p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <PlaybookResourcesFull />

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Suggested first session</h2>
        <ol className="ml-5 list-decimal space-y-1 text-sm text-muted">
          <li>
            Open <span className="text-foreground">Playbook resources → Buy now</span> on{" "}
            <Link href="/sources" className="text-gold hover:underline">/sources</Link>{" "}
            and compare Card Cosmos vs JumpIchiban (DDP) for one OP-16 calibration BOX.
          </li>
          <li>
            Subscribe to <span className="text-foreground">Watch</span> operators (TCG Corner,
            Card Cosmos, Fuji) for OP-17 second-wave alerts.
          </li>
          <li>
            Read{" "}
            <Link href="/docs/supply-strategy" className="text-gold hover:underline">
              supply strategy
            </Link>{" "}
            for the full proxy ladder and Anime Yokocho 店頭予約 request.
          </li>
          <li>
            Add the price on each provider as an observation (
            <span className="text-foreground">Add observation</span> on the detail
            page).
          </li>
          <li>
            Open{" "}
            <Link href="/sources/compare" className="text-gold hover:underline">
              /sources/compare
            </Link>{" "}
            to see the spread side by side and decide whether to go via proxy
            (Tier 3) or buy from an exporter (Tier 4).
          </li>
        </ol>
      </section>
    </div>
  );
}
