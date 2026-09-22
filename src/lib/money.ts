/**
 * Money is stored as integer cents everywhere. Floats never touch a balance.
 *
 * Sign convention, used consistently across the whole app:
 *   negative = money leaving you (expense)
 *   positive = money arriving (income)
 * So a month's cashflow is simply the sum of its transactions.
 */

export function formatMoney(
  cents: number,
  opts: { showCents?: boolean; signed?: boolean; compact?: boolean } = {},
): string {
  const { showCents = true, signed = false, compact = false } = opts;
  const abs = Math.abs(cents);

  let body: string;
  if (compact && abs >= 100_000_00) {
    body = `$${(abs / 100_000_00).toFixed(abs >= 1_000_000_00 ? 0 : 1)}M`;
  } else if (compact && abs >= 10_000_00) {
    body = `$${Math.round(abs / 100_000) / 10}K`;
  } else {
    body = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: showCents ? 2 : 0,
      maximumFractionDigits: showCents ? 2 : 0,
    }).format(abs / 100);
  }

  if (cents < 0) return `-${body}`;
  if (signed && cents > 0) return `+${body}`;
  return body;
}

/** Axis ticks and other bare numbers. */
export function formatCompactMoney(cents: number): string {
  return formatMoney(cents, { showCents: false, compact: true });
}

/** Parses "$1,234.56", "(12.30)", "1.234,56", "-45" → integer cents. */
export function parseMoney(raw: string): number | null {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;

  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  if (s.startsWith("-")) {
    negative = true;
    s = s.slice(1);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
  }

  s = s.replace(/[$£€\s]/g, "");

  // European format: "1.234,56" → the comma is the decimal separator.
  if (/,\d{1,2}$/.test(s) && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(/,/g, "");
  }

  if (!/^\d*\.?\d*$/.test(s) || s === "" || s === ".") return null;

  const cents = Math.round(Number(s) * 100);
  if (!Number.isFinite(cents)) return null;
  return negative ? -cents : cents;
}

export function percent(part: number, whole: number): number {
  if (!whole) return 0;
  return (part / whole) * 100;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
