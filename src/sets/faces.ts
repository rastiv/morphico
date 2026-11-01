// The expressions of face(): 7 soft filled pieces — 2 brows, 2 eyes, 2 pupils (shown only inside the eyes) and a mouth — drawn
// by eye from the user's robot-face pictures (faces/*.png, not shipped), frontal and mirrored left ↔ right.
// Every piece is a smooth closed curve through OUTLINE_POINTS points that start at the top and run clockwise
// (index 0 top, a quarter of them = right, half = bottom, three quarters = left), so any two expressions morph point by point.
// Box: 24×24 (the pictures' disc fills it; the face draws no disc).
import type { Point } from '../types.ts';

export const OUTLINE_POINTS = 24;
export const PIECE_NAMES = ['leftBrow', 'rightBrow', 'leftEye', 'rightEye', 'leftPupil', 'rightPupil', 'mouth'] as const;
type PieceName = typeof PIECE_NAMES[number];
/** One expression: the outline points of every piece. */
export type FacePieces = Record<PieceName, Point[]>;

const DENSE_SAMPLES = 360;
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

const rotatePoint = ([x, y]: Point, degrees: number): Point => {
  const angle = toRadians(degrees);
  return [x * Math.cos(angle) - y * Math.sin(angle), x * Math.sin(angle) + y * Math.cos(angle)];
};

// ---- blobs: ellipses that can be squarer, egg-shaped, turned and cut by a straight lid ----

interface BlobOptions {
  centre: Point;
  width: number;
  height: number;
  /** Degrees, clockwise (positive = the right end goes down). */
  rotation?: number;
  /** 0 = ellipse … 1 = almost a rounded rectangle. */
  squareness?: number;
  /** Width at the top compared with the bottom: below 1 = an egg with its narrow end up. */
  topScale?: number;
  /** A straight line cutting the top off (eyelid, the flat top of a "D" mouth): its y at the shape's left and right edge. */
  cutTop?: [left: number, right: number];
  /** The same for the bottom (the flat bottom of a dome brow). */
  cutBottom?: [left: number, right: number];
}

const denseBlobOutline = (options: BlobOptions): Point[] => {
  const { centre, width, height, rotation = 0, squareness = 0, topScale = 1 } = options;
  const exponent = 2 + squareness * 6;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const outline: Point[] = [];
  for (let index = 0; index < DENSE_SAMPLES; index++) {
    const angle = toRadians(-90 + (360 * index) / DENSE_SAMPLES);
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    const y = halfHeight * Math.sign(sine) * Math.abs(sine) ** (2 / exponent);
    const widthScale = 1 + ((topScale - 1) * (halfHeight - y)) / (2 * halfHeight);
    const x = halfWidth * widthScale * Math.sign(cosine) * Math.abs(cosine) ** (2 / exponent);
    const [turnedX, turnedY] = rotatePoint([x, y], rotation);
    outline.push([centre[0] + turnedX, centre[1] + turnedY]);
  }
  const xs = outline.map(([x]) => x);
  const left = Math.min(...xs);
  const right = Math.max(...xs);
  const lineY = ([leftY, rightY]: [number, number], x: number): number => leftY + ((rightY - leftY) * (x - left)) / (right - left);
  return outline.map(([x, y]): Point => {
    let cutY = y;
    if (options.cutTop) cutY = Math.max(cutY, lineY(options.cutTop, x));
    if (options.cutBottom) cutY = Math.min(cutY, lineY(options.cutBottom, x));
    return [x, cutY];
  });
};

/** OUTLINE_POINTS points of a star-shaped outline, on rays at even angles from its box's centre (measured in the box
 * stretched to a square, so a long flat shape still gets points on its round ends). */
