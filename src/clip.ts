// Layer 3: an element cut out by a morphing shape (a star, a heart, a speech bubble …), e.g. a photo or a card.
// The shape is square (1:1), placed by its centre (x, y) and size in % or px of the element, can be turned and
// outlined (only a band along its edge shows). Filled → CSS `clip-path: url(#id)`; outlined → `mask: url(#id)`
// (clip-path ignores line width). The <clipPath> / <mask> live in one hidden <svg> per clip.
import { animate, easings } from './engine.ts';
import { interpolate, pieceLengthOf, shapeForPair, toPathData } from './geometry.ts';
import { resolveIconSet } from './iconSets.ts';
import { clampToUnit, DEFAULT_DURATION, prefersReducedMotion, shapesOf } from './morph.ts';
import type { MorphOptions, MorphResult } from './morph.ts';
import { clipShapes } from './sets/shapes.ts';
import { createSvgElement } from './svg.ts';
import type { IconSet, PathNumbers } from './types.ts';

/** A length: a number = % (of the element's width for x and size, of its height for y), or `'40%'` / `'120px'`. */
export type Length = number | string;

/** Only a band along the shape's edge shows. */
export interface ClipOutline {
  /** Width of the band in px. */
  width: number;
  /** Where the band sits: inside the edge (default), on it (`'centre'`) or outside it. */
  band?: 'inside' | 'centre' | 'outside';
}

/** What can change, in `clip()` and in every `to()` / `set()`. */
export interface ClipChanges {
  /** Centre of the shape, from the element's left edge (default 50 = the middle). */
  x?: Length;
  /** Centre of the shape, from the element's top edge (default 50 = the middle). */
  y?: Length;
  /** Side of the shape's square (default: the largest square that fits the element). */
  size?: Length;
  /** Turn in degrees, clockwise; absolute (`rotation: 360` ends one full turn from 0). */
  rotation?: number;
  /** Corners: 1 = the shape's own (default, the roundest) … 0 = sharp. */
  roundness?: number;
  /** `false` (default) = the whole shape shows; an outline = only a band along its edge (not animated). */
  outline?: false | ClipOutline;
}

export interface ClipOptions extends ClipChanges, MorphOptions {
  /** The shape set (default: the built-in shapes, based on Lucide). */
  set?: IconSet;
  /** The shape shown first (default `'circle'`). */
  state?: string;
}

export interface ClipChangeOptions extends ClipChanges, MorphOptions {
  /** Called when the change ends, with the same result the promise resolves to. */
  onEnd?: (result: MorphResult) => void;
}

export interface Clip {
  /** The shape shown, or being morphed to. */
  readonly state: string;
  /**
   * Morphs to the shape `state` and animates the given changes along (move, resize, turn, roundness), or — called with
   * only an object — animates those changes and keeps the shape. The promise resolves when it ends; an interrupted
   * change resolves with `interrupted: true`. Without animation when the user prefers reduced motion.
   */
  to(state: string, options?: ClipChangeOptions): Promise<MorphResult>;
  to(changes: ClipChangeOptions): Promise<MorphResult>;
  /** Jumps (no animation), e.g. while a slider is dragged. Stops a running change (it resolves as interrupted). */
  set(changes: ClipChanges & { state?: string }): void;
  /** Stops, removes the hidden <svg> and gives the element back its own clip-path / mask. */
  destroy(): void;
}

const GRID_SIZE = 24;
const GRID_CENTER = 12;
const DEGREE = Math.PI / 180;
/** Masks and their clip regions reach far past the element, so bands and turned shapes are never cut by them. */
const FAR = 100000;

let clipCount = 0;

/** Where the shape is in element pixels: what is drawn and what animates. */
interface PixelPlacement {
  centerX: number;
  centerY: number;
  side: number;
}

/** What is drawn: a frame of a change, or the resting shape. */
interface Frame {
  shape: PathNumbers;
  rotation: number;
  placement: PixelPlacement;
}

const lengthToPixels = (length: Length, reference: number, name: string): number => {
  if (typeof length === 'number' && Number.isFinite(length)) return (length / 100) * reference;
  const match = typeof length === 'string' ? /^\s*(-?[\d.]+(?:e[-+]?\d+)?)\s*(px|%)\s*$/i.exec(length) : null;
  if (!match) throw new Error(`morphico: ${name} "${length}" is not a length — use a number (= %), '40%' or '120px'`);
  const value = Number(match[1]);
  return match[2] === 'px' ? value : (value / 100) * reference;
};

