# Route maps: OSM roads → your selection → MapLibre GeoJSON

Two races, one folder each: `jakim/` (BTN JAKIM, Monas → GBK) and `borobudur/` (Taman Lumbini loop).

## 1. Get the roads (pick one)

- **GitHub Action (default).** `.github/workflows/osm-roads.yml` runs `tools/routes/fetch_osm.py` (Overpass) and the clip, then commits `<race>/<race>_osm_roads.shp/.geojson` here. Re-run it from the Actions tab ("Run workflow") to refresh the roads.

- **A. QGIS + QuickOSM (easiest).** Plugins → install *QuickOSM*. Key `highway`, value empty, "In extent of a layer" → drag in `jakim/jakim_extent.geojson` (or `borobudur_extent.geojson`). Run, then save the lines layer as SHP.
- **B. Browser.** Paste `jakim/jakim_overpass.overpassql` into overpass-turbo.eu → Run → Export → GeoJSON. Upload it here and I clip it.
- **C. Geofabrik.** `java-latest-free.shp.zip` → use `gis_osm_roads_free_1.shp`. Big file; run `python route_tools.py clip gis_osm_roads_free_1.shp` to cut it down.

Clipped files keep only `osm_id`, `name`, `highway`.

## 2. Select the route segments

**QGIS**
1. Load `<race>_osm_roads.shp` plus a basemap (XYZ OSM) and the race map image for reference.
2. Select Features tool (or `Ctrl`-click) each segment along the course, in any order. Filter by `name` (e.g. `"name" LIKE '%Rasuna Said%'`) to speed up.
3. Check gaps at junctions and U-turns: every piece must touch the next.
4. Right-click layer → Export → Save Selected Features As… → ESRI Shapefile, CRS **EPSG:4326**, tick *Save only selected features*. Name it `jakim_2026_selected.shp`.

**ArcGIS Pro**
1. Add the shp, Map → Select (hold `Shift` to add).
2. Right-click layer → Data → Export Features (honours the selection). Output CRS WGS 1984.

Upload all the shapefile parts (`.shp .shx .dbf .prj`, a zip is fine). I merge them into one line, simplify about 2 m, and give back `jakim_2026_route.geojson` with `race`, `year`, `km`.

If a road is missing or drawn wrong in OSM, digitise a short line in a new layer and export it with the selection; it merges the same way.

## 3. Start, finish and other points

Yes, use a **separate point layer**. Open `<race>_points_template.shp`, toggle editing, add points:

| field | values |
| --- | --- |
| `type` | `start`, `finish`, `turnaround`, `water`, `km` (km markers), `landmark` |
| `name` | e.g. "Monas NW corner", "GBK jogging track", "U-turn Jl. Mampang" |
| `km` | distance along the course if known (empty for start) |

`race` and `year` are added when I convert, so one file per race per year. If start and finish are the same spot (Borobudur), add one point with `type = start_finish`. Keep it as a point layer rather than line ends: the map can style and label them separately and they stay put if the line is re-simplified.

## Script

`tools/routes/route_tools.py` (needs `pip install -r tools/routes/requirements.txt`). Outputs land in `data/routes/<race>/`.

```
python tools/routes/route_tools.py clip    roads.geojson            # cuts both extents
python tools/routes/route_tools.py convert jakim_2026_selected.shp --race jakim --year 2026
python tools/routes/route_tools.py points  jakim_points.shp --race jakim --year 2026
```

Note: an out-and-back leg run twice is one line, so `km` can come out below 42.195. That is expected.
