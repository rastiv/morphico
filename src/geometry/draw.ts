// Pieces drawn along their path during a morph (PairLayout.draw, wipe): which pieces, and every frame with them
// drawn in, erased or wiped.
import { piecesOf } from './pairs.ts';
import { trimPiece } from './trim.ts';
import { wipePiece, wipeRange } from './wipe.ts';
import type { IconSet, PairLayout, PathNumbers } from '../types.ts';

/** A piece drawn along its path during a morph: drawn in (it appears) or erased (it goes). */
export interface DrawnPiece {
  pieceIndex: number;
  drawsIn: boolean;
  /** When the drawing in happens: from `start` to `end` of the morph (0…1); erasing runs it in reverse. */
  start: number;
  end: number;
  /** Revealed behind a moving edge instead of along its path (PairLayout.wipe), moving with it (PairLayout.slide). */
  wipe?: 'left' | 'right';
  slide?: boolean;
}

/** The pieces drawn (or erased) along their path when morphing `state` → `otherState` (PairLayout.draw). */
export const drawnPieces = (iconSet: IconSet, state: string, otherState: string): DrawnPiece[] =>
  piecesOf(iconSet).flatMap((pieceSet, pieceIndex): DrawnPiece[] => {
    const windowOf = (draw: NonNullable<PairLayout['draw']>) =>
      (Array.isArray(draw) ? draw : typeof draw === 'number' ? [1 - draw, 1] : [0, 1]);
    // the layout of the state where the piece is absent
    const absentIn = (absentState: string, presentState: string) => {
      const pairLayout = pieceSet.pairLayouts[absentState]?.[presentState];
      return pairLayout?.draw || pairLayout?.wipe ? pairLayout : undefined;
    };
    const drawIn = absentIn(state, otherState);
    const pairLayout = drawIn ?? absentIn(otherState, state);
    if (!pairLayout) return [];
    const [start, end] = windowOf(pairLayout.draw || true);
    return [{ pieceIndex, drawsIn: Boolean(drawIn), start, end, wipe: pairLayout.wipe, slide: pairLayout.slide }];
  });

/**
 * A frame of a morph `from` → `to` at `progress` with the drawn pieces replaced: drawn in from the start along
 * `to`'s piece, or erased back along `from`'s piece.
 */
export const withDrawnPieces = (
  frame: PathNumbers, from: PathNumbers, to: PathNumbers, progress: number, pieceLength: number, drawn: DrawnPiece[],
): PathNumbers => {
  if (!drawn.length) return frame;
  const presentPiece = ({ pieceIndex, drawsIn }: DrawnPiece) =>
    (drawsIn ? to : from).slice(pieceIndex * pieceLength, (pieceIndex + 1) * pieceLength);
  // one edge for every wipe of the morph, riding at the front of the (first) sliding piece
  const slider = drawn.find((piece) => piece.slide && piece.wipe);
  const edgeRange = wipeRange(slider ? presentPiece(slider) : null, slider?.wipe ?? 'right');
  const result = frame.slice();
  for (const drawnPiece of drawn) {
    const { pieceIndex, drawsIn, start, end, wipe, slide } = drawnPiece;
    const present = presentPiece(drawnPiece);
    // erasing is drawing in played backwards
    const fraction = ((drawsIn ? progress : 1 - progress) - start) / (end - start);
    result.splice(pieceIndex * pieceLength, pieceLength,
      ...(wipe ? wipePiece(present, fraction, wipe, edgeRange, slide) : trimPiece(present, fraction)));
  }
  return result;
};
