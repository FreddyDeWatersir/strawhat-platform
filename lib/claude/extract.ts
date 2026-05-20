import { getAnthropicClient, getExtractModel } from "@/lib/claude/client";

export type ExtractedTransaction = {
  doc_type: "japan_invoice" | "fedex" | "other";
  supplier: string | null;
  invoice_date: string | null;
  currency: string | null;
  amount: number | null;
  description: string | null;
  tracking_number: string | null;
  product_set: string | null;
  notes: Record<string, unknown>;
};

const EMPTY: ExtractedTransaction = {
  doc_type: "other",
  supplier: null,
  invoice_date: null,
  currency: null,
  amount: null,
  description: null,
  tracking_number: null,
  product_set: null,
  notes: {},
};

export async function extractTransactionFromText(
  text: string,
  filename: string,
): Promise<ExtractedTransaction> {
  const anthropic = getAnthropicClient();
  const sample = text.slice(0, 12000);

  const response = await anthropic.messages.create({
    model: getExtractModel(),
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `You extract structured data from One Piece TCG business documents (Japanese supplier invoices, FedEx shipping docs, etc.).

Filename: ${filename}

Document text:
"""
${sample}
"""

Reply with ONLY valid JSON (no markdown fences) matching this schema:
{
  "doc_type": "japan_invoice" | "fedex" | "other",
  "supplier": string | null,
  "invoice_date": "YYYY-MM-DD" | null,
  "currency": string | null (e.g. JPY, EUR, USD),
  "amount": number | null (numeric only, no symbols),
  "description": string | null,
  "tracking_number": string | null,
  "product_set": string | null (e.g. Romance Dawn, OP-01),
  "notes": object (any extra fields as key-value pairs)
}`,
      },
    ],
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") {
    return EMPTY;
  }

  try {
    const parsed = JSON.parse(block.text.trim()) as ExtractedTransaction;
    return {
      doc_type: parsed.doc_type ?? "other",
      supplier: parsed.supplier ?? null,
      invoice_date: parsed.invoice_date ?? null,
      currency: parsed.currency ?? null,
      amount: parsed.amount ?? null,
      description: parsed.description ?? null,
      tracking_number: parsed.tracking_number ?? null,
      product_set: parsed.product_set ?? null,
      notes: parsed.notes ?? {},
    };
  } catch {
    return { ...EMPTY, notes: { raw_response: block.text.slice(0, 500) } };
  }
}
