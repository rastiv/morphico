// Builds dist/ from src/: `npm run build` (also runs before every npm publish).
//   1. tsc compiles src/ to JavaScript + declarations in .build/ (tsconfig.build.json)
//   2. the JavaScript is joined into single files, no bundler needed:
//        dist/morphico.mjs   ES module
//        dist/morphico.js    classic script, global `morphico` (jsDelivr serves .min.js automatically)
//   3. declarations are copied to dist/types/
//   4. smoke test: both files load and expose the same names
// Source rules that keep the joining simple: relative imports on one line (`import { a } from './x.ts';`),
// type-only imports as `import type`, top-level names unique across files, the entry exports only via
// `export const|let|function|class`.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

process.chdir(path.resolve(import.meta.dirname, '..'));
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as { version: string; license: string };
const COMPILED = '.build';
const RELATIVE_IMPORT = /^import\s*\{[^}]*\}\s*from\s*'(\.[^']+\.js)';[ \t]*\r?\n?/gm;

fs.rmSync(COMPILED, { recursive: true, force: true });
fs.rmSync('dist', { recursive: true, force: true });
execFileSync(process.execPath, [path.join('node_modules', 'typescript', 'bin', 'tsc'), '-p', 'tsconfig.build.json'], { stdio: 'inherit' });

// the entry and everything it imports, dependencies first
const modules: { file: string; code: string }[] = [];
const collect = (file: string): void => {
  if (modules.some((collected) => collected.file === file)) return;
  const code = fs.readFileSync(file, 'utf8');
  for (const [, importPath] of code.matchAll(RELATIVE_IMPORT)) collect(path.join(path.dirname(file), importPath));
  modules.push({ file, code });
};
collect(path.join(COMPILED, 'index.js'));

const exportedNames = [...modules[modules.length - 1].code.matchAll(/^export\s+(?:const|let|function\*?|class)\s+([\w$]+)/gm)]
  .map((match) => match[1]);
const body = modules.map(({ file, code }) => {
  const joinable = code.replace(RELATIVE_IMPORT, '').replace(/^export\s+(?=const|let|function|class)/gm, '').trim();
  const leftover = joinable.match(/^\s*(import|export)\b.*/m);
  if (leftover) throw new Error(`${file}: statement build.ts cannot join: ${leftover[0]}`);
  return `// ${path.relative(COMPILED, file).replace(/\\/g, '/').replace(/\.js$/, '.ts')}\n${joinable}`;
}).join('\n\n').replace(/(const version = )'dev'/, `$1'${packageJson.version}'`);

const banner = `/*! morphico v${packageJson.version} | ${packageJson.license} License */\n`;
const exportList = exportedNames.join(', ');
fs.mkdirSync('dist');
fs.writeFileSync('dist/morphico.mjs', `${banner}${body}\n\nexport { ${exportList} };\n`);
fs.writeFileSync('dist/morphico.js', `${banner}var morphico = (function () {\n'use strict';\n${body}\n\nreturn { ${exportList} };\n})();\n`);
// declarations: tsc keeps the `.ts` import paths there, published files need `.js`
for (const file of fs.readdirSync(COMPILED, { recursive: true }) as string[]) {
  if (!file.endsWith('.d.ts')) continue;
  const declarations = fs.readFileSync(path.join(COMPILED, file), 'utf8').replace(/(from\s*'\.[^']+)\.ts'/g, "$1.js'");
  fs.mkdirSync(path.dirname(path.join('dist/types', file)), { recursive: true });
  fs.writeFileSync(path.join('dist/types', file), declarations);
}
fs.rmSync(COMPILED, { recursive: true, force: true });

// smoke test
const esModule = await import(pathToFileURL(path.resolve('dist/morphico.mjs')).href) as Record<string, unknown>;
const classicScript = new Function(`${fs.readFileSync('dist/morphico.js', 'utf8')}\nreturn morphico;`)() as Record<string, unknown>;
for (const library of [esModule, classicScript]) {
  if (library.version !== packageJson.version) throw new Error(`built version ${library.version} ≠ package.json ${packageJson.version}`);
  const missing = exportedNames.filter((name) => !(name in library));
  if (missing.length) throw new Error(`missing exports: ${missing.join(', ')}`);
}
console.log(`built morphico v${packageJson.version}: ${exportList}`);
for (const file of fs.readdirSync('dist', { recursive: true }) as string[]) {
  const stats = fs.statSync(path.join('dist', file));
  if (stats.isFile()) console.log(`  dist/${file.replace(/\\/g, '/')}  ${stats.size} B`);
}
