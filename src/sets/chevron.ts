// Icon set "chevron": up, right, down, left — Lucide 1.61.0 icon "chevron-up" (ISC, see LICENSE-lucide), turned in
// steps of 90° around the centre. Coordinates below are Lucide's; lucideLine scales them into our icon box.
// One piece: every state is "up" turned, drawn in the same order, so every morph is a pure turn (spins): the shorter
// way round, half a turn clockwise.
import type { IconSet, Point } from '../types.ts';
import { LUCIDE_STROKE_WIDTH, lucideLine } from './lucide.ts';

const STATES = ['up', 'right', 'down', 'left'];
/** chevron-up's corners (right end, tip, left end), turned clockwise by `quarterTurns` × 90° around 12,12. */
const chevron = (quarterTurns: number) => {
  const turn = ([x, y]: Point): Point => {
    let [dx, dy] = [x - 12, y - 12];
    for (let step = 0; step < quarterTurns; step++) [dx, dy] = [-dy, dx];
    return [12 + dx, 12 + dy];
  };
  const [rightEnd, tip, leftEnd] = ([[18, 15], [12, 9], [6, 15]] as Point[]).map(turn);
  return [lucideLine(...rightEnd, ...tip), lucideLine(...tip, ...leftEnd)];
};
/** Degrees from one state to another: the shorter way round (half a turn: clockwise). */
const turnBetween = (fromIndex: number, toIndex: number) => {
  const quarterTurns = (toIndex - fromIndex + 4) % 4;
  return quarterTurns === 3 ? -90 : quarterTurns * 90;
};

export const chevronIcons: IconSet = {
  segmentCount: 2,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  strokes: Object.fromEntries(STATES.map((state, index) => [state, chevron(index)])),
  alternativeStrokes: {},
  pairLayouts: {},
  spins: Object.fromEntries(STATES.map((state, fromIndex) => [state, Object.fromEntries(STATES
    .filter((other) => other !== state).map((other) => [other, turnBetween(fromIndex, STATES.indexOf(other))]))])),
};
