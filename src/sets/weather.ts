// Icon set "weather": sunny, frosty, partly-cloudy, showers, cloudy, thunder, rain, snow, drizzle — Lucide 1.61.0
// icons "sun", "sun-snow", "cloud-sun", "cloud-sun-rain", "cloud", "cloud-lightning", "cloud-rain", "cloud-snow",
// "cloud-drizzle" (ISC, see LICENSE-lucide). frosty is added last, onto the finished set (withFrosty, at the end).
// Coordinates below are Lucide's; lucideLine / lucideArc scale them into our icon box (see lucide.ts).
// Pieces:
//   sunny ↔ cloudy (experiment, the user's idea for a more realistic look): the cloud crawls in from the left over
//     the sun — it slides in at full size from the box's left side (PairLayout.wipe + slide; its part outside the
//     box doesn't show), and the sun's circle and rays disappear where its front has passed. (Rejected: the cloud
//     standing still, revealed behind the edge — user: even worse.) (Before: sunny's circle inflated into the cloud with the
//     default layout — confirmed "great" by the user — and the rays flew out, `draw: 0.6`.)
//   piece 1, the cloud.
//     sunny → partly-cloudy / showers: the small cloud crawls in from the left like the big one (user's choice; before:
//     it expanded from its bottom left corner — rejected earlier: a circle copy turning into it, drawing it in).
//   piece 2, the sun's circle: in cloudy a copy of the cloud (drawn on top of it, so it doesn't show) — sunny ↔ cloudy
//     morphs it exactly like piece 1. sunny → partly-cloudy: the circle opens behind the cloud — its hidden part pulls
//     back from the middle into both ends of the arc, the arc itself stays.
//   pieces 3–10: one ray each | nothing — rays run from their outer end inwards; sunny → partly-cloudy: the 4 rays partly-cloudy
//     keeps stay, the other 4 fly out. At rest a missing ray is a single point (never drawn, see toPathData).
//   pieces 11–12: showers' rain lines, which are also rain's left and middle line; piece 14: rain's right line —
//     nothing = a single point. partly-cloudy → showers: drawn downwards like a pen, one after the other, while the
//     cloud's bottom opens. cloudy → rain: like cloudy → thunder (the cloud rises and opens), the 3 lines drawn down
//     one after the other, left to right; from partly-cloudy / showers / thunder the same (showers' lines stretch,
//     the bolt is erased); sunny → rain: the cloud crawls in with its rain (its left end carried by the bolt piece).
//   pieces 11, 12, 14 are also snow's top flakes (the top of each rain line), pieces 15–17 its bottom flakes (hidden
//     at the bottom of each rain line in rain): rain → snow: each line shrinks into its top flake while the bottom
//     flake comes out of its lower end. → snow otherwise: the flakes appear one after the other, row by row (ride
//     in with the cloud from sunny).
//   drizzle's 6 short lines sit where snow's flakes are, so they are the same 6 pieces: rain → drizzle: each line
//     shrinks into its short top piece, the bottom piece grows out of its lower end; snow ↔ drizzle: flake ↔ short
//     line (halves, as rain ↔ snow); → drizzle otherwise like → snow (drawn row by row, riding in from sunny).
//   snow and drizzle have rain's cloud: every other piece morphs exactly like rain's (withRainTwins).
// The rules of this set (the user's): sun → any cloud = the cloud crawls in from the left and covers the sun;
//   partly-cloudy / showers → a cloud without sun = like → cloudy (the sun erased back down).
//   piece 13: the lightning bolt | nothing (a single point) — cloudy → thunder: the cloud rises a little and opens
//     at the bottom (like cloudy → showers), the bolt strikes down from it like a pen. partly-cloudy / showers →
//     thunder: like → cloudy (the cloud grows, the sun is erased back down), plus the bolt (and showers' rain erased).
//     sunny → thunder: the cloud crawls in like sunny → cloudy, the bolt rides with it. The open cloud's lower left
//     end curls back right, so during the crawl it is carried by the first rain piece (else it would poke out of the
//     box's left side): piece 1 is laid out without it — together they look the same.
//   showers otherwise morphs like partly-cloudy (sunny: the cloud crawls in, the circle opens; cloudy: the cloud
//     shrinks and opens, the sun is drawn in), plus the rain: drawn down, or (from sunny) riding in with the cloud.
import { arc, defaultBreakpoints, line, piecesOf, reversedStroke } from '../geometry.ts';
import type { IconSet, LineStroke, PairLayout, PieceSet, Point, Stroke } from '../types.ts';
import { fromLucide, LUCIDE_STROKE_WIDTH, lucideLength } from './lucide.ts';

const lucideLine = (fromX: number, fromY: number, toX: number, toY: number): Stroke =>
  line(...fromLucide([fromX, fromY]), ...fromLucide([toX, toY]));
const lucideArc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number): Stroke =>
  arc(...fromLucide([centerX, centerY]), lucideLength(radius), startAngle, endAngle);

/** Lucide "cloud", clockwise from the bottom right: bottom line, big bump, top line, right bump. */
const CLOUD = [
  lucideLine(17.5, 19, 9, 19),
  lucideArc(9.0018, 12, 7, 90.0147, 343.3984),
  lucideLine(15.71, 10, 17.5, 10),
  lucideArc(17.5, 14.5, 4.5, -90, 90),
];
/** sunny → partly-cloudy / showers: the small cloud (and its rain) crawls in a bit later (user's request). */
const SMALL_CLOUD_CRAWL: [number, number] = [0.4, 1];
/** CLOUD traced from its leftmost point (sunny ↔ cloudy: it slides in from the left, its left side shows last). */
const CLOUD_FROM_LEFT = [
  lucideArc(9.0018, 12, 7, 180, 343.3984),
  ...CLOUD.slice(2),
  CLOUD[0],
  lucideArc(9.0018, 12, 7, 90.0147, 180),
];
/** The sun's circle traced from its leftmost point (sunny ↔ cloudy: the wiping edge reaches it first). */
const CIRCLE_FROM_LEFT = [lucideArc(12, 12, 4, 180, 540)];
/** A wipe's piece laid out along an alternative tracing with the default spread. */
const tracedForWipe = (tracing: string, strokes: Stroke[]) => ({ tracing, breakpoints: defaultBreakpoints(strokes, 12) });

