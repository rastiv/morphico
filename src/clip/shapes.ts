// Shapes for clip(): closed outlines that cut out an element, from Lucide (ISC, see LICENSE-lucide). The states are
// the outlines made comparable for morphing (outline-normalizing.ts), computed on first use, not at import.
// Roundness 1 = Lucide's own corners … 0 = sharp (corner-roundness.ts).
import type { IconSet, Stroke } from '../types.ts';
import { basicShapeNames, basicShapeOutlines } from './basic-shape-outlines.ts';
import { withCornerRoundness } from './corner-roundness.ts';
import { extraShapeNames, extraShapeOutlines } from './extra-shape-outlines.ts';
import { moreShapeNames, moreShapeOutlines } from './more-shape-outlines.ts';
import { clockwise, fitToBox, startAtTopMiddle } from './outline-normalizing.ts';

/** Enough for the shape that needs the most (puzzle: 24 strokes, its knobs ≈ 40 segments); the rest spreads by length. */
const SEGMENT_COUNT = 48;

/** The names of clip()'s shapes. */
export const clipShapeNames = [...basicShapeNames, ...moreShapeNames, ...extraShapeNames] as const;
export type ClipShape = typeof clipShapeNames[number];

/** The shapes as Lucide draws them (Lucide coordinates); the set's states are made from these. */
export const lucideShapeOutlines: Record<ClipShape, Stroke[]> = { ...basicShapeOutlines, ...moreShapeOutlines, ...extraShapeOutlines };

/** The shape set at a roundness (0 = sharp … 1 = Lucide's own corners); its strokes are built on first use. */
const shapeSetWithRoundness = (roundness: number): IconSet => {
  let strokes: Record<string, Stroke[]> | null = null;
  return {
    get strokes() {
      strokes ??= Object.fromEntries(Object.entries(lucideShapeOutlines).map(([name, outline]) =>
        [name, startAtTopMiddle(clockwise(fitToBox(withCornerRoundness(outline, roundness))))]));
      return strokes;
    },
    alternativeStrokes: {},
    pairLayouts: {},
    spins: {},
    segmentCount: SEGMENT_COUNT,
    // shapes are filled (clip), not stroked; these only matter for the outlined band's corners
    strokeWidth: 0,
    lineCap: 'butt',
    lineJoin: 'miter',
    withRoundness: shapeSetWithRoundness,
  };
};

/** The shape set of clip(): states `circle`, `ellipse`, `heart` … `puzzle` (see `lucideShapeOutlines`). */
export const clipShapes: IconSet = shapeSetWithRoundness(1);
