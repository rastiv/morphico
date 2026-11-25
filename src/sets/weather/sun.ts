// The sun: Lucide "sun"'s circle and rays, "cloud-sun"'s arc — and their pieces (piece 2 = the circle, 3–10 = one ray
// each) with the layouts for sunny ↔ the cloud states.
import { lucideArc, lucideLine, lucidePoint } from '../lucide.ts';
import type { PieceSet, Stroke } from '../../types.ts';
import { CLOUD, CLOUD_FOR_RAIN, CLOUD_FOR_THUNDER, CLOUD_FROM_RAIN_GAP_MIDDLE, CLOUD_FROM_THUNDER_GAP_MIDDLE, OPEN_FOR_CLOSED, RAIN_CLOUD, THUNDER_CLOUD } from './clouds.ts';
import { tracedForWipe } from './shared.ts';

/** The sun's circle traced from its leftmost point (sunny ↔ cloudy: the wiping edge reaches it first). */
export const CIRCLE_FROM_LEFT = [lucideArc(12, 12, 4, 180, 540)];
/** The angle (from the icon centre) where the cloud starts, so the circle starts in the same direction. */
export const CIRCLE_START = 51.84;
/** Lucide "sun"'s circle, clockwise from CIRCLE_START. */
export const SUN_CIRCLE = [lucideArc(12, 12, 4, CIRCLE_START, CIRCLE_START + 360)];
/** Lucide "cloud-sun"'s sun: the part of the circle above the cloud, clockwise from its left end. */
export const SUN_ARC = [lucideArc(12.0004, 11.9985, 4, -119.6437, 9.3742)];
/** The middle of the sun's hidden part (behind the cloud), from where it pulls back into both ends of SUN_ARC. */
export const HIDDEN_MIDDLE = (9.3742 + 240.3563) / 2;

/** Lucide "sun"'s rays, each from its outer end inwards (erasing keeps the outer end: the ray flies out). */
export const RAYS = [
  lucideLine(12, 2, 12, 4),
  lucideLine(19.07, 4.93, 17.66, 6.34),
  lucideLine(22, 12, 20, 12),
  lucideLine(19.07, 19.07, 17.66, 17.66),
  lucideLine(12, 22, 12, 20),
  lucideLine(4.93, 19.07, 6.34, 17.66),
  lucideLine(2, 12, 4, 12),
  lucideLine(4.93, 4.93, 6.34, 6.34),
];
export const HIDDEN_RAY = lucidePoint(13, 19);
/** partly-cloudy's and showers' missing rays (bottom right, bottom, bottom left, left). */
export const HIDDEN_RAY_PARTLY = lucidePoint(10, 22);
export const MISSING_RAYS_PARTLY = [3, 4, 5, 6];

// sunny ↔ partly-cloudy, the sun's circle: traced from the middle of the hidden part, 4 segments to the arc's left
// end, 4 along the arc (it stays), 4 back to the middle; the arc gets 4 zero-length segments at each end.
export const ARC_SHARE = (9.3742 + 119.6437) / 360;
export const CIRCLE_FOR_SUN_ARC = {
  tracing: 'circle-from-hidden-middle',
  breakpoints: [
    ...[0, 1, 2, 3].map((index) => (index / 4) * ((1 - ARC_SHARE) / 2)),
    ...[0, 1, 2, 3].map((index) => (1 - ARC_SHARE) / 2 + (index / 4) * ARC_SHARE),
    ...[0, 1, 2, 3, 4].map((index) => (1 + ARC_SHARE) / 2 + (index / 4) * ((1 - ARC_SHARE) / 2)),
  ].map((breakpoint) => +breakpoint.toFixed(4)),
};
export const SUN_ARC_FOR_CIRCLE = { breakpoints: [0, 0, 0, 0, 0, 0.25, 0.5, 0.75, 1, 1, 1, 1, 1] };

// cloudy → partly-cloudy: the sun is drawn like a pen from the arc's lower right end up over the top (the user's
// direction), and the kept rays follow one after another, each growing out from the sun when the pen passes it.
export const SUN_ARC_DRAWN: [number, number] = [0.45, 0.85]; // after the cloud has shrunk away from the arc's start
export const RAY_DRAW_DURATION = 0.15;
/** Kept rays → how far along the arc (from its lower right end, 0…1) the pen is when the ray starts. */
export const KEPT_RAY_PEN_POSITIONS: Record<number, number> = { 2: 0.07, 1: 0.42, 0: 0.77, 7: 1 };
export const rayDrawnAfterPen = (penPosition: number): [number, number] => {
  const start = SUN_ARC_DRAWN[0] + penPosition * (SUN_ARC_DRAWN[1] - SUN_ARC_DRAWN[0]);
  return [+start.toFixed(4), +Math.min(start + RAY_DRAW_DURATION, 1).toFixed(4)];
};
export const sunCirclePiece: PieceSet = {
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

export const rayPiece = (ray: Stroke, rayIndex: number): PieceSet => {
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