/** The angle (from the icon centre) where the cloud starts, so the circle starts in the same direction. */
const CIRCLE_START = 51.84;
/** Lucide "sun"'s circle, clockwise from CIRCLE_START. */
const SUN_CIRCLE = [lucideArc(12, 12, 4, CIRCLE_START, CIRCLE_START + 360)];

/** Lucide "cloud-sun"'s small cloud, clockwise from the bottom right (the same build as CLOUD). */
const SMALL_CLOUD = [
  lucideLine(13, 22, 7, 22),
  lucideArc(7.001, 17, 5, 90.0117, 348.463),
  lucideLine(11.9, 16, 13, 16),
  lucideArc(13, 19, 3, -90, 90),
];
/** SMALL_CLOUD traced from its leftmost point (sunny ↔ partly-cloudy: it slides in like the big cloud). */
const SMALL_CLOUD_FROM_LEFT = [
  lucideArc(7.001, 17, 5, 180, 348.463),
  ...SMALL_CLOUD.slice(2),
  SMALL_CLOUD[0],
  lucideArc(7.001, 17, 5, 90.0117, 180),
];
/** Lucide "cloud-sun-rain"'s cloud: SMALL_CLOUD open at the bottom (where the rain falls), from its lower left end. */
const OPEN_SMALL_CLOUD = [
  lucideArc(7.0014, 17.0019, 5, 143.1569, 348.4412),
  lucideLine(11.9, 16, 13, 16),
  lucideArc(13.0044, 19, 3, -90.0842, 48.3025),
];
/** Where SMALL_CLOUD's gap (bottom) has its middle: the gap's two halves pull back into its ends from here. */
const GAP_MIDDLE_X = 8.77;
// partly-cloudy ↔ showers: the closed cloud traced from the gap's middle — 2 segments to the gap's left end, the open
// cloud's part (4 along the big bump, 1 top line, 3 along the right bump), 2 back to the middle; the open cloud gets
// 2 zero-length segments at each end.
const CLOSED_FOR_OPEN = {
  tracing: 'small-cloud-from-gap-middle',
  breakpoints: [0, 1, 1.2057, 1.4043, 1.6029, 1.8014, 2, 3, 3.2561, 3.5122, 3.7683, 4, 5],
};
const OPEN_FOR_CLOSED = { breakpoints: [0, 0, 0, 0.25, 0.5, 0.75, 1, 2, 2.3333, 2.6667, 3, 3, 3] };
/** The same gap on the big CLOUD (its bottom, from 143.16° on the big bump to 48.3° on the right bump). */
const BIG_GAP_MIDDLE_X = 11.65;
// cloudy ↔ showers: the big cloud traced from its gap's middle, split like CLOSED_FOR_OPEN — it shrinks and opens
const BIG_CLOSED_FOR_OPEN = {
  tracing: 'cloud-from-gap-middle',
  breakpoints: [0, 1, 1.2097, 1.4073, 1.6049, 1.8024, 2, 3, 3.2561, 3.5122, 3.7683, 4, 5],
};

/** Lucide "cloud-lightning"'s cloud: CLOUD 2 units higher, open at the bottom (where the bolt strikes), from its
 * lower left end. */
const THUNDER_CLOUD = [
  lucideArc(9.0026, 10.0027, 7, 115.4004, 343.3756),
  lucideLine(15.71, 8, 17.5, 8),
  lucideArc(17.5079, 12.5, 4.5, -90.1, 83.7212),
];
/** The middle of CLOUD's part that is missing in THUNDER_CLOUD (its bottom, from 115.4° to 83.7°). */
const THUNDER_GAP_MIDDLE_X = 11.94;
// cloudy ↔ thunder: CLOUD traced from that middle — 2 segments to the gap's left end, 4 along the big bump, 1 top line,
// 3 along the right bump, 2 back to the middle; the open cloud gets 2 zero-length segments at each end (OPEN_FOR_CLOSED).
const CLOUD_FROM_THUNDER_GAP_MIDDLE = [
  lucideLine(THUNDER_GAP_MIDDLE_X, 19, 9, 19),
  ...CLOUD.slice(1),
  lucideLine(17.5, 19, THUNDER_GAP_MIDDLE_X, 19),
];
const CLOUD_FOR_THUNDER = {
  tracing: 'cloud-from-thunder-gap-middle',
  breakpoints: [0, 1, 1.1002, 1.3252, 1.5501, 1.7751, 2, 3, 3.3217, 3.6434, 3.9651, 4, 5],
};
/** sunny ↔ thunder: THUNDER_CLOUD split at its leftmost point — the rest (from there over the top), and its lower
 * left end (from there down), each running away from the left side so the crawl shows one stretch of it. */
const THUNDER_CLOUD_FROM_LEFT = [
  lucideArc(9.0026, 10.0027, 7, 180, 343.3756),
  ...THUNDER_CLOUD.slice(1),
];
const THUNDER_CLOUD_LEFT_END = [lucideArc(9.0026, 10.0027, 7, 180, 115.4004)];
/** Lucide "cloud-lightning"'s bolt, from the top down. */
const BOLT = [lucideLine(13, 12, 10, 17), lucideLine(10, 17, 14, 17), lucideLine(14, 17, 11, 22)];
/** cloudy → thunder: the bolt strikes in the second half of the morph. */
const BOLT_DRAWN: [number, number] = [0.5, 0.85];

/** Lucide "cloud-rain"'s cloud (also "cloud-snow", "cloud-drizzle"): THUNDER_CLOUD with a wider gap, from its lower
 * left end. */
