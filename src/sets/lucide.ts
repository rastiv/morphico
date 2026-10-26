// Shared by every Lucide-based icon set: Lucide draws in y 3…21 (18 units) with a 2-unit line; our icons get the
// same room as the digits (16 units, y 4…20; user's choice 2026-10-26), so every icon is scaled around the centre
// 12,12 — line width included, so each icon looks exactly like Lucide's, only with more margin in its box.
import type { Point } from '../types.ts';

export const LUCIDE_SCALE = 16 / 18;

/** Lucide's 2-unit line, scaled with the icon. */
export const LUCIDE_STROKE_WIDTH = 2 * LUCIDE_SCALE;

/** A point (or corner) of a Lucide icon moved into our icon box. */
export const fromLucide = ([x, y]: Point): Point => [12 + (x - 12) * LUCIDE_SCALE, 12 + (y - 12) * LUCIDE_SCALE];

/** A length of a Lucide icon (e.g. a corner radius) in our icon box. */
export const lucideLength = (length: number): number => length * LUCIDE_SCALE;
