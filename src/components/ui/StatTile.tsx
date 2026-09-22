import { formatMoney } from "@/lib/money";

/**
 * Stat tile contract: label · value · optional delta. The value uses
 * proportional figures — tabular-nums makes a number like 121 look loose at
 * display sizes.
 */
export function StatTile({
  label,
  cents,
  value,
  delta,
  deltaLabel,
  upIsGood = true,
  hero = false,
  hint,
  tone,
}: {
  label: string;
  cents?: number;
  value?: string;
  delta?: number;
  deltaLabel?: string;
  upIsGood?: boolean;
  hero?: boolean;
  hint?: string;
  tone?: "good" | "critical";
}) {
  const shown = value ?? formatMoney(cents ?? 0, { showCents: !hero });
  const hasDelta = delta != null && Number.isFinite(delta) && deltaLabel;
  const good = hasDelta ? (delta! >= 0) === upIsGood : true;
  const color = tone === "good" ? "var(--good)" : tone === "critical" ? "var(--critical)" : "var(--text-primary)";

  return (
    <div className="flex flex-col justify-between gap-1.5">
      <p className="t-subhead text-[var(--text-secondary)]">{label}</p>
      <p
        className="figure"
        style={{
          color,
          fontSize: hero ? 40 : 27,
          lineHeight: 1.05,
        }}
      >
        {shown}
      </p>
      {hasDelta ? (
        <p className="t-footnote flex items-center gap-1">
          <span
            aria-hidden
            style={{ color: good ? "var(--good)" : "var(--critical)", fontSize: 10 }}
          >
            {delta! >= 0 ? "▲" : "▼"}
          </span>
          <span style={{ color: good ? "var(--good)" : "var(--critical)" }}>
            {Math.abs(delta!).toFixed(0)}%
          </span>
          <span className="text-[var(--text-secondary)]">{deltaLabel}</span>
        </p>
      ) : hint ? (
        <p className="t-footnote text-[var(--text-secondary)]">{hint}</p>
      ) : (
        <p className="t-footnote text-transparent select-none">—</p>
      )}
    </div>
  );
}
