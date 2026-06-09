/**
 * AUD→EUR conversion for display hints on the wholesale page.
 * Source: frankfurter.dev (ECB reference rates, no API key). Cached daily.
 * Falls back to an approximate constant if the fetch fails.
 */

const FALLBACK_AUD_TO_EUR = 0.6;

export type AudEurRate = {
  rate: number;
  live: boolean;
  date: string | null;
};

export async function getAudToEurRate(): Promise<AudEurRate> {
  try {
    const res = await fetch(
      "https://api.frankfurter.dev/v1/latest?base=AUD&symbols=EUR",
      { next: { revalidate: 86400 } },
    );

    if (!res.ok) throw new Error(`FX fetch HTTP ${res.status}`);

    const data = (await res.json()) as {
      rates?: { EUR?: number };
      date?: string;
    };

    const rate = data.rates?.EUR;
    if (typeof rate === "number" && rate > 0) {
      return { rate, live: true, date: data.date ?? null };
    }

    throw new Error("FX response missing EUR rate");
  } catch {
    return { rate: FALLBACK_AUD_TO_EUR, live: false, date: null };
  }
}
