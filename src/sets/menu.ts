// Icon set "menu": menu (☰), close (✕), back (←) — Lucide 1.61.0 icons "menu", "x", "arrow-left" (ISC, see
// LICENSE-lucide), imported with `node tools/import-lucide.ts menu x arrow-left`. Coordinates below are Lucide's;
// fromLucide scales them into our icon box (more margin, like the digits — see lucide.ts).
// Three pieces, each one straight line, lined up so the lines of every state correspond:
//   piece 1: top line      | "\" of the ✕           | upper half of the arrowhead
//   piece 2: middle line   | hidden on the ✕'s centre | the arrow's shaft
//   piece 3: bottom line   | "/" of the ✕           | lower half of the arrowhead
// Lucide draws the arrowhead as one bent line; two lines meeting with round ends look the same.
// Every line runs from left to right, so lines move without turning over.
import { line } from '../geometry.ts';
import type { IconSet, PieceSet, Point, Stroke } from '../types.ts';
import { fromLucide, LUCIDE_STROKE_WIDTH } from './lucide.ts';

/** A straight line between two Lucide points, moved into our icon box. */
const lucideLine = (from: Point, to: Point): Stroke[] => [line(...fromLucide(from), ...fromLucide(to))];

const piece = (strokes: Record<string, Stroke[]>, extras: Pick<PieceSet, 'alternativeStrokes' | 'pairLayouts'> = { alternativeStrokes: {}, pairLayouts: {} }) =>
  ({ strokes, ...extras });

// close ↔ back: the ✕ drawn with its lines swapped ("/" in piece 1, "\" in piece 3), so each line only shortens
// and tilts into its half of the arrowhead instead of turning over
const BACKSLASH = lucideLine([6, 6], [18, 18]);
const SLASH = lucideLine([6, 18], [18, 6]);

export const menuIcons: IconSet = {
  segmentCount: 1,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...piece({
    menu: lucideLine([4, 5], [20, 5]),
    close: BACKSLASH,
    back: lucideLine([5, 12], [12, 5]),
  }, { alternativeStrokes: { 'close-swapped': SLASH }, pairLayouts: { close: { back: { tracing: 'close-swapped', breakpoints: [0, 1] } } } }),
  morePieces: [
    piece({
      menu: lucideLine([4, 12], [20, 12]),
      // a tiny line on the centre of the ✕'s "\": hidden under it
      close: lucideLine([11.5, 11.5], [12.5, 12.5]),
      back: lucideLine([5, 12], [19, 12]),
    }),
    piece({
      menu: lucideLine([4, 19], [20, 19]),
      close: SLASH,
      back: lucideLine([5, 12], [12, 19]),
    }, { alternativeStrokes: { 'close-swapped': BACKSLASH }, pairLayouts: { close: { back: { tracing: 'close-swapped', breakpoints: [0, 1] } } } }),
  ],
  spins: {},
};
