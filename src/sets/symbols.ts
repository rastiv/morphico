// The symbols of the digit sets: `+` `%` `$` `€` `£` (for prices and discounts: `€39.99`, `-20%`). No reference
// images: drawn from each set's own box (where its digits stand) and corner style, so they match the digits — round
// sets (round, slim, handwritten) get elliptical bowls like their 0, 3 and 8; boxy sets (square, condensed) rounded
// corners with the set's radius. Every symbol is at most three pieces: one continuous line each (see characters.ts).
import { cubic, line, roundedPolyline } from '../geometry.ts';
import type { PairLayout, Point, Stroke } from '../types.ts';

/** Where a set's digits stand (middle of the line) and how its corners look. */
export interface SymbolStyle {
  left: number;
  right: number;
  top: number;
  bottom: number;
  /** `'round'` = elliptical bowls; a number = rounded corners with that radius. */
  corners: 'round' | number;
}

/** The pieces of one symbol: piece 1, and the optional pieces 2 and 3 (left out = a copy of piece 1, invisible). */
export type SymbolPieces = [Stroke[], Stroke[]?, Stroke[]?];

/** The symbols of a set, plus alternative tracings (the same look drawn in another order) used by some pairs. */
export interface SymbolDrawings {
  pieces: Record<string, SymbolPieces>;
  firstPieceTracings: Record<string, Stroke[]>;
  secondPieceTracings: Record<string, Stroke[]>;
  thirdPieceTracings: Record<string, Stroke[]>;
}

type PairLayouts = Record<string, Record<string, PairLayout>>;

/**
 * How symbol pairs lay out their pieces (first, second, third piece), from the user's ratings (2026-11-03; pairs rated
 * good use the default and are left out):
 * - `+` → `€` / `£`: the upright bar bends into the C / the £'s line, the cross bar becomes the bar (tracings swap
 *   which of the two pieces draws which bar).
 * - `%` → `$` / `€` / `£`: the slash runs from the top right, where S, C and the £'s hook start; the rings are pressed
 *   flat onto the bars (`flatten`, as digits onto `-`); the lower ring, where `$` / `£` have no bar, is erased like a pen
 *   in the first 60 % (`draw`, as the weather's rays) instead of shrinking into a dot.
 * - `£` ↔ `€`: the £'s base is drawn out to the left first, ending at the right like the C (with `$` it ends at the
 *   left like the S).
 * - `£` / `+` → `€`: both bars of `€` come out of the one bar of `£` / `+` (the crossbar / the cross bar), which
 *   traces its third piece as a hidden copy of that bar (user: the two lines must merge into one; growing out of the
 *   resting point in the middle showed as a blob, drawing the lower bar in like a pen didn't merge).
 */
export const symbolPairLayouts: [PairLayouts, PairLayouts, PairLayouts] = [
  {
    '+': { '€': { tracing: 'plus-upright' }, '£': { tracing: 'plus-upright' } },
    '%': { $: { reversed: true }, '€': { reversed: true }, '£': { reversed: true } },
    '£': { '€': { tracing: 'pound-base-left-first' } },
  },
  {
    '+': { '€': { tracing: 'plus-across' }, '£': { tracing: 'plus-across' } },
    $: { '%': { flatten: true } },
    '€': { '%': { flatten: true } },
    '£': { '%': { flatten: true } },
  },
  {
    '+': { '€': { tracing: 'plus-across' } },
    $: { '%': { draw: 0.6 } },
    '€': { '%': { flatten: true } },
    '£': { '%': { draw: 0.6 }, '€': { tracing: 'pound-crossbar' } },
  },
];

const DEGREE = Math.PI / 180;

/**
 * Part of an ellipse as cubics of at most 90° each. Angles in degrees (0 = right, 90 = down: y points down);
 * `endAngle > startAngle` runs clockwise on screen. Each cubic matches the ellipse at both ends (an exact circle's
 * quarter handles, stretched).
 */
const ellipticArc = (centerX: number, centerY: number, radiusX: number, radiusY: number, startAngle: number, endAngle: number): Stroke[] => {
  const count = Math.max(1, Math.ceil(Math.abs(endAngle - startAngle) / 90 - 1e-9));
  const step = (endAngle - startAngle) / count;
  const handle = (4 / 3) * Math.tan((step * DEGREE) / 4);
  const pointAt = (angle: number): Point => [centerX + radiusX * Math.cos(angle * DEGREE), centerY + radiusY * Math.sin(angle * DEGREE)];
  const directionAt = (angle: number): Point => [-radiusX * Math.sin(angle * DEGREE), radiusY * Math.cos(angle * DEGREE)];
  return Array.from({ length: count }, (_, index) => {
    const from = startAngle + step * index;
    const to = from + step;
    const [startX, startY] = pointAt(from);
    const [endX, endY] = pointAt(to);
    const [startDirectionX, startDirectionY] = directionAt(from);
    const [endDirectionX, endDirectionY] = directionAt(to);
    return cubic(
      startX, startY,
      startX + handle * startDirectionX, startY + handle * startDirectionY,
      endX - handle * endDirectionX, endY - handle * endDirectionY,
      endX, endY,
    );
  });
};