const resampleByAngle = (outline: Point[]): Point[] => {
  const xs = outline.map(([x]) => x);
  const ys = outline.map(([, y]) => y);
  const centreX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const centreY = (Math.min(...ys) + Math.max(...ys)) / 2;
  const halfX = Math.max((Math.max(...xs) - Math.min(...xs)) / 2, 1e-9);
  const halfY = Math.max((Math.max(...ys) - Math.min(...ys)) / 2, 1e-9);
  const normalized = outline.map(([x, y]): Point => [(x - centreX) / halfX, (y - centreY) / halfY]);
  const points: Point[] = [];
  for (let index = 0; index < OUTLINE_POINTS; index++) {
    const angle = toRadians(-90 + (360 * index) / OUTLINE_POINTS);
    const directionX = Math.cos(angle);
    const directionY = Math.sin(angle);
    let farthest = 0;
    normalized.forEach((start, edgeIndex) => {
      const end = normalized[(edgeIndex + 1) % normalized.length];
      const edgeX = end[0] - start[0];
      const edgeY = end[1] - start[1];
      const denominator = directionX * edgeY - directionY * edgeX;
      if (Math.abs(denominator) < 1e-12) return;
      const distance = (start[0] * edgeY - start[1] * edgeX) / denominator;
      const along = (start[0] * directionY - start[1] * directionX) / denominator;
      // a little slack: a ray passing exactly through a corner of the dense outline must still hit one of its edges
      if (along >= -1e-9 && along <= 1 + 1e-9 && distance > farthest) farthest = distance;
    });
    points.push([centreX + directionX * farthest * halfX, centreY + directionY * farthest * halfY]);
  }
  return points;
};

const blob = (options: BlobOptions): Point[] => resampleByAngle(denseBlobOutline(options));

// ---- bands: a thick curved stroke with round ends (arched brows, a smile, closed eyes) ----

interface BandOptions {
  from: Point;
  to: Point;
  /** How far the middle bows out: positive = up (∩, an arched brow), negative = down (∪, a smile). */
  bend: number;
  thickness: number;
  /** Thickness at the ends as a share of the middle's (1 = even). */
  endShare?: number;
}

const band = (options: BandOptions): Point[] => {
  const { from, to, bend, thickness, endShare = 1 } = options;
  const chordX = to[0] - from[0];
  const chordY = to[1] - from[1];
  const chordLength = Math.hypot(chordX, chordY);
  // the quadratic's control point sits twice as far out as the curve's middle
  const control: Point = [
    (from[0] + to[0]) / 2 + ((2 * bend * chordY) / chordLength),
    (from[1] + to[1]) / 2 - ((2 * bend * chordX) / chordLength),
  ];
  const pointAt = (along: number): Point => {
    const rest = 1 - along;
    return [
      rest * rest * from[0] + 2 * rest * along * control[0] + along * along * to[0],
      rest * rest * from[1] + 2 * rest * along * control[1] + along * along * to[1],
    ];
  };
  const tangentAt = (along: number): Point => {
    const tangentX = 2 * (1 - along) * (control[0] - from[0]) + 2 * along * (to[0] - control[0]);
    const tangentY = 2 * (1 - along) * (control[1] - from[1]) + 2 * along * (to[1] - control[1]);
    const length = Math.hypot(tangentX, tangentY);
    return [tangentX / length, tangentY / length];
  };
  const thicknessAt = (along: number): number => thickness * (endShare + (1 - endShare) * Math.sin(Math.PI * along));
  // side 1 = the upper edge (the left normal of a rightward curve), -1 = the lower edge
  const edge = (along: number, side: 1 | -1): Point => {
    const [x, y] = pointAt(along);
    const [tangentX, tangentY] = tangentAt(along);
    const offset = (side * thicknessAt(along)) / 2;
    return [x + tangentY * offset, y - tangentX * offset];
  };
  // a point on the half circle around an end: turn -90° = on the upper edge, 0 = the tip, 90° = on the lower edge
  const capPoint = (along: 0 | 1, turn: number): Point => {
    const [x, y] = pointAt(along);
    const [tangentX, tangentY] = tangentAt(along);
    const radius = thicknessAt(along) / 2;
    const outward = along === 1 ? 1 : -1;
    const alongTangent = outward * Math.cos(turn) * radius;
    const towardsLower = outward * Math.sin(turn) * radius;
    return [x + tangentX * alongTangent - tangentY * towardsLower, y + tangentY * alongTangent + tangentX * towardsLower];
  };
  // clockwise from the top middle at the same angles as a blob's points (a quarter = the right end, half = the bottom
  // middle, three quarters = the left end); the points within 30° of an end lie on its half circle, the rest along the
  // edges
  const capShare = Math.sin(Math.PI / 3);
  return Array.from({ length: OUTLINE_POINTS }, (_, index): Point => {
    const angle = (2 * Math.PI * index) / OUTLINE_POINTS;
    const sine = Math.sin(angle);
    if (Math.abs(sine) < capShare - 1e-9) return edge(0.5 + (0.5 * sine) / capShare, Math.cos(angle) > 0 ? 1 : -1);
    // the angle's distance past the cap's start, stretched from ±30° around the end to ±90° around the half circle
    const endAngle = sine > 0 ? Math.PI / 2 : (3 * Math.PI) / 2;
    return capPoint(sine > 0 ? 1 : 0, (angle - endAngle) * 3);
  });
};

