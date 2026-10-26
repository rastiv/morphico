// Digit set "square": rounded-square "techno" digits, drafted from the reference images in icons/square/
// (the set format is described in ../types.ts).
//
// The images are tiny (every digit 28 px tall, 4 px stroke), so the shapes are written on the images' own pixel
// grid and converted: x/y are the stroke's middle line in image pixels, measured from the digit's ink box
// (y 2…26 = top to bottom middle line; x 2 = middle of a stroke on the left edge). 1.5 image px = 1 grid unit.
//  - straight strokes with rounded corners (roundedPolyline), round ends
//  - 3 and 5 share the same right-side bowls (corner radius 5 px); 8 = two stacked rounded rectangles sharing
//    the middle bar; 9 = 6 turned 180° around 12,12
//  - T-junctions (1's foot, 3's middle bar, 4's crossbar) are drawn out and back over themselves
import { roundedPolyline } from '../geometry.ts';
import type { IconSet, Point } from '../types.ts';

const PIXELS_PER_UNIT = 1.5;
/** The images' stroke is 4 px ≈ 2.67 units; thinner by the user's choice. */
const STROKE_WIDTH = 1.6;

/** Image pixels (middle line, measured from the ink box of a digit `inkWidth` px wide) → grid units. */
const fromImage = (inkWidth: number) => ([x, y]: Point): Point =>
  [12 + (x - inkWidth / 2) / PIXELS_PER_UNIT, 4 + (y - 2) / PIXELS_PER_UNIT];
/** A rounded polyline given in image pixels; radii in image pixels too. */
const drawn = (inkWidth: number, points: Point[], radii: number | number[]) => roundedPolyline(
  points.map(fromImage(inkWidth)),
  Array.isArray(radii) ? radii.map((radius) => radius / PIXELS_PER_UNIT) : radii / PIXELS_PER_UNIT,
);
const turnedAround = ([x, y]: Point): Point => [24 - x, 24 - y];

// corner radii (image px), each the best pixel match with the images; bowls are exact half-circles
const ZERO_RADIUS = 8; // half the width: the 0 is a stadium
const THREE_BOWL_RADIUS = 6; // half of each bowl's height (12 px)
const FIVE_BOWL_RADIUS = 6.5; // half of the bowl's height (13 px)
const SIX_RADIUS = 7;
const EIGHT_RADIUS = 6;

// the 6: hook from the top right, round the left side, then the closed bottom loop back to the left side
const SIX_POINTS: Point[] = [[15, 2], [2, 2], [2, 26], [19, 26], [19, 12], [2, 12]];
const SIX_RADII = [0, SIX_RADIUS, SIX_RADIUS, SIX_RADIUS, SIX_RADIUS, 0];

