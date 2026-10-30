const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 try{
  fs.mkdirSync('screenshots',{recursive:true});
  for(const width of [320,393,430]){
   const page=await browser.newPage({viewport:{width,height:852},isMobile:true,hasTouch:true});
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:8765/');
   await page.evaluate(()=>{
    data={...blank(),name:'Test',consent:true,weights:[{id:'weight',date:today(),value:70}],meals:[{id:'repeat-test',date:today(),name:'Mon déjeuner',quantity:'1 portion',value:450,protein:20,carbs:40,fat:15}],moods:[{id:'mood',date:today(),name:'Bien',note:''}],steps:[{id:'steps',date:today(),value:3500}]};data=validatePayload(data);save();go('Repas');
   });
   await page.locator('.mealguide-root').waitFor();
   const preserved=await page.evaluate(()=>JSON.stringify([data.weights,data.meals,data.moods,data.steps]));
   await page.locator('[data-guide-action="repeat:repeat-test"]').click();
   assert.equal(await page.locator('#entry-form input[name="name"]').inputValue(),'Mon déjeuner');
   assert.equal(await page.locator('#entry-form input[name="value"]').inputValue(),'450');
   assert.equal(await page.evaluate(()=>data.meals.length),1,'Répétition soumise à enregistrement explicite');
   await page.locator('#dialog [data-action="close"]').click();
   await page.locator('[data-guide-action="recipe:attieke-poisson"]').click();
   await page.locator('#mg-servings').selectOption('2');
   assert.match(await page.locator('.mg-ingredient-list').textContent(),/300 g/);
   await page.locator('#mg-servings').selectOption('3');
   assert.match(await page.locator('.mg-ingredient-list').textContent(),/Oignon · 0,75/);
   assert.ok(await page.locator('.mg-prep li').count()>=4,'Préparation détaillée');
   await page.locator('[data-guide-action="favorite:attieke-poisson"]').click();
   assert.equal(await page.locator('.mg-favorite').getAttribute('aria-pressed'),'true');
   await page.locator('#dialog .mg-close').click();
   await page.locator('[data-guide-action="favorites"]').click();
   assert.equal(await page.locator('#mg-card-list .mg-recipe-card').count(),1);
   await page.reload();
   await page.locator('[data-action="start"]').click();
   await page.locator('nav [data-action="go:Repas"]').click();
   assert.deepEqual(await page.evaluate(()=>data.recipeFavorites),['attieke-poisson']);
   assert.equal(await page.evaluate(()=>JSON.stringify([data.weights,data.meals,data.moods,data.steps])),preserved);
   await page.locator('[data-guide-action="category:all"]').click();
   await page.locator('[data-guide-action="meal:all"]').click();
   await page.locator('#mg-max-minutes').selectOption('20');
   await page.locator('#mg-exclude').fill('œuf');
   assert.equal(await page.locator('[data-guide-action="recipe:omelette-legumes"]').count(),0);
   await page.locator('#mg-exclude').fill('oeuf, arachide');
   assert.equal(await page.locator('[data-guide-action="recipe:omelette-legumes"]').count(),0,'Recherche sans ligature œ');
   await page.locator('#mg-max-minutes').selectOption('0');
   await page.locator('#mg-exclude').fill('');
   await page.locator('#mg-recipe-search').fill('kedjenou poulet');
   await page.locator('[data-guide-action="recipe:kedjenou-poulet"]').click();
   await page.waitForFunction(()=>{const i=document.querySelector('#dialog .mg-img');return i&&i.complete&&i.naturalWidth>0});
   assert.equal(await page.locator('#dialog .mg-img').evaluate(i=>i.getAttribute('src')),'./photos/kedjenou-poulet.jpg');
   assert.match(await page.locator('#dialog .mg-photo-credit').textContent(),/CC BY/);
   await page.screenshot({path:'screenshots/phase2-kedjenou-'+width+'.png',fullPage:true});
   await page.locator('#dialog .mg-img').evaluate(i=>{i.src='./photos/missing-test-image.jpg'});
   await page.waitForFunction(()=>document.querySelector('#dialog .mg-img').src.endsWith('/food-placeholder.svg'));
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.locator('#dialog .mg-close').click();
   await page.locator('[data-guide-action="section:alternatives"]').click();
   assert.equal(await page.locator('.mg-alt-card').count(),15);
   await page.locator('[data-guide-action="alternative:chips"]').click();
   assert.match(await page.locator('#dialog').textContent(),/Préparation/);
   await page.screenshot({path:'screenshots/phase2-alternatives-'+width+'.png',fullPage:true});
   assert.deepEqual(errors,[]);
   console.log('Phase 2 '+width+' px : favoris persistants, anciennes données, portions, filtres, repas récents, kédjénou et secours image OK');
   await page.close();
  }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
