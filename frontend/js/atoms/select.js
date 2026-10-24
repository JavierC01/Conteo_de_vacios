import { h } from '../lib/dom.js';

/** options: [{ value, label }] */
export function Select({ id, options, value, disabled = false, onChange } = {}) {
  const el = h('select', { class: 'a-select', id, disabled, onChange },
    options.map((o) => h('option', { value: o.value }, o.label)));
  if (value != null) el.value = String(value);
  return el;
}
