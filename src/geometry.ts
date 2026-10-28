// Geometry: strokes (lines, arcs, cubics) → cubic path numbers, plus the pair layouts that improve morphs.
// Pure functions, no DOM access: safe to import anywhere (browser, Node, SSR).
import type { ArcStroke, CubicSegment, IconSet, PairLayout, PathNumbers, PieceSet, Point, Stroke } from './types.ts';

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

/** The same line or arc, drawn in the opposite direction. */
export const reversedStroke = (stroke: Stroke): Stroke => {
  if (stroke.kind === 'line') return { ...stroke, from: stroke.to, to: stroke.from };
  if (stroke.kind === 'arc') return { ...stroke, startAngle: stroke.endAngle, endAngle: stroke.startAngle };
  const [start, control1, control2, end] = stroke.segment;
  return { kind: 'cubic', segment: [end, control2, control1, start] };
};

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

/**
 * A polyline whose corners are rounded: straight lines joined by tangent circle arcs.
 * `radii[index]` rounds the corner at `points[index]` (a single number rounds every corner; 0 = sharp corner).
 * Straight-through points and reversals (going back along the same line) always stay sharp.
 */
export const roundedPolyline = (points: Point[], radii: number | number[]): Stroke[] => {
  const strokes: Stroke[] = [];
  const addLine = (from: Point, to: Point) => {
    if (Math.hypot(to[0] - from[0], to[1] - from[1]) > EPSILON) strokes.push(line(...from, ...to));
  };
  let current = points[0];
  for (let index = 1; index < points.length; index++) {
    const corner = points[index];
    const next = points[index + 1];
    const radius = Array.isArray(radii) ? (radii[index] ?? 0) : radii;
    if (!next || radius <= 0) {
      addLine(current, corner);
      current = corner;
      continue;
    }
    const incoming = unitVector(current, corner), outgoing = unitVector(corner, next);
    const cross = incoming[0] * outgoing[1] - incoming[1] * outgoing[0];
    const turn = Math.atan2(cross, incoming[0] * outgoing[0] + incoming[1] * outgoing[1]); // radians, > 0 = clockwise
    if (Math.abs(turn) < 1e-6 || Math.abs(turn) > Math.PI - 1e-6) {
      addLine(current, corner);
      current = corner;
      continue;
    }
    const tangentDistance = radius * Math.tan(Math.abs(turn) / 2);
    const arcStart: Point = [corner[0] - incoming[0] * tangentDistance, corner[1] - incoming[1] * tangentDistance];
    // the centre lies on the inside of the turn
    const inward: Point = turn > 0 ? [-incoming[1], incoming[0]] : [incoming[1], -incoming[0]];
    const center: Point = [arcStart[0] + inward[0] * radius, arcStart[1] + inward[1] * radius];
    const startAngle = Math.atan2(arcStart[1] - center[1], arcStart[0] - center[0]) / DEGREE;
    addLine(current, arcStart);
    strokes.push(arc(center[0], center[1], radius, startAngle, startAngle + turn / DEGREE));
    current = [corner[0] + outgoing[0] * tangentDistance, corner[1] + outgoing[1] * tangentDistance];
  }
  return strokes;
};

/**
 * A closed polygon with every corner rounded by `radius` (clamped per corner so neighbouring arcs never overlap).
 * Always a line and an arc per corner, whatever the radius, so pair layouts (stroke indices) stay valid; at radius 0
 * the arc shrinks to the corner point, so the corner is really sharp (and `stroke-linejoin` decides how it looks).
 * Starts after the first corner with a line (`startsWithArc`: with the arc of the first corner), clockwise if the
 * corners are listed clockwise on screen.
 */
