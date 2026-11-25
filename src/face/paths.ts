// The SVG path data of a face: every piece as a smooth closed curve through its points.
import type { FacePieces } from './pieces.ts';
import type { Point } from '../types.ts';

const formatNumber = (value: number): string => String(Math.round(value * 1000) / 1000);

/** A smooth closed curve through the points: each handle points along the neighbours' chord and is a third of its own
 * segment long (no loops where points sit close together, as at a band's round end). Empty for a hidden piece. */
export const smoothClosedPath = (points: Point[]): string => {
  const [firstX, firstY] = points[0];
  if (points.every(([x, y]) => Math.abs(x - firstX) < 1e-6 && Math.abs(y - firstY) < 1e-6)) return '';
  const count = points.length;
  const directionAt = (index: number): Point => {
    const previous = points[(index - 1 + count) % count];
    const next = points[(index + 1) % count];
    const length = Math.hypot(next[0] - previous[0], next[1] - previous[1]) || 1;
    return [(next[0] - previous[0]) / length, (next[1] - previous[1]) / length];
  };
  let path = `M${formatNumber(firstX)} ${formatNumber(firstY)}`;
  for (let index = 0; index < count; index++) {
    const start = points[index];
    const end = points[(index + 1) % count];
    const handleLength = Math.hypot(end[0] - start[0], end[1] - start[1]) / 3;
    const startDirection = directionAt(index);
    const endDirection = directionAt(index + 1);
    const control1: Point = [start[0] + startDirection[0] * handleLength, start[1] + startDirection[1] * handleLength];
    const control2: Point = [end[0] - endDirection[0] * handleLength, end[1] - endDirection[1] * handleLength];
    path += `C${[...control1, ...control2, ...end].map(formatNumber).join(' ')}`;
  }
  return `${path}Z`;
};

export interface FacePaths {
  /** Brows, eyes and mouth (one colour). */
  features: string;
  /** Both eyes, to clip the pupils with. */
  eyes: string;
  pupils: string;
}

export const facePaths = (face: FacePieces): FacePaths => ({
  features: [face.leftBrow, face.rightBrow, face.leftEye, face.rightEye, face.mouth].map(smoothClosedPath).join(''),
  eyes: [face.leftEye, face.rightEye].map(smoothClosedPath).join(''),
  pupils: [face.leftPupil, face.rightPupil].map(smoothClosedPath).join(''),
});
