// The characters every digit set shares besides 0–9: `-` `/` `.` `,` `:` (space = the empty state, see morph.ts).
// Each is drawn as one straight line, placed by the set's text layout and stroke width, and morphs to and from
// every digit by flattening (the user's choice 2026-10-27): the digit is pressed flat onto the line.
// `:` has two dots, so digit sets get a second piece: for every other state it repeats the first piece exactly
// (same strokes and layouts, drawn on top of itself, so it doesn't show).
import { line } from '../geometry.ts';
import type { IconSet, PairLayout, TextLayout } from '../types.ts';

const DIGITS = [...'0123456789'];

/** Half the length of a dot's line, relative to the stroke width: round ends make it a dot 1.1 × the stroke wide. */
const DOT_HALF_LENGTH = 0.05;

/** Adds `-` `/` `.` `,` `:` to a digit set (which needs a text layout) as morphing states. */
export const withTextCharacters = (iconSet: IconSet & { textLayout: TextLayout }): IconSet => {
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
  const flattenPairs = (layouts: Record<string, Record<string, PairLayout>>) => {
    const merged = { ...layouts };
    for (const character of Object.keys(characters)) {
      merged[character] = { ...merged[character], ...Object.fromEntries(DIGITS.map((digit) => [digit, { flatten: true }])) };
    }
    return merged;
  };
  const pairLayouts = flattenPairs(iconSet.pairLayouts);
  const strokes = { ...iconSet.strokes, ...characters };
  return {
    ...iconSet,
    strokes,
    pairLayouts,
    morePieces: [{
      strokes: { ...strokes, ':': [dot(colonDotsY[1])] },
      alternativeStrokes: iconSet.alternativeStrokes,
      pairLayouts,
    }],
  };
};
