# luther-aloud-site

The `lutheraloud.org` static website. Plain HTML/CSS/JS, no framework, no
build step. Deployed to GitHub Pages by `.github/workflows/pages.yml` on every
push to `main`.

## Editing content without touching HTML

Everything the page shows — the About video, the channel URL, the episode
list, the "coming soon" roadmap — lives in **`data/episodes.json`**.
`js/site.js` reads it on load and renders the About video embed and the
Episodes/Roadmap section from it.

### Flipping an episode from "coming soon" to "live"

Set `status: "live"` on the entry and add its `youtube_url`:

```json
{
  "num": 2,
  "title": "Luther's Prefaces to His Works",
  "year": "1539/1545",
  "status": "live",
  "youtube_url": "https://youtu.be/<VIDEO_ID>"
}
```

A `live` entry renders as a wide card with the YouTube thumbnail pulled
straight from `i.ytimg.com/vi/<id>/hqdefault.jpg`. No image hosting needed.

Everything else stays dimmed with a "coming soon" tag, and sermon
collections render as one card with an estimated-count badge.

### Reordering, renaming, adding

Rearrange or edit entries directly in the JSON. `num` is a display label
(the planned episode number), not an id — sorting is by array order.

## Local preview

Any static server works; the JSON is fetched, so `file://` won't do.

```
python3 -m http.server 8000
# → http://localhost:8000/
```

## Files

```
.
├── index.html
├── css/style.css
├── js/site.js
├── data/episodes.json      ← edit this to update episodes
├── assets/rose.svg
├── CNAME                   ← lutheraloud.org
├── .nojekyll               ← Pages skips Jekyll processing
├── robots.txt
├── sitemap.xml
└── .github/workflows/pages.yml
```

## Provenance

The narration pipeline that produces the videos lives in a separate,
private repository. This repo is the public website only — commits here
never carry generation code, keys, or source-text tooling.
