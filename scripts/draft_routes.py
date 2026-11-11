"""Draft route lines for the launch map, made by shortest path along OSM roads
between hand-picked waypoints. These are ILLUSTRATIONS, not the official courses.
Replace public/data/routes/<race>_2026_route.geojson with the traced route
(My Maps KML -> GeoJSON) as soon as it exists.

python scripts/draft_routes.py /path/to/routes   # folder holding <race>/<race>_osm_roads.geojson
"""
import json, math, sys
from pathlib import Path
import networkx as nx

ROADS = Path(sys.argv[1] if len(sys.argv) > 1 else '/mnt/project-files/routes')
OUT = Path(__file__).resolve().parent.parent / 'public' / 'data' / 'routes'
MAIN = {'motorway_link','trunk','trunk_link','primary','primary_link','secondary','secondary_link','tertiary','tertiary_link','residential','unclassified'}

RACES = {
  'jakim': {
    'name': 'BTN Jakarta International Marathon', 'year': 2026, 'keep': MAIN - {'residential','unclassified'},
    'waypoints': [
      ('Monas (start)', 106.8240, -6.1795), ('Bundaran HI', 106.8229, -6.1950),
      ('Dukuh Atas', 106.8220, -6.2010), ('Semanggi', 106.8130, -6.2195),
      ('Jl. Gatot Subroto', 106.8290, -6.2330), ('Kuningan', 106.8305, -6.2250),
      ('Jl. H.R. Rasuna Said', 106.8340, -6.2060), ('Menteng', 106.8350, -6.1950),
      ('Jl. Medan Merdeka Timur', 106.8310, -6.1780), ('Jl. Medan Merdeka Barat', 106.8215, -6.1760),
      ('Jl. Sudirman', 106.8185, -6.2100), ('Senayan', 106.8030, -6.2250),
      ('GBK (finish)', 106.8020, -6.2180),
    ]},
  'borobudur': {
    'name': 'Borobudur Marathon', 'year': 2026, 'keep': MAIN,
    'waypoints': [
      ('Taman Lumbini (start/finish)', 110.2025, -7.6055), ('Candi Pawon', 110.2195, -7.6065),
      ('Candi Mendut', 110.2295, -7.6045), ('Mungkid', 110.2240, -7.5780),
      ('Tanjung', 110.1900, -7.5700), ('Karanganyar', 110.1700, -7.5900),
      ('Wanurejo', 110.2150, -7.6150), ('Karangrejo', 110.1980, -7.6280),
      ('Taman Lumbini (start/finish)', 110.2025, -7.6055),
    ]},
}

def hav(a, b):
    R = 6371008.8
    la1, la2 = math.radians(a[1]), math.radians(b[1])
    dl, dp = la2 - la1, math.radians(b[0] - a[0])
    h = math.sin(dl/2)**2 + math.cos(la1)*math.cos(la2)*math.sin(dp/2)**2
    return 2*R*math.asin(math.sqrt(h))

def key(c): return (round(c[0], 7), round(c[1], 7))

for race, cfg in RACES.items():
    g = json.load(open(ROADS / race / f'{race}_osm_roads.geojson'))
    G = nx.Graph()
    for f in g['features']:
        if f['properties'].get('highway') not in cfg['keep']: continue
        geom = f['geometry']
        lines = [geom['coordinates']] if geom['type'] == 'LineString' else geom['coordinates']
        for ln in lines:
            for a, b in zip(ln, ln[1:]):
                G.add_edge(key(a), key(b), weight=hav(a, b))
    G = G.subgraph(max(nx.connected_components(G), key=len)).copy()
    nodes = list(G.nodes)
    snap = lambda p: min(nodes, key=lambda n: (n[0]-p[0])**2 + (n[1]-p[1])**2)
    pts = [snap((x, y)) for _, x, y in cfg['waypoints']]
    path = [pts[0]]
    for a, b in zip(pts, pts[1:]):
        path += nx.shortest_path(G, a, b, weight='weight')[1:]
    km = sum(hav(a, b) for a, b in zip(path, path[1:])) / 1000
    marks, acc = [], 0
    targets = []  # no km markers on an illustrative line
    for a, b in zip(path, path[1:]):
        acc += hav(a, b) / 1000
        while targets and acc >= targets[0] * km / 42.195:
            marks.append({'type': 'Feature', 'properties': {'type': 'km', 'km': targets.pop(0)}, 'geometry': {'type': 'Point', 'coordinates': list(b)}})
    for (label, x, y), p in zip(cfg['waypoints'], pts):
        t = 'start_finish' if 'start/finish' in label else 'start' if '(start)' in label else 'finish' if '(finish)' in label else 'landmark'
        marks.append({'type': 'Feature', 'properties': {'type': t, 'name': label.split(' (')[0]}, 'geometry': {'type': 'Point', 'coordinates': list(p)}})
    fc = {'type': 'FeatureCollection', 'features': [
        {'type': 'Feature', 'properties': {'race_id': race, 'name': cfg['name'], 'year': cfg['year'], 'kind': 'route',
            'status': 'draft_illustration', 'drawn_km': round(km, 1),
            'note': 'Shortest path along OSM roads between hand-picked waypoints. Not the official course. Replace with the traced route.',
            'source': 'OpenStreetMap contributors (ODbL)'},
         'geometry': {'type': 'LineString', 'coordinates': [list(p) for p in path]}}] + marks}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f'{race}_2026_route.geojson').write_text(json.dumps(fc, separators=(',', ':')))
    print(race, f'{km:.1f} km drawn', len(path), 'points')
