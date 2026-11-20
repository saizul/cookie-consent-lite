import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { activateBlocked, createConsent } from '../src/index.js';
import { consentCookie, makeWindow } from './helpers.js';

const PAGE = `
<script type="text/plain" data-consent="analytics" id="a">window.analyticsRan = (window.analyticsRan || 0) + 1</script>
<script type="text/plain" data-consent="marketing" id="m">window.marketingRan = true</script>
<script type="text/plain" data-consent="analytics marketing" id="both">window.bothRan = true</script>
<script type="text/plain" data-consent="analytics" data-type="module" async data-site="x" id="mod"></script>
<iframe data-consent="marketing" data-src="https://video.example/embed/1" title="Video"></iframe>
`;

describe('blocked scripts', () => {
  it('stay inert until their category is allowed', () => {
    const w = makeWindow({ html: PAGE });
    createConsent({ window: w });
    assert.equal(w.analyticsRan, undefined);
    assert.equal(w.document.querySelectorAll('script[type="text/plain"]').length, 4);
  });

  it('run once their category is allowed, keeping their attributes', () => {
    const w = makeWindow({ html: PAGE });
    createConsent({ window: w }).accept(['analytics']);
    assert.equal(w.analyticsRan, 1);
    assert.equal(w.marketingRan, undefined);
    const a = w.document.getElementById('a')!;
    assert.equal(a.getAttribute('type'), null);
    assert.equal(a.getAttribute('data-consent-activated'), 'analytics');
    const mod = w.document.getElementById('mod') as HTMLScriptElement;
    assert.equal(mod.type, 'module');
    assert.equal(mod.hasAttribute('async'), true);
    assert.equal(mod.getAttribute('data-site'), 'x');
    assert.equal(mod.hasAttribute('data-type'), false);
  });

  it('need every listed category', () => {
    const w = makeWindow({ html: PAGE });
    const cc = createConsent({ window: w });
    cc.accept(['analytics']);
    assert.equal(w.bothRan, undefined);
    cc.accept();
    assert.equal(w.bothRan, true);
    assert.equal(w.analyticsRan, 1, 'an activated script never runs twice');
  });

  it('load iframes and other data-src elements', () => {
    const w = makeWindow({ html: PAGE });
    const cc = createConsent({ window: w });
    const frame = w.document.querySelector('iframe')!;
    assert.equal(frame.getAttribute('src'), null);
    cc.accept(['marketing']);
    assert.equal(frame.getAttribute('src'), 'https://video.example/embed/1');
    assert.equal(frame.hasAttribute('data-src'), false);
  });

  it('run on page load for a returning visitor', () => {
    const first = makeWindow();
    createConsent({ window: first }).accept(['analytics']);
    const w = makeWindow({ html: PAGE, cookie: consentCookie(first) });
    createConsent({ window: w });
    assert.equal(w.analyticsRan, 1);
  });

  it('wait for DOMContentLoaded when the page is still loading', () => {
    const first = makeWindow();
    createConsent({ window: first }).accept(['analytics']);
    const w = makeWindow({ cookie: consentCookie(first) });
    Object.defineProperty(w.document, 'readyState', { value: 'loading', configurable: true });
    createConsent({ window: w });
    w.document.body.innerHTML = PAGE;
    assert.equal(w.analyticsRan, undefined);
    w.document.dispatchEvent(new (w as unknown as typeof globalThis).Event('DOMContentLoaded'));
    assert.equal(w.analyticsRan, 1);
  });

  it('activateBlocked() returns how many elements it activated', () => {
    const w = makeWindow({ html: PAGE });
    const n = activateBlocked(w.document, {
      necessary: true,
      analytics: true,
      marketing: false,
      functional: false,
    });
    assert.equal(n, 2);
  });
});
