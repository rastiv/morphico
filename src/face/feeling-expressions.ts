// More expressions of face(): the user's list of feelings (2026-11-01), Claude's drafts (the ones the basic set had
// already are skipped). The one-sided ones replace pieces of the right half — written in place (a blob or band is
// already clockwise from its top) or drawn on the left and mirrored.
import { band } from './band.ts';
import { blob } from './blob.ts';
import { mirrored, symmetricFace } from './pieces.ts';
import type { FacePieces } from './pieces.ts';

export const feelingExpressionNames = [
  'smug', 'irritated', 'bored', 'curious', 'empathetic', 'guilty', 'worried', 'disappointed',
  'ashamed', 'embarrassed', 'yearning', 'triumphant', 'proud', 'excited', 'scornful', 'disgusted',
] as const;
type FeelingExpression = typeof feelingExpressionNames[number];

export const buildFeelingExpressions = (): Record<FeelingExpression, FacePieces> => ({
  smug: {
    ...symmetricFace({
      brow: blob({ centre: [6.2, 5], width: 5, height: 1.8, squareness: 0.5, rotation: -4 }),
      eye: blob({ centre: [6.4, 12.6], width: 8.4, height: 7.6, cutTop: [11.4, 11.4] }),
      pupil: blob({ centre: [8, 13.4], width: 3, height: 3 }),
      mouth: band({ from: [10.2, 18.8], to: [15.2, 17.6], bend: -0.6, thickness: 1.2, endShare: 0.6 }),
    }),
    rightBrow: mirrored(band({ from: [3.6, 4.2], to: [8.6, 3.4], bend: 0.6, thickness: 1.6 })),
    rightPupil: blob({ centre: [19.4, 13.4], width: 3, height: 3 }),
  },
  irritated: symmetricFace({
    brow: blob({ centre: [6.4, 5.8], width: 5.4, height: 1.8, squareness: 0.55, rotation: 6 }),
    eye: blob({ centre: [6.4, 12.8], width: 8.6, height: 7.6, cutTop: [11.2, 11.8], cutBottom: [15.8, 15.8] }),
    pupil: blob({ centre: [6.8, 13.6], width: 3.2, height: 3 }),
    mouth: blob({ centre: [12.4, 18.8], width: 3.6, height: 0.9, squareness: 0.6, rotation: -8 }),
  }),
  bored: {
    ...symmetricFace({
      brow: blob({ centre: [6, 6.2], width: 5, height: 1.7, squareness: 0.5 }),
      eye: blob({ centre: [6.4, 12.6], width: 8.4, height: 7.6, cutTop: [11.8, 11.8] }),
      pupil: blob({ centre: [8, 12.8], width: 3, height: 3 }),
      mouth: blob({ centre: [13.4, 19], width: 3, height: 0.9, squareness: 0.6 }),
    }),
    rightPupil: blob({ centre: [19.4, 12.8], width: 3, height: 3 }),
  },
  curious: {
    ...symmetricFace({
      brow: band({ from: [3.4, 3.6], to: [8.6, 2.6], bend: 0.7, thickness: 1.6 }),
      eye: blob({ centre: [6.4, 12], width: 8.6, height: 8.8 }),
      pupil: blob({ centre: [7.8, 10.8], width: 3.2, height: 3.2 }),
      mouth: blob({ centre: [12.6, 18.8], width: 2, height: 2.2 }),
    }),
    rightBrow: mirrored(blob({ centre: [6.2, 5.2], width: 5, height: 1.8, squareness: 0.5, rotation: 4 })),
    rightPupil: blob({ centre: [19, 10.8], width: 3.2, height: 3.2 }),
  },
  empathetic: symmetricFace({
    brow: blob({ centre: [6.4, 4.8], width: 5, height: 1.9, squareness: 0.5, rotation: -10 }),
    eye: blob({ centre: [6.4, 12.4], width: 8.4, height: 8, cutTop: [10, 9.2] }),
    pupil: blob({ centre: [6.8, 13], width: 3.4, height: 3.4 }),
    mouth: band({ from: [10, 18.6], to: [14, 18.6], bend: -0.5, thickness: 1.1, endShare: 0.7 }),
  }),
  guilty: {
    ...symmetricFace({
      brow: blob({ centre: [6.4, 5], width: 4.6, height: 1.8, squareness: 0.5, rotation: -14 }),
      eye: blob({ centre: [6.4, 12.6], width: 8.2, height: 8, cutTop: [10.6, 10.2] }),
      pupil: blob({ centre: [5, 14.4], width: 3, height: 3 }),
      mouth: blob({ centre: [11.4, 19], width: 2.8, height: 0.9, squareness: 0.6, rotation: 6 }),
    }),
    rightPupil: blob({ centre: [16.2, 14.4], width: 3, height: 3 }),
  },
  worried: symmetricFace({
    brow: blob({ centre: [6.6, 4.2], width: 4.8, height: 1.9, squareness: 0.5, rotation: -20 }),
    eye: blob({ centre: [6.4, 12.2], width: 8, height: 8.8, topScale: 0.85, rotation: 6 }),
    pupil: blob({ centre: [6.8, 12.4], width: 2.6, height: 2.8 }),
    mouth: band({ from: [10.2, 19], to: [13.8, 19], bend: 0.6, thickness: 1.1, endShare: 0.7 }),
  }),
  disappointed: symmetricFace({
    brow: blob({ centre: [6.2, 5.6], width: 5, height: 1.8, squareness: 0.5, rotation: -8 }),
    eye: blob({ centre: [6.4, 12.8], width: 8.4, height: 7.6, cutTop: [11.8, 11] }),
    pupil: blob({ centre: [6.6, 14.4], width: 3, height: 3 }),
    mouth: band({ from: [9.6, 19.2], to: [14.4, 19.2], bend: 0.4, thickness: 1.1, endShare: 0.8 }),
  }),
  ashamed: symmetricFace({
    brow: blob({ centre: [6.4, 5.6], width: 4.6, height: 1.8, squareness: 0.5, rotation: -16 }),
    eye: blob({ centre: [6.4, 13], width: 8.2, height: 7.6, cutTop: [12.2, 12.2] }),
    pupil: blob({ centre: [6.4, 15], width: 3, height: 2.6 }),
    mouth: blob({ centre: [12, 19.4], width: 2.4, height: 0.9, squareness: 0.6 }),
  }),
  embarrassed: {
    ...symmetricFace({
      brow: blob({ centre: [6.2, 4.8], width: 4.8, height: 1.8, squareness: 0.5, rotation: -12 }),
      eye: blob({ centre: [6.4, 12.4], width: 8.2, height: 8.2 }),
      pupil: blob({ centre: [4.4, 13.6], width: 3, height: 3 }),
      mouth: band({ from: [9.8, 18.8], to: [14.2, 18.6], bend: -0.5, thickness: 1.1, endShare: 0.7 }),
    }),
    rightPupil: blob({ centre: [15.8, 13.6], width: 3, height: 3 }),
  },
  yearning: symmetricFace({
    brow: blob({ centre: [6.2, 4], width: 4.8, height: 1.8, squareness: 0.5, rotation: -10 }),
    eye: blob({ centre: [6.4, 12.6], width: 8.6, height: 8, cutTop: [11, 11] }),
    pupil: blob({ centre: [6.8, 13.6], width: 4.2, height: 4.2 }),
    mouth: blob({ centre: [12, 18.8], width: 2.6, height: 1.6 }),
  }),
  triumphant: symmetricFace({
    brow: blob({ centre: [6.2, 4], width: 5.2, height: 2, squareness: 0.5, rotation: 8 }),
    eye: blob({ centre: [6.4, 11.8], width: 8.6, height: 8.6, cutBottom: [14, 14] }),
    pupil: blob({ centre: [6.8, 11.6], width: 3.4, height: 3.4 }),
    mouth: blob({ centre: [12, 16.8], width: 7, height: 6.4, squareness: 0.3, cutTop: [16.8, 16.8] }),
  }),
  proud: symmetricFace({
    brow: blob({ centre: [6.2, 3.8], width: 5, height: 1.9, squareness: 0.5, rotation: -4 }),
    eye: blob({ centre: [6.4, 12.4], width: 8.6, height: 8, cutTop: [11, 11] }),
    pupil: blob({ centre: [6.6, 13.6], width: 3.2, height: 3 }),
    mouth: band({ from: [8.8, 18], to: [15.2, 18], bend: -1.2, thickness: 1.3, endShare: 0.7 }),
  }),
  excited: symmetricFace({
    brow: band({ from: [3.4, 3.6], to: [8.6, 2.8], bend: 0.8, thickness: 1.6 }),
    eye: blob({ centre: [6.4, 12], width: 9, height: 9.2 }),
    pupil: blob({ centre: [7, 11], width: 4, height: 4 }),
    mouth: blob({ centre: [12, 16.8], width: 6, height: 6, squareness: 0.2, cutTop: [16.8, 16.8] }),
  }),
  scornful: {
    ...symmetricFace({
      brow: blob({ centre: [6.2, 5.4], width: 5, height: 1.8, squareness: 0.5, rotation: 2 }),
      eye: blob({ centre: [6.4, 12.6], width: 8.4, height: 7.6, cutTop: [11.4, 11.4] }),
      pupil: blob({ centre: [5.4, 14], width: 3, height: 3 }),
      mouth: band({ from: [9.2, 18.8], to: [14.6, 18], bend: -0.2, thickness: 1.1, endShare: 0.7 }),
    }),
    rightBrow: mirrored(band({ from: [3.6, 4], to: [8.6, 3.2], bend: 0.6, thickness: 1.6 })),
    rightPupil: blob({ centre: [16.6, 14], width: 3, height: 3 }),
  },
  disgusted: symmetricFace({
    brow: blob({ centre: [6.6, 6], width: 5, height: 1.8, squareness: 0.5, rotation: 14 }),
    eye: blob({ centre: [6.4, 12.6], width: 8.4, height: 7.6, cutTop: [11.4, 12.2], cutBottom: [14.8, 14.8] }),
    pupil: blob({ centre: [6.8, 13.2], width: 3, height: 2.8 }),
    // an upside-down "D": open, corners pulled down
    mouth: blob({ centre: [12, 19.6], width: 5, height: 4.8, squareness: 0.2, cutBottom: [19.6, 19.6] }),
  }),
});
