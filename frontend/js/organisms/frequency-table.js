import { h, fmtInt, fmtPct } from '../lib/dom.js';
import { Heading } from '../atoms/heading.js';
import { Pagination } from '../molecules/pagination.js';

const PAGE_SIZE = 100;
const COLUMNS = [
  ['X', (t, i) => (t.x_start[i] === t.x_end[i] ? t.x_start[i] : `${t.x_start[i]}–${t.x_end[i]}`)],
  ['Void px (abs. freq.)', (t, i) => fmtInt(t.void_px[i])],
  ['Rel. freq.', (t, i) => fmtPct(t.rel_freq[i], 3)],
  ['Cum. freq.', (t, i) => fmtPct(t.cum_freq[i], 2)],
  ['Void ratio', (t, i) => fmtPct(t.void_ratio[i], 2)],
  ['y min', (t, i) => t.y_min[i] ?? '—'],
  ['y max', (t, i) => t.y_max[i] ?? '—'],
  ['y mean', (t, i) => t.y_mean[i] ?? '—'],
  ['Segments', (t, i) => t.segments[i]],
];

/** Paginated per-column frequency table. */
export function FrequencyTable({ table, onRowHover }) {
  const n = table.void_px.length;
  const pages = Math.ceil(n / PAGE_SIZE);
  const tbody = h('tbody');
  const pager = h('div');
  const el = h('section', { class: 'o-table' },
    Heading({ text: 'Frequency table by column', level: 3 }),
    h('div', { class: 'o-table__scroll' },
      h('table', { class: 'o-table__table' },
        h('thead', null, h('tr', null, COLUMNS.map(([name]) => h('th', { scope: 'col' }, name)))),
        tbody)),
    pager);

  const show = (page) => {
    const from = page * PAGE_SIZE;
    const rows = [];
    for (let i = from; i < Math.min(n, from + PAGE_SIZE); i++) {
      rows.push(h('tr', {
        onMouseenter: () => onRowHover?.(table.x_start[i], table.x_end[i]),
        onMouseleave: () => onRowHover?.(null, null),
      }, COLUMNS.map(([, cell]) => h('td', null, String(cell(table, i))))));
    }
    tbody.replaceChildren(...rows);
    pager.replaceChildren(pages > 1 ? Pagination({ page, pages, onChange: show }) : '');
  };
  show(0);
  return { el };
}
