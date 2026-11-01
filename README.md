# morphico

Morphing line-art icons for the web: digits (and later other icon states) that smoothly change from one to another by interpolating SVG path data. No runtime dependencies.

> **Status:** early development (0.x): the API may still change.

## Install

```sh
npm install morphico
```

```ts
import { icon, text, clip, face } from 'morphico';
import { digitsRound } from 'morphico/sets/round';     // every set is its own import
import { iconsWeather } from 'morphico/sets/weather';
```

Every set is a separate file, so a bundler (Vite, webpack, esbuild, Rollup …) only ships the sets and functions a
page uses — e.g. `icon()` with one icon set is about 13–21 KB gzipped, everything about 63 KB. `clip()` and `face()`
bring their own shapes / expressions. To pick sets by name at run time, `import { iconSets } from 'morphico/all'`
(`iconSets.weather` …; this imports every set).

Or from a CDN, as a classic script with the global `morphico` — one file with everything, sets by name in
`morphico.iconSets`:

```html
<script src="https://cdn.jsdelivr.net/npm/morphico"></script>
<script>
  const { icon, text, clip, face, iconSets } = morphico;
  icon(document.querySelector('#weather'), 'sunny', { set: iconSets.weather });
</script>
```

Every layer is created the same way — `layer(element, init, options)`: the element to draw into, what it shows
first, and the settings — and changes with `to()`, which returns a promise. `destroy()` removes it.

## One icon: `icon(element, init, options)`

```ts
import { icon } from 'morphico';
import { digitsRound } from 'morphico/sets/round';

const digit = icon(document.querySelector('#digit'), '4', { set: digitsRound });

await digit.to('7');                          // the promise resolves when the morph ends
digit.to('8', { onEnd: (result) => {} });     // or pass a callback
digit.destroy();                              // stops and removes it (e.g. when a component unmounts)
```

Digit sets: `digitsRound` (`morphico/sets/round`), `digitsSquare` (`/square`), `digitsCondensed` (`/condensed`),
`digitsSlim` (`/slim`), `digitsHandwritten` (`/handwritten`). Their states: `'0'`…`'9'`, `'-'` `'/'` `'.'` `','` `':'`, and `' '` (empty: nothing drawn, shapes grow
out of it and fade). A digit morphing into `-` `/` `.` `,` is pressed flat onto it; into `:` it splits into the two dots.