export const roundedPolygon = (corners: Point[], radius: number, startsWithArc = false): Stroke[] => {
  const cornerCount = corners.length;
  const roundedCorners = corners.map((corner, index) => {
    const previous = corners[(index + cornerCount - 1) % cornerCount], next = corners[(index + 1) % cornerCount];
    const incoming = unitVector(previous, corner), outgoing = unitVector(corner, next);
    const turn = Math.atan2(incoming[0] * outgoing[1] - incoming[1] * outgoing[0], incoming[0] * outgoing[0] + incoming[1] * outgoing[1]);
    const halfTurnTangent = Math.tan(Math.abs(turn) / 2);
    const shortestHalfEdge = Math.min(distanceBetween(previous, corner), distanceBetween(corner, next)) / 2;
    const cornerRadius = Math.max(0, Math.min(radius, shortestHalfEdge / halfTurnTangent));
    const tangentDistance = cornerRadius * halfTurnTangent;
    const arcStart: Point = [corner[0] - incoming[0] * tangentDistance, corner[1] - incoming[1] * tangentDistance];
    const arcEnd: Point = [corner[0] + outgoing[0] * tangentDistance, corner[1] + outgoing[1] * tangentDistance];
    const inward: Point = turn > 0 ? [-incoming[1], incoming[0]] : [incoming[1], -incoming[0]];
    const center: Point = [arcStart[0] + inward[0] * cornerRadius, arcStart[1] + inward[1] * cornerRadius];
    const startAngle = Math.atan2(arcStart[1] - center[1], arcStart[0] - center[0]) / DEGREE;
    return { arcStart, arcEnd, arc: arc(center[0], center[1], cornerRadius, startAngle, startAngle + turn / DEGREE) };
  });
  const strokes = roundedCorners.flatMap((roundedCorner, index) => {
    const next = roundedCorners[(index + 1) % cornerCount];
    return [line(...roundedCorner.arcEnd, ...next.arcStart), next.arc];
  });
  // the list above starts after corner 0 with a line and ends with corner 0's arc
  return startsWithArc ? [strokes[strokes.length - 1], ...strokes.slice(0, -1)] : strokes;
};

const distanceBetween = (from: Point, to: Point): number => Math.hypot(to[0] - from[0], to[1] - from[1]);

