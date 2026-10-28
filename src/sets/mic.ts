// Icon set "mic": on, off — Lucide 1.61.0 icons "mic", "mic-off" (ISC, see LICENSE-lucide).
// Coordinates below are Lucide's; lucideLine / lucideArc scale them into our icon box.
// Six pieces (like "eye"):
//   piece 1: the stand — the same in both states.
//   pieces 2–3: the capsule's top and bottom part — mic-off cuts the capsule where its slash crosses it (left side
//     near the top, right side near the bottom); the mic's closed capsule is split in those gaps.
//   pieces 4–5: the holder's left/bottom part and its right stub — cut on the lower right, split in that gap.
//   piece 6: the slash | nothing — drawn like a pen from the top left.
// on → off pulls the ends back from the gaps while the slash is drawn.
import type { IconSet, PieceSet } from '../types.ts';
import { LUCIDE_SLASH, LUCIDE_STROKE_WIDTH, lucideArc, lucideLine, lucidePoint } from './lucide.ts';

const STAND = [lucideLine(12, 19, 12, 22)];
/** Where the mic's capsule is split: the middles of mic-off's gaps (right side y 11.85, left side y 6.3). */
const RIGHT_SPLIT_Y = 11.85;
const LEFT_SPLIT_Y = 6.3;
/** Where the holder is split: the middle of its gap (10.17° … 45°). */
const HOLDER_GAP_MIDDLE = (10.1709 + 44.9971) / 2;

const stand: PieceSet = { strokes: { on: STAND, off: STAND }, alternativeStrokes: {}, pairLayouts: {} };
// line, arc, line — 3 + 6 + 3 segments; off has no last line: 3 zero-length segments at its end
const SPLIT_LAYOUT = { breakpoints: [0, 0.3333, 0.6667, 1, 1.1667, 1.3333, 1.5, 1.6667, 1.8333, 2, 2.3333, 2.6667, 3] };
const CUT_LAYOUT = { breakpoints: [0, 0.3333, 0.6667, 1, 1.1667, 1.3333, 1.5, 1.6667, 1.8333, 2, 2, 2, 2] };
const capsuleTop: PieceSet = {
  strokes: {
    // up the right side, over the top (counterclockwise), down the left side to the split
    on: [lucideLine(15, RIGHT_SPLIT_Y, 15, 5), lucideArc(12, 5, 3, 0, -180), lucideLine(9, 5, 9, LEFT_SPLIT_Y)],
    off: [lucideLine(15, 9.34, 15, 5), lucideArc(12.0001, 5.0181, 3, -0.3452, -153.2975)],
  },
  alternativeStrokes: {},
  pairLayouts: { on: { off: SPLIT_LAYOUT }, off: { on: CUT_LAYOUT } },
};
const capsuleBottom: PieceSet = {
  strokes: {
    // down the left side, around the bottom (counterclockwise), up the right side to the split
    on: [lucideLine(9, LEFT_SPLIT_Y, 9, 12), lucideArc(12, 12, 3, 180, 0), lucideLine(15, 12, 15, RIGHT_SPLIT_Y)],
    off: [lucideLine(9, 9, 9, 12), lucideArc(12, 11.9974, 3, 179.9496, 45.0356)],
  },
  alternativeStrokes: {},
  pairLayouts: { on: { off: SPLIT_LAYOUT }, off: { on: CUT_LAYOUT } },
};
// arc then line, 6 + 6 segments in both states (the arc only shortens)
const HOLDER_LAYOUT = { breakpoints: [0, 0.1667, 0.3333, 0.5, 0.6667, 0.8333, 1, 1.1667, 1.3333, 1.5, 1.6667, 1.8333, 2] };
const holderLeft: PieceSet = {
  strokes: {
    on: [lucideArc(12, 12, 7, HOLDER_GAP_MIDDLE, 180), lucideLine(5, 12, 5, 10)],
    off: [lucideArc(12, 12.0005, 7, 44.9971, 180.0041), lucideLine(5, 12, 5, 10)],
  },
  alternativeStrokes: {},
  pairLayouts: { on: { off: HOLDER_LAYOUT }, off: { on: HOLDER_LAYOUT } },
};
const holderRight: PieceSet = {
  strokes: {
    on: [lucideArc(12, 12, 7, HOLDER_GAP_MIDDLE, 0), lucideLine(19, 12, 19, 10)],
    off: [lucideArc(12, 11.9939, 7, 10.1709, 0.0499), lucideLine(19, 12, 19, 10)],
  },
  alternativeStrokes: {},
  pairLayouts: { on: { off: HOLDER_LAYOUT }, off: { on: HOLDER_LAYOUT } },
};
const slash: PieceSet = {
  strokes: { on: lucidePoint(2, 2), off: LUCIDE_SLASH },
  alternativeStrokes: {},
  pairLayouts: { on: { off: { draw: true } } },
};

export const micIcons: IconSet = {
  segmentCount: 12,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...stand,
  morePieces: [capsuleTop, capsuleBottom, holderLeft, holderRight, slash],
  spins: {},
};
