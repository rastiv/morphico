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
  /**
   * For states drawn as one straight line (`-`, `/`, a dot): lay the line out as the other state pressed flat onto
   * it (every point keeps its position along the line), so the morph flattens the other shape onto the line.
   * The other side keeps its own layout for this pair. Overrides every option above.
   */
  flatten?: boolean;
  /**
   * The piece is not there in this state: during the morph the other state's piece is drawn along its own path,
   * like a pen writing it (erased back the same way in reverse). Overrides every option above.
   * A number (0…1) is the share of the morph the drawing takes: erasing happens at its start, drawing in at its end.
   * `[start, end]` (0…1): drawing in happens between these points of the morph (e.g. to stagger several pieces);
   * erasing runs the same in reverse (between `1 - end` and `1 - start`).
   */
  draw?: boolean | number | [start: number, end: number];
  /**
   * Like `draw`, but the piece is revealed behind a vertical edge moving across the icon box (x 2…22) in this
   * direction instead of along its path (hidden the same way in reverse). Every wiped piece of a morph uses the same
   * edge, so a cloud can cover a sun as it moves in. Timing from `draw` if given (else the whole morph).
   * The piece's visible part must be one stretch of its path: lay it out to start where the edge reaches it last.
   */
  wipe?: 'left' | 'right';
  /**
   * With `wipe`: the piece moves in with the edge instead of standing still — it slides in from just outside the
   * box's side (x 2 or 22; the part outside the box is not shown), its leading side riding at the edge, so it covers
   * what the edge wipes away (a cloud crawling over the sun). Other sliding pieces of the morph move along with the
   * first one (rain with its cloud).
   */
  slide?: boolean;
}

/** How a set's characters sit in the narrow cells of `text()`. Numbers are in grid units (digits are 16 high). */
export interface TextLayout {
  /** Default width of a digit cell. */
  cellWidth: number;
  /** Default gap between two cells. */
  spacing: number;
  /** y of the line the digits stand on (stroke centre); `.` and `,` sit there and `/` spans to `24 - baselineY`. */
  baselineY: number;
  /** y of the two dots of `:` (the centres of the 8's loops). */
  colonDotsY: [top: number, bottom: number];
}

/** One piece of every state: a continuous line per state, plus the tuning of its morphs. */
export interface PieceSet {
  /** The strokes of each state, as one continuous line in drawing order. */
  strokes: Record<string, Stroke[]>;
  /** Alternative tracings: the same picture (with round joins) drawn in a different order. */
  alternativeStrokes: Record<string, Stroke[]>;
  /** `pairLayouts[state][otherState]`: how to lay out `state` when morphing to or from `otherState`. */
  pairLayouts: Record<string, Record<string, PairLayout>>;
}

/**
 * A family of states that morph into each other. The set itself is the first piece of every state;
 * `morePieces` adds further pieces for icons drawn in several parts (e.g. pause = two bars).
 */
export interface IconSet extends PieceSet {
  /** Cubic segments per piece. The state that needs the most segments decides it. */
  segmentCount: number;
  strokeWidth: number;
  /** SVG `stroke-linecap`: flat (`butt`) or rounded line ends. */
  lineCap: 'butt' | 'round' | 'square';
  /** SVG `stroke-linejoin`: sharp (`miter`) or rounded corners. */
  lineJoin: 'miter' | 'round' | 'bevel';
  /**
   * Further pieces, drawn together with the first one. Every state needs strokes in every piece:
   * a state made of fewer parts repeats one of them (drawn on top of itself, so it doesn't show).
   */
  morePieces?: PieceSet[];
  /** `spins[fromState][toState]`: degrees to rotate around the icon center while morphing. */
  spins: Record<string, Record<string, number>>;
  /** Only sets that `text()` can use (digits). */
  textLayout?: TextLayout;
  /** Sets built from rounded corners: the same set with every corner radius times `roundness` (0 = sharp, 1 = own). */
  withRoundness?: (roundness: number) => IconSet;
}
