// How the round digits morph into each other: the pair layouts (start points, directions, breakpoints, tracings —
// the user's ideas, optimizer fits from tools/check.ts, confirmed pairs left untouched; see CLAUDE.md "Status: round")
// and the spins. The drawings themselves are in ../round.ts.
import type { IconSet } from '../../types.ts';

export const roundPairLayouts: IconSet['pairLayouts'] = {
  0: {
    // cut the 0 open at the upper left: the part going up over the top becomes the flag, the rest the stem
    1: { startSegment: 2, reversed: true },
    // start at the leftmost point and go up, like the 2's bowl
    2: { startSegment: 3, reversed: true },
    3: { startSegment: 3, reversed: true },
    // start at the lower right and go left: bottom → crossbar, left side → diagonal, right side → stem
    4: { startSegment: 7, reversed: true },
    // optimizer: start at the upper left and go clockwise, the same way round as the 5's bowl
    5: { startSegment: 2, reversed: true },
    // start at the leftmost point and go up: the top becomes the bar, the right side the diagonal
    7: { startSegment: 3, reversed: true },
    // start at the bottom and go clockwise, the same way round as the 9's circle
    9: { startSegment: 6, reversed: true },
  },
  1: {
    // as in the slim set: the stem stays the stem, the flag folds out into the 4's crossbar + diagonal
    // (7 segments on the flag, 5 on the stem — the 4's own split is 3 + 4 + 5)
    4: { breakpoints: [0, 1 / 7, 2 / 7, 3 / 7, 4 / 7, 5 / 7, 6 / 7, 1, 1.2, 1.4, 1.6, 1.8, 2] },
    // flag curls into the top loop, stem rounds into the bottom loop (optimizer fit)
    8: { breakpoints: [0, 0, 0, 1, 1.3125, 1.4583, 1.5208, 1.8333, 1.8333, 1.8333, 1.8333, 1.8333, 2] },
    // fewer segments for the 9's circle, more for its tail; the circle unrolls into flag + stem top (optimizer fit)
    9: { breakpoints: [0, 0, 0, 1, 1.1042, 1.4167, 1.4792, 1.5625, 1.625, 1.6875, 1.7708, 1.8125, 2] },
  },
  2: {
    // the 4's crossbar shrinks into the 2's starting tip, the diagonal and stem bend into the bowl (optimizer fit)
    4: { breakpoints: [0, 0, 0.3542, 0.6875, 0.7708, 1, 1.2083, 1.2292, 2, 2.7292, 2.7292, 2.7292, 3] },
    // bowl → the 5's bar and down-stroke, diagonal + base → its bowl (optimizer fit)
    5: { breakpoints: [0, 0.375, 0.375, 0.375, 0.625, 1, 1.0833, 1.0833, 1.1458, 1.4375, 1.7083, 2, 3] },
    // the bowl closes into the 9's circle (same circle), the base pulls back into the tail (optimizer fit)
    9: { breakpoints: [0, 0, 0, 0, 0.2083, 0.3958, 0.5833, 0.7708, 1, 1.2083, 1.3542, 2, 3] },
    // 2 → 6 spins (see spins): in the turning frame it is 2 → 9 — the 2's bowl is exactly the 9's circle
    6: { breakpoints: [0, 0, 0, 0, 0.2292, 0.4167, 0.6042, 0.7708, 1, 1.2083, 1.4167, 2, 3] },
  },
  3: {
    // the 4's crossbar shrinks into the 3's starting tip, the diagonal becomes the top arc (optimizer fit)
    4: { breakpoints: [0, 0, 0.3333, 0.6042, 0.7917, 1, 2, 2.1458, 2.3333, 2.5208, 2.5208, 2.6667, 3] },
    // the small top arc grows into the 9's circle, the lower bowl straightens into the tail (optimizer fit)
    9: { breakpoints: [0, 0, 0, 0, 0.0208, 0.2708, 0.4792, 0.6458, 1, 2, 2.3542, 2.6667, 3] },
  },
  4: {
    2: { breakpoints: [0, 1, 2, 2, 2.1458, 2.3958, 2.5208, 2.6667, 2.8125, 2.9375, 2.9375, 2.9375, 3] },
    3: { breakpoints: [0, 1, 2, 2.0208, 2.2708, 2.3958, 2.3958, 2.4792, 2.6875, 2.9167, 2.9167, 2.9167, 3] },
    // crossbar → top bar (moves up), diagonal → down-stroke, stem → bowl (optimizer fit)
    5: { breakpoints: [0, 1, 1.3958, 1.3958, 1.3958, 1.4792, 1.4792, 2, 2.3958, 2.3958, 2.5833, 2.9583, 3] },
    // drawn from the stem's bottom: stem top → the 6's tail top, diagonal + crossbar → circle (optimizer fit)
    6: { breakpoints: [0, 0.3542, 0.3542, 0.3542, 0.3542, 0.4375, 0.875, 1, 1.1042, 1.3958, 1.6042, 2, 3], reversed: true },
    // drawn from the stem's bottom: stem tips over into the 7's bar, diagonal + crossbar → its diagonal (optimizer fit)
    7: { breakpoints: [0, 1, 1, 1.1667, 1.3542, 1.5625, 1.7292, 1.9792, 2, 2, 2, 2, 3], reversed: true },
    // drawn backwards (stem bottom first), so the stem's end meets the crossbar's start on the 8's right side
    8: { reversed: true },
  },
  5: {
    0: { breakpoints: [0, 1, 1, 2, 2.2708, 2.3125, 2.4792, 2.625, 2.75, 2.8542, 3, 3, 3] },
    2: { breakpoints: [0, 1, 1, 1, 2, 2.2917, 2.2917, 2.2917, 2.2917, 2.5417, 2.8542, 2.8542, 3] },
    4: { breakpoints: [0, 1, 2, 2, 2, 2.0833, 2.1458, 2.1667, 2.1875, 2.25, 2.3958, 2.6875, 3] },
    // bar stays the bar, down-stroke + bowl straighten into the 7's diagonal (optimizer fit)
    7: { breakpoints: [0, 0.5625, 0.5625, 0.5625, 0.5625, 0.5625, 1, 2, 2.2083, 2.5208, 2.8333, 2.9167, 3] },
    // start of the 5 (bar end) moves down to the 9's start; segments re-spread on both (optimizer fit)
    9: { breakpoints: [0, 1, 2, 2, 2.0208, 2.1042, 2.1667, 2.2292, 2.2708, 2.3125, 2.5625, 2.75, 3] },
  },
  6: {
    // the 1's flag shrinks into the top of the tail, its stem tilts into the tail and curls into the circle
    // (optimizer fit, like 7 → 6)
    1: {
      tracing: '6-clockwise',
      breakpoints: [0, 0.1042, 0.1042, 0.1667, 0.3125, 0.3125, 1, 1.25, 1.25, 1.3542, 1.5, 1.75, 2],
    },
    // turned by 180° this is the 9 laid out for the 2 (optimizer fit for 2 ↔ 9, mirrored onto the 6)
    2: { breakpoints: [0, 0.1042, 0.5417, 0.75, 1, 1.125, 1.25, 1.375, 1.5, 1.6458, 1.6458, 1.75, 2], reversed: true },
    4: { breakpoints: [0, 0.3958, 0.4792, 0.75, 1, 1.0625, 1.1458, 1.3958, 1.625, 1.625, 1.625, 1.75, 2] },
    // the 3's lower bowl lies on the 6's circle and closes up; its top arc straightens into the tail (optimizer fit)
    3: {
      tracing: '6-clockwise',
      breakpoints: [0, 0.2292, 0.2292, 0.2292, 0.3125, 1, 1.2083, 1.2917, 1.4167, 1.5417, 1.6667, 1.7708, 2],
    },
    // the 5's bowl end closes up to where the bowl starts; bar + down-stroke become the tail (optimizer fit)
    5: {
      tracing: '6-clockwise',
      breakpoints: [0, 0.0833, 0.25, 0.4375, 0.5625, 1, 1.1875, 1.2708, 1.3958, 1.5, 1.6458, 1.75, 2],
    },
    // the 7's bar shrinks into the top of the tail, its diagonal becomes the tail and curls into the circle
    // (optimizer fit)
    7: {
      tracing: '6-clockwise',
      breakpoints: [0, 0.1667, 0.1667, 0.1667, 0.1667, 0.1667, 0.3125, 1, 1.25, 1.5, 1.75, 1.75, 2],
    },
  },
  7: {
    5: { breakpoints: [0, 0.6875, 0.6875, 0.6875, 0.6875, 0.6875, 1, 1.4375, 1.4375, 1.6042, 1.9167, 1.9167, 2] },
    4: { breakpoints: [0, 1, 1.0833, 1.0833, 1.0833, 1.1042, 1.25, 1.3542, 1.5, 1.625, 1.6667, 1.6667, 2] },
  },
  8: {
    1: { breakpoints: [0, 0.25, 0.4792, 0.5625, 0.8125, 1, 1.0625, 1.3125, 1.5625, 1.6042, 1.6042, 1.75, 2] },
    // 0's leftmost and rightmost points (after 3 and 9 segments) both land on the waist
    0: {
      tracing: '8-like-0',
      breakpoints: [0, 1 / 3, 2 / 3, 1, 1 + 1 / 6, 1 + 2 / 6, 1 + 3 / 6, 1 + 4 / 6, 1 + 5 / 6, 2, 2 + 1 / 3, 2 + 2 / 3, 3],
    },
    // both ends of the 3 slide along their circles into the waist: 5 segments on the top loop like the 3's
    // top arc, a zero-length one at the waist for the 3's middle link, 6 on the bottom loop
    3: {
      tracing: '8-two-loops',
      breakpoints: [0, 0.2, 0.4, 0.6, 0.8, 1, 1, 1 + 1 / 6, 1 + 2 / 6, 1 + 3 / 6, 1 + 4 / 6, 1 + 5 / 6, 2],
    },
    // the 4's two ends meet on the right side of the bottom circle (optimizer fit)
    4: {
      tracing: '8-from-right',
      breakpoints: [0, 0, 0.125, 1, 1.25, 1.5, 1.75, 2, 2.1458, 2.2917, 2.625, 2.9583, 3],
    },
    // both ends of the 5 meet at the waist: bar + down-stroke → top loop, bowl → bottom loop (optimizer fit)
    5: {
      tracing: '8-mirrored',
      breakpoints: [0, 0.25, 0.5, 0.6875, 0.8125, 0.8958, 1, 1.125, 1.2292, 1.3542, 1.5, 1.75, 2],
    },
    // 8 → 9 spins (see spins): in the turning frame it is 8 → 6, the 8's big circle stays the 6's circle
    9: { startSegment: 1 },
  },
  9: {
    1: { breakpoints: [0, 0.25, 0.5, 0.75, 0.8125, 1, 1.1042, 1.2292, 1.3542, 1.4583, 1.6042, 1.6875, 2] },
    2: { breakpoints: [0, 0.25, 0.375, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.2708, 1.4375, 2, 2] },
    3: { breakpoints: [0, 0.25, 0.4792, 0.4792, 0.4792, 0.625, 0.75, 0.875, 1, 1.1667, 1.3125, 1.9583, 2] },
    5: { breakpoints: [0, 0, 0.25, 0.2917, 0.3125, 0.5625, 0.8125, 1, 1.0833, 1.0833, 1.5, 1.8542, 2] },
    // turned back by 180° this is exactly the 6 (same segment split, same direction) → a pure spin
    6: { breakpoints: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 1.25, 1.5, 1.75, 2], reversed: true },
    // turned back by 180° this is the 6 laid out for the 8 (optimizer fit for 6 ↔ 8, mirrored onto the 9)
    8: { breakpoints: [0, 0.1667, 0.2917, 0.4375, 0.5833, 0.7292, 0.875, 1, 1.3125, 1.7083, 1.75, 1.75, 2], reversed: true },
  },
};

// 9 is exactly 6 turned 180°, the 6's circle is the 8's bottom circle and the 2's bowl is the 9's circle:
// 6 ↔ 9, 8 ↔ 9 and 2 ↔ 6 morph while turning
export const roundSpins: IconSet['spins'] = {
  2: { 6: 180 },
  6: { 9: 180, 2: -180 },
  8: { 9: 180 },
  9: { 6: -180, 8: -180 },
};
