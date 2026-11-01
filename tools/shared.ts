// Helpers shared by the dev tools.
import { iconSets } from '../src/all.ts';
import type { IconSetName } from '../src/all.ts';
import type { IconSet, PathNumbers } from '../src/types.ts';

export const loadIconSet = async (setName: string): Promise<IconSet> => {
  if (!(setName in iconSets)) throw new Error(`unknown icon set "${setName}" (known: ${Object.keys(iconSets).join(', ')})`);
  return iconSets[setName as IconSetName];
};

/** Sum of squared differences of all numbers. A guide only (not comparable between sets) — the visual check wins. */
export const morphCost = (from: PathNumbers, to: PathNumbers): number =>
  from.reduce((sum, value, index) => sum + (value - to[index]) ** 2, 0);
