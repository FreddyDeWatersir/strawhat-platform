import { getAnthropicClient, getChatModel } from "@/lib/claude/client";
import {
  formatChunksForPrompt,
  searchChunks,
} from "@/lib/rag/search";
import { createServiceClient } from "@/lib/supabase/server";

export const maxDuration = 60;

const SYSTEM_PROMPT = `You are a helpful assistant for a One Piece TCG box resale business.
Answer questions using ONLY the document excerpts provided in the user message.
If the answer is not in the excerpts, say you don't know and suggest uploading more documents.
Always cite source filenames when stating facts (e.g. "According to fedex_march.pdf...").
Be concise and practical for inventory, shipping, and cost tracking.`;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const supabase = createServiceClient();
    await supabase.from("chat_messages").insert({
      role: "user",
      content: message,
    });

    let chunks = await searchChunks(message, 8);

    if (chunks.length === 0) {
      const { data: recent } = await supabase
        .from("document_chunks")
        .select(
          "id, document_id, chunk_index, content, documents!inner(filename)",
        )
        .limit(5);

      chunks = (recent ?? []).map((row) => {
        const doc = row.documents;
        const filename = Array.isArray(doc)
          ? ((doc[0] as { filename?: string } | undefined)?.filename ?? "unknown")
          : ((doc as { filename?: string } | null)?.filename ?? "unknown");
        return {
          id: row.id,
          document_id: row.document_id,
          chunk_index: row.chunk_index,
          content: row.content,
          filename,
          rank: 0,
        };
      });
    }

    const context = formatChunksForPrompt(chunks);
    const anthropic = getAnthropicClient();

    const stream = await anthropic.messages.stream({
      model: getChatModel(),
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Document excerpts:\n\n${context}\n\n---\n\nQuestion: ${message}`,
        },
      ],
    });

    const encoder = new TextEncoder();
    let fullAssistant = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "content_block_delta" &&
              event.delta.type === "text_delta"
            ) {
              const text = event.delta.text;
              fullAssistant += text;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`),
              );
            }
          }

          if (fullAssistant) {
            await supabase.from("chat_messages").insert({
              role: "assistant",
              content: fullAssistant,
            });
          }

          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Stream error";
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: msg })}\n\n`),
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
