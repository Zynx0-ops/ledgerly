import Link from "next/link";
import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { MonthNav } from "@/components/ui/MonthNav";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSection } from "@/components/ui/List";
import { IconTile } from "@/components/ui/IconTile";
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
            trigger={{ label: "Add", className: primaryButton }}
          />
        ) : null}
      </PageHeader>

      <Suspense fallback={null}>
        <TransactionFilters accounts={accounts} categories={categories} />
      </Suspense>

      {!accounts.length ? (
        <Card>
          <EmptyState
            icon="▤"
            title="Add an account first"
            body="Transactions belong to an account — a checking account, a credit card, whatever you're tracking. Create one and you can start logging spending."
            cta="Add an account"
            href="/accounts"
          />
        </Card>
      ) : !transactions.length ? (
        <Card>
          <EmptyState
            icon="⇅"
            title="No transactions match"
            body="Try a different month, clear the filters, or import a statement from your bank."
            cta="Import a CSV"
            href="/import"
          />
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {[...byDate.entries()].map(([date, items]) => (
            <ListSection
              key={date}
              header={formatDate(date, "long")}
              trailing={
                <span className="tnum">
                  {formatMoney(
                    items.reduce((n, t) => n + t.amountCents, 0),
                    { showCents: false, signed: true },
                  )}
                </span>
              }
            >
              {items.map((t) => (
                <div
                  key={t.id}
                  className="pressable relative flex items-center gap-3 px-4 py-2.5 after:pointer-events-none after:absolute after:right-0 after:bottom-0 after:left-[58px] after:h-[0.5px] after:bg-[var(--border)] last:after:hidden hover:bg-[var(--surface-2)]"
                >
                  <IconTile glyph={t.categoryIcon ?? "•"} colorSlot={t.categoryColorSlot} />

                  <div className="min-w-0 flex-1">
                    <p className="t-body truncate text-[var(--text-primary)]">
                      {t.merchant}
                      {t.excluded ? (
                        <span className="t-caption ml-2 rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[var(--text-secondary)]">
                          excluded
                        </span>
                      ) : null}
                    </p>
                    <CategorySelect transaction={t} categories={categories} />
                  </div>

                  <div className="shrink-0 text-right">
                    <p
                      className="tnum t-body font-medium"
                      style={{ color: t.amountCents > 0 ? "var(--good)" : "var(--text-primary)" }}
                    >
                      {formatMoney(t.amountCents, { signed: true })}
                    </p>
                    <p className="t-caption truncate text-[var(--text-secondary)]">{t.accountName}</p>
                  </div>

                  <TransactionDialog
                    accounts={accounts}
                    categories={categories}
                    transaction={t}
                    trigger={{
                      label: "›",
                      className:
                        "shrink-0 px-1 text-[17px] leading-none text-[var(--text-muted)] transition-opacity hover:text-[var(--text-secondary)] active:opacity-50",
                    }}
                  />
                </div>
              ))}
            </ListSection>
          ))}

          {pages > 1 ? (
            <div className="flex items-center justify-between px-1">
              <span className="t-footnote text-[var(--text-secondary)]">
                Page {page} of {pages}
              </span>
              <div className="flex gap-4">
                {page > 1 ? (
                  <Link href={query({ page: String(page - 1) })} className="t-subhead text-[var(--accent)]">
                    ‹ Previous
                  </Link>
                ) : null}
                {page < pages ? (
                  <Link href={query({ page: String(page + 1) })} className="t-subhead text-[var(--accent)]">
                    Next ›
                  </Link>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </>
  );
}
