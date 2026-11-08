// Apple Santé (raccourci complet), coach IA et fonctions serveur — sans appel réel à Mistral.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{pathToFileURL}=require('node:url'),{chromium}=require('playwright');
const {parseHealthBundle:bundle}=require('../health-import.js');

(async()=>{
 // ---------- 1. Lecture du lien Santé
 const day='2026-11-08';
 assert.equal(bundle('#sante-pas=5&date='+day,day),null,'Ancien format laissé à l’ancien lecteur');
 assert.deepEqual(bundle('#sante=1&date='+day+'&pas=8234&poids=72,5&sommeil=7,25&kcal=420&fc=62&eau=1500&distance=5,8',day),
  {date:day,steps:8234,weight:72.5,sleep:7.3,activeKcal:420,restingHr:62,water:1500,distance:5.8});
 assert.deepEqual(bundle('#sante=1&date='+day+'&pas=8%C2%A0234&poids=&fc=',day),{date:day,steps:8234},'Espaces de Raccourcis et mesures vides acceptés');
 for(const h of ['#sante=1&pas=1','#sante=1&date=2099-01-01&pas=1','#sante=1&date='+day,'#sante=1&date='+day+'&pas=abc','#sante=1&date='+day+'&poids=5','#sante=1&date='+day+'&fc=400','#sante=1&date='+day+'&pas=1&pas=2','#sante=1&date='+day+'&date='+day+'&pas=1','#sante=1&date='+day+'&pas=-3'])
  assert.throws(()=>bundle(h,day),undefined,h);
 console.log('Santé : 7 mesures, virgules, vides, bornes et doublons OK');

 // ---------- 2. Fonctions serveur (fetch simulé)
 const load=async f=>(await import(pathToFileURL(path.resolve(f)).href+'?t='+Date.now())).default;
 const call=async(handler,req)=>{let status=0,body='';const res={set statusCode(v){status=v},get statusCode(){return status},setHeader(){},end(v){body=v||''}};
  const {Readable}=require('node:stream');const r=Readable.from(req.body?[Buffer.from(JSON.stringify(req.body))]:[]);Object.assign(r,{method:req.method||'POST',headers:req.headers||{host:'site.test'},socket:{remoteAddress:req.ip||'1.1.1.1'}});
  await handler(r,res);return {status,json:body?JSON.parse(body):null}};
 const oldFetch=global.fetch;let sent=null;
 global.fetch=async(url,opt)=>{sent={url,body:JSON.parse(opt.body)};return {ok:true,status:200,json:async()=>({choices:[{message:{content:sent.body.response_format?JSON.stringify({name:'Alloco',grams:200,kcal100g:'240',protein:2,carbs:31,fat:12,items:[{name:'banane plantain frite',grams:200}],tip:'Accompagne de légumes.',confidence:'haute'}):'**Ce soir** : poisson braisé et légumes.\n- Boire de l’eau'}}]})}};
 process.env.MISTRAL_API_KEY='test-key';process.env.COACH_DAILY_LIMIT='3';
 try{
  const coach=await load('api/coach.js');
  let r=await call(coach,{body:{messages:[{role:'user',content:'Que manger ce soir ?'}],context:'Pas aujourd’hui : 8234'},headers:{host:'site.test',origin:'https://site.test'}});
  assert.equal(r.status,200);assert.match(r.json.reply,/poisson braisé/);
  assert.equal(sent.body.messages[0].role,'system');assert.match(sent.body.messages[0].content,/pas médecin/);assert.match(sent.body.messages[0].content,/Pas aujourd’hui : 8234/);
  r=await call(coach,{body:{messages:[{role:'user',content:'x'}]},headers:{host:'site.test',origin:'https://pirate.example'}});assert.equal(r.status,403,'Autre site refusé');
  r=await call(coach,{body:{messages:[{role:'assistant',content:'x'}]},headers:{host:'site.test'}});assert.equal(r.status,400,'Le dernier message doit venir de la personne');
  for(let i=0;i<3;i++)r=await call(coach,{body:{messages:[{role:'user',content:'q'+i}]},headers:{host:'site.test'},ip:'2.2.2.'+i});
  assert.equal(r.status,429,'Quota du jour respecté');assert.equal(r.json.error,'quota');
  const photo=await load('api/photo.js');
  r=await call(photo,{body:{image:'data:image/jpeg;base64,AAAA'},headers:{host:'site.test'}});
  assert.equal(r.status,200);assert.equal(r.json.kcal100g,240);assert.equal(r.json.items[0].name,'banane plantain frite');assert.equal(sent.body.response_format.type,'json_object');
  r=await call(photo,{body:{image:'data:text/html;base64,AAAA'},headers:{host:'site.test'}});assert.equal(r.status,400,'Seules les images sont acceptées');
 }finally{global.fetch=oldFetch;delete process.env.MISTRAL_API_KEY;delete process.env.COACH_DAILY_LIMIT}
 console.log('Serveur : garde-fous, origine, format, quota et analyse photo OK');

 // ---------- 3. Application : import Santé, carte du jour, coach
 const browser=await chromium.launch({headless:true});
 try{for(const width of [320,393,430]){
  const page=await browser.newPage({viewport:{width,height:852},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8765/';
  await page.goto(base);await page.evaluate(()=>{data={...blank(),consent:true,name:'Awa'};save();go('Aujourd’hui')});
  const today=await page.evaluate(()=>today());
  await page.evaluate(d=>{location.hash='sante=1&date='+d+'&pas=8234&poids=72,5&sommeil=7,2&kcal=420&fc=62&eau=1500&distance=5,8'},today);
  await page.locator('#health-import-message').waitFor();
  assert.match(await page.locator('#health-import-message').textContent(),/8.?234 pas.*72,5 kg.*7,2 h de sommeil/);
  assert.match(await page.locator('.health-today-card').textContent(),/Sommeil7,2 h.*420 kcal.*62 bpm.*1,5 L.*5,8 km/);
  assert.equal(await page.evaluate(()=>location.hash),'','Données retirées de l’adresse');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('mon-suivi-v1')));
  assert.equal(saved.steps[0].value,8234);assert.equal(saved.weights[0].source,'sante-raccourcis');assert.equal(saved.health[0].restingHr,62);
  // Saisie manuelle différente : choix demandé
  await page.evaluate(d=>{data.steps=[{id:'m',date:d,value:1000}];save();location.hash='sante=1&date='+d+'&pas=5000'},today);
  await page.locator('[data-health-action="health-accept"]').waitFor();await page.locator('[data-health-action="health-accept"]').click();
  assert.equal(await page.evaluate(()=>data.steps[0].value),5000);
  await page.screenshot({path:'screenshots/sante-'+width+'.png',fullPage:true});
  // Coach
  const posts=[];
  await page.route('**/api/coach',async route=>{posts.push(JSON.parse(route.request().postData()));await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,reply:'**Ce soir** : poisson braisé, attiéké et légumes.\n- Un grand verre d’eau\n- <img src=x onerror=alert(1)>',left:99})})});
  await page.evaluate(()=>go('Aujourd’hui'));await page.locator('.coach-entry').click();
  await page.locator('#coach-consent-form').waitFor();
  await page.locator('#coach-consent-form button[type="submit"]').click();
  assert.match(await page.locator('#coach-consent-error').textContent(),/Coche/);
  await page.locator('#coach-consent-form input[name="agree"]').check();await page.locator('#coach-consent-form button[type="submit"]').click();
  await page.locator('[data-coach-ask="Que manger ce soir ?"]').click();
  await page.locator('.coach-bot strong').filter({hasText:'Ce soir'}).waitFor();
  assert.equal(await page.locator('.coach-msg img').count(),0,'Réponse IA sans HTML exécutable');
  assert.match(await page.locator('.coach-log').textContent(),/<img src=x/,'Le texte reste lisible, échappé');
  assert.equal(posts.length,1);assert.equal(posts[0].messages.at(-1).content,'Que manger ce soir ?');
  assert.match(posts[0].context,/Pas aujourd’hui : 5000/);assert.doesNotMatch(posts[0].context,/Awa/,'Prénom jamais envoyé');
  await page.locator('#coach-input').fill('Et demain matin ?');await page.locator('#coach-input').press('Enter');
  await page.waitForFunction(()=>document.querySelectorAll('.coach-me').length===2);
  assert.equal(posts[1].messages.length,3,'Historique envoyé');
  await page.locator('[data-coach-share]').uncheck();await page.locator('#coach-input').fill('Merci');await page.locator('#coach-form button[type="submit"]').click();
  await page.waitForFunction(()=>document.querySelectorAll('.coach-me').length===3);
  assert.equal(posts[2].context,'','Plus de résumé après décochage');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'Pas de débordement');
  await page.screenshot({path:'screenshots/coach-'+width+'.png',fullPage:true});
  await page.reload();await page.evaluate(()=>go('Coach'));await page.locator('.coach-me').first().waitFor();
  assert.equal(await page.locator('.coach-me').count(),3,'Discussion conservée sur l’appareil');
  page.once('dialog',d=>d.accept());await page.locator('[data-coach-clear]').click();
  assert.equal(await page.locator('.coach-me').count(),0);
  await page.locator('[data-coach-revoke]').click();await page.locator('#coach-consent-form').waitFor();
  // Erreur serveur lisible
  await page.unroute('**/api/coach');await page.route('**/api/coach',r=>r.fulfill({status:503,contentType:'application/json',body:'{"ok":false,"error":"config"}'}));
  await page.locator('#coach-consent-form input[name="agree"]').check();await page.locator('#coach-consent-form button[type="submit"]').click();
  await page.locator('[data-coach-ask="Un goûter sain ?"]').click();await page.locator('.coach-err').waitFor();
  assert.match(await page.locator('.coach-err').textContent(),/clé Mistral/);
  // Effacement complet
  await page.evaluate(()=>go('Profil'));page.once('dialog',d=>d.accept());await page.locator('[data-action="clear"]').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('mon-suivi-v1-coach')),null);
  assert.deepEqual(errors,[]);await page.close();
  console.log('App '+width+'px : import Santé complet, choix des pas, coach, accord, échappement, contexte sans prénom, erreurs et effacement OK');
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
