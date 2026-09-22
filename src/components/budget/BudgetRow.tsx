"use client";

import { useState } from "react";
import { Meter } from "@/components/ui/Meter";
import { IconTile } from "@/components/ui/IconTile";
import { setBudget } from "@/server/actions";
import { formatMoney } from "@/lib/money";
import type { BudgetLine } from "@/lib/types";

/**
 * The budget field saves on blur rather than behind a Save button — setting a
 * budget means sweeping down a long list, and a per-row save button turns that
 * into fifty taps.
 */
export function BudgetRow({ line, month }: { line: BudgetLine; month: string }) {
  const [value, setValue] = useState(
    line.budgetedCents > 0 ? (line.budgetedCents / 100).toFixed(0) : "",
  );

  const isIncome = line.kind === "income";
  const spent = Math.max(0, line.actualCents);
  const remaining = line.budgetedCents - spent;
  const over = line.budgetedCents > 0 && remaining < 0;

  return (
    <div className="relative px-4 py-3 after:pointer-events-none after:absolute after:right-0 after:bottom-0 after:left-[58px] after:h-[0.5px] after:bg-[var(--border)] last:after:hidden">
      <div className="flex items-center gap-3">
        <IconTile glyph={line.categoryIcon || "•"} colorSlot={line.colorSlot} />

        <div className="min-w-0 flex-1">
          <p className="t-body truncate text-[var(--text-primary)]">{line.categoryName}</p>
          <p className="tnum t-footnote text-[var(--text-secondary)]">
            {formatMoney(spent, { showCents: false })} {isIncome ? "received" : "spent"}
            {line.budgetedCents > 0 ? (
              <>
                {" · "}
                <span
                  style={{
                    color: over && !isIncome ? "var(--critical)" : "var(--text-secondary)",
                  }}
                >
                  {formatMoney(Math.abs(remaining), { showCents: false })}{" "}
                  {isIncome ? (over ? "above plan" : "to go") : over ? "over" : "left"}
                </span>
              </>
            ) : null}
          </p>
        </div>

        <form action={setBudget} className="shrink-0">
          <input type="hidden" name="month" value={month} />
          <input type="hidden" name="categoryId" value={line.categoryId} />
          <label className="sr-only" htmlFor={`budget-${line.categoryId}`}>
            Monthly budget for {line.categoryName}
          </label>
          <div className="relative">
            <span className="t-footnote pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[var(--text-muted)]">
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
              className="tnum t-body w-[96px] rounded-[9px] border-0 bg-[var(--surface-2)] py-1.5 pr-2.5 pl-5 text-right text-[var(--text-primary)] outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>
        </form>
      </div>

      {line.budgetedCents > 0 ? (
        <div className="mt-2.5 pl-[42px]">
          <Meter
            value={spent}
            max={line.budgetedCents}
            height={6}
            tone={isIncome ? "good" : undefined}
          />
        </div>
      ) : null}
    </div>
  );
}