const RAIN_CLOUD = [
  lucideArc(9.0026, 10.0027, 7, 135.615, 343.3757),
  lucideLine(15.71, 8, 17.5, 8),
  lucideArc(17.5005, 12.5, 4.5, -90.0065, 56.2589),
];
/** The middle of CLOUD's part that is missing in RAIN_CLOUD (its bottom, from 135.6° to 56.3°). */
const RAIN_GAP_MIDDLE_X = 11.79;
const CLOUD_FROM_RAIN_GAP_MIDDLE = [
  lucideLine(RAIN_GAP_MIDDLE_X, 19, 9, 19),
  ...CLOUD.slice(1),
  lucideLine(17.5, 19, RAIN_GAP_MIDDLE_X, 19),
];
// cloudy ↔ rain: split like CLOUD_FOR_THUNDER (2 | 4 big bump | 1 | 3 right bump | 2), RAIN_CLOUD with OPEN_FOR_CLOSED
const CLOUD_FOR_RAIN = {
  tracing: 'cloud-from-rain-gap-middle',
  breakpoints: [0, 1, 1.18, 1.385, 1.59, 1.795, 2, 3, 3.2709, 3.5417, 3.8126, 4, 5],
};
/** sunny ↔ rain: RAIN_CLOUD split at its leftmost point, like THUNDER_CLOUD_FROM_LEFT / THUNDER_CLOUD_LEFT_END. */
const RAIN_CLOUD_FROM_LEFT = [lucideArc(9.0026, 10.0027, 7, 180, 343.3757), ...RAIN_CLOUD.slice(1)];
const RAIN_CLOUD_LEFT_END = [lucideArc(9.0026, 10.0027, 7, 180, 135.615)];
/** Lucide "cloud-rain"'s lines, left to right, each from the top down. */
const HEAVY_RAIN_LINES = [lucideLine(8, 14, 8, 20), lucideLine(12, 16, 12, 22), lucideLine(16, 14, 16, 20)];
/** cloudy → rain: the lines are drawn one after the other. */
const HEAVY_RAIN_DRAWN: [number, number][] = [[0.45, 0.8], [0.55, 0.9], [0.65, 1]]; // once the bottom has opened

/** Lucide "cloud-snow"'s flake centres for the pieces 11, 12, 14 (top flakes) and 15, 16, 17 (bottom flakes). */
const SNOWFLAKE_CENTERS: Point[] = [[8, 15], [12, 17], [16, 15], [8, 19], [12, 21], [16, 19]];
/**
 * Lucide draws a flake as a dot (a tiny round-capped line, as wide as the line). Ours are a little bigger so they
 * show at small sizes (user's request): a tiny closed octagon of this radius, which the thick line fills in.
 */
const SNOWFLAKE_RADIUS = 0.25;
const SNOWFLAKES = SNOWFLAKE_CENTERS.map(([centerX, centerY]) => {
  // clockwise from the top corner
  const corners = Array.from({ length: 8 }, (_, index): Point => [
    centerX + SNOWFLAKE_RADIUS * Math.cos(((index - 2) * Math.PI) / 4),
    centerY + SNOWFLAKE_RADIUS * Math.sin(((index - 2) * Math.PI) / 4),
  ]);
  return corners.map((corner, index) => lucideLine(...corner, ...corners[(index + 1) % 8]));
});
// line → flake (rain / showers → snow): the line traced down and back up, its down pass ↔ the flake's right half, its
// up pass ↔ the left half — the line narrows into the flake (segment by segment the octagon's corners zigzag)
const LINE_OUT_AND_BACK = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((index) => +(index / 6).toFixed(4));
const FLAKE_IN_HALVES = { breakpoints: [0, 0.5, 1, 2, 3, 3.5, 4, 4.5, 5, 6, 7, 7.5, 8] };
const outAndBack = (stroke: Stroke) => [stroke, reversedStroke(stroke)];
/** → snow / drizzle: when each flake / short line appears (row by row: 8,15 · 16,15 · 12,17 · 8,19 · 16,19 · 12,21). */
const SNOWFLAKE_STARTS = [0.45, 0.59, 0.52, 0.66, 0.8, 0.73];
const fallingDrawn = (flakeIndex: number) => ({ draw: [SNOWFLAKE_STARTS[flakeIndex], SNOWFLAKE_STARTS[flakeIndex] + 0.1] as [number, number] });
/** Lucide "cloud-drizzle"'s short lines (top down), in the order of the flakes (each one where a flake is). */
const DRIZZLE_LINES = [[8, 14], [12, 16], [16, 14], [8, 19], [12, 21], [16, 19]]
  .map(([x, y]) => lucideLine(x, y, x, y + 1));
type PairLayouts = PieceSet['pairLayouts'];
/** Pair layouts of several groups put together (per state). */
const mergePairLayouts = (...groups: PairLayouts[]): PairLayouts => {
  const merged: PairLayouts = {};
  for (const group of groups) {
    for (const [state, byOtherState] of Object.entries(group)) merged[state] = { ...merged[state], ...byOtherState };
  }
  return merged;
};
/** The drizzle pairs of precipitation piece `fallingIndex` (0…5) — showers' own lines (0, 1) just shorten. */
const drizzlePairLayouts = (fallingIndex: number, hasShowersLine: boolean): PairLayouts => ({
  ...Object.fromEntries(['cloudy', 'partly-cloudy', 'thunder', ...(hasShowersLine ? [] : ['showers'])]
    .map((state) => [state, { drizzle: fallingDrawn(fallingIndex) }])),
  sunny: { drizzle: RIDING_IN },
  snow: { drizzle: FLAKE_IN_HALVES },
  drizzle: { snow: { tracing: 'drizzle-line-out-and-back', breakpoints: LINE_OUT_AND_BACK } },
});

/** sunny → rain / snow: the precipitation rides in with the crawling cloud. */
const RIDING_IN = { wipe: 'right', slide: true } as const;

/** Lucide "cloud-sun-rain"'s rain lines, each from the top down. */
const RAIN_LINES = [lucideLine(7, 19, 7, 21), lucideLine(11, 20, 11, 22)];
/** partly-cloudy → showers: the rain lines are drawn one after the other while the cloud opens. */
const RAIN_DRAWN: [number, number][] = [[0.35, 0.75], [0.55, 0.95]];

