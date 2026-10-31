'use strict';
(function(scope){
 const dayNumber=s=>{if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('Date Teddy invalide.');const n=Date.parse(s+'T00:00:00Z');if(!Number.isFinite(n)||new Date(n).toISOString().slice(0,10)!==s)throw Error('Date Teddy invalide.');return n/86400000};
 const dateAfter=(start,offset)=>new Date((dayNumber(start)+offset)*86400000).toISOString().slice(0,10);
 const items=Object.freeze({
  top:[{id:'tee',name:'T-shirt rose',day:1},{id:'sweat',name:'Sweat doux',day:8},{id:'jacket',name:'Veste ivoire',day:15}],
  accessory:[{id:'none',name:'Sans accessoire',day:1},{id:'bow',name:'Nœud jaune',day:8},{id:'cap',name:'Bonnet rose',day:15},{id:'glasses',name:'Lunettes rondes',day:22},{id:'scarf',name:'Écharpe du journal',entries:3},{id:'medal',name:'Médaillon douceur',entries:7}],
  shoes:[{id:'none',name:'Pattes libres',day:1},{id:'slippers',name:'Chaussons roses',day:8},{id:'boots',name:'Bottines dorées',day:15}],
  special:[{id:'none',name:'Tenue du quotidien',day:1},{id:'gala',name:'Fête pastel',day:22},{id:'flower',name:'Jardin en fleurs',day:31},{id:'stars',name:'Douces étoiles',day:61}],
  scene:[{id:'room',name:'Chambre pastel',day:1},{id:'garden',name:'Jardin fleuri',day:8},{id:'park',name:'Parc lumineux',day:15},{id:'party',name:'Fête de fin de cycle',day:22}]
 });
 const create=date=>({version:1,startDate:date,furthestDay:1,records:[],outfit:{top:'tee',accessory:'none',shoes:'none',special:'none'},scene:'room'});
 function normalize(raw,date){
  const current=dayNumber(date);if(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.version!==1)throw Error('Sauvegarde Teddy incompatible.');
  const start=dayNumber(raw.startDate);if(start>current||start<dayNumber('2020-01-01'))throw Error('Date de départ Teddy invalide.');
  if(!Array.isArray(raw.records)||raw.records.length>10000)throw Error('Journal Teddy invalide.');
  const t=create(raw.startDate),records=new Map();
  for(const row of raw.records){const d=dayNumber(row?.date);if(d<start||d>current||!['non','oui','inconnu'].includes(row.sugar))throw Error('Réponse ou date du journal Teddy invalide.');records.set(row.date,{date:row.date,sugar:row.sugar})}
  t.records=[...records.values()].sort((a,b)=>a.date.localeCompare(b.date));
  if(!Number.isInteger(raw.furthestDay)||raw.furthestDay<1||raw.furthestDay>36525)throw Error('Progression Teddy invalide.');
  t.furthestDay=raw.furthestDay;
  for(const group of ['top','accessory','shoes','special']){const id=raw.outfit?.[group];if(!items[group].some(i=>i.id===id))throw Error('Tenue Teddy invalide.');t.outfit[group]=id}
  if(!items.scene.some(i=>i.id===raw.scene))throw Error('Décor Teddy invalide.');t.scene=raw.scene;
  for(const group of ['top','accessory','shoes','special','scene']){const id=group==='scene'?t.scene:t.outfit[group];if(!isUnlocked(t,items[group].find(i=>i.id===id)))throw Error('Élément Teddy non débloqué.');}
  return t;
 }
 function isUnlocked(t,item){return !!item&&(item.entries?t.records.length>=item.entries:t.furthestDay>=item.day)}
 function advance(t,date){const n=dayNumber(date)-dayNumber(t.startDate)+1;t.furthestDay=Math.max(t.furthestDay,Math.min(36525,n));return t}
 function status(t,date){const elapsed=Math.max(0,dayNumber(date)-dayNumber(t.startDate)),cycle=Math.floor(elapsed/30),day=elapsed%30+1,stage=day<=7?1:day<=14?2:day<=21?3:4;const start=dateAfter(t.startDate,cycle*30),end=dateAfter(start,29);return {cycle,day,stage,start,end,trophies:Math.floor(t.furthestDay/30),journal:t.records.filter(r=>r.date>=start&&r.date<=end).length,collection:['Douceur pastel','Jardin en fleurs','Douces étoiles'][cycle%3]}}
 function record(t,date,sugar){if(!['non','oui','inconnu'].includes(sugar))throw Error('Choisis une réponse pour ton journal.');if(dayNumber(date)<dayNumber(t.startDate))throw Error('Date du journal invalide.');advance(t,date);t.records=t.records.filter(r=>r.date!==date).concat([{date,sugar}]).sort((a,b)=>a.date.localeCompare(b.date));return t}
 const api=Object.freeze({items,create,normalize,advance,status,record,isUnlocked,dateAfter,dayNumber});scope.MonSuiviTeddy=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
