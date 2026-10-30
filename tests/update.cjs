const assert=require('node:assert/strict'),http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
let revision=1,legacy=false,versionedPwaRequests=0;
const root=process.cwd(),source=fs.readFileSync('sw.js','utf8');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/pwa.js'&&url.searchParams.has('v'))versionedPwaRequests++;
 if(legacy&&url.pathname==='/pwa.js'){res.writeHead(200,{'Content-Type':'text/javascript'});res.end("window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'));");return}
 if(legacy&&['/','/index.html'].includes(url.pathname)){
  let html=fs.readFileSync('index.html','utf8').replace(/\?v=4-final-1/g,'');
  html=html.split('\n').filter(line=>!['v4-features.js','v4-config.js','v4-final.css'].some(name=>line.includes(name))).join('\n');
  res.writeHead(200,{'Content-Type':'text/html'});res.end(html);return;
 }
 if(url.pathname==='/sw.js'){
  res.writeHead(200,{'Content-Type':'text/javascript','Cache-Control':'no-store'});
  if(legacy){
   res.end("const C='mon-suivi-shell-legacy-test';self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(['./','./index.html','./app.js','./pwa.js']))));self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;if(e.request.mode==='navigate')e.respondWith(fetch(e.request).catch(()=>caches.match('./index.html')));else if(!u.search)e.respondWith(caches.match(e.request).then(c=>c||fetch(e.request)));});");return;
  }
  res.end(source.replace("mon-suivi-shell-v4-final-1","mon-suivi-shell-update-test-"+revision));return;
 }
 const file=path.resolve(root,'.'+(url.pathname==='/'?'/index.html':url.pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(error,data)=>{res.writeHead(error?404:200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream'});res.end(error?'Not found':data)});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,...(process.env.BROWSER_CHANNEL?{channel:process.env.BROWSER_CHANNEL}:{})});
 try{
  const context=await browser.newContext({viewport:{width:393,height:852}});
  const page=await context.newPage(),base='http://127.0.0.1:'+server.address().port+'/';
  await page.goto(base);await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.reload();
  await page.evaluate(()=>{data=validatePayload({...blank(),consent:true,moods:[{id:'old-mood',date:today(),name:'Bien',note:'À conserver'}]});save();go('Aujourd’hui')});
  const before=await page.evaluate(()=>localStorage.getItem('mon-suivi-v1'));
  // Un autre onglet avec une saisie en cours ne doit pas être rechargé.
  const other=await context.newPage();await other.goto(base);
  await other.locator('[data-action="start"]').click();
  await other.locator('nav [data-action="go:Profil"]').click();
  await other.locator('#name').fill('Saisie dans un autre onglet');
  revision=2;
  await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update()});
  await page.locator('#pwa-update').waitFor();
  assert.equal(await page.evaluate(()=>localStorage.getItem('mon-suivi-v1')),before);
  await page.locator('#pwa-later').click();
  assert.equal(await page.locator('#pwa-update').count(),0);
  assert.equal(await other.locator('#name').inputValue(),'Saisie dans un autre onglet');
  await page.reload();
  await page.locator('#pwa-update').waitFor();
  await page.locator('[data-action="start"]').click();
  await page.locator('nav [data-action="go:Activité"]').click();
  await page.locator('[data-action="add:steps"]').focus();
  await page.locator('[data-action="add:steps"]').press('Enter');
  await page.locator('#entry-form input[name="value"]').fill('9876');
  await page.locator('#pwa-apply').evaluate(button=>button.click());
  assert.match(await page.locator('#pwa-update-detail').textContent(),/saisie/);
  assert.equal(await page.locator('#entry-form input[name="value"]').inputValue(),'9876');
  await page.locator('#dialog [data-action="close"]').click();
  let loads=0;page.on('load',()=>loads++);
  await Promise.all([page.waitForEvent('load'),page.locator('#pwa-apply').click()]);
  await page.waitForTimeout(500);
  assert.equal(loads,1,'Un seul rechargement après acceptation');
  assert.equal(await page.evaluate(()=>localStorage.getItem('mon-suivi-v1')),before);
  assert.equal(await other.locator('#name').inputValue(),'Saisie dans un autre onglet');
  assert.equal(await page.locator('#pwa-update').count(),0);
  // Une saisie dans Profil est protégée même en dehors d’un formulaire.
  await page.locator('[data-action="start"]').click();
  await page.locator('nav [data-action="go:Profil"]').click();
  await page.locator('#name').fill('Mon prénom conservé');
  revision=3;
  await page.evaluate(async()=>{const registration=await navigator.serviceWorker.getRegistration();await registration.update()});
  await page.locator('#pwa-update').waitFor();
  await page.locator('#pwa-apply').click();
  assert.match(await page.locator('#pwa-update-detail').textContent(),/saisie/);
  assert.equal(await page.locator('#name').inputValue(),'Mon prénom conservé');
  await page.locator('[data-action="name"]').click();
  await Promise.all([page.waitForEvent('load'),page.locator('#pwa-apply').click()]);
  assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('mon-suivi-v1')).name),'Mon prénom conservé');
  console.log('Mises à jour réelles : Plus tard, protection des formulaires et du profil, deuxième onglet, données conservées et absence de boucle OK.');
  await context.close();
  // Migration depuis le comportement de cache de la PWA précédente.
  legacy=true;
  const oldContext=await browser.newContext();
  const oldPage=await oldContext.newPage();
  await oldPage.goto(base);await oldPage.evaluate(()=>navigator.serviceWorker.ready);
  await oldPage.reload();
  const oldPayload=await oldPage.evaluate(()=>{
   const old={name:'Historique ancien',consent:true,weights:[{id:'old-w',date:today(),value:71}],meals:[],moods:[],steps:[]};
   const raw=JSON.stringify(old);localStorage.setItem('mon-suivi-v1',raw);return raw;
  });
  legacy=false;revision=4;
  await oldPage.reload();
  await oldPage.locator('#pwa-update').waitFor();
  assert.ok(versionedPwaRequests>0,'Le cache ancien ne bloque pas le nouveau code PWA');
  assert.equal(await oldPage.evaluate(()=>data.weights[0].value),71);
  assert.equal(await oldPage.evaluate(()=>localStorage.getItem('mon-suivi-v1')),oldPayload);
  await Promise.all([oldPage.waitForEvent('load'),oldPage.locator('#pwa-apply').click()]);
  assert.equal(await oldPage.evaluate(()=>data.weights[0].value),71);
  assert.equal(await oldPage.evaluate(()=>localStorage.getItem('mon-suivi-v1')),oldPayload);
  console.log('Migration depuis ancien cache : nouvelle bannière chargée et historique intact.');
  await oldContext.close();
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
