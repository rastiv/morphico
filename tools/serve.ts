// Dev server for the preview page: `npm run dev` → http://localhost:3003 (PORT env to change).
// Serves .ts files as JavaScript by stripping the types (Node's built-in stripper; it prints an
// "experimental" warning once — harmless here). ES modules and reference images need HTTP, file:// fails.
import fs from 'node:fs';
import http from 'node:http';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';

const projectRoot = path.resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT ?? 3003);
const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.ts': 'text/javascript',
  '.json': 'application/json', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
};

http.createServer((request, response) => {
  const urlPath = decodeURIComponent((request.url ?? '/').split('?')[0]);
  const filePath = path.join(projectRoot, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(projectRoot)) {
    response.writeHead(403);
    response.end();
    return;
  }
  fs.readFile(filePath, (error, content) => {
    if (error) {
      response.writeHead(404);
      response.end();
      return;
    }
    const extension = path.extname(filePath);
    let body: string | Buffer = content;
    if (extension === '.ts') {
      try {
        body = stripTypeScriptTypes(content.toString('utf8'));
      } catch (stripError) {
        response.writeHead(500, { 'Content-Type': 'text/plain' });
        response.end(String(stripError));
        return;
      }
    }
    response.writeHead(200, { 'Content-Type': CONTENT_TYPES[extension] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(body);
  });
})
  .on('error', (error: NodeJS.ErrnoException) => {
    if (error.code !== 'EADDRINUSE') throw error;
    console.error([
      `Port ${port} is already in use — probably another dev server is still running.`,
      'Stop that server (Ctrl+C in its terminal), or start this one on another port:',
      '  PowerShell:  $env:PORT=3004; npm run dev',
      '  Bash:        PORT=3004 npm run dev',
    ].join('\n'));
    process.exit(1);
  })
  .listen(port, () => console.log(`http://localhost:${port}`));
