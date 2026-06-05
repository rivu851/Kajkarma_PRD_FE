export function formatLabel(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date?: string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function maskSensitiveValue(
  value: string | undefined,
  visibleChars = 4
): string {
  if (!value) return "—";
  if (value.length <= visibleChars) return "****";
  return `${"X".repeat(Math.max(value.length - visibleChars, 4))} ${value.slice(-visibleChars)}`;
}
