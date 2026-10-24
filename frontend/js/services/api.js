// Calls to the Flask backend. Every request re-sends the image: the server is stateless.

function formData(file, params) {
  const fd = new FormData();
  fd.append('image', file);
  for (const [k, v] of Object.entries(params)) fd.append(k, v);
  return fd;
}

async function post(url, file, params) {
  const res = await fetch(url, { method: 'POST', body: formData(file, params) });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `Request failed (${res.status})`);
  }
  return res;
}

export async function analyzeImage(file, params) {
  return (await post('/api/analyze', file, params)).json();
}

/** kind: 'table' | 'runs' — downloads the CSV. */
export async function downloadCsv(kind, file, params) {
  const blob = await (await post(`/api/export/${kind}`, file, params)).blob();
  const url = URL.createObjectURL(blob);
  const base = file.name.replace(/\.[^.]+$/, '');
  const a = Object.assign(document.createElement('a'), { href: url, download: `${base}_${kind}.csv` });
  a.click();
  URL.revokeObjectURL(url);
}
