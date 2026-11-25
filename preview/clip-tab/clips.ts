// The Clip tab's two clips (an <img> and a <div>: any element can be cut out) and what they show — the options the
// controls and the Code panel show too. to() animates (shapes, presets), to() with duration 0 jumps (sliders).
import { clip } from '../../src/clip/clip.ts';
import type { Clip, ClipChanges, ClipOutline, Length } from '../../src/clip/options.ts';
import type { ClipShape } from '../../src/clip/shapes.ts';
import type { EasingName } from '../../src/morph.ts';
import { loadPicture } from './picture.ts';

export type Unit = '%' | 'px';
export type PlacementKey = 'x' | 'y' | 'size';

export const PLACEMENT_KEYS: PlacementKey[] = ['x', 'y', 'size'];
const FIRST_SHAPE: ClipShape = 'circle';
export const byId = <ElementType extends HTMLElement>(id: string): ElementType => document.getElementById(id) as ElementType;

export const imageStage = byId<HTMLImageElement>('clip-image');
const cardStage = byId<HTMLDivElement>('clip-card');
const shapeButtons = byId<HTMLDivElement>('shape-buttons');
const durationInput = byId<HTMLInputElement>('clip-duration');
const easingSelect = byId<HTMLSelectElement>('clip-easing');
const rotationInput = byId<HTMLInputElement>('rotation');
const rotationOutput = byId<HTMLOutputElement>('rotation-output');
const placementInputs = { x: byId<HTMLInputElement>('place-x'), y: byId<HTMLInputElement>('place-y'), size: byId<HTMLInputElement>('place-size') };
const placementOutputs = { x: byId<HTMLOutputElement>('place-x-output'), y: byId<HTMLOutputElement>('place-y-output'), size: byId<HTMLOutputElement>('place-size-output') };
const unitSwitches = [...document.querySelectorAll<HTMLDivElement>('.units')];
const roundnessOutput = byId<HTMLOutputElement>('clip-roundness-output');
const bandWidthInput = byId<HTMLInputElement>('band-width');
const bandWidthOutput = byId<HTMLOutputElement>('band-width-output');
const codeOutput = byId<HTMLPreElement>('clip-code');
loadPicture(imageStage);

export const elementSize = (): { width: number; height: number } => {
  const { width, height } = imageStage.getBoundingClientRect();
  return { width, height };
};

/** The largest square that fits, in px (what clip() does when `size` is not given). */
export const fittingSize = (): string => `${Math.round(Math.min(elementSize().width, elementSize().height))}px`;

/** What the clips show (or move to), as clip() options — also what the controls and the Code panel show. */
export const shown: { state: ClipShape; x: Length; y: Length; size: Length; rotation: number; roundness: number; outline: false | ClipOutline; inverted: boolean } = {
  state: FIRST_SHAPE, x: 50, y: 50, size: fittingSize(), rotation: 0, roundness: 1, outline: false, inverted: false,
};

const clips: Clip[] = [imageStage, cardStage].map((element) => {
  const { state, ...changes } = shown;
  return clip(element, state, changes);
});

export const unitOf = (length: Length): Unit => (typeof length === 'string' && length.trim().endsWith('px') ? 'px' : '%');
export const valueOf = (length: Length): number => (typeof length === 'number' ? length : Number.parseFloat(length));
/** The element side that 100% means for this key: the width for x and size, the height for y. */
export const referenceFor = (key: PlacementKey): number => (key === 'y' ? elementSize().height : elementSize().width);
const normalizedAngle = (angle: number): number => ((((angle + 180) % 360) + 360) % 360) - 180;

export const markActive = (container: HTMLElement, value: string): void => {
  for (const button of container.querySelectorAll<HTMLButtonElement>('button')) {
    button.classList.toggle('active', button.dataset.value === value);
  }
};

const asCode = (value: unknown): string => {
  if (typeof value === 'string') return `'${value}'`;
  if (value && typeof value === 'object') {
    return `{ ${Object.entries(value).map(([key, inner]) => `${key}: ${asCode(inner)}`).join(', ')} }`;
  }
  return String(value);
};

/** Puts the shown options into the controls and the Code panel. */
export const showControls = (): void => {
  markActive(shapeButtons, shown.state);
  for (const key of PLACEMENT_KEYS) {
    const unit = unitOf(shown[key]);
    const reference = referenceFor(key);
    const [minimum, maximum] = key === 'size'
      ? (unit === '%' ? [5, 200] : [5, Math.round(2 * reference)])
      : (unit === '%' ? [-25, 125] : [Math.round(-0.25 * reference), Math.round(1.25 * reference)]);
    placementInputs[key].min = String(minimum);
    placementInputs[key].max = String(maximum);
    placementInputs[key].value = String(Math.round(valueOf(shown[key])));
    placementOutputs[key].textContent = `${Math.round(valueOf(shown[key]))}${unit}`;
  }
  for (const unitSwitch of unitSwitches) markActive(unitSwitch, unitOf(shown[unitSwitch.dataset.key as PlacementKey]));
  rotationInput.value = String(Math.round(normalizedAngle(shown.rotation)));
  rotationOutput.textContent = `${rotationInput.value}°`;
  roundnessOutput.textContent = shown.roundness === 1 ? 'own' : shown.roundness === 0 ? 'sharp' : shown.roundness.toFixed(2);
  bandWidthOutput.textContent = `${bandWidthInput.value}px`;
  const { state, ...changes } = shown;
  codeOutput.textContent = `clip(element, '${state}', ${asCode(changes)});`;
};
const motion = () => ({ duration: Number(durationInput.value), easing: easingSelect.value as EasingName });

/** Animates every clip to the shown options (with a new shape if `state` is given). */
export const animateTo = async (changes: ClipChanges & { state?: ClipShape }): Promise<void> => {
  Object.assign(shown, changes);
  showControls();
  const { state, ...rest } = changes;
  const results = await Promise.all(clips.map((oneClip) =>
    (state ? oneClip.to(state, { ...rest, ...motion() }) : oneClip.to({ ...rest, ...motion() }))));
  // after a full turn the angle is the same as before: bring it back into −180…180 (no visible change)
  if (!results.some((result) => result.interrupted) && shown.rotation !== normalizedAngle(shown.rotation)) {
    jumpTo({ rotation: normalizedAngle(shown.rotation) });
  }
};

/** Jumps every clip to the shown options (sliders): to() with duration 0. */
export const jumpTo = (changes: ClipChanges & { state?: ClipShape }): void => {
  Object.assign(shown, changes);
  const { state, ...rest } = changes;
  for (const oneClip of clips) void (state ? oneClip.to(state, { ...rest, duration: 0 }) : oneClip.to({ ...rest, duration: 0 }));
  showControls();
};
