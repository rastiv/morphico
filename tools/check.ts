// Optimizer: searches better pair layouts for morph pairs.
// Usage: node tools/check.ts <set> A B C ... [--tracing=<name>] [--piece=<index>]
//   → pairs A→B, A→C, …; prints the cost before → after and the pairLayouts entries that reach it.
// Put closed shapes (loops) second: only the second state gets start segments tried.
// --tracing=<name>: also lays out the second state along alternativeStrokes[name] (fitted against A as is / reversed).
// --piece=<index>: sets with several pieces are tuned one piece at a time (default 0 = the set's own strokes;
//   1 = morePieces[0], …); the printed entries go into that piece's pairLayouts.
import {
  defaultShapes, layoutStrokes, pieceLengthOf, piecesOf, reorderSegments, segmentCountOf, splitPieces, strokePiece,
} from '../src/geometry.ts';
import type { PairLayout, PathNumbers, Stroke } from '../src/types.ts';
import { loadIconSet, morphCost } from './shared.ts';

const options = process.argv.slice(2).filter((argument) => argument.startsWith('--'));
const tracing = options.find((option) => option.startsWith('--tracing='))?.slice('--tracing='.length);
const pieceIndex = Number(options.find((option) => option.startsWith('--piece='))?.slice('--piece='.length) ?? 0);
const [setName, state, ...otherStates] = process.argv.slice(2).filter((argument) => !argument.startsWith('--'));
if (!setName || state === undefined) throw new Error('usage: node tools/check.ts <set> A B C ... [--tracing=<name>]');
const iconSet = await loadIconSet(setName);
const pieceSet = piecesOf(iconSet)[pieceIndex];
if (!pieceSet) throw new Error(`${setName} has no piece ${pieceIndex}`);
// the chosen piece of every state
const shapes = Object.fromEntries(Object.entries(defaultShapes(iconSet))
  .map(([someState, path]) => [someState, splitPieces(path, pieceLengthOf(iconSet))[pieceIndex]]));

const CANDIDATES_PER_STROKE = 48;
const EPSILON = 1e-9;

/**
 * Dynamic programming: picks `segmentCount + 1` breakpoints from a grid of candidate positions along the strokes,
 * so the laid-out shape is as close as possible to `target`. Respects the breakpoint rules (no segment spans
 * two strokes, arc segments ≤ 90°).
 */
function fitBreakpoints(strokes: Stroke[], target: PathNumbers) {
  const candidates: number[] = [];
  strokes.forEach((_, strokeIndex) => {
    for (let step = strokeIndex ? 1 : 0; step <= CANDIDATES_PER_STROKE; step++) candidates.push(strokeIndex + step / CANDIDATES_PER_STROKE);
  });
  // the stroke a position belongs to: as the start of a segment, or as its end
  const strokeStartingAt = (position: number) => Math.min(Math.floor(position + EPSILON), strokes.length - 1);
  const strokeEndingAt = (position: number) => Math.min(Math.ceil(position - EPSILON) - 1, strokes.length - 1);

  const [startX, startY] = strokePiece(strokes[0], 0, 0)[0];
  // bestCost[candidate] = cheapest cost of the segments so far, ending at that candidate
  let bestCost = candidates.map((_, candidate) => (candidate === 0 ? (startX - target[0]) ** 2 + (startY - target[1]) ** 2 : Infinity));
  const cameFrom: number[][] = [];
  for (let segmentIndex = 0; segmentIndex < segmentCountOf(target); segmentIndex++) {
    const targetSegment = target.slice(2 + segmentIndex * 6, 8 + segmentIndex * 6);
    const nextCost: number[] = Array(candidates.length).fill(Infinity);
    const previousCandidate: number[] = Array(candidates.length).fill(-1);
    for (let fromCandidate = 0; fromCandidate < candidates.length; fromCandidate++) {
      if (bestCost[fromCandidate] === Infinity) continue;
      const strokeIndex = strokeStartingAt(candidates[fromCandidate]);
      const stroke = strokes[strokeIndex];
      for (let toCandidate = fromCandidate; toCandidate < candidates.length; toCandidate++) {
        if (toCandidate > fromCandidate && strokeEndingAt(candidates[toCandidate]) !== strokeIndex) break;
        const startProgress = candidates[fromCandidate] - strokeIndex, endProgress = candidates[toCandidate] - strokeIndex;
        if (stroke.kind === 'arc' && Math.abs(stroke.endAngle - stroke.startAngle) * (endProgress - startProgress) > 90.01) break;
        const [, control1, control2, end] = strokePiece(stroke, startProgress, endProgress);
        const cost = bestCost[fromCandidate] + morphCost([...control1, ...control2, ...end], targetSegment);
        if (cost < nextCost[toCandidate]) {
          nextCost[toCandidate] = cost;
          previousCandidate[toCandidate] = fromCandidate;
        }
      }
    }
    bestCost = nextCost;
    cameFrom.push(previousCandidate);
  }
  // walk back from the very end of the last stroke
  let candidate = candidates.length - 1;
  const picked = [candidate];
  for (let segmentIndex = cameFrom.length - 1; segmentIndex >= 0; segmentIndex--) {
    candidate = cameFrom[segmentIndex][candidate];
    picked.unshift(candidate);
  }
  const breakpoints = picked.map((index) => +candidates[index].toFixed(4));
  return { cost: bestCost[candidates.length - 1], breakpoints, path: layoutStrokes(strokes, breakpoints) };
}

