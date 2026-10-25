# morphico

Public library (MIT, npm + jsDelivr), **written in TypeScript**, of morphing line-art icons: states of an icon morph by interpolating SVG `path` data. First release: digits 0–9. Later: semantic sets (weather, on/off, eye, …).

## Hard rules
- **TypeScript everywhere** (library, preview page, tools). Only erasable syntax (`erasableSyntaxOnly`: no enums, namespaces, parameter properties) so Node and the dev server can strip types. Type-only imports as `import type`; relative imports with the `.ts` extension.
- **Descriptive names.** No cryptic short names (`lerp2`, `d`, `a`, `n`, `u`, `k`…): name what the thing is (`interpolatePoint`, `digit`, `path`, `breakpoints`, `startSegment`). Minification happens at build/CDN time.
- **No runtime dependencies.** The published package depends on nothing. Dev dependencies allowed: **only** `typescript` and `@types/node` (agreed 2026-10-25). No linter (Biome was tried and rejected as unneeded complexity), no bundlers, no other tools (not even `npx serve`).
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
  - `sets/v1.ts`, `v2.ts`, `v3.ts` — digit sets (`IconSet`). v1 drawn (see Status), v2/v3 empty (waiting for reference images).
- `icons/v1|v2|v3/<digit>.png` (or jpg/jpeg/webp) — the user's **reference images**. Claude measures them (fits lines/arcs to the ink with a scratch script) and drafts `strokes` from them. Not shipped.
- `index.html` + `preview/main.ts` — preview page (keep it and extend it with new features): set selector (from `ICON_SETS`), digit buttons (dashed = not drawn yet), duration, easing, progress slider, color, auto-play, **grid** (no reference-image overlay: the user found it distracting), debug overlay (segments in colors, control points, start point).
- `tools/` (not published, run directly by Node: `node tools/<name>.ts`):
  - `serve.ts` — `npm run dev` → http://localhost:3003 (`PORT` env to change). Serves `.ts` as JavaScript by stripping types (`node:module` `stripTypeScriptTypes`, prints an "experimental" warning — harmless).
  - `build.ts` — `npm run build`: `tsc -p tsconfig.build.json` → `.build/`, then joins the JS into `dist/morphico.mjs` (ESM) + `dist/morphico.js` (IIFE, global `morphico`), copies declarations to `dist/types/` (rewriting `.ts` → `.js` import paths), smoke-tests both. Joining rules: one-line relative imports, unique top-level names across files, entry exports only via `export const|let|function|class`. Sets will be built later with path data precomputed (one file per set).
  - `check.ts` — optimizer: `node tools/check.ts <set> A B C ...` searches the best pair layouts for A→B, A→C… and prints cost before/after + the entries.
  - `verify.ts` — `node tools/verify.ts <set> [states]` (default all pairs): number count, continuity, shape deviation vs. the default layout (≤ ~0.12 is sampling noise), cost before/after.
  - `shared.ts` — `loadIconSet`, `morphCost`.
- `tsconfig.json` (src + preview, DOM, no Node types) · `tools/tsconfig.json` (extends it, Node types) · `tsconfig.build.json` (emit for the build). `npm run typecheck` checks both.
- `.github/workflows/ci.yml` — on push to `main` and on pull requests: `npm ci` → typecheck → build.
- `.github/workflows/publish.yml` — on tag `v*`: runs `ci.yml` first, then checks tag = package.json version, `npm publish` (its `prepublishOnly` runs typecheck + build) via npm Trusted Publishing (OIDC). `NPM_TOKEN` secret only for the very first publish, deleted afterwards.
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

