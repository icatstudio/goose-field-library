# Goose Field Library

Field finds, photo IDs and the chemistry behind them. Public, static, no build step: GitHub Pages serves `main`.

## Shape
- `index.html`, `library.css`, `library.js` — one page that renders whichever shelf the URL hash names (`#karaburun-2026-11-18`), the last shelf by default.
- `shelves/index.json` — the list of shelves (id, number, title, date).
- `shelves/<id>.json` — one shelf: meta (title, date, time, place, leg., det., lede) and `finds[]`.
- `shelves/<id>/img/<photo>.jpg` — originals (960×1280 from the phone); `shelves/<id>/thumb/<photo>.jpg` — 540 px grid copies (`ffmpeg -i in.jpg -vf scale=540:-2 -q:v 4 out.jpg`).

## Adding a shelf
1. Add `shelves/<id>.json` and the photo folders.
2. Add one line to `shelves/index.json`.
3. `node --test test/` checks every named photo exists, then open a PR.

## A find
```json
{ "no": "KB-15", "kind": "fungus", "time": "13:59", "photos": ["kb-17", "kb-18"],
  "name": "…", "latin": "…", "tr": "…", "flag": "deadly|poison|mild|unknown", "flagText": "…", "conf": "~70 %",
  "id": "…", "chem": "…", "lab": "…", "check": "…",
  "spore": { "status": "pending" } }
```
Spore print done: `"spore": { "status": "done", "colour": "brown", "hex": "#6b4a2b", "note": "…", "photo": "kb-15-spore" }` with the print photo in `img/` and `thumb/`.

Every mushroom ID here is a photo guess. Nothing was eaten. Never eat a wild mushroom on a photo ID.
