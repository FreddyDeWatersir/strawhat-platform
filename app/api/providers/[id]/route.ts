import { NextResponse } from "next/server";
import { createServiceClient, type ProviderTier } from "@/lib/supabase/server";

const VALID_TIERS: ProviderTier[] = [
  "raw_jp",
  "marketplace",
  "proxy",
  "jp_exporter",
  "italian_reseller",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    return NextResponse.json({ provider: data });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to get provider";
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
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updates.name = name;
    }
    if (body.url !== undefined) {
      updates.url = body.url?.trim() || null;
    }
    if (body.tier !== undefined) {
      if (!VALID_TIERS.includes(body.tier)) {
        return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
      }
      updates.tier = body.tier;
    }
    if (body.country !== undefined) {
      updates.country = body.country?.trim() || null;
    }
    if (body.language !== undefined) {
      updates.language = body.language?.trim() || null;
    }
    if (body.ships_internationally !== undefined) {
      updates.ships_internationally = Boolean(body.ships_internationally);
    }
    if (body.payment_methods !== undefined) {
      updates.payment_methods = Array.isArray(body.payment_methods)
        ? body.payment_methods
        : typeof body.payment_methods === "string"
          ? body.payment_methods.split(",").map((s: string) => s.trim()).filter(Boolean)
          : [];
    }
    if (body.rating !== undefined) {
      const rating =
        body.rating === "" || body.rating == null ? null : Number(body.rating);
      if (rating != null && (Number.isNaN(rating) || rating < 0 || rating > 5)) {
        return NextResponse.json(
          { error: "rating must be between 0 and 5" },
          { status: 400 },
        );
      }
      updates.rating = rating;
    }
    if (body.notes !== undefined) {
      updates.notes = body.notes?.trim() || null;
    }
    if (body.category_url !== undefined) {
      updates.category_url = body.category_url?.trim() || null;
    }
    if (body.search_url_template !== undefined) {
      updates.search_url_template = body.search_url_template?.trim() || null;
    }
    if (body.how_to_buy !== undefined) {
      updates.how_to_buy = body.how_to_buy?.trim() || null;
    }
    if (body.is_active !== undefined) {
      updates.is_active = Boolean(body.is_active);
    }

    if (Object.keys(updates).length <= 1) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("providers")
      .update(updates)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ provider: data });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to update provider";
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

    const { error } = await supabase.from("providers").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete provider";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
