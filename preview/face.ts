// Face tab of the preview page: the library's face() on one element. The expression buttons show small pictures of
// every expression (drawn straight from src/face/); the controls call to() / blink(), and options that face() only
// takes when it's created (pupil color, blinking by itself) rebuild it. The Look panel makes the pupils follow the
// pointer (look()) and, optionally, the expression change with the pointer's direction. The Code panel shows the matching
// calls.
import { face } from '../src/face/face.ts';
import type { Face } from '../src/face/face.ts';
import type { EasingName } from '../src/morph.ts';
import { faceExpressionNames, faceExpressionPieces } from '../src/face/expressions.ts';
import { facePaths } from '../src/face/paths.ts';
import type { FaceExpression } from '../src/face/expressions.ts';

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
const FIRST_EXPRESSION: FaceExpression = 'normal';

const byId = <ElementType extends Element>(id: string): ElementType => document.getElementById(id) as unknown as ElementType;

const faceView = byId<HTMLDivElement>('face-view');
const faceTarget = byId<HTMLDivElement>('face-target');
const expressionButtons = byId<HTMLDivElement>('face-buttons');
const blinkButton = byId<HTMLButtonElement>('face-blink');
const nodButton = byId<HTMLButtonElement>('face-nod');
const shakeButton = byId<HTMLButtonElement>('face-shake');
const playButton = byId<HTMLButtonElement>('face-play');
const durationInput = byId<HTMLInputElement>('face-duration');
const durationOutput = byId<HTMLOutputElement>('face-duration-output');
const easingSelect = byId<HTMLSelectElement>('face-easing');
const autoBlinkCheckbox = byId<HTMLInputElement>('face-auto-blink');
const featuresColorInput = byId<HTMLInputElement>('face-features-color');
const pupilsColorInput = byId<HTMLInputElement>('face-pupils-color');
const followCheckbox = byId<HTMLInputElement>('face-follow');
const byDirectionCheckbox = byId<HTMLInputElement>('face-by-direction');
const codeOutput = byId<HTMLPreElement>('face-code');

// ---- the face ----

let robot: Face;
/** The expression shown: face() doesn't report it, the page keeps track (as an app would). */
let expression: FaceExpression = FIRST_EXPRESSION;

const createRobot = (state: FaceExpression): void => {
  robot = face(faceTarget, state, { pupilColor: pupilsColorInput.value, blink: autoBlinkCheckbox.checked });
};

const morphOptions = () => ({ duration: Number(durationInput.value), easing: easingSelect.value as EasingName });

const showCode = (): void => {
  const { duration, easing } = morphOptions();
  codeOutput.textContent = [
    `const robot = face(element, '${FIRST_EXPRESSION}', {`,
    `  pupilColor: '${pupilsColorInput.value}',`,
    `  blink: ${autoBlinkCheckbox.checked},`,
    `});`,
    `// brows, eyes and mouth: the element's CSS color (${featuresColorInput.value})`,
    `robot.to('${expression}', { duration: ${duration}, easing: '${easing}' });`,
    `robot.blink();`,
    `robot.react('nod');   // yes · robot.react('shake'): no`,
    ...(followCheckbox.checked ? [
      `document.addEventListener('pointermove', (event) => {`,
      `  robot.look(event.clientX, event.clientY);`,
      ...(byDirectionCheckbox.checked ? [
        `  // 12 expressions, one per 30° around the face (from the top, clockwise)`,
        `  const sector = Math.floor(angleFromTop(event) / 30);`,
        `  if (sector !== shownSector) robot.to(expressionsAround[shownSector = sector]);`,
      ] : []),
      `});`,
    ] : []),
  ].join('\n');
};

const morphTo = (state: FaceExpression) => {
  expression = state;
  const morph = robot.to(state, morphOptions());
  updateButtons();
  showCode();
  return morph;
};

/** Options face() takes only when created: rebuild it showing the same expression. */
const rebuildRobot = (): void => {
  robot.destroy();
  createRobot(expression);
  showCode();
};

// ---- page ----

const createSvgElement = <Name extends keyof SVGElementTagNameMap>(name: Name, attributes: Record<string, string>): SVGElementTagNameMap[Name] => {
  const element = document.createElementNS(SVG_NAMESPACE, name);
  for (const [attribute, value] of Object.entries(attributes)) element.setAttribute(attribute, value);
  return element;
};

