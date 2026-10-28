// Icon set "eye": visible, hidden — Lucide 1.61.0 icons "eye", "eye-off" (ISC, see LICENSE-lucide).
// Coordinates below are Lucide's; lucideLine / lucideArc scale them into our icon box (see lucide.ts).
// Four pieces:
//   pieces 1–2: the outline's right and left part — eye-off cuts the outline where its slash crosses it (upper left on
//     the top lid, lower right on the bottom lid); the eye's closed outline is split at the middle of those gaps, so
//     visible → hidden pulls both ends of each part back from the gaps.
//   piece 3: the pupil — the circle opens on its upper right, where the slash crosses (the gap pulls back into the
//     half circle's ends).
//   piece 4: the slash | nothing — drawn like a pen from the top left.
import type { IconSet, PieceSet } from '../types.ts';
import { LUCIDE_SLASH, LUCIDE_STROKE_WIDTH, lucideArc, lucidePoint } from './lucide.ts';

// the lids: top lid = arc around 12,15.7506 (r 10.75), bottom lid = arc around 12,8.2494; the corners: small arcs (r 1)
const topLid = (startAngle: number, endAngle: number) => lucideArc(12, 15.7506, 10.75, startAngle, endAngle);
const bottomLid = (startAngle: number, endAngle: number) => lucideArc(12, 8.2494, 10.75, startAngle, endAngle);
const RIGHT_CORNER = lucideArc(21.0005, 12, 1, -20.365, 20.365);
const LEFT_CORNER = lucideArc(2.9995, 12, 1, 159.635, 200.365);
/** The middles of eye-off's gaps: on the top lid (between -120.724° and -96.796°) and the bottom lid (37.8° … 59.4°). */
const TOP_GAP_MIDDLE = (-120.724 - 96.796) / 2;
const BOTTOM_GAP_MIDDLE = (37.8063 + 59.3592) / 2;

// each part: lid, corner, lid — 6 + 2 + 4 segments in both states, so the corner stays and the lids only shorten
const PART_LAYOUT = { breakpoints: [0, 0.1667, 0.3333, 0.5, 0.6667, 0.8333, 1, 1.5, 2, 2.25, 2.5, 2.75, 3] };
const rightPart: PieceSet = {
  strokes: {
    visible: [topLid(TOP_GAP_MIDDLE, -22.4122), RIGHT_CORNER, bottomLid(22.4122, BOTTOM_GAP_MIDDLE)],
    hidden: [topLid(-96.796, -22.4122), RIGHT_CORNER, bottomLid(22.4122, 37.8063)],
  },
  alternativeStrokes: {},
  pairLayouts: { visible: { hidden: PART_LAYOUT }, hidden: { visible: PART_LAYOUT } },
};
const leftPart: PieceSet = {
  strokes: {
    visible: [bottomLid(BOTTOM_GAP_MIDDLE, 157.5878), LEFT_CORNER, topLid(-157.5878, TOP_GAP_MIDDLE)],
    hidden: [bottomLid(59.3592, 157.5878), LEFT_CORNER, topLid(-157.5878, -120.724)],
  },
  alternativeStrokes: {},
  pairLayouts: { visible: { hidden: PART_LAYOUT }, hidden: { visible: PART_LAYOUT } },
};

/** eye-off's pupil: the half circle clockwise from 46° (lower right) to 224° (upper left). */
const HALF_PUPIL = [lucideArc(12, 12, 3, 45.9957, 224.0043)];
/** The middle of the pupil's gap (upper right), from where the gap pulls back into the half's ends. */
const PUPIL_GAP_MIDDLE = (224.0043 + 405.9957) / 2;
const GAP_HALF_SHARE = (405.9957 - 224.0043) / 2 / 360;
const pupil: PieceSet = {
  strokes: { visible: [lucideArc(12, 12, 3, -90, 270)], hidden: HALF_PUPIL },
  alternativeStrokes: { 'pupil-from-gap-middle': [lucideArc(12, 12, 3, PUPIL_GAP_MIDDLE, PUPIL_GAP_MIDDLE + 360)] },
  pairLayouts: {
    // 3 segments per gap half, 6 along the half circle (it stays)
    visible: {
      hidden: {
        tracing: 'pupil-from-gap-middle',
        breakpoints: [
          ...[0, 1, 2].map((index) => (index / 3) * GAP_HALF_SHARE),
          ...[0, 1, 2, 3, 4, 5].map((index) => GAP_HALF_SHARE + (index / 6) * (1 - 2 * GAP_HALF_SHARE)),
          ...[0, 1, 2, 3].map((index) => 1 - GAP_HALF_SHARE + (index / 3) * GAP_HALF_SHARE),
        ].map((breakpoint) => +breakpoint.toFixed(4)),
      },
    },
    hidden: { visible: { breakpoints: [0, 0, 0, 0, 0.1667, 0.3333, 0.5, 0.6667, 0.8333, 1, 1, 1, 1] } },
  },
};

const slash: PieceSet = {
  strokes: { visible: lucidePoint(2, 2), hidden: LUCIDE_SLASH },
  alternativeStrokes: {},
  pairLayouts: { visible: { hidden: { draw: true } } },
};

export const eyeIcons: IconSet = {
  segmentCount: 12,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...rightPart,
  morePieces: [leftPart, pupil, slash],
  spins: {},
};
