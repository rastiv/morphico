// The Style panel of the Digits / Icons tabs: color, stroke width (grid units or px), line cap, line join, fill and
// corner radius — each overrides the set's own the same way the library options do, ↺ goes back to it. Also the grid.
import { iconSets } from '../src/all.ts';
import type { IconSet } from '../src/types.ts';
import { current, hasFixedWidth } from './current.ts';
import type { StyleChoices } from './current.ts';
import { elementById, settings } from './page.ts';
import { applyStageStyle } from './stage.ts';
import { buildTextLine } from './text-line.ts';

const PRESET_COLORS = ['#e8e8ea', '#7aa2ff', '#69db7c', '#ffd43b', '#ffa94d', '#ff6b6b', '#f783ac', '#9775fa'];
const LINE_CAPS: IconSet['lineCap'][] = ['round', 'butt', 'square'];
const LINE_JOINS: IconSet['lineJoin'][] = ['round', 'miter', 'bevel'];

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

/** Rebuilds the set when the corner radius changes (set by main.ts: the set chips own the set). */
let reloadSet: () => void = () => {};
export const whenRoundnessChanges = (reload: () => void): void => { reloadSet = reload; };

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
export function applyStyle(): void {
  const { style, iconSet } = current;
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
  const hasRoundness = Boolean(iconSets[current.iconSetName].withRoundness);
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

  applyStageStyle();
  buildTextLine();
}

function changeStyle(change: Partial<StyleChoices>): void {
  const roundnessChanged = 'roundness' in change && change.roundness !== current.style.roundness;
  const style: StyleChoices = { ...current.style, ...change };
  for (const key of Object.keys(style) as (keyof StyleChoices)[]) if (style[key] === undefined) delete style[key];
  current.style = style;
  if (roundnessChanged) reloadSet();
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
