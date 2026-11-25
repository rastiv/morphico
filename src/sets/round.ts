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
import { arc, ellipse, line, pointOnCircle } from '../geometry/strokes.ts';
import { withTextCharacters } from './characters.ts';
import { roundPairLayouts, roundSpins } from './round/transitions.ts';
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

// '-' '/' '.' ',' ':' and the symbols '+' '%' '$' '€' '£' (in this set's box and corners) are added by
// withTextCharacters (characters.ts, symbols.ts)
export const digitsRound: IconSet = withTextCharacters({
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
  pairLayouts: roundPairLayouts,
  spins: roundSpins,
  textLayout: { cellWidth: 10, spacing: 4, baselineY: 19.8, colonDotsY: [7.6, 15.6] },
}, { left: 7, right: 17, top: 4.2, bottom: 19.8, corners: 'round' });
