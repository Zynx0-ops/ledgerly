import type { DateKey, MonthKey } from "./dates";

export type AccountType =
  | "checking"
  | "savings"
  | "credit"
  | "investment"
  | "loan"
  | "cash";

export const ACCOUNT_TYPES: { value: AccountType; label: string; liability: boolean }[] = [
  { value: "checking", label: "Checking", liability: false },
  { value: "savings", label: "Savings", liability: false },
  { value: "cash", label: "Cash", liability: false },
  { value: "investment", label: "Investment", liability: false },
  { value: "credit", label: "Credit card", liability: true },
  { value: "loan", label: "Loan", liability: true },
];

/** Credit cards and loans hold what you *owe*: their balance subtracts from net worth. */
export function isLiability(type: string): boolean {
  return type === "credit" || type === "loan";
}

export function accountTypeLabel(type: string): string {
  return ACCOUNT_TYPES.find((t) => t.value === type)?.label ?? type;
}

export type CategoryKind = "income" | "expense" | "transfer";

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  institution: string;
  balanceCents: number;
  archived: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface CategoryGroup {
  id: string;
  name: string;
  kind: CategoryKind;
  sortOrder: number;
}

export interface Category {
  id: string;
  groupId: string;
  groupName: string;
  kind: CategoryKind;
  name: string;
  icon: string;
  colorSlot: number;
  archived: boolean;
  sortOrder: number;
}

export interface Transaction {
  id: string;
  accountId: string;
  accountName: string;
  categoryId: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColorSlot: number | null;
  categoryKind: CategoryKind | null;
  date: DateKey;
  merchant: string;
  notes: string;
  amountCents: number;
  pending: boolean;
  excluded: boolean;
}

export interface Budget {
  id: string;
  month: MonthKey;
  categoryId: string;
  amountCents: number;
}

export interface BudgetLine {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  colorSlot: number;
  groupName: string;
  kind: CategoryKind;
  budgetedCents: number;
  actualCents: number;
}

export interface Goal {
  id: string;
  name: string;
  kind: "savings" | "debt" | "emergency";
  targetCents: number;
  savedCents: number;
  targetDate: DateKey | null;
  note: string;
  archived: boolean;
  createdAt: string;
}

export interface Rule {
  id: string;
  pattern: string;
  matchType: "contains" | "starts" | "equals";
  categoryId: string;
  categoryName: string;
  colorSlot: number;
  priority: number;
}

/** Glyph + palette slot per account type, so an account reads at a glance and
 *  keeps the same identity color everywhere it appears. */
const ACCOUNT_LOOK: Record<string, { glyph: string; slot: number }> = {
  checking: { glyph: "🏦", slot: 3 },
  savings: { glyph: "🐷", slot: 6 },
  cash: { glyph: "💵", slot: 6 },
  investment: { glyph: "📈", slot: 7 },
  credit: { glyph: "💳", slot: 1 },
  loan: { glyph: "🧾", slot: 8 },
};

export function accountGlyph(type: string): string {
  return ACCOUNT_LOOK[type]?.glyph ?? "▤";
}

export function accountSlot(type: string): number {
  return ACCOUNT_LOOK[type]?.slot ?? 3;
}
