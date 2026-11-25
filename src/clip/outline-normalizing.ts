// Making the shape outlines comparable for morphing: scaled evenly to fill the 24×24 box and centred, clockwise,
// starting where the outline crosses the vertical middle at the top.
import { strokePiece } from '../geometry/stroke-layout.ts';
import { reversedStroke } from '../geometry/strokes.ts';
import type { Point, Stroke } from '../types.ts';

const GRID_SIZE = 24;
const GRID_CENTER = 12;
const SAMPLES_PER_STROKE = 48;
export const pointOnStroke = (stroke: Stroke, progress: number): Point => strokePiece(stroke, 0, progress)[3];

const samplesOf = (strokes: Stroke[]): { point: Point; strokeIndex: number; progress: number }[] =>
  strokes.flatMap((stroke, strokeIndex) => Array.from({ length: SAMPLES_PER_STROKE }, (_, sample) => {
    const progress = sample / SAMPLES_PER_STROKE;
    return { point: pointOnStroke(stroke, progress), strokeIndex, progress };
  }));

const transformStroke = (stroke: Stroke, scale: number, offsetX: number, offsetY: number): Stroke => {
  const move = ([x, y]: Point): Point => [x * scale + offsetX, y * scale + offsetY];
  switch (stroke.kind) {
    case 'line': return { ...stroke, from: move(stroke.from), to: move(stroke.to) };
    case 'arc': return { ...stroke, center: move(stroke.center), radius: stroke.radius * scale };
    case 'cubic': return { kind: 'cubic', segment: stroke.segment.map(move) as typeof stroke.segment };
  }
};

/** Splits a stroke at `progress` into two strokes of the same kind (arcs stay arcs, so they keep their segment rule). */
const splitStroke = (stroke: Stroke, progress: number): [Stroke, Stroke] => {
  if (stroke.kind === 'arc') {
    const splitAngle = stroke.startAngle + (stroke.endAngle - stroke.startAngle) * progress;
    return [{ ...stroke, endAngle: splitAngle }, { ...stroke, startAngle: splitAngle }];
  }
  if (stroke.kind === 'line') {
    const splitPoint = pointOnStroke(stroke, progress);
    return [{ ...stroke, to: splitPoint }, { ...stroke, from: splitPoint }];
  }
  return [{ kind: 'cubic', segment: strokePiece(stroke, 0, progress) }, { kind: 'cubic', segment: strokePiece(stroke, progress, 1) }];
};

export const fitToBox = (strokes: Stroke[]): Stroke[] => {
  const points = samplesOf(strokes).map(({ point }) => point);
  const xValues = points.map(([x]) => x), yValues = points.map(([, y]) => y);
  const minX = Math.min(...xValues), maxX = Math.max(...xValues), minY = Math.min(...yValues), maxY = Math.max(...yValues);
  const scale = GRID_SIZE / Math.max(maxX - minX, maxY - minY);
  return strokes.map((stroke) =>
    transformStroke(stroke, scale, GRID_CENTER - ((minX + maxX) / 2) * scale, GRID_CENTER - ((minY + maxY) / 2) * scale));
};

/** Positive = clockwise on screen (y points down). */
const signedArea = (strokes: Stroke[]): number => {
  const points = samplesOf(strokes).map(({ point }) => point);
  return points.reduce((sum, [x, y], index) => {
    const [nextX, nextY] = points[(index + 1) % points.length];
    return sum + x * nextY - nextX * y;
  }, 0);
};

export const clockwise = (strokes: Stroke[]): Stroke[] =>
  (signedArea(strokes) >= 0 ? strokes : strokes.slice().reverse().map(reversedStroke));

/** Starts the closed outline where it crosses x = 12 highest up (splitting that stroke). */
export const startAtTopMiddle = (strokes: Stroke[]): Stroke[] => {
  const samples = samplesOf(strokes);
  let best: { strokeIndex: number; progress: number; y: number } | null = null;
  for (let index = 0; index < samples.length; index++) {
    const sample = samples[index], next = samples[(index + 1) % samples.length];
    const [x, y] = sample.point, [nextX, nextY] = next.point;
    if ((x - GRID_CENTER) * (nextX - GRID_CENTER) > 0 || x === nextX) continue;
    const fraction = (GRID_CENTER - x) / (nextX - x);
    const crossingY = y + (nextY - y) * fraction;
    if (best && crossingY >= best.y) continue;
    const nextProgress = next.strokeIndex === sample.strokeIndex ? next.progress : 1;
    best = { strokeIndex: sample.strokeIndex, progress: sample.progress + (nextProgress - sample.progress) * fraction, y: crossingY };
  }
  if (!best) return strokes;
  const { strokeIndex, progress } = best;
  const before = strokes.slice(0, strokeIndex), after = strokes.slice(strokeIndex + 1);
  if (progress < 1e-6) return [...strokes.slice(strokeIndex), ...before];
  if (progress > 1 - 1e-6) return [...after, ...before, strokes[strokeIndex]];
  const [firstPart, secondPart] = splitStroke(strokes[strokeIndex], progress);
  return [secondPart, ...after, ...before, firstPart];
};
