// Tiny DOM helpers shared by every component.
const SVG_NS = 'http://www.w3.org/2000/svg';

function apply(el, props) {
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v == null || v === false) continue;
    if (k === 'class') el.setAttribute('class', v);
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k in el && !(el instanceof SVGElement)) el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
}

export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  apply(el, props);
  el.append(...children.flat().filter((c) => c != null && c !== false));
  return el;
}

export function s(tag, props, ...children) {
  const el = document.createElementNS(SVG_NS, tag);
  apply(el, props);
  el.append(...children.flat().filter((c) => c != null && c !== false));
  return el;
}

export const fmtInt = (n) => n.toLocaleString('en-US');
export const fmtPct = (r, digits = 2) => `${(r * 100).toFixed(digits)}%`;
export const compact = (n) =>
  n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}K` : `${n}`;
