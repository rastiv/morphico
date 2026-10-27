// Digit set "round": geometric sans digits, drafted from the reference images in icons/round/
// (the set format is described in ../types.ts).
//
// Measured from the images and tidied up so shared parts are exactly shared:
//  - round digits span y 4…20, bars sit at y 4.2 / 19.8
//  - round line ends: every open end stops half a stroke (END_INSET) before the edge measured in the images
//    (the images have flat ends), so the round cap ends exactly there — bottoms of 1, 4, 7, 9 line up with the base
//  - one big circle radius (2, 3, 6, 8, 9) and one small one (top of 3 and 8); 5 has its own, larger bowl
//  - 3 is drawn on exactly the two circles of 8 (they touch at 12, 11.2)
//  - 9 is exactly 6 turned 180° around 12,12 → 6 ↔ 9 morphs as a pure spin
import { arc, ellipse, line, pointOnCircle } from '../geometry.ts';
import { withTextCharacters } from './characters.ts';
import type { IconSet, Point } from '../types.ts';

const STROKE_WIDTH = 1.2; // the reference images use 1.6; thinner by the user's choice
/** A round line end reaches this far beyond its end point. */
const END_INSET = STROKE_WIDTH / 2;
/** Angle that shortens an arc's end by END_INSET along the circle. */
const arcInset = (radius: number) => (END_INSET / radius) * (180 / Math.PI);
/** The point on the line through `from` and `to` at height `y`. */
const pointAtY = ([fromX, fromY]: Point, [toX, toY]: Point, y: number): Point =>
  [fromX + ((toX - fromX) * (y - fromY)) / (toY - fromY), y];

const BIG_RADIUS = 4.4;
const SMALL_RADIUS = 3.6;
const TOP_BAR_Y = 4.2;
const BASE_Y = 19.8;
/** Where the 6's tail touches its circle (tangent); 9 uses the same angle turned by 180°. */
const SIX_TAIL_ANGLE = -147.1085;
const SIX_TAIL_JOIN = pointOnCircle(12, 15.6, BIG_RADIUS, SIX_TAIL_ANGLE);
/** Top end of the 6's tail: on the measured tail line (from 14.65, 3.4), pulled in so the round end tops at 3.4. */
const SIX_TAIL_TOP = pointAtY([14.65, 3.4], SIX_TAIL_JOIN, TOP_BAR_Y);
/** Bottom end of the 9's tail: the 6's tail top turned 180° around 12,12. */
const NINE_TAIL_END: Point = [24 - SIX_TAIL_TOP[0], 24 - SIX_TAIL_TOP[1]];
/** Where the 2's diagonal leaves its bowl (tangent towards the corner at 8.3, 19.8). */
const TWO_DIAGONAL_ANGLE = 39.5191;
/** Where the 5's short down-stroke meets its bowl. */
const FIVE_JOIN_ANGLE = 237.2;
/** The 7's foot: on the measured diagonal (16, 4.2 → 7.45, 20.6), pulled in to the base line. */
const SEVEN_FOOT = pointAtY([16, TOP_BAR_Y], [7.45, 20.6], BASE_Y);

