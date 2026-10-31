'use strict';
(function(){
 const M=MonSuiviTeddy;let tab='top',editing=false,message='',historyPage=0,viewDay=today();
 const control=(label,action,cl='secondary')=>'<button type="button" class="'+cl+'" data-teddy="'+action+'">'+label+'</button>';
 const pretty=date=>new Date(date+'T12:00:00').toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'});
 function drawing(t,date,mini=false){return MonSuiviTeddyArt.draw(t,date,mini)}
 function card(){const t=data.teddy,s=t?M.status(t,today()):null;return '<section class="td-entry"><div>'+drawing(t,today(),true)+'</div><div><span class="page-eyebrow">MON COMPAGNON</span><h2>Mon Teddy</h2><p>'+(s?'Jour '+s.day+' sur 30 · '+s.journal+' bilan(s) ce cycle':'Une aventure toute douce, à ton rythme.')+'</p>'+control('Découvrir mon Teddy','open','compact-outline')+'</div></section>'}
 function screen(){
  const t=data.teddy;
  if(!t)return '<div class="screen teddy-screen">'+topbar()+control('← Mes progrès','back','ghost')+'<section class="page-heading"><div><span class="page-eyebrow">UNE AVENTURE DE 30 JOURS</span><h1>Mon Teddy<span class="page-dot">.</span></h1><p>Un compagnon pour tes petits pas.</p></div></section>'+drawing(null,today())+'<section class="td-panel"><h2>Grandir, avec douceur</h2><p>Teddy grandit au fil des jours. Chaque bilan rempli compte, quelle que soit ta réponse. Ta collection reste à toi, même si tu fais une pause.</p><p>En commençant, tu actives l’enregistrement local de ton journal et de ta collection. Ils seront inclus dans tes sauvegardes.</p>'+(demo?'<p>Crée ton espace local pour commencer une aventure et conserver ta collection.</p>':control('Commencer mon aventure','start','wide'))+'<p class="td-muted">Gratuit · Sans achat · Sans publicité</p></section></div>';
  const s=M.status(t,today()),lockedDay=t.furthestDay,items=M.items[tab],selected=tab==='scene'?t.scene:t.outfit[tab];
  const wardrobe='<section class="td-panel" id="td-wardrobe"><div class="td-section-head"><h2>'+(tab==='scene'?'Mon décor':'Habiller Teddy')+'</h2>'+control('Fermer','close-wardrobe','quiet-link')+'</div><div class="td-tabs" role="group" aria-label="Catégories de la garde-robe">'+[['top','Hauts'],['accessory','Accessoires'],['shoes','Chaussures'],['special','Tenues spéciales'],['scene','Décors']].map(([id,label])=>'<button type="button" data-teddy="tab:'+id+'" aria-pressed="'+(tab===id)+'">'+label+'</button>').join('')+'</div><div class="td-inventory">'+items.map(item=>{const unlocked=M.isUnlocked(t,item),active=item.id===selected;const preview={...t,outfit:{...t.outfit}};if(tab==='scene')preview.scene=item.id;else preview.outfit[tab]=item.id;return '<button type="button" data-teddy="choose:'+tab+':'+item.id+'" aria-pressed="'+active+'" '+(!unlocked?'disabled':'')+'>'+drawing(preview,today(),true)+'<strong>'+esc(item.name)+(active?' ✓':'')+'</strong><span>'+(unlocked?'Disponible':item.entries?item.entries+' bilans remplis':'Jour '+item.day+' de l’aventure')+'</span></button>'}).join('')+'</div><p class="td-muted">Chaque choix est enregistré sur cet appareil. Les vêtements acquis restent disponibles à chaque cycle.</p>'+control('Réinitialiser la tenue','reset','quiet-link')+'</section>';
  const trophies=s.trophies;historyPage=Math.min(historyPage,Math.max(0,Math.ceil(trophies/12)-1));const last=Math.max(0,trophies-historyPage*12),first=Math.max(0,last-12);
  return '<div class="screen teddy-screen">'+topbar()+control('← Mes progrès','back','ghost')+'<section class="page-heading"><div><span class="page-eyebrow">CYCLE '+(s.cycle+1)+' · '+esc(s.collection)+'</span><h1>Mon Teddy<span class="page-dot">.</span></h1><p>Jour '+s.day+' sur 30 · Étape '+s.stage+' sur 4</p></div></section>'+drawing(t,today())+'<section class="td-cycle"><div><strong>Jour '+s.day+' / 30</strong><span>'+s.journal+' bilan(s) rempli(s)</span></div><progress max="30" value="'+s.day+'" aria-label="Jour du cycle"></progress><p>Chaque petit pas compte.</p></section>'+(s.day===30?'<section class="td-celebration" role="status">✦ Une aventure de 30 jours ! Ton trophée rejoint ta collection. Demain, un nouveau cycle commence.</section>':'')+(message?'<p class="td-feedback" role="status">'+esc(message)+'</p>':'')+'<div class="td-actions">'+control('Habiller Teddy','wardrobe','wide')+control('Changer de décor','scenes','secondary wide')+'</div>'+(editing?wardrobe:'')+'<section class="td-panel"><span class="page-eyebrow">UN MOMENT POUR TOI</span><h2>Mon journal du jour</h2><p>'+(t.records.some(r=>r.date===today())?'Ton bilan est enregistré. Tu peux le modifier.':'Une réponse suffit à participer. Aucun aliment ne te fait perdre une récompense.')+'</p>'+control(t.records.some(r=>r.date===today())?'Modifier mon bilan':'Remplir mon bilan','journal','wide')+'</section><section class="td-panel"><h2>Ma collection</h2><p>'+trophies+' trophée(s) · '+t.records.length+' jour(s) de journal</p><p class="td-muted">Trois thèmes alternent tous les 30 jours. Les tenues Jardin et Étoiles se débloquent aux jours 31 et 61 ; la collection reste acquise.</p><details id="td-history"><summary>Mes aventures précédentes</summary>'+(trophies?Array.from({length:last-first},(_,n)=>{const i=last-1-n,start=M.dateAfter(t.startDate,i*30),end=M.dateAfter(start,29),count=t.records.filter(r=>r.date>=start&&r.date<=end).length;return '<article class="td-history"><strong>✦ Cycle '+(i+1)+'</strong><span>'+pretty(start)+' → '+pretty(end)+'</span><small>'+count+' bilan(s) · trophée des 30 jours</small></article>'}).join('')+'<div class="row">'+(historyPage?control('Plus récents','history-prev','secondary'):'')+(first?control('Plus anciens','history-next','secondary'):'')+'</div>':'<p>Ton premier trophée arrive au jour 30.</p>')+'</details></section><section class="td-panel"><h2>Mon rappel du soir</h2><p>Facultatif, à 20 h par défaut. Le rappel dans l’application fonctionne lorsqu’elle est ouverte. Pour un rappel hors application, un événement Calendrier est proposé dans Profil ; son alerte doit être vérifiée sur ton iPhone.</p>'+control('Régler mon rappel','reminder','secondary')+'</section></div>';
 }
 function open(){editing=false;message='';viewDay=today();if(data.teddy&&!demo){M.advance(data.teddy,today());save()}go('Teddy')}
 function journal(){
  if(!data.teddy||demo)return;const row=data.teddy.records.find(r=>r.date===today()),mood=data.moods.find(r=>r.date===today());
  modal('<form id="td-journal-form" data-day="'+today()+'"><span class="page-eyebrow">'+pretty(today())+'</span><h2>Mon journal du jour</h2><fieldset><legend>As-tu consommé des produits sucrés transformés aujourd’hui ?</legend><p class="td-muted">Par exemple : sodas, bonbons ou biscuits sucrés. Si tu hésites, « Je ne sais pas » convient aussi.</p><div class="td-answer">'+[['non','Non'],['oui','Oui'],['inconnu','Je ne sais pas']].map(([value,label])=>'<label><input type="radio" name="sugar" required value="'+value+'" '+(row?.sugar===value?'checked':'')+'><span>'+label+'</span></label>').join('')+'</div></fieldset><label>Mon humeur (facultatif)<select name="mood"><option value="">Ne pas renseigner</option>'+['À plat','Moyen','Bien','En forme'].map(name=>'<option '+(mood?.name===name?'selected':'')+'>'+name+'</option>').join('')+'</select></label><p class="td-muted">Toutes les réponses contribuent de la même façon. Rien n’est enregistré avant ta validation.</p><p id="td-journal-error" role="alert" hidden></p><div class="row"><button type="submit">Enregistrer mon bilan</button>'+btn('Annuler','close','secondary')+'</div></form>');
 }
 document.addEventListener('click',event=>{
  const button=event.target.closest('[data-teddy]');if(!button)return;const [action,group,id]=button.dataset.teddy.split(':');
  if(action==='open'){open();return}if(action==='back'){go('Progrès');return}
  if(action==='start'){if(demo||!data.consent)return;data.teddy=M.create(today());message='Ton aventure commence. Bienvenue, Teddy !';save();return}
  if(action==='reminder'){go('Profil');document.querySelector('#v4-reminder-settings')?.scrollIntoView({behavior:'smooth'});return}
  if(!data.teddy||demo)return;
  M.advance(data.teddy,today());
  if(action==='journal'){journal();return}
  if(action==='wardrobe'||action==='scenes'){editing=true;tab=action==='scenes'?'scene':'top';message='';render();document.querySelector('#td-wardrobe')?.scrollIntoView({behavior:'smooth',block:'start'});return}
  if(action==='close-wardrobe'){editing=false;render();document.querySelector('[data-teddy="wardrobe"]')?.focus({preventScroll:true});return}
  if(action==='tab'&&M.items[group]){tab=group;render();document.querySelector('[data-teddy="tab:'+group+'"]')?.focus({preventScroll:true});return}
  if(action==='choose'){
   const item=M.items[group]?.find(i=>i.id===id);if(!M.isUnlocked(data.teddy,item))return;
   if(group==='scene')data.teddy.scene=id;else data.teddy.outfit[group]=id;
   message='Ton choix est enregistré.';save();document.querySelector('[data-teddy="choose:'+group+':'+id+'"]')?.focus({preventScroll:true});return;
  }
  if(action==='history-next'||action==='history-prev'){historyPage=Math.max(0,historyPage+(action==='history-next'?1:-1));render();const history=document.querySelector('#td-history');if(history){history.open=true;history.scrollIntoView({block:'nearest'})}return}
  if(action==='reset'){data.teddy.outfit={top:'tee',accessory:'none',shoes:'none',special:'none'};message='Tenue réinitialisée. Ta progression et ta collection sont conservées.';save()}
 });
 document.addEventListener('submit',event=>{
  if(event.target.id!=='td-journal-form')return;event.preventDefault();const form=event.target,error=form.querySelector('#td-journal-error');
  try{
   if(!data.consent||demo||!data.teddy)throw Error('Ouvre ton espace local pour enregistrer ton bilan.');
   if(form.dataset.day!==today())throw Error('La journée a changé. Ferme ce bilan puis ouvre celui d’aujourd’hui.');
   const values=new FormData(form),sugar=values.get('sugar'),mood=values.get('mood');if(mood&&!['À plat','Moyen','Bien','En forme'].includes(mood))throw Error('Choisis une humeur proposée.');
   M.record(data.teddy,today(),sugar);
   if(mood){const previous=data.moods.find(r=>r.date===today());data.moods=data.moods.filter(r=>r.date!==today()).concat([{id:previous?.id||'teddy-mood-'+today(),date:today(),name:mood,note:previous?.note||''}])}
   message='Ton bilan est enregistré. Merci pour ce moment avec Teddy.';dlg.close();document.querySelector('#v4-mood-prompt')?.remove();save();
  }catch(e){error.textContent=e.message;error.hidden=false}
 });
 window.MonSuiviTeddyUI=Object.freeze({screen,card,drawing,open,journal});
 function dateChanged(){if(page==='Teddy'&&data.teddy&&!demo&&viewDay!==today()){viewDay=today();M.advance(data.teddy,today());message='Une nouvelle journée commence. Ton journal t’attend.';save()}}
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')dateChanged()});setInterval(dateChanged,60000);
 function fromCalendar(){if(location.hash!=='#teddy')return;history.replaceState(null,'',location.pathname+location.search);if(data.consent)open()}
 window.addEventListener('hashchange',fromCalendar);fromCalendar();
})();
