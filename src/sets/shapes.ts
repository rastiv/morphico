// Shapes for clip(): closed outlines that cut out an element. From Lucide 1.61.0 (ISC, see LICENSE-lucide), imported
// by `node tools/import-lucide.ts <name>`; tag without its dot. The states are the Lucide outlines made comparable for
// morphing: clockwise, starting where the outline crosses the vertical middle at the top, scaled evenly to fill the
// 24×24 box and centred (computed on first use, not at import). Roundness 1 = Lucide's own corners … 0 = sharp.
import { arc, cubic, ellipse, line, reversedStroke, strokePiece } from '../geometry.ts';
import type { IconSet, Point, Stroke } from '../types.ts';

const DEGREE = Math.PI / 180;
const GRID_SIZE = 24;
const GRID_CENTER = 12;
const SAMPLES_PER_STROKE = 48;
/** Enough for the shape that needs the most (puzzle: 24 strokes, its knobs ≈ 40 segments); the rest spreads by length. */
const SEGMENT_COUNT = 48;

/** The shapes as Lucide draws them (Lucide coordinates); the set's states are made from these. */
export const lucideShapeOutlines: Record<string, Stroke[]> = {
  circle: [arc(12, 12, 10, -90, 270)],
  ellipse: ellipse(12, 12, 10, 6),
  heart: [
    arc(7.5, 9.5001, 5.5, -179.9989, -41.9423),
    arc(12, 5.4415, 0.56, 136.9163, 43.0837),
    arc(16.5101, 9.4738, 5.49, -138.3317, 0.2729),
    cubic(22, 9.5, 22, 11.79, 20.5, 13.5, 19, 15),
    line(19, 15, 13.508, 20.313),
    arc(11.9996, 18.9997, 2, 41.0455, 138.2288),
    line(10.508, 20.332, 5, 15),
    cubic(5, 15, 3.5, 13.5, 2, 11.8, 2, 9.5),
  ],
  sparkle: [
    arc(12, 2.9976, 1, -169.4202, -10.5798),
    line(12.983, 2.814, 14.034, 8.372),
    arc(15.9992, 8.0008, 2, 169.3026, 100.6974),
    line(15.628, 9.966, 21.186, 11.017),
    arc(21.0024, 12, 1, -79.4202, 79.4202),
    line(21.186, 12.983, 15.628, 14.034),
    arc(15.9992, 15.9992, 2, -100.6974, -169.3026),
    line(14.034, 15.628, 12.983, 21.186),
    arc(12, 21.0024, 1, 10.5798, 169.4202),
    line(11.017, 21.186, 9.966, 15.628),
    arc(8.0008, 15.9992, 2, -10.6974, -79.3026),
    line(8.372, 14.034, 2.814, 12.983),
    arc(2.9976, 12, 1, 100.5798, 259.4202),
    line(2.814, 11.017, 8.372, 9.966),
    arc(8.0008, 8.0008, 2, 79.3026, 10.6974),
    line(9.966, 8.372, 11.017, 2.814),
  ],
  astroid: [
    arc(12, 21.0024, 1, 10.5798, 169.4202),
    arc(1.1555, 22.8445, 10, -9.5467, -80.4533),
    arc(2.9976, 12, 1, 100.5798, 259.4202),
    arc(1.1555, 1.1555, 10, 80.4533, 9.5467),
    arc(12, 2.9976, 1, -169.4202, -10.5798),
    arc(22.8445, 1.1555, 10, 170.4533, 99.5467),
    arc(21.0024, 12, 1, -79.4202, 79.4202),
    arc(22.8445, 22.8445, 10, -99.5467, -170.4533),
  ],
  bookmark: [
    arc(17, 5, 2, -90, 0),
    line(19, 5, 19, 20),
    arc(18, 19.9997, 1, 0.0185, 119.7357),
    line(17.504, 20.868, 12.992, 18.29),
    arc(12, 20.0266, 2, -60.2643, -119.7357),
    line(11.008, 18.29, 6.496, 20.868),
    arc(6, 19.9997, 1, 60.2643, 179.9815),
    line(5, 20, 5, 5),
    arc(7, 5, 2, 180, 270),
    line(7, 3, 17, 3),
  ],
  shield: [
    cubic(20, 13, 20, 18, 16.5, 20.5, 12.34, 21.95),
    arc(12.0191, 21.0029, 1, 71.2803, 110.4299),
    cubic(11.67, 21.94, 7.5, 20.5, 4, 18, 4, 13),
    line(4, 13, 4, 6),
    arc(5, 6, 1, 180, 270),
    cubic(5, 5, 7, 5, 9.5, 3.8, 11.24, 2.28),
    arc(12, 3.1696, 1.17, -130.5094, -49.4906),
    cubic(12.76, 2.28, 14.51, 3.81, 17, 5, 19, 5),
    arc(19, 6, 1, -90, 0),
    line(20, 6, 20, 13),
  ],
  moon: [
    arc(11.9981, 12.0009, 9, 3.09, 266.904),
    cubic(11.512, 3.014, 11.917, 2.992, 12.129, 3.474, 11.914, 3.817),
    arc(17.002, 6.997, 6, -147.9941, -302.0059),
    cubic(20.182, 12.085, 20.526, 11.87, 21.007, 12.081, 20.985, 12.486),
  ],
  tag: [
    arc(11.1716, 4, 2, -44.9913, -89.9878),
    line(11.172, 2, 4, 2),
    arc(4, 4, 2, -90, -180),
    line(2, 4, 2, 11.172),
    arc(4, 11.1716, 2, 179.9878, 134.9913),
    line(2.586, 12.586, 11.29, 21.29),
    arc(13, 19.5691, 2.426, 134.8186, 45.1814),
    line(14.71, 21.29, 21.29, 14.71),
    arc(19.5691, 13, 2.426, 44.8186, -44.8186),
    line(21.29, 11.29, 12.586, 2.586),
  ],
  square: [
    line(5, 3, 19, 3),
    arc(19, 5, 2, -90, 0),
    line(21, 5, 21, 19),
    arc(19, 19, 2, 0, 90),
    line(19, 21, 5, 21),
    arc(5, 19, 2, 90, 180),
    line(3, 19, 3, 5),
    arc(5, 5, 2, 180, 270),
  ],
  badge: [
    arc(7.7549, 7.7531, 4, 167.4834, 282.6366),
    arc(12, 6.0048, 4, -147.4051, -32.5949),
    arc(16.2474, 7.7526, 4, -102.6711, 12.6711),
    arc(17.9952, 12, 4, -57.4051, 57.4051),
    arc(16.2469, 16.2451, 4, -12.6366, 102.5166),
    arc(12.005, 18.0031, 4, 32.4617, 147.5383),
    arc(7.7549, 16.2469, 4, 77.3634, 192.5166),
    arc(5.9891, 12, 4, 122.3281, 237.6719),
  ],
  triangle: [
    arc(12, 5.0035, 2, -30.1173, -149.8827),
    line(10.27, 4, 2.27, 18),
    arc(4.0021, 19, 2, -150, -269.9413),
    line(4, 21, 20, 21),
    arc(19.9979, 19, 2, 89.9413, -30),
    line(21.73, 18, 13.73, 4),
  ],
  droplet: [
    arc(12, 15, 7, 90, 0),
    cubic(19, 15, 19, 13, 18, 11.1, 16, 9.5),
    cubic(16, 9.5, 14, 7.9, 12.5, 5.5, 12, 3),
    cubic(12, 3, 11.5, 5.5, 10, 7.9, 8, 9.5),
    cubic(8, 9.5, 6, 11.1, 5, 13, 5, 15),
    arc(12, 15, 7, 180, 90),
  ],
  pentagon: [
    arc(12, 4.0021, 2, -125.803, -54.197),
    line(13.17, 2.38, 21.17, 8.12),
    arc(20.0009, 9.7427, 2, -54.2293, 18.2786),
    line(21.9, 10.37, 18.86, 19.63),
    arc(16.9618, 19, 2, 18.3608, 90.052),
    line(16.96, 21, 7.04, 21),
    arc(7.0382, 19, 2, 89.948, 161.6392),
    line(5.14, 19.63, 2.1, 10.37),
    arc(3.9991, 9.7427, 2, 161.7214, 234.2293),
    line(2.83, 8.12, 10.83, 2.38),
  ],
  hexagon: [
    line(21, 16, 21, 8),
    arc(19, 8.0021, 2, -0.0588, -60),
    line(20, 6.27, 13, 2.27),
    arc(12, 4.0021, 2, -60, -120),
    line(11, 2.27, 4, 6.27),
    arc(5, 8.0021, 2, -120, -179.9412),
    line(3, 8, 3, 16),
    arc(5, 15.9979, 2, 179.9412, 120),
    line(4, 17.73, 11, 21.73),
    arc(12, 19.9979, 2, 120, 60),
    line(13, 21.73, 20, 17.73),
    arc(19, 15.9979, 2, 60, 0.0588),
  ],
  octagon: [
    arc(4, 15.3116, 2, 134.9913, 179.9878),
    line(2, 15.312, 2, 8.688),
    arc(4, 8.6884, 2, -179.9878, -134.9913),
    line(2.586, 7.274, 7.274, 2.586),
    arc(8.6884, 4, 2, -135.0087, -90.0122),
    line(8.688, 2, 15.312, 2),
    arc(15.3116, 4, 2, -89.9878, -44.9913),
    line(16.726, 2.586, 21.414, 7.274),
    arc(20, 8.6884, 2, -45.0087, -0.0122),
    line(22, 8.688, 22, 15.312),
    arc(20, 15.3116, 2, 0.0122, 45.0087),
    line(21.414, 16.726, 16.726, 21.414),
    arc(15.3116, 20, 2, 44.9913, 89.9878),
    line(15.312, 22, 8.688, 22),
    arc(8.6884, 20, 2, 90.0122, 135.0087),
    line(7.274, 21.414, 2.586, 16.726),
  ],
  squircle: [
    cubic(12, 3, 19.2, 3, 21, 4.8, 21, 12),
    cubic(21, 12, 21, 19.2, 19.2, 21, 12, 21),
    cubic(12, 21, 4.8, 21, 3, 19.2, 3, 12),
    cubic(3, 12, 3, 4.8, 4.8, 3, 12, 3),
  ],
  star: [
    arc(12, 2.5301, 0.53, -153.6664, -26.3336),
    line(12.475, 2.295, 14.785, 6.974),
    arc(16.6883, 6.0335, 2.123, 153.7044, 98.3503),
    line(16.38, 8.134, 21.546, 8.89),
    arc(21.47, 9.4145, 0.53, -81.756, 45.7247),
    line(21.84, 9.794, 18.104, 13.432),
    arc(19.5857, 14.9525, 2.123, -134.26, -189.6958),
    line(17.493, 15.31, 18.375, 20.45),
    arc(17.8531, 20.5422, 0.53, -10.0155, 118.0314),
    line(17.604, 21.01, 12.986, 18.582),
    arc(11.9995, 20.4608, 2.122, -62.2968, -117.7032),
    line(11.013, 18.582, 6.396, 21.01),
    arc(6.148, 20.5416, 0.53, 62.1036, 189.9512),
    line(5.626, 20.45, 6.507, 15.311),
    arc(4.4155, 14.9522, 2.122, 9.7335, -45.7597),
    line(5.896, 13.432, 2.16, 9.795),
    arc(2.5282, 9.4138, 0.53, 134.0047, 261.9521),
    line(2.454, 8.889, 7.619, 8.134),
    arc(7.3135, 6.0341, 2.122, 81.7227, 26.2909),
    line(9.216, 6.974, 11.525, 2.295),
  ],
  'rectangle-horizontal': [
    line(4, 6, 20, 6),
    arc(20, 8, 2, -90, 0),
    line(22, 8, 22, 16),
    arc(20, 16, 2, 0, 90),
    line(20, 18, 4, 18),
    arc(4, 16, 2, 90, 180),
    line(2, 16, 2, 8),
    arc(4, 8, 2, 180, 270),
  ],
  'rectangle-vertical': [
    line(8, 2, 16, 2),
    arc(16, 4, 2, -90, 0),
    line(18, 4, 18, 20),
    arc(16, 20, 2, 0, 90),
    line(16, 22, 8, 22),
    arc(8, 20, 2, 90, 180),
    line(6, 20, 6, 4),
    arc(8, 4, 2, 180, 270),
  ],
  'message-circle': [
    arc(1.1328, 17.079, 2, -21.6245, 12.4142),
    line(3.086, 17.509, 2.021, 20.799),
    arc(3.0005, 21.0005, 1, -168.3779, -284.8626),
    line(3.257, 21.967, 6.67, 20.969),
    arc(7.0591, 22.9308, 2, -101.2192, -69.2104),
    arc(12.0003, 12.0003, 10, 115.0325, -205.7324),
  ],
  'message-square': [
    arc(20, 17, 2, 0, 90),
    line(20, 19, 6.828, 19),
    arc(6.8284, 21, 2, -90.0122, -135.0087),
    line(5.414, 19.586, 3.212, 21.788),
    arc(2.71, 21.2859, 0.71, 45.0052, 179.9926),
    line(2, 21.286, 2, 5),
    arc(4, 5, 2, 180, 270),
    line(4, 3, 20, 3),
    arc(20, 5, 2, -90, 0),
    line(22, 5, 22, 17),
  ],
  diamond: [
    arc(4.4033, 12.005, 2.41, -134.9707, -225.0293),
    line(2.7, 13.71, 10.29, 21.3),
    arc(11.995, 19.5967, 2.41, 135.0293, 44.9707),
    line(13.7, 21.3, 21.29, 13.71),
    arc(19.5867, 12.005, 2.41, 45.0293, -45.0293),
    line(21.29, 10.3, 13.7, 2.71),
    arc(11.995, 4.4133, 2.41, -44.9707, -135.0293),
    line(10.29, 2.71, 2.7, 10.3),
  ],
  cloud: [
    line(17.5, 19, 9, 19),
    arc(9.0018, 12, 7, 90.0147, 343.3984),
    line(15.71, 10, 17.5, 10),
    arc(17.5, 14.5, 4.5, -90, 90),
  ],
  puzzle: [
    arc(16.0975, 3.6833, 1, 135.0289, 13.459),
    arc(19.5008, 4.5, 2.5, -166.4917, 76.5107),
    arc(20.3167, 7.9035, 1, -103.459, -225.0289),
    line(19.61, 8.611, 21.293, 10.293),
    arc(19.5861, 12, 2.414, -45.0015, 45.0015),
    line(21.293, 13.707, 19.61, 15.39),
    arc(18.9025, 14.6833, 1, 44.9711, 166.541),
    arc(15.4992, 15.5, 2.5, -13.5083, -256.5107),
    arc(14.6833, 18.9035, 1, -76.541, 45.0289),
    line(15.39, 19.611, 13.707, 21.293),
    arc(12, 19.5861, 2.414, 44.9985, 135.0015),
    line(10.293, 21.293, 8.61, 19.61),
    arc(7.9025, 20.3167, 1, -44.9711, -166.541),
    arc(4.4992, 19.5, 2.5, 13.5083, 256.5107),
    arc(3.6833, 16.0965, 1, 76.541, -45.0289),
    line(4.39, 15.389, 2.707, 13.707),
    arc(4.4139, 12, 2.414, 134.9985, 225.0015),
    line(2.707, 10.293, 4.39, 8.61),
    arc(5.0975, 9.3167, 1, -135.0289, -13.459),
    arc(8.5008, 8.5, 2.5, 166.4917, -76.5107),
    arc(9.3167, 5.0965, 1, 103.459, 225.0289),
    line(8.61, 4.389, 10.293, 2.707),
    arc(12, 4.4139, 2.414, -135.0015, -44.9985),
    line(13.707, 2.707, 15.39, 4.39),
  ],
};

