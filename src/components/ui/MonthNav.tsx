"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { addMonths, currentMonth, formatMonth } from "@/lib/dates";

/**
 * A joined stepper pill, the way iOS Calendar and Health page through time.
 * One filter row, above everything it scopes — every card re-renders against
 * the same month, so the numbers always agree.
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
    <div className="flex items-center gap-2">
      <div className="flex items-center rounded-full bg-[var(--surface-2)] p-[3px]">
        <button
          type="button"
          onClick={() => go(addMonths(month, -1))}
          aria-label="Previous month"
          className="grid h-7 w-8 place-items-center rounded-full text-[15px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] active:opacity-60"
        >
          ‹
        </button>
        <span className="t-subhead min-w-[124px] px-1 text-center font-semibold text-[var(--text-primary)]">
          {formatMonth(month)}
        </span>
        <button
          type="button"
          onClick={() => go(addMonths(month, 1))}
          aria-label="Next month"
          className="grid h-7 w-8 place-items-center rounded-full text-[15px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)] active:opacity-60"
        >
          ›
        </button>
      </div>
      {!isCurrent ? (
        <button
          type="button"
          onClick={() => go(currentMonth())}
          className="t-subhead text-[var(--accent)] transition-opacity active:opacity-60"
        >
          Today
        </button>
      ) : null}
    </div>
  );
}
