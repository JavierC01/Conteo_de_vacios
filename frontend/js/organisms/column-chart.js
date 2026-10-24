import { h, s, fmtInt, fmtPct, compact } from '../lib/dom.js';
import { Heading } from '../atoms/heading.js';

const M = { top: 16, right: 16, bottom: 36, left: 52 };
const HEIGHT = 260;

function niceStep(max, count = 4) {
  const raw = max / count || 1;
  const mag = 10 ** Math.floor(Math.log10(raw));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((st) => st >= raw);
}

function barPath(x, y, w, base, r = 4) {
  const rr = Math.min(r, w / 2, base - y);
  if (base - y <= 0) return '';
  return `M${x},${base}V${y + rr}Q${x},${y} ${x + rr},${y}H${x + w - rr}Q${x + w},${y} ${x + w},${y + rr}V${base}Z`;
}

/** Void pixels per column (or bin). Bars when bins are wide enough, otherwise a line + area wash. */
export function ColumnChart({ table, width: imgW, onHover }) {
  const svgHost = h('div', { class: 'o-chart__plot' });
  const tip = h('div', { class: 'o-chart__tip', hidden: true, role: 'tooltip' });
  const el = h('section', { class: 'o-chart' },
    Heading({ text: 'Void pixels per column (X)', level: 3 }),
    h('div', { class: 'o-chart__frame' }, svgHost, tip));

  const n = table.void_px.length;
  const maxV = Math.max(1, ...table.void_px);
  const step = niceStep(maxV);
  const yMax = Math.ceil(maxV / step) * step;

  function render(W) {
    const pw = Math.max(10, W - M.left - M.right);
    const ph = HEIGHT - M.top - M.bottom;
    const xs = (col) => M.left + (col / imgW) * pw;
    const ys = (v) => M.top + ph - (v / yMax) * ph;
    const base = ys(0);
    const slot = (pw * (table.x_end[0] - table.x_start[0] + 1)) / imgW;
    const asBars = slot >= 4;

    const grid = [];
    for (let v = 0; v <= yMax + 1e-9; v += step) {
      grid.push(s('line', { class: 'o-chart__grid', x1: M.left, x2: M.left + pw, y1: ys(v), y2: ys(v) }),
        s('text', { class: 'o-chart__tick', x: M.left - 8, y: ys(v), 'text-anchor': 'end', 'dominant-baseline': 'middle' }, compact(v)));
    }
    const xStep = niceStep(imgW, Math.max(2, Math.floor(pw / 90)));
    for (let c = 0; c <= imgW; c += xStep) {
      grid.push(s('text', { class: 'o-chart__tick', x: xs(c), y: base + 18, 'text-anchor': 'middle' }, compact(c)));
    }

    let marks;
    if (asBars) {
      const bw = Math.min(24, slot - 2);
      marks = table.void_px.map((v, i) => {
        const cx = xs((table.x_start[i] + table.x_end[i] + 1) / 2);
        return s('path', { class: 'o-chart__bar', d: barPath(cx - bw / 2, ys(v), bw, base), dataset: { i } });
      });
    } else {
      const pts = table.void_px.map((v, i) => [xs((table.x_start[i] + table.x_end[i] + 1) / 2), ys(v)]);
      const line = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join('');
      marks = [
        s('path', { class: 'o-chart__area', d: `${line}L${pts[n - 1][0]},${base}L${pts[0][0]},${base}Z` }),
        s('path', { class: 'o-chart__line', d: line }),
      ];
    }

    const cross = s('line', { class: 'o-chart__cross', y1: M.top, y2: base, visibility: 'hidden' });
    const dot = s('circle', { class: 'o-chart__dot', r: 4, visibility: 'hidden' });
    const hit = s('rect', { class: 'o-chart__hit', x: M.left, y: M.top, width: pw, height: ph });

    let active = -1;
    const show = (i) => {
      if (i === active) return;
      active = i;
      if (asBars) svg.querySelectorAll('.o-chart__bar').forEach((b) => b.classList.toggle('is-dim', +b.dataset.i !== i && i >= 0));
      if (i < 0) {
        cross.setAttribute('visibility', 'hidden'); dot.setAttribute('visibility', 'hidden');
        tip.hidden = true; onHover?.(null, null); return;
      }
      const cx = xs((table.x_start[i] + table.x_end[i] + 1) / 2);
      const cy = ys(table.void_px[i]);
      cross.setAttribute('x1', cx); cross.setAttribute('x2', cx); cross.setAttribute('visibility', 'visible');
      if (!asBars) { dot.setAttribute('cx', cx); dot.setAttribute('cy', cy); dot.setAttribute('visibility', 'visible'); }
      const range = table.x_start[i] === table.x_end[i] ? `x = ${table.x_start[i]}` : `x ${table.x_start[i]}–${table.x_end[i]}`;
      tip.replaceChildren(
        h('strong', null, range),
        h('span', null, `Void px: ${fmtInt(table.void_px[i])}`),
        h('span', null, `Void ratio: ${fmtPct(table.void_ratio[i])}`),
        h('span', null, `Mean y: ${table.y_mean[i] ?? '—'}`),
        h('span', null, `Segments: ${table.segments[i]}`));
      tip.hidden = false;
      const tw = tip.offsetWidth;
      tip.style.left = `${Math.max(0, cx + 12 + tw > W ? cx - tw - 12 : cx + 12)}px`;
      tip.style.top = `${Math.max(0, cy - tip.offsetHeight - 8)}px`;
      onHover?.(table.x_start[i], table.x_end[i]);
    };
    hit.addEventListener('pointermove', (e) => {
      const box = svg.getBoundingClientRect();
      const col = ((e.clientX - box.left - M.left) / pw) * imgW;
      const bin = table.x_end[0] - table.x_start[0] + 1;
      show(Math.min(n - 1, Math.max(0, Math.floor(col / bin))));
    });
    hit.addEventListener('pointerleave', () => show(-1));

    const svg = s('svg', { class: 'o-chart__svg', width: W, height: HEIGHT, viewBox: `0 0 ${W} ${HEIGHT}`,
      role: 'img', 'aria-label': `Void pixels per column, maximum ${maxV}` },
    grid,
    s('line', { class: 'o-chart__axis', x1: M.left, x2: M.left + pw, y1: base, y2: base }),
    marks, cross, dot, hit,
    s('text', { class: 'o-chart__axis-label', x: M.left + pw / 2, y: HEIGHT - 4, 'text-anchor': 'middle' }, 'Column x (px)'),
    s('text', { class: 'o-chart__axis-label', x: 12, y: M.top + ph / 2, 'text-anchor': 'middle',
      transform: `rotate(-90 12 ${M.top + ph / 2})` }, 'Void px'));
    svgHost.replaceChildren(svg);
  }

  // Re-render only on width changes, outside the observer callback (rendering changes height).
  let lastW = 0;
  new ResizeObserver(([entry]) => {
    const w = Math.round(entry.contentRect.width);
    if (w > 0 && w !== lastW) {
      lastW = w;
      requestAnimationFrame(() => render(w));
    }
  }).observe(svgHost);
  return { el };
}
