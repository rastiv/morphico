// Icon set "media": play, pause, stop — Lucide 1.61.0 icons (ISC, see LICENSE-lucide).
// First imported with `node tools/import-lucide.ts play pause square`, then rewritten as rounded polygons so the
// corners can be made sharper (`withRoundness`); with Lucide's radii (play 2, pause 1, stop 2) the shapes match
// the import within 0.005 units (Lucide's own rounding).
// Two pieces: pause has two bars; play and stop draw their single shape in both pieces (the second copy lies
// exactly on the first, so it doesn't show — during a morph to pause the two copies separate into the bars).
// Every shape runs clockwise from its top left, like Lucide's. Coordinates below are Lucide's; fromLucide /
// lucideLength scale them into our icon box (more margin, like the digits — see lucide.ts).
import { reversedStroke, roundedPolygon } from '../geometry.ts';
import type { IconSet, Point } from '../types.ts';
import { fromLucide, LUCIDE_STROKE_WIDTH, lucideLength } from './lucide.ts';

/** Lucide's play: a triangle (left side x 5, tip at the right) with rounded corners, starting with the top left arc. */
const PLAY_CORNERS = ([[5, 1.5174], [22.9706, 11.9998], [5, 22.4827]] as Point[]).map(fromLucide);
const RIGHT_BAR_CORNERS = ([[14, 3], [19, 3], [19, 21], [14, 21]] as Point[]).map(fromLucide);
const LEFT_BAR_CORNERS = ([[5, 3], [10, 3], [10, 21], [5, 21]] as Point[]).map(fromLucide);
const SQUARE_CORNERS = ([[3, 3], [21, 3], [21, 21], [3, 21]] as Point[]).map(fromLucide);
const LUCIDE_RADII = { play: lucideLength(2), pause: lucideLength(1), stop: lucideLength(2) };

// play ↔ stop (both pieces, the user's sketch): corner to corner, edge to edge, and the tip opens up and down
// into the square's right side. Play (top left corner, top, tip, bottom, bottom left corner, left):
// 2 + 1 + 4 + 1 + 2 + 2 segments. Stop is laid out from its top edge and then started at its top left corner,
// so its segments line up: top left 2, top 1, top right 1, right side 2, bottom right 1, bottom 1, bottom left 2, left 2.
const PLAY_FOR_STOP = { breakpoints: [0, 0.5, 1, 2, 2.25, 2.5, 2.75, 3, 4, 4.5, 5, 5.5, 6] };
const STOP_FOR_PLAY = { breakpoints: [0, 1, 2, 2.5, 3, 4, 5, 5.5, 6, 6.5, 7, 7.5, 8], startSegment: 10 };

const buildMediaIcons = (radii: typeof LUCIDE_RADII): IconSet => {
  const play = roundedPolygon(PLAY_CORNERS, radii.play, true);
  const stop = roundedPolygon(SQUARE_CORNERS, radii.stop);
  return {
    segmentCount: 12,
    strokeWidth: LUCIDE_STROKE_WIDTH,
    lineCap: 'round',
    lineJoin: 'round',
    strokes: { play, pause: roundedPolygon(RIGHT_BAR_CORNERS, radii.pause), stop },
    alternativeStrokes: {},
    // play ↔ stop: the user's sketch (above); play ↔ pause, pause ↔ stop: tools/check.ts
    pairLayouts: {
      play: { pause: { breakpoints: [0, 0.7292, 1, 1.6458, 2, 2.25, 3, 3.3125, 3.3125, 4, 4.2708, 5, 6] }, stop: PLAY_FOR_STOP },
      pause: { play: { startSegment: 10 }, stop: { startSegment: 11 } },
      stop: { pause: { breakpoints: [0, 0.8333, 1, 2, 2.2917, 2.7083, 3, 4, 4.1667, 5, 6, 7, 8] }, play: STOP_FOR_PLAY },
    },
    morePieces: [
      {
        strokes: { play, pause: roundedPolygon(LEFT_BAR_CORNERS, radii.pause), stop },
        // only the triangle's left side, traced down and back up like the left bar's loop (top left corner out
        // and back, left edge down, bottom left corner out and back, left edge up): the left bar inflates from
        // that edge, while the first piece (the whole triangle) opens into the right bar
        alternativeStrokes: {
          'play-left-side': [
            play[0], reversedStroke(play[0]), reversedStroke(play[5]), reversedStroke(play[4]), play[4], play[5],
          ],
        },
        pairLayouts: {
          play: {
            pause: { tracing: 'play-left-side', breakpoints: [0, 0.7292, 1, 1.7292, 2, 3, 3.7292, 4, 4.7292, 5, 5.7708, 6, 6] },
            stop: PLAY_FOR_STOP,
          },
          pause: {
            stop: { breakpoints: [0, 1, 2, 2.0208, 2.9792, 3, 4, 5, 6, 6.3333, 6.6667, 7, 8] },
          },
          stop: { pause: { breakpoints: [0, 0.1667, 1, 2, 3, 4, 4.8333, 5, 6, 6.2917, 6.7083, 7, 8] }, play: STOP_FOR_PLAY },
        },
      },
    ],
    spins: {},
    withRoundness: (roundness) => buildMediaIcons({
      play: LUCIDE_RADII.play * roundness, pause: LUCIDE_RADII.pause * roundness, stop: LUCIDE_RADII.stop * roundness,
    }),
  };
};

export const mediaIcons: IconSet = buildMediaIcons(LUCIDE_RADII);
