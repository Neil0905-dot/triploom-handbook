(function (root) {
  'use strict';
  const own = (object, key) => Object.prototype.hasOwnProperty.call(object, key);
  const idPattern = /^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,100}$/;
  function cents(value) {
    const text = String(value ?? '').trim().replace(/[，,。]/g, '.');
    if (!/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text)) throw Error('请输入金额');
    const [whole = '0', decimals = ''] = text.split('.');
    const result = Number(whole || 0) * 100 + Number((decimals + '00').slice(0, 2)) + (Number(decimals[2] || 0) >= 5 ? 1 : 0);
    if (!Number.isSafeInteger(result) || result <= 0) throw Error('请输入有效金额');
    return result;
  }
  function split(total, members) {
    const ids = [...new Set(members)].sort();
    if (!Number.isSafeInteger(total) || total < 0 || !ids.length) throw Error('请选择承担费用的成员');
    return Object.fromEntries(ids.map((id, i) => [id, Math.floor(total / ids.length) + (i < total % ids.length ? 1 : 0)]));
  }
  const includes = (item, id) => !item.people?.length || item.people.includes(id);
  function dateAt(now, zone) { return new Intl.DateTimeFormat('sv-SE', { timeZone: zone || 'UTC' }).format(new Date(now)); }
  function dayFor(data, member, date) {
    const days = (data.days || []).filter(d => d.date === date && includes(d, member));
    return days.find(d => d.people?.includes(member)) || days[0];
  }
  function flightDate(f, arrival = false) { return (arrival ? f.arrivalAt : f.departureAt)?.slice(0, 10) || (arrival ? f.arrivalDate : f.date); }
  function journey(data, member, now = Date.now()) {
    const flights = (data.flights || []).filter(f => includes(f, member)).sort((a, b) => Date.parse(a.departureAt) - Date.parse(b.departureAt));
    const active = flights.find(f => Date.parse(f.departureAt) <= now && Date.parse(f.arrivalAt) > now);
    const future = flights.find(f => Date.parse(f.departureAt) > now);
    const arrived = flights.filter(f => Date.parse(f.arrivalAt) <= now).sort((a, b) => Date.parse(b.arrivalAt) - Date.parse(a.arrivalAt))[0];
    const scheduled=(data.days||[]).find(d=>includes(d,member)&&d.timeZone&&d.date===dateAt(now,d.timeZone));
    const zone = active?.destination?.timeZone || scheduled?.timeZone || arrived?.destination?.timeZone || future?.origin?.timeZone || data.trip.defaultTimeZone || 'UTC';
    const date = dateAt(now, zone), day = dayFor(data, member, date);
    const phase = active ? 'flying' : date < data.trip.startDate ? 'before' : date > data.trip.endDate ? 'finished' : arrived && future && now - Date.parse(arrived.arrivalAt) < 86400000 && Date.parse(future.departureAt) - now < 86400000 ? 'connection' : 'travel';
    return { phase, date, day, active, future, arrived, zone };
  }
  function validate(data) {
    const errors = [], warnings = [];
    const bad = text => errors.push(text);
    const validDate = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && Number.isFinite(Date.parse(d)) && new Date(d).toISOString().slice(0, 10) === d;
    if (data.schemaVersion !== 1) bad('schemaVersion must be 1');
    if (!idPattern.test(data.trip?.id || '')) bad('trip.id must be a stable identifier');
    if (!data.trip?.title) bad('trip.title is required');
    if (!validDate(data.trip?.startDate) || !validDate(data.trip?.endDate) || data.trip.startDate > data.trip.endDate) bad('invalid trip date range');
    try { dateAt(0, data.trip?.defaultTimeZone); } catch { bad('invalid trip time zone'); }
    const ids = new Set();
    if (!data.people?.length) bad('at least one traveler is required');
    for (const p of data.people || []) { if (!idPattern.test(p.id) || ids.has(p.id) || !p.displayName) bad('invalid or duplicate traveler'); ids.add(p.id); }
    const members = (list, label) => { if (list && (!Array.isArray(list) || new Set(list).size !== list.length || list.some(id => !ids.has(id)))) bad('unknown or repeated member: ' + label); };
    const coordinates=(p,label)=>{if(p&&(!Number.isFinite(p.latitude)||!Number.isFinite(p.longitude)||Math.abs(p.latitude)>90||Math.abs(p.longitude)>180))bad('invalid coordinates: '+label);};
    const placeIds=new Set();
    for(const place of data.places||[]){
      if(!idPattern.test(place.id)||placeIds.has(place.id)||!place.name)bad('invalid or duplicate place: '+(place.id||''));
      placeIds.add(place.id);if(place.coordinates||place.latitude!=null||place.longitude!=null)coordinates(place.coordinates||place,place.id);
      if(!place.query&&!Number.isFinite(place.latitude??place.coordinates?.latitude))warnings.push('地点缺少导航查询与坐标: '+place.id);
    }
    if (data.trip?.defaultPersonId && !ids.has(data.trip.defaultPersonId)) bad('unknown default member');
    if (Object.values(data.modules || {}).length && ['today','trip','budget','prepare'].every(k => data.modules[k] === false)) bad('enable at least one module');
    const recordIds = new Set();
    for (const collection of ['flights','stays','packingGroups','tasks']) for (const r of data[collection] || []) {
      if (!idPattern.test(r.id) || recordIds.has(r.id)) bad('invalid or duplicate record id: ' + r.id);
      recordIds.add(r.id); members(r.people, r.id);
    }
    for (const f of data.flights || []) {
      if (!f.origin?.city || !f.destination?.city) bad('flight endpoints required: ' + f.id);
      for(const e of [f.origin,f.destination]){if(e?.coordinates)coordinates(e.coordinates,f.id);if(e?.latitude!=null||e?.longitude!=null)coordinates(e,f.id);if(e?.timeZone)try{dateAt(0,e.timeZone);}catch{bad('invalid endpoint time zone: '+f.id);}}
      for (const key of ['departureAt','arrivalAt']) if (f[key] && (!/(Z|[+-]\d{2}:\d{2})$/.test(f[key]) || !Number.isFinite(Date.parse(f[key])))) bad('flight timestamp needs valid date and offset: ' + f.id);
      if (f.departureAt && f.arrivalAt && Date.parse(f.arrivalAt) <= Date.parse(f.departureAt)) bad('flight arrival precedes departure: ' + f.id);
      if (!f.departureAt && !validDate(f.date)) bad('flight needs date or departureAt: ' + f.id);
      if (!f.code) warnings.push('航班号待补: ' + f.id);
    }
    const stays = new Set((data.stays || []).map(s => s.id));
    const dayKeys = new Set();
    for (const d of data.days || []) {
      if (!validDate(d.date) || !d.city) bad('day requires valid date and city');
      members(d.people, d.date);
      if(d.coordinates)coordinates(Array.isArray(d.coordinates)?{latitude:d.coordinates[0],longitude:d.coordinates[1]}:d.coordinates,d.date);
      for(const point of d.mapCities||[]){if(!point.name)bad('map city name required');if(point.countryCode&&!/^[A-Z]{2}$/.test(point.countryCode))bad('invalid map country code');if(point.coordinates||point.latitude!=null||point.longitude!=null)coordinates(point.coordinates||point,d.date);}
      if(d.timeZone)try{dateAt(0,d.timeZone);}catch{bad('invalid day time zone: '+d.date);}
      for(const point of d.route||[])if(typeof point!=='string'){if(!point.name)bad('route point name required');if(point.latitude!=null||point.longitude!=null)coordinates(point,d.date);if(point.coordinates)coordinates(point.coordinates,d.date);}
      for (const person of d.people?.length ? d.people : ['*']) { const k=d.date+':'+person; if(dayKeys.has(k))bad('ambiguous day for member: '+k);dayKeys.add(k); }
      if (d.stayId && !stays.has(d.stayId)) bad('unknown stay: ' + d.stayId);
      for(const e of d.events || []) {
        if(!idPattern.test(e.id)||!e.title)bad('event id and title required'); members(e.people,e.id);
        const nav=e.navigation;
        if(nav){
          if(!['place','route'].includes(nav.type))bad('invalid event navigation type: '+e.id);
          const refs=nav.type==='place'?[nav.placeId]:[nav.originPlaceId,nav.destinationPlaceId,...(nav.waypointPlaceIds||[])];
          if(refs.some(id=>!placeIds.has(id)))bad('unknown event navigation place: '+e.id);
          if(nav.type==='route'&&(!nav.originPlaceId||!nav.destinationPlaceId))bad('route navigation needs origin and destination: '+e.id);
          if(nav.travelMode&&!['driving','walking','bicycling','transit'].includes(nav.travelMode))bad('invalid travel mode: '+e.id);
        }
      }
    }
    for(const s of data.stays || []) { if(!validDate(s.checkIn)||!validDate(s.checkOut)||s.checkOut<=s.checkIn)bad('invalid stay dates: '+s.id);members(s.price?.members,s.id);if(s.price&&(!Number.isFinite(s.price.amount)||s.price.amount<0||!/^[A-Z]{3}$/.test(s.price.currency)))bad('invalid stay price: '+s.id); }
    for(const g of data.packingGroups || []) for(const i of g.items || []) if(!idPattern.test(i.id)||!i.text)bad('packing item id and text required');
    for(const t of data.tasks || []) if(!t.text)bad('task text required');
    for(const c of data.budget?.currencies || []) if(!/^[A-Z]{3}$/.test(c.code)||(c.rateToCny!=null&&(!Number.isFinite(c.rateToCny)||c.rateToCny<=0)))bad('invalid currency or exchange rate');
    for(const e of data.budget?.items || []) {
      try { validateExpense(e, ids); } catch(error) { bad(error.message); }
    }
    return { errors, warnings };
  }
  function validateExpense(e, ids) {
    if(!idPattern.test(e.id)||!String(e.purpose||'').trim()||String(e.purpose).length>200)throw Error('账目名称无效');
    if(!Number.isSafeInteger(e.cents)||e.cents<=0||!/^[A-Z]{3}$/.test(e.currency))throw Error('账目金额或币种无效');
    if(e.rate!=null&&(!Number.isFinite(e.rate)||e.rate<=0))throw Error('汇率无效');
    if(e.date&&(!/^\d{4}-\d{2}-\d{2}$/.test(e.date)||!Number.isFinite(Date.parse(e.date))))throw Error('账目日期无效');
    if(!['paid','pending'].includes(e.status))throw Error('支付状态无效');
    if(e.payer!=null&&!ids.has(e.payer))throw Error('付款人无效');
    if(!['individual','equal'].includes(e.splitMode))throw Error('分摊方式无效');
    if(!Array.isArray(e.members)||!e.members.length||new Set(e.members).size!==e.members.length||e.members.some(id=>!ids.has(id))||(e.splitMode==='individual'&&e.members.length!==1))throw Error('请选择承担费用的成员');
    return e;
  }
  function emptyState(data) { return { expenses: data.budget?.items || [], settlements: [], personal: [], checks: [], tasks: (data.tasks || []).map(t=>({...t,checked:false})), revisions: {} }; }
  function applyOperation(previous, operation, data) {
    const state = JSON.parse(JSON.stringify(previous)), ids=new Set(data.people.map(p=>p.id));
    const { collection, action, record, id, revision } = operation;
    if(!['expenses','settlements','personal','checks','tasks'].includes(collection)||!['put','delete'].includes(action))throw Error('Invalid operation');
    if(!idPattern.test(id))throw Error('Invalid record id');
    const key=collection+':'+id, existing=state[collection].find(r=>r.id===id), expected=own(state.revisions,key)?state.revisions[key]:0;
    if((revision??0)!==expected) { const error=Error('记录已更新，请重试');error.status=409;throw error; }
    if(action==='put') {
      if(!record||record.id!==id)throw Error('Invalid record');
      if(collection==='expenses')validateExpense(record,ids);
      if(collection==='personal'&&(!ids.has(record.owner)||!data.packingGroups.some(g=>g.id===record.group)||!String(record.text||'').trim()||String(record.text).length>200))throw Error('Invalid personal item');
      if(collection==='checks'&&(!ids.has(record.owner)||typeof record.checked!=='boolean'||typeof record.itemId!=='string'))throw Error('Invalid check');
      if(collection==='tasks'&&(!String(record.text||'').trim()||String(record.text).length>200||typeof record.checked!=='boolean'))throw Error('Invalid task');
      if(collection==='settlements'&&(!ids.has(record.from)||!ids.has(record.to)||record.from===record.to||!Number.isSafeInteger(record.cents)||record.cents<=0||!/^[A-Z]{3}$/.test(record.currency)))throw Error('Invalid settlement');
      state[collection]=[...state[collection].filter(r=>r.id!==id),record];
    } else state[collection]=state[collection].filter(r=>r.id!==id);
    state.revisions[key]=expected+1;
    if(!existing&&action==='delete')return previous;
    return state;
  }
  root.HandbookModel={cents,split,includes,dateAt,dayFor,flightDate,journey,validate,emptyState,applyOperation};
})(globalThis);
