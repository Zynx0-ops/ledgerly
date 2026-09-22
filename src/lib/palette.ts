/**
 * Categorical color is assigned to a *category* and stored with it, so a hue
 * follows the entity forever — filtering the chart never repaints the survivors,
 * and "groceries is aqua" stays true across every screen.
 *
 * Slots are 1–8, in a fixed validated order (never cycled, never generated).
 * A ninth series folds into "Other" rather than inventing a hue.
 */
export const SERIES_SLOTS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export type SeriesSlot = (typeof SERIES_SLOTS)[number];

export const MAX_SERIES = 7; // the 8th visual slot is reserved for "Other"
export const OTHER_SLOT: SeriesSlot = 8;

/** Charts reference the CSS custom property, so dark mode swaps without JS. */
export function seriesVar(slot: number): string {
  const s = ((Math.abs(Math.trunc(slot)) - 1) % 8) + 1;
  return `var(--series-${s})`;
}

export const SERIES_NAMES: Record<SeriesSlot, string> = {
  1: "Blue",
  2: "Orange",
  3: "Aqua",
  4: "Yellow",
  5: "Magenta",
  6: "Green",
  7: "Violet",
  8: "Red",
};

/** Light-mode hexes, for the color picker swatches only. Charts use seriesVar(). */
export const SERIES_HEX: Record<SeriesSlot, string> = {
  1: "#2a78d6",
  2: "#eb6834",
  3: "#1baf7a",
  4: "#eda100",
  5: "#e87ba4",
  6: "#008300",
  7: "#4a3aa7",
  8: "#e34948",
};
