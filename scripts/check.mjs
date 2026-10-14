import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { resolve, sep } from 'node:path';
import { build, outputDirectory } from './build.mjs';
import { products as catalogue } from '../src/data/products.mjs';

await build();

const origin = 'https://designedbynodo.com';
const pageFiles = new Map([
  ['/', 'index.html'],
  ['/products', 'products.html'],
  ['/about', 'about.html'],
  ['/404', '404.html'],
]);
const pages = new Map(await Promise.all([...pageFiles].map(async ([route, file]) => [
  route, await readFile(resolve(outputDirectory, file), 'utf8'),
])));

function attributes(tag) {
  const result = {};
  for (const match of tag.matchAll(/([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4];
  }
  return result;
}

function textContent(html) {
  return html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

async function checkReference(reference, route, label) {
  if (!reference || /^(?:data:|mailto:|tel:)/i.test(reference)) return;
  const url = new URL(reference.replaceAll('&amp;', '&'), `${origin}${route}`);
  assert.ok(['https:', 'http:'].includes(url.protocol), `${label}: unexpected URL protocol`);
  if (url.origin !== origin) return;
  const pathname = decodeURIComponent(url.pathname);
  const filename = pageFiles.get(pathname) || pathname.replace(/^\/+/, '');
  const file = resolve(outputDirectory, filename);
  assert.ok(file.startsWith(`${outputDirectory}${sep}`), `${label}: path outside build output`);
  let exists = false;
  try { exists = (await stat(file)).isFile(); } catch { /* The assertion describes the missing file. */ }
  assert.ok(exists, `${label}: missing internal target ${reference}`);
  if (url.hash && pages.has(pathname)) {
    const id = decodeURIComponent(url.hash.slice(1));
    const ids = [...pages.get(pathname).matchAll(/\bid=(?:"([^"]*)"|'([^']*)')/g)]
      .map(match => match[1] ?? match[2]);
    assert.ok(ids.includes(id), `${label}: missing anchor ${reference}`);
  }
}

const titles = new Set();
const productNames = new Map();
let imageCount = 0;
let etsyCount = 0;

for (const [route, html] of pages) {
  assert.match(html, /^<!doctype html>/i, `${route}: HTML doctype missing`);
  assert.match(html, /<html\b[^>]*\blang=["']en["']/i, `${route}: English document language missing`);
  assert.equal([...html.matchAll(/<h1(?:\s|>)/gi)].length, 1, `${route}: expected one h1`);
  assert.match(html, /<main(?:\s|>)/i, `${route}: main landmark missing`);
  const title = textContent(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] || '');
  assert.ok(title.length > 0 && !titles.has(title), `${route}: missing or repeated page title`);
  titles.add(title);

  const metadata = [...html.matchAll(/<meta\b[^>]*>/gi)].map(match => attributes(match[0]));
  assert.ok(metadata.some(meta => meta.name === 'description' && meta.content?.trim()), `${route}: meta description missing`);
  if (route !== '/404') {
    const canonical = [...html.matchAll(/<link\b[^>]*>/gi)]
      .map(match => attributes(match[0])).find(link => link.rel === 'canonical');
    assert.equal(canonical?.href, `${origin}${route}`, `${route}: canonical URL mismatch`);
    for (const property of ['og:title', 'og:description', 'og:image', 'og:url']) {
      assert.ok(metadata.some(meta => meta.property === property && meta.content?.trim()), `${route}: ${property} missing`);
    }
    const socialImage = metadata.find(meta => meta.property === 'og:image');
    await checkReference(socialImage.content, route, `${route} og:image`);
  }

  for (const match of html.matchAll(/<(a|link|script|img|source)\b[^>]*>/gi)) {
    const tag = match[1].toLowerCase();
    const attrs = attributes(match[0]);
    for (const attribute of ['href', 'src']) {
      if (attrs[attribute] !== undefined) {
        assert.ok(attrs[attribute].trim(), `${route}: empty ${attribute}`);
        await checkReference(attrs[attribute], route, `${route} ${tag}.${attribute}`);
      }
    }
    if (attrs.srcset) {
      for (const candidate of attrs.srcset.split(',')) {
        await checkReference(candidate.trim().split(/\s+/)[0], route, `${route} srcset`);
      }
    }
    if (tag === 'img') {
      imageCount++;
      assert.ok(attrs.src, `${route}: image source missing`);
      assert.ok(Object.hasOwn(attrs, 'alt'), `${route}: image alt attribute missing`);
    }
    if (tag === 'a' && attrs.href) {
      const url = new URL(attrs.href, origin);
      if (url.hostname === 'etsy.com' || url.hostname.endsWith('.etsy.com')) {
        etsyCount++;
        assert.equal(attrs.target, '_blank', `${route}: Etsy link must open a new tab`);
        assert.ok((attrs.rel || '').split(/\s+/).includes('noopener'), `${route}: Etsy link must include rel=noopener`);
      }
    }
  }

  if (route === '/' || route === '/products') {
    const products = [...html.matchAll(/<[a-z][\w:-]*\b[^>]*>/gi)]
      .filter(match => (attributes(match[0]).class || '').split(/\s+/).includes('product'));
    assert.equal(products.length, catalogue.length, `${route}: expected every catalogue product`);
    const names = products.map(match => {
      const remaining = html.slice(match.index + match[0].length);
      const name = textContent(remaining.match(/<h[2-6]\b[^>]*>([\s\S]*?)<\/h[2-6]>/i)?.[1] || '');
      assert.ok(name, `${route}: product name heading missing`);
      return name;
    });
    assert.equal(new Set(names).size, catalogue.length, `${route}: product names must be distinct`);
    productNames.set(route, names.sort());
  }
}

assert.deepEqual(productNames.get('/'), productNames.get('/products'), 'Home and Products must show the same products');
assert.ok(imageCount > 0, 'Product imagery missing');
assert.ok(etsyCount >= 4, 'Product Etsy links missing');

const stylesheet = await readFile(resolve(outputDirectory, 'styles.css'), 'utf8');
for (const match of stylesheet.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
  await checkReference(match[1].trim(), '/styles.css', 'Stylesheet');
}
console.log(`Checks passed: 3 public pages, custom 404, ${catalogue.length} shared products, ${imageCount} image references, ${etsyCount} Etsy links, metadata, and local assets.`);
