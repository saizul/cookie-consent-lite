import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { describe, it } from 'node:test';
import { gzipSync } from 'node:zlib';
import * as esm from '../src/index.js';
import { $, makeWindow } from './helpers.js';

const require = createRequire(import.meta.url);
const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');
const BUNDLE = '../cookie-consent.min.js';

describe('package', () => {
  it('the CommonJS build exposes the same API', () => {
    const cjs = require('../cjs/index.js') as typeof esm;
    assert.deepEqual(Object.keys(cjs).sort(), Object.keys(esm).sort());
    assert.equal(cjs.en.acceptAll, 'Accept all');
  });

  it('the CommonJS folder is marked as commonjs', () => {
    assert.equal(JSON.parse(read('../cjs/package.json')).type, 'commonjs');
  });

  it('has no runtime dependencies and versions agree', () => {
    const pkg = JSON.parse(read('../../package.json'));
    assert.equal(pkg.dependencies, undefined);
    assert.equal(pkg.version, esm.VERSION);
    assert.equal(pkg.name, '@saizul/cookie-consent-lite');
    assert.ok(read(BUNDLE).startsWith(`/*! @saizul/cookie-consent-lite v${pkg.version} | MIT */`));
  });

  it('the <script> bundle stays under 6 KB gzipped', () => {
    const size = gzipSync(readFileSync(new URL(BUNDLE, import.meta.url)), { level: 9 }).length;
    assert.ok(size < 6 * 1024, `${size} B gzip`);
  });

  it('the <script> bundle reads CookieConsentConfig and data attributes and sets window.CookieConsent', () => {
    const w = makeWindow({
      html: '<script type="text/plain" data-consent="analytics">window.ran = true</script>',
    });
    (w as unknown as Record<string, unknown>).CookieConsentConfig = { revision: 3, policyUrl: '/privacy' };
    const tag = w.document.createElement('script');
    tag.setAttribute('data-lang', 'bn');
    tag.setAttribute('data-position', 'top');
    tag.textContent = read(BUNDLE);
    w.document.head.appendChild(tag);
    const api = w.CookieConsent as esm.CookieConsent;
    assert.equal(typeof api.accept, 'function');
    assert.equal($(w, '#cc-t').textContent, esm.bn.bannerTitle);
    assert.ok($(w, '.cc-root').classList.contains('cc-top'));
    assert.equal($(w, '#cc-d a').getAttribute('href'), '/privacy');
    assert.equal(api.accept().revision, '3');
    assert.equal(w.ran, true);
    assert.equal(Array.from(w.dataLayer![0] as ArrayLike<unknown>)[1], 'default');
  });

  it('the README documents every option', () => {
    const readme = read('../../README.md');
    const types = read('../../src/types.ts');
    const block = types.slice(
      types.indexOf('export interface ConsentOptions'),
      types.indexOf('export interface CookieConsent'),
    );
    const options = [...block.matchAll(/^ {2}(\w+)\?:/gm)].map((m) => m[1]!);
    assert.ok(options.length >= 15);
    for (const o of options) assert.ok(readme.includes(`\`${o}\``), o);
  });
});
