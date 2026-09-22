"use client";

import { useState } from "react";
import { Meter } from "@/components/ui/Meter";
import { setBudget } from "@/server/actions";
import { formatMoney } from "@/lib/money";
import type { BudgetLine } from "@/lib/types";

/**
 * The budget field saves on blur rather than behind a Save button — setting a
 * budget means sweeping down a long list, and a per-row save button turns that
 * into fifty clicks.
 */
export function BudgetRow({ line, month }: { line: BudgetLine; month: string }) {
  const [value, setValue] = useState(
    line.budgetedCents > 0 ? (line.budgetedCents / 100).toFixed(0) : "",
  );

  const spent = Math.max(0, line.actualCents);
  const remaining = line.budgetedCents - spent;
  const over = line.budgetedCents > 0 && remaining < 0;

  return (
    <li className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-[var(--border)] px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_110px_120px_110px]">
      <div className="flex min-w-0 items-center gap-2.5">
        <span aria-hidden className="text-[15px]">
          {line.categoryIcon}
        </span>
        <span className="truncate text-[13.5px] text-[var(--text-primary)]">
          {line.categoryName}
        </span>
      </div>

      <form action={setBudget} className="justify-self-end">
        <input type="hidden" name="month" value={month} />
        <input type="hidden" name="categoryId" value={line.categoryId} />
        <label className="sr-only" htmlFor={`budget-${line.categoryId}`}>
          Monthly budget for {line.categoryName}
        </label>
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[12.5px] text-[var(--text-muted)]">
            $
          </span>
          <input
            id={`budget-${line.categoryId}`}
            name="amount"
            inputMode="decimal"
            value={value}
            placeholder="—"
            onChange={(e) => setValue(e.target.value)}
            onBlur={(e) => e.currentTarget.form?.requestSubmit()}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                e.currentTarget.blur();
              }
            }}
            className="tnum w-[104px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-1)] py-1.5 pr-2 pl-5 text-right text-[13px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-wash)]"
          />
        </div>
      </form>

      <div className="col-span-2 sm:col-span-1 sm:justify-self-stretch">
        {line.budgetedCents > 0 ? (
          <Meter value={spent} max={line.budgetedCents} />
        ) : (
          <div className="h-2 w-full rounded-full bg-[var(--surface-2)]" />
        )}
        <p className="tnum mt-1 text-[11.5px] text-[var(--text-muted)]">
          {formatMoney(spent, { showCents: false })} spent
        </p>
      </div>

      <div className="col-span-2 text-right sm:col-span-1">
        {line.budgetedCents > 0 ? (
          <p
            className="tnum text-[13px] font-medium"
            style={{ color: over ? "var(--critical)" : "var(--text-primary)" }}
          >
            {formatMoney(Math.abs(remaining), { showCents: false })}
            <span className="ml-1 text-[11.5px] font-normal text-[var(--text-muted)]">
              {over ? "over" : "left"}
            </span>
          </p>
        ) : (
          <p className="text-[12px] text-[var(--text-muted)]">Not budgeted</p>
        )}
      </div>
    </li>
  );
}
