One module per story section, named after the beats in the story timeline:

- `01-boom.js` B02 to B05, growth charts (D3)
- `02-timeline.js` B06 to B09
- `03-money.js` B10 to B12
- `04-routes.js` B14 to B15, MapLibre route drawing
- `05-explorer.js` B22 to B23

Each module exports `init(rootEl, data)` and is called from `src/main.js`.
