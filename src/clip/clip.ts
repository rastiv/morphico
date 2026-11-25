// Layer 3: an element cut out by a morphing shape (a star, a heart, a speech bubble …), e.g. a photo or a card.
// The shape is square (1:1), placed by its centre (x, y) and size in % or px of the element, can be turned and
// outlined (only a band along its edge shows). Placement in placement.ts, the hidden <svg> with the <clipPath> /
// <mask> in mask.ts; here the options, the changes and their animation.
import { animate, easings } from '../engine.ts';
import { pieceLengthOf, shapeForPair } from '../geometry/pairs.ts';
import { interpolate } from '../geometry/path-numbers.ts';
import { clampToUnit, DEFAULT_DURATION, prefersReducedMotion, shapesOf } from '../morph.ts';
import type { MorphOptions, MorphResult } from '../morph.ts';
import { checkedInit, resolveIconSet } from '../roundness.ts';
import { clipShapes } from './shapes.ts';
import type { ClipShape } from './shapes.ts';
import type { IconSet } from '../types.ts';
import { createClipMask } from './mask.ts';
import { checkedOutline } from './options.ts';
import type { Clip, ClipChangeOptions, ClipChanges, ClipOptions } from './options.ts';
import { lengthToPixels, placementInPixels, toElementPixels } from './placement.ts';
import type { Frame } from './placement.ts';

const checkedState = (shapeSet: IconSet, state: string): string => {
  if (!(state in shapeSet.strokes)) {
    throw new Error(`morphico: unknown shape "${state}" (known: ${Object.keys(shapeSet.strokes).join(', ')})`);
  }
  return state;
};

/** Throws right away (not in an animation frame) for an x, y or size that isn't a length. */
const checkLengths = (changes: ClipChanges): void => {
  for (const name of ['x', 'y', 'size'] as const) {
    if (changes[name] !== undefined) lengthToPixels(changes[name], 1, name);
  }
};

/** Cuts `element` out by a morphing shape, `init` first. */
export const clip = (element: HTMLElement | SVGElement, init: ClipShape, options: ClipOptions = {}): Clip => {
  const {
    x = 50, y = 50, size, rotation = 0, roundness = 1,
    outline = false, inverted = false, ...defaultMorphOptions
  } = options;
  checkLengths({ x, y, size });
  /** Where the change goes (or what shows when nothing moves). */
  const target = {
    state: checkedState(clipShapes, checkedInit(init, 'clip')), set: resolveIconSet(clipShapes, roundness), roundness,
    x, y, size, rotation, outline: checkedOutline(outline), inverted,
  };
  let frame: Frame | null = null; // null = resting at the target
  let running: { stopAnimation: () => void; resolvers: ((result: MorphResult) => void)[] } | null = null;
  let elementWidth = 0, elementHeight = 0;
  const mask = createClipMask(element, pieceLengthOf(clipShapes));

  // ---- drawing ----
  const restingFrame = (): Frame => ({
    shape: shapesOf(target.set)[target.state],
    rotation: target.rotation,
    placement: placementInPixels(target, elementWidth, elementHeight),
  });

  const render = (): void => {
    if (!elementWidth || !elementHeight) return;
    mask.draw(toElementPixels(frame ?? restingFrame()), elementWidth, elementHeight);
  };

  const measure = (width: number, height: number): void => {
    elementWidth = width;
    elementHeight = height;
    render();
  };

  // ---- changes ----
  /** Ends the running change and resolves everyone waiting for it. */
  const finish = (interrupted: boolean): void => {
    if (!running) return;
    const { stopAnimation, resolvers } = running;
    running = null;
    stopAnimation();
    for (const resolve of resolvers) resolve({ state: target.state, interrupted });
  };

  /** Updates the target (checked first, so a wrong value throws right away, not in an animation frame). */
  const applyChanges = (changes: ClipChanges & { state?: string }): void => {
    checkLengths(changes);
    if (changes.state !== undefined) target.state = checkedState(target.set, changes.state);
    if (changes.roundness !== undefined && changes.roundness !== target.roundness) {
      target.roundness = changes.roundness;
      target.set = resolveIconSet(clipShapes, changes.roundness);
    }
    if (changes.x !== undefined) target.x = changes.x;
    if (changes.y !== undefined) target.y = changes.y;
    if (changes.size !== undefined) target.size = changes.size;
    if (changes.rotation !== undefined) target.rotation = changes.rotation;
    if (changes.outline !== undefined || changes.inverted !== undefined) {
      if (changes.outline !== undefined) target.outline = checkedOutline(changes.outline);
      if (changes.inverted !== undefined) target.inverted = changes.inverted;
      mask.setLook(target.outline, target.inverted);
    }
  };

  const change = (changes: ClipChanges & { state?: string }, morphOptions: MorphOptions): Promise<MorphResult> => {
    const settled = !running;
    finish(true);
    const previous = { state: target.state, set: target.set };
    const from = frame ?? restingFrame();
    applyChanges(changes);
    const { duration = DEFAULT_DURATION, easing = 'easeInOutCubic' } = morphOptions;
    if (duration <= 0 || prefersReducedMotion() || !elementWidth || !elementHeight) {
      frame = null;
      render();
      return Promise.resolve({ state: target.state, interrupted: false });
    }
    // settled: both sides use the pair's layouts; interrupted: start from the shape on screen
    const fromShape = settled
      ? shapeForPair(previous.set, shapesOf(previous.set), previous.state, target.state) : from.shape;
    const toShape = shapeForPair(target.set, shapesOf(target.set), target.state, previous.state);
    const to = placementInPixels(target, elementWidth, elementHeight);
    const ease = typeof easing === 'function' ? easing : easings[easing];
    const startTime = performance.now();
    return new Promise((resolve) => {
      const stopAnimation = animate((frameTime) => {
        const progress = clampToUnit((frameTime - startTime) / duration);
        if (progress >= 1) {
          frame = null;
          render();
          finish(false);
          return false;
        }
        const easedProgress = ease(progress);
        const between = (start: number, end: number) => start + (end - start) * easedProgress;
        frame = {
          shape: interpolate(fromShape, toShape, easedProgress),
          rotation: between(from.rotation, target.rotation),
          placement: {
            centerX: between(from.placement.centerX, to.centerX),
            centerY: between(from.placement.centerY, to.centerY),
            side: between(from.placement.side, to.side),
          },
        };
        render();
        return true;
      });
      running = { stopAnimation, resolvers: [resolve] };
    });
  };

  // ---- start ----
  mask.setLook(target.outline, target.inverted);
  const box = element.getBoundingClientRect();
  measure(box.width, box.height);
  const resizeObserver = typeof ResizeObserver === 'function'
    ? new ResizeObserver(([entry]) => {
      const borderBox = entry.borderBoxSize?.[0];
      if (borderBox) measure(borderBox.inlineSize, borderBox.blockSize);
      else measure(entry.contentRect.width, entry.contentRect.height);
    })
    : null;
  resizeObserver?.observe(element);

  return {
    to(stateOrChanges: string | ClipChangeOptions, options: ClipChangeOptions = {}) {
      const { onEnd, duration, easing, ...changes } = typeof stateOrChanges === 'string'
        ? { ...options, state: stateOrChanges } : stateOrChanges;
      const result = change(changes, { ...defaultMorphOptions, ...(duration !== undefined && { duration }), ...(easing && { easing }) });
      if (onEnd) result.then(onEnd);
      return result;
    },
    destroy() {
      finish(true);
      resizeObserver?.disconnect();
      mask.remove();
    },
  };
};
