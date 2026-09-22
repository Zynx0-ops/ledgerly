"use client";

import { useState } from "react";
import { Dialog, fieldClass, labelClass, sheetDestructive, sheetPrimary } from "@/components/ui/Dialog";
import { SelectField, Switch } from "@/components/ui/Controls";
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
              <SelectField
                id="tx-direction"
                name="direction"
                defaultValue={isIncome ? "income" : "expense"}
                className={fieldClass}
              >
                <option value="expense">Money out</option>
                <option value="income">Money in</option>
              </SelectField>
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
              <SelectField
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
              </SelectField>
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="tx-category">
              Category
            </label>
            <SelectField
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
            </SelectField>
          </div>

          <div>
            <label className={labelClass} htmlFor="tx-notes">
              Notes <span className="font-normal text-[var(--text-muted)]">(optional)</span>
            </label>
            <input id="tx-notes" name="notes" defaultValue={transaction?.notes} className={fieldClass} />
          </div>

          <div className="rounded-[10px] bg-[var(--surface-2)] px-3 py-1.5">
            <Switch
              name="excluded"
              defaultChecked={transaction?.excluded}
              label="Exclude from budgets"
              description="Keeps it in the ledger but out of every total"
            />
          </div>

          {/* Apple stacks sheet actions full-width at the bottom; the ✕ in the
              header is the cancel affordance, so there is no Cancel button. */}
          <div className="mt-2 flex flex-col gap-2">
            <button type="submit" className={sheetPrimary}>
              {editing ? "Save changes" : "Add transaction"}
            </button>
            {editing ? (
              <button
                type="submit"
                formAction={deleteTransaction}
                onClick={() => setOpen(false)}
                className={sheetDestructive}
              >
                Delete transaction
              </button>
            ) : null}
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
