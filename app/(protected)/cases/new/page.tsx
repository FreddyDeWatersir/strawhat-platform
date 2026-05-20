import { CaseForm } from "@/components/CaseForm";
import { createServiceClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NewCasePage() {
  let documents: { id: string; label: string }[] = [];
  let transactions: { id: string; label: string }[] = [];
  let error: string | null = null;

  try {
    const supabase = createServiceClient();

    const [docsRes, txRes] = await Promise.all([
      supabase
        .from("documents")
        .select("id, filename")
        .eq("status", "ready")
        .order("uploaded_at", { ascending: false })
        .limit(100),
      supabase
        .from("transactions")
        .select("id, supplier, product_set, invoice_date, amount, currency")
        .order("invoice_date", { ascending: false, nullsFirst: false })
        .limit(100),
    ]);

    if (docsRes.error) throw new Error(docsRes.error.message);
    if (txRes.error) throw new Error(txRes.error.message);

    documents = (docsRes.data ?? []).map((d) => ({
      id: d.id,
      label: d.filename,
    }));

    transactions = (txRes.data ?? []).map((t) => {
      const parts = [
        t.invoice_date,
        t.supplier,
        t.product_set,
        t.amount != null ? `${t.currency ?? ""} ${t.amount}`.trim() : null,
      ].filter(Boolean);
      return {
        id: t.id,
        label: parts.join(" · ") || t.id.slice(0, 8),
      };
    });
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load link options";
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/cases" className="text-sm text-gold hover:underline">
          ← Cases
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gold">New case</h1>
        <p className="text-sm text-muted">
          Create a case manually. Boxes are created automatically (default 12).
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <CaseForm documents={documents} transactions={transactions} />
    </div>
  );
}
