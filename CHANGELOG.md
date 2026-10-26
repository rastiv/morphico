# Changelog

All notable changes to this project are documented here. Versions follow [Semantic Versioning](https://semver.org/):
patch = nicer transitions and fixes, minor = new icon sets or options, major = API changes or a changed resting look of an icon.

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
