"use client";

import { useState } from "react";
import { Dialog, fieldClass, ghostButton, labelClass, primaryButton } from "@/components/ui/Dialog";
import { deleteAccount, saveAccount } from "@/server/actions";
import { ACCOUNT_TYPES, type Account } from "@/lib/types";

export function AccountDialog({
  account,
  trigger,
}: {
  account?: Account;
  trigger: { label: string; className: string };
}) {
  const [open, setOpen] = useState(false);
  const editing = Boolean(account);

  return (
    <>
      <button type="button" className={trigger.className} onClick={() => setOpen(true)}>
        {trigger.label}
      </button>

      <Dialog open={open} onClose={() => setOpen(false)} title={editing ? "Edit account" : "Add an account"}>
        <form action={saveAccount} onSubmit={() => setOpen(false)} className="flex flex-col gap-3.5">
          {account ? <input type="hidden" name="id" value={account.id} /> : null}

          <div>
            <label className={labelClass} htmlFor="acct-name">
              Account name
            </label>
            <input
              id="acct-name"
              name="name"
              required
              defaultValue={account?.name}
              placeholder="Everyday Checking"
              className={fieldClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass} htmlFor="acct-type">
                Type
              </label>
              <select id="acct-type" name="type" defaultValue={account?.type ?? "checking"} className={fieldClass}>
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass} htmlFor="acct-balance">
                Current balance
              </label>
              <input
                id="acct-balance"
                name="balance"
                inputMode="decimal"
                defaultValue={account ? (account.balanceCents / 100).toFixed(2) : ""}
                placeholder="0.00"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass} htmlFor="acct-institution">
              Bank or institution{" "}
              <span className="font-normal text-[var(--text-muted)]">(optional)</span>
            </label>
            <input
              id="acct-institution"
              name="institution"
              defaultValue={account?.institution}
              placeholder="Chase"
              className={fieldClass}
            />
          </div>

          <p className="rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-3 py-2 text-[12px] leading-relaxed text-[var(--text-secondary)]">
            For a credit card or loan, enter what you <strong>owe</strong> as a positive number —
            Ledgerly subtracts it from your net worth.
          </p>

          <div className="mt-1 flex items-center justify-between gap-2">
            {editing ? (
              <button
                type="submit"
                formAction={deleteAccount}
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
                {editing ? "Save changes" : "Add account"}
              </button>
            </div>
          </div>
        </form>
      </Dialog>
    </>
  );
}
