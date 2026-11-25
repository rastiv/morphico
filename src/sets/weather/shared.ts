// Helpers shared by the weather pieces: layouts used everywhere and the rain twins (snow, drizzle).
import { defaultBreakpoints } from '../../geometry/stroke-layout.ts';
import type { PieceSet, Stroke } from '../../types.ts';

/** sunny → partly-cloudy / showers: the small cloud (and its rain) crawls in a bit later (user's request). */
export const SMALL_CLOUD_CRAWL: [number, number] = [0.4, 1];
/** A wipe's piece laid out along an alternative tracing with the default spread. */
export const tracedForWipe = (tracing: string, strokes: Stroke[]) => ({ tracing, breakpoints: defaultBreakpoints(strokes, 12) });
export type PairLayouts = PieceSet['pairLayouts'];
/** Pair layouts of several groups put together (per state). */
export const mergePairLayouts = (...groups: PairLayouts[]): PairLayouts => {
  const merged: PairLayouts = {};
  for (const group of groups) {
    for (const [state, byOtherState] of Object.entries(group)) merged[state] = { ...merged[state], ...byOtherState };
  }
  return merged;
};
/** sunny → rain / snow: the precipitation rides in with the crawling cloud. */
export const RIDING_IN = { wipe: 'right', slide: true } as const;
/** States drawn with rain's cloud: apart from the precipitation they morph exactly like rain. */
export const RAIN_TWINS = ['snow', 'drizzle'];
/** A piece that is the same in rain and its twins: the twins get rain's strokes and pair layouts. */
export const withRainTwins = <Piece extends PieceSet>(pieceSet: Piece): Piece => {
  const pairLayouts = Object.fromEntries(Object.entries(pieceSet.pairLayouts).map(([state, layouts]) =>
    [state, { ...layouts, ...(layouts.rain ? Object.fromEntries(RAIN_TWINS.map((twin) => [twin, layouts.rain])) : {}) }]));
  for (const twin of RAIN_TWINS) if (pieceSet.pairLayouts.rain) pairLayouts[twin] = pieceSet.pairLayouts.rain;
  return {
    ...pieceSet,
    strokes: { ...pieceSet.strokes, ...Object.fromEntries(RAIN_TWINS.map((twin) => [twin, pieceSet.strokes.rain])) },
    pairLayouts,
  };
};
