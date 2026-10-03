import {catalog,symbolSvg} from './catalog.js';
import {findSymbols,getSearchSuggestions} from './matcher.js';

const $=selector=>document.querySelector(selector);
const form=$('#lookup-form'), input=$('#description'), context=$('#context'), results=$('#results'), cards=$('#catalog'), suggestionsPanel=$('#search-suggestions'), clearButton=$('#clear-search'), searchStatus=$('#search-status');
const searchButton=form.querySelector('button[type="submit"]');
const cloudSearchEnabled=document.documentElement.dataset.cloudSearch!=='disabled'&&window.location.protocol!=='file:';
const escapeHtml=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const contextExplanations={
 control:'Control drawings show how switches and relays start, stop, or interlock equipment.',
 power:'Power drawings show how electrical energy reaches motors and other loads.',
 ladder:'PLC ladder drawings show software logic; a symbol can test a computer bit rather than represent a physical switch.',
 instrument:'Instrumentation drawings show sensors, measurements, and signals used to monitor physical processes.',
 safety:'Safety-control drawings show parts of a risk-reduction system; a symbol alone does not prove a safety rating.'
};
let searchSequence=0;

function explainContexts(symbol){
 return (symbol.contexts||[]).map(value=>contextExplanations[value]).filter(Boolean).join(' ');
}

function setSearchStatus(mode='local'){
 const status={
  local:'Local matching ready',
  ai:'Cloud AI search ready',
  searching:'Searching symbol catalog…',
  fallback:'Local fallback active'
 };
 searchStatus.textContent=status[mode]||status.local;
 searchStatus.dataset.mode=mode;
}

function renderSuggestions(description=''){
 const items=getSearchSuggestions(description, context.value);
 if(!items.length){suggestionsPanel.hidden=true;suggestionsPanel.innerHTML='';return;}
 suggestionsPanel.hidden=false;
 suggestionsPanel.innerHTML=`<span>Need a better clue?</span>${items.map(item=>`<button type="button" class="suggestion-chip" data-suggestion="${escapeHtml(item)}">${escapeHtml(item)}</button>`).join('')}`;
 suggestionsPanel.querySelectorAll('[data-suggestion]').forEach(button=>button.addEventListener('click',()=>{
  input.value=button.dataset.suggestion;
  renderSuggestions(input.value);
  void search();
 }));
}

function showSymbol(symbol,status='selected',alternatives=[],insight=null){
 const caution=status==='ambiguous'?'Several symbols fit this description. Check the alternatives and the drawing context.':status==='uncertain'?'This description is too broad for a reliable identification. Add the tag, nearby components, or whether this is power wiring or PLC ladder logic.':'';
 const matches=[{symbol,...insight},...alternatives];
 results.innerHTML=`<article class="result-card">${matches.map((match,index)=>`${index?'<section class="alternatives">':''}
   <div class="result-top"><div class="symbol-art">${symbolSvg(match.symbol.id)}</div><div class="result-main">
    <span class="pill">${escapeHtml(match.symbol.kind)} · ${index===0?(status==='selected'?'catalog choice':status+' best match'):'possible match'}</span>
    <h2>${escapeHtml(match.symbol.name)}</h2><div class="notation">${escapeHtml(match.symbol.notation)}</div>
    <p><strong>How to recognize it:</strong> ${escapeHtml(match.symbol.visual)}</p>
    <p><strong>Where it appears:</strong> ${escapeHtml(explainContexts(match.symbol))}</p>
    ${match.reason?`<p><strong>Why it may fit:</strong> ${escapeHtml(match.reason)}</p>`:''}
    ${match.explanation?`<p><strong>AI explanation:</strong> ${escapeHtml(match.explanation)}</p>`:''}
   </div></div>
  <div class="details"><div class="detail"><strong>In plain language</strong>${escapeHtml(match.symbol.does)}</div><div class="detail"><strong>What not to confuse it with</strong>${escapeHtml(match.symbol.distinction)}</div><div class="detail"><strong>Source</strong>${escapeHtml(match.symbol.source || 'Original Learn Electro educational sketch')}<br><small>${escapeHtml(match.symbol.license || 'Original teaching artwork; not an official standards symbol')}</small></div></div>
   ${index===0&&caution?`<p class="caution">${escapeHtml(caution)}</p>`:''}${index?'</section>':''}`).join('')}</article>`;
 results.scrollIntoView({behavior:'smooth',block:'start'});
}

function showLocalMatches(description,notice=''){
 const found=findSymbols(description,context.value,7);
 if(!found.matches.length){
  results.innerHTML=`<div class="empty-state">${notice?`${escapeHtml(notice)} `:''}No catalog match yet. Try describing the shape, tag, job, or behavior. The catalog below is available to browse.</div>`;
  renderSuggestions(description);
  return;
 }
 const matches=found.matches.map(match=>({
  symbol:match.symbol,
  reason:match.reasons.length?`Matched terms: ${match.reasons.join(', ')}.`:''
 }));
 showSymbol(matches[0].symbol,found.status,matches.slice(1),matches[0]);
 if(notice)results.insertAdjacentHTML('afterbegin',`<p class="caution">${escapeHtml(notice)}</p>`);
 renderSuggestions(description);
}

async function search(){
 const description=input.value.trim();
 renderSuggestions(description);
 if(!description){
  results.innerHTML='<div class="empty-state">Enter a description to identify a symbol. You can also browse the catalog below.</div>';
  setSearchStatus('local');
  return;
 }
 if(!cloudSearchEnabled){
  showLocalMatches(description);
  setSearchStatus('local');
  return;
 }
 const requestId=++searchSequence;
 searchButton.disabled=true;
 searchButton.textContent='Searching…';
 setSearchStatus('searching');
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
   setSearchStatus('fallback');
   return;
  }
  showSymbol(matches[0].symbol,data.status,matches.slice(1),matches[0]);
  setSearchStatus('ai');
 }catch{
  if(requestId===searchSequence){
   showLocalMatches(description,'Cloud search is unavailable; showing local matches.');
   setSearchStatus('fallback');
  }
 }finally{
  if(requestId===searchSequence){
   searchButton.disabled=false;
   searchButton.innerHTML='Search symbol <span aria-hidden="true">→</span>';
  }
 }
}
form.addEventListener('submit',event=>{event.preventDefault();void search()});
input.addEventListener('input',()=>renderSuggestions(input.value.trim()));
context.addEventListener('change',()=>renderSuggestions(input.value.trim()));
clearButton.addEventListener('click',()=>{input.value='';renderSuggestions('');results.innerHTML='<div class="empty-state">Enter a description to identify a symbol. You can also browse the catalog below.</div>';setSearchStatus('local');input.focus();});
document.querySelectorAll('[data-example]').forEach(button=>button.addEventListener('click',()=>{input.value=button.dataset.example;renderSuggestions(input.value);void search()}));
cards.addEventListener('click',event=>{const button=event.target.closest('[data-id]');if(!button)return;const chosen=catalog.find(s=>s.id===button.dataset.id);if(chosen){searchSequence++;searchButton.disabled=false;searchButton.innerHTML='Search symbol <span aria-hidden="true">→</span>';showSymbol(chosen);setSearchStatus('local')}});
cards.innerHTML=catalog.map(s=>`<button type="button" data-id="${s.id}" aria-label="View ${escapeHtml(s.name)}"><span aria-hidden="true">${symbolSvg(s.id)}</span><span class="name">${escapeHtml(s.name)}</span><small>${escapeHtml(s.kind)}</small></button>`).join('');
$('#catalog-count').textContent=`${catalog.length} entries`;
setSearchStatus('local');
renderSuggestions('');
