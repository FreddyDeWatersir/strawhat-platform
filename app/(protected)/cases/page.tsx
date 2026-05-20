import { CasesTable } from "@/components/CasesTable";
import { createServiceClient, type CaseWithBoxes } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CasesPage() {
  let cases: CaseWithBoxes[] = [];
  let error: string | null = null;

  try {
    const supabase = createServiceClient();
    const { data, error: dbError } = await supabase
      .from("cases")
      .select("*, case_boxes(*)")
      .order("purchased_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (dbError) throw new Error(dbError.message);

    cases = (data ?? []).map((row) => ({
      ...(row as CaseWithBoxes),
      case_boxes: [...(row.case_boxes ?? [])].sort(
        (a, b) => a.box_number - b.box_number,
      ),
    }));
  } catch (e) {
    error = e instanceof Error ? e.message : "Could not load cases";
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gold">Cases</h1>
          <p className="text-sm text-muted">
            Track case purchases, box sales, and profit per case.
          </p>
        </div>
        <Link
          href="/cases/new"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          New case
        </Link>
      </div>

      {error && (
        <p className="rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-300">
          {error}. Run migration{" "}
          <code className="text-xs">003_cases.sql</code> in Supabase if this is
          a new install.
        </p>
      )}

      <CasesTable cases={cases} />
    </div>
  );
}
