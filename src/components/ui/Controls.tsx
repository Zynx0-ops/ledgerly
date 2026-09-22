"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";

/** iOS segmented control: a pill track with a sliding white "thumb" behind the
 *  selected option. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  label: string;
  size?: "sm" | "md";
}) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const pad = size === "sm" ? "p-[2px]" : "p-[3px]";
  const text = size === "sm" ? "t-footnote" : "t-subhead";

  const track = useRef<HTMLDivElement>(null);
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const [thumb, setThumb] = useState<{ left: number; width: number } | null>(null);

  // The options are not equal width — "All" next to "Needs a category" — so the
  // thumb measures the selected button rather than assuming an even split.
  useLayoutEffect(() => {
    const measure = () => {
      const el = buttons.current[index];
      const box = track.current;
      if (!el || !box) return;
      setThumb({ left: el.offsetLeft, width: el.offsetWidth });
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    buttons.current.forEach((b) => b && ro.observe(b));
    return () => ro.disconnect();
  }, [index, options.length]);

  return (
    <div
      ref={track}
      role="tablist"
      aria-label={label}
      className={`relative inline-flex ${pad} rounded-full bg-[var(--surface-2)]`}
    >
      {thumb ? (
        <span
          aria-hidden
          className="absolute top-[3px] bottom-[3px] rounded-full bg-[var(--accent)] shadow-[0_2px_10px_-2px_var(--accent-glow)] transition-[transform,width] duration-[260ms] ease-[cubic-bezier(0.34,1.4,0.64,1)]"
          style={{ left: 0, width: thumb.width, transform: `translateX(${thumb.left}px)` }}
        />
      ) : null}
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            buttons.current[i] = el;
          }}
          type="button"
          role="tab"
          aria-selected={o.value === value}
          onClick={() => onChange(o.value)}
          className={`relative z-10 rounded-full px-3.5 py-1 whitespace-nowrap ${text} transition-colors duration-200 ${
            o.value === value
              ? "font-semibold text-[var(--accent-ink)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** iOS switch. Replaces a checkbox wherever the choice takes effect immediately. */
export function Switch({
  name,
  defaultChecked,
  checked,
  onChange,
  label,
  description,
}: {
  name?: string;
  defaultChecked?: boolean;
  checked?: boolean;
  onChange?: (next: boolean) => void;
  label: ReactNode;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 py-1">
      <span className="min-w-0">
        <span className="t-body block text-[var(--text-primary)]">{label}</span>
        {description ? (
          <span className="t-footnote block text-[var(--text-secondary)]">{description}</span>
        ) : null}
      </span>
      <span className="relative inline-flex shrink-0">
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden
          className="block h-[31px] w-[51px] rounded-full bg-[var(--surface-3)] transition-colors duration-200 peer-checked:bg-[var(--accent)] peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--accent)] peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-[var(--surface-0)]"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute top-[2px] left-[2px] h-[27px] w-[27px] rounded-full bg-[var(--surface-0)] shadow-[0_3px_8px_rgba(0,0,0,0.35)] transition-transform duration-200 ease-[cubic-bezier(0.34,1.4,0.64,1)] peer-checked:translate-x-[20px]"
        />
      </span>
    </label>
  );
}

/**
 * A native <select> wearing Apple clothing: the platform dropdown arrow is
 * replaced with a quiet chevron, but the control underneath stays native, so
 * keyboard, VoiceOver and the iOS picker wheel all still work.
 */
export function SelectField({
  className = "",
  chevronClass = "text-[var(--text-muted)]",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { chevronClass?: string }) {
  return (
    <span className="relative inline-flex min-w-0 items-center">
      <select {...props} className={`w-full appearance-none pr-6 ${className}`}>
        {children}
      </select>
      <span
        aria-hidden
        className={`pointer-events-none absolute right-2 text-[10px] leading-none ${chevronClass}`}
      >
        ⌄
      </span>
    </span>
  );
}