/** Lucide "cloud-sun"'s sun: the part of the circle above the cloud, clockwise from its left end. */
const SUN_ARC = [lucideArc(12.0004, 11.9985, 4, -119.6437, 9.3742)];
/** The middle of the sun's hidden part (behind the cloud), from where it pulls back into both ends of SUN_ARC. */
const HIDDEN_MIDDLE = (9.3742 + 240.3563) / 2;

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
/** A missing piece at rest: a single point (never drawn), here on the cloud's bottom line. */
const pointAt = (x: number, y: number): Stroke[] => [lucideLine(x, y, x, y)];
const HIDDEN_RAY = pointAt(13, 19);
/** partly-cloudy's and showers' missing rays (bottom right, bottom, bottom left, left). */
const HIDDEN_RAY_PARTLY = pointAt(10, 22);
const MISSING_RAYS_PARTLY = [3, 4, 5, 6];

// sunny ↔ partly-cloudy, the sun's circle: traced from the middle of the hidden part, 4 segments to the arc's left
// end, 4 along the arc (it stays), 4 back to the middle; the arc gets 4 zero-length segments at each end.
const ARC_SHARE = (9.3742 + 119.6437) / 360;
const CIRCLE_FOR_SUN_ARC = {
  tracing: 'circle-from-hidden-middle',
  breakpoints: [
    ...[0, 1, 2, 3].map((index) => (index / 4) * ((1 - ARC_SHARE) / 2)),
    ...[0, 1, 2, 3].map((index) => (1 - ARC_SHARE) / 2 + (index / 4) * ARC_SHARE),
    ...[0, 1, 2, 3, 4].map((index) => (1 + ARC_SHARE) / 2 + (index / 4) * ((1 - ARC_SHARE) / 2)),
  ].map((breakpoint) => +breakpoint.toFixed(4)),
};
const SUN_ARC_FOR_CIRCLE = { breakpoints: [0, 0, 0, 0, 0, 0.25, 0.5, 0.75, 1, 1, 1, 1, 1] };

// cloudy → partly-cloudy: the sun is drawn like a pen from the arc's lower right end up over the top (the user's
// direction), and the kept rays follow one after another, each growing out from the sun when the pen passes it.
const SUN_ARC_DRAWN: [number, number] = [0.45, 0.85]; // after the cloud has shrunk away from the arc's start
const RAY_DRAW_DURATION = 0.15;
/** Kept rays → how far along the arc (from its lower right end, 0…1) the pen is when the ray starts. */
const KEPT_RAY_PEN_POSITIONS: Record<number, number> = { 2: 0.07, 1: 0.42, 0: 0.77, 7: 1 };
const rayDrawnAfterPen = (penPosition: number): [number, number] => {
  const start = SUN_ARC_DRAWN[0] + penPosition * (SUN_ARC_DRAWN[1] - SUN_ARC_DRAWN[0]);
  return [+start.toFixed(4), +Math.min(start + RAY_DRAW_DURATION, 1).toFixed(4)];
};

/** States drawn with rain's cloud: apart from the precipitation they morph exactly like rain. */
const RAIN_TWINS = ['snow', 'drizzle'];
/** A piece that is the same in rain and its twins: the twins get rain's strokes and pair layouts. */
const withRainTwins = <Piece extends PieceSet>(pieceSet: Piece): Piece => {
  const pairLayouts = Object.fromEntries(Object.entries(pieceSet.pairLayouts).map(([state, layouts]) =>
    [state, { ...layouts, ...(layouts.rain ? Object.fromEntries(RAIN_TWINS.map((twin) => [twin, layouts.rain])) : {}) }]));
  for (const twin of RAIN_TWINS) if (pieceSet.pairLayouts.rain) pairLayouts[twin] = pieceSet.pairLayouts.rain;
  return {
    ...pieceSet,
    strokes: { ...pieceSet.strokes, ...Object.fromEntries(RAIN_TWINS.map((twin) => [twin, pieceSet.strokes.rain])) },
    pairLayouts,
  };
};

const sunCirclePiece: PieceSet = {
  strokes: { sunny: SUN_CIRCLE, cloudy: CLOUD, 'partly-cloudy': SUN_ARC, showers: SUN_ARC, thunder: THUNDER_CLOUD, rain: RAIN_CLOUD },
  alternativeStrokes: {
    'cloud-from-rain-gap-middle': CLOUD_FROM_RAIN_GAP_MIDDLE,
    'cloud-from-thunder-gap-middle': CLOUD_FROM_THUNDER_GAP_MIDDLE,
    'circle-from-hidden-middle': [lucideArc(12, 12, 4, HIDDEN_MIDDLE, HIDDEN_MIDDLE + 360)],
    'circle-from-left': CIRCLE_FROM_LEFT,
  },
  pairLayouts: {
    sunny: {
      cloudy: tracedForWipe('circle-from-left', CIRCLE_FROM_LEFT),
      thunder: tracedForWipe('circle-from-left', CIRCLE_FROM_LEFT),
      rain: tracedForWipe('circle-from-left', CIRCLE_FROM_LEFT),
      'partly-cloudy': CIRCLE_FOR_SUN_ARC,
      showers: CIRCLE_FOR_SUN_ARC,
    },
    cloudy: {
      sunny: { wipe: 'left' },
      'partly-cloudy': { draw: SUN_ARC_DRAWN },
      showers: { draw: SUN_ARC_DRAWN },
      thunder: CLOUD_FOR_THUNDER,
      rain: CLOUD_FOR_RAIN,
    },
    rain: {
      cloudy: OPEN_FOR_CLOSED,
      sunny: { wipe: 'left' },
      'partly-cloudy': { draw: SUN_ARC_DRAWN },
      showers: { draw: SUN_ARC_DRAWN },
    },
    'partly-cloudy': { sunny: SUN_ARC_FOR_CIRCLE, cloudy: { reversed: true }, thunder: { reversed: true }, rain: { reversed: true } },
    showers: { sunny: SUN_ARC_FOR_CIRCLE, cloudy: { reversed: true }, thunder: { reversed: true }, rain: { reversed: true } },
    // the sun goes like → cloudy: crawled over from sunny, erased back down from partly-cloudy / showers
    thunder: { cloudy: OPEN_FOR_CLOSED, sunny: { wipe: 'left' }, 'partly-cloudy': { draw: SUN_ARC_DRAWN }, showers: { draw: SUN_ARC_DRAWN } },
  },
};

