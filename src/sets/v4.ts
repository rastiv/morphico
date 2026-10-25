// Digit set v4: thin, tall, round digits, drafted from the reference images in icons/v4/
// (the set format is described in ../types.ts).
//
// The images (94 px tall, 6 px stroke, 50 px wide; 5.5 px = 1 grid unit) reveal a strict construction, so the set
// is written directly in grid units: everything round is an arc of two equal circles of radius 4, stacked and
// touching at 12,12 — TOP at 12,8 and BOTTOM at 12,16 — inside the box x 8…16, y 4…20.
//  - 8 = both circles; 3 = arcs of both; 2's bowl = TOP; 5's bowl = half of BOTTOM;
//    6 = arc of TOP + straight left side + a loop (a stadium a bit taller than BOTTOM); 9 = 6 turned 180° around 12,12
//  - 0 = stadium; the 4 is wider and its top point sits lower (y ≈ 5.2), as in the images (its values nudged to the best pixel match)
//  - round ends and corners
import { arc, line, pointOnCircle, roundedPolyline } from '../geometry.ts';
import type { IconSet, Point, Stroke } from '../types.ts';

const RADIUS = 4;
const TOP: Point = [12, 8];
const BOTTOM: Point = [12, 16];
const topArc = (startAngle: number, endAngle: number) => arc(...TOP, RADIUS, startAngle, endAngle);
const bottomArc = (startAngle: number, endAngle: number) => arc(...BOTTOM, RADIUS, startAngle, endAngle);

/** Where the 2's diagonal leaves its bowl: tangent from the corner at 8,20 (a 3-4-5 triangle, hence the round angle). */
const TWO_DIAGONAL_ANGLE = 36.8699;
/** Where the 6's top arc ends on the right (measured: slightly below the circle's right point). */
const SIX_HOOK_ANGLE = 8;

const turnedAround = (stroke: Stroke): Stroke => {
  const turn = ([x, y]: Point): Point => [24 - x, 24 - y];
  switch (stroke.kind) {
    case 'line': return line(...turn(stroke.to), ...turn(stroke.from));
    case 'arc': return arc(...turn(stroke.center), stroke.radius, stroke.endAngle + 180, stroke.startAngle + 180);
    case 'cubic': return { kind: 'cubic', segment: [turn(stroke.segment[3]), turn(stroke.segment[2]), turn(stroke.segment[1]), turn(stroke.segment[0])] };
  }
};

/** The 6's loop is taller than the bottom circle: a stadium from this height down to 20 (measured). */
const SIX_LOOP_TOP = 10.91;

// the 6: top arc from the right over to the left, down the left side, round the loop and back into the left side
const SIX: Stroke[] = [
  topArc(SIX_HOOK_ANGLE, -180),
  ...roundedPolyline(
    [[8, 8], [8, 20], [16, 20], [16, SIX_LOOP_TOP], [8, SIX_LOOP_TOP], [8, SIX_LOOP_TOP + RADIUS]],
    [0, RADIUS, RADIUS, RADIUS, RADIUS, 0],
  ),
];

