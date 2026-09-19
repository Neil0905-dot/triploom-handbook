import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import {fixture} from './fixtures.mjs';
import '../assets/starter/model.js';
test('a delayed poll cannot overwrite a newer cloud snapshot',async()=>{
 const initial=globalThis.HandbookModel.emptyState(fixture()),newer={...initial,personal:[{id:'new',owner:'member-1',group:'essentials',text:'新记录'}]};
 let payload={state:initial,revision:1},slow=false,release;
 const window={TRIP_DATA:fixture(),HandbookModel:globalThis.HandbookModel,HANDBOOK_CONFIG:{storage:'cloud'},dispatchEvent(){},addEventListener(){}};
 const context=vm.createContext({window,location:{protocol:'https:'},localStorage:{getItem(){return null;},setItem(){}},document:{hidden:false,addEventListener(){}},setInterval(){},Event,fetch:()=>slow?new Promise(r=>{release=r;}):Promise.resolve(Response.json(payload))});
 vm.runInContext(fs.readFileSync(new URL('../assets/starter/store.js',import.meta.url),'utf8'),context);
 await new Promise(r=>setImmediate(r));slow=true;const oldRead=window.HandbookStore.refresh();slow=false;payload={state:newer,revision:2};await window.HandbookStore.refresh();release(Response.json({state:initial,revision:1}));await oldRead;
 assert.equal(window.HandbookStore.get().personal[0].id,'new');
});
