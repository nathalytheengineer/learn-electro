import fs from 'fs';
import {fileURLToPath} from 'url';
import path from 'path';
import puppeteer from 'puppeteer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function render(svgPath, outPath, width=1200, height=628) {
  const svg = fs.readFileSync(svgPath, 'utf8');
  const browser = await puppeteer.launch({args: ['--no-sandbox', '--disable-setuid-sandbox']});
  const page = await browser.newPage();
  await page.setViewport({width, height});
  await page.setContent(`<!doctype html><html><body style="margin:0">${svg}</body></html>`);
  await page.screenshot({path: outPath, type: 'png', clip: {x:0,y:0,width,height}});
  await browser.close();
}

const svg = process.argv[2] || '../assets/linkedin-card.svg';
const out = process.argv[3] || '../assets/linkedin-card.png';
render(path.resolve(svg), path.resolve(out)).then(()=>console.log('Wrote', out)).catch(err=>{console.error(err);process.exit(1)});
