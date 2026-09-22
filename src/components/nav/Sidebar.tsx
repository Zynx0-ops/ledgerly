"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ThemeToggle } from "./ThemeToggle";

type Item = { href: string; label: string; icon: string; tint: string };

const NAV: Item[] = [
  { href: "/", label: "Dashboard", icon: "◎", tint: "var(--accent)" },
  { href: "/transactions", label: "Transactions", icon: "⇅", tint: "var(--series-5)" },
  { href: "/budget", label: "Budget", icon: "◑", tint: "var(--series-1)" },
  { href: "/accounts", label: "Accounts", icon: "▤", tint: "var(--series-6)" },
  { href: "/goals", label: "Goals", icon: "◇", tint: "var(--series-2)" },
  { href: "/reports", label: "Reports", icon: "◴", tint: "var(--series-7)" },
];

const SECONDARY: Item[] = [
  { href: "/import", label: "Import CSV", icon: "↧", tint: "var(--text-secondary)" },
  { href: "/settings", label: "Settings", icon: "⚙", tint: "var(--text-secondary)" },
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
          className={`group flex items-center gap-2.5 rounded-[8px] px-2 py-[7px] transition-colors ${
            active
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--text-primary)] hover:bg-[var(--surface-3)]"
          }`}
        >
          <span
            aria-hidden
            className="w-[18px] shrink-0 text-center text-[14px] leading-none"
            style={{ color: active ? "#fff" : item.tint }}
          >
            {item.icon}
          </span>
          <span className={`t-subhead flex-1 ${active ? "font-semibold" : ""}`}>{item.label}</span>
          {badge ? (
            <span
              className={`tnum rounded-full px-1.5 py-[1px] text-[11px] font-semibold ${
                active ? "bg-white/25 text-white" : "bg-[var(--warning-wash)] text-[var(--warning)]"
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
        className="material fixed top-3 left-3 z-50 rounded-[10px] px-2.5 py-1.5 text-[15px] text-[var(--text-primary)] shadow-[0_1px_4px_rgba(0,0,0,0.12)] md:hidden"
      >
        ☰
      </button>

      {open ? (
        <div
          className="animate-fade fixed inset-0 z-30 bg-black/25 backdrop-blur-[2px] md:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      ) : null}

      <nav
        className={`material fixed inset-y-0 left-0 z-40 flex w-[228px] shrink-0 flex-col border-r border-[var(--border)] px-2.5 py-3 transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] md:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Main"
      >
        <Link href="/" className="mb-5 flex items-center gap-2.5 px-2 pt-9 md:pt-1">
          <span
            aria-hidden
            className="grid h-[26px] w-[26px] place-items-center rounded-[7px] text-[13px] font-bold text-white"
            style={{
              background: "linear-gradient(180deg, #1e93ff 0%, var(--accent) 100%)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.18)",
            }}
          >
            L
          </span>
          <span className="t-headline text-[var(--text-primary)]">Ledgerly</span>
        </Link>

        <ul className="flex flex-col gap-[2px]">
          {NAV.map((item) =>
            item.href === "/transactions" ? link(item, uncategorized) : link(item),
          )}
        </ul>

        <div className="mt-5 mb-1.5 px-2">
          <span className="t-section text-[11px]">Manage</span>
        </div>

        <ul className="flex flex-col gap-[2px]">{SECONDARY.map((item) => link(item))}</ul>

        <div className="mt-auto flex items-center justify-between px-2 pt-4">
          <span className="t-caption text-[var(--text-muted)]">On this Mac</span>
          <ThemeToggle />
        </div>
      </nav>
    </>
  );
}
