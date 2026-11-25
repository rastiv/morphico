// The pieces of a face: 7 soft filled shapes — 2 brows, 2 eyes, 2 pupils (shown only inside the eyes) and a mouth.
// Every piece is a smooth closed curve through OUTLINE_POINTS points that start at the top and run clockwise (index 0 top,
// a quarter of them = right, half = bottom, three quarters = left), so any two expressions morph point by point.
// Box: 24×24 (the face draws no disc). Helpers to write an expression from its left half.
import type { Point } from '../types.ts';

export const OUTLINE_POINTS = 24;
export const PIECE_NAMES = ['leftBrow', 'rightBrow', 'leftEye', 'rightEye', 'leftPupil', 'rightPupil', 'mouth'] as const;
type PieceName = typeof PIECE_NAMES[number];
/** One expression: the outline points of every piece. */
export type FacePieces = Record<PieceName, Point[]>;

/** A piece that isn't there: every point on one spot (draws nothing). */
export const hidden = (at: Point): Point[] => Array.from({ length: OUTLINE_POINTS }, (): Point => [at[0], at[1]]);

/** The piece mirrored onto the other half of the face, still clockwise from the top. */
export const mirrored = (points: Point[]): Point[] =>
  points.map((_, index): Point => {
    const [x, y] = points[(OUTLINE_POINTS - index) % OUTLINE_POINTS];
    return [24 - x, y];
  });

interface HalfFace {
  brow: Point[];
  eye: Point[];
  pupil: Point[];
  mouth: Point[];
}

/** A face from its left half (as seen) + the mouth. */
export const symmetricFace = ({ brow, eye, pupil, mouth }: HalfFace): FacePieces => ({
  leftBrow: brow,
  rightBrow: mirrored(brow),
  leftEye: eye,
  rightEye: mirrored(eye),
  leftPupil: pupil,
  rightPupil: mirrored(pupil),
  mouth,
});

/** The whole face mirrored: left and right pieces swap sides. */
export const mirroredFace = (face: FacePieces): FacePieces => ({
  leftBrow: mirrored(face.rightBrow),
  rightBrow: mirrored(face.leftBrow),
  leftEye: mirrored(face.rightEye),
  rightEye: mirrored(face.leftEye),
  leftPupil: mirrored(face.rightPupil),
  rightPupil: mirrored(face.leftPupil),
  mouth: mirrored(face.mouth),
});