/** A piece that isn't there: every point on one spot (draws nothing). */
const hidden = (at: Point): Point[] => Array.from({ length: OUTLINE_POINTS }, (): Point => [at[0], at[1]]);

/** The piece mirrored onto the other half of the face, still clockwise from the top. */
const mirrored = (points: Point[]): Point[] =>
  points.map((_, index): Point => {
    const [x, y] = points[(OUTLINE_POINTS - index) % OUTLINE_POINTS];
    return [24 - x, y];
  });

interface HalfFace {
  brow: Point[];
  eye: Point[];
  pupil: Point[];
  mouth: Point[];
}

/** A face from its left half (as seen) + the mouth. */
const symmetricFace = ({ brow, eye, pupil, mouth }: HalfFace): FacePieces => ({
  leftBrow: brow,
  rightBrow: mirrored(brow),
  leftEye: eye,
  rightEye: mirrored(eye),
  leftPupil: pupil,
  rightPupil: mirrored(pupil),
  mouth,
});

/** The whole face mirrored: left and right pieces swap sides. */
const mirroredFace = (face: FacePieces): FacePieces => ({
  leftBrow: mirrored(face.rightBrow),
  rightBrow: mirrored(face.leftBrow),
  leftEye: mirrored(face.rightEye),
  rightEye: mirrored(face.leftEye),
  leftPupil: mirrored(face.rightPupil),
  rightPupil: mirrored(face.leftPupil),
  mouth: mirrored(face.mouth),
});

// ---- the expressions (names from the user's pictures) ----

export const faceExpressionNames = [
  'normal',
  'smiling',
  'pleading',
  'wonder',
  'focused',
  'fright',
  'angry',
  'asleep',
  'sad',
  'surprised',
  'laughing',
  'tired',
  'wink-left',
  'wink-right',
  'suspicious',
  'confused',
  'smug',
  'irritated',
  'bored',
  'curious',
  'empathetic',
  'guilty',
  'worried',
  'disappointed',
  'ashamed',
  'embarrassed',
  'yearning',
  'triumphant',
  'proud',
  'excited',
  'scornful',
  'disgusted',
] as const;
export type FaceExpression = typeof faceExpressionNames[number];

