import { h } from '../lib/dom.js';

export function Heading({ text, level = 2 } = {}) {
  return h(`h${level}`, { class: `a-heading a-heading--h${level}` }, text);
}
