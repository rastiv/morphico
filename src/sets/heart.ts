// Icon set "heart": on, off — Lucide 1.61.0 icons "heart", "heart-off" (ISC, see LICENSE-lucide). Coordinates below
// are Lucide's; lucideLine / lucideArc / lucideCubic scale them into our icon box.
// Three pieces (the "-off" pattern of bell and eye):
//   pieces 1–2: the outline's upper right and lower left part — heart-off cuts the outline where its slash crosses it
//     (on the left lobe, and at the lower right corner); the heart's closed outline is split in those gaps, so
//     on → off pulls the ends back from them. Each part has the same strokes in both states and the same breakpoints.
//   piece 3: the slash | nothing — drawn like a pen from the top left.
import type { IconSet, PieceSet } from '../types.ts';
import { LUCIDE_SLASH, LUCIDE_STROKE_WIDTH, lucideArc, lucideCubic, lucideLine, lucidePoint } from './lucide.ts';

/** Where the left lobe is split in "on": the middle of heart-off's gap on it (−120.04° … −57.02°). */
const LOBE_GAP_MIDDLE = (-120.0361 - 57.0162) / 2;
const leftLobe = (startAngle: number, endAngle: number) => lucideArc(7.5, 9.5001, 5.5, startAngle, endAngle);
const DIP = lucideArc(12, 5.4415, 0.56, 136.9163, 43.0837);
const RIGHT_LOBE = lucideArc(16.5101, 9.4738, 5.49, -138.3317, 0.2729);
const BOTTOM_TIP = lucideArc(11.9996, 18.9997, 2, 41.0455, 138.2288);
const LEFT_EDGE = lucideLine(10.508, 20.332, 5, 15);
const LEFT_SIDE = lucideCubic(5, 15, 3.5, 13.5, 2, 11.8, 2, 9.5);

/** The same layout in both directions: the parts have the same strokes in both states. */
const bothWays = (breakpoints: number[]) => ({ on: { off: { breakpoints } }, off: { on: { breakpoints } } });

// left lobe (2 segments), dip (2), right lobe (4), right side (4)
const upperRight: PieceSet = {
  strokes: {
    // from the left lobe's gap middle to the lower right corner (19, 15), the middle of the other gap
    on: [leftLobe(LOBE_GAP_MIDDLE, -41.9423), DIP, RIGHT_LOBE, lucideCubic(22, 9.5, 22, 11.79, 20.5, 13.5, 19, 15)],
    off: [
      lucideArc(7.5058, 9.5065, 5.5, -57.0162, -42.0325),
      DIP,
      RIGHT_LOBE,
      lucideCubic(22, 9.5, 22, 11.372, 20.998, 12.856, 19.813, 14.155),
    ],
  },
  alternativeStrokes: {},
  pairLayouts: bothWays([0, 0.5, 1, 1.5, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75, 4]),
};
// lower right edge (3 segments), bottom tip (2), lower left edge (3), left side (2), left lobe (2)
const lowerLeft: PieceSet = {
  strokes: {
    on: [lucideLine(19, 15, 13.508, 20.313), BOTTOM_TIP, LEFT_EDGE, LEFT_SIDE, leftLobe(-179.9989, LOBE_GAP_MIDDLE)],
    off: [
      lucideLine(16.967, 16.967, 13.508, 20.313),
      BOTTOM_TIP,
      LEFT_EDGE,
      LEFT_SIDE,
      lucideArc(7.5, 9.5004, 5.5, -179.9958, -120.0361),
    ],
  },
  alternativeStrokes: {},
  pairLayouts: bothWays([0, 0.3333, 0.6667, 1, 1.5, 2, 2.3333, 2.6667, 3, 3.5, 4, 4.5, 5]),
};
const slash: PieceSet = {
  strokes: { on: lucidePoint(2, 2), off: LUCIDE_SLASH },
  alternativeStrokes: {},
  pairLayouts: { on: { off: { draw: true } } },
};

export const iconsHeart: IconSet = {
  segmentCount: 12,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...upperRight,
  morePieces: [lowerLeft, slash],
  spins: {},
};
