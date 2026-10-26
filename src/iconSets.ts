// The built-in icon sets, by name. `round` is the default.
import { condensedDigits } from './sets/condensed.ts';
import { handwrittenDigits } from './sets/handwritten.ts';
import { roundDigits } from './sets/round.ts';
import { slimDigits } from './sets/slim.ts';
import { squareDigits } from './sets/square.ts';
import type { IconSet } from './types.ts';

export const iconSets = {
  round: roundDigits,
  square: squareDigits,
  condensed: condensedDigits,
  slim: slimDigits,
  handwritten: handwrittenDigits,
} satisfies Record<string, IconSet>;

export type IconSetName = keyof typeof iconSets;

/** A set given by name or as a set object. */
export const resolveIconSet = (set: IconSetName | IconSet = 'round'): IconSet => {
  if (typeof set !== 'string') return set;
  if (!(set in iconSets)) throw new Error(`morphico: unknown icon set "${set}" (known: ${Object.keys(iconSets).join(', ')})`);
  return iconSets[set];
};
