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

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {providers.map((p) => {
          const searchUrl = p.search_url_template
            ? buildSearchUrl(p.search_url_template, fullQuery)
            : null;
          const url = searchUrl ?? p.category_url ?? p.url;
          const mode = searchUrl
            ? "search"
            : p.category_url
              ? "browse"
              : p.url
                ? "open"
                : "missing";
          return (
            <a
              key={p.id}
              href={url ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!url) e.preventDefault();
              }}
              className={`flex items-start justify-between gap-2 rounded-lg border border-card-border bg-background px-3 py-2 text-sm ${
                url ? "hover:border-gold" : "opacity-60"
              }`}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-gold">{p.name}</p>
                <p className="text-xs text-muted">{tierShort(p.tier)}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-muted">
                {mode === "search"
                  ? `Search ${set} →`
                  : mode === "browse"
                    ? "Browse →"
                    : mode === "open"
                      ? "Open →"
                      : "—"}
              </span>
            </a>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        <span className="text-foreground">Search</span> opens a pre-filtered{" "}
        {mode === "case" ? "case" : "BOX"} search.{" "}
        <span className="text-foreground">Browse</span> opens that provider&apos;s
        OP TCG hub (use their on-site search). Open 3–4 across tiers, log prices
        on each provider page.
      </p>
    </div>
  );
}
