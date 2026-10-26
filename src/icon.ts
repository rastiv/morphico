// Layer 1: one icon that morphs between the states of a set, e.g. a single digit.
import { resolveIconSet } from './iconSets.ts';
import type { IconSetName } from './iconSets.ts';
import { createMorphingPath, EMPTY_STATE, hasState } from './morph.ts';
import type { MorphOptions, MorphResult } from './morph.ts';
import { createIconSvg, createStrokedElement } from './svg.ts';
import type { StyleOptions } from './svg.ts';
import type { IconSet } from './types.ts';

export interface IconOptions extends MorphOptions, StyleOptions {
  /** A built-in set by name (default `'round'`) or a set object. */
  set?: IconSetName | IconSet;
  /** Corner roundness: 0 = sharp … 1 = the icon's own corners (default, also the maximum). Icon sets only. */
  roundness?: number;
  /** The state shown first (default: empty, `' '`). */
  state?: string;
  /** CSS width and height of the icon (default `'1em'`: it follows the font size). */
  size?: string;
}

export interface ChangeOptions extends MorphOptions {
  /** Called when the morph ends, with the same result the promise resolves to. */
  onEnd?: (result: MorphResult) => void;
}

export interface Icon {
  /** The state shown, or being morphed to. */
  readonly state: string;
  /**
   * Morphs to `state` (`'0'`…`'9'`, `'-'`, or `' '` for empty). The promise resolves when the morph ends;
   * an interrupted morph resolves with `interrupted: true`. Without animation when the user prefers reduced motion.
   */
  to(state: string, options?: ChangeOptions): Promise<MorphResult>;
  /** Stops any morph and removes the icon from the page. */
  destroy(): void;
}

const checkedState = (iconSet: IconSet, state: string): string => {
  const normalized = state === '' ? EMPTY_STATE : state;
  if (!hasState(iconSet, normalized)) throw new Error(`morphico: the icon set has no state "${state}"`);
  return normalized;
};

/** Adds a morphing icon (an <svg>) to `element`. */
export const icon = (element: Element, options: IconOptions = {}): Icon => {
  const {
    set, state = EMPTY_STATE, size = '1em', roundness, strokeWidth, lineCap, lineJoin, fill, ...defaultMorphOptions
  } = options;
  const iconSet = resolveIconSet(set, roundness);
  const style: StyleOptions = { strokeWidth, lineCap, lineJoin, fill };
  const svg = createIconSvg(iconSet, '0 0 24 24', style);
  svg.setAttribute('role', 'img');
  svg.style.width = size;
  svg.style.height = size;
  svg.style.overflow = 'visible'; // sharp tips (roundness 0, miter joins) may reach past the 24 × 24 box
  const pathElement = svg.appendChild(createStrokedElement('path', style));
  const morphingPath = createMorphingPath(pathElement, iconSet, checkedState(iconSet, state));
  const updateLabel = () => svg.setAttribute('aria-label', morphingPath.state.trim());
  updateLabel();
  element.appendChild(svg);

  return {
    get state() { return morphingPath.state; },
    to(nextState, { onEnd, ...morphOptions } = {}) {
      const morph = morphingPath.morphTo(checkedState(iconSet, nextState), { ...defaultMorphOptions, ...morphOptions });
      updateLabel();
      if (onEnd) morph.then(onEnd);
      return morph;
    },
    destroy() {
      morphingPath.stop();
      svg.remove();
    },
  };
};
