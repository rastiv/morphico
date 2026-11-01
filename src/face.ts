// Layer 4: a face that morphs between feelings. 7 soft filled pieces (sets/faces.ts) — brows, eyes and mouth in the
// CSS color, the pupils in their own color and clipped to the eyes. Blinking runs on top of any expression, by itself
// every few seconds (option) or on blink().
import { animate, easings } from './engine.ts';
import type { Easing } from './engine.ts';
import { DEFAULT_DURATION, prefersReducedMotion } from './morph.ts';
import type { MorphOptions, MorphResult } from './morph.ts';
import { blinked, faceExpressionNames, faceExpressionPieces, facePaths, interpolateFace } from './sets/faces.ts';
import type { FaceExpression, FacePieces } from './sets/faces.ts';
import { checkedInit } from './roundness.ts';
import { createSvgElement } from './svg.ts';

export interface FaceOptions extends MorphOptions {
  /** Color of the pupils (default `'white'`). Brows, eyes and mouth take the CSS `color`. */
  pupilColor?: string;
  /** Blink by itself every few seconds (default `true`). Off when the user prefers reduced motion. */
  blink?: boolean;
  /** CSS width and height of the face (default `'100%'`: it fills the element). */
  size?: string;
}

export interface FaceChangeOptions extends MorphOptions {
  /** Called when the morph ends, with the same result the promise resolves to. */
  onEnd?: (result: MorphResult) => void;
}

export interface Face {
  /**
   * Morphs to another expression. The promise resolves when the morph ends; an interrupted morph resolves with
   * `interrupted: true`. Without animation when the user prefers reduced motion.
   */
  to(state: FaceExpression, options?: FaceChangeOptions): Promise<MorphResult>;
  /** Closes the eyes and opens them again, on top of the expression (none while asleep or with reduced motion). */
  blink(): Promise<void>;
  /** Stops everything and removes the face from the page. */
  destroy(): void;
}

const BLINK_CLOSING = 90;
const BLINK_SHUT = 50;
const BLINK_OPENING = 150;
const AUTO_BLINK_MIN_PAUSE = 2500;
const AUTO_BLINK_EXTRA_PAUSE = 3500;
/** Expressions whose eyes are already shut: blinking does nothing. */
const EYES_SHUT: readonly FaceExpression[] = ['asleep', 'laughing'];

let faceCount = 0;

const checkedExpression = (state: string): FaceExpression => {
  if (!(faceExpressionNames as readonly string[]).includes(state)) throw new Error(`morphico: face() has no expression "${state}"`);
  return state as FaceExpression;
};

const resolveEasing = (easing: MorphOptions['easing']): Easing => (typeof easing === 'function' ? easing : easings[easing ?? 'easeInOutCubic']);

