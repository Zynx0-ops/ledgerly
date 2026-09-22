/** Dates are plain "YYYY-MM-DD" strings and months are "YYYY-MM" — no timezones,
 *  no Date-object drift. A transaction dated the 1st is the 1st, everywhere. */

export type MonthKey = string; // "2026-09"
export type DateKey = string; // "2026-09-21"

export function todayKey(): DateKey {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function currentMonth(): MonthKey {
  return todayKey().slice(0, 7);
}

export function monthOf(date: DateKey): MonthKey {
  return date.slice(0, 7);
}

export function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function addMonths(month: MonthKey, delta: number): MonthKey {
  const [y, m] = month.split("-").map(Number);
  const total = y * 12 + (m - 1) + delta;
  return `${Math.floor(total / 12)}-${pad((total % 12) + 1)}`;
}

/** Inclusive list of the `count` months ending at `month`. */
export function monthRange(month: MonthKey, count: number): MonthKey[] {
  return Array.from({ length: count }, (_, i) => addMonths(month, i - count + 1));
}

export function monthBounds(month: MonthKey): { start: DateKey; end: DateKey } {
  const [y, m] = month.split("-").map(Number);
  return { start: `${month}-01`, end: `${month}-${pad(new Date(y, m, 0).getDate())}` };
}

export function daysInMonth(month: MonthKey): number {
  const [y, m] = month.split("-").map(Number);
  return new Date(y, m, 0).getDate();
}

/** How far through the month we are, 0–1. Past months are fully elapsed. */
export function monthProgress(month: MonthKey): number {
  const today = todayKey();
  if (monthOf(today) > month) return 1;
  if (monthOf(today) < month) return 0;
  return Number(today.slice(8)) / daysInMonth(month);
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function formatMonth(month: MonthKey, style: "long" | "short" = "long"): string {
  const [y, m] = month.split("-").map(Number);
  const name = MONTH_NAMES[m - 1] ?? "";
  if (style === "short") return `${name.slice(0, 3)} '${String(y).slice(2)}`;
  return `${name} ${y}`;
}

export function formatDate(date: DateKey, style: "short" | "long" = "short"): string {
  const [y, m, d] = date.split("-").map(Number);
  const name = MONTH_NAMES[m - 1] ?? "";
  if (style === "long") return `${name} ${d}, ${y}`;
  return `${name.slice(0, 3)} ${d}`;
}

/** "Today" / "Yesterday" / "Sep 12" — for transaction lists. */
export function relativeDate(date: DateKey): string {
  const today = todayKey();
  if (date === today) return "Today";
  const [y, m, d] = today.split("-").map(Number);
  const yest = new Date(y, m - 1, d - 1);
  if (date === `${yest.getFullYear()}-${pad(yest.getMonth() + 1)}-${pad(yest.getDate())}`) {
    return "Yesterday";
  }
  return formatDate(date);
}

/** Normalizes MM/DD/YYYY, DD-MM-YYYY, "Sep 12 2026", ISO … → "YYYY-MM-DD". */
export function normalizeDate(raw: string, preferDayFirst = false): DateKey | null {
  if (!raw) return null;
  const s = String(raw).trim();

  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${pad(Number(iso[2]))}-${pad(Number(iso[3]))}`;

  const slash = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/);
  if (slash) {
    const [, a, b, y] = slash;
    let year = Number(y);
    if (year < 100) year += year < 70 ? 2000 : 1900;
    let month = Number(a);
    let day = Number(b);
    // A value above 12 in the first slot can only be a day.
    if (month > 12 || preferDayFirst) [month, day] = [day, month];
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${year}-${pad(month)}-${pad(day)}`;
  }

  const parsed = new Date(s);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())}`;
  }
  return null;
}
