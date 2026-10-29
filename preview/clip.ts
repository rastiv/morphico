// Clip tab of the preview page: an element cut out by a morphing shape (Lucide shapes, clip-shapes.ts), an experiment
// for the planned clip() layer.
// Tries both ways a page can cut out an element: `clip-path: url(#id)` with an objectBoundingBox <clipPath>,
// and `mask-image` with an SVG data URL (how the user's cropper app does it). The shape is always square (1:1),
// placed by its centre (x, y) and size in % or px of the element, can be turned (also while morphing) and outlined:
// then only a band along the shape's edge shows. clip-path can't do that (it ignores line width) → the left stage
// switches to `mask: url(#id)` with an SVG <mask>.
import { animate, easings } from '../src/engine.ts';
import { defaultBreakpoints, interpolate, layoutStrokes, toPathData } from '../src/geometry.ts';
import type { PathNumbers } from '../src/types.ts';
import { clipShape, clipShapeNames, lucideOutlines } from './clip-shapes.ts';

const GRID_SIZE = 24;
const GRID_CENTER = 12;
/** Enough for the shape that needs the most (puzzle: 24 strokes, its knobs ≈ 40 segments); the rest spreads by length. */
const SEGMENT_COUNT = 48;
const FIRST_SHAPE = 'circle';

const SHARP_CORNERS = 0;

let roundness = 1;
const shapeCache = new Map<string, PathNumbers>();

/** Path numbers of a shape at the current roundness. */
const shapeNumbers = (name: string): PathNumbers => {
  const key = `${name}@${roundness}`;
  let numbers = shapeCache.get(key);
  if (!numbers) {
    const strokes = clipShape(name, roundness);
    numbers = layoutStrokes(strokes, defaultBreakpoints(strokes, SEGMENT_COUNT));
    shapeCache.set(key, numbers);
  }
  return numbers;
};

// ---- grid → element pixels → objectBoundingBox (0…1) ----

/** A length as clip() will take it: a number = %, or a string `'40%'` / `'120px'`. */
type Length = number | string;
type Unit = '%' | 'px';

/**
 * Where the square shape sits, as clip() will take it: x, y = its centre (% of the element's width / height),
 * size = its side (% of the width).
 */
interface Placement {
  x: Length;
  y: Length;
  size: Length;
}

/** A placement in element pixels: what is on screen and what animates. */
interface PixelPlacement {
  centerX: number;
  centerY: number;
  side: number;
}

const unitOf = (length: Length): Unit => (typeof length === 'string' && length.trim().endsWith('px') ? 'px' : '%');

/** `reference` = the element side that 100% means. */
const lengthToPixels = (length: Length, reference: number): number => {
  if (typeof length === 'number') return (length / 100) * reference;
  const value = Number.parseFloat(length);
  const unit = length.trim().replace(/^[-+\d.e]+/, '');
  if (Number.isNaN(value) || (unit !== 'px' && unit !== '%')) {
    throw new Error(`clip: "${length}" is not a length — use a number (= %), '40%' or '120px'`);
  }
  return unit === 'px' ? value : (value / 100) * reference;
};

const placementToPixels = (placement: Placement, elementWidth: number, elementHeight: number): PixelPlacement => ({
  centerX: lengthToPixels(placement.x, elementWidth),
  centerY: lengthToPixels(placement.y, elementHeight),
  side: lengthToPixels(placement.size, elementWidth),
});

/**
 * The shape in element pixels: scaled to its square, turned around the square's centre, moved into place.
 * Turning in pixels keeps the shape rigid; turning 0…1 numbers would skew it in a non-square element.
 */
const toElementPixels = (path: PathNumbers, angle: number, { centerX, centerY, side }: PixelPlacement): PathNumbers => {
  const scale = side / GRID_SIZE;
  const cos = Math.cos((angle * Math.PI) / 180), sin = Math.sin((angle * Math.PI) / 180);
  const result: PathNumbers = [];
  for (let index = 0; index < path.length; index += 2) {
    const offsetX = (path[index] - GRID_CENTER) * scale, offsetY = (path[index + 1] - GRID_CENTER) * scale;
    result.push(centerX + offsetX * cos - offsetY * sin, centerY + offsetX * sin + offsetY * cos);
  }
  return result;
};