/** Adds a morphing face (an <svg>) to `element`, showing the expression `init` first. */
export const face = (element: Element, init: FaceExpression, options: FaceOptions = {}): Face => {
  const { pupilColor = 'white', blink: blinksByItself = true, size = '100%', ...defaultMorphOptions } = options;
  const expressions = faceExpressionPieces();
  let state = checkedExpression(checkedInit(init, 'face'));
  let shownPieces: FacePieces = expressions[state];
  let openness = 1;

  const clipId = `morphico-face-${++faceCount}`;
  const svg = createSvgElement('svg', { viewBox: '0 0 24 24', fill: 'currentColor', role: 'img' });
  svg.style.width = size;
  svg.style.height = size;
  svg.style.overflow = 'visible';
  const clipPath = svg.appendChild(createSvgElement('clipPath', { id: clipId }));
  const eyesPath = clipPath.appendChild(createSvgElement('path'));
  const featuresPath = svg.appendChild(createSvgElement('path'));
  const pupilsPath = svg.appendChild(createSvgElement('path', { fill: pupilColor, 'clip-path': `url(#${clipId})` }));

  const render = (): void => {
    const paths = facePaths(blinked(shownPieces, openness));
    featuresPath.setAttribute('d', paths.features);
    eyesPath.setAttribute('d', paths.eyes);
    pupilsPath.setAttribute('d', paths.pupils);
  };
  const updateLabel = () => svg.setAttribute('aria-label', state);
  render();
  updateLabel();
  element.appendChild(svg);

  // ---- morphing ----

  let morph: { stopAnimation: () => void; resolve: (result: MorphResult) => void; state: FaceExpression } | null = null;

  const endMorph = (interrupted: boolean): void => {
    if (!morph) return;
    const { stopAnimation, resolve, state: morphState } = morph;
    morph = null;
    stopAnimation();
    resolve({ state: morphState, interrupted });
  };

  const morphTo = (nextState: FaceExpression, morphOptions: MorphOptions): Promise<MorphResult> => {
    endMorph(true);
    state = nextState;
    updateLabel();
    const fromPieces = shownPieces;
    const toPieces = expressions[nextState];
    const duration = morphOptions.duration ?? DEFAULT_DURATION;
    if (prefersReducedMotion() || duration <= 0) {
      shownPieces = toPieces;
      render();
      return Promise.resolve({ state: nextState, interrupted: false });
    }
    const easing = resolveEasing(morphOptions.easing);
    let startTime: number | null = null;
    return new Promise((resolve) => {
      const stopAnimation = animate((frameTime) => {
        startTime ??= frameTime;
        const progress = Math.min((frameTime - startTime) / duration, 1);
        shownPieces = interpolateFace(fromPieces, toPieces, easing(progress));
        render();
        if (progress < 1) return true;
        endMorph(false);
        return false;
      });
      morph = { stopAnimation, resolve, state: nextState };
    });
  };

  // ---- blinking ----

  let stopBlink: (() => void) | null = null;
  let finishBlink: (() => void) | null = null;

  const endBlink = (): void => {
    stopBlink?.();
    stopBlink = null;
    if (openness < 1) {
      openness = 1;
      render();
    }
    finishBlink?.();
    finishBlink = null;
  };

  const blink = (): Promise<void> => {
    if (EYES_SHUT.includes(state) || prefersReducedMotion()) return Promise.resolve();
    endBlink();
    let startTime: number | null = null;
    return new Promise((resolve) => {
      finishBlink = resolve;
      stopBlink = animate((frameTime) => {
        startTime ??= frameTime;
        const elapsed = frameTime - startTime;
        if (elapsed < BLINK_CLOSING) openness = 1 - elapsed / BLINK_CLOSING;
        else if (elapsed < BLINK_CLOSING + BLINK_SHUT) openness = 0;
        else openness = Math.min((elapsed - BLINK_CLOSING - BLINK_SHUT) / BLINK_OPENING, 1);
        render();
        if (openness < 1 || elapsed < BLINK_CLOSING) return true;
        stopBlink = null;
        finishBlink = null;
        resolve();
        return false;
      });
    });
  };

  let autoBlinkTimer: ReturnType<typeof setTimeout> | undefined;
  const scheduleAutoBlink = (): void => {
    autoBlinkTimer = setTimeout(() => {
      if (typeof document === 'undefined' || !document.hidden) void blink();
      scheduleAutoBlink();
    }, AUTO_BLINK_MIN_PAUSE + Math.random() * AUTO_BLINK_EXTRA_PAUSE);
  };
  if (blinksByItself && !prefersReducedMotion()) scheduleAutoBlink();

  return {
    to(nextState, { onEnd, ...morphOptions } = {}) {
      const result = morphTo(checkedExpression(nextState), { ...defaultMorphOptions, ...morphOptions });
      if (onEnd) result.then(onEnd);
      return result;
    },
    blink,
    destroy() {
      clearTimeout(autoBlinkTimer);
      endMorph(true);
      endBlink();
      svg.remove();
    },
  };
};
