# Bites — v0

> Remember every bite worth remembering.

A personal, dish-level food memory app. Single-page web app, vanilla HTML/CSS/JS, localStorage-backed, mobile-first, PWA-ready. No backend, no accounts, no analytics.

This is **v0** — the smallest thing that proves the core loop works.

---

## Run it

```bash
cd bites
python3 -m http.server 8765
# then open http://localhost:8765 on your phone or laptop
```

That's it. No build step, no `npm install`. The whole app is in `index.html`.

For PWA / install / camera capture to work properly you need to serve over `localhost` or HTTPS — `file://` will fall back to gracefully-degraded behavior.

---

## What's in v0

- **Add a bite** — single bottom sheet, photo-first. Camera input on mobile (`capture="environment"`), file picker on desktop. Auto-downscales to ~1280px JPEG @ 0.82 quality before saving.
- **Browse** — masonry grid (2 cols on mobile, 3 on tablet, 4 on desktop), newest first.
- **Search** — text search across dish, restaurant, notes, tags, city. The "what did I have at that place?" query works.
- **Filter** — chips for top tags (by frequency) and rating threshold (★ 3+ / ★ 4+).
- **Detail view** — tap any card. Edit and delete from there.
- **Stats** — totals, top restaurants, top tags, recently rated highest. Tap a restaurant in stats to jump back to the grid filtered by it.
- **Export / Import** — JSON download / upload. Sample data loader. Nuclear "delete all" button.
- **Empty states** — first-run + no-search-results, both written to feel warm.
- **PWA** — manifest, service worker (cache-first shell), install banner.

### What's deliberately out

- No auth, no cloud, no sync (v1)
- No AI features (paid v2)
- No maps (cut for time; lat/lng is in the data model, ready for v1)
- No groups / circles (v3)
- No analytics, tracking, or anything that phones home

---

## Layout sketch (375px)

```
┌──────────────────────────────────┐
│  Bites.   v0              [⇕]    │  ← topbar (sticky)
├──────────────────────────────────┤
│  Bites    Stats                  │  ← tabs
│  ─────                           │
│  ┌──────────────────────────┐    │
│  │ 🔎 Search dish, rest...  │    │  ← search
│  └──────────────────────────┘    │
│  [★4+] [★3+] [#ramen] [#pasta]   │  ← filter chips
│                                  │
│  Recent bites          7 bites   │
│                                  │
│  ┌─────────┐  ┌─────────┐        │
│  │ [photo] │  │ [photo] │        │
│  │ Spicy   │  │ Cacio e │        │  ← masonry: variable
│  │ Tonkotsu│  │ Pepe    │        │    heights, 2 cols
│  │ Ramen   │  │ Flour+  │        │
│  │ ★★★★⯨   │  │ ★★★★★   │        │
│  └─────────┘  └─────────┘        │
│  ┌─────────┐  ┌─────────┐        │
│  │   ...   │  │   ...   │        │
│                                  │
│                            [+]   │  ← FAB (always visible)
└──────────────────────────────────┘
```

The add sheet slides up from the bottom on mobile, centers as a modal on tablet+. Photo is the hero of every card and detail view.

---

## Data model

One JSON object per bite, stored in `localStorage` under `bites.v0` as an array.

```json
{
  "id": "bite-{uuid}",
  "dish_name": "Spicy Tonkotsu Ramen",
  "restaurant_name": "Tatsu Ramen",
  "city": "San Francisco",
  "rating": 4.5,
  "notes": "Rich broth, perfect chashu. Get the egg.",
  "tags": ["spicy", "ramen", "repeat"],
  "photo_data_url": "data:image/jpeg;base64,...",
  "price_estimate": "$$",
  "date": "2026-05-06",
  "created_at": "2026-05-06T19:08:00Z",
  "lat": 37.78,
  "lng": -122.41
}
```

This shape is **stable** — v1+ AI features will read against it.

---

## Storage notes

