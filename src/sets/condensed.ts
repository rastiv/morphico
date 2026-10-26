// Digit set "condensed": tall, narrow, thin "display" digits with rounded corners, drafted from the reference images in
// icons/condensed/ (the set format is described in ../types.ts).
//
// The shapes are written on the images' own pixel grid and converted: x/y are the stroke's middle line in image
// pixels, measured from the digit's ink box. Every digit is 94 px tall with a 6 px stroke, most are 50 px wide:
// middle lines at x 3 / 47 and y 3 (top) / 47 (middle) / 91 (bottom). 5.5 image px = 1 grid unit, so the digits
// span x 8…16, y 4…20.
//  - straight strokes with rounded corners (roundedPolyline), round ends
//  - 0 = stadium; 8 = two stacked rounded rectangles sharing the middle bar; 9 = 6 turned 180° around 12,12;
//    the 5 ends with the same small upturn as the 9
//  - T-junctions (4's right stem) are drawn out and back over themselves
import { roundedPolyline } from '../geometry.ts';
import type { IconSet, Point } from '../types.ts';

const PIXELS_PER_UNIT = 5.5;

/** Image pixels (middle line, measured from the ink box of a digit `inkWidth` px wide) → grid units. */
const fromImage = (inkWidth: number) => ([x, y]: Point): Point =>
  [12 + (x - inkWidth / 2) / PIXELS_PER_UNIT, 4 + (y - 3) / PIXELS_PER_UNIT];
/** A rounded polyline given in image pixels; radii in image pixels too. */
const drawn = (inkWidth: number, points: Point[], radii: number | number[]) => roundedPolyline(
  points.map(fromImage(inkWidth)),
  Array.isArray(radii) ? radii.map((radius) => radius / PIXELS_PER_UNIT) : radii / PIXELS_PER_UNIT,
);
const turnedAround = ([x, y]: Point): Point => [24 - x, 24 - y];

// corner radii (image px), chosen by pixel comparison with the images: one radius for (almost) every corner
const CORNER_RADIUS = 12;
const OUTER_RADIUS = CORNER_RADIUS; // outer corners of the boxes (top and bottom)
const MIDDLE_RADIUS = CORNER_RADIUS; // corners where a box meets the middle bar
const THREE_BOWL_RADIUS = 16; // the 3's bowls are rounder
const THREE_MIDDLE_END_X = 15;
/** End of the small upturn at the bottom left of 5 and 9 (and of the hook at the top right of 6). */
const HOOK_END_Y = 79;

// the 6: hook at the top right, over the top, down the left side, round the bottom, up to the middle bar, back left
const SIX_POINTS: Point[] = [[47, 94 - HOOK_END_Y], [47, 3], [3, 3], [3, 91], [47, 91], [47, 47], [3, 47]];
const SIX_RADII = [0, OUTER_RADIUS, OUTER_RADIUS, OUTER_RADIUS, OUTER_RADIUS, MIDDLE_RADIUS, 0];

