import { h } from '../lib/dom.js';
import { Text } from '../atoms/text.js';

/** Click or drag-and-drop an image file. */
export function Dropzone({ accept = 'image/*', onFile } = {}) {
  const input = h('input', { type: 'file', accept, class: 'm-dropzone__input', id: 'file-input' });
  const name = Text({ text: 'Drop a wood image here or click to choose', tone: 'muted' });
  const zone = h('label', { class: 'm-dropzone', htmlFor: 'file-input' }, input, name);

  const pick = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    name.textContent = `${file.name} · ${(file.size / 1024).toFixed(0)} KB`;
    zone.classList.add('is-filled');
    onFile?.(file);
  };
  input.addEventListener('change', () => pick(input.files[0]));
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('is-over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('is-over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('is-over');
    pick(e.dataTransfer.files[0]);
  });
  return zone;
}
