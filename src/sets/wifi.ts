// Icon set "wifi": none, low, medium, high — Lucide 1.61.0 icons "wifi-zero", "wifi-low", "wifi-high", "wifi"
// (ISC, see LICENSE-lucide). Coordinates below are Lucide's; lucideLine / lucideArc scale them into our icon box.
// Four pieces: the dot (the same in every state) and the three arcs around it, small to big. A missing arc rests on
// the outermost arc there is (drawn on top of it, so it doesn't show) or, without arcs, as a point on the dot: arcs
// ripple out from the dot / from the arc inside them, and back in.
import type { IconSet, PieceSet, Stroke } from '../types.ts';
import { LUCIDE_STROKE_WIDTH, lucideArc, lucideLine, lucidePoint } from './lucide.ts';

const STATES = ['none', 'low', 'medium', 'high'];
const DOT = [lucideLine(12, 20, 12.01, 20)];
/** The arcs, small to big, each clockwise from its left end. */
const ARCS = [
  [lucideArc(12, 19.9997, 5, -134.427, -45.573)],
  [lucideArc(12, 20.0004, 10, -134.427, -45.573)],
  [lucideArc(12, 20.0003, 15, -131.8103, -48.1897)],
];
const NO_ARC = lucidePoint(12, 20);

/** Arc `arcIndex` in each state: itself, else the outermost arc that state has (or a point on the dot). */
const arcPiece = (arcIndex: number): PieceSet => ({
  strokes: Object.fromEntries(STATES.map((state, level): [string, Stroke[]] =>
    [state, level > arcIndex ? ARCS[arcIndex] : level > 0 ? ARCS[level - 1] : NO_ARC])),
  alternativeStrokes: {},
  pairLayouts: {},
});

export const wifiIcons: IconSet = {
  segmentCount: 4,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  strokes: Object.fromEntries(STATES.map((state) => [state, DOT])),
  alternativeStrokes: {},
  pairLayouts: {},
  morePieces: [0, 1, 2].map(arcPiece),
  spins: {},
};
