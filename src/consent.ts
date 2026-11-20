import { readConsentCookie, type ResolvedCookieOptions, serializeConsentCookie } from './cookie.js';
import { consentDefault, consentUpdate } from './gcm.js';
import { activateBlocked } from './scripts.js';
import { translations } from './strings.js';
import type {
  Category,
  ChangeListener,
  Choices,
  ConsentOptions,
  ConsentState,
  CookieConsent,
  GoogleConsentModeOptions,
  OptionalCategory,
  Strings,
  StringsOverride,
} from './types.js';
import { createUi, type Ui } from './ui.js';

/** The optional categories, in their default display order. */
export const OPTIONAL_CATEGORIES: readonly OptionalCategory[] = ['analytics', 'marketing', 'functional'];

/** Picks the language: an explicit code, or `auto` from `<html lang>`, falling back to English. */
export function resolveLang(lang: string | undefined, htmlLang: string, available: string[]): string {
  const pick = (code: string) => {
    const c = code.toLowerCase();
    return available.find((a) => a.toLowerCase() === c) || available.find((a) => c.startsWith(`${a}-`));
  };
  return (lang && lang !== 'auto' ? pick(lang) : pick(htmlLang)) || 'en';
}

/** Merges an override into a set of strings (category texts one level deep). */
export function mergeStrings(base: Strings, o: StringsOverride = {}): Strings {
  const categories = { ...base.categories };
  for (const key of Object.keys(o.categories || {}) as Category[]) {
    categories[key] = { ...categories[key], ...o.categories![key] };
  }
  return { ...base, ...o, categories } as Strings;
}

/**
 * Creates the consent manager: reads the stored choice, sends the Google Consent
 * Mode defaults, shows the banner if needed and activates allowed scripts.
 *
 * Load it before your Google tag so the defaults are in place first.
 */
export function createConsent(options: ConsentOptions = {}): CookieConsent {
  const w = options.window || window;
  const doc = w.document;
  const revision = String(options.revision ?? 1);
  const offered = (options.categories || OPTIONAL_CATEGORIES).filter((c) => OPTIONAL_CATEGORIES.includes(c));
  const cookie: ResolvedCookieOptions = {
    name: 'cc_consent',
    days: 182,
    path: '/',
    sameSite: 'Lax',
    ...options.cookie,
  };
  const gpc =
    options.respectGpc !== false &&
    (w.navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
  const gcm: GoogleConsentModeOptions | null =
    options.googleConsentMode === false
      ? null
      : options.googleConsentMode === true || !options.googleConsentMode
        ? {}
        : options.googleConsentMode;
  const all = { ...translations, ...options.translations };
  const lang = resolveLang(options.lang, doc.documentElement.lang || '', Object.keys(all));
  const strings = mergeStrings(all[lang]!, options.strings);
  const listeners = new Set<ChangeListener>();
  if (options.onChange) listeners.add(options.onChange);

  let ui: Ui | null = null;
  let destroyed = false;

  const toState = (granted: string[], timestamp: number): ConsentState => {
    const categories: Choices = { necessary: true, analytics: false, marketing: false, functional: false };
    for (const c of offered) categories[c] = granted.includes(c) && !(gpc && c === 'marketing');
    return { categories, revision, timestamp, gpc };
  };

  const load = (): ConsentState | null => {
    const stored = readConsentCookie(doc.cookie, cookie.name);
    if (!stored || stored.r !== revision || Date.now() - stored.t > cookie.days * 864e5) return null;
    return toState(stored.c, stored.t);
  };

  let state = load();

  const whenReady = (fn: () => void) => {
    if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  const mount = () => {
    if (!ui && !destroyed) {
      ui = createUi(doc, strings, lang, offered, gpc, options, {
        accept: () => api.accept(),
        reject: () => api.reject(),
        save: (cats) => api.accept(cats),
        current: () => state?.categories || null,
      });
    }
    return ui;
  };

  const apply = () => {
    if (!state) return;
    if (gcm) consentUpdate(w, state.categories, gcm);
    const current = state.categories;
    whenReady(() => activateBlocked(doc, current));
  };

  const decide = (granted: string[]): ConsentState => {
    const previous = state;
    const next = toState(granted, Date.now());
    state = next;
    doc.cookie = serializeConsentCookie(
      { r: revision, t: next.timestamp, c: offered.filter((c) => next.categories[c]) },
      cookie,
      w.location.protocol === 'https:',
    );
    apply();
    ui?.hideAll();
    for (const fn of Array.from(listeners)) fn(next, previous);
    w.dispatchEvent(
      new (w as Window & typeof globalThis).CustomEvent('cookieconsent:change', { detail: next }),
    );
    if (
      options.reloadOnRevoke &&
      previous &&
      offered.some((c) => previous.categories[c] && !next.categories[c])
    ) {
      w.location.reload();
    }
    return next;
  };

  const api: CookieConsent = {
    show: () => whenReady(() => mount()?.showBanner()),
    hide: () => ui?.hideAll(),
    showPreferences: () => whenReady(() => mount()?.showPrefs()),
    hidePreferences: () => ui?.hidePrefs(),
    accept: (categories = 'all') => decide(categories === 'all' ? [...offered] : categories),
    reject: () => decide([]),
    onChange: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    get: () => state,
    has: (c) => c === 'necessary' || !!state?.categories[c],
    reset: () => {
      state = null;
      doc.cookie = serializeConsentCookie(null, cookie, w.location.protocol === 'https:');
      if (gcm) consentUpdate(w, toState([], 0).categories, gcm);
      api.show();
    },
    destroy: () => {
      destroyed = true;
      ui?.destroy();
      ui = null;
      listeners.clear();
      const g = w as Window & { CookieConsent?: CookieConsent };
      if (g.CookieConsent === api) delete g.CookieConsent;
    },
  };

  if (gcm) consentDefault(w, gcm);
  apply();
  if (options.exposeGlobal !== false) (w as Window & { CookieConsent?: CookieConsent }).CookieConsent = api;
  if (!state && options.autoShow !== false) api.show();
  return api;
}
