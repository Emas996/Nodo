import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { build, outputDirectory } from './build.mjs';

await build();

const host = process.env.HOST || '127.0.0.1';
const port = Number(process.env.PORT || 4173);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('PORT must be an integer between 1 and 65535.');
}

const routes = new Map([
  ['/', 'index.html'],
  ['/products', 'products.html'],
  ['/about', 'about.html'],
]);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Cache-Control': 'no-store',
};

async function sendFile(request, response, file, statusCode = 200) {
  const body = await readFile(file);
  response.writeHead(statusCode, {
    ...securityHeaders,
    'Content-Type': contentTypes[extname(file)] || 'application/octet-stream',
    'Content-Length': body.length,
  });
  response.end(request.method === 'HEAD' ? undefined : body);
}

async function notFound(request, response) {
  return sendFile(request, response, resolve(outputDirectory, '404.html'), 404);
}

const server = createServer(async (request, response) => {
  try {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      response.writeHead(405, { ...securityHeaders, Allow: 'GET, HEAD' });
      response.end('Method not allowed');
      return;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    } catch {
      response.writeHead(400, securityHeaders);
      response.end('Bad request');
      return;
    }

    if (pathname.includes('\0') || pathname.includes('\\')) {
      await notFound(request, response);
      return;
    }

    const redirects = new Map([
      ['/index.html', '/'],
      ['/products.html', '/products'],
      ['/about.html', '/about'],
      ['/products/', '/products'],
      ['/about/', '/about'],
    ]);
    if (redirects.has(pathname)) {
      const query = new URL(request.url, 'http://localhost').search;
      response.writeHead(308, { ...securityHeaders, Location: `${redirects.get(pathname)}${query}` });
      response.end();
      return;
    }

    const relative = routes.get(pathname) || pathname.replace(/^\/+/, '');
    const file = resolve(outputDirectory, relative);
    const hiddenPath = relative.split('/').some(part => part.startsWith('.'));
    if (!file.startsWith(`${outputDirectory}${sep}`) || hiddenPath || /(^|\/)_headers$/.test(relative)) {
      await notFound(request, response);
      return;
    }

    try {
      if (!(await stat(file)).isFile()) {
        await notFound(request, response);
        return;
      }
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'ENOTDIR') {
        await notFound(request, response);
        return;
      }
      throw error;
    }
    await sendFile(request, response, file);
  } catch (error) {
    console.error(error);
    if (!response.headersSent) response.writeHead(500, securityHeaders);
    response.end('Internal server error');
  }
});

server.listen(port, host, () => console.log(`Nōdo preview: http://${host}:${port}`));