const rayPiece = (ray: Stroke, rayIndex: number): PieceSet => {
  const missingInPartly = MISSING_RAYS_PARTLY.includes(rayIndex);
  return {
    strokes: {
      sunny: [ray],
      cloudy: HIDDEN_RAY,
      'partly-cloudy': missingInPartly ? HIDDEN_RAY_PARTLY : [ray],
      showers: missingInPartly ? HIDDEN_RAY_PARTLY : [ray],
      thunder: HIDDEN_RAY,
      rain: HIDDEN_RAY,
    },
    alternativeStrokes: {},
    pairLayouts: {
      cloudy: { sunny: { wipe: 'left' } },
      thunder: { sunny: { wipe: 'left' } },
      rain: { sunny: { wipe: 'left' } },
      ...(missingInPartly
        ? { 'partly-cloudy': { sunny: { draw: 0.6 } }, showers: { sunny: { draw: 0.6 } } }
        // drawn from the sun outwards (the rays run outer end → inner end, so reversed)
        : {
          cloudy: {
            sunny: { wipe: 'left' },
            'partly-cloudy': { draw: rayDrawnAfterPen(KEPT_RAY_PEN_POSITIONS[rayIndex]) },
            showers: { draw: rayDrawnAfterPen(KEPT_RAY_PEN_POSITIONS[rayIndex]) },
          },
          thunder: {
            sunny: { wipe: 'left' },
            'partly-cloudy': { draw: rayDrawnAfterPen(KEPT_RAY_PEN_POSITIONS[rayIndex]) },
            showers: { draw: rayDrawnAfterPen(KEPT_RAY_PEN_POSITIONS[rayIndex]) },
          },
          rain: {
            sunny: { wipe: 'left' },
            'partly-cloudy': { draw: rayDrawnAfterPen(KEPT_RAY_PEN_POSITIONS[rayIndex]) },
            showers: { draw: rayDrawnAfterPen(KEPT_RAY_PEN_POSITIONS[rayIndex]) },
          },
          'partly-cloudy': { cloudy: { reversed: true }, thunder: { reversed: true }, rain: { reversed: true } },
          showers: { cloudy: { reversed: true }, thunder: { reversed: true }, rain: { reversed: true } },
        }),
    },
  };
};

/** Showers' rain line (if it has one) | rain's line: pieces 11, 12 (both) and 14 (rain only). */
const rainPiece = (heavyRainLine: Stroke, rainIndex: number): PieceSet => {
  const showersLine: Stroke | undefined = RAIN_LINES[rainIndex];
  const top = ((showersLine ?? heavyRainLine) as LineStroke).from;
  const nothing = [line(...top, ...top)];
  const carriesCloudEnd = rainIndex === 0;
  return {
    strokes: {
      sunny: nothing,
      cloudy: nothing,
      'partly-cloudy': nothing,
      showers: showersLine ? [showersLine] : nothing,
      thunder: nothing,
      rain: [heavyRainLine],
      snow: SNOWFLAKES[rainIndex],
      drizzle: [DRIZZLE_LINES[rainIndex]],
    },
    alternativeStrokes: {
      ...(carriesCloudEnd ? { 'thunder-cloud-left-end': THUNDER_CLOUD_LEFT_END } : {}),
      'rain-line-out-and-back': outAndBack(heavyRainLine),
      'drizzle-line-out-and-back': outAndBack(DRIZZLE_LINES[rainIndex]),
      ...(showersLine ? { 'showers-line-out-and-back': outAndBack(showersLine) } : {}),
    },
    pairLayouts: mergePairLayouts(drizzlePairLayouts(rainIndex, Boolean(showersLine)), showersLine
      ? {
        cloudy: { showers: { draw: RAIN_DRAWN[rainIndex] }, rain: { draw: HEAVY_RAIN_DRAWN[rainIndex] }, snow: fallingDrawn(rainIndex) },
        'partly-cloudy': {
          showers: { draw: RAIN_DRAWN[rainIndex] },
          rain: { draw: HEAVY_RAIN_DRAWN[rainIndex] },
          snow: fallingDrawn(rainIndex),
        },
        // sunny → showers / rain: the rain rides in with the crawling cloud; sunny → thunder: it carries the cloud's
        // left end
        sunny: {
          showers: { wipe: 'right', slide: true, draw: SMALL_CLOUD_CRAWL },
          rain: RIDING_IN,
          snow: RIDING_IN,
          ...(carriesCloudEnd ? { thunder: RIDING_IN } : {}),
        },
        // showers → thunder: erased back up; thunder → rain: drawn down
        thunder: {
          showers: { draw: RAIN_DRAWN[rainIndex] },
          rain: { draw: HEAVY_RAIN_DRAWN[rainIndex] },
          snow: fallingDrawn(rainIndex),
          ...(carriesCloudEnd ? { sunny: tracedForWipe('thunder-cloud-left-end', THUNDER_CLOUD_LEFT_END) } : {}),
        },
        rain: { snow: { tracing: 'rain-line-out-and-back', breakpoints: LINE_OUT_AND_BACK } },
        showers: { snow: { tracing: 'showers-line-out-and-back', breakpoints: LINE_OUT_AND_BACK } },
        snow: { rain: FLAKE_IN_HALVES, showers: FLAKE_IN_HALVES },
      }
      : {
        ...Object.fromEntries(['cloudy', 'partly-cloudy', 'showers', 'thunder']
          .map((state) => [state, { rain: { draw: HEAVY_RAIN_DRAWN[rainIndex] }, snow: fallingDrawn(rainIndex) }])),
        sunny: { rain: RIDING_IN, snow: RIDING_IN },
        rain: { snow: { tracing: 'rain-line-out-and-back', breakpoints: LINE_OUT_AND_BACK } },
        snow: { rain: FLAKE_IN_HALVES },
      }),
  };
};

/** Snow's bottom flakes / drizzle's bottom lines (pieces 15–17): in rain hidden at the bottom of its line, so
 * rain → snow / drizzle pulls them out of it. */