const buildFaceExpressions = (): Record<FaceExpression, FacePieces> => {
  const winkRight: FacePieces = {
    ...symmetricFace({
      brow: blob({ centre: [6.2, 4.4], width: 5.2, height: 1.9, squareness: 0.5, rotation: -6 }),
      eye: blob({ centre: [6.4, 12], width: 8.4, height: 8.4 }),
      pupil: blob({ centre: [7, 11.4], width: 3.2, height: 3.2 }),
      mouth: band({ from: [9.6, 18.4], to: [14.8, 18], bend: -0.9, thickness: 1.2, endShare: 0.7 }),
    }),
    rightBrow: mirrored(blob({ centre: [6.2, 6], width: 5, height: 1.8, squareness: 0.5, rotation: 8 })),
    rightEye: mirrored(band({ from: [3.2, 12.8], to: [9.6, 12.8], bend: 1.4, thickness: 1.6, endShare: 0.7 })),
    rightPupil: hidden([17.6, 12]),
  };

  return {
    normal: symmetricFace({
      brow: blob({ centre: [6.2, 4.6], width: 5.2, height: 1.9, squareness: 0.5, rotation: -6 }),
      eye: blob({ centre: [6.4, 12], width: 8.4, height: 8.4 }),
      pupil: blob({ centre: [7, 10.7], width: 3.2, height: 3.2 }),
      mouth: blob({ centre: [12, 18.8], width: 4.4, height: 1.8, squareness: 0.6 }),
    }),
    smiling: symmetricFace({
      brow: blob({ centre: [6, 5.4], width: 5, height: 4.4, squareness: 0.2, cutBottom: [5.4, 5.4] }),
      eye: blob({ centre: [6, 13], width: 9.2, height: 7.6 }),
      pupil: blob({ centre: [6.8, 13.6], width: 3.6, height: 2.4 }),
      mouth: band({ from: [9, 18.4], to: [15, 18.4], bend: -1, thickness: 1.3, endShare: 0.7 }),
    }),
    pleading: symmetricFace({
      brow: blob({ centre: [6.6, 3.7], width: 4.6, height: 2, squareness: 0.5, rotation: -16 }),
      eye: blob({ centre: [6.8, 12.4], width: 8.6, height: 9.6, topScale: 0.75, rotation: 12 }),
      pupil: blob({ centre: [7.6, 10.7], width: 4, height: 4 }),
      mouth: blob({ centre: [12, 17.6], width: 4.3, height: 4.8, squareness: 0.3, cutTop: [17.6, 17.6] }),
    }),
    wonder: symmetricFace({
      brow: band({ from: [3.4, 4.8], to: [8.6, 3.3], bend: 0.7, thickness: 1.7 }),
      eye: blob({ centre: [6.4, 12], width: 7.8, height: 9.6 }),
      pupil: blob({ centre: [6.8, 11.2], width: 3.2, height: 4.2 }),
      mouth: blob({ centre: [12, 18.6], width: 3.8, height: 1, squareness: 0.6 }),
    }),
    focused: symmetricFace({
      brow: blob({ centre: [6, 4.4], width: 5.6, height: 2.2, squareness: 0.55, rotation: 3 }),
      eye: blob({ centre: [6.2, 12.8], width: 9, height: 8, cutTop: [10, 11] }),
      pupil: blob({ centre: [6.8, 13.2], width: 3.8, height: 2.8 }),
      mouth: blob({ centre: [12, 18.8], width: 4.2, height: 1, squareness: 0.6 }),
    }),
    fright: symmetricFace({
      brow: blob({ centre: [5.7, 3.5], width: 4.8, height: 2.2, squareness: 0.45, rotation: -8 }),
      eye: blob({ centre: [6.2, 12.4], width: 8.4, height: 9.8, topScale: 0.7, rotation: 8 }),
      pupil: blob({ centre: [7.2, 12], width: 3.6, height: 4.2 }),
      mouth: blob({ centre: [12, 18.6], width: 3.8, height: 1.4, squareness: 0.5 }),
    }),
    angry: symmetricFace({
      brow: blob({ centre: [6.4, 5.4], width: 5.2, height: 2, squareness: 0.5, rotation: 12 }),
      eye: blob({ centre: [6.2, 12.6], width: 8.6, height: 8, cutTop: [9.2, 12] }),
      pupil: blob({ centre: [7.4, 12.8], width: 3.4, height: 3.4 }),
      mouth: blob({ centre: [12, 17.8], width: 4.2, height: 4, squareness: 0.3, cutTop: [17.8, 17.8] }),
    }),
    asleep: symmetricFace({
      brow: blob({ centre: [6, 5.4], width: 4, height: 1.7, squareness: 0.4, rotation: 4 }),
      eye: band({ from: [3, 12.4], to: [9.6, 12.4], bend: -1.2, thickness: 1.5, endShare: 0.6 }),
      pupil: hidden([6.3, 13.4]),
      mouth: blob({ centre: [12, 18.8], width: 2.6, height: 1.8 }),
    }),
    // more feelings, Claude's drafts (no pictures); the one-sided ones replace pieces of the right half — written in place
    // (a blob or band is already clockwise from its top) or drawn on the left and mirrored
    sad: symmetricFace({
      brow: blob({ centre: [6.4, 5.2], width: 4.8, height: 1.9, squareness: 0.5, rotation: -18 }),
      eye: blob({ centre: [6.4, 12.6], width: 8.4, height: 8, cutTop: [11.2, 9.6] }),
      pupil: blob({ centre: [6.8, 13.8], width: 3.2, height: 3.4 }),
      mouth: band({ from: [9.4, 19.2], to: [14.6, 19.2], bend: 0.9, thickness: 1.2, endShare: 0.7 }),
    }),
    surprised: symmetricFace({
      brow: band({ from: [3.6, 3.6], to: [8.6, 2.8], bend: 0.6, thickness: 1.6 }),
      eye: blob({ centre: [6.4, 12], width: 8.6, height: 9 }),
      pupil: blob({ centre: [6.4, 12], width: 2.4, height: 2.4 }),
      mouth: blob({ centre: [12, 19], width: 2.8, height: 3.4 }),
    }),
    laughing: symmetricFace({
      brow: blob({ centre: [6, 4.6], width: 5, height: 4.4, squareness: 0.2, cutBottom: [4.6, 4.6] }),
      eye: band({ from: [3.2, 13], to: [9.6, 13], bend: 1.6, thickness: 1.6, endShare: 0.7 }),
      pupil: hidden([6.4, 12]),
      mouth: blob({ centre: [12, 17], width: 6, height: 6, squareness: 0.2, cutTop: [17, 17] }),
    }),
    tired: symmetricFace({
      brow: blob({ centre: [6, 6], width: 5, height: 1.7, squareness: 0.5, rotation: -4 }),
      eye: blob({ centre: [6.4, 12.6], width: 8.4, height: 7.6, cutTop: [11.6, 11.6] }),
      pupil: blob({ centre: [6.6, 13.6], width: 3.2, height: 3.2 }),
      mouth: blob({ centre: [12, 19], width: 3.2, height: 0.9, squareness: 0.6 }),
    }),
    // wink-left / wink-right = the eye that closes, as seen; one is the other mirrored
    'wink-left': mirroredFace(winkRight),
    'wink-right': winkRight,
    suspicious: {
      ...symmetricFace({
        brow: band({ from: [3.4, 4], to: [8.8, 3], bend: 0.8, thickness: 1.6 }),
        eye: blob({ centre: [6.4, 12.6], width: 8.6, height: 7.6, cutTop: [10.8, 10.8] }),
        pupil: blob({ centre: [4.6, 13.2], width: 3.2, height: 3 }),
        mouth: blob({ centre: [12.6, 18.8], width: 3.6, height: 1, squareness: 0.6, rotation: -10 }),
      }),
      rightBrow: mirrored(blob({ centre: [6.4, 6.4], width: 5.2, height: 1.8, squareness: 0.5, rotation: 10 })),
      rightEye: mirrored(blob({ centre: [6.4, 12.8], width: 8.6, height: 7.2, cutTop: [11.8, 11.8] })),
      rightPupil: blob({ centre: [16.2, 13.4], width: 3.2, height: 3 }),
    },
    confused: {
      ...symmetricFace({
        brow: band({ from: [3.4, 3.8], to: [8.6, 2.6], bend: 0.7, thickness: 1.6 }),
        eye: blob({ centre: [6.4, 12], width: 8.6, height: 9 }),
        pupil: blob({ centre: [7.6, 10.6], width: 3, height: 3 }),
        mouth: blob({ centre: [12.4, 19], width: 3.8, height: 1.1, squareness: 0.5, rotation: 12 }),
      }),
      rightBrow: mirrored(blob({ centre: [6.2, 5.8], width: 5, height: 1.8, squareness: 0.5, rotation: 10 })),
      rightEye: mirrored(blob({ centre: [6.4, 12.6], width: 7.4, height: 7.4 })),
      rightPupil: blob({ centre: [18.4, 11.4], width: 2.8, height: 2.8 }),
    },
    // the user's list of feelings (2026-11-01), Claude's drafts; the ones the set had already are skipped
    smug: {
      ...symmetricFace({
        brow: blob({ centre: [6.2, 5], width: 5, height: 1.8, squareness: 0.5, rotation: -4 }),
        eye: blob({ centre: [6.4, 12.6], width: 8.4, height: 7.6, cutTop: [11.4, 11.4] }),
        pupil: blob({ centre: [8, 13.4], width: 3, height: 3 }),
        mouth: band({ from: [10.2, 18.8], to: [15.2, 17.6], bend: -0.6, thickness: 1.2, endShare: 0.6 }),
      }),
      rightBrow: mirrored(band({ from: [3.6, 4.2], to: [8.6, 3.4], bend: 0.6, thickness: 1.6 })),
      rightPupil: blob({ centre: [19.4, 13.4], width: 3, height: 3 }),
    },
    irritated: symmetricFace({
      brow: blob({ centre: [6.4, 5.8], width: 5.4, height: 1.8, squareness: 0.55, rotation: 6 }),
      eye: blob({ centre: [6.4, 12.8], width: 8.6, height: 7.6, cutTop: [11.2, 11.8], cutBottom: [15.8, 15.8] }),
      pupil: blob({ centre: [6.8, 13.6], width: 3.2, height: 3 }),
      mouth: blob({ centre: [12.4, 18.8], width: 3.6, height: 0.9, squareness: 0.6, rotation: -8 }),
    }),
    bored: {
      ...symmetricFace({
        brow: blob({ centre: [6, 6.2], width: 5, height: 1.7, squareness: 0.5 }),
        eye: blob({ centre: [6.4, 12.6], width: 8.4, height: 7.6, cutTop: [11.8, 11.8] }),
        pupil: blob({ centre: [8, 12.8], width: 3, height: 3 }),
        mouth: blob({ centre: [13.4, 19], width: 3, height: 0.9, squareness: 0.6 }),
      }),
      rightPupil: blob({ centre: [19.4, 12.8], width: 3, height: 3 }),
    },
    curious: {
      ...symmetricFace({
        brow: band({ from: [3.4, 3.6], to: [8.6, 2.6], bend: 0.7, thickness: 1.6 }),
        eye: blob({ centre: [6.4, 12], width: 8.6, height: 8.8 }),
        pupil: blob({ centre: [7.8, 10.8], width: 3.2, height: 3.2 }),
        mouth: blob({ centre: [12.6, 18.8], width: 2, height: 2.2 }),
      }),
      rightBrow: mirrored(blob({ centre: [6.2, 5.2], width: 5, height: 1.8, squareness: 0.5, rotation: 4 })),
      rightPupil: blob({ centre: [19, 10.8], width: 3.2, height: 3.2 }),
    },
    empathetic: symmetricFace({
      brow: blob({ centre: [6.4, 4.8], width: 5, height: 1.9, squareness: 0.5, rotation: -10 }),
      eye: blob({ centre: [6.4, 12.4], width: 8.4, height: 8, cutTop: [10, 9.2] }),
      pupil: blob({ centre: [6.8, 13], width: 3.4, height: 3.4 }),
      mouth: band({ from: [10, 18.6], to: [14, 18.6], bend: -0.5, thickness: 1.1, endShare: 0.7 }),
    }),
    guilty: {
      ...symmetricFace({
        brow: blob({ centre: [6.4, 5], width: 4.6, height: 1.8, squareness: 0.5, rotation: -14 }),
        eye: blob({ centre: [6.4, 12.6], width: 8.2, height: 8, cutTop: [10.6, 10.2] }),
        pupil: blob({ centre: [5, 14.4], width: 3, height: 3 }),
        mouth: blob({ centre: [11.4, 19], width: 2.8, height: 0.9, squareness: 0.6, rotation: 6 }),
      }),
      rightPupil: blob({ centre: [16.2, 14.4], width: 3, height: 3 }),
    },
    worried: symmetricFace({
      brow: blob({ centre: [6.6, 4.2], width: 4.8, height: 1.9, squareness: 0.5, rotation: -20 }),
      eye: blob({ centre: [6.4, 12.2], width: 8, height: 8.8, topScale: 0.85, rotation: 6 }),
      pupil: blob({ centre: [6.8, 12.4], width: 2.6, height: 2.8 }),
      mouth: band({ from: [10.2, 19], to: [13.8, 19], bend: 0.6, thickness: 1.1, endShare: 0.7 }),
    }),
    disappointed: symmetricFace({
      brow: blob({ centre: [6.2, 5.6], width: 5, height: 1.8, squareness: 0.5, rotation: -8 }),
      eye: blob({ centre: [6.4, 12.8], width: 8.4, height: 7.6, cutTop: [11.8, 11] }),
      pupil: blob({ centre: [6.6, 14.4], width: 3, height: 3 }),
      mouth: band({ from: [9.6, 19.2], to: [14.4, 19.2], bend: 0.4, thickness: 1.1, endShare: 0.8 }),
    }),
    ashamed: symmetricFace({
      brow: blob({ centre: [6.4, 5.6], width: 4.6, height: 1.8, squareness: 0.5, rotation: -16 }),
      eye: blob({ centre: [6.4, 13], width: 8.2, height: 7.6, cutTop: [12.2, 12.2] }),
      pupil: blob({ centre: [6.4, 15], width: 3, height: 2.6 }),
      mouth: blob({ centre: [12, 19.4], width: 2.4, height: 0.9, squareness: 0.6 }),
    }),
    embarrassed: {
      ...symmetricFace({
        brow: blob({ centre: [6.2, 4.8], width: 4.8, height: 1.8, squareness: 0.5, rotation: -12 }),
        eye: blob({ centre: [6.4, 12.4], width: 8.2, height: 8.2 }),
        pupil: blob({ centre: [4.4, 13.6], width: 3, height: 3 }),
        mouth: band({ from: [9.8, 18.8], to: [14.2, 18.6], bend: -0.5, thickness: 1.1, endShare: 0.7 }),
      }),
      rightPupil: blob({ centre: [15.8, 13.6], width: 3, height: 3 }),
    },
    yearning: symmetricFace({
      brow: blob({ centre: [6.2, 4], width: 4.8, height: 1.8, squareness: 0.5, rotation: -10 }),
      eye: blob({ centre: [6.4, 12.6], width: 8.6, height: 8, cutTop: [11, 11] }),
      pupil: blob({ centre: [6.8, 13.6], width: 4.2, height: 4.2 }),
      mouth: blob({ centre: [12, 18.8], width: 2.6, height: 1.6 }),
    }),
    triumphant: symmetricFace({
      brow: blob({ centre: [6.2, 4], width: 5.2, height: 2, squareness: 0.5, rotation: 8 }),
      eye: blob({ centre: [6.4, 11.8], width: 8.6, height: 8.6, cutBottom: [14, 14] }),
      pupil: blob({ centre: [6.8, 11.6], width: 3.4, height: 3.4 }),
      mouth: blob({ centre: [12, 16.8], width: 7, height: 6.4, squareness: 0.3, cutTop: [16.8, 16.8] }),
    }),
    proud: symmetricFace({
      brow: blob({ centre: [6.2, 3.8], width: 5, height: 1.9, squareness: 0.5, rotation: -4 }),
      eye: blob({ centre: [6.4, 12.4], width: 8.6, height: 8, cutTop: [11, 11] }),
      pupil: blob({ centre: [6.6, 13.6], width: 3.2, height: 3 }),
      mouth: band({ from: [8.8, 18], to: [15.2, 18], bend: -1.2, thickness: 1.3, endShare: 0.7 }),
    }),
    excited: symmetricFace({
      brow: band({ from: [3.4, 3.6], to: [8.6, 2.8], bend: 0.8, thickness: 1.6 }),
      eye: blob({ centre: [6.4, 12], width: 9, height: 9.2 }),
      pupil: blob({ centre: [7, 11], width: 4, height: 4 }),
      mouth: blob({ centre: [12, 16.8], width: 6, height: 6, squareness: 0.2, cutTop: [16.8, 16.8] }),
    }),
    scornful: {
      ...symmetricFace({
        brow: blob({ centre: [6.2, 5.4], width: 5, height: 1.8, squareness: 0.5, rotation: 2 }),
        eye: blob({ centre: [6.4, 12.6], width: 8.4, height: 7.6, cutTop: [11.4, 11.4] }),
        pupil: blob({ centre: [5.4, 14], width: 3, height: 3 }),
        mouth: band({ from: [9.2, 18.8], to: [14.6, 18], bend: -0.2, thickness: 1.1, endShare: 0.7 }),
      }),
      rightBrow: mirrored(band({ from: [3.6, 4], to: [8.6, 3.2], bend: 0.6, thickness: 1.6 })),
      rightPupil: blob({ centre: [16.6, 14], width: 3, height: 3 }),
    },
    disgusted: symmetricFace({
      brow: blob({ centre: [6.6, 6], width: 5, height: 1.8, squareness: 0.5, rotation: 14 }),
      eye: blob({ centre: [6.4, 12.6], width: 8.4, height: 7.6, cutTop: [11.4, 12.2], cutBottom: [14.8, 14.8] }),
      pupil: blob({ centre: [6.8, 13.2], width: 3, height: 2.8 }),
      // an upside-down "D": open, corners pulled down
      mouth: blob({ centre: [12, 19.6], width: 5, height: 4.8, squareness: 0.2, cutBottom: [19.6, 19.6] }),
    }),
  };
};

