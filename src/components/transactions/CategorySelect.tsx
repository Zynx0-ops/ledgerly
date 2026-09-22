"use client";

import { setTransactionCategory } from "@/server/actions";
import { seriesVar } from "@/lib/palette";
import type { Category, Transaction } from "@/lib/types";
import { groupCategories } from "./TransactionDialog";

/**
 * Recategorizing from the list is the single most-used action in a budgeting
 * app, so it is one click — and it offers to remember the merchant, which is
 * how the rule list builds itself over time.
 */
export function CategorySelect({
  transaction,
  categories,
}: {
  transaction: Transaction;
  categories: Category[];
}) {
  return (
    <form action={setTransactionCategory} className="flex items-center gap-1.5">
      <input type="hidden" name="id" value={transaction.id} />
      <input type="hidden" name="merchant" value={transaction.merchant} />
      <input type="hidden" name="remember" value="1" />
      {transaction.categoryColorSlot ? (
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full"
          style={{ background: seriesVar(transaction.categoryColorSlot) }}
        />
      ) : (
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-full border border-[var(--border-strong)]"
        />
      )}
      <select
        name="categoryId"
        defaultValue={transaction.categoryId ?? ""}
        aria-label={`Category for ${transaction.merchant}`}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className={`max-w-[190px] cursor-pointer truncate rounded-[6px] border border-transparent bg-transparent py-1 pr-1 text-[12.5px] outline-none transition-colors hover:border-[var(--border)] hover:bg-[var(--surface-2)] focus:border-[var(--accent)] ${
          transaction.categoryId ? "text-[var(--text-secondary)]" : "text-[var(--warning)]"
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
      </select>
    </form>
  );
}
