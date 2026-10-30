/* Mon Suivi V3.1 — guide de recettes, photos locales sourcées et favoris.
 * Ajout progressif à l'onglet Repas : ne modifie ni les données ni l'application V3.
 */
(function(){
'use strict';
const recipes=window.MON_SUIVI_RECIPES||[];
const alternatives=window.MON_SUIVI_ALTERNATIVES||[];
if(!recipes.length||!alternatives.length)return;
const state={section:'recipes',category:'ivo',meal:'lunch',query:'',altQuery:'',visible:10,selected:null,favorites:false,maxMinutes:0,exclude:''};
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const escAttr=escapeHtml;
const photos=window.MON_SUIVI_PHOTOS||{};
const fallback='./food-placeholder.svg';
const photoFor=item=>photos[item.id]||photos[item.name]||photos[recipeByAlt[item.name]];
const img=item=>{
 const photo=photoFor(item);
 return '<span class="mg-image-wrap"><img class="mg-img" src="'+escAttr(photo?photo.src:fallback)+'" alt="'+escAttr(photo?photo.caption:'Photo non disponible : '+item.name)+'" loading="lazy" decoding="async" width="640" height="440">'+(!photo?'<span class="mg-photo-pending">Photo à venir</span>':'')+'</span>';
};
function credit(item){
 const p=photoFor(item);if(!p)return '<p class="mg-photo-credit">Photo non disponible : repère visuel provisoire.</p>';
 return '<p class="mg-photo-credit">Exemple de présentation. Photo : '+escapeHtml(p.author)+' · <a href="'+escAttr(p.page)+'" target="_blank" rel="noopener noreferrer">Source</a> · <a href="'+escAttr(p.licenseUrl)+'" target="_blank" rel="noopener noreferrer">'+escapeHtml(p.license)+'</a> · Redimensionnée.</p>';
}
document.addEventListener('error',event=>{
 const image=event.target;
 if(image instanceof HTMLImageElement&&image.classList.contains('mg-img')&&!image.src.endsWith('/food-placeholder.svg')){
  image.src=fallback;image.alt='Photo indisponible';const label=document.createElement('span');label.className='mg-photo-pending';label.textContent='Photo indisponible';image.parentNode.append(label);
 }
},true);
const favorites=()=>typeof data!=='undefined'?(data.recipeFavorites||[]):[];
function recentMeals(){
 if(typeof data==='undefined'||!data.meals.length)return '';
 const seen=new Set(),rows=[...data.meals].reverse().sort((a,b)=>b.date.localeCompare(a.date)).filter(m=>{if(seen.has(m.name))return false;seen.add(m.name);return true}).slice(0,5);
 return '<section class="mg-recents"><h3>Mes repas récents</h3><p>Reprenez un repas, puis ajustez-le avant de l’enregistrer.</p>'+rows.map(m=>btn(escapeHtml(m.name)+' · Reprendre','repeat:'+m.id,'mg-repeat')).join('')+'</section>';
}
const btn=(label,action,cls='')=>'<button type="button" class="'+cls+'" data-guide-action="'+escAttr(action)+'">'+label+'</button>';
const countLabel=(n)=>n+' plat'+(n>1?'s':'');
const mealOk=r=>state.meal==='all'||r.meal==='both'||r.meal===state.meal;
function filteredRecipes(){
 const q=norm(state.query);
 return recipes.filter(r=>(state.category==='all'||r.category===state.category)&&mealOk(r)&&
 (!state.favorites||favorites().includes(r.id))&&(!state.maxMinutes||r.minutes<=state.maxMinutes)&&
 (!state.exclude||!norm(r.ingredients.join(' ')).includes(norm(state.exclude)))&&
 (!q||q.split(/\s+/).every(word=>norm(r.name+' '+r.ingredients.join(' ')).includes(word))));
}
function filteredAlt(){const q=norm(state.altQuery);return alternatives.filter(a=>!q||norm(a.name+' '+a.choices.join(' ')).includes(q))}
function icon(name){
 const paths={book:'<path d="M4 5c3-1 6-1 8 1 2-2 5-2 8-1v15c-3-1-6-1-8 1-2-2-5-2-8-1Z"/><path d="M12 6v15"/>',leaf:'<path d="M20 4c-12 0-17 4-17 12a5 5 0 0 0 5 5C16 21 20 12 20 4Z"/><path d="M5 19c3-5 7-8 13-11"/>',chevron:'<path d="m9 18 6-6-6-6"/>',close:'<path d="M18 6 6 18M6 6l12 12"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',spark:'<path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7Z"/>'};
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(paths[name]||paths.leaf)+'</svg>';
}
function recipeCard(r){
 return '<button class="mg-recipe-card" type="button" data-guide-action="recipe:'+r.id+'" aria-label="Voir les ingrédients et la préparation : '+escAttr(r.name)+'">'+
 '<span class="mg-card-photo">'+img(r)+'<span class="mg-card-minute">'+r.minutes+' min</span></span>'+
 '<span class="mg-card-content"><span class="mg-card-title">'+escapeHtml(r.name)+'</span>'+
 '<span class="mg-card-tag">'+(r.category==='ivo'?'Cuisine ivoirienne':'Idée à varier')+'</span>'+
 '<span class="mg-card-more">Ingrédients et recette '+icon('chevron')+'</span></span></button>';
}
function altCard(a){
 return '<button class="mg-recipe-card mg-alt-card" type="button" data-guide-action="alternative:'+a.id+'" aria-label="Voir les alternatives à : '+escAttr(a.name)+'">'+
 '<span class="mg-card-photo">'+img(a)+'</span><span class="mg-card-content"><span class="mg-card-title">'+escapeHtml(a.name)+'</span>'+
 '<span class="mg-card-tag">2 idées à découvrir</span><span class="mg-card-more">Voir les alternatives '+icon('chevron')+'</span></span></button>';
}
function renderGuide(){
 const root=document.querySelector('.mealguide-root');if(!root)return;
 let html='<div class="mg-top"><span class="mg-eyebrow">'+icon('spark')+' VOTRE GUIDE GOURMAND</span><h2>On mange quoi aujourd’hui ?</h2>'+
 '<p>Des plats ivoiriens, des idées pour déjeuner ou dîner, et des alternatives à découvrir.</p></div>'+recentMeals()+
 '<div class="mg-tabset" aria-label="Rubriques du guide">'+
 btn(icon('book')+' Choisir un plat','section:recipes',state.section==='recipes'?'mg-tab mg-active':'mg-tab')+
 btn(icon('leaf')+' Alternatives','section:alternatives',state.section==='alternatives'?'mg-tab mg-active':'mg-tab')+'</div>';
 if(state.section==='recipes'){
   const rows=filteredRecipes(),shown=rows.slice(0,state.visible);
   html+='<div class="mg-toolbar"><div class="mg-chips" aria-label="Origine des recettes">'+
    btn('Ivoirien','category:ivo',state.category==='ivo'?'mg-chip mg-selected':'mg-chip')+
    btn('Autres idées','category:var',state.category==='var'?'mg-chip mg-selected':'mg-chip')+
    btn('Tous','category:all',state.category==='all'?'mg-chip mg-selected':'mg-chip')+'</div>'+
    '<div class="mg-chips" aria-label="Moment du repas">'+
    btn('Déjeuner','meal:lunch',state.meal==='lunch'?'mg-chip mg-selected-alt':'mg-chip')+
    btn('Dîner','meal:dinner',state.meal==='dinner'?'mg-chip mg-selected-alt':'mg-chip')+
    btn('Les deux','meal:all',state.meal==='all'?'mg-chip mg-selected-alt':'mg-chip')+'</div></div>'+
    '<label class="mg-search">'+icon('search')+'<span class="sr-only">Rechercher une recette ou un ingrédient</span>'+
    '<input id="mg-recipe-search" type="search" autocomplete="off" placeholder="Plat ou ingrédient… " value="'+escAttr(state.query)+'" maxlength="80"></label>'+
    '<div class="mg-advanced">'+btn(state.favorites?'Tous mes plats':'Mes favoris','favorites','mg-chip'+(state.favorites?' mg-selected':''))+
 '<label>Temps maximal<select id="mg-max-minutes"><option value="0">Peu importe</option>'+[20,30,45,60].map(n=>'<option value="'+n+'" '+(state.maxMinutes===n?'selected':'')+'>'+n+' min</option>').join('')+'</select></label>'+
 '<label>Ingrédient à écarter<input id="mg-exclude" type="search" maxlength="60" value="'+escAttr(state.exclude)+'" placeholder="Ex. arachide"></label></div><p class="mg-hint">Ce filtre textuel ne garantit pas l’absence d’allergènes : vérifiez toujours les ingrédients.</p>'+
 '<div class="mg-results-head"><strong>'+countLabel(rows.length)+'</strong><span>Ingrédients détaillés dans chaque fiche</span></div>'+
    '<div class="mg-grid" id="mg-card-list">'+(shown.length?shown.map(recipeCard).join(''):'<p class="mg-empty">Aucun plat trouvé. Essayez un autre ingrédient ou choisissez « Tous ».</p>')+'</div>'+
    '<div class="mg-more-wrap" '+(rows.length>state.visible?'':'hidden')+'>'+btn('Afficher plus de plats','more','mg-more')+'</div>'+
    '<p class="mg-hint">Les ingrédients et quantités sont indicatifs pour 1 personne. Les recettes varient selon les familles et les régions. Aucune calorie n’est calculée sans données fiables.</p>';
 }else{
   const rows=filteredAlt();
   html+='<div class="mg-alternatives-intro">'+icon('leaf')+'<div><strong>Des idées, pas des interdictions</strong><span>Choisissez un aliment ci-dessous pour voir deux alternatives avec leurs ingrédients et préparations. Aucune analyse de photo nécessaire.</span></div></div>'+
    '<label class="mg-search">'+icon('search')+'<span class="sr-only">Rechercher un aliment à remplacer</span>'+
    '<input id="mg-alt-search" type="search" autocomplete="off" placeholder="Ex. chips, alloco, pizza…" maxlength="80" value="'+escAttr(state.altQuery)+'"></label>'+
    '<div class="mg-results-head"><strong>'+rows.length+' catégories</strong><span>Photos sourcées, repères locaux si indisponibles</span></div>'+
    '<div class="mg-grid" id="mg-card-list">'+(rows.length?rows.map(altCard).join(''):'<p class="mg-empty">Aucune catégorie trouvée. Essayez un autre nom.</p>')+'</div>'+
    '<p class="mg-hint">Les photographies sont des exemples de présentation ; les repères « Photo à venir » ne représentent pas le plat. Les propositions ne remplacent pas un avis médical ou nutritionnel et ne classent aucun aliment comme « mauvais ».</p>';
 }
 root.innerHTML=html;
}
const altIngredients={
'Pop-corn nature maison':['Maïs à éclater','Un peu d’huile selon la cuisson','Épices au choix'],
'Bâtonnets de légumes et houmous':['Carotte','Concombre','Pois chiches cuits','Citron','Tahini facultatif'],
'Eau pétillante et agrumes':['Eau pétillante','Citron ou orange','Menthe facultative'],
'Infusion froide maison':['Infusion au choix','Eau','Citron facultatif'],
'Yaourt nature et fruit':['Yaourt nature','Fruit frais de saison'],
'Tartine et purée de fruits':['Pain','Purée de fruits sans sucres ajoutés'],
'Pizza maison aux légumes':['Pâte à pizza','Tomates','Courgette','Poivron','Fromage au goût'],
'Tartine tomate et légumes au four':['Pain','Tomate','Légumes grillés','Herbes'],
'Pommes de terre rôties au four':['Pommes de terre','Huile','Paprika','Herbes'],
'Légumes rôtis et épices':['Carotte','Courgette','Poivron','Huile et épices'],
'Banane plantain rôtie':['Banane plantain','Huile facultative','Épices'],
'Banane plantain bouillie et poisson':['Banane plantain','Poisson','Tomate','Citron'],
'Attiéké et poisson braisé':['Attiéké','Poisson','Tomate','Oignon','Concombre','Citron'],
'Attiéké et poulet grillé':['Attiéké','Poulet','Tomate','Concombre','Épices'],
'Sandwich maison aux crudités':['Pain','Poulet, œuf ou houmous','Laitue','Tomate'],
'Wrap poulet et légumes':['Tortilla','Poulet','Carotte','Laitue','Yaourt nature'],
'Flocons d’avoine et fruits':['Flocons d’avoine','Lait ou yaourt','Fruit de saison'],
'Muesli nature':['Flocons d’avoine','Graines','Fruits secs ou frais'],
'Nouilles aux légumes et œuf':['Nouilles','Œuf','Carottes','Brocoli','Ail'],
'Soupe de légumes et lentilles':['Lentilles corail','Carotte','Courgette','Oignon','Bouillon'],
'Pain complet et fruit':['Pain complet','Fruit frais','Fromage blanc facultatif'],
'Yaourt et flocons d’avoine':['Yaourt nature','Flocons d’avoine','Fruit facultatif'],
'Riz gras maison avec légumes':['Riz','Tomates','Carotte','Poivron','Oignon','Huile adaptée'],
'Riz, poulet et légumes sautés':['Riz','Poulet','Carotte','Courgette','Poivron'],
'Sandwich œuf et crudités':['Pain','Œuf','Laitue','Tomate','Concombre'],
'Houmous et crudités':['Pois chiches','Citron','Tahini facultatif','Carotte','Concombre'],
'Yaourt nature et fruits':['Yaourt nature','Fruits frais'],
'Compote sans sucres ajoutés':['Fruits cuits ou compote sans sucres ajoutés','Cannelle facultative'],
'Fruits frais de saison':['Fruits de saison selon goût']
};
const recipeByAlt={'Banane plantain bouillie et poisson':'banane-poisson','Attiéké et poisson braisé':'attieke-poisson','Attiéké et poulet grillé':'attieke-poulet','Wrap poulet et légumes':'wrap-poulet','Soupe de légumes et lentilles':'soupe-lentilles','Riz, poulet et légumes sautés':'riz-poulet-legumes'};
function altIllustration(name,idx){
 const n=norm(name);
 let visual=/eau|infusion/.test(n)?'drink':/pizza/.test(n)?'pizza':/omelette|oeuf/.test(n)?'eggs':/poisson|sardines|thon/.test(n)?'fish':/poulet/.test(n)?'chicken':/plantain|banane/.test(n)?'plantain':/pommes de terre|legumes rotis/.test(n)?'plantain':/nouilles|pates/.test(n)?'pasta':/pain|sandwich|wrap/.test(n)?'wrap':/yaourt|compote|muesli|fruits|avoine/.test(n)?'bowl':/riz|attieke/.test(n)?'rice':/soupe/.test(n)?'soup':'bowl';
 return {id:'alt-'+n,visual,tone:idx?'sage':'gold',name};
}
function detailsHeader(eyebrow,title){
 return '<div class="mg-dialog-top"><div><span class="mg-eyebrow">'+eyebrow+'</span><h2 id="mg-dialog-title">'+escapeHtml(title)+'</h2></div>'+btn(icon('close'),'close','mg-close')+'</div>';
}
function openDetail(html){
 const dlg=document.querySelector('#dialog');if(!dlg)return;
 if(dlg.open)dlg.close();
 dlg.innerHTML='<div class="mg-dialog">'+html+'</div>';
 dlg.setAttribute('aria-labelledby','mg-dialog-title');
 dlg.showModal();
 dlg.querySelector('.mg-close')?.focus();
}
function showRecipe(id){
 const r=recipes.find(x=>x.id===id);if(!r)return;
 const html=detailsHeader(r.category==='ivo'?'CUISINE IVOIRIENNE':'IDÉE À DÉCOUVRIR',r.name)+
 '<div class="mg-dialog-photo">'+img(r)+'</div>'+credit(r)+
 '<button type="button" class="mg-favorite" aria-pressed="'+favorites().includes(r.id)+'" data-guide-action="favorite:'+r.id+'">'+(favorites().includes(r.id)?'Retirer des favoris':'Ajouter aux favoris')+'</button>'+
 '<div class="mg-info-row"><span>'+icon('clock')+' Environ '+r.minutes+' min</span><span>'+icon('book')+' 1 personne</span></div>'+
 '<label class="mg-servings">Nombre de personnes<select id="mg-servings" data-recipe="'+r.id+'">'+[1,2,3,4,5,6].map(n=>'<option value="'+n+'">'+n+'</option>').join('')+'</select></label><h3>Les ingrédients</h3><p class="mg-dialog-sub">Quantités indicatives, à ajuster selon les portions et les habitudes.</p>'+
 '<ul class="mg-ingredient-list">'+r.ingredients.map(x=>'<li>'+escapeHtml(x)+'</li>').join('')+'</ul>'+
 '<h3>Préparation</h3><ol class="mg-prep"><li>Rassembler les ingrédients et mesurer les quantités pour le nombre de personnes choisi.</li>'+r.steps.split(/\.\s+/).filter(Boolean).map(step=>'<li>'+escapeHtml(step)+'</li>').join('')+'</ol>'+
 '<div class="mg-cooking-note">'+icon('leaf')+' <p>'+escapeHtml(r.note)+'</p></div>'+
 '<p class="mg-dialog-disclaimer">Les calories ne sont pas estimées automatiquement pour un plat composé. Pour le noter, ajoutez votre propre estimation.</p>'+
 btn('Ajouter ce plat au journal '+icon('arrow'),'log:'+r.id,'mg-primary')+btn('Retour aux recettes','close','mg-plain');
 openDetail(html);
}
function showAlternative(id){
 const a=alternatives.find(x=>x.id===id);if(!a)return;
 state.selected=id;
 const choices=a.choices.map((name,i)=>{
  const photo=altIllustration(name,i),recipeId=recipeByAlt[name],ingred=recipes.find(r=>r.id===recipeId)?.ingredients||altIngredients[name]||a.ingredients;
  return '<article class="mg-alt-detail">'+
   '<div class="mg-alt-img">'+img(photo)+'</div><div class="mg-alt-info"><span class="mg-alt-num">IDÉE '+(i+1)+'</span><h3>'+escapeHtml(name)+'</h3>'+credit(photo)+
   '<p><strong>Ingrédients :</strong> '+escapeHtml(ingred.join(' · '))+'</p>'+
   '<p><strong>Préparation :</strong> '+escapeHtml(window.MON_SUIVI_ALT_PREP?.[name]||recipes.find(r=>r.id===recipeId)?.steps||'Préparer les ingrédients puis les assembler selon vos préférences.')+'</p>'+
   (recipeId?btn('Voir la recette '+icon('chevron'),'recipe:'+recipeId,'mg-small-link'):'')+'</div></article>';
 }).join('');
 openDetail(detailsHeader('ALTERNATIVES ALIMENTAIRES',a.name)+
 '<div class="mg-source"><div class="mg-source-img">'+img(a)+'</div><div><span>ALIMENT CHOISI</span><strong>'+escapeHtml(a.name)+'</strong><small>Ce plat reste possible : voici simplement d’autres idées.</small></div></div>'+
 credit(a)+'<div class="mg-alt-section-title"><h3>À essayer aussi</h3><p>Ingrédients et préparation des alternatives proposées.</p></div>'+
 choices+'<p class="mg-dialog-disclaimer">Ces suggestions ne prouvent pas qu’un aliment soit plus sain. Ajustez portions et ingrédients selon vos goûts, allergies et besoins.</p>'+
 btn('Retour aux alternatives','close','mg-plain'));
}
function mount(){
 const host=document.querySelector('.meals-screen');if(!host||host.querySelector('.mealguide-root'))return;
 const root=document.createElement('section');root.className='mealguide-root';root.setAttribute('aria-label','Catalogue de recettes et alternatives');
 const choices=host.querySelector('.meal-entry-choices'),journal=host.querySelector('.meal-history-section');
 if(choices)choices.insertAdjacentElement('afterend',root);
 else if(journal)journal.insertAdjacentElement('beforebegin',root);
 else host.append(root);
 renderGuide();
}
const rootEl=document.querySelector('#app');
if(rootEl)new MutationObserver(mount).observe(rootEl,{childList:true,subtree:true});
mount();
document.addEventListener('click',e=>{
 const target=e.target.closest('[data-guide-action]');if(!target)return;
 e.preventDefault();e.stopPropagation();
 const full=target.getAttribute('data-guide-action')||'';
 const colon=full.indexOf(':'),action=colon<0?full:full.slice(0,colon),v=colon<0?'':full.slice(colon+1);
 if(action==='favorites'){state.favorites=!state.favorites;state.category='all';state.meal='all';state.visible=10;renderGuide();return}
 if(action==='favorite'){
  if(typeof data==='undefined'||!data.consent||demo)return;
  const old=[...favorites()];data.recipeFavorites=old.includes(v)?old.filter(id=>id!==v):old.concat(v);
  save();showRecipe(v);return;
 }
 if(action==='repeat'){
  const meal=data.meals.find(m=>String(m.id)===v);if(!meal)return;openMealForm();
  const form=document.querySelector('#entry-form');
  for(const key of ['name','quantity','value','protein','carbs','fat']){const field=form?.querySelector('[name="'+key+'"]');if(field)field.value=meal[key]??'';}
  return;
 }
 if(action==='section'){state.section=v;state.visible=10;renderGuide();return}
 if(action==='category'){state.category=v;state.visible=10;renderGuide();return}
 if(action==='meal'){state.meal=v;state.visible=10;renderGuide();return}
 if(action==='more'){state.visible+=10;renderGuide();return}
 if(action==='recipe'){showRecipe(v);return}
 if(action==='alternative'){showAlternative(v);return}
 if(action==='close'){document.querySelector('#dialog')?.close();return}
 if(action==='log'){
   const r=recipes.find(x=>x.id===v);if(!r)return;
   const dlg=document.querySelector('#dialog');if(dlg.open)dlg.close();
   if(typeof openMealForm==='function'){
    openMealForm();
    const form=document.querySelector('#entry-form');
    if(form){
      form.querySelector('input[name="name"]').value=r.name;
      form.querySelector('input[name="quantity"]').value='1 portion (à adapter)';
      const info=document.createElement('p');info.className='mg-log-note';
      info.textContent='Renseignez vos calories estimées avant d’enregistrer. Aucune valeur nutritionnelle n’a été inventée.';
      form.querySelector('input[name="value"]').closest('label').insertAdjacentElement('afterend',info);
    }
   }return;
 }
});
/* Le grand bouton « Alternatives alimentaires » ouvre directement la galerie
   illustrée plutôt que l'ancien formulaire textuel sans images. */
document.addEventListener('click',e=>{
 const direct=e.target.closest('.meals-screen .meal-entry-choice[data-action="addphoto"]');
 if(!direct)return;
 e.preventDefault();e.stopImmediatePropagation();
 state.section='alternatives';renderGuide();
 document.querySelector('.mealguide-root')?.scrollIntoView({behavior:'smooth',block:'start'});
},true);
document.addEventListener('input',e=>{
 if(e.target.id==='mg-exclude'){state.exclude=e.target.value;state.visible=10;renderCardsOnly()}
 if(e.target.id==='mg-recipe-search'){state.query=e.target.value;state.visible=10;renderCardsOnly()}
 if(e.target.id==='mg-alt-search'){state.altQuery=e.target.value;renderCardsOnly()}
});
function renderCardsOnly(){
 const list=document.querySelector('#mg-card-list'),result=document.querySelector('.mg-results-head strong'),more=document.querySelector('.mg-more-wrap');if(!list)return;
 if(state.section==='recipes'){
  const rows=filteredRecipes();list.innerHTML=rows.length?rows.slice(0,state.visible).map(recipeCard).join(''):'<p class="mg-empty">Aucun plat trouvé. Essayez un autre mot ou filtre.</p>';
  if(result)result.textContent=countLabel(rows.length);
  if(more)more.hidden=rows.length<=state.visible;
 }else{
  const rows=filteredAlt();list.innerHTML=rows.length?rows.map(altCard).join(''):'<p class="mg-empty">Aucune alternative trouvée.</p>';
  if(result)result.textContent=rows.length+' catégories';
 }
}
document.addEventListener('change',e=>{
 if(e.target.id==='mg-max-minutes'){state.maxMinutes=Number(e.target.value);state.visible=10;renderCardsOnly()}
 if(e.target.id==='mg-servings'){
  const r=recipes.find(r=>r.id===e.target.dataset.recipe),factor=Number(e.target.value);if(!r)return;
  const scale=text=>text.replace(/(\d+(?:[.,]\d+)?|½|¼)(?:[–-](\d+))?/g,(whole,a,b)=>{
   const value=a==='½'?.5:a==='¼'?.25:Number(a.replace(',','.'));
   const format=n=>Number((n*factor).toFixed(1)).toLocaleString('fr-FR');
   return format(value)+(b?'–'+format(Number(b)):'');
  });
  document.querySelector('.mg-ingredient-list').innerHTML=r.ingredients.map(i=>'<li>'+escapeHtml(scale(i))+'</li>').join('');
  document.querySelector('.mg-info-row span:last-child').textContent=factor+' personne'+(factor>1?'s':'');
 }
});
window.MON_SUIVI_GUIDE_INFO=Object.freeze({recipes:recipes.length,ivo:recipes.filter(x=>x.category==='ivo').length,alternatives:alternatives.length,offlineImages:true});
})();