const bottomFlakePiece = (flakeIndex: number): PieceSet => {
  const nothing = pointAt(...SNOWFLAKE_CENTERS[flakeIndex]);
  const [lineBottomX, lineBottomY] = (HEAVY_RAIN_LINES[flakeIndex - 3] as LineStroke).to;
  return {
    strokes: {
      sunny: nothing,
      cloudy: nothing,
      'partly-cloudy': nothing,
      showers: nothing,
      thunder: nothing,
      rain: [line(lineBottomX, lineBottomY, lineBottomX, lineBottomY)],
      snow: SNOWFLAKES[flakeIndex],
      drizzle: [DRIZZLE_LINES[flakeIndex]],
    },
    alternativeStrokes: { 'drizzle-line-out-and-back': outAndBack(DRIZZLE_LINES[flakeIndex]) },
    pairLayouts: mergePairLayouts(drizzlePairLayouts(flakeIndex, false), {
      ...Object.fromEntries(['cloudy', 'partly-cloudy', 'showers', 'thunder'].map((state) => [state, { snow: fallingDrawn(flakeIndex) }])),
      sunny: { snow: RIDING_IN },
    }),
  };
};

const boltTop = pointAt(13, 12);
const boltPiece: PieceSet = {
  strokes: { sunny: boltTop, cloudy: boltTop, 'partly-cloudy': boltTop, showers: boltTop, thunder: BOLT, rain: boltTop },
  // (snow: like rain, withRainTwins)
  alternativeStrokes: { 'rain-cloud-left-end': RAIN_CLOUD_LEFT_END },
  pairLayouts: {
    cloudy: { thunder: { draw: BOLT_DRAWN } },
    'partly-cloudy': { thunder: { draw: BOLT_DRAWN } },
    showers: { thunder: { draw: BOLT_DRAWN } },
    // thunder → rain: pulled back up into the cloud
    rain: { thunder: { draw: BOLT_DRAWN }, sunny: tracedForWipe('rain-cloud-left-end', RAIN_CLOUD_LEFT_END) },
    // rides in with the crawling cloud; sunny → rain: carries the rain cloud's left end
    sunny: { thunder: { wipe: 'right', slide: true }, rain: { wipe: 'right', slide: true } },
  },
};

const rainTwinnedIcons: IconSet = withRainTwins({
  segmentCount: 12,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  strokes: {
    sunny: SUN_CIRCLE,
    cloudy: CLOUD,
    'partly-cloudy': SMALL_CLOUD,
    showers: OPEN_SMALL_CLOUD,
    thunder: THUNDER_CLOUD,
    rain: RAIN_CLOUD,
  },
  alternativeStrokes: {
    'cloud-from-rain-gap-middle': CLOUD_FROM_RAIN_GAP_MIDDLE,
    'cloud-from-thunder-gap-middle': CLOUD_FROM_THUNDER_GAP_MIDDLE,
    'thunder-cloud-from-left': THUNDER_CLOUD_FROM_LEFT,
    'rain-cloud-from-left': RAIN_CLOUD_FROM_LEFT,
    'cloud-from-left': CLOUD_FROM_LEFT,
    'small-cloud-from-left': SMALL_CLOUD_FROM_LEFT,
    'cloud-from-gap-middle': [
      lucideLine(BIG_GAP_MIDDLE_X, 19, 9, 19),
      ...CLOUD.slice(1),
      lucideLine(17.5, 19, BIG_GAP_MIDDLE_X, 19),
    ],
    'small-cloud-from-gap-middle': [
      lucideLine(GAP_MIDDLE_X, 22, 7, 22),
      ...SMALL_CLOUD.slice(1),
      lucideLine(13, 22, GAP_MIDDLE_X, 22),
    ],
  },
  pairLayouts: {
    // every cloud crawls in from the left over the sun
    sunny: {
      cloudy: { wipe: 'right', slide: true },
      'partly-cloudy': { wipe: 'right', slide: true, draw: SMALL_CLOUD_CRAWL },
      showers: { wipe: 'right', slide: true, draw: SMALL_CLOUD_CRAWL },
      thunder: { wipe: 'right', slide: true },
      rain: { wipe: 'right', slide: true },
    },
    cloudy: { sunny: tracedForWipe('cloud-from-left', CLOUD_FROM_LEFT), showers: BIG_CLOSED_FOR_OPEN, thunder: CLOUD_FOR_THUNDER, rain: CLOUD_FOR_RAIN },
    'partly-cloudy': {
      sunny: tracedForWipe('small-cloud-from-left', SMALL_CLOUD_FROM_LEFT),
      showers: CLOSED_FOR_OPEN,
      thunder: CLOSED_FOR_OPEN,
      rain: CLOSED_FOR_OPEN,
    },
    showers: { 'partly-cloudy': OPEN_FOR_CLOSED, cloudy: OPEN_FOR_CLOSED },
    rain: {
      cloudy: OPEN_FOR_CLOSED,
      'partly-cloudy': OPEN_FOR_CLOSED,
      sunny: tracedForWipe('rain-cloud-from-left', RAIN_CLOUD_FROM_LEFT),
    },
    thunder: {
      cloudy: OPEN_FOR_CLOSED,
      'partly-cloudy': OPEN_FOR_CLOSED,
      sunny: tracedForWipe('thunder-cloud-from-left', THUNDER_CLOUD_FROM_LEFT),
    },
  },
  morePieces: [
    ...[sunCirclePiece, ...RAYS.map(rayPiece)].map(withRainTwins),
    ...HEAVY_RAIN_LINES.slice(0, 2).map(rainPiece),
    withRainTwins(boltPiece),
    rainPiece(HEAVY_RAIN_LINES[2], 2),
    ...[3, 4, 5].map(bottomFlakePiece),
  ],
  spins: {},
});

// ---- frosty (Lucide "sun-snow"): half a small sun on the left, half a snowflake on the right ----
// sunny ↔ frosty: the sun shrinks to its left half (its right half pulls back into the half's ends) while a copy of
//   that right half (the bolt piece) straightens into the snowflake's spine; the 3 right rays bend into its branches,
//   the other 5 move to frosty's shorter rays.
// frosty → any cloud state (the set's rule): the cloud crawls in from the left and covers everything (the rain etc.
//   rides along). A wipe needs every piece to show one stretch, so during the crawl the half sun's upper quarter and
//   the spine (4 x-monotone parts) are carried by 6 spare pieces (a single point at rest, in every state); the 6th
//   carries the open clouds' lower left end. frosty ↔ partly-cloudy / showers: the half sun becomes their sun arc,
//   the kept rays move, the rest is covered.

