import { Suspense } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { ListSection } from "@/components/ui/List";
import { PageHeader } from "@/components/ui/PageHeader";
import { MonthNav } from "@/components/ui/MonthNav";
import { Meter } from "@/components/ui/Meter";
import { StatTile } from "@/components/ui/StatTile";
import { BudgetRow } from "@/components/budget/BudgetRow";
import { ghostButton, primaryButton } from "@/components/ui/Dialog";
import { applySuggestedBudgets, clearBudgets, copyBudgets } from "@/server/actions";
import { budgetLines, budgetTotals, suggestedBudgets } from "@/server/queries";
import { addMonths, currentMonth, formatMonth, monthProgress } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

// Every page reads the local database, so nothing may be prerendered and cached.
export const dynamic = "force-dynamic";

export default async function BudgetPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: raw } = await searchParams;
  const month = raw ?? currentMonth();

  const lines = budgetLines(month);
  const totals = budgetTotals(lines);
  const suggestions = suggestedBudgets(month);
  const progress = monthProgress(month);

  const expenseLines = lines.filter((l) => l.kind === "expense");
  const incomeLines = lines.filter((l) => l.kind === "income");

  const byGroup = new Map<string, typeof expenseLines>();
  for (const l of expenseLines) {
    const list = byGroup.get(l.groupName) ?? [];
    list.push(l);
    byGroup.set(l.groupName, list);
  }

  const plannedIncome = incomeLines.reduce((n, l) => n + l.budgetedCents, 0);
  const actualIncome = incomeLines.reduce((n, l) => n + Math.max(0, l.actualCents), 0);

  // Only offer a suggestion for categories with real history and no budget yet.
  const suggestionPayload = expenseLines
    .filter((l) => suggestions.has(l.categoryId) && (suggestions.get(l.categoryId) ?? 0) > 0)
    .map((l) => [l.categoryId, suggestions.get(l.categoryId)!] as [string, number]);

  const paceRatio = totals.budgetedCents > 0 ? totals.actualCents / totals.budgetedCents : 0;
  const onPace = paceRatio <= progress + 0.05;

  return (
    <>
      <PageHeader
        title="Budget"
        subtitle="Give every category a number. The number is a plan, not a promise — adjust it until it fits your real life."
      >
        <Suspense fallback={null}>
          <MonthNav month={month} />
        </Suspense>
      </PageHeader>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card>
          <StatTile
            label="Budgeted"
            cents={totals.budgetedCents}
            hint={`${totals.trackedCount} categories`}
          />
        </Card>
        <Card>
          <StatTile
            label="Spent"
            cents={totals.actualCents}
            hint={
              totals.budgetedCents > 0
                ? `${(paceRatio * 100).toFixed(0)}% of budget · ${(progress * 100).toFixed(0)}% through the month`
                : "No budget set"
            }
          />
        </Card>
        <Card>
          <div className="flex flex-col justify-between gap-2">
            <p className="t-subhead text-[var(--text-secondary)]">Remaining</p>
            <p
              className="figure text-[27px] leading-none"
              style={{
                color: totals.remainingCents < 0 ? "var(--critical)" : "var(--text-primary)",
              }}
            >
              {formatMoney(totals.remainingCents, { showCents: false })}
            </p>
            <p
              className="t-footnote"
              style={{ color: onPace ? "var(--good)" : "var(--warning)" }}
            >
              {totals.budgetedCents === 0
                ? "Set a budget to track pace"
                : onPace
                  ? "On pace for the month"
                  : "Spending faster than planned"}
            </p>
          </div>
        </Card>
      </div>

      {totals.budgetedCents > 0 ? (
        <Card className="mb-4">
          <CardHeader
            title="Overall progress"
            subtitle={`${formatMoney(totals.actualCents, { showCents: false })} of ${formatMoney(totals.budgetedCents, { showCents: false })} · ${totals.overCount} categories over`}
          />
          <Meter value={totals.actualCents} max={totals.budgetedCents} height={12} />
        </Card>
      ) : null}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {suggestionPayload.length ? (
          <form action={applySuggestedBudgets}>
            <input type="hidden" name="month" value={month} />
            <input type="hidden" name="suggestions" value={JSON.stringify(suggestionPayload)} />
            <button type="submit" className={primaryButton}>
              Suggest a budget from my last 3 months
            </button>
          </form>
        ) : null}
        <form action={copyBudgets}>
          <input type="hidden" name="from" value={addMonths(month, -1)} />
          <input type="hidden" name="to" value={month} />
          <button type="submit" className={ghostButton}>
            Copy {formatMonth(addMonths(month, -1), "short")}
          </button>
        </form>
        {totals.budgetedCents > 0 ? (
          <form action={clearBudgets}>
            <input type="hidden" name="month" value={month} />
            <button
              type="submit"
              className="rounded-[var(--radius-sm)] px-3 py-2 text-[13px] text-[var(--text-muted)] transition-colors hover:bg-[var(--critical-wash)] hover:text-[var(--critical)]"
            >
              Clear this month
            </button>
          </form>
        ) : null}
      </div>

      <div className="flex flex-col gap-5">
        {incomeLines.length ? (
          <ListSection
            header="Expected income"
            trailing={
              <span className="tnum">
                {formatMoney(actualIncome, { showCents: false })} received of{" "}
                {formatMoney(plannedIncome, { showCents: false })} planned
              </span>
            }
          >
            {incomeLines.map((l) => (
              <BudgetRow key={l.categoryId} line={l} month={month} />
            ))}
          </ListSection>
        ) : null}

        {[...byGroup.entries()].map(([group, items]) => {
          const budgeted = items.reduce((n, l) => n + l.budgetedCents, 0);
          const spent = items.reduce((n, l) => n + Math.max(0, l.actualCents), 0);
          return (
            <ListSection
              key={group}
              header={group}
              trailing={
                <span className="tnum">
                  {formatMoney(spent, { showCents: false })}
                  {budgeted > 0 ? ` of ${formatMoney(budgeted, { showCents: false })}` : ""}
                </span>
              }
            >
              {items.map((l) => (
                <BudgetRow key={l.categoryId} line={l} month={month} />
              ))}
            </ListSection>
          );
        })}
      </div>
    </>
  );
}
