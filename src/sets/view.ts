// Icon set "view": grid, list — Lucide 1.61.0 icons "layout-grid", "list" (ISC, see LICENSE-lucide). Coordinates below
// are Lucide's; lucideLine / lucideArc scale them into our icon box.
// Six pieces — list's three dots and three lines, top to bottom:
//   pieces 1, 3: the left squares | the top and bottom dot — each square shrinks into its dot
//   pieces 4, 6: the right squares | the top and bottom line — each square is pressed flat onto its line
//   pieces 2, 5: nothing in grid (a single point) | the middle dot and line — the line is drawn in like a pen
import type { IconSet, PieceSet, Stroke } from '../types.ts';
import { LUCIDE_STROKE_WIDTH, lucideArc, lucideLine, lucidePoint } from './lucide.ts';

/** A layout-grid square (7 × 7, corner radius 1) from its top left corner's position, clockwise from the top edge. */
const square = (left: number, top: number): Stroke[] => {
  const right = left + 7, bottom = top + 7;
  return [
    lucideLine(left + 1, top, right - 1, top),
    lucideArc(right - 1, top + 1, 1, -90, 0),
    lucideLine(right, top + 1, right, bottom - 1),
    lucideArc(right - 1, bottom - 1, 1, 0, 90),
    lucideLine(right - 1, bottom, left + 1, bottom),
    lucideArc(left + 1, bottom - 1, 1, 90, 180),
    lucideLine(left, bottom - 1, left, top + 1),
    lucideArc(left + 1, top + 1, 1, 180, 270),
  ];
};
const dot = (y: number): Stroke[] => [lucideLine(3, y, 3.01, y)];
const listLine = (y: number): Stroke[] => [lucideLine(8, y, 21, y)];

const piece = (grid: Stroke[], list: Stroke[], pairLayouts: PieceSet['pairLayouts'] = {}): PieceSet =>
  ({ strokes: { grid, list }, alternativeStrokes: {}, pairLayouts });
const FLATTENED = { list: { grid: { flatten: true } } };

const [topDot, ...otherPieces] = [
  piece(square(3, 3), dot(5)),
  piece(lucidePoint(3, 12), dot(12)),
  piece(square(3, 14), dot(19)),
  piece(square(14, 3), listLine(5), FLATTENED),
  piece(lucidePoint(8, 12), listLine(12), { grid: { list: { draw: true } } }),
  piece(square(14, 14), listLine(19), FLATTENED),
];

export const iconsView: IconSet = {
  segmentCount: 8,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...topDot,
  morePieces: otherPieces,
  spins: {},
};
