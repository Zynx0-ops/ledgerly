"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * An iOS-style sheet: it rises from the bottom over a dimmed, blurred backdrop,
 * carries a grabber on small screens, and centers its title the way a UIKit
 * navigation bar does.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
  width = "max-w-[420px]",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 backdrop-blur-[6px] sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`material animate-sheet w-full ${width} max-h-[92vh] overflow-y-auto rounded-t-[var(--radius-xl)] pb-[max(env(safe-area-inset-bottom),16px)] shadow-[var(--shadow-float)] ring-1 ring-[var(--border)] sm:rounded-[var(--radius-xl)] sm:pb-5`}
      >
        {/* Grabber — the affordance that says "this sheet can be dismissed". */}
        <div className="flex justify-center pt-2 sm:hidden">
          <span aria-hidden className="h-[5px] w-9 rounded-full bg-[var(--border-strong)]" />
        </div>

        <div className="relative flex items-center justify-center px-5 pt-4 pb-4">
          <h2 className="t-title-3 text-[var(--text-primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 grid h-7 w-7 place-items-center rounded-full bg-[var(--surface-2)] text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--text-primary)]"
          >
            ✕
          </button>
        </div>

        <div className="px-5">{children}</div>
      </div>
    </div>
  );
}

/* ── Controls ─────────────────────────────────────────────────────────────── */

/** A tinted well, not a bordered box — fields recede until focused. */
export const fieldBase =
  "rounded-[12px] border-0 bg-[var(--surface-2)] px-3.5 py-2.5 t-body text-[var(--text-primary)] outline-none transition-shadow placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--border-strong)]";

export const fieldClass = `w-full ${fieldBase}`;

export const labelClass =
  "mb-1.5 block t-caption font-semibold tracking-[0.08em] text-[var(--text-muted)] uppercase";

/** The monochrome pill both reference projects use for their primary action:
 *  cream on dark, ink on light, never a brand colour. */
export const primaryButton =
  "rounded-full bg-[var(--accent)] px-4 py-2 t-headline text-[var(--accent-ink)] transition-all duration-200 hover:bg-[var(--accent-hover)] active:scale-[0.97] disabled:opacity-40";

export const ghostButton =
  "rounded-full bg-[var(--surface-2)] px-4 py-2 t-headline text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--surface-3)] active:scale-[0.97]";

export const sheetPrimary =
  "w-full rounded-full bg-[var(--accent)] px-4 py-3 t-headline text-[var(--accent-ink)] transition-all duration-200 hover:bg-[var(--accent-hover)] active:scale-[0.99] disabled:opacity-40";

export const sheetSecondary =
  "w-full rounded-full bg-[var(--surface-2)] px-4 py-3 t-headline text-[var(--text-primary)] transition-all duration-200 hover:bg-[var(--surface-3)] active:scale-[0.99]";

export const sheetDestructive =
  "w-full rounded-full px-4 py-3 t-headline text-[var(--critical)] transition-colors hover:bg-[var(--critical-wash)]";

export const plainButton =
  "t-headline text-[var(--text-primary)] transition-opacity hover:opacity-70 active:opacity-50";
