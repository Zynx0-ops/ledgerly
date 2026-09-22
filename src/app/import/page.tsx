import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ImportWizard } from "@/components/import/ImportWizard";
import { AccountDialog } from "@/components/accounts/AccountDialog";
import { primaryButton } from "@/components/ui/Dialog";
import { listAccounts } from "@/server/queries";

// Every page reads the local database, so nothing may be prerendered and cached.
export const dynamic = "force-dynamic";

export default async function ImportPage() {
  const accounts = listAccounts();

  return (
    <>
      <PageHeader
        title="Import transactions"
        subtitle="Bring in a CSV from your bank. Ledgerly matches the columns, cleans up merchant names, and categorizes what it recognizes."
      />

      {!accounts.length ? (
        <Card>
          <EmptyState
            icon="▤"
            title="Add an account first"
            body="Imported transactions need somewhere to live. Create the account this statement belongs to and come back."
          >
            <AccountDialog trigger={{ label: "Add an account", className: primaryButton }} />
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
          <Card>
            <ImportWizard accounts={accounts} />
          </Card>

          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader title="Getting your CSV" />
              <ol className="flex list-decimal flex-col gap-2 pl-4 t-subhead leading-relaxed text-[var(--text-secondary)]">
                <li>Sign in to your bank in a browser.</li>
                <li>
                  Find <strong className="font-medium text-[var(--text-primary)]">Download</strong>{" "}
                  or <strong className="font-medium text-[var(--text-primary)]">Export</strong> in
                  the transactions view.
                </li>
                <li>Choose CSV and the date range you want.</li>
                <li>Drop the file above — one account at a time.</li>
              </ol>
            </Card>

            <Card>
              <CardHeader title="What Ledgerly does with it" />
              <ul className="flex flex-col gap-2 t-subhead leading-relaxed text-[var(--text-secondary)]">
                <li>
                  <strong className="font-medium text-[var(--text-primary)]">Cleans names.</strong>{" "}
                  &ldquo;POS DEBIT TRADER JOES #442&rdquo; becomes &ldquo;Trader Joes&rdquo;.
                </li>
                <li>
                  <strong className="font-medium text-[var(--text-primary)]">Categorizes.</strong>{" "}
                  Your own rules first, then a built-in list of common merchants.
                </li>
                <li>
                  <strong className="font-medium text-[var(--text-primary)]">Skips duplicates.</strong>{" "}
                  Same account, date, merchant and amount is treated as already imported.
                </li>
                <li>
                  <strong className="font-medium text-[var(--text-primary)]">Stays put.</strong> The
                  file is parsed locally and written to your own SQLite file. Nothing is uploaded
                  anywhere.
                </li>
              </ul>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
