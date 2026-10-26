// The built-in icon sets, by name. `round` is the default.
import { condensedDigits } from './sets/condensed.ts';
import { handwrittenDigits } from './sets/handwritten.ts';
import { mediaIcons } from './sets/media.ts';
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
  media: mediaIcons,
} satisfies Record<string, IconSet>;

export type IconSetName = keyof typeof iconSets;

// sets with sharper corners, built once per set and roundness (so their shapes are computed once too)
const setsByRoundness = new WeakMap<IconSet, Map<number, IconSet>>();

/** A set given by name or as a set object, optionally with sharper corners (`roundness` 0 = sharp … 1 = own). */
export const resolveIconSet = (set: IconSetName | IconSet = 'round', roundness?: number): IconSet => {
  if (typeof set === 'string' && !(set in iconSets)) {
    throw new Error(`morphico: unknown icon set "${set}" (known: ${Object.keys(iconSets).join(', ')})`);
  }
  const iconSet = typeof set === 'string' ? iconSets[set] : set;
  if (roundness === undefined || roundness >= 1) return iconSet; // the own corners are the roundest
  if (!iconSet.withRoundness) throw new Error('morphico: this icon set has no adjustable roundness');
  const clamped = Math.max(0, roundness);
  let byRoundness = setsByRoundness.get(iconSet);
  if (!byRoundness) setsByRoundness.set(iconSet, byRoundness = new Map());
  let sharper = byRoundness.get(clamped);
  if (!sharper) byRoundness.set(clamped, sharper = iconSet.withRoundness(clamped));
  return sharper;
};
