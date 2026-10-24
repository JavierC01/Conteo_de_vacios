import { h } from '../lib/dom.js';

export function Label({ text, htmlFor } = {}) {
  return h('label', { class: 'a-label', htmlFor }, text);
}
