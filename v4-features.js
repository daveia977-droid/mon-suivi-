'use strict';
(function(){
 const shortcutName='Mon Suivi — Mes pas';
 const shortcutUrl='shortcuts://run-shortcut?name='+encodeURIComponent(shortcutName);
 const moods=['À plat','Moyen','Bien','En forme'];
 let dismissedDay='',photoURL=null;
 const button=(text,action)=>'<button type="button" class="secondary" data-v4="'+action+'">'+text+'</button>';
 const reminder=()=>data.moodReminder||{enabled:false,time:'20:00'};
 function reminderSettings(){
  const r=reminder();
  return '<section class="v4-settings" id="v4-reminder-settings"><h2>Mon rappel d’humeur</h2><label><input id="v4-reminder-enabled" type="checkbox" '+(r.enabled?'checked':'')+'> Rappel lorsque l’application est ouverte</label><label>Heure locale <input id="v4-reminder-time" type="time" value="'+esc(r.time)+'"></label><p>Comment te sens-tu aujourd’hui ? Aucun choix n’est enregistré automatiquement.</p>'+button('Ajouter au calendrier iPhone','calendar')+'<p>Pour un rappel même lorsque l’application est fermée, importe cet événement dans Calendrier et vérifie son alerte. Pour le modifier ou le supprimer ensuite, utilise Calendrier. Le réglage ci-dessus concerne seulement le rappel dans Mon Suivi.</p><p>Les notifications Web Push ne sont pas activées dans cette version.</p></section>';
 }
 function healthSettings(){
  const share=window.MON_SUIVI_CONFIG?.healthShortcutShareUrl;
  const ready=window.MON_SUIVI_CONFIG?.healthShortcutValidated===true&&typeof share==='string'&&/^https:\/\/www\.icloud\.com\/shortcuts\/[a-z0-9-]+$/i.test(share);
  const install=ready?'<a href="'+esc(share)+'" rel="noopener noreferrer">Installer le raccourci</a>':'<button type="button" disabled>Installer le raccourci — lien en préparation</button>';
  const sync=ready?'<a href="'+shortcutUrl+'">Synchroniser mes pas</a>':'<button type="button" disabled>Synchroniser mes pas</button>';

  const latest=data.steps.filter(s=>s.source==='sante-raccourcis').sort((a,b)=>(b.syncedAt||b.date).localeCompare(a.syncedAt||a.date))[0];
  const label=latest?(latest.syncedAt?new Date(latest.syncedAt).toLocaleString('fr-FR'):latest.date)+' · '+fmt(latest.value)+' pas':'Aucune synchronisation enregistrée';
  return '<section class="v4-settings" id="v4-health"><h2>Connecter Apple Santé</h2><p>Dernière synchronisation : '+esc(label)+'</p><p>Le raccourci iPhone « '+shortcutName+' » doit d’abord être installé. Mon Suivi ne lit jamais directement Santé.</p>'+install+'<p>Le lien d’installation doit être créé et vérifié sur un iPhone avant de pouvoir être proposé ici.</p>'+sync+button('Aide et autorisations','health-help')+'<p>Après installation du raccourci seulement. La saisie manuelle reste disponible avec le bouton Noter.</p></section>';
 }
 function statistics(host){
  const days=period==='7'?7:30,start=past(days-1);
  const steps=[...new Map(data.steps.filter(s=>s.date>=start&&s.date<=today()).map(s=>[s.date,s])).values()],meals=data.meals.filter(m=>m.date>=start&&m.date<=today()),moodRows=[...new Map(data.moods.filter(m=>m.date>=start&&m.date<=today()).map(m=>m.date? [m.date,m]:['',m])).values()];
  const total=steps.reduce((n,s)=>n+s.value,0),weights=sorted(data.weights.filter(w=>w.date>=start&&w.date<=today()));
  const change=weights.length>1?shownWeight(weights[weights.length-1].value-weights[0].value)+' '+unit:'—';
  const section=document.createElement('section');section.id='v4-statistics';section.className='v4-settings';
  section.innerHTML='<h2>Mon bilan sur '+days+' jours</h2><div class="row">'+button('7 jours','stats-7')+button('30 jours','stats-30')+'</div><div class="v4-statistics"><article><strong>'+fmt(total)+'</strong><span>pas sur '+steps.length+' jour(s) renseigné(s)</span></article><article><strong>'+(steps.length?fmt(Math.round(total/steps.length)):'—')+'</strong><span>pas par jour renseigné</span></article><article><strong>'+fmt(meals.length)+'</strong><span>repas notés</span></article><article><strong>'+esc(change)+'</strong><span>variation du poids sur la période</span></article></div><h3>Mon humeur</h3><p>'+moods.map(name=>esc(name)+' : '+moodRows.filter(m=>m.name===name).length).join(' · ')+'</p><p>Les jours sans saisie restent inconnus. Ces chiffres décrivent les notes enregistrées, sans jugement.</p>';
  host.querySelector('.page-heading')?.insertAdjacentElement('afterend',section);
 }
 function photoPanel(){
  const slot=document.querySelector('.photo-fallback-card');
  if(!slot||slot.querySelector('#v4-local-photo'))return;
  const panel=document.createElement('div');panel.id='v4-local-photo';panel.className='v4-settings';
  panel.innerHTML='<h3>Voir mon repas sur cet appareil</h3><label>Prendre une photo<input id="v4-photo-camera" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"></label><label>Importer une photo<input id="v4-photo-file" type="file" accept="image/jpeg,image/png,image/webp"></label><img id="v4-photo-preview" alt="Photo de votre repas, sur cet appareil uniquement" hidden style="max-width:100%;max-height:220px;object-fit:contain"><p id="v4-photo-status" role="status">La photo reste sur cet appareil et n’est pas enregistrée. La reconnaissance automatique est indisponible : décris le plat ci-dessous pour chercher des alternatives, puis corrige les quantités manuellement.</p>';
  slot.prepend(panel);
 }
 function mount(){
  if(typeof data==='undefined')return;
  if(!data.consent||!reminder().enabled||data.moods.some(m=>m.date===today()))document.querySelector('#v4-mood-prompt')?.remove();
  const profile=document.querySelector('.profile-screen'),activity=document.querySelector('.activity-screen'),progress=document.querySelector('.progress-screen');
  if(profile&&!profile.querySelector('#v4-reminder-settings'))profile.querySelector('.profile-help')?.insertAdjacentHTML('beforebegin',reminderSettings());
  if(activity&&!activity.querySelector('#v4-health'))activity.querySelector('.health-sync-card')?.insertAdjacentHTML('afterend',healthSettings());
  if(progress&&!progress.querySelector('#v4-statistics'))statistics(progress);
  const meals=document.querySelector('.meals-screen');
  if(meals&&!meals.querySelector('#v4-guidance'))meals.insertAdjacentHTML('beforeend','<details class="v4-settings" id="v4-guidance"><summary>Des repères pour mes repas, sans IA</summary><p>Compose selon tes goûts, ta faim, ton budget et les aliments disponibles. Les recettes et leurs portions sont des propositions ajustables.</p><p>Pour varier, explore un légume, un féculent et une source de protéines que tu apprécies. Aucun aliment ne mérite de culpabilité.</p><p>Ce texte est un repère général, pas une analyse de ton repas ni un conseil médical personnalisé. Le conseiller IA reste désactivé.</p></details>');
  photoPanel();
  if(photoURL&&!document.querySelector('#v4-photo-file')){URL.revokeObjectURL(photoURL);photoURL=null}
 }
 new MutationObserver(mount).observe(document.querySelector('#app'),{childList:true,subtree:true});
 new MutationObserver(mount).observe(document.querySelector('#dialog'),{childList:true,subtree:true});
 document.querySelector('#dialog').addEventListener('close',()=>{
  if(photoURL){URL.revokeObjectURL(photoURL);photoURL=null}
  const image=document.querySelector('#v4-photo-preview');if(image){image.removeAttribute('src');image.hidden=true}
  for(const id of ['v4-photo-file','v4-photo-camera']){const input=document.getElementById(id);if(input)input.value=''}
 });
 mount();
 function calendar(){
  const r=reminder(),parts=r.time.split(':').map(Number),date=new Date();
  date.setHours(parts[0],parts[1],0,0);if(date<=new Date())date.setDate(date.getDate()+1);
  const stamp=d=>iso(d).replace(/-/g,'')+'T'+String(d.getHours()).padStart(2,'0')+String(d.getMinutes()).padStart(2,'0')+'00';
  const end=new Date(date.getTime()+300000);
  const fold=line=>{let result='',part='';for(const char of line){if(new TextEncoder().encode(part+char).length>75){result+=part+'\r\n';part=' '+char}else part+=char}return result+part};
  const content=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Mon Suivi//Rappel humeur//FR','CALSCALE:GREGORIAN','BEGIN:VEVENT','UID:mon-suivi-humeur-local@mon-suivi-six.vercel.app','DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,''),'DTSTART:'+stamp(date),'DTEND:'+stamp(end),'RRULE:FREQ=DAILY',"SUMMARY:Comment te sens-tu aujourd’hui ?",'DESCRIPTION:Ouvre Mon Suivi puis choisis ton humeur. Aucun choix automatique.','URL:https://mon-suivi-six.vercel.app/#humeur','BEGIN:VALARM','ACTION:DISPLAY','TRIGGER:PT0S',"DESCRIPTION:Comment te sens-tu aujourd’hui ?",'END:VALARM','END:VEVENT','END:VCALENDAR',''].map(fold).join('\r\n');
  const url=URL.createObjectURL(new Blob([content],{type:'text/calendar;charset=utf-8'})),link=document.createElement('a');
  link.href=url;link.download='mon-suivi-rappel-humeur.ics';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);
 }
 function checkReminder(){
  if(typeof data==='undefined'||!data.consent||demo||document.visibilityState!=='visible')return;
  const r=reminder(),now=new Date(),time=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  if(!r.enabled||time<r.time||dismissedDay===today()||data.moods.some(m=>m.date===today())||document.querySelector('dialog[open]')||document.querySelector('#pwa-update')||document.querySelector('#v4-mood-prompt'))return;
  const panel=document.createElement('section');panel.id='v4-mood-prompt';panel.className='v4-notice';panel.setAttribute('aria-label','Rappel d’humeur');
  panel.innerHTML='<strong>Comment te sens-tu aujourd’hui ?</strong><div class="v4-mood-choices">'+moods.map((m,i)=>button(m,'mood-'+i)).join('')+'</div>'+button('Plus tard','mood-later');
  document.body.append(panel);
 }
 document.addEventListener('click',e=>{
  const control=e.target.closest('[data-v4]');if(!control)return;
  const action=control.dataset.v4;
  if(action==='calendar')calendar();
  if(action==='health-help')openSanteHelp();
  if(action==='stats-7'||action==='stats-30'){period=action.slice(6);render()}
  if(action==='mood-later'){dismissedDay=today();document.querySelector('#v4-mood-prompt')?.remove()}
  if(/^mood-[0-3]$/.test(action)){if(data.consent&&!demo)quickMood(moods[Number(action.slice(-1))]);document.querySelector('#v4-mood-prompt')?.remove()}
 });
 document.addEventListener('change',e=>{
  if(e.target.id==='v4-reminder-enabled'||e.target.id==='v4-reminder-time'){
   const enabled=document.querySelector('#v4-reminder-enabled').checked,time=document.querySelector('#v4-reminder-time').value;
   if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))return;
   data.moodReminder={enabled,time};save();
   if(!enabled)document.querySelector('#v4-mood-prompt')?.remove();
   checkReminder();
  }
  if(e.target.id==='v4-photo-file'||e.target.id==='v4-photo-camera'){
   const file=e.target.files?.[0],status=document.querySelector('#v4-photo-status'),img=document.querySelector('#v4-photo-preview');
   if(photoURL){URL.revokeObjectURL(photoURL);photoURL=null}img.hidden=true;
   if(!file)return;
   if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>20000000){status.textContent='Choisis une photo JPEG, PNG ou WebP de moins de 20 Mo.';return}
   photoURL=URL.createObjectURL(file);img.onload=()=>{img.hidden=false};img.onerror=()=>{status.textContent='Cette photo ne peut pas être affichée. Essaie une image JPEG.'};img.src=photoURL;
   status.textContent='Aperçu local uniquement. Aucun aliment ni nutriment n’a été identifié automatiquement.';
  }
 });
 if(location.hash==='#humeur'){history.replaceState(null,'',location.pathname+location.search);if(data.consent)go('Aujourd’hui')}
 document.addEventListener('visibilitychange',checkReminder);
 setInterval(checkReminder,30000);
 checkReminder();
})();
