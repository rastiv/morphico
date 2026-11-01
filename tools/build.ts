// Builds dist/ from src/: `npm run build` (also runs before every npm publish).
//   1. tsc compiles src/ to JavaScript + declarations in .build/ (tsconfig.build.json)
//   2. dist/esm/        ES modules, one file per source file (`morphico`, `morphico/all`, `morphico/sets/<name>`):
//                       a bundler keeps only what a page imports
//   3. dist/morphico.js classic script, global `morphico`: everything joined into one file, no bundler needed
//                       (src/index.ts + src/all.ts, so `morphico.iconSets` names every set; jsDelivr serves .min.js)
//   4. dist/types/      declarations
//   5. checks: package.json has an import path for every set; smoke test of the ES modules and the classic script
// For the classic script every file except the entry is wrapped in its own scope, so only exported names must be unique
// across files. Source rules that keep the joining simple: relative imports on one line (`import { a } from './x.ts';`),
// type-only imports as `import type`, exports only via `export const|let|function|class`; the entry may also
// re-export with `export { a } from './x.ts';`.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

process.chdir(path.resolve(import.meta.dirname, '..'));
interface PackageJson { version: string; exports: Record<string, { types: string; default: string }> }
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8')) as PackageJson;
const COMPILED = '.build';
const RELATIVE_IMPORT = /^(import|export)\s*\{([^}]*)\}\s*from\s*'(\.[^']+\.js)';[ \t]*\r?\n?/gm;
const DECLARED_EXPORT = /^export\s+(?:const|let|function\*?|class)\s+([\w$]+)/gm;
const DEV_VERSION = /(const version = )'dev'/;
const declaredExports = (code: string): string[] => [...code.matchAll(DECLARED_EXPORT)].map((match) => match[1]);
const withVersion = (code: string): string => code.replace(DEV_VERSION, `$1'${packageJson.version}'`);

fs.rmSync(COMPILED, { recursive: true, force: true });
fs.rmSync('dist', { recursive: true, force: true });
execFileSync(process.execPath, [path.join('node_modules', 'typescript', 'bin', 'tsc'), '-p', 'tsconfig.build.json'], { stdio: 'inherit' });
const compiledFiles = (fs.readdirSync(COMPILED, { recursive: true }) as string[]).map((file) => file.replace(/\\/g, '/'));

// ---- license banner ----

// The icons come from Lucide (ISC) and, through Lucide, Feather (MIT): both licenses ask for their notice in every copy,
// so the banner carries them in full (`/*!` comments survive minifiers) — taken verbatim from LICENSE-lucide, without
// its list of the Feather icons.
const [lucideNotice, featherPart] = fs.readFileSync('LICENSE-lucide', 'utf8').split(/^---$/m).map((part) => part.trim());
const featherNotice = featherPart.slice(featherPart.indexOf('The MIT License'))
  .replace('(for the icons listed above)', '(for the Lucide icons derived from Feather, listed in LICENSE-lucide)');
if (!lucideNotice.startsWith('ISC License') || !featherNotice.includes('Cole Bemis')) {
  throw new Error('LICENSE-lucide: unexpected layout (the banner copies its two notices)');
}
const banner = `/*! morphico v${packageJson.version} | code: MIT License, Copyright (c) 2026 Raycho Ivanov (see LICENSE)
 * Icons based on Lucide (https://lucide.dev), some of them from Feather (https://feathericons.com):
 *
${[lucideNotice, featherNotice].join('\n\n').split('\n').map((line) => (line ? ` * ${line}` : ' *')).join('\n')}
 */\n`;
const shortBanner = `/*! morphico v${packageJson.version} | MIT License, Copyright (c) 2026 Raycho Ivanov (see LICENSE) */\n`;

// ---- ES modules: one file per source file ----