Icon sets (based on [Lucide](https://lucide.dev)):

| Import from `morphico/sets/…` | States |
| --- | --- |
| `media` → `iconsMedia` | `play`, `pause`, `stop` |
| `menu` → `iconsMenu` | `menu` (☰), `close` (✕), `back` (←) |
| `checkbox` → `iconsCheckbox` | `unchecked` (☐), `checked` (☑), `checked-big` (✓ breaking out of the box) |
| `radio` → `iconsRadio` | `unchecked` (○), `checked` (✓ in a circle), `checked-big` (✓ breaking out of the circle) |
| `folder` → `iconsFolder` | `closed`, `open` |
| `theme` → `iconsTheme` | `light` (sun), `dark` (moon) |
| `weather` → `iconsWeather` | `sunny`, `frosty`, `partly-cloudy`, `showers`, `cloudy`, `thunder`, `rain`, `snow`, `drizzle` |
| `eye` → `iconsEye` | `visible`, `hidden` (slashed) |
| `volume` → `iconsVolume` | `muted` (✕), `low` (no waves), `medium`, `high` |
| `toggle` → `iconsToggle` | `plus`, `minus`, `close` (✕), `check` |
| `lock` → `iconsLock` | `locked`, `unlocked` |
| `bell` → `iconsBell` | `on`, `off` (slashed) |
| `mic` → `iconsMic` | `on`, `off` (slashed) |
| `chevron` → `iconsChevron` | `up`, `right`, `down`, `left` |
| `copy` → `iconsCopy` | `copy`, `copied` (✓) |
| `wifi` → `iconsWifi` | `none`, `low`, `medium`, `high` |
| `battery` → `iconsBattery` | `empty`, `low`, `medium`, `full` |

```ts
import { iconsMedia } from 'morphico/sets/media';

const player = icon(button, 'play', { set: iconsMedia });
player.to('pause');
```

## A line of characters: `text(element, init, options)`

```ts
import { text } from 'morphico';
import { digitsRound } from 'morphico/sets/round';

const clock = text(document.querySelector('#clock'), '04:59', { set: digitsRound });

await clock.to('05:00');   // only the digits that changed morph
clock.destroy();
```

- Supported characters: digits `0`–`9`, space, `-` `:` `.` `,` `/` — all of them morph.
  **Any other character is removed** (with the regex `/[^0-9 :.,\/-]/g`): `'12:09 AM'` shows `12:09 `.
- Cells: digits, space and `-` have one width, `:` `.` `,` half of it, `/` 0.7 of it. A change morphs when the length
  and every cell's width stay the same (`5` ↔ `-`, `.` ↔ `,`); otherwise the line is rebuilt without animation
  (`5` ↔ `:`). Pad counters with spaces to keep them morphing: `counter.to(String(count).padStart(3, ' '))`.
- Digits sit on the text baseline, and every cell has the same width, so clocks don't jiggle.

## A cut-out: `clip(element, init, options)`

Cuts any element (an `<img>`, a `<div>`, a `<main>` …) out by a shape, and morphs, moves, resizes and turns it.

```ts
const photo = clip(document.querySelector('#photo'), 'star', { x: 50, y: 50, size: '80%' });

await photo.to('heart');                                  // morph
photo.to('shield', { rotation: 360, x: 30, size: '120px' }); // morph + turn + move together
photo.to({ x: 70, y: '150px' });                          // move only, the shape stays
photo.to({ rotation: 15, duration: 0 });                  // jump, no animation (e.g. while dragging a slider)
photo.to({ outline: { width: 16 } });                     // only a 16 px band along the edge shows
photo.to({ inverted: true });                             // the other way round: the shape is a hole
photo.destroy();                                          // the element is whole again
```

Shapes (based on [Lucide](https://lucide.dev)): `circle`, `ellipse`, `heart`, `sparkle`, `astroid`, `bookmark`,
`shield`, `moon`, `tag`, `square`, `badge`, `triangle`, `droplet`, `pentagon`, `hexagon`, `octagon`, `squircle`,
`star`, `rectangle-horizontal`, `message-circle`, `message-square`, `cloud`, `puzzle`, `club`. A diamond is the `square`
turned 45°, a portrait rectangle `rectangle-horizontal` turned 90° (`rotation`).

| Option | Default | |
| --- | --- | --- |
| `x`, `y` | `50` | The shape's **centre**. A number is %, or a string `'40%'` / `'120px'` (% of the element's width for `x`, height for `y`) |
| `size` | fits | The side of the shape's square (% of the element's width, or px). The shape keeps its own proportions inside that square. Default: the largest square that fits the element |
| `rotation` | `0` | Degrees, clockwise, **absolute**: `rotation: 360` ends one full turn from 0. The shape turns rigidly, also in a wide or tall element |
| `roundness` | `1` | Corners: `0` = sharp … `1` = the shape's own (the maximum) |
| `outline` | `false` | `{ width, band }`: only a band of `width` px along the edge shows; `band`: `'inside'` (default), `'centre'` or `'outside'` the edge. Not animated |
| `inverted` | `false` | `true`: the other way round — the shape (or band) is a hole, the rest of the element shows. Not animated |
| `duration`, `easing` | `400`, `'easeInOutCubic'` | As for icons; also per `to()` call |

Everything except `outline` and `inverted` (they switch at once) animates together in `to()`; `duration: 0` jumps. How it works: a filled shape uses CSS `clip-path: url(#…)`,
an outlined one `mask: url(#…)` (clip-path has no line width); the `<clipPath>` / `<mask>` sit in a small hidden
`<svg>` that `clip()` adds to the page. It follows the element's size (`ResizeObserver`). Overflow beyond the element is
cut off, as with any clip-path.

## A face: `face(element, init, options)`

A face of 7 soft pieces — 2 brows, 2 eyes, 2 pupils and a mouth — that morphs between feelings and blinks.

```html
<div id="robot" style="width: 160px; height: 160px; border-radius: 50%; background: #e4e2d6; color: #8b8e8e"></div>
```

```ts
import { face } from 'morphico';

const robot = face(document.querySelector('#robot'), 'normal');

await robot.to('smiling');                    // morph
robot.to('angry', { duration: 300 });
robot.blink();                                // close and open the eyes once, on top of any expression
robot.destroy();                              // removes the face, stops blinking
```

Expressions: `normal`, `smiling`, `pleading`, `wonder`, `focused`, `fright`, `angry`, `asleep`, `sad`,
`surprised`, `laughing`, `tired`, `wink-left`, `wink-right`, `suspicious`, `confused`, `smug`, `irritated`,
`bored`, `curious`, `empathetic`, `guilty`, `worried`, `disappointed`, `ashamed`, `embarrassed`, `yearning`,
`triumphant`, `proud`, `excited`, `scornful`, `disgusted` (also exported as `faceExpressionNames`). Any one
morphs into any other. `wink-left` / `wink-right` = the eye that closes, as seen.

| Option | Default | |
| --- | --- | --- |
| `pupilColor` | `'white'` | Colour of the pupils. Brows, eyes and mouth take the CSS `color` |
| `blink` | `true` | Blink by itself every few seconds |
| `size` | `'100%'` | CSS width and height of the face (by default it fills the element) |
| `duration`, `easing` | `500`, `'easeInOutCubic'` | As for icons; also per `to()` call |

The face draws no background: a disc, card or anything else behind it is the element's own CSS. The pupils only show
inside the eyes (an eyelid covers them). With reduced motion the face changes without animation and doesn't blink.

## Options

| Option | For | Default | |
| --- | --- | --- | --- |
| `set` | both | **required** | A set object: a digit set (`digitsRound` …) for `text()`, any set for `icon()` — see above |
| `size` | both | `'1em'` | CSS size (icon: width and height; text: height). `1em` follows the font size |
| `duration` | both | `400` | Milliseconds |
| `easing` | both | `'easeInOutCubic'` | `'linear'`, `'easeInOutCubic'`, `'easeOutBack'`, `'easeOutElastic'`, or a function `(progress) => easedProgress` |
| `strokeWidth` | both | per set | Line width. A number is in grid units (an icon is 24 × 24; digits use about 1.1–1.6, icon sets 1.78) and scales with the size; a CSS length (`'2px'`, `'0.1rem'`, `'0.08em'`) stays that wide at any size |
| `lineCap` | both | per set | `'round'`, `'butt'`, `'square'` |
| `lineJoin` | both | per set | `'round'`, `'miter'`, `'bevel'` |
| `fill` | both | `false` | `true` fills closed shapes with the CSS color, or pass a CSS color |
| `roundness` | icon | `1` | Corner roundness: `0` = sharp … `1` = the icon's own corners (the maximum). Icon sets only |
| `cellWidth` | text | per set | Width of a digit cell in grid units (a digit is 16 high) |
| `spacing` | text | per set | Gap between cells in grid units |

`duration` and `easing` can also be passed to a single `to()` call.

## Behaviour

- **Colour** comes from the CSS `color` (`currentColor`).
- **Spacing** can be set in CSS too: `--morphico-spacing: 0.15em`.
- **Interrupting:** calling `to()` during a morph starts the new morph from the shape on screen.
  The earlier promise resolves with `{ interrupted: true }`; promises never stay pending.
- **Reduced motion:** when the user's system asks for reduced motion, shapes change without animation.
- **Accessibility:** the icon / line has `role="img"` and an `aria-label` with the current value.
- **Server-side rendering:** importing does not touch the DOM; only `icon()` / `text()` / `clip()` / `face()` do.

## Development

Written in TypeScript. Requires Node 24 (it runs the `.ts` tools directly).

```sh
npm install        # dev tools only: typescript, @types/node
npm run dev        # preview page at http://localhost:3003
npm run typecheck
npm run build      # src/ → dist/
```

## License

[MIT](LICENSE). The icon sets and clip shapes are based on [Lucide](https://lucide.dev) icons (ISC; some from Feather, MIT):
see [LICENSE-lucide](LICENSE-lucide).
