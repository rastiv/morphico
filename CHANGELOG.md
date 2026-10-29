# Changelog

All notable changes to this project are documented here. Versions follow [Semantic Versioning](https://semver.org/):
patch = nicer transitions and fixes, minor = new icon sets or options, major = API changes or a changed resting look of an icon.

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
