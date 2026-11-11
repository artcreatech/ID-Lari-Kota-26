// B10–B12: the money and the visitors.
import * as d3 from 'd3';
import { scrolly, sizeOf, dur } from '../lib/scrolly.js';
import { fmt, fmt1, pct, JAKARTA, NOT_RESULT, IMPACT_LABEL } from '../lib/data.js';

// JAKIM 2025 restatements (race_years note + data scan).
const JAKIM_2025 = [
  { v: 122, who: 'Dirut BTN' },
  { v: 125, who: 'Gubernur' },
  { v: 127.1, who: 'Estimasi IMRR' },
  { v: 155, who: 'BTN, belakangan', approx: true },
];

export function init(root, data) {
  const box = root.querySelector('.graphic');
  const svg = d3.select(box).append('svg').attr('role', 'img');
  const note = root.querySelector('.graphic-note');
  let current = 'b10';

  function frame(m) {
    const { w, h } = sizeOf(box);
    svg.attr('viewBox', `0 0 ${w} ${h}`).attr('width', w).attr('height', h);
    svg.selectAll('*').remove();
    return { w, h, m, g: svg.append('g') };
  }

  const draw = {
    b10() {
      const narrow = sizeOf(box).w < 500;
      const { w, h, m, g } = frame({ t: 20, r: narrow ? 44 : 70, b: 30, l: narrow ? 104 : 150 });
      const rows = data.years.filter((d) => d.impact_rp_bn && d.year >= 2025)
        .map((d) => ({ ...d, label: `${data.byId.get(d.race_id).short_name} ${d.year}` }))
        .sort((a, b) => b.impact_rp_bn - a.impact_rp_bn);
      const x = d3.scaleLinear().domain([0, 310]).range([m.l, w - m.r]);
      const y = d3.scaleBand().domain(rows.map((r) => r.label)).range([m.t, h - m.b]).padding(0.3);
      g.append('g').attr('class', 'axis').attr('transform', `translate(0,${h - m.b})`)
        .call(d3.axisBottom(x).ticks(4).tickSize(-(h - m.t - m.b)).tickFormat((v) => `Rp${v} M`)).select('.domain').remove();
      rows.forEach((r, i) => {
        const hollow = NOT_RESULT.has(r.impact_type);
        g.append('text').attr('class', `row-label ${JAKARTA.has(r.race_id) ? 'jkt' : ''}`).attr('x', m.l - 10).attr('y', y(r.label) + y.bandwidth() / 2 + 5).attr('text-anchor', 'end').text(r.label);
        g.append('rect').attr('class', `impact ${hollow ? 'hollow' : ''} ${JAKARTA.has(r.race_id) ? 'jkt' : ''}`)
          .attr('x', x(0)).attr('y', y(r.label)).attr('height', y.bandwidth()).attr('width', 0)
          .transition().delay(dur(i * 80)).duration(dur(800)).attr('width', x(r.impact_rp_bn) - x(0));
        g.append('text').attr('class', 'bar-end').attr('x', x(r.impact_rp_bn) + 6).attr('y', y(r.label) + y.bandwidth() / 2 + 5)
          .text(narrow ? fmt1(r.impact_rp_bn) : `${fmt1(r.impact_rp_bn)} · ${IMPACT_LABEL[r.impact_type]}`);
      });
      note.textContent = 'Miliar rupiah (M), seperti diumumkan. Batang kosong = proyeksi atau target, belum hasil. Metodenya berbeda-beda, jadi angka ini tidak bisa dibandingkan langsung.';
    },

    b11() {
      // one row per figure so labels never collide, at any width
      const { w, h, m, g } = frame({ t: 50, r: 24, b: 40, l: 24 });
      const x = d3.scaleLinear().domain([115, 160]).range([m.l, w - m.r]);
      const rowsH = Math.min(70, (h - m.t - m.b) / JAKIM_2025.length);
      const y0 = m.t + 20;
      const yEnd = y0 + rowsH * (JAKIM_2025.length - 1);
      g.append('g').attr('class', 'axis').attr('transform', `translate(0,${yEnd + 34})`)
        .call(d3.axisBottom(x).ticks(w < 500 ? 3 : 5).tickFormat((v) => `Rp${v} M`)).select('.domain').remove();
      g.append('rect').attr('class', 'range-band').attr('x', x(122)).attr('y', y0 - 22).attr('height', yEnd - y0 + 44).attr('width', 0)
        .transition().duration(dur(900)).attr('width', x(155) - x(122));
      JAKIM_2025.forEach((d, i) => {
        const cy = y0 + i * rowsH;
        const right = x(d.v) < (m.l + w - m.r) / 2;
        const gg = g.append('g').style('opacity', 0);
        gg.transition().delay(dur(300 + i * 250)).style('opacity', 1);
        gg.append('line').attr('class', 'axis-guide').attr('x1', m.l).attr('x2', w - m.r).attr('y1', cy).attr('y2', cy);
        gg.append('circle').attr('class', 'marker jkt').attr('cx', x(d.v)).attr('cy', cy).attr('r', 8);
        const t = gg.append('text').attr('x', x(d.v) + (right ? 14 : -14)).attr('y', cy + 6).attr('text-anchor', right ? 'start' : 'end');
        t.append('tspan').attr('class', 'big-num small').text(`${d.approx ? '±' : ''}Rp${fmt1(d.v)} M `);
        t.append('tspan').attr('class', 'tag').text(d.who);
      });
      g.append('text').attr('class', 'panel-title').attr('x', m.l).attr('y', m.t - 24).text('BTN JAKIM 2025 · 31.000 pelari');
      note.textContent = 'Empat angka dampak untuk satu lomba yang sama. Baca sebagai klaim, bukan hasil audit.';
    },

    b12() {
      const { w, h, m, g } = frame({ t: 34, r: 30, b: 20, l: sizeOf(box).w < 500 ? 120 : 150 });
      const o = data.origins;
      const shares = [
        { k: 'Lombok 2025', v: o.find((d) => d.race_id === 'pocari_lombok' && d.metric === 'share_from_outside_province').value, t: 'dari luar NTB' },
        { k: 'Pocari Bandung 2025', v: o.find((d) => d.race_id === 'pocari_bandung' && d.metric === 'share_from_jabodetabek').value, t: 'dari Jabodetabek' },
      ];
      const intl = o.filter((d) => d.metric === 'international_runners').map((d) => ({ k: `${data.byId.get(d.race_id).short_name} ${d.year}`, v: d.value, id: d.race_id, min: /\+/.test(d.note) }));
      const countries = o.filter((d) => d.metric === 'countries').sort((a, b) => b.value - a.value).slice(0, 6)
        .map((d) => ({ k: `${data.byId.get(d.race_id).short_name} ${d.year}`, v: d.value, id: d.race_id }));

      const half = (h - m.t - m.b) / 3;
      const block = (title, rows, i, max, f, ok) => {
        const y0 = m.t + i * half;
        g.append('text').attr('class', 'panel-title').attr('x', 0).attr('y', y0 - 8).text(title);
        const x = d3.scaleLinear().domain([0, max]).range([m.l, w - m.r - 60]);
        const y = d3.scaleBand().domain(rows.map((r) => r.k)).range([y0, y0 + half - 26]).padding(0.25);
        rows.forEach((r, k) => {
          g.append('text').attr('class', `row-label ${JAKARTA.has(r.id) ? 'jkt' : ''}`).attr('x', m.l - 10).attr('y', y(r.k) + y.bandwidth() / 2 + 4).attr('text-anchor', 'end').text(r.k);
          g.append('rect').attr('class', `impact ${JAKARTA.has(r.id) ? 'jkt' : ''}`).attr('x', x(0)).attr('y', y(r.k)).attr('height', y.bandwidth()).attr('width', 0)
            .transition().delay(dur(k * 90 + i * 250)).duration(dur(700)).attr('width', x(r.v) - x(0));
          g.append('text').attr('class', 'bar-end').attr('x', x(r.v) + 6).attr('y', y(r.k) + y.bandwidth() / 2 + 4).text(f(r));
        });
      };
      block('Porsi pelari dari luar daerah', shares, 0, 1, (r) => `${pct(r.v)} ${r.t}`);
      block('Pelari mancanegara', intl, 1, 1100, (r) => `${r.min ? '>' : ''}${fmt(r.v)}`);
      block('Jumlah negara asal', countries, 2, 60, (r) => `${r.v} negara`);
      note.textContent = 'Hanya lomba yang mengumumkan asal pelarinya. JAKIM dan JRF belum punya porsi dari luar daerah.';
    },
  };

  function show(step) {
    if (!draw[step]) return;
    current = step;
    draw[step]();
  }
  scrolly(root, { onStep: show });
  show('b10');
  window.addEventListener('resize', () => show(current));
}