/** A small picture of the expression: features and pupils (clipped to the eyes like face() does). */
const expressionPicture = (name: FaceExpression): SVGSVGElement => {
  const paths = facePaths(faceExpressionPieces()[name]);
  const clipId = `face-button-eyes-${name}`;
  const picture = createSvgElement('svg', { viewBox: '-1 -1 26 26', 'aria-hidden': 'true' });
  const clipPath = createSvgElement('clipPath', { id: clipId });
  clipPath.append(createSvgElement('path', { d: paths.eyes }));
  picture.append(
    clipPath,
    createSvgElement('path', { d: paths.features, class: 'face-features' }),
    createSvgElement('path', { d: paths.pupils, class: 'face-pupils', 'clip-path': `url(#${clipId})` }),
  );
  return picture;
};

function updateButtons(): void {
  for (const button of expressionButtons.querySelectorAll<HTMLButtonElement>('button')) {
    button.classList.toggle('active', button.dataset.expression === expression);
  }
}

expressionButtons.replaceChildren(...faceExpressionNames.map((name) => {
  const button = document.createElement('button');
  button.dataset.expression = name;
  button.title = name;
  const label = document.createElement('span');
  label.textContent = name;
  button.append(expressionPicture(name), label);
  button.onclick = () => { void morphTo(name); };
  return button;
}));

blinkButton.onclick = () => { void robot.blink(); };
nodButton.onclick = () => { void robot.react('nod'); };
shakeButton.onclick = () => { void robot.react('shake'); };

let playing = false;
playButton.onclick = async () => {
  if (playing) return;
  playing = true;
  playButton.disabled = true;
  const current = faceExpressionNames.indexOf(expression);
  const order = [...faceExpressionNames.slice(current + 1), ...faceExpressionNames.slice(0, current + 1)];
  for (const name of order) {
    if (faceView.hidden) break;
    await morphTo(name);
    await new Promise((resolve) => setTimeout(resolve, 700));
  }
  playing = false;
  playButton.disabled = false;
};

durationInput.oninput = () => {
  durationOutput.textContent = `${durationInput.value} ms`;
  showCode();
};
easingSelect.onchange = showCode;
autoBlinkCheckbox.onchange = rebuildRobot;

const applyColors = (): void => {
  faceView.style.setProperty('--face-features', featuresColorInput.value);
  faceView.style.setProperty('--face-pupils', pupilsColorInput.value);
};
featuresColorInput.oninput = () => {
  applyColors();
  showCode();
};
pupilsColorInput.oninput = () => {
  applyColors();
  rebuildRobot();
};

// ---- looking (look() follows the pointer; optionally the expression follows its direction) ----

/** One expression per 30° around the face, from the top, clockwise. */
const EXPRESSIONS_AROUND: readonly FaceExpression[] = [
  'normal', 'tired', 'angry', 'surprised', 'smiling', 'sad',
  'curious', 'suspicious', 'wonder', 'worried', 'excited', 'bored',
];
let shownSector = -1;

document.addEventListener('pointermove', (event) => {
  if (faceView.hidden || !followCheckbox.checked) return;
  robot.look(event.clientX, event.clientY);
  if (!byDirectionCheckbox.checked) return;
  const faceBox = faceTarget.getBoundingClientRect();
  const offsetX = event.clientX - (faceBox.left + faceBox.width / 2);
  const offsetY = event.clientY - (faceBox.top + faceBox.height / 2);
  // close to the middle the direction jumps around: keep the expression
  if (Math.hypot(offsetX, offsetY) < faceBox.width / 4) return;
  const angleFromTop = (Math.atan2(offsetX, -offsetY) * 180 / Math.PI + 360) % 360;
  const sector = Math.floor(angleFromTop / 30);
  if (sector === shownSector) return;
  shownSector = sector;
  void morphTo(EXPRESSIONS_AROUND[sector]);
});

followCheckbox.onchange = () => {
  byDirectionCheckbox.disabled = !followCheckbox.checked;
  if (!followCheckbox.checked) robot.look();
  showCode();
};
byDirectionCheckbox.onchange = () => {
  shownSector = -1;
  showCode();
};
byDirectionCheckbox.disabled = true;

applyColors();
createRobot(FIRST_EXPRESSION);
updateButtons();
showCode();
