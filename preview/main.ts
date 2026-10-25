// Preview page (dev only, not published). Served as JavaScript by tools/serve.ts.
import { animate, easings } from '../src/engine.ts';
import { defaultShapes, interpolate, rotateAroundCenter, shapeForPair, toPathData, toSegments } from '../src/geometry.ts';
import digitsV1 from '../src/sets/v1.ts';
import digitsV2 from '../src/sets/v2.ts';
import digitsV3 from '../src/sets/v3.ts';
import type { IconSet, PathNumbers } from '../src/types.ts';

type EasingName = keyof typeof easings;

const ICON_SETS: Record<string, IconSet> = { v1: digitsV1, v2: digitsV2, v3: digitsV3 };
const DIGITS = [...'0123456789'];
const REFERENCE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];
const PRESET_COLORS = ['#e8e8ea', '#7aa2ff', '#69db7c', '#ffd43b', '#ffa94d', '#ff6b6b', '#f783ac', '#9775fa'];
const AUTO_PLAY_PAUSE = 700; // ms between two auto-play morphs

const elementById = <ElementType extends Element = HTMLElement>(id: string): ElementType => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`#${id} is missing in index.html`);
  return element as unknown as ElementType;
};
const morphPath = elementById<SVGPathElement>('morph-path');
const debugLayer = elementById<SVGGElement>('debug-layer');
const gridLayer = elementById<SVGGElement>('grid-layer');
const referenceImage = elementById<SVGImageElement>('reference-image');
const setButtons = elementById('set-buttons');
const digitButtons = elementById('digit-buttons');
const durationInput = elementById<HTMLInputElement>('duration');
const durationOutput = elementById<HTMLOutputElement>('duration-output');
const easingSelect = elementById<HTMLSelectElement>('easing');
const progressInput = elementById<HTMLInputElement>('progress');
const progressOutput = elementById<HTMLOutputElement>('progress-output');
const colorSwatches = elementById('color-swatches');
const colorInput = elementById<HTMLInputElement>('color');
const colorOutput = elementById<HTMLOutputElement>('color-output');
const referenceOpacityInput = elementById<HTMLInputElement>('reference-opacity');
const referenceOutput = elementById<HTMLOutputElement>('reference-output');
const autoPlayToggle = elementById<HTMLInputElement>('auto-play');
const gridToggle = elementById<HTMLInputElement>('show-grid');
const debugToggle = elementById<HTMLInputElement>('show-debug');
const pathOutput = elementById<HTMLPreElement>('path-output');

// localStorage can be unavailable (private mode, blocked storage): settings are then simply not remembered
const settings = {
  read: (key: string): string | null => {
    try { return localStorage.getItem(`morphico.${key}`); } catch { return null; }
  },
  write: (key: string, value: string): void => {
    try { localStorage.setItem(`morphico.${key}`, value); } catch { /* not remembered */ }
  },
};

let iconSetName = 'v1';
let iconSet = ICON_SETS[iconSetName];
let shapes: Record<string, PathNumbers> = {};
let morphFrom: PathNumbers | null = null;
let morphTo: PathNumbers | null = null;
let spinAngle = 0;
let currentPath: PathNumbers | null = null;
let targetDigit = '0';
let settled = true; // false while a morph runs (or was stopped half-way by the progress slider)
let stopAnimation: (() => void) | null = null;
let autoPlayTimer = 0;

const stopRunningAnimation = (): void => {
  stopAnimation?.();
  stopAnimation = null;
};

/** Blends towards the target in the start's frame while turning that frame by spinAngle · progress. */
const blend = (from: PathNumbers, to: PathNumbers, progress: number): PathNumbers => (spinAngle
  ? rotateAroundCenter(interpolate(from, rotateAroundCenter(to, -spinAngle), progress), spinAngle * progress)
  : interpolate(from, to, progress));

function render(path: PathNumbers | null): void {
  currentPath = path;
  if (!path) {
    morphPath.removeAttribute('d');
    debugLayer.replaceChildren();
    pathOutput.textContent = `${iconSetName} / ${targetDigit}: not drawn yet — reference image: icons/${iconSetName}/${targetDigit}.png`;
    return;
  }
  const pathData = toPathData(path);
  morphPath.setAttribute('d', pathData);
  pathOutput.textContent = pathData;
  if (debugToggle.checked) renderDebug(path);
}

