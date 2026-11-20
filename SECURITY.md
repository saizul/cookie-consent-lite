# Security policy

## Supported versions

Only the latest release receives fixes.

## Reporting a vulnerability

Please do **not** open a public issue for security problems. Use GitHub's
private vulnerability reporting ("Report a vulnerability" under the
repository's **Security** tab). You will get an answer within a week.

## Scope

cookie-consent-lite runs on every page of the sites that use it and decides
which scripts may run, so these reports are especially welcome:

- **Consent bypass.** Any way a script marked `type="text/plain"
  data-consent="..."` runs, or a Google Consent Mode type is sent as
  `granted`, without the visitor allowing that category. That includes a
  crafted cookie value.
- **HTML or script injection.** Texts, translations and `policyUrl` are
  escaped before they go into the page. A way to inject markup through
  options, the cookie or the URL is a bug.
- **Accessibility traps** that make the banner impossible to dismiss with a
  keyboard or a screen reader are treated as high-priority bugs too.

## What it does not do

It makes no network requests and sends the choice nowhere. It does not
remove cookies that third-party scripts already set before consent was
withdrawn; reload the page (or use `reloadOnRevoke`) and clear them in your
own code if you need to.
