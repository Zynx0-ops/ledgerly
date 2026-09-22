"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { MAX_SERIES, OTHER_SLOT, seriesVar } from "@/lib/palette";
import { ChartTable } from "./common";

export interface SplitSlice {
  id: string;
  label: string;
  colorSlot: number;
  cents: number;
}

/**
 * The segmented capsule from iOS Settings › iPhone Storage: proportion at a
 * glance, then a labeled list carrying the ranking.
 *
 * Segments are laid out in *palette-slot order*, not by size. That matters for
 * more than tidiness: the palette's colour separation is validated for adjacent
 * pairs, so fixing the order to the palette's own keeps every touching pair
 * inside the gate. A size-sorted ring (a donut) can put any two hues together —
 * under that arrangement this palette fails hard (pink↔red ΔE 4.7 against a
 * floor of 15). The list below is sorted by amount, so ranking is still the
 * first thing you read, and every row names itself: identity never rests on
 * colour alone.
 */
export function SpendingSplit({
  slices,
  totalLabel = "Spent",
}: {
  slices: SplitSlice[];
  totalLabel?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const positive = slices.filter((s) => s.cents > 0);
  const byValue = [...positive].sort((a, b) => b.cents - a.cents);
  const head = byValue.slice(0, MAX_SERIES);
  const tail = byValue.slice(MAX_SERIES);

  const data: SplitSlice[] =
    tail.length > 0
      ? [
          ...head,
          {
            id: "__other",
            label: `Other (${tail.length})`,
            colorSlot: OTHER_SLOT,
            cents: tail.reduce((n, s) => n + s.cents, 0),
          },
        ]
      : head;

  const total = data.reduce((n, s) => n + s.cents, 0);

  if (!total) {
    return (
      <p className="t-subhead py-10 text-center text-[var(--text-secondary)]">
        No spending recorded this month yet.
      </p>
    );
  }

  const ranked = [...data].sort((a, b) => b.cents - a.cents);
  const inPaletteOrder = [...data].sort((a, b) => a.colorSlot - b.colorSlot);
  const active = hover ? data.find((s) => s.id === hover) : null;

  return (
    <div>
      <p className="figure text-[30px] leading-none text-[var(--text-primary)]">
        {formatMoney(active ? active.cents : total, { showCents: false })}
      </p>
      <p className="t-footnote mt-1 text-[var(--text-secondary)]">
        {active ? active.label : totalLabel}
      </p>

      {/* The capsule. A 2px gap in the surface colour separates segments —
          white does the separating, never a stroke around the mark. */}
      <div
        className="mt-3.5 flex h-[15px] w-full gap-[2px] overflow-hidden rounded-full"
        role="img"
        aria-label={`Spending split, total ${formatMoney(total)}`}
      >
        {inPaletteOrder.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={`${s.label}: ${formatMoney(s.cents)}`}
            onPointerEnter={() => setHover(s.id)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(s.id)}
            onBlur={() => setHover(null)}
            className={`h-full min-w-[3px] transition-opacity duration-150 ${
              i === 0 ? "rounded-l-full" : ""
            } ${i === inPaletteOrder.length - 1 ? "rounded-r-full" : ""} ${
              hover && hover !== s.id ? "opacity-35" : "opacity-100"
            }`}
            style={{
              flexGrow: s.cents,
              flexBasis: 0,
              background: seriesVar(s.colorSlot),
            }}
          />
        ))}
      </div>

      {/* Direct value labels — the relief that lets the lighter hues ship, and
          the channel that carries identity when colour can't. */}
      <ul className="mt-4 flex flex-col">
        {ranked.map((s) => (
          <li
            key={s.id}
            onPointerEnter={() => setHover(s.id)}
            onPointerLeave={() => setHover(null)}
            className="relative flex items-center gap-2.5 py-[7px] transition-opacity after:pointer-events-none after:absolute after:right-0 after:bottom-0 after:left-0 after:h-[0.5px] after:bg-[var(--border)] last:after:hidden"
            style={{ opacity: hover && hover !== s.id ? 0.45 : 1 }}
          >
            <span
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: seriesVar(s.colorSlot) }}
            />
            <span className="t-subhead min-w-0 flex-1 truncate text-[var(--text-primary)]">
              {s.label}
            </span>
            <span className="tnum t-subhead shrink-0 font-medium text-[var(--text-primary)]">
              {formatMoney(s.cents, { showCents: false })}
            </span>
            <span className="tnum t-footnote w-9 shrink-0 text-right text-[var(--text-secondary)]">
              {((s.cents / total) * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>

      <ChartTable
        columns={["Group", "Amount", "Share"]}
        rows={ranked.map((s) => [
          { text: s.label, color: seriesVar(s.colorSlot) },
          formatMoney(s.cents),
          `${((s.cents / total) * 100).toFixed(1)}%`,
        ])}
      />
    </div>
  );
}
