#!/usr/bin/env python3
"""Read-only XLSX evidence extraction using Python's standard library.

Keeps cell values/formulas, rich-text colors, merged ranges and embedded image
anchors. Interpretation into trip data remains the host agent's responsibility.
"""
import argparse
import hashlib
import json
import posixpath
import re
import zipfile
import datetime
from pathlib import Path
from xml.etree import ElementTree as ET

NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
      'p': 'http://schemas.openxmlformats.org/package/2006/relationships',
      'x': 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
      'a': 'http://schemas.openxmlformats.org/drawingml/2006/main'}

def extract(source, destination):
    if destination.exists() and any(destination.iterdir()):
        raise ValueError('Use an empty output directory to preserve earlier evidence.')
    destination.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(source) as z:
        def xml(name):
            return ET.fromstring(z.read(name))
        def relationships(name):
            relname=posixpath.join(posixpath.dirname(name),'_rels',posixpath.basename(name)+'.rels')
            if relname not in z.namelist(): return {}
            result={}
            for item in xml(relname):
                target=item.get('Target')
                external=item.get('TargetMode')=='External'
                result[item.get('Id')]={'type':item.get('Type'),'external':external,
                    'target':target if external else posixpath.normpath(posixpath.join(posixpath.dirname(name),target)).lstrip('/')}
            return result
        def rich(node):
            runs=[]
            for run in node.findall('s:r',NS):
                color=run.find('s:rPr/s:color',NS)
                runs.append({'text':''.join(t.text or '' for t in run.findall('s:t',NS)),
                             'color':color.attrib if color is not None else None})
            return {'text':''.join(t.text or '' for t in node.findall('.//s:t',NS)), 'runs':runs}
        strings=[rich(si) for si in xml('xl/sharedStrings.xml')] if 'xl/sharedStrings.xml' in z.namelist() else []
        styles=xml('xl/styles.xml') if 'xl/styles.xml' in z.namelist() else None
        number_formats={x.get('numFmtId'):x.get('formatCode') for x in styles.findall('s:numFmts/s:numFmt',NS)} if styles is not None else {}
        fonts=[f.find('s:color',NS) for f in styles.findall('s:fonts/s:font',NS)] if styles is not None else []
        style_list=[{'numberFormatId':x.get('numFmtId'),'numberFormat':number_formats.get(x.get('numFmtId')),'fontId':x.get('fontId'),'fontColor':fonts[int(x.get('fontId','0'))].attrib if fonts and fonts[int(x.get('fontId','0'))] is not None else None} for x in styles.findall('s:cellXfs/s:xf',NS)] if styles is not None else []
        workbook=xml('xl/workbook.xml'); links=relationships('xl/workbook.xml'); sheets=[]
        date1904=workbook.find('s:workbookPr',NS)
        date1904=date1904 is not None and date1904.get('date1904','0') in ('1','true')
        for spec in workbook.findall('s:sheets/s:sheet',NS):
            sheetfile=links[spec.get('{'+NS['r']+'}id')]['target'];sheet=xml(sheetfile);sheetlinks=relationships(sheetfile)
            cells=[]
            for c in sheet.findall('s:sheetData/s:row/s:c',NS):
                value=c.findtext('s:v',default='',namespaces=NS);kind=c.get('t');runs=[]
                if kind=='s' and value!='':value,runs=strings[int(value)]['text'],strings[int(value)]['runs']
                elif kind=='inlineStr':
                    item=rich(c.find('s:is',NS));value,runs=item['text'],item['runs']
                if value=='' and c.find('s:f',NS) is None:continue
                record={'sourceId':f'sheet{len(sheets)+1}:{c.get("r")}','cell':c.get('r'),'value':value,'type':kind or 'numeric','style':style_list[int(c.get('s','0'))] if style_list else None}
                fmt=record['style'] or {}
                if kind in (None,'n') and value and (fmt.get('numberFormatId') in [str(i) for i in range(14,23)]+['45','46','47'] or re.search(r'[yd]',re.sub(r'"[^"]*"|\[[^\]]*\]','',fmt.get('numberFormat') or ''),re.I)):
                    try:
                        serial=float(value)
                        if 0<=serial<1:record['timeValue']=str(datetime.timedelta(seconds=round(serial*86400)))
                        else:
                            converted=(datetime.datetime(1904,1,1) if date1904 else datetime.datetime(1899,12,30))+datetime.timedelta(days=serial+(1 if not date1904 and 0<serial<60 else 0))
                            record['dateValue']=converted.isoformat()
                    except (ValueError,OverflowError):pass
                if runs:record['runs']=runs
                formula=c.findtext('s:f',namespaces=NS)
                if formula is not None:record['formula']=formula
                cells.append(record)
            images=[]
            for drawing in sheet.findall('s:drawing',NS):
                drawingfile=sheetlinks[drawing.get('{'+NS['r']+'}id')]['target'];drawinglinks=relationships(drawingfile)
                for anchor in xml(drawingfile):
                    start=anchor.find('x:from',NS)
                    for blip in anchor.findall('.//a:blip',NS):
                        link=drawinglinks.get(blip.get('{'+NS['r']+'}embed'))
                        if not link or link['external']:continue
                        source_name=link['target'];content=z.read(source_name)
                        ext=Path(source_name).suffix.lower();ext=ext if re.fullmatch(r'\.[a-z0-9]{1,6}',ext) else '.bin'
                        output=f'media/sheet-{len(sheets)+1}-image-{len(images)+1}{ext}'
                        (destination/'media').mkdir(exist_ok=True);(destination/output).write_bytes(content)
                        images.append({'sourceId':f'sheet{len(sheets)+1}:image{len(images)+1}','file':output,'sha256':hashlib.sha256(content).hexdigest(),
                            'row':int(start.findtext('x:row',namespaces=NS))+1 if start is not None else None,
                            'column':int(start.findtext('x:col',namespaces=NS))+1 if start is not None else None})
            hyperlinks=[]
            for h in sheet.findall('s:hyperlinks/s:hyperlink',NS):
                link=sheetlinks.get(h.get('{'+NS['r']+'}id'),{})
                hyperlinks.append({'sourceId':f'sheet{len(sheets)+1}:link{len(hyperlinks)+1}','cell':h.get('ref'),'target':link.get('target') or h.get('location')})
            comments=[]
            for link in sheetlinks.values():
                if not link['external'] and link['type'].endswith('/comments'):
                    for c in xml(link['target']).findall('s:commentList/s:comment',NS):
                        comments.append({'sourceId':f'sheet{len(sheets)+1}:comment{len(comments)+1}','cell':c.get('ref'),'text':''.join(t.text or '' for t in c.findall('.//s:t',NS))})
            sheets.append({'name':spec.get('name'),'state':spec.get('state','visible'),'cells':cells,
                           'merged':[m.get('ref') for m in sheet.findall('s:mergeCells/s:mergeCell',NS)],
                           'images':images,'hyperlinks':hyperlinks,'comments':comments})
        prop=workbook.find('s:workbookPr',NS)
        result={'sourceName':source.name,'sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
                'date1904':prop.get('date1904','0') if prop is not None else '0','sheets':sheets,
                'note':'Evidence, not interpreted itinerary. Inspect images and numeric date formats before normalizing.'}
        (destination/'workbook.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
        print(json.dumps({'sheets':len(sheets),'cells':sum(len(s['cells']) for s in sheets),
                          'images':sum(len(s['images']) for s in sheets),'output':str(destination)},ensure_ascii=False))

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('source',type=Path);parser.add_argument('output',type=Path)
    args=parser.parse_args();extract(args.source,args.output)
