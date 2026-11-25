// The text line of the Digits tab: the library's text() with the current digit set and style; changed characters
// morph. A live clock can drive it.
import type { EasingName } from '../src/morph.ts';
import { text } from '../src/text.ts';
import type { Text } from '../src/text.ts';
import type { IconSet } from '../src/types.ts';
import { current } from './current.ts';
import { elementById, settings } from './page.ts';

const textLine = elementById('text-line');
const textInput = elementById<HTMLInputElement>('text-input');
const cellWidthInput = elementById<HTMLInputElement>('cell-width');
const cellWidthOutput = elementById<HTMLOutputElement>('cell-width-output');
const spacingInput = elementById<HTMLInputElement>('spacing');
const spacingOutput = elementById<HTMLOutputElement>('spacing-output');
const textSizeInput = elementById<HTMLInputElement>('text-size');
const textSizeOutput = elementById<HTMLOutputElement>('text-size-output');
const liveClockToggle = elementById<HTMLInputElement>('live-clock');
const durationInput = elementById<HTMLInputElement>('duration');
const easingSelect = elementById<HTMLSelectElement>('easing');

let textLineControl: Text | null = null;
let liveClockTimer = 0;

/** Rebuilds the line (new set or style, or a cell width / spacing / size slider moved). */
export function buildTextLine(): void {
  textLineControl?.destroy();
  textLineControl = null;
  const { iconSet, style } = current;
  if (!iconSet.textLayout || current.tab !== 'digits') return;
  textLineControl = text(textLine, textInput.value, {
    set: iconSet,
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

/** Cell width and spacing start at the set's own (the size slider is remembered). */
export function useTextLayoutOf(iconSet: IconSet): void {
  const { textLayout } = iconSet;
  if (!textLayout) return;
  cellWidthInput.value = String(textLayout.cellWidth);
  spacingInput.value = String(textLayout.spacing);
}

function updateTextLine(value: string): void {
  textLineControl?.to(value, { duration: Number(durationInput.value), easing: easingSelect.value as EasingName });
}

const twoDigits = (value: number) => String(value).padStart(2, '0');
export function setLiveClock(on: boolean): void {
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

textInput.value = settings.read('text') ?? textInput.value;
textSizeInput.value = settings.read('text-size') ?? textSizeInput.value;
textInput.oninput = () => {
  setLiveClock(false);
  settings.write('text', textInput.value);
  updateTextLine(textInput.value);
};
cellWidthInput.oninput = buildTextLine;
spacingInput.oninput = buildTextLine;
textSizeInput.oninput = () => {
  settings.write('text-size', textSizeInput.value);
  buildTextLine();
};
liveClockToggle.onchange = () => setLiveClock(liveClockToggle.checked);
