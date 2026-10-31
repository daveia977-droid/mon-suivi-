const assert=require('node:assert/strict'),M=require('../teddy-model.js');
const start='2026-03-20',t=M.create(start);
for(const [day,stage] of [[1,1],[7,1],[8,2],[14,2],[15,3],[21,3],[22,4],[30,4],[31,1],[60,4],[61,1]]){
 const date=M.dateAfter(start,day-1);M.advance(t,date);const s=M.status(t,date);assert.equal(s.day,(day-1)%30+1);assert.equal(s.stage,stage);assert.equal(s.cycle,Math.floor((day-1)/30));assert.equal(s.trophies,Math.floor(day/30));
}
assert.equal(M.dayNumber('2026-03-30')-M.dayNumber('2026-03-29'),1,'Changement heure été : un jour civil');
assert.equal(M.dayNumber('2026-10-26')-M.dayNumber('2026-10-25'),1,'Changement heure hiver : un jour civil');
const journal=M.create(start);for(const [i,sugar] of ['oui','non','inconnu'].entries())M.record(journal,M.dateAfter(start,i),sugar);
assert.equal(journal.records.length,3);assert.equal(M.isUnlocked(journal,M.items.accessory.find(i=>i.id==='scarf')),true);
M.record(journal,start,'inconnu');assert.equal(journal.records.length,3);assert.equal(journal.records[0].sugar,'inconnu');
assert.equal(M.isUnlocked(journal,M.items.top.find(i=>i.id==='jacket')),false);assert.throws(()=>M.normalize({...journal,outfit:{...journal.outfit,top:'jacket'}},'2026-04-01'));
M.advance(journal,M.dateAfter(start,30));journal.outfit.top='jacket';journal.scene='party';const saved=JSON.stringify(journal),restored=M.normalize(JSON.parse(saved),M.dateAfter(start,30));
assert.equal(restored.outfit.top,'jacket');assert.equal(restored.records.length,3);assert.equal(M.status(restored,M.dateAfter(start,30)).stage,1);assert.equal(M.status(restored,M.dateAfter(start,30)).trophies,1);
M.advance(restored,start);assert.equal(restored.furthestDay,31,'Un recul de date ne retire aucune récompense');
assert.throws(()=>M.record(journal,start,null));assert.throws(()=>M.normalize({...journal,records:[{date:'2026-02-30',sugar:'oui'}]},'2026-04-20'));
assert.throws(()=>M.normalize({...journal,startDate:'2099-01-01'},'2026-04-20'));
console.log('Teddy : étapes 7/8, 14/15, 21/22, cycles 30/31/60/61, heure locale, réponses égales, collection et sauvegarde OK');
