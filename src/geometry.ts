// Geometry: strokes (lines, arcs, cubics) → cubic path numbers, plus the pair layouts that improve morphs.
// Pure functions, no DOM access: safe to import anywhere (browser, Node, SSR).
import type { ArcStroke, CubicSegment, IconSet, PairLayout, PathNumbers, Point, Stroke } from './types.ts';

const DEGREE = Math.PI / 180;
const ICON_CENTER = 12;
/** Largest arc one cubic segment may cover: up to 90° the cubic is visually exact. */
const MAX_ARC_PER_SEGMENT = 90;
const EPSILON = 1e-9;

// ---- strokes ----

export const line = (fromX: number, fromY: number, toX: number, toY: number): Stroke =>
  ({ kind: 'line', from: [fromX, fromY], to: [toX, toY] });

/** Angles in degrees. Because y points down, `endAngle > startAngle` draws clockwise on screen. */
export const arc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number): Stroke =>
  ({ kind: 'arc', center: [centerX, centerY], radius, startAngle, endAngle });

export const cubic = (
  startX: number, startY: number, control1X: number, control1Y: number,
  control2X: number, control2Y: number, endX: number, endY: number,
): Stroke => ({ kind: 'cubic', segment: [[startX, startY], [control1X, control1Y], [control2X, control2Y], [endX, endY]] });

export const pointOnCircle = (centerX: number, centerY: number, radius: number, angle: number): Point =>
  [centerX + radius * Math.cos(angle * DEGREE), centerY + radius * Math.sin(angle * DEGREE)];

/** Control handle length of a quarter ellipse as a fraction of its radius (4/3 · (√2 − 1)). */
const QUARTER_HANDLE = (4 / 3) * (Math.SQRT2 - 1);

/** A full ellipse as four cubic quarters, drawn counter-clockwise on screen, starting at the top. */
export const ellipse = (centerX: number, centerY: number, radiusX: number, radiusY: number): Stroke[] => {
  const handleX = QUARTER_HANDLE * radiusX, handleY = QUARTER_HANDLE * radiusY;
  const top = centerY - radiusY, bottom = centerY + radiusY, left = centerX - radiusX, right = centerX + radiusX;
  return [
    cubic(centerX, top, centerX - handleX, top, left, centerY - handleY, left, centerY),
    cubic(left, centerY, left, centerY + handleY, centerX - handleX, bottom, centerX, bottom),
    cubic(centerX, bottom, centerX + handleX, bottom, right, centerY + handleY, right, centerY),
    cubic(right, centerY, right, centerY - handleY, centerX + handleX, top, centerX, top),
  ];
};

const arcSweep = (stroke: ArcStroke): number => Math.abs(stroke.endAngle - stroke.startAngle);

// ---- path numbers ⇄ segments ----

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

const formatNumber = (value: number): string => String(+value.toFixed(3));

/** SVG `d` attribute: `M x y` followed by one `C` per segment. */
export const toPathData = (path: PathNumbers): string =>
  `M${formatNumber(path[0])} ${formatNumber(path[1])}` + toSegments(path)
    .map(([, control1, control2, end]) => `C${[...control1, ...control2, ...end].map(formatNumber).join(' ')}`)
    .join('');

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

// ---- pieces of strokes ----

const interpolatePoint = (from: Point, to: Point, progress: number): Point =>
  [from[0] + (to[0] - from[0]) * progress, from[1] + (to[1] - from[1]) * progress];

/** Splits a cubic into two cubics at `progress` (de Casteljau). */
const splitCubic = ([start, control1, control2, end]: CubicSegment, progress: number): [CubicSegment, CubicSegment] => {
  const startToControl1 = interpolatePoint(start, control1, progress);
  const control1ToControl2 = interpolatePoint(control1, control2, progress);
  const control2ToEnd = interpolatePoint(control2, end, progress);
  const leftInner = interpolatePoint(startToControl1, control1ToControl2, progress);
  const rightInner = interpolatePoint(control1ToControl2, control2ToEnd, progress);
  const splitPoint = interpolatePoint(leftInner, rightInner, progress);
  return [[start, startToControl1, leftInner, splitPoint], [splitPoint, rightInner, control2ToEnd, end]];
};

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
const distance = (from: Point, to: Point): number => Math.hypot(to[0] - from[0], to[1] - from[1]);

const strokeLength = (stroke: Stroke): number => {
  switch (stroke.kind) {
    case 'line': return distance(stroke.from, stroke.to);
    case 'arc': return arcSweep(stroke) * DEGREE * stroke.radius;
    case 'cubic': {
      let length = 0, previousPoint = stroke.segment[0];
      for (let sample = 1; sample <= CUBIC_LENGTH_SAMPLES; sample++) {
        const point = strokePiece(stroke, 0, sample / CUBIC_LENGTH_SAMPLES)[3];
        length += distance(previousPoint, point);
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

// ---- icon sets ----

/** Every state of the set laid out with its default breakpoints. */
export const defaultShapes = (iconSet: IconSet): Record<string, PathNumbers> =>
  Object.fromEntries(Object.entries(iconSet.strokes)
    .map(([state, strokes]) => [state, layoutStrokes(strokes, defaultBreakpoints(strokes, iconSet.segmentCount))]));

/** The shape of `state` laid out for morphing to or from `otherState`. */
export const shapeForPair = (
  iconSet: IconSet, shapes: Record<string, PathNumbers>, state: string, otherState: string,
): PathNumbers => {
  const pairLayout = iconSet.pairLayouts[state]?.[otherState];
  if (!pairLayout) return shapes[state];
  const strokes = pairLayout.tracing ? iconSet.alternativeStrokes[pairLayout.tracing] : iconSet.strokes[state];
  const laidOut = pairLayout.breakpoints ? layoutStrokes(strokes, pairLayout.breakpoints) : shapes[state];
  const reordered = reorderSegments(laidOut, pairLayout);
  return pairLayout.rotation ? rotateAroundCenter(reordered, pairLayout.rotation) : reordered;
};