// '-' '/' '.' ',' ':' are added by withTextCharacters (characters.ts)
export const roundDigits: IconSet = withTextCharacters({
  segmentCount: 12,
  strokeWidth: STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  strokes: {
    0: ellipse(12, 12, 5.05, 8),
    1: [line(10 + END_INSET, TOP_BAR_Y, 13.1, TOP_BAR_Y), line(13.1, TOP_BAR_Y, 13.1, BASE_Y)],
    2: [
      arc(12, 8.4, BIG_RADIUS, 158.7 + arcInset(BIG_RADIUS), TWO_DIAGONAL_ANGLE + 360),
      line(...pointOnCircle(12, 8.4, BIG_RADIUS, TWO_DIAGONAL_ANGLE), 8.3, BASE_Y),
      line(8.3, BASE_Y, 17.5 - END_INSET, BASE_Y),
    ],
    3: [
      arc(12, 7.6, SMALL_RADIUS, 180 + arcInset(SMALL_RADIUS), 439.2),
      // the two arcs meet slightly right of the point where the circles touch
      line(...pointOnCircle(12, 7.6, SMALL_RADIUS, 79.2), ...pointOnCircle(12, 15.6, BIG_RADIUS, 278.7)),
      arc(12, 15.6, BIG_RADIUS, 278.7, 536.7 - arcInset(BIG_RADIUS)),
    ],
    // one stroke: crossbar right → left, diagonal up to the top, stem down
    4: [
      line(17.6 - END_INSET, 14.95, 8, 14.95),
      line(8, 14.95, 14.75, TOP_BAR_Y),
      line(14.75, TOP_BAR_Y, 14.75, BASE_Y),
    ],
    5: [
      line(17.1 - END_INSET, TOP_BAR_Y, 10.5, TOP_BAR_Y),
      line(10.5, TOP_BAR_Y, ...pointOnCircle(11.9, 15, 4.8, FIVE_JOIN_ANGLE)),
      arc(11.9, 15, 4.8, FIVE_JOIN_ANGLE, 523.3 - arcInset(4.8)),
    ],
    6: [
      line(...SIX_TAIL_TOP, ...SIX_TAIL_JOIN),
      arc(12, 15.6, BIG_RADIUS, SIX_TAIL_ANGLE, SIX_TAIL_ANGLE - 360),
    ],
    7: [line(6.7 + END_INSET, TOP_BAR_Y, 16, TOP_BAR_Y), line(16, TOP_BAR_Y, ...SEVEN_FOOT)],
    // closed figure-eight: top circle clockwise, bottom circle counter-clockwise, meeting where they touch
    8: [arc(12, 7.6, SMALL_RADIUS, 90, 450), arc(12, 15.6, BIG_RADIUS, 270, -90)],
    9: [
      arc(12, 8.4, BIG_RADIUS, SIX_TAIL_ANGLE + 180 - 360, SIX_TAIL_ANGLE + 180),
      line(...pointOnCircle(12, 8.4, BIG_RADIUS, SIX_TAIL_ANGLE + 180), ...NINE_TAIL_END),
    ],
  },
  alternativeStrokes: {
    // the 8 traced like the 0 (from the top, counter-clockwise): left half of the top circle down to the waist,
    // once around the bottom circle, right half of the top circle back up
    '8-like-0': [
      arc(12, 7.6, SMALL_RADIUS, 270, 90),
      arc(12, 15.6, BIG_RADIUS, 270, -90),
      arc(12, 7.6, SMALL_RADIUS, 90, -90),
    ],
    // the 8 as two clockwise loops, both starting at the waist (like the 3: top arc, then bottom arc)
    '8-two-loops': [arc(12, 7.6, SMALL_RADIUS, 90, 450), arc(12, 15.6, BIG_RADIUS, 270, 630)],
    // the 6 with its circle drawn clockwise (the same way round as the 5's bowl)
    '6-clockwise': [
      line(...SIX_TAIL_TOP, ...SIX_TAIL_JOIN),
      arc(12, 15.6, BIG_RADIUS, SIX_TAIL_ANGLE, SIX_TAIL_ANGLE + 360),
    ],
    // mirrored figure-eight from the waist: top circle counter-clockwise, bottom circle clockwise (like the 5)
    '8-mirrored': [arc(12, 7.6, SMALL_RADIUS, 90, -270), arc(12, 15.6, BIG_RADIUS, 270, 630)],
    // the usual figure-eight, but starting on the right side of the bottom circle (where the 4's crossbar starts)
    '8-from-right': [
      arc(12, 15.6, BIG_RADIUS, 0, -90),
      arc(12, 7.6, SMALL_RADIUS, 90, 450),
      arc(12, 15.6, BIG_RADIUS, 270, 0),
    ],
  },
  pairLayouts: {
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
      4: { breakpoints: [0, 1, 1.0625, 1.125, 1.1875, 1.2708, 1.2708, 1.6875, 1.6875, 1.6875, 1.6875, 1.6875, 2] },
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
      // drawn from the stem's bottom: the 1's stem stays a stem, its flag folds out into diagonal + crossbar
      1: { breakpoints: [0, 0.4375, 0.4375, 0.4375, 0.4375, 1, 1.6042, 1.6042, 1.7292, 1.8333, 1.8958, 2, 3], reversed: true },
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
  },
  // 9 is exactly 6 turned 180°, the 6's circle is the 8's bottom circle and the 2's bowl is the 9's circle:
  // 6 ↔ 9, 8 ↔ 9 and 2 ↔ 6 morph while turning
  spins: {
    2: { 6: 180 },
    6: { 9: 180, 2: -180 },
    8: { 9: 180 },
    9: { 6: -180, 8: -180 },
  },
  textLayout: { cellWidth: 10, spacing: 4, baselineY: 19.8, colonDotsY: [7.6, 15.6] },
});