/** A small closed loop (the rings of `%`): a circle, or a rounded box for boxy sets — clockwise from the top. */
const ring = (style: SymbolStyle, centerX: number, centerY: number, radius: number): Stroke[] => {
  if (style.corners === 'round') return ellipticArc(centerX, centerY, radius, radius, -90, 270);
  const corner = Math.min(style.corners, radius);
  const [left, right, top, bottom] = [centerX - radius, centerX + radius, centerY - radius, centerY + radius];
  return roundedPolyline(
    [[centerX, top], [right, top], [right, bottom], [left, bottom], [left, top], [centerX, top]],
    [0, corner, corner, corner, corner, 0],
  );
};

/** `+` `%` `$` `€` `£` drawn in a set's style. */
export const symbolStrokes = (style: SymbolStyle): SymbolDrawings => {
  const { left, right, top, bottom } = style;
  const width = right - left;
  const height = bottom - top;
  const centerX = (left + right) / 2;
  const middleY = (top + bottom) / 2;
  const round = style.corners === 'round';
  /** Corner radius of a boxy set, never more than a box of that size allows. */
  const cornerFor = (boxWidth: number, boxHeight: number) => Math.min(round ? 0 : (style.corners as number), boxWidth / 2, boxHeight / 2);

  // + : the same bar as `-` (so `-` ↔ `+` only stands one bar up), crossed by an upright one of the same length
  const plusAcross = line(9.5, 12, 14.5, 12);
  const plusUpright = line(12, 9.5, 12, 14.5);
  const plus: SymbolPieces = [[plusAcross], [plusUpright]];

  // % : slash from the bottom left to the top right, a ring at the top left and one at the bottom right
  const ringRadius = Math.min(width * 0.2, height * 0.13);
  const percent: SymbolPieces = [
    [line(left + width * 0.08, bottom, right - width * 0.08, top)],
    ring(style, left + ringRadius, top + ringRadius + height * 0.04, ringRadius),
    ring(style, right - ringRadius, bottom - ringRadius - height * 0.04, ringRadius),
  ];

  // $ : an S as tall as the digits, the bar through it a little longer
  const sLeft = left + width * 0.06;
  const sRight = right - width * 0.06;
  const sWidth = sRight - sLeft;
  let dollarS: Stroke[];
  if (round) {
    const quarterHeight = height / 4;
    dollarS = [
      ...ellipticArc(centerX, top + quarterHeight, sWidth / 2, quarterHeight, -30, -270),
      ...ellipticArc(centerX, bottom - quarterHeight, sWidth / 2, quarterHeight, 270, 510),
    ];
  } else {
    const corner = cornerFor(sWidth, height / 2);
    const hook = Math.max(corner, height * 0.15);
    dollarS = roundedPolyline(
      [[sRight, top + hook], [sRight, top], [sLeft, top], [sLeft, middleY], [sRight, middleY], [sRight, bottom], [sLeft, bottom], [sLeft, bottom - hook]],
      [0, corner, corner, corner, corner, corner, corner, 0],
    );
  }
  const dollar: SymbolPieces = [dollarS, [line(centerX, top - 1.2, centerX, bottom + 1.2)]];

  // € : a C opened to the right (moved right a little), two bars sticking out of its left side
  const cLeft = left + width * 0.14;
  let euroC: Stroke[];
  if (round) {
    const radiusX = (right - cLeft) / 2;
    euroC = ellipticArc(cLeft + radiusX, middleY, radiusX, height / 2, -48, -312);
  } else {
    const corner = cornerFor(right - cLeft, height);
    euroC = roundedPolyline([[right, top], [cLeft, top], [cLeft, bottom], [right, bottom]], [0, corner, corner, 0]);
  }
  const barGap = height * 0.12;
  const barEnd = centerX + width * 0.12;
  const euro: SymbolPieces = [
    euroC,
    [line(left - width * 0.06, middleY - barGap, barEnd, middleY - barGap)],
    [line(left - width * 0.06, middleY + barGap, barEnd, middleY + barGap)],
  ];

  // £ : a hook at the top right running into the stem, a base line out to both sides (drawn out to the right and back,
  // the way the S of $ ends, so they morph into each other without twisting; with € the other way round), a crossbar
  const stemX = left + width * 0.3;
  const hookRight = right - width * 0.08;
  const poundLineWithBase = (firstSide: number, secondSide: number): Stroke[] => {
    if (round) {
      const hookRadius = (hookRight - stemX) / 2;
      return [
        ...ellipticArc(stemX + hookRadius, top + hookRadius, hookRadius, hookRadius, 20, -180),
        line(stemX, top + hookRadius, stemX, bottom),
        line(stemX, bottom, firstSide, bottom),
        line(firstSide, bottom, secondSide, bottom),
      ];
    }
    const corner = cornerFor(hookRight - stemX, height / 2);
    const hook = Math.max(corner, height * 0.15);
    return roundedPolyline(
      [[hookRight, top + hook], [hookRight, top], [stemX, top], [stemX, bottom], [firstSide, bottom], [secondSide, bottom]],
      [0, corner, corner, 0, 0, 0],
    );
  };
  const poundLine = poundLineWithBase(right, left);
  const poundCrossbar = line(left + width * 0.05, middleY + height * 0.04, stemX + width * 0.32, middleY + height * 0.04);
  const pound: SymbolPieces = [poundLine, [poundCrossbar]];

  return {
    pieces: { '+': plus, '%': percent, $: dollar, '€': euro, '£': pound },
    firstPieceTracings: { 'plus-upright': [plusUpright], 'pound-base-left-first': poundLineWithBase(left, right) },
    secondPieceTracings: { 'plus-across': [plusAcross] },
    thirdPieceTracings: { 'plus-across': [plusAcross], 'pound-crossbar': [poundCrossbar] },
  };
};
