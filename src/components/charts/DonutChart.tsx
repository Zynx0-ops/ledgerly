"use client";

import { useState } from "react";
import { formatMoney } from "@/lib/money";
import { MAX_SERIES, OTHER_SLOT, seriesVar } from "@/lib/palette";
import { ChartFrame, ChartTable, ChartTooltip, type TooltipState } from "./common";

export interface DonutSlice {
  id: string;
  label: string;
  colorSlot: number;
  cents: number;
}

const SIZE = 260;
const CX = SIZE / 2;
const CY = SIZE / 2;
const OUTER = 108;
const INNER = 76;
const MID = (OUTER + INNER) / 2;
const GAP_PX = 2; // the surface gap — white does the separating, never a stroke

function polar(cx: number, cy: number, r: number, angle: number) {
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function segment(start: number, end: number, outer: number, inner: number) {
  const large = end - start > Math.PI ? 1 : 0;
  const o1 = polar(CX, CY, outer, start);
  const o2 = polar(CX, CY, outer, end);
  const i2 = polar(CX, CY, inner, end);
  const i1 = polar(CX, CY, inner, start);
  return [
    `M${o1.x.toFixed(2)},${o1.y.toFixed(2)}`,
    `A${outer},${outer} 0 ${large} 1 ${o2.x.toFixed(2)},${o2.y.toFixed(2)}`,
    `L${i2.x.toFixed(2)},${i2.y.toFixed(2)}`,
    `A${inner},${inner} 0 ${large} 0 ${i1.x.toFixed(2)},${i1.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

/**
 * Part-to-whole at a glance, capped at eight segments. A ninth category folds
 * into "Other" rather than inventing a hue the palette hasn't validated.
 */
export function DonutChart({
  slices,
  centerLabel = "Spent",
}: {
  slices: DonutSlice[];
  centerLabel?: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [tip, setTip] = useState<TooltipState | null>(null);

  const sorted = [...slices].filter((s) => s.cents > 0).sort((a, b) => b.cents - a.cents);
  const head = sorted.slice(0, MAX_SERIES);
  const tail = sorted.slice(MAX_SERIES);
  const data: DonutSlice[] =
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
      <p className="py-10 text-center text-[13px] text-[var(--text-muted)]">
        No spending recorded this month yet.
      </p>
    );
  }

  const gapAngle = GAP_PX / MID;
  const single = data.length === 1;
  let cursor = -Math.PI / 2;

  const arcs = data.map((s, i) => {
    const sweep = (s.cents / total) * Math.PI * 2;
    const start = cursor + (single ? 0 : gapAngle / 2);
    const end = cursor + sweep - (single ? 0 : gapAngle / 2);
    cursor += sweep;
    return { slice: s, start, end: Math.max(start + 0.001, end), index: i };
  });

  return (
    <div className="@container flex flex-col gap-4">
      <div className="flex flex-col gap-4 @[440px]:flex-row @[440px]:items-center">
      <ChartFrame className="mx-auto w-full max-w-[220px] shrink-0">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full"
          role="img"
          aria-label={`Spending by category group, total ${formatMoney(total)}`}
        >
          {single ? (
            <>
              <circle cx={CX} cy={CY} r={OUTER} fill={seriesVar(data[0].colorSlot)} />
              <circle cx={CX} cy={CY} r={INNER} fill="var(--surface-1)" />
            </>
          ) : (
            arcs.map(({ slice, start, end, index }) => {
              const lifted = hover === index;
              return (
                <path
                  key={slice.id}
                  d={segment(start, end, lifted ? OUTER + 4 : OUTER, INNER)}
                  fill={seriesVar(slice.colorSlot)}
                  className="cursor-pointer transition-[d] duration-150"
                  tabIndex={0}
                  role="button"
                  aria-label={`${slice.label}: ${formatMoney(slice.cents)}`}
                  onPointerEnter={(e) => {
                    setHover(index);
                    setTip({
                      x: SIZE / 2,
                      y: e.nativeEvent.offsetY || SIZE / 2,
                      title: slice.label,
                      rows: [
                        {
                          label: `${((slice.cents / total) * 100).toFixed(0)}% of spending`,
                          value: formatMoney(slice.cents),
                          color: seriesVar(slice.colorSlot),
                        },
                      ],
                    });
                  }}
                  onFocus={() => setHover(index)}
                  onBlur={() => setHover(null)}
                  onPointerLeave={() => {
                    setHover(null);
                    setTip(null);
                  }}
                />
              );
            })
          )}

          <text
            x={CX}
            y={CY - 6}
            textAnchor="middle"
            className="figure fill-[var(--text-primary)] text-[26px] font-semibold"
          >
            {formatMoney(hover != null ? data[hover].cents : total, { showCents: false })}
          </text>
          <text
            x={CX}
            y={CY + 16}
            textAnchor="middle"
            className="fill-[var(--text-muted)] text-[12px]"
          >
            {hover != null ? truncate(data[hover].label, 18) : centerLabel}
          </text>
        </svg>
        <ChartTooltip state={tip} width={SIZE} />
      </ChartFrame>

      <div className="min-w-0 flex-1">
        {/* Direct value labels — the relief that lets low-contrast hues ship. */}
        <ul className="flex flex-col gap-1.5">
          {data.map((s, i) => (
            <li
              key={s.id}
              className="flex items-center gap-2 rounded-[6px] px-1 py-0.5 transition-colors"
              style={{ background: hover === i ? "var(--surface-2)" : "transparent" }}
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover(null)}
            >
              <span
                aria-hidden
                className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                style={{ background: seriesVar(s.colorSlot) }}
              />
              <span className="min-w-[72px] flex-1 truncate text-[13px] text-[var(--text-secondary)]">
                {s.label}
              </span>
              <span className="tnum text-[13px] font-medium text-[var(--text-primary)]">
                {formatMoney(s.cents, { showCents: false })}
              </span>
              <span className="tnum w-9 text-right text-[12px] text-[var(--text-muted)]">
                {((s.cents / total) * 100).toFixed(0)}%
              </span>
            </li>
          ))}
        </ul>

        <ChartTable
          columns={["Group", "Amount", "Share"]}
          rows={data.map((s) => [
            { text: s.label, color: seriesVar(s.colorSlot) },
            formatMoney(s.cents),
            `${((s.cents / total) * 100).toFixed(1)}%`,
          ])}
        />
        </div>
      </div>
    </div>
  );
}

function truncate(s: string, n: number) {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}
