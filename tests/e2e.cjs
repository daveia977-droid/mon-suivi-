// Tests visuels dans un vrai Chromium ; l'essai manuel sur iPhone reste recommandé.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

(async()=>{
 const browser=await chromium.launch({headless:true});
 const base='http://127.0.0.1:8765/';
 fs.mkdirSync('screenshots',{recursive:true});
 const sizes=[{width:393,height:852},{width:320,height:700},{width:430,height:932}];
 for(const size of sizes){
  const page=await browser.newPage({viewport:size,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'load'});
  assert.ok(await page.locator('.welcome').count(),'Écran d’accueil public affiché');
  await page.locator('button[data-action="demo"]').click();
  await page.locator('.hero-summary').waitFor();
  assert.ok(await page.locator('.hero-donut').count(),'Anneau de progression');
  assert.equal(await page.locator('.home-metrics .mini-metric').count(),3,'3 cartes compactes');
  assert.equal(await page.locator('.mood-tile').count(),4,'4 humeurs');
  const noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2);
  assert.ok(noOverflow,'Aucun débordement horizontal '+size.width+'px');
  await page.screenshot({path:'screenshots/home-'+size.width+'.png',fullPage:true});
  await page.locator('nav#nav button[data-action="go:Repas"]').click();
  await page.locator('.meals-screen .compact-add').waitFor();
  const add=page.locator('.meals-screen .compact-add');
  const box=await add.boundingBox();
  assert.ok(box && box.width<160 && box.height>=44,'Bouton Ajouter compact et tactile');
  await page.screenshot({path:'screenshots/meals-'+size.width+'.png',fullPage:true});
  await add.click();
  await page.locator('#dialog .mode-tabs').waitFor();
  await page.locator('#dialog button[data-action="mealmode:photo"]').click();
  await page.locator('#dialog .photo-pick').waitFor();
  await page.locator('#dialog button[data-action="close"]').click();
  await page.locator('nav#nav button[data-action="go:Profil"]').click();
  const backups=page.locator('.backup-btn');
  assert.equal(await backups.count(),2,'Exporter/Importer côte à côte');
  for(let i=0;i<2;i++){const b=await backups.nth(i).boundingBox();assert.ok(b && b.width<185 && b.height>=44,'Bouton sauvegarde compact mais accessible')}
  assert.equal(await page.locator('.profile-screen .delete-link').count(),1);
  await page.screenshot({path:'screenshots/profile-'+size.width+'.png',fullPage:true});
  assert.deepEqual(errors,[],'Aucune erreur JavaScript '+size.width+'px : '+errors.join('; '));
  await page.close();
  console.log('Responsive '+size.width+'px : accueil, repas, photo, profil OK');
 }
 await browser.close();
})().catch(err=>{console.error(err);process.exitCode=1});