let builtExpressions: Record<FaceExpression, FacePieces> | null = null;
/** Every expression's pieces, built on first use (nothing runs at import). */
export const faceExpressionPieces = (): Record<FaceExpression, FacePieces> => (builtExpressions ??= buildFaceExpressions());

// ---- morphing and drawing ----

const interpolatePoints = (from: Point[], to: Point[], progress: number): Point[] =>
  from.map(([fromX, fromY], index): Point => [fromX + (to[index][0] - fromX) * progress, fromY + (to[index][1] - fromY) * progress]);

export const interpolateFace = (from: FacePieces, to: FacePieces, progress: number): FacePieces =>
  Object.fromEntries(PIECE_NAMES.map((name) => [name, interpolatePoints(from[name], to[name], progress)])) as FacePieces;

const boxCentre = (points: Point[]): Point => {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
};

/** The face with its eyes partly closed: openness 1 = as drawn, 0 = shut to a flat slit (pupils gone). */
export const blinked = (face: FacePieces, openness: number): FacePieces => {
  if (openness >= 1) return face;
  const eyeScale = 0.25 + 0.75 * openness;
  const squash = (points: Point[], middleY: number): Point[] => points.map(([x, y]): Point => [x, middleY + (y - middleY) * eyeScale]);
  const shrink = (points: Point[], [centreX, centreY]: Point): Point[] =>
    points.map(([x, y]): Point => [centreX + (x - centreX) * openness, centreY + (y - centreY) * openness]);
  const leftMiddle = boxCentre(face.leftEye)[1];
  const rightMiddle = boxCentre(face.rightEye)[1];
  return {
    ...face,
    leftEye: squash(face.leftEye, leftMiddle),
    rightEye: squash(face.rightEye, rightMiddle),
    leftPupil: squash(shrink(face.leftPupil, boxCentre(face.leftPupil)), leftMiddle),
    rightPupil: squash(shrink(face.rightPupil, boxCentre(face.rightPupil)), rightMiddle),
  };
};

