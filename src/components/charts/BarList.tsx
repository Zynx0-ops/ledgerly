"use client";

import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { seriesVar } from "@/lib/palette";
import { ChartTable } from "./common";

export interface BarItem {
  id: string;
  label: string;
  sublabel?: string;
  cents: number;
  colorSlot?: number;
  href?: string;
}

/**
 * One measure across nominal categories, so every bar is one color — length is
 * already carrying the magnitude, and a hue ramp would double-encode it. The
 * small dot beside each label carries category identity instead.
 */
export function BarList({
  items,
  valueLabel = "Amount",
  emptyMessage = "Nothing to show yet.",
}: {
  items: BarItem[];
  valueLabel?: string;
  emptyMessage?: string;
}) {
  const data = items.filter((i) => i.cents > 0);
  if (!data.length) {
    return <p className="py-8 text-center text-[13px] text-[var(--text-muted)]">{emptyMessage}</p>;
  }

  const max = Math.max(...data.map((i) => i.cents));
  const total = data.reduce((n, i) => n + i.cents, 0);

  return (
    <div>
      <ul className="flex flex-col">
        {data.map((item) => {
          const pct = (item.cents / max) * 100;
          const share = (item.cents / total) * 100;
          const row = (
            <>
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2">
                  {item.colorSlot ? (
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: seriesVar(item.colorSlot) }}
                    />
                  ) : null}
                  <span className="truncate text-[13px] text-[var(--text-primary)]">
                    {item.label}
                  </span>
                  {item.sublabel ? (
                    <span className="shrink-0 text-[12px] text-[var(--text-muted)]">
                      {item.sublabel}
                    </span>
                  ) : null}
                </span>
                <span className="flex shrink-0 items-baseline gap-2">
                  <span className="tnum text-[13px] font-medium text-[var(--text-primary)]">
                    {formatMoney(item.cents, { showCents: false })}
                  </span>
                  <span className="tnum w-9 text-right text-[12px] text-[var(--text-muted)]">
                    {share.toFixed(0)}%
                  </span>
                </span>
              </div>
              {/* 10px bar: square at the baseline, 4px rounded data-end. */}
              <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-r-[4px] bg-[var(--surface-2)]">
                <div
                  className="h-full rounded-r-[4px] transition-[width] duration-300"
                  style={{ width: `${Math.max(pct, 1.5)}%`, background: "var(--accent)" }}
                />
              </div>
            </>
          );

          return (
            <li key={item.id} className="border-b border-[var(--border)] last:border-b-0">
              {item.href ? (
                <Link
                  href={item.href}
                  className="block rounded-[var(--radius-sm)] px-1 py-2.5 transition-colors hover:bg-[var(--surface-2)]"
                >
                  {row}
                </Link>
              ) : (
                <div className="px-1 py-2.5">{row}</div>
              )}
            </li>
          );
        })}
      </ul>

      <ChartTable
        columns={["Name", valueLabel, "Share"]}
        rows={data.map((i) => [
          i.colorSlot ? { text: i.label, color: seriesVar(i.colorSlot) } : i.label,
          formatMoney(i.cents),
          `${((i.cents / total) * 100).toFixed(1)}%`,
        ])}
      />
    </div>
  );
}
