// The countdown card of the Digits tab: the library's countdown() with the current digit set and style, the size of
// the text line. The buttons start it for a number of seconds or to a moment, pause and resume it.
import { countdown } from '../src/countdown.ts';
import type { Countdown, CountdownTarget } from '../src/countdown.ts';
import { current } from './current.ts';
import { elementById } from './page.ts';

const countdownLine = elementById('countdown-line');
const actions = elementById('countdown-actions');
const pauseButton = elementById<HTMLButtonElement>('countdown-pause');
const resumeButton = elementById<HTMLButtonElement>('countdown-resume');
const codeOutput = elementById('countdown-code');
const textSizeInput = elementById<HTMLInputElement>('text-size');

let control: Countdown | null = null;
/** The moment it counts to (seconds are turned into one), so a rebuild for a new set or style counts on. */
let endTime = Date.now() + 300 * 1000;
let paused = false;
let pausedAt = 0;
/** A moment stays where it is through a pause; a number of seconds moves its end on. */
let countsToMoment = false;
let ended = false;
/** How the last start looks in code (shown under the line). */
let targetCode = '300';

const nextNewYear = (): Date => new Date(new Date().getFullYear() + 1, 0, 1);

const showCode = (): void => {
  const state = ended ? ' — onEnd called' : paused ? ' — paused' : '';
  codeOutput.textContent = `countdown(element, ${targetCode}, { set: digits${current.iconSetName[0].toUpperCase()}${current.iconSetName.slice(1)}, onEnd })${state}`;
};

/** (Re)builds the countdown (new set or style, or the size slider moved); it keeps counting to the same moment. */
export function buildCountdown(): void {
  control?.destroy();
  control = null;
  const { iconSet, style } = current;
  if (!iconSet.textLayout || current.tab !== 'digits') return;
  const timeLeft = (endTime - (paused ? pausedAt : Date.now())) / 1000;
  const until: CountdownTarget = ended ? 0 : countsToMoment ? new Date(endTime) : Math.max(0, timeLeft);
  control = countdown(countdownLine, until, {
    set: iconSet,
    size: `${textSizeInput.value}px`,
    strokeWidth: style.strokeWidth,
    lineCap: style.lineCap,
    lineJoin: style.lineJoin,
    fill: style.fill,
    onEnd: () => {
      ended = true;
      showCode();
    },
  });
  if (paused) control.pause();
  showCode();
}

const start = (until: CountdownTarget, code: string): void => {
  countsToMoment = until instanceof Date;
  endTime = until instanceof Date ? until.getTime() : Date.now() + Number(until) * 1000;
  targetCode = code;
  paused = false;
  ended = false;
  control?.to(until);
  showCode();
};

for (const button of actions.querySelectorAll<HTMLButtonElement>('[data-seconds]')) {
  button.onclick = () => start(Number(button.dataset.seconds), button.dataset.seconds!);
}
for (const button of actions.querySelectorAll<HTMLButtonElement>('[data-until]')) {
  button.onclick = () => start(nextNewYear(), `new Date('${nextNewYear().getFullYear()}-01-01')`);
}
pauseButton.onclick = () => {
  if (paused || ended) return;
  paused = true;
  pausedAt = Date.now();
  control?.pause();
  showCode();
};
resumeButton.onclick = () => {
  if (!paused) return;
  paused = false;
  if (!countsToMoment) endTime += Date.now() - pausedAt;
  control?.resume();
  showCode();
};
textSizeInput.addEventListener('input', buildCountdown);
