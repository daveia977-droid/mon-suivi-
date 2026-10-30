// Tests visuels dans un vrai Chromium ; l'essai manuel sur iPhone reste recommandé.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {chromium}=require('playwright');

(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 const base=process.env.TEST_BASE_URL||'http://127.0.0.1:8765/';
 fs.mkdirSync('screenshots',{recursive:true});
 const sizes=[{width:393,height:852},{width:320,height:700},{width:430,height:932}];
 for(const size of sizes){
  const page=await browser.newPage({viewport:size,deviceScaleFactor:1,isMobile:true,hasTouch:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'load'});
  assert.ok(await page.locator('.premium-welcome').count(),'Écran d’accueil public premium affiché');
  await page.screenshot({path:'screenshots/welcome-'+size.width+'.png',fullPage:true});
  assert.equal(await page.locator('button[data-action="demo"]').count(),0,'Exploration de démo absente');
  await page.locator('button[data-action="start"]').click();
  await page.locator('#setup-form').waitFor();
  assert.equal(await page.locator('#setup-form button[data-action="demo"]').count(),0,'Démo absente de l’inscription');
  await page.locator('#setup-name').fill('Camille');
  await page.locator('#setup-form input[name="terms"]').check();
  await page.locator('#setup-form input[name="consent"]').check();
  await page.locator('#setup-form button[type="submit"]').click();
  await page.locator('.hero-summary').waitFor();
  await page.evaluate(()=>{
    data.weights=[{id:'w1',date:past(28),value:84.4},{id:'w2',date:today(),value:82.4}];
    data.weightGoal=78;
    data.steps=[{id:'s1',date:past(2),value:5400},{id:'s2',date:today(),value:8260}];
    data.stepsGoal=6000;
    save();
  });
  await page.locator('.hero-summary').waitFor();
  assert.ok(await page.locator('.hero-donut').count(),'Anneau de progression');
  assert.ok(await page.locator('.home-greeting').count(),'Bienvenue personnelle V3');
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

  // Guide ivoirien, recettes détaillées et illustrations autonomes.
  await page.locator('.mealguide-root').waitFor();
  const guideInfo=await page.evaluate(()=>window.MON_SUIVI_GUIDE_INFO);
  assert.equal(guideInfo.recipes,42,'42 recettes dans le guide');
  assert.equal(guideInfo.ivo,24,'24 recettes ivoiriennes');
  assert.equal(guideInfo.alternatives,15,'15 familles visuelles');
  assert.equal(await page.locator('.mealguide-root .mg-recipe-card').count(),10,'Catalogue paginé');
  await page.waitForFunction(()=>{const img=document.querySelector('.mealguide-root .mg-img');return img&&img.complete&&img.naturalWidth>0});
  await page.locator('[data-guide-action="recipe:attieke-poisson"]').click();
  await page.locator('#dialog .mg-ingredient-list').waitFor();
  assert.ok(await page.locator('#dialog .mg-ingredient-list li').count()>=6,'Ingrédients du plat listés');
  assert.match(await page.locator('#dialog').textContent(),/Préparation/);
  await page.screenshot({path:'screenshots/recipe-ivorian-'+size.width+'.png',fullPage:true});
  await page.locator('#dialog button[data-guide-action="log:attieke-poisson"]').click();
  assert.equal(await page.locator('#dialog input[name="name"]').inputValue(),'Attiéké au poisson braisé','Ajout au journal prérempli');
  assert.equal(await page.locator('#dialog input[name="value"]').inputValue(),'','Aucune calorie inventée');
  await page.locator('#dialog button[data-action="close"]').click();
  await page.locator('[data-guide-action="category:var"]').click();
  await page.locator('#mg-recipe-search').fill('lentilles');
  assert.ok(await page.locator('.mealguide-root .mg-recipe-card').count()>0,'Recherche par ingrédient');
  await page.screenshot({path:'screenshots/recipe-search-'+size.width+'.png',fullPage:true});
  await page.locator('.meals-screen .meal-entry-choice[data-action="addphoto"]').click();
  await page.locator('#mg-alt-search').waitFor();
  assert.ok(await page.locator('.mealguide-root .mg-alt-card').count()>=12,'Galerie de départs avec images');
  await page.locator('[data-guide-action="alternative:chips"]').click();
  await page.locator('#dialog .mg-alt-detail').first().waitFor();
  assert.equal(await page.locator('#dialog .mg-alt-detail').count(),2,'Deux alternatives avec illustrations');
  assert.equal(await page.locator('#dialog .mg-alt-detail .mg-img').count(),2);
  assert.match(await page.locator('#dialog .mg-alt-detail').first().textContent(),/Ingrédients/);
  await page.screenshot({path:'screenshots/alternatives-gallery-'+size.width+'.png',fullPage:true});
  await page.locator('#dialog .mg-close').click();

  await add.click();
  await page.locator('#dialog .mode-tabs').waitFor();
  await page.locator('#dialog button[data-action="mealmode:photo"]').click();
  await page.locator('#dialog .photo-fallback-card').waitFor();
  assert.equal(await page.locator('#dialog input[type="file"]').count(),2,'Caméra et import local disponibles sans service IA');
  await page.locator('#photo-product-name').fill('Chips de pommes de terre');
  await page.locator('#dialog button[data-action="photo-alt-manual"]').click();
  assert.match(await page.locator('#photo-fallback-results').textContent(),/Pop-corn nature maison/,'Alternatives manuelles accessibles');
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
})().catch(err=>{console.error(err);process.exit(1)});

