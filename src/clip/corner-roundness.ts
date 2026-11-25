// Roundness of the clip shapes: 1 = Lucide's own corners … 0 = sharp.
import { DEGREE } from '../geometry/math.ts';
import type { Point, Stroke } from '../types.ts';
import { pointOnStroke } from './outline-normalizing.ts';

/** Lucide's corner arcs are small (radius 0.56 … 2.43); bigger arcs are part of the shape (circle, moon, droplet). */
const LARGEST_CORNER_RADIUS = 2.5;

const crossingOfLines = (point: Point, direction: Point, otherPoint: Point, otherDirection: Point): Point | null => {
  const determinant = direction[0] * otherDirection[1] - direction[1] * otherDirection[0];
  if (Math.abs(determinant) < 1e-9) return null;
  const along = ((otherPoint[0] - point[0]) * otherDirection[1] - (otherPoint[1] - point[1]) * otherDirection[0]) / determinant;
  return [point[0] + direction[0] * along, point[1] + direction[1] * along];
};

/** Moves a stroke's start (or end) to `point`; a cubic's neighbouring control point moves along, so its direction there stays. */
const withMovedEnd = (stroke: Stroke, which: 'start' | 'end', point: Point): Stroke => {
  if (stroke.kind === 'line') return which === 'start' ? { ...stroke, from: point } : { ...stroke, to: point };
  if (stroke.kind !== 'cubic') return stroke;
  const [start, control1, control2, end] = stroke.segment;
  if (which === 'start') {
    const shift: Point = [point[0] - start[0], point[1] - start[1]];
    return { kind: 'cubic', segment: [point, [control1[0] + shift[0], control1[1] + shift[1]], control2, end] };
  }
  const shift: Point = [point[0] - end[0], point[1] - end[1]];
  return { kind: 'cubic', segment: [start, control1, [control2[0] + shift[0], control2[1] + shift[1]], point] };
};

/**
 * Every corner arc (small, between two lines / cubics) shrinks towards the sharp corner where its two neighbours'
 * directions meet: radius × roundness, angles unchanged. At 0 the arc is a point on the corner. Same strokes in the
 * same order at any roundness, so morphs keep working.
 */
export const withCornerRoundness = (strokes: Stroke[], roundness: number): Stroke[] => {
  const result = strokes.slice();
  strokes.forEach((stroke, index) => {
    const previousIndex = (index - 1 + strokes.length) % strokes.length, nextIndex = (index + 1) % strokes.length;
    const isEdge = (neighbour: Stroke) => neighbour.kind === 'line' || neighbour.kind === 'cubic';
    if (stroke.kind !== 'arc' || stroke.radius > LARGEST_CORNER_RADIUS) return;
    if (!isEdge(strokes[previousIndex]) || !isEdge(strokes[nextIndex])) return;
    const turning = Math.sign(stroke.endAngle - stroke.startAngle);
    const tangent = (angle: number): Point => [-Math.sin(angle * DEGREE) * turning, Math.cos(angle * DEGREE) * turning];
    const start = pointOnStroke(stroke, 0), end = pointOnStroke(stroke, 1);
    const corner = crossingOfLines(start, tangent(stroke.startAngle), end, tangent(stroke.endAngle));
    if (!corner) return;
    const towardsCorner = ([x, y]: Point): Point => [corner[0] + (x - corner[0]) * roundness, corner[1] + (y - corner[1]) * roundness];
    result[index] = { ...stroke, center: towardsCorner(stroke.center), radius: stroke.radius * roundness };
    result[previousIndex] = withMovedEnd(result[previousIndex], 'end', towardsCorner(start));
    result[nextIndex] = withMovedEnd(result[nextIndex], 'start', towardsCorner(end));
  });
  return result;
};
