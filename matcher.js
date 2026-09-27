import {catalog} from './catalog.js';

const stop=new Set(['a','an','the','with','and','or','of','in','on','to','from','is','it','looks','like','symbol','drawing','shows','two','three','there','for','that','this','one','at','has','have','near','line','lines','wire','wires','circuit','component','labeled']);
const normalize=s=>s.toLowerCase().replace(/\b(normally open|n\.o\.)\b/g,' no ').replace(/\b(normally closed|n\.c\.)\b/g,' nc ').replace(/\bthree.phase\b/g,' threephase ').replace(/\b24\s*v(?:olt)?\s*d\s*c\b/g,' 24vdc ').replace(/[^a-z0-9~]+/g,' ').replace(/\s+/g,' ').trim();
const tokens=s=>new Set(normalize(s).split(' ').filter(t=>t&&!stop.has(t)));
const phrase=(s,q)=>` ${s} `.includes(` ${q} `);

export function findSymbols(description, context='any', limit=5){
 const query=normalize(description);if(!query)return {matches:[],status:'empty'};
 const q=tokens(description);
 const has=x=>q.has(x);
 const genericAmbiguity=(has('parallel')||has('bars')||has('plates'))&&!['control','ladder'].includes(context);
 const scored=catalog.map(symbol=>{
  let score=0, reasons=[];
  const hay=tokens([symbol.name,symbol.notation,symbol.visual,...symbol.aliases].join(' '));
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
