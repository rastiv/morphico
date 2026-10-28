// The check mark shared by "checkbox" and "radio" (Lucide 1.61.0 "square-check" / "circle-check" and their "-big"
// versions draw the same checks; ISC, see LICENSE-lucide). Coordinates are Lucide's, scaled by fromLucide.
// Drawn left to right, short stroke then long stroke. unchecked has no check: the check is drawn in like a pen
// writing it — down the short stroke, up the long one (the user's sketch; PairLayout.draw) — and erased back.
import { line } from '../geometry.ts';
import type { PieceSet, Point, Stroke } from '../types.ts';
import { fromLucide } from './lucide.ts';

/** A straight line between two Lucide points, moved into our icon box. */
const lucideLine = (from: Point, to: Point): Stroke => line(...fromLucide(from), ...fromLucide(to));

const CHECK = [lucideLine([8, 12], [10.5, 14.5]), lucideLine([10.5, 14.5], [16, 9])];
const BIG_CHECK = [lucideLine([9, 11], [12, 14]), lucideLine([12, 14], [22, 4])];

// every check ↔ check: short stroke 4 segments, long stroke 8 (of 12), so the corners meet
const CHECK_FOR_CHECK = { breakpoints: [0, 0.25, 0.5, 0.75, 1, 1.125, 1.25, 1.375, 1.5, 1.625, 1.75, 1.875, 2] };
const CHECK_STATES = ['unchecked', 'checked', 'checked-big'];

/**
 * The check piece of a set with the states unchecked, checked, checked-big (12 segments).
 * `hiddenAt`: a Lucide point on the outline at the check's height, where unchecked's check rests at rest
 * (tiny, under the outline's line, so it doesn't show — morphs draw the check instead).
 */
export const checkMarkPiece = (hiddenAt: Point): PieceSet => {
  const [x, y] = hiddenAt;
  return {
    strokes: {
      unchecked: [lucideLine([x, y - 0.1], [x, y]), lucideLine([x, y], [x, y + 0.1])],
      checked: CHECK,
      'checked-big': BIG_CHECK,
    },
    alternativeStrokes: {},
    pairLayouts: {
      ...Object.fromEntries(CHECK_STATES.map((state) =>
        [state, Object.fromEntries(CHECK_STATES.filter((other) => other !== state).map((other) => [other, CHECK_FOR_CHECK]))])),
      unchecked: { checked: { draw: true }, 'checked-big': { draw: true } },
    },
  };
};
