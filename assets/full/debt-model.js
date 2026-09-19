(function(root){
 function calculate(rows,settlements,key,people){return Object.keys(people).filter(other=>other!==key).map(other=>{let cents=0,approx=false;for(const row of rows){if(!row.payerConfirmed||row.paymentStatus==='unpaid')continue;const delta=row.payer===other?(row.shares[key]||0):row.payer===key?-(row.shares[other]||0):0;cents+=delta;if(delta&&row.currency!=='CNY')approx=true;}for(const item of settlements){if(item.from===key&&item.to===other)cents-=item.cents;if(item.from===other&&item.to===key)cents+=item.cents;}return {person:other,cents,approx};}).filter(item=>item.cents>0);}
 function acceptSnapshot(previous,payload){return Array.isArray(payload?.items)?payload.items:previous;}
 root.TripDebt={calculate,acceptSnapshot};
})(globalThis);
