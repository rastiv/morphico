// Preview page (dev only, not published). Served as JavaScript by tools/serve.ts.
// Three tabs: Digits (digit sets + the text line), Icons (icon families) and Clip (clip.ts: an element cut out by a
// morphing shape). The style panel overrides the set's own look the same way the library options do (strokeWidth,
// lineCap, lineJoin, fill, roundness).
import './clip.ts';
import { animate, easings } from '../src/engine.ts';
import {
  defaultShapes, drawnPieces, interpolate, pieceLengthOf, rotateAroundCenter, scaleAroundCenter, shapeForPair, splitPieces,
  toPathData, toSegments, withDrawnPieces,
} from '../src/geometry.ts';
import { iconSets, resolveIconSet } from '../src/iconSets.ts';
import type { IconSetName } from '../src/iconSets.ts';
import type { EasingName } from '../src/morph.ts';
import type { StyleOptions } from '../src/svg.ts';
import { text } from '../src/text.ts';
import type { Text } from '../src/text.ts';
import type { IconSet, PathNumbers } from '../src/types.ts';

/** Tabs that show icon sets (the Clip tab has its own view). */
type SetTab = 'digits' | 'icons';
type Tab = SetTab | 'clip';
/** What the style panel changes; a missing value means "the set's own". */
interface StyleChoices extends StyleOptions {
  roundness?: number;
}

const SET_NAMES = Object.keys(iconSets) as IconSetName[];
const DEFAULT_SETS: Record<SetTab, IconSetName> = { digits: 'round', icons: 'media' };
/** Buttons of a digit set: the digits, then the other characters text() shows (space = empty). */
const DIGIT_SET_STATES = [...'0123456789-:.,/ '];
const EMPTY = ' ';
/** How small a shape gets while it fades into (or out of) the empty state — as in the library (morph.ts). */
const EMPTY_SCALE = 0.3;
const PRESET_COLORS = ['#e8e8ea', '#7aa2ff', '#69db7c', '#ffd43b', '#ffa94d', '#ff6b6b', '#f783ac', '#9775fa'];
const LINE_CAPS: IconSet['lineCap'][] = ['round', 'butt', 'square'];
const LINE_JOINS: IconSet['lineJoin'][] = ['round', 'miter', 'bevel'];
const AUTO_PLAY_PAUSE = 700; // ms between two auto-play morphs

const elementById = <ElementType extends Element = HTMLElement>(id: string): ElementType => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`#${id} is missing in index.html`);
  return element as unknown as ElementType;
};
const tabButtons = elementById('tabs');
const setsView = elementById('sets-view');
const clipView = elementById('clip-view');
const setButtons = elementById('set-buttons');
const stateButtons = elementById('state-buttons');
const morphPath = elementById<SVGPathElement>('morph-path');
const debugLayer = elementById<SVGGElement>('debug-layer');
const gridLayer = elementById<SVGGElement>('grid-layer');
const progressInput = elementById<HTMLInputElement>('progress');
const progressOutput = elementById<HTMLOutputElement>('progress-output');
const durationInput = elementById<HTMLInputElement>('duration');
const durationOutput = elementById<HTMLOutputElement>('duration-output');
const easingSelect = elementById<HTMLSelectElement>('easing');
const autoPlayToggle = elementById<HTMLInputElement>('auto-play');
const colorSwatches = elementById('color-swatches');
const colorInput = elementById<HTMLInputElement>('color');
const strokeWidthInput = elementById<HTMLInputElement>('stroke-width');
const strokeWidthOutput = elementById<HTMLOutputElement>('stroke-width-output');
const strokeUnitButtons = elementById('stroke-unit');
const lineCapButtons = elementById('line-cap');
const lineJoinButtons = elementById('line-join');
const fillButtons = elementById('fill');
const lineJoinLabel = elementById('line-join-label');
const lineJoinHint = elementById('line-join-hint');
const roundnessRow = elementById('roundness-row');
const roundnessInput = elementById<HTMLInputElement>('roundness');
const roundnessOutput = elementById<HTMLOutputElement>('roundness-output');
const gridToggle = elementById<HTMLInputElement>('show-grid');
const debugToggle = elementById<HTMLInputElement>('show-debug');
const pathOutput = elementById<HTMLPreElement>('path-output');
const textPreview = elementById('text-preview');
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
const readStyleChoices = (): StyleChoices => {
  try { return JSON.parse(settings.read('style') ?? '{}') as StyleChoices; } catch { return {}; }
};

