# ID-Lari-Kota-26
An interactive scrollytelling story about Indonesia's marathon boom: how fast the races are growing, where their routes run, who they bring in, and what they mean for city streets and local economies.

## Run it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build in dist/
npm run preview  # serve the build locally
```

Needs Node 20 or newer.

## Stack

Vite with plain JavaScript, [Scrollama](https://github.com/russellsamora/scrollama) for scroll steps, [D3](https://d3js.org) for charts, [MapLibre GL JS](https://maplibre.org) for maps.

## Folders

| Path | What goes there |
|------|-----------------|
| `src/sections/` | One module per story section |
| `src/styles/tokens.css` | Colors and fonts (provisional, from the design direction) |
| `public/data/` | Files the site loads at runtime: `races.csv`, route GeoJSON |
| `data/raw/` | Source downloads, kept out of git |
| `data/processed/` | Cleaned outputs that feed `public/data/` |
| `scripts/` | Python or Node scripts that turn raw data into processed data |

Every number in `public/data/` needs a `source_url`. Gaps stay blank, never zero.

## Deploy (free)

Cloudflare Pages: connect this repo, set the build command to `npm run build` and the output directory to `dist`. Every branch gets a preview URL, and `main` publishes the live site.

## License

CC0 1.0. Everything committed here is public.
