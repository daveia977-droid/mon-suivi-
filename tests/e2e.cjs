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
  assert.ok(await page.locator('.premium-welcome').count(),'Écran d’accueil public premium affiché');
  await page.screenshot({path:'screenshots/welcome-'+size.width+'.png',fullPage:true});
  await page.locator('button[data-action="demo"]').click();
  await page.locator('.hero-summary').waitFor();
  assert.ok(await page.locator('.hero-donut').count(),'Anneau de progression');
  assert.equal(await page.locator('.home-metrics .mini-metric').count(),3,'3 cartes compactes');
  assert.equal(await page.locator('.mood-tile').count(),4,'4 humeurs');
  const noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+2);
  assert.ok(noOverflow,'Aucun débordement horizontal '+size.width+'px');
  await page.screenshot({path:'screenshots/home-'+size.width+'.png',fullPage:true});
  await page.locator('nav#nav button[data-action="go:Activité"]').click();
  await page.locator('.activity-hero-card').waitFor();
  assert.equal(await page.locator('.steps-bar-column').count(),7,'7 barres pour les pas de la semaine');
  assert.equal(await page.locator('.health-sync-card').count(),1,'Carte de configuration Santé');
  await page.locator('button[data-action="sante-help"]').click();
  assert.match(await page.locator('#dialog').textContent(),/Raccourcis/);
  await page.locator('#dialog button[data-action="close"]').click();
  await page.screenshot({path:'screenshots/activity-'+size.width+'.png',fullPage:true});
  await page.locator('nav#nav button[data-action="go:Progrès"]').click();
  await page.locator('.weight-hero-card').waitFor();
  assert.ok(await page.locator('.weight-chart-card').count(),'Courbe de poids premium');
  assert.equal(await page.locator('.progress-trophy').count(),1,'Carte trophée dans Progrès');
  assert.match(await page.locator('.progress-trophy h2').textContent(),/objectif/i,'Encouragement lié à la progression');
  assert.equal(await page.locator('.weight-goal-card').count(),1,'Objectif toujours modifiable');
  await page.screenshot({path:'screenshots/progress-'+size.width+'.png',fullPage:true});
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
  // Chemin post-analyse photo : sans appeler le serveur IA ni exposer une photo.
  await page.evaluate(()=>{
    offPicked={code:'',name:'Chips de pommes de terre',brand:'',kcal:540,protein:null,carbs:null,fat:null,source:'photo',nutri:null,cats:[]};
    photoAI={grams:30,confidence:'faible'};
    mealMode='confirm';renderMealDialog();
  });
  await page.locator('#dialog .photo-alt-panel').waitFor();
  assert.match(await page.locator('#dialog .photo-alt-list').textContent(),/Pop-corn nature maison/,'Alternative aux chips proposée');
  await page.locator('#dialog input[name="name"]').fill('Pizza industrielle');
  assert.match(await page.locator('#dialog .photo-alt-list').textContent(),/Pizza maison/,'Alternatives mises à jour après correction du nom');
  assert.equal(await page.locator('#dialog button[data-action="photo-compare"]').count(),1,'Recherche OFF sur demande explicite');
  await page.screenshot({path:'screenshots/photo-alternatives-'+size.width+'.png',fullPage:true});
  await page.locator('#dialog button[data-action="close"]').click();
  await page.locator('nav#nav button[data-action="go:Profil"]').click();
  const backups=page.locator('.backup-btn');
  assert.equal(await backups.count(),2,'Exporter/Importer côte à côte');
  for(let i=0;i<2;i++){const b=await backups.nth(i).boundingBox();assert.ok(b && b.width<185 && b.height>=44,'Bouton sauvegarde compact mais accessible')}
  assert.equal(await page.locator('.profile-screen .delete-link').count(),1);
  await page.screenshot({path:'screenshots/profile-'+size.width+'.png',fullPage:true});
  await backups.first().scrollIntoViewIfNeeded();
  await page.screenshot({path:'screenshots/profile-backup-'+size.width+'.png'});
  assert.deepEqual(errors,[],'Aucune erreur JavaScript '+size.width+'px : '+errors.join('; '));
  await page.close();
  console.log('Responsive '+size.width+'px : accueil, repas, photo, profil OK');
 }
 // Vérifier un import local réel dans Chromium, sans API ni requête externe.
 const synced=await browser.newPage({viewport:{width:393,height:852}});
 const saved={name:'Essai',weights:[],meals:[],moods:[],steps:[],stepsGoal:10000,weightGoal:null,consent:true,unit:'kg'};
 await synced.addInitScript(v=>localStorage.setItem('mon-suivi-v1',JSON.stringify(v)),saved);
 await synced.goto(base+'#sante-pas=6432',{waitUntil:'load'});
 await synced.locator('.health-sync-card').waitFor();
 assert.equal(await synced.evaluate(()=>location.hash),'','Fragment Santé supprimé dès l’import');
 const imported=await synced.evaluate(()=>JSON.parse(localStorage.getItem('mon-suivi-v1')).steps);
 assert.equal(imported.length,1,'Un seul jour ajouté');
 assert.equal(imported[0].value,6432,'Pas Santé importés');
 assert.equal(imported[0].source,'sante-raccourcis','Provenance conservée');
 await synced.close();
 await browser.close();
})().catch(err=>{console.error(err);process.exitCode=1});
