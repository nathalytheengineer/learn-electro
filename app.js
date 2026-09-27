import {catalog,symbolSvg} from './catalog.js';
import {findSymbols} from './matcher.js';

const $=selector=>document.querySelector(selector);
const form=$('#lookup-form'), input=$('#description'), context=$('#context'), results=$('#results'), cards=$('#catalog');
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let latest=[];

function showSymbol(symbol,status='selected',alternatives=[]){
 const caution=status==='ambiguous'?'Several symbols fit this description. Check the alternatives and the drawing context.':status==='uncertain'?'This description is too broad for a reliable identification. Add the tag, nearby components, or whether this is power wiring or PLC ladder logic.':'';
 results.innerHTML=`<article class="result-card">
   <div class="result-top"><div class="symbol-art">${symbolSvg(symbol.id)}</div><div class="result-main">
    <span class="pill">${escapeHtml(symbol.kind)} · ${status==='selected'?'catalog choice':status+' match'}</span>
    <h2>${escapeHtml(symbol.name)}</h2><div class="notation">${escapeHtml(symbol.notation)}</div>
    <p><strong>What it looks like:</strong> ${escapeHtml(symbol.visual)}</p>
   </div></div>
   <div class="details"><div class="detail"><strong>What it does</strong>${escapeHtml(symbol.does)}</div><div class="detail"><strong>Important distinction</strong>${escapeHtml(symbol.distinction)}</div></div>
   ${caution?`<p class="caution">${escapeHtml(caution)}</p>`:''}
   ${alternatives.length?`<div class="alternatives"><h3>Other possible matches</h3>${alternatives.map(s=>`<button type="button" data-id="${s.id}">${escapeHtml(s.name)}</button>`).join('')}</div>`:''}
  </article>`;
 results.scrollIntoView({behavior:'smooth',block:'start'});
}

function search(){
 const found=findSymbols(input.value,context.value,7);latest=found.matches.map(x=>x.symbol);
 if(!latest.length){results.innerHTML='<div class="empty-state">No catalog match yet. Try naming a shape, tag (such as OL or KM1), or function. The catalog below is available to browse.</div>';return}
 showSymbol(latest[0],found.status,latest.slice(1));
}
form.addEventListener('submit',event=>{event.preventDefault();search()});
document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{input.value=button.dataset.example;search()}));
results.addEventListener('click',event=>{const button=event.target.closest('[data-id]');if(!button)return;const chosen=catalog.find(s=>s.id===button.dataset.id);if(chosen)showSymbol(chosen,'selected',latest.filter(s=>s.id!==chosen.id))});
cards.addEventListener('click',event=>{const button=event.target.closest('[data-id]');if(!button)return;const chosen=catalog.find(s=>s.id===button.dataset.id);if(chosen)showSymbol(chosen)});
cards.innerHTML=catalog.map(s=>`<button type="button" data-id="${s.id}" aria-label="View ${escapeHtml(s.name)}"><span aria-hidden="true">${symbolSvg(s.id)}</span><span class="name">${escapeHtml(s.name)}</span><small>${escapeHtml(s.kind)}</small></button>`).join('');
$('#catalog-count').textContent=`${catalog.length} entries`;