const condensedDigits: IconSet = {
  segmentCount: 20,
  strokeWidth: 6 / PIXELS_PER_UNIT,
  lineCap: 'round',
  lineJoin: 'round',
  strokes: {
    // stadium, from the top middle counter-clockwise
    0: drawn(50, [[25, 3], [3, 3], [3, 91], [47, 91], [47, 3], [25, 3]], 22),
    // flag → stem
    1: drawn(17, [[3, 3], [14, 3], [14, 91]], 0),
    // top bar → right side → middle bar → left side → bottom bar
    2: drawn(50, [[3, 3], [47, 3], [47, 47], [3, 47], [3, 91], [47, 91]], [0, CORNER_RADIUS, CORNER_RADIUS, CORNER_RADIUS, CORNER_RADIUS, 0]),
    // top bar → upper bowl → middle bar out to the left and back → lower bowl → bottom bar
    3: drawn(50, [[3, 3], [47, 3], [47, 47], [THREE_MIDDLE_END_X, 47], [47, 47], [47, 91], [3, 91]],
      [0, THREE_BOWL_RADIUS, THREE_BOWL_RADIUS, 0, THREE_BOWL_RADIUS, THREE_BOWL_RADIUS, 0]),
    // left stem down → crossbar → right stem up to the top and back down to the bottom
    4: drawn(50, [[3, 3], [3, 47], [47, 47], [47, 3], [47, 91]], [0, CORNER_RADIUS, 0, 0, 0]),
    // top bar right → left, left side down, middle bar → right side → bottom bar → small upturn
    5: drawn(50, [[47, 3], [3, 3], [3, 47], [47, 47], [47, 91], [3, 91], [3, HOOK_END_Y]],
      [0, 0, 0, MIDDLE_RADIUS, OUTER_RADIUS, OUTER_RADIUS, 0]),
    6: drawn(50, SIX_POINTS, SIX_RADII),
    // top bar → slanted stroke down
    7: drawn(49, [[3, 3], [46, 3], [24.5, 91]], 0),
    // from the waist: top box (left side up, clockwise), along the middle bar, bottom box (counter-clockwise)
    8: drawn(50, [[3 + MIDDLE_RADIUS, 47], [3, 47], [3, 3], [47, 3], [47, 47], [3, 47], [3, 91], [47, 91], [47, 47], [3 + MIDDLE_RADIUS, 47]],
      [0, MIDDLE_RADIUS, OUTER_RADIUS, OUTER_RADIUS, MIDDLE_RADIUS, MIDDLE_RADIUS, OUTER_RADIUS, OUTER_RADIUS, MIDDLE_RADIUS, 0]),
    // the 6 turned 180°, drawn the other way round (box first, then the small upturn)
    9: roundedPolyline(
      SIX_POINTS.map(fromImage(50)).map(turnedAround).reverse(),
      [...SIX_RADII].reverse().map((radius) => radius / PIXELS_PER_UNIT),
    ),
  },
  alternativeStrokes: {
    // the 8 traced like the 0 (from the top, counter-clockwise): left side of the top box down to the middle of
    // the middle bar, once around the bottom box back to the middle, right side of the top box back up
    '8-like-0': drawn(50,
      [[25, 3], [3, 3], [3, 47], [25, 47], [3, 47], [3, 91], [47, 91], [47, 47], [25, 47], [47, 47], [47, 3], [25, 3]],
      [0, OUTER_RADIUS, MIDDLE_RADIUS, 0, MIDDLE_RADIUS, OUTER_RADIUS, OUTER_RADIUS, MIDDLE_RADIUS, 0, MIDDLE_RADIUS, OUTER_RADIUS, 0]),
    // the 8 traced like the 3 (as in the square set), starting and ending at the left part of the middle bar: around the top
    // box, along the middle bar out to the left and back, around the bottom box
    '8-like-3': drawn(50,
      [[3 + MIDDLE_RADIUS, 47], [3, 47], [3, 3], [47, 3], [47, 47], [3 + MIDDLE_RADIUS, 47], [47, 47], [47, 91], [3, 91], [3, 47], [3 + MIDDLE_RADIUS, 47]],
      [0, MIDDLE_RADIUS, OUTER_RADIUS, OUTER_RADIUS, MIDDLE_RADIUS, 0, MIDDLE_RADIUS, OUTER_RADIUS, OUTER_RADIUS, MIDDLE_RADIUS, 0]),
  },
  // optimizer fits (tools/check.ts) for the pairs the user rated bad / midd
  pairLayouts: {
    0: {
      1: { startSegment: 5, reversed: true },
      2: { startSegment: 5, reversed: true },
      3: { startSegment: 5, reversed: true },
      4: { breakpoints: [0, 0.6458, 0.6667, 1, 1.2292, 1.4375, 1.4583, 1.4583, 1.4583, 2, 3, 4, 4.5208, 4.5208, 4.5208, 4.5208, 4.75, 5, 5.3125, 5.3125, 6] },
      5: { startSegment: 4, reversed: true },
      7: { startSegment: 5, reversed: true },
      9: { startSegment: 6, reversed: true },
    },
    1: {
      0: { breakpoints: [0, 0, 0, 0, 0, 0.5, 1, 1.125, 1.25, 1.375, 1.5, 1.625, 1.75, 1.8542, 1.8542, 1.8542, 1.8542, 1.8542, 1.8542, 1.8542, 2] },
    },
    2: {
      6: { breakpoints: [0, 1, 1, 1, 1, 2, 3, 4, 5, 6, 7, 7.5, 8, 8.2917, 8.7292, 8.7292, 8.7292, 8.7292, 8.7292, 8.7292, 9] },
      9: { breakpoints: [0, 0.2292, 0.2292, 0.2292, 0.2292, 0.2292, 0.2292, 0.2292, 0.3333, 0.6875, 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 8, 9] },
      0: { breakpoints: [0, 0, 0, 0.0625, 0.3333, 0.6875, 1, 2, 2.5, 3, 3.5625, 3.6042, 4, 5, 6, 7, 7, 7, 7, 8, 9] },
    },
    3: {
      4: { breakpoints: [0, 0, 1, 2, 2, 2, 3, 3.4167, 3.4167, 4, 5, 6, 6.5833, 6.5833, 7, 8, 8.4375, 8.4583, 8.4583, 9, 10] },
      9: { breakpoints: [0, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.375, 0.8333, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9.6667, 10] },
      0: { breakpoints: [0, 0, 0, 0.0833, 0.375, 0.8333, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9.1667, 9.625, 9.9167, 10, 10, 10] },
    },
    4: {
      6: { breakpoints: [0, 0, 0, 1, 1.8333, 2, 2.7083, 2.8125, 2.8125, 2.8125, 2.8125, 2.8125, 2.8125, 2.8125, 2.8125, 2.8125, 2.8125, 2.8125, 3, 4, 5] },
      8: { breakpoints: [0, 0, 0.3333, 0.6875, 1, 2, 2.3125, 2.3125, 2.3125, 2.3125, 2.3125, 2.3125, 2.3125, 2.3125, 2.3125, 2.6667, 3, 3.5625, 3.75, 4, 5] },
      9: { breakpoints: [0, 1, 1, 1, 1, 2, 3, 4, 4.125, 4.1875, 4.1875, 4.1875, 4.1875, 4.1875, 4.2292, 4.3958, 4.4375, 4.875, 5, 5, 5] },
      3: { breakpoints: [0, 1, 2, 3, 4, 4.1875, 4.3125, 4.4583, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5, 4.5417, 4.6875, 4.8125, 4.9583, 5, 5, 5] },
      0: { breakpoints: [0, 0.0625, 0.3333, 0.6875, 1, 1.5208, 1.7083, 1.7917, 1.8542, 2, 2.3125, 2.6667, 2.9375, 3, 3, 3, 3.25, 3.5, 3.75, 4, 5] },
    },
    5: {
      8: { breakpoints: [0, 0, 0, 0, 0.25, 0.4375, 1, 1.25, 1.4375, 2, 2.3333, 3, 4, 5, 6, 7, 8, 8, 8, 8, 8] },
      0: { breakpoints: [0, 0.8125, 0.8125, 0.8125, 0.8125, 1, 2, 3, 3.3958, 3.4375, 4, 4.5, 5, 6, 6.5, 7, 8, 8, 8, 8, 8] },
    },
    6: {
      8: { breakpoints: [0, 1, 1, 1, 1, 1, 2, 3, 3.5417, 3.5417, 3.6458, 4, 5, 6, 7, 8, 9, 9.6667, 10, 10, 10] },
      4: { breakpoints: [0, 1, 2, 3, 4, 5, 6, 7, 8, 8.7292, 8.7292, 8.7292, 8.7292, 8.7292, 8.7292, 8.7292, 8.7292, 8.7292, 8.7292, 9, 10] },
      2: { breakpoints: [0, 1, 1, 1, 1, 1, 2, 3, 3.5833, 3.6458, 4, 4.5, 5, 5.5, 6, 6.125, 6.125, 7, 8, 9, 10] },
    },
    7: {
      8: { breakpoints: [0, 0, 0, 0.2292, 0.6042, 0.7292, 0.8333, 1, 1.0833, 1.125, 1.3542, 1.5208, 1.5417, 1.7292, 1.8125, 1.8125, 1.8125, 1.8125, 1.8125, 1.8125, 2] },
      0: { breakpoints: [0, 0, 0, 0.0417, 0.25, 0.4375, 1, 1.125, 1.2292, 1.3542, 1.4792, 1.5833, 1.7083, 1.8542, 1.8958, 1.8958, 1.8958, 1.8958, 1.8958, 1.8958, 2] },
    },
    8: {
      // as in round and square: the 0's left and right sides move in to the middle of the 8's middle bar
      0: { tracing: '8-like-0', breakpoints: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9.5, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19] },
      4: { startSegment: 5, reversed: true },
      5: { startSegment: 10, reversed: true },
      6: { startSegment: 3 },
      7: { breakpoints: [0, 1, 2, 3, 3.7083, 4, 4.2708, 4.4792, 4.7083, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16] },
      9: { startSegment: 17 },
      // as in the square set: both ends of the 3 move to the left part of its middle bar, where the 8's boxes close
      3: { tracing: '8-like-3', breakpoints: [0, 1, 2, 3, 4, 5, 6, 6.5, 7, 7.6458, 8, 8.3542, 9, 9.5, 10, 11, 12, 13, 14, 15, 16] },
    },
    9: {
      8: { breakpoints: [0, 0, 0.3333, 1, 2, 2.5, 3, 4, 4.5, 5, 6, 6.1458, 6.3542, 6.4583, 6.4583, 7, 8, 9, 9, 9, 10] },
      4: { breakpoints: [0, 1, 2, 2, 2, 3, 4, 5, 6, 6.0625, 6.0625, 6.0625, 6.0625, 6.0625, 6.125, 6.3542, 6.4167, 7, 8, 9, 10] },
      3: { breakpoints: [0, 1, 2, 3, 3.7708, 3.7708, 3.7708, 3.7708, 4, 4.5, 5, 6, 6.2917, 6.5, 6.5, 6.5, 6.7083, 7, 8, 9, 10] },
      2: { breakpoints: [0, 1, 2, 3, 3.7917, 3.7917, 3.7917, 3.7917, 4, 4.4792, 5, 5.5, 6, 6.3542, 6.4167, 7, 8, 9, 9, 9, 10] },
      0: { breakpoints: [0, 1, 2, 2.5, 3, 4, 4.5, 5, 6, 6.1458, 6.3333, 6.5, 6.6667, 6.8542, 7, 8, 8.5, 9, 10, 10, 10] },
      // turned back by 180° this is exactly the 6 (same segment split, same direction) → a pure spin
      6: {
        breakpoints: [0, 0.5, 1, 2, 2.5, 3, 4, 4.5, 5, 5.5, 6, 6.25, 6.5, 6.75, 7, 7.5, 8, 8.5, 9, 9.5, 10],
        reversed: true,
      },
    },
  },
  spins: { 6: { 9: 180 }, 9: { 6: -180 } },
};

export default condensedDigits;
