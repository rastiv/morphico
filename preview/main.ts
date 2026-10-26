// Preview page (dev only, not published). Served as JavaScript by tools/serve.ts.
import { animate, easings } from '../src/engine.ts';
import { defaultShapes, interpolate, rotateAroundCenter, shapeForPair, toPathData, toSegments } from '../src/geometry.ts';
import { iconSets } from '../src/iconSets.ts';
import type { EasingName } from '../src/morph.ts';
import { text } from '../src/text.ts';
import type { Text } from '../src/text.ts';
import type { IconSet, PathNumbers } from '../src/types.ts';

const ICON_SETS: Record<string, IconSet> = iconSets;
const DEFAULT_SET = 'round';
const DIGITS = [...'0123456789-'];
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
const autoPlayToggle = elementById<HTMLInputElement>('auto-play');
const gridToggle = elementById<HTMLInputElement>('show-grid');
const debugToggle = elementById<HTMLInputElement>('show-debug');
const pathOutput = elementById<HTMLPreElement>('path-output');
const textLine = elementById('text-line');
const textInput = elementById<HTMLInputElement>('text-input');
const cellWidthInput = elementById<HTMLInputElement>('cell-width');
const cellWidthOutput = elementById<HTMLOutputElement>('cell-width-output');
const spacingInput = elementById<HTMLInputElement>('spacing');
const spacingOutput = elementById<HTMLOutputElement>('spacing-output');
const textSizeInput = elementById<HTMLInputElement>('text-size');
const textSizeOutput = elementById<HTMLOutputElement>('text-size-output');
const liveClockToggle = elementById<HTMLInputElement>('live-clock');

// localStorage can be unavailable (private mode, blocked storage): settings are then simply not remembered
const settings = {
  read: (key: string): string | null => {
    try { return localStorage.getItem(`morphico.${key}`); } catch { return null; }
  },
  write: (key: string, value: string): void => {
    try { localStorage.setItem(`morphico.${key}`, value); } catch { /* not remembered */ }
  },
};

let iconSetName = DEFAULT_SET;
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

/** Blends towards the target in the start's frame while turning that frame by spin · progress. */
const blend = (from: PathNumbers, to: PathNumbers, progress: number, spin: number): PathNumbers => (spin
  ? rotateAroundCenter(interpolate(from, rotateAroundCenter(to, -spin), progress), spin * progress)
  : interpolate(from, to, progress));

function render(path: PathNumbers | null): void {
  currentPath = path;
  if (!path) {
    morphPath.removeAttribute('d');
    debugLayer.replaceChildren();
    pathOutput.textContent = `${iconSetName} / ${targetDigit}: not drawn yet`;
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
    render(blend(from, to, easing(progress), spinAngle));
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
  morphPath.setAttribute('stroke-linecap', iconSet.lineCap);
  morphPath.setAttribute('stroke-linejoin', iconSet.lineJoin);

  digitButtons.replaceChildren();
  for (const digit of DIGITS) {
    const button = document.createElement('button');
    const shape = shapes[digit];
    button.dataset.digit = digit;
    button.title = shape ? `Morph to ${digit}` : `${digit}: not drawn yet`;
    button.classList.toggle('not-drawn', !shape);
    button.innerHTML = shape
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${iconSet.strokeWidth}" stroke-linecap="${iconSet.lineCap}" stroke-linejoin="${iconSet.lineJoin}"><path d="${toPathData(shape)}"/></svg>`
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
  cellWidthInput.value = String(iconSet.textLayout.cellWidth);
  spacingInput.value = String(iconSet.textLayout.spacing);
  buildTextLine();
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

function showGrid(on: boolean): void {
  gridToggle.checked = on;
  document.body.classList.toggle('show-grid', on);
  settings.write('grid', on ? '1' : '');
}

// ---- text preview: the library's text(); changed digits morph ----

let textLineControl: Text | null = null;
let liveClockTimer = 0;

/** Rebuilds the line (new set, or a cell width / spacing / size slider moved). */
function buildTextLine(): void {
  textLineControl?.destroy();
  textLineControl = text(textLine, {
    set: iconSet,
    value: textInput.value,
    size: `${textSizeInput.value}px`,
    cellWidth: Number(cellWidthInput.value),
    spacing: Number(spacingInput.value),
  });
  cellWidthOutput.textContent = cellWidthInput.value;
  spacingOutput.textContent = spacingInput.value;
  textSizeOutput.textContent = `${textSizeInput.value}px`;
}

function updateTextLine(value: string): void {
  textLineControl?.set(value, { duration: Number(durationInput.value), easing: easingSelect.value as EasingName });
}

const twoDigits = (value: number) => String(value).padStart(2, '0');
function setLiveClock(on: boolean): void {
  clearInterval(liveClockTimer);
  liveClockToggle.checked = on;
  if (!on) return;
  const showTime = () => {
    const now = new Date();
    textInput.value = `${twoDigits(now.getHours())}:${twoDigits(now.getMinutes())}:${twoDigits(now.getSeconds())}`;
    updateTextLine(textInput.value);
  };
  showTime();
  liveClockTimer = setInterval(showTime, 1000);
}

// ---- wiring ----

for (const setName of Object.keys(ICON_SETS)) {
  const button = document.createElement('button');
  button.dataset.set = setName;
  button.textContent = setName[0].toUpperCase() + setName.slice(1);
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

durationInput.oninput = () => {
  durationOutput.textContent = `${durationInput.value}ms`;
  if (autoPlayToggle.checked) setAutoPlay(true);
};
progressInput.oninput = () => {
  stopRunningAnimation();
  const progress = Number(progressInput.value);
  progressOutput.textContent = progress.toFixed(2);
  if (morphFrom && morphTo) render(blend(morphFrom, morphTo, easings[easingSelect.value as EasingName](progress), spinAngle));
};
autoPlayToggle.onchange = () => setAutoPlay(autoPlayToggle.checked);
gridToggle.onchange = () => showGrid(gridToggle.checked);
showGrid(Boolean(settings.read('grid')));
debugToggle.onchange = () => {
  document.body.classList.toggle('debugging', debugToggle.checked);
  render(currentPath);
};

textInput.value = settings.read('text') ?? textInput.value;
textSizeInput.value = settings.read('text-size') ?? textSizeInput.value;
textInput.oninput = () => {
  setLiveClock(false);
  settings.write('text', textInput.value);
  updateTextLine(textInput.value);
};
// cell width and spacing start at the set's defaults (selectIconSet); the size is remembered
cellWidthInput.oninput = buildTextLine;
spacingInput.oninput = buildTextLine;
textSizeInput.oninput = () => {
  settings.write('text-size', textSizeInput.value);
  buildTextLine();
};
liveClockToggle.onchange = () => setLiveClock(liveClockToggle.checked);

const rememberedSet = settings.read('set');
selectIconSet(rememberedSet && rememberedSet in ICON_SETS ? rememberedSet : DEFAULT_SET);
