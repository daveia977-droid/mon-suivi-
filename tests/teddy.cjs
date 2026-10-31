const assert=require('node:assert/strict'),fs=require('node:fs'),{chromium}=require('playwright');
(async()=>{fs.mkdirSync('screenshots',{recursive:true});const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
try{for(const width of [320,393,430]){
 const page=await browser.newPage({viewport:{width,height:852},isMobile:true,hasTouch:true,timezoneId:'Europe/Paris',acceptDownloads:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-03-20T11:00:00Z')});
 await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:8765/');
 await page.evaluate(()=>{data=validatePayload({name:'Ancien suivi',consent:true,weights:[{id:'old-w',date:today(),value:70}],meals:[{id:'old-m',date:today(),name:'Déjeuner',quantity:'1 portion',value:450}],moods:[],steps:[{id:'old-s',date:today(),value:5000}]});save();go('Progrès')});
 await page.locator('#v4-statistics').waitFor();assert.equal(await page.evaluate(()=>data.teddy),null);
 await page.locator('[data-v4="stats-7"]').click();assert.match(await page.locator('#v4-statistics h2').textContent(),/7 jours/);
 assert.match(await page.locator('.bilan-measure').textContent(),/70/);assert.match(await page.locator('.bilan-metrics').textContent(),/5.?000/);
 await page.screenshot({path:'screenshots/bilan-teddy-'+width+'.png',fullPage:true});
 await page.locator('[data-teddy="open"]').click();await page.locator('[data-teddy="start"]').click();
 assert.equal(await page.locator('#nav button').count(),5);assert.equal(await page.locator('#nav [aria-current="page"]').textContent(),'Progrès');
 assert.match(await page.locator('.teddy-screen>.td-scene').getAttribute('aria-label'),/étape 1/);
 await page.locator('[data-teddy="journal"]').click();assert.equal(await page.evaluate(()=>data.teddy.records.length),0);
 assert.equal(await page.locator('#td-journal-form input:checked').count(),0);
 await page.locator('#td-journal-form input[value="oui"]').check();await page.locator('#td-journal-form select').selectOption('Bien');
 await page.locator('#td-journal-form button[type="submit"]').click();assert.equal(await page.evaluate(()=>data.teddy.records.length),1);
 await page.locator('[data-teddy="journal"]').click();await page.locator('#td-journal-form input[value="inconnu"]').check();await page.locator('#td-journal-form button[type="submit"]').click();
 assert.equal(await page.evaluate(()=>data.teddy.records.length),1);assert.equal(await page.evaluate(()=>data.moods.length),1);
 for(const offset of [1,2]){await page.clock.setFixedTime(new Date('2026-03-'+(20+offset)+'T11:00:00Z'));await page.evaluate(()=>MonSuiviTeddyUI.open());await page.locator('[data-teddy="journal"]').click();await page.locator('#td-journal-form input[value="non"]').check();await page.locator('#td-journal-form button[type="submit"]').click()}
 await page.evaluate(()=>{data.moodReminder={enabled:true,time:'00:00'};save();document.dispatchEvent(new Event('visibilitychange'))});assert.equal(await page.locator('#v4-mood-prompt').count(),0,'Un bilan rempli sans humeur facultative ne redemande pas une réponse');await page.evaluate(()=>{data.moodReminder.enabled=false;save()});
 await page.locator('[data-teddy="wardrobe"]').click();await page.locator('[data-teddy="tab:accessory"]').click();assert.equal(await page.locator('[data-teddy="choose:accessory:scarf"]').isDisabled(),false);assert.equal(await page.locator('[data-teddy="choose:accessory:glasses"]').isDisabled(),true);
 for(const [day,stage] of [[7,1],[8,2],[14,2],[15,3],[21,3],[22,4],[30,4],[31,1],[61,1]]){
  const date=await page.evaluate(d=>MonSuiviTeddy.dateAfter(data.teddy.startDate,d-1),day);await page.clock.setFixedTime(new Date(date+'T11:00:00Z'));await page.evaluate(()=>MonSuiviTeddyUI.open());
  assert.match(await page.locator('.teddy-screen>.td-scene').getAttribute('aria-label'),new RegExp('étape '+stage));
  if(day===8){await page.locator('[data-teddy="wardrobe"]').click();await page.locator('[data-teddy="choose:top:sweat"]').click();await page.locator('[data-teddy="tab:accessory"]').click();await page.locator('[data-teddy="choose:accessory:bow"]').click();await page.locator('[data-teddy="scenes"]').click();await page.locator('[data-teddy="choose:scene:garden"]').click();await page.screenshot({path:'screenshots/teddy-wardrobe-'+width+'.png',fullPage:true})}
  if(day===22){await page.locator('[data-teddy="wardrobe"]').click();await page.locator('[data-teddy="tab:special"]').click();await page.locator('[data-teddy="choose:special:gala"]').click();await page.screenshot({path:'screenshots/teddy-stage4-'+width+'.png',fullPage:true})}
  if(day===30){await page.locator('.td-celebration').waitFor();assert.equal(await page.evaluate(()=>MonSuiviTeddy.status(data.teddy,today()).trophies),1)}
  if(day===31){assert.equal(await page.evaluate(()=>data.teddy.outfit.top),'sweat');assert.equal(await page.evaluate(()=>data.teddy.scene),'garden')}
 }
 await page.locator('[data-teddy="wardrobe"]').click();await page.locator('[data-teddy="reset"]').click();assert.equal(await page.evaluate(()=>data.teddy.outfit.top),'tee');assert.equal(await page.evaluate(()=>data.teddy.records.length),3);assert.equal(await page.evaluate(()=>MonSuiviTeddy.status(data.teddy,today()).trophies),2);
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.reload();await page.locator('[data-action="start"]').click();await page.locator('#nav [data-action="go:Progrès"]').click();await page.locator('[data-teddy="open"]').click();
 assert.equal(await page.evaluate(()=>data.teddy.records.length),3);assert.equal(await page.evaluate(()=>data.weights[0].value),70);assert.equal(await page.evaluate(()=>data.meals[0].value),450);
 await page.evaluate(()=>{Object.defineProperty(navigator,'canShare',{value:()=>false,configurable:true});go('Profil')});const promise=page.waitForEvent('download');await page.locator('[data-action="export"]').click();const download=await promise,exportPath=await download.path(),payload=JSON.parse(fs.readFileSync(exportPath,'utf8'));assert.equal(payload.teddy.scene,'garden');
 await page.evaluate(()=>{data.teddy=null;save();go('Profil')});await page.locator('#import-file').setInputFiles({name:'mon-suivi-teddy.json',mimeType:'application/json',buffer:fs.readFileSync(exportPath)});await page.locator('[data-action="confirm-import"]').click();assert.equal(await page.evaluate(()=>data.teddy.records.length),3);
 const currentDate=await page.evaluate(()=>today());await page.clock.setFixedTime(new Date(currentDate+'T18:30:00Z'));
 await page.evaluate(()=>{data.moods.push({id:'already-noted',date:today(),name:'Bien',note:''});data.moodReminder={enabled:true,time:'20:00'};save();document.dispatchEvent(new Event('visibilitychange'))});
 assert.equal(await page.locator('#v4-mood-prompt .v4-mood-choices').count(),0,'Le journal reste proposé même si l’humeur est déjà notée');
 await page.locator('#v4-mood-prompt [data-v4="teddy-journal"]').click();assert.equal(await page.evaluate(()=>data.teddy.records.length),3);
 await page.locator('#td-journal-form input[value="oui"]').check();const nextDay=await page.evaluate(()=>MonSuiviTeddy.dateAfter(today(),1));await page.clock.setFixedTime(new Date(nextDay+'T11:00:00Z'));
 await page.locator('#td-journal-form button[type="submit"]').click();await page.locator('#td-journal-error').waitFor();assert.match(await page.locator('#td-journal-error').textContent(),/journée a changé/);assert.equal(await page.evaluate(()=>data.teddy.records.length),3);
 await page.locator('#dialog [data-action="close"]').click();await page.evaluate(()=>{data.moodReminder.enabled=false;save();go('Profil')});
 const calendarPromise=page.waitForEvent('download');await page.locator('[data-v4="calendar"]').click();const calendar=await calendarPromise,calendarPath=await calendar.path();assert.match(fs.readFileSync(calendarPath,'utf8'),/URL:https:\/\/mon-suivi-six.vercel.app\/#teddy/);
 const archiveDate=await page.evaluate(()=>MonSuiviTeddy.dateAfter(data.teddy.startDate,390));await page.clock.setFixedTime(new Date(archiveDate+'T11:00:00Z'));await page.evaluate(()=>MonSuiviTeddyUI.open());await page.locator('#td-history summary').click();await page.locator('[data-teddy="history-next"]').click();assert.match(await page.locator('#td-history .td-history strong').textContent(),/Cycle 1$/);await page.locator('[data-teddy="history-prev"]').click();assert.equal(await page.locator('#td-history .td-history').count(),12);
 await page.evaluate(()=>go('Profil'));
 await page.locator('.settings-list [data-action="go:Confidentialité"]').click();await page.locator('.legal-editorial').waitFor();assert.match(await page.locator('.legal-editorial').textContent(),/Les photos personnelles|photos personnelles/);assert.equal(await page.locator('.legal-block h2').count()>5,true);
 await page.evaluate(()=>go('Teddy'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await page.screenshot({path:'screenshots/teddy-final-'+width+'.png',fullPage:true});
 await page.evaluate(()=>navigator.serviceWorker.ready);await page.reload();await page.context().setOffline(true);await page.reload();await page.locator('[data-action="start"]').click();await page.evaluate(()=>go('Teddy'));await page.locator('.teddy-screen>.td-scene').waitFor();assert.equal(await page.evaluate(()=>data.teddy.records.length),3);await page.context().setOffline(false);
 assert.deepEqual(errors,[]);await page.close();console.log('Teddy '+width+'px : démarrage, journal explicite, vêtements/décors, cycles, trophées, export/import, anciennes données, pages et hors ligne OK');
}}finally{await browser.close()}})().catch(e=>{console.error(e);process.exit(1)});
