'use strict';
// Coach IA de Mon Suivi : discussion bien-être et nutrition via /api/coach (Mistral AI).
// Historique et accord conservés sur l’appareil uniquement. Rien n’est envoyé sans accord explicite.
(function(){
 const HKEY=KEY+'-coach',CKEY=KEY+'-coach-consent',MAX_KEEP=40;
 const SUGGEST=['Que manger ce soir ?','Combien d’eau boire aujourd’hui ?','À quelle heure manger ?','Un petit-déjeuner local et équilibré ?','Un goûter sain ?','Analyse ma journée'];
 let busy=false,memoryLog=[];
 const read=(k,d)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v??d}catch{return d}};
 const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{}};
 const canStore=()=>typeof data!=='undefined'&&data.consent&&!demo;
 const consent=()=>{const c=read(CKEY,null);return c&&c.v===1?c:null};
 const log=()=>canStore()?(Array.isArray(read(HKEY,[]))?read(HKEY,[]):[]):memoryLog;
 const setLog=l=>{l=l.slice(-MAX_KEEP);if(canStore())write(HKEY,l);else memoryLog=l};
 // Texte sûr : on échappe tout, puis on autorise seulement **gras**, listes et retours à la ligne.
 function rich(t){
  const lines=esc(t).split(/\n/);let html='',inList=false;
  for(const raw of lines){
   const line=raw.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
   const m=line.match(/^\s*(?:[-•*]|\d+[.)])\s+(.*)$/);
   if(m){if(!inList){html+='<ul>';inList=true}html+='<li>'+m[1]+'</li>';continue}
   if(inList){html+='</ul>';inList=false}
   if(line.trim())html+='<p>'+line+'</p>';
  }
  return html+(inList?'</ul>':'');
 }
 function context(){
  if(typeof data==='undefined')return '';
  const d=today(),lines=[];
  const meals=data.meals.filter(m=>m.date===d);
  if(meals.length){const total=meals.reduce((s,m)=>s+Number(m.value||0),0);lines.push('Repas notés aujourd’hui ('+meals.length+', ≈ '+Math.round(total)+' kcal) : '+meals.slice(-8).map(m=>m.name+' ≈ '+m.value+' kcal'+(m.protein!=null?', prot. '+m.protein+' g':'')).join(' ; '))}
  else lines.push('Aucun repas noté aujourd’hui.');
  const st=data.steps.find(x=>x.date===d);lines.push('Pas aujourd’hui : '+(st?st.value:'non renseigné')+(data.stepsGoal?' (objectif '+data.stepsGoal+')':''));
  const week=Array.from({length:7},(_,i)=>past(i)).map(x=>data.steps.find(e=>e.date===x)).filter(Boolean);
  if(week.length)lines.push('Moyenne de pas sur 7 jours : '+Math.round(week.reduce((s,e)=>s+e.value,0)/week.length));
  const w=sorted(data.weights);if(w.length){const last=w.at(-1),first=w.find(e=>e.date>=past(30))||last;lines.push('Dernier poids : '+last.value+' kg ('+last.date+')'+(first!==last?', variation sur 30 jours : '+(Math.round((last.value-first.value)*10)/10)+' kg':'')+(data.weightGoal?', objectif choisi : '+data.weightGoal+' kg':''))}
  const h=data.health.find(e=>e.date===d)||data.health.find(e=>e.date===past(1));
  if(h){const p=[];if(h.sleep!=null)p.push('sommeil '+h.sleep+' h');if(h.activeKcal!=null)p.push('calories actives '+h.activeKcal);if(h.restingHr!=null)p.push('FC repos '+h.restingHr);if(h.water!=null)p.push('eau '+h.water+' ml');if(p.length)lines.push('Apple Santé ('+h.date+') : '+p.join(', '))}
  const mood=data.moods.find(m=>m.date===d);if(mood)lines.push('Humeur du jour : '+mood.name);
  lines.push('Heure locale : '+new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}));
  return lines.join('\n').slice(0,1500);
 }
 function errText(code){
  if(code==='quota')return 'Le coach a beaucoup répondu aujourd’hui : la limite gratuite est atteinte. Réessaie demain, rien n’est jamais facturé.';
  if(code==='config')return 'Le coach n’est pas encore branché : la clé Mistral doit être ajoutée dans Vercel (voir le guide).';
  if(code==='disabled')return 'Le coach est temporairement désactivé.';
  if(code==='timeout')return 'Le coach met trop de temps à répondre. Réessaie dans un instant.';
  return 'Impossible de joindre le coach (réseau). Vérifie ta connexion et réessaie.';
 }
 function bubble(m){return '<div class="coach-msg coach-'+(m.role==='assistant'?'bot':m.role==='error'?'err':'me')+'">'+(m.role==='user'?'<p>'+esc(m.content).replace(/\n/g,'<br>')+'</p>':rich(m.content))+'</div>'}
 function screen(){
  const c=consent(),l=log();
  setTimeout(()=>{const box=document.querySelector('#coach-log');if(box)box.scrollTop=box.scrollHeight},0);
  const head='<section class="page-heading coach-heading"><div>'+btn(icon('back')+' Retour','go:Aujourd’hui','ghost small')+'<span class="page-eyebrow">MON COACH</span><h1>Coach bien-être<span class="page-dot">.</span></h1><p>Quoi manger, quoi boire, quand manger : demande-moi.</p></div></section>';
  if(!c)return '<div class="screen coach-screen">'+topbar()+head+'<section class="coach-consent v4-settings"><h2>Avant de commencer</h2><p>Tes questions sont envoyées à <strong>Mistral AI</strong> (Union européenne) via Vercel pour obtenir une réponse. L’application ne les stocke pas sur un serveur ; Mistral conserve les échanges jusqu’à 30 jours pour lutter contre les abus, puis les supprime.</p><p>Le coach donne des repères généraux de nutrition et de bien-être. <strong>Ce n’est pas un médecin</strong> : pour une maladie, une grossesse ou un traitement, demande l’avis d’un professionnel.</p><form id="coach-consent-form"><div class="consent-row"><label><input type="checkbox" name="agree"><span>J’accepte que mes questions soient envoyées au coach IA.</span></label></div><div class="consent-row"><label><input type="checkbox" name="share" checked><span>Partager avec le coach un résumé de mon suivi du jour (repas, pas, poids, sommeil, humeur) pour des conseils personnalisés.</span></label></div><p id="coach-consent-error" class="notice-error" role="alert" hidden></p><button type="submit">Commencer</button></form></section></div>';
  return '<div class="screen coach-screen">'+topbar()+head+
  '<section class="coach-chat"><div id="coach-log" class="coach-log" aria-live="polite">'+(l.length?l.map(bubble).join(''):'<div class="coach-msg coach-bot"><p>Bonjour'+(data.name?' '+esc(data.name):'')+' ! Je suis ton coach bien-être. Pose-moi une question sur ce que tu manges, ce que tu bois, tes horaires de repas, ton énergie ou ton sommeil.</p></div>')+'</div>'+
  '<div class="coach-suggest">'+SUGGEST.map(q=>'<button type="button" data-coach-ask="'+esc(q)+'">'+esc(q)+'</button>').join('')+'</div>'+
  '<form id="coach-form" class="coach-form"><label class="sr-only" for="coach-input">Ta question</label><textarea id="coach-input" maxlength="1500" rows="2" placeholder="Ex. Que manger après le sport ?"></textarea><button type="submit" aria-label="Envoyer">Envoyer</button></form>'+
  '<div class="coach-tools"><label><input type="checkbox" data-coach-share'+(c.share?' checked':'')+'> Partager mon suivi du jour</label><button type="button" class="quiet-link" data-coach-clear>Effacer la discussion</button><button type="button" class="quiet-link" data-coach-revoke>Retirer mon accord</button></div>'+
  '<p class="off-credit">Repères généraux, pas un avis médical. En cas d’urgence, appelle les secours.</p></section></div>';
 }
 async function ask(q){
  q=String(q||'').trim().slice(0,1500);if(!q||busy)return;
  const c=consent();if(!c){render();return}
  busy=true;
  const l=log().filter(m=>m.role!=='error');l.push({role:'user',content:q,t:Date.now()});setLog(l);
  const box=document.querySelector('#coach-log');
  if(box){box.innerHTML=l.map(bubble).join('')+'<div class="coach-msg coach-bot coach-typing" aria-label="Le coach écrit"><span></span><span></span><span></span></div>';box.scrollTop=box.scrollHeight}
  const input=document.querySelector('#coach-input');if(input)input.value='';
  let reply=null,err=null;
  try{
   const r=await fetch('api/coach',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:l.slice(-12).map(m=>({role:m.role,content:m.content})),context:c.share?context():''})});
   let d={};try{d=await r.json()}catch{}
   if(!r.ok||!d.ok)err=d.error||'network';else reply=String(d.reply||'');
  }catch{err='network'}
  const after=log().filter(m=>m.role!=='error');
  if(reply)after.push({role:'assistant',content:reply,t:Date.now()});
  setLog(after);busy=false;
  const shown=after.concat(err?[{role:'error',content:errText(err)}]:[]);
  const b2=document.querySelector('#coach-log');if(b2){b2.innerHTML=shown.map(bubble).join('');b2.scrollTop=b2.scrollHeight}
 }
 document.addEventListener('click',e=>{
  const a=e.target.closest('[data-coach-ask]');if(a){ask(a.dataset.coachAsk);return}
  if(e.target.closest('[data-coach-clear]')){if(confirm('Effacer la discussion avec le coach ?')){setLog([]);try{localStorage.removeItem(HKEY)}catch{}render()}return}
  if(e.target.closest('[data-coach-revoke]')){try{localStorage.removeItem(CKEY);localStorage.removeItem(HKEY)}catch{}memoryLog=[];render();return}
 });
 document.addEventListener('change',e=>{if(e.target.matches('[data-coach-share]')){const c=consent();if(c)write(CKEY,{...c,share:e.target.checked})}});
 document.addEventListener('submit',e=>{
  if(e.target.id==='coach-consent-form'){e.preventDefault();const f=new FormData(e.target);if(!f.has('agree')){const er=document.querySelector('#coach-consent-error');er.textContent='Coche la première case pour utiliser le coach.';er.hidden=false;return}write(CKEY,{v:1,share:f.has('share'),at:new Date().toISOString()});render();return}
  if(e.target.id==='coach-form'){e.preventDefault();ask(document.querySelector('#coach-input')?.value)}
 });
 document.addEventListener('keydown',e=>{if(e.target.id==='coach-input'&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();ask(e.target.value)}});
 window.MonSuiviCoach=Object.freeze({screen,rich,context});
})();
