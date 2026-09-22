import "server-only";
import { all, get } from "@/lib/db";
import { monthBounds, monthRange, type MonthKey } from "@/lib/dates";
import type {
  Account,
  BudgetLine,
  Category,
  CategoryGroup,
  Goal,
  Rule,
  Transaction,
} from "@/lib/types";
import { isLiability } from "@/lib/types";
import { STARTER_PATTERNS } from "@/lib/categorize";

/* ── Accounts ─────────────────────────────────────────────────────────────── */

export function listAccounts(includeArchived = false): Account[] {
  const rows = all<Record<string, never>>(
    `SELECT id, name, type, institution, balance_cents, archived, sort_order, created_at
       FROM accounts
      WHERE (? = 1 OR archived = 0)
      ORDER BY archived, sort_order, name`,
    includeArchived ? 1 : 0,
  );
  return rows.map(mapAccount);
}

export function getAccount(id: string): Account | null {
  const row = get<Record<string, never>>(
    `SELECT id, name, type, institution, balance_cents, archived, sort_order, created_at
       FROM accounts WHERE id = ?`,
    id,
  );
  return row ? mapAccount(row) : null;
}

function mapAccount(r: Record<string, unknown>): Account {
  return {
    id: r.id as string,
    name: r.name as string,
    type: r.type as Account["type"],
    institution: (r.institution as string) ?? "",
    balanceCents: Number(r.balance_cents),
    archived: Boolean(r.archived),
    sortOrder: Number(r.sort_order),
    createdAt: r.created_at as string,
  };
}

export interface NetWorth {
  assetsCents: number;
  liabilitiesCents: number;
  netCents: number;
}

export function netWorth(): NetWorth {
  const accounts = listAccounts();
  let assets = 0;
  let liabilities = 0;
  for (const a of accounts) {
    if (isLiability(a.type)) liabilities += a.balanceCents;
    else assets += a.balanceCents;
  }
  return { assetsCents: assets, liabilitiesCents: liabilities, netCents: assets - liabilities };
}

/* ── Categories ───────────────────────────────────────────────────────────── */

export function listCategories(includeArchived = false): Category[] {
  return all<Record<string, never>>(
    `SELECT c.id, c.group_id, c.name, c.icon, c.color_slot, c.archived, c.sort_order,
            g.name AS group_name, g.kind, g.sort_order AS group_sort
       FROM categories c
       JOIN category_groups g ON g.id = c.group_id
      WHERE (? = 1 OR c.archived = 0)
      ORDER BY g.sort_order, c.sort_order, c.name`,
    includeArchived ? 1 : 0,
  ).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    groupId: r.group_id as string,
    groupName: r.group_name as string,
    kind: r.kind as Category["kind"],
    name: r.name as string,
    icon: (r.icon as string) ?? "",
    colorSlot: Number(r.color_slot),
    archived: Boolean(r.archived),
    sortOrder: Number(r.sort_order),
  }));
}

export function listCategoryGroups(): CategoryGroup[] {
  return all<Record<string, unknown>>(
    "SELECT id, name, kind, sort_order FROM category_groups ORDER BY sort_order, name",
  ).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    kind: r.kind as CategoryGroup["kind"],
    sortOrder: Number(r.sort_order),
  }));
}

/* ── Transactions ─────────────────────────────────────────────────────────── */

export interface TxFilter {
  month?: MonthKey;
  from?: string;
  to?: string;
  accountId?: string;
  categoryId?: string;
  search?: string;
  uncategorized?: boolean;
  limit?: number;
  offset?: number;
}

function whereClause(f: TxFilter): { sql: string; params: unknown[] } {
  const parts: string[] = ["1 = 1"];
  const params: unknown[] = [];

  if (f.month) {
    const { start, end } = monthBounds(f.month);
    parts.push("t.date BETWEEN ? AND ?");
    params.push(start, end);
  }
  if (f.from) {
    parts.push("t.date >= ?");
    params.push(f.from);
  }
  if (f.to) {
    parts.push("t.date <= ?");
    params.push(f.to);
  }
  if (f.accountId) {
    parts.push("t.account_id = ?");
    params.push(f.accountId);
  }
  if (f.categoryId) {
    parts.push("t.category_id = ?");
    params.push(f.categoryId);
  }
  if (f.uncategorized) parts.push("t.category_id IS NULL");
  if (f.search) {
    parts.push("(t.merchant LIKE ? COLLATE NOCASE OR t.notes LIKE ? COLLATE NOCASE)");
    params.push(`%${f.search}%`, `%${f.search}%`);
  }
  return { sql: parts.join(" AND "), params };
}

