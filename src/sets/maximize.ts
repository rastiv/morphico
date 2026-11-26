// Icon set "maximize": maximize, minimize — Lucide 1.61.0 icons "maximize-2", "minimize-2" (ISC, see LICENSE-lucide).
// Coordinates below are Lucide's; lucideLine scales them into our icon box.
// Four pieces: the top right corner, its diagonal, the bottom left diagonal, the bottom left corner. The diagonals stay;
// each corner slides along its diagonal and turns over (maximize's corners point out, minimize's in): its tip moves
// from the box corner to the diagonal's inner end, its arms swing round (flat half-way).
import type { IconSet, PieceSet, Stroke } from '../types.ts';
import { LUCIDE_STROKE_WIDTH, lucideLine } from './lucide.ts';

/** A corner: arm end → tip → other arm end. */
const corner = (start: [number, number], tip: [number, number], end: [number, number]): Stroke[] =>
  [lucideLine(...start, ...tip), lucideLine(...tip, ...end)];
const piece = (maximize: Stroke[], minimize: Stroke[]): PieceSet =>
  ({ strokes: { maximize, minimize }, alternativeStrokes: {}, pairLayouts: {} });

const TOP_RIGHT_DIAGONAL = [lucideLine(21, 3, 14, 10)];
const BOTTOM_LEFT_DIAGONAL = [lucideLine(3, 21, 10, 14)];

const [topRightCorner, ...otherPieces] = [
  // arm ends paired with the nearest ones of minimize's corner (drawn the other way round)
  piece(corner([15, 3], [21, 3], [21, 9]), corner([14, 4], [14, 10], [20, 10])),
  piece(TOP_RIGHT_DIAGONAL, TOP_RIGHT_DIAGONAL),
  piece(BOTTOM_LEFT_DIAGONAL, BOTTOM_LEFT_DIAGONAL),
  piece(corner([9, 21], [3, 21], [3, 15]), corner([10, 20], [10, 14], [4, 14])),
];

export const iconsMaximize: IconSet = {
  segmentCount: 2,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...topRightCorner,
  morePieces: otherPieces,
  spins: {},
};
