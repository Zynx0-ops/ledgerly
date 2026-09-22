import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  icon = "○",
  title,
  body,
  cta,
  href,
  children,
}: {
  icon?: string;
  title: string;
  body: string;
  cta?: string;
  href?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5 px-6 py-14 text-center">
      <span
        aria-hidden
        className="grid h-12 w-12 place-items-center rounded-[14px] bg-[var(--surface-2)] text-[22px]"
      >
        {icon}
      </span>
      <h3 className="t-title-3 mt-1 text-[var(--text-primary)]">{title}</h3>
      <p className="t-subhead max-w-sm leading-relaxed text-balance text-[var(--text-secondary)]">
        {body}
      </p>
      {cta && href ? (
        <Link
          href={href}
          className="mt-2 rounded-[10px] bg-[var(--accent)] px-4 py-2 t-headline text-white transition-opacity active:opacity-70"
        >
          {cta}
        </Link>
      ) : null}
      {children}
    </div>
  );
}