## Status: v1 (2026-10-25)
- Geometric sans digits fitted from `icons/v1/*.png`: 12 segments, stroke 1.2 (images: 1.6), round ends + round corners (user choice; open ends pulled in by half a stroke so the outline matches the flat-ended images). Shared geometry: big circle r 4.4 (2, 3, 6, 8, 9), small r 3.6 (top of 3 and 8, touching at 12,11.2), 3 = right half of 8's circles, 9 = 6 turned 180°, 2's bowl = 9's circle, 0 = ellipse 5.05 × 8.
- Tuned pairs (`pairLayouts`, alternative tracings `8-like-0`, `8-two-loops`, `8-mirrored`, `8-from-right`, `6-clockwise`): 0→1…5, 0→7, 0→8, 0→9 (user's start points), 3→8, 4→8, 5→6, 5→8, 5→9 (user's arrows), 2→4, 3→4, 3→6, 4→5, 4→6, 4→7, 6→7 (optimizer). Spins: 6↔9 (pure, cost 0), 8↔9, 2↔6.
- Confirmed good by the user: 6→7; with the default pairing 0→6, 1→2, 1→3, 1→5, 1→7, 2→3, 2→7, 2→8, 3→5, 3→7, 6→8, 7→8, 7→9 (leave untouched). 1→9 "relatively good" → optimizer refinement; 1→4, 1→6, 1→8, 2→5, 2→9, 3→9, 5→7 improved on request (optimizer). Others are waiting for the user's visual check.
- First rating round complete (all 45 pairs). Next: user re-checks the changed pairs. Unclear: the user wrote "2 → 6 try to improve" in the list where 1 → 6 belonged — 1→6 was improved; ask about 2→6 (spin) if it comes up.
- Decided: round ends/corners; 0 and 8 equal height (both y 4…20); text cell width 10, spacing 4.