/** Every segment in its own color, with control handles; the white dot marks the start point. */
function renderDebug(path: PathNumbers): void {
  const segments = toSegments(path);
  debugLayer.innerHTML = segments.map(([start, control1, control2, end], segmentIndex) => {
    const color = `hsl(${(segmentIndex * 360) / segments.length} 85% 65%)`;
    return `<path d="M${start} C${control1} ${control2} ${end}" stroke="${color}" stroke-width="0.6"/>`
      + `<path d="M${start} L${control1} M${end} L${control2}" stroke="${color}" stroke-width="0.06" opacity="0.7"/>`
      + `<circle cx="${control1[0]}" cy="${control1[1]}" r="0.18" fill="${color}"/>`
      + `<circle cx="${control2[0]}" cy="${control2[1]}" r="0.18" fill="${color}"/>`
      + `<circle cx="${end[0]}" cy="${end[1]}" r="0.28" fill="var(--bg)" stroke="${color}" stroke-width="0.1"/>`;
  }).join('') + `<circle cx="${path[0]}" cy="${path[1]}" r="0.45" fill="#fff"/>`;
}

// 24×24 grid: a thin line every unit, stronger every 4 units, strongest through the center
gridLayer.innerHTML = Array.from({ length: 25 }, (_, position) => {
  const lineWidth = position === 12 ? 0.08 : position % 4 === 0 ? 0.05 : 0.02;
  return `<path d="M${position} 0V24M0 ${position}H24" stroke-width="${lineWidth}"/>`;
}).join('');

// reference image icons/<set>/<digit>.<png|jpg|jpeg|webp>: the first one that exists
const referenceUrls = new Map<string, Promise<string>>();
const imageLoads = (url: string): Promise<boolean> => new Promise((resolve) => {
  const image = new Image();
  image.onload = () => resolve(true);
  image.onerror = () => resolve(false);
  image.src = url;
});
const findReferenceUrl = (setName: string, digit: string): Promise<string> => {
  const key = `${setName}/${digit}`;
  let found = referenceUrls.get(key);
  if (!found) {
    found = (async () => {
      for (const extension of REFERENCE_EXTENSIONS) {
        const url = `icons/${key}.${extension}`;
        if (await imageLoads(url)) return url;
      }
      return '';
    })();
    referenceUrls.set(key, found);
  }
  return found;
};
async function showReference(): Promise<void> {
  const setName = iconSetName, digit = targetDigit;
  const url = await findReferenceUrl(setName, digit);
  if (setName !== iconSetName || digit !== targetDigit) return; // switched meanwhile
  if (url) referenceImage.setAttribute('href', url);
  else referenceImage.removeAttribute('href');
}

function showProgress(progress: number): void {
  progressInput.value = String(progress);
  progressOutput.textContent = progress.toFixed(2);
}

function goTo(digit: string): void {
  const previousDigit = targetDigit;
  targetDigit = digit;
  for (const button of digitButtons.querySelectorAll<HTMLButtonElement>('button')) {
    button.classList.toggle('active', button.dataset.digit === digit);
  }
  void showReference();
  stopRunningAnimation();
  if (!shapes[digit] || !currentPath) { // nothing to morph from or to: jump
    morphFrom = morphTo = shapes[digit] ?? null;
    spinAngle = 0;
    settled = true;
    render(morphTo);
    return;
  }
  const from = settled ? shapeForPair(iconSet, shapes, previousDigit, digit) : currentPath;
  const to = shapeForPair(iconSet, shapes, digit, previousDigit);
  morphFrom = from;
  morphTo = to;
  spinAngle = (settled && iconSet.spins[previousDigit]?.[digit]) || 0;
  settled = false;
  const duration = Number(durationInput.value);
  const easing = easings[easingSelect.value as EasingName];
  const startTime = performance.now();
  stopAnimation = animate((frameTime) => {
    const progress = Math.min(Math.max((frameTime - startTime) / duration, 0), 1);
    showProgress(progress);
    render(blend(from, to, easing(progress)));
    if (progress >= 1) settled = true;
    return progress < 1;
  });
}

function setAutoPlay(on: boolean): void {
  clearInterval(autoPlayTimer);
  if (!on) return;
  autoPlayTimer = setInterval(() => {
    const drawnDigits = DIGITS.filter((digit) => shapes[digit]);
    if (drawnDigits.length) goTo(drawnDigits[(drawnDigits.indexOf(targetDigit) + 1) % drawnDigits.length]);
  }, Number(durationInput.value) + AUTO_PLAY_PAUSE);
}

