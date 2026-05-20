import { NextResponse } from "next/server";
import {
  createServiceClient,
  type ListingProductType,
  type ListingStatus,
} from "@/lib/supabase/server";

const VALID_PRODUCT_TYPES: ListingProductType[] = [
  "box",
  "case",
  "starter_deck",
  "premium_booster",
  "singles",
];

const VALID_STATUSES: ListingStatus[] = [
  "preorder",
  "in_stock",
  "sold_out",
  "unknown",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data, error } = await supabase
      .from("provider_listings")
      .select("*")
      .eq("provider_id", id)
      .order("observed_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ listings: data ?? [] });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to list observations";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: providerId } = await params;
    const body = await request.json();
    const setCode =
      typeof body.set_code === "string" ? body.set_code.trim() : "";

    if (!setCode) {
      return NextResponse.json({ error: "set_code is required" }, { status: 400 });
    }

    const productType = (body.product_type ?? "case") as ListingProductType;
    if (!VALID_PRODUCT_TYPES.includes(productType)) {
      return NextResponse.json({ error: "Invalid product_type" }, { status: 400 });
    }

    const status = (body.status ?? "unknown") as ListingStatus;
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const price =
      body.price != null && body.price !== ""
        ? Number(body.price)
        : null;

    if (price != null && Number.isNaN(price)) {
      return NextResponse.json({ error: "price must be a number" }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: provider, error: providerError } = await supabase
      .from("providers")
      .select("id")
      .eq("id", providerId)
      .single();

    if (providerError || !provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("provider_listings")
      .insert({
        provider_id: providerId,
        set_code: setCode,
        product_type: productType,
        price,
        currency: body.currency?.trim() || null,
        status,
        source_url: body.source_url?.trim() || null,
        notes: body.notes?.trim() || null,
        observed_at: body.observed_at || new Date().toISOString(),
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ listing: data }, { status: 201 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to add observation";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
