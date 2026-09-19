#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import os from 'node:os';
const project=path.resolve(process.argv[2]||'.'),manifest=JSON.parse(fs.readFileSync(path.join(project,'handbook-project.json'),'utf8'));
if(manifest.provider!=='cloudbase')throw Error('Expected CloudBase project');
const stage=fs.mkdtempSync(path.join(os.tmpdir(),'handbook-cloudbase-upload-'));
for(const name of ['public','server','index.js','package.json'])fs.cpSync(path.join(project,name),path.join(stage,name),{recursive:true});
console.log(stage);
