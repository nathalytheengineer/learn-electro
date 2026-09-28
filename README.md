# Schematic Symbol Finder

A browser app for learning common electrical, MCC, field-device, and PLC ladder symbols. Describe a symbol by its appearance, tag, purpose, or behavior, choose the drawing context if known, and inspect ranked matches with explanations of what each symbol does and how to distinguish it. Cloud AI search sends the description to OpenAI through a Netlify Function; the API key stays server-side. Local matching remains available as a fallback.

## Run

Open `standalone.html` in a modern browser; it needs no server and uses local matching. To run the modular source files, run `python3 -m http.server 8000` in this folder and visit `http://localhost:8000`. Some browsers restrict modules on `file://`.

For local Netlify Function testing, set `OPENAI_API_KEY` in the terminal environment and run `npx netlify-cli dev`. Do not put the key in browser code or commit it to the repository. `OPENAI_MODEL` is optional and defaults to `gpt-4o-mini`. The regular `npm start` static preview does not run serverless functions, so it exercises the local fallback.

## Hosting

This repository is prepared to publish a production-ready, single-file build into the `docs/` folder (suitable for GitHub Pages).

- Build the app (creates `docs/index.html`):

```bash
npm run build
```

- Serve locally from the generated `docs/` folder:

```bash
npm start
# or
npm run serve
```

- GitHub Actions will automatically run the build and deploy the `docs/` folder to GitHub Pages on pushes to `main` or `master`.

If you prefer manual deployment, build then publish the `docs/` folder using your preferred host (Netlify, Vercel, or GitHub Pages). For a quick static host, enable GitHub Pages and choose the `docs/` folder on the `main` branch.

Cloud AI search currently requires Netlify Functions. In Netlify, add `OPENAI_API_KEY` under the site's environment variables before deploying. The Vercel and GitHub Pages configurations publish the static app and use local matching unless a server-side function is added for that host. Since the Netlify function is publicly callable, configure OpenAI usage limits and hosting-side abuse protection before sharing the site widely.

## Continuous deployment options

Netlify
- Connect the GitHub repository to Netlify and set the build command to `npm run build` and the publish directory to `docs`.
- I included a `netlify.toml` that declares the build command and publish folder — Netlify will pick this up automatically when you link the repo.

Vercel
- Import the repository into Vercel, select the `npm` build option, and use `npm run build` with the output directory set to `docs`.
- I included a `vercel.json` that configures the static build to use `docs` as the output directory.

Local preview of the production build

```bash
npm run build
npx http-server docs -p 5000
```


## Test

Run `npm test` with Node.js 18 or newer. No package install is required. After editing source files, run `npm run build` to refresh `docs/index.html`.

## Scope and accuracy

The SVGs are original representative teaching drawings, not a copy of or substitute for the IEC 60617 database. Electrical symbols vary by standard, jurisdiction, CAD library, and company conventions. The app does not assert that a vague description has an exact match. It distinguishes physical normally open/closed contacts from Rockwell XIC/XIO ladder instructions and shows alternatives for ambiguous descriptions. Check the drawing legend and manufacturer documentation before relying on a result for equipment work.

Catalog entries, synonyms, and factual explanations are in `catalog.js`; local semantic ranking is in `matcher.js`; cloud search is in `netlify/functions/search.mjs`; display logic is in `app.js`. AI candidates are restricted to the catalog, and the UI retains catalog-backed explanations. To extend it, add a catalog entry and a matching SVG case, then a test for a realistic description.

## Reference material

- IEC 60617 graphical symbols database: https://webstore.iec.ch/en/publication/2723
- Rockwell Automation Studio 5000 bit instructions: https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/38-01/contents-ditamap/instruction-set/bit-instructions1.html
- Schneider Electric overload relay terminals 95/96 and 97/98: https://www.se.com/no/no/faqs/FA107663/

This is an identification and learning aid, not a wiring, inspection, or safety design tool.
