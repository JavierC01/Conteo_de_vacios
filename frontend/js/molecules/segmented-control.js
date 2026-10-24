import { h } from '../lib/dom.js';

/** options: [{ value, label }] — single choice shown as joined buttons. */
export function SegmentedControl({ options, value, onChange, label } = {}) {
  const root = h('div', { class: 'm-segmented', role: 'group', 'aria-label': label });
  const render = (current) => {
    root.replaceChildren(...options.map((o) =>
      h('button', {
        type: 'button',
        class: 'm-segmented__item',
        'aria-pressed': String(o.value === current),
        onClick: () => { render(o.value); onChange?.(o.value); },
      }, o.label)));
  };
  render(value);
  return root;
}
