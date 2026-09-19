import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {spawnSync} from 'node:child_process';
const root=path.resolve(import.meta.dirname,'..');
test('coverage rejects omitted sources, invented targets, and a mismatched workbook',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'intake-')),source={sha256:'test-hash',sheets:[{cells:[{sourceId:'sheet1:A1',cell:'A1'}],images:[{sourceId:'sheet1:image1'}]}]},data={days:[{date:'2028-05-09',events:[{id:'walk'}]}]},review={workbookSha256:'test-hash',coverage:[{sources:['sheet1:A1'],handling:'represented',targets:['event:walk'],note:'Mapped activity'},{sources:['sheet1:image1'],handling:'represented',targets:['day:2028-05-09'],note:'Inspected a route image and attached it to the day'}]};
 fs.writeFileSync(path.join(dir,'source.json'),JSON.stringify(source));fs.writeFileSync(path.join(dir,'data.json'),JSON.stringify(data));
 function run(r){fs.writeFileSync(path.join(dir,'review.json'),JSON.stringify(r));return spawnSync(process.execPath,[path.join(root,'scripts/check-intake.mjs'),path.join(dir,'source.json'),path.join(dir,'review.json'),path.join(dir,'data.json')],{encoding:'utf8'});}
 assert.equal(run(review).status,0);const omitted=structuredClone(review);omitted.coverage.pop();assert.notEqual(run(omitted).status,0);const invented=structuredClone(review);invented.coverage[0].targets=['event:does-not-exist'];assert.notEqual(run(invented).status,0);assert.notEqual(run({...review,workbookSha256:'different'}).status,0);fs.rmSync(dir,{recursive:true,force:true});
});
test('standard-library XLSX intake retains numeric dates, colors, comments, links and source IDs',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'xlsx-intake-')),input=path.join(dir,'source.xlsx'),out=path.join(dir,'extract');
 const program=`import zipfile,sys
ns='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
r='http://schemas.openxmlformats.org/officeDocument/2006/relationships'
p='http://schemas.openxmlformats.org/package/2006/relationships'
with zipfile.ZipFile(sys.argv[1],'w') as z:
 z.writestr('xl/workbook.xml',f'<workbook xmlns="{ns}" xmlns:r="{r}"><sheets><sheet name="Plan" sheetId="1" r:id="r1"/></sheets></workbook>')
 z.writestr('xl/_rels/workbook.xml.rels',f'<Relationships xmlns="{p}"><Relationship Id="r1" Target="worksheets/sheet1.xml" Type="{r}/worksheet"/></Relationships>')
 z.writestr('xl/sharedStrings.xml',f'<sst xmlns="{ns}"><si><r><rPr><color rgb="FF00B050"/></rPr><t>Visit</t></r></si></sst>')
 z.writestr('xl/styles.xml',f'<styleSheet xmlns="{ns}"><fonts count="1"><font><color rgb="FF008000"/></font></fonts><cellXfs count="2"><xf numFmtId="0" fontId="0"/><xf numFmtId="14" fontId="0"/></cellXfs></styleSheet>')
 z.writestr('xl/worksheets/sheet1.xml',f'<worksheet xmlns="{ns}" xmlns:r="{r}"><sheetData><row r="1"><c r="A1" t="s"><v/></c><c r="B1" t="s"><v>0</v></c><c r="C1" s="1"><v>43831</v></c></row></sheetData><hyperlinks><hyperlink ref="B1" r:id="link"/></hyperlinks></worksheet>')
 z.writestr('xl/worksheets/_rels/sheet1.xml.rels',f'<Relationships xmlns="{p}"><Relationship Id="link" Target="https://example.test/booking" Type="{r}/hyperlink" TargetMode="External"/><Relationship Id="comment" Target="../comments/comment1.xml" Type="{r}/comments"/></Relationships>')
 z.writestr('xl/comments/comment1.xml',f'<comments xmlns="{ns}"><commentList><comment ref="B1" authorId="0"><text><t>Reservation not confirmed</t></text></comment></commentList></comments>')
`;
 let r=spawnSync(process.env.PYTHON||'python3',['-c',program,input],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);r=spawnSync(process.env.PYTHON||'python3',[path.join(root,'scripts/extract-xlsx.py'),input,out],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);const sheet=JSON.parse(fs.readFileSync(path.join(out,'workbook.json'))).sheets[0];assert.equal(sheet.cells.length,2);assert.equal(sheet.cells[0].runs[0].color.rgb,'FF00B050');assert.equal(sheet.cells[1].dateValue,'2020-01-01T00:00:00');assert.equal(sheet.comments[0].text,'Reservation not confirmed');assert.equal(sheet.hyperlinks[0].sourceId,'sheet1:link1');assert.equal(sheet.cells[0].style.fontColor.rgb,'FF008000');fs.rmSync(dir,{recursive:true,force:true});
});
