"use client";

import { useState } from "react";

/** A destructive action asks once, inline, rather than firing on a single click. */
export function ConfirmButton({
  label,
  confirmLabel,
  className,
}: {
  label: string;
  confirmLabel: string;
  className: string;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button type="button" onClick={() => setArmed(true)} className={className}>
        {label}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-2">
      <button
        type="submit"
        className="rounded-[var(--radius-sm)] bg-[var(--critical)] px-3 py-2 text-[13px] font-medium text-white"
      >
        {confirmLabel}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="px-2 py-2 text-[13px] text-[var(--text-secondary)] hover:underline"
      >
        Cancel
      </button>
    </span>
  );
}
