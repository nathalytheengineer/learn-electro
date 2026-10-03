import {catalog} from './catalog.js';

const stop=new Set(['a','an','the','with','and','or','of','in','on','to','from','is','it','looks','like','symbol','drawing','shows','two','three','there','for','that','this','one','at','has','have','near','line','lines','wire','wires','circuit','component','labeled']);
const normalize=s=>s.toLowerCase().replace(/\b(normally open|n\.o\.)\b/g,' no ').replace(/\b(normally closed|n\.c\.)\b/g,' nc ').replace(/\bthree.phase\b/g,' threephase ').replace(/\b24\s*v(?:olt)?\s*d\s*c\b/g,' 24vdc ').replace(/[^a-z0-9~]+/g,' ').replace(/\s+/g,' ').trim();
const tokens=s=>new Set(normalize(s).split(' ').filter(t=>t&&!stop.has(t)));
const phrase=(s,q)=>` ${s} `.includes(` ${q} `);

export function getSearchSuggestions(description='', context='any'){
 const query=normalize(description || '');
 if(!query)return [];
 const q=tokens(description || '');
 const suggestions=[];
 const add=(...items)=>{for(const item of items){const cleaned=item.trim();if(cleaned&&!suggestions.includes(cleaned))suggestions.push(cleaned);}};

 if(/\b(ladder|plc|xic|xio|ote|instruction|bit)\b/.test(query)){
  add('PLC ladder XIO slash contact','PLC ladder XIC contact','output energize OTE instruction');
 }
 if(/\b(overload|trip|heat|thermal|motor|current|fuse)\b/.test(query)){
  add('motor overload protection relay','normally closed overload contact labeled 95 96','thermal overload sensing element');
 }
 if(/\b(start|stop|pushbutton|button|emergency|mushroom)\b/.test(query)){
  add('normally closed stop pushbutton','normally open start pushbutton','emergency stop mushroom button');
 }
 if(/\b(lamp|pilot|indicator|light|bulb)\b/.test(query)){
  add('pilot lamp with circle and X','indicator light symbol','lamp with illuminated marker');
 }
 if(/\b(transformer|winding|core|magnetic)\b/.test(query)){
  add('transformer with two windings and magnetic core');
 }
 if(/\b(capacitor|store|energy|voltage|charge)\b/.test(query)){
  add('capacitor');
 }
 if(/\b(phase|motor|threephase|three phase|3 phase)\b/.test(query)){
  add('circle with M and three phases');
 }
 if(context==='ladder'&&!suggestions.length){add('PLC ladder XIO slash contact','PLC ladder XIC contact');}
 if(context==='power'&&!suggestions.length){add('overload contact labeled 95 96','three-phase motor');}
 if(!suggestions.length){
  add('circle with M and three phases','normally closed overload contact labeled 95 96','PLC ladder XIO slash contact');
 }
 return suggestions.slice(0,3).map(suggestion=>suggestion.replace(/\s+/g,' ').trim());
}

