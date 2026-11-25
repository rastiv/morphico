// Every expression of face() by name, built on first use (nothing runs at import).
import { basicExpressionNames, buildBasicExpressions } from './basic-expressions.ts';
import { buildFeelingExpressions, feelingExpressionNames } from './feeling-expressions.ts';
import type { FacePieces } from './pieces.ts';

export const faceExpressionNames = [...basicExpressionNames, ...feelingExpressionNames] as const;
export type FaceExpression = typeof faceExpressionNames[number];

let builtExpressions: Record<FaceExpression, FacePieces> | null = null;
/** Every expression's pieces. */
export const faceExpressionPieces = (): Record<FaceExpression, FacePieces> =>
  (builtExpressions ??= { ...buildBasicExpressions(), ...buildFeelingExpressions() });
