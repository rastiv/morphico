// The first 16 expressions of face(): the user's 8 robot-face pictures (faces/*.png, not shipped; drawn by eye, frontal,
// mirrored left ↔ right) and Claude's first drafts of more feelings.
import { band } from './band.ts';
import { blob } from './blob.ts';
import { hidden, mirrored, mirroredFace, symmetricFace } from './pieces.ts';
import type { FacePieces } from './pieces.ts';

export const basicExpressionNames = [
  'normal', 'smiling', 'pleading', 'wonder', 'focused', 'fright', 'angry', 'asleep',
  'sad', 'surprised', 'laughing', 'tired', 'wink-left', 'wink-right', 'suspicious', 'confused',
] as const;
type BasicExpression = typeof basicExpressionNames[number];

export const buildBasicExpressions = (): Record<BasicExpression, FacePieces> => {
  const winkRight: FacePieces = {
    ...symmetricFace({
      brow: blob({ centre: [6.2, 4.4], width: 5.2, height: 1.9, squareness: 0.5, rotation: -6 }),
      eye: blob({ centre: [6.4, 12], width: 8.4, height: 8.4 }),
      pupil: blob({ centre: [7, 11.4], width: 3.2, height: 3.2 }),
      mouth: band({ from: [9.6, 18.4], to: [14.8, 18], bend: -0.9, thickness: 1.2, endShare: 0.7 }),
    }),
    rightBrow: mirrored(blob({ centre: [6.2, 6], width: 5, height: 1.8, squareness: 0.5, rotation: 8 })),
    rightEye: mirrored(band({ from: [3.2, 12.8], to: [9.6, 12.8], bend: 1.4, thickness: 1.6, endShare: 0.7 })),
    rightPupil: hidden([17.6, 12]),
  };

  return {
    normal: symmetricFace({
      brow: blob({ centre: [6.2, 4.6], width: 5.2, height: 1.9, squareness: 0.5, rotation: -6 }),
      eye: blob({ centre: [6.4, 12], width: 8.4, height: 8.4 }),
      pupil: blob({ centre: [7, 10.7], width: 3.2, height: 3.2 }),
      mouth: blob({ centre: [12, 18.8], width: 4.4, height: 1.8, squareness: 0.6 }),
    }),
    smiling: symmetricFace({
      brow: blob({ centre: [6, 5.4], width: 5, height: 4.4, squareness: 0.2, cutBottom: [5.4, 5.4] }),
      eye: blob({ centre: [6, 13], width: 9.2, height: 7.6 }),
      pupil: blob({ centre: [6.8, 13.6], width: 3.6, height: 2.4 }),
      mouth: band({ from: [9, 18.4], to: [15, 18.4], bend: -1, thickness: 1.3, endShare: 0.7 }),
    }),
    pleading: symmetricFace({
      brow: blob({ centre: [6.6, 3.7], width: 4.6, height: 2, squareness: 0.5, rotation: -16 }),
      eye: blob({ centre: [6.8, 12.4], width: 8.6, height: 9.6, topScale: 0.75, rotation: 12 }),
      pupil: blob({ centre: [7.6, 10.7], width: 4, height: 4 }),
      mouth: blob({ centre: [12, 17.6], width: 4.3, height: 4.8, squareness: 0.3, cutTop: [17.6, 17.6] }),
    }),
    wonder: symmetricFace({
      brow: band({ from: [3.4, 4.8], to: [8.6, 3.3], bend: 0.7, thickness: 1.7 }),
      eye: blob({ centre: [6.4, 12], width: 7.8, height: 9.6 }),
      pupil: blob({ centre: [6.8, 11.2], width: 3.2, height: 4.2 }),
      mouth: blob({ centre: [12, 18.6], width: 3.8, height: 1, squareness: 0.6 }),
    }),
    focused: symmetricFace({
      brow: blob({ centre: [6, 4.4], width: 5.6, height: 2.2, squareness: 0.55, rotation: 3 }),
      eye: blob({ centre: [6.2, 12.8], width: 9, height: 8, cutTop: [10, 11] }),
      pupil: blob({ centre: [6.8, 13.2], width: 3.8, height: 2.8 }),
      mouth: blob({ centre: [12, 18.8], width: 4.2, height: 1, squareness: 0.6 }),
    }),
    fright: symmetricFace({
      brow: blob({ centre: [5.7, 3.5], width: 4.8, height: 2.2, squareness: 0.45, rotation: -8 }),
      eye: blob({ centre: [6.2, 12.4], width: 8.4, height: 9.8, topScale: 0.7, rotation: 8 }),
      pupil: blob({ centre: [7.2, 12], width: 3.6, height: 4.2 }),
      mouth: blob({ centre: [12, 18.6], width: 3.8, height: 1.4, squareness: 0.5 }),
    }),
    angry: symmetricFace({
      brow: blob({ centre: [6.4, 5.4], width: 5.2, height: 2, squareness: 0.5, rotation: 12 }),
      eye: blob({ centre: [6.2, 12.6], width: 8.6, height: 8, cutTop: [9.2, 12] }),
      pupil: blob({ centre: [7.4, 12.8], width: 3.4, height: 3.4 }),
      mouth: blob({ centre: [12, 17.8], width: 4.2, height: 4, squareness: 0.3, cutTop: [17.8, 17.8] }),
    }),
    asleep: symmetricFace({
      brow: blob({ centre: [6, 5.4], width: 4, height: 1.7, squareness: 0.4, rotation: 4 }),
      eye: band({ from: [3, 12.4], to: [9.6, 12.4], bend: -1.2, thickness: 1.5, endShare: 0.6 }),
      pupil: hidden([6.3, 13.4]),
      mouth: blob({ centre: [12, 18.8], width: 2.6, height: 1.8 }),
    }),
    // more feelings, Claude's drafts (no pictures); the one-sided ones replace pieces of the right half — written in place
    // (a blob or band is already clockwise from its top) or drawn on the left and mirrored
    sad: symmetricFace({
      brow: blob({ centre: [6.4, 5.2], width: 4.8, height: 1.9, squareness: 0.5, rotation: -18 }),
      eye: blob({ centre: [6.4, 12.6], width: 8.4, height: 8, cutTop: [11.2, 9.6] }),
      pupil: blob({ centre: [6.8, 13.8], width: 3.2, height: 3.4 }),
      mouth: band({ from: [9.4, 19.2], to: [14.6, 19.2], bend: 0.9, thickness: 1.2, endShare: 0.7 }),
    }),
    surprised: symmetricFace({
      brow: band({ from: [3.6, 3.6], to: [8.6, 2.8], bend: 0.6, thickness: 1.6 }),
      eye: blob({ centre: [6.4, 12], width: 8.6, height: 9 }),
      pupil: blob({ centre: [6.4, 12], width: 2.4, height: 2.4 }),
      mouth: blob({ centre: [12, 19], width: 2.8, height: 3.4 }),
    }),
    laughing: symmetricFace({
      brow: blob({ centre: [6, 4.6], width: 5, height: 4.4, squareness: 0.2, cutBottom: [4.6, 4.6] }),
      eye: band({ from: [3.2, 13], to: [9.6, 13], bend: 1.6, thickness: 1.6, endShare: 0.7 }),
      pupil: hidden([6.4, 12]),
      mouth: blob({ centre: [12, 17], width: 6, height: 6, squareness: 0.2, cutTop: [17, 17] }),
    }),
    tired: symmetricFace({
      brow: blob({ centre: [6, 6], width: 5, height: 1.7, squareness: 0.5, rotation: -4 }),
      eye: blob({ centre: [6.4, 12.6], width: 8.4, height: 7.6, cutTop: [11.6, 11.6] }),
      pupil: blob({ centre: [6.6, 13.6], width: 3.2, height: 3.2 }),
      mouth: blob({ centre: [12, 19], width: 3.2, height: 0.9, squareness: 0.6 }),
    }),
    // wink-left / wink-right = the eye that closes, as seen; one is the other mirrored
    'wink-left': mirroredFace(winkRight),
    'wink-right': winkRight,
    suspicious: {
      ...symmetricFace({
        brow: band({ from: [3.4, 4], to: [8.8, 3], bend: 0.8, thickness: 1.6 }),
        eye: blob({ centre: [6.4, 12.6], width: 8.6, height: 7.6, cutTop: [10.8, 10.8] }),
        pupil: blob({ centre: [4.6, 13.2], width: 3.2, height: 3 }),
        mouth: blob({ centre: [12.6, 18.8], width: 3.6, height: 1, squareness: 0.6, rotation: -10 }),
      }),
      rightBrow: mirrored(blob({ centre: [6.4, 6.4], width: 5.2, height: 1.8, squareness: 0.5, rotation: 10 })),
      rightEye: mirrored(blob({ centre: [6.4, 12.8], width: 8.6, height: 7.2, cutTop: [11.8, 11.8] })),
      rightPupil: blob({ centre: [16.2, 13.4], width: 3.2, height: 3 }),
    },
    confused: {
      ...symmetricFace({
        brow: band({ from: [3.4, 3.8], to: [8.6, 2.6], bend: 0.7, thickness: 1.6 }),
        eye: blob({ centre: [6.4, 12], width: 8.6, height: 9 }),
        pupil: blob({ centre: [7.6, 10.6], width: 3, height: 3 }),
        mouth: blob({ centre: [12.4, 19], width: 3.8, height: 1.1, squareness: 0.5, rotation: 12 }),
      }),
      rightBrow: mirrored(blob({ centre: [6.2, 5.8], width: 5, height: 1.8, squareness: 0.5, rotation: 10 })),
      rightEye: mirrored(blob({ centre: [6.4, 12.6], width: 7.4, height: 7.4 })),
      rightPupil: blob({ centre: [18.4, 11.4], width: 2.8, height: 2.8 }),
    },
  };
};
