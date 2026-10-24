import { h } from '../lib/dom.js';

export function StatCard({ label, value, hint } = {}) {
  return h('div', { class: 'm-stat' },
    h('span', { class: 'm-stat__label' }, label),
    h('span', { class: 'm-stat__value' }, value),
    hint && h('span', { class: 'm-stat__hint' }, hint));
}
