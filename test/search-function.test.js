import test from 'node:test';
import assert from 'node:assert/strict';
import {handler} from '../netlify/functions/search.mjs';

const event=(method,body)=>({httpMethod:method,body:JSON.stringify(body)});

test('rejects unsupported methods and invalid descriptions',async()=>{
 assert.equal((await handler(event('GET',{}))).statusCode,405);
 assert.equal((await handler(event('POST',{description:' '}))).statusCode,400);
 assert.equal((await handler(event('POST',{description:'x'.repeat(501)}))).statusCode,400);
});

test('requires the API key without making an upstream request',async()=>{
 const previous=process.env.OPENAI_API_KEY;
 delete process.env.OPENAI_API_KEY;
 try{
  const response=await handler(event('POST',{description:'overload contact'}));
  assert.equal(response.statusCode,503);
 }finally{
  if(previous===undefined)delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY=previous;
 }
});

test('returns only unique catalog matches from structured model output',async()=>{
 const previousKey=process.env.OPENAI_API_KEY;
 const previousFetch=globalThis.fetch;
 let upstreamRequest;
 process.env.OPENAI_API_KEY='test-key';
 globalThis.fetch=async(url,options)=>{
  upstreamRequest={url,options};
  return {
   ok:true,
   json:async()=>({choices:[{message:{content:JSON.stringify({
    status:'likely',
    matches:[
     {symbolId:'overload-sensing',reason:'It monitors motor current.',explanation:'This element senses motor current for overload protection.'},
     {symbolId:'not-in-catalog',reason:'Invented symbol.',explanation:'Not a valid catalog entry.'},
     {symbolId:'overload-sensing',reason:'Duplicate.',explanation:'Duplicate.'}
    ]
   })}}]})
  };
 };

 try{
  const response=await handler(event('POST',{description:'protects a motor from overheating',context:'power'}));
  const body=JSON.parse(response.body);
  assert.equal(response.statusCode,200);
  assert.equal(body.status,'likely');
  assert.deepEqual(body.matches.map(match=>match.symbolId),['overload-sensing']);
  assert.equal(upstreamRequest.url,'https://api.openai.com/v1/chat/completions');
  assert.equal(upstreamRequest.options.headers.Authorization,'Bearer test-key');
  assert.match(upstreamRequest.options.body,/protects a motor from overheating/);
 }finally{
  globalThis.fetch=previousFetch;
  if(previousKey===undefined)delete process.env.OPENAI_API_KEY;
  else process.env.OPENAI_API_KEY=previousKey;
 }
});