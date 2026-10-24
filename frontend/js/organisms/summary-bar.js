import { h, fmtInt, fmtPct } from '../lib/dom.js';
import { StatCard } from '../molecules/stat-card.js';

export function SummaryBar({ result }) {
  const t = result.table;
  const peak = t.void_px.reduce((best, v, i) => (v > t.void_px[best] ? i : best), 0);
  const peakLabel = t.x_start[peak] === t.x_end[peak] ? `x = ${t.x_start[peak]}` : `x ${t.x_start[peak]}–${t.x_end[peak]}`;
  return h('section', { class: 'o-summary', 'aria-label': 'Summary' },
    StatCard({ label: 'Void ratio', value: fmtPct(result.void_ratio), hint: `${fmtInt(result.void_px)} of ${fmtInt(result.total_px)} px` }),
    StatCard({ label: 'Image size', value: `${result.width} × ${result.height}`, hint: 'pixels (W × H)' }),
    StatCard({ label: 'Threshold used', value: String(result.threshold_used),
      hint: result.params.method === 'otsu' ? 'Otsu, automatic' : 'manual' }),
    StatCard({ label: 'Peak column', value: fmtInt(t.void_px[peak]), hint: `void px at ${peakLabel}` }));
}
