// The shapes of an icon set: every state at rest, and a state laid out for morphing to one other state (its pair
// layouts: tracings, breakpoints, start segment, direction, rotation, flattening, drawing in).
import { EPSILON } from './math.ts';
import { reorderSegments, rotateAroundCenter, splitPieces } from './path-numbers.ts';
import { defaultBreakpoints, layoutStrokes } from './stroke-layout.ts';
import type { IconSet, PathNumbers, PieceSet, Point, Stroke } from '../types.ts';

// A shape of a set with several pieces is the path numbers of every piece one after another.

/** The set itself is the first piece. */
export const piecesOf = (iconSet: IconSet): PieceSet[] => [iconSet, ...(iconSet.morePieces ?? [])];

/** Path numbers of one piece: start point + 6 per segment. */
export const pieceLengthOf = (iconSet: IconSet): number => 2 + 6 * iconSet.segmentCount;

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
