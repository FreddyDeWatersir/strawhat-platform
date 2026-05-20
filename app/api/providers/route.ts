import { NextResponse } from "next/server";
import { createServiceClient, type ProviderTier } from "@/lib/supabase/server";

const VALID_TIERS: ProviderTier[] = [
  "raw_jp",
  "marketplace",
  "proxy",
  "jp_exporter",
  "italian_reseller",
];

export async function GET() {
  try {
    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .order("name");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ providers: data ?? [] });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list providers";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const tier = body.tier as ProviderTier;
    if (!VALID_TIERS.includes(tier)) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const rating =
      body.rating != null && body.rating !== ""
        ? Number(body.rating)
        : null;

    if (rating != null && (Number.isNaN(rating) || rating < 0 || rating > 5)) {
      return NextResponse.json(
        { error: "rating must be between 0 and 5" },
        { status: 400 },
      );
    }

    const paymentMethods = Array.isArray(body.payment_methods)
      ? body.payment_methods.filter((m: unknown) => typeof m === "string")
      : typeof body.payment_methods === "string" && body.payment_methods.trim()
        ? body.payment_methods.split(",").map((s: string) => s.trim())
        : [];

    const supabase = createServiceClient();
    const { data, error } = await supabase
      .from("providers")
      .insert({
        name,
        url: body.url?.trim() || null,
        tier,
        country: body.country?.trim() || null,
        language: body.language?.trim() || null,
        ships_internationally: Boolean(body.ships_internationally),
        payment_methods: paymentMethods,
        rating,
        notes: body.notes?.trim() || null,
        category_url: body.category_url?.trim() || null,
        search_url_template: body.search_url_template?.trim() || null,
        how_to_buy: body.how_to_buy?.trim() || null,
        is_active: body.is_active !== false,
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ provider: data }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to create provider";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
