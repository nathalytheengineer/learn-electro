# Schematic Symbol Finder

A dependency-free browser app for learning common electrical, MCC, field-device, and PLC ladder symbols. Enter a description, choose the drawing context if known, and inspect a ranked match with alternatives. Everything runs locally; descriptions are not sent to a server.

## Run

Open `standalone.html` in a modern browser; it needs no server. To run the modular source files, run `python3 -m http.server 8000` in this folder and visit `http://localhost:8000`. Some browsers restrict modules on `file://`.

## Test

Run `npm test` with Node.js 18 or newer. No package install is required. After editing source files, run `npm run build` to refresh `standalone.html`.

## Scope and accuracy

The SVGs are original representative teaching drawings, not a copy of or substitute for the IEC 60617 database. Electrical symbols vary by standard, jurisdiction, CAD library, and company conventions. The app does not assert that a vague description has an exact match. It distinguishes physical normally open/closed contacts from Rockwell XIC/XIO ladder instructions and shows alternatives for ambiguous descriptions. Check the drawing legend and manufacturer documentation before relying on a result for equipment work.

Catalog entries and synonyms are in `catalog.js`; ranking is in `matcher.js`; display logic is in `app.js`. To extend it, add a catalog entry and a matching SVG case, then a test for a realistic description.

## Reference material

- IEC 60617 graphical symbols database: https://webstore.iec.ch/en/publication/2723
- Rockwell Automation Studio 5000 bit instructions: https://www.rockwellautomation.com/en-us/docs/studio-5000-logix-designer/38-01/contents-ditamap/instruction-set/bit-instructions1.html
- Schneider Electric overload relay terminals 95/96 and 97/98: https://www.se.com/no/no/faqs/FA107663/

This is an identification and learning aid, not a wiring, inspection, or safety design tool.