const formatNumber = (value: number): string => String(Math.round(value * 1000) / 1000);

/** A smooth closed curve through the points: each handle points along the neighbours' chord and is a third of its own
 * segment long (no loops where points sit close together, as at a band's round end). Empty for a hidden piece. */
export const smoothClosedPath = (points: Point[]): string => {
  const [firstX, firstY] = points[0];
  if (points.every(([x, y]) => Math.abs(x - firstX) < 1e-6 && Math.abs(y - firstY) < 1e-6)) return '';
  const count = points.length;
  const directionAt = (index: number): Point => {
    const previous = points[(index - 1 + count) % count];
    const next = points[(index + 1) % count];
    const length = Math.hypot(next[0] - previous[0], next[1] - previous[1]) || 1;
    return [(next[0] - previous[0]) / length, (next[1] - previous[1]) / length];
  };
  let path = `M${formatNumber(firstX)} ${formatNumber(firstY)}`;
  for (let index = 0; index < count; index++) {
    const start = points[index];
    const end = points[(index + 1) % count];
    const handleLength = Math.hypot(end[0] - start[0], end[1] - start[1]) / 3;
    const startDirection = directionAt(index);
    const endDirection = directionAt(index + 1);
    const control1: Point = [start[0] + startDirection[0] * handleLength, start[1] + startDirection[1] * handleLength];
    const control2: Point = [end[0] - endDirection[0] * handleLength, end[1] - endDirection[1] * handleLength];
    path += `C${[...control1, ...control2, ...end].map(formatNumber).join(' ')}`;
  }
  return `${path}Z`;
};

export interface FacePaths {
  /** Brows, eyes and mouth (one colour). */
  features: string;
  /** Both eyes, to clip the pupils with. */
  eyes: string;
  pupils: string;
}

export const facePaths = (face: FacePieces): FacePaths => ({
  features: [face.leftBrow, face.rightBrow, face.leftEye, face.rightEye, face.mouth].map(smoothClosedPath).join(''),
  eyes: [face.leftEye, face.rightEye].map(smoothClosedPath).join(''),
  pupils: [face.leftPupil, face.rightPupil].map(smoothClosedPath).join(''),
});
