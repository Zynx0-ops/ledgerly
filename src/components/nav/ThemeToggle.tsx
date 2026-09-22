"use client";

import { useSyncExternalStore } from "react";

type Theme = "light" | "dark" | "system";

const KEY = "ledgerly-theme";
const CHANGED = "ledgerly-theme-change";

/**
 * The stored theme is external state, not React state — an inline script in the
 * document head already applied it before first paint. Subscribing to it with
 * useSyncExternalStore keeps the button in sync (including across tabs) without
 * a render-then-correct flash.
 */
function subscribe(onChange: () => void) {
  window.addEventListener(CHANGED, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGED, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function readTheme(): Theme {
  try {
    return (localStorage.getItem(KEY) as Theme | null) ?? "system";
  } catch {
    // Private mode or blocked storage — the page still renders correctly.
    return "system";
  }
}

const serverTheme = (): Theme => "system";

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);

  function apply(next: Theme) {
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* ignore — the DOM change below still takes effect for this session */
    }
    const root = document.documentElement;
    if (next === "system") root.removeAttribute("data-theme");
    else root.setAttribute("data-theme", next);
    window.dispatchEvent(new Event(CHANGED));
  }

  const next: Theme = theme === "dark" ? "light" : theme === "light" ? "system" : "dark";
  const icon = theme === "dark" ? "☾" : theme === "light" ? "☀" : "◐";

  return (
    <button
      type="button"
      onClick={() => apply(next)}
      title={`Theme: ${theme} — click for ${next}`}
      aria-label={`Theme: ${theme}. Switch to ${next}.`}
      className="grid h-7 w-7 place-items-center rounded-[var(--radius-sm)] text-[13px] text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)]"
    >
      <span aria-hidden>{icon}</span>
    </button>
  );
}
