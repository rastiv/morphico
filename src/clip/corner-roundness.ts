// Roundness of the clip shapes: 1 = Lucide's own corners … 0 = sharp.
import { DEGREE } from '../geometry/math.ts';
import type { ArcStroke, Point, Stroke } from '../types.ts';
import { pointOnStroke } from './outline-normalizing.ts';

/** Lucide's corner arcs are small (radius 0.56 … 2.43); bigger arcs are part of the shape (circle, moon, droplet). */
const LARGEST_CORNER_RADIUS = 2.5;

const crossingOfLines = (point: Point, direction: Point, otherPoint: Point, otherDirection: Point): Point | null => {
  const determinant = direction[0] * otherDirection[1] - direction[1] * otherDirection[0];
  if (Math.abs(determinant) < 1e-9) return null;
  const along = ((otherPoint[0] - point[0]) * otherDirection[1] - (otherPoint[1] - point[1]) * otherDirection[0]) / determinant;
  return [point[0] + direction[0] * along, point[1] + direction[1] * along];
};

/** Where two circles cross — the crossing nearest `near` — or null where they don't meet. */
const crossingOfCircles = (centerA: Point, radiusA: number, centerB: Point, radiusB: number, near: Point): Point | null => {
  const offsetX = centerB[0] - centerA[0], offsetY = centerB[1] - centerA[1];
  const distance = Math.hypot(offsetX, offsetY);
  if (!distance || distance > radiusA + radiusB || distance < Math.abs(radiusA - radiusB)) return null;
  const along = (radiusA ** 2 - radiusB ** 2 + distance ** 2) / (2 * distance);
  const across = Math.sqrt(Math.max(0, radiusA ** 2 - along ** 2));
  const baseX = centerA[0] + (offsetX * along) / distance, baseY = centerA[1] + (offsetY * along) / distance;
  const crossings: Point[] = [
    [baseX - (offsetY * across) / distance, baseY + (offsetX * across) / distance],
    [baseX + (offsetY * across) / distance, baseY - (offsetX * across) / distance],
  ];
  const distanceToNear = ([x, y]: Point) => Math.hypot(x - near[0], y - near[1]);
  return distanceToNear(crossings[0]) <= distanceToNear(crossings[1]) ? crossings[0] : crossings[1];
};

const angleOf = (center: Point, [x, y]: Point): number => Math.atan2(y - center[1], x - center[0]) / DEGREE;
/** `angle` (degrees) moved by whole turns to lie nearest to `reference`, so an arc keeps its direction and size. */
const nearestTurn = (angle: number, reference: number): number => angle + 360 * Math.round((reference - angle) / 360);

/**
 * A corner arc between two arcs (the dip at the top of the heart) at a roundness below 1: a smaller arc touching both
 * neighbour circles the same way (from outside or inside), the neighbours shortened or lengthened to where it touches
 * them. At 0 it is a point where the two neighbour circles cross: a sharp corner. Null where they don't cross (the
 * tips of the astroid, the puzzle's knobs): those corners keep their own arc.
 */
const roundedBetweenArcs = (corner: ArcStroke, previous: ArcStroke, next: ArcStroke, roundness: number): [ArcStroke, ArcStroke, ArcStroke] | null => {
  if (roundness >= 1 || !crossingOfCircles(previous.center, previous.radius, next.center, next.radius, corner.center)) return null;
  // +1 = the corner arc touches the neighbour from outside (centres R + r apart), −1 = from inside (|R − r|)
  const side = (neighbour: ArcStroke): number => {
    const distance = Math.hypot(corner.center[0] - neighbour.center[0], corner.center[1] - neighbour.center[1]);
    return Math.abs(distance - (neighbour.radius + corner.radius)) <= Math.abs(distance - Math.abs(neighbour.radius - corner.radius)) ? 1 : -1;
  };
  const radius = corner.radius * roundness;
  const center = crossingOfCircles(
    previous.center, previous.radius + side(previous) * radius, next.center, next.radius + side(next) * radius, corner.center,
  );
  if (!center) return null;
  const touchingPoint = (neighbour: ArcStroke): Point => {
    const distance = Math.hypot(center[0] - neighbour.center[0], center[1] - neighbour.center[1]);
    return [
      neighbour.center[0] + ((center[0] - neighbour.center[0]) * neighbour.radius) / distance,
      neighbour.center[1] + ((center[1] - neighbour.center[1]) * neighbour.radius) / distance,
    ];
  };
  const previousTouch = touchingPoint(previous), nextTouch = touchingPoint(next);
  return [
    { ...previous, endAngle: nearestTurn(angleOf(previous.center, previousTouch), previous.endAngle) },
    {
      ...corner, center, radius,
      startAngle: radius ? nearestTurn(angleOf(center, previousTouch), corner.startAngle) : corner.startAngle,
      endAngle: radius ? nearestTurn(angleOf(center, nextTouch), corner.endAngle) : corner.endAngle,
    },
    { ...next, startAngle: nearestTurn(angleOf(next.center, nextTouch), next.startAngle) },
  ];
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
 * directions meet: radius × roundness, angles unchanged. At 0 the arc is a point on the corner. A corner arc between
 * two arcs is rounded by roundedBetweenArcs. Same strokes in the same order at any roundness, so morphs keep working.
 */
export const withCornerRoundness = (strokes: Stroke[], roundness: number): Stroke[] => {
  const result = strokes.slice();
  strokes.forEach((stroke, index) => {
    const previousIndex = (index - 1 + strokes.length) % strokes.length, nextIndex = (index + 1) % strokes.length;
    const isEdge = (neighbour: Stroke) => neighbour.kind === 'line' || neighbour.kind === 'cubic';
    if (stroke.kind !== 'arc' || stroke.radius > LARGEST_CORNER_RADIUS) return;
    const previous = result[previousIndex], next = result[nextIndex];
    if (previous.kind === 'arc' && next.kind === 'arc') {
      const rounded = roundedBetweenArcs(stroke, previous, next, roundness);
      if (rounded) [result[previousIndex], result[index], result[nextIndex]] = rounded;
      return;
    }
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
