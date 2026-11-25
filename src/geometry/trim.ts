// Parts of a piece along its length: what a pen has drawn so far (PairLayout.draw), or the stretch a wipe shows.
import { segmentLength, splitCubic } from './math.ts';
import { fromSegments, toSegments } from './path-numbers.ts';
import type { CubicSegment, PathNumbers, Point } from '../types.ts';

/**
 * The part of a piece between two shares of its length (0…1). The segments outside shrink to the part's ends,
 * so the number count stays the same.
 */
export const pieceBetween = (piece: PathNumbers, fromFraction: number, toFraction: number): PathNumbers => {
  const segments = toSegments(piece);
  const lengths = segments.map(segmentLength);
  const totalLength = lengths.reduce((sum, length) => sum + length, 0);
  const from = fromFraction * totalLength, to = toFraction * totalLength;
  let travelled = 0;
  const parts = segments.map((segment, index): CubicSegment | null => {
    const segmentStart = travelled;
    travelled += lengths[index];
    if (!lengths[index] || travelled <= from || segmentStart >= to) return null;
    const startProgress = Math.max(0, (from - segmentStart) / lengths[index]);
    const endProgress = Math.min(1, (to - segmentStart) / lengths[index]);
    const [head] = splitCubic(segment, endProgress);
    return startProgress > 0 ? splitCubic(head, startProgress / endProgress)[1] : head;
  });
  // before the part: its start point; after (or between): the end of the part drawn so far
  let pen: Point = parts.find((part) => part)?.[0] ?? segments[0][0];
  return fromSegments(parts.map((part): CubicSegment => {
    if (!part) return [pen, pen, pen, pen];
    pen = part[3];
    return part;
  }));
};

/** The first `fraction` (0…1) of a piece along its length, as if a pen had drawn that far. */
export const trimPiece = (piece: PathNumbers, fraction: number): PathNumbers =>
  pieceBetween(piece, 0, Math.min(Math.max(fraction, 0), 1));