// ---- making the outlines comparable ----

const pointOnStroke = (stroke: Stroke, progress: number): Point => strokePiece(stroke, 0, progress)[3];

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

const fitToBox = (strokes: Stroke[]): Stroke[] => {
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

const clockwise = (strokes: Stroke[]): Stroke[] =>
  (signedArea(strokes) >= 0 ? strokes : strokes.slice().reverse().map(reversedStroke));

/** Starts the closed outline where it crosses x = 12 highest up (splitting that stroke). */
const startAtTopMiddle = (strokes: Stroke[]): Stroke[] => {
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

// ---- roundness: 1 = Lucide's own corners, 0 = sharp ----

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
const withCornerRoundness = (strokes: Stroke[], roundness: number): Stroke[] => {
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

/** The shape set at a roundness (0 = sharp … 1 = Lucide's own corners); its strokes are built on first use. */
const shapeSetWithRoundness = (roundness: number): IconSet => {
  let strokes: Record<string, Stroke[]> | null = null;
  return {
    get strokes() {
      strokes ??= Object.fromEntries(Object.entries(lucideShapeOutlines).map(([name, outline]) =>
        [name, startAtTopMiddle(clockwise(fitToBox(withCornerRoundness(outline, roundness))))]));
      return strokes;
    },
    alternativeStrokes: {},
    pairLayouts: {},
    spins: {},
    segmentCount: SEGMENT_COUNT,
    // shapes are filled (clip), not stroked; these only matter for the outlined band's corners
    strokeWidth: 0,
    lineCap: 'butt',
    lineJoin: 'miter',
    withRoundness: shapeSetWithRoundness,
  };
};

/** The shape set of clip(): states `circle`, `ellipse`, `heart` … `puzzle` (see `lucideShapeOutlines`). */
export const clipShapes: IconSet = shapeSetWithRoundness(1);
