import { TransactionsTable } from "@/components/TransactionsTable";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let transactions: Awaited<
    ReturnType<typeof fetchTransactions>
  > = [];
  let stats = { total: 0, readyDocs: 0, failedDocs: 0 };
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
          <h2 className="mb-2 text-sm font-medium text-muted">Totals by currency</h2>
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
