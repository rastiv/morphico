// The public types of clip(), and the check of the outline option.
import type { MorphOptions, MorphResult } from '../morph.ts';
import type { ClipShape } from '../sets/shapes.ts';

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
  /** Side of the shape's square (default: 70 % of the element's shorter side). */
  size?: Length;
  /** Turn in degrees, clockwise; absolute (`rotation: 360` ends one full turn from 0). */
  rotation?: number;
  /** Corners: 1 = the shape's own (default, the roundest) … 0 = sharp. */
  roundness?: number;
  /** `false` (default) = the whole shape shows; an outline = only a band along its edge (not animated). */
  outline?: false | ClipOutline;
  /** `true` = the other way round: the shape (or band) is a hole, the rest of the element shows (not animated). */
  inverted?: boolean;
}

export type ClipOptions = ClipChanges & MorphOptions;

export interface ClipChangeOptions extends ClipChanges, MorphOptions {
  /** Called when the change ends, with the same result the promise resolves to. */
  onEnd?: (result: MorphResult) => void;
}

export interface Clip {
  /**
   * Morphs to the shape `state` and animates the given changes along (move, resize, turn, roundness), or — called with
   * only an object — animates those changes and keeps the shape. The promise resolves when it ends; an interrupted
   * change resolves with `interrupted: true`. Without animation when the user prefers reduced motion; `duration: 0`
   * jumps (e.g. while a slider is dragged).
   */
  to(state: ClipShape, options?: ClipChangeOptions): Promise<MorphResult>;
  to(changes: ClipChangeOptions): Promise<MorphResult>;
  /** Stops, removes the hidden <svg> and gives the element back its own clip-path / mask. */
  destroy(): void;
}

export const checkedOutline = (outline: false | ClipOutline): false | ClipOutline => {
  if (!outline) return false;
  if (!(outline.width > 0)) throw new Error('morphico: outline.width must be a number of px above 0');
  if (outline.band && !['inside', 'centre', 'outside'].includes(outline.band)) {
    throw new Error(`morphico: outline.band "${outline.band}" — use 'inside', 'centre' or 'outside'`);
  }
  return outline;
};
