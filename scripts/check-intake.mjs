#!/usr/bin/env node
import fs from 'node:fs';
const [sourcePath,reviewPath,dataPath]=process.argv.slice(2);if(!dataPath)throw Error('Usage: check-intake.mjs workbook.json intake-review.json trip-data.json');
const read=f=>JSON.parse(fs.readFileSync(f,'utf8')),source=read(sourcePath),review=read(reviewPath),data=read(dataPath),errors=[];
const inventory=new Map();for(const [i,s] of source.sheets.entries()){for(const c of s.cells)inventory.set(c.sourceId||`sheet${i+1}:${c.cell}`,'cell');for(const [j,img] of (s.images||[]).entries())inventory.set(img.sourceId||`sheet${i+1}:image${j+1}`,'image');for(const [kind,items] of [['link',s.hyperlinks||[]],['comment',s.comments||[]]])items.forEach((x,j)=>inventory.set(x.sourceId||`sheet${i+1}:${kind}${j+1}`,kind));}
const targets=new Set(['trip','preparation']);for(const [kind,items] of [['day',data.days||[]],['person',data.people||[]],['event',(data.days||[]).flatMap(d=>d.events||[])],['flight',data.flights||[]],['stay',data.stays||[]],['expense',data.budget?.items||[]],['task',data.tasks||[]]])for(const item of items)targets.add(kind+':'+(kind==='day'?item.date:item.id));
if(review.workbookSha256!==source.sha256)errors.push('Review belongs to a different source workbook');
const seen=new Set();for(const [i,c] of (review.coverage||[]).entries()){
 if(!Array.isArray(c.sources)||!c.sources.length)errors.push(`coverage[${i}] has no sources`);
 if(!['represented','deferred','structure','excluded'].includes(c.handling))errors.push(`coverage[${i}] invalid handling`);
 if(typeof c.note!=='string'||!c.note.trim())errors.push(`coverage[${i}] needs a reason`);
 if(c.handling==='represented'&&(!Array.isArray(c.targets)||!c.targets.length))errors.push(`coverage[${i}] missing output targets`);
 for(const t of c.targets||[])if(!targets.has(t))errors.push(`Unknown output target: ${t}`);
 for(const id of c.sources||[]){if(!inventory.has(id))errors.push(`Unknown source: ${id}`);if(seen.has(id))errors.push(`Repeated source disposition: ${id}`);seen.add(id);if(inventory.get(id)==='image'&&c.handling==='structure')errors.push(`Image must be inspected and classified: ${id}`);}
}
for(const id of inventory.keys())if(!seen.has(id))errors.push(`Unreviewed source: ${id}`);
for(const d of review.decisions||[])for(const id of d.sources||[])if(!inventory.has(id))errors.push(`Unknown decision source: ${id}`);
const result={covered:[...inventory.keys()].filter(id=>seen.has(id)).length,total:inventory.size,errors,scope:'coverage and references only; not semantic acceptance'};console.log(JSON.stringify(result,null,2));if(errors.length)process.exit(1);
