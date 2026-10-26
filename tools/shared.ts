// Helpers shared by the dev tools.
import { resolveIconSet } from '../src/iconSets.ts';
import type { IconSetName } from '../src/iconSets.ts';
import type { IconSet, PathNumbers } from '../src/types.ts';

export const loadIconSet = async (setName: string): Promise<IconSet> => resolveIconSet(setName as IconSetName);

/** Sum of squared differences of all numbers. A guide only (not comparable between sets) — the visual check wins. */
export const morphCost = (from: PathNumbers, to: PathNumbers): number =>
  from.reduce((sum, value, index) => sum + (value - to[index]) ** 2, 0);