const TX_SELECT = `
  SELECT t.id, t.account_id, t.category_id, t.date, t.merchant, t.notes,
         t.amount_cents, t.pending, t.excluded,
         a.name AS account_name,
         c.name AS category_name, c.icon AS category_icon, c.color_slot,
         g.kind AS category_kind
    FROM transactions t
    JOIN accounts a ON a.id = t.account_id
    LEFT JOIN categories c ON c.id = t.category_id
    LEFT JOIN category_groups g ON g.id = c.group_id`;

export function listTransactions(f: TxFilter = {}): Transaction[] {
  const { sql, params } = whereClause(f);
  const limit = f.limit ?? 100;
  const offset = f.offset ?? 0;
  return all<Record<string, unknown>>(
    `${TX_SELECT} WHERE ${sql} ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?`,
    ...params,
    limit,
    offset,
  ).map(mapTx);
}

export function countTransactions(f: TxFilter = {}): number {
  const { sql, params } = whereClause(f);
  const row = get<{ n: number }>(
    `SELECT COUNT(*) AS n FROM transactions t WHERE ${sql}`,
    ...params,
  );
  return Number(row?.n ?? 0);
}

export function getTransaction(id: string): Transaction | null {
  const row = get<Record<string, unknown>>(`${TX_SELECT} WHERE t.id = ?`, id);
  return row ? mapTx(row) : null;
}

function mapTx(r: Record<string, unknown>): Transaction {
  return {
    id: r.id as string,
    accountId: r.account_id as string,
    accountName: r.account_name as string,
    categoryId: (r.category_id as string) ?? null,
    categoryName: (r.category_name as string) ?? null,
    categoryIcon: (r.category_icon as string) ?? null,
    categoryColorSlot: r.color_slot == null ? null : Number(r.color_slot),
    categoryKind: (r.category_kind as Transaction["categoryKind"]) ?? null,
    date: r.date as string,
    merchant: r.merchant as string,
    notes: (r.notes as string) ?? "",
    amountCents: Number(r.amount_cents),
    pending: Boolean(r.pending),
    excluded: Boolean(r.excluded),
  };
}

/* ── Month summary & cashflow ─────────────────────────────────────────────── */

export interface MonthSummary {
  month: MonthKey;
  incomeCents: number;
  expenseCents: number; // positive magnitude
  netCents: number;
  savingsRate: number; // 0–100
  transactionCount: number;
}

export function monthSummary(month: MonthKey): MonthSummary {
  const { start, end } = monthBounds(month);
  const row = get<Record<string, unknown>>(
    `SELECT
       COALESCE(SUM(CASE WHEN amount_cents > 0 THEN amount_cents END), 0) AS income,
       COALESCE(SUM(CASE WHEN amount_cents < 0 THEN -amount_cents END), 0) AS expense,
       COUNT(*) AS n
     FROM transactions
     WHERE date BETWEEN ? AND ? AND excluded = 0`,
    start,
    end,
  );
  const incomeCents = Number(row?.income ?? 0);
  const expenseCents = Number(row?.expense ?? 0);
  const netCents = incomeCents - expenseCents;
  return {
    month,
    incomeCents,
    expenseCents,
    netCents,
    savingsRate: incomeCents > 0 ? (netCents / incomeCents) * 100 : 0,
    transactionCount: Number(row?.n ?? 0),
  };
}

export function cashflowByMonth(endMonth: MonthKey, count = 6): MonthSummary[] {
  return monthRange(endMonth, count).map(monthSummary);
}

/* ── Spending breakdowns ──────────────────────────────────────────────────── */

export interface Slice {
  id: string;
  label: string;
  icon: string;
  colorSlot: number;
  cents: number; // positive magnitude
}

