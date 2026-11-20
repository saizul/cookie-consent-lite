// Entry point of the <script> build (dist/cookie-consent.min.js).
//
// Configure it with a global set before the script tag:
//   <script>window.CookieConsentConfig = { revision: 2, policyUrl: '/cookies' }</script>
// or with data attributes on the tag itself:
//   <script src="cookie-consent.min.js" data-revision="2" data-lang="bn" data-policy-url="/cookies"></script>
import { createConsent } from './consent.js';
import type { ConsentOptions } from './types.js';

const w = window as Window & { CookieConsentConfig?: ConsentOptions };
const config: ConsentOptions = { ...w.CookieConsentConfig };
const data = (document.currentScript as HTMLScriptElement | null)?.dataset;
if (data) {
  if (data.revision) config.revision = data.revision;
  if (data.lang) config.lang = data.lang;
  if (data.policyUrl) config.policyUrl = data.policyUrl;
  if (data.position) config.position = data.position as ConsentOptions['position'];
  if (data.theme) config.theme = data.theme as ConsentOptions['theme'];
  if (data.categories) config.categories = data.categories.split(/[\s,]+/) as ConsentOptions['categories'];
}
createConsent(config);
