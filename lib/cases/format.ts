export function formatMoney(
  amount: number,
  currency: string | null,
): string {
  const formatted = amount.toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });
  return currency ? `${currency} ${formatted}` : formatted;
}
