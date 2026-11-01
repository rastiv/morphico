// Layer 1: one icon that morphs between the states of a set, e.g. a single digit.
import { createMorphingPath, EMPTY_STATE, hasState } from './morph.ts';
import type { MorphOptions, MorphResult } from './morph.ts';
import { checkedIconSet, checkedInit, resolveIconSet } from './roundness.ts';
import { createIconSvg, createStrokedElement } from './svg.ts';
import type { StyleOptions } from './svg.ts';
import type { IconSet } from './types.ts';

export interface IconOptions extends MorphOptions, StyleOptions {
  /** The set, e.g. `digitsRound` from `'morphico/sets/round'` or `iconsWeather` from `'morphico/sets/weather'`. */
  set: IconSet;
  /** Corner roundness: 0 = sharp … 1 = the icon's own corners (default, also the maximum). Icon sets only. */
  roundness?: number;
  /** CSS width and height of the icon (default `'1em'`: it follows the font size). */
  size?: string;
}

export interface IconChangeOptions extends MorphOptions {
  /** Called when the morph ends, with the same result the promise resolves to. */
  onEnd?: (result: MorphResult) => void;
}

export interface Icon {
  /**
   * Morphs to `state` (`'0'`…`'9'`, `'-'`, or `' '` for empty). The promise resolves when the morph ends;
   * an interrupted morph resolves with `interrupted: true`. Without animation when the user prefers reduced motion.
   */
  to(state: string, options?: IconChangeOptions): Promise<MorphResult>;
  /** Stops any morph and removes the icon from the page. */
  destroy(): void;
}

const checkedState = (iconSet: IconSet, state: string): string => {
  const normalized = state === '' ? EMPTY_STATE : state;
  if (!hasState(iconSet, normalized)) throw new Error(`morphico: the icon set has no state "${state}"`);
  return normalized;
};

/** Adds a morphing icon (an <svg>) to `element`, showing `init` first (`''` or `' '` = empty). */
export const icon = (element: Element, init: string, options: IconOptions): Icon => {
  const firstState = checkedInit(init, 'icon');
  const {
    set, size = '1em', roundness, strokeWidth, lineCap, lineJoin, fill, ...defaultMorphOptions
  } = options;
  const iconSet = resolveIconSet(checkedIconSet(set, 'icon'), roundness);
  const style: StyleOptions = { strokeWidth, lineCap, lineJoin, fill };
  const svg = createIconSvg(iconSet, '0 0 24 24', style);
  svg.setAttribute('role', 'img');
  svg.style.width = size;
  svg.style.height = size;
  svg.style.overflow = 'visible'; // sharp tips (roundness 0, miter joins) may reach past the 24 × 24 box
  const pathElement = svg.appendChild(createStrokedElement('path', style));
  const morphingPath = createMorphingPath(pathElement, iconSet, checkedState(iconSet, firstState));
  const updateLabel = () => svg.setAttribute('aria-label', morphingPath.state.trim());
  updateLabel();
  element.appendChild(svg);

  return {
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
