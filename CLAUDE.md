# morphico

Public library (MIT, npm + jsDelivr), **written in TypeScript**, of morphing line-art icons: states of an icon morph by interpolating SVG `path` data. First release: digits 0–9. Later: semantic sets (weather, on/off, eye, …).

## Hard rules
- **TypeScript everywhere** (library, preview page, tools). Only erasable syntax (`erasableSyntaxOnly`: no enums, namespaces, parameter properties) so Node and the dev server can strip types. Type-only imports as `import type`; relative imports with the `.ts` extension.
- **Descriptive names.** No cryptic short names (`lerp2`, `d`, `a`, `n`, `u`, `k`…): name what the thing is (`interpolatePoint`, `digit`, `path`, `breakpoints`, `startSegment`). Minification happens at build/CDN time.
- **No runtime dependencies.** The published package depends on nothing. Dev dependencies allowed: **only** `typescript` and `@types/node` (agreed 2026-10-25). No bundlers, no other tools (not even `npx serve`).
- Python is **not** installed on this machine; Node v24 is.
- **No SVG files as source.** Source of truth = TS geometry (`strokes`) + tuning (`pairLayouts`, `spins`, `alternativeStrokes`) in `src/sets/`.
- **Icon licenses:** only own drawings or MIT/ISC sources (Lucide + Feather approved: one credit line in the JS header + Lucide LICENSE text). No CC BY sources.
- The user is not a designer: Claude drafts geometry, the user judges by eye.

## Files
- `src/` — the library (no DOM access at import → SSR-safe).
  - `index.ts` — public API entry (for now only `version`; build replaces `'dev'` with the package version).
  - `types.ts` — `Point`, `CubicSegment`, `PathNumbers`, `Stroke` (line/arc/cubic), `PairLayout`, `IconSet` — the set format is documented here.
  - `geometry.ts` — stroke helpers `line`, `arc`, `cubic`, `pointOnCircle`; `strokePiece`, `layoutStrokes`, `defaultBreakpoints`, `reorderSegments`, `rotateAroundCenter`, `toPathData`, `defaultShapes(iconSet)`, `shapeForPair(iconSet, shapes, state, otherState)`.
  - `engine.ts` — `easings` + one shared rAF loop (`animate(onFrame)`, idle when nothing moves).
  - `sets/v1.ts`, `v2.ts`, `v3.ts` — digit sets (`IconSet`). Currently empty: being redrawn from scratch.
- `icons/v1|v2|v3/<digit>.png` (or jpg/jpeg/webp) — the user's **reference images**. Claude drafts `strokes` from them. Not shipped.
- `index.html` + `preview/main.ts` — preview page (keep it and extend it with new features): set selector (from `ICON_SETS`), digit buttons (dashed = not drawn yet), duration, easing, progress slider, color, **reference image opacity**, auto-play, **grid**, debug overlay (segments in colors, control points, start point).
- `tools/` (not published, run directly by Node: `node tools/<name>.ts`):
  - `serve.ts` — `npm run dev` → http://localhost:3003 (`PORT` env to change). Serves `.ts` as JavaScript by stripping types (`node:module` `stripTypeScriptTypes`, prints an "experimental" warning — harmless).
  - `build.ts` — `npm run build`: `tsc -p tsconfig.build.json` → `.build/`, then joins the JS into `dist/morphico.mjs` (ESM) + `dist/morphico.js` (IIFE, global `morphico`), copies declarations to `dist/types/` (rewriting `.ts` → `.js` import paths), smoke-tests both. Joining rules: one-line relative imports, unique top-level names across files, entry exports only via `export const|let|function|class`. Sets will be built later with path data precomputed (one file per set).
  - `check.ts` — optimizer: `node tools/check.ts <set> A B C ...` searches the best pair layouts for A→B, A→C… and prints cost before/after + the entries.
  - `verify.ts` — `node tools/verify.ts <set> [states]` (default all pairs): number count, continuity, shape deviation vs. the default layout (≤ ~0.12 is sampling noise), cost before/after.
  - `shared.ts` — `loadIconSet`, `morphCost`.
