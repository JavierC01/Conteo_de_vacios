import { h } from '../lib/dom.js';
import { Text } from '../atoms/text.js';
import { DashboardLayout } from '../templates/dashboard-layout.js';
import { UploadPanel } from '../organisms/upload-panel.js';
import { SummaryBar } from '../organisms/summary-bar.js';
import { ImageViewer } from '../organisms/image-viewer.js';
import { ColumnChart } from '../organisms/column-chart.js';
import { FrequencyTable } from '../organisms/frequency-table.js';
import { analyzeImage, downloadCsv } from '../services/api.js';

export function HomePage(root) {
  const layout = DashboardLayout({
    title: 'Wood void pixel counter',
    subtitle: 'Upload a wood image to find the void (non-fiber) pixels and count them per column.',
  });
  let originalUrl = null;

  const empty = () => layout.main.replaceChildren(
    h('div', { class: 'p-home__empty' },
      Text({ text: 'No analysis yet. Choose an image and press Analyze.', tone: 'muted' })));

  const panel = UploadPanel({
    onFile(file) {
      if (originalUrl) URL.revokeObjectURL(originalUrl);
      originalUrl = URL.createObjectURL(file);
    },
    async onAnalyze(file, params) {
      panel.setBusy(true);
      try {
        const result = await analyzeImage(file, params);
        panel.setBusy(false);
        panel.setReady(result.threshold_used);
        renderResult(result);
      } catch (err) {
        panel.setBusy(false);
        panel.setError(err.message);
      }
    },
    async onExport(kind, file, params) {
      try { await downloadCsv(kind, file, params); } catch (err) { panel.setError(err.message); }
    },
  });

  function renderResult(result) {
    const viewer = ImageViewer({
      originalUrl,
      overlayUrl: `data:image/png;base64,${result.overlay_png_b64}`,
      width: result.width,
    });
    const highlight = (a, b) => viewer.highlight(a, b);
    layout.main.replaceChildren(
      SummaryBar({ result }),
      viewer.el,
      ColumnChart({ table: result.table, width: result.width, onHover: highlight }).el,
      FrequencyTable({ table: result.table, onRowHover: highlight }).el);
  }

  layout.sidebar.append(panel.el);
  empty();
  root.replaceChildren(layout.el);
}