/** frosty's half sun, clockwise from its bottom (Lucide: centre 10,12, radius 3). */
const HALF_SUN = [lucideArc(10, 12, 3, 90, 270)];
/** For the crawl: from its leftmost point down / up (each one stretch for the wipe). */
const HALF_SUN_LOWER = [lucideArc(10, 12, 3, 180, 90)];
const HALF_SUN_UPPER = [lucideArc(10, 12, 3, 180, 270)];
/** frosty's rays by ray piece (outer end first), the right three bent into the snowflake's branches. */
const FROSTY_RAYS: Stroke[][] = [
  [lucideLine(10, 3, 10, 4)],
  [lucideLine(18, 6, 15.25, 6.5), lucideLine(15.25, 6.5, 14, 4)],
  [lucideLine(20, 10, 18.5, 12), lucideLine(18.5, 12, 20, 14)],
  [lucideLine(18, 18, 15.25, 17.5), lucideLine(15.25, 17.5, 14, 20)],
  [lucideLine(10, 21, 10, 20)],
  [lucideLine(3.64, 18.36, 4.34, 17.66)],
  [lucideLine(2, 12, 3, 12)],
  [lucideLine(3.64, 5.64, 4.34, 6.34)],
];
/** The snowflake's spine as one line: upper arm, out along the middle arm and back, lower arm. */
const SPINE = [
  lucideLine(17, 3, 14, 9), lucideLine(14, 9, 15.5, 12), lucideLine(15.5, 12, 22, 12),
  lucideLine(22, 12, 15.5, 12), lucideLine(15.5, 12, 14, 15), lucideLine(14, 15, 17, 21),
];
/** The spine in parts that each run one way across (for the crawl). */
const SPINE_PARTS = [
  [lucideLine(17, 3, 14, 9)],
  [lucideLine(14, 9, 15.5, 12), lucideLine(15.5, 12, 22, 12)],
  [lucideLine(14, 15, 15.5, 12)],
  [lucideLine(14, 15, 17, 21)],
];

// sunny ↔ frosty: the circle traced from its right point — 3 segments of its lower right quarter pull back into the half
// sun's bottom end, 6 along the left half, 3 of the upper right quarter into its top end
const CIRCLE_FOR_HALF_SUN = {
  tracing: 'circle-from-right',
  breakpoints: Array.from({ length: 13 }, (_, index) => +(index / 12).toFixed(4)),
};
const HALF_SUN_FOR_CIRCLE = { breakpoints: [0, 0, 0, 0, 0.1667, 0.3333, 0.5, 0.6667, 0.8333, 1, 1, 1, 1] };
/** The circle's right half (top → right → bottom): the bolt piece's start in sunny → frosty (under the circle). */
const CIRCLE_RIGHT_HALF = [lucideArc(12, 12, 4, -90, 90)];

const CLOUD_STATES = ['cloudy', 'partly-cloudy', 'showers', 'thunder', 'rain', 'snow', 'drizzle'];
/** Cloud states that keep a sun (its arc and 4 rays). */
const SUN_CLOUD_STATES = ['partly-cloudy', 'showers'];
const isNothing = (strokes: Stroke[]) =>
  strokes.length === 1 && strokes[0].kind === 'line' && strokes[0].from.every((value, axis) => value === (strokes[0] as LineStroke).to[axis]);
const POINT_LAYOUT = { tracing: 'nothing', breakpoints: Array.from({ length: 13 }, (_, index) => +(index / 12).toFixed(4)) };
/** The open clouds' lower left ends, carried by a spare piece while they crawl in. */
const CLOUD_LEFT_ENDS: Record<string, Stroke[]> = {
  thunder: THUNDER_CLOUD_LEFT_END, rain: RAIN_CLOUD_LEFT_END, snow: RAIN_CLOUD_LEFT_END, drizzle: RAIN_CLOUD_LEFT_END,
};

const COVERED = { wipe: 'left' } as const;
/** `pieceSet` with frosty's strokes and `layouts[state][otherState]` added. */
const addFrosty = (
  pieceSet: PieceSet, strokes: Stroke[], layouts: PairLayouts, alternativeStrokes: Record<string, Stroke[]> = {},
): PieceSet => ({
  strokes: { ...pieceSet.strokes, frosty: strokes },
  alternativeStrokes: { ...pieceSet.alternativeStrokes, ...alternativeStrokes },
  pairLayouts: mergePairLayouts(pieceSet.pairLayouts, layouts),
});
/** Layouts for the given cloud states X: `frosty.X` and `X.frosty` (either may be left out). */
const forCloudStates = (
  states: string[], frostySide?: (state: string) => PairLayout | undefined, otherSide?: (state: string) => PairLayout | undefined,
): PairLayouts => {
  const layouts: PairLayouts = { frosty: {} };
  for (const state of states) {
    const frostyLayout = frostySide?.(state), otherLayout = otherSide?.(state);
    if (frostyLayout) layouts.frosty[state] = frostyLayout;
    if (otherLayout) layouts[state] = { frosty: otherLayout };
  }
  return layouts;
};

/** Erasing runs a window backwards: [0, 0.6] erases during 40 … 100 %, with SMALL_CLOUD_CRAWL. */
const COVERED_BEFORE_CRAWL_ENDS: [number, number] = [1 - SMALL_CLOUD_CRAWL[1], 1 - SMALL_CLOUD_CRAWL[0]];
// frosty ↔ partly-cloudy / showers: the spine's centre sits where the sun arc's right end is — the spine traced
// backwards (lower arm, middle arm out and back, upper arm) shrinks into that end with its first 6 segments while
// its upper arm unrolls from there up over the top into the arc with the last 6
const SPINE_FOR_SUN_ARC = { tracing: 'spine-reversed', breakpoints: [0, 0.3333, 0.6667, 1, 2, 3, 4, 4.5, 5, 5.25, 5.5, 5.75, 6] };
const SUN_ARC_FOR_SPINE = { tracing: 'sun-arc-reversed', breakpoints: [0, 0, 0, 0, 0, 0, 0, 0.1667, 0.3333, 0.5, 0.6667, 0.8333, 1] };
/** Covered by the crawling cloud — for partly-cloudy / showers in step with their later crawl. */
const coveredIn = (state: string): PairLayout =>
  (SUN_CLOUD_STATES.includes(state) ? { wipe: 'left', draw: COVERED_BEFORE_CRAWL_ENDS } : { wipe: 'left' });

