import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const supabase = createServiceClient();

    const { data: doc, error } = await supabase
      .from("documents")
      .select("storage_path")
      .eq("id", id)
      .single();

    if (error || !doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const { data: signed, error: signError } = await supabase.storage
      .from("pdfs")
      .createSignedUrl(doc.storage_path, 3600);

    if (signError || !signed) {
      return NextResponse.json(
        { error: signError?.message ?? "Could not sign URL" },
        { status: 500 },
      );
    }

    return NextResponse.json({ url: signed.signedUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get URL";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
