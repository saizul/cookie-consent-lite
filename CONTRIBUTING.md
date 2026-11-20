# Contributing

Thanks for helping improve cookie-consent-lite. Translations, accessibility
fixes, bug reports from real sites, tests and documentation are all
welcome. If you are new to open source, start with one of the
[beginner issues](#good-first-issues) below.

## Reporting a bug

Open an issue with:

- the options you passed (or the `CookieConsentConfig` / data attributes)
- the browser and version, and whether Global Privacy Control is on
- what you expected and what happened; for Consent Mode problems, the
  contents of `dataLayer` in the console help a lot

## Development setup

You need Node 20 or newer.

```console
$ git clone https://github.com/saizul/cookie-consent-lite.git
$ cd cookie-consent-lite
$ npm ci
$ npm test              # builds ESM, CJS and the <script> bundle, then runs node:test
$ npm run lint          # biome lint + tsc --noEmit
$ npm run format        # biome format --write
$ npm run format:check  # what CI runs
```

Tests run against [happy-dom](https://github.com/capricorn86/happy-dom), a
DOM implementation for Node, so no browser is needed. To try the banner
for real, run `npm run build`, then serve the folder (for example
`npx http-server .`) and open `examples/index.html`.

`npm run build` prints the size of `dist/cookie-consent.min.js`. A test
fails if it reaches 6 KB gzipped, so every feature has to earn its bytes.

## Guidelines

- **Zero runtime dependencies.** Development tools go in
  `devDependencies`.
- **Every byte counts.** Prefer a few lines of plain DOM code over an
  abstraction. Check the size printed by `npm run build` before and after
  your change and mention it in the pull request.
- **Privacy by default.** Nothing optional may be granted, run or loaded
  before the visitor chooses. No network requests, ever.
- **Accessibility is not optional.** New controls need a label, keyboard
  support and a visible focus state, and a test.
- **Escape everything** that goes into `innerHTML`.
- Every change comes with a test and a line in the `Unreleased` section of
  `CHANGELOG.md`.

## Project layout

```text
src/
  consent.ts   createConsent(): state, cookie, decisions, public API
  ui.ts        banner and preferences dialog, focus trap, keyboard
  styles.ts    the default stylesheet (CSS custom properties)
  gcm.ts       Google Consent Mode v2 signals
  scripts.ts   activation of blocked scripts and data-src embeds
  cookie.ts    reading and writing the consent cookie
  strings.ts   English and Bangla texts
  iife.ts      entry of the <script> build
test/          node:test suites using happy-dom
examples/      HTML, ESM and CSS examples
scripts/       build helpers (esbuild bundle, test runner)
```

## Adding a language

1. Copy the `en` object in `src/strings.ts` to a new constant named after
   the [BCP 47](https://www.rfc-editor.org/info/bcp47) code (`hi`, `es`,
   `pt-BR`...) and translate every value. Keep texts short: they end up in
   every visitor's download.
2. Add it to the `translations` object and export it from `src/index.ts`.
3. `test/i18n.test.ts` checks that every built-in language has all keys.
   Add a test that `<html lang="xx">` picks it.
4. Check the bundle is still under 6 KB with `npm run build`. If a language
   does not fit, it can ship as a separate export instead; open an issue
   and we will work it out together.
5. Ask a second native speaker to review the wording in the pull request.

## Good first issues

These are deliberately small. Each one lists where to start.

1. **Add a Hindi translation (`hi`)**: follow the steps above. Start in
   `src/strings.ts`.
2. **Add an Arabic translation with right-to-left support**: add the
   strings and set `root.dir = 'rtl'` in `src/ui.ts` for RTL languages.
3. **`MutationObserver` for late scripts**: add an `observe?: boolean`
   option; when on, watch `document` for new `script[type="text/plain"][data-consent]`
   and activate them if allowed. Code goes in `src/scripts.ts`, tests in
   `test/scripts.test.ts`.
4. **`onFirstChoice` option**: a callback that fires only when there was no
   previous state. Change `decide()` in `src/consent.ts`.
5. **`data-cc-accept` / `data-cc-reject` attributes**: let any element on
   the page accept or reject, like `data-cc-open` does today. See
   `onDocClick` in `src/ui.ts`.
6. **WordPress example**: an `examples/wordpress.md` showing how to enqueue
   the script in a theme's `functions.php` with `wp_enqueue_script`.
7. **Contrast check in tests**: compute the WCAG contrast ratio of the
   default and dark colours in `src/styles.ts` and assert it is at least
   4.5:1.
8. **A `--cc-btn-radius` custom property** separate from `--cc-radius`, in
   `src/styles.ts`, documented in the README theming section.

## Pull requests

Keep them focused: one fix or feature per pull request. Describe what
changed, how you tested it and how the bundle size changed; the template
has a short checklist. CI runs lint, format check and the tests on Node 20
and 22 on Linux, and Node 22 on Windows and macOS.
