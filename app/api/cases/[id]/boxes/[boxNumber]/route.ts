import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; boxNumber: string }> },
) {
  try {
    const { id, boxNumber: boxNumberStr } = await params;
    const boxNumber = Number(boxNumberStr);

    if (!Number.isInteger(boxNumber) || boxNumber < 1) {
      return NextResponse.json({ error: "Invalid box number" }, { status: 400 });
    }

    const body = await request.json();
    const supabase = createServiceClient();

    if (body.unsell === true) {
      const { data, error } = await supabase
        .from("case_boxes")
        .update({
          sold_at: null,
          sale_price: null,
          sale_currency: null,
          notes: null,
        })
        .eq("case_id", id)
        .eq("box_number", boxNumber)
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ box: data });
    }

    const salePrice =
      body.sale_price != null && body.sale_price !== ""
        ? Number(body.sale_price)
        : null;

    if (salePrice == null || Number.isNaN(salePrice)) {
      return NextResponse.json(
        { error: "sale_price is required when marking sold" },
        { status: 400 },
      );
    }

    const soldAt = body.sold_at || new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("case_boxes")
      .update({
        sold_at: soldAt,
        sale_price: salePrice,
        sale_currency: body.sale_currency?.trim() || null,
        notes: body.notes?.trim() || null,
      })
      .eq("case_id", id)
      .eq("box_number", boxNumber)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ box: data });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update box";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
