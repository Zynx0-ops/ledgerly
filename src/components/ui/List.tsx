import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Apple's inset grouped list: a quiet uppercase header, then a rounded card of
 * rows separated by hairlines that inset to line up with the row's text rather
 * than running the full width.
 */
export function ListSection({
  header,
  footer,
  trailing,
  children,
  className = "",
}: {
  header?: string;
  footer?: ReactNode;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {header || trailing ? (
        <div className="mb-2 flex items-end justify-between gap-3 px-1">
          {header ? <h2 className="t-section">{header}</h2> : <span />}
          {trailing ? <div className="t-footnote text-[var(--text-secondary)]">{trailing}</div> : null}
        </div>
      ) : null}
      <div className="overflow-hidden rounded-[var(--radius)] bg-[var(--surface-1)]">{children}</div>
      {footer ? <p className="t-footnote mt-2 px-1 text-[var(--text-secondary)]">{footer}</p> : null}
    </section>
  );
}

/**
 * A single row. `inset` is where the hairline starts — it should clear the
 * leading icon so the separator aligns with the title, the way iOS does it.
 */
export function Row({
  leading,
  title,
  subtitle,
  value,
  valueTone = "primary",
  detail,
  href,
  onClickAccessory,
  chevron = false,
  inset = 16,
  children,
}: {
  leading?: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  value?: ReactNode;
  valueTone?: "primary" | "secondary" | "good" | "critical";
  detail?: ReactNode;
  href?: string;
  onClickAccessory?: ReactNode;
  chevron?: boolean;
  inset?: number;
  children?: ReactNode;
}) {
  const valueColor = {
    primary: "var(--text-primary)",
    secondary: "var(--text-secondary)",
    good: "var(--good)",
    critical: "var(--critical)",
  }[valueTone];

  const body = (
    <>
      {leading}
      {children ?? (
        <>
          <span className="min-w-0 flex-1">
            <span className="t-body block truncate text-[var(--text-primary)]">{title}</span>
            {subtitle ? (
              <span className="t-footnote block truncate text-[var(--text-secondary)]">{subtitle}</span>
            ) : null}
          </span>
          {value != null ? (
            <span className="tnum t-body shrink-0 text-right" style={{ color: valueColor }}>
              {value}
              {detail ? (
                <span className="t-caption block text-[var(--text-secondary)]">{detail}</span>
              ) : null}
            </span>
          ) : null}
        </>
      )}
      {onClickAccessory}
      {chevron ? (
        <span aria-hidden className="shrink-0 text-[17px] leading-none text-[var(--text-muted)]">
          ›
        </span>
      ) : null}
    </>
  );

  const rowClass =
    "relative flex items-center gap-3 px-4 py-2.5 " +
    "after:pointer-events-none after:absolute after:right-0 after:bottom-0 after:h-[0.5px] " +
    "after:bg-[var(--border)] last:after:hidden";

  const style = { ["--sep" as string]: `${inset}px` };

  if (href) {
    return (
      <Link
        href={href}
        style={style}
        className={`${rowClass} pressable after:left-[var(--sep)] hover:bg-[var(--surface-2)]`}
      >
        {body}
      </Link>
    );
  }

  return (
    <div style={style} className={`${rowClass} after:left-[var(--sep)]`}>
      {body}
    </div>
  );
}
