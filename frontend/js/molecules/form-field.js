import { h } from '../lib/dom.js';
import { Label } from '../atoms/label.js';
import { Text } from '../atoms/text.js';

/** Label + control (+ optional hint). */
export function FormField({ label, control, hint } = {}) {
  return h('div', { class: 'm-form-field' },
    Label({ text: label, htmlFor: control.id }),
    control,
    hint && Text({ text: hint, tone: 'muted', as: 'small' }));
}
