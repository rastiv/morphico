// frosty (Lucide "sun-snow"): half a small sun on the left, half a snowflake on the right — added last, onto the
// finished set (withFrosty).
import { piecesOf } from '../../geometry/pairs.ts';
import { reversedStroke } from '../../geometry/strokes.ts';
import type { IconSet, LineStroke, PairLayout, PieceSet, Stroke } from '../../types.ts';
import { lucideArc, lucideLine, lucidePoint } from '../lucide.ts';
import { RAIN_CLOUD_LEFT_END, THUNDER_CLOUD_LEFT_END } from './clouds.ts';
import { SUN_ARC } from './sun.ts';
import { mergePairLayouts, RIDING_IN, SMALL_CLOUD_CRAWL, tracedForWipe } from './shared.ts';
import type { PairLayouts } from './shared.ts';

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

export const withFrosty = (iconSet: IconSet): IconSet => {
  const [cloudPiece, sunPiece, ...otherPieces] = piecesOf(iconSet);
  const rayPieces = otherPieces.slice(0, 8);
  const [rain1, rain2, bolt, rain3, ...bottomFlakes] = otherPieces.slice(8);
  const nothing = lucidePoint(12, 12);
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
