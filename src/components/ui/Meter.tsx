import { clamp } from "@/lib/money";

/**
 * The fill carries severity; the track is a lighter step of the same ramp, so
 * state reads across the whole bar rather than only where it's filled.
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
  const severity =
    tone ?? (ratio > 1 ? "critical" : ratio > 0.9 ? "warning" : "accent");

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

  const pct = clamp(ratio * 100, 0, 100);

  return (
    <div
      className="w-full overflow-hidden rounded-full"
      style={{ height, background: track }}
      role="img"
      aria-label={`${Math.round(ratio * 100)}% of budget used`}
    >
      <div
        className="h-full rounded-full transition-[width] duration-300"
        style={{ width: `${pct}%`, background: fill }}
      />
    </div>
  );
}
