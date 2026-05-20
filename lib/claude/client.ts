import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

export function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY");
  }

  if (!client) {
    client = new Anthropic({ apiKey });
  }

  return client;
}

export function getExtractModel(): string {
  return (
    process.env.ANTHROPIC_MODEL_EXTRACT ?? "claude-3-5-haiku-20241022"
  );
}

export function getChatModel(): string {
  return process.env.ANTHROPIC_MODEL_CHAT ?? "claude-sonnet-4-20250514";
}
