// morphico public API.
export { clip } from './clip/clip.ts';
export { easings } from './engine.ts';
export { face } from './face/face.ts';
export { icon } from './icon.ts';
export { faceExpressionNames } from './face/expressions.ts';
export { clipShapeNames } from './clip/shapes.ts';
export { countdown } from './countdown.ts';
export { text } from './text.ts';

export type { Clip, ClipChangeOptions, ClipChanges, ClipOptions, ClipOutline, Length } from './clip/options.ts';
export type { Easing } from './engine.ts';
export type { Face, FaceChangeOptions, FaceOptions } from './face/face.ts';
export type { Icon, IconChangeOptions, IconOptions } from './icon.ts';
export type { EasingName, MorphOptions, MorphResult } from './morph.ts';
export type { FaceExpression } from './face/expressions.ts';
export type { ClipShape } from './clip/shapes.ts';
export type { Countdown, CountdownFormat, CountdownOptions, CountdownTarget } from './countdown.ts';
export type { StyleOptions } from './svg.ts';
export type { Text, TextChangeOptions, TextOptions } from './text.ts';

/** Package version, e.g. "0.1.0" (tools/build.ts replaces 'dev'). */
export const version: string = 'dev';
