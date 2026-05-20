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

const isDev = process.env.NODE_ENV === "development";

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
    let usedFallback = false;

    if (chunks.length === 0) {
      usedFallback = true;
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

    if (isDev) {
      console.log("[chat]", {
        messagePreview: message.slice(0, 80),
        chunksFound: chunks.length,
        usedFallback,
        filenames: chunks.map((c) => c.filename),
        model: getChatModel(),
      });
    }

    const context = formatChunksForPrompt(chunks);
    const anthropic = getAnthropicClient();

    let stream;
    try {
      stream = await anthropic.messages.stream({
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
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to start stream";
      if (isDev) console.error("[chat] stream init failed:", msg);
      return new Response(JSON.stringify({ error: msg }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const encoder = new TextEncoder();
    let fullAssistant = "";

    const readable = new ReadableStream({
      async start(controller) {
        const eventTypes = new Set<string>();
        try {
          for await (const event of stream) {
            eventTypes.add(event.type);
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

          if (isDev) {
            console.log("[chat] stream complete", {
              eventTypes: [...eventTypes],
              responseLength: fullAssistant.length,
            });
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
          if (isDev) {
            console.error("[chat] stream iteration failed:", msg, {
              eventTypes: [...eventTypes],
            });
          }
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
    if (isDev) console.error("[chat] request failed:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
