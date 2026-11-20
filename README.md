# cookie-consent-lite

[![CI](https://github.com/saizul/cookie-consent-lite/actions/workflows/ci.yml/badge.svg)](https://github.com/saizul/cookie-consent-lite/actions/workflows/ci.yml)
[![Release](https://img.shields.io/github/v/release/saizul/cookie-consent-lite)](https://github.com/saizul/cookie-consent-lite/releases)
[![npm (GitHub Packages)](https://img.shields.io/badge/npm-%40saizul%2Fcookie--consent--lite-blue)](https://github.com/saizul/cookie-consent-lite/pkgs/npm/cookie-consent-lite)
![Size: under 6 KB gzip](https://img.shields.io/badge/gzip-%3C%206%20KB-brightgreen)
![Zero dependencies](https://img.shields.io/badge/dependencies-0-brightgreen)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

A tiny, accessible cookie banner that does the parts people get wrong:
Google Consent Mode v2, blocking scripts until consent, and asking again
when your policy changes.

- **Four categories**: necessary (always on), analytics, marketing and
  functional. Offer all of them or only the ones you use.
- **Google Consent Mode v2** out of the box: everything optional is
  `denied` by default, `ad_user_data` and `ad_personalization` included,
  and updated on every choice.
- **Blocks scripts and embeds** marked `type="text/plain" data-consent="analytics"`
  and runs them the moment the category is allowed.
- **Remembers the choice** in a first-party cookie with a policy revision
  and an expiry, and shows the banner again when either changes.
- **Accessible**: real dialogs with ARIA labels, a focus trap, Escape to
  close, focus returned to where it was, 44px targets, visible focus rings,
  and "Reject all" as prominent as "Accept all".
- **Respects Global Privacy Control**: marketing stays off when the browser
  asks for it.
- **English and Bangla (বাংলা)** built in, picked from `<html lang>`, and any
  other language in a few lines.
- **Themeable** with CSS custom properties; light, dark and auto themes.
- **Small**: about 5.9 KB gzipped for the whole `<script>` build, CSS and
  both languages included. Vanilla TypeScript, zero runtime dependencies.

## Contents

- [Quick start](#quick-start)
- [Install](#install)
- [Blocking scripts and embeds](#blocking-scripts-and-embeds)
- [Google Consent Mode v2](#google-consent-mode-v2)
- [Options](#options)
- [API](#api)
- [Languages](#languages)
- [Theming](#theming)
- [Accessibility](#accessibility)
- [Examples](#examples)
- [FAQ](#faq)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## Quick start

Download `cookie-consent.min.js` from the
[latest release](https://github.com/saizul/cookie-consent-lite/releases/latest),
put it on your server and add it to `<head>`, **before** your Google tag:

```html
<script src="/js/cookie-consent.min.js" data-policy-url="/cookie-policy"></script>

<!-- your Google tag, unchanged -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX"></script>
<script>
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXX');
</script>

<!-- any other tracking script: change type to text/plain and add data-consent -->
<script type="text/plain" data-consent="marketing" src="https://ads.example/pixel.js"></script>
```

Add a way to change the choice later, anywhere on the page:

```html
<button type="button" data-cc-open>Cookie settings</button>
```

That is all. Visitors see a banner, Google tags get `denied` until they
choose, and the pixel loads only after "Accept all" (or after they switch
marketing on).

The `<script>` build defines `gtag()` for you if the page has not, so the
Google snippet works unchanged. For more settings, set a global before the
tag:

```html
<script>
  window.CookieConsentConfig = { revision: 2, categories: ['analytics'], theme: 'auto' };
</script>
<script src="/js/cookie-consent.min.js"></script>
```

The tag also reads `data-revision`, `data-lang`, `data-policy-url`,
`data-position`, `data-theme` and `data-categories` (space or comma
separated).

## Install

For bundlers, the package is published to GitHub Packages as
`@saizul/cookie-consent-lite`. Tell npm where the `@saizul` scope lives
(once per project or in `~/.npmrc`):

```console
$ echo "@saizul:registry=https://npm.pkg.github.com" >> .npmrc
$ npm install @saizul/cookie-consent-lite
```

GitHub Packages needs a token with `read:packages` even for public packages;
see [Authenticating to GitHub Packages](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry#authenticating-to-github-packages).

```ts
import { createConsent } from '@saizul/cookie-consent-lite';

const consent = createConsent({ revision: '2026-11', policyUrl: '/privacy' });
consent.onChange((state) => console.log(state.categories));
```

The package contains ESM, CommonJS and type declarations, and the IIFE
file at `@saizul/cookie-consent-lite/cookie-consent.min.js`. Import it
early (in your entry file, before analytics code) so the Consent Mode
defaults come first.

## Blocking scripts and embeds

A browser does not run, or even download, a `<script>` whose `type` is
`text/plain`. Mark anything that needs consent like this:

```html
<!-- inline -->
<script type="text/plain" data-consent="analytics">
  myAnalytics.init('site-id');
</script>

<!-- external; data-type sets the real type, e.g. module -->
<script type="text/plain" data-consent="marketing" src="https://ads.example/tag.js" async></script>
<script type="text/plain" data-consent="analytics" data-type="module" src="/js/stats.mjs"></script>

<!-- needs both categories -->
<script type="text/plain" data-consent="analytics marketing">...</script>

<!-- iframes, images, video: use data-src instead of src -->
<iframe data-consent="marketing" data-src="https://www.youtube-nocookie.com/embed/ID" title="Video"></iframe>
```

When every listed category is allowed, each script is replaced by a real
one with the same attributes (minus `type`, `data-consent` and `data-type`)
and gets `data-consent-activated`; `data-src` becomes `src`. This happens
on page load for returning visitors and right after a choice for new ones.
Scripts in the HTML are handled once the DOM is ready; for elements you add
later, call `activateBlocked(document, consent.get().categories)`.

A script that has run cannot be "un-run". If someone withdraws consent,
the next page load respects it; pass `reloadOnRevoke: true` to reload at
once.

## Google Consent Mode v2

On load, before your Google tag:

```js
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
  wait_for_update: 500,
});
gtag('set', 'ads_data_redaction', true);
```

Then, for a returning visitor right away and for a new visitor after the
choice, a `gtag('consent', 'update', {...})` with this mapping:

| Category     | Consent Mode types                                    |
| ------------ | ----------------------------------------------------- |
| `necessary`  | `security_storage` (always `granted`)                 |
| `analytics`  | `analytics_storage`                                   |
| `marketing`  | `ad_storage`, `ad_user_data`, `ad_personalization`    |
| `functional` | `functionality_storage`, `personalization_storage`    |

It also pushes `{ event: 'cookie_consent_update', cookie_consent: {...} }`
to `dataLayer`, so Google Tag Manager triggers can react to a choice.

With **Tag Manager**, load the banner before the GTM snippet and use the
built-in consent checks on your tags; the `cookie_consent_update` event is
a convenient trigger for tags that need consent.

Set `googleConsentMode: false` if you do not use Google tags, or pass
`{ regions: ['EU', 'GB'], waitForUpdate: 1000, urlPassthrough: true, adsDataRedaction: false }`
to tune it.

## Options

All options are optional.

| Option              | Default                                 | Description |
| ------------------- | --------------------------------------- | ----------- |
| `revision`          | `1`                                     | Policy version. Change it (for example to `'2026-11'`) and everyone is asked again. |
| `categories`        | `['analytics', 'marketing', 'functional']` | Optional categories to offer, in display order. Others are always off. |
| `lang`              | `'auto'`                                | `'en'`, `'bn'`, a key of `translations`, or `'auto'` to follow `<html lang>`. |
| `translations`      |                                         | Extra languages: `{ fr: {...} }`. See [Languages](#languages). |
| `strings`           |                                         | Override some texts of the chosen language. |
| `policyUrl`         |                                         | Adds a link to your policy at the end of the banner text. |
| `cookie`            | `{ name: 'cc_consent', days: 182, path: '/', sameSite: 'Lax' }` | Cookie settings. Add `domain: '.example.com'` to share the choice across subdomains. `Secure` is set on https. |
| `googleConsentMode` | `true`                                  | `false`, or `{ waitForUpdate, regions, adsDataRedaction, urlPassthrough }`. |
| `respectGpc`        | `true`                                  | Keep marketing off when `navigator.globalPrivacyControl` is `true`. |
| `autoShow`          | `true`                                  | Show the banner when there is no valid choice. Set `false` to call `show()` yourself. |
| `injectCss`         | `true`                                  | Add the default stylesheet. Set `false` to bring your own. |
| `position`          | `'bottom'`                              | `'bottom'`, `'top'`, `'bottom-left'` or `'bottom-right'`. |
| `theme`             | `'light'`                               | `'light'`, `'dark'` or `'auto'` (follows `prefers-color-scheme`). |
| `exposeGlobal`      | `true`                                  | Assign the instance to `window.CookieConsent`. |
| `reloadOnRevoke`    | `false`                                 | Reload the page when a previously allowed category is switched off. |
| `onChange`          |                                         | `(state, previous) => void`, called after every choice. |
| `window`            | global `window`                         | The window to work in (tests, iframes). |

## API

`createConsent(options)` returns the instance; the `<script>` build assigns
it to `window.CookieConsent`.

| Method                   | Description |
| ------------------------ | ----------- |
| `show()`                 | Show the banner. |
| `hide()`                 | Hide the banner and the dialog without deciding. |
| `showPreferences()`      | Open the preferences dialog. |
| `hidePreferences()`      | Close it. |
| `accept()`               | Allow every offered category. Returns the new state. |
| `accept(['analytics'])`  | Allow exactly these categories (plus necessary). |
| `reject()`               | Allow only necessary cookies. |
| `onChange(fn)`           | `fn(state, previous)` after every choice. Returns an unsubscribe function. |
| `get()`                  | The current state, or `null` if there is no valid choice yet. |
| `has(category)`          | `true` if the category is allowed now (`necessary` always is). |
| `reset()`                | Forget the choice, send `denied` to Consent Mode and show the banner. |
| `destroy()`              | Remove the UI and listeners. |

A state looks like this:

```js
{
  categories: { necessary: true, analytics: true, marketing: false, functional: false },
  revision: '1',
  timestamp: 1763600000000,
  gpc: false,
}
```

Every choice also fires a `cookieconsent:change` event on `window` with the
state as `detail`:

```js
window.addEventListener('cookieconsent:change', (e) => {
  if (e.detail.categories.functional) loadChatWidget();
});
```

Other exports: `en`, `bn` and `translations` (texts), `mergeStrings()`,
`resolveLang()`, `activateBlocked()`, `consentModeSignals()`,
`readConsentCookie()`, `serializeConsentCookie()`, `CSS`,
`OPTIONAL_CATEGORIES` and `VERSION`, plus the TypeScript types.

## Languages

The language comes from `lang`, or from `<html lang>` when `lang` is
`'auto'`: `bn`, `bn-BD` and `bn-IN` give Bangla, anything unknown gives
English. The banner element gets a matching `lang` attribute so screen
readers pronounce it correctly.

Change a few texts:

```js
createConsent({
  strings: {
    bannerText: 'We use cookies for statistics. Is that OK?',
    categories: { analytics: { title: 'Statistics' } },
  },
});
```

Add a language: copy `en` and translate it, or build on it with
`mergeStrings()`:

```js
import { createConsent, en, mergeStrings } from '@saizul/cookie-consent-lite';

const hi = mergeStrings(en, { bannerTitle: 'हम कुकीज़ का उपयोग करते हैं', acceptAll: 'सभी स्वीकार करें' /* ... */ });
createConsent({ translations: { hi } });
```

New built-in languages are very welcome; see
[CONTRIBUTING.md](CONTRIBUTING.md#adding-a-language).

## Theming

Everything visual is a CSS custom property on `.cc-root`:

```css
.cc-root {
  --cc-bg: #fff;          /* background */
  --cc-fg: #1f2328;       /* text */
  --cc-muted: #57606a;    /* secondary text */
  --cc-border: #d0d7de;
  --cc-accent: #0b57d0;   /* buttons, links, focus ring */
  --cc-accent-fg: #fff;   /* text on buttons */
  --cc-radius: 12px;
  --cc-font: inherit;
  --cc-z: 2147483000;
  --cc-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  --cc-max-width: 960px;
}
```

`theme: 'dark'` and `theme: 'auto'` switch the colours for you. The
markup uses stable class names (`.cc-banner`, `.cc-modal`, `.cc-btn`,
`.cc-btn.cc-o` for outline buttons, `.cc-cat`...) if you want to go
further, or set `injectCss: false` and style it from scratch (the default
stylesheet is exported as `CSS`).

## Accessibility

- The banner is a non-modal `role="dialog"` labelled by its heading and
  text, placed first in `<body>` so keyboard users reach it right away. It
  does not steal focus.
- The preferences dialog is `role="dialog"` with `aria-modal="true"`. It
  takes focus when it opens, keeps Tab and Shift+Tab inside, closes on
  Escape, the close button or a click on the backdrop, and returns focus to
  the element that opened it.
- Each switch is a native checkbox with a `<label>` and an
  `aria-describedby` description. "Necessary" is checked and disabled.
- Buttons are at least 44px tall, focus is always visible, and the default
  colours meet WCAG AA contrast.
- "Reject all" sits next to, and looks the same as, "Accept all".

## Examples

- [`examples/index.html`](examples/index.html): plain `<script>` tag with
  gtag.js, a blocked script, a blocked YouTube embed and a settings link.
- [`examples/bangla.html`](examples/bangla.html): a Bangla page configured
  with data attributes only.
- [`examples/bundler.js`](examples/bundler.js): ESM with options and
  `onChange`.
- [`examples/theme.css`](examples/theme.css): a custom theme.

Run `npm run build` and open the HTML files from a local web server to try
them.

## FAQ

**Does this make my site GDPR compliant?**
No library can on its own. It gives you the mechanics regulators look
for: no non-essential cookies before consent, reject as easy as accept,
granular choices, an easy way to change your mind, a record of the policy
revision. You still need an accurate policy and to tag your scripts
correctly. This is not legal advice.

**Why does the Google tag still load before consent?**
That is how Consent Mode works: with `denied` the tag sets no analytics
or ad cookies and sends cookieless pings (advanced mode). If you want the
tag not to load at all (basic mode), mark the gtag.js script itself with
`type="text/plain" data-consent="analytics"`.

**What does Global Privacy Control change?**
When `navigator.globalPrivacyControl` is `true`, marketing is off even
after "Accept all", its switch is disabled with a note explaining why, and
`state.gpc` is `true`. Analytics and functional are still the visitor's
choice. Set `respectGpc: false` to ignore the signal.

**Where is the choice stored?**
In one first-party cookie, `cc_consent` by default, holding the revision,
a timestamp and the allowed categories. Nothing is sent anywhere. The
library makes no network requests.

**How do I ask everyone again after changing my policy?**
Bump `revision`. Stored choices with another revision are ignored.

**Can I use it with React, Vue or a single-page app?**
Yes. Call `createConsent()` once at startup (not in a component that
re-renders) and call `showPreferences()` from your own settings button,
or put `data-cc-open` on it.

**My page is not UTF-8. Will Bangla work?**
Yes. The `<script>` build is pure ASCII (non-ASCII characters are escaped),
so it works whatever the page encoding.

## Roadmap

Ideas marked **good first issue** are small and self-contained. Comment on
the issue to claim one.

- **good first issue**: more built-in languages: Hindi (`hi`), Urdu
  (`ur`), Arabic (`ar`, with `dir="rtl"`), Spanish (`es`), German (`de`).
- **good first issue**: a `MutationObserver` option that activates blocked
  scripts added to the page after load.
- **good first issue**: a compact one-line banner layout
  for small screens (`position: 'bar'`).
- **good first issue**: an `onFirstChoice` callback that fires only once
  per visitor.
- **good first issue**: a WordPress and a Hugo example in `examples/`.
- **good first issue**: Playwright tests in a real browser for the focus
  trap and the stylesheet.
- Optional consent log endpoint (POST the choice to your own server).
- Microsoft UET and Meta pixel consent signals next to Google's.
- A `necessary`-only "notice" mode for sites that set no optional cookies.

## Contributing

Bug reports, translations, accessibility fixes and documentation are all
welcome. [CONTRIBUTING.md](CONTRIBUTING.md) explains the setup and lists
beginner-friendly issues.

```console
$ git clone https://github.com/saizul/cookie-consent-lite.git
$ cd cookie-consent-lite
$ npm ci
$ npm test
```

Please follow the [code of conduct](CODE_OF_CONDUCT.md). Security problems
go through [SECURITY.md](SECURITY.md).

## License

[MIT](LICENSE) © Saizul Amin