export function spendingByGroup(month: MonthKey): Slice[] {
  const { start, end } = monthBounds(month);
  return all<Record<string, unknown>>(
    `SELECT g.id, g.name, MIN(c.color_slot) AS color_slot,
            SUM(-t.amount_cents) AS cents
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       JOIN category_groups g ON g.id = c.group_id
      WHERE t.date BETWEEN ? AND ?
        AND t.excluded = 0 AND t.amount_cents < 0 AND g.kind = 'expense'
      GROUP BY g.id
      HAVING cents > 0
      ORDER BY cents DESC`,
    start,
    end,
  ).map((r) => ({
    id: r.id as string,
    label: r.name as string,
    icon: "",
    colorSlot: Number(r.color_slot),
    cents: Number(r.cents),
  }));
}

export function spendingByCategory(month: MonthKey, limit = 8): Slice[] {
  const { start, end } = monthBounds(month);
  return all<Record<string, unknown>>(
    `SELECT c.id, c.name, c.icon, c.color_slot, SUM(-t.amount_cents) AS cents
       FROM transactions t
       JOIN categories c ON c.id = t.category_id
       JOIN category_groups g ON g.id = c.group_id
      WHERE t.date BETWEEN ? AND ?
        AND t.excluded = 0 AND t.amount_cents < 0 AND g.kind = 'expense'
      GROUP BY c.id
      HAVING cents > 0
      ORDER BY cents DESC
      LIMIT ?`,
    start,
    end,
    limit,
  ).map((r) => ({
    id: r.id as string,
    label: r.name as string,
    icon: (r.icon as string) ?? "",
    colorSlot: Number(r.color_slot),
    cents: Number(r.cents),
  }));
}

export function topMerchants(month: MonthKey, limit = 8): Slice[] {
  const { start, end } = monthBounds(month);
  return all<Record<string, unknown>>(
    `SELECT t.merchant AS label, SUM(-t.amount_cents) AS cents, COUNT(*) AS n
       FROM transactions t
      WHERE t.date BETWEEN ? AND ? AND t.excluded = 0 AND t.amount_cents < 0
      GROUP BY t.merchant COLLATE NOCASE
      ORDER BY cents DESC
      LIMIT ?`,
    start,
    end,
    limit,
  ).map((r) => ({
    id: r.label as string,
    label: r.label as string,
    icon: String(r.n),
    colorSlot: 1,
    cents: Number(r.cents),
  }));
}

/** Cumulative spend per day — the "am I on pace?" line. */
export function dailyCumulativeSpend(month: MonthKey): { day: number; cents: number }[] {
  const { start, end } = monthBounds(month);
  const rows = all<Record<string, unknown>>(
    `SELECT CAST(substr(date, 9, 2) AS INTEGER) AS day, SUM(-amount_cents) AS cents
       FROM transactions
      WHERE date BETWEEN ? AND ? AND excluded = 0 AND amount_cents < 0
      GROUP BY day ORDER BY day`,
    start,
    end,
  );
  let running = 0;
  const byDay = new Map<number, number>();
  for (const r of rows) byDay.set(Number(r.day), Number(r.cents));
  const total = Number(end.slice(8));
  const out: { day: number; cents: number }[] = [];
  for (let d = 1; d <= total; d++) {
    running += byDay.get(d) ?? 0;
    out.push({ day: d, cents: running });
  }
  return out;
}

/* ── Budgets ──────────────────────────────────────────────────────────────── */

export function budgetLines(month: MonthKey): BudgetLine[] {
  const { start, end } = monthBounds(month);
  return all<Record<string, unknown>>(
    `SELECT c.id AS category_id, c.name AS category_name, c.icon, c.color_slot,
            g.name AS group_name, g.kind,
            COALESCE(b.amount_cents, 0) AS budgeted,
            COALESCE((
              SELECT SUM(CASE WHEN g.kind = 'income' THEN t.amount_cents ELSE -t.amount_cents END)
                FROM transactions t
               WHERE t.category_id = c.id
                 AND t.date BETWEEN ? AND ?
                 AND t.excluded = 0
            ), 0) AS actual
       FROM categories c
       JOIN category_groups g ON g.id = c.group_id
       LEFT JOIN budgets b ON b.category_id = c.id AND b.month = ?
      WHERE c.archived = 0
      ORDER BY g.sort_order, c.sort_order, c.name`,
    start,
    end,
    month,
  ).map((r) => ({
    categoryId: r.category_id as string,
    categoryName: r.category_name as string,
    categoryIcon: (r.icon as string) ?? "",
    colorSlot: Number(r.color_slot),
    groupName: r.group_name as string,
    kind: r.kind as BudgetLine["kind"],
    budgetedCents: Number(r.budgeted),
    actualCents: Number(r.actual),
  }));
}

