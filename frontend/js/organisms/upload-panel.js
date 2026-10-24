import { h } from '../lib/dom.js';
import { Button } from '../atoms/button.js';
import { Heading } from '../atoms/heading.js';
import { Text } from '../atoms/text.js';
import { Spinner } from '../atoms/spinner.js';
import { Dropzone } from '../molecules/dropzone.js';
import { SettingsForm } from './settings-form.js';

/** Upload + settings + actions. Emits onAnalyze(file, params) and onExport(kind, file, params). */
export function UploadPanel({ onFile, onAnalyze, onExport } = {}) {
  let file = null;
  const settings = SettingsForm();
  const analyzeBtn = Button({ label: 'Analyze', disabled: true, type: 'submit' });
  const tableBtn = Button({ label: 'Table CSV', variant: 'secondary', disabled: true,
    onClick: () => onExport?.('table', file, settings.getParams()) });
  const runsBtn = Button({ label: 'Segments CSV', variant: 'secondary', disabled: true,
    onClick: () => onExport?.('runs', file, settings.getParams()) });
  const status = h('div', { class: 'o-upload__status', 'aria-live': 'polite' });

  const el = h('form', {
    class: 'o-upload',
    onSubmit: (e) => { e.preventDefault(); if (file) onAnalyze?.(file, settings.getParams()); },
  },
  Heading({ text: 'Image', level: 2 }),
  Dropzone({ onFile: (f) => { file = f; analyzeBtn.disabled = false; onFile?.(f); } }),
  settings.el,
  h('div', { class: 'o-upload__actions' }, analyzeBtn),
  h('div', { class: 'o-upload__exports' },
    Text({ text: 'Export', tone: 'muted', as: 'span' }), tableBtn, runsBtn),
  status);

  return {
    el,
    setBusy(busy) {
      analyzeBtn.disabled = busy || !file;
      status.replaceChildren(...(busy ? [Spinner(), Text({ text: 'Analyzing…', tone: 'muted', as: 'span' })] : []));
    },
    setError(msg) {
      status.replaceChildren(Text({ text: msg, tone: 'error' }));
    },
    setReady(threshold) {
      tableBtn.disabled = runsBtn.disabled = false;
      settings.setThreshold(threshold);
    },
  };
}
