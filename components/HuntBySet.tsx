"use client";

import { useState } from "react";
import type { ProviderRow } from "@/lib/supabase/server";
import { buildSearchUrl } from "@/lib/sources/resources";
import { tierShort } from "@/lib/sources/format";

const SETS = ["OP-16", "OP-15", "OP-14", "OP-13", "EB-02", "PRB-02"];

type Mode = "case" | "box";

export function HuntBySet({ providers }: { providers: ProviderRow[] }) {
  const [set, setSet] = useState("OP-16");
  const [mode, setMode] = useState<Mode>("case");

  const suffix = mode === "case" ? "カートン" : "BOX";
  const fullQuery = `${set} ${suffix}`;

  const usable = providers.filter((p) => Boolean(p.search_url_template));

  return (
    <div className="space-y-4 rounded-xl border border-card-border bg-card p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-gold">
            Find sealed boxes &amp; cases
          </h2>
          <p className="text-sm text-muted">
            Pick a set + format. Click any provider to open a pre-built JP search
            in a new tab. Searches are scoped to{" "}
            <span className="text-foreground">ワンピースカードゲーム</span> +{" "}
            <span className="text-foreground">未開封</span>{" "}
            (sealed) — singles and used product are filtered out.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {SETS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSet(s)}
            className={`rounded-lg border px-3 py-1.5 text-sm ${
              set === s
                ? "border-gold bg-background text-gold"
                : "border-card-border text-muted hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        {(["case", "box"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-lg border px-2.5 py-1 ${
              mode === m
                ? "border-gold text-gold"
                : "border-card-border text-muted hover:text-foreground"
            }`}
          >
            {m === "case" ? "Case / カートン (12 boxes)" : "Single BOX (24 packs)"}
          </button>
        ))}
      </div>

      {usable.length === 0 ? (
        <p className="text-sm text-muted">
          No providers have search templates configured yet. Run migration{" "}
          <code className="text-xs">006_search_box_tweaks.sql</code>.
        </p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {usable.map((p) => {
            const url = buildSearchUrl(p.search_url_template, fullQuery);
            return (
              <a
                key={p.id}
                href={url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  if (!url) e.preventDefault();
                }}
                className="flex items-start justify-between gap-2 rounded-lg border border-card-border bg-background px-3 py-2 text-sm hover:border-gold"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-gold">{p.name}</p>
                  <p className="text-xs text-muted">{tierShort(p.tier)}</p>
                </div>
                <span className="text-xs text-muted">Open →</span>
              </a>
            );
          })}
        </div>
      )}

      <p className="text-xs text-muted">
        Tip: open 3–4 providers from different tiers, note prices on each, then
        log them as observations on the provider page.
      </p>
    </div>
  );
}
