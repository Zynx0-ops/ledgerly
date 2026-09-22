"use client";

import { setTransactionCategory } from "@/server/actions";
import type { Category, Transaction } from "@/lib/types";
import { SelectField } from "@/components/ui/Controls";
import { groupCategories } from "./TransactionDialog";

/**
 * Recategorizing from the list is the most-used action in a budgeting app, so
 * it's one tap — and it quietly remembers the merchant, which is how the rule
 * list builds itself over time.
 */
export function CategorySelect({
  transaction,
  categories,
}: {
  transaction: Transaction;
  categories: Category[];
}) {
  return (
    <form action={setTransactionCategory} className="inline-flex">
      <input type="hidden" name="id" value={transaction.id} />
      <input type="hidden" name="merchant" value={transaction.merchant} />
      <input type="hidden" name="remember" value="1" />
      <SelectField
        name="categoryId"
        defaultValue={transaction.categoryId ?? ""}
        aria-label={`Category for ${transaction.merchant}`}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        chevronClass="text-[var(--text-muted)]"
        className={`t-footnote -ml-1 max-w-[190px] cursor-pointer truncate rounded-[6px] border-0 bg-transparent py-0.5 pl-1 outline-none transition-colors hover:bg-[var(--surface-2)] focus:ring-2 focus:ring-[var(--accent)] ${
          transaction.categoryId ? "text-[var(--text-secondary)]" : "font-medium text-[var(--warning)]"
        }`}
      >
        <option value="">Uncategorized</option>
        {groupCategories(categories).map(([group, items]) => (
          <optgroup key={group} label={group}>
            {items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </optgroup>
        ))}
      </SelectField>
    </form>
  );
}
