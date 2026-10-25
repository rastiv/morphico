# morphico

Morphing line-art icons for the web: digits (and later other icon states) that smoothly change from one to another by interpolating SVG path data. No runtime dependencies.

> **Status:** early development. The API is not available yet. Version 0.0.x only tests the release pipeline.

## Development

Written in TypeScript. Requires Node 24 (it runs the `.ts` tools directly).

```sh
npm install        # dev tools only: typescript, @types/node
npm run dev        # preview page at http://localhost:3003
npm run typecheck
npm run build      # src/ → dist/
```

## License

[MIT](LICENSE)
