#!/usr/bin/env node
import fs from 'node:fs';
import '../assets/starter/model.js';
if(!process.argv[2])throw Error('Usage: validate-trip-data.mjs trip-data.json');
const result=globalThis.HandbookModel.validate(JSON.parse(fs.readFileSync(process.argv[2],'utf8')));
result.warnings.forEach(w=>console.warn('WARN '+w));result.errors.forEach(e=>console.error('ERROR '+e));
if(result.errors.length)process.exit(1);console.log('Trip data valid');
