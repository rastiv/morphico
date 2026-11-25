// Changes to a whole face, frame by frame: the morph between two expressions, the pupils turned to look somewhere, the
// eyes partly closed for a blink. Each takes the pieces and returns new ones (nothing is changed in place).
import { PIECE_NAMES } from './pieces.ts';
import type { FacePieces } from './pieces.ts';
import type { Point } from '../types.ts';

const interpolatePoints = (from: Point[], to: Point[], progress: number): Point[] =>
  from.map(([fromX, fromY], index): Point => [fromX + (to[index][0] - fromX) * progress, fromY + (to[index][1] - fromY) * progress]);

export const interpolateFace = (from: FacePieces, to: FacePieces, progress: number): FacePieces =>
  Object.fromEntries(PIECE_NAMES.map((name) => [name, interpolatePoints(from[name], to[name], progress)])) as FacePieces;

const boxCentre = (points: Point[]): Point => {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
};

const boxHalfSize = (points: Point[]): Point => {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return [(Math.max(...xs) - Math.min(...xs)) / 2, (Math.max(...ys) - Math.min(...ys)) / 2];
};

/** Space kept between a pupil and its eye's edge when it looks as far as it can (grid units). */
const LOOK_EDGE_MARGIN = 0.3;

/**
 * The face with its pupils turned in a direction. `gaze` (each −1…1, length ≤ 1) places each pupil's centre from the
 * middle of its eye towards the eye's edge, on an ellipse that keeps the pupil whole inside the eye; `weight` blends from
 * the pupils as drawn (0) to fully turned (1).
 */
export const lookingAt = (face: FacePieces, [gazeX, gazeY]: Point, weight: number): FacePieces => {
  if (weight <= 0) return face;
  const turned = (pupil: Point[], eye: Point[]): Point[] => {
    const [eyeCentreX, eyeCentreY] = boxCentre(eye);
    const [eyeHalfWidth, eyeHalfHeight] = boxHalfSize(eye);
    const [pupilCentreX, pupilCentreY] = boxCentre(pupil);
    const [pupilHalfWidth, pupilHalfHeight] = boxHalfSize(pupil);
    const reachX = Math.max(0, eyeHalfWidth - pupilHalfWidth - LOOK_EDGE_MARGIN);
    const reachY = Math.max(0, eyeHalfHeight - pupilHalfHeight - LOOK_EDGE_MARGIN);
    const shiftX = (eyeCentreX + gazeX * reachX - pupilCentreX) * weight;
    const shiftY = (eyeCentreY + gazeY * reachY - pupilCentreY) * weight;
    return pupil.map(([x, y]): Point => [x + shiftX, y + shiftY]);
  };
  return { ...face, leftPupil: turned(face.leftPupil, face.leftEye), rightPupil: turned(face.rightPupil, face.rightEye) };
};

/** The face with its eyes partly closed: openness 1 = as drawn, 0 = shut to a flat slit (pupils gone). */
export const blinked = (face: FacePieces, openness: number): FacePieces => {
  if (openness >= 1) return face;
  const eyeScale = 0.25 + 0.75 * openness;
  const squash = (points: Point[], middleY: number): Point[] => points.map(([x, y]): Point => [x, middleY + (y - middleY) * eyeScale]);
  const shrink = (points: Point[], [centreX, centreY]: Point): Point[] =>
    points.map(([x, y]): Point => [centreX + (x - centreX) * openness, centreY + (y - centreY) * openness]);
  const leftMiddle = boxCentre(face.leftEye)[1];
  const rightMiddle = boxCentre(face.rightEye)[1];
  return {
    ...face,
    leftEye: squash(face.leftEye, leftMiddle),
    rightEye: squash(face.rightEye, rightMiddle),
    leftPupil: squash(shrink(face.leftPupil, boxCentre(face.leftPupil)), leftMiddle),
    rightPupil: squash(shrink(face.rightPupil, boxCentre(face.rightPupil)), rightMiddle),
  };
};