const toBoundingBox = (pixels: PathNumbers, elementWidth: number, elementHeight: number): PathNumbers =>
  pixels.map((value, index) => value / (index % 2 ? elementHeight : elementWidth));

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

const clipStage = byId<HTMLDivElement>('clip-stage');
const maskStage = byId<HTMLDivElement>('mask-stage');
const clipPathShape = document.getElementById('clip-shape') as unknown as SVGPathElement;
const maskElement = document.getElementById('morph-mask') as unknown as SVGMaskElement;
const clipCaption = byId<HTMLElement>('clip-caption');
const shapeButtons = byId<HTMLDivElement>('shape-buttons');
const durationInput = byId<HTMLInputElement>('clip-duration');
const durationOutput = byId<HTMLOutputElement>('clip-duration-output');
const easingSelect = byId<HTMLSelectElement>('clip-easing');
const rotationInput = byId<HTMLInputElement>('rotation');
const rotationOutput = byId<HTMLOutputElement>('rotation-output');
const turnCheckbox = byId<HTMLInputElement>('turn-while-morphing');
const turnSelect = byId<HTMLSelectElement>('turn-amount');
const PLACEMENT_KEYS = ['x', 'y', 'size'] as const;
type PlacementKey = (typeof PLACEMENT_KEYS)[number];
const placementInputs = { x: byId<HTMLInputElement>('place-x'), y: byId<HTMLInputElement>('place-y'), size: byId<HTMLInputElement>('place-size') };
const placementOutputs = { x: byId<HTMLOutputElement>('place-x-output'), y: byId<HTMLOutputElement>('place-y-output'), size: byId<HTMLOutputElement>('place-size-output') };
const unitSwitches = [...document.querySelectorAll<HTMLDivElement>('.units')];
const placementPresets = byId<HTMLDivElement>('placement-presets');
const placementCode = byId<HTMLPreElement>('placement-code');
const elementButtons = byId<HTMLDivElement>('element-buttons');
const boxButtons = byId<HTMLDivElement>('box-buttons');
const lookButtons = byId<HTMLDivElement>('look-buttons');
const bandButtons = byId<HTMLDivElement>('band-buttons');
const bandWidthInput = byId<HTMLInputElement>('band-width');
const bandWidthOutput = byId<HTMLOutputElement>('band-width-output');
const roundnessInput = byId<HTMLInputElement>('clip-roundness');
const roundnessOutput = byId<HTMLOutputElement>('clip-roundness-output');
const playButton = byId<HTMLButtonElement>('play-sequence');
const pathOutput = byId<HTMLPreElement>('clip-path-output');

for (const image of document.querySelectorAll<HTMLImageElement>('.clip-target img')) loadPicture(image);

/** What is on screen right now (also mid-animation), in element pixels. */
const current = { shape: shapeNumbers(FIRST_SHAPE), angle: 0, placement: { centerX: 0, centerY: 0, side: 0 } as PixelPlacement };
/** Where the running animation goes (or what is on screen when nothing moves), as clip() would be given it. */
const target: { name: string; angle: number; placement: Placement } = { name: FIRST_SHAPE, angle: 0, placement: { x: 50, y: 50, size: 100 } };
let stopAnimation: (() => void) | null = null;
let sequenceRun = 0;
let outlined = false;
type BandPosition = 'inside' | 'centre' | 'outside';
let bandPosition: BandPosition = 'inside';

/**
 * SVG markup that is white where the element shows: the filled shape, or a band along its edge.
 * Inside = a line twice as wide, clipped to the shape; outside = a line twice as wide with the shape cut out of it.
 */