/** The last set tab (Digits or Icons) — stays while the Clip tab is shown. */
let tab: SetTab = 'digits';
let iconSetName: IconSetName = DEFAULT_SETS.digits;
let iconSet: IconSet = iconSets[iconSetName]; // with the chosen corner radius
let style: StyleChoices = readStyleChoices();
let shapes: Record<string, PathNumbers> = {};
let morphFrom: PathNumbers | null = null;
let morphTo: PathNumbers | null = null;
let spinAngle = 0;
/** Pieces drawn along their path in the current morph (PairLayout.draw). */
let drawn: ReturnType<typeof drawnPieces> = [];
/** Opacity at the start and end of the morph: only the empty state is faded (0). */
let fade = { from: 1, to: 1 };
let currentPath: PathNumbers | null = null;
let targetState = '';
let settled = true; // false while a morph runs (or was stopped half-way by the progress slider)
let stopAnimation: (() => void) | null = null;
let autoPlayTimer = 0;

const easing = () => easings[easingSelect.value as EasingName];
const stopRunningAnimation = (): void => {
  stopAnimation?.();
  stopAnimation = null;
};
const setsOfTab = (someTab: Tab) => SET_NAMES.filter((name) => Boolean(iconSets[name].textLayout) === (someTab === 'digits'));
/** Digit sets always show 0–9 and - (dashed = not drawn yet); icon sets their own states. */
const statesOf = (someSet: IconSet): string[] => (someSet.textLayout ? DIGIT_SET_STATES : Object.keys(someSet.strokes));
/** Stroke width as a CSS length (px) keeps its width on screen; a number scales with the icon. */
const hasFixedWidth = () => typeof style.strokeWidth === 'string';
// applied to every path (vector-effect is not inherited)
const svgStyleAttributes = () => ({
  'stroke-width': String(style.strokeWidth ?? iconSet.strokeWidth),
  'vector-effect': hasFixedWidth() ? 'non-scaling-stroke' : 'none',
  'stroke-linecap': style.lineCap ?? iconSet.lineCap,
  'stroke-linejoin': style.lineJoin ?? iconSet.lineJoin,
  fill: style.fill ? 'currentColor' : 'none',
});
const attributeText = (attributes: Record<string, string>) =>
  Object.entries(attributes).map(([name, value]) => `${name}="${value}"`).join(' ');

// ---- stage: the big icon, drawn directly (the progress slider and the debug overlay need the path numbers) ----

/** Blends towards the target in the start's frame while turning that frame by spin · progress. */
const blend = (from: PathNumbers, to: PathNumbers, progress: number, spin: number): PathNumbers => (spin
  ? rotateAroundCenter(interpolate(from, rotateAroundCenter(to, -spin), progress), spin * progress)
  : interpolate(from, to, progress));

function render(path: PathNumbers | null): void {
  currentPath = path;
  if (!path) {
    morphPath.removeAttribute('d');
    debugLayer.replaceChildren();
    pathOutput.textContent = `${iconSetName} / ${targetState}: not drawn yet`;
    return;
  }
  const pathData = toPathData(path, pieceLengthOf(iconSet));
  morphPath.setAttribute('d', pathData);
  pathOutput.textContent = pathData;
  if (debugToggle.checked) renderDebug(path);
}

