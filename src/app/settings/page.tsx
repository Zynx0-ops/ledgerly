import { Card, CardHeader } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { CategoryDialog } from "@/components/settings/CategoryDialog";
import { ConfirmButton } from "@/components/settings/ConfirmButton";
import { fieldBase, fieldClass, ghostButton, primaryButton } from "@/components/ui/Dialog";
import {
  applyRules,
  deleteRule,
  eraseEverything,
  eraseTransactions,
  saveCategoryGroup,
  saveRule,
} from "@/server/actions";
import { listCategories, listCategoryGroups, listRules, uncategorizedCount } from "@/server/queries";
import { seriesVar } from "@/lib/palette";
import { STARTER_PATTERNS } from "@/lib/categorize";
import { SelectField } from "@/components/ui/Controls";

// Every page reads the local database, so nothing may be prerendered and cached.
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const groups = listCategoryGroups();
  const categories = listCategories();
  const rules = listRules();
  const pending = uncategorizedCount();

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Your category tree, the rules that sort transactions, and where your data lives."
      />

      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader
            title="Auto-categorization rules"
            subtitle={`${rules.length} of your own rules, plus ${STARTER_PATTERNS.length} built-in merchant patterns.`}
            action={
              pending > 0 ? (
                <form action={applyRules}>
                  <button type="submit" className={primaryButton}>
                    Apply to {pending} uncategorized
                  </button>
                </form>
              ) : null
            }
          />

          <form action={saveRule} className="mb-4 flex flex-wrap items-end gap-2">
            <div className="min-w-[180px] flex-1">
              <label className="t-footnote mb-1.5 block font-medium text-[var(--text-secondary)]" htmlFor="rule-pattern">
                When the merchant contains
              </label>
              <input
                id="rule-pattern"
                name="pattern"
                required
                placeholder="trader joe"
                className={fieldClass}
              />
            </div>
            <div className="min-w-[180px] flex-1">
              <label className="t-footnote mb-1.5 block font-medium text-[var(--text-secondary)]" htmlFor="rule-category">
                Categorize it as
              </label>
              <SelectField id="rule-category" name="categoryId" required className={fieldClass}>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.groupName} › {c.name}
                  </option>
                ))}
              </SelectField>
            </div>
            <button type="submit" className={primaryButton}>
              Add rule
            </button>
          </form>

          {rules.length ? (
            <ul className="overflow-hidden rounded-[10px] bg-[var(--surface-2)]">
              {rules.map((r) => (
                <li
                  key={r.id}
                  className="relative flex items-center gap-3 px-3 py-2.5 after:absolute after:right-0 after:bottom-0 after:left-3 after:h-[0.5px] after:bg-[var(--border)] last:after:hidden"
                >
                  <code className="t-footnote rounded-[6px] bg-[var(--surface-2)] px-2 py-1 text-[var(--text-primary)]">
                    {r.pattern}
                  </code>
                  <span aria-hidden className="text-[var(--text-muted)]">
                    →
                  </span>
                  <span className="flex min-w-0 flex-1 items-center gap-1.5">
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: seriesVar(r.colorSlot) }}
                    />
                    <span className="t-subhead truncate text-[var(--text-secondary)]">
                      {r.categoryName}
                    </span>
                  </span>
                  <form action={deleteRule}>
                    <input type="hidden" name="id" value={r.id} />
                    <button
                      type="submit"
                      className="t-footnote px-2 py-1 text-[var(--critical)] transition-opacity hover:opacity-75 active:opacity-60"
                    >
                      Remove
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          ) : (
            <p className="t-subhead rounded-[10px] bg-[var(--surface-2)] px-3.5 py-3 text-[var(--text-secondary)]">
              You haven&rsquo;t added any rules yet. Every time you set a category from the
              transactions list, Ledgerly writes one for you automatically — so this list fills
              itself as you go.
            </p>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Categories"
            subtitle={`${categories.length} categories across ${groups.length} groups`}
            action={
              <CategoryDialog
                groups={groups}
                trigger={{ label: "New category", className: primaryButton }}
              />
            }
          />

          <div className="flex flex-col gap-4">
            {groups.map((g) => {
              const items = categories.filter((c) => c.groupId === g.id);
              return (
                <div key={g.id}>
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="t-section">{g.name}</h3>
                    <span className="t-caption rounded-full bg-[var(--surface-2)] px-1.5 py-0.5 text-[var(--text-muted)]">
                      {g.kind}
                    </span>
                  </div>
                  <ul className="flex flex-wrap gap-1.5">
                    {items.map((c) => (
                      <li key={c.id}>
                        <CategoryDialog
                          category={c}
                          groups={groups}
                          trigger={{
                            label: `${c.icon} ${c.name}`,
                            className:
                              "flex items-center gap-1.5 rounded-full bg-[var(--surface-2)] px-3 py-1.5 t-footnote text-[var(--text-primary)] transition-opacity hover:opacity-75 active:opacity-60",
                          }}
                        />
                      </li>
                    ))}
                    <li>
                      <CategoryDialog
                        groups={groups}
                        defaultGroupId={g.id}
                        trigger={{
                          label: "+ Add",
                          className:
                            "rounded-full border border-dashed border-[var(--border-strong)] px-3 py-1.5 t-footnote text-[var(--text-secondary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]",
                        }}
                      />
                    </li>
                  </ul>
                </div>
              );
            })}
          </div>

          <form action={saveCategoryGroup} className="mt-5 flex flex-wrap items-end gap-2 border-t border-[var(--border)] pt-4">
            <div className="min-w-[180px] flex-1">
              <label className="t-footnote mb-1.5 block font-medium text-[var(--text-secondary)]" htmlFor="group-name">
                New group
              </label>
              <input id="group-name" name="name" required placeholder="Travel" className={fieldClass} />
            </div>
            <SelectField name="kind" defaultValue="expense" aria-label="Group type" className={fieldBase}>
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="transfer">Transfer</option>
            </SelectField>
            <button type="submit" className={ghostButton}>
              Add group
            </button>
          </form>
        </Card>

        <Card>
          <CardHeader
            title="Your data"
            subtitle="Everything lives in a single SQLite file on this machine — data/ledgerly.db."
          />
          <p className="t-subhead mb-4 leading-relaxed text-[var(--text-secondary)]">
            There is no account, no server, and no bank connection. To back up, copy that file. To
            move to another computer, copy it there. To start over, use the buttons below — neither
            can be undone.
          </p>
          <div className="flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
            <form action={eraseTransactions}>
              <ConfirmButton
                label="Delete all transactions"
                confirmLabel="Yes, delete every transaction"
                className={ghostButton}
              />
            </form>
            <form action={eraseEverything}>
              <ConfirmButton
                label="Delete everything"
                confirmLabel="Yes, wipe accounts, budgets and goals too"
                className={ghostButton}
              />
            </form>
          </div>
        </Card>
      </div>
    </>
  );
}
