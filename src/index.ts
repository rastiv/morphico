// morphico public API.
export { easings } from './engine.ts';
export { icon } from './icon.ts';
export { iconSets } from './iconSets.ts';
export { text } from './text.ts';

export type { Easing } from './engine.ts';
export type { ChangeOptions, Icon, IconOptions } from './icon.ts';
export type { IconSetName } from './iconSets.ts';
export type { EasingName, MorphOptions, MorphResult } from './morph.ts';
export type { SetOptions, Text, TextOptions, TextResult } from './text.ts';
export type { IconSet, TextLayout } from './types.ts';

/** Package version, e.g. "0.1.0" (tools/build.ts replaces 'dev'). */
export const version: string = 'dev';
