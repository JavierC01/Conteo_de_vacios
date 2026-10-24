import { h } from '../lib/dom.js';

/** variant: 'primary' | 'secondary' | 'ghost' */
export function Button({ label, variant = 'primary', type = 'button', disabled = false, onClick } = {}) {
  return h('button', { class: `a-button a-button--${variant}`, type, disabled, onClick }, label);
}
