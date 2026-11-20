// With a bundler (Vite, webpack, esbuild, Rollup...):
//   npm install @saizul/cookie-consent-lite
import { createConsent } from '@saizul/cookie-consent-lite';

const consent = createConsent({
  revision: '2026-11',
  policyUrl: '/privacy#cookies',
  categories: ['analytics', 'marketing'],
  lang: 'auto',
  strings: {
    bannerText: 'We use cookies for statistics and, if you agree, for ads.',
  },
  googleConsentMode: { regions: ['EU', 'GB', 'CH'] },
});

consent.onChange((state, previous) => {
  if (state.categories.analytics && !previous?.categories.analytics) {
    // Start a non-Google analytics tool yourself.
    import('./my-analytics.js').then((m) => m.start());
  }
});

// Elsewhere, e.g. a "Cookie settings" button in a React component:
export function openCookieSettings() {
  consent.showPreferences();
}
