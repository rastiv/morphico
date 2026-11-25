// The stage of the Digits / Icons tabs: the big icon, drawn directly (the progress slider and the debug overlay need
// the path numbers), the state buttons, auto-play and the Motion panel.
import { animate, easings } from '../src/engine.ts';
import { drawnPieces, withDrawnPieces } from '../src/geometry/draw.ts';
import { pieceLengthOf, shapeForPair } from '../src/geometry/pairs.ts';
import { toPathData } from '../src/geometry/path-data.ts';
import { interpolate, rotateAroundCenter, scaleAroundCenter, splitPieces, toSegments } from '../src/geometry/path-numbers.ts';
import type { EasingName } from '../src/morph.ts';
import type { PathNumbers } from '../src/types.ts';
import { current, EMPTY, statesOf, svgStyleAttributes } from './current.ts';
import { elementById } from './page.ts';

/** How small a shape gets while it fades into (or out of) the empty state — as in the library (morph.ts). */
const EMPTY_SCALE = 0.3;
const AUTO_PLAY_PAUSE = 700; // ms between two auto-play morphs

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
const debugToggle = elementById<HTMLInputElement>('show-debug');
const pathOutput = elementById<HTMLPreElement>('path-output');

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
export const stopRunningAnimation = (): void => {
  stopAnimation?.();
  stopAnimation = null;
};
const attributeText = (attributes: Record<string, string>) =>
  Object.entries(attributes).map(([name, value]) => `${name}="${value}"`).join(' ');

/** Blends towards the target in the start's frame while turning that frame by spin · progress. */
const blend = (from: PathNumbers, to: PathNumbers, progress: number, spin: number): PathNumbers => (spin
  ? rotateAroundCenter(interpolate(from, rotateAroundCenter(to, -spin), progress), spin * progress)
  : interpolate(from, to, progress));

function render(path: PathNumbers | null): void {
  currentPath = path;
  if (!path) {
    morphPath.removeAttribute('d');
    debugLayer.replaceChildren();
    pathOutput.textContent = `${current.iconSetName} / ${targetState}: not drawn yet`;
    return;
  }
  const pathData = toPathData(path, pieceLengthOf(current.iconSet));
  morphPath.setAttribute('d', pathData);
  pathOutput.textContent = pathData;
  if (debugToggle.checked) renderDebug(path);
}

/** Every segment in its own color, with control handles; the white dot marks each piece's start point. */
function renderDebug(path: PathNumbers): void {
  debugLayer.innerHTML = splitPieces(path, pieceLengthOf(current.iconSet)).map((piece) => {
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
  const { iconSet, shapes } = current;
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

export function setAutoPlay(on: boolean): void {
  clearInterval(autoPlayTimer);
  autoPlayToggle.checked = on;
  if (!on) return;
  autoPlayTimer = setInterval(() => {
    const drawnStates = statesOf(current.iconSet).filter((state) => current.shapes[state]);
    if (drawnStates.length) goTo(drawnStates[(drawnStates.indexOf(targetState) + 1) % drawnStates.length]);
  }, Number(durationInput.value) + AUTO_PLAY_PAUSE);
}

function buildStateButtons(): void {
  stateButtons.replaceChildren();
  for (const state of statesOf(current.iconSet)) {
    const button = document.createElement('button');
    const shape = current.shapes[state];
    button.dataset.state = state;
    button.title = state === EMPTY ? 'Morph to empty (space)' : shape ? `Morph to ${state}` : `${state}: not drawn yet`;
    button.classList.toggle('not-drawn', !shape && state !== EMPTY);
    button.classList.toggle('active', state === targetState);
    button.innerHTML = shape
      ? `<svg viewBox="0 0 24 24" stroke="currentColor"><path ${attributeText(svgStyleAttributes())} d="${toPathData(shape, pieceLengthOf(current.iconSet))}"/></svg>`
      : state === EMPTY ? '␣' : state;
    button.onclick = () => {
      setAutoPlay(false);
      goTo(state);
    };
    stateButtons.appendChild(button);
  }
}

/** Shows the current set (new set or corner radius): its state buttons and its first state (or the one shown). */
export function showSet(keepState: boolean): void {
  const states = statesOf(current.iconSet);
  const state = keepState && states.includes(targetState) ? targetState : states[0];
  targetState = state;
  currentPath = null;
  buildStateButtons();
  goTo(state);
  showProgress(1);
}

/** The style choices on the stage and the state buttons. */
export function applyStageStyle(): void {
  for (const [name, value] of Object.entries(svgStyleAttributes())) morphPath.setAttribute(name, value);
  for (const path of stateButtons.querySelectorAll('path')) {
    for (const [name, value] of Object.entries(svgStyleAttributes())) path.setAttribute(name, value);
  }
}

// ---- Motion panel, progress slider, debug overlay ----

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
    render(withDrawnPieces(blend(morphFrom, morphTo, easedProgress, spinAngle), morphFrom, morphTo, easedProgress, pieceLengthOf(current.iconSet), drawn));
  }
};
debugToggle.onchange = () => {
  document.body.classList.toggle('debugging', debugToggle.checked);
  render(currentPath);
};