const isClosed = (path: PathNumbers) => Math.hypot(path[0] - path[path.length - 2], path[1] - path[path.length - 1]) < 1e-6;
const reversedPath = (path: PathNumbers) => reorderSegments(path, { reversed: true });

/** Layouts of a state that keep its default breakpoints: as is, reversed, and for closed loops every start segment. */
const reorderings = (someState: string): { pairLayout: PairLayout; path: PathNumbers }[] => {
  const path = shapes[someState];
  const options: { pairLayout: PairLayout; path: PathNumbers }[] = [
    { pairLayout: {}, path },
    { pairLayout: { reversed: true }, path: reversedPath(path) },
  ];
  if (isClosed(path)) {
    for (let startSegment = 1; startSegment < segmentCountOf(path); startSegment++) {
      for (const reversed of [false, true]) options.push({ pairLayout: { startSegment, reversed }, path: reorderSegments(path, { startSegment, reversed }) });
    }
  }
  return options;
};

const describe = (stateLayout: PairLayout, otherState: string, otherLayout: PairLayout) =>
  `${state}: ${JSON.stringify(stateLayout)}  ${otherState}: ${JSON.stringify(otherLayout)}`;

for (const otherState of otherStates) {
  const costBefore = morphCost(shapes[state], shapes[otherState]);
  let best = { cost: costBefore, description: 'as is' };
  const consider = (cost: number, description: string) => { if (cost < best.cost - 1e-6) best = { cost, description }; };

  for (const other of reorderings(otherState)) {
    // re-lay `state` against this reordering of `otherState` …
    const fitted = fitBreakpoints(pieceSet.strokes[state], other.path);
    consider(fitted.cost, describe({ breakpoints: fitted.breakpoints }, otherState, other.pairLayout));
    if (other.pairLayout.startSegment !== undefined) continue;
    const reversed = other.pairLayout.reversed ?? false;
    // … then re-lay `otherState` against that new `state`
    const refitted = fitBreakpoints(pieceSet.strokes[otherState], reversed ? reversedPath(fitted.path) : fitted.path);
    consider(refitted.cost, describe({ breakpoints: fitted.breakpoints, ...(reversed && { reversed }) }, otherState, { breakpoints: refitted.breakpoints }));
    // re-lay `otherState` against the unchanged `state`
    const fittedOther = fitBreakpoints(pieceSet.strokes[otherState], reversed ? reversedPath(shapes[state]) : shapes[state]);
    consider(fittedOther.cost, describe(reversed ? { reversed } : {}, otherState, { breakpoints: fittedOther.breakpoints }));
  }
  if (tracing) {
    const tracingStrokes = pieceSet.alternativeStrokes[tracing];
    if (!tracingStrokes) throw new Error(`${setName} has no alternative tracing "${tracing}"`);
    for (const reversed of [false, true]) {
      const fitted = fitBreakpoints(tracingStrokes, reversed ? reversedPath(shapes[state]) : shapes[state]);
      const description = describe(reversed ? { reversed } : {}, otherState, { tracing, breakpoints: fitted.breakpoints });
      console.log(`  tracing candidate ${fitted.cost.toFixed(0)}: ${description}`);
      consider(fitted.cost, description);
    }
  }
  console.log(`${state}->${otherState}`, costBefore.toFixed(0), '->', best.cost.toFixed(0), best.description);
}
