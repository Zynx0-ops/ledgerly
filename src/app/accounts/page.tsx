import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSection } from "@/components/ui/List";
import { IconTile } from "@/components/ui/IconTile";
import { AccountDialog } from "@/components/accounts/AccountDialog";
import { primaryButton } from "@/components/ui/Dialog";
import { listAccounts, netWorth } from "@/server/queries";
import { accountGlyph, accountSlot, accountTypeLabel, isLiability, type Account } from "@/lib/types";
import { formatMoney } from "@/lib/money";

const SECTIONS: { title: string; types: Account["type"][]; note: string }[] = [
  { title: "Cash", types: ["checking", "savings", "cash"], note: "Money you can spend today" },
  { title: "Investments", types: ["investment"], note: "Long-term holdings" },
  { title: "Debt", types: ["credit", "loan"], note: "What you owe" },
];

// Every page reads the local database, so nothing may be prerendered and cached.
export const dynamic = "force-dynamic";

export default async function AccountsPage() {
  const accounts = listAccounts();
  const worth = netWorth();

  return (
    <>
      <PageHeader title="Accounts" subtitle="Every balance you're tracking, and what they add up to.">
        <AccountDialog trigger={{ label: "Add", className: primaryButton }} />
      </PageHeader>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Card>
          <StatTile label="Net worth" cents={worth.netCents} hero />
        </Card>
        <Card>
          <StatTile label="Assets" cents={worth.assetsCents} />
        </Card>
        <Card>
          <StatTile
            label="Debt"
            cents={worth.liabilitiesCents}
            tone={worth.liabilitiesCents > 0 ? "critical" : undefined}
            hint={
              worth.assetsCents > 0
                ? `${((worth.liabilitiesCents / worth.assetsCents) * 100).toFixed(0)}% of assets`
                : undefined
            }
          />
        </Card>
      </div>

      {!accounts.length ? (
        <Card>
          <EmptyState
            icon="▤"
            title="No accounts yet"
            body="Add the accounts you want to track — checking, savings, a credit card. Balances are entered by hand and stay on your machine; Ledgerly never asks for bank logins."
          >
            <div className="mt-2">
              <AccountDialog
                trigger={{ label: "Add your first account", className: primaryButton }}
              />
            </div>
          </EmptyState>
        </Card>
      ) : (
        <div className="flex flex-col gap-5">
          {SECTIONS.map((section) => {
            const items = accounts.filter((a) => section.types.includes(a.type));
            if (!items.length) return null;
            const total = items.reduce((n, a) => n + a.balanceCents, 0);
            const liability = isLiability(items[0].type);

            return (
              <ListSection
                key={section.title}
                header={section.title}
                trailing={
                  <span
                    className="tnum font-semibold"
                    style={{ color: liability ? "var(--critical)" : "var(--text-primary)" }}
                  >
                    {liability ? "−" : ""}
                    {formatMoney(total)}
                  </span>
                }
                footer={section.note}
              >
                {items.map((a) => (
                  <div
                    key={a.id}
                    className="pressable relative flex items-center gap-3 px-4 py-2.5 after:pointer-events-none after:absolute after:right-0 after:bottom-0 after:left-[58px] after:h-[0.5px] after:bg-[var(--border)] last:after:hidden hover:bg-[var(--surface-2)]"
                  >
                    <IconTile glyph={accountGlyph(a.type)} colorSlot={accountSlot(a.type)} />
                    <div className="min-w-0 flex-1">
                      <p className="t-body truncate text-[var(--text-primary)]">{a.name}</p>
                      <p className="t-footnote truncate text-[var(--text-secondary)]">
                        {a.institution ? `${a.institution} · ` : ""}
                        {accountTypeLabel(a.type)}
                      </p>
                    </div>
                    <span className="tnum t-body shrink-0 font-medium text-[var(--text-primary)]">
                      {formatMoney(a.balanceCents)}
                    </span>
                    <AccountDialog
                      account={a}
                      trigger={{
                        label: "›",
                        className:
                          "shrink-0 px-1 text-[17px] leading-none text-[var(--text-muted)] transition-opacity hover:text-[var(--text-secondary)] active:opacity-50",
                      }}
                    />
                  </div>
                ))}
              </ListSection>
            );
          })}

          <Card>
            <CardHeader
              title="Keeping balances current"
              subtitle="Ledgerly doesn&rsquo;t connect to your bank — which is why it has no access to your credentials."
            />
            <p className="t-subhead leading-relaxed text-[var(--text-secondary)]">
              Balances here are the numbers <em>you</em> enter — importing transactions does not move
              them. Update each one when you check your statement, and import that month&rsquo;s CSV
              from the{" "}
              <strong className="font-semibold text-[var(--text-primary)]">Import</strong> page. Two
              minutes a month keeps net worth honest, and the habit of looking is most of the benefit
              anyway.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
