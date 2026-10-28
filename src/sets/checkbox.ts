// Icon set "checkbox": unchecked, checked, checked-big — Lucide 1.61.0 icons "square", "square-check",
// "square-check-big" (ISC, see LICENSE-lucide). Coordinates below are Lucide's; fromLucide / lucideLength scale them
// into our icon box (more margin, like the digits — see lucide.ts). Built from rounded corners, so `roundness` works.
// Two pieces:
//   piece 1, the box: the same square in unchecked and checked (it doesn't move); checked-big opens its top right
//     corner where the big check leaves the box — both ends of the gap pull back to the gap's edges.
//   piece 2, the check (check-mark.ts, shared with "radio"): drawn in like a pen from unchecked (the user's sketch).
//     (Rejected: a box copy folding into the check — tangled; the check sliding in from the left edge — user: bad.)
import { line, roundedPolygon } from '../geometry.ts';
import type { IconSet, LineStroke, Point, Stroke } from '../types.ts';
import { checkMarkPiece } from './check-mark.ts';
import { fromLucide, LUCIDE_STROKE_WIDTH, lucideLength } from './lucide.ts';

const SQUARE_CORNERS = ([[3, 3], [21, 3], [21, 21], [3, 21]] as Point[]).map(fromLucide);
const LUCIDE_RADIUS = lucideLength(2);

/** square-check-big's box: the square without its top right corner (gap from 17.344,3 to 21,10.656). */
const openBox = (square: Stroke[]): Stroke[] => {
  const [top, , right, bottomRight, bottom, bottomLeft, left, topLeft] = square as [LineStroke, Stroke, LineStroke, ...Stroke[]];
  return [
    line(...fromLucide([21, 10.656]), ...right.to),
    bottomRight, bottom, bottomLeft, left, topLeft,
    line(...top.from, ...fromLucide([17.344, 3])),
  ];
};

// box, checked/unchecked ↔ checked-big: the square laid out so its 12 segments line up with the open box's —
// top (2: the part that stays, the part in the gap), top right corner (2, in the gap), right side (2: in the gap,
// the part that stays), bottom right, bottom, bottom left, left (2), top left — started at the corner's second half.
// The open box gets two zero-length segments at each end of the gap, where the vanishing parts pull back to.
const SQUARE_FOR_OPEN_BOX = { breakpoints: [0, 0.8817, 1, 1.5, 2, 2.404, 3, 4, 5, 6, 6.5, 7, 8], startSegment: 3 };
const OPEN_BOX_FOR_SQUARE = { breakpoints: [0, 0, 0, 1, 2, 3, 4, 4.5, 5, 6, 7, 7, 7] };

/** The check rests (hidden) on the box's left edge. */
const CHECK_PIECE = checkMarkPiece([3, 12]);

const buildCheckboxIcons = (radius: number): IconSet => {
  const square = roundedPolygon(SQUARE_CORNERS, radius);
  return {
    segmentCount: 12,
    strokeWidth: LUCIDE_STROKE_WIDTH,
    lineCap: 'round',
    lineJoin: 'round',
    strokes: { unchecked: square, checked: square, 'checked-big': openBox(square) },
    alternativeStrokes: {},
    pairLayouts: {
      unchecked: { 'checked-big': SQUARE_FOR_OPEN_BOX },
      checked: { 'checked-big': SQUARE_FOR_OPEN_BOX },
      'checked-big': { unchecked: OPEN_BOX_FOR_SQUARE, checked: OPEN_BOX_FOR_SQUARE },
    },
    morePieces: [CHECK_PIECE],
    spins: {},
    withRoundness: (roundness) => buildCheckboxIcons(LUCIDE_RADIUS * roundness),
  };
};

export const checkboxIcons: IconSet = buildCheckboxIcons(LUCIDE_RADIUS);
