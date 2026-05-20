import { CaseBoxRow } from "@/components/CaseBoxRow";
import { CaseEditForm } from "@/components/CaseEditForm";
import { CaseSummaryStrip } from "@/components/CaseSummaryStrip";
import { createServiceClient, type CaseWithBoxes } from "@/lib/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("cases")
    .select("*, case_boxes(*)")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const caseRow: CaseWithBoxes = {
    ...(data as CaseWithBoxes),
    case_boxes: [...(data.case_boxes ?? [])].sort(
      (a, b) => a.box_number - b.box_number,
    ),
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href="/cases" className="text-sm text-gold hover:underline">
          ← Cases
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gold">{caseRow.label}</h1>
            <p className="text-sm text-muted">
              {caseRow.product_set ?? "No product set"}
              {caseRow.purchased_at ? ` · Purchased ${caseRow.purchased_at}` : ""}
            </p>
          </div>
          <CaseEditForm caseRow={caseRow} />
        </div>
      </div>

      <CaseSummaryStrip caseRow={caseRow} boxes={caseRow.case_boxes} />

      <div>
        <h2 className="mb-3 text-lg font-semibold">Boxes</h2>
        <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-card-border text-muted">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Sold on</th>
                <th className="px-4 py-3 font-medium">Sale price</th>
                <th className="px-4 py-3 font-medium">Notes</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {caseRow.case_boxes.map((box) => (
                <CaseBoxRow
                  key={box.id}
                  caseId={caseRow.id}
                  box={box}
                  defaultCurrency={caseRow.purchase_currency}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
