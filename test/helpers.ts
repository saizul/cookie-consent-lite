import { afterEach } from 'node:test';
import { Window as HappyWindow } from 'happy-dom';

export interface TestWindow extends Window {
  dataLayer?: unknown[];
  CookieConsent?: unknown;
  [key: string]: unknown;
}

const open: HappyWindow[] = [];

afterEach(async () => {
  for (const w of open.splice(0)) await w.happyDOM.close();
});

/** A fresh happy-dom window. Closed automatically after each test. */
export function makeWindow(
  options: { html?: string; url?: string; lang?: string; gpc?: boolean; cookie?: string } = {},
): TestWindow {
  const hw = new HappyWindow({
    url: options.url ?? 'https://example.com/',
    settings: {
      enableJavaScriptEvaluation: true,
      suppressInsecureJavaScriptEnvironmentWarning: true,
      disableJavaScriptFileLoading: true,
      disableCSSFileLoading: true,
      disableIframePageLoading: true,
    },
  });
  open.push(hw);
  const w = hw as unknown as TestWindow;
  if (options.lang) w.document.documentElement.lang = options.lang;
  if (options.gpc !== undefined) {
    Object.defineProperty(w.navigator, 'globalPrivacyControl', { value: options.gpc, configurable: true });
  }
  if (options.cookie) w.document.cookie = options.cookie;
  w.document.body.innerHTML = options.html ?? '';
  return w;
}

/** `dataLayer` entries as plain arrays (gtag pushes Arguments objects). */
export function gtagCalls(w: TestWindow): unknown[][] {
  return (w.dataLayer ?? [])
    .filter((e) => !(e as { event?: string }).event)
    .map((e) => Array.from(e as ArrayLike<unknown>));
}

/** The consent cookie pair (`cc_consent=...`) of a window, to carry it into a new window. */
export function consentCookie(w: TestWindow, name = 'cc_consent'): string {
  const pair = w.document.cookie.split('; ').find((p) => p.startsWith(`${name}=`));
  if (!pair) throw new Error('no consent cookie');
  return pair;
}

export const $ = <T extends Element = HTMLElement>(w: TestWindow, selector: string) => {
  const el = w.document.querySelector<T>(selector);
  if (!el) throw new Error(`no element for ${selector}`);
  return el;
};

export function press(w: TestWindow, key: string, shiftKey = false) {
  const target = w.document.activeElement ?? w.document.body;
  const event = new (w as unknown as typeof globalThis).KeyboardEvent('keydown', {
    key,
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
  target.dispatchEvent(event);
  return event;
}
