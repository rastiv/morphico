// The Clip tab's Look panel: filled or outlined (band inside / centre / outside, its width), roundness, inverted.
import type { ClipChanges, ClipOutline } from '../../src/clip/options.ts';
import { byId, jumpTo, markActive } from './clips.ts';

type Band = NonNullable<ClipOutline['band']>;

const lookButtons = byId<HTMLDivElement>('look-buttons');
const bandButtons = byId<HTMLDivElement>('band-buttons');
const bandWidthInput = byId<HTMLInputElement>('band-width');
const roundnessInput = byId<HTMLInputElement>('clip-roundness');
const invertedCheckbox = byId<HTMLInputElement>('clip-inverted');

let outlined = false;
let band: Band = 'inside';
const outlineChange = (): ClipChanges => ({ outline: outlined ? { width: Number(bandWidthInput.value), band } : false });

for (const button of lookButtons.querySelectorAll<HTMLButtonElement>('button')) {
  button.addEventListener('click', () => {
    outlined = button.dataset.value === 'outlined';
    markActive(lookButtons, button.dataset.value ?? '');
    jumpTo(outlineChange());
  });
}
for (const button of bandButtons.querySelectorAll<HTMLButtonElement>('button')) {
  button.addEventListener('click', () => {
    band = button.dataset.value as Band;
    markActive(bandButtons, band);
    jumpTo(outlineChange());
  });
}
bandWidthInput.addEventListener('input', () => jumpTo(outlineChange()));
roundnessInput.addEventListener('input', () => jumpTo({ roundness: Number(roundnessInput.value) }));
invertedCheckbox.addEventListener('change', () => jumpTo({ inverted: invertedCheckbox.checked }));
