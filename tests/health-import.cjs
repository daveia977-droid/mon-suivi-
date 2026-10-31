const assert=require('node:assert/strict');
const {parseHealthImport:parse}=require('../health-import.js');
const day='2026-10-31';
assert.equal(parse('#autre=1',day),null);
for(const value of [0,1,6432,200000])assert.deepEqual(parse('#date='+day+'&sante-pas='+value,day),{value,date:day});
for(const hash of ['#sante-pas=1','#sante-pas=-1&date='+day,'#sante-pas=1.2&date='+day,'#sante-pas=01&date='+day,'#sante-pas=200001&date='+day,'#sante-pas=2%0A&date='+day,'#sante-pas=1&date=2099-01-01','#sante-pas=1&sante-pas=2&date='+day,'#sante-pas=1&date='+day+'&date='+day])assert.throws(()=>parse(hash,day),undefined,hash);
console.log('Santé : entier borné, date obligatoire, ordre libre et doublons refusés OK');
