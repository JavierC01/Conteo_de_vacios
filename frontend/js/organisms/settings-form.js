import { h } from '../lib/dom.js';
import { Input } from '../atoms/input.js';
import { Select } from '../atoms/select.js';
import { FormField } from '../molecules/form-field.js';

export const DEFAULT_PARAMS = { method: 'otsu', threshold: 128, polarity: 'dark', smoothing: 0, bin_width: 1 };

/** Threshold / polarity / smoothing / binning controls. getParams() reads the current values. */
export function SettingsForm({ initial = DEFAULT_PARAMS } = {}) {
  const method = Select({
    id: 'method', value: initial.method,
    options: [{ value: 'otsu', label: 'Automatic (Otsu)' }, { value: 'manual', label: 'Manual' }],
  });
  const thresholdValue = h('output', { class: 'm-form-field__output', htmlFor: 'threshold' }, initial.threshold);
  const threshold = Input({
    id: 'threshold', type: 'range', min: 0, max: 255, step: 1, value: initial.threshold,
    onInput: () => { thresholdValue.textContent = threshold.value; },
  });
  const polarity = Select({
    id: 'polarity', value: initial.polarity,
    options: [{ value: 'dark', label: 'Voids are darker than fibers' },
              { value: 'light', label: 'Voids are lighter than fibers' }],
  });
  const smoothing = Select({
    id: 'smoothing', value: initial.smoothing,
    options: [0, 3, 5, 7].map((n) => ({ value: n, label: n ? `Median ${n}×${n}` : 'Off' })),
  });
  const binWidth = Input({ id: 'bin_width', type: 'number', min: 1, step: 1, value: initial.bin_width });

  const syncMethod = () => {
    threshold.disabled = method.value === 'otsu';
  };
  method.addEventListener('change', syncMethod);
  syncMethod();

  const thresholdField = FormField({ label: 'Threshold (0–255)', control: threshold,
    hint: 'Used only in manual mode.' });
  thresholdField.querySelector('label').append(' ', thresholdValue);

  const el = h('fieldset', { class: 'o-settings' },
    h('legend', { class: 'o-settings__legend' }, 'Segmentation'),
    FormField({ label: 'Threshold method', control: method }),
    thresholdField,
    FormField({ label: 'Void polarity', control: polarity }),
    FormField({ label: 'Noise smoothing', control: smoothing }),
    FormField({ label: 'Columns per table row', control: binWidth, hint: '1 = one row per pixel column.' }));

  return {
    el,
    getParams: () => ({
      method: method.value,
      threshold: Number(threshold.value),
      polarity: polarity.value,
      smoothing: Number(smoothing.value),
      bin_width: Math.max(1, Math.floor(Number(binWidth.value) || 1)),
    }),
    setThreshold: (t) => {
      if (method.value === 'otsu') { threshold.value = t; thresholdValue.textContent = t; }
    },
  };
}