const checkedOutline = (outline: false | ClipOutline): false | ClipOutline => {
  if (!outline) return false;
  if (!(outline.width > 0)) throw new Error('morphico: outline.width must be a number of px above 0');
  if (outline.band && !['inside', 'centre', 'outside'].includes(outline.band)) {
    throw new Error(`morphico: outline.band "${outline.band}" — use 'inside', 'centre' or 'outside'`);
  }
  return outline;
};

/** Cuts `element` out by a morphing shape. */
export const clip = (element: HTMLElement | SVGElement, options: ClipOptions = {}): Clip => {
  const {
    set = clipShapes, state: initialState = 'circle', x = 50, y = 50, size, rotation = 0, roundness = 1,
    outline = false, ...defaultMorphOptions
  } = options;
  const checkedState = (shapeSet: IconSet, state: string): string => {
    if (!(state in shapeSet.strokes)) {
      throw new Error(`morphico: unknown shape "${state}" (known: ${Object.keys(shapeSet.strokes).join(', ')})`);
    }
    return state;
  };

  for (const [name, length] of [['x', x], ['y', y], ['size', size]] as const) {
    if (length !== undefined) lengthToPixels(length, 1, name);
  }
  /** Where the change goes (or what shows when nothing moves). */
  const target = {
    state: checkedState(set, initialState), set: resolveIconSet(set, roundness), roundness,
    x, y, size, rotation, outline: checkedOutline(outline),
  };
  const pieceLength = pieceLengthOf(set);
  let frame: Frame | null = null; // null = resting at the target
  let running: { stopAnimation: () => void; resolvers: ((result: MorphResult) => void)[] } | null = null;
  let elementWidth = 0, elementHeight = 0;

  // ---- the hidden <svg> with the <clipPath> (filled) and the <mask> (outlined) ----
  const id = `morphico-clip-${++clipCount}`;
  const svg = createSvgElement('svg', { width: 0, height: 0, 'aria-hidden': 'true', focusable: 'false' });
  svg.style.position = 'absolute';
  svg.style.pointerEvents = 'none';
  const clipPathElement = svg.appendChild(createSvgElement('clipPath', { id: `${id}-shape`, clipPathUnits: 'objectBoundingBox' }));
  const clipShape = clipPathElement.appendChild(createSvgElement('path'));
  const farRegion = { maskUnits: 'userSpaceOnUse', x: -FAR, y: -FAR, width: 2 * FAR, height: 2 * FAR };
  const maskElement = svg.appendChild(createSvgElement('mask', { id: `${id}-band`, ...farRegion }));
  /** Every path drawn in element pixels for the outlined band (the band itself and its helpers). */
  let bandPaths: SVGPathElement[] = [];

  const buildBand = (): void => {
    for (const helper of svg.querySelectorAll('.morphico-band-helper')) helper.remove();
    maskElement.replaceChildren();
    bandPaths = [];
    if (!target.outline) return;
    const { width, band = 'inside' } = target.outline;
    const pixelPath = (attributes: Record<string, string | number>) => {
      const path = createSvgElement('path', attributes);
      bandPaths.push(path);
      return path;
    };
    // inside = a line twice as wide, clipped to the shape; outside = a line twice as wide, the shape cut out of it
    const edgeLine = (lineWidth: number) =>
      pixelPath({ fill: 'none', stroke: 'white', 'stroke-width': lineWidth, 'stroke-linejoin': 'miter' });
    if (band === 'centre') {
      maskElement.append(edgeLine(width));
    } else if (band === 'inside') {
      const insideClip = createSvgElement('clipPath', { id: `${id}-inside`, class: 'morphico-band-helper' });
      insideClip.append(pixelPath({}));
      svg.append(insideClip);
      const line = edgeLine(2 * width);
      line.setAttribute('clip-path', `url(#${id}-inside)`);
      maskElement.append(line);
    } else {
      // painting black over the inside would only work for luminance masks; a mask cut out of the line works for both
      const outsideMask = createSvgElement('mask', { id: `${id}-outside`, class: 'morphico-band-helper', ...farRegion });
      outsideMask.append(
        createSvgElement('rect', { x: -FAR, y: -FAR, width: 2 * FAR, height: 2 * FAR, fill: 'white' }),
        pixelPath({ fill: 'black' }),
      );
      svg.append(outsideMask);
      const line = edgeLine(2 * width);
      line.setAttribute('mask', `url(#${id}-outside)`);
      maskElement.append(line);
    }
  };

  const ownClipPath = element.style.clipPath;
  const ownMask = element.style.mask;
  const applyStyle = (): void => {
    const mask = target.outline ? `url(#${id}-band)` : ownMask;
    element.style.clipPath = target.outline ? ownClipPath : `url(#${id}-shape)`;
    element.style.mask = mask;
    element.style.setProperty('-webkit-mask', mask);
  };

  // ---- placement and drawing ----
  const restingPlacement = (): PixelPlacement => ({
    centerX: lengthToPixels(target.x, elementWidth, 'x'),
    centerY: lengthToPixels(target.y, elementHeight, 'y'),
    side: target.size === undefined ? Math.min(elementWidth, elementHeight) : lengthToPixels(target.size, elementWidth, 'size'),
  });
  const restingFrame = (): Frame =>
    ({ shape: shapesOf(target.set)[target.state], rotation: target.rotation, placement: restingPlacement() });

  /** The shape in element pixels: scaled to its square, turned around the square's centre, moved into place. */
  const toElementPixels = ({ shape, rotation: angle, placement: { centerX, centerY, side } }: Frame): PathNumbers => {
    const scale = side / GRID_SIZE;
    const cos = Math.cos(angle * DEGREE), sin = Math.sin(angle * DEGREE);
    const pixels: PathNumbers = [];
    for (let index = 0; index < shape.length; index += 2) {
      const offsetX = (shape[index] - GRID_CENTER) * scale, offsetY = (shape[index + 1] - GRID_CENTER) * scale;
      pixels.push(centerX + offsetX * cos - offsetY * sin, centerY + offsetX * sin + offsetY * cos);
    }
    return pixels;
  };

  const render = (): void => {
    if (!elementWidth || !elementHeight) return;
    const pixels = toElementPixels(frame ?? restingFrame());
    if (target.outline) {
      const pathData = toPathData(pixels, pieceLength);
      for (const path of bandPaths) path.setAttribute('d', pathData);
    } else {
      // objectBoundingBox: 0…1 of the element's width / height
      const boxUnits = pixels.map((value, index) => value / (index % 2 ? elementHeight : elementWidth));
      clipShape.setAttribute('d', toPathData(boxUnits, pieceLength));
    }
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
    for (const name of ['x', 'y', 'size'] as const) {
      if (changes[name] !== undefined) lengthToPixels(changes[name], 1, name);
    }
    if (changes.state !== undefined) target.state = checkedState(target.set, changes.state);
    if (changes.roundness !== undefined && changes.roundness !== target.roundness) {
      target.roundness = changes.roundness;
      target.set = resolveIconSet(set, changes.roundness);
    }
    if (changes.x !== undefined) target.x = changes.x;
    if (changes.y !== undefined) target.y = changes.y;
    if (changes.size !== undefined) target.size = changes.size;
    if (changes.rotation !== undefined) target.rotation = changes.rotation;
    if (changes.outline !== undefined) {
      target.outline = checkedOutline(changes.outline);
      buildBand();
      applyStyle();
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
    const to = restingPlacement();
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
  const root = element.getRootNode();
  // inside a shadow root, url(#id) only finds ids of that root
  (root instanceof ShadowRoot ? root : document.body).append(svg);
  buildBand();
  applyStyle();
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
    get state() { return target.state; },
    to(stateOrChanges: string | ClipChangeOptions, options: ClipChangeOptions = {}) {
      const { onEnd, duration, easing, ...changes } = typeof stateOrChanges === 'string'
        ? { ...options, state: stateOrChanges } : stateOrChanges;
      const result = change(changes, { ...defaultMorphOptions, ...(duration !== undefined && { duration }), ...(easing && { easing }) });
      if (onEnd) result.then(onEnd);
      return result;
    },
    set(changes) {
      finish(true);
      frame = null;
      applyChanges(changes);
      render();
    },
    destroy() {
      finish(true);
      resizeObserver?.disconnect();
      svg.remove();
      element.style.clipPath = ownClipPath;
      element.style.mask = ownMask;
      element.style.setProperty('-webkit-mask', ownMask);
    },
  };
};
