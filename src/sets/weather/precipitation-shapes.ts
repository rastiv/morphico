// What falls: Lucide "cloud-lightning"'s bolt, "cloud-rain"'s and "cloud-sun-rain"'s lines, "cloud-snow"'s flakes
// (a little bigger), "cloud-drizzle"'s short lines — and when they are drawn during a morph.
import { reversedStroke } from '../../geometry/strokes.ts';
import type { Point, Stroke } from '../../types.ts';
import { lucideLine } from '../lucide.ts';

/** Lucide "cloud-lightning"'s bolt, from the top down. */
export const BOLT = [lucideLine(13, 12, 10, 17), lucideLine(10, 17, 14, 17), lucideLine(14, 17, 11, 22)];
/** cloudy → thunder: the bolt strikes in the second half of the morph. */
export const BOLT_DRAWN: [number, number] = [0.5, 0.85];
/** Lucide "cloud-rain"'s lines, left to right, each from the top down. */
export const HEAVY_RAIN_LINES = [lucideLine(8, 14, 8, 20), lucideLine(12, 16, 12, 22), lucideLine(16, 14, 16, 20)];
/** cloudy → rain: the lines are drawn one after the other. */
export const HEAVY_RAIN_DRAWN: [number, number][] = [[0.45, 0.8], [0.55, 0.9], [0.65, 1]]; // once the bottom has opened

/** Lucide "cloud-snow"'s flake centres for the pieces 11, 12, 14 (top flakes) and 15, 16, 17 (bottom flakes). */
export const SNOWFLAKE_CENTERS: Point[] = [[8, 15], [12, 17], [16, 15], [8, 19], [12, 21], [16, 19]];
/**
 * Lucide draws a flake as a dot (a tiny round-capped line, as wide as the line). Ours are a little bigger so they
 * show at small sizes (user's request): a tiny closed octagon of this radius, which the thick line fills in.
 */
export const SNOWFLAKE_RADIUS = 0.25;
export const SNOWFLAKES = SNOWFLAKE_CENTERS.map(([centerX, centerY]) => {
  // clockwise from the top corner
  const corners = Array.from({ length: 8 }, (_, index): Point => [
    centerX + SNOWFLAKE_RADIUS * Math.cos(((index - 2) * Math.PI) / 4),
    centerY + SNOWFLAKE_RADIUS * Math.sin(((index - 2) * Math.PI) / 4),
  ]);
  return corners.map((corner, index) => lucideLine(...corner, ...corners[(index + 1) % 8]));
});
// line → flake (rain / showers → snow): the line traced down and back up, its down pass ↔ the flake's right half, its
// up pass ↔ the left half — the line narrows into the flake (segment by segment the octagon's corners zigzag)
export const LINE_OUT_AND_BACK = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((index) => +(index / 6).toFixed(4));
export const FLAKE_IN_HALVES = { breakpoints: [0, 0.5, 1, 2, 3, 3.5, 4, 4.5, 5, 6, 7, 7.5, 8] };
export const outAndBack = (stroke: Stroke) => [stroke, reversedStroke(stroke)];
/** → snow / drizzle: when each flake / short line appears (row by row: 8,15 · 16,15 · 12,17 · 8,19 · 16,19 · 12,21). */
export const SNOWFLAKE_STARTS = [0.45, 0.59, 0.52, 0.66, 0.8, 0.73];
export const fallingDrawn = (flakeIndex: number) => ({ draw: [SNOWFLAKE_STARTS[flakeIndex], SNOWFLAKE_STARTS[flakeIndex] + 0.1] as [number, number] });
/** Lucide "cloud-drizzle"'s short lines (top down), in the order of the flakes (each one where a flake is). */
export const DRIZZLE_LINES = [[8, 14], [12, 16], [16, 14], [8, 19], [12, 21], [16, 19]]
  .map(([x, y]) => lucideLine(x, y, x, y + 1));
/** Lucide "cloud-sun-rain"'s rain lines, each from the top down. */
export const RAIN_LINES = [lucideLine(7, 19, 7, 21), lucideLine(11, 20, 11, 22)];
/** partly-cloudy → showers: the rain lines are drawn one after the other while the cloud opens. */
export const RAIN_DRAWN: [number, number][] = [[0.35, 0.75], [0.55, 0.95]];
