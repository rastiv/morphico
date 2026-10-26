// Converts Lucide icons into our TS strokes (one-time import; the printed TS is then the source of truth).
// Usage: node tools/import-lucide.ts <icon> [icon...]      e.g.  node tools/import-lucide.ts play pause square
// Downloads the SVGs of LUCIDE_VERSION from unpkg, turns every element into strokes and prints one
// `const NAME: Stroke[][] = [...]` per icon (one inner list per piece = continuous line), ready to paste into a set.
// Supported: path (M L H V C S Q T A Z, absolute and relative; circular arcs only), circle, ellipse, line,
// rect (with rx), polyline, polygon. Licence: Lucide is ISC (parts from Feather, MIT) → LICENSE-lucide.

const LUCIDE_VERSION = '1.61.0';
const EPSILON = 1e-6;

type Point = [x: number, y: number];

const formatNumber = (value: number): string => String(+value.toFixed(4));
const formatCall = (name: string, values: number[]) => `${name}(${values.map(formatNumber).join(', ')})`;
const distance = (from: Point, to: Point) => Math.hypot(to[0] - from[0], to[1] - from[1]);

/** The pieces of one icon; each piece is a list of stroke calls as TS code. */
class PieceCollector {
  pieces: string[][] = [];
  current: string[] = [];
  endPiece(): void {
    if (this.current.length) this.pieces.push(this.current);
    this.current = [];
  }
  line(from: Point, to: Point): void {
    if (distance(from, to) > EPSILON) this.current.push(formatCall('line', [...from, ...to]));
  }
  arc(center: Point, radius: number, startAngle: number, endAngle: number): void {
    if (Math.abs(endAngle - startAngle) > EPSILON) this.current.push(formatCall('arc', [...center, radius, startAngle, endAngle]));
  }
  cubic(start: Point, control1: Point, control2: Point, end: Point): void {
    this.current.push(formatCall('cubic', [...start, ...control1, ...control2, ...end]));
  }
}

const DEGREE = Math.PI / 180;

/** SVG endpoint arc → circle centre and angles (see the SVG spec, "elliptical arc implementation notes"). */
const addSvgArc = (
  collector: PieceCollector, from: Point, to: Point, radiusX: number, radiusY: number, largeArc: boolean, sweep: boolean,
): void => {
  if (distance(from, to) < EPSILON) return;
  if (Math.abs(radiusX - radiusY) > EPSILON) throw new Error('elliptical arcs are not supported yet');
  if (radiusX < EPSILON) return collector.line(from, to);
  const halfX = (from[0] - to[0]) / 2, halfY = (from[1] - to[1]) / 2;
  const halfChordSquared = halfX ** 2 + halfY ** 2;
  const radius = Math.max(radiusX, Math.sqrt(halfChordSquared)); // too small radii are scaled up
  const sign = largeArc === sweep ? -1 : 1;
  const factor = sign * Math.sqrt(Math.max(0, (radius ** 2 - halfChordSquared) / halfChordSquared));
  const center: Point = [factor * halfY + (from[0] + to[0]) / 2, -factor * halfX + (from[1] + to[1]) / 2];
  const startAngle = Math.atan2(from[1] - center[1], from[0] - center[0]) / DEGREE;
  let sweepAngle = Math.atan2(to[1] - center[1], to[0] - center[0]) / DEGREE - startAngle;
  if (sweep && sweepAngle < 0) sweepAngle += 360;
  if (!sweep && sweepAngle > 0) sweepAngle -= 360;
  collector.arc(center, radius, startAngle, startAngle + sweepAngle);
};

const addPath = (collector: PieceCollector, pathData: string): void => {
  let position = 0;
  const skipSeparators = () => { while (position < pathData.length && /[\s,]/.test(pathData[position])) position++; };
  const readNumber = (): number => {
    skipSeparators();
    const match = /^[-+]?(\d*\.\d+|\d+\.?)([eE][-+]?\d+)?/.exec(pathData.slice(position));
    if (!match) throw new Error(`number expected at ${position} in "${pathData}"`);
    position += match[0].length;
    return Number(match[0]);
  };
  const readFlag = (): boolean => { skipSeparators(); return pathData[position++] === '1'; };

  let current: Point = [0, 0], subpathStart: Point = [0, 0];
  let lastControl: Point | null = null, lastCommand = '';
  while (true) {
    skipSeparators();
    if (position >= pathData.length) break;
    let command = pathData[position];
    if (/[a-zA-Z]/.test(command)) position++;
    else if (lastCommand) command = lastCommand === 'M' ? 'L' : lastCommand === 'm' ? 'l' : lastCommand; // repeated
    else throw new Error(`command expected in "${pathData}"`);
    const relative = command === command.toLowerCase();
    const point = (): Point => {
      const x = readNumber(), y = readNumber();
      return relative ? [current[0] + x, current[1] + y] : [x, y];
    };
    let control: Point | null = null;
    switch (command.toUpperCase()) {
      case 'M':
        collector.endPiece();
        current = subpathStart = point();
        break;
      case 'L': { const to = point(); collector.line(current, to); current = to; break; }
      case 'H': { const x = readNumber(); const to: Point = [relative ? current[0] + x : x, current[1]]; collector.line(current, to); current = to; break; }
      case 'V': { const y = readNumber(); const to: Point = [current[0], relative ? current[1] + y : y]; collector.line(current, to); current = to; break; }
      case 'C': case 'S': {
        const control1: Point = command.toUpperCase() === 'C' ? point()
          : lastControl && /[CcSs]/.test(lastCommand) ? [2 * current[0] - lastControl[0], 2 * current[1] - lastControl[1]] : current;
        const control2 = point(), to = point();
        collector.cubic(current, control1, control2, to);
        control = control2;
        current = to;
        break;
      }
      case 'Q': case 'T': {
        const quadraticControl: Point = command.toUpperCase() === 'Q' ? point()
          : lastControl && /[QqTt]/.test(lastCommand) ? [2 * current[0] - lastControl[0], 2 * current[1] - lastControl[1]] : current;
        const to = point();
        const toCubic = (from: Point) => [from[0] + (2 / 3) * (quadraticControl[0] - from[0]), from[1] + (2 / 3) * (quadraticControl[1] - from[1])] as Point;
        collector.cubic(current, toCubic(current), toCubic(to), to);
        control = quadraticControl;
        current = to;
        break;
      }
      case 'A': {
        const radiusX = readNumber(), radiusY = readNumber();
        readNumber(); // x-axis rotation: irrelevant for circular arcs
        const largeArc = readFlag(), sweep = readFlag();
        const to = point();
        addSvgArc(collector, current, to, radiusX, radiusY, largeArc, sweep);
        current = to;
        break;
      }
      case 'Z':
        collector.line(current, subpathStart);
        current = subpathStart;
        collector.endPiece();
        break;
      default: throw new Error(`unsupported path command ${command}`);
    }
    lastControl = control;
    lastCommand = command;
  }
  collector.endPiece();
};

