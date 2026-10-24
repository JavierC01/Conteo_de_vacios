import { h } from '../lib/dom.js';

export function Spinner({ label = 'Loading' } = {}) {
  return h('span', { class: 'a-spinner', role: 'status', 'aria-label': label });
}
