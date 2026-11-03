// The characters every digit set shares besides 0–9: `-` `/` `.` `,` `:` (space = the empty state, see morph.ts),
// plus the symbols `+` `%` `$` `€` `£` drawn in the set's own style (symbols.ts).
// Each is drawn as one straight line, placed by the set's text layout and stroke width, and morphs to and from
// every digit by flattening (the user's choice 2026-10-27): the digit is pressed flat onto the line.
// `:` has two dots and the symbols up to three parts, so digit sets get a second and a third piece. The second
// repeats the first piece exactly for every state with one part (same strokes and layouts, drawn on top of itself, so
// it doesn't show; a digit morphing into `:` splits into the two dots). The third is only `€`'s lower bar and `%`'s
// lower ring: every other state rests it as a single point in the middle (never drawn), so it grows out of there
// instead of a whole copy shrinking into it. Symbols morph with the default pairing, except the pairs in
// `symbolPairLayouts`.
import { defaultBreakpoints, line } from '../geometry.ts';
import { symbolPairLayouts, symbolStrokes } from './symbols.ts';
import type { SymbolStyle } from './symbols.ts';
import type { IconSet, PairLayout, Stroke, TextLayout } from '../types.ts';

type PairLayouts = Record<string, Record<string, PairLayout>>;

const DIGITS = [...'0123456789'];

/** Half the length of a dot's line, relative to the stroke width: round ends make it a dot 1.1 × the stroke wide. */
const DOT_HALF_LENGTH = 0.05;

/** The layouts of a piece plus more pairs (merged per state). */
const withMorePairs = (layouts: PairLayouts, morePairs: PairLayouts): PairLayouts => {
  const merged = { ...layouts };
  for (const [state, byOtherState] of Object.entries(morePairs)) merged[state] = { ...merged[state], ...byOtherState };
  return merged;
};

/** Adds `-` `/` `.` `,` `:` and the symbols (in `symbolStyle`) to a digit set (which needs a text layout) as morphing states. */
export const withTextCharacters = (iconSet: IconSet & { textLayout: TextLayout }, symbolStyle: SymbolStyle): IconSet => {
  const { baselineY, colonDotsY } = iconSet.textLayout;
  const dotHalfLength = iconSet.strokeWidth * DOT_HALF_LENGTH;
  const dotY = baselineY; // dot centre on the line the digits stand on
  const dot = (y: number) => line(12 - dotHalfLength, y, 12 + dotHalfLength, y);
  const characters = {
    '-': [line(9.5, 12, 14.5, 12)],
    '/': [line(9.5, baselineY, 14.5, 24 - baselineY)],
    '.': [dot(dotY)],
    ',': [line(12.3, dotY, 11, baselineY + 2.2)], // from the dot down to the left
    ':': [dot(colonDotsY[0])],
  };
  const pairLayouts = withMorePairs(
    iconSet.pairLayouts,
    Object.fromEntries(Object.keys(characters).map((character) => [character, Object.fromEntries(DIGITS.map((digit) => [digit, { flatten: true }]))])),
  );
  const drawings = symbolStrokes(symbolStyle);
  /** A tracing is only used with breakpoints (geometry.ts shapeForPair): give the symbols' tracings the default ones. */
  const withTracingBreakpoints = (layouts: PairLayouts, tracings: Record<string, Stroke[]>): PairLayouts =>
    Object.fromEntries(Object.entries(layouts).map(([state, byOtherState]) => [state, Object.fromEntries(
      Object.entries(byOtherState).map(([otherState, layout]) => [otherState, layout.tracing && !layout.breakpoints
        ? { ...layout, breakpoints: defaultBreakpoints(tracings[layout.tracing], iconSet.segmentCount) }
        : layout]),
    )]));
  const symbols = Object.entries(drawings.pieces);
  const strokes = { ...iconSet.strokes, ...characters, ...Object.fromEntries(symbols.map(([symbol, [first]]) => [symbol, first])) };
  const partsAt = (index: 1 | 2) => Object.fromEntries(symbols.flatMap(([symbol, pieces]) => (pieces[index] ? [[symbol, pieces[index]]] : [])));
  const secondPiece = {
    strokes: { ...strokes, ':': [dot(colonDotsY[1])], ...partsAt(1) },
    alternativeStrokes: { ...iconSet.alternativeStrokes, ...drawings.secondPieceTracings },
    pairLayouts: withMorePairs(pairLayouts, withTracingBreakpoints(symbolPairLayouts[1], drawings.secondPieceTracings)),
  };
  // only the symbols' layouts here: the digits' tracings would draw a whole digit in place of the resting point
  const thirdPiece = {
    strokes: { ...Object.fromEntries(Object.keys(strokes).map((state) => [state, [line(12, 12, 12, 12)]])), ...partsAt(2) },
    alternativeStrokes: drawings.thirdPieceTracings,
    pairLayouts: withTracingBreakpoints(symbolPairLayouts[2], drawings.thirdPieceTracings),
  };
  return {
    ...iconSet,
    strokes,
    alternativeStrokes: { ...iconSet.alternativeStrokes, ...drawings.firstPieceTracings },
    pairLayouts: withMorePairs(pairLayouts, withTracingBreakpoints(symbolPairLayouts[0], drawings.firstPieceTracings)),
    morePieces: [secondPiece, thirdPiece],
  };
};