/** Every segment in its own color, with control handles; the white dot marks each piece's start point. */
function renderDebug(path: PathNumbers): void {
  debugLayer.innerHTML = splitPieces(path, pieceLengthOf(iconSet)).map((piece) => {
    const segments = toSegments(piece);
    return segments.map(([start, control1, control2, end], segmentIndex) => {
      const color = `hsl(${(segmentIndex * 360) / segments.length} 85% 65%)`;
      return `<path d="M${start} C${control1} ${control2} ${end}" stroke="${color}" stroke-width="0.6"/>`
        + `<path d="M${start} L${control1} M${end} L${control2}" stroke="${color}" stroke-width="0.06" opacity="0.7"/>`
        + `<circle cx="${control1[0]}" cy="${control1[1]}" r="0.18" fill="${color}"/>`
        + `<circle cx="${control2[0]}" cy="${control2[1]}" r="0.18" fill="${color}"/>`
        + `<circle cx="${end[0]}" cy="${end[1]}" r="0.28" fill="var(--bg)" stroke="${color}" stroke-width="0.1"/>`;
    }).join('') + `<circle cx="${piece[0]}" cy="${piece[1]}" r="0.45" fill="#fff"/>`;
  }).join('');
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

/** The stage's opacity (the empty state fades). */
const showOpacity = (opacity: number) => morphPath.setAttribute('opacity', String(Math.min(Math.max(opacity, 0), 1)));

function goTo(state: string): void {
  const previousState = targetState;
  targetState = state;
  for (const button of stateButtons.querySelectorAll<HTMLButtonElement>('button')) {
    button.classList.toggle('active', button.dataset.state === state);
  }
  stopRunningAnimation();
  const drawable = (someState: string) => someState === EMPTY || Boolean(shapes[someState]);
  if (!drawable(state) || !drawable(previousState) || (!currentPath && previousState !== EMPTY) || state === previousState) {
    // nothing to morph from or to: jump
    morphFrom = morphTo = shapes[state] ?? null;
    drawn = [];
    fade = { from: 1, to: 1 };
    spinAngle = 0;
    settled = true;
    showOpacity(state === EMPTY ? 0 : 1);
    render(morphTo);
    return;
  }
  // the empty state: the other shape, shrunk and faded out (as in the library)
  const target = state === EMPTY ? null : previousState === EMPTY ? shapes[state] : shapeForPair(iconSet, shapes, state, previousState);
  const start = !settled ? currentPath
    : previousState === EMPTY ? null : shapeForPair(iconSet, shapes, previousState, state);
  const from = start ?? scaleAroundCenter(target!, EMPTY_SCALE);
  const to = target ?? scaleAroundCenter(start!, EMPTY_SCALE);
  fade = { from: previousState === EMPTY ? 0 : 1, to: state === EMPTY ? 0 : 1 };
  drawn = settled && start && target ? drawnPieces(iconSet, previousState, state) : [];
  morphFrom = from;
  morphTo = to;
  spinAngle = (settled && iconSet.spins[previousState]?.[state]) || 0;
  settled = false;
  const duration = Number(durationInput.value);
  const easeProgress = easing();
  const startTime = performance.now();
  stopAnimation = animate((frameTime) => {
    const progress = Math.min(Math.max((frameTime - startTime) / duration, 0), 1);
    showProgress(progress);
    const easedProgress = easeProgress(progress);
    showOpacity(fade.from + (fade.to - fade.from) * easedProgress);
    render(withDrawnPieces(blend(from, to, easedProgress, spinAngle), from, to, easedProgress, pieceLengthOf(iconSet), drawn));
    if (progress >= 1) settled = true;
    return progress < 1;
  });
}

function setAutoPlay(on: boolean): void {
  clearInterval(autoPlayTimer);
  autoPlayToggle.checked = on;
  if (!on) return;
  autoPlayTimer = setInterval(() => {
    const drawnStates = statesOf(iconSet).filter((state) => shapes[state]);
    if (drawnStates.length) goTo(drawnStates[(drawnStates.indexOf(targetState) + 1) % drawnStates.length]);
  }, Number(durationInput.value) + AUTO_PLAY_PAUSE);
}

function buildStateButtons(): void {
  stateButtons.replaceChildren();
  for (const state of statesOf(iconSet)) {
    const button = document.createElement('button');
    const shape = shapes[state];
    button.dataset.state = state;
    button.title = state === EMPTY ? 'Morph to empty (space)' : shape ? `Morph to ${state}` : `${state}: not drawn yet`;
    button.classList.toggle('not-drawn', !shape && state !== EMPTY);
    button.classList.toggle('active', state === targetState);
    button.innerHTML = shape
      ? `<svg viewBox="0 0 24 24" stroke="currentColor"><path ${attributeText(svgStyleAttributes())} d="${toPathData(shape, pieceLengthOf(iconSet))}"/></svg>`
      : state === EMPTY ? '␣' : state;
    button.onclick = () => {
      setAutoPlay(false);
      goTo(state);
    };
    stateButtons.appendChild(button);
  }
}

// ---- sets and tabs ----

/** (Re)builds everything that depends on the set and its corner radius. */
function loadIconSet(keepState: boolean): void {
  stopRunningAnimation();
  const baseSet = iconSets[iconSetName];
  iconSet = style.roundness !== undefined && baseSet.withRoundness ? resolveIconSet(iconSetName, style.roundness) : baseSet;
  try {
    shapes = defaultShapes(iconSet);
  } catch (error) {
    shapes = {};
    pathOutput.innerHTML = `<span class="error">${iconSetName}: ${(error as Error).message}</span>`;
  }
  const states = statesOf(iconSet);
  const state = keepState && states.includes(targetState) ? targetState : states[0];
  targetState = state;
  currentPath = null;
  buildStateButtons();
  goTo(state);
  showProgress(1);
  applyStyle();
}

function selectIconSet(setName: IconSetName): void {
  setAutoPlay(false);
  iconSetName = setName;
  settings.write(`set.${tab}`, setName);
  for (const button of setButtons.querySelectorAll<HTMLButtonElement>('button')) {
    button.classList.toggle('active', button.dataset.set === setName);
  }
  const { textLayout } = iconSets[setName];
  if (textLayout) {
    cellWidthInput.value = String(textLayout.cellWidth);
    spacingInput.value = String(textLayout.spacing);
  }
  loadIconSet(false);
}

function selectTab(nextTab: Tab): void {
  settings.write('tab', nextTab);
  history.replaceState(null, '', `#${nextTab}`);
  for (const button of tabButtons.querySelectorAll<HTMLButtonElement>('button')) {
    button.classList.toggle('active', button.dataset.tab === nextTab);
  }
  setsView.hidden = nextTab === 'clip';
  clipView.hidden = nextTab !== 'clip';
  if (nextTab === 'clip') {
    setAutoPlay(false);
    setLiveClock(false);
    return;
  }
  tab = nextTab;
  setButtons.replaceChildren(...setsOfTab(tab).map((setName) => {
    const button = document.createElement('button');
    button.dataset.set = setName;
    button.textContent = setName[0].toUpperCase() + setName.slice(1);
    button.onclick = () => selectIconSet(setName);
    return button;
  }));
  textPreview.hidden = tab !== 'digits';
  if (tab !== 'digits') setLiveClock(false);
  const remembered = settings.read(`set.${tab}`) as IconSetName | null;
  selectIconSet(remembered && setsOfTab(tab).includes(remembered) ? remembered : DEFAULT_SETS[tab]);
}

// ---- style panel ----

function buildSegmented<Value extends string>(container: HTMLElement, values: Value[], onPick: (value: Value) => void): void {
  container.replaceChildren(...values.map((value) => {
    const button = document.createElement('button');
    button.dataset.value = value;
    button.textContent = value;
    button.onclick = () => onPick(value);
    return button;
  }));
}
const markSegmented = (container: HTMLElement, value: string) => {
  for (const button of container.querySelectorAll<HTMLButtonElement>('button')) button.classList.toggle('active', button.dataset.value === value);
};
const showReset = (key: keyof StyleChoices, visible: boolean) =>
  document.querySelector(`[data-reset="${key}"]`)?.classList.toggle('visible', visible);

/** Shows the current choices in the panel and applies them to the stage, the buttons and the text line. */
function applyStyle(): void {
  settings.write('style', JSON.stringify(style));
  const fixedWidth = hasFixedWidth();
  Object.assign(strokeWidthInput, fixedWidth ? { min: '0.5', max: '8', step: '0.25' } : { min: '0.25', max: '4', step: '0.05' });
  const strokeWidth = fixedWidth ? parseFloat(String(style.strokeWidth)) : Number(style.strokeWidth ?? iconSet.strokeWidth);
  strokeWidthInput.value = String(strokeWidth);
  strokeWidthOutput.textContent = fixedWidth ? `${strokeWidth}px` : strokeWidth.toFixed(2);
  markSegmented(strokeUnitButtons, fixedWidth ? 'px' : 'grid units');
  markSegmented(lineCapButtons, style.lineCap ?? iconSet.lineCap);
  markSegmented(lineJoinButtons, style.lineJoin ?? iconSet.lineJoin);
  markSegmented(fillButtons, style.fill ? 'on' : 'off');
  const hasRoundness = Boolean(iconSets[iconSetName].withRoundness);
  roundnessRow.classList.toggle('disabled', !hasRoundness);
  roundnessRow.title = hasRoundness ? '' : 'This set has no adjustable roundness';
  const roundness = style.roundness ?? 1;
  roundnessInput.value = String(roundness);
  roundnessOutput.textContent = roundness === 1 ? 'own' : roundness.toFixed(2);
  // line join only changes sharp corners: digit sets have some, icons only at roundness 0
  const lineJoinMatters = !hasRoundness || roundness === 0;
  for (const element of [lineJoinLabel, lineJoinButtons]) element.classList.toggle('disabled', !lineJoinMatters);
  lineJoinHint.hidden = lineJoinMatters;
  for (const key of ['strokeWidth', 'lineCap', 'lineJoin', 'roundness'] as const) showReset(key, style[key] !== undefined);

  for (const [name, value] of Object.entries(svgStyleAttributes())) morphPath.setAttribute(name, value);
  for (const path of stateButtons.querySelectorAll('path')) {
    for (const [name, value] of Object.entries(svgStyleAttributes())) path.setAttribute(name, value);
  }
  buildTextLine();
}

function changeStyle(change: Partial<StyleChoices>): void {
  const roundnessChanged = 'roundness' in change && change.roundness !== style.roundness;
  style = { ...style, ...change };
  for (const key of Object.keys(style) as (keyof StyleChoices)[]) if (style[key] === undefined) delete style[key];
  if (roundnessChanged) loadIconSet(true);
  else applyStyle();
}

function setColor(color: string): void {
  const normalized = color.toLowerCase();
  document.documentElement.style.setProperty('--stroke', normalized);
  colorInput.value = normalized;
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

// ---- text line: the library's text(); changed digits morph ----

let textLineControl: Text | null = null;
let liveClockTimer = 0;

/** Rebuilds the line (new set or style, or a cell width / spacing / size slider moved). */
function buildTextLine(): void {
  textLineControl?.destroy();
  textLineControl = null;
  if (!iconSet.textLayout || tab !== 'digits') return;
  textLineControl = text(textLine, {
    set: iconSet,
    value: textInput.value,
    size: `${textSizeInput.value}px`,
    cellWidth: Number(cellWidthInput.value),
    spacing: Number(spacingInput.value),
    strokeWidth: style.strokeWidth,
    lineCap: style.lineCap,
    lineJoin: style.lineJoin,
    fill: style.fill,
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

for (const button of tabButtons.querySelectorAll<HTMLButtonElement>('button')) button.onclick = () => selectTab(button.dataset.tab as Tab);

for (const easingName of Object.keys(easings)) easingSelect.add(new Option(easingName, easingName));
easingSelect.value = 'easeInOutCubic' satisfies EasingName;
durationInput.oninput = () => {
  durationOutput.textContent = `${durationInput.value}ms`;
  if (autoPlayToggle.checked) setAutoPlay(true);
};
autoPlayToggle.onchange = () => setAutoPlay(autoPlayToggle.checked);
progressInput.oninput = () => {
  stopRunningAnimation();
  const progress = Number(progressInput.value);
  progressOutput.textContent = progress.toFixed(2);
  const easedProgress = easing()(progress);
  showOpacity(fade.from + (fade.to - fade.from) * easedProgress);
  if (morphFrom && morphTo) {
    render(withDrawnPieces(blend(morphFrom, morphTo, easedProgress, spinAngle), morphFrom, morphTo, easedProgress, pieceLengthOf(iconSet), drawn));
  }
};

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

strokeWidthInput.oninput = () => changeStyle({ strokeWidth: hasFixedWidth() ? `${strokeWidthInput.value}px` : Number(strokeWidthInput.value) });
// px starts at 3px; back to grid units = the set's own width
buildSegmented(strokeUnitButtons, ['grid units', 'px'], (unit) => {
  if ((unit === 'px') !== hasFixedWidth()) changeStyle({ strokeWidth: unit === 'px' ? '3px' : undefined });
});
buildSegmented(lineCapButtons, LINE_CAPS, (lineCap) => changeStyle({ lineCap }));
buildSegmented(lineJoinButtons, LINE_JOINS, (lineJoin) => changeStyle({ lineJoin }));
buildSegmented(fillButtons, ['off', 'on'], (value) => changeStyle({ fill: value === 'on' || undefined }));
// roundness 1 = the icon's own corners = no override
roundnessInput.oninput = () => changeStyle({ roundness: Number(roundnessInput.value) < 1 ? Number(roundnessInput.value) : undefined });
for (const button of document.querySelectorAll<HTMLButtonElement>('[data-reset]')) {
  button.onclick = () => changeStyle({ [button.dataset.reset as keyof StyleChoices]: undefined });
}

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

// the address (#digits / #icons / #clip) wins over the remembered tab
const TABS: Tab[] = ['digits', 'icons', 'clip'];
const startTab = location.hash.slice(1) || settings.read('tab');
selectTab(TABS.find((someTab) => someTab === startTab) ?? 'digits');
