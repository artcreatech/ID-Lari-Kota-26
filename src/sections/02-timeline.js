// B06–B09: who started when. One lane per race, 1999–2026.
import * as d3 from 'd3';
import { scrolly, sizeOf, dur } from '../lib/scrolly.js';
import { JAKARTA } from '../lib/data.js';
import { hatch } from './01-boom.js';

// How each race handled 2020–2021 (data scan, history table).
const PANDEMIC = {
  maybank: 'virtual 2 tahun',
  jrf: 'batal 2020',
  pocari_bandung: 'virtual 2020',
  borobudur: 'elite saja, putar candi',
};

export function init(root, data) {
  const box = root.querySelector('.graphic');
  const svg = d3.select(box).append('svg').attr('role', 'img');
  const note = root.querySelector('.graphic-note');
  let current = 'b06';

  function render(step) {
    current = step;
    const { w, h } = sizeOf(box);
    svg.attr('viewBox', `0 0 ${w} ${h}`).attr('width', w).attr('height', h);
    svg.selectAll('*').remove();
    hatch(svg);
    const m = { t: 40, r: 24, b: 34, l: w < 560 ? 96 : 150 };
    const races = [...data.races].sort((a, b) => (a.first_edition ?? 9999) - (b.first_edition ?? 9999));
    const x = d3.scaleLinear().domain([1999, 2026.9]).range([m.l, w - m.r]);
    const y = d3.scaleBand().domain(races.map((r) => r.race_id)).range([m.t, h - m.b]).padding(0.35);
    const g = svg.append('g');

    g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h - m.b})`)
      .call(d3.axisBottom(x).tickValues([1999, 2005, 2010, 2015, 2020, 2026]).tickFormat(d3.format('d')).tickSize(-(h - m.t - m.b)))
      .select('.domain').remove();

    if (step !== 'b06') {
      // pandemic band
      const band = g.append('rect').attr('class', 'pandemic').attr('x', x(2020)).attr('width', x(2022) - x(2020)).attr('y', m.t - 10).attr('height', h - m.t - m.b + 10);
      if (step === 'b07') band.style('opacity', 0);
      if (step === 'b08' || step === 'b09') g.append('text').attr('class', 'band-label').attr('x', x(2021)).attr('y', m.t - 16).attr('text-anchor', 'middle').text('2020–2021');
    }
    if (step === 'b07') {
      g.append('rect').attr('class', 'bracket').attr('x', x(2017) - 4).attr('width', x(2026.9) - x(2017) + 4).attr('y', m.t - 10).attr('height', h - m.t - m.b + 10);
      g.append('text').attr('class', 'band-label').attr('x', x(2017)).attr('y', m.t - 16).text('2017 ke atas: 7 dari 11');
    }

    races.forEach((r, i) => {
      const visible = step !== 'b06' || r.race_id === 'maybank';
      const dim = step === 'b07' && r.first_edition && r.first_edition < 2017;
      const lane = g.append('g').attr('class', `lane ${JAKARTA.has(r.race_id) ? 'jkt' : ''} ${dim ? 'dim' : ''}`).style('opacity', visible ? 1 : 0.12);
      const cy = y(r.race_id) + y.bandwidth() / 2;
      lane.append('text').attr('class', 'row-label').attr('x', m.l - 10).attr('y', cy + 4).attr('text-anchor', 'end').text(r.short_name);
      if (!r.first_edition) {
        lane.append('rect').attr('x', x(2018)).attr('width', x(2026.9) - x(2018)).attr('y', cy - 5).attr('height', 10).attr('fill', 'url(#hatch)');
        lane.append('text').attr('class', 'gap-label').attr('x', x(2026.9)).attr('y', cy - 9).attr('text-anchor', 'end').text('tahun mulai tidak diketahui');
        return;
      }
      const end = r.race_id === 'bekasi' ? 2025 : 2026.9; // no 2026 edition found
      lane.append('line').attr('class', 'lane-line').attr('x1', x(r.first_edition)).attr('x2', x(r.first_edition)).attr('y1', cy).attr('y2', cy)
        .transition().delay(dur(visible ? i * 60 : 0)).duration(dur(900)).attr('x2', x(end));
      lane.append('circle').attr('class', 'lane-dot').attr('cx', x(r.first_edition)).attr('cy', cy).attr('r', 5);
      if (step === 'b08' && PANDEMIC[r.race_id]) {
        lane.append('text').attr('class', 'tag').attr('x', x(2022) + 6).attr('y', cy - 7).text(PANDEMIC[r.race_id]);
      }
      if (step === 'b09') {
        // ladder: latest label at the lane end, earlier ones to its left
        const ls = data.labels.filter((l) => l.race_id === r.race_id).sort((p, q) => q.year - p.year);
        ls.forEach((l, k) => {
          const short = l.label.replace('World Athletics ', '').replace(' (reported)', '*').replace('World Athletics label', 'Label');
          const bw = 62;
          const bx = x(2026.9) - bw / 2 - k * (bw + 6);
          const delay = dur(150 * (ls.length - k) + 200);
          lane.append('rect').attr('class', `badge ${/Elite|Gold/.test(l.label) ? 'top' : ''}`).attr('x', bx - bw / 2).attr('y', cy - 9).attr('width', bw).attr('height', 18).attr('rx', 9)
            .style('opacity', 0).transition().delay(delay).style('opacity', 1);
          lane.append('text').attr('class', 'badge-text').attr('x', bx).attr('y', cy + 4).attr('text-anchor', 'middle').text(`${short} '${String(l.year).slice(2)}`)
            .style('opacity', 0).transition().delay(delay).style('opacity', 1);
        });
      }
    });

    if (step === 'b06') {
      g.append('circle').attr('class', 'origin-dot').attr('cx', x(1999)).attr('cy', y('maybank') + y.bandwidth() / 2).attr('r', 6);
      g.append('text').attr('class', 'callout').attr('x', x(1999) + 10).attr('y', y('maybank') - 6).text('1999 · Karangasem · 147 pelari');
      g.append('line').attr('class', 'lane-line dashed').attr('x1', x(1999)).attr('x2', x(2012)).attr('y1', y('maybank') + y.bandwidth() / 2).attr('y2', y('maybank') + y.bandwidth() / 2);
    }
    note.textContent = {
      b06: 'Titik = edisi pertama. Garis putus: akar Maybank di Karangasem 1999 sebelum dihidupkan lagi di Gianyar 2012.',
      b07: 'Maros tidak punya tahun mulai yang tercatat, jadi ditampilkan sebagai celah.',
      b08: 'Bekasi dan Maros: tidak ditemukan edisi 2026.',
      b09: '* Gold dilaporkan oleh race director JRF, belum dicek di kalender World Athletics.',
    }[step];
  }

  scrolly(root, { onStep: render });
  render('b06');
  window.addEventListener('resize', () => render(current));
}
