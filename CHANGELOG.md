# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-11-20

### Added

- `createConsent()` with a banner and a preferences dialog for the
  `necessary`, `analytics`, `marketing` and `functional` categories.
- Google Consent Mode v2: `default` with everything optional denied
  (`ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`,
  `functionality_storage`, `personalization_storage`), `update` on every
  choice, `ads_data_redaction`, optional `region`, `wait_for_update` and
  `url_passthrough`, and a `cookie_consent_update` dataLayer event.
- Blocking of `<script type="text/plain" data-consent="...">` and
  `data-src` embeds until their categories are allowed.
- A first-party cookie with the policy revision and a timestamp; the banner
  comes back when the revision changes or the choice expires.
- `window.CookieConsent` with `show`, `hide`, `showPreferences`,
  `hidePreferences`, `accept`, `reject`, `onChange`, `get`, `has`, `reset`
  and `destroy`, plus a `cookieconsent:change` DOM event.
- English and Bangla texts, `<html lang>` detection, custom translations
  and partial overrides.
- Keyboard support: focus trap, Escape, focus return, `data-cc-open`
  openers; ARIA dialog labelling.
- Global Privacy Control support (marketing stays off).
- Theming with CSS custom properties, light, dark and auto themes and four
  positions.
- ESM and CommonJS builds with type declarations and an IIFE build for a
  plain `<script>` tag (under 6 KB gzipped). No runtime dependencies.

[Unreleased]: https://github.com/saizul/cookie-consent-lite/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/saizul/cookie-consent-lite/releases/tag/v0.1.0
