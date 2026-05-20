import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("cases")
      .select("*, case_boxes(*)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Case not found" }, { status: 404 });
    }

    const caseRow = {
      ...data,
      case_boxes: [...(data.case_boxes ?? [])].sort(
        (a: { box_number: number }, b: { box_number: number }) =>
          a.box_number - b.box_number,
      ),
    };

    return NextResponse.json({ case: caseRow });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get case";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.label !== undefined) {
      const label = String(body.label).trim();
      if (!label) {
        return NextResponse.json({ error: "Label cannot be empty" }, { status: 400 });
      }
      updates.label = label;
    }
    if (body.product_set !== undefined) {
      updates.product_set = body.product_set?.trim() || null;
    }
    if (body.purchase_currency !== undefined) {
      updates.purchase_currency = body.purchase_currency?.trim() || null;
    }
    if (body.purchase_price !== undefined) {
      const price =
        body.purchase_price === "" || body.purchase_price == null
          ? null
          : Number(body.purchase_price);
      if (price != null && Number.isNaN(price)) {
        return NextResponse.json(
          { error: "purchase_price must be a number" },
          { status: 400 },
        );
      }
      updates.purchase_price = price;
    }
    if (body.purchased_at !== undefined) {
      updates.purchased_at = body.purchased_at || null;
    }
    if (body.document_id !== undefined) {
      updates.document_id = body.document_id || null;
    }
    if (body.transaction_id !== undefined) {
      updates.transaction_id = body.transaction_id || null;
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes?.trim() || null;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("cases")
      .update(updates)
      .eq("id", id)
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

    return NextResponse.json({ case: caseRow });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update case";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { error } = await supabase.from("cases").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete case";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
