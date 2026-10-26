// Creating SVG elements (only called from icon() / text(), never at import).
import type { IconSet } from './types.ts';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/** How the lines are drawn. Every option defaults to the set's own look. */
export interface StyleOptions {
  /**
   * Line width. A number is in grid units (an icon is 24 × 24; Lucide-based sets use 16/18 · 2 ≈ 1.78) and scales with the icon;
   * a CSS length (`'2px'`, `'0.1rem'`, `'0.08em'`) stays that wide whatever the icon's size.
   */
  strokeWidth?: number | string;
  /** Line ends: `'round'`, `'butt'` (flat, ends exactly at the line's end) or `'square'` (flat, half a width longer). */
  lineCap?: IconSet['lineCap'];
  /** Corners where lines meet: `'round'`, `'miter'` (sharp) or `'bevel'` (cut off). */
  lineJoin?: IconSet['lineJoin'];
  /** `true` fills closed shapes with the CSS `color` too; a CSS color fills them with that color. */
  fill?: boolean | string;
}

/** A CSS length as stroke width: drawn at that width on screen instead of scaling with the icon. */
export const hasFixedStrokeWidth = (style: StyleOptions): style is StyleOptions & { strokeWidth: string } =>
  typeof style.strokeWidth === 'string';

export const createSvgElement = <TagName extends keyof SVGElementTagNameMap>(
  tagName: TagName, attributes: Record<string, string | number> = {},
): SVGElementTagNameMap[TagName] => {
  const element = document.createElementNS(SVG_NAMESPACE, tagName);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
  return element;
};

/** An <svg> drawn in the set's stroke style (or the given style), colored by the CSS `color` (currentColor). */
export const createIconSvg = (iconSet: IconSet, viewBox: string, style: StyleOptions = {}): SVGSVGElement => {
  const svg = createSvgElement('svg', {
    viewBox,
    fill: style.fill === true ? 'currentColor' : style.fill || 'none',
    stroke: 'currentColor',
    'stroke-linecap': style.lineCap ?? iconSet.lineCap,
    'stroke-linejoin': style.lineJoin ?? iconSet.lineJoin,
  });
  // a CSS length goes into the style (attributes can't hold rem / em / calc reliably); children inherit it
  if (hasFixedStrokeWidth(style)) svg.style.strokeWidth = style.strokeWidth;
  else svg.setAttribute('stroke-width', String(style.strokeWidth ?? iconSet.strokeWidth));
  return svg;
};

/** A stroked child element (path, circle); with a fixed (CSS length) stroke width its line doesn't scale. */
export const createStrokedElement = <TagName extends 'path' | 'circle'>(
  tagName: TagName, style: StyleOptions, attributes: Record<string, string | number> = {},
): SVGElementTagNameMap[TagName] => createSvgElement(tagName, {
  ...attributes,
  ...(hasFixedStrokeWidth(style) && { 'vector-effect': 'non-scaling-stroke' }),
});
