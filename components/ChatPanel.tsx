"use client";

import { useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

function parseSsePayload(payload: string): { text?: string; error?: string } {
  const parsed = JSON.parse(payload) as { text?: string; error?: string };
  if (parsed.error) {
    throw new Error(parsed.error);
  }
  return parsed;
}

function processSseBuffer(
  buffer: string,
  onEvent: (parsed: { text?: string; error?: string }) => void,
): string {
  const parts = buffer.split("\n\n");
  const remainder = parts.pop() ?? "";

  for (const part of parts) {
    const line = part
      .split("\n")
      .find((l) => l.startsWith("data: "));
    if (!line) continue;

    const payload = line.slice(6).trim();
    if (!payload || payload === "[DONE]") continue;

    try {
      onEvent(parseSsePayload(payload));
    } catch (err) {
      if (err instanceof SyntaxError) {
        continue;
      }
      throw err;
    }
  }

  return remainder;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  function updateAssistantBubble(content: string) {
    setMessages((m) => {
      const copy = [...m];
      copy[copy.length - 1] = { role: "assistant", content };
      return copy;
    });
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);

    let assistant = "";
    setMessages((m) => [...m, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(
          (err as { error?: string }).error ?? "Chat request failed",
        );
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("No response stream");

      let sseBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        sseBuffer += decoder.decode(value, { stream: true });
        sseBuffer = processSseBuffer(sseBuffer, (parsed) => {
          if (parsed.text) {
            assistant += parsed.text;
            updateAssistantBubble(assistant);
          }
        });
      }

      sseBuffer += decoder.decode();
      processSseBuffer(sseBuffer ? `${sseBuffer}\n\n` : "", (parsed) => {
        if (parsed.text) {
          assistant += parsed.text;
          updateAssistantBubble(assistant);
        }
      });

      if (!assistant.trim()) {
        updateAssistantBubble("(no content returned)");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Chat failed";
      updateAssistantBubble(`Error: ${msg}`);
    } finally {
      setLoading(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }

  return (
    <div className="flex h-[calc(100vh-12rem)] flex-col rounded-xl border border-card-border bg-card">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="text-sm text-muted">
            Ask about invoices, shipping, costs, or product sets. Answers use
            your uploaded PDFs.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg px-4 py-3 text-sm ${
              m.role === "user"
                ? "ml-auto bg-accent text-white"
                : "bg-background text-foreground"
            }`}
          >
            <p className="whitespace-pre-wrap">
              {m.role === "assistant" && loading && i === messages.length - 1
                ? m.content || "Thinking…"
                : m.content || (m.role === "assistant" ? "(empty)" : "")}
            </p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={send}
        className="flex gap-2 border-t border-card-border p-4"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. How much did we pay for Romance Dawn last month?"
          className="flex-1 rounded-lg border border-card-border bg-background px-3 py-2 text-sm outline-none focus:border-gold"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {loading ? "…" : "Send"}
        </button>
      </form>
    </div>
  );
}
