import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Meter } from "@/components/ui/Meter";
import { StatTile } from "@/components/ui/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { GoalDialog } from "@/components/goals/GoalDialog";
import { primaryButton } from "@/components/ui/Dialog";
import { contributeToGoal } from "@/server/actions";
import { listGoals, monthSummary } from "@/server/queries";
import { currentMonth, formatDate, todayKey } from "@/lib/dates";
import { formatMoney } from "@/lib/money";

const KIND_LABEL = {
  savings: "Savings goal",
  emergency: "Emergency fund",
  debt: "Debt payoff",
} as const;

// Every page reads the local database, so nothing may be prerendered and cached.
export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const goals = listGoals();
  const thisMonth = monthSummary(currentMonth());

  const totalTarget = goals.reduce((n, g) => n + g.targetCents, 0);
  const totalSaved = goals.reduce((n, g) => n + g.savedCents, 0);
  const complete = goals.filter((g) => g.savedCents >= g.targetCents).length;

  return (
    <>
      <PageHeader
        title="Goals"
        subtitle="The reason the budget exists. Watch them fill up."
      >
        <GoalDialog trigger={{ label: "New goal", className: primaryButton }} />
      </PageHeader>

      {goals.length ? (
        <div className="mb-4 grid gap-4 sm:grid-cols-3">
          <Card>
            <StatTile label="Saved toward goals" cents={totalSaved} hero />
          </Card>
          <Card>
            <StatTile
              label="Total target"
              cents={totalTarget}
              hint={`${totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(0) : 0}% of the way there`}
            />
          </Card>
          <Card>
            <StatTile
              label="Goals reached"
              value={`${complete} of ${goals.length}`}
              hint={
                thisMonth.netCents > 0
                  ? `${formatMoney(thisMonth.netCents, { showCents: false })} left over this month`
                  : "Spending more than you earned this month"
              }
            />
          </Card>
        </div>
      ) : null}

      {!goals.length ? (
        <Card>
          <EmptyState
            icon="◇"
            title="No goals yet"
            body="A budget without a goal is just a restriction. Name the thing you're actually saving for — an emergency fund, a trip, getting a card to zero — and the tradeoffs start making sense."
          >
            <GoalDialog trigger={{ label: "Create your first goal", className: primaryButton }} />
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {goals.map((g) => {
            const pct = g.targetCents > 0 ? (g.savedCents / g.targetCents) * 100 : 0;
            const remaining = Math.max(0, g.targetCents - g.savedCents);
            const done = g.savedCents >= g.targetCents;

            let pace: string | null = null;
            if (g.targetDate && !done) {
              const today = todayKey();
              const months = monthsBetween(today, g.targetDate);
              pace =
                months > 0
                  ? `${formatMoney(Math.ceil(remaining / months), { showCents: false })} a month to finish by ${formatDate(g.targetDate, "long")}`
                  : `Target date has passed — ${formatMoney(remaining, { showCents: false })} to go`;
            }

            return (
              <Card key={g.id}>
                <CardHeader
                  title={g.name}
                  subtitle={KIND_LABEL[g.kind] ?? "Savings goal"}
                  action={
                    <GoalDialog
                      goal={g}
                      trigger={{
                        label: "Edit",
                        className:
                          "rounded-[6px] px-2 py-1 text-[12px] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]",
                      }}
                    />
                  }
                />

                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <span className="figure text-[26px] leading-none font-semibold text-[var(--text-primary)]">
                    {formatMoney(g.savedCents, { showCents: false })}
                  </span>
                  <span className="tnum text-[13px] text-[var(--text-muted)]">
                    of {formatMoney(g.targetCents, { showCents: false })}
                  </span>
                </div>

                <Meter
                  value={g.savedCents}
                  max={g.targetCents}
                  height={10}
                  tone={done ? "good" : "accent"}
                />

                <p className="mt-2 text-[12.5px] text-[var(--text-secondary)]">
                  {done ? (
                    <span className="font-medium text-[var(--good)]">Goal reached 🎉</span>
                  ) : (
                    <>
                      <span className="font-medium text-[var(--text-primary)]">
                        {pct.toFixed(0)}%
                      </span>{" "}
                      · {formatMoney(remaining, { showCents: false })} to go
                    </>
                  )}
                </p>
                {pace ? <p className="mt-1 text-[12px] text-[var(--text-muted)]">{pace}</p> : null}
                {g.note ? (
                  <p className="mt-1 text-[12px] text-[var(--text-muted)]">{g.note}</p>
                ) : null}

                <form
                  action={contributeToGoal}
                  className="mt-4 flex items-center gap-2 border-t border-[var(--border)] pt-3"
                >
                  <input type="hidden" name="id" value={g.id} />
                  <label className="sr-only" htmlFor={`contribute-${g.id}`}>
                    Add to {g.name}
                  </label>
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-[12.5px] text-[var(--text-muted)]">
                      $
                    </span>
                    <input
                      id={`contribute-${g.id}`}
                      name="amount"
                      inputMode="decimal"
                      placeholder="Add a contribution"
                      className="tnum w-full rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-1)] py-1.5 pr-2 pl-5 text-[13px] text-[var(--text-primary)] outline-none transition-colors focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-wash)]"
                    />
                  </div>
                  <button
                    type="submit"
                    className="rounded-[var(--radius-sm)] border border-[var(--border)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
                  >
                    Add
                  </button>
                </form>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}
