import { h } from '../lib/dom.js';
import { SegmentedControl } from '../molecules/segmented-control.js';
import { LegendItem } from '../molecules/legend-item.js';

/** Original / void overlay viewer with a column highlight band driven by the chart. */
export function ImageViewer({ originalUrl, overlayUrl, width }) {
  const img = h('img', { class: 'o-viewer__img', src: overlayUrl, alt: 'Wood image with void pixels highlighted' });
  const band = h('div', { class: 'o-viewer__band', hidden: true });
  const toggle = SegmentedControl({
    label: 'Image view', value: 'overlay',
    options: [{ value: 'overlay', label: 'Voids highlighted' }, { value: 'original', label: 'Original' }],
    onChange: (v) => { img.src = v === 'overlay' ? overlayUrl : originalUrl; },
  });
  const el = h('section', { class: 'o-viewer' },
    h('div', { class: 'o-viewer__bar' }, toggle, LegendItem({ label: 'Void pixel', swatchClass: 'is-void' })),
    h('div', { class: 'o-viewer__frame' }, img, band));
  return {
    el,
    highlight(xStart, xEnd) {
      if (xStart == null) { band.hidden = true; return; }
      band.hidden = false;
      band.style.left = `${(xStart / width) * 100}%`;
      band.style.width = `max(2px, ${((xEnd - xStart + 1) / width) * 100}%)`;
    },
  };
}
