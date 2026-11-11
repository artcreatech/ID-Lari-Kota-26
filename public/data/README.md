# Story data (v1, 11 Nov 2026)

Files the site loads at runtime. Every number has a `source_url`. Gaps stay blank, never zero.

| File | One row per | Feeds |
| --- | --- | --- |
| `races.csv` | race: name, city, first edition, 2026 label | timeline (B06–B09), explorer |
| `race_years.csv` | race and year: runners, 42K runners, reported impact | the boom (B02–B05), money (B10–B11), explorer |
| `origins.csv` | race, year and metric: international runners, countries, share from outside the region | runner origin (B12) |
| `venues.geojson` | race start/finish point | national map (B14) |
| `event_counts.csv` | year: running events in Indonesia | opener / boom context |
| `labels.csv` | race and year a World Athletics label was reported | label ladder (B09), explorer |
| `routes/<race>_2026_route.geojson` | race: route line plus start, finish and landmark points | route beats (B15) |

## How to read the fields

- `count_type`: `total` (all distances), `total_min` (source says "more than"), `approx` (source says "about"), `on_site` (excludes virtual), `starters`, `quota`, `target`. Draw `quota` and `target` dashed, not as results.
- `impact_rp_bn`: billions of rupiah as published. `impact_type` says what it is: `survey`, `survey_direct`, `reported`, `reported_direct`, `organizer_estimate`, `estimate`, `estimate_min`, `projection`, `target`. These use different methods and are not comparable; show the type.
- `race_id = jrf` is one line: Jakarta Marathon 2013–2023, Jakarta Running Festival from 2024.

## Known gaps

- Not found: Maybank 2014–2016, 2019; Jakarta Marathon 2017, 2023; Borobudur 2024; Jogja 2019, 2024; Bekasi 2025; Maros (all years). Borobudur 2020–2021 were elite-only and left out.
- Pocari Bandung 2015–2023: the year-by-year list is in a Kompas article that blocks automated reading. Copy it by hand.
- Borobudur 2026 is the quota; replace with the final count after 15 Nov.
- `origins.csv` has no outside-region share for JAKIM or JRF. The impact floor formula needs one; until then use a range (20–40%), as in the projections.
- `venues.geojson` points were placed by hand and are approximate (about 1 km). Fine for a national map; check before any street-level use.
- `event_counts.csv`: 2018–2023 still missing. The calendar archive at kalenderlari.com cuts its 2019 page off at 23 Nov, so 2019 is a floor.

- `routes/*.geojson` are **draft illustrations**, not official courses: shortest paths on OSM roads between hand-picked waypoints (`scripts/draft_routes.py`). JAKIM draws about 26 km and Borobudur about 36 km. Replace with the traced routes before launch.
