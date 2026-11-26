// Tabs and set chips: Digits | Icons | Clip | Face; on the Digits / Icons tabs a chip per set (the last one chosen
// per tab is remembered).
import { iconSets } from '../src/all.ts';
import type { IconSetName } from '../src/all.ts';
import { defaultShapes } from '../src/geometry/pairs.ts';
import { resolveIconSet } from '../src/roundness.ts';
import { current, DEFAULT_SETS, setsOfTab } from './current.ts';
import type { Tab } from './current.ts';
import { elementById, settings } from './page.ts';
import { setAutoPlay, showSet, stopRunningAnimation } from './stage.ts';
import { applyStyle } from './style-panel.ts';
import { setLiveClock, useTextLayoutOf } from './text-line.ts';

const tabButtons = elementById('tabs');
const setsView = elementById('sets-view');
const clipView = elementById('clip-view');
const faceView = elementById('face-view');
const setButtons = elementById('set-buttons');
const textPreview = elementById('text-preview');
const countdownPreview = elementById('countdown-preview');
const pathOutput = elementById<HTMLPreElement>('path-output');

/** (Re)builds everything that depends on the set and its corner radius. */
export function loadIconSet(keepState: boolean): void {
  stopRunningAnimation();
  const baseSet = iconSets[current.iconSetName];
  const { roundness } = current.style;
  current.iconSet = roundness !== undefined && baseSet.withRoundness ? resolveIconSet(baseSet, roundness) : baseSet;
  try {
    current.shapes = defaultShapes(current.iconSet);
  } catch (error) {
    current.shapes = {};
    pathOutput.innerHTML = `<span class="error">${current.iconSetName}: ${(error as Error).message}</span>`;
  }
  showSet(keepState);
  applyStyle();
}

function selectIconSet(setName: IconSetName): void {
  setAutoPlay(false);
  current.iconSetName = setName;
  settings.write(`set.${current.tab}`, setName);
  for (const button of setButtons.querySelectorAll<HTMLButtonElement>('button')) {
    button.classList.toggle('active', button.dataset.set === setName);
  }
  useTextLayoutOf(iconSets[setName]);
  loadIconSet(false);
}

export function selectTab(nextTab: Tab): void {
  settings.write('tab', nextTab);
  history.replaceState(null, '', `#${nextTab}`);
  for (const button of tabButtons.querySelectorAll<HTMLButtonElement>('button')) {
    button.classList.toggle('active', button.dataset.tab === nextTab);
  }
  setsView.hidden = nextTab === 'clip' || nextTab === 'face';
  clipView.hidden = nextTab !== 'clip';
  faceView.hidden = nextTab !== 'face';
  if (nextTab === 'clip' || nextTab === 'face') {
    setAutoPlay(false);
    setLiveClock(false);
    return;
  }
  current.tab = nextTab;
  setButtons.replaceChildren(...setsOfTab(nextTab).map((setName) => {
    const button = document.createElement('button');
    button.dataset.set = setName;
    button.textContent = setName[0].toUpperCase() + setName.slice(1);
    button.onclick = () => selectIconSet(setName);
    return button;
  }));
  textPreview.hidden = nextTab !== 'digits';
  countdownPreview.hidden = nextTab !== 'digits';
  if (nextTab !== 'digits') setLiveClock(false);
  const remembered = settings.read(`set.${nextTab}`) as IconSetName | null;
  selectIconSet(remembered && setsOfTab(nextTab).includes(remembered) ? remembered : DEFAULT_SETS[nextTab]);
}

for (const button of tabButtons.querySelectorAll<HTMLButtonElement>('button')) button.onclick = () => selectTab(button.dataset.tab as Tab);
