import type { Choices } from './types.js';

const SKIP = ['type', 'data-consent', 'data-type'];

const allowedBy = (el: Element, c: Choices) =>
  (el.getAttribute('data-consent') || '')
    .split(/[\s,]+/)
    .filter(Boolean)
    .every((cat) => c[cat as keyof Choices] === true);

/**
 * Activates blocked content whose categories are all allowed:
 *
 * - `<script type="text/plain" data-consent="analytics">` is replaced by a real script
 *   (`data-type="module"` sets the new script's type);
 * - `<iframe data-consent="marketing" data-src="...">` (or img, video...) gets its `src`.
 *
 * Returns the number of elements activated.
 */
export function activateBlocked(doc: Document, c: Choices): number {
  let n = 0;
  for (const old of Array.from(doc.querySelectorAll('script[type="text/plain"][data-consent]'))) {
    if (!allowedBy(old, c)) continue;
    const s = doc.createElement('script');
    for (const a of Array.from(old.attributes)) if (!SKIP.includes(a.name)) s.setAttribute(a.name, a.value);
    const type = old.getAttribute('data-type');
    if (type) s.type = type;
    s.setAttribute('data-consent-activated', old.getAttribute('data-consent')!);
    s.text = old.textContent || '';
    old.replaceWith(s);
    n++;
  }
  for (const el of Array.from(doc.querySelectorAll('[data-consent][data-src]:not(script)'))) {
    if (!allowedBy(el, c)) continue;
    el.setAttribute('src', el.getAttribute('data-src')!);
    el.removeAttribute('data-src');
    n++;
  }
  return n;
}
