import { h } from '../lib/dom.js';

export function Input({ id, type = 'text', value, min, max, step, disabled = false, onInput, ...rest } = {}) {
  // value goes last so min/max are already in place when a range input clamps it
  const el = h('input', { class: `a-input a-input--${type}`, id, type, min, max, step, disabled, onInput, ...rest });
  if (value != null) el.value = String(value);
  return el;
}
