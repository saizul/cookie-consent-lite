import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { createConsent } from '../src/index.js';
import { $, makeWindow, press } from './helpers.js';

describe('preferences dialog', () => {
  it('opens from the banner with focus inside a labelled modal dialog', () => {
    const w = makeWindow();
    createConsent({ window: w });
    const prefs = $(w, '.cc-banner [data-cc=prefs]');
    prefs.focus();
    prefs.click();
    const modal = $(w, '.cc-modal');
    assert.equal($(w, '.cc-overlay').hidden, false);
    assert.equal(modal.getAttribute('role'), 'dialog');
    assert.equal(modal.getAttribute('aria-modal'), 'true');
    assert.equal(modal.getAttribute('aria-labelledby'), 'cc-mt');
    assert.equal($(w, '#cc-mt').textContent, 'Cookie preferences');
    assert.equal(w.document.activeElement, modal);
  });

  it('lists necessary as always on, and each optional category with a description', () => {
    const w = makeWindow();
    createConsent({ window: w });
    const boxes = Array.from(w.document.querySelectorAll<HTMLInputElement>('.cc-modal input[type=checkbox]'));
    assert.deepEqual(
      boxes.map((b) => b.value),
      ['necessary', 'analytics', 'marketing', 'functional'],
    );
    assert.equal(boxes[0]!.checked, true);
    assert.equal(boxes[0]!.disabled, true);
    assert.ok(boxes.slice(1).every((b) => !b.checked && !b.disabled));
    for (const b of boxes) {
      const desc = w.document.getElementById(b.getAttribute('aria-describedby')!);
      assert.ok(desc?.textContent);
    }
    assert.equal($(w, '.cc-badge').textContent, 'Always on');
  });

  it('saves the checked categories', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w });
    cc.showPreferences();
    $<HTMLInputElement>(w, 'input[value=functional]').checked = true;
    $(w, '[data-cc=save]').click();
    assert.deepEqual(cc.get()!.categories, {
      necessary: true,
      analytics: false,
      marketing: false,
      functional: true,
    });
    assert.ok($(w, '.cc-overlay').hidden);
    assert.ok($(w, '.cc-banner').hidden);
  });

  it('reflects the current choice when reopened', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w });
    cc.accept(['marketing']);
    cc.showPreferences();
    assert.equal($<HTMLInputElement>(w, 'input[value=marketing]').checked, true);
    assert.equal($<HTMLInputElement>(w, 'input[value=analytics]').checked, false);
  });

  it('traps Tab and Shift+Tab inside the dialog', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w });
    cc.showPreferences();
    const close = $(w, '.cc-x');
    const last = $(w, '.cc-modal .cc-btns [data-cc=accept]');
    // From the dialog itself, Shift+Tab goes to the last control.
    assert.ok(press(w, 'Tab', true).defaultPrevented);
    assert.equal(w.document.activeElement, last);
    // Tab on the last control wraps to the first.
    assert.ok(press(w, 'Tab').defaultPrevented);
    assert.equal(w.document.activeElement, close);
    // Shift+Tab on the first wraps to the last.
    press(w, 'Tab', true);
    assert.equal(w.document.activeElement, last);
    // Tab in the middle is left to the browser.
    $(w, 'input[value=analytics]').focus();
    assert.equal(press(w, 'Tab').defaultPrevented, false);
  });

  it('pulls focus back in when it escaped the dialog', () => {
    const w = makeWindow({ html: '<button id="outside">x</button>' });
    const cc = createConsent({ window: w });
    cc.showPreferences();
    $(w, '#outside').focus();
    assert.ok(press(w, 'Tab').defaultPrevented);
    assert.equal(w.document.activeElement, $(w, '.cc-x'));
  });

  it('Escape closes it and returns focus to the opener', () => {
    const w = makeWindow();
    createConsent({ window: w });
    const prefs = $(w, '.cc-banner [data-cc=prefs]');
    prefs.focus();
    prefs.click();
    assert.ok(press(w, 'Escape').defaultPrevented);
    assert.ok($(w, '.cc-overlay').hidden);
    assert.equal(w.document.activeElement, prefs);
    assert.equal($(w, '.cc-banner').hidden, false, 'closing without a choice keeps the banner');
  });

  it('the close button and a click on the backdrop close it', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w });
    cc.showPreferences();
    assert.equal($(w, '.cc-x').getAttribute('aria-label'), 'Close');
    $(w, '.cc-x').click();
    assert.ok($(w, '.cc-overlay').hidden);
    cc.showPreferences();
    $(w, '.cc-overlay').click();
    assert.ok($(w, '.cc-overlay').hidden);
    cc.showPreferences();
    $(w, '.cc-modal').click();
    assert.equal($(w, '.cc-overlay').hidden, false);
  });

  it('opens from any element with data-cc-open, after a choice too', () => {
    const w = makeWindow({
      html: '<footer><a href="#" id="settings" data-cc-open>Cookie settings</a></footer>',
    });
    const cc = createConsent({ window: w });
    cc.accept();
    const link = $(w, '#settings');
    link.focus();
    link.click();
    assert.equal($(w, '.cc-overlay').hidden, false);
    assert.ok($(w, '.cc-banner').hidden);
    cc.hidePreferences();
    assert.equal(w.document.activeElement, link);
  });

  it('keys do nothing while the dialog is closed', () => {
    const w = makeWindow();
    createConsent({ window: w });
    assert.equal(press(w, 'Escape').defaultPrevented, false);
    assert.equal(press(w, 'Tab').defaultPrevented, false);
  });

  it('hide() hides everything without deciding', () => {
    const w = makeWindow();
    const cc = createConsent({ window: w });
    cc.showPreferences();
    cc.hide();
    assert.ok($(w, '.cc-overlay').hidden);
    assert.ok($(w, '.cc-banner').hidden);
    assert.equal(cc.get(), null);
  });

  it('escapes HTML in texts and URLs', () => {
    const w = makeWindow();
    createConsent({
      window: w,
      strings: { bannerTitle: '<img src=x onerror=alert(1)>' },
      policyUrl: '/p?a=1&b="2"',
    });
    assert.equal(w.document.querySelector('.cc-root img'), null);
    assert.equal($(w, '#cc-t').textContent, '<img src=x onerror=alert(1)>');
    assert.equal($(w, '#cc-d a').getAttribute('href'), '/p?a=1&b="2"');
  });
});
