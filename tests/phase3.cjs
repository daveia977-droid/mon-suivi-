const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 try{for(const width of [320,393,430]){
  const page=await browser.newPage({viewport:{width,height:852},isMobile:true,hasTouch:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.TEST_BASE_URL||'http://127.0.0.1:8765/');
  await page.evaluate(()=>{data={...blank(),consent:true,stepsGoal:8500,steps:[{id:'manual',date:today(),value:1234}]};save();go('Activité')});
  await page.locator('[data-action="sante-help"]').click();
  await page.locator('#health-guide-title').waitFor();
  assert.equal(await page.locator('.health-guide button:disabled').count(),1);
  await page.screenshot({path:'screenshots/phase3-guide-'+width+'.png',fullPage:true});
  for(const step of [1,2]){await page.locator('[data-health-step="'+step+'"]').click();assert.equal(await page.locator('#dialog').evaluate(e=>e.scrollWidth<=e.clientWidth),true)}
  await page.locator('[data-health-manual]').click();
  assert.equal(await page.locator('#dialog input').count()>0,true);
  await page.locator('#dialog [data-action="close"]').click();
  await page.evaluate(()=>{location.hash='sante-pas=4321&date='+today()});
  await page.locator('[data-health-action="health-cancel"]').click();
  assert.equal(await page.evaluate(()=>data.steps[0].value),1234);
  await page.evaluate(()=>{location.hash='date='+today()+'&sante-pas=4321'});
  await page.locator('[data-health-action="health-accept"]').click();
  assert.equal(await page.evaluate(()=>data.steps[0].value),4321);
  assert.equal(await page.evaluate(()=>data.stepsGoal),8500);
  await page.evaluate(()=>{location.hash='sante-pas=4321&date='+today()});
  await page.waitForFunction(()=>location.hash==='');
  assert.equal(await page.evaluate(()=>data.steps.length),1);
  await page.evaluate(()=>{location.hash='sante-pas=9999'});
  await page.locator('#health-import-message[role="alert"]').waitFor();
  assert.equal(await page.evaluate(()=>data.steps[0].value),4321);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:'screenshots/phase3-'+width+'.png',fullPage:true});
  assert.deepEqual(errors,[]);await page.close();console.log('Phase 3 '+width+'px : aide, saisie manuelle, confirmation, déduplication, objectif conservé OK');
 }}finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
