import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import http from 'node:http';import assert from 'node:assert/strict';import {spawn,spawnSync} from 'node:child_process';import {fixture} from './fixtures.mjs';
const cli=process.env.WRANGLER_SCRIPT;if(!cli)throw Error('Set WRANGLER_SCRIPT to an installed Wrangler bin/wrangler.js');
const root=path.resolve(import.meta.dirname,'..'),tmp=fs.mkdtempSync(path.join(os.tmpdir(),'handbook-workerd-')),out=path.join(tmp,'site');
const input=path.join(tmp,'trip.json');fs.writeFileSync(input,JSON.stringify(fixture()));
const build=spawnSync(process.execPath,[path.join(root,'scripts/create-handbook.mjs'),input,out,'cloudflare'],{encoding:'utf8'});assert.equal(build.status,0,build.stderr);
const config=JSON.parse(fs.readFileSync(path.join(out,'wrangler.jsonc'),'utf8'));config.d1_databases[0].database_id='00000000-0000-0000-0000-000000000001';fs.writeFileSync(path.join(out,'wrangler.jsonc'),JSON.stringify(config));
const token='temporary-runtime-test-token-12345678';fs.writeFileSync(path.join(out,'.dev.vars'),'SHARE_TOKEN='+token,{mode:0o600});
const env={...process.env,WRANGLER_SEND_METRICS:'false'};
const sql=spawnSync(process.execPath,[cli,'d1','execute',config.d1_databases[0].database_name,'--local','--file=d1.sql'],{cwd:out,env,encoding:'utf8'});assert.equal(sql.status,0,sql.stdout+sql.stderr);
const server=http.createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const port=server.address().port;await new Promise(r=>server.close(r));
const child=spawn(process.execPath,[cli,'dev','--local','--port',String(port)],{cwd:out,env,stdio:['ignore','pipe','pipe']});let logs='';child.stdout.on('data',c=>logs+=c);child.stderr.on('data',c=>logs+=c);
const base='http://127.0.0.1:'+port;
try{
 let ready=false;for(let i=0;i<60;i++){try{const r=await fetch(base);if(r.ok){ready=true;break;}}catch{}await new Promise(r=>setTimeout(r,500));}assert(ready,logs);
 assert.equal((await fetch(base+'/trip-data.js')).status,401);
 const unlock=await fetch(base+'/api/unlock',{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:JSON.stringify({token})});assert.equal(unlock.status,200,await unlock.clone().text());const cookie=unlock.headers.get('set-cookie').split(';')[0];
 const record={id:'runtime-record',owner:'member-1',group:'essentials',text:'充电宝'};
 const write=await fetch(base+'/api/state',{method:'POST',headers:{Origin:base,'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify({collection:'personal',action:'put',id:record.id,record})});assert.equal(write.status,200,await write.clone().text());
 assert.equal((await (await fetch(base+'/api/state',{headers:{Cookie:cookie}})).json()).state.personal.length,1);
 assert.equal((await fetch(base+'/presentation.js',{headers:{Cookie:cookie}})).status,200);
 console.log('PASS actual Wrangler/workerd + local D1: build, auth, gated assets and persisted writes');
}finally{child.kill('SIGTERM');}
