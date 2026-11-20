import { CSS } from './styles.js';
import type { Choices, ConsentOptions, OptionalCategory, Strings } from './types.js';

export interface UiHandlers {
  accept(): void;
  reject(): void;
  save(categories: OptionalCategory[]): void;
  current(): Choices | null;
}

export interface Ui {
  root: HTMLElement;
  showBanner(): void;
  showPrefs(): void;
  hidePrefs(): void;
  hideAll(): void;
  destroy(): void;
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

const btn = (action: string, label: string, outline = false) =>
  `<button type="button" class="cc-btn${outline ? ' cc-o' : ''}" data-cc="${action}">${esc(label)}</button>`;

/** Builds the banner and the preferences dialog and wires up keyboard and focus handling. */
export function createUi(
  doc: Document,
  t: Strings,
  lang: string,
  offered: OptionalCategory[],
  gpc: boolean,
  options: ConsentOptions,
  handlers: UiHandlers,
): Ui {
  if (options.injectCss !== false && !doc.getElementById('cc-style')) {
    const style = doc.createElement('style');
    style.id = 'cc-style';
    style.textContent = CSS;
    (doc.head || doc.documentElement).appendChild(style);
  }

  const row = (cat: 'necessary' | OptionalCategory) => {
    const locked = cat === 'necessary';
    const gpcLocked = gpc && cat === 'marketing';
    return `<li class="cc-cat"><label class="cc-row"><input type="checkbox" value="${cat}" aria-describedby="cc-${cat}-d"${
      locked ? ' checked disabled' : gpcLocked ? ' disabled' : ''
    }><span>${esc(t.categories[cat].title)}</span>${
      locked ? `<span class="cc-badge">${esc(t.alwaysOn)}</span>` : ''
    }</label><p class="cc-p" id="cc-${cat}-d">${esc(t.categories[cat].description)}${
      gpcLocked ? ` ${esc(t.gpcNote)}` : ''
    }</p></li>`;
  };

  const link = options.policyUrl ? ` <a href="${esc(options.policyUrl)}">${esc(t.policyLink)}</a>` : '';
  const root = doc.createElement('div');
  root.className = `cc-root cc-${options.position || 'bottom'} cc-${options.theme || 'light'}`;
  root.lang = lang;
  root.innerHTML = `<div class="cc-banner" role="dialog" aria-modal="false" aria-labelledby="cc-t" aria-describedby="cc-d" hidden><div class="cc-body"><h2 class="cc-h" id="cc-t">${esc(
    t.bannerTitle,
  )}</h2><p class="cc-p" id="cc-d">${esc(t.bannerText)}${link}</p></div><div class="cc-btns">${btn(
    'reject',
    t.rejectAll,
  )}${btn('prefs', t.preferences, true)}${btn('accept', t.acceptAll)}</div></div><div class="cc-overlay" hidden><div class="cc-modal" role="dialog" aria-modal="true" aria-labelledby="cc-mt" aria-describedby="cc-md" tabindex="-1"><div class="cc-head"><h2 class="cc-h" id="cc-mt">${esc(
    t.modalTitle,
  )}</h2><button type="button" class="cc-x" data-cc="close" aria-label="${esc(
    t.close,
  )}">&times;</button></div><p class="cc-p" id="cc-md">${esc(t.modalText)}</p><ul class="cc-list">${[
    'necessary' as const,
    ...offered,
  ]
    .map(row)
    .join('')}</ul><div class="cc-btns">${btn('reject', t.rejectAll)}${btn('save', t.save, true)}${btn(
    'accept',
    t.acceptAll,
  )}</div></div></div>`;

  const banner = root.firstElementChild as HTMLElement;
  const overlay = root.lastElementChild as HTMLElement;
  const modal = overlay.firstElementChild as HTMLElement;
  const boxes = () => Array.from(modal.querySelectorAll<HTMLInputElement>('input[type=checkbox]'));
  let returnFocus: HTMLElement | null = null;

  const showPrefs = () => {
    const current = handlers.current();
    for (const box of boxes()) {
      if (!box.disabled) box.checked = !!current?.[box.value as OptionalCategory];
    }
    if (overlay.hidden) returnFocus = doc.activeElement as HTMLElement | null;
    overlay.hidden = false;
    modal.focus();
  };

  const hidePrefs = () => {
    if (overlay.hidden) return;
    overlay.hidden = true;
    const target =
      returnFocus && returnFocus !== doc.body && doc.contains(returnFocus)
        ? returnFocus
        : banner.hidden
          ? null
          : banner.querySelector<HTMLElement>('[data-cc=prefs]');
    target?.focus();
    returnFocus = null;
  };

  const onClick = (e: Event) => {
    const target = e.target as Element;
    if (target === overlay) return hidePrefs();
    const action = target.closest?.('[data-cc]')?.getAttribute('data-cc');
    if (action === 'accept') handlers.accept();
    else if (action === 'reject') handlers.reject();
    else if (action === 'prefs') showPrefs();
    else if (action === 'close') hidePrefs();
    else if (action === 'save')
      handlers.save(boxes().flatMap((b) => (b.checked && !b.disabled ? [b.value as OptionalCategory] : [])));
  };

  const onKey = (e: KeyboardEvent) => {
    if (overlay.hidden) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      hidePrefs();
    } else if (e.key === 'Tab') {
      const items = Array.from(modal.querySelectorAll<HTMLElement>('button,a[href],input:not([disabled])'));
      const first = items[0]!;
      const last = items[items.length - 1]!;
      const active = doc.activeElement;
      if (e.shiftKey && (active === first || active === modal)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (!modal.contains(active)) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  // Any element with data-cc-open (e.g. a "Cookie settings" footer link) opens the dialog.
  const onDocClick = (e: Event) => {
    const opener = (e.target as Element).closest?.('[data-cc-open]');
    if (opener && !root.contains(opener)) {
      e.preventDefault();
      showPrefs();
    }
  };

  root.addEventListener('click', onClick);
  doc.addEventListener('keydown', onKey);
  doc.addEventListener('click', onDocClick);
  // First in the tab order, so keyboard users reach it right away.
  doc.body.prepend(root);

  return {
    root,
    showBanner: () => {
      banner.hidden = false;
    },
    showPrefs,
    hidePrefs,
    hideAll: () => {
      hidePrefs();
      banner.hidden = true;
    },
    destroy: () => {
      doc.removeEventListener('keydown', onKey);
      doc.removeEventListener('click', onDocClick);
      root.remove();
    },
  };
}