function selectIconSet(setName: string): void {
  stopRunningAnimation();
  autoPlayToggle.checked = false;
  setAutoPlay(false);
  for (const button of setButtons.querySelectorAll<HTMLButtonElement>('button')) {
    button.classList.toggle('active', button.dataset.set === setName);
  }
  iconSetName = setName;
  iconSet = ICON_SETS[setName];
  settings.write('set', setName);
  try {
    shapes = defaultShapes(iconSet);
  } catch (error) {
    shapes = {};
    pathOutput.innerHTML = `<span class="error">${setName}: ${(error as Error).message}</span>`;
  }
  morphPath.setAttribute('stroke-width', String(iconSet.strokeWidth));

  digitButtons.replaceChildren();
  for (const digit of DIGITS) {
    const button = document.createElement('button');
    const shape = shapes[digit];
    button.dataset.digit = digit;
    button.title = shape ? `Morph to ${digit}` : `${digit}: not drawn yet`;
    button.classList.toggle('not-drawn', !shape);
    button.innerHTML = shape
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${iconSet.strokeWidth * 1.5}" stroke-linecap="round" stroke-linejoin="round"><path d="${toPathData(shape)}"/></svg>`
      : digit;
    button.onclick = () => {
      autoPlayToggle.checked = false;
      setAutoPlay(false);
      goTo(digit);
    };
    digitButtons.appendChild(button);
  }
  currentPath = null;
  goTo('0');
  showProgress(1);
}

function setColor(color: string): void {
  const normalized = color.toLowerCase();
  document.documentElement.style.setProperty('--stroke', normalized);
  colorInput.value = normalized;
  colorOutput.textContent = normalized;
  for (const button of colorSwatches.querySelectorAll<HTMLButtonElement>('button')) {
    button.classList.toggle('active', button.dataset.color === normalized);
  }
  settings.write('color', normalized);
}

function setReferenceOpacity(opacity: number): void {
  referenceOpacityInput.value = String(opacity);
  referenceImage.setAttribute('opacity', String(opacity));
  referenceOutput.textContent = `${Math.round(opacity * 100)}%`;
  settings.write('reference-opacity', String(opacity));
}

function showGrid(on: boolean): void {
  gridToggle.checked = on;
  document.body.classList.toggle('show-grid', on);
  settings.write('grid', on ? '1' : '');
}

// ---- wiring ----

for (const setName of Object.keys(ICON_SETS)) {
  const button = document.createElement('button');
  button.dataset.set = setName;
  button.textContent = setName.toUpperCase();
  button.onclick = () => selectIconSet(setName);
  setButtons.appendChild(button);
}

for (const easingName of Object.keys(easings)) easingSelect.add(new Option(easingName, easingName));
easingSelect.value = 'easeInOutCubic' satisfies EasingName;

for (const color of PRESET_COLORS) {
  const button = document.createElement('button');
  button.dataset.color = color;
  button.title = color;
  button.style.setProperty('--swatch', color);
  button.onclick = () => setColor(color);
  colorInput.before(button);
}
colorInput.oninput = () => setColor(colorInput.value);
setColor(settings.read('color') ?? PRESET_COLORS[0]);

referenceOpacityInput.oninput = () => setReferenceOpacity(Number(referenceOpacityInput.value));
setReferenceOpacity(Number(settings.read('reference-opacity') ?? 0.3));

durationInput.oninput = () => {
  durationOutput.textContent = `${durationInput.value}ms`;
  if (autoPlayToggle.checked) setAutoPlay(true);
};
progressInput.oninput = () => {
  stopRunningAnimation();
  const progress = Number(progressInput.value);
  progressOutput.textContent = progress.toFixed(2);
  if (morphFrom && morphTo) render(blend(morphFrom, morphTo, easings[easingSelect.value as EasingName](progress)));
};
autoPlayToggle.onchange = () => setAutoPlay(autoPlayToggle.checked);
gridToggle.onchange = () => showGrid(gridToggle.checked);
showGrid(Boolean(settings.read('grid')));
debugToggle.onchange = () => {
  document.body.classList.toggle('debugging', debugToggle.checked);
  render(currentPath);
};

const rememberedSet = settings.read('set');
selectIconSet(rememberedSet && rememberedSet in ICON_SETS ? rememberedSet : 'v1');
