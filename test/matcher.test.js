import test from 'node:test';
import assert from 'node:assert/strict';
import {findSymbols,getSearchSuggestions} from '../matcher.js';
import {catalog,symbolSvg} from '../catalog.js';

const top=(q,context='any')=>findSymbols(q,context).matches[0]?.symbol.id;
test('specific field descriptions resolve to the appropriate physical symbol',()=>{
 assert.equal(top('circle with M and three phases'),'motor-3ph');
 assert.equal(top('normally closed overload contact labeled 95 96'),'overload-contact');
 assert.equal(top('red mushroom emergency stop button'),'estop');
 assert.equal(top('transformer with two windings and magnetic core'),'transformer');
 assert.equal(top('circle with x on a control wire'),'pilot-lamp');
});
test('function descriptions resolve even when they omit the symbol name',()=>{
 assert.equal(top('stores energy and opposes a sudden voltage change'),'capacitor');
 assert.equal(top('converts three phase electrical power into shaft torque'),'motor-3ph');
 assert.equal(top('protects a motor from overheating'),'overload-sensing');
});
test('PLC software instructions stay distinct from physical contacts',()=>{
 assert.equal(top('PLC ladder XIO slash contact','ladder'),'xio');
 assert.equal(top('PLC ladder XIC bit true contact','ladder'),'x ic');
 assert.equal(top('output energize OTE instruction','ladder'),'ote');
 assert.equal(top('normally closed stop pushbutton','control'),'nc-pushbutton');
});
test('broad descriptions do not claim certainty',()=>{
 const r=findSymbols('two parallel lines');
 assert.ok(['ambiguous','uncertain'].includes(r.status));
 assert.ok(r.matches.length>1);
 assert.equal(findSymbols('').status,'empty');
});

test('search suggestions surface common symbol descriptions that help refine weak queries',()=>{
 const suggestions=getSearchSuggestions('motor overheating protection');
 assert.ok(suggestions.some(item=>item.toLowerCase().includes('motor')));
 assert.ok(suggestions.some(item=>item.toLowerCase().includes('overload')));
 assert.ok(suggestions.length>=2);
});

test('every catalog entry renders a labeled SVG',()=>{
 assert.equal(new Set(catalog.map(s=>s.id)).size,catalog.length);
 for(const s of catalog){assert.match(symbolSvg(s.id),/^<svg /);assert.match(symbolSvg(s.id),/aria-label=/)}
});