const maskMarkup = (pathData: string, idPrefix: string): string => {
  if (!outlined) return `<path d="${pathData}" fill="white"/>`;
  const bandWidth = Number(bandWidthInput.value);
  const edgeLine = (lineWidth: number, extraAttributes = '') =>
    `<path d="${pathData}" fill="none" stroke="white" stroke-width="${lineWidth}" stroke-linejoin="miter"${extraAttributes}/>`;
  switch (bandPosition) {
    case 'centre': return edgeLine(bandWidth);
    case 'inside': return `<clipPath id="${idPrefix}-inside"><path d="${pathData}"/></clipPath>`
      + edgeLine(2 * bandWidth, ` clip-path="url(#${idPrefix}-inside)"`);
    // painting black over the inside would only work for luminance masks; mask-image uses alpha → cut it out with a mask
    case 'outside': return `<mask id="${idPrefix}-outside" maskUnits="userSpaceOnUse" x="-100000" y="-100000" width="200000" height="200000">`
      + `<rect x="-100000" y="-100000" width="200000" height="200000" fill="white"/><path d="${pathData}" fill="black"/></mask>`
      + edgeLine(2 * bandWidth, ` mask="url(#${idPrefix}-outside)"`);
  }
};

const normalizedAngle = (angle: number): number => ((((angle + 180) % 360) + 360) % 360) - 180;
const interpolateNumber = (from: number, to: number, progress: number): number => from + (to - from) * progress;

const elementSize = (): { width: number; height: number } => {
  const { width, height } = clipStage.getBoundingClientRect();
  return { width, height };
};

/** The element side that 100% means for this key: the width for x and size, the height for y. */
const referenceFor = (key: PlacementKey): number => (key === 'y' ? elementSize().height : elementSize().width);

const targetInPixels = (): PixelPlacement => {
  const { width, height } = elementSize();
  return placementToPixels(target.placement, width, height);
};

/** A placement written as clip() options, e.g. `{ x: 50, y: 50, size: '120px' }`. */
const placementAsCode = (placement: Placement): string =>
  `{ ${PLACEMENT_KEYS.map((key) => `${key}: ${typeof placement[key] === 'string' ? `'${placement[key]}'` : placement[key]}`).join(', ')} }`;

/** Shows the sliders in each key's unit (the unit of the target's value) with fitting ranges. */
const updateSliderRanges = (): void => {
  for (const key of PLACEMENT_KEYS) {
    const unit = unitOf(target.placement[key]);
    const reference = referenceFor(key);
    const [minimum, maximum] = key === 'size'
      ? (unit === '%' ? [5, 200] : [5, Math.round(2 * reference)])
      : (unit === '%' ? [-25, 125] : [Math.round(-0.25 * reference), Math.round(1.25 * reference)]);
    placementInputs[key].min = String(minimum);
    placementInputs[key].max = String(maximum);
  }
  for (const unitSwitch of unitSwitches) markActive(unitSwitch, unitOf(target.placement[unitSwitch.dataset.key as PlacementKey]));
};

