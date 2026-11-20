import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { type ConsentState, createConsent } from '../src/index.js';
import { $, consentCookie, gtagCalls, makeWindow } from './helpers.js';

const visible = (el: HTMLElement) => !el.hidden;

describe('first visit', () => {
  it('shows the banner with English texts and ARIA labelling', () => {
    const w = makeWindow();
    createConsent({ window: w });
    const banner = $(w, '.cc-banner');
    assert.ok(visible(banner));
    assert.equal(banner.getAttribute('role'), 'dialog');
    assert.equal($(w, '#cc-t').textContent, 'We use cookies');
    assert.equal(banner.getAttribute('aria-labelledby'), 'cc-t');
    assert.equal(banner.getAttribute('aria-describedby'), 'cc-d');
    const labels = Array.from(banner.querySelectorAll('button')).map((b) => b.textContent);
    assert.deepEqual(labels, ['Reject all', 'Preferences', 'Accept all']);
    assert.ok($(w, '.cc-overlay').hidden);
  });

  it('puts the banner first in the body so keyboard users reach it first', () => {
    const w = makeWindow({ html: '<a href="/">Home</a>' });
    createConsent({ window: w });
    assert.ok(w.document.body.firstElementChild!.classList.contains('cc-root'));
  });

  it('injects the stylesheet once, and not at all with injectCss: false', () => {
    const w = makeWindow();
    const a = createConsent({ window: w });
    a.destroy();
    createConsent({ window: w });
    assert.equal(w.document.querySelectorAll('#cc-style').length, 1);
    const w2 = makeWindow();
    createConsent({ window: w2, injectCss: false });
    assert.equal(w2.document.querySelectorAll('#cc-style').length, 0);
  });

  it('get() is null and only necessary is allowed before a decision', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w });
    assert.equal(cc.get(), null);
    assert.equal(cc.has('necessary'), true);
    assert.equal(cc.has('analytics'), false);
  });

  it('autoShow: false keeps the banner hidden until show()', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w, autoShow: false });
    assert.equal(w.document.querySelector('.cc-banner'), null);
    cc.show();
    assert.ok(visible($(w, '.cc-banner')));
  });

  it('applies position and theme classes', () => {
    const w = makeWindow();
    createConsent({ window: w, position: 'bottom-left', theme: 'auto' });
    const root = $(w, '.cc-root');
    assert.ok(root.classList.contains('cc-bottom-left'));
    assert.ok(root.classList.contains('cc-auto'));
  });

  it('links the policy page when policyUrl is set', () => {
    const w = makeWindow();
    createConsent({ window: w, policyUrl: '/cookies' });
    const a = $(w, '#cc-d a');
    assert.equal(a.getAttribute('href'), '/cookies');
    assert.equal(a.textContent, 'Cookie policy');
  });
});

describe('decisions', () => {
  it('accept() allows everything, stores the cookie, hides the banner and notifies listeners', () => {
    const w = makeWindow();
    const seen: Array<[ConsentState, ConsentState | null]> = [];
    let event: ConsentState | null = null;
    w.addEventListener('cookieconsent:change', (e) => {
      event = (e as CustomEvent<ConsentState>).detail;
    });
    const cc = createConsent({ window: w, onChange: (s, p) => seen.push([s, p]) });
    const state = cc.accept();
    assert.deepEqual(state.categories, {
      necessary: true,
      analytics: true,
      marketing: true,
      functional: true,
    });
    assert.equal(state.revision, '1');
    assert.equal(state.gpc, false);
    assert.ok($(w, '.cc-banner').hidden);
    assert.equal(seen.length, 1);
    assert.equal(seen[0]![1], null);
    assert.deepEqual(event, state);
    const stored = JSON.parse(decodeURIComponent(consentCookie(w).split('=')[1]!));
    assert.deepEqual(stored.c, ['analytics', 'marketing', 'functional']);
    assert.equal(stored.r, '1');
    assert.equal(typeof stored.t, 'number');
  });

  it('reject() allows only necessary', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w });
    const state = cc.reject();
    assert.deepEqual(state.categories, {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: false,
    });
    assert.equal(cc.has('analytics'), false);
  });

  it('accept([...]) allows exactly the listed categories', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w });
    const state = cc.accept(['analytics']);
    assert.deepEqual(state.categories, {
      necessary: true,
      analytics: true,
      marketing: false,
      functional: false,
    });
  });

  it('banner buttons decide', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w });
    $(w, '.cc-banner [data-cc=reject]').click();
    assert.equal(cc.get()!.categories.analytics, false);
    cc.reset();
    $(w, '.cc-banner [data-cc=accept]').click();
    assert.equal(cc.get()!.categories.analytics, true);
  });

  it('onChange() returns an unsubscribe function and passes the previous state', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w });
    const calls: Array<ConsentState | null> = [];
    const off = cc.onChange((_s, prev) => calls.push(prev));
    const first = cc.accept();
    cc.reject();
    off();
    cc.accept();
    assert.equal(calls.length, 2);
    assert.equal(calls[0], null);
    assert.deepEqual(calls[1], first);
  });

  it('ignores categories that are not offered', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w, categories: ['analytics'] });
    const state = cc.accept();
    assert.deepEqual(state.categories, {
      necessary: true,
      analytics: true,
      marketing: false,
      functional: false,
    });
    assert.equal(w.document.querySelectorAll('.cc-cat').length, 2);
  });

  it('reloads on withdrawal only with reloadOnRevoke', () => {
    const w = makeWindow();
    let reloads = 0;
    Object.defineProperty(w.location, 'reload', { value: () => reloads++, configurable: true });
    const cc = createConsent({ window: w, reloadOnRevoke: true });
    cc.reject();
    cc.accept();
    assert.equal(reloads, 0);
    cc.accept(['analytics']);
    assert.equal(reloads, 1);
  });
});

