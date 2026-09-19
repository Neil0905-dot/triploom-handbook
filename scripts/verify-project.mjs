#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import {createHash} from 'node:crypto';
const project=path.resolve(process.argv[2]||''),root=path.resolve(import.meta.dirname,'..');if(!process.argv[2])throw Error('Usage: verify-project.mjs project-folder');
const manifest=JSON.parse(fs.readFileSync(path.join(project,'handbook-project.json'))),errors=[],hash=file=>createHash('sha256').update(fs.readFileSync(file)).digest('hex');
for(const [file,digest] of Object.entries(manifest.files)){const absolute=path.resolve(project,file);if(!absolute.startsWith(project+path.sep)||!fs.existsSync(absolute)||hash(absolute)!==digest)errors.push('Generated file changed/missing: '+file);}
for(const [dir,names] of [['full',fs.readdirSync(path.join(root,'assets/full'))],['starter',['model.js','store.js']]])for(const name of names){const actual=path.join(project,'public',name);if(!fs.existsSync(actual)||hash(actual)!==hash(path.join(root,'assets',dir,name)))errors.push('Template mismatch: '+name);}
console.log(JSON.stringify({version:manifest.templateVersion,tripId:manifest.tripId,provider:manifest.provider,errors,scope:'file integrity, not visual or semantic acceptance'},null,2));if(errors.length)process.exit(1);
