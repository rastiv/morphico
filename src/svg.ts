// Creating SVG elements (only called from icon() / text(), never at import).
import type { IconSet } from './types.ts';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

export const createSvgElement = <TagName extends keyof SVGElementTagNameMap>(
  tagName: TagName, attributes: Record<string, string | number> = {},
): SVGElementTagNameMap[TagName] => {
  const element = document.createElementNS(SVG_NAMESPACE, tagName);
  for (const [name, value] of Object.entries(attributes)) element.setAttribute(name, String(value));
  return element;
};

/** An <svg> drawn in the set's stroke style, coloured by the CSS `color` (currentColor). */
export const createIconSvg = (iconSet: IconSet, viewBox: string): SVGSVGElement => createSvgElement('svg', {
  viewBox,
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': iconSet.strokeWidth,
  'stroke-linecap': iconSet.lineCap,
  'stroke-linejoin': iconSet.lineJoin,
});
