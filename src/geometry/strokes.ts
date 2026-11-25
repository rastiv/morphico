// Strokes: what the sets are drawn with — lines, circle arcs, cubics, ellipses, polylines and polygons with rounded
// corners. A stroke is a description; stroke-layout.ts turns strokes into cubic path numbers.
import { DEGREE, EPSILON, distanceBetween, unitVector } from './math.ts';
import type { Point, Stroke } from '../types.ts';

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
