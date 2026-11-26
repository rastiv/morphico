// Icon set "align": left, center, right, justify — Lucide 1.61.0 icons "align-left", "align-center", "align-right",
// "align-justify" (ISC, see LICENSE-lucide). Coordinates below are Lucide's; lucideLine scales them into our icon box.
// Three pieces, one line each (top, middle, bottom), all drawn left → right (Lucide draws most of them the other way):
// the lines slide and stretch.
import type { IconSet, PieceSet, Stroke } from '../types.ts';
import { LUCIDE_STROKE_WIDTH, lucideLine } from './lucide.ts';

const row = (y: number, ends: Record<string, [number, number]>): PieceSet => ({
  strokes: Object.fromEntries(Object.entries(ends).map(([state, [fromX, toX]]): [string, Stroke[]] => [state, [lucideLine(fromX, y, toX, y)]])),
  alternativeStrokes: {},
  pairLayouts: {},
});

const [top, ...otherRows] = [
  row(5, { left: [3, 21], center: [3, 21], right: [3, 21], justify: [3, 21] }),
  row(12, { left: [3, 15], center: [7, 17], right: [9, 21], justify: [3, 21] }),
  row(19, { left: [3, 17], center: [5, 19], right: [7, 21], justify: [3, 21] }),
];

export const iconsAlign: IconSet = {
  segmentCount: 1,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...top,
  morePieces: otherRows,
  spins: {},
};
