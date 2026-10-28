// Icon set "toggle": plus, minus, close, check — Lucide 1.61.0 icons "plus", "minus", "x", "check" (ISC, see
// LICENSE-lucide). Coordinates below are Lucide's; lucideLine scales them into our icon box.
// Two pieces, each one straight line (Lucide's check = two lines meeting with round ends, which looks the same):
//   piece 1: plus's —  | minus | close's "\" | check's short stroke (left → right)
//   piece 2: plus's |  | lies down onto minus | close's "/" | check's long stroke (from its top right end)
// plus ↔ close turns by 45° (plus turned is a slightly smaller ✕); close → check folds the ✕ into the check.
import type { IconSet, PieceSet, Stroke } from '../types.ts';
import { LUCIDE_STROKE_WIDTH, lucideLine } from './lucide.ts';

const HORIZONTAL: Stroke[] = [lucideLine(5, 12, 19, 12)];

const first: PieceSet = {
  strokes: {
    plus: HORIZONTAL,
    minus: HORIZONTAL,
    close: [lucideLine(6, 6, 18, 18)],
    check: [lucideLine(4, 12, 9, 17)],
  },
  alternativeStrokes: {},
  pairLayouts: {},
};
const second: PieceSet = {
  strokes: {
    plus: [lucideLine(12, 5, 12, 19)],
    minus: HORIZONTAL,
    close: [lucideLine(18, 6, 6, 18)],
    check: [lucideLine(20, 6, 9, 17)],
  },
  alternativeStrokes: {},
  pairLayouts: {},
};

export const toggleIcons: IconSet = {
  segmentCount: 1,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...first,
  morePieces: [second],
  // plus turned by 45° clockwise is the ✕ (a little smaller): turn while blending
  spins: { plus: { close: 45 }, close: { plus: -45 } },
};
