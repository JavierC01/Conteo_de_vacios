import { h } from '../lib/dom.js';
import { Heading } from '../atoms/heading.js';
import { Text } from '../atoms/text.js';

/** Header + sidebar + main content slots. */
export function DashboardLayout({ title, subtitle }) {
  const sidebar = h('aside', { class: 't-dashboard__sidebar' });
  const main = h('main', { class: 't-dashboard__main' });
  const el = h('div', { class: 't-dashboard' },
    h('header', { class: 't-dashboard__header' },
      Heading({ text: title, level: 1 }), Text({ text: subtitle, tone: 'muted' })),
    h('div', { class: 't-dashboard__body' }, sidebar, main));
  return { el, sidebar, main };
}
