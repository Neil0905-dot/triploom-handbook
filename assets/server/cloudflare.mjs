import {handle} from './core.mjs';
import data from './trip.json' with { type: 'json' };
const initial=()=>globalThis.HandbookModel.emptyState(data);
export default {async fetch(request,env){
  return handle(request,{data,secret:env.SHARE_TOKEN,
    read:async()=>{await env.DB.prepare('INSERT OR IGNORE INTO handbook_state (id,payload,revision) VALUES (?,?,0)').bind(data.trip.id,JSON.stringify(initial())).run();const row=await env.DB.prepare('SELECT payload,revision FROM handbook_state WHERE id=?').bind(data.trip.id).first();return {state:JSON.parse(row.payload),revision:row.revision};},
    write:async(revision,state)=>{const result=await env.DB.prepare('UPDATE handbook_state SET payload=?,revision=revision+1 WHERE id=? AND revision=?').bind(JSON.stringify(state),data.trip.id,revision).run();return result.meta.changes===1;},
    asset:(_path,req)=>env.ASSETS.fetch(req)
  });
}};
