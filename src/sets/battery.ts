// Icon set "battery": empty, low, medium, full — Lucide 1.61.0 icons "battery", "battery-low", "battery-medium",
// "battery-full" (ISC, see LICENSE-lucide). Coordinates below are Lucide's; lucideLine / lucideArc scale them into
// our icon box.
// Five pieces: the body and the terminal (the same in every state) and the three bars, left to right. A missing bar
// is a point at its bottom; bars are drawn in like a pen from the bottom up, one after the other when several come
// (and erased the other way round).
import type { IconSet, PairLayout, PieceSet } from '../types.ts';
import { LUCIDE_STROKE_WIDTH, lucideArc, lucideLine, lucidePoint } from './lucide.ts';

const STATES = ['empty', 'low', 'medium', 'full'];
const BODY = [
  lucideLine(4, 6, 16, 6),
  lucideArc(16, 8, 2, -90, 0),
  lucideLine(18, 8, 18, 16),
  lucideArc(16, 16, 2, 0, 90),
  lucideLine(16, 18, 4, 18),
  lucideArc(4, 16, 2, 90, 180),
  lucideLine(2, 16, 2, 8),
  lucideArc(4, 8, 2, 180, 270),
];
const TERMINAL = [lucideLine(22, 14, 22, 10)];
const BAR_X = [6, 10, 14];

/**
 * When bar `barIndex` is drawn in from `fromLevel` to `toLevel` (more bars): the bars coming in share the morph,
 * each taking 2 / (count + 1) of it, starting half of that after the one before.
 */
const barDrawn = (barIndex: number, fromLevel: number, toLevel: number): PairLayout => {
  const count = toLevel - fromLevel;
  const duration = 2 / (count + 1);
  const start = (barIndex - fromLevel) * (duration / 2);
  return { draw: [+start.toFixed(4), +(start + duration).toFixed(4)] };
};
const barPiece = (barIndex: number): PieceSet => ({
  strokes: Object.fromEntries(STATES.map((state, level) => [state, level > barIndex
    ? [lucideLine(BAR_X[barIndex], 14, BAR_X[barIndex], 10)]
    : lucidePoint(BAR_X[barIndex], 14)])),
  alternativeStrokes: {},
  // on the state without the bar, towards each state with it
  pairLayouts: Object.fromEntries(STATES.slice(0, barIndex + 1).map((state, fromLevel) => [state, Object.fromEntries(
    STATES.slice(barIndex + 1).map((other, offset) => [other, barDrawn(barIndex, fromLevel, barIndex + 1 + offset)]))])),
});
const fixedPiece = (strokes: typeof BODY): PieceSet => ({
  strokes: Object.fromEntries(STATES.map((state) => [state, strokes])),
  alternativeStrokes: {},
  pairLayouts: {},
});

export const batteryIcons: IconSet = {
  segmentCount: 12,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...fixedPiece(BODY),
  morePieces: [fixedPiece(TERMINAL), ...[0, 1, 2].map(barPiece)],
  spins: {},
};
