// The SVG `d` attribute of a shape.
import { splitPieces, toSegments } from './path-numbers.ts';
import type { CubicSegment, PathNumbers } from '../types.ts';

const formatNumber = (value: number): string => String(+value.toFixed(3));

/** A piece whose end lands on its start is closed (`Z`): its first corner then gets the line join, not two line ends. */
const isClosedPiece = (piece: PathNumbers): boolean =>
  Math.hypot(piece[piece.length - 2] - piece[0], piece[piece.length - 1] - piece[1]) < 1e-6;

const hasLength = ([start, control1, control2, end]: CubicSegment): boolean =>
  [control1, control2, end].some((point) => Math.hypot(point[0] - start[0], point[1] - start[1]) > 1e-6);

/**
 * The segments of a piece as written to SVG. A closed piece starts at its first segment with length: a zero-length
 * first segment (a corner of radius 0) has no direction, so browsers would draw the closing corner wrongly.
 * Only the written order changes, not the picture.
 */
const writtenSegments = (piece: PathNumbers): CubicSegment[] => {
  const segments = toSegments(piece);
  if (!isClosedPiece(piece)) return segments;
  const firstWithLength = Math.max(0, segments.findIndex(hasLength));
  return [...segments.slice(firstWithLength), ...segments.slice(0, firstWithLength)];
};

/** A piece shrunk to a single point: not drawn at all (round line ends would show it as a dot). */
const isPoint = (piece: PathNumbers): boolean =>
  piece.every((value, index) => Math.abs(value - piece[index % 2]) < 1e-6);

/**
 * SVG `d` attribute: per piece `M x y` followed by one `C` per segment (`pieceLength`: see pieceLengthOf).
 * Pieces shrunk to a single point are left out.
 */
export const toPathData = (path: PathNumbers, pieceLength = path.length): string =>
  splitPieces(path, pieceLength).filter((piece) => !isPoint(piece)).map((piece) => {
    const segments = writtenSegments(piece);
    const [startX, startY] = segments[0][0];
    return `M${formatNumber(startX)} ${formatNumber(startY)}` + segments
      .map(([, control1, control2, end]) => `C${[...control1, ...control2, ...end].map(formatNumber).join(' ')}`)
      .join('') + (isClosedPiece(piece) ? 'Z' : '');
  }).join('');
