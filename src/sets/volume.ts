// Icon set "volume": muted, low, medium, high — Lucide 1.61.0 icons "volume-x", "volume", "volume-1", "volume-2"
// (ISC, see LICENSE-lucide). Coordinates below are Lucide's; lucideLine / lucideArc scale them into our icon box.
// Three pieces:
//   piece 1: the speaker — the same in every state (volume-x's differs from the others by a few hundredths only).
//   pieces 2–3: the small and the big wave | the ✕'s "/" and "\" (muted). A missing wave rests on the outermost wave
//     there is (drawn on top of it, so it doesn't show) or, without waves, as a point on the speaker's front: waves
//     ripple out of the speaker / out of the wave before them, and back in. → muted: the waves unfold into the ✕.
import type { IconSet, PieceSet } from '../types.ts';
import { LUCIDE_STROKE_WIDTH, lucideArc, lucideLine, lucidePoint } from './lucide.ts';

/** Lucide's speaker, from the top of its front edge counterclockwise around. */
const SPEAKER = [
  lucideArc(10.295, 4.703, 0.705, -0.0828, -134.9415),
  lucideLine(9.797, 4.204, 6.413, 7.587),
  lucideArc(5.4201, 6.6, 1.4, 44.8292, 90.168),
  lucideLine(5.416, 8, 3, 8),
  lucideArc(3, 9, 1, -90, -180),
  lucideLine(2, 9, 2, 15),
  lucideArc(3, 15, 1, 180, 90),
  lucideLine(3, 16, 5.416, 16),
  lucideArc(5.4201, 17.4, 1.4, -90.168, -44.8292),
  lucideLine(6.413, 16.413, 9.796, 19.797),
  lucideArc(10.295, 19.299, 0.705, 135.0564, -0.0797),
  lucideLine(11, 19.298, 11, 4.702),
];
/** The waves, each from its top end down. */
const SMALL_WAVE = [lucideArc(12, 12, 5, -36.8699, 36.8699)];
const BIG_WAVE = [lucideArc(13.0001, 12, 9, -45.0004, 45.0004)];
/** The ✕, each line from its top end down (so a wave unfolds into it without turning over). */
const X_SLASH = [lucideLine(21.5, 9.5, 16.5, 14.5)];
const X_BACKSLASH = [lucideLine(16.5, 9.5, 21.5, 14.5)];
/** No wave: a point on the middle of the speaker's front edge. */
const NO_WAVE = lucidePoint(11, 12);

const speaker: PieceSet = {
  strokes: { muted: SPEAKER, low: SPEAKER, medium: SPEAKER, high: SPEAKER },
  alternativeStrokes: {},
  pairLayouts: {},
};
const smallWave: PieceSet = {
  strokes: { muted: X_SLASH, low: NO_WAVE, medium: SMALL_WAVE, high: SMALL_WAVE },
  alternativeStrokes: {},
  pairLayouts: {},
};
const bigWave: PieceSet = {
  strokes: { muted: X_BACKSLASH, low: NO_WAVE, medium: SMALL_WAVE, high: BIG_WAVE },
  alternativeStrokes: {},
  pairLayouts: {},
};

export const volumeIcons: IconSet = {
  segmentCount: 16,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  ...speaker,
  morePieces: [smallWave, bigWave],
  spins: {},
};
