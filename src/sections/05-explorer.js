// B22: pick a race and a year. B23: method notes and every source.
import { fmt, fmt1, COUNT_LABEL, IMPACT_LABEL } from '../lib/data.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return u; } };

export function init(root, data) {
  const raceSel = root.querySelector('#ex-race');
  const yearSel = root.querySelector('#ex-year');
  const card = root.querySelector('#ex-card');
  const routeRaces = new Set(['jakim', 'borobudur']);

  raceSel.innerHTML = data.races.map((r) => `<option value="${r.race_id}">${esc(r.name)}</option>`).join('');
  raceSel.value = 'jakim';

  function fillYears() {
    const r = data.byId.get(raceSel.value);
    const start = r.first_edition || 2018;
    const ys = [];
    for (let y = 2026; y >= Math.max(start, 2012); y--) ys.push(y);
    yearSel.innerHTML = ys.map((y) => `<option>${y}</option>`).join('');
  }

  function render() {
    const r = data.byId.get(raceSel.value);
    const y = +yearSel.value;
    const row = data.get(r.race_id, y);
    const label = data.labels.filter((l) => l.race_id === r.race_id && l.year <= y).sort((a, b) => b.year - a.year)[0];
    const gap = '<span class="gap-chip">tidak ada data</span>';
    card.innerHTML = `
      <h4>${esc(r.name)} <span>${y}</span></h4>
      <p class="where">${esc(r.city)}, ${esc(r.province)} · edisi pertama ${r.first_edition ?? 'tidak diketahui'}</p>
      <dl>
        <dt>Pelari</dt><dd>${row?.runners ? `${fmt(row.runners)} <small>${esc(COUNT_LABEL[row.count_type] || row.count_type)}</small>` : gap}</dd>
        <dt>Di 42K</dt><dd>${row?.runners_42k != null ? fmt(row.runners_42k) : gap}</dd>
        <dt>Dampak ekonomi</dt><dd>${row?.impact_rp_bn ? `Rp${fmt1(row.impact_rp_bn)} miliar <small>${esc(IMPACT_LABEL[row.impact_type] || row.impact_type)}</small>` : gap}</dd>
        <dt>Label</dt><dd>${label ? esc(label.label) : gap}</dd>
        <dt>Rute</dt><dd>${routeRaces.has(r.race_id) && y === 2026 ? 'draf di peta atas' : '<span class="gap-chip">belum digambar</span>'}</dd>
      </dl>
      ${row?.note ? `<p class="small">${esc(row.note)}</p>` : ''}
      ${row?.source_url ? `<p class="small">Sumber: <a href="${esc(row.source_url)}" target="_blank" rel="noopener">${esc(host(row.source_url))}</a></p>` : ''}`;
  }
  raceSel.addEventListener('change', () => { fillYears(); render(); });
  yearSel.addEventListener('change', render);
  fillYears();
  yearSel.value = '2026';
  render();

  // B23 source list, grouped by race
  const list = root.querySelector('#sources');
  const items = [];
  for (const r of data.races) {
    const urls = new Map();
    urls.set(r.source_url, `riwayat`);
    data.years.filter((d) => d.race_id === r.race_id).forEach((d) => urls.set(d.source_url, (urls.get(d.source_url) ? urls.get(d.source_url) + ', ' : '') + d.year));
    data.origins.filter((d) => d.race_id === r.race_id).forEach((d) => urls.set(d.source_url, urls.get(d.source_url) || `asal pelari ${d.year}`));
    data.labels.filter((d) => d.race_id === r.race_id).forEach((d) => urls.set(d.source_url, urls.get(d.source_url) || `label ${d.year}`));
    items.push(`<li><b>${esc(r.name)}</b>: ${[...urls].filter(([u]) => u).map(([u, t]) => `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(host(u))}</a> <small>(${esc(t)})</small>`).join('; ')}</li>`);
  }
  data.events.forEach((e) => items.push(`<li><b>Jumlah event lari ${e.year}</b>: <a href="${esc(e.source_url)}" target="_blank" rel="noopener">${esc(host(e.source_url))}</a></li>`));
  list.innerHTML = items.join('');
}
