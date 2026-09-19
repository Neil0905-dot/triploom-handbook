#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {createHash,randomBytes} from 'node:crypto';
const project=path.resolve(process.argv[2]||'.');
const data=JSON.parse(fs.readFileSync(path.join(project,'server/trip.json'),'utf8'));
await import(new URL('file://'+path.join(project,'public/model.js')));
const local=path.join(project,'.local');fs.mkdirSync(local,{recursive:true,mode:0o700});
const secretFile=path.join(local,'secrets.json');
const secrets=fs.existsSync(secretFile)?JSON.parse(fs.readFileSync(secretFile,'utf8')):{SHARE_TOKEN:randomBytes(24).toString('base64url'),DB_SECRET:randomBytes(32).toString('base64url')};
fs.writeFileSync(secretFile,JSON.stringify(secrets,null,2),{mode:0o600});
const quote=s=>"'"+String(s).replaceAll("'","''")+"'";
const sql=`INSERT INTO public.handbook_state(id,payload,revision,secret_hash) VALUES (${quote(data.trip.id)},${quote(JSON.stringify(globalThis.HandbookModel.emptyState(data)))}::jsonb,0,${quote(createHash('sha256').update(secrets.DB_SECRET).digest('hex'))}) ON CONFLICT(id) DO NOTHING;\n`;
fs.writeFileSync(path.join(local,'seed.sql'),sql,{mode:0o600});console.log('Created .local/seed.sql and .local/secrets.json. Existing rows and secrets are preserved.');
