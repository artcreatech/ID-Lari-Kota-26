"""Download OSM roads for every race extent from Overpass as one GeoJSON.

Writes data/routes/osm_roads_raw.geojson (LineStrings with osm_id, name,
highway), which route_tools.py clip then cuts per race. Run from anywhere:

  python tools/routes/fetch_osm.py

Needs network access to an Overpass server (GitHub Actions has it).
"""
import json
import sys
import time
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from route_tools import EXTENTS, KEEP_HIGHWAY  # noqa: E402

OUT = Path(__file__).resolve().parents[2] / "data" / "routes" / "osm_roads_raw.geojson"
SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]
HIGHWAY_RE = "^(" + "|".join(sorted(KEEP_HIGHWAY)) + ")$"


def query(bbox):
    lon_min, lat_min, lon_max, lat_max = bbox
    return (
        "[out:json][timeout:180];"
        f'way["highway"~"{HIGHWAY_RE}"]({lat_min},{lon_min},{lat_max},{lon_max});'
        "out tags geom;"
    )


def fetch(q):
    data = urllib.parse.urlencode({"data": q}).encode()
    last = None
    for attempt in range(3):
        for url in SERVERS:
            try:
                req = urllib.request.Request(url, data=data, headers={"User-Agent": "lari-kota-routes/1.0"})
                with urllib.request.urlopen(req, timeout=240) as r:
                    return json.load(r)
            except Exception as e:  # try the next server, then back off
                last = e
                print(f"  {url}: {e}")
        time.sleep(15 * (attempt + 1))
    raise SystemExit(f"Overpass failed on every server: {last}")


def to_features(osm):
    for el in osm.get("elements", []):
        if el.get("type") != "way" or len(el.get("geometry", [])) < 2:
            continue
        tags = el.get("tags", {})
        yield {
            "type": "Feature",
            "properties": {"osm_id": str(el["id"]), "name": tags.get("name", ""), "highway": tags.get("highway", "")},
            "geometry": {"type": "LineString", "coordinates": [[p["lon"], p["lat"]] for p in el["geometry"]]},
        }


def main():
    feats = {}
    for race, bbox in EXTENTS.items():
        print(f"{race}: querying Overpass")
        for f in to_features(fetch(query(bbox))):
            feats[f["properties"]["osm_id"]] = f
        print(f"{race}: {len(feats)} ways so far")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"type": "FeatureCollection", "features": list(feats.values())}))
    print(f"wrote {OUT} ({len(feats)} ways)")


if __name__ == "__main__":
    main()
