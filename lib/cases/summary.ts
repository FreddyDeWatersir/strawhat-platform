import type { CaseBoxRow, CaseRow } from "@/lib/supabase/server";

export type CaseSummary = {
  soldCount: number;
  availableCount: number;
  purchaseCost: number;
  revenue: number;
  profit: number;
  breakEvenRemaining: number;
  costPerBox: number | null;
  currency: string | null;
  mixedCurrency: boolean;
};

function normalizeCurrency(c: string | null | undefined): string | null {
  if (!c || !c.trim()) return null;
  return c.trim().toUpperCase();
}

export function summarizeCase(
  caseRow: Pick<CaseRow, "box_count" | "purchase_price" | "purchase_currency">,
  boxes: CaseBoxRow[],
): CaseSummary {
  const purchaseCurrency = normalizeCurrency(caseRow.purchase_currency);
  const purchaseCost = Number(caseRow.purchase_price ?? 0);

  const sold = boxes.filter((b) => b.sold_at != null);
  const soldCount = sold.length;
  const availableCount = Math.max(0, caseRow.box_count - soldCount);

  let mixedCurrency = false;
  let revenue = 0;

  for (const box of sold) {
    const boxCurrency = normalizeCurrency(box.sale_currency);
    const price = Number(box.sale_price ?? 0);

    if (
      purchaseCurrency &&
      boxCurrency &&
      boxCurrency !== purchaseCurrency
    ) {
      mixedCurrency = true;
      continue;
    }

    revenue += price;
  }

  const profit = revenue - purchaseCost;
  const breakEvenRemaining = Math.max(0, purchaseCost - revenue);
  const costPerBox =
    caseRow.box_count > 0 && purchaseCost > 0
      ? purchaseCost / caseRow.box_count
      : null;

  return {
    soldCount,
    availableCount,
    purchaseCost,
    revenue,
    profit,
    breakEvenRemaining,
    costPerBox,
    currency: purchaseCurrency,
    mixedCurrency,
  };
}

export type CurrencyAggregate = {
  currency: string;
  totalMade: number;
  totalCost: number;
  netProfit: number;
  breakEvenRemaining: number;
};

export function aggregateCasesByCurrency(
  cases: Array<
    Pick<CaseRow, "box_count" | "purchase_price" | "purchase_currency"> & {
      case_boxes: CaseBoxRow[];
    }
  >,
): CurrencyAggregate[] {
  const map = new Map<string, CurrencyAggregate>();

  for (const c of cases) {
    const summary = summarizeCase(c, c.case_boxes ?? []);
    const currency = summary.currency ?? "UNKNOWN";

    const existing = map.get(currency) ?? {
      currency,
      totalMade: 0,
      totalCost: 0,
      netProfit: 0,
      breakEvenRemaining: 0,
    };

    if (!summary.mixedCurrency) {
      existing.totalMade += summary.revenue;
      existing.totalCost += summary.purchaseCost;
      existing.netProfit += summary.profit;
      existing.breakEvenRemaining += summary.breakEvenRemaining;
    }

    map.set(currency, existing);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.currency.localeCompare(b.currency),
  );
}

export function aggregateInventory(
  cases: Array<
    Pick<CaseRow, "box_count"> & { case_boxes: CaseBoxRow[] }
  >,
): { totalCases: number; totalBoxes: number; soldBoxes: number; availableBoxes: number } {
  let totalBoxes = 0;
  let soldBoxes = 0;

  for (const c of cases) {
    totalBoxes += c.box_count;
    soldBoxes += (c.case_boxes ?? []).filter((b) => b.sold_at != null).length;
  }

  return {
    totalCases: cases.length,
    totalBoxes,
    soldBoxes,
    availableBoxes: totalBoxes - soldBoxes,
  };
}
