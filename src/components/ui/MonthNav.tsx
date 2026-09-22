"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { addMonths, currentMonth, formatMonth } from "@/lib/dates";

/**
 * One filter row, above everything it scopes — every card on the page re-renders
 * against the same month, so the numbers always agree.
 */
export function MonthNav({ month }: { month: string }) {
  const router = useRouter();
  const params = useSearchParams();

  function go(next: string) {
    const q = new URLSearchParams(params.toString());
    if (next === currentMonth()) q.delete("month");
    else q.set("month", next);
    const qs = q.toString();
    router.push(qs ? `?${qs}` : "?", { scroll: false });
  }

  const isCurrent = month === currentMonth();

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => go(addMonths(month, -1))}
        aria-label="Previous month"
        className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
      >
        ‹
      </button>
      <span className="min-w-[132px] text-center text-[13.5px] font-medium text-[var(--text-primary)]">
        {formatMonth(month)}
      </span>
      <button
        type="button"
        onClick={() => go(addMonths(month, 1))}
        aria-label="Next month"
        className="grid h-8 w-8 place-items-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
      >
        ›
      </button>
      {!isCurrent ? (
        <button
          type="button"
          onClick={() => go(currentMonth())}
          className="ml-1 rounded-[var(--radius-sm)] px-2 py-1 text-[12.5px] text-[var(--accent)] transition-colors hover:bg-[var(--accent-wash)]"
        >
          Today
        </button>
      ) : null}
    </div>
  );
}
