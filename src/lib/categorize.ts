import type { Rule } from "./types";

/**
 * Auto-categorization is deliberately simple and inspectable: a list of
 * merchant patterns, highest priority first. You can see every rule, edit it,
 * and understand exactly why a transaction landed where it did — which matters
 * more than cleverness when the whole point is learning your own spending.
 */

export function matchRule(merchant: string, rules: Rule[]): Rule | null {
  const hay = merchant.toLowerCase().trim();
  for (const rule of rules) {
    const needle = rule.pattern.toLowerCase().trim();
    if (!needle) continue;
    const hit =
      rule.matchType === "equals"
        ? hay === needle
        : rule.matchType === "starts"
          ? hay.startsWith(needle)
          : hay.includes(needle);
    if (hit) return rule;
  }
  return null;
}

/**
 * Seed patterns, applied when a merchant matches no user rule. Keyed by the
 * seeded category name so they resolve against whatever the category tree holds.
 */
export const STARTER_PATTERNS: [string, string][] = [
  // merchant fragment, category name
  ["trader joe", "Groceries"],
  ["whole foods", "Groceries"],
  ["safeway", "Groceries"],
  ["kroger", "Groceries"],
  ["aldi", "Groceries"],
  ["costco", "Groceries"],
  ["publix", "Groceries"],
  ["wegmans", "Groceries"],
  ["starbucks", "Coffee shops"],
  ["dunkin", "Coffee shops"],
  ["blue bottle", "Coffee shops"],
  ["peet", "Coffee shops"],
  ["chipotle", "Restaurants"],
  ["mcdonald", "Restaurants"],
  ["doordash", "Restaurants"],
  ["uber eats", "Restaurants"],
  ["grubhub", "Restaurants"],
  ["taco bell", "Restaurants"],
  ["subway", "Restaurants"],
  ["shell", "Gas"],
  ["chevron", "Gas"],
  ["exxon", "Gas"],
  ["bp ", "Gas"],
  ["76 ", "Gas"],
  ["uber", "Rideshare"],
  ["lyft", "Rideshare"],
  ["netflix", "Subscriptions"],
  ["spotify", "Subscriptions"],
  ["hulu", "Subscriptions"],
  ["disney", "Subscriptions"],
  ["youtube premium", "Subscriptions"],
  ["apple.com/bill", "Subscriptions"],
  ["icloud", "Subscriptions"],
  ["amazon", "General shopping"],
  ["target", "General shopping"],
  ["walmart", "General shopping"],
  ["best buy", "Electronics"],
  ["steam", "Games"],
  ["playstation", "Games"],
  ["nintendo", "Games"],
  ["amc", "Movies & events"],
  ["ticketmaster", "Movies & events"],
  ["cvs", "Pharmacy"],
  ["walgreens", "Pharmacy"],
  ["rite aid", "Pharmacy"],
  ["planet fitness", "Fitness"],
  ["equinox", "Fitness"],
  ["gym", "Fitness"],
  ["comcast", "Internet & phone"],
  ["xfinity", "Internet & phone"],
  ["verizon", "Internet & phone"],
  ["t-mobile", "Internet & phone"],
  ["at&t", "Internet & phone"],
  ["electric", "Utilities"],
  ["pg&e", "Utilities"],
  ["water", "Utilities"],
  ["payroll", "Paycheck"],
  ["direct dep", "Paycheck"],
  ["interest paid", "Interest"],
  ["parking", "Parking"],
  ["transit", "Public transit"],
  ["mta", "Public transit"],
];

/** Strips the noise banks add: store numbers, dates, reference ids. */
export function cleanMerchant(raw: string): string {
  let s = raw.trim().replace(/\s+/g, " ");
  s = s.replace(/^(pos |debit |credit |ach |purchase |payment |recurring )+/i, "");
  s = s.replace(/\s+#?\d{3,}$/, "");
  s = s.replace(/\s+\d{2}\/\d{2}(\/\d{2,4})?$/, "");
  s = s.replace(/\s{2,}/g, " ").trim();
  if (s === s.toUpperCase() && s.length > 3) {
    s = s
      .toLowerCase()
      .replace(/\b[a-z]/g, (c) => c.toUpperCase())
      .replace(/\b(Llc|Inc|Usa)\b/g, (m) => m.toUpperCase());
  }
  return s || raw.trim();
}
