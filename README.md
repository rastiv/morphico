# morphico

Morphing line-art icons for the web: digits (and later other icon states) that smoothly change from one to another by interpolating SVG path data. No runtime dependencies.

> **Status:** early development (0.x): the API may still change.

## Install

```sh
npm install morphico
```

```ts
import { icon, text } from 'morphico';
```

Or from a CDN, as a classic script with the global `morphico`:

```html
<script src="https://cdn.jsdelivr.net/npm/morphico"></script>
<script>
  const { icon, text, clip } = morphico;
</script>
```

## One icon: `icon(element, options)`

```ts
const digit = icon(document.querySelector('#digit'), { state: '4' });

await digit.to('7');                          // the promise resolves when the morph ends
digit.to('8', { onEnd: (result) => {} });     // or pass a callback
digit.destroy();                              // stops and removes it (e.g. when a component unmounts)
```

States of the digit sets: `'0'`…`'9'`, `'-'` `'/'` `'.'` `','` `':'`, and `' '` (empty: nothing drawn, shapes grow
out of it and fade). A digit morphing into `-` `/` `.` `,` is pressed flat onto it; into `:` it splits into the two dots.

Icon sets (based on [Lucide](https://lucide.dev)):

| Set | States |
| --- | --- |
| `media` | `play`, `pause`, `stop` |
| `menu` | `menu` (☰), `close` (✕), `back` (←) |
| `checkbox` | `unchecked` (☐), `checked` (☑), `checked-big` (✓ breaking out of the box) |
| `radio` | `unchecked` (○), `checked` (✓ in a circle), `checked-big` (✓ breaking out of the circle) |
| `folder` | `closed`, `open` |
| `theme` | `light` (sun), `dark` (moon) |
| `weather` | `sunny`, `frosty`, `partly-cloudy`, `showers`, `cloudy`, `thunder`, `rain`, `snow`, `drizzle` |
| `eye` | `visible`, `hidden` (slashed) |
| `volume` | `muted` (✕), `low` (no waves), `medium`, `high` |
| `toggle` | `plus`, `minus`, `close` (✕), `check` |
| `lock` | `locked`, `unlocked` |
| `bell` | `on`, `off` (slashed) |
| `mic` | `on`, `off` (slashed) |
| `chevron` | `up`, `right`, `down`, `left` |
| `copy` | `copy`, `copied` (✓) |
| `wifi` | `none`, `low`, `medium`, `high` |
| `battery` | `empty`, `low`, `medium`, `full` |

```ts
const player = icon(button, { set: 'media', state: 'play' });
player.to('pause');
```

## A line of characters: `text(element, options)`

```ts
const clock = text(document.querySelector('#clock'), { value: '04:59' });

clock.set('05:00');   // only the digits that changed morph
clock.destroy();
```

- Supported characters: digits `0`–`9`, space, `-` `:` `.` `,` `/` — all of them morph.
  **Any other character is removed** (with the regex `/[^0-9 :.,\/-]/g`): `'12:09 AM'` shows `12:09 `.
- Cells: digits, space and `-` have one width, `:` `.` `,` half of it, `/` 0.7 of it. A change morphs when the length
  and every cell's width stay the same (`5` ↔ `-`, `.` ↔ `,`); otherwise the line is rebuilt without animation
  (`5` ↔ `:`). Pad counters with spaces to keep them morphing: `counter.set(String(count).padStart(3, ' '))`.
- Digits sit on the text baseline, and every cell has the same width, so clocks don't jiggle.

## A cut-out: `clip(element, options)`

Cuts any element (an `<img>`, a `<div>`, a `<main>` …) out by a shape, and morphs, moves, resizes and turns it.

```ts
const photo = clip(document.querySelector('#photo'), { state: 'star', x: 50, y: 50, size: '80%' });

await photo.to('heart');                                  // morph
photo.to('shield', { rotation: 360, x: 30, size: '120px' }); // morph + turn + move together
photo.to({ x: 70, y: '150px' });                          // move only, the shape stays
photo.set({ rotation: 15 });                              // jump, no animation (e.g. while dragging a slider)
photo.set({ outline: { width: 16 } });                    // only a 16 px band along the edge shows
photo.destroy();                                          // the element is whole again
```

Shapes (based on [Lucide](https://lucide.dev)): `circle`, `ellipse`, `heart`, `sparkle`, `astroid`, `bookmark`,
`shield`, `moon`, `tag`, `square`, `badge`, `triangle`, `droplet`, `pentagon`, `hexagon`, `octagon`, `squircle`,
`star`, `rectangle-horizontal`, `rectangle-vertical`, `message-circle`, `message-square`, `diamond`, `cloud`, `puzzle`.

| Option | Default | |
| --- | --- | --- |
| `state` | `'circle'` | The shape |
| `x`, `y` | `50` | The shape's **centre**. A number is %, or a string `'40%'` / `'120px'` (% of the element's width for `x`, height for `y`) |
| `size` | fits | The side of the shape's square (% of the element's width, or px). The shape keeps its own proportions inside that square. Default: the largest square that fits the element |
| `rotation` | `0` | Degrees, clockwise, **absolute**: `rotation: 360` ends one full turn from 0. The shape turns rigidly, also in a wide or tall element |
| `roundness` | `1` | Corners: `0` = sharp … `1` = the shape's own (the maximum) |
| `outline` | `false` | `{ width, band }`: only a band of `width` px along the edge shows; `band`: `'inside'` (default), `'centre'` or `'outside'` the edge. Not animated |
| `duration`, `easing` | `400`, `'easeInOutCubic'` | As for icons; also per `to()` call |

Everything except `outline` animates together in `to()`. How it works: a filled shape uses CSS `clip-path: url(#…)`,
an outlined one `mask: url(#…)` (clip-path has no line width); the `<clipPath>` / `<mask>` sit in a small hidden
`<svg>` that `clip()` adds to the page. It follows the element's size (`ResizeObserver`). Overflow beyond the element is
cut off, as with any clip-path.

## Options

| Option | For | Default | |
| --- | --- | --- | --- |
| `set` | both | `'round'` | digits: `'round'`, `'square'`, `'condensed'`, `'slim'`, `'handwritten'`; icons (`icon()` only): `'media'`, `'menu'`, `'checkbox'`, `'radio'`, `'folder'`, `'theme'`, `'weather'`, `'eye'`, `'volume'`, `'toggle'`, `'lock'`, `'bell'`, `'mic'`, `'chevron'`, `'copy'`, `'wifi'`, `'battery'` |
| `state` / `value` | icon / text | empty | What is shown first |
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

`duration` and `easing` can also be passed to a single `to()` / `set()` call.

## Behaviour

- **Colour** comes from the CSS `color` (`currentColor`).
- **Spacing** can be set in CSS too: `--morphico-spacing: 0.15em`.
- **Interrupting:** calling `to()` / `set()` during a morph starts the new morph from the shape on screen.
  The earlier promise resolves with `{ interrupted: true }`; promises never stay pending.
- **Reduced motion:** when the user's system asks for reduced motion, shapes change without animation.
- **Accessibility:** the icon / line has `role="img"` and an `aria-label` with the current value.
- **Server-side rendering:** importing does not touch the DOM; only `icon()` / `text()` / `clip()` do.

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
