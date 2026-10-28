// Icon set "bell": on, off — Lucide 1.61.0 icons "bell", "bell-off" (ISC, see LICENSE-lucide).
// Coordinates below are Lucide's; lucideLine / lucideArc / lucideCubic scale them into our icon box.
// Four pieces (like "eye"):
//   piece 1: the clapper — the same in both states.
//   pieces 2–3: the body's left and right part — bell-off cuts the body where its slash crosses it (upper left on the
//     dome, and the bottom right: the end of the bottom line, the right tip, the right side's lower end); the bell's
//     closed outline is split in those gaps, so on → off pulls the ends back from them.
//   piece 4: the slash | nothing — drawn like a pen from the top left.
import type { IconSet, PieceSet } from '../types.ts';
import { LUCIDE_SLASH, LUCIDE_STROKE_WIDTH, lucideArc, lucideCubic, lucideLine, lucidePoint } from './lucide.ts';

const CLAPPER = [lucideArc(12, 19.9999, 2, 149.9971, 30.0029)];
/** Where the dome is split in "on": the middle of bell-off's gap on it (196.86° … 236.27°). */
const DOME_GAP_MIDDLE = (196.8632 + 236.2663) / 2;
const dome = (startAngle: number, endAngle: number) => lucideArc(12, 8, 6, startAngle, endAngle);

const clapper: PieceSet = { strokes: { on: CLAPPER, off: CLAPPER }, alternativeStrokes: {}, pairLayouts: {} };
// bottom line (3 segments), left tip (2), left side (4), dome (3) — the same in both states
const LEFT_LAYOUT = { breakpoints: [0, 0.3333, 0.6667, 1, 1.5, 2, 2.25, 2.5, 2.75, 3, 3.3333, 3.6667, 4] };
const leftPart: PieceSet = {
  strokes: {
    on: [
      lucideLine(20, 17, 4, 17),
      lucideArc(4.0007, 16, 1, 90.0419, 222.3766),
      lucideCubic(3.262, 15.326, 4.589, 13.956, 6, 12.499, 6, 8),
      dome(180, DOME_GAP_MIDDLE),
    ],
    off: [
      lucideLine(17, 17, 4, 17),
      lucideArc(3.9996, 16, 1, 89.9795, 222.299),
      lucideCubic(3.26, 15.327, 4.59, 13.956, 6, 12.499, 6, 8),
      lucideArc(12, 7.9985, 6, 179.9859, 196.8632),
    ],
  },
  alternativeStrokes: {},
  pairLayouts: { on: { off: LEFT_LAYOUT }, off: { on: LEFT_LAYOUT } },
};
// dome (4 segments), right side (6), right tip (2) — off has no tip and only the side's upper part: 2 zero-length
// segments at its end
const rightPart: PieceSet = {
  strokes: {
    on: [
      dome(DOME_GAP_MIDDLE, 360),
      lucideCubic(18, 8, 18, 12.499, 19.41, 13.956, 20.74, 15.327),
      lucideArc(20.0004, 16, 1, -42.299, 90.0205),
    ],
    off: [
      lucideArc(12, 7.9998, 6, -123.7337, 0.0022),
      lucideCubic(18, 8, 18, 10.687, 18.77, 12.653, 19.707, 14.05),
    ],
  },
  alternativeStrokes: {},
  pairLayouts: {
    on: { off: { breakpoints: [0, 0.25, 0.5, 0.75, 1, 1.1667, 1.3333, 1.5, 1.6667, 1.8333, 2, 2.5, 3] } },
    off: { on: { breakpoints: [0, 0.25, 0.5, 0.75, 1, 1.1667, 1.3333, 1.5, 1.6667, 1.8333, 2, 2, 2] } },
  },
};
const slash: PieceSet = {
  strokes: { on: lucidePoint(2, 2), off: LUCIDE_SLASH },
  alternativeStrokes: {},
  pairLayouts: { on: { off: { draw: true } } },
};

export const bellIcons: IconSet = {
  segmentCount: 12,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...clapper,
  morePieces: [leftPart, rightPart, slash],
  spins: {},
};
