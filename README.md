# Ledgerly

A private, local-first budgeting app for people who want to know where their money
actually goes — and build the habit of deciding in advance.

Think Monarch Money, except it runs on your own machine, has no subscription, and
never asks for your bank login.

```bash
git clone https://github.com/Zynx0-ops/ledgerly.git
cd ledgerly
npm install
npm run demo     # starts on :4000 with six months of sample data to explore
```

Then `npm run reset && npm run dev` when you're ready to start with your own numbers.

---

## Why this exists

Most budgeting advice fails at the same place: the gap between *intending* to spend
less and *seeing* what you actually spent. Ledgerly closes that gap with three
questions, answered on every screen:

1. **Where did it go?** Import a statement, and spending is sorted, named and charted.
2. **Am I on pace?** Not just "spent $3,400" — spent $3,400 *on day 21 of 30*, against
   a target that says $2,300. Being over budget on the 28th is a footnote. Being over
   on the 12th is a decision you can still make differently.
3. **What is it for?** Goals sit beside the budget, so a tradeoff reads as "this is
   three weeks of the Japan trip" instead of "this is $180".

## What it does

**Spending**
- Import CSV statements from any bank — the column matcher handles whatever layout
  yours uses, and remembers nothing it doesn't need to
- Merchant names get cleaned up: `POS DEBIT TRADER JOES #442` becomes `Trader Joes`
- Auto-categorization from 60+ built-in merchant patterns, plus rules you add
- Re-importing an overlapping statement is safe — identical rows are skipped
- Search, filter by account or category, and a "needs a category" queue

**Budgeting**
- A monthly budget per category, with live progress meters
- **Suggest a budget from my last 3 months** — a starting number based on how you
  actually live, not a number you invented and will ignore by week two
- Copy last month forward in one click
- Pace tracking: cumulative spending against the straight line your budget implies

**Everything else**
- Net worth across checking, savings, investments, credit cards and loans
- Savings goals with per-month contribution math to hit a target date
- Twelve-month cashflow, top categories, top merchants, month-by-month table
- Light and dark themes

**It teaches itself.** Every time you categorize a merchant by hand, Ledgerly writes
the rule that will categorize it automatically next time. After a month or two of
real use, imports land mostly-sorted with no effort from you.

## Your data stays yours

There is no account, no server, no telemetry, and no bank connection.

Everything lives in one SQLite file at `data/ledgerly.db`, which is gitignored. To
back up, copy that file. To move machines, copy it there. To start over, delete it.

CSV files you import are parsed and written straight to that database — nothing is
uploaded anywhere, because there is nowhere for it to go.

## How it's built

| | |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 with CSS custom properties for theming |
| Design | Warm near-black, cream ink, glass panels over soft orbs; SF Pro via `-apple-system` |
| Database | SQLite via Node's built-in `node:sqlite` |
| Charts | Hand-written SVG |

**Zero runtime dependencies beyond React and Next.** No ORM, no chart library, no
native modules to compile. `npm install` and it runs; the database creates its own
schema and seeds a category tree on first query.

A few decisions worth knowing about if you want to extend it:

- **Money is integer cents, everywhere.** Floats never touch a balance.
- **Signs are consistent.** Negative is money out, positive is money in, so a month's
  cashflow is a plain `SUM`.
- **Dates are `YYYY-MM-DD` strings**, months are `YYYY-MM`. No timezone drift: a
  transaction dated the 1st is the 1st, in every view.
- **Balances are yours to maintain.** An account's balance is a number *you* enter;
  importing transactions does not move it. That keeps the ledger and the balance
  independent, so an import can never silently corrupt your net worth — but it does
  mean you update balances yourself when you check a statement.
- **Chart color belongs to the entity, not the row.** Each category stores a palette
  slot, so filtering a chart never repaints the surviving series. A ninth series folds
  into "Other" rather than inventing a hue.
- **The interface is monochrome; colour belongs to the data.** Ink is cream on a warm
  near-black ground (or near-black on warm paper in light mode), panels are glass —
  translucent, blurred, with a 1px sheen along the top edge — floating over soft
  background orbs and a fine grain. The primary action is a cream pill with dark text,
  never a brand colour. That leaves hue free to mean something: a category, or
  up/down/over-budget.
- **The chart palette is Apple's hues, verified rather than assumed.** Apple's system
  colors are tuned for UI, not for charts: dropped in raw they fail on lightness
  (systemYellow sits at OKLCH L 0.87, well outside the band) and on colorblind
  separation (systemGreen↔systemPink ΔE 6.5). So each hue is kept and only its
  lightness is moved into the passing band, then the slot *order* is searched for one
  that clears every adjacent pair in both themes. Re-validated against the glass
  surfaces it actually sits on: worst adjacent CVD ΔE 10.8 light / 8.2 dark, worst
  normal-vision ΔE 18.5 / 17.7.
- **Spending share is a stacked capsule, not a donut** — the segmented bar from
  iOS Settings › iPhone Storage. This is a correctness choice as much as a visual one:
  a donut sorted by size can put *any* two hues next to each other, and no
  eight-color palette survives that (here pink↔red are ΔE 4.7 apart against a floor of
  15). Laying segments out in fixed palette order keeps every touching pair inside the
  validated gate, and the list beneath is sorted by amount so ranking still reads first.
- **Every chart has a table view**, so no value is reachable only by hovering, and
  identity never rests on color alone.

### Layout

```
src/
  app/            one route per screen: dashboard, transactions, budget,
                  accounts, goals, reports, import, settings
  components/
    charts/       donut, cashflow columns, pace line, bar list
    ui/           card, stat tile, meter, dialog, month nav
  lib/            money, dates, csv parsing, categorization, palette
  server/
    queries.ts    every read
    actions.ts    every write
scripts/          demo seeding and reset helpers
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start on http://localhost:4000 |
| `npm run demo` | Same, but seeds sample data into an empty database |
| `npm run reset` | Delete the local database and start clean |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript, no emit |

## Ideas for later

- Recurring-transaction detection ("you have $412/mo in subscriptions")
- Budget rollover, so an under-spent month credits the next one
- Split transactions across categories
- Net worth history from monthly balance snapshots
- CSV/JSON export
- Optional Plaid sync behind an env flag, for anyone who wants it

## License

MIT
