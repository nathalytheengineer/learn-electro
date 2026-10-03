import fs from 'node:fs';
const html=fs.readFileSync('index.html','utf8');
const css=fs.readFileSync('styles.css','utf8');
const catalog=fs.readFileSync('catalog.js','utf8').replace(/\bexport (const|function)\b/g,'$1');
const matcher=fs.readFileSync('matcher.js','utf8').replace(/^import .*?;\s*$/gm,'').replace(/\bexport (const|function)\b/g,'$1');
const app=fs.readFileSync('app.js','utf8').replace(/^import .*?;\s*$/gm,'');
const js=[catalog,matcher,app].join('\n').replaceAll('</script>','<\\/script>');
const output=html.replace('<link rel="stylesheet" href="./styles.css">',`<style>${css}</style>`).replace('<script type="module" src="./app.js"></script>',`<script>${js}</script>`);
const standalone=output.replace('<html lang="en">','<html lang="en" data-cloud-search="disabled">');
// Ensure docs/ exists for GitHub Pages hosting and write index.html there
fs.mkdirSync('docs', { recursive: true });
fs.writeFileSync('docs/index.html', output);
fs.writeFileSync('standalone.html', standalone);
// Add a nojekyll file to avoid GitHub Pages processing
fs.writeFileSync('docs/.nojekyll', '');
console.log('Wrote docs/index.html');
