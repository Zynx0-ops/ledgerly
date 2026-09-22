"use server";

import { revalidatePath } from "next/cache";
import { all, get, id, now, run, transact } from "@/lib/db";
import { normalizeDate, todayKey } from "@/lib/dates";
import { parseMoney } from "@/lib/money";
import { cleanMerchant, matchRule } from "@/lib/categorize";
import { effectiveRules } from "./queries";

function refresh() {
  revalidatePath("/", "layout");
}

const str = (fd: FormData, key: string, fallback = "") =>
  ((fd.get(key) as string) ?? fallback).trim();

const cents = (fd: FormData, key: string) => parseMoney(str(fd, key)) ?? 0;

/* ── Accounts ─────────────────────────────────────────────────────────────── */

export async function saveAccount(fd: FormData) {
  const existing = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return;

  const type = str(fd, "type", "checking");
  const institution = str(fd, "institution");
  const balance = cents(fd, "balance");

  if (existing) {
    run(
      `UPDATE accounts SET name = ?, type = ?, institution = ?, balance_cents = ? WHERE id = ?`,
      name, type, institution, balance, existing,
    );
  } else {
    const max = get<{ m: number }>("SELECT COALESCE(MAX(sort_order), -1) AS m FROM accounts");
    run(
      `INSERT INTO accounts (id, name, type, institution, balance_cents, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id(), name, type, institution, balance, Number(max?.m ?? -1) + 1, now(),
    );
  }
  refresh();
}

export async function deleteAccount(fd: FormData) {
  const accountId = str(fd, "id");
  if (accountId) run("DELETE FROM accounts WHERE id = ?", accountId);
  refresh();
}

export async function toggleAccountArchived(fd: FormData) {
  const accountId = str(fd, "id");
  if (accountId) run("UPDATE accounts SET archived = 1 - archived WHERE id = ?", accountId);
  refresh();
}

/* ── Transactions ─────────────────────────────────────────────────────────── */

export async function saveTransaction(fd: FormData) {
  const existing = str(fd, "id");
  const merchant = str(fd, "merchant");
  const accountId = str(fd, "accountId");
  if (!merchant || !accountId) return;

  const date = normalizeDate(str(fd, "date")) ?? todayKey();
  const categoryId = str(fd, "categoryId") || null;
  const notes = str(fd, "notes");
  const excluded = fd.get("excluded") ? 1 : 0;

  // The form asks for a positive amount plus a direction, which is far less
  // error-prone than asking someone to remember to type a minus sign.
  const magnitude = Math.abs(cents(fd, "amount"));
  const direction = str(fd, "direction", "expense");
  const amount = direction === "income" ? magnitude : -magnitude;

  if (existing) {
    run(
      `UPDATE transactions
          SET account_id = ?, category_id = ?, date = ?, merchant = ?, notes = ?,
              amount_cents = ?, excluded = ?
        WHERE id = ?`,
      accountId, categoryId, date, merchant, notes, amount, excluded, existing,
    );
  } else {
    run(
      `INSERT INTO transactions
         (id, account_id, category_id, date, merchant, notes, amount_cents, pending, excluded, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      id(), accountId, categoryId, date, merchant, notes, amount, excluded, now(),
    );
  }
  refresh();
}

export async function deleteTransaction(fd: FormData) {
  const txId = str(fd, "id");
  if (txId) run("DELETE FROM transactions WHERE id = ?", txId);
  refresh();
}

export async function setTransactionCategory(fd: FormData) {
  const txId = str(fd, "id");
  const categoryId = str(fd, "categoryId") || null;
  if (!txId) return;
  run("UPDATE transactions SET category_id = ? WHERE id = ?", categoryId, txId);

  // Teach the app: categorizing a merchant by hand creates the rule that will
  // categorize it automatically next time.
  if (categoryId && fd.get("remember")) {
    const merchant = str(fd, "merchant");
    if (merchant) {
      const existing = get<{ id: string }>(
        "SELECT id FROM rules WHERE pattern = ? COLLATE NOCASE",
        merchant,
      );
      if (existing) {
        run("UPDATE rules SET category_id = ? WHERE id = ?", categoryId, existing.id);
      } else {
        run(
          `INSERT INTO rules (id, pattern, match_type, category_id, priority, created_at)
           VALUES (?, ?, 'contains', ?, 10, ?)`,
          id(), merchant, categoryId, now(),
        );
      }
    }
  }
  refresh();
}

/* ── Budgets ──────────────────────────────────────────────────────────────── */

export async function setBudget(fd: FormData) {
  const month = str(fd, "month");
  const categoryId = str(fd, "categoryId");
  if (!month || !categoryId) return;

  const amount = Math.abs(cents(fd, "amount"));
  if (amount <= 0) {
    run("DELETE FROM budgets WHERE month = ? AND category_id = ?", month, categoryId);
  } else {
    run(
      `INSERT INTO budgets (id, month, category_id, amount_cents) VALUES (?, ?, ?, ?)
       ON CONFLICT(month, category_id) DO UPDATE SET amount_cents = excluded.amount_cents`,
      id(), month, categoryId, amount,
    );
  }
  refresh();
}

export async function copyBudgets(fd: FormData) {
  const from = str(fd, "from");
  const to = str(fd, "to");
  if (!from || !to) return;
  transact(() => {
    const rows = all<{ category_id: string; amount_cents: number }>(
      "SELECT category_id, amount_cents FROM budgets WHERE month = ?",
      from,
    );
    for (const r of rows) {
      run(
        `INSERT INTO budgets (id, month, category_id, amount_cents) VALUES (?, ?, ?, ?)
         ON CONFLICT(month, category_id) DO UPDATE SET amount_cents = excluded.amount_cents`,
        id(), to, r.category_id, Number(r.amount_cents),
      );
    }
  });
  refresh();
}

/** Turns "what I actually spent" into a starting budget, rounded to the dollar. */
export async function applySuggestedBudgets(fd: FormData) {
  const month = str(fd, "month");
  const raw = str(fd, "suggestions");
  if (!month || !raw) return;
  let pairs: [string, number][];
  try {
    pairs = JSON.parse(raw);
  } catch {
    return;
  }
  transact(() => {
    for (const [categoryId, amount] of pairs) {
      if (!categoryId || !amount) continue;
      run(
        `INSERT INTO budgets (id, month, category_id, amount_cents) VALUES (?, ?, ?, ?)
         ON CONFLICT(month, category_id) DO UPDATE SET amount_cents = excluded.amount_cents`,
        id(), month, categoryId, Math.abs(Math.round(amount)),
      );
    }
  });
  refresh();
}

export async function clearBudgets(fd: FormData) {
  const month = str(fd, "month");
  if (month) run("DELETE FROM budgets WHERE month = ?", month);
  refresh();
}

/* ── Goals ────────────────────────────────────────────────────────────────── */

export async function saveGoal(fd: FormData) {
  const existing = str(fd, "id");
  const name = str(fd, "name");
  if (!name) return;

  const kind = str(fd, "kind", "savings");
  const target = Math.abs(cents(fd, "target"));
  const saved = Math.abs(cents(fd, "saved"));
  const targetDate = normalizeDate(str(fd, "targetDate")) ?? null;
  const note = str(fd, "note");

  if (existing) {
    run(
      `UPDATE goals SET name = ?, kind = ?, target_cents = ?, saved_cents = ?,
              target_date = ?, note = ? WHERE id = ?`,
      name, kind, target, saved, targetDate, note, existing,
    );
  } else {
    run(
      `INSERT INTO goals (id, name, kind, target_cents, saved_cents, target_date, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      id(), name, kind, target, saved, targetDate, note, now(),
    );
  }
  refresh();
}

export async function contributeToGoal(fd: FormData) {
  const goalId = str(fd, "id");
  const amount = cents(fd, "amount");
  if (!goalId || !amount) return;
  run(
    "UPDATE goals SET saved_cents = MAX(0, saved_cents + ?) WHERE id = ?",
    Math.round(amount), goalId,
  );
  refresh();
}

export async function deleteGoal(fd: FormData) {
  const goalId = str(fd, "id");
  if (goalId) run("DELETE FROM goals WHERE id = ?", goalId);
  refresh();
}

/* ── Categories & rules ───────────────────────────────────────────────────── */

export async function saveCategory(fd: FormData) {
  const existing = str(fd, "id");
  const name = str(fd, "name");
  const groupId = str(fd, "groupId");
  if (!name || !groupId) return;

  const icon = str(fd, "icon") || "•";
  const colorSlot = Number(str(fd, "colorSlot", "1")) || 1;

  if (existing) {
    run(
      "UPDATE categories SET name = ?, group_id = ?, icon = ?, color_slot = ? WHERE id = ?",
      name, groupId, icon, colorSlot, existing,
    );
  } else {
    const max = get<{ m: number }>(
      "SELECT COALESCE(MAX(sort_order), -1) AS m FROM categories WHERE group_id = ?",
      groupId,
    );
    run(
      `INSERT INTO categories (id, group_id, name, icon, color_slot, sort_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id(), groupId, name, icon, colorSlot, Number(max?.m ?? -1) + 1,
    );
  }
  refresh();
}

export async function deleteCategory(fd: FormData) {
  const categoryId = str(fd, "id");
  if (categoryId) run("DELETE FROM categories WHERE id = ?", categoryId);
  refresh();
}

export async function saveCategoryGroup(fd: FormData) {
  const name = str(fd, "name");
  if (!name) return;
  const kind = str(fd, "kind", "expense");
  const max = get<{ m: number }>("SELECT COALESCE(MAX(sort_order), -1) AS m FROM category_groups");
  run(
    "INSERT INTO category_groups (id, name, kind, sort_order) VALUES (?, ?, ?, ?)",
    id(), name, kind, Number(max?.m ?? -1) + 1,
  );
  refresh();
}

export async function saveRule(fd: FormData) {
  const pattern = str(fd, "pattern");
  const categoryId = str(fd, "categoryId");
  if (!pattern || !categoryId) return;
  run(
    `INSERT INTO rules (id, pattern, match_type, category_id, priority, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    id(), pattern, str(fd, "matchType", "contains"), categoryId,
    Number(str(fd, "priority", "10")) || 10, now(),
  );
  refresh();
}

export async function deleteRule(fd: FormData) {
  const ruleId = str(fd, "id");
  if (ruleId) run("DELETE FROM rules WHERE id = ?", ruleId);
  refresh();
}

/** Runs every rule over anything still uncategorized. */
export async function applyRules(): Promise<void> {
  const rules = effectiveRules();
  const pending = all<{ id: string; merchant: string }>(
    "SELECT id, merchant FROM transactions WHERE category_id IS NULL",
  );
  transact(() => {
    for (const tx of pending) {
      const hit = matchRule(tx.merchant, rules);
      if (hit) run("UPDATE transactions SET category_id = ? WHERE id = ?", hit.categoryId, tx.id);
    }
  });
  refresh();
}

/* ── CSV import ───────────────────────────────────────────────────────────── */

export interface StagedRow {
  date: string;
  merchant: string;
  amountCents: number;
  categoryId: string | null;
  categoryName: string | null;
}

/**
 * Parses the mapped CSV into rows the review step can display. Nothing is
 * written until the user confirms — an import that silently lands 400 rows in
 * your ledger is how people stop trusting a finance app.
 */
export async function stageImport(
  rows: string[][],
  roles: string[],
  hasHeader: boolean,
  flipSign: boolean,
): Promise<StagedRow[]> {
  const rules = effectiveRules();
  const body = hasHeader ? rows.slice(1) : rows;
  const out: StagedRow[] = [];

  const col = (role: string) => roles.indexOf(role);
  const iDate = col("date");
  const iMerchant = col("merchant");
  const iAmount = col("amount");
  const iDebit = col("debit");
  const iCredit = col("credit");
  const iNotes = col("notes");

  for (const r of body) {
    const date = iDate >= 0 ? normalizeDate(r[iDate] ?? "") : null;
    if (!date) continue;

    let amount: number | null = null;
    if (iAmount >= 0) {
      amount = parseMoney(r[iAmount] ?? "");
      if (amount != null && flipSign) amount = -amount;
    } else {
      const debit = iDebit >= 0 ? parseMoney(r[iDebit] ?? "") : null;
      const credit = iCredit >= 0 ? parseMoney(r[iCredit] ?? "") : null;
      if (debit) amount = -Math.abs(debit);
      else if (credit) amount = Math.abs(credit);
    }
    if (amount == null || amount === 0) continue;

    const merchant = cleanMerchant(
      (iMerchant >= 0 ? r[iMerchant] : "") || (iNotes >= 0 ? r[iNotes] : "") || "Unknown",
    );
    const hit = matchRule(merchant, rules);

    out.push({
      date,
      merchant,
      amountCents: amount,
      categoryId: hit?.categoryId ?? null,
      categoryName: hit?.categoryName ?? null,
    });
  }

  return out.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export interface ImportResult {
  inserted: number;
  duplicates: number;
}

/** Re-importing an overlapping statement is normal, so identical rows are skipped. */
export async function commitImport(
  accountId: string,
  rows: StagedRow[],
): Promise<ImportResult> {
  if (!accountId || !rows.length) return { inserted: 0, duplicates: 0 };

  let inserted = 0;
  let duplicates = 0;

  transact(() => {
    for (const row of rows) {
      const hash = `${accountId}|${row.date}|${row.merchant.toLowerCase()}|${row.amountCents}`;
      const clash = get<{ id: string }>(
        "SELECT id FROM transactions WHERE import_hash = ?",
        hash,
      );
      if (clash) {
        duplicates++;
        continue;
      }
      run(
        `INSERT INTO transactions
           (id, account_id, category_id, date, merchant, notes, amount_cents,
            pending, excluded, import_hash, created_at)
         VALUES (?, ?, ?, ?, ?, '', ?, 0, 0, ?, ?)`,
        id(), accountId, row.categoryId, row.date, row.merchant, row.amountCents, hash, now(),
      );
      inserted++;
    }
  });

  refresh();
  return { inserted, duplicates };
}

/* ── Danger zone ──────────────────────────────────────────────────────────── */

export async function eraseTransactions() {
  run("DELETE FROM transactions");
  refresh();
}

export async function eraseEverything() {
  transact(() => {
    run("DELETE FROM transactions");
    run("DELETE FROM budgets");
    run("DELETE FROM goals");
    run("DELETE FROM rules");
    run("DELETE FROM accounts");
  });
  refresh();
}