const digitsV4: IconSet = {
  segmentCount: 16,
  strokeWidth: 6 / 5.5,
  lineCap: 'round',
  lineJoin: 'round',
  strokes: {
    // stadium, from the top middle counter-clockwise
    0: roundedPolyline([[12, 4], [8, 4], [8, 20], [16, 20], [16, 4], [12, 4]], RADIUS),
    // slanted flag up to the top of the stem, stem down
    1: [line(9.64, 9.1, 14.45, 4), line(14.45, 4, 14.45, 20)],
    // bowl over the top, tangent diagonal down to the corner, base
    2: [
      topArc(180, TWO_DIAGONAL_ANGLE + 360),
      line(...pointOnCircle(...TOP, RADIUS, TWO_DIAGONAL_ANGLE), 8, 20),
      line(8, 20, 16, 20),
    ],
    // top arc from the left round to the middle, bottom arc from the middle round to the left
    3: [topArc(180, 450), bottomArc(270, 548)],
    // one stroke: crossbar right → left, diagonal up to the top, stem down
    4: [line(16.96, 16.03, 7, 16.03), line(7, 16.03, 14.85, 5.17), line(14.85, 5.17, 14.85, 20)],
    // top bar right → left, left side down, middle bar, bowl (half of the bottom circle), bottom bar
    5: [line(16, 4, 8, 4), line(8, 4, 8, 12), line(8, 12, 12, 12), bottomArc(270, 450), line(12, 20, 8, 20)],
    6: SIX,
    // top bar → slanted stroke down
    7: [line(8.09, 4, 15.89, 4), line(15.89, 4, 12.09, 20)],
    // closed figure-eight: top circle clockwise, bottom circle counter-clockwise, meeting where they touch
    8: [topArc(90, 450), bottomArc(270, -90)],
    // the 6 turned 180°, drawn the other way round
    9: SIX.map(turnedAround).reverse(),
  },
  alternativeStrokes: {
    // the 8 traced like the 0 (as in v1): from the top counter-clockwise — left half of TOP down to the waist,
    // once around BOTTOM, right half of TOP back up
    '8-like-0': [topArc(270, 90), bottomArc(270, -90), topArc(90, -90)],
    // the 8 as two clockwise loops from the waist (as in v1): the 3's ends slide along the circles into the waist
    '8-two-loops': [topArc(90, 450), bottomArc(270, 630)],
    // the usual figure-eight starting on the right side of BOTTOM (as in v1, where the 4's crossbar starts)
    '8-from-right': [bottomArc(0, -90), topArc(90, 450), bottomArc(270, 0)],
    // mirrored figure-eight from the waist (as in v1): TOP counter-clockwise, BOTTOM clockwise — like the 5
    '8-mirrored': [topArc(90, -270), bottomArc(270, 630)],
  },
  // optimizer fits (tools/check.ts) for the pairs the user rated bad / midd
  pairLayouts: {
    0: {
      1: { startSegment: 6, reversed: true },
      2: { startSegment: 5, reversed: true },
      3: { startSegment: 4, reversed: true },
      4: { startSegment: 10, reversed: true },
      5: { startSegment: 5, reversed: true },
      7: { startSegment: 5, reversed: true },
      9: { startSegment: 5, reversed: true },
    },
    1: {
      0: { breakpoints: [0, 0, 0, 0, 0.1875, 0.5208, 0.7708, 1, 1.2708, 1.4167, 1.5833, 1.75, 1.9375, 1.9375, 1.9375, 1.9375, 2] },
    },
    2: {
      4: { breakpoints: [0, 0, 0.3958, 0.6458, 0.6458, 0.6667, 0.875, 1, 1.1458, 1.1458, 2, 2.875, 2.875, 2.875, 2.875, 2.875, 3] },
      // 2 → 6 spins (see spins): in the turning frame it is 2 → 9 (same layout as 2 → 9)
      6: { breakpoints: [0, 0, 0, 0, 0, 0, 0.2083, 0.4167, 0.625, 0.8333, 1, 1.1458, 1.3333, 1.6042, 1.8125, 2, 3] },
      9: { breakpoints: [0, 0, 0, 0, 0, 0, 0.2083, 0.4167, 0.625, 0.8333, 1, 1.1458, 1.3333, 1.6042, 1.8125, 2, 3] },
      0: { breakpoints: [0, 0, 0, 0.1458, 0.2708, 0.4167, 0.625, 0.8333, 1, 1.1458, 1.3333, 1.5833, 1.8125, 1.8333, 1.8333, 2, 3] },
    },
    3: {
      4: { breakpoints: [0, 0, 0.3333, 0.5208, 0.5208, 0.6042, 0.7708, 0.8333, 1, 1.1667, 1.2083, 1.3958, 1.4792, 1.4792, 1.4792, 1.6875, 2] },
      0: { breakpoints: [0, 0, 0.1042, 0.2292, 0.3333, 0.5, 0.6667, 1, 1.2292, 1.3125, 1.4792, 1.6458, 1.75, 1.8542, 2, 2, 2] },
    },
    4: {
      6: { breakpoints: [0, 0.25, 0.25, 0.25, 0.4375, 1, 1.2917, 1.3542, 1.5208, 1.9583, 2, 2.1875, 2.1875, 2.1875, 2.1875, 2.1875, 3] },
      // as in v1: drawn backwards, so the stem's end meets the crossbar's start on the 8's right side
      8: { reversed: true },
      3: { breakpoints: [0, 1, 1.9792, 1.9792, 2, 2.1458, 2.2917, 2.4375, 2.4583, 2.5, 2.625, 2.7917, 2.9375, 2.9375, 2.9375, 2.9375, 3] },
      2: { breakpoints: [0, 1, 1.9583, 1.9583, 2, 2.0625, 2.2292, 2.3542, 2.4792, 2.6042, 2.75, 2.875, 3, 3, 3, 3, 3] },
      0: { breakpoints: [0, 0.5417, 0.7083, 0.8333, 1, 1.2083, 1.375, 1.5208, 1.6667, 1.8333, 1.9583, 2, 2.1875, 2.375, 2.5625, 2.7083, 3] },
    },
    5: {
      0: { breakpoints: [0, 1, 1.1875, 1.1875, 1.1875, 1.1875, 2, 3, 3.25, 3.2917, 3.5, 3.75, 4, 4.5208, 4.8958, 5, 5] },
    },
    6: {
      8: { breakpoints: [0, 0.4583, 0.5208, 0.5208, 0.5417, 1, 1.875, 2, 2.5, 3, 3.5, 4, 5, 5.4583, 5.9792, 6, 7] },
      4: { breakpoints: [0, 0, 0, 0, 0, 0.0625, 0.25, 0.5417, 1, 1.3542, 1.5, 2, 3, 4, 5, 6, 7], reversed: true },
      // turned by 180° this is the 9 laid out for the 2 (the 2 ↔ 9 fit, mirrored onto the 6)
      2: { breakpoints: [0, 0.2917, 0.2917, 0.5417, 1, 1.5833, 1.6875, 2, 2.5, 3, 3.5, 4, 4, 4, 5, 6, 7], reversed: true },
    },
    7: {
      0: { breakpoints: [0, 0, 0, 0.0417, 0.25, 0.4792, 1, 1.25, 1.3958, 1.5417, 1.7083, 1.9167, 1.9375, 1.9375, 1.9375, 1.9375, 2] },
    },
    8: {
      // as in v1–v3: the 0's left and right points move in to the waist
      0: { tracing: '8-like-0', breakpoints: [0, 0.1667, 0.3333, 0.5208, 0.625, 1, 1.25, 1.3333, 1.4167, 1.5, 1.625, 1.75, 2, 2.375, 2.4792, 2.75, 3] },
      // the user's idea from v1: the 4's two ends meet on the right side of the bottom circle
      4: { tracing: '8-from-right', breakpoints: [0, 0, 0.1667, 0.5, 1, 1.25, 1.5, 1.7083, 1.9167, 2, 2.125, 2.2292, 2.3333, 2.3542, 2.6667, 2.9792, 3] },
      6: { breakpoints: [0, 0.25, 0.5, 0.5, 0.75, 1, 1.1875, 1.25, 1.375, 1.5, 1.625, 1.75, 1.7917, 1.8958, 2, 2, 2] },
      // the two-loop tracing fits the 9 best (no spin needed)
      9: { tracing: '8-two-loops', breakpoints: [0, 0, 0, 0.1042, 0.2083, 0.25, 0.375, 0.5, 0.625, 0.75, 0.8125, 1, 1.25, 1.375, 1.5, 1.75, 2] },
      // the user's idea from v1: both ends of the 5 meet at the waist — bars → top loop, bowl → bottom loop
      5: { tracing: '8-mirrored', breakpoints: [0, 0.25, 0.5, 0.5833, 0.625, 0.6875, 0.8125, 0.875, 0.9167, 1, 1.1042, 1.2083, 1.2917, 1.3958, 1.5, 1.75, 2] },
      // the user's idea from v1: both ends of the 3 slide along the circles into the waist
      3: { tracing: '8-two-loops', breakpoints: [0, 0.25, 0.4583, 0.5208, 0.625, 0.7083, 0.8125, 0.8958, 1, 1.1042, 1.1875, 1.2917, 1.3958, 1.4792, 1.5625, 1.75, 2] },
    },
    9: {
      2: { breakpoints: [0, 1, 2, 3, 3, 3, 3.5, 4, 4.5, 5, 5.3125, 5.4167, 6, 6.4583, 6.7083, 6.7083, 7] },
      0: { breakpoints: [0, 1, 2, 3, 3.7292, 4, 4.5, 5, 5.3333, 5.6667, 6, 6.2292, 6.4792, 6.6458, 6.7917, 7, 7] },
      // turned back by 180° this is exactly the 6 (same segment split, same direction) → a pure spin
      6: { breakpoints: [0, 0.5, 1, 1.5, 2, 3, 3.5, 4, 4.5, 5, 16 / 3, 17 / 3, 6, 6.25, 6.5, 6.75, 7], reversed: true },
    },
  },
  // 9 is exactly 6 turned 180°; 2 → 6 also turns (it is 2 → 9 in the turning frame)
  spins: { 2: { 6: 180 }, 6: { 9: 180, 2: -180 }, 9: { 6: -180 } },
};

export default digitsV4;
