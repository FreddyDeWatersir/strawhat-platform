"use client";

import { useState } from "react";
import { buildSearchUrl } from "@/lib/sources/resources";

const SET_SUGGESTIONS = ["OP-16", "OP-15", "OP-14", "EB-02", "PRB-02"];

type Mode = "case" | "box";

export function ProviderSearchBox({
  template,
  categoryUrl,
}: {
  template: string | null;
  categoryUrl: string | null;
}) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("case");

  if (!template) {
    return (
      <div className="space-y-2 text-sm">
        <p className="text-muted">
          No reliable in-site search for this provider. Open the category page
          and use their own on-site search bar from there.
        </p>
        {categoryUrl ? (
          <a
            href={categoryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
          >
            Browse OP TCG hub →
          </a>
        ) : (
          <p className="text-xs text-muted">
            Set a category URL via <span className="text-foreground">Edit</span>.
          </p>
        )}
      </div>
    );
  }

  function fullQuery(base: string): string {
    const trimmed = base.trim();
    if (!trimmed) return "";
    if (mode === "case") return `${trimmed} カートン`;
    return `${trimmed} BOX`;
  }

  const url = buildSearchUrl(template, fullQuery(query));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">
        Sealed boxes and cases only — singles are filtered out via{" "}
        <span className="text-foreground">未開封</span>
        {" "}+ category pinning.
      </p>
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-muted">I want:</span>
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
            {m === "case"
              ? "Case / カートン (12 boxes)"
              : "Single BOX (24 packs)"}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="self-center text-xs text-muted">One-click search:</span>
        {SET_SUGGESTIONS.map((s) => {
          const directUrl = buildSearchUrl(template, fullQuery(s));
          return (
            <a
              key={s}
              href={directUrl ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (!directUrl) e.preventDefault();
                setQuery(s);
              }}
              className="rounded-lg border border-card-border bg-background px-2.5 py-1 text-xs text-gold hover:border-gold"
            >
              {s} →
            </a>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Custom search (set code or JP keyword)"
          className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
        />
        <a
          href={url ?? "#"}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            if (!url) e.preventDefault();
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            url
              ? "bg-accent text-white hover:bg-accent-hover"
              : "cursor-not-allowed bg-card-border text-muted"
          }`}
        >
          Search →
        </a>
      </div>

      {url && (
        <p className="truncate text-xs text-muted">
          Will open: <span className="text-foreground">{url}</span>
        </p>
      )}
    </div>
  );
}
