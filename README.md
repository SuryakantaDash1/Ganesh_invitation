# Ganesh Chaturthi Invitation

A scroll-driven, single-page invitation. Implemented from the Claude Design source
`Ganesh Chaturthi Invitation.dc.html`
(project `eb05e408-e285-4981-beea-5690da050c98`), ported off the Claude Design
runtime (`x-dc` / `DCLogic` / `support.js`) into plain HTML, CSS and JS.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Markup for the three scenes: hero, invitation, details |
| `styles.css` | All styling, keyframes and reduced-motion handling |
| `app.js` | Scroll choreography, video autoplay nudge, share/map actions |
| `.claude/launch.json` | Local preview server on port 8765 |

## Media

All six files the page needs are in place:

```
assets/garland.png      1024x1536   uploads/bell.png    1024x1536
assets/bellLong2.png     941x1672   uploads/Mouse.png   1199x1312
assets/lamp2.png        1107x1421   uploads/Mouse_looking_at_rotating_Ganpati_202609051306.mp4
```

`bell.png`, `Mouse.png` and the video came straight from the source folder.
The other three were rebuilt locally: the design project's cut-outs are larger
than the design MCP's 256 KiB per-file read limit, and the raw uploads
(`flowers.png`, `longer bell.png`, `pooja candle.png`) had the transparency
checkerboard baked into their pixels as opaque RGB. Alpha was restored by
keying that checkerboard out - a border flood-fill through desaturated, light
pixels, so white jasmine petals and specular highlights enclosed by the subject
survive. The lamp needed a second, looser growth pass to clear the checker
showing through the soft glow around each flame.

If you ever want pixel-exact parity with the design, download
`assets/garland.png`, `assets/bellLong2.png` and `assets/lamp2.png` from the
Claude Design project and overwrite these three - same dimensions, drop-in.

Note: `assets/` also holds the unused raw source images (`background*.png`,
`hero section.png`, `flowers.png`, `longer bell.png`, `pooja candle.png`).
They are duplicated in `assests/website/`, so they can be removed from `assets/`
before deploying. The six files above total about 11.6 MB.


## Configuration

Edit `CONFIG` at the top of `app.js`:

- `mapsUrl` — destination for the mushak / "Tap me for directions" tap target
- `showWhatsApp` — show or hide the share button
- `showPetals` — show or hide the falling petals in the details scene
- `shareMessage` — the WhatsApp share text (`mapsUrl` is appended)

Event details, venue and family name are plain text in `index.html`.

Set `og:url` and `og:image` in `index.html` to the hosted URL before sharing so
WhatsApp renders a proper link preview.

## Run locally

```bash
python3 devserver.py 8765
```

Then open http://localhost:8765.

`devserver.py` serves `Cache-Control: no-store` and strips `Last-Modified`.
Plain `python3 -m http.server` does neither, so browsers keep serving edited
CSS/JS from cache - and a file restored with an older mtime (an `mv` that
preserves timestamps) loses the revalidation race and the stale copy sticks.

## Notes on the port

- Scroll choreography keeps the original easing (`1 - (1-t)^3`).
- Scene progress is measured from the moment a section's top edge crosses the
  bottom of the viewport, not from when its sticky stage pins. The design
  measured only the pinned range, which meant a full viewport of scrolling
  (~812px) past a static, empty stage before anything moved. Thresholds were
  retuned for the new range and the scenes shortened (230svh -> 180svh,
  210svh -> 170svh), cutting the scroll to the finished state by about a fifth.
- The page has exactly one background: a single gradient on `.frame`, which
  spans every section. The hero and both sticky stages are transparent and let
  it through. Previously each section painted its own gradient, so the hero's
  scrim (rgba 250,232,215) met scene 2's gradient top (#fff8ef) as a visible
  horizontal step. One background element means no boundary exists to step
  across. The gradient holds flat `--ground` through its top 42% so the hero's
  scrim resolves onto exactly the same colour.
- The garland is split into two halves that slide in from the left and right
  edges rather than dropping from above. Each half is a wrapper clipped to its
  side of the art with the image at 200% width inside. The source is fully
  transparent between x=320 and x=703 of 1024, so the midline split never cuts
  a flower and the halves rejoin invisibly.
- Elements now start in their pre-animation position via CSS rather than waiting
  for the first animation frame, which removes a flash on load.
- The `sc-if` template conditionals became the `showPetals` / `showWhatsApp`
  config flags.
- `style-hover` / `style-active` attributes became real CSS `:hover` / `:active`
  rules; the mushak and share targets are now real `<button>` elements for
  keyboard access.
- Added: page title, description and Open Graph tags, visible focus rings, and a
  `prefers-reduced-motion` rule that stills the ambient loops (swinging bells,
  bobbing, falling petals) while leaving scroll-linked motion intact.
