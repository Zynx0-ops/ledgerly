import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";
import { EmptyState } from "@/components/ui/EmptyState";
import { AccountDialog } from "@/components/accounts/AccountDialog";
import { primaryButton } from "@/components/ui/Dialog";
import { listAccounts, netWorth } from "@/server/queries";
import { accountTypeLabel, isLiability, type Account } from "@/lib/types";
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
      <PageHeader
        title="Accounts"
        subtitle="Every balance you're tracking, and what they add up to."
      >
        <AccountDialog trigger={{ label: "Add account", className: primaryButton }} />
      </PageHeader>

      <div className="mb-4 grid gap-4 sm:grid-cols-3">
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
            <AccountDialog trigger={{ label: "Add your first account", className: primaryButton }} />
          </EmptyState>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          {SECTIONS.map((section) => {
            const items = accounts.filter((a) => section.types.includes(a.type));
            if (!items.length) return null;
            const total = items.reduce((n, a) => n + a.balanceCents, 0);

            return (
              <Card key={section.title} padded={false}>
                <div className="flex items-baseline justify-between px-5 pt-5 pb-3">
                  <div>
                    <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">
                      {section.title}
                    </h2>
                    <p className="text-[12.5px] text-[var(--text-muted)]">{section.note}</p>
                  </div>
                  <span
                    className="tnum text-[15px] font-semibold"
                    style={{
                      color: isLiability(items[0].type) ? "var(--critical)" : "var(--text-primary)",
                    }}
                  >
                    {isLiability(items[0].type) ? "−" : ""}
                    {formatMoney(total)}
                  </span>
                </div>
                <ul className="border-t border-[var(--border)]">
                  {items.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center gap-3 border-b border-[var(--border)] px-5 py-3 transition-colors last:border-b-0 hover:bg-[var(--surface-2)]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] text-[var(--text-primary)]">{a.name}</p>
                        <p className="truncate text-[11.5px] text-[var(--text-muted)]">
                          {a.institution ? `${a.institution} · ` : ""}
                          {accountTypeLabel(a.type)}
                        </p>
                      </div>
                      <span className="tnum shrink-0 text-[13.5px] font-medium text-[var(--text-primary)]">
                        {formatMoney(a.balanceCents)}
                      </span>
                      <AccountDialog
                        account={a}
                        trigger={{
                          label: "Edit",
                          className:
                            "shrink-0 rounded-[6px] px-2 py-1 text-[12px] text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]",
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}

          <Card>
            <CardHeader
              title="Keeping balances current"
              subtitle="Ledgerly doesn&rsquo;t connect to your bank — which is why it has no access to your credentials."
            />
            <p className="text-[13px] leading-relaxed text-[var(--text-secondary)]">
              Update each balance when you check your statement, and import that month&rsquo;s CSV from the{" "}
              <strong className="font-medium text-[var(--text-primary)]">Import</strong> page. Two
              minutes a month keeps net worth honest, and the habit of looking is most of the
              benefit anyway.
            </p>
          </Card>
        </div>
      )}
    </>
  );
}
