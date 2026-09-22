import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { MonthNav } from "@/components/ui/MonthNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { TransactionDialog } from "@/components/transactions/TransactionDialog";
import { TransactionFilters } from "@/components/transactions/TransactionFilters";
import { CategorySelect } from "@/components/transactions/CategorySelect";
import { countTransactions, listAccounts, listCategories, listTransactions } from "@/server/queries";
import { currentMonth, formatDate, formatMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/money";
import { primaryButton } from "@/components/ui/Dialog";

const PAGE_SIZE = 50;

// Every page reads the local database, so nothing may be prerendered and cached.
export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const month = sp.month ?? currentMonth();
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const filter = {
    month,
    accountId: sp.accountId,
    categoryId: sp.categoryId,
    search: sp.search,
    uncategorized: sp.uncategorized === "1",
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  };

  const accounts = listAccounts();
  const categories = listCategories();
  const transactions = listTransactions(filter);
  const total = countTransactions(filter);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const inflow = transactions.filter((t) => t.amountCents > 0).reduce((n, t) => n + t.amountCents, 0);
  const outflow = transactions.filter((t) => t.amountCents < 0).reduce((n, t) => n - t.amountCents, 0);

  const byDate = new Map<string, typeof transactions>();
  for (const t of transactions) {
    const list = byDate.get(t.date) ?? [];
    list.push(t);
    byDate.set(t.date, list);
  }

  const query = (overrides: Record<string, string>) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...overrides })) if (v) q.set(k, String(v));
    return `/transactions?${q.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Transactions"
        subtitle={`${total} in ${formatMonth(month)} · ${formatMoney(outflow, { showCents: false })} out, ${formatMoney(inflow, { showCents: false })} in`}
      >
        <Suspense fallback={null}>
          <MonthNav month={month} />
        </Suspense>
        {accounts.length ? (
          <TransactionDialog
            accounts={accounts}
            categories={categories}
            trigger={{ label: "Add transaction", className: primaryButton }}
          />
        ) : null}
      </PageHeader>

      <Suspense fallback={null}>
        <TransactionFilters accounts={accounts} categories={categories} />
      </Suspense>

      <Card padded={false}>
        {!accounts.length ? (
          <EmptyState
            icon="▤"
            title="Add an account first"
            body="Transactions belong to an account — a checking account, a credit card, whatever you're tracking. Create one and you can start logging spending."
            cta="Add an account"
            href="/accounts"
          />
        ) : !transactions.length ? (
          <EmptyState
            icon="≡"
            title="No transactions match"
            body="Try a different month, clear the filters, or import a statement from your bank."
            cta="Import a CSV"
            href="/import"
          />
        ) : (
          <>
            {[...byDate.entries()].map(([date, items]) => (
              <div key={date}>
                <div className="sticky top-0 z-10 flex items-center justify-between border-y border-[var(--border)] bg-[var(--surface-2)] px-4 py-1.5 first:border-t-0">
                  <span className="text-[12px] font-medium text-[var(--text-secondary)]">
                    {formatDate(date, "long")}
                  </span>
                  <span className="tnum text-[12px] text-[var(--text-muted)]">
                    {formatMoney(
                      items.reduce((n, t) => n + t.amountCents, 0),
                      { showCents: false, signed: true },
                    )}
                  </span>
                </div>
                <ul>
                  {items.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-2.5 transition-colors last:border-b-0 hover:bg-[var(--surface-2)]"
                    >
                      <span
                        aria-hidden
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--surface-2)] text-[14px]"
                      >
                        {t.categoryIcon ?? "•"}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] text-[var(--text-primary)]">
                          {t.merchant}
                          {t.excluded ? (
                            <span className="ml-2 rounded-full bg-[var(--surface-3)] px-1.5 py-0.5 text-[10.5px] text-[var(--text-muted)]">
                              excluded
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-[11.5px] text-[var(--text-muted)]">
                          {t.accountName}
                          {t.notes ? ` · ${t.notes}` : ""}
                        </p>
                      </div>

                      <div className="hidden shrink-0 sm:block">
                        <CategorySelect transaction={t} categories={categories} />
                      </div>

                      <span
                        className="tnum w-24 shrink-0 text-right text-[13.5px] font-medium"
                        style={{ color: t.amountCents > 0 ? "var(--good)" : "var(--text-primary)" }}
                      >
                        {formatMoney(t.amountCents, { signed: true })}
                      </span>

                      <TransactionDialog
                        accounts={accounts}
                        categories={categories}
                        transaction={t}
                        trigger={{
                          label: "Edit",
                          className:
                            "shrink-0 rounded-[6px] px-2 py-1 text-[12px] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]",
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {pages > 1 ? (
              <div className="flex items-center justify-between px-4 py-3 text-[13px]">
                <span className="text-[var(--text-muted)]">
                  Page {page} of {pages}
                </span>
                <div className="flex gap-2">
                  {page > 1 ? (
                    <Link href={query({ page: String(page - 1) })} className="text-[var(--accent)] hover:underline">
                      ‹ Previous
                    </Link>
                  ) : null}
                  {page < pages ? (
                    <Link href={query({ page: String(page + 1) })} className="text-[var(--accent)] hover:underline">
                      Next ›
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : null}
          </>
        )}
      </Card>
    </>
  );
}
