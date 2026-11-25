// What the Digits / Icons tabs show right now — the set, its shapes and the style choices — shared by the stage, the
// style panel, the text line and the set chips.
import { iconSets } from '../src/all.ts';
import type { IconSetName } from '../src/all.ts';
import type { StyleOptions } from '../src/svg.ts';
import type { IconSet, PathNumbers } from '../src/types.ts';
import { settings } from './page.ts';

/** Tabs that show icon sets (the Clip and Face tabs have their own views). */
export type SetTab = 'digits' | 'icons';
export type Tab = SetTab | 'clip' | 'face';
/** What the style panel changes; a missing value means "the set's own". */
export interface StyleChoices extends StyleOptions {
  roundness?: number;
}

export const SET_NAMES = Object.keys(iconSets) as IconSetName[];
export const DEFAULT_SETS: Record<SetTab, IconSetName> = { digits: 'round', icons: 'media' };
/** Buttons of a digit set: the digits, then the other characters text() shows (space = empty). */
const DIGIT_SET_STATES = [...'0123456789-:.,/+%$€£ '];
export const EMPTY = ' ';

const readStyleChoices = (): StyleChoices => {
  try { return JSON.parse(settings.read('style') ?? '{}') as StyleChoices; } catch { return {}; }
};

export const current: {
  /** The last set tab (Digits or Icons) — stays while the Clip / Face tab is shown. */
  tab: SetTab;
  iconSetName: IconSetName;
  /** The set with the chosen corner radius. */
  iconSet: IconSet;
  style: StyleChoices;
  /** Every state laid out with its default breakpoints (empty when the set fails to build). */
  shapes: Record<string, PathNumbers>;
} = {
  tab: 'digits',
  iconSetName: DEFAULT_SETS.digits,
  iconSet: iconSets[DEFAULT_SETS.digits],
  style: readStyleChoices(),
  shapes: {},
};

export const setsOfTab = (someTab: Tab) => SET_NAMES.filter((name) => Boolean(iconSets[name].textLayout) === (someTab === 'digits'));
/** Digit sets always show 0–9 and - (dashed = not drawn yet); icon sets their own states. */
export const statesOf = (someSet: IconSet): string[] => (someSet.textLayout ? DIGIT_SET_STATES : Object.keys(someSet.strokes));
/** Stroke width as a CSS length (px) keeps its width on screen; a number scales with the icon. */
export const hasFixedWidth = () => typeof current.style.strokeWidth === 'string';
// applied to every path (vector-effect is not inherited)
export const svgStyleAttributes = () => ({
  'stroke-width': String(current.style.strokeWidth ?? current.iconSet.strokeWidth),
  'vector-effect': hasFixedWidth() ? 'non-scaling-stroke' : 'none',
  'stroke-linecap': current.style.lineCap ?? current.iconSet.lineCap,
  'stroke-linejoin': current.style.lineJoin ?? current.iconSet.lineJoin,
  fill: current.style.fill ? 'currentColor' : 'none',
});
