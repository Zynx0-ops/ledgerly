import Link from "next/link";
import { Suspense } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { Meter } from "@/components/ui/Meter";
import { MonthNav } from "@/components/ui/MonthNav";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DonutChart } from "@/components/charts/DonutChart";
import { CashflowChart } from "@/components/charts/CashflowChart";
import { PaceChart } from "@/components/charts/PaceChart";
import { BarList } from "@/components/charts/BarList";
import {
  budgetLines,
  budgetTotals,
  cashflowByMonth,
  dailyCumulativeSpend,
  listGoals,
  listTransactions,
  monthSummary,
  netWorth,
  spendingByCategory,
  spendingByGroup,
} from "@/server/queries";
import { currentMonth, daysInMonth, formatMonth, relativeDate, todayKey } from "@/lib/dates";
import { formatMoney, percent } from "@/lib/money";
import { seriesVar } from "@/lib/palette";

// Every page reads the local database, so nothing may be prerendered and cached.
export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: raw } = await searchParams;
  const month = raw ?? currentMonth();

  const summary = monthSummary(month);
  const prev = monthSummary(cashflowByMonth(month, 2)[0].month);
  const lines = budgetLines(month);
  const totals = budgetTotals(lines);
  const worth = netWorth();
  const groups = spendingByGroup(month);
  const topCategories = spendingByCategory(month, 6);
  const cashflow = cashflowByMonth(month, 6);
  const recent = listTransactions({ month, limit: 6 });
  const goals = listGoals().slice(0, 3);

  const isCurrentMonth = month === currentMonth();
  const elapsed = isCurrentMonth ? Number(todayKey().slice(8)) : daysInMonth(month);
  const days = dailyCumulativeSpend(month);

  const leftToSpend = totals.budgetedCents - totals.actualCents;
  const spendDelta =
    prev.expenseCents > 0
      ? ((summary.expenseCents - prev.expenseCents) / prev.expenseCents) * 100
      : null;

  const overBudget = lines
    .filter((l) => l.kind === "expense" && l.budgetedCents > 0)
    .sort((a, b) => b.actualCents / b.budgetedCents - a.actualCents / a.budgetedCents)
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={
          isCurrentMonth
            ? `Day ${elapsed} of ${daysInMonth(month)} — here's where you stand.`
            : `A look back at ${formatMonth(month)}.`
        }
      >
        <Suspense fallback={null}>
          <MonthNav month={month} />
        </Suspense>
      </PageHeader>

      {summary.transactionCount === 0 && totals.budgetedCents === 0 ? (
        <Card>
          <EmptyState
            icon="◎"
            title="Nothing here yet — let's fix that"
            body="Import a CSV from your bank or add a transaction by hand. Once Ledgerly can see a month of spending, it can suggest a budget that matches how you actually live."
            cta="Import a CSV"
            href="/import"
          >
            <Link
              href="/transactions"
              className="text-[13px] text-[var(--accent)] underline-offset-2 hover:underline"
            >
              or add a transaction manually
            </Link>
          </EmptyState>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {/* Hero — exactly one per view. */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader
                title={totals.budgetedCents > 0 ? "Left to spend this month" : "Spent this month"}
                subtitle={
                  totals.budgetedCents > 0
                    ? `${formatMoney(totals.actualCents, { showCents: false })} of ${formatMoney(totals.budgetedCents, { showCents: false })} budgeted`
                    : "Set a budget to see how much is safe to spend."
                }
                action={
                  totals.budgetedCents === 0 ? (
                    <Link
                      href={`/budget?month=${month}`}
                      className="rounded-[var(--radius-sm)] bg-[var(--accent)] px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-[var(--accent-hover)]"
                    >
                      Set a budget
                    </Link>
                  ) : null
                }
              />
              <p
                className="figure text-[44px] leading-none font-semibold"
                style={{
                  color:
                    totals.budgetedCents > 0 && leftToSpend < 0
                      ? "var(--critical)"
                      : "var(--text-primary)",
                }}
              >
                {formatMoney(
                  totals.budgetedCents > 0 ? leftToSpend : summary.expenseCents,
                  { showCents: false },
                )}
              </p>
              {totals.budgetedCents > 0 ? (
                <div className="mt-3">
                  <Meter value={totals.actualCents} max={totals.budgetedCents} height={10} />
                </div>
              ) : null}

              <div className="mt-5 border-t border-[var(--border)] pt-4">
                <PaceChart
                  days={days}
                  budgetCents={totals.budgetedCents}
                  elapsedDays={elapsed}
                />
              </div>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <Card>
                <StatTile
                  label="Spent this month"
                  cents={summary.expenseCents}
                  delta={spendDelta ?? undefined}
                  deltaLabel={spendDelta != null ? `vs ${formatMonth(prev.month, "short")}` : undefined}
                  upIsGood={false}
                />
              </Card>
              <Card>
                <StatTile
                  label="Income this month"
                  cents={summary.incomeCents}
                  hint={`${summary.transactionCount} transactions`}
                />
              </Card>
              <Card>
                <StatTile
                  label="Saved this month"
                  cents={summary.netCents}
                  hint={
                    summary.incomeCents > 0
                      ? `${summary.savingsRate.toFixed(0)}% savings rate`
                      : "Add income to see your rate"
                  }
                />
              </Card>
              <Card>
                <StatTile
                  label="Net worth"
                  cents={worth.netCents}
                  hint={`${formatMoney(worth.assetsCents, { showCents: false })} assets · ${formatMoney(worth.liabilitiesCents, { showCents: false })} owed`}
                />
              </Card>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Where the money went"
                subtitle={formatMonth(month)}
                action={
                  <Link
                    href={`/reports?month=${month}`}
                    className="text-[12.5px] text-[var(--accent)] hover:underline"
                  >
                    Reports →
                  </Link>
                }
              />
              <DonutChart slices={groups} centerLabel="Spent" />
            </Card>

            <Card>
              <CardHeader
                title="Budget status"
                subtitle={
                  totals.trackedCount > 0
                    ? `${totals.overCount} of ${totals.trackedCount} categories over budget`
                    : "No categories budgeted yet"
                }
                action={
                  <Link
                    href={`/budget?month=${month}`}
                    className="text-[12.5px] text-[var(--accent)] hover:underline"
                  >
                    Budget →
                  </Link>
                }
              />
              {overBudget.length ? (
                <ul className="flex flex-col gap-3">
                  {overBudget.map((l) => {
                    const used = percent(l.actualCents, l.budgetedCents);
                    return (
                      <li key={l.categoryId}>
                        <div className="mb-1.5 flex items-baseline justify-between gap-3">
                          <span className="flex min-w-0 items-center gap-2">
                            <span aria-hidden className="text-[13px]">
                              {l.categoryIcon}
                            </span>
                            <span className="truncate text-[13px] text-[var(--text-primary)]">
                              {l.categoryName}
                            </span>
                          </span>
                          <span className="tnum shrink-0 text-[12.5px] text-[var(--text-secondary)]">
                            {formatMoney(l.actualCents, { showCents: false })}
                            <span className="text-[var(--text-muted)]">
                              {" / "}
                              {formatMoney(l.budgetedCents, { showCents: false })}
                            </span>
                          </span>
                        </div>
                        <Meter value={l.actualCents} max={l.budgetedCents} />
                        {used > 100 ? (
                          <p className="mt-1 text-[11.5px] text-[var(--critical)]">
                            {formatMoney(l.actualCents - l.budgetedCents, { showCents: false })} over
                          </p>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <EmptyState
                  icon="◑"
                  title="No budget set for this month"
                  body="Ledgerly can suggest one from what you actually spent over the last three months — a budget you have a real chance of keeping."
                  cta="Build my budget"
                  href={`/budget?month=${month}`}
                />
              )}
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Income vs spending"
              subtitle="The last six months. Bars above the line you keep."
            />
            <CashflowChart points={cashflow} />
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader
                title="Biggest categories"
                subtitle={formatMonth(month)}
                action={
                  <Link
                    href={`/transactions?month=${month}`}
                    className="text-[12.5px] text-[var(--accent)] hover:underline"
                  >
                    All transactions →
                  </Link>
                }
              />
              <BarList
                items={topCategories.map((c) => ({
                  id: c.id,
                  label: c.label,
                  cents: c.cents,
                  colorSlot: c.colorSlot,
                  href: `/transactions?month=${month}&categoryId=${c.id}`,
                }))}
                valueLabel="Spent"
                emptyMessage="No categorized spending this month yet."
              />
            </Card>

            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader
                  title="Recent activity"
                  action={
                    <Link
                      href="/transactions"
                      className="text-[12.5px] text-[var(--accent)] hover:underline"
                    >
                      View all →
                    </Link>
                  }
                />
                {recent.length ? (
                  <ul className="flex flex-col">
                    {recent.map((t) => (
                      <li
                        key={t.id}
                        className="flex items-center gap-3 border-b border-[var(--border)] py-2.5 last:border-b-0"
                      >
                        <span
                          aria-hidden
                          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px]"
                          style={{ background: "var(--surface-2)" }}
                        >
                          {t.categoryIcon ?? "•"}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] text-[var(--text-primary)]">
                            {t.merchant}
                          </span>
                          <span className="flex items-center gap-1.5 text-[11.5px] text-[var(--text-muted)]">
                            {t.categoryColorSlot ? (
                              <span
                                aria-hidden
                                className="h-1.5 w-1.5 rounded-full"
                                style={{ background: seriesVar(t.categoryColorSlot) }}
                              />
                            ) : null}
                            {t.categoryName ?? "Uncategorized"} · {relativeDate(t.date)}
                          </span>
                        </span>
                        <span
                          className="tnum shrink-0 text-[13px] font-medium"
                          style={{
                            color:
                              t.amountCents > 0 ? "var(--good)" : "var(--text-primary)",
                          }}
                        >
                          {formatMoney(t.amountCents, { signed: true })}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-6 text-center text-[13px] text-[var(--text-muted)]">
                    No transactions in {formatMonth(month)}.
                  </p>
                )}
              </Card>

              {goals.length ? (
                <Card>
                  <CardHeader
                    title="Goals"
                    action={
                      <Link
                        href="/goals"
                        className="text-[12.5px] text-[var(--accent)] hover:underline"
                      >
                        All goals →
                      </Link>
                    }
                  />
                  <ul className="flex flex-col gap-3">
                    {goals.map((g) => (
                      <li key={g.id}>
                        <div className="mb-1.5 flex items-baseline justify-between gap-3">
                          <span className="truncate text-[13px] text-[var(--text-primary)]">
                            {g.name}
                          </span>
                          <span className="tnum shrink-0 text-[12.5px] text-[var(--text-secondary)]">
                            {formatMoney(g.savedCents, { showCents: false })}
                            <span className="text-[var(--text-muted)]">
                              {" / "}
                              {formatMoney(g.targetCents, { showCents: false })}
                            </span>
                          </span>
                        </div>
                        <Meter
                          value={g.savedCents}
                          max={g.targetCents}
                          tone={g.savedCents >= g.targetCents ? "good" : "accent"}
                        />
                      </li>
                    ))}
                  </ul>
                </Card>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
