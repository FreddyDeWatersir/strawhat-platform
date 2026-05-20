"use client";

import { useState } from "react";
import { buildSearchUrl } from "@/lib/sources/resources";

const SET_SUGGESTIONS = ["OP-16", "OP-15", "OP-14", "EB-02", "PRB-02"];

export function ProviderSearchBox({
  template,
}: {
  template: string | null;
}) {
  const [query, setQuery] = useState("");

  if (!template) {
    return (
      <p className="text-sm text-muted">
        No search template configured. Add one via Edit to enable quick search.
      </p>
    );
  }

  const url = buildSearchUrl(template, query);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {SET_SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setQuery(s)}
            className="rounded-lg border border-card-border px-2.5 py-1 text-xs text-muted hover:text-foreground"
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Set code or JP keyword"
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
          Opens: <span className="text-foreground">{url}</span>
        </p>
      )}
    </div>
  );
}
