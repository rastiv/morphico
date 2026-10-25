// Helpers shared by the dev tools.
import type { IconSet, PathNumbers } from '../src/types.ts';

export const loadIconSet = async (setName: string): Promise<IconSet> =>
  ((await import(`../src/sets/${setName}.ts`)) as { default: IconSet }).default;

/** Sum of squared differences of all numbers. A guide only (not comparable between sets) — the visual check wins. */
export const morphCost = (from: PathNumbers, to: PathNumbers): number =>
  from.reduce((sum, value, index) => sum + (value - to[index]) ** 2, 0);
