'use strict';
(function(scope){
 // Ancien format : #sante-pas=NOMBRE&date=AAAA-MM-JJ (pas uniquement, entier strict).
 function parseHealthImport(hash,currentDay){
  const params=new URLSearchParams(String(hash||'').replace(/^#/,''));
  if(!params.has('sante-pas'))return null;
  if(params.getAll('sante-pas').length!==1||params.getAll('date').length!==1)throw Error('Le lien doit contenir un seul total et la date du jour. Relance le raccourci.');
  const raw=params.get('sante-pas'),date=params.get('date');
  if(!/^(0|[1-9][0-9]{0,5})$/.test(raw||'')||String(Number(raw))!==raw)throw Error('Le total reçu doit être un nombre entier de pas, sans séparateur.');
  const value=Number(raw);
  if(value>200000)throw Error('Le total reçu dépasse la limite de 200 000 pas. Vérifie le raccourci.');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||date!==currentDay)throw Error('La date reçue ne correspond pas à aujourd’hui. Relance le raccourci avec la date locale du jour.');
  return {value,date};
 }
 // Nouveau format (raccourci « Mon Suivi — Santé ») :
 // #sante=1&date=AAAA-MM-JJ&pas=8234&poids=72,5&sommeil=7,2&kcal=420&fc=62&eau=1500&distance=5,8
 // Chaque mesure est facultative ; au moins une est requise. Les virgules décimales et espaces de Raccourcis sont acceptés.
 const FIELDS={
  pas:{key:'steps',min:0,max:200000,dec:0,label:'pas'},
  poids:{key:'weight',min:20,max:400,dec:2,label:'poids (kg)'},
  sommeil:{key:'sleep',min:0,max:24,dec:1,label:'sommeil (heures)'},
  kcal:{key:'activeKcal',min:0,max:10000,dec:0,label:'calories actives'},
  fc:{key:'restingHr',min:25,max:220,dec:0,label:'fréquence cardiaque au repos'},
  eau:{key:'water',min:0,max:10000,dec:0,label:'eau (ml)'},
  distance:{key:'distance',min:0,max:300,dec:2,label:'distance (km)'}
 };
 function number(raw){
  const s=String(raw).replace(/[\s  ]/g,'').replace(',','.');
  if(!/^\d{1,7}(\.\d{1,4})?$/.test(s))return NaN;
  return Number(s);
 }
 function parseHealthBundle(hash,currentDay){
  const params=new URLSearchParams(String(hash||'').replace(/^#/,''));
  if(!params.has('sante'))return null;
  if(params.getAll('date').length!==1)throw Error('Le lien doit contenir la date du jour une seule fois. Relance le raccourci.');
  const date=params.get('date');
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||date!==currentDay)throw Error('La date reçue ne correspond pas à aujourd’hui. Relance le raccourci avec la date locale du jour.');
  const out={date};let count=0;
  for(const [name,f] of Object.entries(FIELDS)){
   const all=params.getAll(name);
   if(!all.length)continue;
   if(all.length>1)throw Error('La mesure « '+f.label+' » est présente deux fois. Vérifie le raccourci.');
   const rawValue=all[0].trim();
   if(rawValue==='')continue; // mesure absente ce jour-là dans Santé
   const n=number(rawValue);
   if(!Number.isFinite(n))throw Error('La valeur reçue pour « '+f.label+' » n’est pas un nombre.');
   if(n<f.min||n>f.max)throw Error('La valeur reçue pour « '+f.label+' » semble anormale ('+rawValue+'). Vérifie le raccourci.');
   const p=Math.pow(10,f.dec);out[f.key]=Math.round(n*p)/p;count++;
  }
  if(!count)throw Error('Aucune mesure reçue. Vérifie que le raccourci a bien accès à Santé.');
  return out;
 }
 scope.MonSuiviHealth=Object.freeze({parseHealthImport,parseHealthBundle});
 if(typeof module!=='undefined')module.exports={parseHealthImport,parseHealthBundle};
})(globalThis);
