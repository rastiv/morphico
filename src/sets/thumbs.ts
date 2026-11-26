// Icon set "thumbs": up, down — Lucide 1.61.0 icons "thumbs-up", "thumbs-down" (ISC, see LICENSE-lucide). Coordinates
// below are Lucide's; lucideLine / lucideArc scale them into our icon box.
// Lucide's thumbs-down is exactly thumbs-up turned 180°, drawn in the same order: up ↔ down is a pure spin (the hand
// turns over). Piece 1: the hand, from the thumb's lower edge; piece 2: the cuff line.
import type { IconSet, PieceSet, Point, Stroke } from '../types.ts';
import { LUCIDE_STROKE_WIDTH, lucideArc, lucideLine } from './lucide.ts';

const HAND_UP: Stroke[] = [
  lucideLine(15, 5.88, 14, 10),
  lucideLine(14, 10, 19.83, 10),
  lucideArc(19.83, 12, 2, -90, 16.2602),
  lucideLine(21.75, 12.56, 19.42, 20.56),
  lucideArc(17.5, 20, 2, 16.2602, 90),
  lucideLine(17.5, 22, 4, 22),
  lucideArc(4, 20, 2, 90, 180),
  lucideLine(2, 20, 2, 12),
  lucideArc(4, 12, 2, 180, 270),
  lucideLine(4, 10, 6.76, 10),
  lucideArc(6.7589, 8, 2, 89.9696, 26.4233),
  lucideLine(8.55, 8.89, 12, 2),
  lucideArc(11.9612, 5.1298, 3.13, -89.2905, 13.8684),
];
const HAND_DOWN: Stroke[] = [
  lucideLine(9, 18.12, 10, 14),
  lucideLine(10, 14, 4.17, 14),
  lucideArc(4.17, 12, 2, 90, 196.2602),
  lucideLine(2.25, 11.44, 4.58, 3.44),
  lucideArc(6.5, 4, 2, -163.7398, -90),
  lucideLine(6.5, 2, 20, 2),
  lucideArc(20, 4, 2, -90, 0),
  lucideLine(22, 4, 22, 12),
  lucideArc(20, 12, 2, 0, 90),
  lucideLine(20, 14, 17.24, 14),
  lucideArc(17.2411, 16, 2, -90.0304, -153.5767),
  lucideLine(15.45, 15.11, 12, 22),
  lucideArc(12.0388, 18.8702, 3.13, 90.7095, 193.8684),
];

const cuff = (from: Point, to: Point): Stroke[] => [lucideLine(...from, ...to)];

const hand: PieceSet = {
  strokes: { up: HAND_UP, down: HAND_DOWN },
  alternativeStrokes: {},
  pairLayouts: {},
};
const cuffPiece: PieceSet = {
  strokes: { up: cuff([7, 10], [7, 22]), down: cuff([17, 14], [17, 2]) },
  alternativeStrokes: {},
  pairLayouts: {},
};

export const iconsThumbs: IconSet = {
  // 13 strokes, two of the arcs over 90° (2 segments each)
  segmentCount: 16,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...hand,
  morePieces: [cuffPiece],
  spins: { up: { down: 180 }, down: { up: -180 } },
};
