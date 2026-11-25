// Looking of face(): the pupils turn towards a point on the page or an element and follow it smoothly, on top of any
// expression (transforms.ts `lookingAt` draws it).
import { animate } from '../engine.ts';
import { prefersReducedMotion } from '../morph.ts';
import type { Point } from '../types.ts';

/** A look target this far from the face's centre (in face widths) turns the pupils about two thirds of the way. */
const LOOK_DISTANCE_SCALE = 0.5;
/** How quickly the pupils catch up with a look target (ms; about two thirds of the way in this time). */
const LOOK_FOLLOW_TIME = 70;

export interface Gaze {
  /** The pupils' direction (each −1…1, length ≤ 1). */
  readonly direction: Point;
  /** How much of the direction is shown: 0 = the pupils as the expression has them, 1 = turned. */
  readonly weight: number;
  /** Turns towards a point (viewport coordinates) or an element's middle; without arguments back to the expression. */
  look(target?: number | Element, y?: number): void;
  stop(): void;
}

/** `face` is the face's <svg> (where it is on the page); `onChange` redraws the face. */
export const createGaze = (face: Element, onChange: () => void): Gaze => {
  let direction: Point = [0, 0];
  let weight = 0;
  let targetDirection: Point = [0, 0];
  let targetWeight = 0;
  let stopFollowing: (() => void) | null = null;

  const follow = (): void => {
    if (prefersReducedMotion()) {
      stopFollowing?.();
      stopFollowing = null;
      direction = targetDirection;
      weight = targetWeight;
      onChange();
      return;
    }
    if (stopFollowing) return;
    let previousFrameTime: number | null = null;
    stopFollowing = animate((frameTime) => {
      const elapsed = previousFrameTime === null ? 16 : frameTime - previousFrameTime;
      previousFrameTime = frameTime;
      const share = 1 - Math.exp(-elapsed / LOOK_FOLLOW_TIME);
      direction = [direction[0] + (targetDirection[0] - direction[0]) * share, direction[1] + (targetDirection[1] - direction[1]) * share];
      weight += (targetWeight - weight) * share;
      const settled = Math.max(Math.abs(targetDirection[0] - direction[0]), Math.abs(targetDirection[1] - direction[1]), Math.abs(targetWeight - weight)) < 0.001;
      if (settled) {
        direction = targetDirection;
        weight = targetWeight;
      }
      onChange();
      if (!settled) return true;
      stopFollowing = null;
      return false;
    });
  };

  const look = (target?: number | Element, y?: number): void => {
    if (target === undefined) {
      targetWeight = 0;
    } else {
      const faceBox = face.getBoundingClientRect();
      if (!faceBox.width) return;
      const targetBox = typeof target === 'number' ? null : target.getBoundingClientRect();
      const targetX = targetBox ? targetBox.left + targetBox.width / 2 : (target as number);
      const targetY = targetBox ? targetBox.top + targetBox.height / 2 : (y ?? 0);
      const offsetX = targetX - (faceBox.left + faceBox.width / 2);
      const offsetY = targetY - (faceBox.top + faceBox.height / 2);
      const distance = Math.hypot(offsetX, offsetY);
      const strength = 1 - Math.exp(-distance / (faceBox.width * LOOK_DISTANCE_SCALE));
      targetDirection = distance ? [(offsetX / distance) * strength, (offsetY / distance) * strength] : [0, 0];
      targetWeight = 1;
    }
    follow();
  };

  return {
    get direction() { return direction; },
    get weight() { return weight; },
    look,
    stop() {
      stopFollowing?.();
      stopFollowing = null;
    },
  };
};
