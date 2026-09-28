import {catalog} from '../../catalog.js';

const contexts=new Set(['any','control','power','ladder','instrument']);
const symbolIds=catalog.map(symbol=>symbol.id);
const responseFormat={
 type:'json_schema',
 json_schema:{
  name:'schematic_symbol_search',
  strict:true,
  schema:{
   type:'object',
   properties:{
    status:{type:'string',enum:['likely','ambiguous','uncertain']},
    matches:{
     type:'array',
     items:{
      type:'object',
      properties:{
       symbolId:{type:'string',enum:symbolIds},
       reason:{type:'string'},
       explanation:{type:'string'}
      },
      required:['symbolId','reason','explanation'],
      additionalProperties:false
     }
    }
   },
   required:['status','matches'],
   additionalProperties:false
  }
 }
};

const reply=(statusCode,body)=>({
 statusCode,
 headers:{'Content-Type':'application/json','Cache-Control':'no-store'},
 body:JSON.stringify(body)
});

export async function handler(event){
 if(event.httpMethod!=='POST')return reply(405,{error:'Method not allowed.'});

 let request;
 try{request=JSON.parse(event.body||'{}')}catch{return reply(400,{error:'Invalid request.'})}
 const description=typeof request.description==='string'?request.description.trim():'';
 if(!description||description.length>500)return reply(400,{error:'Describe the symbol in 1 to 500 characters.'});

 const apiKey=process.env.OPENAI_API_KEY;
 if(!apiKey)return reply(503,{error:'Cloud search is not configured.'});

 const context=contexts.has(request.context)?request.context:'any';
 const symbols=catalog.map(({id,name,kind,contexts,aliases,visual,does,distinction,notation})=>({
  id,name,kind,contexts,aliases,visual,does,distinction,notation
 }));

 try{
  const response=await fetch('https://api.openai.com/v1/chat/completions',{
   method:'POST',
   headers:{Authorization:`Bearer ${apiKey}`,'Content-Type':'application/json'},
   signal:AbortSignal.timeout(20000),
   body:JSON.stringify({
    model:process.env.OPENAI_MODEL||'gpt-4o-mini',
    temperature:0.2,
    max_tokens:1800,
    response_format:responseFormat,
    messages:[
     {role:'system',content:'You identify electrical and PLC schematic symbols for learning. Rank only symbols in the supplied catalog. Return at most 7 candidates, best first. Use the drawing context when provided. Mark weak or overlapping evidence as uncertain or ambiguous; never claim certainty from a vague description. For each candidate, give a short reason it matches and a useful explanation grounded only in that catalog entry. Do not invent ratings, wiring, safety performance, or details absent from the catalog.'},
     {role:'user',content:JSON.stringify({description,context,catalog:symbols})}
    ]
   })
  });

  if(!response.ok){console.error('OpenAI search failed with status',response.status);return reply(502,{error:'Cloud search is temporarily unavailable.'})}
  const completion=await response.json();
  const generated=JSON.parse(completion.choices?.[0]?.message?.content||'{}');
  const catalogById=new Map(catalog.map(symbol=>[symbol.id,symbol]));
  const seen=new Set();
  const matches=(Array.isArray(generated.matches)?generated.matches:[]).filter(match=>{
   if(!catalogById.has(match.symbolId)||seen.has(match.symbolId))return false;
   if(typeof match.reason!=='string'||typeof match.explanation!=='string')return false;
   if(!match.reason.trim()||!match.explanation.trim())return false;
   seen.add(match.symbolId);
   return true;
  }).slice(0,7).map(match=>({
   symbolId:match.symbolId,
   reason:match.reason.slice(0,400),
   explanation:match.explanation.slice(0,900)
  }));
  const status=['likely','ambiguous','uncertain'].includes(generated.status)?generated.status:'uncertain';
  return reply(200,{status,matches});
 }catch(error){
  if(error?.name!=='AbortError'&&error?.name!=='TimeoutError')console.error('OpenAI search request failed.');
  return reply(502,{error:'Cloud search is temporarily unavailable.'});
 }
}