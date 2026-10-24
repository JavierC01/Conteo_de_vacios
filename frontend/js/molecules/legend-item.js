import { h } from '../lib/dom.js';

/** Colored swatch beside text-colored label (identity never by text color). */
export function LegendItem({ label, swatchClass } = {}) {
  return h('span', { class: 'm-legend-item' },
    h('span', { class: `m-legend-item__swatch ${swatchClass}`, 'aria-hidden': 'true' }), label);
}
