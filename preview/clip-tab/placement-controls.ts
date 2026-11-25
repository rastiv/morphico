// The Clip tab's Motion, Rotation, Element and Position panels: sliders jump, presets animate; switching a unit
// between % and px keeps the shape where it is.
import type { ClipChanges } from '../../src/clip/options.ts';
import { animateTo, byId, fittingSize, jumpTo, markActive, PLACEMENT_KEYS, referenceFor, shown, unitOf, valueOf } from './clips.ts';
import type { PlacementKey } from './clips.ts';

const durationInput = byId<HTMLInputElement>('clip-duration');
const durationOutput = byId<HTMLOutputElement>('clip-duration-output');
const rotationInput = byId<HTMLInputElement>('rotation');
const placementInputs = { x: byId<HTMLInputElement>('place-x'), y: byId<HTMLInputElement>('place-y'), size: byId<HTMLInputElement>('place-size') };
const unitSwitches = [...document.querySelectorAll<HTMLDivElement>('.units')];
const placementPresets = byId<HTMLDivElement>('placement-presets');
const boxButtons = byId<HTMLDivElement>('box-buttons');

durationInput.addEventListener('input', () => { durationOutput.textContent = `${durationInput.value} ms`; });
rotationInput.addEventListener('input', () => jumpTo({ rotation: Number(rotationInput.value) }));

for (const key of PLACEMENT_KEYS) {
  placementInputs[key].addEventListener('input', () => {
    const value = Number(placementInputs[key].value);
    jumpTo({ [key]: unitOf(shown[key]) === 'px' ? `${value}px` : value });
  });
}

/** Switching a unit keeps the shape where it is: the value is converted. */
for (const unitSwitch of unitSwitches) {
  const key = unitSwitch.dataset.key as PlacementKey;
  for (const button of unitSwitch.querySelectorAll<HTMLButtonElement>('button')) {
    button.addEventListener('click', () => {
      const reference = referenceFor(key);
      const length = shown[key];
      const pixels = unitOf(length) === 'px' ? valueOf(length) : (valueOf(length) / 100) * reference;
      jumpTo({ [key]: button.dataset.value === 'px' ? `${Math.round(pixels)}px` : Math.round((pixels / reference) * 100) });
    });
  }
}

const presets: Record<string, () => ClipChanges> = {
  'middle, fit': () => ({ x: 50, y: 50, size: fittingSize() }),
  'middle, small': () => ({ x: 50, y: 50, size: 30 }),
  'top left': () => ({ x: 27.5, y: 30, size: 35 }),
  'px': () => ({ x: '90px', y: '80px', size: '120px' }),
  'mixed': () => ({ x: 70, y: '150px', size: '100px' }),
  'off the edge': () => ({ x: 95, y: 5, size: 60 }),
};
for (const [name, placement] of Object.entries(presets)) {
  const button = document.createElement('button');
  button.textContent = name;
  button.addEventListener('click', () => animateTo(placement()));
  placementPresets.append(button);
}

for (const button of boxButtons.querySelectorAll<HTMLButtonElement>('button')) {
  button.addEventListener('click', () => {
    document.documentElement.style.setProperty('--box-ratio', button.dataset.value ?? '1');
    markActive(boxButtons, button.dataset.value ?? '');
    // the elements resize at once (clip() follows by itself); the preview re-centres the shape for the new proportions
    jumpTo({ x: 50, y: 50, size: fittingSize() });
  });
}
