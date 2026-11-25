// The precipitation pieces: rain lines / top flakes / drizzle (11, 12, 14), the bolt (13), bottom flakes / drizzle
// (15–17) — with their layouts (drawn down like a pen, riding in with the crawling cloud, line ↔ flake).
import { line } from '../../geometry/strokes.ts';
import type { LineStroke, PieceSet, Stroke } from '../../types.ts';
import { lucidePoint } from '../lucide.ts';
import { RAIN_CLOUD_LEFT_END, THUNDER_CLOUD_LEFT_END } from './clouds.ts';
import { BOLT, BOLT_DRAWN, DRIZZLE_LINES, fallingDrawn, FLAKE_IN_HALVES, HEAVY_RAIN_DRAWN, HEAVY_RAIN_LINES, LINE_OUT_AND_BACK, outAndBack, RAIN_DRAWN, RAIN_LINES, SNOWFLAKE_CENTERS, SNOWFLAKES } from './precipitation-shapes.ts';
import { mergePairLayouts, RIDING_IN, SMALL_CLOUD_CRAWL, tracedForWipe } from './shared.ts';
import type { PairLayouts } from './shared.ts';

/** The drizzle pairs of precipitation piece `fallingIndex` (0…5) — showers' own lines (0, 1) just shorten. */
export const drizzlePairLayouts = (fallingIndex: number, hasShowersLine: boolean): PairLayouts => ({
  ...Object.fromEntries(['cloudy', 'partly-cloudy', 'thunder', ...(hasShowersLine ? [] : ['showers'])]
    .map((state) => [state, { drizzle: fallingDrawn(fallingIndex) }])),
  sunny: { drizzle: RIDING_IN },
  snow: { drizzle: FLAKE_IN_HALVES },
  drizzle: { snow: { tracing: 'drizzle-line-out-and-back', breakpoints: LINE_OUT_AND_BACK } },
});
/** Showers' rain line (if it has one) | rain's line: pieces 11, 12 (both) and 14 (rain only). */
export const rainPiece = (heavyRainLine: Stroke, rainIndex: number): PieceSet => {
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
export const bottomFlakePiece = (flakeIndex: number): PieceSet => {
  const nothing = lucidePoint(...SNOWFLAKE_CENTERS[flakeIndex]);
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

export const boltTop = lucidePoint(13, 12);
export const boltPiece: PieceSet = {
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
