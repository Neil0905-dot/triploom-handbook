import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';import {fixture} from './fixtures.mjs';
const root=path.resolve(import.meta.dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'handbook-integration-'));
function build(provider){const data=fixture(),file=path.join(tmp,provider+'.json'),out=path.join(tmp,provider);fs.writeFileSync(file,JSON.stringify(data));const r=spawnSync(process.execPath,[path.join(root,'scripts/create-handbook.mjs'),file,out,provider],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);return {out,file};}
const secret='test-only-access-token-123456789';
const request=(route,method='GET',body,cookie)=>new Request('https://example.test'+route,{method,headers:{Origin:'https://example.test','Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
test('Cloudflare adapter uses real SQLite, authenticates assets and persists concurrent records',async()=>{
 const {out}=build('cloudflare'),worker=(await import(pathToFileURL(path.join(out,'server/cloudflare.mjs')))).default;
 const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync(path.join(out,'d1.sql'),'utf8'));
 const env={SHARE_TOKEN:secret,ASSETS:{fetch:async()=>new Response('private asset')},DB:{
   prepare(sql){const stmt=db.prepare(sql);return {bind(...args){return {
     run:async()=>({meta:{changes:stmt.run(...args).changes}}),first:async()=>stmt.get(...args)
   };}};}
 }};
 assert.equal((await worker.fetch(request('/trip-data.js'),env)).status,401);
 assert.equal((await worker.fetch(request('/api/state'),env)).status,401);
 const login=await worker.fetch(request('/api/unlock','POST',{token:secret}),env),cookie=login.headers.get('set-cookie').split(';')[0];assert.equal(login.status,200);
 assert.equal((await worker.fetch(request('/trip-data.js','GET',null,cookie),env)).status,200);
 const op=id=>({collection:'personal',action:'put',id,record:{id,owner:'member-1',group:'essentials',text:id}});
 const results=await Promise.all(['a','b'].map(id=>worker.fetch(request('/api/state','POST',op(id),cookie),env)));assert(results.every(r=>r.status===200));
 const state=await (await worker.fetch(request('/api/state','GET',null,cookie),env)).json();assert.equal(state.state.personal.length,2);
 assert.equal((await worker.fetch(request('/api/state','POST',op('a'),cookie),env)).status,409);
 const cross=new Request('https://example.test/api/state',{method:'POST',headers:{Origin:'https://other.test',Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify(op('c'))});assert.equal((await worker.fetch(cross,env)).status,403);
 db.close();
});
test('CloudBase function route, auth, MIME and RPC contract',async()=>{
 const {out}=build('cloudbase');const {main}=await import(pathToFileURL(path.join(out,'server/cloudbase.cjs')));
 process.env.SHARE_TOKEN=secret;process.env.BASE_PATH='/handbook/';process.env.PG_REST_URL='https://database.test';process.env.PG_PUBLISH_KEY='test';process.env.DB_SECRET='test';
 let state=globalThis.HandbookModel.emptyState(fixture()),revision=0;const original=globalThis.fetch;
 globalThis.fetch=async(url,options)=>{const args=JSON.parse(options.body);assert.equal(args.p_trip,'test-group');assert.equal(args.p_secret,'test');if(url.endsWith('handbook_read'))return Response.json({state,revision});if(args.p_revision!==revision)return Response.json(false);state=args.p_state;revision++;return Response.json(true);};
 const event=(route,method='GET',body,cookie)=>({path:route,httpMethod:method,headers:{host:'example.test',origin:'https://example.test','content-type':'application/json',...(cookie?{cookie}:{})},body:body?JSON.stringify(body):''});
 try{assert.equal((await main(event('/handbook'))).statusCode,302);assert.equal((await main(event('/handbook/trip-data.js'))).statusCode,401);const login=await main(event('/handbook/api/unlock','POST',{token:secret}));assert.equal(login.statusCode,200);const cookie=login.headers['set-cookie'].split(';')[0];const asset=await main(event('/handbook/style.css','GET',null,cookie));assert.equal(asset.statusCode,200);assert(asset.headers['content-type'].includes('text/css'));const r=await main(event('/handbook/api/state','GET',null,cookie));assert.equal(r.statusCode,200);assert.equal(JSON.parse(Buffer.from(r.body,'base64')).state.tasks.length,1);}finally{globalThis.fetch=original;}
});
test('regeneration keeps provider config and rejects local edits without overwriting',()=>{const {out,file}=build('local');const engine=path.join(out,'public/presentation.js');fs.appendFileSync(engine,'\n// local customization');const r=spawnSync(process.execPath,[path.join(root,'scripts/create-handbook.mjs'),file,out,'local'],{encoding:'utf8'});assert.notEqual(r.status,0);assert(fs.readFileSync(engine,'utf8').includes('local customization'));});
test('booking assets survive a self-contained project update and retire recoverably',()=>{const dir=fs.mkdtempSync(path.join(tmp,'booking-')),file=path.join(dir,'input.json'),out=path.join(dir,'project');fs.writeFileSync(path.join(dir,'预订单 #1.pdf'),'%PDF-1.4\n%%EOF');const data=fixture('pair');data.stays[0].document='预订单 #1.pdf';fs.writeFileSync(file,JSON.stringify(data));const generate=input=>spawnSync(process.execPath,[path.join(root,'scripts/create-handbook.mjs'),input,out,'local'],{encoding:'utf8'});let r=generate(file);assert.equal(r.status,0,r.stderr);const source=path.join(out,'trip-data.json');const edit=JSON.parse(fs.readFileSync(source,'utf8')),attachment=edit.stays[0].document;assert(fs.existsSync(path.join(out,attachment)));edit.trip.title='更新后的旅行';fs.writeFileSync(source,JSON.stringify(edit));r=generate(source);assert.equal(r.status,0,r.stderr);const again=JSON.parse(fs.readFileSync(source,'utf8'));delete again.stays[0].document;fs.writeFileSync(source,JSON.stringify(again));r=generate(source);assert.equal(r.status,0,r.stderr);assert(!fs.existsSync(path.join(out,attachment)));assert(fs.existsSync(path.join(out,'.local/previous-template',attachment)));});
