// morphico public API.
export { clip } from './clip.ts';
export { easings } from './engine.ts';
export { face } from './face.ts';
export { icon } from './icon.ts';
export { iconSets } from './iconSets.ts';
export { faceExpressionNames } from './sets/faces.ts';
export { text } from './text.ts';

export type { Clip, ClipChangeOptions, ClipChanges, ClipOptions, ClipOutline, Length } from './clip.ts';
export type { Easing } from './engine.ts';
export type { Face, FaceChangeOptions, FaceOptions } from './face.ts';
export type { ChangeOptions, Icon, IconOptions } from './icon.ts';
export type { IconSetName } from './iconSets.ts';
export type { EasingName, MorphOptions, MorphResult } from './morph.ts';
export type { FaceExpression } from './sets/faces.ts';
export type { StyleOptions } from './svg.ts';
export type { SetOptions, Text, TextOptions, TextResult } from './text.ts';
export type { IconSet, TextLayout } from './types.ts';

/** Package version, e.g. "0.1.0" (tools/build.ts replaces 'dev'). */
export const version: string = 'dev';
