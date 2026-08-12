/**
 * How a chart mark is painted.
 *
 * A flat fill is legible but inert. These give every mark the same two cues —
 * a light-source sheen along the leading edge and a soft coloured bloom under
 * it — so bars read as objects sitting on the surface rather than as holes cut
 * out of it. That is nearly all of the difference between a plain chart and an
 * expensive-looking one, and none of it changes what the chart says: the hue
 * and the length are untouched, only the shading.
 *
 * `color-mix` does the work in oklab, so a mid-blue and a pale periwinkle get
 * the same *perceptual* lift instead of the pale one blowing out to white.
 */

/** Vertical bars: lit from the top. */
export function markFillY(color: string): string {
  return (
    `linear-gradient(180deg,` +
    ` color-mix(in oklab, ${color} 84%, #ffffff) 0%,` +
    ` ${color} 42%,` +
    ` color-mix(in oklab, ${color} 88%, #000000) 100%)`
  );
}

/** Horizontal bars: lit from the left. */
export function markFillX(color: string): string {
  return (
    `linear-gradient(90deg,` +
    ` color-mix(in oklab, ${color} 88%, #ffffff) 0%,` +
    ` ${color} 55%,` +
    ` color-mix(in oklab, ${color} 90%, #000000) 100%)`
  );
}

/**
 * The bloom. Kept under the mark rather than around it — a symmetric glow makes
 * a bar look blurred, an offset one makes it look raised.
 */
export function markGlow(color: string, strength = 1): string {
  const ring = 26 * strength;
  const bloom = 45 * strength;
  return (
    `0 0 0 1px color-mix(in oklab, ${color} ${ring}%, transparent),` +
    ` 0 6px 18px -6px color-mix(in oklab, ${color} ${bloom}%, transparent)`
  );
}

/** A mark that is present but not the one being hovered. */
export function dimmed(color: string, amount = 68): string {
  return `color-mix(in oklab, ${color} ${100 - amount}%, #17181b)`;
}

/** The empty remainder of a track — the "of a possible N" a bar is measured in. */
export const TRACK = 'color-mix(in oklab, #ffffff 5%, transparent)';