- One `localStorage` key: `bites.v0`. Two flag keys: `bites.v0.seedDismissed`, `bites.v0.installDismissed`.
- Photos are stored inline as base64 data URLs after canvas downscale. After downscale a typical food photo is ~80–200 KB.
- **localStorage is typically capped at ~5 MB per origin in most browsers.** That's roughly 30–50 bites with photos before quota errors. The app catches `QuotaExceededError` and surfaces a toast prompting the user to export and clear.
- Migration path for v1: move photos into IndexedDB / OPFS (or cloud), keep metadata in localStorage. The `photo_data_url` field becomes a reference URL; the app keeps working.

---

## Design decisions

Three calls were made with parallel-prototyping discipline (≥3 alternatives, pick best, document why). The choices are also commented inline in `index.html`.

| Decision | Alternatives considered | Picked | Why |
|---|---|---|---|
| **Grid layout** | (1) 2-col masonry · (2) 3-col uniform square · (3) single-col full-bleed feed | **Masonry, 2/3/4 cols by viewport** | Photo-as-hero needs to breathe. Uniform squares feel database-y. Full-bleed wastes mobile real estate. CSS-columns gives masonry without JS. |
| **Add-bite flow** | (1) 4-step wizard · (2) single bottom sheet · (3) modal page | **Single bottom sheet, photo-first** | "Tap + → saved <30s" demands no step gates. Sheet stays in context (overlays grid). Photo at top makes it photo-first emotionally. |
| **Rating system** | (1) 5-star halves · (2) thumbs up/down · (3) 10-pt slider | **5-star halves** | Universal language. Half-star resolution is enough for memory ("4 not 4.5"). Matches `rating: 4.5` in the data model. Slider feels clinical. |

Other choices worth noting (lower stakes, didn't formally parallel):
- **Type pairing:** Fraunces (display serif) for headings + Inter (sans) for UI body. Resists the clinical SaaS look.
- **Palette:** cream `#FAF6F0`, burnt-orange `#C84B31`, gold `#D9A441`. Warm, slightly indulgent — not Yelp red, not Notion grey.
- **Search & filter live in the grid header**, not a separate "search page". Feels like a journal you scan, not a database you query.

---

## Verifying it works

```bash
# JS parses cleanly
node -e "const fs=require('fs'); new Function(fs.readFileSync('index.html','utf8').match(/<script>([\\s\\S]*?)<\\/script>/)[1])"

# All JS-referenced #ids exist in HTML
# (smoke check baked into commit — re-run if you edit)

# Server up
python3 -m http.server 8765
```

Then in browser:
- Empty state shows on first load
- Tap "Try with sample bites" — 7 bites populate
- Add a new bite (no photo OK), refresh page — it persists
- Search "ramen" — only ramen card(s) show
- Search by restaurant name — answers "what did I eat there?"
- Open a bite, edit it, delete it — all work
- Export → file downloads, import → merges cleanly
- Resize to 1200px+ — grid widens to 4 cols, sheet centers as modal
- Refresh while offline — cached shell still loads

---

## File map

```
bites/
├─ index.html      ← the entire app (HTML + CSS + JS, ~1700 lines)
├─ seed-data.json  ← 7 sample bites for first-run demo
├─ manifest.json   ← PWA manifest
├─ sw.js           ← service worker (cache-first shell)
├─ icons/          ← 192/512 PNG + SVG
├─ BRIEF.md        ← founder's brief (CEO content — don't edit from a build session)
└─ README.md       ← this file
```

---

## What v1 needs

In rough priority:

1. Cloud backup (auth + photo storage). Without it, users lose data when they switch phones — that's a memory-app deal-breaker.
2. Bulk import from camera roll (with an LLM-assisted tagger). Closes the "I have 8000 food photos and zero taxonomy" gap.
3. Move photos to IndexedDB / OPFS so storage isn't capped at ~5MB.
4. Capacitor wrap for App Store / Play Store presence (optional — PWA-first is fine for v1).
5. Map view (lat/lng is in the data model already).

---

— v0 built 2026-05-06.
