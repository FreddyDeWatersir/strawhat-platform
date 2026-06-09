import type { WholesaleChangeRow } from "@/lib/sources/scrapers/types";
import {
  markWholesaleChangesNotified,
  unnotifiedWholesaleChanges,
} from "@/lib/sources/wholesale/queries";

const DISCORD_EMBED_COLORS: Record<string, number> = {
  new: 0x3498db,
  restock: 0x2ecc71,
  sold_out: 0xe74c3c,
  price_up: 0xf39c12,
  price_down: 0x9b59b6,
};

function changeLabel(type: WholesaleChangeRow["change_type"]): string {
  switch (type) {
    case "new":
      return "New product";
    case "restock":
      return "Restock";
    case "sold_out":
      return "Sold out";
    case "price_up":
      return "Price up";
    case "price_down":
      return "Price down";
    default:
      return type;
  }
}

function gameLabel(game: WholesaleChangeRow["game"]): string {
  const labels = {
    one_piece: "One Piece",
    pokemon: "Pokemon",
    dragon_ball: "Dragon Ball",
  } as const;
  return labels[game];
}

function formatChangeEmbed(change: WholesaleChangeRow) {
  const lines = [
    `**${changeLabel(change.change_type)}** · ${gameLabel(change.game)}`,
  ];

  if (change.old_value && change.new_value) {
    lines.push(`${change.old_value} → ${change.new_value}`);
  } else if (change.new_value) {
    lines.push(change.new_value);
  }

  if (change.source_url) {
    lines.push(`[View product](${change.source_url})`);
  }

  return {
    title: change.title.slice(0, 256),
    description: lines.join("\n"),
    color: DISCORD_EMBED_COLORS[change.change_type] ?? 0x95a5a6,
    timestamp: change.detected_at,
  };
}

export type DiscordNotifySummary = {
  sent: number;
  skipped: boolean;
  errors: string[];
};

/** Push unsent wholesale_changes to Discord webhook. No-op if env unset. */
export async function notifyWholesaleChangesDiscord(): Promise<DiscordNotifySummary> {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  const summary: DiscordNotifySummary = {
    sent: 0,
    skipped: false,
    errors: [],
  };

  if (!webhookUrl) {
    summary.skipped = true;
    return summary;
  }

  const pending = await unnotifiedWholesaleChanges();
  if (pending.length === 0) {
    return summary;
  }

  const batchSize = 10;
  for (let i = 0; i < pending.length; i += batchSize) {
    const batch = pending.slice(i, i + batchSize);
    const embeds = batch.map(formatChangeEmbed);

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "TCG Wholesale HQ",
          content:
            batch.length === 1
              ? "Wholesale catalogue update"
              : `${batch.length} wholesale catalogue updates`,
          embeds,
        }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        summary.errors.push(
          `Discord webhook HTTP ${res.status}: ${text.slice(0, 200)}`,
        );
        break;
      }

      await markWholesaleChangesNotified(batch.map((c) => c.id));
      summary.sent += batch.length;
    } catch (err) {
      summary.errors.push(
        err instanceof Error ? err.message : "Discord webhook failed",
      );
      break;
    }
  }

  return summary;
}