## Status: v2 (2026-10-25)
- Rounded-square "techno" digits from `icons/v2/*.png` (tiny images: 28 px tall, 4 px stroke). Shapes are written in image pixels and converted (1.5 px = 1 unit, `fromImage`), built with `roundedPolyline` (geometry.ts: lines + tangent corner arcs). 20 segments (the 8 needs 16 strokes), stroke 1.6 (images: 4/1.5 ≈ 2.67; thinned on the user's request), round ends/corners.
- Corner radii chosen by pixel comparison with the images (scratch script: redraw at image size, count differing pixels; all digits within ~2–10 %, rest is image anti-aliasing). Bowls of 3 and 5 are exact half-circles (radius = half the bowl height — a larger radius would make corners overlap). 0 = stadium.
- T-junctions drawn out and back: 1's foot, 3's middle bar, 4's crossbar overhang + lower right stem.
- 9 = 6 turned 180° (points turned + reversed); `pairLayouts[9][6]` mirrors the 6's segment split → pure spin (cost 0).
- Rated: 0→4, 0→6, 1→2…1→8, 2→3, 2→5, 2→7, 2→8, 3→5, 3→7, 4→5, 4→6, 5→7 good (default, leave untouched), 6→9 good (pure spin); 1→9, 2→4, 2→6, 3→4, 3→6, 3→9, 4→7, 4→8, 4→9, 5→6, 5→8, 5→9, 6→7, 6→8, 7→8, 8→9 midd and 2→9, 3→8 bad → optimizer fits (3→8: the user wrote "3 - 6 bad" a second time, read as 3→8 — now uses the user's idea, tracing `8-like-3`); 0→8 uses the user's idea (tracing `8-like-0`); 0→1, 0→2, 0→3, 0→5, 0→7, 0→8, 0→9 were bad/midd → optimizer fits added (waiting for the user's re-check). 7→9 good (default). First rating round complete (all 45 pairs); next: user re-checks the changed pairs.

## Status: v3 (2026-10-25)
- Tall, narrow, thin "display" digits from `icons/v3/*.png` (94 px tall, 6 px stroke, 50 px wide; 5.5 px = 1 unit → x 8…16, y 4…20). Written in image pixels (`fromImage`), middle lines at x 3/47, y 3/47/91; built with `roundedPolyline`. 20 segments (8 needs 16 strokes), stroke 6/5.5 ≈ 1.09, round ends/corners.
- Pixel comparison picked one corner radius for (almost) everything: 12 px; the 3's bowls 16 px, its middle bar ends at x 15. All digits within ~1.6–6 % of the images.
- 0 = stadium (drawn full height; the image's 0 looks 2 px shorter only because its round tips are anti-aliased), 8 = two stacked boxes sharing the middle bar, 9 = 6 turned 180° (`pairLayouts[9][6]` mirrored → pure spin, cost 0), the 5 ends with the 9's small upturn, 4's right stem drawn up and back down.
- Rated: 0→6, 1→2…1→9, 2→3, 2→4, 2→5, 2→7, 2→8, 3→5, 3→6, 3→7, 4→5, 4→7, 5→6, 5→7, 5→9, 6→7, 7→9 good (default, leave untouched), 6→9 good (pure spin); 0→1, 0→2, 0→4, 0→5, 0→7, 2→6, 2→9, 3→4, 3→9, 4→6, 4→9, 5→8, 6→8, 7→8, 8→9 midd and 0→3, 0→8, 0→9, 3→8, 4→8 bad → optimizer fits (0→8 with the 8 traced like the 0, `8-like-0`; 3→8 like the 3, `8-like-3`). First rating round complete (all 45 pairs); next: user re-checks the changed pairs.

## Library plan (agreed 2026-10-25)
- **API:** Layer 1 `icon(el, opts)` → `.to(state)`; Layer 2 `text(el, opts)` → `.set('04:59')` (only changed digits morph, separators static, "empty" digit state); Layer 3 `countdown()` maybe later as a separate file. No custom elements. `destroy()` for frameworks. `to()`/`set()` return a Promise **and** accept `onEnd`; interrupted morphs resolve (e.g. `{ interrupted: true }`), never hang.
- **Text cells (agreed 2026-10-25):** characters reuse the same 24×24 path data; only the `viewBox` is narrowed to a cell (`viewBox="12-w/2 3 w 18"`, svg width = w·size/18, so no squashing). `text()` options: `cellWidth` (default from the set, v1 = 10 with spacing 4 — chosen by the user), `spacing` (also via CSS variable e.g. `--morphico-spacing`), colon cell ≈ 5 with dots at the 8's circle centres (y 7.6 / 15.6). Later maybe `figures: 'tabular' | 'proportional'` (tabular default — clocks must not jiggle). The preview page has a text line to try this.
- **Requirements:** CSS inheritance (`currentColor`, em sizing); accessibility (`prefers-reduced-motion` → jump, `aria-label` kept in sync); SSR-safe; size budget 5–10 KB gzipped; one shared rAF loop.
- **Semver:** patch = nicer transitions/fixes, minor = new sets/options, major = API change or changed resting look of an icon. Keep `CHANGELOG.md` updated.
- **Git:** work on `main` until 1.0.0; after that branch → PR → merge. The demo site is a separate React/TS repo using the published package.

## Release pipeline (working since 2026-10-25)
- Repo https://github.com/rastiv/morphico (public, SSH remote). npm package `morphico`, owner `rastiv`.
- 0.0.1: first publish via CI with a one-time granular token (npm first creates a placeholder `0.0.0-stage` for new packages — harmless, it stays in the version list). 0.0.2: published via Trusted Publishing (OIDC), with provenance. The token secret is deleted from GitHub.
- Trusted Publisher on npmjs.com: GitHub Actions, `rastiv/morphico`, `publish.yml`, "Allow npm publish" ticked (direct publish, no staging approval). Nothing to renew (no stored secret; validated connections don't expire). It breaks only if the repo is renamed/moved or `publish.yml` is renamed → then update the Trusted Publisher on npmjs.com to match.
- **How to release:** bump `version` in package.json (`npm version X.Y.Z --no-git-tag-version`), add a CHANGELOG entry, commit + push, wait for CI, then `git tag -a vX.Y.Z -m ...` + `git push origin vX.Y.Z`. jsDelivr may cache a "not found" if checked before publish → `https://purge.jsdelivr.net/npm/morphico@X.Y.Z/<file>`.
- The user is new to CI/CD and npm security: go one step at a time, explain before acting.
