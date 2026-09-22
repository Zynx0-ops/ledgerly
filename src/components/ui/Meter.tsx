import { clamp } from "@/lib/money";

/**
 * A capsule progress bar in Apple's proportions. The fill carries severity; the
 * track is a lighter step of the same ramp so state reads across the whole bar.
 */
export function Meter({
  value,
  max,
  height = 8,
  tone,
}: {
  value: number;
  max: number;
  height?: number;
  tone?: "accent" | "warning" | "critical" | "good";
}) {
  const ratio = max > 0 ? value / max : 0;
  const severity = tone ?? (ratio > 1 ? "critical" : ratio > 0.9 ? "warning" : "accent");

  const fill = {
    accent: "var(--accent)",
    warning: "var(--warning)",
    critical: "var(--critical)",
    good: "var(--good)",
  }[severity];

  const track = {
    accent: "var(--accent-wash)",
    warning: "var(--warning-wash)",
    critical: "var(--critical-wash)",
    good: "var(--good-wash)",
  }[severity];

  return (
    <div
      className="w-full overflow-hidden rounded-full"
      style={{ height, background: track }}
      role="img"
      aria-label={`${Math.round(ratio * 100)}% of budget used`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]"
        style={{ width: `${clamp(ratio * 100, 0, 100)}%`, background: fill }}
      />
    </div>
  );
}
