/* Normalize input once; presentation continues to use the full handbook UI. */
(function(){
 const d=window.TRIP_DATA,M=HandbookModel;
 const offset=t=>t?.match(/(Z|[+-]\d{2}:\d{2})$/)?.[1]?.replace('Z','+00:00')||'';
 const airports={},flightSegments={};
 for(const p of d.people)flightSegments[p.id]=(d.flights||[]).filter(f=>M.includes(f,p.id)).map(f=>{
  const endpoint=(arrival)=>{const e=arrival?f.destination:f.origin,k=f.id+(arrival?'-to':'-from');airports[k]=[e.city,e.airport||'机场待补',e.longitude??e.coordinates?.longitude,e.latitude??e.coordinates?.latitude,offset(arrival?f.arrivalAt:f.departureAt),e.timeZone||d.trip.defaultTimeZone];return k;};
  return {...f,date:M.flightDate(f),arrivalDate:M.flightDate(f,true)||M.flightDate(f),departure:f.departureAt?.slice(11,16)||'时间待补',arrival:f.arrivalAt?.slice(11,16)||'时间待补',origin:endpoint(false),destination:endpoint(true),originTerminal:f.origin.terminal,destinationTerminal:f.destination.terminal,via:[],code:f.code||'航班号待补'};
 });
 const nights=s=>{const out=[];for(let t=Date.parse(s.checkIn);t<Date.parse(s.checkOut);t+=86400000)out.push(new Date(t).toISOString().slice(0,10));return out;};
 window.FULL_DATA={...d,airports,flightSegments,hotels:d.stays.map(s=>({...s,dates:nights(s),english:s.englishName||'',total:s.price?.amount,currency:s.price?.currency||'CNY',splitMembers:s.price?.members||[],room:s.room,breakfast:s.breakfast,requirements:s.requirements||s.checkInNote})),budgetConfig:{currencies:d.budget.currencies.map(c=>({...c,label:c.name||c.code})),defaultCurrency:d.budget.defaultCurrency}};
 window.BASELINE={profiles:Object.fromEntries(d.people.map(p=>[p.id,{...p,name:p.displayName,origin:p.origin||d.flights.find(f=>M.includes(f,p.id))?.origin.city||d.days.find(x=>M.includes(x,p.id))?.city||'目的地待补'}]))};
 const S=HandbookStore;
 function expenses(){return S.get().expenses.map(e=>{const rate=e.currency==='CNY'?1:e.rate??d.budget.currencies.find(c=>c.code===e.currency)?.rateToCny,total=Number.isFinite(rate)?Math.round(e.cents*rate):null;return {...e,amount:e.cents/100,rate,cnyCents:total,shares:total==null?{}:M.split(total,e.members),paymentStatus:e.status==='pending'?'unpaid':'paid',payerConfirmed:!!e.payer,date:e.date||d.trip.startDate,createdAt:e.createdAt||'',revision:S.get().revisions['expenses:'+e.id]||0};});}
 const personal=()=>[...S.get().personal.map(x=>({...x,kind:'custom',sourceItemId:x.sourceId})),...S.get().checks.filter(x=>x.itemId.startsWith('hidden:')&&x.checked).map(x=>({...x,kind:'hidden-base',baseItemId:x.itemId.slice(7)})),...S.get().checks.filter(x=>!x.itemId.startsWith('hidden:')).map(x=>({...x,kind:'check-state',baseItemId:x.itemId}))];
 window.TripCloud={items(kind){if(kind==='expenses')return expenses();if(kind==='personal-items')return personal();return S.get()[kind]||[];},read:()=>S.refresh(),syncAll:()=>S.refresh(),async request(kind,method,r){
  let collection=kind,record=r;
  if(kind==='expenses'&&method!=='DELETE')record={...r,cents:M.cents(r.amount),purpose:r.purpose||r.category,status:r.paymentStatus==='unpaid'?'pending':'paid',splitMode:r.members.length===1?'individual':'equal',createdAt:r.createdAt||new Date().toISOString()};
  if(kind==='settlements')record={...r,currency:r.currency||'CNY'};
  if(kind==='personal-items'){
   if(r.kind==='hidden-base'||r.kind==='check-state'){collection='checks';record={id:r.id,owner:r.owner,itemId:(r.kind==='hidden-base'?'hidden:':'')+r.baseItemId,checked:r.kind==='hidden-base'||r.checked};}
   else {collection='personal';record={...r,sourceId:r.sourceItemId};}
  }
  if(method==='DELETE')await S.remove(collection,r.id);else await S.put(collection,record);
  return {item:record};
 }};
 window.addEventListener('handbookchange',()=>window.dispatchEvent(new Event('tripcloudchange')));
})();