const render = (): void => {
  const { width, height } = elementSize();
  if (!width || !height) return;
  const pixels = toElementPixels(current.shape, current.angle, current.placement);
  const pathData = toPathData(toBoundingBox(pixels, width, height));
  const pixelPathData = toPathData(pixels);
  if (outlined) maskElement.innerHTML = maskMarkup(pixelPathData, 'page-mask');
  else clipPathShape.setAttribute('d', pathData);
  const maskSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`
    + `${maskMarkup(pixelPathData, 'data-mask')}</svg>`;
  const maskUrl = `url("data:image/svg+xml,${encodeURIComponent(maskSvg)}")`;
  maskStage.style.maskImage = maskUrl;
  maskStage.style.setProperty('-webkit-mask-image', maskUrl);

  pathOutput.textContent = pathData;
  rotationInput.value = String(Math.round(normalizedAngle(current.angle)));
  rotationOutput.textContent = `${rotationInput.value}°`;
  const pixelValues = { x: current.placement.centerX, y: current.placement.centerY, size: current.placement.side };
  for (const key of PLACEMENT_KEYS) {
    const unit = unitOf(target.placement[key]);
    const value = unit === 'px' ? pixelValues[key] : (pixelValues[key] / referenceFor(key)) * 100;
    placementInputs[key].value = String(Math.round(value));
    placementOutputs[key].textContent = `${Math.round(value)}${unit}`;
  }
  placementCode.textContent = placementAsCode(target.placement);
};

const markActive = (container: HTMLElement, value: string): void => {
  for (const button of container.querySelectorAll<HTMLButtonElement>('button')) {
    button.classList.toggle('active', button.dataset.value === value);
  }
};

/** Animates from what is on screen (also mid-animation) to `target`; resolves when done or interrupted. */
const animateToTarget = (): Promise<void> => new Promise((resolve) => {
  stopAnimation?.();
  markActive(shapeButtons, target.name);
  const from = { shape: current.shape, angle: current.angle, placement: { ...current.placement } };
  const to = { shape: shapeNumbers(target.name), angle: target.angle, placement: targetInPixels() };
  const duration = Number(durationInput.value);
  const easing = easings[easingSelect.value as keyof typeof easings];
  let startTime: number | null = null;
  const removeFrame = animate((frameTime) => {
    startTime ??= frameTime;
    const progress = Math.min(1, (frameTime - startTime) / duration);
    const easedProgress = easing(progress);
    current.shape = interpolate(from.shape, to.shape, easedProgress);
    current.angle = interpolateNumber(from.angle, to.angle, easedProgress);
    current.placement = {
      centerX: interpolateNumber(from.placement.centerX, to.placement.centerX, easedProgress),
      centerY: interpolateNumber(from.placement.centerY, to.placement.centerY, easedProgress),
      side: interpolateNumber(from.placement.side, to.placement.side, easedProgress),
    };
    render();
    if (progress < 1) return true;
    current.angle = target.angle = normalizedAngle(current.angle);
    stopAnimation = null;
    resolve();
    return false;
  });
  stopAnimation = () => { removeFrame(); resolve(); };
});

const morphTo = (name: string): Promise<void> => {
  if (name !== target.name && turnCheckbox.checked) target.angle += Number(turnSelect.value);
  target.name = name;
  return animateToTarget();
};

const moveTo = (placement: Placement): Promise<void> => {
  target.placement = placement;
  updateSliderRanges();
  return animateToTarget();
};

/** Jumps (no animation) — for sliders being dragged. */
const jumpToTarget = (): void => {
  stopAnimation?.();
  stopAnimation = null;
  current.shape = shapeNumbers(target.name);
  current.angle = target.angle;
  current.placement = targetInPixels();
  render();
};

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

/** A shape button shows the Lucide icon as Lucide draws it. */
const iconButton = (name: string): HTMLButtonElement => {
  const strokes = lucideOutlines[name];
  const icon = document.createElementNS(SVG_NAMESPACE, 'svg');
  icon.setAttribute('viewBox', '0 0 24 24');
  icon.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(SVG_NAMESPACE, 'path');
  path.setAttribute('d', toPathData(layoutStrokes(strokes, defaultBreakpoints(strokes, SEGMENT_COUNT))));
  icon.append(path);
  const button = document.createElement('button');
  button.title = name;
  button.setAttribute('aria-label', name);
  button.dataset.value = name;
  button.append(icon);
  return button;
};

for (const name of clipShapeNames) {
  const button = iconButton(name);
  button.addEventListener('click', () => { sequenceRun++; morphTo(name); });
  shapeButtons.append(button);
}

playButton.addEventListener('click', async () => {
  const run = ++sequenceRun;
  for (const name of clipShapeNames) {
    if (run !== sequenceRun) return;
    if (name === target.name) continue;
    await morphTo(name);
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
});

durationInput.addEventListener('input', () => { durationOutput.textContent = `${durationInput.value} ms`; });
rotationInput.addEventListener('input', () => {
  target.angle = Number(rotationInput.value);
  jumpToTarget();
});
for (const key of PLACEMENT_KEYS) {
  placementInputs[key].addEventListener('input', () => {
    const value = Number(placementInputs[key].value);
    target.placement = { ...target.placement, [key]: unitOf(target.placement[key]) === 'px' ? `${value}px` : value };
    jumpToTarget();
  });
}

/** Switching a unit keeps the shape where it is: the value is converted. */
for (const unitSwitch of unitSwitches) {
  const key = unitSwitch.dataset.key as PlacementKey;
  for (const button of unitSwitch.querySelectorAll<HTMLButtonElement>('button')) {
    button.addEventListener('click', () => {
      const reference = referenceFor(key);
      const pixels = lengthToPixels(target.placement[key], reference);
      target.placement = { ...target.placement, [key]: button.dataset.value === 'px' ? `${Math.round(pixels)}px` : Math.round((pixels / reference) * 100) };
      updateSliderRanges();
      jumpToTarget();
    });
  }
}

/** The largest square that fits, in the middle of the element. */
const centredPlacement = (): Placement => {
  const { width, height } = elementSize();
  return { x: 50, y: 50, size: `${Math.round(Math.min(width, height))}px` };
};

const presets: Record<string, () => Placement> = {
  'middle, fit': centredPlacement,
  'middle, small': () => ({ x: 50, y: 50, size: 30 }),
  'top left': () => ({ x: 27.5, y: 30, size: 35 }),
  'px': () => ({ x: '90px', y: '80px', size: '120px' }),
  'mixed': () => ({ x: 70, y: '150px', size: '100px' }),
  'off the edge': () => ({ x: 95, y: 5, size: 60 }),
};
for (const [name, placement] of Object.entries(presets)) {
  const button = document.createElement('button');
  button.textContent = name;
  button.addEventListener('click', () => moveTo(placement()));
  placementPresets.append(button);
}

for (const button of elementButtons.querySelectorAll<HTMLButtonElement>('button')) {
  button.addEventListener('click', () => {
    const element = button.dataset.value ?? 'img';
    for (const stage of [clipStage, maskStage]) stage.dataset.element = element;
    markActive(elementButtons, element);
  });
}

for (const button of boxButtons.querySelectorAll<HTMLButtonElement>('button')) {
  button.addEventListener('click', () => {
    document.documentElement.style.setProperty('--box-ratio', button.dataset.value ?? '1');
    markActive(boxButtons, button.dataset.value ?? '');
    target.placement = centredPlacement();
    updateSliderRanges();
    jumpToTarget();
  });
}

/** Filled: the left stage uses clip-path. Outlined: clip-path can't show a band, so it uses the SVG <mask>. */
const updateLook = (): void => {
  const pageMask = outlined ? 'url(#morph-mask)' : 'none';
  clipStage.style.clipPath = outlined ? 'none' : 'url(#morph-clip)';
  clipStage.style.mask = pageMask;
  clipStage.style.setProperty('-webkit-mask', pageMask);
  clipCaption.innerHTML = outlined ? '<code>mask: url(#id)</code> — clip-path has no line width' : '<code>clip-path: url(#id)</code>';
  bandWidthOutput.textContent = `${bandWidthInput.value}px`;
  roundnessOutput.textContent = roundness === 1 ? 'own' : roundness === SHARP_CORNERS ? 'sharp' : roundness.toFixed(2);
  render();
};
for (const button of lookButtons.querySelectorAll<HTMLButtonElement>('button')) {
  button.addEventListener('click', () => {
    outlined = button.dataset.value === 'outlined';
    markActive(lookButtons, button.dataset.value ?? '');
    updateLook();
  });
}
for (const button of bandButtons.querySelectorAll<HTMLButtonElement>('button')) {
  button.addEventListener('click', () => {
    bandPosition = button.dataset.value as BandPosition;
    markActive(bandButtons, bandPosition);
    updateLook();
  });
}
bandWidthInput.addEventListener('input', updateLook);
roundnessInput.addEventListener('input', () => {
  roundness = Number(roundnessInput.value);
  jumpToTarget();
  updateLook();
});

// % values follow the element's size, px values stay; a running animation picks up the new size at its next start.
// The tab starts hidden (size 0): the first real size places the shape in the middle.
let placedYet = false;
new ResizeObserver(() => {
  if (!elementSize().width) return;
  if (!placedYet) {
    placedYet = true;
    target.placement = centredPlacement();
  }
  if (!stopAnimation) current.placement = targetInPixels();
  updateSliderRanges();
  render();
}).observe(clipStage);
markActive(shapeButtons, target.name);
updateSliderRanges();
updateLook();
