One module per story section, named after the beats in the story timeline. Second draft, 11 Nov 2026, Indonesian copy lives in `index.html`.

- `00-opener.js` B01, one dot per runner on a canvas (JAKIM 2026, then JRF 2026)
- `01-boom.js` B02 to B05, growth charts (D3)
- `02-timeline.js` B06 to B09, lanes from `races.csv` and `labels.csv`
- `03-money.js` B10 to B12, reported impact and runner origin
- `04-routes.js` B14 to B15, MapLibre national map and the JAKIM and Borobudur route drawing
- `05-explorer.js` B22 to B23, race and year picker, method notes, source list

Each module exports `init(rootEl, data)` and is called from `src/main.js`. Shared helpers are in `src/lib/` (`data.js` loads every file in `public/data/`, `scrolly.js` wires Scrollama).

Not built yet: B13 (spending per runner, stretch), B16 to B21 (city chapter, after launch).

Routes: `public/data/routes/<race>_2026_route.geojson` are **draft illustrations** made by `scripts/draft_routes.py` (shortest path on OSM roads between hand-picked waypoints). Replace each with the traced course, keeping the same file name and a `kind: route` LineString feature, and the map picks it up.
