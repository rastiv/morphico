// Icon set "copy": copy, copied — Lucide 1.61.0 icons "copy", "check" (ISC, see LICENSE-lucide).
// Coordinates below are Lucide's; lucideLine / lucideArc / lucideCubic scale them into our icon box.
// Two pieces:
//   piece 1: the front page | the check — the page folds along its diagonal into the check: its top left and bottom
//     right corners meet in the check's corner, its top right corner becomes the long stroke's end, its bottom left
//     the short stroke's end (the check traced as a loop: long stroke and back, short stroke and back).
//   piece 2: the back page | nothing — erased along its line in the first half.
import type { IconSet, PieceSet } from '../types.ts';
import { LUCIDE_STROKE_WIDTH, lucideArc, lucideCubic, lucideLine, lucidePoint } from './lucide.ts';

/** The front page, clockwise from its top edge. */
const FRONT_PAGE = [
  lucideLine(10, 8, 20, 8),
  lucideArc(20, 10, 2, -90, 0),
  lucideLine(22, 10, 22, 20),
  lucideArc(20, 20, 2, 0, 90),
  lucideLine(20, 22, 10, 22),
  lucideArc(10, 20, 2, 90, 180),
  lucideLine(8, 20, 8, 10),
  lucideArc(10, 10, 2, 180, 270),
];
/** The back page: the L that shows behind the front page, from its bottom end up and over. */
const BACK_PAGE = [
  lucideCubic(4, 16, 2.9, 16, 2, 15.1, 2, 14),
  lucideLine(2, 14, 2, 4),
  lucideCubic(2, 4, 2, 2.9, 2.9, 2, 4, 2),
  lucideLine(4, 2, 14, 2),
  lucideCubic(14, 2, 15.1, 2, 16, 2.9, 16, 4),
];
const CHECK = [lucideLine(20, 6, 9, 17), lucideLine(9, 17, 4, 12)];
/** The check as a loop matching the page: corner → long end → corner → short end → corner. */
const CHECK_LOOP = [lucideLine(9, 17, 20, 6), lucideLine(20, 6, 9, 17), lucideLine(9, 17, 4, 12), lucideLine(4, 12, 9, 17)];

const page: PieceSet = {
  strokes: { copy: FRONT_PAGE, copied: CHECK },
  alternativeStrokes: { 'check-loop': CHECK_LOOP },
  pairLayouts: {
    // the page's default spread: 2 segments per edge, 1 per corner; each edge → one stroke of the loop, each
    // corner → a zero-length segment at its end
    copied: { copy: { tracing: 'check-loop', breakpoints: [0, 0.5, 1, 1, 1.5, 2, 2, 2.5, 3, 3, 3.5, 4, 4] } },
  },
};
const backPage: PieceSet = {
  strokes: { copy: BACK_PAGE, copied: lucidePoint(4, 16) },
  alternativeStrokes: {},
  pairLayouts: { copied: { copy: { draw: 0.5 } } },
};

export const copyIcons: IconSet = {
  segmentCount: 12,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...page,
  morePieces: [backPage],
  spins: {},
};
