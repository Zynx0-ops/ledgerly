"use client";

import { useCallback, useRef, useState, type ReactNode } from "react";

/* ── Tooltip ──────────────────────────────────────────────────────────────── */

export interface TooltipRow {
  label: string;
  value: string;
  color?: string;
}

export interface TooltipState {
  x: number;
  y: number;
  title: string;
  rows: TooltipRow[];
}

/**
 * Values lead, labels follow: in a tooltip the reader already has the series and
 * wants the number. Series are keyed with a short stroke, not a filled box.
 * Labels are inserted as text nodes — they come from user data.
 */
export function ChartTooltip({ state, width }: { state: TooltipState | null; width: number }) {
  if (!state) return null;
  const flip = state.x > width * 0.6;
  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 min-w-[132px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-2 shadow-lg"
      style={{
        left: `${(state.x / width) * 100}%`,
        top: state.y,
        transform: `translate(${flip ? "calc(-100% - 12px)" : "12px"}, -50%)`,
      }}
    >
      <p className="mb-1.5 text-[11px] font-medium tracking-wide text-[var(--text-muted)] uppercase">
        {state.title}
      </p>
      <ul className="flex flex-col gap-1">
        {state.rows.map((r, i) => (
          <li key={i} className="flex items-center gap-2 whitespace-nowrap">
            {r.color ? (
              <span
                aria-hidden
                className="inline-block h-[2px] w-3 shrink-0 rounded-full"
                style={{ background: r.color }}
              />
            ) : null}
            <span className="tnum text-[13px] font-semibold text-[var(--text-primary)]">
              {r.value}
            </span>
            <span className="text-[12px] text-[var(--text-secondary)]">{r.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Legend ───────────────────────────────────────────────────────────────── */

export function Legend({
  items,
  shape = "rect",
}: {
  items: { label: string; color: string; value?: string }[];
  shape?: "rect" | "line";
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-1.5">
          <span
            aria-hidden
            className={shape === "line" ? "h-[2px] w-3.5 rounded-full" : "h-2.5 w-2.5 rounded-[3px]"}
            style={{ background: it.color }}
          />
          <span className="text-[12.5px] text-[var(--text-secondary)]">{it.label}</span>
          {it.value ? (
            <span className="tnum text-[12.5px] font-medium text-[var(--text-primary)]">
              {it.value}
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/* ── Table twin ───────────────────────────────────────────────────────────── */

/**
 * Every chart ships a table view. It is the WCAG-clean equivalent and the relief
 * for hues that sit below 3:1 on the light surface — no value is ever reachable
 * only by hovering.
 */
export function ChartTable({
  columns,
  rows,
  label = "Show as table",
}: {
  columns: string[];
  rows: (string | { text: string; color?: string })[][];
  label?: string;
}) {
  return (
    <details className="group mt-3">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-[12.5px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
        <span aria-hidden className="transition-transform group-open:rotate-90">
          ›
        </span>
        {label}
      </summary>
      <div className="mt-2 max-h-64 overflow-auto rounded-[var(--radius-sm)] border border-[var(--border)]">
        <table className="w-full text-[12.5px]">
          <thead className="sticky top-0 bg-[var(--surface-2)]">
            <tr>
              {columns.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={`px-2.5 py-1.5 font-medium text-[var(--text-secondary)] ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} className="border-t border-[var(--border)]">
                {r.map((cell, ci) => {
                  const text = typeof cell === "string" ? cell : cell.text;
                  const color = typeof cell === "string" ? undefined : cell.color;
                  return (
                    <td
                      key={ci}
                      className={`px-2.5 py-1.5 ${
                        ci === 0
                          ? "text-left text-[var(--text-primary)]"
                          : "tnum text-right text-[var(--text-secondary)]"
                      }`}
                    >
                      {color ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            aria-hidden
                            className="inline-block h-2 w-2 shrink-0 rounded-[2px]"
                            style={{ background: color }}
                          />
                          {text}
                        </span>
                      ) : (
                        text
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

/* ── Pointer helper ───────────────────────────────────────────────────────── */

/** Maps a pointer event onto the SVG's own viewBox coordinates. */
export function useSvgPointer(viewWidth: number) {
  const ref = useRef<SVGSVGElement | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  const onMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const el = ref.current;
      if (!el) return;
      const box = el.getBoundingClientRect();
      if (!box.width) return;
      setPos({
        x: ((e.clientX - box.left) / box.width) * viewWidth,
        y: e.clientY - box.top,
      });
    },
    [viewWidth],
  );

  const onLeave = useCallback(() => setPos(null), []);

  return { ref, pos, onMove, onLeave, setPos };
}

export function ChartFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`relative ${className}`}>{children}</div>;
}

/** Y-axis ticks land on clean, human numbers. */
export function niceTicks(max: number, count = 4): number[] {
  if (max <= 0) return [0];
  const raw = max / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10) * mag;
  const ticks: number[] = [];
  for (let v = 0; v <= max + step * 0.001; v += step) ticks.push(v);
  return ticks;
}

/** A bar with its data-end rounded and its baseline square. */
export function barPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  dir: "up" | "right",
): string {
  if (h <= 0 || w <= 0) return "";
  if (dir === "up") {
    const rr = Math.min(r, w / 2, h);
    return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
  }
  const rr = Math.min(r, h / 2, w);
  return `M${x},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h - rr} Q${x + w},${y + h} ${x + w - rr},${y + h} L${x},${y + h} Z`;
}
