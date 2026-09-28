import {catalog,symbolSvg} from './catalog.js';
import {findSymbols} from './matcher.js';

const $=selector=>document.querySelector(selector);
const form=$('#lookup-form'), input=$('#description'), context=$('#context'), results=$('#results'), cards=$('#catalog');
const searchButton=form.querySelector('button[type="submit"]');
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let searchSequence=0;

function showSymbol(symbol,status='selected',alternatives=[],insight=null){
 const caution=status==='ambiguous'?'Several symbols fit this description. Check the alternatives and the drawing context.':status==='uncertain'?'This description is too broad for a reliable identification. Add the tag, nearby components, or whether this is power wiring or PLC ladder logic.':'';
 const matches=[{symbol,...insight},...alternatives];
 results.innerHTML=`<article class="result-card">${matches.map((match,index)=>`${index?'<section class="alternatives">':''}
   <div class="result-top"><div class="symbol-art">${symbolSvg(match.symbol.id)}</div><div class="result-main">
    <span class="pill">${escapeHtml(match.symbol.kind)} · ${index===0?(status==='selected'?'catalog choice':status+' best match'):'possible match'}</span>
    <h2>${escapeHtml(match.symbol.name)}</h2><div class="notation">${escapeHtml(match.symbol.notation)}</div>
    <p><strong>What it looks like:</strong> ${escapeHtml(match.symbol.visual)}</p>
    ${match.reason?`<p><strong>Why it may fit:</strong> ${escapeHtml(match.reason)}</p>`:''}
    ${match.explanation?`<p><strong>AI explanation:</strong> ${escapeHtml(match.explanation)}</p>`:''}
   </div></div>
   <div class="details"><div class="detail"><strong>What it does</strong>${escapeHtml(match.symbol.does)}</div><div class="detail"><strong>Important distinction</strong>${escapeHtml(match.symbol.distinction)}</div></div>
   ${index===0&&caution?`<p class="caution">${escapeHtml(caution)}</p>`:''}${index?'</section>':''}`).join('')}</article>`;
 results.scrollIntoView({behavior:'smooth',block:'start'});
}

function showLocalMatches(description,notice=''){
 const found=findSymbols(description,context.value,7);
 if(!found.matches.length){
  results.innerHTML=`<div class="empty-state">${notice?`${escapeHtml(notice)} `:''}No catalog match yet. Try describing the shape, tag, job, or behavior. The catalog below is available to browse.</div>`;
  return;
 }
 const matches=found.matches.map(match=>({
  symbol:match.symbol,
  reason:match.reasons.length?`Matched terms: ${match.reasons.join(', ')}.`:''
 }));
 showSymbol(matches[0].symbol,found.status,matches.slice(1),matches[0]);
 if(notice)results.insertAdjacentHTML('afterbegin',`<p class="caution">${escapeHtml(notice)}</p>`);
}

async function search(){
 const description=input.value.trim();
 if(!description)return;
 const requestId=++searchSequence;
 searchButton.disabled=true;
 searchButton.textContent='Searching with AI...';
 results.innerHTML='<div class="empty-state">Searching the symbol catalog with the cloud model...</div>';
 try{
  const response=await fetch('/.netlify/functions/search',{
   method:'POST',
   headers:{'Content-Type':'application/json'},
   body:JSON.stringify({description,context:context.value})
  });
  if(!response.ok)throw new Error('Cloud search unavailable');
  const data=await response.json();
  if(requestId!==searchSequence)return;
  const matches=(Array.isArray(data.matches)?data.matches:[]).flatMap(match=>{
   const symbol=catalog.find(item=>item.id===match.symbolId);
   return symbol?[{symbol,reason:match.reason,explanation:match.explanation}]:[];
  });
  if(!matches.length){
   showLocalMatches(description,'Cloud search found no confident match; showing local suggestions.');
   return;
  }
  showSymbol(matches[0].symbol,data.status,matches.slice(1),matches[0]);
 }catch{
  if(requestId===searchSequence)showLocalMatches(description,'Cloud search is unavailable; showing local matches.');
 }finally{
  if(requestId===searchSequence){
   searchButton.disabled=false;
   searchButton.innerHTML='Search with AI <span aria-hidden="true">→</span>';
  }
 }
}
form.addEventListener('submit',event=>{event.preventDefault();void search()});
document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{input.value=button.dataset.example;void search()}));
cards.addEventListener('click',event=>{const button=event.target.closest('[data-id]');if(!button)return;const chosen=catalog.find(s=>s.id===button.dataset.id);if(chosen){searchSequence++;searchButton.disabled=false;searchButton.innerHTML='Search with AI <span aria-hidden="true">→</span>';showSymbol(chosen)}});
cards.innerHTML=catalog.map(s=>`<button type="button" data-id="${s.id}" aria-label="View ${escapeHtml(s.name)}"><span aria-hidden="true">${symbolSvg(s.id)}</span><span class="name">${escapeHtml(s.name)}</span><small>${escapeHtml(s.kind)}</small></button>`).join('');
$('#catalog-count').textContent=`${catalog.length} entries`;
