// Small math shared by the geometry files: units, points, and splitting / measuring a cubic segment.
import type { CubicSegment, Point } from '../types.ts';

export const DEGREE = Math.PI / 180;
export const ICON_CENTER = 12;
export const EPSILON = 1e-9;

export const distanceBetween = (from: Point, to: Point): number => Math.hypot(to[0] - from[0], to[1] - from[1]);

export const unitVector = (from: Point, to: Point): Point => {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  return [(to[0] - from[0]) / length, (to[1] - from[1]) / length];
};

export const interpolatePoint = (from: Point, to: Point, progress: number): Point =>
  [from[0] + (to[0] - from[0]) * progress, from[1] + (to[1] - from[1]) * progress];

/** Splits a cubic into two cubics at `progress` (de Casteljau). */
export const splitCubic = ([start, control1, control2, end]: CubicSegment, progress: number): [CubicSegment, CubicSegment] => {
  const startToControl1 = interpolatePoint(start, control1, progress);
  const control1ToControl2 = interpolatePoint(control1, control2, progress);
  const control2ToEnd = interpolatePoint(control2, end, progress);
  const leftInner = interpolatePoint(startToControl1, control1ToControl2, progress);
  const rightInner = interpolatePoint(control1ToControl2, control2ToEnd, progress);
  const splitPoint = interpolatePoint(leftInner, rightInner, progress);
  return [[start, startToControl1, leftInner, splitPoint], [splitPoint, rightInner, control2ToEnd, end]];
};

/** Rough length of a cubic segment: the average of its chord and its control polygon. */
export const segmentLength = ([start, control1, control2, end]: CubicSegment): number =>
  (distanceBetween(start, end) + distanceBetween(start, control1) + distanceBetween(control1, control2) + distanceBetween(control2, end)) / 2;
