// Icon set "folder": closed, open — Lucide 1.61.0 icons "folder", "folder-open" (ISC, see LICENSE-lucide), imported
// with `node tools/import-lucide.ts folder folder-open`. Coordinates below are Lucide's; lucideLine / lucideArc scale
// them into our icon box (more margin, like the digits — see lucide.ts).
// One piece each. The open folder is one line: the front flap (from its left tip over its top edge, down its right
// edge), the bottom, the left side, the tab, the back panel's top edge and a short bit of its right side.
// closed ↔ open: the closed folder is traced the open folder's way ("folder-like-open", same picture) — starting at
// its top edge, which it runs along twice: the first pass drops and tilts into the flap's top edge, the second stays
// as the back panel's top edge.
import { arc, line, reversedStroke } from '../geometry.ts';
import type { IconSet, Stroke } from '../types.ts';
import { fromLucide, LUCIDE_STROKE_WIDTH, lucideLength } from './lucide.ts';

const lucideLine = (fromX: number, fromY: number, toX: number, toY: number): Stroke =>
  line(...fromLucide([fromX, fromY]), ...fromLucide([toX, toY]));
const lucideArc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number): Stroke =>
  arc(...fromLucide([centerX, centerY]), lucideLength(radius), startAngle, endAngle);

/** Lucide "folder": counter-clockwise from the bottom right corner. */
const FOLDER = [
  lucideArc(20, 18, 2, 90, 0), // bottom right corner
  lucideLine(22, 18, 22, 8), // right side, up
  lucideArc(20, 8, 2, 0, -90), // top right corner
  lucideLine(20, 6, 12.1, 6), // top edge, to the left
  lucideArc(12.0804, 4.0001, 2, 89.4383, 146.6363),
  lucideLine(10.41, 5.1, 9.6, 3.9), // tab slope
  lucideArc(7.9297, 5, 2, -33.367, -89.9906),
  lucideLine(7.93, 3, 4, 3), // tab top
  lucideArc(4, 5, 2, -90, -180), // top left corner
  lucideLine(2, 5, 2, 18), // left side, down
  lucideArc(4, 18, 2, 180, 90), // bottom left corner
  lucideLine(4, 20, 20, 20), // bottom
];

/** Lucide "folder-open": from the flap's left tip. */
const FOLDER_OPEN = [
  lucideLine(6, 14, 7.5, 11.1), // flap's left tip
  lucideArc(9.2863, 11.9995, 2, -153.2735, -91.3273),
  lucideLine(9.24, 10, 20, 10), // flap's top edge
  lucideArc(20.0035, 12, 2, -90.1005, 14.4776),
  lucideLine(21.94, 12.5, 20.4, 18.5), // flap's right edge
  lucideArc(18.4635, 18, 2, 14.4762, 90.3867),
  lucideLine(18.45, 20, 4, 20), // bottom
  lucideArc(4, 18, 2, 90, 180),
  lucideLine(2, 18, 2, 5), // left side, up
  lucideArc(4, 5, 2, 180, 270),
  lucideLine(4, 3, 7.9, 3), // tab top
  lucideArc(7.9196, 4.9999, 2, -90.5617, -33.3637),
  lucideLine(9.59, 3.9, 10.4, 5.1), // tab slope
  lucideArc(12.0703, 4, 2, 146.633, 90.0094),
  lucideLine(12.07, 6, 18, 6), // back panel's top edge
  lucideArc(18, 8, 2, -90, 0),
  lucideLine(20, 8, 20, 10), // back panel's right side, down to the flap
];

const [bottomRight, rightSide, topRight, topEdge, tabArc1, tabSlope, tabArc2, tabTop, topLeft, leftSide, bottomLeft, bottom] =
  FOLDER.map(reversedStroke); // clockwise, like the open folder

/** The closed folder traced like the open one: top edge (→ flap), round the outline, top edge again (→ back panel). */
const FOLDER_LIKE_OPEN = [
  topEdge, topRight, rightSide, bottomRight, bottom, bottomLeft, leftSide, topLeft,
  tabTop, tabArc2, tabSlope, tabArc1, topEdge, topRight, lucideLine(22, 8, 22, 10),
];

export const folderIcons: IconSet = {
  segmentCount: 20,
  strokeWidth: LUCIDE_STROKE_WIDTH,
  lineCap: 'round',
  lineJoin: 'round',
  strokes: { closed: FOLDER, open: FOLDER_OPEN },
  alternativeStrokes: { 'folder-like-open': FOLDER_LIKE_OPEN },
  // fitted with tools/check.ts (cost 7838 → 411)
  pairLayouts: {
    closed: {
      open: {
        tracing: 'folder-like-open',
        breakpoints: [0, 0, 0, 1, 2, 2.5208, 3, 4, 4.5625, 5, 6, 6.5, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      },
    },
  },
  spins: {},
};
