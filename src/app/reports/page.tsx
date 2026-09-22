import { Suspense } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { MonthNav } from "@/components/ui/MonthNav";
import { StatTile } from "@/components/ui/StatTile";
import { DonutChart } from "@/components/charts/DonutChart";
import { CashflowChart } from "@/components/charts/CashflowChart";
import { BarList } from "@/components/charts/BarList";
import {
  cashflowByMonth,
  monthSummary,
  spendingByCategory,
  spendingByGroup,
  topMerchants,
} from "@/server/queries";
import { currentMonth, formatMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

// Every page reads the local database, so nothing may be prerendered and cached.
export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month: raw } = await searchParams;
  const month = raw ?? currentMonth();

  const summary = monthSummary(month);
  const history = cashflowByMonth(month, 12);
  const previous = history[history.length - 2];
  const groups = spendingByGroup(month);
  const categories = spendingByCategory(month, 10);
  const merchants = topMerchants(month, 8);

  const withSpending = history.filter((h) => h.expenseCents > 0);
  const avgSpend = withSpending.length
    ? Math.round(withSpending.reduce((n, h) => n + h.expenseCents, 0) / withSpending.length)
    : 0;
  const bestMonth = withSpending.reduce<typeof withSpending[number] | null>(
    (best, h) => (!best || h.netCents > best.netCents ? h : best),
    null,
  );

  const spendDelta =
    previous && previous.expenseCents > 0
      ? ((summary.expenseCents - previous.expenseCents) / previous.expenseCents) * 100
      : null;

  return (
    <>
      <PageHeader
        title="Reports"
        subtitle="Patterns you can only see by zooming out."
      >
        <Suspense fallback={null}>
          <MonthNav month={month} />
        </Suspense>
      </PageHeader>

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <StatTile label="Income" cents={summary.incomeCents} />
        </Card>
        <Card>
          <StatTile
            label="Spending"
            cents={summary.expenseCents}
            delta={spendDelta ?? undefined}
            deltaLabel={previous ? `vs ${formatMonth(previous.month, "short")}` : undefined}
            upIsGood={false}
          />
        </Card>
        <Card>
          <StatTile label="Left over" cents={summary.netCents} />
        </Card>
        <Card>
          <StatTile
            label="Savings rate"
            value={`${summary.savingsRate.toFixed(0)}%`}
            hint={
              summary.savingsRate >= 20
                ? "Comfortably ahead"
                : summary.savingsRate > 0
                  ? "Positive — keep going"
                  : "Spending outpaced income"
            }
          />
        </Card>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader
            title="Twelve months of cashflow"
            subtitle={
              avgSpend > 0
                ? `You spend about ${formatMoney(avgSpend, { showCents: false })} a month on average.`
                : "Import a few months to see the trend."
            }
          />
          <CashflowChart points={history} />
        </Card>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="Spending by group" subtitle={formatMonth(month)} />
            <DonutChart slices={groups} />
          </Card>

          <Card>
            <CardHeader
              title="Top categories"
              subtitle={`${categories.length} categories with spending in ${formatMonth(month, "short")}`}
            />
            <BarList
              items={categories.map((c) => ({
                id: c.id,
                label: c.label,
                cents: c.cents,
                colorSlot: c.colorSlot,
                href: `/transactions?month=${month}&categoryId=${c.id}`,
              }))}
              valueLabel="Spent"
              emptyMessage="No categorized spending this month."
            />
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader
              title="Where it actually goes"
              subtitle="Your biggest merchants this month — usually more revealing than the categories."
            />
            <BarList
              items={merchants.map((m) => ({
                id: m.id,
                label: m.label,
                sublabel: `${m.icon}×`,
                cents: m.cents,
                href: `/transactions?month=${month}&search=${encodeURIComponent(m.label)}`,
              }))}
              valueLabel="Spent"
              emptyMessage="No spending this month."
            />
          </Card>

          <Card padded={false}>
            <div className="p-5 pb-3">
              <CardHeader
                title="Month by month"
                subtitle={
                  bestMonth
                    ? `Best month so far: ${formatMonth(bestMonth.month)}, keeping ${formatMoney(bestMonth.netCents, { showCents: false })}.`
                    : "No history yet."
                }
              />
            </div>
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-[13px]">
                <thead className="sticky top-0 bg-[var(--surface-2)]">
                  <tr>
                    <th scope="col" className="px-5 py-2 text-left font-medium text-[var(--text-secondary)]">
                      Month
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium text-[var(--text-secondary)]">
                      In
                    </th>
                    <th scope="col" className="px-3 py-2 text-right font-medium text-[var(--text-secondary)]">
                      Out
                    </th>
                    <th scope="col" className="px-5 py-2 text-right font-medium text-[var(--text-secondary)]">
                      Kept
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...history].reverse().map((h) => (
                    <tr key={h.month} className="border-t border-[var(--border)]">
                      <td className="px-5 py-2 text-[var(--text-primary)]">{formatMonth(h.month)}</td>
                      <td className="tnum px-3 py-2 text-right text-[var(--text-secondary)]">
                        {formatMoney(h.incomeCents, { showCents: false })}
                      </td>
                      <td className="tnum px-3 py-2 text-right text-[var(--text-secondary)]">
                        {formatMoney(h.expenseCents, { showCents: false })}
                      </td>
                      <td
                        className="tnum px-5 py-2 text-right font-medium"
                        style={{
                          color: h.netCents < 0 ? "var(--critical)" : "var(--text-primary)",
                        }}
                      >
                        {formatMoney(h.netCents, { showCents: false, signed: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