const unitVector = (from: Point, to: Point): Point => {
  const length = Math.hypot(to[0] - from[0], to[1] - from[1]);
  return [(to[0] - from[0]) / length, (to[1] - from[1]) / length];
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

/** A piece whose end lands on its start is closed (`Z`): its first corner then gets the line join, not two line ends. */
const isClosedPiece = (piece: PathNumbers): boolean =>
  Math.hypot(piece[piece.length - 2] - piece[0], piece[piece.length - 1] - piece[1]) < 1e-6;

const hasLength = ([start, control1, control2, end]: CubicSegment): boolean =>
  [control1, control2, end].some((point) => Math.hypot(point[0] - start[0], point[1] - start[1]) > 1e-6);

/**
 * The segments of a piece as written to SVG. A closed piece starts at its first segment with length: a zero-length
 * first segment (a corner of radius 0) has no direction, so browsers would draw the closing corner wrongly.
 * Only the written order changes, not the picture.
 */
const writtenSegments = (piece: PathNumbers): CubicSegment[] => {
  const segments = toSegments(piece);
  if (!isClosedPiece(piece)) return segments;
  const firstWithLength = Math.max(0, segments.findIndex(hasLength));
  return [...segments.slice(firstWithLength), ...segments.slice(0, firstWithLength)];
};

/** A piece shrunk to a single point: not drawn at all (round line ends would show it as a dot). */
const isPoint = (piece: PathNumbers): boolean =>
  piece.every((value, index) => Math.abs(value - piece[index % 2]) < 1e-6);

/**
 * SVG `d` attribute: per piece `M x y` followed by one `C` per segment (`pieceLength`: see pieceLengthOf).
 * Pieces shrunk to a single point are left out.
 */
export const toPathData = (path: PathNumbers, pieceLength = path.length): string =>
  splitPieces(path, pieceLength).filter((piece) => !isPoint(piece)).map((piece) => {
    const segments = writtenSegments(piece);
    const [startX, startY] = segments[0][0];
    return `M${formatNumber(startX)} ${formatNumber(startY)}` + segments
      .map(([, control1, control2, end]) => `C${[...control1, ...control2, ...end].map(formatNumber).join(' ')}`)
      .join('') + (isClosedPiece(piece) ? 'Z' : '');
  }).join('');

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

// A shape of a set with several pieces is the path numbers of every piece one after another.

/** The set itself is the first piece. */
export const piecesOf = (iconSet: IconSet): PieceSet[] => [iconSet, ...(iconSet.morePieces ?? [])];

/** Path numbers of one piece: start point + 6 per segment. */
export const pieceLengthOf = (iconSet: IconSet): number => 2 + 6 * iconSet.segmentCount;

/** Splits a shape into the path numbers of its pieces. */
export const splitPieces = (path: PathNumbers, pieceLength: number): PathNumbers[] =>
  Array.from({ length: path.length / pieceLength }, (_, pieceIndex) =>
    path.slice(pieceIndex * pieceLength, (pieceIndex + 1) * pieceLength));

const strokesOf = (pieceSet: PieceSet, state: string, pieceIndex: number): Stroke[] => {
  const strokes = pieceSet.strokes[state];
  if (!strokes) throw new Error(`state "${state}" has no strokes in piece ${pieceIndex}`);
  return strokes;
};

/** Every state of the set laid out with its default breakpoints. */
export const defaultShapes = (iconSet: IconSet): Record<string, PathNumbers> =>
  Object.fromEntries(Object.keys(iconSet.strokes).map((state) => [state, piecesOf(iconSet).flatMap((pieceSet, pieceIndex) => {
    const strokes = strokesOf(pieceSet, state, pieceIndex);
    return layoutStrokes(strokes, defaultBreakpoints(strokes, iconSet.segmentCount));
  })]));

/**
 * `shape` pressed flat onto the straight line `from` → `to`: every point moves onto the line, keeping its position
 * along the line's direction (the shape's extent along it is stretched to the line's length).
 */
export const flattenOntoLine = (shape: PathNumbers, from: Point, to: Point): PathNumbers => {
  const direction: Point = [to[0] - from[0], to[1] - from[1]];
  const positions = Array.from({ length: shape.length / 2 }, (_, pointIndex) =>
    shape[2 * pointIndex] * direction[0] + shape[2 * pointIndex + 1] * direction[1]);
  const lowest = Math.min(...positions), highest = Math.max(...positions);
  return positions.flatMap((position) => {
    const along = highest - lowest > EPSILON ? (position - lowest) / (highest - lowest) : 0.5;
    return [from[0] + direction[0] * along, from[1] + direction[1] * along];
  });
};

/** The shape of `state` laid out for morphing to or from `otherState` (each piece by its own pair layout). */
export const shapeForPair = (
  iconSet: IconSet, shapes: Record<string, PathNumbers>, state: string, otherState: string,
): PathNumbers => {
  const pieceLength = pieceLengthOf(iconSet);
  const pieceForPair = (pieceSet: PieceSet, pieceIndex: number, pieceState: string, pieceOther: string, mayFlatten: boolean): PathNumbers => {
    const defaultPiece = splitPieces(shapes[pieceState], pieceLength)[pieceIndex];
    const pairLayout = pieceSet.pairLayouts[pieceState]?.[pieceOther];
    if (!pairLayout) return defaultPiece;
    if ((pairLayout.draw || pairLayout.wipe) && mayFlatten) {
      // not there: the other side's piece shrunk to its start point (not drawn); the morph draws it (see drawnPieces)
      const otherPiece = pieceForPair(pieceSet, pieceIndex, pieceOther, pieceState, false);
      return Array.from({ length: pieceLength }, (_, index) => otherPiece[index % 2]);
    }
    if (pairLayout.flatten && mayFlatten) {
      const [line] = strokesOf(pieceSet, pieceState, pieceIndex);
      if (line.kind !== 'line') throw new Error(`flatten: state "${pieceState}" must be one straight line`);
      // the other side as it is laid out for this pair (if it flattens too, its plain layout)
      return flattenOntoLine(pieceForPair(pieceSet, pieceIndex, pieceOther, pieceState, false), line.from, line.to);
    }
    const strokes = pairLayout.tracing ? pieceSet.alternativeStrokes[pairLayout.tracing] : strokesOf(pieceSet, pieceState, pieceIndex);
    const laidOut = pairLayout.breakpoints ? layoutStrokes(strokes, pairLayout.breakpoints) : defaultPiece;
    const reordered = reorderSegments(laidOut, pairLayout);
    return pairLayout.rotation ? rotateAroundCenter(reordered, pairLayout.rotation) : reordered;
  };
  return piecesOf(iconSet).flatMap((pieceSet, pieceIndex) => pieceForPair(pieceSet, pieceIndex, state, otherState, true));
};

// ---- drawing a piece along its path (PairLayout.draw) ----

/** Rough length of a cubic segment: the average of its chord and its control polygon. */
const segmentLength = ([start, control1, control2, end]: CubicSegment): number => {
  const distance = (from: Point, to: Point) => Math.hypot(to[0] - from[0], to[1] - from[1]);
  return (distance(start, end) + distance(start, control1) + distance(control1, control2) + distance(control2, end)) / 2;
};

/**
 * The part of a piece between two shares of its length (0…1). The segments outside shrink to the part's ends,
 * so the number count stays the same.
 */
const pieceBetween = (piece: PathNumbers, fromFraction: number, toFraction: number): PathNumbers => {
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

/** A piece drawn along its path during a morph: drawn in (it appears) or erased (it goes). */
export interface DrawnPiece {
  pieceIndex: number;
  drawsIn: boolean;
  /** When the drawing in happens: from `start` to `end` of the morph (0…1); erasing runs it in reverse. */
  start: number;
  end: number;
  /** Revealed behind a moving edge instead of along its path (PairLayout.wipe), moving with it (PairLayout.slide). */
  wipe?: 'left' | 'right';
  slide?: boolean;
}

/** The pieces drawn (or erased) along their path when morphing `state` → `otherState` (PairLayout.draw). */
export const drawnPieces = (iconSet: IconSet, state: string, otherState: string): DrawnPiece[] =>
  piecesOf(iconSet).flatMap((pieceSet, pieceIndex): DrawnPiece[] => {
    const windowOf = (draw: NonNullable<PairLayout['draw']>) =>
      (Array.isArray(draw) ? draw : typeof draw === 'number' ? [1 - draw, 1] : [0, 1]);
    // the layout of the state where the piece is absent
    const absentIn = (absentState: string, presentState: string) => {
      const pairLayout = pieceSet.pairLayouts[absentState]?.[presentState];
      return pairLayout?.draw || pairLayout?.wipe ? pairLayout : undefined;
    };
    const drawIn = absentIn(state, otherState);
    const pairLayout = drawIn ?? absentIn(otherState, state);
    if (!pairLayout) return [];
    const [start, end] = windowOf(pairLayout.draw || true);
    return [{ pieceIndex, drawsIn: Boolean(drawIn), start, end, wipe: pairLayout.wipe, slide: pairLayout.slide }];
  });

/**
 * A frame of a morph `from` → `to` at `progress` with the drawn pieces replaced: drawn in from the start along
 * `to`'s piece, or erased back along `from`'s piece.
 */
export const withDrawnPieces = (
  frame: PathNumbers, from: PathNumbers, to: PathNumbers, progress: number, pieceLength: number, drawn: DrawnPiece[],
): PathNumbers => {
  if (!drawn.length) return frame;
  const presentPiece = ({ pieceIndex, drawsIn }: DrawnPiece) =>
    (drawsIn ? to : from).slice(pieceIndex * pieceLength, (pieceIndex + 1) * pieceLength);
  // one edge for every wipe of the morph, riding at the front of the (first) sliding piece
  const slider = drawn.find((piece) => piece.slide && piece.wipe);
  const edgeRange = wipeRange(slider ? presentPiece(slider) : null, slider?.wipe ?? 'right');
  const result = frame.slice();
  for (const drawnPiece of drawn) {
    const { pieceIndex, drawsIn, start, end, wipe, slide } = drawnPiece;
    const present = presentPiece(drawnPiece);
    // erasing is drawing in played backwards
    const fraction = ((drawsIn ? progress : 1 - progress) - start) / (end - start);
    result.splice(pieceIndex * pieceLength, pieceLength,
      ...(wipe ? wipePiece(present, fraction, wipe, edgeRange, slide) : trimPiece(present, fraction)));
  }
  return result;
};
