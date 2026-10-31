'use strict';
(function(scope){
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
 scope.MonSuiviHealth=Object.freeze({parseHealthImport});
 if(typeof module!=='undefined')module.exports={parseHealthImport};
})(globalThis);
