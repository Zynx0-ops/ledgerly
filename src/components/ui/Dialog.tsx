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
      className="animate-fade fixed inset-0 z-50 flex items-end justify-center bg-black/25 p-0 backdrop-blur-[3px] sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`animate-sheet w-full ${width} max-h-[92vh] overflow-y-auto rounded-t-[var(--radius-lg)] bg-[var(--surface-1)] pb-[max(env(safe-area-inset-bottom),16px)] shadow-[var(--shadow-float)] sm:rounded-[var(--radius-lg)] sm:pb-4`}
      >
        {/* Grabber — the affordance that says "this sheet can be dismissed". */}
        <div className="flex justify-center pt-2 sm:hidden">
          <span aria-hidden className="h-[5px] w-9 rounded-full bg-[var(--border-strong)]" />
        </div>

        <div className="relative flex items-center justify-center px-4 pt-3 pb-3">
          <h2 className="t-title-3 text-[var(--text-primary)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 grid h-7 w-7 place-items-center rounded-full bg-[var(--surface-2)] text-[13px] text-[var(--text-secondary)] transition-opacity active:opacity-60"
          >
            ✕
          </button>
        </div>

        <div className="px-4">{children}</div>
      </div>
    </div>
  );
}

/* ── Apple control styles ─────────────────────────────────────────────────── */

/** iOS filled text field: no border, a tinted well, generous tap target. */
export const fieldBase =
  "rounded-[10px] border-0 bg-[var(--surface-2)] px-3 py-2.5 t-body text-[var(--text-primary)] outline-none transition-shadow placeholder:text-[var(--text-muted)] focus:ring-2 focus:ring-[var(--accent)]";

export const fieldClass = `w-full ${fieldBase}`;

export const labelClass = "mb-1.5 block t-footnote font-medium text-[var(--text-secondary)]";

export const primaryButton =
  "rounded-[10px] bg-[var(--accent)] px-4 py-2 t-headline text-white transition-opacity hover:opacity-90 active:opacity-70 disabled:opacity-40";

export const ghostButton =
  "rounded-[10px] bg-[var(--surface-2)] px-4 py-2 t-headline text-[var(--text-primary)] transition-opacity hover:opacity-80 active:opacity-60";

/** Full-width sheet actions, stacked — the iOS bottom-of-sheet pattern. */
export const sheetPrimary =
  "w-full rounded-[12px] bg-[var(--accent)] px-4 py-3 t-headline text-white transition-opacity active:opacity-70 disabled:opacity-40";

export const sheetSecondary =
  "w-full rounded-[12px] bg-[var(--surface-2)] px-4 py-3 t-headline text-[var(--text-primary)] transition-opacity active:opacity-60";

export const sheetDestructive =
  "w-full rounded-[12px] px-4 py-3 t-headline text-[var(--critical)] transition-colors hover:bg-[var(--critical-wash)] active:opacity-60";

export const plainButton =
  "t-headline text-[var(--accent)] transition-opacity hover:opacity-80 active:opacity-60";
