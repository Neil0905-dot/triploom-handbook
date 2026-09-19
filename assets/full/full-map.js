function routeIllustration(date){const d=M.dayFor(RAW,person,date),image=d?.illustration||RAW.trip.illustration||'illustrations/default-journey.svg';return `<div class="route-illustration generic-journey-art"><img src="${esc(image)}" alt="旅行插图"></div>`;}
function mapDate(){return page==='trip'?days()[selected]?.date:journeyContext().date;}
function mapValid(p){return Number.isFinite(p?.longitude)&&Number.isFinite(p?.latitude);}
function mapContains(r,p){let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p.latitude)!==(b[1]>p.latitude)&&p.longitude<(b[0]-a[0])*(p.latitude-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
function mapCountry(p){p={...p,...p.coordinates};if(p.countryCode)return p.countryCode;return Object.entries(window.MAP_COUNTRIES||{}).find(([,c])=>mapValid(p)&&c.rings.some(r=>mapContains(r,p)))?.[0]||null;}
// Only explicitly identified cities enter overview maps. Never promote a POI to a city.
function mapPoints(date){
 const d=M.dayFor(RAW,person,date),normalize=p=>{const q={...p,name:p.name||p.city,longitude:p.longitude??p.coordinates?.longitude,latitude:p.latitude??p.coordinates?.latitude};q.countryCode=mapCountry(q);return q;};
 const explicit=d?.mapCities?.length?d.mapCities:(d?.route||[]).filter(p=>typeof p==='object'&&p.kind==='city');
 let points=explicit.map(normalize);
 if(!points.length&&d?.city){const matching=(d.route||[]).find(p=>typeof p==='object'&&p.name===d.city);points=[normalize({name:d.city,countryCode:d.countryCode||((RAW.trip.countries||[]).length===1?RAW.trip.countries[0]:null),coordinates:d.coordinates,...matching})];}
 if(!points.length)points=(RAW.flights||[]).filter(f=>(!f.people||f.people.includes(person))&&(f.date===date||f.departureAt?.slice(0,10)===date||f.arrivalAt?.slice(0,10)===date)).flatMap(f=>[f.origin,f.destination]).map(p=>normalize({...p,name:p.city}));
 return [...new Map(points.map(p=>[`${p.countryCode||''}:${p.name}`,p])).values()];
}
function mapContext(date){return {date,label:mapPoints(date).map(p=>p.name).join(' → ')};}
function mapTripCities(){const found=new Map();for(const p of days().flatMap(d=>mapPoints(d.date))){const key=`${p.countryCode||''}:${p.name}`;if(!found.has(key)||mapValid(p))found.set(key,p);}return [...found.values()];}
function mapScope(date,countryCode){
 const routes=days().map(d=>({date:d.date,points:mapPoints(d.date).filter(p=>!countryCode||p.countryCode===countryCode)})),all=[...new Map(routes.flatMap(r=>r.points).filter(mapValid).map(p=>[`${p.countryCode||''}:${p.name}`,p])).values()];
 const country=(window.MAP_COUNTRIES||{})[countryCode],rings=country?.rings||[];
 // Frame the complete main country outline, retaining any islands containing route cities.
 const area=r=>Math.abs(r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1];},0)),largest=[...rings].sort((a,b)=>area(b)-area(a))[0],frameRings=rings.filter(r=>r===largest||area(r)>area(largest||[])*.06||all.some(p=>mapContains(r,p)));
 const frame=[...frameRings.flatMap(r=>r.map(([longitude,latitude])=>({longitude,latitude}))),...all];
 if(!frame.length)return {routes,all,rings,xy:()=>[285,150]};
 const centers=all.length?all:frame.slice(0,1),best=centers.map(p=>{const center=p.longitude,values=frame.map(p=>center+((p.longitude-center+540)%360)-180);return {center,span:Math.max(...values)-Math.min(...values)};}).sort((a,b)=>a.span-b.span)[0];
 const normalized=p=>best.center+((p.longitude-best.center+540)%360)-180;
 const west=Math.min(...frame.map(normalized)),east=Math.max(...frame.map(normalized)),south=Math.min(...frame.map(p=>p.latitude)),north=Math.max(...frame.map(p=>p.latitude)),cx=(west+east)/2,cy=(south+north)/2,cos=Math.max(.2,Math.cos(cy*Math.PI/180)),scale=Math.min(420/Math.max((east-west)*cos,.5),230/Math.max(north-south,.5));
 return {routes,all,rings:frameRings.length?frameRings:(window.WORLD_RINGS||[]),xy:p=>[285+(normalized(p)-cx)*cos*scale,150-(p.latitude-cy)*scale]};
}
function mapSvg(points,active,rings,xy,id,world=false){
 const valid=points.filter(mapValid),activeKeys=new Set(active.map(p=>p.name)),labels=[],placed=new Map();
 for(const p of [...valid].sort((a,b)=>Number(activeKeys.has(b.name))-Number(activeKeys.has(a.name)))){const [x,y]=xy(p),width=Math.max(40,[...p.name].reduce((s,c)=>s+(c.charCodeAt(0)>255?19:11),0)),height=24;for(const dy of [-20,34,-50,64,-80,94,-110,124]){let found=false;for(const dx of [0,-width/2-20,width/2+20,-width-24,width+24]){const left=Math.max(10,Math.min(560-width,x+dx-width/2)),top=y+dy-height;if(top<8||top+height>292||labels.some(r=>left<r.x+r.w+6&&left+width+6>r.x&&top<r.y+r.h+5&&top+height+5>r.y))continue;labels.push({x:left,y:top,w:width,h:height});placed.set(p.name,{x:left+width/2,y:top+height-4});found=true;break;}if(found)break;}}
 const land=rings.map(r=>'M'+r.map(([longitude,latitude])=>xy({longitude,latitude}).map(n=>n.toFixed(1)).join(',')).join('L')+'Z').join(' '),segments=valid.slice(1).map((p,i)=>{const a=xy(valid[i]),b=xy(p);return `<path d="M${a} Q${(a[0]+b[0])/2},${(a[1]+b[1])/2-10} ${b}"/>`;}).join('');
 return `<svg class="route-map flight-world" data-map-level="${world?'country':'city'}" viewBox="0 0 570 300" role="img" aria-label="${world?'世界路线':'城市路线'}"><defs><clipPath id="${id}"><rect width="570" height="300" rx="32"/></clipPath></defs><g clip-path="url(#${id})"><path d="${land}" class="world-land"/><path d="${land}" class="world-coast"/><g class="flight-map-line other-flight">${segments}</g>${valid.map(p=>{const [x,y]=xy(p),label=placed.get(p.name),on=activeKeys.has(p.name);return `<g data-map-point="${esc(p.name)}" class="city-pin ${on?'on':'context-pin'}"><title>${esc(p.name)}</title><circle class="pin-dot" cx="${x}" cy="${y}" r="${on?7:5}"/></g>${label?`<path d="M${x},${y} L${label.x},${label.y-7}" class="map-label-leader"/><text data-map-label="${esc(p.name)}" x="${label.x}" y="${label.y}" text-anchor="middle" class="city-label ${on?'active-label':'context-label'}">${esc(p.name)}</text>`:''}`;}).join('')}</g></svg>`;
}
function routeMap(date=mapDate(),countryCode){const points=mapPoints(date),code=countryCode||points[0]?.countryCode,scope=mapScope(date,code);return mapSvg(scope.all,points,scope.rings,scope.xy,'country-clip-'+(code||'region'));}
function mapCard(date=mapDate()){
 if(!date)return '';const cities=mapTripCities(),active=mapPoints(date),catalog=window.MAP_COUNTRIES||{},countryCodes=[...new Set([...(RAW.flights||[]).filter(f=>!f.people||f.people.includes(person)).flatMap(f=>[f.origin,f.destination]).map(mapCountry),...cities.map(p=>p.countryCode)].filter(Boolean))],cards=[];
 if(countryCodes.length>1){const countries=countryCodes.map(c=>catalog[c]).filter(Boolean),activeCountries=active.map(p=>catalog[p.countryCode]).filter(Boolean);cards.push(`<section class="card map-card" aria-label="世界路线"><div class="map-heading">世界路线</div>${mapSvg(countries,activeCountries,window.WORLD_RINGS||[],p=>[285+p.longitude*1.45,160-p.latitude*1.45],'world-overview-clip',true)}<div class="map-current">${countries.map(p=>esc(p.name)).join(' → ')}</div></section>`);}
 const codes=[...new Set(active.map(p=>p.countryCode).filter(Boolean))];if(!codes.length&&cities.length)codes.push(null);
 for(const code of codes){const points=cities.filter(p=>!code||p.countryCode===code),known=points.filter(mapValid),missing=points.filter(p=>!mapValid(p)),name=catalog[code]?.name||'目的地';cards.push(`<section class="card map-card" aria-label="城市路线"><div class="map-heading">${esc(name)} · 城市路线</div>${known.length?routeMap(date,code):''}<div class="map-current">${points.map(p=>esc(p.name)).join(' → ')}</div>${missing.length?`<p class="sub route-coordinate-note">城市坐标待补：${missing.map(p=>esc(p.name)).join('、')}</p>`:''}</section>`);}
 return cards.join('');
}
