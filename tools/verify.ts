// Verifies a set's pair layouts: number count, continuity, shape deviation from the default layout
// (≤ ~0.12 is sampling noise, more means the picture changed) and morph cost before → after.
// Usage: node tools/verify.ts <set> [states...]   (default: all pairs)
import { defaultShapes, pieceLengthOf, piecesOf, rotateAroundCenter, shapeForPair, splitPieces, toSegments } from '../src/geometry.ts';
import type { PathNumbers, Point } from '../src/types.ts';
import { loadIconSet, morphCost } from './shared.ts';

const [setName, ...onlyStates] = process.argv.slice(2);
if (!setName) throw new Error('usage: node tools/verify.ts <set> [states...]');
const iconSet = await loadIconSet(setName);
const shapes = defaultShapes(iconSet);
const states = Object.keys(shapes);
if (!states.length) {
  console.log(`${setName}: no states drawn yet`);
  process.exit();
}

const pieceLength = pieceLengthOf(iconSet);

/** Points along every piece of the path, `samplesPerSegment + 1` per segment. */
const samplePoints = (path: PathNumbers, samplesPerSegment = 60): Point[] =>
  splitPieces(path, pieceLength).flatMap(toSegments).flatMap(([start, control1, control2, end]) => Array.from({ length: samplesPerSegment + 1 }, (_, sample): Point => {
    const progress = sample / samplesPerSegment, remaining = 1 - progress;
    const weights = [remaining ** 3, 3 * remaining ** 2 * progress, 3 * remaining * progress ** 2, progress ** 3];
    const along = (axis: 0 | 1) => weights[0] * start[axis] + weights[1] * control1[axis] + weights[2] * control2[axis] + weights[3] * end[axis];
    return [along(0), along(1)];
  }));

/** Largest distance from a point of one shape to the nearest point of the other (both ways). */
const hausdorffDistance = (shapeA: Point[], shapeB: Point[]) => {
  const oneWay = (from: Point[], to: Point[]) =>
    Math.max(...from.map((point) => Math.min(...to.map((other) => Math.hypot(point[0] - other[0], point[1] - other[1])))));
  return Math.max(oneWay(shapeA, shapeB), oneWay(shapeB, shapeA));
};

const isContinuous = (path: PathNumbers) => splitPieces(path, pieceLength).every((piece) => toSegments(piece).every((segment, index, segments) =>
  index === 0 || segments[index - 1][3].every((value, axis) => Math.abs(value - segment[0][axis]) < 1e-6)));

const referencePoints = Object.fromEntries(states.map((state) => [state, samplePoints(shapes[state], 400)]));
const expectedLength = pieceLength * piecesOf(iconSet).length;
for (const state of onlyStates.length ? onlyStates : states) {
  for (const otherState of states) {
    if (state === otherState || (!onlyStates.length && states.indexOf(otherState) < states.indexOf(state))) continue;
    const pathA = shapeForPair(iconSet, shapes, state, otherState), pathB = shapeForPair(iconSet, shapes, otherState, state);
    const deviation = Math.max(
      hausdorffDistance(samplePoints(pathA), referencePoints[state]),
      hausdorffDistance(samplePoints(pathB), referencePoints[otherState]),
    );
    // spinning pairs blend in the turning frame: compare with the target turned back
    const spin = iconSet.spins[state]?.[otherState] ?? 0;
    const costAfter = morphCost(pathA, spin ? rotateAroundCenter(pathB, -spin) : pathB);
    console.log(`${state}->${otherState}`.padEnd(5),
      'cost', morphCost(shapes[state], shapes[otherState]).toFixed(0).padStart(5), '->', costAfter.toFixed(0).padStart(5),
      spin ? `(spin ${spin}°)` : '',
      'length-ok', pathA.length === expectedLength && pathB.length === expectedLength,
      'continuous', isContinuous(pathA) && isContinuous(pathB),
      'shape-deviation', deviation.toFixed(3));
  }
}
