// Checking the arguments (`init`, the `set` option), and sets with sharper corners (the `roundness` option of
// icon() and clip()), built once per set and roundness, so their shapes are computed once too.
import type { IconSet } from './types.ts';

const setsByRoundness = new WeakMap<IconSet, Map<number, IconSet>>();

/** The set, optionally with sharper corners (`roundness` 0 = sharp … 1 = its own). */
export const resolveIconSet = (iconSet: IconSet, roundness?: number): IconSet => {
  if (roundness === undefined || roundness >= 1) return iconSet; // the own corners are the roundest
  if (!iconSet.withRoundness) throw new Error('morphico: this icon set has no adjustable roundness');
  const clamped = Math.max(0, roundness);
  let byRoundness = setsByRoundness.get(iconSet);
  if (!byRoundness) setsByRoundness.set(iconSet, byRoundness = new Map());
  let sharper = byRoundness.get(clamped);
  if (!sharper) byRoundness.set(clamped, sharper = iconSet.withRoundness(clamped));
  return sharper;
};

/** The `set` option checked: a set object (names like `'weather'` were accepted before 0.5.0 — say what to do now). */
export const checkedIconSet = (set: unknown, functionName: string): IconSet => {
  if (typeof set === 'string') {
    const capitalized = `${set.charAt(0).toUpperCase()}${set.slice(1)}`;
    const exportName = ['round', 'square', 'condensed', 'slim', 'handwritten'].includes(set) ? `digits${capitalized}` : `icons${capitalized}`;
    throw new Error(`morphico: ${functionName}() takes the set itself, not its name — import it: import { ${exportName} } from 'morphico/sets/${set}'`);
  }
  if (!set || typeof set !== 'object' || !('strokes' in set)) {
    throw new Error(`morphico: ${functionName}() needs a set, e.g. import { digitsRound } from 'morphico/sets/round'`);
  }
  return set as IconSet;
};

/** The second argument: what is shown first. Before 0.5.0 the options came second (with the first state inside) — say
 * so instead of failing somewhere deeper. */
export const checkedInit = (init: unknown, functionName: string): string => {
  if (typeof init !== 'string') {
    throw new Error(`morphico: ${functionName}(element, init, options) — what it shows first is the second argument (a string), the options come third (since 0.5.0)`);
  }
  return init;
};
