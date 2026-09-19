#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import '../assets/starter/model.js';
const [inputArg,outputArg,requestedProvider]=process.argv.slice(2);
if(!inputArg||!outputArg)throw Error('Usage: node create-handbook.mjs trip-data.json OUTPUT [local|cloudbase|cloudflare]');
const input=path.resolve(inputArg),output=path.resolve(outputArg),root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const original=JSON.parse(fs.readFileSync(input,'utf8')),data=structuredClone(original);
const manifestPath=path.join(output,'handbook-project.json');
const previous=fs.existsSync(manifestPath)?JSON.parse(fs.readFileSync(manifestPath,'utf8')):null;
if(fs.existsSync(output)&&!previous&&fs.readdirSync(output).length)throw Error('Output must be an empty folder or a generated handbook project');
const provider=requestedProvider||previous?.provider||'local';
if(!['local','cloudbase','cloudflare'].includes(provider))throw Error('Unsupported provider');
if(previous&&(previous.tripId!==data.trip?.id||previous.provider!==provider))throw Error('Trip identity/provider changed; generate into a new folder and migrate explicitly');
data.schemaVersion??=1;data.days??=[];data.flights??=[];data.stays??=[];data.tasks??=[];
data.packingGroups??=JSON.parse(fs.readFileSync(path.join(root,'assets/default-preparation.json'),'utf8'));
data.budget??={};data.budget.items??=[];
for(const e of data.budget.items)if(e.category==='交通')e.category='地面交通';
for(const d of data.days){if(Array.isArray(d.coordinates))d.coordinates={latitude:d.coordinates[0],longitude:d.coordinates[1]};}
const countries=JSON.parse(fs.readFileSync(path.join(root,'assets/country-currencies.json'),'utf8'));
const destination=(data.trip.countries||[]).map(code=>countries[code]).filter(Boolean);
const supplied=data.budget.currencies||[],rates=Object.fromEntries(supplied.map(c=>[c.code,c]));
for(const code of new Set([...data.budget.items.map(e=>e.currency),...data.stays.map(s=>s.price?.currency)].filter(Boolean)))if(!supplied.some(c=>c.code===code))supplied.push({code,name:code,symbol:code});
data.budget.currencies=[...new Map([...destination,countries.CN,countries.US,countries.FR,...supplied].map(c=>[c.code,{...c,...rates[c.code],rateToCny:c.code==='CNY'?1:rates[c.code]?.rateToCny??null}])).values()];
data.budget.defaultCurrency??=destination[0]?.code||'CNY';
for(const e of data.budget.items){const currency=data.budget.currencies.find(c=>c.code===e.currency);if(e.rate==null&&Number.isFinite(currency?.rateToCny)){e.rate=currency.rateToCny;e.rateSource??=currency.rateSource;e.rateDate??=currency.rateDate;}}
if(!data.budget.currencies.some(c=>c.code===data.budget.defaultCurrency))throw Error('Unknown default currency');
const result=globalThis.HandbookModel.validate(data);if(result.errors.length)throw Error(result.errors.join('\n'));
for(const warning of result.warnings)console.warn(warning);
const publicDir=path.join(output,'public');fs.mkdirSync(publicDir,{recursive:true});
const owned={},pending=new Map();
function write(relative,content){const file=path.join(output,relative);const hash=createHash('sha256').update(content).digest('hex');if(previous?.files?.[relative]&&fs.existsSync(file)){const current=createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(current!==previous.files[relative]&&current!==hash)throw Error('Locally customized file; merge before updating: '+relative);}pending.set(relative,content);owned[relative]=hash;}
function copyAsset(reference,label){
  if(/^https:\/\//.test(reference))return reference;
  if(/^[a-z]+:/i.test(reference))throw Error('Asset must be a local file or HTTPS URL: '+label);
  const source=path.resolve(path.dirname(input),reference);if(!fs.existsSync(source)||!fs.statSync(source).isFile())throw Error('Missing asset: '+reference);
  const extension=path.extname(source).toLowerCase();if(!['.pdf','.png','.jpg','.jpeg','.webp','.svg'].includes(extension))throw Error('Unsupported asset: '+reference);
  if(extension==='.svg'&&/<script|on\w+\s*=|<foreignObject/i.test(fs.readFileSync(source,'utf8')))throw Error('SVG must not contain executable content');
  const content=fs.readFileSync(source),name='attachments/'+createHash('sha256').update(content).digest('hex').slice(0,20)+extension;write('public/'+name,content);return name;
}
const defaultPortraits=['portrait-1.webp','portrait-2.webp','portrait-3.webp','portrait-4.webp'];
for(const p of data.people){if(p.avatar)p.avatar=copyAsset(p.avatar,'avatar');else p.avatar='avatars/'+defaultPortraits[data.people.indexOf(p)%defaultPortraits.length];}
for(const s of data.stays)if(s.document)s.document=copyAsset(s.document,'booking');
for(const d of data.days){for(const doc of d.documents||[])doc.file=copyAsset(doc.file,'day document');if(d.mapImage)d.mapImage=copyAsset(d.mapImage,'route map');if(d.illustration)d.illustration=copyAsset(d.illustration,'day illustration');}
if(data.trip.illustration)data.trip.illustration=copyAsset(data.trip.illustration,'illustration');
for(const f of ['model.js','store.js'])write('public/'+f,fs.readFileSync(path.join(root,'assets/starter',f)));
for(const f of fs.readdirSync(path.join(root,'assets/full')))write('public/'+f,fs.readFileSync(path.join(root,'assets/full',f)));
for(const name of defaultPortraits)write('public/avatars/'+name,fs.readFileSync(path.join(root,'assets/default-avatars',name)));
write('public/illustrations/default-journey.svg',fs.readFileSync(path.join(root,'assets/starter/illustrations/default-journey.svg')));
write('public/trip-data.js','window.TRIP_DATA='+JSON.stringify(data).replace(/</g,'\\u003c')+';\n');
write('public/config.js','window.HANDBOOK_CONFIG='+JSON.stringify({storage:provider==='local'?'local':'cloud'})+';\n');
write('public/offline-files.js','self.HANDBOOK_OFFLINE_FILES='+JSON.stringify(Object.keys(owned).filter(p=>p.startsWith('public/')&&!p.endsWith('/sw.js')).map(p=>p.slice(7)))+';\n');
const editable=structuredClone(data);
const sourcePath=reference=>reference&&!/^https:\/\//.test(reference)?'public/'+reference:reference;
for(const p of editable.people)p.avatar=sourcePath(p.avatar);
for(const s of editable.stays)if(s.document)s.document=sourcePath(s.document);
for(const d of editable.days){for(const doc of d.documents||[])doc.file=sourcePath(doc.file);if(d.mapImage)d.mapImage=sourcePath(d.mapImage);if(d.illustration)d.illustration=sourcePath(d.illustration);}
if(editable.trip.illustration)editable.trip.illustration=sourcePath(editable.trip.illustration);
pending.set('trip-data.json',JSON.stringify(editable,null,2)+'\n');
write('.gitignore','node_modules/\n.wrangler/\n.env*\n!.env.example\n.local/\n.dev.vars\n');
if(provider!=='local'){
  for(const f of ['core.mjs',provider==='cloudbase'?'cloudbase.cjs':'cloudflare.mjs'])write('server/'+f,fs.readFileSync(path.join(root,'assets/server',f)));
  write('server/trip.json',JSON.stringify(data));
  if(provider==='cloudflare'){
    write('d1.sql',fs.readFileSync(path.join(root,'assets/server/d1.sql')));
    if(!fs.existsSync(path.join(output,'wrangler.jsonc')))fs.writeFileSync(path.join(output,'wrangler.jsonc'),JSON.stringify({name:data.trip.id.toLowerCase().replace(/[^a-z0-9-]/g,'-'),main:'server/cloudflare.mjs',compatibility_date:'2026-09-01',assets:{directory:'./public',binding:'ASSETS',run_worker_first:true},d1_databases:[{binding:'DB',database_name:data.trip.id,database_id:'REPLACE_WITH_OWN_D1_ID'}]},null,2));
    write('.env.example','SHARE_TOKEN=replace-with-a-random-secret-at-least-24-characters\n');
  }else{
    write('index.js',"exports.main=require('./server/cloudbase.cjs').main;\n");
    write('package.json',JSON.stringify({name:'travel-handbook',version:'1.0.0',private:true,main:'index.js',engines:{node:'>=20'}},null,2));
    write('postgres.sql',fs.readFileSync(path.join(root,'assets/server/postgres.sql')));
    write('.env.example','BASE_PATH=/\nSHARE_TOKEN=replace-with-a-random-secret-at-least-24-characters\nPG_REST_URL=https://your-own-postgres-rest-endpoint\nPG_PUBLISH_KEY=your-own-publish-key\nDB_SECRET=your-own-database-rpc-secret\n');
  }
}
for(const relative of Object.keys(previous?.files||{}))if(!owned[relative]&&fs.existsSync(path.join(output,relative))){const file=path.join(output,relative);if(createHash('sha256').update(fs.readFileSync(file)).digest('hex')!==previous.files[relative])throw Error('Removed asset has local changes: '+relative);}
for(const [relative,content] of pending){const file=path.join(output,relative);if(previous&&fs.existsSync(file)){const backup=path.join(output,'.local/previous-template',relative);fs.mkdirSync(path.dirname(backup),{recursive:true});fs.copyFileSync(file,backup);}fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,content);}
for(const relative of Object.keys(previous?.files||{}))if(!owned[relative]&&fs.existsSync(path.join(output,relative))){const file=path.join(output,relative),backup=path.join(output,'.local/previous-template',relative);fs.mkdirSync(path.dirname(backup),{recursive:true});fs.renameSync(file,backup);}
fs.writeFileSync(manifestPath,JSON.stringify({format:1,templateVersion:'3.1.0',tripId:data.trip.id,provider,files:owned},null,2));
console.log('Generated '+provider+' handbook at '+output+(provider==='local'?' — open public/index.html':' — account setup and deployment still required'));
