import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { renderPage } from '../src/render.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
export const outputDirectory = join(root, 'dist');

export async function build() {
  const pages = [
    ['home', 'index.html'],
    ['products', 'products.html'],
    ['about', 'about.html'],
    ['404', '404.html'],
  ];

  // Render first so a template error leaves the previous build available.
  const rendered = await Promise.all(pages.map(async ([page, filename]) => {
    const html = await renderPage(page);
    if (typeof html !== 'string' || !/^<!doctype html>/i.test(html.trimStart())) {
      throw new Error(`renderPage("${page}") must return a complete HTML document.`);
    }
    return { filename, html };
  }));

  await rm(outputDirectory, { recursive: true, force: true });
  await mkdir(outputDirectory, { recursive: true });
  await cp(join(root, 'public'), outputDirectory, { recursive: true });
  await Promise.all(rendered.map(({ filename, html }) => writeFile(join(outputDirectory, filename), html)));
  console.log('Built Nōdo: /, /products, /about, and a custom 404 page.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await build();
}