const squareDigits: IconSet = {
  segmentCount: 20,
  strokeWidth: STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  strokes: {
    // closed rounded rectangle, from the top middle counter-clockwise
    0: drawn(20, [[10, 2], [2, 2], [2, 26], [18, 26], [18, 2], [10, 2]], ZERO_RADIUS),
    // flag → stem down → foot to the left and back across to the right
    1: drawn(16, [[2, 2], [8, 2], [8, 26], [2, 26], [14, 26]], 0),
    // top bar → right side → diagonal down to the left → left side → base
    2: drawn(20, [[3, 2], [18, 2], [18, 9.25], [2, 17.25], [2, 26], [18, 26]], [0, 2, 4.5, 4.5, 0, 0]),
    // top bar → upper bowl → middle bar out to the left and back → lower bowl → bottom bar
    3: drawn(20, [[2, 2], [18, 2], [18, 14], [6, 14], [18, 14], [18, 26], [2, 26]],
      [0, THREE_BOWL_RADIUS, THREE_BOWL_RADIUS, 0, THREE_BOWL_RADIUS, THREE_BOWL_RADIUS, 0]),
    // left stem down → crossbar to its right end and back to the right stem → down to the bottom and back up to the top
    4: drawn(24, [[2, 2], [2, 18], [22, 18], [18, 18], [18, 26], [18, 2]], [0, 1, 0, 0, 0, 0]),
    // top bar right → left, down the left side, middle bar → bowl → bottom bar
    5: drawn(20, [[16, 2], [2, 2], [2, 13], [18, 13], [18, 26], [2, 26]], [0, 0, 0, FIVE_BOWL_RADIUS, FIVE_BOWL_RADIUS, 0]),
    6: drawn(21, SIX_POINTS, SIX_RADII),
    // top bar → diagonal down to the left
    7: drawn(20, [[2, 2], [17.5, 2], [3.7, 26]], 0),
    // from the waist: top rectangle (left side up, clockwise), along the middle bar, bottom rectangle (counter-clockwise)
    8: drawn(20, [[7, 14], [3, 14], [3, 2], [17, 2], [17, 14], [2, 14], [2, 26], [18, 26], [18, 14], [7, 14]],
      [0, EIGHT_RADIUS, EIGHT_RADIUS, EIGHT_RADIUS, EIGHT_RADIUS, EIGHT_RADIUS, EIGHT_RADIUS, EIGHT_RADIUS, EIGHT_RADIUS, 0]),
    // the 6 turned 180°, drawn the other way round (loop first, then the hook)
    9: roundedPolyline(
      SIX_POINTS.map(fromImage(21)).map(turnedAround).reverse(),
      [...SIX_RADII].reverse().map((radius) => radius / PIXELS_PER_UNIT),
    ),
  },
  alternativeStrokes: {
    // the 8 traced like the 0 (from the top, counter-clockwise): left side of the top loop down to the middle of
    // the middle bar, once around the bottom loop back to the middle, right side of the top loop back up
    '8-like-0': drawn(20,
      [[10, 2], [3, 2], [3, 14], [10, 14], [2, 14], [2, 26], [18, 26], [18, 14], [10, 14], [17, 14], [17, 2], [10, 2]],
      [0, EIGHT_RADIUS, EIGHT_RADIUS, 0, EIGHT_RADIUS, EIGHT_RADIUS, EIGHT_RADIUS, EIGHT_RADIUS, 0, EIGHT_RADIUS, EIGHT_RADIUS, 0]),
    // the 8 traced like the 3, starting and ending at the left part of the middle bar: around the top loop, along
    // the middle bar out to the left and back, around the bottom loop
    '8-like-3': drawn(20,
      [[9, 14], [3, 14], [3, 2], [17, 2], [17, 14], [8, 14], [18, 14], [18, 26], [2, 26], [2, 14], [8, 14]],
      [0, EIGHT_RADIUS, EIGHT_RADIUS, EIGHT_RADIUS, EIGHT_RADIUS, 0, EIGHT_RADIUS, EIGHT_RADIUS, EIGHT_RADIUS, EIGHT_RADIUS, 0]),
  },
  // optimizer fits (tools/check.ts) for the pairs the user rated bad / midd
  pairLayouts: {
    0: {
      1: { startSegment: 5, reversed: true },
      2: { startSegment: 15 },
      3: { startSegment: 5, reversed: true },
      5: { startSegment: 5, reversed: true },
      7: { startSegment: 5, reversed: true },
      9: { startSegment: 7, reversed: true },
    },
    1: {
      9: { breakpoints: [0, 0.2083, 0.2083, 0.4792, 1, 1, 1.25, 1.4583, 1.5417, 1.75, 2, 2, 2.0208, 2.25, 2.25, 2.25, 2.25, 2.25, 2.25, 3, 4] },
      0: { breakpoints: [0, 0, 0, 0, 0.5, 1, 1.0208, 1.0833, 1.2083, 1.3333, 1.5, 1.6667, 1.7917, 1.9167, 1.9792, 2, 2.5, 3, 3, 3, 4] },
    },
    2: {
      4: { breakpoints: [0, 1, 1, 1, 1, 2, 3, 4, 4.2292, 4.2292, 4.2292, 5, 5.2292, 5.5208, 5.5208, 5.5208, 5.5208, 5.5208, 6, 7, 8] },
      6: { breakpoints: [0, 1, 2, 3, 4, 5, 5.0833, 5.2917, 6, 6.375, 7, 7.4375, 7.6042, 7.7708, 7.7708, 7.7708, 7.7708, 7.7708, 7.7708, 7.7708, 8] },
      9: { breakpoints: [0, 0.2708, 0.2708, 0.2708, 0.2708, 0.2708, 0.2708, 0.2708, 0.2708, 0.3958, 0.6458, 1, 2, 3, 4, 4.0833, 4.1875, 5, 6, 7, 8] },
      0: { breakpoints: [0, 1, 2, 2, 2, 3, 4, 4.6667, 4.7917, 5, 5.1042, 5.6667, 6, 7, 7.3333, 7.5, 7.6875, 7.8542, 7.9792, 8, 8] },
    },
    3: {
      4: { breakpoints: [0, 1, 1.3958, 1.3958, 1.3958, 1.5833, 2, 2.4167, 2.6042, 2.6042, 2.6042, 3, 4, 5, 5.5625, 6, 6, 7, 7.9792, 8, 8] },
      6: { breakpoints: [0, 1, 1.1458, 1.1458, 1.1458, 1.1458, 1.1458, 1.1458, 2, 3, 4, 4, 5, 6, 6.2292, 6.2292, 6.2292, 6.2292, 6.2292, 7, 8] },
      9: { breakpoints: [0, 0.3333, 0.3333, 0.4792, 1, 1.7292, 2, 2.3125, 2.3125, 3, 4, 5, 5.5833, 5.5833, 5.5833, 6, 6.5, 7, 7.3542, 7.5625, 8] },
      0: { breakpoints: [0, 0, 0.0417, 0.2292, 0.4792, 0.8333, 1, 1.5, 2, 3, 4, 5, 6, 6.5, 7, 7.1667, 7.5208, 7.7708, 7.9583, 8, 8] },
    },
    4: {
      7: { breakpoints: [0, 1, 2, 2.3125, 2.3125, 3, 4, 5, 5.7083, 5.7083, 5.7708, 5.8542, 5.9167, 6, 6, 6, 6, 6, 6, 6, 6], reversed: true },
      9: { breakpoints: [0, 1, 2, 3, 4, 5, 5.5625, 5.7083, 5.7083, 5.7083, 5.7083, 5.7083, 5.7083, 5.7083, 5.7083, 5.7083, 5.7083, 5.7083, 5.7083, 5.7083, 6], reversed: true },
      3: { breakpoints: [0, 1, 2, 3, 4, 5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5, 5.5208, 5.625, 5.75, 5.875, 5.9792, 6, 6, 6, 6], reversed: true },
      2: { breakpoints: [0, 1, 2, 2.1042, 2.1042, 2.1042, 2.1042, 2.1042, 2.2083, 2.2083, 3, 4, 5, 5.8125, 5.8125, 5.9375, 6, 6, 6, 6, 6], reversed: true },
    },
    5: {
      6: { breakpoints: [0, 0.3542, 0.4792, 1, 1.3333, 1.625, 2, 2, 2, 2.0208, 2.2292, 3, 4, 4, 4, 4, 4, 4, 4, 5, 6] },
      8: { breakpoints: [0, 0.1042, 0.1042, 0.1042, 0.1042, 0.3542, 0.4583, 1, 1.5625, 2, 2.6667, 2.6667, 3, 4, 4.5, 5, 5.3542, 5.875, 5.8958, 5.8958, 6] },
      9: { breakpoints: [0, 1, 1.4792, 1.4792, 1.4792, 1.4792, 1.4792, 1.4792, 1.4792, 1.4792, 2, 3, 3.3958, 3.7708, 4, 4.3333, 4.6667, 5, 5.3542, 5.5417, 6] },
      0: { breakpoints: [0, 1, 1.2083, 1.2083, 1.2083, 2, 3, 3.1875, 3.2708, 3.3958, 3.5208, 4, 4.125, 4.5, 4.875, 5, 5.5208, 5.75, 5.9583, 6, 6] },
    },
    6: {
      7: { breakpoints: [0, 0.375, 0.375, 0.375, 0.375, 0.375, 0.375, 0.375, 0.375, 0.375, 0.375, 0.375, 1, 2, 2.625, 3, 4, 5, 6, 7, 8] },
      8: { breakpoints: [0, 0.2292, 0.2292, 0.2292, 0.2292, 1, 2, 2.5833, 2.6458, 3, 3.5417, 4, 5, 5.4583, 6, 7, 7.3542, 7.3542, 7.6875, 7.8333, 8] },
      5: { breakpoints: [0, 0.5, 1, 1.4792, 1.6875, 2, 2.375, 2.375, 2.375, 2.375, 3, 4, 5, 5.9792, 5.9792, 5.9792, 5.9792, 5.9792, 6, 7, 8] },
      3: { breakpoints: [0, 0.1458, 0.1458, 0.1458, 0.1458, 0.1458, 0.1458, 0.1458, 0.1458, 1, 2, 3, 4, 5, 5.625, 5.625, 5.625, 5.625, 6, 7, 8] },
      2: { breakpoints: [0, 0, 0, 0, 1, 2, 2.8125, 2.8125, 3, 3.3125, 3.5208, 4, 5, 5.2292, 5.2292, 5.2292, 5.2292, 5.2292, 6, 7, 8] },
    },
    7: {
      6: { breakpoints: [0, 0.6667, 0.6667, 0.6667, 0.6667, 0.6667, 0.6667, 0.6667, 0.6667, 0.6667, 0.6667, 0.6667, 1, 1.5208, 1.7083, 1.7083, 1.7083, 1.7083, 1.7083, 1.7083, 2] },
      4: { breakpoints: [0, 0.9167, 0.9167, 0.9167, 0.9167, 0.9167, 0.9167, 1, 1.1042, 1.125, 1.2083, 1.2292, 1.2917, 1.5833, 1.5833, 1.5833, 1.6667, 1.7083, 1.7292, 1.7292, 2] },
      0: { breakpoints: [0, 0, 0.0208, 0.1458, 0.3125, 0.5208, 0.6875, 1, 1.1667, 1.2292, 1.375, 1.4792, 1.6042, 1.7083, 1.8125, 1.875, 1.875, 1.875, 1.875, 1.875, 2] },
    },
    8: {
      5: { startSegment: 11, reversed: true },
      6: { startSegment: 4 },
      7: { tracing: '8-like-3', breakpoints: [0, 1, 1.8542, 2, 3, 3.2083, 3.3958, 3.5208, 3.5833, 3.6875, 4, 4.3542, 4.7708, 5, 6, 7, 8, 9, 10, 11, 12] },
      9: { tracing: '8-like-3', breakpoints: [0, 0, 0, 0, 0.3542, 0.5833, 1, 1.2083, 1.5625, 2, 3, 3.375, 4, 5, 6, 7, 8, 9, 10, 11, 12] },
      4: { tracing: '8-like-0', breakpoints: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 9, 9, 9, 10, 11, 12, 13, 14, 15] },
      // the user's idea: both ends of the 3 move to the left tip of its middle bar, where the 8's loops close
      3: {
        tracing: '8-like-3',
        breakpoints: [0, 1, 2, 3, 3.4375, 3.7083, 4, 4.2917, 4.5625, 5, 5.7292, 6, 6.1458, 7, 7.5, 8, 8.5, 9, 10, 11, 12],
      },
      // the user's idea: the 0's left and right sides move in to the middle of the 8's middle bar
      0: {
        tracing: '8-like-0',
        breakpoints: [0, 1, 1.6042, 2, 3, 4, 5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 10, 11, 12, 13, 13.3958, 14, 15],
      },
    },
    9: {
      5: { breakpoints: [0, 1, 2, 2.1875, 2.1875, 2.1875, 2.1875, 2.1875, 2.1875, 2.1875, 3, 4, 5, 5.8333, 6, 6.375, 6.6875, 7, 7.5417, 8, 8] },
      4: { breakpoints: [0, 1, 2, 3, 4, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5.5, 6, 6.0208, 6.0208, 7, 8, 8] },
      3: { breakpoints: [0, 1, 2, 3, 4, 4.6667, 5, 5.1875, 5.4375, 5.5, 5.5, 5.5, 5.5, 5.5, 5.6667, 6, 6.5417, 7, 7.4583, 8, 8] },
      2: { breakpoints: [0, 1, 2, 2.8333, 2.8333, 2.8333, 2.8333, 2.8333, 2.8333, 3, 4, 4.3542, 4.5833, 4.8125, 5, 5.0625, 6, 7, 8, 8, 8] },
      1: { breakpoints: [0, 1, 2, 3, 3.5, 4, 5, 5.3958, 5.6042, 6, 7, 7.2708, 7.2708, 7.5208, 7.5208, 7.5208, 7.5208, 7.5208, 7.5208, 7.5208, 8] },
      0: { breakpoints: [0, 1, 1.6667, 2, 2.2083, 2.5, 3, 3.5, 4, 4.5, 4.7917, 5, 5.5, 6, 6.1875, 6.5417, 6.875, 7, 7.875, 8, 8] },
      // turned back by 180° this is exactly the 6 (same segment split, same direction) → a pure spin
      6: {
        breakpoints: [0, 0.5, 1, 4 / 3, 5 / 3, 2, 7 / 3, 8 / 3, 3, 4, 13 / 3, 14 / 3, 5, 16 / 3, 17 / 3, 6, 19 / 3, 20 / 3, 7, 7.5, 8],
        reversed: true,
      },
    },
  },
  spins: { 6: { 9: 180 }, 9: { 6: -180 } },
};

export default squareDigits;
