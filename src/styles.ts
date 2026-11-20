const DARK =
  '--cc-bg:#1c1f24;--cc-fg:#e6edf3;--cc-muted:#9ea7b3;--cc-border:#3d444d;--cc-accent:#8ab4ff;--cc-accent-fg:#0b0f14';

/**
 * The default stylesheet. Every colour, the radius, font and z-index come from
 * CSS custom properties on `.cc-root`, so a theme is a few lines of CSS.
 */
export const CSS = `.cc-root{--cc-bg:#fff;--cc-fg:#1f2328;--cc-muted:#57606a;--cc-border:#d0d7de;--cc-accent:#0b57d0;--cc-accent-fg:#fff;--cc-radius:12px;--cc-font:inherit;--cc-z:2147483000;--cc-shadow:0 8px 32px rgba(0,0,0,.2);--cc-max-width:960px;font:15px/1.5 var(--cc-font);color:var(--cc-fg)}
.cc-dark{${DARK}}
@media (prefers-color-scheme:dark){.cc-auto{${DARK}}}
.cc-root [hidden]{display:none!important}
.cc-root *{box-sizing:border-box}
.cc-banner{position:fixed;z-index:var(--cc-z);left:16px;right:16px;bottom:16px;margin:0 auto;max-width:var(--cc-max-width);max-height:calc(100vh - 32px);overflow:auto;background:var(--cc-bg);border:1px solid var(--cc-border);border-radius:var(--cc-radius);box-shadow:var(--cc-shadow);padding:20px;display:flex;flex-wrap:wrap;gap:16px;align-items:flex-end}
.cc-top .cc-banner{bottom:auto;top:16px}
.cc-bottom-left .cc-banner{right:auto;max-width:420px}
.cc-bottom-right .cc-banner{left:auto;max-width:420px}
.cc-body{flex:1 1 300px}
.cc-h{margin:0 0 4px;font-size:1.15em;line-height:1.3}
.cc-p{margin:0;color:var(--cc-muted)}
.cc-p a{color:var(--cc-accent)}
.cc-btns{display:flex;flex-wrap:wrap;gap:8px}
.cc-btn{font:inherit;font-weight:600;cursor:pointer;min-height:44px;padding:8px 16px;border-radius:calc(var(--cc-radius) - 4px);border:2px solid var(--cc-accent);background:var(--cc-accent);color:var(--cc-accent-fg)}
.cc-btn.cc-o{background:transparent;color:var(--cc-accent)}
.cc-root :focus-visible{outline:3px solid var(--cc-accent);outline-offset:2px}
.cc-modal:focus{outline:0}
.cc-overlay{position:fixed;inset:0;z-index:calc(var(--cc-z) + 1);background:rgba(0,0,0,.55);display:flex;align-items:center;justify-content:center;padding:16px}
.cc-modal{background:var(--cc-bg);border-radius:var(--cc-radius);box-shadow:var(--cc-shadow);width:100%;max-width:560px;max-height:calc(100vh - 32px);overflow:auto;padding:24px}
.cc-head{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
.cc-x{font:inherit;font-size:24px;line-height:1;width:44px;height:44px;flex:none;border:0;border-radius:50%;background:none;color:inherit;cursor:pointer}
.cc-list{list-style:none;margin:16px 0;padding:0}
.cc-cat{padding:12px 0;border-top:1px solid var(--cc-border)}
.cc-row{display:flex;align-items:center;gap:10px;font-weight:600;cursor:pointer}
.cc-row input{width:20px;height:20px;margin:0;accent-color:var(--cc-accent)}
.cc-badge{margin-left:auto;font-size:.85em;font-weight:500;color:var(--cc-muted)}
.cc-cat .cc-p{margin:4px 0 0 30px;font-size:.93em}
@media (max-width:600px){.cc-btns{width:100%}.cc-btn{flex:1 1 auto}}`;
