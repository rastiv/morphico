// Icon set "theme": light (sun), dark (moon) — Lucide 1.61.0 icons "sun", "moon" (ISC, see LICENSE-lucide).
// Coordinates below are Lucide's; lucideLine / lucideArc / lucideCubic scale them into our icon box (see lucide.ts).
// Nine pieces:
//   piece 1: the sun's circle | the moon's crescent — the circle grows into the moon and its top right quarter
//     flattens and caves in evenly into the inner curve (the circle starts where the moon's outer arc starts).
//   pieces 2–9: one ray each | nothing — rays run from their outer end inwards; light → dark: they fly outwards and
//     vanish (erased towards their outer tip, PairLayout.draw — the user's sketch) within the first 60 % of the
//     morph; dark → light: they fly back in during the last 60 %. At rest the moon's ray pieces are tiny lines hidden
//     on its outline.
import { arc, cubic, line } from '../geometry.ts';
import type { IconSet, PieceSet, Stroke } from '../types.ts';
import { fromLucide, LUCIDE_STROKE_WIDTH, lucideLength } from './lucide.ts';

const lucideLine = (fromX: number, fromY: number, toX: number, toY: number): Stroke =>
  line(...fromLucide([fromX, fromY]), ...fromLucide([toX, toY]));
const lucideArc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number): Stroke =>
  arc(...fromLucide([centerX, centerY]), lucideLength(radius), startAngle, endAngle);
const lucideCubic = (...coordinates: [number, number, number, number, number, number, number, number]): Stroke => {
  const [startX, startY, control1X, control1Y, control2X, control2Y, endX, endY] = coordinates;
  return cubic(
    ...fromLucide([startX, startY]), ...fromLucide([control1X, control1Y]),
    ...fromLucide([control2X, control2Y]), ...fromLucide([endX, endY]),
  );
};

/** Lucide "moon": the outer arc clockwise from its right end, the top tip, the inner arc back, the right tip. */
const MOON = [
  lucideArc(11.9981, 12.0009, 9, 3.09, 266.904),
  lucideCubic(11.512, 3.014, 11.917, 2.992, 12.129, 3.474, 11.914, 3.817),
  lucideArc(17.002, 6.997, 6, -147.9941, -302.0059),
  lucideCubic(20.182, 12.085, 20.526, 11.87, 21.007, 12.081, 20.985, 12.486),
];
/** Lucide "sun"'s circle, started at the angle where the moon's outer arc starts. */
const SUN_CIRCLE = [lucideArc(12, 12, 4, 3.09, 363.09)];
/** The share of the circle under the moon's outer arc (3.09° … 266.904°). */
const OUTER_SHARE = (266.904 - 3.09) / 360;
const CIRCLE_FOR_MOON = [
  ...Array.from({ length: 9 }, (_, index) => (index / 8) * OUTER_SHARE),
  ...Array.from({ length: 4 }, (_, index) => OUTER_SHARE + ((index + 1) / 4) * (1 - OUTER_SHARE)),
].map((breakpoint) => +breakpoint.toFixed(4));

/** Lucide "sun"'s rays, each from its outer end inwards (erasing keeps the outer end: the ray flies out). */
const RAYS = [
  lucideLine(12, 2, 12, 4),
  lucideLine(19.07, 4.93, 17.66, 6.34),
  lucideLine(22, 12, 20, 12),
  lucideLine(19.07, 19.07, 17.66, 17.66),
  lucideLine(12, 22, 12, 20),
  lucideLine(4.93, 19.07, 6.34, 17.66),
  lucideLine(2, 12, 4, 12),
  lucideLine(4.93, 4.93, 6.34, 6.34),
];
/** The moon's ray pieces at rest: a tiny line on the bottom of its outline (it doesn't show). */
const HIDDEN_RAY = [lucideLine(11.95, 21, 12.05, 21)];

const rayPiece = (ray: Stroke): PieceSet => ({
  strokes: { light: [ray], dark: HIDDEN_RAY },
  alternativeStrokes: {},
  pairLayouts: { dark: { light: { draw: 0.6 } } },
});

export const themeIcons: IconSet = {
  segmentCount: 12,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  strokes: { light: SUN_CIRCLE, dark: MOON },
  alternativeStrokes: {},
  // even, by hand: the circle's part under the outer arc (263.8°) → 8 equal segments of the outer arc; its top right
  // quarter (96.2°) → 4 equal segments: tip, inner curve (2), tip. (The optimizer's fit made a lumpy notch.)
  pairLayouts: {
    light: { dark: { breakpoints: CIRCLE_FOR_MOON } },
    dark: { light: { breakpoints: [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1, 2, 2.5, 3, 4] } },
  },
  morePieces: RAYS.map(rayPiece),
  spins: {},
};
