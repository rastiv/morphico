// One SVG <path> that morphs between the states of an icon set. Shared by icon() and every text() cell.
import { animate, easings } from './engine.ts';
import type { Easing } from './engine.ts';
import {
  defaultShapes, drawnPieces, interpolate, pieceLengthOf, rotateAroundCenter, scaleAroundCenter, shapeForPair, toPathData,
  withDrawnPieces,
} from './geometry.ts';
import type { IconSet, PathNumbers } from './types.ts';

export type EasingName = keyof typeof easings;

export interface MorphOptions {
  /** Length of a morph in milliseconds (default 400). */
  duration?: number;
  /** An easing name or your own function `(progress) => easedProgress` (default `'easeInOutCubic'`). */
  easing?: EasingName | Easing;
}

export interface MorphResult {
  /** The state the morph was heading to. */
  state: string;
  /** `true` when a newer morph (or `destroy()`) took over before this one finished. */
  interrupted: boolean;
}

/** The empty state: nothing is drawn. Shapes grow out of it and shrink into it while fading. */
export const EMPTY_STATE = ' ';
/** How small a shape gets while it fades into (or out of) the empty state. */
const EMPTY_SCALE = 0.3;
export const DEFAULT_DURATION = 400;

// default layouts of every state, computed once per set on first use (nothing runs at import)
const shapesBySet = new WeakMap<IconSet, Record<string, PathNumbers>>();
export const shapesOf = (iconSet: IconSet): Record<string, PathNumbers> => {
  let shapes = shapesBySet.get(iconSet);
  if (!shapes) {
    shapes = defaultShapes(iconSet);
    shapesBySet.set(iconSet, shapes);
  }
  return shapes;
};

export const hasState = (iconSet: IconSet, state: string): boolean => state === EMPTY_STATE || state in iconSet.strokes;

export const prefersReducedMotion = (): boolean =>
  typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Blends towards the target in the start's frame while turning that frame by spin · progress. */
const blend = (from: PathNumbers, to: PathNumbers, progress: number, spin: number): PathNumbers => (spin
  ? rotateAroundCenter(interpolate(from, rotateAroundCenter(to, -spin), progress), spin * progress)
  : interpolate(from, to, progress));

export const clampToUnit = (value: number): number => Math.min(Math.max(value, 0), 1);

export interface MorphingPath {
  /** The state shown, or being morphed to. */
  readonly state: string;
  morphTo(state: string, options?: MorphOptions): Promise<MorphResult>;
  /** Stops a running morph where it is; its promise resolves as interrupted. */
  stop(): void;
}

export const createMorphingPath = (pathElement: SVGPathElement, iconSet: IconSet, initialState: string): MorphingPath => {
  const shapes = shapesOf(iconSet);
  const pieceLength = pieceLengthOf(iconSet);
  let state = initialState;
  let currentPath: PathNumbers | null = null; // null while empty
  let currentOpacity = 0;
  let running: { stopAnimation: () => void; resolvers: ((result: MorphResult) => void)[] } | null = null;

  const render = (path: PathNumbers | null, opacity: number): void => {
    currentPath = path;
    currentOpacity = path ? clampToUnit(opacity) : 0;
    if (path) pathElement.setAttribute('d', toPathData(path, pieceLength));
    else pathElement.removeAttribute('d');
    if (currentOpacity < 1) pathElement.setAttribute('opacity', String(+currentOpacity.toFixed(3)));
    else pathElement.removeAttribute('opacity');
  };

  /** Ends the running morph and resolves everyone waiting for it. */
  const finish = (interrupted: boolean): void => {
    if (!running) return;
    const { stopAnimation, resolvers } = running;
    running = null;
    stopAnimation();
    for (const resolve of resolvers) resolve({ state, interrupted });
  };

  render(state === EMPTY_STATE ? null : shapes[state], 1);

  return {
    get state() { return state; },

    morphTo(nextState, { duration = DEFAULT_DURATION, easing = 'easeInOutCubic' } = {}) {
      // asked again for the state it is already heading to: wait for the running morph
      if (running && nextState === state) {
        const { resolvers } = running;
        return new Promise((resolve) => { resolvers.push(resolve); });
      }
      const settled = !running;
      if (settled && nextState === state) return Promise.resolve({ state, interrupted: false });
      finish(true);
      const previousState = state;
      state = nextState;

      // settled: both sides use the pair's layouts; interrupted: start from the shape on screen
      const target = nextState === EMPTY_STATE ? null
        : previousState === EMPTY_STATE ? shapes[nextState] : shapeForPair(iconSet, shapes, nextState, previousState);
      const start = !settled ? currentPath
        : previousState === EMPTY_STATE ? null : shapeForPair(iconSet, shapes, previousState, nextState);
      const startOpacity = currentOpacity;
      const endOpacity = target ? 1 : 0;
      if ((!start && !target) || duration <= 0 || prefersReducedMotion()) {
        render(target, endOpacity);
        return Promise.resolve({ state, interrupted: false });
      }
      const from = start ?? scaleAroundCenter(target!, EMPTY_SCALE);
      const to = target ?? scaleAroundCenter(start!, EMPTY_SCALE);
      const spin = (settled && iconSet.spins[previousState]?.[nextState]) || 0;
      // pieces that appear or go are drawn along their path (only from a settled shape, between two real states)
      const drawn = settled && start && target ? drawnPieces(iconSet, previousState, nextState) : [];
      const ease = typeof easing === 'function' ? easing : easings[easing];
      const startTime = performance.now();

      return new Promise((resolve) => {
        const stopAnimation = animate((frameTime) => {
          const progress = clampToUnit((frameTime - startTime) / duration);
          if (progress < 1) {
            const easedProgress = ease(progress);
            const frame = withDrawnPieces(blend(from, to, easedProgress, spin), from, to, easedProgress, pieceLength, drawn);
            render(frame, startOpacity + (endOpacity - startOpacity) * easedProgress);
            return true;
          }
          render(target, endOpacity);
          finish(false);
          return false;
        });
        running = { stopAnimation, resolvers: [resolve] };
      });
    },

    stop: () => finish(true),
  };
};
