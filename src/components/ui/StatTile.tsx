import { formatMoney } from "@/lib/money";

/**
 * Stat tile contract: label · value · optional delta · optional trend.
 * The value uses proportional figures — tabular-nums makes a number like 121
 * look loose at display sizes.
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
}: {
  label: string;
  cents?: number;
  value?: string;
  delta?: number; // percent change
  deltaLabel?: string;
  upIsGood?: boolean;
  hero?: boolean;
  hint?: string;
}) {
  const shown = value ?? formatMoney(cents ?? 0, { showCents: !hero });
  const hasDelta = delta != null && Number.isFinite(delta) && deltaLabel;
  const good = hasDelta ? (delta! >= 0) === upIsGood : true;

  return (
    <div className="flex flex-col justify-between gap-2">
      <p className="text-[13px] font-medium text-[var(--text-secondary)]">{label}</p>
      <p
        className={`figure font-semibold text-[var(--text-primary)] ${
          hero ? "text-[44px] leading-none" : "text-[26px] leading-none"
        }`}
      >
        {shown}
      </p>
      {hasDelta ? (
        <p className="flex items-center gap-1.5 text-[12.5px]">
          <span
            aria-hidden
            className="inline-block"
            style={{ color: good ? "var(--good)" : "var(--critical)" }}
          >
            {delta! >= 0 ? "▲" : "▼"}
          </span>
          <span style={{ color: good ? "var(--good)" : "var(--critical)" }}>
            {Math.abs(delta!).toFixed(0)}%
          </span>
          <span className="text-[var(--text-muted)]">{deltaLabel}</span>
        </p>
      ) : hint ? (
        <p className="text-[12.5px] text-[var(--text-muted)]">{hint}</p>
      ) : (
        <p className="text-[12.5px] text-transparent select-none">—</p>
      )}
    </div>
  );
}
