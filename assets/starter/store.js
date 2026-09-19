(function () {
  'use strict';
  const data=window.TRIP_DATA, M=window.HandbookModel;
  const local=location.protocol==='file:'||window.HANDBOOK_CONFIG?.storage==='local';
  const key='handbook:'+data.trip.id+':state:v1';
  let snapshot=M.emptyState(data), ready=local, status=local?'ready':'loading', version=-1, pending=Promise.resolve();
  if(local) { try { snapshot=JSON.parse(localStorage.getItem(key))||snapshot; } catch { /* Fresh local preview. */ } }
  function changed(next) { const different=JSON.stringify(snapshot)!==JSON.stringify(next);snapshot=next;if(different)window.dispatchEvent(new Event('handbookchange')); }
  function accept(result){if(!result.state||!['expenses','settlements','personal','checks','tasks'].every(k=>Array.isArray(result.state[k]))||!result.state.revisions)throw Error('数据暂时无法读取');if(Number.isInteger(result.revision)){if(result.revision<version)return;version=result.revision;}changed(result.state);if(!local)try{localStorage.setItem(key+':cloud-cache',JSON.stringify(result));}catch{}}
  async function responseJson(response) { const body=await response.json();if(!response.ok) {const error=Error(body.error||'保存失败，请重试');error.status=response.status;throw error;}return body; }
  async function refresh() { if(local)return;const result=await responseJson(await fetch('api/state',{cache:'no-store'}));const old=status;accept(result);status='ready';ready=true;if(old!==status)window.dispatchEvent(new Event('handbookchange')); }
  function mutate(operation) {
    const run=async()=>{
      if(!ready)await refresh();
      const revision=snapshot.revisions[operation.collection+':'+operation.id]||0;
      if(local) { const next=M.applyOperation(snapshot,{...operation,revision},data);localStorage.setItem(key,JSON.stringify(next));changed(next);return; }
      try { const result=await responseJson(await fetch('api/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...operation,revision})}));accept(result); }
      catch(error) { if(error.status===409)await refresh();throw error; }
    };
    const result=pending.then(run);pending=result.catch(()=>{});return result;
  }
  window.HandbookStore={get:()=>snapshot,status:()=>status,local,refresh,put:(collection,record)=>mutate({collection,action:'put',id:record.id,record}),remove:(collection,id)=>mutate({collection,action:'delete',id})};
  function sync(){refresh().catch(()=>{if(!ready){try{const cache=JSON.parse(localStorage.getItem(key+':cloud-cache'));if(cache?.state){accept(cache);status='offline';}else status='error';}catch{status='error';}window.dispatchEvent(new Event('handbookchange'));}});}
  window.addEventListener('online',sync);document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync();});
  if(!local){sync();setInterval(()=>{if(!document.hidden)sync();},5000);}
})();
