// Shared types. Coordinates live in the 24×24 icon grid; y points down.

/** A point `[x, y]`. */
export type Point = [x: number, y: number];

/** One cubic Bézier segment. */
export type CubicSegment = [start: Point, control1: Point, control2: Point, end: Point];

/**
 * Path data as a flat list of numbers: the start point (x, y), then 6 numbers per cubic segment
 * (control1, control2, end). Within an icon set every shape has the same segment count,
 * so any two shapes interpolate number by number.
 */
export type PathNumbers = number[];

export interface LineStroke {
  kind: 'line';
  from: Point;
  to: Point;
}

/** Angles in degrees. Because y points down, `endAngle > startAngle` draws clockwise on screen. */
export interface ArcStroke {
  kind: 'arc';
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
}

export interface CubicStroke {
  kind: 'cubic';
  segment: CubicSegment;
}

/** One piece of a drawing: a straight line, a circular arc or a free cubic curve. */
export type Stroke = LineStroke | ArcStroke | CubicStroke;

/**
 * How to lay out a shape for one morph pair. Every option keeps the picture the same and only changes
 * which part of it each segment draws, so segments pair up better with the other shape.
 */
export interface PairLayout {
  /** Closed loops: start drawing at this segment instead of segment 0. */
  startSegment?: number;
  /** Draw in the opposite direction. */
  reversed?: boolean;
  /**
   * `segmentCount + 1` positions along the strokes where segments start/end.
   * Integer part = stroke index, fraction = position within that stroke.
   * Two equal neighbours make a zero-length segment that "grows" during the morph.
   * Rules: a segment never spans two strokes; an arc segment covers at most 90°.
   */
  breakpoints?: number[];
  /** Lay out the breakpoints along `alternativeStrokes[tracing]` instead of the state's own strokes. */
  tracing?: string;
  /** Rotate by this many degrees around the icon center (only for shapes that look the same turned). */
  rotation?: number;
}

export interface IconSet {
  /** Cubic segments per shape. The state that needs the most segments decides it. */
  segmentCount: number;
  strokeWidth: number;
  /** SVG `stroke-linecap`: flat (`butt`) or rounded line ends. */
  lineCap: 'butt' | 'round' | 'square';
  /** SVG `stroke-linejoin`: sharp (`miter`) or rounded corners. */
  lineJoin: 'miter' | 'round' | 'bevel';
  /** The strokes of each state, as one continuous line in drawing order. */
  strokes: Record<string, Stroke[]>;
  /** Alternative tracings: the same picture (with round joins) drawn in a different order. */
  alternativeStrokes: Record<string, Stroke[]>;
  /** `pairLayouts[state][otherState]`: how to lay out `state` when morphing to or from `otherState`. */
  pairLayouts: Record<string, Record<string, PairLayout>>;
  /** `spins[fromState][toState]`: degrees to rotate around the icon center while morphing. */
  spins: Record<string, Record<string, number>>;
}
