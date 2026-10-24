import { h } from '../lib/dom.js';

/** tone: 'body' | 'muted' | 'error' */
export function Text({ text, tone = 'body', as = 'p' } = {}) {
  return h(as, { class: `a-text a-text--${tone}` }, text);
}
