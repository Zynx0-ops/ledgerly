import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { randomUUID } from "node:crypto";

/**
 * Storage is a single SQLite file, opened through Node's built-in driver.
 * No ORM, no codegen step, no native build: clone the repo, `npm run dev`, and
 * the database creates and seeds itself on first query.
 */

const DB_PATH = process.env.LEDGERLY_DB
  ? resolve(/* turbopackIgnore: true */ process.env.LEDGERLY_DB)
  : join(process.cwd(), "data", "ledgerly.db");

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS accounts (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  type          TEXT NOT NULL,
  institution   TEXT NOT NULL DEFAULT '',
  balance_cents INTEGER NOT NULL DEFAULT 0,
  archived      INTEGER NOT NULL DEFAULT 0,
  sort_order    INTEGER NOT NULL DEFAULT 0,
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS category_groups (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  kind       TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY,
  group_id   TEXT NOT NULL REFERENCES category_groups(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL DEFAULT '',
  color_slot INTEGER NOT NULL DEFAULT 1,
  archived   INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS transactions (
  id           TEXT PRIMARY KEY,
  account_id   TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  category_id  TEXT REFERENCES categories(id) ON DELETE SET NULL,
  date         TEXT NOT NULL,
  merchant     TEXT NOT NULL,
  notes        TEXT NOT NULL DEFAULT '',
  amount_cents INTEGER NOT NULL,
  pending      INTEGER NOT NULL DEFAULT 0,
  excluded     INTEGER NOT NULL DEFAULT 0,
  import_hash  TEXT,
  created_at   TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS tx_date_idx     ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS tx_account_idx  ON transactions(account_id);
CREATE INDEX IF NOT EXISTS tx_category_idx ON transactions(category_id);
CREATE UNIQUE INDEX IF NOT EXISTS tx_import_hash_idx
  ON transactions(import_hash) WHERE import_hash IS NOT NULL;

CREATE TABLE IF NOT EXISTS budgets (
  id           TEXT PRIMARY KEY,
  month        TEXT NOT NULL,
  category_id  TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  amount_cents INTEGER NOT NULL,
  UNIQUE(month, category_id)
);

CREATE TABLE IF NOT EXISTS goals (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'savings',
  target_cents INTEGER NOT NULL,
  saved_cents  INTEGER NOT NULL DEFAULT 0,
  target_date  TEXT,
  note         TEXT NOT NULL DEFAULT '',
  archived     INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS rules (
  id          TEXT PRIMARY KEY,
  pattern     TEXT NOT NULL,
  match_type  TEXT NOT NULL DEFAULT 'contains',
  category_id TEXT NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  priority    INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

type Global = typeof globalThis & { __ledgerlyDb?: DatabaseSync };

function open(): DatabaseSync {
  mkdirSync(dirname(DB_PATH), { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(SCHEMA);
  return db;
}

/** Cached across HMR reloads so dev doesn't leak file handles. */
export function db(): DatabaseSync {
  const g = globalThis as Global;
  if (!g.__ledgerlyDb) {
    g.__ledgerlyDb = open();
    ensureSeed(g.__ledgerlyDb);
  }
  return g.__ledgerlyDb;
}

export function id(): string {
  return randomUUID();
}

export function now(): string {
  return new Date().toISOString();
}

/** SQLite has no booleans. */
export const bit = (v: unknown): number => (v ? 1 : 0);

type Row = Record<string, unknown>;

export function all<T>(sql: string, ...params: unknown[]): T[] {
  return db()
    .prepare(sql)
    .all(...(params as never[])) as T[];
}

export function get<T>(sql: string, ...params: unknown[]): T | undefined {
  return db()
    .prepare(sql)
    .get(...(params as never[])) as T | undefined;
}

export function run(sql: string, ...params: unknown[]) {
  return db()
    .prepare(sql)
    .run(...(params as never[]));
}

export function transact<T>(fn: () => T): T {
  const conn = db();
  conn.exec("BEGIN");
  try {
    const result = fn();
    conn.exec("COMMIT");
    return result;
  } catch (err) {
    conn.exec("ROLLBACK");
    throw err;
  }
}

export function getSetting(key: string, fallback = ""): string {
  const row = get<Row>("SELECT value FROM settings WHERE key = ?", key);
  return (row?.value as string) ?? fallback;
}

export function setSetting(key: string, value: string): void {
  run(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value,
  );
}

/* ── First-run seed ───────────────────────────────────────────────────────── */

/**
 * A brand-new database still needs a category tree to be usable — budgeting
 * against an empty list is not a starting point. Categories are seeded once;
 * sample accounts and transactions only when LEDGERLY_DEMO=1, so a real user's
 * file never gets fake money in it.
 */
function ensureSeed(conn: DatabaseSync) {
  const count = conn.prepare("SELECT COUNT(*) AS n FROM category_groups").get() as {
    n: number;
  };
  if (count.n > 0) return;

  const groups: [string, string, string[]][] = [
    ["Income", "income", ["Paycheck", "Side income", "Interest", "Gifts received"]],
    ["Housing", "expense", ["Rent / mortgage", "Utilities", "Internet & phone", "Home supplies"]],
    ["Food & Drink", "expense", ["Groceries", "Restaurants", "Coffee shops"]],
    ["Transportation", "expense", ["Gas", "Public transit", "Rideshare", "Car payment", "Parking"]],
    ["Shopping", "expense", ["Clothing", "Electronics", "Hobbies", "General shopping"]],
    ["Entertainment", "expense", ["Subscriptions", "Movies & events", "Games"]],
    ["Health", "expense", ["Doctor", "Pharmacy", "Fitness"]],
    ["Personal", "expense", ["Education", "Gifts given", "Personal care", "Pets"]],
    ["Financial", "expense", ["Savings transfer", "Debt payment", "Fees", "Taxes"]],
  ];

  const insGroup = conn.prepare(
    "INSERT INTO category_groups (id, name, kind, sort_order) VALUES (?, ?, ?, ?)",
  );
  const insCat = conn.prepare(
    `INSERT INTO categories (id, group_id, name, icon, color_slot, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`,
  );

  const ICONS: Record<string, string> = {
    Paycheck: "💼", "Side income": "🧰", Interest: "🏦", "Gifts received": "🎁",
    "Rent / mortgage": "🏠", Utilities: "💡", "Internet & phone": "📶", "Home supplies": "🧻",
    Groceries: "🛒", Restaurants: "🍽️", "Coffee shops": "☕",
    Gas: "⛽", "Public transit": "🚇", Rideshare: "🚕", "Car payment": "🚗", Parking: "🅿️",
    Clothing: "👕", Electronics: "🎧", Hobbies: "🎨", "General shopping": "🛍️",
    Subscriptions: "📺", "Movies & events": "🎬", Games: "🎮",
    Doctor: "🩺", Pharmacy: "💊", Fitness: "🏋️",
    Education: "📚", "Gifts given": "🎀", "Personal care": "✂️", Pets: "🐾",
    "Savings transfer": "🐖", "Debt payment": "💳", Fees: "🧾", Taxes: "🏛️",
  };

  // Color slot follows the *group*, so every category in "Food & Drink" shares a
  // hue family and the identity holds across every chart in the app.
  groups.forEach(([groupName, kind, cats], gi) => {
    const gid = randomUUID();
    insGroup.run(gid, groupName, kind, gi);
    cats.forEach((name, ci) => {
      insCat.run(randomUUID(), gid, name, ICONS[name] ?? "•", (gi % 8) + 1, ci);
    });
  });

  if (process.env.LEDGERLY_DEMO === "1") seedDemoData(conn);
}

function seedDemoData(conn: DatabaseSync) {
  const accounts: [string, string, string, number][] = [
    ["Everyday Checking", "checking", "Chase", 284_512],
    ["High-Yield Savings", "savings", "Ally", 1_140_000],
    ["Rewards Card", "credit", "Capital One", 87_340],
    ["Brokerage", "investment", "Fidelity", 620_000],
  ];
  const insAcct = conn.prepare(
    `INSERT INTO accounts (id, name, type, institution, balance_cents, sort_order, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  );
  const acctIds: string[] = [];
  accounts.forEach(([name, type, inst, bal], i) => {
    const aid = randomUUID();
    acctIds.push(aid);
    insAcct.run(aid, name, type, inst, bal, i, new Date().toISOString());
  });

  const cats = conn.prepare("SELECT id, name FROM categories").all() as {
    id: string;
    name: string;
  }[];
  const byName = new Map(cats.map((c) => [c.name, c.id]));

  const merchants: [string, string, number, number][] = [
    // merchant, category, typical cents (negative), times per month
    ["Whole Foods", "Groceries", -8_450, 4],
    ["Trader Joe's", "Groceries", -5_230, 3],
    ["Chipotle", "Restaurants", -1_485, 3],
    ["Blue Bottle Coffee", "Coffee shops", -675, 8],
    ["Shell", "Gas", -4_820, 3],
    ["Uber", "Rideshare", -1_940, 2],
    ["Netflix", "Subscriptions", -1_599, 1],
    ["Spotify", "Subscriptions", -1_199, 1],
    ["Amazon", "General shopping", -3_675, 4],
    ["Equinox", "Fitness", -8_500, 1],
    ["CVS Pharmacy", "Pharmacy", -2_240, 1],
    ["Pacific Gas & Electric", "Utilities", -9_640, 1],
    ["Verizon", "Internet & phone", -7_500, 1],
    ["Sunrise Apartments", "Rent / mortgage", -185_000, 1],
    ["Steam", "Games", -2_999, 1],
    ["AMC Theatres", "Movies & events", -2_400, 1],
  ];

  const insTx = conn.prepare(
    `INSERT INTO transactions (id, account_id, category_id, date, merchant, notes,
       amount_cents, pending, excluded, created_at)
     VALUES (?, ?, ?, ?, ?, '', ?, 0, 0, ?)`,
  );

  const today = new Date();
  const jitter = (n: number) => Math.round(n * (0.8 + Math.random() * 0.4));

  for (let back = 5; back >= 0; back--) {
    const ref = new Date(today.getFullYear(), today.getMonth() - back, 1);
    const y = ref.getFullYear();
    const m = ref.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();
    const maxDay = back === 0 ? today.getDate() : lastDay;

    // Two paychecks a month.
    for (const day of [1, 15]) {
      if (day > maxDay) continue;
      insTx.run(
        randomUUID(), acctIds[0], byName.get("Paycheck")!,
        `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        "Northwind Labs Payroll", 242_000, new Date().toISOString(),
      );
    }

    for (const [merchant, cat, cents, times] of merchants) {
      for (let t = 0; t < times; t++) {
        const day = Math.min(maxDay, 1 + Math.floor(Math.random() * lastDay));
        const isCard = cents > -50_000 && Math.random() > 0.35;
        insTx.run(
          randomUUID(),
          isCard ? acctIds[2] : acctIds[0],
          byName.get(cat) ?? null,
          `${y}-${String(m + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
          merchant, jitter(cents), new Date().toISOString(),
        );
      }
    }
  }

  const budgets: [string, number][] = [
    ["Rent / mortgage", 185_000], ["Groceries", 45_000], ["Restaurants", 18_000],
    ["Coffee shops", 6_000], ["Gas", 15_000], ["Rideshare", 6_000],
    ["Subscriptions", 4_000], ["General shopping", 15_000], ["Utilities", 11_000],
    ["Internet & phone", 8_000], ["Fitness", 9_000], ["Pharmacy", 3_000],
    ["Games", 3_000], ["Movies & events", 4_000],
  ];
  const insBudget = conn.prepare(
    "INSERT OR IGNORE INTO budgets (id, month, category_id, amount_cents) VALUES (?, ?, ?, ?)",
  );
  const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  for (const [name, amount] of budgets) {
    const cid = byName.get(name);
    if (cid) insBudget.run(randomUUID(), monthKey, cid, amount);
  }

  const insGoal = conn.prepare(
    `INSERT INTO goals (id, name, kind, target_cents, saved_cents, target_date, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  );
  insGoal.run(randomUUID(), "Emergency fund", "emergency", 1_200_000, 840_000,
    `${today.getFullYear() + 1}-06-30`, "Three months of expenses", new Date().toISOString());
  insGoal.run(randomUUID(), "Japan trip", "savings", 400_000, 125_000,
    `${today.getFullYear() + 1}-03-01`, "", new Date().toISOString());
  insGoal.run(randomUUID(), "Pay off Rewards Card", "debt", 87_340, 30_000, null, "",
    new Date().toISOString());
}
