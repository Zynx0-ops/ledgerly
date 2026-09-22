"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

type Item = { href: string; label: string; icon: string };

const NAV: Item[] = [
  { href: "/", label: "Dashboard", icon: "◎" },
  { href: "/transactions", label: "Transactions", icon: "⇅" },
  { href: "/budget", label: "Budget", icon: "◑" },
  { href: "/accounts", label: "Accounts", icon: "▤" },
  { href: "/goals", label: "Goals", icon: "◇" },
  { href: "/reports", label: "Reports", icon: "◴" },
];

const SECONDARY: Item[] = [
  { href: "/import", label: "Import CSV", icon: "↧" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar({ uncategorized }: { uncategorized: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const link = (item: Item, badge?: number) => {
    const active = isActive(item.href);
    return (
      <li key={item.href}>
        <Link
          href={item.href}
          onClick={() => setOpen(false)}
          aria-current={active ? "page" : undefined}
          className={`flex items-center gap-2.5 rounded-full px-3 py-[7px] transition-colors duration-200 ${
            active
              ? "bg-[var(--accent)] text-[var(--accent-ink)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
          }`}
        >
          <span aria-hidden className="w-[16px] shrink-0 text-center text-[13px] leading-none">
            {item.icon}
          </span>
          <span className={`t-subhead flex-1 ${active ? "font-semibold" : ""}`}>{item.label}</span>
          {badge ? (
            <span
              className={`tnum rounded-full px-1.5 py-[1px] text-[11px] font-semibold ${
                active
                  ? "bg-[var(--accent-ink)]/15 text-[var(--accent-ink)]"
                  : "bg-[var(--warning-wash)] text-[var(--warning)]"
              }`}
            >
              {badge}
            </span>
          ) : null}
        </Link>
      </li>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Toggle navigation"
        className="material fixed top-4 left-4 z-50 rounded-full px-3 py-2 text-[15px] text-[var(--text-primary)] ring-1 ring-[var(--border)] md:hidden"
      >
        ☰
      </button>

      {open ? (
        <div
          className="animate-fade fixed inset-0 z-30 bg-black/50 backdrop-blur-[4px] md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      <nav
        className={`material fixed inset-y-0 left-0 z-40 flex w-[232px] shrink-0 flex-col border-r border-[var(--border)] px-3 py-4 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main"
      >
        <Link href="/" className="mb-6 flex items-center gap-2.5 px-2 pt-10 md:pt-1">
          <span
            aria-hidden
            className="grid h-[28px] w-[28px] place-items-center rounded-full bg-[var(--accent)] text-[13px] font-bold text-[var(--accent-ink)]"
          >
            L
          </span>
          <span className="t-title-3 text-[var(--text-primary)]">Ledgerly</span>
        </Link>

        <ul className="flex flex-col gap-[3px]">
          {NAV.map((item) =>
            item.href === "/transactions" ? link(item, uncategorized) : link(item),
          )}
        </ul>

        <div className="mt-6 mb-2 px-3">
          <span className="t-section">Manage</span>
        </div>

        <ul className="flex flex-col gap-[3px]">{SECONDARY.map((item) => link(item))}</ul>

        <div className="mt-auto flex items-center justify-between px-3 pt-4">
          <span className="t-caption text-[var(--text-muted)]">On this Mac</span>
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}
