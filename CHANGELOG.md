# Changelog

All notable changes to this project are documented here. Versions follow [Semantic Versioning](https://semver.org/):
patch = nicer transitions and fixes, minor = new icon sets or options, major = API changes or a changed resting look of an icon.

## 1.0.0

- First stable release: the API of 0.6.0 is now fixed. From here on, breaking changes only come with a new major
  version.
- Demo and examples: https://morphico.rastiv.dev (linked from the README and the package's homepage).

## 0.6.0

- Digit sets: new symbols `+` `%` `$` `€` `£` for prices and discounts (`text(el, '€39.99', …)`, `'-20%'`), drawn in
  each set's own style. They morph into each other (`$` ↔ `€` ↔ `£`, `-` ↔ `+`) and into digits.
- Every layer's default `duration` is 300 ms (was 400, face 500).
- `clip()`: by default the shape sits in the middle at 70 % of the element's shorter side (was as large as fits).
  Its shape names are exported as `clipShapeNames` with the type `ClipShape` (like `faceExpressionNames` /
  `FaceExpression`): editors suggest them, TypeScript catches typos. The `set` option is gone (only the built-in
  shapes).
- **Breaking (small):** `text().to()` resolves with `{ state, interrupted }` like the other layers (was
  `{ value, interrupted }`; the type `TextResult` is gone, it's `MorphResult`). `ChangeOptions` is now
  `IconChangeOptions`. `IconSet` and `TextLayout` are no longer exported: only the built-in sets are supported.

## 0.5.0

- **Breaking: sets are imported, not named.** Every set is its own import, and `set` takes the set object:
  ```ts
  // before                                  // now
  icon(el, { set: 'weather', state: 'sunny' })  import { iconsWeather } from 'morphico/sets/weather';
                                             icon(el, 'sunny', { set: iconsWeather })
  ```
  Names: `morphico/sets/<name>` exports `digits<Name>` (round, square, condensed, slim, handwritten) or
  `icons<Name>` (media, menu, weather …). `set` is now required for `icon()` and `text()` (it was `'round'`).
  The `iconSets` export (sets by name) moved to `morphico/all`; the classic script (`morphico.js`) keeps everything
  in one file, with `morphico.iconSets`. `IconSetName` moved there too.
- The package now ships ES modules file by file (`dist/esm/`), so bundlers keep only what a page uses: `icon()`
  with one set is about 13–21 KB gzipped instead of 63 KB. `dist/morphico.mjs` is gone (use `morphico` /
  `dist/esm/index.js`).
- **Breaking: every layer is created as `layer(element, init, options)`** — what it shows first is the second
  argument (was the option `state`, or `value` for `text()`), the settings come third, and every change is `to()`:
  ```ts
  icon(el, '4', { set: digitsRound })            text(el, '04:59', { set: digitsRound })
  clip(el, 'star', { x: 50, size: '80%' })       face(el, 'normal', { duration: 300 })
  ```
  `text().set(value)` is now `text().to(value)` (type `SetOptions` → `TextChangeOptions`); `clip().set(changes)` is
  gone — `clip().to({ …changes, duration: 0 })` jumps the same way. The `state` properties of `icon()`, `clip()` and
  `face()` and `text().value` are gone: the page knows what it asked for (the promise of `to()` still resolves with it).
  Passing options second throws an error that explains the new order.

## 0.4.0

- New `face(element, options)`: a face of 7 soft pieces (brows, eyes, pupils, mouth) that morphs between 32
  expressions (`normal`, `smiling`, `angry`, `sad`, `surprised`, `wink-left` …; list in `faceExpressionNames`) and
  blinks — by itself every few seconds (`blink` option) or on `blink()`. Features take the CSS color, pupils
  `pupilColor`.
- `clip()` shapes: new `club` (♣, without its stem). Removed `rectangle-vertical` and `diamond`: use
  `rectangle-horizontal` with `rotation: 90` and `square` with `rotation: 45`.
- `clip()`: new option `inverted` — the shape (or the outlined band) becomes a hole and the rest of the element
  shows.

## 0.3.0

- New `clip(element, options)`: cuts any element out by a morphing shape (25 shapes based on Lucide: circle, heart,
  star, shield, speech bubbles, puzzle …). `to(shape, { x, y, size, rotation, roundness })` morphs, moves, resizes and
  turns together; `to({ … })` moves without changing the shape; `set()` jumps; `outline: { width, band }` shows only a
  band along the edge. Positions are the shape's centre in % or px; the shape stays square (1:1).

## 0.2.0

- The built files carry the full Lucide (ISC) and Feather (MIT) license notices in their header comment;
  `package.json` declares `"license": "MIT AND ISC"` (the code is MIT, the icon data comes from Lucide).
- `-` `/` `.` `,` `:` are morphing states of every digit set (in `icon()` and `text()`); a digit morphs into them by
  being pressed flat onto the line (or split into the two dots of `:`).
- New icon sets (based on Lucide): `eye`, `volume`, `toggle` (plus / minus / close / check), `lock`, `bell`, `mic`,
  `chevron`, `copy`, `wifi`, `battery`.
- New icon set `weather`: `sunny`, `frosty`, `partly-cloudy`, `showers`, `cloudy`, `thunder`, `rain`, `snow`, `drizzle` (based on Lucide).
- New icon set `theme`: `light` (sun), `dark` (moon) (based on Lucide).
- New icon set `folder`: `closed`, `open` (based on Lucide).
- New icon set `radio`: `unchecked`, `checked`, `checked-big` (based on Lucide).
- New icon set `checkbox`: `unchecked`, `checked`, `checked-big` (based on Lucide).
- New icon set `menu`: `menu`, `close`, `back` (based on Lucide).
- New icon set `media`: `play`, `pause`, `stop` (based on Lucide, see LICENSE-lucide).
- Icons can be made of several pieces (e.g. pause = two bars); a piece can appear by being drawn along its path, like
  a pen writing it (the checkbox's check).
- Style options for `icon()` and `text()`: `strokeWidth` (grid units, or a CSS length such as `'2px'` that stays fixed
  at any size), `lineCap`, `lineJoin`, `fill`; `icon()` also `roundness`
  (0 = sharp … 1 = the icon's own corners; icon sets only).

## 0.1.0

- `icon(element, options)`: one morphing icon with `to(state)` and `destroy()`.
- `text(element, options)`: a line of characters with `set(value)` and `destroy()`; only changed digits morph.
- Five digit sets: `round` (default), `square`, `condensed`, `slim`, `handwritten`, each with `0`–`9`, `-` and the
  empty state; `text()` also shows `:` `.` `,` `/`.
- Promises and `onEnd` callbacks, interruptible morphs, reduced-motion support, `aria-label`.

## 0.0.2

- Published by GitHub Actions through npm Trusted Publishing (no token). No public API yet.

## 0.0.1

- Project skeleton and release pipeline test. No public API yet.