describe('stored choice', () => {
  it('a returning visitor sees no banner and gets their choice back', () => {
    const first = makeWindow();
    createConsent({ window: first }).accept(['functional']);
    const w = makeWindow({ cookie: consentCookie(first) });
    const cc = createConsent({ window: w });
    assert.equal(w.document.querySelector('.cc-banner'), null);
    assert.deepEqual(cc.get()!.categories, {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: true,
    });
  });

  it('asks again when the policy revision changes', () => {
    const first = makeWindow();
    createConsent({ window: first, revision: 1 }).accept();
    const w = makeWindow({ cookie: consentCookie(first) });
    const cc = createConsent({ window: w, revision: '2024-06' });
    assert.equal(cc.get(), null);
    assert.ok(visible($(w, '.cc-banner')));
  });

  it('asks again when the stored choice is older than cookie.days', () => {
    const old = encodeURIComponent(JSON.stringify({ r: '1', t: Date.now() - 31 * 864e5, c: ['analytics'] }));
    const w = makeWindow({ cookie: `cc_consent=${old}` });
    assert.equal(createConsent({ window: w, cookie: { days: 30 } }).get(), null);
    const w2 = makeWindow({ cookie: `cc_consent=${old}` });
    assert.equal(createConsent({ window: w2, cookie: { days: 60 } }).get()!.categories.analytics, true);
  });

  it('treats a malformed cookie as no choice', () => {
    const w = makeWindow({ cookie: 'cc_consent=%7Bbroken' });
    assert.equal(createConsent({ window: w }).get(), null);
  });

  it('uses a custom cookie name', () => {
    const w = makeWindow();
    createConsent({ window: w, cookie: { name: 'my_consent' } }).accept();
    assert.ok(consentCookie(w, 'my_consent'));
  });

  it('reset() forgets the choice and shows the banner again', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w });
    cc.accept();
    cc.reset();
    assert.equal(cc.get(), null);
    assert.ok(visible($(w, '.cc-banner')));
    const w2 = makeWindow({ cookie: w.document.cookie });
    assert.equal(createConsent({ window: w2 }).get(), null);
  });
});

describe('window.CookieConsent', () => {
  it('is assigned by default and removed by destroy()', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w });
    assert.equal(w.CookieConsent, cc);
    cc.destroy();
    assert.equal(w.CookieConsent, undefined);
    assert.equal(w.document.querySelector('.cc-root'), null);
  });

  it('is not assigned with exposeGlobal: false', () => {
    const w = makeWindow();
    createConsent({ window: w, exposeGlobal: false });
    assert.equal(w.CookieConsent, undefined);
  });
});

describe('Global Privacy Control', () => {
  it('keeps marketing off even on Accept all, and says why', () => {
    const w = makeWindow({ gpc: true });
    const cc = createConsent({ window: w });
    const state = cc.accept();
    assert.equal(state.gpc, true);
    assert.deepEqual(state.categories, {
      necessary: true,
      analytics: true,
      marketing: false,
      functional: true,
    });
    const box = $<HTMLInputElement>(w, 'input[value=marketing]');
    assert.equal(box.disabled, true);
    assert.match($(w, '#cc-marketing-d').textContent!, /Global Privacy Control/);
    const update = gtagCalls(w)
      .filter((c) => c[1] === 'update')
      .pop()!;
    assert.equal((update[2] as Record<string, string>).ad_storage, 'denied');
    assert.equal((update[2] as Record<string, string>).analytics_storage, 'granted');
  });

  it('overrides a stored marketing grant', () => {
    const first = makeWindow();
    createConsent({ window: first }).accept();
    const w = makeWindow({ gpc: true, cookie: consentCookie(first) });
    assert.equal(createConsent({ window: w }).has('marketing'), false);
  });

  it('is ignored with respectGpc: false', () => {
    const w = makeWindow({ gpc: true });
    const state = createConsent({ window: w, respectGpc: false }).accept();
    assert.equal(state.gpc, false);
    assert.equal(state.categories.marketing, true);
  });
});