const withFrosty = (iconSet: IconSet): IconSet => {
  const [cloudPiece, sunPiece, ...otherPieces] = piecesOf(iconSet);
  const rayPieces = otherPieces.slice(0, 8);
  const [rain1, rain2, bolt, rain3, ...bottomFlakes] = otherPieces.slice(8);
  const nothing = pointAt(12, 12);
  const sparePiece = (layouts: PairLayouts, alternativeStrokes: Record<string, Stroke[]>): PieceSet => ({
    strokes: Object.fromEntries([...Object.keys(iconSet.strokes), 'frosty'].map((state) => [state, nothing])),
    alternativeStrokes,
    pairLayouts: layouts,
  });
  const coveredStates = CLOUD_STATES.filter((state) => !SUN_CLOUD_STATES.includes(state));
  const circleFromRight = [lucideArc(12, 12, 4, 0, 360)];
  const sunnyToFrosty = { sunny: { frosty: CIRCLE_FOR_HALF_SUN }, frosty: { sunny: HALF_SUN_FOR_CIRCLE } };

  const cloud: IconSet = {
    ...iconSet,
    ...addFrosty(cloudPiece, HALF_SUN, mergePairLayouts(
      // sunny ↔ frosty: a copy of the sun (under piece 2), morphing like it
      sunnyToFrosty,
      // → any cloud: it crawls in exactly as from sunny
      forCloudStates(CLOUD_STATES, (state) => iconSet.pairLayouts.sunny[state], (state) => iconSet.pairLayouts[state]?.sunny),
    ), { 'circle-from-right': circleFromRight }),
  };
  const sun = addFrosty(sunPiece, HALF_SUN, mergePairLayouts(
    sunnyToFrosty,
    // covered by the crawling cloud (its upper quarter on a spare piece)
    forCloudStates(coveredStates, () => tracedForWipe('half-sun-lower', HALF_SUN_LOWER), coveredIn),
    // partly-cloudy / showers: laid out as the spine (the spares carry the half sun), which bends into the sun arc
    forCloudStates(SUN_CLOUD_STATES, () => SPINE_FOR_SUN_ARC, () => SUN_ARC_FOR_SPINE),
  ), {
    'circle-from-right': circleFromRight,
    'half-sun-lower': HALF_SUN_LOWER,
    'spine-reversed': SPINE.map(reversedStroke).reverse(),
    'sun-arc-reversed': SUN_ARC.map(reversedStroke).reverse(),
  });
  const rays = rayPieces.map((rayPiece, rayIndex) => addFrosty(rayPiece, FROSTY_RAYS[rayIndex],
    // where the cloud state has no such ray: covered, or (partly-cloudy / showers) flying out as from sunny;
    // kept rays move
    forCloudStates(CLOUD_STATES.filter((state) => isNothing(rayPiece.strokes[state])), undefined,
      (state) => (SUN_CLOUD_STATES.includes(state) ? { draw: 0.6 } : COVERED))));
  // precipitation: rides in with the cloud, as from sunny
  const precipitation = (pieceSet: PieceSet) => addFrosty(pieceSet, pieceSet.strokes.sunny,
    forCloudStates(CLOUD_STATES.filter((state) => !isNothing(pieceSet.strokes[state])),
      (state) => pieceSet.pairLayouts.sunny?.[state] ?? RIDING_IN));
  const boltWithSpine = addFrosty(bolt, SPINE, mergePairLayouts(
    { sunny: { frosty: tracedForWipe('circle-right-half', CIRCLE_RIGHT_HALF) } },
    // during the crawl the spares (or the sun piece) carry the spine; thunder's bolt rides in
    forCloudStates(CLOUD_STATES, (state) => (state === 'thunder' ? RIDING_IN : POINT_LAYOUT)),
  ), { 'circle-right-half': CIRCLE_RIGHT_HALF, nothing: [lucideLine(12, 12, 12, 12)] });
  const spares = [
    // the spine's parts (covered); the first also carries the half sun's lower quarter for partly-cloudy / showers
    ...SPINE_PARTS.map((part, partIndex) => sparePiece(mergePairLayouts(
      forCloudStates(coveredStates, () => tracedForWipe(`spine-part-${partIndex}`, part), coveredIn),
      partIndex === 0 ? forCloudStates(SUN_CLOUD_STATES, () => tracedForWipe('half-sun-lower', HALF_SUN_LOWER), coveredIn) : {},
    ), { [`spine-part-${partIndex}`]: part, 'half-sun-lower': HALF_SUN_LOWER })),
    // the half sun's upper quarter
    sparePiece(forCloudStates(CLOUD_STATES, () => tracedForWipe('half-sun-upper', HALF_SUN_UPPER), coveredIn),
      { 'half-sun-upper': HALF_SUN_UPPER }),
    // the open clouds' lower left end
    sparePiece(forCloudStates(Object.keys(CLOUD_LEFT_ENDS), () => RIDING_IN,
      (state) => tracedForWipe(`${state}-cloud-left-end`, CLOUD_LEFT_ENDS[state])),
    Object.fromEntries(Object.entries(CLOUD_LEFT_ENDS).map(([state, end]) => [`${state}-cloud-left-end`, end]))),
  ];
  return {
    ...cloud,
    morePieces: [
      sun, ...rays, precipitation(rain1), precipitation(rain2), boltWithSpine, precipitation(rain3),
      ...bottomFlakes.map(precipitation), ...spares,
    ],
  };
};

export const weatherIcons: IconSet = withFrosty(rainTwinnedIcons);
