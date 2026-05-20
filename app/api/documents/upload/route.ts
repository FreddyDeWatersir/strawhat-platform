import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { extractTransactionFromText } from "@/lib/claude/extract";
import { extractPdfText } from "@/lib/pdf/extract";
import { chunkText } from "@/lib/rag/chunk";
import { createServiceClient } from "@/lib/supabase/server";
import { embedDocument } from "@/lib/voyage/client";

const MAX_BYTES = 20 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { error: "Only PDF files are supported" },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File exceeds 20MB limit" },
        { status: 400 },
      );
    }

    const supabase = createServiceClient();
    const docId = uuidv4();
    const storagePath = `${docId}.pdf`;
    const buffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("pdfs")
      .upload(storagePath, buffer, {
        contentType: "application/pdf",
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 },
      );
    }

    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        id: docId,
        filename: file.name,
        storage_path: storagePath,
        status: "processing",
      })
      .select()
      .single();

    if (docError || !document) {
      return NextResponse.json(
        { error: `Database error: ${docError?.message}` },
        { status: 500 },
      );
    }

    let fullText: string;
    try {
      fullText = await extractPdfText(buffer);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "PDF text extraction failed";
      await supabase
        .from("documents")
        .update({
          status: "failed",
          error_message: message,
        })
        .eq("id", docId);
      return NextResponse.json({ error: message, documentId: docId }, { status: 422 });
    }

    if (!fullText || fullText.length < 10) {
      const message =
        "This PDF has no selectable text. Re-export as a digital PDF (OCR is not enabled yet).";
      await supabase
        .from("documents")
        .update({
          status: "failed",
          full_text: fullText || null,
          error_message: message,
        })
        .eq("id", docId);
      return NextResponse.json({ error: message, documentId: docId }, { status: 422 });
    }

    const chunks = chunkText(fullText);

    let embeddings: number[][];
    try {
      embeddings = await embedDocument(chunks);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Embedding generation failed";
      await supabase
        .from("documents")
        .update({
          status: "failed",
          error_message: message,
        })
        .eq("id", docId);
      return NextResponse.json(
        { error: message, documentId: docId },
        { status: 500 },
      );
    }

    if (embeddings.length !== chunks.length) {
      const message = "Embedding count does not match chunk count";
      await supabase
        .from("documents")
        .update({
          status: "failed",
          error_message: message,
        })
        .eq("id", docId);
      return NextResponse.json(
        { error: message, documentId: docId },
        { status: 500 },
      );
    }

    const chunkRows = chunks.map((content, chunk_index) => ({
      document_id: docId,
      chunk_index,
      content,
      embedding: embeddings[chunk_index],
    }));

    const { error: chunksError } = await supabase
      .from("document_chunks")
      .insert(chunkRows);

    if (chunksError) {
      await supabase
        .from("documents")
        .update({
          status: "failed",
          error_message: chunksError.message,
        })
        .eq("id", docId);
      return NextResponse.json(
        { error: chunksError.message },
        { status: 500 },
      );
    }

    let extracted;
    try {
      extracted = await extractTransactionFromText(fullText, file.name);
    } catch (err) {
      extracted = {
        doc_type: "other" as const,
        supplier: null,
        invoice_date: null,
        currency: null,
        amount: null,
        description: null,
        tracking_number: null,
        product_set: null,
        notes: {
          extraction_error:
            err instanceof Error ? err.message : "Extraction failed",
        },
      };
    }

    await supabase.from("transactions").upsert({
      document_id: docId,
      supplier: extracted.supplier,
      invoice_date: extracted.invoice_date,
      currency: extracted.currency,
      amount: extracted.amount,
      description: extracted.description,
      tracking_number: extracted.tracking_number,
      product_set: extracted.product_set,
      notes: extracted.notes,
    });

    const { data: updated, error: updateError } = await supabase
      .from("documents")
      .update({
        status: "ready",
        full_text: fullText.slice(0, 50000),
        doc_type: extracted.doc_type,
        error_message: null,
      })
      .eq("id", docId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      document: updated,
      chunks: chunks.length,
      extracted,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
