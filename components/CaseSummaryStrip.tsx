import { summarizeCase } from "@/lib/cases/summary";
import { formatMoney } from "@/lib/cases/format";
import type { CaseBoxRow, CaseRow } from "@/lib/supabase/server";

export function CaseSummaryStrip({
  caseRow,
  boxes,
}: {
  caseRow: Pick<
    CaseRow,
    "box_count" | "purchase_price" | "purchase_currency" | "label"
  >;
  boxes: CaseBoxRow[];
}) {
  const s = summarizeCase(caseRow, boxes);
  const currency = s.currency;

  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      {s.mixedCurrency && (
        <p className="mb-3 text-sm text-amber-400">
          Some box sales use a different currency than the case purchase. Totals
          below only include sales in {currency ?? "the purchase currency"}.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Case cost" value={formatMoney(s.purchaseCost, currency)} />
        <Metric label="Made so far" value={formatMoney(s.revenue, currency)} />
        <Metric
          label="Profit"
          value={formatMoney(s.profit, currency)}
          valueClass={
            s.profit >= 0 ? "text-emerald-400" : "text-red-400"
          }
        />
        {s.profit < 0 ? (
          <Metric
            label="Still need to break even"
            value={formatMoney(s.breakEvenRemaining, currency)}
            valueClass="text-amber-400"
          />
        ) : (
          <Metric label="Break even" value="Reached" valueClass="text-emerald-400" />
        )}
      </div>
      <p className="mt-3 text-sm text-muted">
        {s.soldCount} sold · {s.availableCount} available · {caseRow.box_count}{" "}
        total boxes
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <p className="text-xs text-muted">{label}</p>
      <p className={`mt-0.5 text-lg font-semibold ${valueClass ?? ""}`}>
        {value}
      </p>
    </div>
  );
}
