// Layer 2: a line of characters (clock, counter, date) in narrow cells; changed digits morph.
// Every character reuses the 24×24 icon drawing; only the viewBox is narrowed to its cell.
import { resolveIconSet } from './iconSets.ts';
import type { IconSetName } from './iconSets.ts';
import { createMorphingPath, hasState } from './morph.ts';
import type { MorphingPath, MorphOptions } from './morph.ts';
import { createIconSvg, createSvgElement } from './svg.ts';
import type { IconSet } from './types.ts';

/** Characters `text()` can show: digits, `-` and space morph; `:` `.` `,` `/` stay still. Anything else is removed. */
const UNSUPPORTED_CHARACTERS = /[^0-9 :.,\/-]/g;

/** Vertical part of the 24×24 grid shown in a cell: y 3…21 holds every digit including its stroke. */
const CELL_TOP = 3;
const CELL_HEIGHT = 18;
/** Dot radius of `:` `.` `,` relative to the stroke width. */
const DOT_SIZE = 0.6;

export interface TextOptions extends MorphOptions {
  /** A built-in set by name (default `'round'`) or a set object. */
  set?: IconSetName | IconSet;
  /** The text shown first (default: empty). */
  value?: string;
  /** CSS height of the line (default `'1em'`: it follows the font size). */
  size?: string;
  /** Width of a digit cell in grid units, where a digit is 16 high (default: the set's own). */
  cellWidth?: number;
  /** Gap between cells in grid units (default: the set's own). The CSS variable `--morphico-spacing` overrides it. */
  spacing?: number;
}

export interface TextResult {
  /** The text the change was heading to. */
  value: string;
  /** `true` when a newer `set()` (or `destroy()`) took over before every digit finished. */
  interrupted: boolean;
}

export interface SetOptions extends MorphOptions {
  /** Called when every changed digit has finished, with the same result the promise resolves to. */
  onEnd?: (result: TextResult) => void;
}

export interface Text {
  /** The text shown, or being morphed to (after unsupported characters were removed). */
  readonly value: string;
  /**
   * Shows `value`. Unsupported characters are removed first. If the length and the places of `:` `.` `,` `/`
   * stay the same, only the changed digits morph; otherwise the line is rebuilt without animation
   * (pad with spaces, e.g. `String(count).padStart(3, ' ')`, to keep counters morphing).
   */
  set(value: string, options?: SetOptions): Promise<TextResult>;
  /** Stops all morphs and removes the line from the page. */
  destroy(): void;
}

interface Cell {
  svg: SVGSVGElement;
  /** Static characters (`:` `.` `,` `/`) have none. */
  morphingPath: MorphingPath | null;
  character: string;
}

const formatNumber = (value: number): string => String(+value.toFixed(4));

/** Draws `:` `.` `,` or `/` into the cell, matching the set's stroke width and digit positions. */
const drawStaticCharacter = (svg: SVGSVGElement, character: string, iconSet: IconSet): void => {
  const { baselineY, colonDotsY } = iconSet.textLayout;
  const dotRadius = iconSet.strokeWidth * DOT_SIZE;
  const baseDotY = baselineY + iconSet.strokeWidth / 2 - dotRadius; // dot bottom = digit bottom
  const dot = (y: number) => svg.appendChild(createSvgElement('circle', {
    cx: 12, cy: formatNumber(y), r: formatNumber(dotRadius), fill: 'currentColor', stroke: 'none',
  }));
  const line = (fromX: number, fromY: number, toX: number, toY: number) => svg.appendChild(createSvgElement('path', {
    d: `M${formatNumber(fromX)} ${formatNumber(fromY)}L${formatNumber(toX)} ${formatNumber(toY)}`,
  }));
  if (character === ':') colonDotsY.forEach(dot);
  if (character === '.' || character === ',') dot(baseDotY);
  if (character === ',') line(12 + dotRadius * 0.4, baseDotY, 11, baselineY + 2.2);
  if (character === '/') line(9.5, baselineY, 14.5, 24 - baselineY);
};

/** Adds a line of morphing characters (a <span> of <svg> cells) to `element`. */
export const text = (element: Element, options: TextOptions = {}): Text => {
  const { set, value: initialValue = '', size = '1em', cellWidth, spacing, ...defaultMorphOptions } = options;
  const iconSet = resolveIconSet(set);
  const digitCellWidth = cellWidth ?? iconSet.textLayout.cellWidth;
  const cellSpacing = spacing ?? iconSet.textLayout.spacing;
  const inkBottom = iconSet.textLayout.baselineY + iconSet.strokeWidth / 2;
  const line = document.createElement('span');
  line.setAttribute('role', 'img');
  line.style.whiteSpace = 'nowrap';
  element.appendChild(line);
  let cells: Cell[] = [];
  let value = '';

  const isMorphing = (character: string) => hasState(iconSet, character);
  const widthOf = (character: string) => {
    if (isMorphing(character)) return digitCellWidth;
    return character === '/' ? digitCellWidth * 0.7 : digitCellWidth / 2;
  };
  /** CSS length: `units` grid units at the line's size. */
  const scaled = (units: number) => `calc(${size} * ${formatNumber(units / CELL_HEIGHT)})`;

  const createCell = (character: string, index: number): Cell => {
    const width = widthOf(character);
    const svg = createIconSvg(iconSet, `${formatNumber(12 - width / 2)} ${CELL_TOP} ${formatNumber(width)} ${CELL_HEIGHT}`);
    svg.setAttribute('aria-hidden', 'true');
    Object.assign(svg.style, {
      width: scaled(width),
      height: size,
      overflow: 'visible',
      verticalAlign: scaled(inkBottom - CELL_TOP - CELL_HEIGHT), // digit bottom on the text baseline
      marginLeft: index ? `var(--morphico-spacing, ${scaled(cellSpacing)})` : '0',
    });
    let morphingPath: MorphingPath | null = null;
    if (isMorphing(character)) morphingPath = createMorphingPath(svg.appendChild(createSvgElement('path')), iconSet, character);
    else drawStaticCharacter(svg, character, iconSet);
    return { svg, morphingPath, character };
  };

  const rebuild = (characters: string[]): void => {
    for (const cell of cells) cell.morphingPath?.stop();
    cells = characters.map(createCell);
    line.replaceChildren(...cells.map((cell) => cell.svg));
  };

  const show = (nextValue: string, { onEnd, ...morphOptions }: SetOptions = {}): Promise<TextResult> => {
    value = nextValue.replace(UNSUPPORTED_CHARACTERS, '');
    line.setAttribute('aria-label', value.trim());
    const characters = [...value];
    const sameLayout = characters.length === cells.length && characters.every((character, index) =>
      (cells[index].morphingPath ? isMorphing(character) : character === cells[index].character));
    let change: Promise<TextResult>;
    if (sameLayout) {
      const morphs = cells.map((cell, index) =>
        cell.morphingPath?.morphTo(characters[index], { ...defaultMorphOptions, ...morphOptions }));
      const finishedValue = value;
      change = Promise.all(morphs).then((results) =>
        ({ value: finishedValue, interrupted: results.some((result) => result?.interrupted) }));
    } else {
      rebuild(characters);
      change = Promise.resolve({ value, interrupted: false });
    }
    if (onEnd) change.then(onEnd);
    return change;
  };

  show(initialValue);

  return {
    get value() { return value; },
    set: show,
    destroy() {
      for (const cell of cells) cell.morphingPath?.stop();
      line.remove();
    },
  };
};
