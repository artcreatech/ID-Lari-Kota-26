// B02–B05: the boom. One sticky SVG, redrawn per step.
import * as d3 from 'd3';
import { scrolly, sizeOf, dur } from '../lib/scrolly.js';
import { fmt, JAKARTA, NOT_RESULT, COUNT_LABEL } from '../lib/data.js';

export function init(root, data) {
  const box = root.querySelector('.graphic');
  const svg = d3.select(box).append('svg').attr('role', 'img');
  const note = root.querySelector('.graphic-note');
  let current = null;

  const draw = {
    // B02 — 2024 vs 2026, JAKIM + JRF stacked
    b02() {
      const { w, h, m, g } = frame();
      const rows = [2024, 2026].map((y) => ({
        year: y,
        jakim: data.get('jakim', y).runners,
        jrf: data.get('jrf', y).runners,
      }));
      const x = d3.scaleBand().domain([2024, 2026]).range([m.l, w - m.r]).padding(0.45);
      const y = d3.scaleLinear().domain([0, 90000]).range([h - m.b, m.t]);
      axisY(g, y, w, m);
      rows.forEach((r) => {
        const col = g.append('g');
        const parts = [
          ['jakim', 0, r.jakim, 'var(--cone)'],
          ['jrf', r.jakim, r.jakim + r.jrf, 'var(--fajar)'],
        ];
        parts.forEach(([k, a, b, c], i) => {
          col.append('rect').attr('x', x(r.year)).attr('width', x.bandwidth()).attr('fill', c)
            .attr('y', y(0)).attr('height', 0)
            .transition().delay(i * dur(300)).duration(dur(900))
            .attr('y', y(b)).attr('height', y(a) - y(b));
          col.append('text').attr('class', 'in-bar').attr('x', x(r.year) + x.bandwidth() / 2)
            .attr('y', y((a + b) / 2) + 5).attr('text-anchor', 'middle')
            .text(`${k.toUpperCase()} ${fmt(b - a)}`).style('opacity', 0)
            .transition().delay(dur(900)).style('opacity', 1);
        });
        const total = col.append('text').attr('class', 'big-num').attr('x', x(r.year) + x.bandwidth() / 2)
          .attr('y', y(r.jakim + r.jrf) - 12).attr('text-anchor', 'middle');
        total.transition().duration(dur(1200)).tween('text', () => {
          const i = d3.interpolateRound(0, r.jakim + r.jrf);
          return (t) => total.text(fmt(i(t)));
        });
        col.append('text').attr('class', 'tick-label').attr('x', x(r.year) + x.bandwidth() / 2)
          .attr('y', h - m.b + 22).attr('text-anchor', 'middle').text(r.year);
      });
      setNote('Pelari semua jarak. JRF = Jakarta Running Festival (dulu Jakarta Marathon).');
    },

    // B03 — small multiples, runners per year 2012–2026
    b03() {
      const { w, h, g } = frame({ t: 8, r: 8, b: 8, l: 8 });
      const races = data.races.filter((r) => r.first_edition).sort((a, b) => a.first_edition - b.first_edition || a.name.localeCompare(b.name));
      races.push(data.byId.get('maros'));
      const cols = w < 560 ? 3 : 4;
      const rowsN = Math.ceil(races.length / cols);
      const cw = w / cols;
      const ch = h / rowsN;
      const years = d3.range(2012, 2027);
      const x = d3.scaleBand().domain(years).range([6, cw - 6]).padding(0.15);
      const y = d3.scaleLinear().domain([0, 46000]).range([ch - 18, 22]);
      races.forEach((r, i) => {
        const p = g.append('g').attr('class', JAKARTA.has(r.race_id) ? 'panel jkt' : 'panel')
          .attr('transform', `translate(${(i % cols) * cw},${Math.floor(i / cols) * ch})`);
        p.append('text').attr('class', 'panel-title').attr('x', 6).attr('y', 14).text(r.short_name);
        p.append('line').attr('class', 'baseline').attr('x1', 6).attr('x2', cw - 6).attr('y1', y(0)).attr('y2', y(0));
        const rows = data.years.filter((d) => d.race_id === r.race_id && d.runners);
        const have = new Set(rows.map((d) => d.year));
        // hatched gaps between first edition and 2026 with no published count
        if (r.first_edition) {
          years.filter((yr) => yr >= r.first_edition && !have.has(yr)).forEach((yr) => {
            p.append('rect').attr('class', 'gap').attr('x', x(yr)).attr('width', x.bandwidth()).attr('y', y(0) - 10).attr('height', 10);
          });
        } else {
          p.append('text').attr('class', 'gap-label').attr('x', cw / 2).attr('y', ch / 2 + 4).attr('text-anchor', 'middle').text('tidak ada data');
        }
        p.selectAll('rect.bar').data(rows).join('rect')
          .attr('class', (d) => (NOT_RESULT.has(d.count_type) ? 'bar planned' : 'bar'))
          .attr('x', (d) => x(d.year)).attr('width', x.bandwidth()).attr('y', y(0)).attr('height', 0)
          .call((s) => s.append('title').text((d) => `${r.short_name} ${d.year}: ${fmt(d.runners)} (${COUNT_LABEL[d.count_type] || d.count_type})`))
          .transition().delay((_, k) => dur(60 * k)).duration(dur(600))
          .attr('y', (d) => y(d.runners)).attr('height', (d) => y(0) - y(d.runners));
        const last = rows[rows.length - 1];
        if (last) p.append('text').attr('class', 'panel-num').attr('x', cw - 6).attr('y', 14).attr('text-anchor', 'end').text(fmt(last.runners));
      });
      setNote('2012–2026, skala sama. Arsir = tahun tanpa angka resmi. Garis putus = kuota atau target, bukan hasil.');
    },

    // B04 — slope 2025 → 2026
    b04() {
      const { w, h, m, g } = frame({ t: 30, r: w0() < 560 ? 92 : 120, b: 40, l: w0() < 560 ? 104 : 120 });
      const rows = data.races.map((r) => ({ r, a: data.get(r.race_id, 2025), b: data.get(r.race_id, 2026) }))
        .filter((d) => d.a?.runners && d.b?.runners);
      const x = d3.scalePoint().domain([2025, 2026]).range([m.l, w - m.r]);
      const y = d3.scaleLinear().domain([0, 48000]).range([h - m.b, m.t]);
      [2025, 2026].forEach((yr) => g.append('text').attr('class', 'tick-label').attr('x', x(yr)).attr('y', m.t - 12).attr('text-anchor', 'middle').text(yr));
      // spread labels so none sit closer than 14px, keeping order by value
      const spread = (vals) => {
        const idx = vals.map((v, i) => i).sort((i, j) => vals[i] - vals[j]);
        const out = [...vals];
        for (let k = 1; k < idx.length; k++) out[idx[k]] = Math.max(out[idx[k]], out[idx[k - 1]] + 14);
        return out;
      };
      rows.sort((p, q) => q.b.runners - p.b.runners);
      const ya = spread(rows.map((d) => y(d.a.runners)));
      const yb = spread(rows.map((d) => y(d.b.runners)));
      rows.forEach((d, i) => {
        const jkt = JAKARTA.has(d.r.race_id);
        const planned = NOT_RESULT.has(d.b.count_type);
        const line = g.append('line').attr('class', `slope ${jkt ? 'jkt' : ''} ${planned ? 'planned' : ''}`)
          .attr('x1', x(2025)).attr('y1', y(d.a.runners)).attr('x2', x(2025)).attr('y2', y(d.a.runners));
        line.transition().duration(dur(1200)).attr('x2', x(2026)).attr('y2', y(d.b.runners));
        const ch = d.b.runners / d.a.runners - 1;
        g.append('text').attr('class', `slope-label ${jkt ? 'jkt' : ''}`).attr('x', x(2025) - 8).attr('y', ya[i] + 4).attr('text-anchor', 'end').text(w0() < 560 ? d.r.short_name : `${d.r.short_name} ${fmt(d.a.runners)}`);
        g.append('text').attr('class', `slope-label ${jkt ? 'jkt' : ''}`).attr('x', x(2026) + 8).attr('y', yb[i] + 4)
          .text(`${fmt(d.b.runners)} ${planned ? '(' + COUNT_LABEL[d.b.count_type] + ')' : (ch >= 0 ? '+' : '') + Math.round(ch * 100) + '%'}`)
          .style('opacity', 0).transition().delay(dur(1100)).style('opacity', 1);
      });
      setNote('Lomba dengan angka 2025 dan 2026. Garis putus = kuota atau target. Borobudur 2019: lebih dari 17.000 pendaftar untuk 8.000 slot undian.');
    },

    // B05 — what a count counts
    b05() {
      const { w, h, m, g } = frame({ t: 20, r: 20, b: 30, l: w0() < 560 ? 112 : 150 });
      const j25 = data.get('jakim', 2025), j26 = data.get('jakim', 2026), mb = data.get('maybank', 2026), pb = data.get('pocari_bandung', 2025);
      const virtualPB = 30435; // from the race_years note (Plus 30,435 virtual runners)
      const rows = [
        { k: 'JAKIM 2025', parts: [['42K', j25.runners_42k], ['5K–21K', j25.runners - j25.runners_42k]] },
        { k: 'JAKIM 2026', parts: [['42K', j26.runners_42k], ['5K–21K', j26.runners - j26.runners_42k]] },
        { k: 'Maybank 2026', parts: [['42K', mb.runners_42k], ['5K–21K', mb.runners - mb.runners_42k]] },
        { k: 'Pocari Bandung 2025', parts: [['di lokasi', pb.runners], ['virtual', virtualPB]] },
      ];
      const x = d3.scaleLinear().domain([0, 48000]).range([m.l, w - m.r]);
      const y = d3.scaleBand().domain(rows.map((r) => r.k)).range([m.t, h - m.b]).padding(0.45);
      const fill = { '42K': 'var(--cone)', '5K–21K': 'var(--slate)', 'di lokasi': 'var(--slate)', virtual: 'url(#hatch)' };
      rows.forEach((r) => {
        let acc = 0;
        g.append('text').attr('class', 'row-label').attr('x', m.l - 10).attr('y', y(r.k) + y.bandwidth() / 2 + 5).attr('text-anchor', 'end').text(r.k);
        r.parts.forEach(([k, v], i) => {
          const x0 = acc;
          acc += v;
          g.append('rect').attr('x', x(x0)).attr('y', y(r.k)).attr('height', y.bandwidth()).attr('width', 0).attr('fill', fill[k])
            .attr('class', k === 'virtual' ? 'virtual' : '')
            .transition().delay(dur(250 * i)).duration(dur(800)).attr('width', x(acc) - x(x0));
          g.append('text').attr('class', 'in-bar small').attr('x', x(x0) + (i ? 0 : 2)).attr('y', i ? y(r.k) + y.bandwidth() + 14 : y(r.k) - 6).text(`${k} ${fmt(v)}`);
        });
      });
      setNote('Arsir = pelari virtual Pocari, yang tidak turun ke jalan.');
    },
  };

  const w0 = () => box.getBoundingClientRect().width;
  function frame(m = { t: 30, r: 20, b: 40, l: 56 }) {
    const { w, h } = sizeOf(box);
    svg.attr('viewBox', `0 0 ${w} ${h}`).attr('width', w).attr('height', h);
    svg.selectAll('*').remove();
    hatch(svg);
    const g = svg.append('g');
    return { w, h, m, g };
  }
  function axisY(g, y, w, m) {
    const a = g.append('g').attr('class', 'axis').attr('transform', `translate(${m.l},0)`)
      .call(d3.axisLeft(y).ticks(4).tickSize(-(w - m.l - m.r)).tickFormat((v) => (v ? fmt(v / 1000) + ' rb' : '0')));
    a.select('.domain').remove();
  }
  function setNote(t) { note.textContent = t; }

  function show(step) {
    if (!draw[step]) return;
    current = step;
    svg.attr('aria-label', root.querySelector(`.step[data-step="${step}"] h3`)?.textContent || '');
    draw[step]();
  }
  scrolly(root, { onStep: show });
  show('b02');
  window.addEventListener('resize', () => current && draw[current]());
}

export function hatch(svg) {
  const p = svg.append('defs').append('pattern').attr('id', 'hatch').attr('patternUnits', 'userSpaceOnUse').attr('width', 6).attr('height', 6).attr('patternTransform', 'rotate(45)');
  p.append('rect').attr('width', 6).attr('height', 6).attr('fill', 'transparent');
  p.append('line').attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 6).attr('stroke', 'currentColor').attr('stroke-width', 2).attr('opacity', 0.45);
}
