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
import { LUCIDE_STROKE_WIDTH, lucideLine } from './lucide.ts';
import type { IconSet } from '../types.ts';
import {
  BIG_CLOSED_FOR_OPEN, CLOSED_FOR_OPEN, CLOUD, CLOUD_FOR_RAIN, CLOUD_FOR_THUNDER, CLOUD_FROM_LEFT, CLOUD_FROM_RAIN_GAP_MIDDLE,
  CLOUD_FROM_THUNDER_GAP_MIDDLE, BIG_GAP_MIDDLE_X, GAP_MIDDLE_X, OPEN_FOR_CLOSED, OPEN_SMALL_CLOUD, RAIN_CLOUD, RAIN_CLOUD_FROM_LEFT,
  SMALL_CLOUD, SMALL_CLOUD_FROM_LEFT, THUNDER_CLOUD, THUNDER_CLOUD_FROM_LEFT,
} from './weather/clouds.ts';
import { withFrosty } from './weather/frosty.ts';
import { HEAVY_RAIN_LINES } from './weather/precipitation-shapes.ts';
import { boltPiece, bottomFlakePiece, rainPiece } from './weather/precipitation.ts';
import { SMALL_CLOUD_CRAWL, tracedForWipe, withRainTwins } from './weather/shared.ts';
import { RAYS, rayPiece, SUN_CIRCLE, sunCirclePiece } from './weather/sun.ts';

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

export const iconsWeather: IconSet = withFrosty(rainTwinnedIcons);
