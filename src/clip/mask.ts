// The hidden <svg> of a clip: a <clipPath> (filled look, objectBoundingBox units) and a <mask> (outlined look: a band
// along the edge, in element pixels — clip-path ignores line width). It also sets the element's clip-path / mask and
// gives the element its own back when removed.
import { toPathData } from '../geometry/path-data.ts';
import { createSvgElement } from '../svg.ts';
import type { PathNumbers } from '../types.ts';
import type { ClipOutline } from './options.ts';

/** Masks and their clip regions reach far past the element, so bands and turned shapes are never cut by them. */
const FAR = 100000;
/** In objectBoundingBox units (1 = the element's width / height): far around the element. */
const INVERTED_SURROUNDING = 'M-1000 -1000H1001V1001H-1000Z';

let clipCount = 0;

export interface ClipMask {
  /** Builds the look: filled or outlined (`outline`), the shape or everything else showing (`inverted`). */
  setLook(outline: false | ClipOutline, inverted: boolean): void;
  /** Draws the shape, given in pixels of the element (`width` × `height`). */
  draw(pixels: PathNumbers, width: number, height: number): void;
  /** Removes the <svg> and gives the element back its own clip-path / mask. */
  remove(): void;
}

/** `pieceLength`: path numbers per piece of the shape set (see pieceLengthOf). */
export const createClipMask = (element: HTMLElement | SVGElement, pieceLength: number): ClipMask => {
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
  let look: { outline: false | ClipOutline; inverted: boolean } = { outline: false, inverted: false };

  const buildBand = (): void => {
    for (const helper of svg.querySelectorAll('.morphico-band-helper')) helper.remove();
    maskElement.replaceChildren();
    bandPaths = [];
    clipShape.setAttribute('clip-rule', look.inverted ? 'evenodd' : 'nonzero');
    if (!look.outline) return;
    const { width, band = 'inside' } = look.outline;
    // inverted: everything shows (white), the band is the hole (black)
    const bandColor = look.inverted ? 'black' : 'white';
    if (look.inverted) {
      maskElement.append(createSvgElement('rect', { x: -FAR, y: -FAR, width: 2 * FAR, height: 2 * FAR, fill: 'white' }));
    }
    const pixelPath = (attributes: Record<string, string | number>) => {
      const path = createSvgElement('path', attributes);
      bandPaths.push(path);
      return path;
    };
    // inside = a line twice as wide, clipped to the shape; outside = a line twice as wide, the shape cut out of it
    const edgeLine = (lineWidth: number) =>
      pixelPath({ fill: 'none', stroke: bandColor, 'stroke-width': lineWidth, 'stroke-linejoin': 'miter' });
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
    const mask = look.outline ? `url(#${id}-band)` : ownMask;
    element.style.clipPath = look.outline ? ownClipPath : `url(#${id}-shape)`;
    element.style.mask = mask;
    element.style.setProperty('-webkit-mask', mask);
  };

  const root = element.getRootNode();
  // inside a shadow root, url(#id) only finds ids of that root
  (root instanceof ShadowRoot ? root : document.body).append(svg);

  return {
    setLook(outline, inverted) {
      look = { outline, inverted };
      buildBand();
      applyStyle();
    },
    draw(pixels, width, height) {
      if (look.outline) {
        const pathData = toPathData(pixels, pieceLength);
        for (const path of bandPaths) path.setAttribute('d', pathData);
      } else {
        // objectBoundingBox: 0…1 of the element's width / height
        const boxUnits = pixels.map((value, index) => value / (index % 2 ? height : width));
        // inverted: a rectangle far around the element with the shape as a hole in it (clip-rule evenodd)
        const surrounding = look.inverted ? INVERTED_SURROUNDING : '';
        clipShape.setAttribute('d', surrounding + toPathData(boxUnits, pieceLength));
      }
    },
    remove() {
      svg.remove();
      element.style.clipPath = ownClipPath;
      element.style.mask = ownMask;
      element.style.setProperty('-webkit-mask', ownMask);
    },
  };
};
