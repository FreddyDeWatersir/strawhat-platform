import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supplier = searchParams.get("supplier");

    const supabase = createServiceClient();
    let query = supabase
      .from("transactions")
      .select("*, documents(filename, uploaded_at, doc_type, status)")
      .order("invoice_date", { ascending: false, nullsFirst: false });

    if (supplier) {
      query = query.ilike("supplier", `%${supplier}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ transactions: data ?? [] });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list transactions";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
