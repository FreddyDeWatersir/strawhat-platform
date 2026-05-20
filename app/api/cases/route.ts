import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("cases")
      .select("*, case_boxes(*)")
      .order("purchased_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const cases = (data ?? []).map((row) => ({
      ...row,
      case_boxes: [...(row.case_boxes ?? [])].sort(
        (a: { box_number: number }, b: { box_number: number }) =>
          a.box_number - b.box_number,
      ),
    }));

    return NextResponse.json({ cases });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list cases";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const label = typeof body.label === "string" ? body.label.trim() : "";

    if (!label) {
      return NextResponse.json({ error: "Label is required" }, { status: 400 });
    }

    const boxCount = Number(body.box_count ?? 12);
    if (!Number.isInteger(boxCount) || boxCount < 1 || boxCount > 100) {
      return NextResponse.json(
        { error: "box_count must be an integer between 1 and 100" },
        { status: 400 },
      );
    }

    const purchasePrice =
      body.purchase_price != null && body.purchase_price !== ""
        ? Number(body.purchase_price)
        : null;

    if (purchasePrice != null && Number.isNaN(purchasePrice)) {
      return NextResponse.json(
        { error: "purchase_price must be a number" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("cases")
      .insert({
        label,
        product_set: body.product_set?.trim() || null,
        box_count: boxCount,
        purchase_currency: body.purchase_currency?.trim() || null,
        purchase_price: purchasePrice,
        purchased_at: body.purchased_at || null,
        document_id: body.document_id || null,
        transaction_id: body.transaction_id || null,
        notes: body.notes?.trim() || null,
      })
      .select("*, case_boxes(*)")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const caseRow = {
      ...data,
      case_boxes: [...(data.case_boxes ?? [])].sort(
        (a: { box_number: number }, b: { box_number: number }) =>
          a.box_number - b.box_number,
      ),
    };

    return NextResponse.json({ case: caseRow }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create case";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
