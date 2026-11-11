import * as d3 from 'd3';

// Indonesian number format: 45.500 and 127,1
export const id = d3.formatLocale({ decimal: ',', thousands: '.', grouping: [3], currency: ['Rp', ''] });
export const fmt = id.format(',');
export const fmt1 = id.format(',.1~f');
export const pct = id.format('.0%');

// Jakarta races carry the accent colour everywhere.
export const JAKARTA = new Set(['jakim', 'jrf']);

// Counts that are not results: draw dashed or hollow.
export const NOT_RESULT = new Set(['quota', 'target', 'projection']);

export const COUNT_LABEL = {
  total: 'jumlah total',
  total_min: 'lebih dari',
  approx: 'sekitar',
  on_site: 'di lokasi (tanpa virtual)',
  starters: 'yang start',
  quota: 'kuota',
  target: 'target',
};

export const IMPACT_LABEL = {
  survey: 'survei',
  survey_direct: 'survei, belanja langsung',
  reported: 'dilaporkan',
  reported_direct: 'dilaporkan, langsung',
  organizer_estimate: 'estimasi penyelenggara',
  estimate: 'estimasi',
  estimate_min: 'estimasi minimal',
  projection: 'proyeksi',
  target: 'target',
};

const num = (v) => (v === '' || v == null ? null : +v);

export async function loadData(base = './data/') {
  const [races, years, origins, events, labels, venues, jakim, borobudur] = await Promise.all([
    d3.csv(base + 'races.csv'),
    d3.csv(base + 'race_years.csv', (r) => ({
      ...r,
      year: +r.year,
      runners: num(r.runners),
      runners_42k: num(r.runners_42k),
      impact_rp_bn: num(r.impact_rp_bn),
    })),
    d3.csv(base + 'origins.csv', (r) => ({ ...r, year: +r.year, value: +r.value })),
    d3.csv(base + 'event_counts.csv', (r) => ({ ...r, year: +r.year, events: +r.events })),
    d3.csv(base + 'labels.csv', (r) => ({ ...r, year: +r.year })),
    d3.json(base + 'venues.geojson'),
    d3.json(base + 'routes/jakim_2026_route.geojson'),
    d3.json(base + 'routes/borobudur_2026_route.geojson'),
  ]);
  races.forEach((r) => (r.first_edition = num(r.first_edition)));
  const byId = new Map(races.map((r) => [r.race_id, r]));
  const get = (race, year) => years.find((y) => y.race_id === race && y.year === year);
  return { races, years, origins, events, labels, venues, routes: { jakim, borobudur }, byId, get };
}
