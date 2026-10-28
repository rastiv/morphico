// Shared by every Lucide-based icon set: Lucide draws in y 3…21 (18 units) with a 2-unit line; our icons get the
// same room as the digits (16 units, y 4…20; user's choice 2026-10-26), so every icon is scaled around the centre
// 12,12 — line width included, so each icon looks exactly like Lucide's, only with more margin in its box.
import { arc, cubic, line } from '../geometry.ts';
import type { Point, Stroke } from '../types.ts';

export const LUCIDE_SCALE = 16 / 18;

/** Lucide's 2-unit line, scaled with the icon. */
export const LUCIDE_STROKE_WIDTH = 2 * LUCIDE_SCALE;

/** A point (or corner) of a Lucide icon moved into our icon box. */
export const fromLucide = ([x, y]: Point): Point => [12 + (x - 12) * LUCIDE_SCALE, 12 + (y - 12) * LUCIDE_SCALE];

/** A length of a Lucide icon (e.g. a corner radius) in our icon box. */
export const lucideLength = (length: number): number => length * LUCIDE_SCALE;

// Strokes written in Lucide coordinates (for the icon sets added from 2026-10-28 on).
/** A straight line between two Lucide points. */
export const lucideLine = (fromX: number, fromY: number, toX: number, toY: number): Stroke =>
  line(...fromLucide([fromX, fromY]), ...fromLucide([toX, toY]));
/** A circular arc in Lucide coordinates (angles in degrees, `endAngle > startAngle` = clockwise on screen). */
export const lucideArc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number): Stroke =>
  arc(...fromLucide([centerX, centerY]), lucideLength(radius), startAngle, endAngle);
/** A cubic Bézier curve in Lucide coordinates. */
export const lucideCubic = (...coordinates: [number, number, number, number, number, number, number, number]): Stroke => {
  const [startX, startY, control1X, control1Y, control2X, control2Y, endX, endY] = coordinates;
  return cubic(
    ...fromLucide([startX, startY]), ...fromLucide([control1X, control1Y]),
    ...fromLucide([control2X, control2Y]), ...fromLucide([endX, endY]),
  );
};
/** A missing piece at rest: a single point, never drawn (see toPathData). */
export const lucidePoint = (x: number, y: number): Stroke[] => [lucideLine(x, y, x, y)];
/** The diagonal slash of Lucide's "-off" icons, from the top left. */
export const LUCIDE_SLASH = [lucideLine(2, 2, 22, 22)];