export interface BudgetTotals {
  budgetedCents: number;
  actualCents: number;
  remainingCents: number;
  overCount: number;
  trackedCount: number;
}

export function budgetTotals(lines: BudgetLine[]): BudgetTotals {
  let budgeted = 0;
  let actual = 0;
  let over = 0;
  let tracked = 0;
  for (const l of lines) {
    if (l.kind !== "expense") continue;
    if (l.budgetedCents > 0) {
      budgeted += l.budgetedCents;
      tracked++;
      if (l.actualCents > l.budgetedCents) over++;
    }
    actual += Math.max(0, l.actualCents);
  }
  return {
    budgetedCents: budgeted,
    actualCents: actual,
    remainingCents: budgeted - actual,
    overCount: over,
    trackedCount: tracked,
  };
}

/** Last month's actuals, used to suggest a starting budget. */
export function suggestedBudgets(month: MonthKey): Map<string, number> {
  const prev = monthRange(month, 4).slice(0, 3);
  const out = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const m of prev) {
    const { start, end } = monthBounds(m);
    const rows = all<Record<string, unknown>>(
      `SELECT category_id, SUM(-amount_cents) AS cents
         FROM transactions
        WHERE date BETWEEN ? AND ? AND excluded = 0 AND amount_cents < 0
          AND category_id IS NOT NULL
        GROUP BY category_id`,
      start,
      end,
    );
    for (const r of rows) {
      const cid = r.category_id as string;
      out.set(cid, (out.get(cid) ?? 0) + Number(r.cents));
      counts.set(cid, (counts.get(cid) ?? 0) + 1);
    }
  }
  for (const [cid, total] of out) {
    const n = counts.get(cid) ?? 1;
    out.set(cid, Math.round(total / n / 100) * 100); // average, rounded to the dollar
  }
  return out;
}

/* ── Goals & rules ────────────────────────────────────────────────────────── */

export function listGoals(includeArchived = false): Goal[] {
  return all<Record<string, unknown>>(
    `SELECT id, name, kind, target_cents, saved_cents, target_date, note, archived, created_at
       FROM goals WHERE (? = 1 OR archived = 0)
      ORDER BY archived, created_at`,
    includeArchived ? 1 : 0,
  ).map((r) => ({
    id: r.id as string,
    name: r.name as string,
    kind: r.kind as Goal["kind"],
    targetCents: Number(r.target_cents),
    savedCents: Number(r.saved_cents),
    targetDate: (r.target_date as string) ?? null,
    note: (r.note as string) ?? "",
    archived: Boolean(r.archived),
    createdAt: r.created_at as string,
  }));
}

export function listRules(): Rule[] {
  return all<Record<string, unknown>>(
    `SELECT r.id, r.pattern, r.match_type, r.category_id, r.priority,
            c.name AS category_name, c.color_slot
       FROM rules r JOIN categories c ON c.id = r.category_id
      ORDER BY r.priority DESC, r.created_at`,
  ).map((r) => ({
    id: r.id as string,
    pattern: r.pattern as string,
    matchType: r.match_type as Rule["matchType"],
    categoryId: r.category_id as string,
    categoryName: r.category_name as string,
    colorSlot: Number(r.color_slot),
    priority: Number(r.priority),
  }));
}

export function uncategorizedCount(): number {
  const row = get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM transactions WHERE category_id IS NULL",
  );
  return Number(row?.n ?? 0);
}

/**
 * The rules that actually run: the user's own rules first (they win), then the
 * built-in starter patterns as a fallback so a fresh import is still ~80%
 * categorized before anyone touches it.
 */
export function effectiveRules(): Rule[] {
  const userRules = listRules();
  const byName = new Map(
    all<{ id: string; name: string; color_slot: number }>(
      "SELECT id, name, color_slot FROM categories WHERE archived = 0",
    ).map((c) => [c.name, c]),
  );
  const starters: Rule[] = [];
  for (const [pattern, categoryName] of STARTER_PATTERNS) {
    const cat = byName.get(categoryName);
    if (!cat) continue;
    starters.push({
      id: `starter:${pattern}`,
      pattern,
      matchType: "contains",
      categoryId: cat.id,
      categoryName: cat.name,
      colorSlot: Number(cat.color_slot),
      priority: 0,
    });
  }
  return [...userRules, ...starters];
}
