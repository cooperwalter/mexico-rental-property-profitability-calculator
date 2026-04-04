export function formatNumber(n: number, decimals = 0): string {
  return Math.abs(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(n: number, decimals = 0): string {
  const sign = n < 0 ? "−" : "";
  return `${sign}$${formatNumber(n, decimals)}`;
}

export function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`;
}

export type FormFieldValue = number | "";

export function toNumber(v: FormFieldValue): number {
  return v === "" ? 0 : v;
}
