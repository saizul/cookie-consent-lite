import type { Choices, GoogleConsentModeOptions } from './types.js';

type Gtag = (...args: unknown[]) => void;
type GtagWindow = Window & { dataLayer?: unknown[]; gtag?: Gtag };

/** Returns `window.gtag`, defining the standard stub (which queues into `dataLayer`) if needed. */
function gtag(w: Window): Gtag {
  const g = w as GtagWindow;
  g.dataLayer = g.dataLayer || [];
  const dataLayer = g.dataLayer;
  if (typeof g.gtag !== 'function') {
    g.gtag = function () {
      // gtag.js expects the Arguments object itself, not an array.
      // biome-ignore lint/complexity/noArguments: required by the gtag.js queue format
      dataLayer.push(arguments);
    };
  }
  return g.gtag;
}

const grant = (on: boolean) => (on ? 'granted' : 'denied');

/** Maps consent categories to Google Consent Mode v2 consent types. */
export function consentModeSignals(c: Choices): Record<string, string> {
  return {
    ad_storage: grant(c.marketing),
    ad_user_data: grant(c.marketing),
    ad_personalization: grant(c.marketing),
    analytics_storage: grant(c.analytics),
    functionality_storage: grant(c.functional),
    personalization_storage: grant(c.functional),
    security_storage: 'granted',
  };
}

const DENIED: Choices = { necessary: true, analytics: false, marketing: false, functional: false };

/** Sends `gtag('consent', 'default', ...)` with everything optional denied. */
export function consentDefault(w: Window, o: GoogleConsentModeOptions): void {
  const g = gtag(w);
  const params: Record<string, unknown> = {
    ...consentModeSignals(DENIED),
    wait_for_update: o.waitForUpdate ?? 500,
  };
  if (o.regions?.length) params.region = o.regions;
  g('consent', 'default', params);
  if (o.adsDataRedaction !== false) g('set', 'ads_data_redaction', true);
  if (o.urlPassthrough) g('set', 'url_passthrough', true);
}

/** Sends `gtag('consent', 'update', ...)` and a `cookie_consent_update` dataLayer event for GTM triggers. */
export function consentUpdate(w: Window, c: Choices, o: GoogleConsentModeOptions): void {
  const g = gtag(w);
  g('consent', 'update', consentModeSignals(c));
  if (o.adsDataRedaction !== false) g('set', 'ads_data_redaction', !c.marketing);
  (w as GtagWindow).dataLayer!.push({ event: 'cookie_consent_update', cookie_consent: { ...c } });
}
