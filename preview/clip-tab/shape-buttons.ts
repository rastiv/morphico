// The Clip tab's shape buttons (each shows the Lucide icon the shape comes from) and "Play through all shapes".
import { clipShapeNames, lucideShapeOutlines } from '../../src/clip/shapes.ts';
import type { ClipShape } from '../../src/clip/shapes.ts';
import { toPathData } from '../../src/geometry/path-data.ts';
import { defaultBreakpoints, layoutStrokes } from '../../src/geometry/stroke-layout.ts';
import { animateTo, byId, shown } from './clips.ts';

const SHAPE_NAMES = clipShapeNames;
const BUTTON_SEGMENTS = 48;
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';

const shapeButtons = byId<HTMLDivElement>('shape-buttons');
const turnCheckbox = byId<HTMLInputElement>('turn-while-morphing');
const turnSelect = byId<HTMLSelectElement>('turn-amount');
const playButton = byId<HTMLButtonElement>('play-sequence');
let sequenceRun = 0;

/** A shape button shows the Lucide icon as Lucide draws it. */
const iconButton = (name: ClipShape): HTMLButtonElement => {
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

const morphTo = (name: ClipShape): Promise<void> => {
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
