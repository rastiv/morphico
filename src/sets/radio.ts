// Icon set "radio": unchecked, checked, checked-big — Lucide 1.61.0 icons "circle", "circle-check",
// "circle-check-big" (ISC, see LICENSE-lucide). Coordinates below are Lucide's; fromLucide / lucideLength scale them
// into our icon box (more margin, like the digits — see lucide.ts). Works like "checkbox", with a circle for the box.
// Two pieces:
//   piece 1, the circle (radius 10 around 12,12): the same full circle in unchecked and checked (it doesn't move);
//     checked-big opens a gap at the top right (from 17,3.335 clockwise round to 21.801,10 is the open arc) where
//     the big check leaves the circle — both ends of the gap pull back to the gap's edges.
//   piece 2, the check (check-mark.ts, shared with "checkbox"): drawn in like a pen from unchecked.
import { arc } from '../geometry.ts';
import type { IconSet } from '../types.ts';
import { checkMarkPiece } from './check-mark.ts';
import { fromLucide, LUCIDE_STROKE_WIDTH, lucideLength } from './lucide.ts';

const [CENTER_X, CENTER_Y] = fromLucide([12, 12]);
const RADIUS = lucideLength(10);
/** The open arc of circle-check-big runs clockwise from 21.801,10 to 17,3.335 (the gap is the rest). */
const OPEN_START_ANGLE = (Math.atan2(10 - 12, 21.801 - 12) * 180) / Math.PI;
const OPEN_END_ANGLE = (Math.atan2(3.335 - 12, 17 - 12) * 180) / Math.PI + 360;
/** The share of the full circle that stays in checked-big. */
const OPEN_SHARE = (OPEN_END_ANGLE - OPEN_START_ANGLE) / 360;

/** The full circle starts where the open arc starts, so the gap is its last part. */
const CIRCLE = [arc(CENTER_X, CENTER_Y, RADIUS, OPEN_START_ANGLE, OPEN_START_ANGLE + 360)];
const OPEN_CIRCLE = [arc(CENTER_X, CENTER_Y, RADIUS, OPEN_START_ANGLE, OPEN_END_ANGLE)];

// circle, unchecked/checked ↔ checked-big: the open part 10 segments, the gap 2 (one per half), started at the gap's
// second half — so it lines up with the open arc, which gets a zero-length segment at each end of the gap where
// the vanishing halves pull back to.
const openPart = Array.from({ length: 11 }, (_, index) => +((index / 10) * OPEN_SHARE).toFixed(4));
const CIRCLE_FOR_OPEN_CIRCLE = { breakpoints: [...openPart, +((1 + OPEN_SHARE) / 2).toFixed(4), 1], startSegment: 11 };
const OPEN_CIRCLE_FOR_CIRCLE = { breakpoints: [0, ...Array.from({ length: 11 }, (_, index) => index / 10), 1] };

export const radioIcons: IconSet = {
  segmentCount: 12,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  strokes: { unchecked: CIRCLE, checked: CIRCLE, 'checked-big': OPEN_CIRCLE },
  alternativeStrokes: {},
  pairLayouts: {
    unchecked: { 'checked-big': CIRCLE_FOR_OPEN_CIRCLE },
    checked: { 'checked-big': CIRCLE_FOR_OPEN_CIRCLE },
    'checked-big': { unchecked: OPEN_CIRCLE_FOR_CIRCLE, checked: OPEN_CIRCLE_FOR_CIRCLE },
  },
  // the check rests (hidden) on the circle's left edge
  morePieces: [checkMarkPiece([2, 12])],
  spins: {},
};
