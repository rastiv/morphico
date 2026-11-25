// Where a clip's shape is: lengths (% or px) turned into element pixels, and the shape's 24×24 path numbers scaled to
// its square, turned around the square's centre and moved into place.
import type { Length } from './options.ts';
import type { PathNumbers } from '../types.ts';

const GRID_SIZE = 24;
const GRID_CENTER = 12;
const DEGREE = Math.PI / 180;
/** Default size: this share of the element's shorter side (a square that fits, with room around it). */
const DEFAULT_SIZE_SHARE = 0.7;

/** Where the shape is in element pixels: what is drawn and what animates. */
export interface PixelPlacement {
  centerX: number;
  centerY: number;
  side: number;
}

/** What is drawn: a frame of a change, or the resting shape. */
export interface Frame {
  shape: PathNumbers;
  rotation: number;
  placement: PixelPlacement;
}

/** A length in px; `reference` is what 100 % is. Throws (naming the option) for anything that isn't a length. */
export const lengthToPixels = (length: Length, reference: number, name: string): number => {
  if (typeof length === 'number' && Number.isFinite(length)) return (length / 100) * reference;
  const match = typeof length === 'string' ? /^\s*(-?[\d.]+(?:e[-+]?\d+)?)\s*(px|%)\s*$/i.exec(length) : null;
  if (!match) throw new Error(`morphico: ${name} "${length}" is not a length — use a number (= %), '40%' or '120px'`);
  const value = Number(match[1]);
  return match[2] === 'px' ? value : (value / 100) * reference;
};

/** The placement options in pixels of an element `width` × `height` (size: the default when not given). */
export const placementInPixels = (
  { x, y, size }: { x: Length; y: Length; size?: Length }, width: number, height: number,
): PixelPlacement => ({
  centerX: lengthToPixels(x, width, 'x'),
  centerY: lengthToPixels(y, height, 'y'),
  side: size === undefined ? DEFAULT_SIZE_SHARE * Math.min(width, height) : lengthToPixels(size, width, 'size'),
});

/** The shape in element pixels: scaled to its square, turned around the square's centre, moved into place. */
export const toElementPixels = ({ shape, rotation: angle, placement: { centerX, centerY, side } }: Frame): PathNumbers => {
  const scale = side / GRID_SIZE;
  const cos = Math.cos(angle * DEGREE), sin = Math.sin(angle * DEGREE);
  const pixels: PathNumbers = [];
  for (let index = 0; index < shape.length; index += 2) {
    const offsetX = (shape[index] - GRID_CENTER) * scale, offsetY = (shape[index + 1] - GRID_CENTER) * scale;
    pixels.push(centerX + offsetX * cos - offsetY * sin, centerY + offsetX * sin + offsetY * cos);
  }
  return pixels;
};