// files with Lucide-based drawings (and the entry) carry the full banner, the others a short one
const hasLucideDrawings = (code: string): boolean => /lucide/i.test(code);
for (const file of compiledFiles.filter((name) => name.endsWith('.js'))) {
  const code = withVersion(fs.readFileSync(path.join(COMPILED, file), 'utf8'));
  const target = path.join('dist/esm', file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${file === 'index.js' || hasLucideDrawings(code) ? banner : shortBanner}${code}`);
}

// ---- classic script: index + all joined, dependencies first ----

const modules: { file: string; code: string }[] = [];
const collect = (file: string): void => {
  if (modules.some((collected) => collected.file === file)) return;
  const code = fs.readFileSync(file, 'utf8');
  for (const [, , , importPath] of code.matchAll(RELATIVE_IMPORT)) collect(path.join(path.dirname(file), importPath));
  modules.push({ file, code });
};
const entryFile = path.join(COMPILED, 'index.js');
collect(entryFile);
collect(path.join(COMPILED, 'all.js'));

const entry = modules.find(({ file }) => file === entryFile)!;
const reExportedNames = [...entry.code.matchAll(RELATIVE_IMPORT)]
  .filter(([, keyword]) => keyword === 'export')
  .flatMap(([, , names]) => names.split(',').map((name) => name.trim()).filter(Boolean));
const allModule = modules.find(({ file }) => file === path.join(COMPILED, 'all.js'))!;
const exportedNames = [...reExportedNames, ...declaredExports(entry.code), ...declaredExports(allModule.code)];
const body = withVersion(modules.map(({ file, code }) => {
  const joinable = code.replace(RELATIVE_IMPORT, '').replace(/^export\s+(?=const|let|function|class)/gm, '').trim();
  const leftover = joinable.match(/^\s*(import|export)\b.*/m);
  if (leftover) throw new Error(`${file}: statement build.ts cannot join: ${leftover[0]}`);
  const heading = `// ${path.relative(COMPILED, file).replace(/\\/g, '/').replace(/\.js$/, '.ts')}`;
  if (file === entry.file) return `${heading}\n${joinable}`;
  // a scope of its own: helpers with the same name in two files don't clash
  const names = declaredExports(code).join(', ');
  return `${heading}\nconst { ${names} } = (() => {\n${joinable}\nreturn { ${names} };\n})();`;
}).join('\n\n'));
const exportList = exportedNames.join(', ');
fs.writeFileSync('dist/morphico.js', `${banner}var morphico = (function () {\n'use strict';\n${body}\n\nreturn { ${exportList} };\n})();\n`);

// ---- declarations: tsc keeps the `.ts` import paths there, published files need `.js` ----

for (const file of compiledFiles.filter((name) => name.endsWith('.d.ts'))) {
  const declarations = fs.readFileSync(path.join(COMPILED, file), 'utf8').replace(/(from\s*'\.[^']+)\.ts'/g, "$1.js'");
  fs.mkdirSync(path.dirname(path.join('dist/types', file)), { recursive: true });
  fs.writeFileSync(path.join('dist/types', file), declarations);
}
fs.rmSync(COMPILED, { recursive: true, force: true });

// ---- checks ----

const importUrl = (file: string): string => pathToFileURL(path.resolve(file)).href;
const allSets = (await import(importUrl('dist/esm/all.js')) as { iconSets: Record<string, unknown> }).iconSets;
// every set has its import path (`morphico/sets/<name>`), and every path points at built files
const setPaths = Object.keys(packageJson.exports).filter((key) => key.startsWith('./sets/'));
const missingPaths = Object.keys(allSets).filter((name) => !setPaths.includes(`./sets/${name}`));
if (missingPaths.length) throw new Error(`package.json exports: no path for the sets ${missingPaths.join(', ')}`);
for (const [key, { types, default: file }] of Object.entries(packageJson.exports)) {
  for (const target of [types, file]) if (!fs.existsSync(target)) throw new Error(`package.json exports "${key}": ${target} not built`);
  if (key.startsWith('./sets/')) {
    const setModule = await import(importUrl(file)) as Record<string, unknown>;
    if (!Object.values(setModule).includes(allSets[key.slice('./sets/'.length)])) throw new Error(`${file} does not export the set "${key}"`);
  }
}
const esModule = await import(importUrl('dist/esm/index.js')) as Record<string, unknown>;
const classicScript = new Function(`${fs.readFileSync('dist/morphico.js', 'utf8')}\nreturn morphico;`)() as Record<string, unknown>;
for (const [library, names] of [[esModule, exportedNames.filter((name) => name !== 'iconSets')], [classicScript, exportedNames]] as const) {
  if (library.version !== packageJson.version) throw new Error(`built version ${library.version} ≠ package.json ${packageJson.version}`);
  const missing = names.filter((name) => !(name in library));
  if (missing.length) throw new Error(`missing exports: ${missing.join(', ')}`);
}
console.log(`built morphico v${packageJson.version}: ${exportList}`);
for (const file of ['dist/morphico.js', 'dist/esm/index.js']) console.log(`  ${file}  ${fs.statSync(file).size} B`);
console.log(`  dist/esm/: ${fs.readdirSync('dist/esm', { recursive: true }).length} files, dist/types/: ${fs.readdirSync('dist/types', { recursive: true }).length} files`);
