"""Lari Kota route tools.

Two jobs:

  clip     OSM roads (Overpass GeoJSON, Geofabrik gis_osm_roads_free_1.shp,
           or any line layer with a highway/fclass field) -> small clipped
           SHP + GeoJSON per race, keeping only osm_id, name, highway.

  convert  Segments you selected and exported from QGIS/ArcGIS -> one merged
           WGS84 LineString GeoJSON for MapLibre, lightly simplified.

Usage (from the repo root):
  python tools/routes/fetch_osm.py           # Overpass -> data/routes/osm_roads_raw.geojson
  python route_tools.py clip    <roads file> [--race jakim|borobudur|all]
  python route_tools.py convert <selected.shp> --race jakim --year 2026 [--tol 2]
  python route_tools.py points  <points.shp> --race jakim --year 2026

Needs: pip install geopandas pyogrio shapely
"""
import argparse
import json
from pathlib import Path

import geopandas as gpd
from shapely.geometry import box
from shapely.ops import linemerge, unary_union

# Outputs go to data/routes/<race>/ at the repo root unless --out says otherwise.
HERE = Path(__file__).resolve().parents[2] / "data" / "routes"

# lon_min, lat_min, lon_max, lat_max (WGS84). Generous on purpose: the
# route must sit well inside, and clipped roads are cheap.
EXTENTS = {
    # Monas (start) -> Thamrin -> Rasuna Said/Mampang -> Sudirman/Satrio
    # -> Iskandarsyah/Prapanca/Blok M -> Gatot Subroto -> GBK (finish)
    "jakim": (106.780, -6.262, 106.852, -6.160),
    # Taman Lumbini start/finish plus every 2025 closure point named in
    # the race guide (Salaman, Tempuran, Palbapang, Blondo, Mendut, ...)
    "borobudur": (110.100, -7.660, 110.300, -7.500),
}

# Road classes worth keeping for a running route; drops footways, paths,
# tracks, steps and other things nobody races on.
KEEP_HIGHWAY = {
    "motorway", "trunk", "primary", "secondary", "tertiary",
    "unclassified", "residential", "living_street", "service",
    "motorway_link", "trunk_link", "primary_link", "secondary_link",
    "tertiary_link", "pedestrian", "road",
}

# Metric CRS for simplification and lengths (UTM 48S for Jakarta, 49S for
# Central Java).
UTM = {"jakim": 32748, "borobudur": 32749}


def _normalise(gdf):
    """Map whatever the source called its fields onto osm_id/name/highway."""
    cols = {c.lower(): c for c in gdf.columns}
    out = gpd.GeoDataFrame(geometry=gdf.geometry, crs=gdf.crs)
    id_col = cols.get("osm_id") or cols.get("@id") or cols.get("id")
    hw_col = cols.get("highway") or cols.get("fclass")
    out["osm_id"] = gdf[id_col].astype(str).str.replace("way/", "", regex=False) if id_col else ""
    out["name"] = gdf[cols["name"]].fillna("") if "name" in cols else ""
    out["highway"] = gdf[hw_col].fillna("") if hw_col else ""
    return out


def clip(src, races):
    roads = gpd.read_file(src)
    if roads.crs is None:
        roads = roads.set_crs(4326)
    roads = roads.to_crs(4326)
    roads = roads[roads.geom_type.isin(["LineString", "MultiLineString"])]
    roads = _normalise(roads)
    roads = roads[roads["highway"].isin(KEEP_HIGHWAY)]
    for race in races:
        ext = box(*EXTENTS[race])
        part = gpd.clip(roads[roads.intersects(ext)], ext)
        part = part.explode(index_parts=False).reset_index(drop=True)
        out = HERE / race
        out.mkdir(parents=True, exist_ok=True)
        part.to_file(out / f"{race}_osm_roads.shp", encoding="UTF-8")
        part.to_file(out / f"{race}_osm_roads.geojson", driver="GeoJSON")
        print(f"{race}: {len(part)} road segments -> {out}")


def convert(src, race, year, tol):
    sel = gpd.read_file(src)
    if sel.crs is None:
        raise SystemExit("Selection has no CRS (.prj missing). Export with EPSG:4326.")
    metric = sel.to_crs(UTM[race])
    merged = linemerge(unary_union(metric.geometry))
    parts = 1 if merged.geom_type == "LineString" else len(merged.geoms)
    if parts > 1:
        print(f"warning: {parts} pieces after merge; check for gaps or a missing segment")
    km = merged.length / 1000
    simple = merged.simplify(tol, preserve_topology=True)
    line = gpd.GeoDataFrame(
        {"race": [race], "year": [int(year)], "km": [round(km, 2)]},
        geometry=[simple], crs=UTM[race],
    ).to_crs(4326)
    out = HERE / race / f"{race}_{year}_route.geojson"
    out.parent.mkdir(parents=True, exist_ok=True)
    line.to_file(out, driver="GeoJSON", COORDINATE_PRECISION=6)
    print(f"{out}: {km:.2f} km measured, {parts} piece(s)")
    print("note: out-and-back legs are counted once, so km can be below 42.195")


def points(src, race, year):
    pts = gpd.read_file(src).to_crs(4326)
    pts["race"] = race
    pts["year"] = int(year)
    out = HERE / race / f"{race}_{year}_points.geojson"
    pts.to_file(out, driver="GeoJSON", COORDINATE_PRECISION=6)
    print(f"{out}: {len(pts)} points")


def main():
    p = argparse.ArgumentParser()
    p.add_argument("cmd", choices=["clip", "convert", "points"])
    p.add_argument("src")
    p.add_argument("--race", default="all")
    p.add_argument("--year", default="2026")
    p.add_argument("--tol", type=float, default=2.0, help="simplify tolerance in metres")
    p.add_argument("--out", help="output folder (default: data/routes)")
    a = p.parse_args()
    if a.out:
        global HERE
        HERE = Path(a.out)
    races = list(EXTENTS) if a.race == "all" else [a.race]
    if a.cmd == "clip":
        clip(a.src, races)
    elif a.cmd == "convert":
        convert(a.src, races[0], a.year, a.tol)
    else:
        points(a.src, races[0], a.year)


if __name__ == "__main__":
    main()
