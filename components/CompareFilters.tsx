"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TIER_ORDER, tierLabel } from "@/lib/sources/format";

export function CompareFilters({
  sets,
  productTypes,
}: {
  sets: string[];
  productTypes: string[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const tier = searchParams.get("tier") ?? "";
  const setCode = searchParams.get("set") ?? "";
  const productType = searchParams.get("product_type") ?? "";

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/sources/compare?${params.toString()}`);
  }

  const selectClass =
    "rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm";

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        className={selectClass}
        value={tier}
        onChange={(e) => update("tier", e.target.value)}
      >
        <option value="">All tiers</option>
        {TIER_ORDER.map((t) => (
          <option key={t} value={t}>
            {tierLabel(t)}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={setCode}
        onChange={(e) => update("set", e.target.value)}
      >
        <option value="">All sets</option>
        {sets.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      <select
        className={selectClass}
        value={productType}
        onChange={(e) => update("product_type", e.target.value)}
      >
        <option value="">All product types</option>
        {productTypes.map((pt) => (
          <option key={pt} value={pt}>
            {pt}
          </option>
        ))}
      </select>

      {(tier || setCode || productType) && (
        <Link href="/sources/compare" className="text-sm text-gold hover:underline">
          Clear filters
        </Link>
      )}
    </div>
  );
}
