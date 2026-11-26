// Icon set "status": success, error, warning, info — Lucide 1.61.0 icons "circle-check", "circle-x", "circle-alert",
// "info" (ISC, see LICENSE-lucide). Coordinates below are Lucide's; lucideLine / lucideArc scale them into our icon box.
// The circle stays; only the sign inside changes (like the toggle set: the ✕ folds into the check):
//   piece 1: the circle, clockwise from the top
//   piece 2: check's long stroke | ✕'s "/" | warning's bar | info's bar (each from its upper end; info's from below)
//   piece 3: check's short stroke | ✕'s "\" | warning's dot | info's dot
// warning turned 180° is exactly info (bar and dot swap ends): warning ↔ info is a pure spin.
import type { IconSet, PieceSet, Stroke } from '../types.ts';
import { LUCIDE_STROKE_WIDTH, lucideArc, lucideLine } from './lucide.ts';

const CIRCLE: Stroke[] = [lucideArc(12, 12, 10, -90, 270)];

const circle: PieceSet = {
  strokes: { success: CIRCLE, error: CIRCLE, warning: CIRCLE, info: CIRCLE },
  alternativeStrokes: {},
  // for the spin: info's circle starts at the bottom, so turned back by 180° it is warning's circle
  pairLayouts: { info: { warning: { startSegment: 2 } } },
};
const firstSign: PieceSet = {
  strokes: {
    success: [lucideLine(16, 9, 10.5, 14.5)],
    error: [lucideLine(15, 9, 9, 15)],
    warning: [lucideLine(12, 8, 12, 12)],
    info: [lucideLine(12, 16, 12, 12)],
  },
  alternativeStrokes: {},
  // info's bar runs bottom → top (warning's turned): drawn the other way for the slanted strokes
  pairLayouts: { info: { success: { reversed: true }, error: { reversed: true } } },
};
const secondSign: PieceSet = {
  strokes: {
    success: [lucideLine(8, 12, 10.5, 14.5)],
    error: [lucideLine(9, 9, 15, 15)],
    warning: [lucideLine(12, 16, 12.01, 16)],
    info: [lucideLine(12, 8, 11.99, 8)],
  },
  alternativeStrokes: {},
  pairLayouts: {},
};

export const iconsStatus: IconSet = {
  segmentCount: 4,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...circle,
  morePieces: [firstSign, secondSign],
  spins: { warning: { info: 180 }, info: { warning: -180 } },
};
