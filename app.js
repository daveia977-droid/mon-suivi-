'use strict';
const KEY='mon-suivi-v1',app=document.querySelector('#app'),nav=document.querySelector('#nav'),dlg=document.querySelector('#dialog');
const blank=()=>({name:'',weights:[],meals:[],moods:[],steps:[],stepsGoal:6000,weightGoal:null,consent:false,unit:'kg'});
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const today=()=>iso(new Date());
const past=n=>{const d=new Date();d.setDate(d.getDate()-n);return iso(d)};
const fmt=n=>Number(n).toLocaleString('fr-FR',{maximumFractionDigits:1});
const unitFactor=2.2046226218;
const shownWeight=kg=>fmt(unit==='lb'?Number(kg)*unitFactor:Number(kg));
const sorted=items=>items.slice().sort((a,b)=>a.date.localeCompare(b.date)||String(a.id).localeCompare(String(b.id)));
const newest=items=>sorted(items).reverse()[0];
const icon=(name)=>{const shapes={
back:'<path d="m15 18-6-6 6-6"/><path d="M20 12H9"/>',
chevron:'<path d="m9 18 6-6-6-6"/>',
user:'<circle cx="12" cy="8" r="4"/><path d="M5 21v-2a7 7 0 0 1 14 0v2"/>',
home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V10Z"/><path d="M9 21v-8h6v8"/>',
meal:'<path d="M4 3v7a3 3 0 0 0 6 0V3M7 3v19M15 3v19M15 10c0-5 2-7 5-7v9h-5"/>',
chart:'<path d="M4 21v-7m6 7V9m6 12V5m5 16V3"/>',
scale:'<rect x="3" y="5" width="18" height="15" rx="3"/><path d="m8 10 4-2 4 2M12 8v5"/>',
happy:'<circle cx="12" cy="12" r="10"/><path d="M8 14c2.5 3 5.5 3 8 0"/><path d="M8 9h.01M16 9h.01"/>',
neutral:'<circle cx="12" cy="12" r="10"/><path d="M8 15h8M8 9h.01M16 9h.01"/>',
sad:'<circle cx="12" cy="12" r="10"/><path d="M8 17c2-3 6-3 8 0"/><path d="M8 9h.01M16 9h.01"/>',moyen:'<circle cx="12" cy="12" r="10"/><path d="M9 15.5c1.5-1 4.5-1 6 0"/><path d="M8 9h.01M16 9h.01"/>',great:'<circle cx="12" cy="12" r="10"/><path d="M6.5 13.5c2 4 9 4 11 0"/><path d="M8 8h.01M16 8h.01"/>',
download:'<path d="M12 3v12m-4-4 4 4 4-4M4 17v4h16v-4"/>',
upload:'<path d="M12 16V4m-4 4 4-4 4 4M4 17v4h16v-4"/>',
trash:'<path d="M4 7h16M10 4h4M6 7l1 14h10l1-14M10 11v6m4-6v6"/>',
heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
plus:'<path d="M12 5v14M5 12h14"/>',
steps:'<ellipse cx="7" cy="7.5" rx="2.2" ry="3.2"/><ellipse cx="17" cy="9.5" rx="2.2" ry="3.2"/><path d="M5.5 12c-1.6 1.4-2.3 3.5-1.8 5.5l.3 1.2"/><path d="M18.5 14c1.6 1.4 2.3 3.5 1.8 5.5l-.3 1.2"/>'
};return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(shapes[name]||shapes.heart)+'</svg>'};
const moodClass=name=>({'À plat':'m-blue','Moyen':'m-yellow','Bien':'m-pink','En forme':'m-green'})[name]||'m-pink';
const stepsToday=()=>data.steps.find(x=>x.date===today());
let data=blank(),demo=false,page='Accueil',period='30',unit='kg',storageOK=true,restoreFocus=null;
const isDate=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v+'T12:00:00'))&&iso(new Date(v+'T12:00:00'))===v;
function validatePayload(raw){
if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('Format de sauvegarde invalide.');
if(!Array.isArray(raw.weights)||!Array.isArray(raw.meals)||!Array.isArray(raw.moods))throw Error('Le fichier ne contient pas un suivi compatible.');
const out=blank();out.name=typeof raw.name==='string'?raw.name.slice(0,60):'';out.unit=raw.unit==='lb'?'lb':'kg';out.consent=raw.consent===true;
for(const type of ['weights','meals','moods']){
 if(raw[type].length>3000)throw Error('Trop de données dans le fichier.');
 out[type]=raw[type].map((entry,i)=>{
  if(!entry||typeof entry!=='object'||!isDate(entry.date)||entry.date>today())throw Error('Date invalide dans '+type+'.');
  const id=typeof entry.id==='string'||typeof entry.id==='number'?String(entry.id).slice(0,90):String(i);
  if(type==='weights'){const value=Number(entry.value);if(!Number.isFinite(value)||value<=0||value>700)throw Error('Poids invalide.');return {id,date:entry.date,value:Math.round(value*100)/100}}
  if(type==='meals'){const value=Number(entry.value);if(!Number.isFinite(value)||value<0||value>50000||typeof entry.name!=='string'||!entry.name.trim()||typeof entry.quantity!=='string')throw Error('Repas invalide.');return {id,date:entry.date,name:entry.name.slice(0,150),quantity:entry.quantity.slice(0,80),value:Math.round(value)}}
  if(!['À plat','Moyen','Bien','En forme'].includes(entry.name))throw Error('Humeur invalide.');
  return {id,date:entry.date,name:entry.name,note:typeof entry.note==='string'?entry.note.slice(0,300):''};
 });
}
out.steps=Array.isArray(raw.steps)?raw.steps.slice(0,3000):[];
out.steps=out.steps.map((entry,i)=>{
 if(!entry||typeof entry!=='object'||!isDate(entry.date)||entry.date>today())throw Error('Date invalide dans les pas.');
 const sid=typeof entry.id==='string'||typeof entry.id==='number'?String(entry.id).slice(0,90):String(i);
 const svalue=Number(entry.value);if(!Number.isFinite(svalue)||svalue<0||svalue>200000||!Number.isInteger(svalue))throw Error('Nombre de pas invalide.');
 return {id:sid,date:entry.date,value:svalue};
});
const sg=raw.stepsGoal;
out.stepsGoal=sg===null?null:(Number.isFinite(Number(sg))&&Number(sg)>=500&&Number(sg)<=100000?Math.round(Number(sg)):6000);
const wg=Number(raw.weightGoal);
out.weightGoal=Number.isFinite(wg)&&wg>0&&wg<=700?Math.round(wg*100)/100:null;
out.consentAt=typeof raw.consentAt==='string'?raw.consentAt:'';out.consentVersion='1';
return out;
}
function reload(){try{const raw=localStorage.getItem(KEY);if(raw){const item=validatePayload(JSON.parse(raw));if(item.consent){data=item;unit=data.unit}}}catch(err){storageOK=false}}
reload();
function save(){if(!demo&&data.consent){try{localStorage.setItem(KEY,JSON.stringify(data));storageOK=true}catch{storageOK=false}}render()}
function go(where){page=where;render();window.scrollTo({top:0,behavior:'instant'})}
function btn(text,action,cl=''){return '<button type="button" class="'+cl+'" data-action="'+esc(action)+'">'+text+'</button>'}
function startDemo(){demo=true;data=blank();data.name='Camille';data.weights=[{id:'demo1',date:past(28),value:84.4},{id:'demo2',date:past(21),value:83.7},{id:'demo3',date:past(14),value:83.8},{id:'demo4',date:past(7),value:82.9},{id:'demo5',date:today(),value:82.4}];data.meals=[{id:'demo-meal',date:today(),name:'Déjeuner',quantity:'1 portion',value:520}];data.moods=[{id:'demo-mood',date:today(),name:'Bien',note:''}];data.steps=[{id:'demo-s1',date:past(2),value:5400},{id:'demo-s2',date:past(1),value:7300},{id:'demo-s3',date:today(),value:8260}];data.stepsGoal=6000;data.weightGoal=78;unit='kg';page='Aujourd’hui';render()}
function leaveDemo(){demo=false;data=blank();storageOK=true;reload();unit=data.unit||'kg';go('Accueil')}
function footer(){return '<footer>'+Object.keys(legal).map(name=>'<a href="#" data-action="go:'+esc(name)+'">'+esc(name)+'</a>').join('')+'</footer>'}
const legal={
'Confidentialité':'Ce prototype ne crée aucun compte et ne transmet pas vos données de suivi à un serveur applicatif. Après votre consentement, vos mesures de poids, repas, humeur et pas sont enregistrées dans le stockage local de ce navigateur. Elles ne sont pas chiffrées par cette application. Une personne accédant à votre session peut les consulter. Vous pouvez exporter ou effacer ces données dans Profil. Supprimer les données du navigateur peut supprimer votre historique. Les informations sur l’éditeur, l’hébergeur, les durées de conservation, le contact et l’exercice des droits restent à compléter avant publication.',
'Conditions':'Application expérimentale de bien-être destinée aux adultes, sans diagnostic médical ni promesse de résultat. Les calories sont des estimations renseignées manuellement. Aucun compte en ligne, aucun abonnement, aucune analyse de photo et aucune notification automatique ne sont proposés ici. Éditeur et conditions contractuelles définitives à compléter.',
'Cookies':'Aucun traceur publicitaire ou outil de mesure d’audience facultatif n’est intégré au code. Une fois le consentement donné, le suivi utilise le stockage local du navigateur. Les traitements techniques éventuels de l’hébergeur restent à vérifier.',
'Mentions légales':'Informations sur l’éditeur, l’adresse, le contact, le directeur de publication et l’hébergeur : à compléter avant publication.',
'Remboursements':'Aucun achat ni abonnement n’est proposé dans ce prototype.'};
function chartSVG(items,width=340,height=154,small=false,goal=null){
if(items.length<2)return '<div class="spark-empty">Ajoutez plusieurs mesures pour afficher la courbe.</div>';
const rows=sorted(items),values=rows.map(x=>Number(x.value)),lo=Math.min(...values)-.65,hi=Math.max(...values)+.65,left=small?6:25,right=small?6:15,top=small?8:16,bottom=small?8:29;
const plotW=width-left-right,plotH=height-top-bottom;
const timestamps=rows.map(x=>Date.parse(x.date+'T12:00:00')),minT=Math.min(...timestamps),maxT=Math.max(...timestamps);
const pt=rows.map((r,i)=>({id:r.id,date:r.date,value:r.value,x:left+(maxT===minT?i/(rows.length-1):(timestamps[i]-minT)/(maxT-minT))*plotW,y:top+(hi-r.value)/(hi-lo)*plotH}));
const line=pt.map(p=>p.x.toFixed(1)+','+p.y.toFixed(1)).join(' ');
const area=left+','+(height-bottom)+' '+line+' '+(width-right)+','+(height-bottom);
if(small)return '<svg class="spark" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Mini courbe du poids"><path d="M '+area.replaceAll(' ',' L ')+' Z"/><polyline points="'+line+'"/>'+pt.map(p=>'<circle cx="'+p.x+'" cy="'+p.y+'" r="3.5"/>').join('')+'</svg>';
return '<svg class="graph" viewBox="0 0 '+width+' '+height+'" role="img" aria-label="Courbe de poids entre '+esc(rows[0].date)+' et '+esc(rows.at(-1).date)+'"><line class="graph-grid" x1="'+left+'" y1="'+(height-bottom)+'" x2="'+(width-right)+'" y2="'+(height-bottom)+'"/><line class="graph-grid" x1="'+left+'" y1="'+(top+plotH/2)+'" x2="'+(width-right)+'" y2="'+(top+plotH/2)+'"/><polygon class="graph-area" points="'+area+'"/><polyline class="graph-line" points="'+line+'"/>'+pt.map(p=>'<circle class="graph-dot" role="button" tabindex="0" data-action="point:'+esc(p.id)+'" aria-label="Mesure du '+p.date.split('-').reverse().join('/')+' : '+shownWeight(p.value)+' '+unit+'" cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="4"/>').join('')+'<text class="graph-text" x="'+left+'" y="'+(height-7)+'">'+esc(rows[0].date.slice(5))+'</text><text class="graph-text" text-anchor="end" x="'+(width-right)+'" y="'+(height-7)+'">'+esc(rows.at(-1).date.slice(5))+'</text>'+(goal&&goal>lo&&goal<hi?'<line class="graph-goal" x1="'+left+'" y1="'+(top+(hi-goal)/(hi-lo)*plotH).toFixed(1)+'" x2="'+(width-right)+'" y2="'+(top+(hi-goal)/(hi-lo)*plotH).toFixed(1)+'"/><text class="graph-goal-text" x="'+(width-right)+'" y="'+(top+(hi-goal)/(hi-lo)*plotH-6).toFixed(1)+'" text-anchor="end">objectif</text>':'')+'</svg>';
}
function list(type,items=data[type]){
if(!items.length)return '<div class="empty-state">'+icon(type==='weights'?'scale':type==='meals'?'meal':type==='steps'?'steps':'heart')+'<h3>Rien pour le moment</h3><p>Commencez quand vous le souhaitez.</p></div>';
return '<ul class="records-list">'+sorted(items).reverse().map(e=>'<li><div><div class="record-name">'+(type==='moods'?'<span class="mood-dot '+moodClass(e.name)+'"></span>':'')+esc(type==='weights'?shownWeight(e.value)+' '+unit:type==='steps'?fmt(e.value)+' pas':e.name)+'</div><div class="record-info">'+esc(e.date)+(type==='meals'?' · '+esc(e.quantity)+' · ≈ '+fmt(e.value)+' kcal':'')+(e.note?' · '+esc(e.note):'')+'</div></div><div class="record-actions">'+btn('Modifier','edit:'+type+':'+e.id,'secondary small')+btn('Suppr.','delete:'+type+':'+e.id,'ghost small')+'</div></li>').join('')+'</ul>';
}
function topbar(){return '<header class="topbar"><span class="topbar-brand">Mon Suivi</span>'+btn(icon('user'),'go:Profil','icon-button')+'</header>'}
function ringSVG(value,goal,small){
const size=small?92:150,stroke=small?9:13,r=(size-stroke)/2,c=2*Math.PI*r,pct=goal?Math.min(1,value/goal):1,col=!goal?'#842849':pct>=1?'#2e9464':pct>=.6?'#c29210':'#d1567f';
return '<svg class="ring'+(small?' ring-sm':'')+'" viewBox="0 0 '+size+' '+size+'" role="img" aria-label="Progression des pas du jour"><circle class="ring-bg" cx="'+size/2+'" cy="'+size/2+'" r="'+r+'"/><circle class="ring-val" cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" stroke="'+col+'" stroke-dasharray="'+(c*pct).toFixed(1)+' '+c.toFixed(1)+'"/><text class="ring-num" x="50%" y="'+(small?'54%':'48%')+'" text-anchor="middle">'+fmt(value)+'</text>'+(small?'':'<text class="ring-cap" x="50%" y="62%" text-anchor="middle">pas</text>')+'</svg>';
}
function screenHome(){
const w=newest(data.weights),cur=data.moods.find(m=>m.date===today()),s=Number(stepsToday()?.value||0),goal=data.stepsGoal;
return '<div class="screen">'+topbar()+
'<section class="hello"><h1>Bonjour'+(data.name?' '+esc(data.name):'')+' !</h1><p>Chaque petit pas compte.</p></section>'+
'<section class="section-card pink-card"><div class="card-top"><h2>Mon évolution</h2>'+btn(icon('chevron'),'go:Progrès','arrow-link')+'</div><div class="weight-row"><div class="weight-value">'+(w?shownWeight(w.value)+' <small>'+unit+'</small>':'—')+'</div>'+(data.weights.length>=2?chartSVG(data.weights.slice(-12),200,110,true):'<span class="spark-empty">Votre évolution apparaîtra ici.</span>')+'</div><p class="weight-description">'+(w?(demo?'Données de démonstration':'Dernière mesure · '+esc(w.date)):'Votre première mesure vous attend.')+'</p></section>'+
'<section class="section-card yellow-card"><div class="card-top"><h2>Mon journal</h2>'+btn(icon('chevron'),'go:Repas','arrow-link')+'</div><div class="action-grid"><button class="quick-tile" data-action="add:meals">'+icon('meal')+'<span>Ajouter<br>un repas</span>'+icon('chevron').replace('aria-hidden="true"','class="tile-arrow" aria-hidden="true"')+'</button><button class="quick-tile" data-action="add:weights">'+icon('scale')+'<span>Noter<br>mon poids</span>'+icon('chevron').replace('aria-hidden="true"','class="tile-arrow" aria-hidden="true"')+'</button></div></section>'+
'<section class="section-card yellow-card"><div class="card-top"><h2>Mon activité</h2>'+btn(icon('chevron'),'go:Activité','arrow-link')+'</div><div class="ring-wrap">'+ringSVG(s,goal,true)+'<div><div class="weight-value" style="font-size:26px">'+fmt(s)+' <small>pas</small></div><p class="weight-description">'+(goal?'Objectif : '+fmt(goal)+' pas par jour':'Aucun objectif de pas défini')+'</p></div></div></section>'+
'<section class="section-card pink-card"><div class="card-top"><h2>Comment vous sentez-vous ?</h2>'+btn(icon('chevron'),'go:Progrès','arrow-link')+'</div><div class="mood-row">'+[['À plat','sad','m-blue'],['Moyen','moyen','m-yellow'],['Bien','happy','m-pink'],['En forme','great','m-green']].map(([name,symbol,cls])=>'<button class="mood-tile '+cls+(cur?.name===name?' selected':'')+'" aria-pressed="'+(cur?.name===name)+'" data-action="quickmood:'+name+'">'+icon(symbol)+'<span>'+name+'</span></button>').join('')+'</div></section></div>';
}
function screenMeals(){const sum=data.meals.filter(x=>x.date===today()).reduce((s,m)=>s+Number(m.value),0);return '<div class="screen">'+topbar()+'<h1 class="page-title">Mon journal.</h1><p class="section-sub">Vos repas, à votre rythme.</p><div class="section-card yellow-card"><h2>Pour aujourd’hui</h2><div class="weight-value" style="margin-top:9px">'+fmt(sum)+' <small>kcal</small></div><p class="info-note">Total des estimations que vous avez renseignées, sans objectif imposé.</p></div>'+btn(icon('plus')+' Ajouter un repas','add:meals','wide')+'<div class="data-section"><h2>Historique des repas</h2>'+list('meals')+'</div></div>'}
function screenActivity(){
const s=Number(stepsToday()?.value||0),goal=data.stepsGoal;
return '<div class="screen">'+topbar()+'<h1 class="page-title">Mon activité.</h1><p class="section-sub">Bougez à votre rythme, sans pression.</p><section class="section-card pink-card"><div class="card-top"><h2>Mes pas aujourd’hui</h2>'+icon('steps')+'</div><div class="ring-wrap">'+ringSVG(s,goal)+'<div class="ring-side"><div class="weight-value" style="font-size:30px">'+fmt(s)+' <small>pas</small></div><p class="weight-description">'+(goal?(s>=goal?'Objectif de '+fmt(goal)+' pas atteint, bravo !':'Encore '+fmt(goal-s)+' pas pour atteindre '+fmt(goal)+'.'):'Aucun objectif : vos pas sont simplement notés, jour après jour.')+'</p></div></div></section>'+btn(icon('plus')+' Enregistrer mes pas','add:steps','wide')+'<section class="section-card white-card"><h2>Mon objectif de pas</h2><p class="info-note">'+(goal?'Objectif quotidien : <strong>'+fmt(goal)+' pas</strong>. Personnalisez-le ou désactivez-le à tout moment.':'Aucun objectif défini. Par défaut, 6 000 pas par jour — mais rien ne vous y oblige.')+'</p><div class="profile-actions">'+btn(goal?'Modifier l’objectif':'Définir un objectif','steps-goal','secondary')+(goal?btn('Désactiver l’objectif','steps-goal-off','ghost'):'')+'</div></section><section class="data-section"><h2>Historique des pas</h2>'+list('steps')+'</section></div>';
}
function screenProgress(){
const filtered=period==='all'?data.weights:data.weights.filter(x=>x.date>=past(Number(period)-1));
const current=newest(data.weights),old=sorted(data.weights)[0],diff=current&&old&&data.weights.length>1?Number(current.value)-Number(old.value):null;
return '<div class="screen">'+topbar()+'<h1 class="page-title">Vos progrès.</h1><p class="section-sub">Observer votre chemin, sans pression.</p><div class="section-card pink-card"><div class="card-top"><h2>Évolution du poids</h2>'+icon('chart')+'</div><div class="filter-row">'+[['7','7 jours'],['30','30 jours'],['all','Tout']].map(([v,t])=>btn(t,'period:'+v,period===v?'active':'')).join('')+'</div>'+(filtered.length>=2?chartSVG(filtered,340,154,false,data.weightGoal):'<div class="empty-state">Ajoutez au moins deux mesures sur cette période pour voir votre courbe.</div>')+'</div><div class="summary-strip"><div class="section-card white-card"><span class="muted small-text">Dernière mesure</span><strong>'+(current?shownWeight(current.value)+' '+unit:'—')+'</strong></div><div class="section-card white-card"><span class="muted small-text">Depuis le début</span><strong>'+(diff!==null?(diff>0?'+':'')+(diff<0?'-':'')+shownWeight(Math.abs(diff))+' '+unit:'—')+'</strong></div></div>'+'<section class="section-card white-card"><h2>Mon objectif de poids</h2>'+(data.weightGoal?'<p class="info-note">Objectif : <strong>'+shownWeight(data.weightGoal)+' '+unit+'</strong>'+(current?(Number(current.value)-data.weightGoal<=0?' — objectif atteint, bravo !':' — encore '+shownWeight(Math.abs(Number(current.value)-data.weightGoal))+' '+unit+' d’après vos mesures.'):'')+'</p><div class="profile-actions">'+btn('Modifier l’objectif','weight-goal','secondary')+btn('Supprimer l’objectif','weight-goal-off','ghost')+'</div>':'<p class="info-note">Facultatif : un objectif s’affiche en pointillés sur votre courbe pour vous encourager.</p><div class="profile-actions">'+btn('Définir un objectif','weight-goal','secondary')+'</div>')+'</section>'+btn('Ajouter une mesure','add:weights','wide')+'<section class="data-section"><h2>Historique du poids</h2>'+list('weights')+'</section><section class="data-section"><div class="card-top"><h2>Votre humeur</h2>'+btn(icon('plus'),'add:moods','icon-button')+'</div>'+list('moods')+'</section></div>';
}
function screenProfile(){return '<div class="screen">'+topbar()+'<h1 class="page-title">Votre espace.</h1><p class="section-sub">Un suivi personnel, sur cet appareil.</p><section class="section-card white-card"><h2>Votre prénom ou pseudonyme</h2><label for="name" class="sr-only">Prénom ou pseudonyme</label><input id="name" maxlength="60" value="'+esc(data.name)+'" autocomplete="nickname" placeholder="Votre prénom">'+btn('Enregistrer','name','wide')+'</section><section class="section-card white-card"><div class="setting-line"><div><h2>Unité du poids</h2><span class="small-text muted">Vos données sont conservées en kg.</span></div><select id="unit" aria-label="Unité du poids"><option value="kg" '+(unit==='kg'?'selected':'')+'>kg</option><option value="lb" '+(unit==='lb'?'selected':'')+'>lb</option></select></div></section><section class="section-card yellow-card"><h2>Vos données vous appartiennent.</h2><p class="info-note">'+(demo?'Mode démonstration : aucune donnée n’est conservée.':'Sauvegarde uniquement dans ce navigateur après votre accord. Aucun compte en ligne et aucune synchronisation automatique.')+'</p><div class="profile-actions">'+btn(icon('download')+' Exporter mes données','export','secondary wide')+btn(icon('upload')+' Importer une sauvegarde','import','secondary wide')+btn('Retirer mon accord et tout effacer','clear','ghost wide')+'</div><input type="file" id="import-file" accept=".json,application/json" hidden></section><section class="section-card white-card"><h2>À savoir</h2><p class="info-note">Effacer les données du navigateur peut supprimer votre suivi. L’application ne remplace pas un professionnel de santé.</p></section></div>'}
function render(){
const showNav=!['Accueil','Bienvenue',...Object.keys(legal)].includes(page);
nav.hidden=!showNav;
nav.innerHTML=showNav?[['Aujourd’hui','Aujourd’hui','home'],['Repas','Repas','meal'],['Activité','Activité','steps'],['Progrès','Progrès','chart'],['Profil','Profil','user']].map(([target,label,symbol])=>'<button type="button" data-action="go:'+target+'" aria-label="'+label+'" aria-current="'+(page===target?'page':'false')+'">'+icon(symbol)+'<span>'+label+'</span></button>').join(''):'';
let content='';
if(page==='Accueil')content='<section class="welcome"><div class="welcome-header">Mon Suivi</div><div class="welcome-content"><h1>Un peu<br>chaque jour.</h1><p>Poids, repas et humeur,<br>au même endroit.</p><div class="btn-stack">'+btn(data.consent?'Retrouver mon suivi':'Commencer','start','wide')+btn('Explorer la démo','demo','secondary wide')+'</div></div></section>';
else if(page==='Bienvenue')content='<section class="setup">'+btn(icon('back'),'go:Accueil','back')+'<h1>Votre espace<br>personnel</h1><p>Suivez votre parcours à votre rythme, sur cet appareil, sans créer de compte en ligne.</p><form id="setup-form"><div class="field"><label for="setup-name">Prénom ou pseudonyme</label><input id="setup-name" name="name" maxlength="60" placeholder="Comment souhaitez-vous être appelé ?" autocomplete="nickname"><p class="explain">Facultatif. Ne renseignez aucune information sensible.</p></div><div class="consent-row"><label><input name="terms" type="checkbox" required><span>J’ai lu les <a href="#" data-action="go:Conditions">conditions d’utilisation</a>.</span></label></div><div class="consent-row"><label><input name="consent" type="checkbox" required><span>J’accepte d’enregistrer localement mes données de suivi (poids, repas, humeur et pas), et je peux retirer mon accord et effacer mes données à tout moment.</span></label></div><p class="info-note"><a href="#" data-action="go:Confidentialité">Confidentialité et retrait du consentement</a></p><div class="btn-stack" style="margin-top:24px"><button class="wide" type="submit">Créer mon espace local</button>'+btn('Découvrir sans compte','demo','secondary wide')+'</div></form>'+footer()+'</section>';
else if(legal[page])content='<section class="legal-page">'+btn(icon('back')+' Retour','back','ghost')+'<h1>'+esc(page)+'</h1><div class="section-card white-card"><p>'+esc(legal[page])+'</p></div>'+footer()+'</section>';
else if(page==='Aujourd’hui')content=screenHome();
else if(page==='Repas')content=screenMeals();
else if(page==='Activité')content=screenActivity();
else if(page==='Progrès')content=screenProgress();
else if(page==='Profil')content=screenProfile();
if(demo&&showNav)content='<p class="demo-note" style="margin:calc(10px + env(safe-area-inset-top)) 0 12px">Mode démonstration · données fictives · <button type="button" data-action="exit">Quitter</button></p>'+content;if(!storageOK)content='<p class="notice-error" role="alert">Sauvegarde locale indisponible. Exportez vos données avant de quitter cette page.</p>'+content;
app.innerHTML=content+(showNav?footer():'');
}
function modal(html){restoreFocus=document.activeElement;dlg.innerHTML=html;dlg.showModal()}
dlg.addEventListener('close',()=>{if(restoreFocus?.isConnected)restoreFocus.focus();restoreFocus=null});
function openForm(type,id){
const items=data[type],entry=items.find(x=>String(x.id)===String(id))||{},heading={weights:'Noter mon poids',meals:'Ajouter un repas',moods:'Mon humeur',steps:'Mes pas'}[type];
const fields=type==='weights'?'<label>Poids ('+unit+')<input name="value" type="number" inputmode="decimal" min="1" max="'+(unit==='lb'?'1543':'700')+'" step="0.01" required value="'+esc(entry.value?unit==='lb'?(entry.value*unitFactor).toFixed(2):entry.value:'')+'"></label>':type==='meals'?'<label>Repas ou aliment<input name="name" maxlength="150" required value="'+esc(entry.name||'')+'" placeholder="Ex. Déjeuner"></label><label>Quantité et unité<input name="quantity" maxlength="80" required value="'+esc(entry.quantity||'')+'" placeholder="Ex. 1 portion"></label><label>Calories estimées<input name="value" type="number" inputmode="numeric" min="0" max="50000" step="1" required value="'+esc(entry.value??'')+'"></label><p class="modal-explain">Estimation manuelle : aucune analyse nutritionnelle automatique.</p>':type==='steps'?'<label>Nombre de pas<input name="value" type="number" inputmode="numeric" min="0" max="200000" step="1" required value="'+esc(entry.value??'')+'"></label><p class="modal-explain">Saisie manuelle : l’application ne lit pas le podomètre de l’iPhone.</p>':'<label>Humeur<select name="name">'+['À plat','Moyen','Bien','En forme'].map(v=>'<option '+(entry.name===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label>Note facultative<textarea name="note" maxlength="300" rows="2">'+esc(entry.note||'')+'</textarea></label>';
modal('<form id="entry-form"><h2>'+heading+'</h2><label>Date<input type="date" name="date" required max="'+today()+'" value="'+esc(entry.date||today())+'"></label>'+fields+'<p id="entry-error" class="notice-error" role="alert" hidden></p><div class="row"><button type="submit">Enregistrer</button>'+btn('Annuler','close','secondary')+'</div></form>');
document.querySelector('#entry-form').addEventListener('submit',event=>{
event.preventDefault();const v=Object.fromEntries(new FormData(event.target));v.id=entry.id||String(Date.now())+'-'+Math.random().toString(36).slice(2,7);
if(type==='weights')v.value=Number(v.value)/(unit==='lb'?unitFactor:1);
if(type==='meals')v.value=Number(v.value);
if(type==='steps')v.value=Number(v.value);
try{const payload=blank();payload[type]=[v];const valid=validatePayload(payload)[type][0];if(type==='steps'){data.steps=items.filter(item=>String(item.id)!==String(entry.id)).filter(x=>x.date!==valid.date||String(x.id)===String(valid.id)).concat(valid)}else data[type]=items.filter(item=>String(item.id)!==String(entry.id)).concat(valid);dlg.close();save()}catch(e){const error=document.querySelector('#entry-error');error.textContent=e.message;error.hidden=false}
});
}
function quickMood(name){let item={id:String(Date.now()),date:today(),name,note:''};data.moods=data.moods.filter(x=>x.date!==today()).concat(item);save()}
function pointDialog(id){
const rows=sorted(data.weights),i=rows.findIndex(x=>String(x.id)===String(id));if(i<0)return;
const e=rows[i],prev=rows[i-1],diff=prev?Number(e.value)-Number(prev.value):null,fr=e.date.split('-').reverse().join('/');
modal('<h2>Mesure du '+fr+'</h2><div class="weight-value" style="margin:4px 0 10px">'+shownWeight(e.value)+' <small>'+unit+'</small></div><p class="modal-explain">'+(diff===null?'Votre première mesure.':(diff>0?'+':'')+(diff<0?'-':'')+fmt(Math.abs(unit==='lb'?diff*unitFactor:diff))+' '+unit+' par rapport à la mesure précédente.')+'</p><div class="row">'+btn('Modifier','pointedit:weights:'+e.id)+btn('Supprimer','pointdel:weights:'+e.id,'secondary')+btn('Fermer','close','ghost')+'</div>');
}
function openStepsGoal(){
modal('<form id="goal-form"><h2>Mon objectif de pas</h2><p class="modal-explain">Par défaut : 6 000 pas par jour. Personnalisez-le ou choisissez de suivre vos pas sans objectif.</p><label>Objectif quotidien<input name="goal" type="number" inputmode="numeric" min="500" max="100000" step="100" required value="'+(data.stepsGoal||6000)+'"></label><p id="goal-error" class="notice-error" role="alert" hidden></p><div class="row"><button type="submit">Enregistrer</button>'+btn('Annuler','close','secondary')+'</div></form>');
}
function openWeightGoal(){
const g=data.weightGoal,shown=g?(unit==='lb'?(g*unitFactor).toFixed(2):g):'';
modal('<form id="wgoal-form"><h2>Mon objectif de poids</h2><p class="modal-explain">Facultatif : un cap qui vous encourage, jamais une obligation.</p><label>Objectif ('+unit+')<input name="goal" type="number" inputmode="decimal" min="'+(unit==='lb'?'2.2':'1')+'" max="'+(unit==='lb'?'1543':'700')+'" step="0.1" required value="'+esc(shown)+'"></label><p id="wgoal-error" class="notice-error" role="alert" hidden></p><div class="row"><button type="submit">Enregistrer</button>'+btn('Annuler','close','secondary')+'</div></form>');
}
function exportData(){
const payload=JSON.stringify({format:'mon-suivi',version:2,...data,unit},null,2),filename='mon-suivi-'+today()+'.json';
try{const file=new File([payload],filename,{type:'application/json'});
if(navigator.canShare&&navigator.canShare({files:[file]})){navigator.share({files:[file],title:'Mon Suivi — export de mes données'}).catch(()=>{});return}}catch(err){}
const blob=new Blob([payload],{type:'application/json'}),href=URL.createObjectURL(blob),a=document.createElement('a');a.href=href;a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(href),5000)}
function clearData(){if(demo){leaveDemo();return}if(!confirm('Effacer définitivement vos données locales ? Pensez à les exporter avant de continuer.'))return;try{localStorage.removeItem(KEY)}catch{storageOK=false}data=blank();demo=false;unit='kg';go('Accueil')}
document.addEventListener('submit',e=>{if(e.target.id!=='setup-form')return;e.preventDefault();const f=new FormData(e.target);if(!f.has('consent')||!f.has('terms'))return;data=blank();data.name=String(f.get('name')||'').trim().slice(0,60);data.consent=true;data.consentAt=new Date().toISOString();data.consentVersion='1';demo=false;unit='kg';page='Aujourd’hui';save()});
document.addEventListener('submit',e=>{
if(e.target.id==='goal-form'){e.preventDefault();const g=Number(new FormData(e.target).get('goal'));if(!Number.isInteger(g)||g<500||g>100000){const err=document.querySelector('#goal-error');err.textContent='Choisissez un objectif entre 500 et 100 000 pas.';err.hidden=false;return}data.stepsGoal=g;dlg.close();save();return}
if(e.target.id==='wgoal-form'){e.preventDefault();let g=Number(new FormData(e.target).get('goal'));if(unit==='lb')g=g/unitFactor;if(!Number.isFinite(g)||g<=0||g>700){const err=document.querySelector('#wgoal-error');err.textContent='Objectif invalide.';err.hidden=false;return}data.weightGoal=Math.round(g*100)/100;dlg.close();save();return}
});
document.addEventListener('click',e=>{
const el=e.target.closest('[data-action]');if(!el)return;e.preventDefault();
const [action,type,id]=el.dataset.action.split(':');
if(action==='go'){go(type);return}
if(action==='start'){if(data.consent){go('Aujourd’hui')}else go('Bienvenue');return}
if(action==='back'){go(data.consent||demo?'Aujourd’hui':'Accueil');return}
if(action==='demo'){startDemo();return}
if(action==='exit'){leaveDemo();return}
if(action==='add'){openForm(type);return}
if(action==='edit'){openForm(type,id);return}
if(action==='delete'){if(confirm('Supprimer cette entrée ?')){data[type]=data[type].filter(x=>String(x.id)!==id);save()}return}
if(action==='quickmood'){quickMood(type);return}
if(action==='period'){period=type;render();return}
if(action==='close'){dlg.close();return}
if(action==='point'){pointDialog(type);return}
if(action==='steps-goal'){openStepsGoal();return}
if(action==='steps-goal-off'){data.stepsGoal=null;save();return}
if(action==='weight-goal'){openWeightGoal();return}
if(action==='weight-goal-off'){data.weightGoal=null;save();return}
if(action==='pointedit'){dlg.close();openForm(type,id);return}
if(action==='pointdel'){dlg.close();if(confirm('Supprimer cette mesure ?')){data[type]=data[type].filter(x=>String(x.id)!==id);save()}return}
if(action==='name'){data.name=document.querySelector('#name').value.trim().slice(0,60);save();return}
if(action==='export'){exportData();return}
if(action==='import'){if(demo){alert('Quittez la démonstration pour importer vos propres données.');return}document.querySelector('#import-file')?.click();return}
if(action==='clear'){clearData();return}
});
document.addEventListener('change',async e=>{
if(e.target.id==='unit'){unit=e.target.value==='lb'?'lb':'kg';if(!demo){data.unit=unit;save()}else render();return}
if(e.target.id!=='import-file')return;if(demo)return;
const file=e.target.files?.[0];if(!file)return;
try{
if(file.size>2_000_000)throw Error('Le fichier est trop volumineux (2 Mo maximum).');
let current=null;try{current=localStorage.getItem(KEY)}catch{storageOK=false}try{localStorage.setItem(KEY+'-backup',current||'{}')}catch{}const parsed=validatePayload(JSON.parse(await file.text()));
modal('<h2>Importer votre sauvegarde ?</h2><p>Ce fichier contient '+parsed.weights.length+' mesures, '+parsed.meals.length+' repas, '+parsed.moods.length+' humeurs et '+parsed.steps.length+' jour(s) de pas.</p><p class="notice-error">Attention : votre suivi actuel sera remplacé. Une copie de secours de ce suivi est conservée dans le stockage local de ce navigateur jusqu’au prochain import.</p><div class="row">'+btn('Remplacer mon suivi','confirm-import')+btn('Annuler','close','secondary')+'</div>');
dlg.querySelector('[data-action="confirm-import"]').onclick=()=>{parsed.consent=true;parsed.consentAt=new Date().toISOString();data=parsed;demo=false;unit=data.unit;dlg.close();go('Profil');save()};
}catch(error){alert('Import impossible : '+error.message)}finally{e.target.value=''}
});
render();
