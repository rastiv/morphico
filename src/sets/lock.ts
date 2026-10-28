// Icon set "lock": locked, unlocked — Lucide 1.61.0 icons "lock", "lock-open" (ISC, see LICENSE-lucide).
// Coordinates below are Lucide's; lucideLine / lucideArc scale them into our icon box.
// Two pieces:
//   piece 1: the body (a rounded square) — the same in both states.
//   piece 2: the shackle — left leg, arch, right leg; lock-open's arch stops short of the right leg (a little before
//     its top), so locked → unlocked pulls the right leg up into the arch and the arch back to where it ends.
import type { IconSet, PieceSet } from '../types.ts';
import { LUCIDE_STROKE_WIDTH, lucideArc, lucideLine } from './lucide.ts';

const BODY = [
  lucideLine(5, 11, 19, 11),
  lucideArc(19, 13, 2, -90, 0),
  lucideLine(21, 13, 21, 20),
  lucideArc(19, 20, 2, 0, 90),
  lucideLine(19, 22, 5, 22),
  lucideArc(5, 20, 2, 90, 180),
  lucideLine(3, 20, 3, 13),
  lucideArc(5, 13, 2, 180, 270),
];
const LEFT_LEG = lucideLine(7, 11, 7, 7);

const body: PieceSet = { strokes: { locked: BODY, unlocked: BODY }, alternativeStrokes: {}, pairLayouts: {} };
// left leg 2 segments, arch 6, right leg 4 — unlocked has no right leg: 4 zero-length segments at the arch's end
const shackle: PieceSet = {
  strokes: {
    locked: [LEFT_LEG, lucideArc(12, 7, 5, 180, 360), lucideLine(17, 7, 17, 11)],
    unlocked: [LEFT_LEG, lucideArc(12, 6.995, 5, 179.9424, 348.5218)],
  },
  alternativeStrokes: {},
  pairLayouts: {
    locked: { unlocked: { breakpoints: [0, 0.5, 1, 1.1667, 1.3333, 1.5, 1.6667, 1.8333, 2, 2.25, 2.5, 2.75, 3] } },
    unlocked: { locked: { breakpoints: [0, 0.5, 1, 1.1667, 1.3333, 1.5, 1.6667, 1.8333, 2, 2, 2, 2, 2] } },
  },
};

export const lockIcons: IconSet = {
  segmentCount: 12,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...body,
  morePieces: [shackle],
  spins: {},
};
