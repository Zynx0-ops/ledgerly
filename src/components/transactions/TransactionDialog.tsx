"use client";

import { useState } from "react";
import { Dialog, fieldClass, ghostButton, labelClass, primaryButton } from "@/components/ui/Dialog";
import { saveTransaction, deleteTransaction } from "@/server/actions";
import { todayKey } from "@/lib/dates";
import type { Account, Category, Transaction } from "@/lib/types";

export function TransactionDialog({
  accounts,
  categories,
  transaction,
  trigger,
}: {
  accounts: Account[];
  categories: Category[];
  transaction?: Transaction;
  trigger: { label: string; className: string };
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(transaction);
  const isIncome = (transaction?.amountCents ?? -1) > 0;

  return (
    <>
      <button type="button" className={trigger.className} onClick={() => setOpen(true)}>
        {trigger.label}
      </button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit transaction" : "Add a transaction"}
      >
        <form action={saveTransaction} onSubmit={() => setOpen(false)} className="flex flex-col gap-3.5">
          {transaction ? <input type="hidden" name="id" value={transaction.id} /> : null}

          <div>
            <label className={labelClass} htmlFor="tx-merchant">
              Merchant or description
            </label>
            <input
              id="tx-merchant"
              name="merchant"
              required
              defaultValue={transaction?.merchant}
              placeholder="Trader Joe's"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="tx-amount">
                Amount
              </label>
              <input
                id="tx-amount"
                name="amount"
                required
                inputMode="decimal"
                defaultValue={
                  transaction ? (Math.abs(transaction.amountCents) / 100).toFixed(2) : ""
                }
                placeholder="24.50"
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="tx-direction">
                Direction
              </label>
              <select
                id="tx-direction"
                name="direction"
                defaultValue={isIncome ? "income" : "expense"}
                className={fieldClass}
              >
                <option value="expense">Money out</option>
                <option value="income">Money in</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="tx-date">
                Date
              </label>
              <input
                id="tx-date"
                name="date"
                type="date"
                defaultValue={transaction?.date ?? todayKey()}
                className={fieldClass}
              />
            </div>
            <div>
              <label className={labelClass} htmlFor="tx-account">
                Account
              </label>
              <select
                id="tx-account"
                name="accountId"
                required
                defaultValue={transaction?.accountId ?? accounts[0]?.id}
                className={fieldClass}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="tx-category">
              Category
            </label>
            <select
              id="tx-category"
              name="categoryId"
              defaultValue={transaction?.categoryId ?? ""}
              className={fieldClass}
            >
              <option value="">Uncategorized</option>
              {groupCategories(categories).map(([group, items]) => (
                <optgroup key={group} label={group}>
                  {items.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="tx-notes">
              Notes <span className="font-normal text-[var(--text-muted)]">(optional)</span>
            </label>
            <input id="tx-notes" name="notes" defaultValue={transaction?.notes} className={fieldClass} />
          </div>

          <label className="flex items-center gap-2 text-[13px] text-[var(--text-secondary)]">
            <input
              type="checkbox"
              name="excluded"
              defaultChecked={transaction?.excluded}
              className="h-4 w-4 accent-[var(--accent)]"
            />
            Exclude from budgets and reports
          </label>

          <div className="mt-1 flex items-center justify-between gap-2">
            {editing ? (
              <button
                type="submit"
                formAction={deleteTransaction}
                onClick={() => setOpen(false)}
                className="rounded-[var(--radius-sm)] px-2.5 py-2 text-[13px] text-[var(--critical)] transition-colors hover:bg-[var(--critical-wash)]"
              >
                Delete
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className={ghostButton}>
                Cancel
              </button>
              <button type="submit" className={primaryButton}>
                {editing ? "Save changes" : "Add transaction"}
              </button>
            </div>
          </div>
        </form>
      </Dialog>
    </>
  );
}

export function groupCategories(categories: Category[]): [string, Category[]][] {
  const map = new Map<string, Category[]>();
  for (const c of categories) {
    const list = map.get(c.groupName) ?? [];
    list.push(c);
    map.set(c.groupName, list);
  }
  return [...map.entries()];
}
