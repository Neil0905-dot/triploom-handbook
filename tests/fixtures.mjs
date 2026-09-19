export function fixture(kind='group') {
  const count=kind==='solo'?1:kind==='pair'?2:6;
  const people=Array.from({length:count},(_,i)=>({id:'member-'+(i+1),displayName:['小林','阿遥','小周','阿宁','小陆','阿禾'][i]}));
  const city=kind==='solo'?'杭州':kind==='pair'?'京都':'悉尼';
  const d={schemaVersion:1,trip:{id:'test-'+kind,title:city+'慢旅行',startDate:'2027-04-18',endDate:'2027-04-20',defaultTimeZone:kind==='solo'?'Asia/Shanghai':kind==='pair'?'Asia/Tokyo':'Australia/Sydney',countries:[kind==='solo'?'CN':kind==='pair'?'JP':'AU']},people,places:[{id:'center',name:city+'市中心',query:city+'市中心'},{id:'riverside',name:'河畔',query:city+'河畔'}],modules:{today:true,trip:true,budget:true,prepare:true},days:[{date:'2027-04-18',city,route:['出发地',city],focus:'抵达后留一些自由时间',events:[{id:'walk',time:'下午',title:'沿河散步',detail:'根据抵达时间调整',status:'flexible',navigation:{type:'place',placeId:'riverside'}}],stayId:'hotel-1'},{date:'2027-04-19',city,route:[city,'市郊',city],events:[{id:'explore',title:'逛当地街区',navigation:{type:'place',placeId:'center'}}]}],flights:[],stays:[{id:'hotel-1',name:'待选住宿',city,checkIn:'2027-04-18',checkOut:'2027-04-20',status:'unbooked'}],packingGroups:[{id:'essentials',title:'随身物品',items:[{id:'passport',text:'证件'},{id:'cable',text:'充电线'}]}],tasks:[{id:'confirm',text:'核对出发时间'}],budget:{currencies:[{code:'CNY',name:'人民币',symbol:'¥',rateToCny:1}],items:[]}};
  if(kind!=='solo')d.flights.push({id:'outbound',people:people.map(p=>p.id),code:'',departureAt:'2027-04-17T23:00:00+08:00',arrivalAt:'2027-04-18T07:00:00+09:00',origin:{city:'上海',airport:'出发机场待补',timeZone:'Asia/Shanghai'},destination:{city,airport:'抵达机场待补',timeZone:d.trip.defaultTimeZone},status:'proposed'});
  if(kind==='group'){
    d.days.push({date:'2027-04-19',city:'墨尔本',people:['member-6'],route:['悉尼','墨尔本'],events:[{id:'early-return',title:'提前离队'}]});
    d.flights.push({id:'early-flight',people:['member-6'],date:'2027-04-19',origin:{city:'悉尼'},destination:{city:'墨尔本'},status:'proposed'});
  }
  return d;
}
