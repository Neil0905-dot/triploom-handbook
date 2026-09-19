import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {createRequire} from 'node:module';import {createHash} from 'node:crypto';
import '../assets/starter/model.js';import {fixture} from './fixtures.mjs';
const require=createRequire(import.meta.url),pkg=process.env.PGLITE_MODULE||'@electric-sql/pglite';
const {PGlite}=require(pkg),{pgcrypto}=require(path.isAbsolute(pkg)?path.join(pkg,'dist/contrib/pgcrypto.cjs'):'@electric-sql/pglite/contrib/pgcrypto');
const db=new PGlite({extensions:{pgcrypto}});
try{
 await db.exec('CREATE ROLE anon; CREATE ROLE authenticated;');
 await db.exec(fs.readFileSync(new URL('../assets/server/postgres.sql',import.meta.url),'utf8'));
 const state=globalThis.HandbookModel.emptyState(fixture());
 await db.query('INSERT INTO public.handbook_state(id,payload,revision,secret_hash) VALUES ($1,$2,0,$3)',['test-group',JSON.stringify(state),createHash('sha256').update('secret').digest('hex')]);
 await db.exec('SET ROLE anon');
 await assert.rejects(db.query('SELECT * FROM public.handbook_state'));
 await assert.rejects(db.query('SELECT public.handbook_read($1,$2)',['wrong','test-group']));
 const r=await db.query('SELECT public.handbook_read($1,$2) AS result',['secret','test-group']);assert.equal(r.rows[0].result.state.tasks.length,1);
 const s={...state,tasks:[...state.tasks,{id:'new-task',text:'买转换插头',checked:false}]};
 assert.equal((await db.query('SELECT public.handbook_write($1,$2,$3,$4) AS ok',['secret','test-group',0,JSON.stringify(s)])).rows[0].ok,true);
 assert.equal((await db.query('SELECT public.handbook_write($1,$2,$3,$4) AS ok',['secret','test-group',0,JSON.stringify(state)])).rows[0].ok,false);
 assert.equal((await db.query('SELECT public.handbook_read($1,$2) AS result',['secret','test-group'])).rows[0].result.state.tasks.length,2);
 console.log('PASS actual PostgreSQL schema, permissions, secret-gated RPC and revision conflict in PGlite');
}finally{await db.close();}
