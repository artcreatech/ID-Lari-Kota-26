// B14–B15: national map of race venues, then the JAKIM and Borobudur courses drawing themselves.
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';

maplibregl.setWorkerUrl(workerUrl);
import * as d3 from 'd3';
import { scrolly, reduceMotion } from '../lib/scrolly.js';

const STYLE = 'https://tiles.openfreemap.org/styles/positron';
const FALLBACK = { version: 8, sources: {}, layers: [{ id: 'bg', type: 'background', paint: { 'background-color': '#e9edf1' } }] };
// desktop shifts Indonesia left of the step cards
const NATION = window.innerWidth > 900 ? { center: [117.5, -4.5], zoom: 4.3 } : { center: [113.5, -2.5], zoom: 3.2 };

export function init(root, data) {
  const el = root.querySelector('.map');
  const note = root.querySelector('.graphic-note');
  const css = getComputedStyle(document.documentElement);
  const C = (n) => css.getPropertyValue(n).trim();

  // venue points with latest known runner count
  const latest = (id) => {
    const rows = data.years.filter((d) => d.race_id === id && d.runners && !['quota', 'target'].includes(d.count_type));
    return rows.sort((a, b) => b.year - a.year)[0];
  };
  const venues = {
    type: 'FeatureCollection',
    features: data.venues.features.map((f) => {
      const l = latest(f.properties.race_id);
      const r = data.byId.get(f.properties.race_id);
      return { ...f, properties: { ...f.properties, short: r?.short_name || f.properties.name, runners: l?.runners || 0, year: l?.year || '', has: l ? 1 : 0 } };
    }),
  };

  // precompute cumulative length so a progress value maps to a partial line
  const prep = (fc) => {
    const line = fc.features.find((f) => f.properties.kind === 'route');
    const c = line.geometry.coordinates;
    const cum = [0];
    for (let i = 1; i < c.length; i++) cum.push(cum[i - 1] + d3.geoDistance(c[i - 1], c[i]));
    const total = cum[cum.length - 1];
    const bounds = c.reduce((b, p) => b.extend(p), new maplibregl.LngLatBounds(c[0], c[0]));
    const pts = { type: 'FeatureCollection', features: fc.features.filter((f) => f.geometry.type === 'Point') };
    return { c, cum, total, bounds, pts, props: line.properties };
  };
  const routes = { jakim: prep(data.routes.jakim), borobudur: prep(data.routes.borobudur) };
  const partial = (r, p) => {
    if (p <= 0) return { type: 'FeatureCollection', features: [] };
    const target = r.total * p;
    const i = Math.max(1, d3.bisectLeft(r.cum, target));
    return { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: r.c.slice(0, i + 1) } };
  };

  const map = new maplibregl.Map({
    container: el,
    style: STYLE,
    ...NATION,
    attributionControl: { compact: true },
    interactive: false,
  });
  map.on('error', (e) => {
    if (!map.__fellBack && /style|fetch|tiles/i.test(String(e?.error?.message || ''))) {
      map.__fellBack = true;
      map.setStyle(FALLBACK);
    }
  });

  let ready = false;
  let pending = 'b14';
  map.on('style.load', () => {
    const glyphs = !!map.getStyle().glyphs; // the offline fallback has no fonts, so no labels
    const addLabel = (layer) => glyphs && map.addLayer(layer);
    const empty = { type: 'FeatureCollection', features: [] };
    map.addSource('venues', { type: 'geojson', data: venues });
    map.addLayer({
      id: 'venues', type: 'circle', source: 'venues',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['sqrt', ['get', 'runners']], 0, 5, 214, 26],
        'circle-color': ['match', ['get', 'race_id'], ['jakim', 'jrf'], C('--cone'), C('--subuh')],
        'circle-opacity': ['case', ['==', ['get', 'has'], 1], 0.75, 0],
        'circle-stroke-color': ['match', ['get', 'race_id'], ['jakim', 'jrf'], C('--cone-ink'), C('--subuh')],
        'circle-stroke-width': 1.5,
      },
    });
    addLabel({
      id: 'venue-labels', type: 'symbol', source: 'venues',
      layout: { 'text-field': ['get', 'short'], 'text-size': 12, 'text-offset': [0, 1.4], 'text-anchor': 'top', 'text-font': ['Noto Sans Regular'] },
      paint: { 'text-color': C('--tinta'), 'text-halo-color': '#fff', 'text-halo-width': 1.2 },
    });
    for (const k of Object.keys(routes)) {
      map.addSource(`route-${k}`, { type: 'geojson', data: empty });
      map.addSource(`pts-${k}`, { type: 'geojson', data: routes[k].pts });
      map.addLayer({ id: `route-${k}-casing`, type: 'line', source: `route-${k}`, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': '#fff', 'line-width': 8 } });
      map.addLayer({ id: `route-${k}`, type: 'line', source: `route-${k}`, layout: { 'line-cap': 'round', 'line-join': 'round' }, paint: { 'line-color': C('--cone'), 'line-width': 4.5 } });
      map.addLayer({
        id: `pts-${k}`, type: 'circle', source: `pts-${k}`, layout: { visibility: 'none' },
        paint: { 'circle-radius': ['match', ['get', 'type'], 'landmark', 4, 7], 'circle-color': ['match', ['get', 'type'], 'landmark', '#fff', C('--tinta')], 'circle-stroke-color': C('--tinta'), 'circle-stroke-width': 1.5 },
      });
      addLabel({
        id: `pts-${k}-label`, type: 'symbol', source: `pts-${k}`, layout: { visibility: 'none', 'text-field': ['get', 'name'], 'text-size': 12, 'text-offset': [0.8, 0], 'text-anchor': 'left', 'text-font': ['Noto Sans Regular'] },
        paint: { 'text-color': C('--tinta'), 'text-halo-color': '#fff', 'text-halo-width': 1.4 },
      });
    }
    ready = true;
    show(pending);
  });

  const setVis = (k, on) => [`pts-${k}`, `pts-${k}-label`].forEach((id) => map.getLayer(id) && map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none'));
  const fly = (opts) => (reduceMotion() ? map.jumpTo(opts) : map.flyTo({ ...opts, duration: 2200, essential: true }));

  function show(step) {
    pending = step;
    if (!ready) return;
    const routeStep = routes[step];
    map.setPaintProperty('venues', 'circle-opacity', ['case', ['==', ['get', 'has'], 1], step === 'b14' ? 0.75 : 0.25, 0]);
    for (const k of Object.keys(routes)) setVis(k, k === step);
    if (step === 'end') {
      for (const k of Object.keys(routes)) map.getSource(`route-${k}`).setData(partial(routes[k], 1));
      fly({ center: [109.0, -6.9], zoom: window.innerWidth < 600 ? 5.6 : 6.4 });
      note.textContent = 'Dua rute pertama. JRF, Pocari Bandung dan Maybank menyusul.';
    } else if (step === 'b14') {
      fly(NATION);
      note.textContent = 'Lingkaran = jumlah pelari terakhir yang tercatat (bukan kuota). Maros hanya bergaris tepi: jumlah pelarinya tidak ditemukan. Lokasi perkiraan, sekitar 1 km.';
    } else if (routeStep) {
      for (const k of Object.keys(routes)) if (k !== step) map.getSource(`route-${k}`).setData(partial(routes[k], 0));
      const cam = map.cameraForBounds(routeStep.bounds, { padding: { top: 60, bottom: window.innerWidth > 900 ? 60 : Math.round(window.innerHeight * 0.45), left: 30, right: window.innerWidth > 900 ? 460 : 30 } });
      fly(cam);
      progress(step, reduceMotion() ? 1 : 0.02);
      note.innerHTML = `<b>Garis draf.</b> Jalur ini ilustrasi dari jalan OpenStreetMap antara titik-titik penanda, bukan rute resmi ${routeStep.props.name} ${routeStep.props.year}. Diganti dengan rute hasil tracing sebelum terbit.`;
    }
  }
  function progress(step, p) {
    if (!ready || !routes[step]) return;
    map.getSource(`route-${step}`).setData(partial(routes[step], Math.min(1, Math.max(0.02, p * 1.25))));
  }

  scrolly(root, { onStep: show, onProgress: progress, offset: 0.6 });
}
