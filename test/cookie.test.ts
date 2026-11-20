import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createConsent, readConsentCookie, serializeConsentCookie } from '../src/index.js';
import { makeWindow } from './helpers.js';

const OPTS = { name: 'cc_consent', days: 182, path: '/', sameSite: 'Lax' as const };

describe('cookie', () => {
  it('serializes with Path, Max-Age, SameSite and Secure on https', () => {
    const s = serializeConsentCookie({ r: '1', t: 1, c: ['analytics'] }, OPTS, true);
    assert.equal(
      s,
      'cc_consent=%7B%22r%22%3A%221%22%2C%22t%22%3A1%2C%22c%22%3A%5B%22analytics%22%5D%7D; Path=/; Max-Age=15724800; SameSite=Lax; Secure',
    );
  });

  it('adds Domain, and Secure whenever SameSite=None', () => {
    const s = serializeConsentCookie(null, { ...OPTS, sameSite: 'None', domain: '.example.com' }, false);
    assert.equal(s, 'cc_consent=; Path=/; Max-Age=0; SameSite=None; Domain=.example.com; Secure');
  });

  it('omits Secure on plain http', () => {
    assert.ok(!serializeConsentCookie(null, OPTS, false).includes('Secure'));
  });

  it('reads its own output back among other cookies', () => {
    const value = serializeConsentCookie({ r: 'v2', t: 5, c: ['marketing'] }, OPTS, false).split(';')[0];
    assert.deepEqual(readConsentCookie(`a=1; ${value}; b=2`, 'cc_consent'), {
      r: 'v2',
      t: 5,
      c: ['marketing'],
    });
  });

  it('rejects malformed values', () => {
    assert.equal(readConsentCookie('', 'cc_consent'), null);
    assert.equal(readConsentCookie('cc_consent=', 'cc_consent'), null);
    assert.equal(readConsentCookie('cc_consent=%7B%7D', 'cc_consent'), null);
    assert.equal(readConsentCookie('cc_consent=%5B1%5D', 'cc_consent'), null);
    assert.equal(readConsentCookie('xcc_consent=1', 'cc_consent'), null);
    const r = readConsentCookie(
      `cc_consent=${encodeURIComponent('{"r":"1","t":1,"c":["a",2]}')}`,
      'cc_consent',
    );
    assert.deepEqual(r, { r: '1', t: 1, c: ['a'] });
  });

  it('works on plain http pages', () => {
    const w = makeWindow({ url: 'http://localhost:8080/' });
    createConsent({ window: w }).accept();
    assert.match(w.document.cookie, /cc_consent=/);
  });
});
