import { h } from '../lib/dom.js';
import { Button } from '../atoms/button.js';

export function Pagination({ page, pages, onChange } = {}) {
  const go = (p) => onChange?.(Math.min(Math.max(p, 0), pages - 1));
  return h('nav', { class: 'm-pagination', 'aria-label': 'Table pages' },
    Button({ label: '«', variant: 'ghost', disabled: page === 0, onClick: () => go(0) }),
    Button({ label: '‹ Prev', variant: 'ghost', disabled: page === 0, onClick: () => go(page - 1) }),
    h('span', { class: 'm-pagination__status' }, `Page ${page + 1} of ${pages}`),
    Button({ label: 'Next ›', variant: 'ghost', disabled: page >= pages - 1, onClick: () => go(page + 1) }),
    Button({ label: '»', variant: 'ghost', disabled: page >= pages - 1, onClick: () => go(pages - 1) }));
}