const addRectangle = (collector: PieceCollector, x: number, y: number, width: number, height: number, cornerRadius: number): void => {
  const radius = Math.min(cornerRadius, width / 2, height / 2);
  const right = x + width, bottom = y + height;
  // clockwise from the top left (after the corner)
  collector.line([x + radius, y], [right - radius, y]);
  collector.arc([right - radius, y + radius], radius, -90, 0);
  collector.line([right, y + radius], [right, bottom - radius]);
  collector.arc([right - radius, bottom - radius], radius, 0, 90);
  collector.line([right - radius, bottom], [x + radius, bottom]);
  collector.arc([x + radius, bottom - radius], radius, 90, 180);
  collector.line([x, bottom - radius], [x, y + radius]);
  collector.arc([x + radius, y + radius], radius, 180, 270);
  collector.endPiece();
};

const importIcon = (svg: string): string[][] => {
  const collector = new PieceCollector();
  for (const [, tagName, attributeText] of svg.matchAll(/<(path|circle|ellipse|line|rect|polyline|polygon)\b([^>]*?)\/?>/g)) {
    const attributes = Object.fromEntries([...attributeText.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, name, value]) => [name, value]));
    const number = (name: string, fallback = 0) => (attributes[name] === undefined ? fallback : Number(attributes[name]));
    switch (tagName) {
      case 'path': addPath(collector, attributes.d); break;
      case 'circle': collector.arc([number('cx'), number('cy')], number('r'), -90, 270); collector.endPiece(); break;
      case 'ellipse': collector.current.push(`...${formatCall('ellipse', [number('cx'), number('cy'), number('rx'), number('ry')])}`); collector.endPiece(); break;
      case 'line': collector.line([number('x1'), number('y1')], [number('x2'), number('y2')]); collector.endPiece(); break;
      case 'rect': {
        const cornerRadius = number('rx', number('ry'));
        if (attributes.ry !== undefined && attributes.rx !== undefined && number('rx') !== number('ry')) throw new Error('rect with rx ≠ ry');
        addRectangle(collector, number('x'), number('y'), number('width'), number('height'), cornerRadius);
        break;
      }
      case 'polyline': case 'polygon': {
        const values = attributes.points.trim().split(/[\s,]+/).map(Number);
        const points = Array.from({ length: values.length / 2 }, (_, index): Point => [values[2 * index], values[2 * index + 1]]);
        if (tagName === 'polygon') points.push(points[0]);
        points.slice(1).forEach((point, index) => collector.line(points[index], point));
        collector.endPiece();
        break;
      }
    }
  }
  return collector.pieces;
};

const iconNames = process.argv.slice(2);
if (!iconNames.length) {
  console.error('usage: node tools/import-lucide.ts <icon> [icon...]');
  process.exit(1);
}
console.log(`// Imported from Lucide ${LUCIDE_VERSION} (ISC, see LICENSE-lucide) by \`node tools/import-lucide.ts ${iconNames.join(' ')}\`.`);
for (const iconName of iconNames) {
  const response = await fetch(`https://unpkg.com/lucide-static@${LUCIDE_VERSION}/icons/${iconName}.svg`);
  if (!response.ok) throw new Error(`${iconName}: HTTP ${response.status}`);
  const pieces = importIcon(await response.text());
  const constantName = iconName.toUpperCase().replace(/-/g, '_');
  console.log(`\n/** Lucide "${iconName}": ${pieces.length} piece${pieces.length === 1 ? '' : 's'}. */`);
  console.log(`const ${constantName}: Stroke[][] = [`);
  for (const piece of pieces) console.log(`  [\n${piece.map((call) => `    ${call},`).join('\n')}\n  ],`);
  console.log('];');
}
