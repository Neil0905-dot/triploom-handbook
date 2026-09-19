const fs=require('node:fs'),path=require('node:path');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'trip.json'),'utf8'));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.pdf':'application/pdf'};
async function rpc(name,args){const r=await fetch(process.env.PG_REST_URL+'/rpc/'+name,{method:'POST',headers:{'Content-Type':'application/json',apikey:process.env.PG_PUBLISH_KEY,Authorization:'Bearer '+process.env.PG_PUBLISH_KEY},body:JSON.stringify({p_secret:process.env.DB_SECRET,p_trip:data.trip.id,...args})});if(!r.ok)throw Error('Database unavailable');return r.json();}
exports.main=async event=>{
  try{
    const {handle}=await import('./core.mjs');
    const headers=Object.fromEntries(Object.entries(event.headers||{}).map(([k,v])=>[k.toLowerCase(),String(v)]));
    const url='https://'+headers.host+(event.path||'/');
    const method=event.httpMethod||'GET',body=event.isBase64Encoded?Buffer.from(event.body||'','base64'):event.body;
    const request=new Request(url,{method,headers,...(!['GET','HEAD'].includes(method)?{body:body||''}:{})});
    const basePath=process.env.BASE_PATH||'/';
    const response=await handle(request,{data,secret:process.env.SHARE_TOKEN,basePath,
      read:()=>rpc('handbook_read',{}),write:async(revision,state)=>Boolean(await rpc('handbook_write',{p_revision:revision,p_state:state})),
      asset:async route=>{let decoded;try{decoded=decodeURIComponent(route);}catch{return new Response('Bad path',{status:400});}const root=path.resolve(__dirname,'../public'),file=path.resolve(root,'.'+(decoded==='/'?'/index.html':decoded));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile())return new Response('Not found',{status:404});return new Response(fs.readFileSync(file),{headers:{'Content-Type':mime[path.extname(file)]||'application/octet-stream'}});}
    });
    return {statusCode:response.status,headers:Object.fromEntries(response.headers),body:Buffer.from(await response.arrayBuffer()).toString('base64'),isBase64Encoded:true};
  }catch{return {statusCode:503,headers:{'Content-Type':'application/json'},body:'{"error":"Service unavailable"}'};}
};
