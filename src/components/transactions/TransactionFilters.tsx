"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { fieldBase, fieldClass } from "@/components/ui/Dialog";
import type { Account, Category } from "@/lib/types";
import { groupCategories } from "./TransactionDialog";

/** One filter row, above everything it scopes. */
export function TransactionFilters({
  accounts,
  categories,
}: {
  accounts: Account[];
  categories: Category[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(params.get("search") ?? "");

  function update(key: string, value: string) {
    const q = new URLSearchParams(params.toString());
    if (value) q.set(key, value);
    else q.delete(key);
    q.delete("page");
    startTransition(() => router.push(`/transactions?${q.toString()}`, { scroll: false }));
  }

  // Debounced so typing doesn't fire a query per keystroke.
  useEffect(() => {
    const current = params.get("search") ?? "";
    if (search === current) return;
    const t = setTimeout(() => update("search", search), 280);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const showingUncategorized = params.get("uncategorized") === "1";

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search merchants…"
        aria-label="Search transactions"
        className={`${fieldClass} w-full sm:w-56`}
      />
      <select
        value={params.get("accountId") ?? ""}
        onChange={(e) => update("accountId", e.target.value)}
        aria-label="Filter by account"
        className={`${fieldBase} max-w-[190px]`}
      >
        <option value="">All accounts</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      <select
        value={params.get("categoryId") ?? ""}
        onChange={(e) => update("categoryId", e.target.value)}
        aria-label="Filter by category"
        className={`${fieldBase} max-w-[190px]`}
      >
        <option value="">All categories</option>
        {groupCategories(categories).map(([group, items]) => (
          <optgroup key={group} label={group}>
            {items.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <button
        type="button"
        onClick={() => update("uncategorized", showingUncategorized ? "" : "1")}
        aria-pressed={showingUncategorized}
        className={`rounded-[var(--radius-sm)] border px-3 py-2 text-[13px] font-medium transition-colors ${
          showingUncategorized
            ? "border-[var(--warning)] bg-[var(--warning-wash)] text-[var(--warning)]"
            : "border-[var(--border)] bg-[var(--surface-1)] text-[var(--text-secondary)] hover:bg-[var(--surface-2)]"
        }`}
      >
        Needs a category
      </button>
      {[...params.keys()].some((k) => k !== "month") ? (
        <button
          type="button"
          onClick={() => {
            const month = params.get("month");
            router.push(month ? `/transactions?month=${month}` : "/transactions");
            setSearch("");
          }}
          className="px-2 py-2 text-[13px] text-[var(--accent)] hover:underline"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
