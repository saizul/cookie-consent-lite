import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { bn, createConsent, en, mergeStrings, resolveLang, type Strings } from '../src/index.js';
import { $, makeWindow } from './helpers.js';

const keys = (o: object): string[] =>
  Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v).map((s) => `${k}.${s}`) : [k]));

describe('languages', () => {
  it('Bangla has every English string, and none is empty', () => {
    assert.deepEqual(keys(bn).sort(), keys(en).sort());
    for (const s of [en, bn]) {
      for (const k of keys(s)) {
        const value = k.split('.').reduce<unknown>((o, p) => (o as Record<string, unknown>)[p], s);
        assert.ok(typeof value === 'string' && value.trim(), k);
      }
    }
  });

  it('picks Bangla from <html lang="bn"> and marks the banner with lang', () => {
    const w = makeWindow({ lang: 'bn-BD' });
    createConsent({ window: w });
    assert.equal($(w, '#cc-t').textContent, 'আমরা কুকি ব্যবহার করি');
    assert.equal($(w, '.cc-root').getAttribute('lang'), 'bn');
    assert.equal($(w, '[data-cc=accept]').textContent, 'সব গ্রহণ করুন');
  });

  it('an explicit lang wins over <html lang>', () => {
    const w = makeWindow({ lang: 'bn' });
    createConsent({ window: w, lang: 'en' });
    assert.equal($(w, '#cc-t').textContent, 'We use cookies');
  });

  it('falls back to English for unknown languages', () => {
    assert.equal(resolveLang('auto', 'fr-FR', ['en', 'bn']), 'en');
    assert.equal(resolveLang('xx', '', ['en', 'bn']), 'en');
    assert.equal(resolveLang('BN', '', ['en', 'bn']), 'bn');
    assert.equal(resolveLang(undefined, 'bn-IN', ['en', 'bn']), 'bn');
  });

  it('accepts extra translations and partial overrides', () => {
    const fr: Strings = mergeStrings(en, { bannerTitle: 'Nous utilisons des cookies' });
    const w = makeWindow({ lang: 'fr' });
    createConsent({
      window: w,
      translations: { fr },
      strings: { acceptAll: 'OK', categories: { analytics: { title: 'Statistiques' } } },
    });
    assert.equal($(w, '#cc-t').textContent, 'Nous utilisons des cookies');
    assert.equal($(w, '.cc-banner [data-cc=accept]').textContent, 'OK');
    assert.match($(w, '.cc-list').textContent!, /Statistiques/);
    assert.match($(w, '#cc-analytics-d').textContent!, /understand how visitors/);
  });
});
