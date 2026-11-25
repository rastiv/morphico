// Bands: a thick curved stroke with round ends (arched brows, a smile, closed eyes), as OUTLINE_POINTS points clockwise
// from the top middle, at the same angles as a blob's points.
import { OUTLINE_POINTS } from './pieces.ts';
import type { Point } from '../types.ts';

interface BandOptions {
  from: Point;
  to: Point;
  /** How far the middle bows out: positive = up (∩, an arched brow), negative = down (∪, a smile). */
  bend: number;
  thickness: number;
  /** Thickness at the ends as a share of the middle's (1 = even). */
  endShare?: number;
}

export const band = (options: BandOptions): Point[] => {
  const { from, to, bend, thickness, endShare = 1 } = options;
  const chordX = to[0] - from[0];
  const chordY = to[1] - from[1];
  const chordLength = Math.hypot(chordX, chordY);
  // the quadratic's control point sits twice as far out as the curve's middle
  const control: Point = [
    (from[0] + to[0]) / 2 + ((2 * bend * chordY) / chordLength),
    (from[1] + to[1]) / 2 - ((2 * bend * chordX) / chordLength),
  ];
  const pointAt = (along: number): Point => {
    const rest = 1 - along;
    return [
      rest * rest * from[0] + 2 * rest * along * control[0] + along * along * to[0],
      rest * rest * from[1] + 2 * rest * along * control[1] + along * along * to[1],
    ];
  };
  const tangentAt = (along: number): Point => {
    const tangentX = 2 * (1 - along) * (control[0] - from[0]) + 2 * along * (to[0] - control[0]);
    const tangentY = 2 * (1 - along) * (control[1] - from[1]) + 2 * along * (to[1] - control[1]);
    const length = Math.hypot(tangentX, tangentY);
    return [tangentX / length, tangentY / length];
  };
  const thicknessAt = (along: number): number => thickness * (endShare + (1 - endShare) * Math.sin(Math.PI * along));
  // side 1 = the upper edge (the left normal of a rightward curve), -1 = the lower edge
  const edge = (along: number, side: 1 | -1): Point => {
    const [x, y] = pointAt(along);
    const [tangentX, tangentY] = tangentAt(along);
    const offset = (side * thicknessAt(along)) / 2;
    return [x + tangentY * offset, y - tangentX * offset];
  };
  // a point on the half circle around an end: turn -90° = on the upper edge, 0 = the tip, 90° = on the lower edge
  const capPoint = (along: 0 | 1, turn: number): Point => {
    const [x, y] = pointAt(along);
    const [tangentX, tangentY] = tangentAt(along);
    const radius = thicknessAt(along) / 2;
    const outward = along === 1 ? 1 : -1;
    const alongTangent = outward * Math.cos(turn) * radius;
    const towardsLower = outward * Math.sin(turn) * radius;
    return [x + tangentX * alongTangent - tangentY * towardsLower, y + tangentY * alongTangent + tangentX * towardsLower];
  };
  // clockwise from the top middle at the same angles as a blob's points (a quarter = the right end, half = the bottom
  // middle, three quarters = the left end); the points within 30° of an end lie on its half circle, the rest along the
  // edges
  const capShare = Math.sin(Math.PI / 3);
  return Array.from({ length: OUTLINE_POINTS }, (_, index): Point => {
    const angle = (2 * Math.PI * index) / OUTLINE_POINTS;
    const sine = Math.sin(angle);
    if (Math.abs(sine) < capShare - 1e-9) return edge(0.5 + (0.5 * sine) / capShare, Math.cos(angle) > 0 ? 1 : -1);
    // the angle's distance past the cap's start, stretched from ±30° around the end to ±90° around the half circle
    const endAngle = sine > 0 ? Math.PI / 2 : (3 * Math.PI) / 2;
    return capPoint(sine > 0 ? 1 : 0, (angle - endAngle) * 3);
  });
};
