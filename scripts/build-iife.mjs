// Bundles src/iife.ts into dist/cookie-consent.min.js for a plain <script> tag
// and prints its raw and gzipped size.
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const outfile = 'dist/cookie-consent.min.js';
await build({
  entryPoints: ['src/iife.ts'],
  outfile,
  bundle: true,
  minify: true,
  format: 'iife',
  target: ['es2020'],
  legalComments: 'none',
  banner: { js: `/*! ${pkg.name} v${pkg.version} | MIT */` },
});

const code = readFileSync(outfile);
console.log(`${outfile}: ${code.length} B raw, ${gzipSync(code, { level: 9 }).length} B gzip`);