export function findSymbols(description, context='any', limit=5){
 const query=normalize(description);if(!query)return {matches:[],status:'empty'};
 const q=tokens(description);
 if(/\b(overheat(?:ing)?|too hot|excessive heat|gets? hot)\b/.test(query))['overload','thermal','heating','current'].forEach(word=>q.add(word));
 if(/\b(protect(?:s|ion|ing)?|trip(?:s|ped|ping)?)\b/.test(query))['protection','overload','trip'].forEach(word=>q.add(word));
 const has=x=>q.has(x);
 const genericAmbiguity=(has('parallel')||has('bars')||has('plates'))&&!['control','ladder'].includes(context);
 const scored=catalog.map(symbol=>{
  let score=0, reasons=[];
    const hay=tokens([symbol.name,symbol.notation,symbol.visual,symbol.does,symbol.distinction,...symbol.aliases].join(' '));
  for(const word of q){if(hay.has(word)){score+=word.length>5?2.4:1.7;reasons.push(word)}}
  for(const alias of symbol.aliases){const a=normalize(alias);if(a.length>3&&phrase(query,a)){score+=6+Math.min(5,a.split(' ').length*1.5);reasons.push(alias)}}
  if(context!=='any')score+=symbol.contexts.includes(context)?3.2:-2.2;
  // Contacts with a slash are not open contacts; XIC/XIO are software instructions.
  if(has('nc')||has('slash')||has('slashed')){if(['no-contact','no-pushbutton','x ic'].includes(symbol.id))score-=9}
  if(has('no')&&!has('nc')){if(['nc-contact','nc-pushbutton','overload-contact','xio'].includes(symbol.id))score-=7}
  if(has('xio')&&symbol.id==='xio'||has('xic')&&symbol.id==='x ic'||has('ote')&&symbol.id==='ote')score+=18;
  if((has('95')&&has('96'))&&symbol.id==='overload-contact')score+=13;
  if((has('circle')&&has('m'))&&symbol.id==='motor-3ph')score+=12;
  if((has('circle')&&has('x'))&&symbol.id==='pilot-lamp')score+=12;
  if(has('capacitor')&&symbol.id==='capacitor')score+=14;
  if(has('coil')&&symbol.id==='relay-coil')score+=6;
  if((has('overheat')||has('overheating'))&&has('motor')&&symbol.id==='overload-sensing')score+=12;
  if((has('delay')||has('timer'))&&symbol.id==='timer-relay')score+=18;
  if((has('selector')||has('hoa')||((has('hand')&&has('off')&&has('auto'))))&&symbol.id==='selector-switch')score+=16;
  if((has('pressure')||has('ps'))&&symbol.id==='pressure-switch'&&!['transmitter','indicator','differential'].some(word=>has(word)))score+=18;
  if(has('differential')&&has('pressure')&&symbol.id==='differential-pressure-transmitter')score+=20;
  if((has('flow')||has('pump'))&&symbol.id==='flow-switch')score+=18;
  if((has('current')&&has('transformer')||has('ct'))&&symbol.id==='current-transformer')score+=20;
  if((has('solenoid')||has('valve'))&&symbol.id==='solenoid-valve')score+=18;
  if((has('aux')||has('auxiliary')||(has('contactor')&&has('aux')))&&symbol.id==='contactor-with-aux')score+=18;
  if(((has('thermal')&&has('relay'))||(has('overload')&&has('relay')))&&symbol.id==='thermal-overload-relay')score+=20;
  if((has('hoa')||has('hand')&&has('off')&&has('auto')||has('selector')&&has('motor'))&&symbol.id==='hoa-switch')score+=20;
  if((has('digital')&&has('input')||has('di'))&&symbol.id==='digital-input')score+=16;
  if((has('digital')&&has('output')||has('do')||has('module')&&has('digital'))&&symbol.id==='digital-output')score+=18;
  if(has('overload')&&has('contact')&&symbol.id==='overload-contact')score+=7;
  if(has('overload')&&has('heater')&&symbol.id==='overload-sensing')score+=8;
  if(has('stop')&&symbol.id==='nc-pushbutton')score+=6;
  if(has('start')&&symbol.id==='no-pushbutton')score+=6;
  if(has('emergency')&&symbol.id==='estop')score+=9;
  if(genericAmbiguity&&['no-contact','capacitor'].includes(symbol.id))score+=3;
  return {symbol,score:Math.max(0,score),reasons:[...new Set(reasons)]};
 }).sort((a,b)=>b.score-a.score||a.symbol.name.localeCompare(b.symbol.name));
 const matches=scored.filter(x=>x.score>=2.5).slice(0,limit);
 const top=matches[0]?.score||0, second=matches[1]?.score||0;
 // It is unsafe to call a vague description an exact match.
 const status=top<5?'uncertain':((genericAmbiguity&&q.size<=3)||top-second<5?'ambiguous':'likely');
 return {matches,status};
}
