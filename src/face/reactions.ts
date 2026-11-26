// Reactions of face(): short movements of the whole face on top of any expression — a nod (yes, approval) and a
// shake (no, disapproval). Each is an offset of the face in grid units over time, easing out at both ends.
import { animate } from '../engine.ts';
import { prefersReducedMotion } from '../morph.ts';
import type { Point } from '../types.ts';

export const faceReactionNames = ['nod', 'shake'] as const;
export type FaceReaction = typeof faceReactionNames[number];

interface Movement {
  duration: number;
  /** The face's offset (grid units) at `progress` 0…1 of the movement; 0 at both ends. */
  offsetAt: (progress: number) => Point;
}

const NOD_DEPTH = 1.6;
const SHAKE_WIDTH = 1.6;
const MOVEMENTS: Record<FaceReaction, Movement> = {
  // down and up twice, the second dip a little shallower
  nod: { duration: 800, offsetAt: (progress) => [0, NOD_DEPTH * Math.sin(2 * Math.PI * progress) ** 2 * (1 - 0.4 * progress)] },
  // left and right twice, dying out
  shake: { duration: 750, offsetAt: (progress) => [-SHAKE_WIDTH * Math.sin(4 * Math.PI * progress) * (1 - progress), 0] },
};

export interface Reactions {
  /** Where the face is moved to now (grid units). */
  readonly offset: Point;
  react(reaction: FaceReaction): Promise<void>;
  stop(): void;
}

/** `onChange` redraws the face. */
export const createReactions = (onChange: () => void): Reactions => {
  let offset: Point = [0, 0];
  let stopMovement: (() => void) | null = null;
  let finishMovement: (() => void) | null = null;

  const stop = (): void => {
    stopMovement?.();
    stopMovement = null;
    if (offset[0] || offset[1]) {
      offset = [0, 0];
      onChange();
    }
    finishMovement?.();
    finishMovement = null;
  };

  const react = (reaction: FaceReaction): Promise<void> => {
    const movement = MOVEMENTS[reaction];
    if (!movement) throw new Error(`morphico: face() has no reaction "${reaction}" (known: ${faceReactionNames.join(', ')})`);
    stop();
    if (prefersReducedMotion()) return Promise.resolve();
    let startTime: number | null = null;
    return new Promise((resolve) => {
      finishMovement = resolve;
      stopMovement = animate((frameTime) => {
        startTime ??= frameTime;
        const progress = Math.min((frameTime - startTime) / movement.duration, 1);
        offset = progress < 1 ? movement.offsetAt(progress) : [0, 0];
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
    get offset() { return offset; },
    react,
    stop,
  };
};
