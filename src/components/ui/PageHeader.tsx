import type { ReactNode } from "react";

/** macOS/iOS large title: left-aligned, bold, tightly tracked. */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
      <div className="min-w-0">
        <h1 className="t-large-title text-[var(--text-primary)]">{title}</h1>
        {subtitle ? (
          <p className="t-subhead mt-1 text-[var(--text-secondary)]">{subtitle}</p>
        ) : null}
      </div>
      {children ? <div className="flex flex-wrap items-center gap-2">{children}</div> : null}
    </header>
  );
}
