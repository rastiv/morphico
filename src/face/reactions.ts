// Reactions of face(): short gestures on top of any expression — a nod (yes, approval) and a shake (no,
// disapproval). A gesture is more than a moving picture: the parts move by different amounts (brows and eyes more than
// the mouth, the pupils lag behind and keep looking at the viewer), the face squashes a little as if the head turned,
// the eyes narrow on a nod, and the expression leans for a moment towards a smile (nod) or disappointment (shake).
// Timing has anticipation (a small move the other way first) and settles with a small overshoot.
import { animate } from '../engine.ts';
import { prefersReducedMotion } from '../morph.ts';
import type { Point } from '../types.ts';
import type { FaceExpression } from './expressions.ts';
import { PIECE_NAMES } from './pieces.ts';
import type { FacePieces } from './pieces.ts';
import { interpolateFace } from './transforms.ts';

export const faceReactionNames = ['nod', 'shake'] as const;
export type FaceReaction = typeof faceReactionNames[number];

/** Where a gesture is at a moment: everything the face needs to draw it. */
export interface ReactionPose {
  /** How far each piece moves (grid units). */
  shifts: Record<keyof FacePieces, Point>;
  /** Squash of the whole face around its centre (1 = none) and its tilt in degrees. */
  scaleX: number;
  scaleY: number;
  tilt: number;
  /** Eyes narrowed: 1 = open as drawn. */
  openness: number;
  /** The expression it leans towards, and how far (0…1). */
  mood: FaceExpression;
  moodAmount: number;
}

type Keyframes = [time: number, value: number][];

/** The value at `progress` along keyframes, eased in and out between each two (smoothstep). */
const valueAt = (keyframes: Keyframes, progress: number): number => {
  const nextIndex = keyframes.findIndex(([time]) => time >= progress);
  if (nextIndex <= 0) return keyframes[Math.max(nextIndex, 0)][1];
  const [startTime, startValue] = keyframes[nextIndex - 1], [endTime, endValue] = keyframes[nextIndex];
  const share = (progress - startTime) / (endTime - startTime);
  return startValue + (endValue - startValue) * share * share * (3 - 2 * share);
};

/** 0 → 1 → 0: in quickly, held, out at the end (how far the mood and the squash go). */
const envelope = (progress: number): number => valueAt([[0, 0], [0.18, 1], [0.72, 1], [1, 0]], progress);

// nod: a small lift, down, back up a little past rest, a smaller second nod, settle
const NOD: Keyframes = [[0, 0], [0.08, -0.15], [0.26, 1], [0.44, -0.12], [0.62, 0.6], [0.8, -0.06], [1, 0]];
// shake: a small turn one way, then the other way, dying out
const SHAKE: Keyframes = [[0, 0], [0.1, -0.45], [0.27, 1], [0.45, -0.8], [0.62, 0.5], [0.78, -0.2], [1, 0]];

const DURATIONS: Record<FaceReaction, number> = { nod: 950, shake: 900 };

/** The pose of `reaction` at `progress` 0…1 of it. */
export const reactionPoseAt = (reaction: FaceReaction, progress: number): ReactionPose => {
  const mood = envelope(progress);
  if (reaction === 'nod') {
    const dip = valueAt(NOD, progress);
    const down = Math.max(dip, 0);
    // the brows travel a little more than the mouth (the head bends forward); the pupils rise against the dip
    const shift = (amount: number): Point => [0, amount * dip];
    return {
      shifts: {
        leftBrow: shift(1.5), rightBrow: shift(1.5), leftEye: shift(1.3), rightEye: shift(1.3),
        leftPupil: [0, 1.3 * dip - 0.45 * down], rightPupil: [0, 1.3 * dip - 0.45 * down], mouth: shift(1.05),
      },
      scaleX: 1, scaleY: 1 - 0.05 * down, tilt: 0, openness: 1 - 0.3 * down, mood: 'smiling', moodAmount: 0.45 * mood,
    };
  }
  const turn = valueAt(SHAKE, progress);
  // brows and eyes travel more than the mouth (as if the head turned); the pupils lag behind
  const shift = (amount: number): Point => [amount * turn, 0];
  return {
    shifts: {
      leftBrow: shift(1.7), rightBrow: shift(1.7), leftEye: shift(1.5), rightEye: shift(1.5),
      leftPupil: shift(0.9), rightPupil: shift(0.9), mouth: shift(1.1),
    },
    scaleX: 1 - 0.06 * Math.abs(turn), scaleY: 1, tilt: 3 * turn, openness: 1, mood: 'disappointed', moodAmount: 0.4 * mood,
  };
};

/** The face's pieces in a pose: leaning towards its mood, each piece moved by its own amount. */
export const posedFace = (pieces: FacePieces, pose: ReactionPose, expressions: Record<FaceExpression, FacePieces>): FacePieces => {
  const leaning = pose.moodAmount > 0 ? interpolateFace(pieces, expressions[pose.mood], pose.moodAmount) : pieces;
  return Object.fromEntries(PIECE_NAMES.map((name) => {
    const [shiftX, shiftY] = pose.shifts[name];
    return [name, leaning[name].map(([x, y]): Point => [x + shiftX, y + shiftY])];
  })) as FacePieces;
};

export interface Reactions {
  /** The pose now, or null at rest. */
  readonly pose: ReactionPose | null;
  react(reaction: FaceReaction): Promise<void>;
  stop(): void;
}

/** `onChange` redraws the face. */
export const createReactions = (onChange: () => void): Reactions => {
  let pose: ReactionPose | null = null;
  let stopMovement: (() => void) | null = null;
  let finishMovement: (() => void) | null = null;

  const stop = (): void => {
    stopMovement?.();
    stopMovement = null;
    if (pose) {
      pose = null;
      onChange();
    }
    finishMovement?.();
    finishMovement = null;
  };

  const react = (reaction: FaceReaction): Promise<void> => {
    if (!faceReactionNames.includes(reaction)) {
      throw new Error(`morphico: face() has no reaction "${reaction}" (known: ${faceReactionNames.join(', ')})`);
    }
    stop();
    if (prefersReducedMotion()) return Promise.resolve();
    const duration = DURATIONS[reaction];
    let startTime: number | null = null;
    return new Promise((resolve) => {
      finishMovement = resolve;
      stopMovement = animate((frameTime) => {
        startTime ??= frameTime;
        const progress = Math.min((frameTime - startTime) / duration, 1);
        pose = progress < 1 ? reactionPoseAt(reaction, progress) : null;
        onChange();
        if (progress < 1) return true;
        stopMovement = null;
        finishMovement = null;
        resolve();
        return false;
      });
    });
  };

  return {
    get pose() { return pose; },
    react,
    stop,
  };
};
