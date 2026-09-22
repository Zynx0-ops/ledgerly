<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:ledgerly-project-rules -->

# Ledgerly conventions

Invariants that are load-bearing across the codebase — breaking one produces bugs
that look like rounding noise or a chart that lies.

- **Money is integer cents.** Never store or compute a balance as a float. Parse
  user input with `parseMoney`, render with `formatMoney` (both in `src/lib/money.ts`).
- **Signs are consistent.** Negative = money out, positive = money in. A month's
  cashflow is a plain `SUM(amount_cents)`. Don't introduce a separate `type` column.
- **Dates are strings.** `YYYY-MM-DD` for days, `YYYY-MM` for months. Helpers live in
  `src/lib/dates.ts`. Don't convert to `Date` for storage or comparison — that
  reintroduces timezone drift.
- **Reads go in `src/server/queries.ts`, writes in `src/server/actions.ts`.** The
  actions file is `"use server"`, so every export there must be an async function.
- **Chart color follows the entity.** Each category stores a `color_slot` (1–8) from
  a fixed, colorblind-validated palette. Never assign color by rank or index, never
  generate a ninth hue — fold the tail into "Other" (`src/lib/palette.ts`).
- **The palette order is load-bearing, not cosmetic.** Slots 1–8 are Apple hues snapped
  into the passing lightness band, in an order chosen because every *adjacent* pair
  clears the colorblind and normal-vision gates in both modes. Re-ordering the slots,
  or substituting a raw Apple system color, breaks that guarantee — re-run the
  validator before touching either.
- **Marks that can neighbour arbitrarily must not rely on the palette.** Adjacent-pair
  validation only holds when marks appear in slot order. That is why spending share is
  a palette-ordered stacked capsule rather than a size-sorted donut. Any new chart where
  arbitrary pairs can touch (scatter, treemap, pie) needs an all-pairs check first, and
  this palette only clears all-pairs for a short prefix.
- **Two-series charts use slots 3 and 1** (blue / orange), not 1 and 2 — far apart under
  every simulation and semantically calmer than two hot hues.
- **Every chart keeps its table view.** Four of the light-mode palette hues sit below
  3:1 contrast, and the table plus direct value labels are what make them legal.
- **Pages are `force-dynamic`.** They read a local database; prerendering them serves
  stale numbers.

<!-- END:ledgerly-project-rules -->
