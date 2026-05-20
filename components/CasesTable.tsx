"use client";

import Link from "next/link";
import { summarizeCase } from "@/lib/cases/summary";
import { formatMoney } from "@/lib/cases/format";
import type { CaseWithBoxes } from "@/lib/supabase/server";

export function CasesTable({ cases }: { cases: CaseWithBoxes[] }) {
  if (cases.length === 0) {
    return (
      <p className="rounded-xl border border-card-border bg-card p-6 text-sm text-muted">
        No cases yet.{" "}
        <Link href="/cases/new" className="text-gold hover:underline">
          Create your first case
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
      <table className="w-full min-w-[800px] text-left text-sm">
        <thead>
          <tr className="border-b border-card-border text-muted">
            <th className="px-4 py-3 font-medium">Case</th>
            <th className="px-4 py-3 font-medium">Product</th>
            <th className="px-4 py-3 font-medium">Cost</th>
            <th className="px-4 py-3 font-medium">Made so far</th>
            <th className="px-4 py-3 font-medium">Profit</th>
            <th className="px-4 py-3 font-medium">To break even</th>
            <th className="px-4 py-3 font-medium">Boxes</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => {
            const s = summarizeCase(c, c.case_boxes ?? []);
            const currency = s.currency;

            return (
              <tr
                key={c.id}
                className="border-b border-card-border/60 last:border-0"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/cases/${c.id}`}
                    className="font-medium text-gold hover:underline"
                  >
                    {c.label}
                  </Link>
                  {s.mixedCurrency && (
                    <span className="ml-2 text-xs text-amber-400">
                      mixed currency
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">{c.product_set ?? "—"}</td>
                <td className="px-4 py-3">
                  {formatMoney(s.purchaseCost, currency)}
                </td>
                <td className="px-4 py-3">
                  {formatMoney(s.revenue, currency)}
                </td>
                <td
                  className={`px-4 py-3 font-medium ${
                    s.profit >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {formatMoney(s.profit, currency)}
                </td>
                <td className="px-4 py-3">
                  {s.profit < 0
                    ? formatMoney(s.breakEvenRemaining, currency)
                    : "—"}
                </td>
                <td className="px-4 py-3 text-muted">
                  {s.soldCount}/{c.box_count}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
