// Wiping a piece (PairLayout.wipe / slide): only the part a vertical edge has passed shows, optionally sliding in
// with the edge from outside the box.
import { segmentLength, splitCubic } from './math.ts';
import { toSegments } from './path-numbers.ts';
import { pieceBetween } from './trim.ts';
import type { PathNumbers } from '../types.ts';

/** The x range a wipe's edge moves through (the icon box's drawing area, line width included). */
const WIPE_FROM_X = 2;
const WIPE_TO_X = 22;
const WIPE_SAMPLES_PER_SEGMENT = 40;

/** Points along a piece as [share of its length, x]. */
const xAlong = (piece: PathNumbers): [number, number][] => {
  const segments = toSegments(piece);
  const lengths = segments.map(segmentLength);
  const totalLength = lengths.reduce((sum, length) => sum + length, 0) || 1;
  const samples: [number, number][] = [];
  let travelled = 0;
  segments.forEach((segment, index) => {
    for (let step = 0; step <= WIPE_SAMPLES_PER_SEGMENT; step++) {
      const progress = step / WIPE_SAMPLES_PER_SEGMENT;
      const [x] = progress < 1 ? splitCubic(segment, progress)[1][0] : segment[3];
      samples.push([(travelled + progress * lengths[index]) / totalLength, x]);
    }
    travelled += lengths[index];
  });
  return samples;
};

/**
 * The x range a morph's wipe edge moves through: the box (x 2…22), or — if a piece slides in — from the box's side
 * to that piece's leading side at rest, so the edge rides at its front and it starts just outside the box.
 */
export const wipeRange = (slidingPiece: PathNumbers | null, direction: 'left' | 'right'): [number, number] => {
  if (!slidingPiece) return [WIPE_FROM_X, WIPE_TO_X];
  const xs = xAlong(slidingPiece).map(([, x]) => x);
  return direction === 'right' ? [WIPE_FROM_X, Math.max(...xs)] : [Math.min(...xs), WIPE_TO_X];
};

/**
 * A piece behind a vertical edge (PairLayout.wipe): at `fraction` 0…1 of the wipe, the edge has moved that far
 * through `edgeRange` in `direction`, and only the part it has passed shows. That part must be one stretch of the
 * path. `slides` (PairLayout.slide): the piece moves with the edge from outside the box; only its part inside shows.
 */
export const wipePiece = (
  piece: PathNumbers, fraction: number, direction: 'left' | 'right',
  edgeRange: [number, number] = [WIPE_FROM_X, WIPE_TO_X], slides = false,
): PathNumbers => {
  if (fraction >= 1) return piece.slice();
  const [fromX, toX] = edgeRange;
  if (slides) {
    // in the piece's own frame the box's side moves the other way: the leading part shows first
    const shift = (1 - Math.max(fraction, 0)) * (toX - fromX) * (direction === 'right' ? -1 : 1);
    return wipePiece(piece, fraction, direction === 'right' ? 'left' : 'right', edgeRange)
      .map((value, index) => (index % 2 ? value : value + shift));
  }
  const travel = Math.max(fraction, 0) * (toX - fromX);
  const edge = direction === 'right' ? fromX + travel : toX - travel;
  // samples along the length: [share of the length, > 0 where the edge has passed]
  const samples = xAlong(piece).map(([share, x]): [number, number] => [share, direction === 'right' ? edge - x : x - edge]);
  const first = samples.findIndex(([, passed]) => passed >= 0);
  if (first < 0) return pieceBetween(piece, 0, 0);
  let last = samples.length - 1;
  while (samples[last][1] < 0) last--;
  // where the edge crosses between two samples
  const crossing = ([shareA, passedA]: [number, number], [shareB, passedB]: [number, number]) =>
    shareA + (shareB - shareA) * (passedA / (passedA - passedB));
  const from = first > 0 ? crossing(samples[first - 1], samples[first]) : 0;
  const to = last < samples.length - 1 ? crossing(samples[last], samples[last + 1]) : 1;
  return pieceBetween(piece, from, to);
};
