// Path numbers: a shape as plain numbers (`x y` + 6 per cubic segment, pieces one after another) — converting to and
// from segments, reordering, interpolating, scaling and turning around the icon centre (12, 12).
import { DEGREE, ICON_CENTER } from './math.ts';
import type { CubicSegment, PairLayout, PathNumbers, Point } from '../types.ts';

export const segmentCountOf = (path: PathNumbers): number => (path.length - 2) / 6;

const pointAt = (path: PathNumbers, index: number): Point => [path[index], path[index + 1]];

export const toSegments = (path: PathNumbers): CubicSegment[] =>
  Array.from({ length: segmentCountOf(path) }, (_, segmentIndex) => {
    const offset = segmentIndex * 6;
    return [pointAt(path, offset), pointAt(path, offset + 2), pointAt(path, offset + 4), pointAt(path, offset + 6)];
  });

export const fromSegments = (segments: CubicSegment[]): PathNumbers =>
  [...segments[0][0], ...segments.flatMap(([, control1, control2, end]) => [...control1, ...control2, ...end])];

const rotateSegmentOrder = (segments: CubicSegment[], startSegment: number): CubicSegment[] =>
  [...segments.slice(startSegment), ...segments.slice(0, startSegment)];

const reverseSegments = (segments: CubicSegment[]): CubicSegment[] =>
  segments.slice().reverse().map(([start, control1, control2, end]): CubicSegment => [end, control2, control1, start]);

/** Same picture, different segment order: start a closed loop at another segment and/or draw it backwards. */
export const reorderSegments = (path: PathNumbers, { startSegment = 0, reversed = false }: PairLayout = {}): PathNumbers => {
  const rotated = rotateSegmentOrder(toSegments(path), startSegment);
  return fromSegments(reversed ? reverseSegments(rotated) : rotated);
};

export const interpolate = (from: PathNumbers, to: PathNumbers, progress: number): PathNumbers =>
  from.map((value, index) => value + (to[index] - value) * progress);

/** Splits a shape into the path numbers of its pieces. */
export const splitPieces = (path: PathNumbers, pieceLength: number): PathNumbers[] =>
  Array.from({ length: path.length / pieceLength }, (_, pieceIndex) =>
    path.slice(pieceIndex * pieceLength, (pieceIndex + 1) * pieceLength));

/** Shrinks (factor < 1) or grows the whole shape around the icon center (12, 12). */
export const scaleAroundCenter = (path: PathNumbers, factor: number): PathNumbers =>
  path.map((value) => ICON_CENTER + (value - ICON_CENTER) * factor);

/** Rotates the whole shape around the icon center (12, 12). */
export const rotateAroundCenter = (path: PathNumbers, angle: number): PathNumbers => {
  const cos = Math.cos(angle * DEGREE), sin = Math.sin(angle * DEGREE);
  return path.map((value, index) => {
    if (index % 2 === 0) {
      const y = path[index + 1];
      return ICON_CENTER + (value - ICON_CENTER) * cos - (y - ICON_CENTER) * sin;
    }
    const x = path[index - 1];
    return ICON_CENTER + (x - ICON_CENTER) * sin + (value - ICON_CENTER) * cos;
  });
};
