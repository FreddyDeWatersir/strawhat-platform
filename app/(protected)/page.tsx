import { TransactionsTable } from "@/components/TransactionsTable";
import {
  aggregateCasesByCurrency,
  aggregateInventory,
} from "@/lib/cases/summary";
import { formatMoney } from "@/lib/cases/format";
import {
  formatObservedAge,
  wholesaleChangeClass,
  wholesaleChangeLabel,
  wholesaleGameLabel,
} from "@/lib/sources/format";
import { recentWholesaleChanges } from "@/lib/sources/wholesale/queries";
import { createServiceClient, type CaseWithBoxes } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let transactions: Awaited<
    ReturnType<typeof fetchTransactions>
  > = [];
  let stats = { total: 0, readyDocs: 0, failedDocs: 0 };
  let inventory = {
    totalCases: 0,
    totalBoxes: 0,
    soldBoxes: 0,
    availableBoxes: 0,
  };
  let casesPnl: ReturnType<typeof aggregateCasesByCurrency> = [];
  let casesError: string | null = null;
  let recentChanges: Awaited<ReturnType<typeof recentWholesaleChanges>> = [];
  let sourcesError: string | null = null;
  let error: string | null = null;

  try {
    transactions = await fetchTransactions();
    const supabase = createServiceClient();
    const { data: docs } = await supabase.from("documents").select("status");
    const list = docs ?? [];
    stats = {
      total: transactions.length,
      readyDocs: list.filter((d) => d.status === "ready").length,
      failedDocs: list.filter((d) => d.status === "failed").length,
    };

    const { data: casesData, error: casesDbError } = await supabase
      .from("cases")
      .select("*, case_boxes(*)");

    if (casesDbError) {
      casesError = casesDbError.message;
    } else {
      const cases = (casesData ?? []) as CaseWithBoxes[];
      inventory = aggregateInventory(cases);
      casesPnl = aggregateCasesByCurrency(cases);
    }

    try {
      recentChanges = await recentWholesaleChanges(5);
    } catch (e) {
      sourcesError =
        e instanceof Error ? e.message : "Wholesale watch unavailable";
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load dashboard";
  }

  const byCurrency = transactions.reduce<Record<string, number>>((acc, t) => {
    if (t.amount == null) return acc;
    const key = t.currency ?? "UNKNOWN";
    acc[key] = (acc[key] ?? 0) + Number(t.amount);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gold">Dashboard</h1>
        <p className="text-sm text-muted">
          Costs and shipments extracted from your PDFs.
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
          {error}. Check `.env.local` and Supabase setup in README.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Transactions" value={String(stats.total)} />
        <StatCard label="Ready documents" value={String(stats.readyDocs)} />
        <StatCard label="Failed uploads" value={String(stats.failedDocs)} />
      </div>

      {Object.keys(byCurrency).length > 0 && (
        <div className="rounded-xl border border-card-border bg-card p-4">
          <h2 className="mb-2 text-sm font-medium text-muted">
            Invoice totals by currency
          </h2>
          <ul className="flex flex-wrap gap-4">
            {Object.entries(byCurrency).map(([currency, sum]) => (
              <li key={currency} className="text-lg font-semibold">
                {currency}{" "}
                <span className="text-foreground">
                  {sum.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Case inventory</h2>
          <Link href="/cases" className="text-sm text-gold hover:underline">
            Manage cases →
          </Link>
        </div>
        {casesError ? (
          <p className="rounded-xl border border-card-border bg-card p-4 text-sm text-muted">
            Case inventory unavailable. Run{" "}
            <code className="text-xs">003_cases.sql</code> in Supabase.
          </p>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-4">
              <StatCard label="Cases" value={String(inventory.totalCases)} />
              <StatCard label="Total boxes" value={String(inventory.totalBoxes)} />
              <StatCard label="Sold boxes" value={String(inventory.soldBoxes)} />
              <StatCard
                label="Available boxes"
                value={String(inventory.availableBoxes)}
              />
            </div>
            {casesPnl.length > 0 && (
              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-medium text-muted">
                  Cases P&L by currency
                </h3>
                {casesPnl.map((row) => (
                  <div
                    key={row.currency}
                    className="rounded-xl border border-card-border bg-card p-4"
                  >
                    <p className="mb-2 font-semibold text-gold">{row.currency}</p>
                    <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <li>
                        <span className="text-muted">Total made: </span>
                        {formatMoney(row.totalMade, row.currency)}
                      </li>
                      <li>
                        <span className="text-muted">Total cost: </span>
                        {formatMoney(row.totalCost, row.currency)}
                      </li>
                      <li>
                        <span className="text-muted">Net profit: </span>
                        <span
                          className={
                            row.netProfit >= 0
                              ? "text-emerald-400"
                              : "text-red-400"
                          }
                        >
                          {formatMoney(row.netProfit, row.currency)}
                        </span>
                      </li>
                      <li>
                        <span className="text-muted">Still to break even: </span>
                        {formatMoney(row.breakEvenRemaining, row.currency)}
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Latest wholesale changes</h2>
          <Link href="/sources" className="text-sm text-gold hover:underline">
            Wholesale →
          </Link>
        </div>
        {sourcesError ? (
          <p className="rounded-xl border border-card-border bg-card p-4 text-sm text-muted">
            Wholesale watch unavailable. Run{" "}
            <code className="text-xs">010_wholesale_watch.sql</code> in Supabase.
          </p>
        ) : recentChanges.length === 0 ? (
          <p className="rounded-xl border border-card-border bg-card p-4 text-sm text-muted">
            No changes recorded yet.{" "}
            <Link href="/sources" className="text-gold hover:underline">
              Open Wholesale
            </Link>{" "}
            and click &quot;Check now&quot; to establish a baseline.
          </p>
        ) : (
          <ul className="space-y-2 rounded-xl border border-card-border bg-card p-4">
            {recentChanges.map((c) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
              >
                <Link
                  href="/sources"
                  className="font-medium text-gold hover:underline"
                >
                  {c.title}
                </Link>
                <span className="text-muted">{wholesaleGameLabel(c.game)}</span>
                <span
                  className={`rounded border px-1.5 py-0.5 text-xs ${wholesaleChangeClass(c.change_type)}`}
                >
                  {wholesaleChangeLabel(c.change_type)}
                </span>
                {(c.old_value || c.new_value) && (
                  <span className="text-xs text-muted">
                    {c.old_value ?? "—"} → {c.new_value ?? "—"}
                  </span>
                )}
                <span className="text-xs text-muted">
                  {formatObservedAge(c.detected_at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent transactions</h2>
          <Link
            href="/documents"
            className="text-sm text-gold hover:underline"
          >
            Upload PDF →
          </Link>
        </div>
        <TransactionsTable transactions={transactions} />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}

async function fetchTransactions() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("*, documents(filename, uploaded_at, doc_type, status)")
    .order("invoice_date", { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return data ?? [];
}
