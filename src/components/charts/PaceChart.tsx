"use client";

import { useState } from "react";
import { formatCompactMoney, formatMoney } from "@/lib/money";
import { ChartFrame, ChartTable, ChartTooltip, Legend, niceTicks, useSvgPointer, type TooltipState } from "./common";

const W = 680;
const H = 240;
const PAD = { top: 18, right: 54, bottom: 30, left: 52 };
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

// Two-series charts deliberately use slots 3 and 1 (blue / orange) rather than
// the first two slots: the pair is far apart under every simulation
// (CVD ΔE 33.0 light / 31.2 dark, normal-vision 39.5 / 35.9) and reads as
// "mine vs the reference" instead of two hot hues competing.
const ACTUAL = "var(--series-3)";
const PACE = "var(--series-1)";

/**
 * "Am I on pace?" — cumulative spending against the straight line a monthly
 * budget implies. Where the blue line sits above the orange one, the month is
 * running hot.
 */
export function PaceChart({
  days,
  budgetCents,
  elapsedDays,
}: {
  days: { day: number; cents: number }[];
  budgetCents: number;
  elapsedDays: number;
}) {
  const [tip, setTip] = useState<TooltipState | null>(null);
  const [crosshair, setCrosshair] = useState<number | null>(null);
  const { ref, onMove, onLeave } = useSvgPointer(W);

  const total = days.length;
  if (!total) return null;

  const visible = days.filter((d) => d.day <= Math.max(elapsedDays, 1));
  const spentMax = Math.max(...days.map((d) => d.cents), budgetCents, 1);
  const ticks = niceTicks(spentMax, 4);
  const scaleMax = ticks[ticks.length - 1] || spentMax;

  const x = (day: number) => PAD.left + ((day - 1) / Math.max(total - 1, 1)) * PLOT_W;
  const y = (cents: number) => PAD.top + PLOT_H - (cents / scaleMax) * PLOT_H;

  const actualPath = visible.map((d, i) => `${i ? "L" : "M"}${x(d.day).toFixed(1)},${y(d.cents).toFixed(1)}`).join(" ");
  const areaPath = visible.length
    ? `${actualPath} L${x(visible[visible.length - 1].day).toFixed(1)},${y(0)} L${x(visible[0].day).toFixed(1)},${y(0)} Z`
    : "";

  const pacePath = budgetCents > 0 ? `M${x(1)},${y(budgetCents / total)} L${x(total)},${y(budgetCents)}` : "";
  const last = visible[visible.length - 1];
  const paceNow = budgetCents > 0 ? (budgetCents * Math.max(elapsedDays, 1)) / total : 0;
  const overPace = last && paceNow > 0 && last.cents > paceNow;

  function handleMove(e: React.PointerEvent<SVGSVGElement>) {
    onMove(e);
    const box = e.currentTarget.getBoundingClientRect();
    if (!box.width) return;
    const svgX = ((e.clientX - box.left) / box.width) * W;
    const day = Math.round(((svgX - PAD.left) / PLOT_W) * (total - 1)) + 1;
    const clamped = Math.min(Math.max(day, 1), total);
    const point = days.find((d) => d.day === clamped);
    if (!point) return;
    setCrosshair(clamped);

    const rows = [
      { label: "spent so far", value: formatMoney(point.cents, { showCents: false }), color: ACTUAL },
    ];
    if (budgetCents > 0) {
      rows.push({
        label: "on-pace target",
        value: formatMoney((budgetCents * clamped) / total, { showCents: false }),
        color: PACE,
      });
    }
    setTip({ x: x(clamped), y: PAD.top + 30, title: `Day ${clamped}`, rows });
  }

  function handleLeave() {
    onLeave();
    setCrosshair(null);
    setTip(null);
  }

  return (
    <div>
      <div className="mb-3">
        <Legend
          shape="line"
          items={
            budgetCents > 0
              ? [
                  { label: "Spent", color: ACTUAL },
                  { label: "On-pace target", color: PACE },
                ]
              : [{ label: "Spent", color: ACTUAL }]
          }
        />
      </div>

      <ChartFrame>
        <svg
          ref={ref}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none"
          role="img"
          aria-label="Cumulative spending this month against the on-pace target"
          onPointerMove={handleMove}
          onPointerLeave={handleLeave}
        >
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--grid)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="tnum fill-[var(--text-muted)] text-[11px]">
                {t === 0 ? "$0" : formatCompactMoney(t)}
              </text>
            </g>
          ))}

          {[1, Math.ceil(total / 2), total].map((d) => (
            <text key={d} x={x(d)} y={H - 10} textAnchor="middle" className="fill-[var(--text-muted)] text-[11px]">
              {d}
            </text>
          ))}

          {/* Area wash at ~10% — never a saturated block. */}
          {areaPath ? <path d={areaPath} fill={ACTUAL} opacity={0.1} /> : null}
          {pacePath ? <path d={pacePath} stroke={PACE} strokeWidth={2} fill="none" strokeLinecap="round" /> : null}
          <path d={actualPath} stroke={ACTUAL} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />

          {crosshair != null ? (
            <line
              x1={x(crosshair)}
              x2={x(crosshair)}
              y1={PAD.top}
              y2={PAD.top + PLOT_H}
              stroke="var(--border-strong)"
              strokeWidth={1}
            />
          ) : null}

          {last ? (
            <>
              {/* End marker: 2px ring in the surface color keeps it legible over the line. */}
              <circle cx={x(last.day)} cy={y(last.cents)} r={6} fill="var(--surface-1)" />
              <circle cx={x(last.day)} cy={y(last.cents)} r={4} fill={ACTUAL} />
              <text
                x={Math.min(x(last.day) + 10, W - 6)}
                y={y(last.cents) + 4}
                className="tnum fill-[var(--text-primary)] text-[11px] font-semibold"
              >
                {formatCompactMoney(last.cents)}
              </text>
            </>
          ) : null}

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

      {budgetCents > 0 && last ? (
        <p className="mt-2 text-[12.5px] text-[var(--text-secondary)]">
          {overPace ? (
            <>
              Running{" "}
              <strong className="font-semibold text-[var(--critical)]">
                {formatMoney(last.cents - paceNow, { showCents: false })} ahead
              </strong>{" "}
              of an even pace for this point in the month.
            </>
          ) : (
            <>
              Running{" "}
              <strong className="font-semibold text-[var(--good)]">
                {formatMoney(paceNow - last.cents, { showCents: false })} under
              </strong>{" "}
              an even pace for this point in the month.
            </>
          )}
        </p>
      ) : null}

      <ChartTable
        columns={["Day", "Spent so far", "On-pace target"]}
        rows={visible
          .filter((d) => d.day % 5 === 0 || d.day === visible.length)
          .map((d) => [
            `Day ${d.day}`,
            formatMoney(d.cents),
            budgetCents > 0 ? formatMoney((budgetCents * d.day) / total) : "—",
          ])}
      />
    </div>
  );
}
