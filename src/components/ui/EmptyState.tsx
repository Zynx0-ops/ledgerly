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
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span aria-hidden className="text-2xl opacity-60">
        {icon}
      </span>
      <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="max-w-sm text-[13px] leading-relaxed text-[var(--text-secondary)]">{body}</p>
      {cta && href ? (
        <Link
          href={href}
          className="mt-1 rounded-[var(--radius-sm)] bg-[var(--accent)] px-3.5 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
        >
          {cta}
        </Link>
      ) : null}
      {children}
    </div>
  );
}
