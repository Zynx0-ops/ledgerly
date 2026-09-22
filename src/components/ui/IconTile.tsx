import { seriesVar } from "@/lib/palette";

/**
 * The rounded-square icon tile from Settings.app — the single most recognizable
 * piece of Apple list design. The tint carries the category's stored color, so
 * identity is consistent with every chart.
 */
export function IconTile({
  glyph,
  colorSlot,
  size = 30,
  tone = "tint",
}: {
  glyph: string;
  colorSlot?: number | null;
  size?: number;
  tone?: "tint" | "solid" | "neutral";
}) {
  const color = colorSlot ? seriesVar(colorSlot) : "var(--text-muted)";

  const background =
    tone === "solid"
      ? color
      : tone === "neutral"
        ? "var(--surface-2)"
        : `color-mix(in srgb, ${color} 18%, transparent)`;

  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.29, // tracks Apple's continuous-corner proportion
        background,
        fontSize: size * 0.5,
        lineHeight: 1,
      }}
    >
      {glyph}
    </span>
  );
}
