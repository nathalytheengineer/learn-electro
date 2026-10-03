# Schematic Symbol Finder

A browser app for learning electrical, control, PLC, and field-device symbols. Describe a symbol by appearance, label, purpose, or function, choose the drawing context if known, and review ranked matches with explanations of what each symbol does and how it differs from similar marks.

The app works in two modes:
- Local matching without any server dependency for quick offline use
- Cloud AI search through a Netlify Function when an API key is configured

## Features

- Search by visual appearance, tag numbers, or device function
- Distinguish physical contacts from PLC ladder instructions such as XIC and XIO
- Show ranked alternatives for ambiguous descriptions
- Browse a growing symbol catalog with SVG teaching drawings
- Search motor-control, HVAC/refrigeration, process-instrumentation, PLC, power, and field-device symbols
- Use context such as control, power, ladder, or instrumentation to improve matching

## Open-source symbol library approach

This project uses original, representative teaching sketches rather than claiming to reproduce or bundle the official IEC 60617 database or third-party symbol artwork. Public libraries are listed as references for further research; each upstream license must be checked before adapting its artwork.

The public catalog model includes:
- `source`: where the symbol came from or how it was curated
- `license`: the usage note for that entry
- `aliases`: common search phrases used to find the symbol

The motor-control, HVAC/refrigeration, and process-instrumentation catalog batch contains 20 original in-app sketches based on common engineering concepts. Their entry metadata identifies them as original educational drawings; the source index lists public reference libraries without implying their artwork was imported.

Public reference libraries are recorded in [`data/public-symbol-sources.json`](data/public-symbol-sources.json), including [QElectroTech elements](https://github.com/qelectrotech/qelectrotech-elements) and [KiCad symbol libraries](https://gitlab.com/kicad/libraries/kicad-symbols). Check each upstream project's current license and attribution requirements before adapting its artwork.

## Run locally

Open `standalone.html` in a modern browser for the no-server version.

For the module-based version, run:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Build and preview

```bash
npm run build
npm start
```

The static production build is generated into the `docs/` folder for GitHub Pages or similar hosts.

## Cloud AI setup

For the OpenAI-backed search, configure a server-side secret:

```bash
OPENAI_API_KEY=your_key_here
npx netlify-cli dev
```

Do not store the API key in browser code or commit it to the repo.

## Deployment

This project is prepared for free static hosting:

- GitHub Pages: build into `docs/` and publish the folder
- Netlify: set the build command to `npm run build` and publish directory to `docs`
- Vercel: use the static build output directory `docs`

## Tests

```bash
npm test
```

This project includes checks for matching accuracy, catalog safety, SVG rendering, and search API behavior.

## Scope and accuracy

The SVGs are original representative sketches for learning, not copies of an official IEC standards database. Electrical symbols vary by standard, jurisdiction, CAD library, and company conventions. The app avoids claiming certainty for vague descriptions and shows alternatives when a symbol could have multiple valid interpretations.

Relevant implementation files:
- `catalog.js` — catalog entries and symbol drawings
- `matcher.js` — local ranking and search suggestions
- `app.js` — browser UI and search flow
- `netlify/functions/search.mjs` — server-side AI search

## Reference material

- IEC 60617 graphical symbols database: https://webstore.iec.ch/en/publication/2723
- Rockwell Automation Studio 5000 instruction set: https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/38-01/contents-ditamap/instruction-set/bit-instructions1.html
- Schneider overload contact numbering: https://www.se.com/no/no/faqs/FA107663/

This is a learning and identification aid, not a wiring, inspection, or safety design tool.
