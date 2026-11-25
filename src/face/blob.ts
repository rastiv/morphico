// Blobs: ellipses that can be squarer, egg-shaped, turned and cut by a straight lid — most pieces of a face (eyes,
// pupils, flat brows, mouths). A blob is resampled to OUTLINE_POINTS points clockwise from its top.
import { OUTLINE_POINTS } from './pieces.ts';
import type { Point } from '../types.ts';

const DENSE_SAMPLES = 360;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const rotatePoint = ([x, y]: Point, degrees: number): Point => {
  const angle = toRadians(degrees);
  return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
};

interface BlobOptions {
  centre: Point;
  width: number;
  height: number;
  /** Degrees, clockwise (positive = the right end goes down). */
  rotation?: number;
  /** 0 = ellipse … 1 = almost a rounded rectangle. */
  squareness?: number;
  /** Width at the top compared with the bottom: below 1 = an egg with its narrow end up. */
  topScale?: number;
  /** A straight line cutting the top off (eyelid, the flat top of a "D" mouth): its y at the shape's left and right edge. */
  cutTop?: [left: number, right: number];
  /** The same for the bottom (the flat bottom of a dome brow). */
  cutBottom?: [left: number, right: number];
}

const denseBlobOutline = (options: BlobOptions): Point[] => {
  const { centre, width, height, rotation = 0, squareness = 0, topScale = 1 } = options;
  const exponent = 2 + squareness * 6;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const outline: Point[] = [];
  for (let index = 0; index < DENSE_SAMPLES; index++) {
    const angle = toRadians(-90 + (360 * index) / DENSE_SAMPLES);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const y = halfHeight * Math.sign(sine) * Math.abs(sine) ** (2 / exponent);
    const widthScale = 1 + ((topScale - 1) * (halfHeight - y)) / (2 * halfHeight);
    const x = halfWidth * widthScale * Math.sign(cosine) * Math.abs(cosine) ** (2 / exponent);
    const [turnedX, turnedY] = rotatePoint([x, y], rotation);
    outline.push([centre[0] + turnedX, centre[1] + turnedY]);
  }
  const xs = outline.map(([x]) => x);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const lineY = ([leftY, rightY]: [number, number], x: number): number => leftY + ((rightY - leftY) * (x - left)) / (right - left);
  return outline.map(([x, y]): Point => {
    let cutY = y;
    if (options.cutTop) cutY = Math.max(cutY, lineY(options.cutTop, x));
    if (options.cutBottom) cutY = Math.min(cutY, lineY(options.cutBottom, x));
    return [x, cutY];
  });
};

/** OUTLINE_POINTS points of a star-shaped outline, on rays at even angles from its box's centre (measured in the box
 * stretched to a square, so a long flat shape still gets points on its round ends). */
const resampleByAngle = (outline: Point[]): Point[] => {
  const xs = outline.map(([x]) => x);
  const ys = outline.map(([, y]) => y);
  const centreX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centreY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const halfX = Math.max((Math.max(...xs) - Math.min(...xs)) / 2, 1e-9);
  const halfY = Math.max((Math.max(...ys) - Math.min(...ys)) / 2, 1e-9);
  const normalized = outline.map(([x, y]): Point => [(x - centreX) / halfX, (y - centreY) / halfY]);
  const points: Point[] = [];
  for (let index = 0; index < OUTLINE_POINTS; index++) {
    const angle = toRadians(-90 + (360 * index) / OUTLINE_POINTS);
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    let farthest = 0;
    normalized.forEach((start, edgeIndex) => {
      const end = normalized[(edgeIndex + 1) % normalized.length];
      const edgeX = end[0] - start[0];
      const edgeY = end[1] - start[1];
      const denominator = directionX * edgeY - directionY * edgeX;
      if (Math.abs(denominator) < 1e-12) return;
      const distance = (start[0] * edgeY - start[1] * edgeX) / denominator;
      const along = (start[0] * directionY - start[1] * directionX) / denominator;
      // a little slack: a ray passing exactly through a corner of the dense outline must still hit one of its edges
      if (along >= -1e-9 && along <= 1 + 1e-9 && distance > farthest) farthest = distance;
    });
    points.push([centreX + directionX * farthest * halfX, centreY + directionY * farthest * halfY]);
  }
  return points;
};

export const blob = (options: BlobOptions): Point[] => resampleByAngle(denseBlobOutline(options));
