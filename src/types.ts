/** The four consent categories. `necessary` is always granted. */
export type Category = 'necessary' | 'analytics' | 'marketing' | 'functional';

/** A category the visitor can switch on or off. */
export type OptionalCategory = Exclude<Category, 'necessary'>;

/** Whether each category is allowed. */
export type Choices = Record<Category, boolean>;

/** The visitor's decision, as stored in the consent cookie. */
export interface ConsentState {
  /** Which categories are allowed. `necessary` is always `true`. */
  categories: Choices;
  /** The policy revision the visitor agreed to. */
  revision: string;
  /** When the choice was made, in milliseconds since the epoch. */
  timestamp: number;
  /** `true` when the browser sent a Global Privacy Control signal and it was respected. */
  gpc: boolean;
}

/** Called after every decision with the new and the previous state. */
export type ChangeListener = (state: ConsentState, previous: ConsentState | null) => void;

/** Texts shown in the banner and the preferences dialog. */
export interface Strings {
  bannerTitle: string;
  bannerText: string;
  acceptAll: string;
  rejectAll: string;
  preferences: string;
  modalTitle: string;
  modalText: string;
  save: string;
  close: string;
  policyLink: string;
  alwaysOn: string;
  gpcNote: string;
  categories: Record<Category, { title: string; description: string }>;
}

/** A partial override of {@link Strings}; category texts are merged one level deep. */
export type StringsOverride = Partial<Omit<Strings, 'categories'>> & {
  categories?: Partial<Record<Category, Partial<Strings['categories'][Category]>>>;
};

export interface CookieOptions {
  /** Cookie name. Default `cc_consent`. */
  name?: string;
  /** Days until the choice expires and the banner is shown again. Default 182 (about six months). */
  days?: number;
  /** Cookie domain, e.g. `.example.com` to share the choice across subdomains. Default: current host. */
  domain?: string;
  /** Cookie path. Default `/`. */
  path?: string;
  /** SameSite attribute. Default `Lax`. */
  sameSite?: 'Lax' | 'Strict' | 'None';
}

export interface GoogleConsentModeOptions {
  /** Milliseconds Google tags wait for an update before using the defaults. Default 500. */
  waitForUpdate?: number;
  /** Limit the defaults to these ISO 3166-2 regions, e.g. `['EU', 'GB']`. Default: everywhere. */
  regions?: string[];
  /** Redact ad click identifiers while ad storage is denied. Default `true`. */
  adsDataRedaction?: boolean;
  /** Pass ad click information through URLs while cookies are denied. Default `false`. */
  urlPassthrough?: boolean;
}

export interface ConsentOptions {
  /** Policy revision. Change it to ask everyone again. Default `1`. */
  revision?: string | number;
  /** Optional categories to offer, in display order. Default `['analytics', 'marketing', 'functional']`. */
  categories?: OptionalCategory[];
  /** Language: `en`, `bn`, a key of `translations`, or `auto` (from `<html lang>`). Default `auto`. */
  lang?: string;
  /** Extra languages, keyed by language code. */
  translations?: Record<string, Strings>;
  /** Override some of the texts of the chosen language. */
  strings?: StringsOverride;
  /** Link to your cookie or privacy policy, shown in the banner. */
  policyUrl?: string;
  /** Cookie settings. */
  cookie?: CookieOptions;
  /** Send Google Consent Mode v2 signals through `gtag()`. Default `true`. */
  googleConsentMode?: boolean | GoogleConsentModeOptions;
  /** Keep marketing off when the browser sends Global Privacy Control. Default `true`. */
  respectGpc?: boolean;
  /** Show the banner when there is no valid choice yet. Default `true`. */
  autoShow?: boolean;
  /** Add the default stylesheet. Default `true`. */
  injectCss?: boolean;
  /** Banner position. Default `bottom`. */
  position?: 'bottom' | 'top' | 'bottom-left' | 'bottom-right';
  /** Colour scheme: `light`, `dark`, or `auto` (follows the operating system). Default `light`. */
  theme?: 'light' | 'dark' | 'auto';
  /** Assign the instance to `window.CookieConsent`. Default `true`. */
  exposeGlobal?: boolean;
  /** Reload the page when a previously allowed category is withdrawn. Default `false`. */
  reloadOnRevoke?: boolean;
  /** Called after every decision. */
  onChange?: ChangeListener;
  /** The window to use. Default: the global `window`. Useful for tests and iframes. */
  window?: Window;
}

/** The object returned by `createConsent()` and assigned to `window.CookieConsent`. */
export interface CookieConsent {
  /** Show the banner. */
  show(): void;
  /** Hide the banner and the preferences dialog without deciding. */
  hide(): void;
  /** Open the preferences dialog. */
  showPreferences(): void;
  /** Close the preferences dialog. */
  hidePreferences(): void;
  /** Allow every offered category, or exactly the listed ones. */
  accept(categories?: OptionalCategory[] | 'all'): ConsentState;
  /** Allow only necessary cookies. */
  reject(): ConsentState;
  /** Listen for decisions. Returns a function that removes the listener. */
  onChange(listener: ChangeListener): () => void;
  /** The current decision, or `null` if the visitor has not decided (or must decide again). */
  get(): ConsentState | null;
  /** Whether a category is allowed right now. */
  has(category: Category): boolean;
  /** Forget the decision, deny everything in Google Consent Mode and show the banner again. */
  reset(): void;
  /** Remove the banner, dialog and listeners from the page. */
  destroy(): void;
}
