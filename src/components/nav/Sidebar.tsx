"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

const NAV = [
  { href: "/", label: "Dashboard", icon: "◎" },
  { href: "/transactions", label: "Transactions", icon: "≡" },
  { href: "/budget", label: "Budget", icon: "◑" },
  { href: "/accounts", label: "Accounts", icon: "▤" },
  { href: "/goals", label: "Goals", icon: "◇" },
  { href: "/reports", label: "Reports", icon: "◔" },
];

const SECONDARY = [
  { href: "/import", label: "Import CSV", icon: "↧" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar({ uncategorized }: { uncategorized: number }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const link = (item: { href: string; label: string; icon: string }, badge?: number) => (
    <li key={item.href}>
      <Link
        href={item.href}
        onClick={() => setOpen(false)}
        aria-current={isActive(item.href) ? "page" : undefined}
        className={`flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-[13.5px] transition-colors ${
          isActive(item.href)
            ? "bg-[var(--surface-3)] font-medium text-[var(--text-primary)]"
            : "text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
        }`}
      >
        <span aria-hidden className="w-4 text-center text-[13px] opacity-70">
          {item.icon}
        </span>
        <span className="flex-1">{item.label}</span>
        {badge ? (
          <span className="tnum rounded-full bg-[var(--warning-wash)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--warning)]">
            {badge}
          </span>
        ) : null}
      </Link>
    </li>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Toggle navigation"
        className="fixed top-3 left-3 z-50 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface-1)] px-2.5 py-1.5 text-[13px] text-[var(--text-secondary)] shadow-[var(--shadow-card)] md:hidden"
      >
        ☰
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-30 bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      <nav
        className={`fixed inset-y-0 left-0 z-40 flex w-60 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--surface-1)] px-3 py-4 transition-transform md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main"
      >
        <Link href="/" className="mb-6 flex items-center gap-2 px-2 pt-8 md:pt-0">
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-[8px] text-[13px] font-bold text-white"
            style={{ background: "var(--accent)" }}
          >
            L
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[var(--text-primary)]">
            Ledgerly
          </span>
        </Link>

        <ul className="flex flex-col gap-0.5">
          {NAV.map((item) =>
            item.href === "/transactions" ? link(item, uncategorized) : link(item),
          )}
        </ul>

        <div className="my-4 border-t border-[var(--border)]" />

        <ul className="flex flex-col gap-0.5">{SECONDARY.map((item) => link(item))}</ul>

        <div className="mt-auto flex items-center justify-between px-2 pt-4">
          <span className="text-[11px] text-[var(--text-muted)]">Local · private</span>
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}
