"use client";

import { useState } from "react";
import { formatCompactMoney, formatMoney } from "@/lib/money";
import { formatMonth, type MonthKey } from "@/lib/dates";
import { barPath, ChartFrame, ChartTable, ChartTooltip, Legend, niceTicks, type TooltipState } from "./common";

export interface CashflowPoint {
  month: MonthKey;
  incomeCents: number;
  expenseCents: number;
}

const W = 680;
const H = 260;
const PAD = { top: 20, right: 26, bottom: 34, left: 52 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;
const GAP = 2; // surface gap between the two adjacent bars
const MAX_BAR = 24;

// Two-series charts deliberately use slots 3 and 1 (blue / orange) rather than
// the first two slots: the pair is far apart under every simulation
// (CVD ΔE 33.0 light / 31.2 dark, normal-vision 39.5 / 35.9) and reads as
// "mine vs the reference" instead of two hot hues competing.
const INCOME = "var(--series-3)";
const EXPENSE = "var(--series-1)";

/** Two series of the same measure — one axis, grouped columns, legend always present. */
export function CashflowChart({ points }: { points: CashflowPoint[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [tip, setTip] = useState<TooltipState | null>(null);

  const max = Math.max(1, ...points.flatMap((p) => [p.incomeCents, p.expenseCents]));
  const ticks = niceTicks(max, 4);
  const scaleMax = ticks[ticks.length - 1] || max;
  const y = (cents: number) => PAD.top + PLOT_H - (cents / scaleMax) * PLOT_H;
  const band = PLOT_W / Math.max(points.length, 1);
  const barW = Math.min(MAX_BAR, (band - GAP) / 2 - 8);
  // Direct labels only earn their place when the mark is wide enough to carry
  // one. Past ~9 months the bars get thinner than their own labels, so the axis,
  // tooltip and table view carry the values instead.
  const labelBars = barW >= 20;

  return (
    <div>
      <div className="mb-3">
        <Legend
          items={[
            { label: "Income", color: INCOME },
            { label: "Spending", color: EXPENSE },
          ]}
        />
      </div>

      <ChartFrame>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Income and spending by month"
          onPointerLeave={() => {
            setHover(null);
            setTip(null);
          }}
        >
          {/* Hairline, solid, recessive — never dashed. */}
          {ticks.map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={y(t)}
                y2={y(t)}
                stroke="var(--grid)"
                strokeWidth={1}
              />
              <text
                x={PAD.left - 8}
                y={y(t) + 4}
                textAnchor="end"
                className="tnum fill-[var(--text-muted)] text-[11px]"
              >
                {t === 0 ? "$0" : formatCompactMoney(t)}
              </text>
            </g>
          ))}

          {points.map((p, i) => {
            const bx = PAD.left + band * i;
            const centre = bx + band / 2;
            const incomeX = centre - barW - GAP / 2;
            const expenseX = centre + GAP / 2;
            const isLast = i === points.length - 1;

            return (
              <g key={p.month}>
                <rect
                  x={bx}
                  y={PAD.top}
                  width={band}
                  height={PLOT_H}
                  fill={hover === i ? "var(--surface-2)" : "transparent"}
                  className="cursor-pointer"
                  onPointerEnter={() => {
                    setHover(i);
                    setTip({
                      x: centre,
                      y: PAD.top + 40,
                      title: formatMonth(p.month),
                      rows: [
                        { label: "income", value: formatMoney(p.incomeCents, { showCents: false }), color: INCOME },
                        { label: "spending", value: formatMoney(p.expenseCents, { showCents: false }), color: EXPENSE },
                        {
                          label: "left over",
                          value: formatMoney(p.incomeCents - p.expenseCents, {
                            showCents: false,
                            signed: true,
                          }),
                        },
                      ],
                    });
                  }}
                />
                <path
                  d={barPath(incomeX, y(p.incomeCents), barW, PAD.top + PLOT_H - y(p.incomeCents), 4, "up")}
                  fill={INCOME}
                />
                <path
                  d={barPath(expenseX, y(p.expenseCents), barW, PAD.top + PLOT_H - y(p.expenseCents), 4, "up")}
                  fill={EXPENSE}
                />

                {/* Label selectively: only the most recent month carries its values. */}
                {labelBars && isLast && p.incomeCents > 0 ? (
                  <text
                    x={incomeX + barW / 2}
                    y={y(p.incomeCents) - 6}
                    textAnchor="middle"
                    className="tnum fill-[var(--text-secondary)] text-[11px] font-medium"
                  >
                    {formatCompactMoney(p.incomeCents)}
                  </text>
                ) : null}
                {labelBars && isLast && p.expenseCents > 0 ? (
                  <text
                    x={expenseX + barW / 2}
                    y={y(p.expenseCents) - 6}
                    textAnchor="middle"
                    className="tnum fill-[var(--text-secondary)] text-[11px] font-medium"
                  >
                    {formatCompactMoney(p.expenseCents)}
                  </text>
                ) : null}

                <text
                  x={centre}
                  y={H - 12}
                  textAnchor="middle"
                  className="fill-[var(--text-muted)] text-[11px]"
                >
                  {formatMonth(p.month, "short")}
                </text>
              </g>
            );
          })}

          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + PLOT_H}
            y2={PAD.top + PLOT_H}
            stroke="var(--border-strong)"
            strokeWidth={1}
          />
        </svg>
        <ChartTooltip state={tip} width={W} />
      </ChartFrame>

      <ChartTable
        columns={["Month", "Income", "Spending", "Left over"]}
        rows={points.map((p) => [
          formatMonth(p.month),
          formatMoney(p.incomeCents),
          formatMoney(p.expenseCents),
          formatMoney(p.incomeCents - p.expenseCents, { signed: true }),
        ])}
      />
    </div>
  );
}
