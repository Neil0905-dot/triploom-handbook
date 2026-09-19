import '../public/model.js';
const M=globalThis.HandbookModel;
const json=(value,status=200,headers={})=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...headers}});
const login=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>打开旅行手册</title><style>body{font:17px sans-serif;background:#f3f5f2;color:#202623;margin:12vh auto;padding:24px;max-width:420px}input,button{font:inherit;box-sizing:border-box;width:100%;padding:16px;border-radius:16px;margin:8px 0;border:1px solid #ddd}button{background:#def77c}p{line-height:1.6}</style><h1>一起出发</h1><p>输入这趟旅行的访问口令。</p><form><input name="token" type="password" autocomplete="current-password" aria-label="访问口令" required><button>打开手册</button><p role="status"></p></form><script>const form=document.querySelector('form');form.onsubmit=async e=>{e.preventDefault();const r=await fetch('api/unlock',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:form.token.value})});if(r.ok){location.replace(location.pathname)}else document.querySelector('[role=status]').textContent='口令不正确，请重试';};</script></html>`;
async function digest(value){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(b=>b.toString(16).padStart(2,'0')).join('');}
export async function handle(request,{data,secret,read,write,asset,basePath='/'}) {
  if(!secret||secret.length<24)return json({error:'Service not configured'},503);
  const url=new URL(request.url), route=url.pathname.slice(basePath.replace(/\/$/,'').length)||'/';
  if(basePath!=='/'&&url.pathname===basePath.replace(/\/$/,''))return new Response(null,{status:302,headers:{Location:basePath}});
  const cookieName='hb_'+data.trip.id.replace(/[^a-zA-Z0-9]/g,'_');
  const session=await digest('session:'+secret);
  const authorized=(request.headers.get('cookie')||'').split(';').some(v=>v.trim()===cookieName+'='+session);
  if(request.method==='POST'){
    if(request.headers.get('origin')!==url.origin)return json({error:'Forbidden'},403);
    if(!request.headers.get('content-type')?.startsWith('application/json'))return json({error:'JSON required'},415);
  }
  if(route==='/api/unlock'&&request.method==='POST'){
    if(Number(request.headers.get('content-length'))>4096)return json({error:'Too large'},413);
    let input;try{input=await request.json();}catch{return json({error:'Invalid request'},400);}
    if(typeof input.token!=='string'||await digest(input.token)!==await digest(secret))return json({error:'Unauthorized'},401);
    return json({ok:true},200,{'Set-Cookie':`${cookieName}=${session}; Path=${basePath}; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`});
  }
  if(!authorized){if(route==='/'||route==='/index.html')return new Response(login,{headers:{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'}});return json({error:'Unauthorized'},401);}
  if(route==='/api/state'){
    if(request.method==='GET')return json(await read());
    if(request.method!=='POST')return json({error:'Method not allowed'},405);
    let operation;try{const raw=await request.text();if(raw.length>16000)return json({error:'Too large'},413);operation=JSON.parse(raw);}catch{return json({error:'Invalid request'},400);}
    try {
      for(let attempt=0;attempt<4;attempt++){
        const current=await read(),next=M.applyOperation(current.state,operation,data);
        if(JSON.stringify(next).length>1500000)return json({error:'旅行记录已达到容量上限'},413);
        if(await write(current.revision,next))return json({state:next,revision:current.revision+1});
      }
      return json({error:'记录同时更新，请重试'},409);
    }catch(error){return json({error:error.status===409?error.message:'记录格式无效'},error.status||400);}
  }
  if(!['GET','HEAD'].includes(request.method))return json({error:'Method not allowed'},405);
  const response=await asset(route,request);
  const headers=new Headers(response.headers);headers.set('Cache-Control','private, no-store');headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','no-referrer');
  return new Response(response.body,{status:response.status,headers});
}
