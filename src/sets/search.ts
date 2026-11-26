// Icon set "search": search, close — Lucide 1.61.0 icons "search", "x" (ISC, see LICENSE-lucide). Coordinates below
// are Lucide's; lucideLine / lucideArc scale them into our icon box.
//   piece 1: the handle | the ✕'s "\" — the handle lies on the same diagonal and grows up into it
//   piece 2: the lens | the ✕'s "/" — the circle is pressed flat onto the line (PairLayout.flatten)
import type { IconSet, PieceSet } from '../types.ts';
import { LUCIDE_STROKE_WIDTH, lucideArc, lucideLine } from './lucide.ts';

const handle: PieceSet = {
  strokes: {
    search: [lucideLine(21, 21, 16.66, 16.66)],
    close: [lucideLine(18, 18, 6, 6)],
  },
  alternativeStrokes: {},
  pairLayouts: {},
};
const lens: PieceSet = {
  strokes: {
    search: [lucideArc(11, 11, 8, -90, 270)],
    close: [lucideLine(18, 6, 6, 18)],
  },
  alternativeStrokes: {},
  pairLayouts: { close: { search: { flatten: true } } },
};

export const iconsSearch: IconSet = {
  segmentCount: 4,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...handle,
  morePieces: [lens],
  spins: {},
};
