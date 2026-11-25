// Laying strokes out as cubic segments: a piece of any stroke as one cubic, segments placed along the strokes by
// breakpoints, and the default breakpoints (segments spread by length).
import { DEGREE, EPSILON, distanceBetween, interpolatePoint, splitCubic } from './math.ts';
import { fromSegments } from './path-numbers.ts';
import type { ArcStroke, CubicSegment, PathNumbers, Point, Stroke } from '../types.ts';

/** Largest arc one cubic segment may cover: up to 90° the cubic is visually exact. */
const MAX_ARC_PER_SEGMENT = 90;

const arcSweep = (stroke: ArcStroke): number => Math.abs(stroke.endAngle - stroke.startAngle);

/**
 * The part of a stroke between two progress values (0…1) as one cubic segment.
 * A piece of a line/arc/cubic is exactly a line/arc/cubic, so segment ends can slide along a stroke
 * without changing how it looks.
 */
export const strokePiece = (stroke: Stroke, startProgress: number, endProgress: number): CubicSegment => {
  switch (stroke.kind) {
    case 'line': {
      const start = interpolatePoint(stroke.from, stroke.to, startProgress);
      const end = interpolatePoint(stroke.from, stroke.to, endProgress);
      return [start, interpolatePoint(start, end, 1 / 3), interpolatePoint(start, end, 2 / 3), end];
    }
    case 'arc': {
      const { center: [centerX, centerY], radius, startAngle, endAngle } = stroke;
      const startRadians = (startAngle + (endAngle - startAngle) * startProgress) * DEGREE;
      const endRadians = (startAngle + (endAngle - startAngle) * endProgress) * DEGREE;
      // standard arc approximation: control handle length = 4/3 · tan(θ/4) · r
      const handleLength = (4 / 3) * Math.tan((endRadians - startRadians) / 4) * radius;
      const start: Point = [centerX + radius * Math.cos(startRadians), centerY + radius * Math.sin(startRadians)];
      const end: Point = [centerX + radius * Math.cos(endRadians), centerY + radius * Math.sin(endRadians)];
      return [
        start,
        [start[0] - handleLength * Math.sin(startRadians), start[1] + handleLength * Math.cos(startRadians)],
        [end[0] + handleLength * Math.sin(endRadians), end[1] - handleLength * Math.cos(endRadians)],
        end,
      ];
    }
    case 'cubic': {
      if (startProgress >= 1) return [stroke.segment[3], stroke.segment[3], stroke.segment[3], stroke.segment[3]];
      const [, rest] = splitCubic(stroke.segment, startProgress);
      return splitCubic(rest, (endProgress - startProgress) / (1 - startProgress))[0];
    }
  }
};

/** Lays out cubic segments along the strokes; see `PairLayout.breakpoints`. */
export const layoutStrokes = (strokes: Stroke[], breakpoints: number[]): PathNumbers =>
  fromSegments(breakpoints.slice(1).map((segmentEnd, segmentIndex) => {
    const segmentStart = breakpoints[segmentIndex];
    const strokeIndex = Math.min(Math.floor(segmentStart + EPSILON), strokes.length - 1);
    return strokePiece(strokes[strokeIndex], segmentStart - strokeIndex, segmentEnd - strokeIndex);
  }));

const CUBIC_LENGTH_SAMPLES = 64;

const strokeLength = (stroke: Stroke): number => {
  switch (stroke.kind) {
    case 'line': return distanceBetween(stroke.from, stroke.to);
    case 'arc': return arcSweep(stroke) * DEGREE * stroke.radius;
    case 'cubic': {
      let length = 0, previousPoint = stroke.segment[0];
      for (let sample = 1; sample <= CUBIC_LENGTH_SAMPLES; sample++) {
        const point = strokePiece(stroke, 0, sample / CUBIC_LENGTH_SAMPLES)[3];
        length += distanceBetween(previousPoint, point);
        previousPoint = point;
      }
      return length;
    }
  }
};

/** Default breakpoints: segments spread over the strokes by length, arcs get at least one segment per 90°. */
export const defaultBreakpoints = (strokes: Stroke[], segmentCount: number): number[] => {
  const lengths = strokes.map(strokeLength);
  const segmentsPerStroke = strokes.map((stroke) =>
    (stroke.kind === 'arc' ? Math.ceil(arcSweep(stroke) / MAX_ARC_PER_SEGMENT - EPSILON) : 1));
  const usedSegments = () => segmentsPerStroke.reduce((sum, count) => sum + count, 0);
  if (usedSegments() > segmentCount) throw new Error(`needs ${usedSegments()} segments, the set has ${segmentCount}`);
  while (usedSegments() < segmentCount) {
    // one more segment for the stroke whose segments are currently the longest
    let longest = 0;
    for (let strokeIndex = 1; strokeIndex < strokes.length; strokeIndex++) {
      const segmentLength = lengths[strokeIndex] / segmentsPerStroke[strokeIndex];
      if (segmentLength > lengths[longest] / segmentsPerStroke[longest] + EPSILON) longest = strokeIndex;
    }
    segmentsPerStroke[longest]++;
  }
  const breakpoints = [0];
  segmentsPerStroke.forEach((count, strokeIndex) => {
    for (let part = 1; part <= count; part++) breakpoints.push(+(strokeIndex + part / count).toFixed(6));
  });
  return breakpoints;
};
