/* Mon Suivi V3.1 — guide de repas illustré, hors ligne et sans API.
 * Ajout progressif à l'onglet Repas : ne modifie ni les données ni l'application V3.
 */
(function(){
'use strict';
const recipes=window.MON_SUIVI_RECIPES||[];
const alternatives=window.MON_SUIVI_ALTERNATIVES||[];
if(!recipes.length||!alternatives.length)return;
const state={section:'recipes',category:'ivo',meal:'lunch',query:'',altQuery:'',visible:10,selected:null};
const tones={
gold:['#fff1d7','#ffc88e','#c76d42','#8bba74'],amber:['#ffebd2','#f6b878','#a55a3d','#7ea65e'],
coral:['#ffe6de','#f7ac94','#dc755e','#93ba73'],sage:['#e6f2df','#bbd7b1','#a56a43','#6da46e'],
green:['#e0f3dc','#a0d4a5','#b67d52','#5e9c60'],teal:['#ddf0ed','#9bd9ce','#ce8966','#5c9e94'],
pink:['#ffe4ef','#f8bcd3','#ca8066','#88b47b']
};
const escapeHtml=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
const escAttr=escapeHtml;
const ILLUS={};
function art(visual='bowl',tone='gold',id=''){
 const key=visual+'|'+tone+'|'+id;
 if(ILLUS[key])return ILLUS[key];
 const [bg,accent,food,leaf]=tones[tone]||tones.gold;
 let hash=0;for(const ch of key)hash=(hash*31+ch.charCodeAt(0))>>>0;
 const rnd=n=>((hash+(n*7919))%101)/101;
 const ellipse=(x,y,rx,ry,fill,extra='')=>'<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="'+ry+'" fill="'+fill+'" '+extra+'/>';
 const circle=(x,y,r,fill)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+fill+'"/>';
 const leaves=(cx,cy,n)=>Array.from({length:n},(_,i)=>{
   const ang=i*6.283/n+hash%10/7, x=cx+Math.cos(ang)*16,y=cy+Math.sin(ang)*15;
   return '<ellipse cx="'+x.toFixed(1)+'" cy="'+y.toFixed(1)+'" rx="12" ry="6" fill="'+(i%2?'#4c9763':leaf)+'" transform="rotate('+(ang*180/Math.PI).toFixed(0)+' '+x.toFixed(1)+' '+y.toFixed(1)+')"/>';
 }).join('');
 const rice=(cx,cy)=>{
   let s=ellipse(cx,cy,41,29,'#fff2c8');
   for(let i=0;i<36;i++){const a=i*2.39,r=5+Math.sqrt(i/36)*32;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.7;
    s+=ellipse(x.toFixed(1),y.toFixed(1),3.9,1.65,i%4?'#fffaf1':'#ead8aa','transform="rotate('+(i*41%175)+' '+x.toFixed(1)+' '+y.toFixed(1)+')"');
   }return s;
 };
 const tomatoes=(cx,cy)=>[[-17,-9],[12,3],[5,-16]].map(([dx,dy],i)=>circle(cx+dx,cy+dy,9,i%2?'#e96354':'#d95646')+circle(cx+dx-2,cy+dy-3,2,'#ffdfaa')).join('');
 const veg=leaves(176,114,5)+tomatoes(178,115)+Array.from({length:5},(_,i)=>ellipse(159+(i*11)%39,133+(i*7)%20,8,3,'#82bd72','transform="rotate(-25 '+(159+(i*11)%39)+' '+(133+(i*7)%20)+')"')).join('');
 const base=rice(87,91)+veg;
 const fish=()=>'<g transform="rotate(-15 125 104)">'+ellipse(125,103,42,24,'#d78d4a')+'<path d="M86 102 60 81 Q63 103 58 121Z" fill="#b66a3f"/>'+ellipse(128,100,35,15,'#e9ae65')+'<path d="M110 91q10 8 0 18m12-18q10 8 0 18m12-19q10 8 0 18" fill="none" stroke="#a65635" stroke-width="2.5"/>'+circle(152,98,2.5,'#443323')+'</g>';
 const chicken=()=>ellipse(119,112,46,30,'#bb6d40','transform="rotate(-24 119 112)')+ellipse(121,109,34,22,'#d99153','transform="rotate(-24 121 109)')+'<path d="M97 93 Q119 83 143 110" fill="none" stroke="#f6c384" stroke-width="5" stroke-linecap="round"/>'+ellipse(152,121,18,5,'#9d5c39','transform="rotate(-25 152 121)"');
 const stew=()=>ellipse(117,110,62,40,'#c88f61')+ellipse(117,106,60,36,visual==='greens'?'#407d4d':'#b85b38')+Array.from({length:13},(_,i)=>circle(75+(i*23)%92,86+(i*19)%50,3+(i%3)*2,i%2?'#e5bc67':'#91ba61')).join('');
 const soup=()=>ellipse(119,109,66,44,'#e0cfb4')+ellipse(119,105,60,36,'#db8f50')+Array.from({length:14},(_,i)=>ellipse(79+(i*23)%88,86+(i*17)%41,5,3,i%3?'#f1bf71':'#77a56e')).join('');
 const plantain=()=>Array.from({length:6},(_,i)=>{const x=86+(i%3)*25,y=94+Math.floor(i/3)*24;return ellipse(x,y,22,11,'#d79839','transform="rotate(-25 '+x+' '+y+')"')+ellipse(x-1,y-1,17,8,'#f9bf57','transform="rotate(-25 '+x+' '+y+')"')+circle(x+4,y-1,2,'#a96b2e')}).join('');
 const eggs=()=>ellipse(108,101,34,28,'#fffcf0')+circle(108,101,13,'#f8ba3c')+ellipse(150,132,30,24,'#fffcf0')+circle(151,133,12,'#f8ba3c');
 const bowl=()=>rice(98,103)+ellipse(147,110,27,23,'#ab6745')+Array.from({length:17},(_,i)=>circle(126+i%5*11,92+Math.floor(i/5)*11,4.5,i%2?'#c17e4f':'#8b543d')).join('')+leaves(153,126,5);
 const pasta=()=>ellipse(116,112,57,35,'#e9aa5c')+Array.from({length:13},(_,i)=>'<path d="M'+(75+(i*14)%80)+' '+(99+(i*9)%28)+' q18 -13 23 7 q6 10 -8 10" fill="none" stroke="'+(i%2?'#f8cb76':'#c78546')+'" stroke-width="5" stroke-linecap="round"/>').join('')+tomatoes(112,100);
 const wrap=()=>'<path d="M72 72 Q134 48 180 117 L139 160 Q90 158 72 72Z" fill="#e9c289"/><path d="M83 79 Q131 66 171 118 Q142 141 103 133Z" fill="#fff0bc"/>'+leaves(130,114,7)+tomatoes(143,117);
 const pizza=()=>'<path d="M69 70 Q151 54 192 133 L117 152Z" fill="#d4944e"/><path d="M80 77 Q147 69 181 128 L118 141Z" fill="#f0ca71"/>'+Array.from({length:8},(_,i)=>circle(103+(i*17)%64,88+(i*13)%39,5.5,i%2?'#e76b55':'#72994e')).join('');
 const snack=()=>Array.from({length:8},(_,i)=>'<path d="M'+(76+(i*19)%88)+' '+(91+(i*13)%41)+' l23 -7 -8 23Z" fill="'+(i%2?'#edb94e':'#e8a950')+'" stroke="#d5953d" stroke-width="1"/>').join('');
 const drink=()=>'<path d="M91 73H150L144 149H98Z" fill="#ffd7be" stroke="#c99398" stroke-width="4"/><path d="M98 88H144L140 145H102Z" fill="#d86a6c" opacity=".78"/><path d="M129 81 153 39" stroke="#f8efdd" stroke-width="6" stroke-linecap="round"/>'+circle(119,114,12,'#ffac86')+circle(119,114,7,'#ffd0a4');
 const cookie=()=>Array.from({length:4},(_,i)=>{const x=95+(i%2)*35,y=92+Math.floor(i/2)*29;return circle(x,y,23,'#d69a52')+circle(x,y,19,'#f0be75')+Array.from({length:5},(_,j)=>circle(x-11+j%3*9,y-9+Math.floor(j/3)*17,3,'#9d694c')).join('')}).join('');
 const burger=()=>'<path d="M75 100Q78 58 124 63Q169 62 172 101Z" fill="#eeb875"/><path d="M76 101H172" stroke="#ffffff" stroke-width="7"/><rect x="75" y="106" width="100" height="14" rx="7" fill="#865338"/><path d="M76 107Q102 119 127 106T174 107" fill="none" stroke="#65a16a" stroke-width="8"/><rect x="77" y="124" width="96" height="19" rx="9" fill="#eab36c"/>'+Array.from({length:7},(_,i)=>ellipse(93+(i*12)%69,85+(i*9)%12,3,1.7,'#fff3cf')).join('');
 const fries=()=>Array.from({length:10},(_,i)=>'<path d="M'+(85+i*8)+' 68v58" stroke="'+(i%2?'#efb448':'#f7d075')+'" stroke-width="8" stroke-linecap="round"/>').join('')+'<path d="M76 100 91 151H155L169 100Z" fill="#e78568"/><path d="M94 118h56" stroke="#ffd4aa" stroke-width="3"/>';
 let foodArt={
fish:fish(),chicken:chicken(),stew:stew(),soup:soup(),plantain:plantain(),greens:stew()+leaves(108,112,8),rice:rice(115,107)+tomatoes(155,100),bowl:bowl(),eggs:eggs(),pasta:pasta(),wrap:wrap(),pizza:pizza(),chips:snack(),drink:drink(),cookie:cookie(),burger:burger(),fries:fries()
 }[visual]||bowl();
 const isPlate=!['drink'].includes(visual);
 const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 190" role="img" aria-hidden="true"><defs>'+
 '<linearGradient id="back" x1="0" y1="0" x2="1" y2="1"><stop stop-color="'+bg+'"/><stop offset="1" stop-color="'+accent+'"/></linearGradient>'+
 '<radialGradient id="plate"><stop stop-color="#fffefa"/><stop offset=".72" stop-color="#fffaf4"/><stop offset="1" stop-color="#e9e1dc"/></radialGradient>'+
 '<filter id="shadow" x="-40%" y="-40%" width="180%" height="200%"><feGaussianBlur stdDeviation="8"/></filter></defs>'+
 '<rect width="260" height="190" fill="url(#back)"/>'+
 '<circle cx="17" cy="20" r="52" fill="#fff" opacity=".23"/><circle cx="255" cy="170" r="74" fill="#fff" opacity=".15"/>'+
 ellipse(130,158,93,20,'#886044','opacity=".17" filter="url(#shadow)"')+
 (isPlate?ellipse(130,104,111,79,'#fffbf9')+ellipse(130,103,96,66,'url(#plate)')+ellipse(130,103,88,59,'#f5efe8'):'')+
 '<g transform="translate(10 -1)">'+foodArt+'</g>'+
 (isPlate?leaves(195,145,3):'')+
 circle(222,34,4,'#fff8e9')+circle(235,45,2,'#fff8e9')+
 '</svg>';
 return ILLUS[key]='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
}
const img=(item)=>'<img class="mg-img" src="'+art(item.visual,item.tone,item.id)+'" alt="Illustration du plat : '+escAttr(item.name)+'" loading="lazy" decoding="async" width="260" height="190">';
const btn=(label,action,cls='')=>'<button type="button" class="'+cls+'" data-guide-action="'+escAttr(action)+'">'+label+'</button>';
const countLabel=(n)=>n+' plat'+(n>1?'s':'');
const mealOk=r=>state.meal==='all'||r.meal==='both'||r.meal===state.meal;
function filteredRecipes(){
 const q=norm(state.query);
 return recipes.filter(r=>(state.category==='all'||r.category===state.category)&&mealOk(r)&&
 (!q||norm(r.name+' '+r.ingredients.join(' ')).includes(q)));
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
 '<p>Des plats ivoiriens, des idées pour déjeuner ou dîner, et des alternatives illustrées.</p></div>'+
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
    '<div class="mg-results-head"><strong>'+countLabel(rows.length)+'</strong><span>Ingrédients détaillés dans chaque fiche</span></div>'+
    '<div class="mg-grid" id="mg-card-list">'+(shown.length?shown.map(recipeCard).join(''):'<p class="mg-empty">Aucun plat trouvé. Essayez un autre ingrédient ou choisissez « Tous ».</p>')+'</div>'+
    (rows.length>state.visible?'<div class="mg-more-wrap">'+btn('Afficher plus de plats ('+(rows.length-state.visible)+')','more','mg-more')+'</div>':'')+
    '<p class="mg-hint">Les ingrédients et quantités sont indicatifs pour 1 personne. Les recettes varient selon les familles et les régions. Aucune calorie n’est calculée sans données fiables.</p>';
 }else{
   const rows=filteredAlt();
   html+='<div class="mg-alternatives-intro">'+icon('leaf')+'<div><strong>Des idées, pas des interdictions</strong><span>Choisissez un aliment ci-dessous pour voir deux alternatives avec leurs illustrations. Aucune analyse de photo nécessaire.</span></div></div>'+
    '<label class="mg-search">'+icon('search')+'<span class="sr-only">Rechercher un aliment à remplacer</span>'+
    '<input id="mg-alt-search" type="search" autocomplete="off" placeholder="Ex. chips, alloco, pizza…" maxlength="80" value="'+escAttr(state.altQuery)+'"></label>'+
    '<div class="mg-results-head"><strong>'+rows.length+' catégories</strong><span>Illustrations originales hors ligne</span></div>'+
    '<div class="mg-grid" id="mg-card-list">'+(rows.length?rows.map(altCard).join(''):'<p class="mg-empty">Aucune catégorie trouvée. Essayez un autre nom.</p>')+'</div>'+
    '<p class="mg-hint">Les illustrations représentent des idées de plats, pas des photographies. Les propositions ne remplacent pas un avis médical ou nutritionnel et ne classent aucun aliment comme « mauvais ».</p>';
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
 '<div class="mg-dialog-photo">'+img(r)+'</div>'+
 '<div class="mg-info-row"><span>'+icon('clock')+' Environ '+r.minutes+' min</span><span>'+icon('book')+' 1 personne</span></div>'+
 '<h3>Les ingrédients</h3><p class="mg-dialog-sub">Quantités indicatives, à ajuster selon les portions et les habitudes.</p>'+
 '<ul class="mg-ingredient-list">'+r.ingredients.map(x=>'<li>'+escapeHtml(x)+'</li>').join('')+'</ul>'+
 '<h3>Préparation</h3><p class="mg-prep">'+escapeHtml(r.steps)+'</p>'+
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
   '<div class="mg-alt-img">'+img(photo)+'</div><div class="mg-alt-info"><span class="mg-alt-num">IDÉE '+(i+1)+'</span><h3>'+escapeHtml(name)+'</h3>'+
   '<p><strong>Ingrédients :</strong> '+escapeHtml(ingred.join(' · '))+'</p>'+
   (recipeId?btn('Voir la recette '+icon('chevron'),'recipe:'+recipeId,'mg-small-link'):'')+'</div></article>';
 }).join('');
 openDetail(detailsHeader('ALTERNATIVES ALIMENTAIRES',a.name)+
 '<div class="mg-source"><div class="mg-source-img">'+img(a)+'</div><div><span>ALIMENT CHOISI</span><strong>'+escapeHtml(a.name)+'</strong><small>Ce plat reste possible : voici simplement d’autres idées.</small></div></div>'+
 '<div class="mg-alt-section-title"><h3>À essayer aussi</h3><p>Illustrations et ingrédients des alternatives proposées.</p></div>'+
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
 if(e.target.id==='mg-recipe-search'){state.query=e.target.value;state.visible=10;renderCardsOnly()}
 if(e.target.id==='mg-alt-search'){state.altQuery=e.target.value;renderCardsOnly()}
});
function renderCardsOnly(){
 const list=document.querySelector('#mg-card-list'),result=document.querySelector('.mg-results-head strong'),more=document.querySelector('.mg-more-wrap');if(!list)return;
 if(state.section==='recipes'){
  const rows=filteredRecipes();list.innerHTML=rows.length?rows.slice(0,state.visible).map(recipeCard).join(''):'<p class="mg-empty">Aucun plat trouvé. Essayez un autre mot ou filtre.</p>';
  if(result)result.textContent=countLabel(rows.length);
  if(more)more.style.display=rows.length>state.visible?'':'none';
 }else{
  const rows=filteredAlt();list.innerHTML=rows.length?rows.map(altCard).join(''):'<p class="mg-empty">Aucune alternative trouvée.</p>';
  if(result)result.textContent=rows.length+' catégories';
 }
}
window.MON_SUIVI_GUIDE_INFO=Object.freeze({recipes:recipes.length,ivo:recipes.filter(x=>x.category==='ivo').length,alternatives:alternatives.length,offlineImages:true});
})();