- `tsconfig.json` (src + preview, DOM, no Node types) · `tools/tsconfig.json` (extends it, Node types) · `tsconfig.build.json` (emit for the build). `npm run typecheck` checks both.
- `.github/workflows/publish.yml` — on tag `v*`: check tag = package.json version, `npm ci`, `npm publish` (its `prepublishOnly` runs typecheck + build) via npm Trusted Publishing (OIDC, no token).
- `package.json` — `"type": "module"`, exports `dist/morphico.mjs` + `dist/types/index.d.ts`, `jsdelivr`/`unpkg` → `dist/morphico.js`, `files: ["dist"]`. `dist/` and `.build/` are git-ignored.

## The morphing contract
Within a set every state's path is `M x y` + **exactly `segmentCount` cubic segments**. Same structure ⇒ any two states interpolate number by number.
- `strokes` = one continuous line per state, in writing order. Arcs are split into ≤ 90° cubics (handle = 4/3·tan(θ/4)·r), lines become cubics with controls at 1/3, 2/3.
- `defaultBreakpoints` spreads the segments over the strokes by length (arcs ≥ 1 segment per 90°). `segmentCount` must cover the state with the most strokes.
- The default pairing (segment i ↔ segment i) is bad for many pairs, so each pair can lay out each side differently **without changing how it looks** (`pairLayouts[state][otherState]`: `startSegment` for closed loops, `reversed`, `breakpoints` along the strokes, `tracing` = alternative strokes, `rotation`). `spins[from][to]` = morph by rotating around 12,12 while blending.
- Breakpoint rules: a segment never spans two strokes; arc segments ≤ 90° (a 180° single cubic is ~1px off at 360px).
- Cost metric (tools): sum of squared differences of all numbers (not comparable between sets). A guide only — the user's visual rating wins.

## Lessons from the first sets (archived, redrawn from scratch now)
- Tricks that helped: one continuous stroke per digit (merge subpaths; go up a stem and back down over it; draw a stub bar out and back); closed loops (0, 8) can start anywhere (`startSegment`); an 8 can be traced in different orders with the same look (`tracing`: both loops clockwise, or in the order of the 3); a 9 drawn as exactly a 6 turned 180° makes 6↔9 a pure spin; 8 is 180°-symmetric (`rotation`).
- Hard pairs: shapes whose arcs open on opposite sides (2→6, 3→6); digits that use every segment leave no room for re-layout. More segments = more freedom (8 was limiting; 12–16 worked better).
- Workflow: user rates transitions (Good / Midd / Bad) → `tools/check.ts` for non-Good pairs → add `pairLayouts` entries (leave Good pairs untouched) → `tools/verify.ts` → user re-checks. Look for symmetries first. Run `check.ts` with the closed shape second (only the second gets start segments). Alternative tracings aren't searched automatically.

## Library plan (agreed 2026-10-25)
- **API:** Layer 1 `icon(el, opts)` → `.to(state)`; Layer 2 `text(el, opts)` → `.set('04:59')` (only changed digits morph, separators static, "empty" digit state); Layer 3 `countdown()` maybe later as a separate file. No custom elements. `destroy()` for frameworks. `to()`/`set()` return a Promise **and** accept `onEnd`; interrupted morphs resolve (e.g. `{ interrupted: true }`), never hang.
- **Requirements:** CSS inheritance (`currentColor`, em sizing); accessibility (`prefers-reduced-motion` → jump, `aria-label` kept in sync); SSR-safe; size budget 5–10 KB gzipped; one shared rAF loop.
- **Semver:** patch = nicer transitions/fixes, minor = new sets/options, major = API change or changed resting look of an icon. Keep `CHANGELOG.md` updated.
- **Git:** work on `main` until 1.0.0; after that branch → PR → merge. The demo site is a separate React/TS repo using the published package.

## Release pipeline test (in progress)
1. ✅ Skeleton, `package.json` 0.0.1 (npm name `morphico` was free on 2026-10-25).
2. ✅ GitHub repo https://github.com/rastiv/morphico (public), `repository` in package.json (needed for provenance), LICENSE holder Raycho Ivanov.
3. User publishes 0.0.1 by hand (`npm publish`), then sets up Trusted Publishing on npmjs.com (repo + `publish.yml`).
4. Bump to 0.0.2, push tag `v0.0.2` → Actions publishes → check `https://cdn.jsdelivr.net/npm/morphico@0.0.2/`.
