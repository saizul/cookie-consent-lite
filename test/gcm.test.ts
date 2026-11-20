import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { consentModeSignals, createConsent } from '../src/index.js';
import { consentCookie, gtagCalls, makeWindow } from './helpers.js';

const DENIED = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
};

describe('Google Consent Mode v2', () => {
  it('sends defaults with everything optional denied before anything else', () => {
    const w = makeWindow();
    createConsent({ window: w });
    const calls = gtagCalls(w);
    assert.deepEqual(calls[0], ['consent', 'default', { ...DENIED, wait_for_update: 500 }]);
    assert.deepEqual(calls[1], ['set', 'ads_data_redaction', true]);
    assert.equal(calls.length, 2);
  });

  it('pushes Arguments objects, like the official gtag snippet', () => {
    const w = makeWindow();
    createConsent({ window: w });
    assert.equal(Object.prototype.toString.call(w.dataLayer![0]), '[object Arguments]');
  });

  it('uses an existing gtag() function', () => {
    const w = makeWindow();
    const calls: unknown[][] = [];
    w.gtag = (...args: unknown[]) => calls.push(args);
    createConsent({ window: w });
    assert.equal(calls[0]![1], 'default');
  });

  it('sends an update with ads_user_data and ad_personalization on accept', () => {
    const w = makeWindow();
    createConsent({ window: w }).accept();
    const update = gtagCalls(w).find((c) => c[1] === 'update')!;
    assert.deepEqual(update[2], {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
      functionality_storage: 'granted',
      personalization_storage: 'granted',
      security_storage: 'granted',
    });
    assert.deepEqual(gtagCalls(w).pop(), ['set', 'ads_data_redaction', false]);
  });

  it('pushes a cookie_consent_update event for Tag Manager triggers', () => {
    const w = makeWindow();
    createConsent({ window: w }).accept(['analytics']);
    const event = w.dataLayer!.find((e) => (e as { event?: string }).event === 'cookie_consent_update') as {
      cookie_consent: Record<string, boolean>;
    };
    assert.deepEqual(event.cookie_consent, {
      necessary: true,
      analytics: true,
      marketing: false,
      functional: false,
    });
  });

  it('restores a stored choice right after the defaults', () => {
    const first = makeWindow();
    createConsent({ window: first }).accept(['analytics']);
    const w = makeWindow({ cookie: consentCookie(first) });
    createConsent({ window: w });
    const calls = gtagCalls(w);
    assert.equal(calls[0]![1], 'default');
    assert.equal(calls[2]![1], 'update');
    assert.equal((calls[2]![2] as Record<string, string>).analytics_storage, 'granted');
    assert.equal((calls[2]![2] as Record<string, string>).ad_storage, 'denied');
  });

  it('supports regions, wait_for_update, url_passthrough and turning redaction off', () => {
    const w = makeWindow();
    createConsent({
      window: w,
      googleConsentMode: {
        regions: ['EU', 'GB'],
        waitForUpdate: 1000,
        urlPassthrough: true,
        adsDataRedaction: false,
      },
    });
    const calls = gtagCalls(w);
    assert.deepEqual(calls[0], [
      'consent',
      'default',
      { ...DENIED, wait_for_update: 1000, region: ['EU', 'GB'] },
    ]);
    assert.deepEqual(calls[1], ['set', 'url_passthrough', true]);
    assert.equal(calls.length, 2);
  });

  it('sends nothing with googleConsentMode: false', () => {
    const w = makeWindow();
    createConsent({ window: w, googleConsentMode: false }).accept();
    assert.equal(w.dataLayer, undefined);
  });

  it('reset() denies everything again', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w });
    cc.accept();
    cc.reset();
    const update = gtagCalls(w)
      .filter((c) => c[1] === 'update')
      .pop()!;
    assert.deepEqual(update[2], DENIED);
  });

  it('consentModeSignals() maps categories to consent types', () => {
    assert.deepEqual(
      consentModeSignals({ necessary: true, analytics: false, marketing: true, functional: false }),
      {
        ...DENIED,
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      },
    );
  });
});
