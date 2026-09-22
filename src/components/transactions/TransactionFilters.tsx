"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { fieldBase } from "@/components/ui/Dialog";
import { SegmentedControl, SelectField } from "@/components/ui/Controls";
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

  const scope = params.get("uncategorized") === "1" ? "needs" : "all";
  const selectClass = `${fieldBase} cursor-pointer py-2`;

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <div className="relative w-full sm:w-64">
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[13px] text-[var(--text-muted)]"
        >
          ⌕
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search"
          aria-label="Search transactions"
          className={`${fieldBase} w-full rounded-[10px] py-2 pl-8`}
        />
      </div>

      <SegmentedControl
        label="Which transactions"
        value={scope}
        onChange={(next) => update("uncategorized", next === "needs" ? "1" : "")}
        options={[
          { value: "all", label: "All" },
          { value: "needs", label: "Needs a category" },
        ]}
      />

      <SelectField
        value={params.get("accountId") ?? ""}
        onChange={(e) => update("accountId", e.target.value)}
        aria-label="Filter by account"
        className={`${selectClass} max-w-[160px]`}
      >
        <option value="">All accounts</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </SelectField>

      <SelectField
        value={params.get("categoryId") ?? ""}
        onChange={(e) => update("categoryId", e.target.value)}
        aria-label="Filter by category"
        className={`${selectClass} max-w-[160px]`}
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
      </SelectField>

      {[...params.keys()].some((k) => k !== "month") ? (
        <button
          type="button"
          onClick={() => {
            const month = params.get("month");
            router.push(month ? `/transactions?month=${month}` : "/transactions");
            setSearch("");
          }}
          className="t-subhead px-1 text-[var(--accent)] transition-opacity active:opacity-60"
        >
          Clear
        </button>
      ) : null}
    </div>
  );
}
