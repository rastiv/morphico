// Clip tab of the preview page: the library's clip() on two elements, an <img> and a <div> (any element can be cut
// out). The shape buttons show the Lucide icons the shapes come from; the controls call to() (animated: shapes,
// presets) or set() (jump: sliders), and the Code panel shows the matching clip() options.
import { clip } from '../src/clip.ts';
import type { Clip, ClipChanges, ClipOutline, Length } from '../src/clip.ts';
import type { EasingName } from '../src/morph.ts';
import { defaultBreakpoints, layoutStrokes, toPathData } from '../src/geometry.ts';
import { lucideShapeOutlines } from '../src/sets/shapes.ts';

type Unit = '%' | 'px';
type PlacementKey = 'x' | 'y' | 'size';
type Band = NonNullable<ClipOutline['band']>;

const PLACEMENT_KEYS: PlacementKey[] = ['x', 'y', 'size'];
const SHAPE_NAMES = Object.keys(lucideShapeOutlines);
const FIRST_SHAPE = 'circle';
const BUTTON_SEGMENTS = 48;
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

// ---- the picture: a photo if preview/photo.jpg exists (git-ignored), else a generated landscape ----

const generatedPicture = `data:image/svg+xml,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b3a8c"/><stop offset="0.6" stop-color="#e0708a"/><stop offset="1" stop-color="#ffc977"/></linearGradient>
    <linearGradient id="lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a5fa8"/><stop offset="1" stop-color="#1c2150"/></linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#sky)"/>
  <circle cx="285" cy="150" r="42" fill="#fff1c4"/>
  <polygon points="0,205 70,110 130,170 200,80 270,175 330,120 400,190 400,215 0,215" fill="#3b2d6b"/>
  <polygon points="0,215 50,170 110,205 170,150 240,210 310,165 400,215" fill="#24194d"/>
  <rect y="215" width="400" height="85" fill="url(#lake)"/>
  <rect x="245" y="225" width="80" height="4" rx="2" fill="#fff1c4" opacity="0.6"/>
  <rect x="262" y="238" width="46" height="3" rx="1.5" fill="#fff1c4" opacity="0.4"/>
  <polygon points="30,300 55,215 80,300" fill="#120c2c"/>
  <polygon points="70,300 100,190 130,300" fill="#120c2c"/>
  <polygon points="350,300 372,225 394,300" fill="#120c2c"/>
</svg>`)}`;

const loadPicture = (image: HTMLImageElement): void => {
  image.addEventListener('error', () => { image.src = generatedPicture; }, { once: true });
  image.src = 'preview/photo.jpg';
};

// ---- page ----

const byId = <ElementType extends HTMLElement>(id: string): ElementType => document.getElementById(id) as ElementType;

const imageStage = byId<HTMLImageElement>('clip-image');
const cardStage = byId<HTMLDivElement>('clip-card');
const shapeButtons = byId<HTMLDivElement>('shape-buttons');
const durationInput = byId<HTMLInputElement>('clip-duration');
const durationOutput = byId<HTMLOutputElement>('clip-duration-output');
const easingSelect = byId<HTMLSelectElement>('clip-easing');
const rotationInput = byId<HTMLInputElement>('rotation');
const rotationOutput = byId<HTMLOutputElement>('rotation-output');
const turnCheckbox = byId<HTMLInputElement>('turn-while-morphing');
const turnSelect = byId<HTMLSelectElement>('turn-amount');
const placementInputs = { x: byId<HTMLInputElement>('place-x'), y: byId<HTMLInputElement>('place-y'), size: byId<HTMLInputElement>('place-size') };
const placementOutputs = { x: byId<HTMLOutputElement>('place-x-output'), y: byId<HTMLOutputElement>('place-y-output'), size: byId<HTMLOutputElement>('place-size-output') };
const unitSwitches = [...document.querySelectorAll<HTMLDivElement>('.units')];
const placementPresets = byId<HTMLDivElement>('placement-presets');
const boxButtons = byId<HTMLDivElement>('box-buttons');
const lookButtons = byId<HTMLDivElement>('look-buttons');
const bandButtons = byId<HTMLDivElement>('band-buttons');
const bandWidthInput = byId<HTMLInputElement>('band-width');
const bandWidthOutput = byId<HTMLOutputElement>('band-width-output');
const roundnessInput = byId<HTMLInputElement>('clip-roundness');
const roundnessOutput = byId<HTMLOutputElement>('clip-roundness-output');
const playButton = byId<HTMLButtonElement>('play-sequence');
const codeOutput = byId<HTMLPreElement>('clip-code');

loadPicture(imageStage);

const elementSize = (): { width: number; height: number } => {
  const { width, height } = imageStage.getBoundingClientRect();
  return { width, height };
};

/** The largest square that fits, in px (what clip() does when `size` is not given). */
const fittingSize = (): string => `${Math.round(Math.min(elementSize().width, elementSize().height))}px`;

/** What the clips show (or move to), as clip() options — also what the controls and the Code panel show. */
const shown: { state: string; x: Length; y: Length; size: Length; rotation: number; roundness: number; outline: false | ClipOutline } = {
  state: FIRST_SHAPE, x: 50, y: 50, size: fittingSize(), rotation: 0, roundness: 1, outline: false,
};

const clips: Clip[] = [imageStage, cardStage].map((element) => clip(element, shown));
let sequenceRun = 0;

const unitOf = (length: Length): Unit => (typeof length === 'string' && length.trim().endsWith('px') ? 'px' : '%');
const valueOf = (length: Length): number => (typeof length === 'number' ? length : Number.parseFloat(length));
/** The element side that 100% means for this key: the width for x and size, the height for y. */
const referenceFor = (key: PlacementKey): number => (key === 'y' ? elementSize().height : elementSize().width);
const normalizedAngle = (angle: number): number => ((((angle + 180) % 360) + 360) % 360) - 180;

const markActive = (container: HTMLElement, value: string): void => {
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
const showControls = (): void => {
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
  codeOutput.textContent = `clip(element, ${asCode({ state, ...changes })});`;
};

const motion = () => ({ duration: Number(durationInput.value), easing: easingSelect.value as EasingName });

/** Animates every clip to the shown options (with a new shape if `state` is given). */
const animateTo = async (changes: ClipChanges & { state?: string }): Promise<void> => {
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

/** Jumps every clip to the shown options (sliders). */
const jumpTo = (changes: ClipChanges & { state?: string }): void => {
  Object.assign(shown, changes);
  for (const oneClip of clips) oneClip.set(changes);
  showControls();
};

// ---- shapes ----

/** A shape button shows the Lucide icon as Lucide draws it. */
const iconButton = (name: string): HTMLButtonElement => {
  const strokes = lucideShapeOutlines[name];
  const icon = document.createElementNS(SVG_NAMESPACE, 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NAMESPACE, 'path');
  path.setAttribute('d', toPathData(layoutStrokes(strokes, defaultBreakpoints(strokes, BUTTON_SEGMENTS))));
  icon.append(path);
  const button = document.createElement('button');
  button.title = name;
  button.setAttribute('aria-label', name);
  button.dataset.value = name;
  button.append(icon);
  return button;
};

const morphTo = (name: string): Promise<void> => {
  const turn = name !== shown.state && turnCheckbox.checked ? Number(turnSelect.value) : 0;
  return animateTo({ state: name, rotation: shown.rotation + turn });
};

for (const name of SHAPE_NAMES) {
  const button = iconButton(name);
  button.addEventListener('click', () => { sequenceRun++; morphTo(name); });
  shapeButtons.append(button);
}

playButton.addEventListener('click', async () => {
  const run = ++sequenceRun;
  for (const name of SHAPE_NAMES) {
    if (run !== sequenceRun) return;
    if (name === shown.state) continue;
    await morphTo(name);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
});

// ---- motion, rotation, position ----

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

// ---- look ----

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

// the tab starts hidden (size 0): once the elements have a size, fit the shape and show the controls
let fittedYet = false;
new ResizeObserver(() => {
  if (!elementSize().width) return;
  if (!fittedYet) {
    fittedYet = true;
    jumpTo({ size: fittingSize() });
  }
  showControls();
}).observe(imageStage);
showControls();
