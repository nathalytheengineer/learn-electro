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

test('common industrial controls resolve to the expanded catalog',()=>{
 assert.equal(top('on delay timer relay'),'timer-relay');
 assert.equal(top('hand off auto selector switch'),'selector-switch');
 assert.equal(top('pressure switch trips on low pressure'),'pressure-switch');
 assert.equal(top('water flow switch for a pump'),'flow-switch');
 assert.equal(top('current transformer on a feeder'),'current-transformer');
 assert.equal(top('solenoid valve for compressed air'),'solenoid-valve');
 assert.equal(top('contactor with auxiliary contact'),'contactor-with-aux');
 assert.equal(top('thermal overload relay protects a motor'),'thermal-overload-relay');
 assert.equal(top('HOA selector for a motor starter'),'hoa-switch');
 assert.equal(top('digital input and output module'),'digital-output');
});

test('motor-control, HVAC, and process instrumentation references resolve',()=>{
 assert.equal(top('direct on line motor starter with contactor and overload'),'dol-starter');
 assert.equal(top('forward reverse contactors motor direction starter'),'reversing-starter');
 assert.equal(top('star delta reduced voltage motor starter'),'star-delta-starter');
 assert.equal(top('refrigeration compressor suction discharge'),'hvac-compressor');
 assert.equal(top('evaporator coil absorbs heat from refrigerant'),'evaporator-coil');
 assert.equal(top('motorized HVAC air damper actuator'),'hvac-damper');
 assert.equal(top('pressure indicator PI instrument bubble'),'pressure-indicator');
 assert.equal(top('level transmitter LT tank level measurement'),'level-transmitter');
 assert.equal(top('differential pressure transmitter high low taps'),'differential-pressure-transmitter');
 assert.equal(top('pneumatic control valve final element'),'control-valve');
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
