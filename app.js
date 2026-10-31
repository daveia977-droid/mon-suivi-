'use strict';
const KEY='mon-suivi-v1',app=document.querySelector('#app'),nav=document.querySelector('#nav'),dlg=document.querySelector('#dialog');
const blank=()=>({name:'',weights:[],meals:[],moods:[],steps:[],stepsGoal:6000,weightGoal:null,consent:false,unit:'kg',recipeFavorites:[],moodReminder:{enabled:false,time:'20:00'},teddy:null});
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
steps:'<ellipse cx="7" cy="7.5" rx="2.2" ry="3.2"/><ellipse cx="17" cy="9.5" rx="2.2" ry="3.2"/><path d="M5.5 12c-1.6 1.4-2.3 3.5-1.8 5.5l.3 1.2"/><path d="M18.5 14c1.6 1.4 2.3 3.5 1.8 5.5l-.3 1.2"/>',
trophy:'<path d="M8 21h8M12 17v4M7 4h10v6a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v2a4 4 0 0 0 4 4M17 6h3v2a4 4 0 0 1-4 4"/>'
};return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(shapes[name]||shapes.heart)+'</svg>'};
const moodClass=name=>({'À plat':'m-blue','Moyen':'m-yellow','Bien':'m-pink','En forme':'m-green'})[name]||'m-pink';
const stepsToday=()=>data.steps.find(x=>x.date===today());
const OFF_BASE='https://fr.openfoodfacts.org',OFF_TTL=604800000,OFF_CAP=40;
const ciqualItems=Array.isArray(window.CIQUAL_2025)?window.CIQUAL_2025:[];
let ciqualResults=[];
let mealMode='manual',offResults=[],offPicked=null,offAlts=[],offEditing={},photoData=null,photoBusy=false,photoAI=null;
function offCacheAll(){try{return JSON.parse(localStorage.getItem(KEY+'-off')||'{}')}catch{return{}}}
function offCacheGet(key){try{const e=offCacheAll()[key];if(!e||Date.now()-e.t>OFF_TTL)return null;return e.v}catch{return null}}
function offCacheSet(key,val){try{const c=offCacheAll();c[key]={t:Date.now(),v:val};const ks=Object.keys(c);while(ks.length>OFF_CAP)delete c[ks.shift()];localStorage.setItem(KEY+'-off',JSON.stringify(c))}catch{}}
const offNum=n=>{if(n===null||n===undefined||n==='')return null;const v=Number(n);return Number.isFinite(v)&&v>=0?v:null};
const offProd=p=>({code:String(p.code||''),name:String(p.product_name||'').trim()||'(sans nom)',brand:String((p.brands||'').split(',')[0]||'').trim(),kcal:offNum(p.nutriments?.['energy-kcal_100g']),protein:offNum(p.nutriments?.proteins_100g),carbs:offNum(p.nutriments?.carbohydrates_100g),fat:offNum(p.nutriments?.fat_100g),source:'off',nutri:['a','b','c','d','e'].includes(p.nutriscore_grade)?p.nutriscore_grade:null,cats:Array.isArray(p.categories_tags)?p.categories_tags.filter(c=>String(c).startsWith('en:')).slice(0,6):[]});
async function offFetch(url){const r=await fetch(url,{headers:{Accept:'application/json'}});if(!r.ok)throw Error('HTTP '+r.status);return r.json()}
async function offSearch(q){const key='s:'+q.toLowerCase();const hit=offCacheGet(key);if(hit)return hit;const d=await offFetch(OFF_BASE+'/cgi/search.pl?search_terms='+encodeURIComponent(q)+'&search_simple=1&action=process&json=1&page_size=20');const items=(d.products||[]).map(offProd).filter(p=>p.name!=='(sans nom)'&&p.kcal!==null);offCacheSet(key,items);return items}
async function offByCode(code){const key='c:'+code;const hit=offCacheGet(key);if(hit)return hit;const d=await offFetch(OFF_BASE+'/api/v2/product/'+encodeURIComponent(code)+'.json?fields=code,product_name,brands,nutriments,nutriscore_grade,categories_tags');if(!d||d.status!==1||!d.product)throw Error('Produit introuvable.');const p=offProd(d.product);offCacheSet(key,p);return p}
async function offCategory(cats){const key='g:'+cats.join(',');const hit=offCacheGet(key);if(hit)return hit;for(const tag of cats.slice(0,3)){try{const d=await offFetch(OFF_BASE+'/api/v2/search?categories_tags='+encodeURIComponent(tag)+'&fields=code,product_name,brands,nutriments,nutriscore_grade&page_size=30');const items=(d.products||[]).map(offProd).filter(p=>p.name!=='(sans nom)'&&p.kcal!==null&&(!offPicked||p.code!==offPicked.code));if(items.length>=3){const sorted=items.slice().sort((a,b)=>(a.nutri?a.nutri.charCodeAt(0):99)-(b.nutri?b.nutri.charCodeAt(0):99)||a.kcal-b.kcal);const top=sorted.slice(0,4);offCacheSet(key,top);return top}}catch{}}return[]}
function offListHtml(items,action){return '<ul class="off-list">'+items.map((p,i)=>'<li class="off-item"><div class="off-item-info"><span class="record-name">'+esc(p.name)+'</span><span class="record-info">'+esc(p.brand)+(p.kcal!==null?' · '+fmt(p.kcal)+' kcal/100 g':'')+'</span></div>'+(p.nutri?'<span class="nutri nutri-'+p.nutri+'" title="Nutri-Score">'+p.nutri.toUpperCase()+'</span>':'')+'<button type="button" class="secondary small" data-action="'+action+':'+i+'">Choisir</button></li>').join('')+'</ul>'}
const offNote=()=>'<p class="off-credit">Source : Open Food Facts (openfoodfacts.org), base collaborative sous licence ODbL. Les valeurs restent des estimations.</p>';
const macroFields=[['protein','Protéines'],['carbs','Glucides'],['fat','Lipides']];
function macroFor(key,g){const n=offPicked?.[key];return n===null||n===undefined||!Number.isFinite(Number(n))?'':Math.round(Number(n)*g*10/100)/10}
function macroInputs(entry={},grams=null){return '<div class="macro-grid">'+macroFields.map(([key,label])=>'<label>'+label+' (g)<input '+(grams!==null?'id="off-'+key+'" ':'')+'name="'+key+'" type="number" inputmode="decimal" min="0" max="3000" step="0.1" placeholder="Inconnu" value="'+esc(grams===null?(entry[key]??''):macroFor(key,grams))+'"></label>').join('')+'</div><p class="off-credit">Nutriments facultatifs : laissez vide si inconnus, ajustez selon votre portion.</p>'}
const ciqualNote=()=>'<p class="off-credit">Source : Anses. 2025. Table de composition nutritionnelle des aliments Ciqual, Licence Ouverte 2.0. Extrait de 42 aliments ; valeurs pour 100 g (bien distinguer cru et cuit).</p>';
function ciqualClean(s){return String(s).toLocaleLowerCase('fr').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function doCiqualSearch(){const q=ciqualClean(document.querySelector('#ciqual-q')?.value||'').trim();if(q.length<2){renderOffResults('<p class="off-msg">Saisissez au moins 2 caractères.</p>');return}ciqualResults=ciqualItems.filter(v=>ciqualClean(v.name).includes(q)).slice(0,25);renderOffResults(ciqualResults.length?offListHtml(ciqualResults,'ciqualpick'):'<p class="off-msg">Aliment absent de cet extrait Ciqual. Essayez Open Food Facts ou la saisie manuelle.</p>')}
function ciqualPick(i){const p=ciqualResults[i];if(!p)return;offPicked={...p,code:String(p.code),brand:'Anses Ciqual',source:'ciqual',nutri:null,cats:[]};photoAI=null;mealMode='confirm';offAlts=[];renderMealDialog()}
function renderOffResults(html){const el=document.querySelector('#off-results');if(el)el.innerHTML=html}
function offKcalFor(g){if(offPicked?.kcal===null||offPicked?.kcal===undefined)return '';const k=Number(offPicked.kcal);return Number.isFinite(k)&&k>=0&&g>0?Math.max(0,Math.round(k*g/100)):''}
async function doOffSearch(){
const q=String(document.querySelector('#off-q')?.value||'').trim();
if(q.length<2){renderOffResults('<p class="off-msg">Tapez au moins 2 caractères.</p>');return}
if(typeof fetch==='undefined'){renderOffResults('<p class="off-msg">Recherche indisponible ici. La saisie manuelle reste possible.</p>');return}
renderOffResults('<p class="off-msg">Recherche en cours…</p>');
try{offResults=await offSearch(q);offPicked=null;renderOffResults(offResults.length?offListHtml(offResults,'offpick'):'<p class="off-msg">Aucun résultat. Essayez un autre nom, un code-barres, ou saisissez manuellement.</p>')}catch{renderOffResults('<p class="off-msg">Recherche indisponible (réseau ou service). La saisie manuelle reste possible.</p>')}
}
async function doOffBarcode(){
const code=String(document.querySelector('#off-code')?.value||'').replace(/[^0-9]/g,'');
if(code.length<8||code.length>14){renderOffResults('<p class="off-msg">Un code-barres contient 8 à 14 chiffres.</p>');return}
if(typeof fetch==='undefined'){renderOffResults('<p class="off-msg">Recherche indisponible ici. La saisie manuelle reste possible.</p>');return}
renderOffResults('<p class="off-msg">Recherche en cours…</p>');
try{offPicked=await offByCode(code);offResults=[offPicked];photoAI=null;mealMode='confirm';offAlts=[];renderMealDialog();loadAlts()}catch{renderOffResults('<p class="off-msg">Produit introuvable ou service indisponible. La saisie manuelle reste possible.</p>')}
}
async function offPick(i){const p=offResults[i];if(!p)return;offPicked=p;photoAI=null;mealMode='confirm';offAlts=[];renderMealDialog();loadAlts()}
async function offPickAlt(i){const p=offAlts[i];if(!p)return;offPicked=p;photoAI=null;mealMode='confirm';renderMealDialog();loadAlts()}
async function loadAlts(){
if(!offPicked||!offPicked.cats.length)return;
try{const alts=await offCategory(offPicked.cats);if(alts.length){offAlts=alts;const slot=document.querySelector('#off-alts-slot');if(slot&&mealMode==='confirm')slot.innerHTML='<p class="off-sub">Alternatives, même famille :</p>'+offListHtml(offAlts,'offpick-alt')}}catch{}
}

/* Idées facultatives après une photo, indépendantes des estimations IA.
   Aucune qualité nutritionnelle n'est déduite automatiquement de l'image. */
const PHOTO_IDEAS=[
 {re:/\b(chips|crisps|crackers|biscuits? aperitifs?|snacks? sales?|tortilla chips)\b/,q:'chips',items:[['Pop-corn nature maison','À assaisonner selon vos goûts.'],['Bâtonnets de légumes et houmous','Une autre option à partager ou grignoter.']]},
 {re:/\b(sodas?|cola|limonades?|boissons? sucrees?|boissons? gazeuses?|thes? glaces?|energy drink)\b/,q:'soda',items:[['Eau pétillante et agrumes','Une boisson à personnaliser sans obligation.'],['Infusion froide maison','Une option à préparer et doser selon vos goûts.']]},
 {re:/\b(biscuits?|cookies?|gateaux?|gateau|brownies?|donuts?|muffins?|barres? chocolatees?|viennoiseries?|madeleines?)\b/,q:'biscuits',items:[['Yaourt nature et fruit de saison','Un goûter à composer soi-même.'],['Tartine avec purée de fruits','Ajustez les quantités à votre faim.']]},
 {re:/\b(cereales?|corn flakes|granola sucre|muesli sucre|chocapic)\b/,q:'céréales',items:[['Flocons d’avoine et fruits','Une alternative pour le petit-déjeuner.'],['Muesli nature sans sucres ajoutés','Comparez les étiquettes selon vos préférences.']]},
 {re:/\b(pizzas?|calzones?)\b/,q:'pizza',items:[['Pizza maison aux légumes','Choisissez la garniture et la quantité de fromage.'],['Tartine au four, tomates et légumes','Une version simple à personnaliser.']]},
 {re:/\b(burger|hamburger|cheeseburger|sandwich industriel|hot dog)\b/,q:'burger',items:[['Sandwich maison avec légumes','Ajoutez les ingrédients que vous aimez.'],['Pain complet garni, légumes et houmous','Une autre combinaison possible.']]},
 {re:/\b(frites|french fries|potatoes|pomme de terre frite)\b/,q:'frites',items:[['Pommes de terre rôties au four','Assaisonnez selon votre goût.'],['Légumes rôtis au four','Une autre façon de varier l’accompagnement.']]},
 {re:/\b(nuggets?|cordon bleu|poulet pane|poisson pane)\b/,q:'nuggets',items:[['Poulet ou poisson cuisiné maison','À accompagner de légumes si vous aimez.'],['Tofu doré et légumes','Une autre idée de préparation.']]},
 {re:/\b(charcuterie|saucissons?|salamis?|chorizo|lardons?)\b/,q:'charcuterie',items:[['Houmous et légumes','À essayer en tartine ou dans un sandwich.'],['Œuf dur et crudités','Une garniture alternative possible.']]},
 {re:/\b(plats? prepares?|nouilles? instantanees?|lasagnes?|pizza surgelee|soupes? instantanees?)\b/,q:'plat préparé',items:[['Version maison du même plat','Vous pouvez choisir les ingrédients et l’assaisonnement.'],['Plat simple avec légumes et féculent','Une alternative facile à adapter.']]},
 {re:/\b(yaourt sucre|dessert lacte|creme dessert|flan industriel)\b/,q:'dessert lacté',items:[['Yaourt nature avec fruits','Dosez vous-même les ajouts.'],['Compote sans sucres ajoutés','À choisir selon vos envies.']]},
 {re:/\b(bonbon|confiserie|gomme sucree)\b/,q:'confiserie',items:[['Fruits frais de saison','Une autre option si vous en avez envie.'],['Compote sans sucres ajoutés','Une possibilité pour varier les collations.']]}
];
function photoAlternatives(name){
 const normalized=ciqualClean(name);
 const match=PHOTO_IDEAS.find(row=>row.re.test(normalized));
 return {specific:!!match,query:match?.q||String(name||'').trim().slice(0,80),
 items:match?.items||[['Version maison de ce plat','Vous pouvez adapter les ingrédients à vos goûts.'],['Accompagner de fruits ou de légumes','Une idée pour varier le repas, si elle vous convient.']]};
}
function photoAlternativesHtml(name){
 const suggestions=photoAlternatives(name);
 return '<div class="photo-alt-head"><span class="photo-alt-symbol">'+icon('heart')+'</span><div><h3>Des idées pour varier</h3><p>'+(suggestions.specific?'Alternatives possibles à ce type de produit.':'Le type de produit n’est pas clairement reconnu : voici deux pistes générales.')+'</p></div></div>'+
 '<ul class="photo-alt-list">'+suggestions.items.map(([title,info])=>'<li><strong>'+esc(title)+'</strong><small>'+esc(info)+'</small></li>').join('')+'</ul>'+
 '<p class="photo-alt-note">Une photo ne permet pas de savoir si un produit est « sain ». Être transformé ne signifie pas forcément être moins intéressant sur le plan nutritionnel. Vérifiez les ingrédients, allergènes et portions selon vos besoins.</p>'+
 btn('Comparer des produits','photo-compare','photo-alt-compare');
}
function showPhotoAlternativesManual(){
 const name=document.querySelector('#photo-product-name')?.value.trim()||'';
 const slot=document.querySelector('#photo-fallback-results');if(!slot)return;
 if(name.length<2){slot.innerHTML='<p class="off-msg" role="alert">Saisissez au moins deux caractères.</p>';return}
 slot.innerHTML='<section class="photo-alt-panel">'+photoAlternativesHtml(name)+'</section>';
}
function photoCompareProducts(){
 const entered=document.querySelector('#entry-form input[name="name"]')?.value.trim()||document.querySelector('#photo-product-name')?.value.trim();
 const name=entered||offPicked?.name;
 if(!name)return;
 const q=photoAlternatives(name).query;
 mealMode='search';renderMealDialog();
 const input=document.querySelector('#off-q');if(input){input.value=q;if(q.length>=2)doOffSearch()}
}

let photoSessionApproved=false;
const photoConsent=()=>photoSessionApproved;
const photoNote=() =>'<p class="off-credit">Analyse via Mistral AI, strictement après votre consentement. Aucune photo n’est stockée par l’application ; Mistral conserve les données d’API jusqu’à 30 jours glissants (surveillance anti-abus) avant suppression. La désactivation de l’entraînement n’entraîne pas de suppression immédiate.</p>';
function photoErrMsg(code){
if(code==='quota')return 'Quota photo du jour atteint — la recherche et la saisie manuelle restent possibles. Aucun paiement n’est jamais demandé.';
if(code==='disabled')return 'L’analyse photo est temporairement désactivée — la recherche et la saisie manuelle restent possibles.';
if(code==='compteur'||code==='config')return 'Service photo indisponible pour l’instant — la recherche et la saisie manuelle restent possibles.';
if(code==='mistral'||code==='timeout'||code==='model')return 'L’estimation n’a pas abouti — réessayez, ou utilisez la recherche et la saisie manuelle.';
if(code==='format'||code==='trop volumineux')return 'Photo non lisible ou trop lourde — reprenez-la, ou utilisez la recherche et la saisie manuelle.';
return 'Photo indisponible (réseau) — la recherche et la saisie manuelle restent possibles.'}
function photoCompress(file){return new Promise((resolve,reject)=>{
const fr=new FileReader();
fr.onload=()=>{const img=new Image();
img.onload=()=>{const MAX=768,s=Math.min(1,MAX/Math.max(img.width||1,img.height||1)),w=Math.max(1,Math.round((img.width||MAX)*s)),h=Math.max(1,Math.round((img.height||MAX)*s));
const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
let q=.82,d=c.toDataURL('image/jpeg',q);
while(d.length>1_000_000&&q>.45){q-=.12;d=c.toDataURL('image/jpeg',q)}
resolve(d)};
img.onerror=()=>reject(new Error('format'));img.src=String(fr.result)};
fr.onerror=()=>reject(new Error('format'));fr.readAsDataURL(file)})}
function photoPicked(file){
const box=document.querySelector('#photo-results');if(!file)return;
if(!/^image\//.test(file.type||'')){if(box)box.innerHTML='<p class="off-msg">'+photoErrMsg('format')+'</p>';return}
if(box)box.innerHTML='<p class="off-msg">Compression de la photo…</p>';
photoData=null;
photoCompress(file).then(d=>{photoData=d;const pick=document.querySelector('.photo-pick');if(pick)pick.textContent='Photo prête ✓ — en choisir une autre';if(box)box.innerHTML='<img class="photo-preview" src="'+d+'" alt="Aperçu du repas sélectionné"><p class="off-msg">Photo prête ('+Math.max(1,Math.round(d.length/1365))+' Ko). Touchez « Analyser la photo ».</p>'}).catch(()=>{if(box)box.innerHTML='<p class="off-msg">'+photoErrMsg('format')+'</p>'})}
function openPhotoConsent(){modal('<form id="photo-consent-form"><h2>Envoyer cette photo ?</h2><p class="modal-explain">J’accepte que cette photo soit envoyée pour estimation : transit par l’infrastructure Vercel (États-Unis), traitement par Mistral AI (Union européenne). La photo n’est pas stockée par l’application, mais Mistral conserve les données d’API jusqu’à 30 jours glissants pour la surveillance anti-abus avant suppression. La désactivation de l’entraînement n’entraîne pas de suppression immédiate.</p><p class="modal-explain">L’estimation est un ordre de grandeur (souvent ±30–50 %), toujours modifiable. Vous pouvez retirer cette autorisation à tout moment dans Profil.</p><div class="consent-row"><label><input type="checkbox" name="agree"><span>J’accepte l’envoi de cette photo pour estimation.</span></label></div><p id="photo-consent-error" class="notice-error" role="alert" hidden></p><div class="row"><button type="submit">Autoriser et analyser</button>'+btn('Annuler','close','secondary')+'</div></form>')}
async function analyzePhoto(){
if(photoBusy)return;
const box=document.querySelector('#photo-results');
if(!photoData){if(box)box.innerHTML='<p class="off-msg">Choisissez d’abord une photo de votre repas.</p>';return}
if(!photoConsent()){openPhotoConsent();return}
if(typeof fetch==='undefined'){if(box)box.innerHTML='<p class="off-msg">'+photoErrMsg('network')+'</p>';return}
photoBusy=true;if(box)box.innerHTML='<p class="off-msg">Analyse en cours… (quelques secondes)</p>';
try{const r=await fetch('api/photo',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image:photoData})});
let d={};try{d=await r.json()}catch{}
if(!r.ok||!d.ok)throw new Error(d.error||'network');
offPicked={code:'',name:String(d.name||'Repas photographié').slice(0,150),brand:'',kcal:d.kcal100g===null||d.kcal100g===undefined?null:(Number.isFinite(Number(d.kcal100g))?Number(d.kcal100g):null),protein:null,carbs:null,fat:null,source:'photo',nutri:null,cats:[]};
offAlts=[];photoAI={grams:Number.isFinite(Number(d.grams))&&Number(d.grams)>0?Math.round(Number(d.grams)):null,confidence:['haute','moyenne','faible'].includes(d.confidence)?d.confidence:'faible'};
mealMode='confirm';renderMealDialog()}
catch(err){if(box)box.innerHTML='<p class="off-msg">'+photoErrMsg(err.message)+'</p>'}
finally{photoBusy=false;photoSessionApproved=false}}
function openMealForm(entry){
mealMode='manual';offResults=[];offPicked=null;offAlts=[];offEditing=entry||{};photoData=null;photoBusy=false;photoAI=null;photoSessionApproved=false;
renderMealDialog();
}
function renderMealDialog(){
const entry=offEditing||{};
const isForm=mealMode==='manual'||mealMode==='confirm';
let body='';
if(mealMode==='manual')body='<label>Repas ou aliment<input name="name" maxlength="150" required value="'+esc(entry.name||'')+'" placeholder="Ex. Déjeuner"></label><label>Quantité et unité<input name="quantity" maxlength="80" required value="'+esc(entry.quantity||'')+'" placeholder="Ex. 1 portion"></label><label>Calories estimées<input name="value" type="number" inputmode="numeric" min="0" max="50000" step="1" required value="'+esc(entry.value??'')+'"></label>'+macroInputs(entry)+'<p class="modal-explain">Estimation manuelle : aucune analyse nutritionnelle automatique.</p>';
else if(mealMode==='search')body='<label>Aliment ou marque<input id="off-q" maxlength="80" autocomplete="off" placeholder="Ex. pain, yaourt, compote…"></label>'+btn('Rechercher','offsearch','wide')+'<div id="off-results"></div>'+offNote();
else if(mealMode==='ciqual')body='<label>Aliment courant (Ciqual 2025)<input id="ciqual-q" maxlength="80" autocomplete="off" placeholder="Ex. riz cuit, œuf, poulet…"></label>'+btn('Chercher dans Ciqual','ciqualsearch','wide')+'<div id="off-results"></div>'+ciqualNote();
else if(mealMode==='barcode')body='<label>Code-barres (chiffres du produit)<input id="off-code" inputmode="numeric" maxlength="14" autocomplete="off" placeholder="Ex. 3017620422003"></label>'+btn('Chercher le produit','offbarcode','wide')+'<div id="off-results"></div>'+offNote();
else if(mealMode==='photo')body='<p class="modal-explain">L’analyse photo n’est pas encore activée. En attendant, découvrez gratuitement des alternatives en indiquant le nom du produit, sans envoyer d’image.</p><section class="photo-fallback-card"><span class="photo-fallback-label">IDÉES D’ALTERNATIVES</span><label>Quel aliment souhaitez-vous comparer ?<input id="photo-product-name" maxlength="80" autocomplete="off" placeholder="Ex. chips, biscuits, pizza…"></label>'+btn('Voir des alternatives','photo-alt-manual','compact-outline')+'<div id="photo-fallback-results" aria-live="polite"></div></section><p class="off-credit">Les suggestions sont des idées générales : elles ne prouvent pas qu’un aliment soit plus sain. Un aperçu photo local est possible ; aucune photo n’est envoyée à un service IA.</p>';
else if(mealMode==='confirm')body='<label>Repas ou aliment<input name="name" maxlength="150" required value="'+esc(offPicked.name)+'"></label><div class="off-grid"><label>Poids (g)<input id="off-grams" name="grams" type="number" inputmode="numeric" min="1" max="3000" step="1" value="'+(photoAI&&photoAI.grams?photoAI.grams:100)+'"></label><label>Calories estimées<input id="off-kcal" name="value" type="number" inputmode="numeric" min="0" max="50000" step="1" required value="'+esc(String(offKcalFor(photoAI&&photoAI.grams?photoAI.grams:100)))+'"></label></div>'+macroInputs({},photoAI&&photoAI.grams?photoAI.grams:100)+'<p class="modal-explain">'+(photoAI?(offPicked.kcal!==null?'Estimation IA ('+photoAI.confidence+' confiance) : '+fmt(offPicked.kcal)+' kcal pour 100 g — ordre de grandeur, souvent ±30–50 % : ajustez librement. Aucune photo n’est stockée par l’application.':'L’estimation IA n’a pas pu évaluer les calories : renseignez-les vous-même. Aucune photo n’est stockée par l’application.'):(offPicked.kcal!==null?'Environ '+fmt(offPicked.kcal)+' kcal pour 100 g d’après '+(offPicked.source==='ciqual'?'Ciqual 2025 (Anses)':'Open Food Facts')+' — ajustez librement.':'Calories inconnues dans la base : estimez-les vous-même.'))+'</p>'+(photoAI?'<section class="photo-alt-panel" aria-label="Idées d’alternatives après la photo"><div id="photo-alt-content">'+photoAlternativesHtml(offPicked.name)+'</div></section>':(offPicked.cats.length?'<div id="off-alts-slot"></div>':''))+(photoAI?'':(offPicked.source==='ciqual'?ciqualNote():offNote()));
modal('<'+(isForm?'form id="entry-form"':'div class="off-panel"')+'><h2>'+(entry.id?'Modifier le repas':'Ajouter un repas')+'</h2><div class="mode-tabs">'+[['search','Produits'],['ciqual','Aliments'],['barcode','Code-barres'],['photo','Alternatives'],['manual','Manuelle']].map(([m,l])=>'<button type="button" class="mode-tab'+((mealMode===m)||(mealMode==='confirm'&&((m==='photo'&&photoAI)||(m==='search'&&!photoAI)))?' active':'')+'" data-action="mealmode:'+m+'">'+l+'</button>').join('')+'</div>'+body+(isForm?'<label>Date<input type="date" name="date" required max="'+today()+'" value="'+esc(entry.date||today())+'"></label><p id="entry-error" class="notice-error" role="alert" hidden></p><div class="row"><button type="submit">Enregistrer</button>'+btn('Annuler','close','secondary')+'</div>':btn('Fermer','close','secondary wide'))+'</'+(isForm?'form':'div')+'>');
if(isForm)document.querySelector('#entry-form').addEventListener('submit',event=>{
event.preventDefault();const v=Object.fromEntries(new FormData(event.target));v.id=entry.id||String(Date.now())+'-'+Math.random().toString(36).slice(2,7);
if(mealMode==='confirm'){const g=Number(v.grams);v.quantity=(Number.isFinite(g)&&g>0?g:100)+' g';delete v.grams}
v.value=Number(v.value);v.source=mealMode==='confirm'?(offPicked?.source||'off'):(entry.source||'manual');
try{const payload=blank();payload.meals=[v];const valid=validatePayload(payload).meals[0];data.meals=data.meals.filter(item=>String(item.id)!==String(entry.id)).concat(valid);dlg.close();save()}catch(e){const error=document.querySelector('#entry-error');error.textContent=e.message;error.hidden=false}
});
}
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
  if(type==='meals'){const value=Number(entry.value);if(!Number.isFinite(value)||value<0||value>50000||typeof entry.name!=='string'||!entry.name.trim()||typeof entry.quantity!=='string')throw Error('Repas invalide.');const item={id,date:entry.date,name:entry.name.slice(0,150),quantity:entry.quantity.slice(0,80),value:Math.round(value),source:['manual','off','ciqual','photo'].includes(entry.source)?entry.source:'manual'};for(const key of ['protein','carbs','fat']){const rawValue=entry[key];if(rawValue===undefined||rawValue===null||rawValue===''){item[key]=null;continue}const n=Number(rawValue);if(!Number.isFinite(n)||n<0||n>3000)throw Error('Nutriment invalide.');item[key]=Math.round(n*10)/10}return item}
  if(!['À plat','Moyen','Bien','En forme'].includes(entry.name))throw Error('Humeur invalide.');
  return {id,date:entry.date,name:entry.name,note:typeof entry.note==='string'?entry.note.slice(0,300):''};
 });
}
out.recipeFavorites=Array.isArray(raw.recipeFavorites)?[...new Set(raw.recipeFavorites.filter(id=>typeof id==='string'&&/^[a-z0-9-]{1,80}$/.test(id)))].slice(0,100):[];
out.moodReminder={enabled:raw.moodReminder?.enabled===true,time:typeof raw.moodReminder?.time==='string'&&/^([01]\d|2[0-3]):[0-5]\d$/.test(raw.moodReminder.time)?raw.moodReminder.time:'20:00'};
out.steps=Array.isArray(raw.steps)?raw.steps.slice(0,3000):[];
out.steps=out.steps.map((entry,i)=>{
 if(!entry||typeof entry!=='object'||!isDate(entry.date)||entry.date>today())throw Error('Date invalide dans les pas.');
 const sid=typeof entry.id==='string'||typeof entry.id==='number'?String(entry.id).slice(0,90):String(i);
 const svalue=Number(entry.value);if(!Number.isFinite(svalue)||svalue<0||svalue>200000||!Number.isInteger(svalue))throw Error('Nombre de pas invalide.');
 return {id:sid,date:entry.date,value:svalue,...(entry.source==='sante-raccourcis'?{source:'sante-raccourcis',...(typeof entry.syncedAt==='string'&&/^\d{4}-\d{2}-\d{2}T/.test(entry.syncedAt)&&Number.isFinite(Date.parse(entry.syncedAt))?{syncedAt:new Date(entry.syncedAt).toISOString()}:{})}:{})};
});
const sg=raw.stepsGoal;
out.stepsGoal=sg===null?null:(Number.isFinite(Number(sg))&&Number(sg)>=500&&Number(sg)<=100000?Math.round(Number(sg)):6000);
const wg=Number(raw.weightGoal);
out.weightGoal=Number.isFinite(wg)&&wg>0&&wg<=700?Math.round(wg*100)/100:null;
out.consentAt=typeof raw.consentAt==='string'?raw.consentAt:'';out.consentVersion='1';
out.teddy=raw.teddy==null?null:MonSuiviTeddy.normalize(raw.teddy,today());
return out;
}
function reload(){try{const raw=localStorage.getItem(KEY);if(raw){const item=validatePayload(JSON.parse(raw));if(item.consent){data=item;unit=data.unit}}}catch(err){storageOK=false}}
reload();
// Import local depuis Raccourcis iOS via fragment URL (non transmis au serveur).
// Ce mécanisme ne lit jamais Santé directement et reste limité au navigateur utilisé.
let pendingHealthImport=null;
function importSanteSteps(){
 const hash=window.location.hash;
 if(!new URLSearchParams(hash.slice(1)).has('sante-pas'))return;
 window.history.replaceState(null,'',window.location.pathname+window.location.search);
 pendingHealthImport=null;
 let incoming;
 try{incoming=MonSuiviHealth.parseHealthImport(hash,today())}
 catch(error){showHealthMessage(error.message,true);return}
 if(demo||!data.consent){showHealthMessage('Crée d’abord ton espace local sur cet appareil, puis relance le raccourci.',true);return}
 const old=data.steps.find(e=>e.date===incoming.date);
 if(old&&old.source!=='sante-raccourcis'&&old.value!==incoming.value){
  pendingHealthImport=incoming;
  showHealthMessage('Tu as déjà noté '+fmt(old.value)+' pas à la main. Le raccourci propose '+fmt(incoming.value)+' pas. Que souhaites-tu conserver ?',false,true);return;
 }
 applyHealthImport(incoming);
}
function applyHealthImport(incoming){
 if(demo||!data.consent){pendingHealthImport=null;showHealthMessage('Crée ton espace local avant de recevoir des pas.',true);return}
 if(!incoming||incoming.date!==today()){pendingHealthImport=null;showHealthMessage('La journée a changé. Relance le raccourci avant de synchroniser.',true);return}
 const old=data.steps.find(e=>e.date===incoming.date);
 data.steps=data.steps.filter(e=>e.date!==incoming.date).concat([{id:old?.id||'sante-'+incoming.date,date:incoming.date,value:incoming.value,source:'sante-raccourcis',syncedAt:new Date().toISOString()}]);
 pendingHealthImport=null;page='Activité';save();
 showHealthMessage('Import reçu : '+fmt(incoming.value)+' pas pour aujourd’hui. Ton objectif reste inchangé.',false);
}
function showHealthMessage(message,error=false,choice=false){
 if(data.consent){page='Activité';render()}
 const panel=document.createElement('section');panel.id='health-import-message';panel.className='v4-settings';panel.setAttribute('role',error?'alert':'status');
 const text=document.createElement('p');text.textContent=message;panel.append(text);
 if(choice){
  for(const [label,action] of [['Remplacer par le total reçu','health-accept'],['Conserver ma saisie','health-cancel']]){
   const control=document.createElement('button');control.type='button';control.className='secondary';control.dataset.healthAction=action;control.textContent=label;panel.append(control);
  }
 }
 document.querySelector('#health-import-message')?.remove();
 const host=document.querySelector('.activity-screen .page-heading');
 if(host)host.insertAdjacentElement('afterend',panel);else app.prepend(panel);
}
document.addEventListener('click',event=>{
 const action=event.target.closest('[data-health-action]')?.dataset.healthAction;
 if(action==='health-accept')applyHealthImport(pendingHealthImport);
 if(action==='health-cancel'){pendingHealthImport=null;showHealthMessage('Ta saisie manuelle est conservée.',false)}
});
window.addEventListener('hashchange',importSanteSteps);
function save(){if(!demo&&data.consent){try{localStorage.setItem(KEY,JSON.stringify(data));storageOK=true}catch{storageOK=false}}render()}
function go(where){page=where;render();window.scrollTo({top:0,behavior:'instant'})}
function btn(text,action,cl=''){return '<button type="button" class="'+cl+'" data-action="'+esc(action)+'">'+text+'</button>'}
function footer(){return '<footer>'+['Confidentialité','À propos'].map(name=>'<a href="#" data-action="go:'+esc(name)+'">'+esc(name)+'</a>').join('')+'</footer>'}
const legal={
'À propos':'À propos de Mon Suivi et informations légales.',
'Confidentialité':'Le suivi est conservé localement après ton accord. Les photos personnelles ne sont pas envoyées à une IA. Tu peux exporter et supprimer tes données dans Profil.',
'Conditions':'Application gratuite de bien-être, sans diagnostic ni garantie de résultat. Les valeurs alimentaires sont des repères modifiables.',
'Cookies':'Stockage local du suivi et cache technique, sans traceur publicitaire intégré au code.',
'Mentions légales':'Éditeur et contact non renseignés. Hébergement sur Vercel.',
'Remboursements':'Aucun achat ni abonnement.'};
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
return '<ul class="records-list">'+sorted(items).reverse().map(e=>'<li><div><div class="record-name">'+(type==='moods'?'<span class="mood-dot '+moodClass(e.name)+'"></span>':'')+esc(type==='weights'?shownWeight(e.value)+' '+unit:type==='steps'?fmt(e.value)+' pas':e.name)+'</div><div class="record-info">'+esc(e.date)+(type==='meals'?' · '+esc(e.quantity)+' · ≈ '+fmt(e.value)+' kcal'+(macroFields.some(([k])=>e[k]!==null&&e[k]!==undefined)?' · '+macroFields.filter(([k])=>e[k]!==null&&e[k]!==undefined).map(([k,label])=>label+' '+fmt(e[k])+' g').join(' · '):''):'')+(e.note?' · '+esc(e.note):'')+'</div></div><div class="record-actions">'+btn('Modifier','edit:'+type+':'+e.id,'secondary small')+btn('Suppr.','delete:'+type+':'+e.id,'ghost small')+'</div></li>').join('')+'</ul>';
}
function topbar(){return '<header class="topbar"><img class="brand-cat" src="./icons/icon-192.png" width="40" height="40" alt=""><span class="topbar-brand">Mon <strong>Suivi</strong></span>'+btn(icon('user'),'go:Profil','icon-button profile-shortcut')+'</header>'}
function ringSVG(value,goal,small){
const size=small?92:150,stroke=small?9:13,r=(size-stroke)/2,c=2*Math.PI*r,pct=goal?Math.min(1,value/goal):1,col=!goal?'#842849':pct>=1?'#2e9464':pct>=.6?'#c29210':'#d1567f';
return '<svg class="ring'+(small?' ring-sm':'')+'" viewBox="0 0 '+size+' '+size+'" role="img" aria-label="Progression des pas du jour"><circle class="ring-bg" cx="'+size/2+'" cy="'+size/2+'" r="'+r+'"/><circle class="ring-val" cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" stroke="'+col+'" stroke-dasharray="'+(c*pct).toFixed(1)+' '+c.toFixed(1)+'"/><text class="ring-num" x="50%" y="'+(small?'54%':'48%')+'" text-anchor="middle">'+fmt(value)+'</text>'+(small?'':'<text class="ring-cap" x="50%" y="62%" text-anchor="middle">pas</text>')+'</svg>';
}
function screenHome(){
const w=newest(data.weights),cur=data.moods.find(m=>m.date===today()),s=Number(stepsToday()?.value||0),goal=data.stepsGoal;
const todayMeals=sorted(data.meals.filter(m=>m.date===today())).reverse();
const kcal=todayMeals.reduce((sum,m)=>sum+Number(m.value||0),0);
const percent=goal?Math.min(100,Math.max(0,Math.round(s/goal*100))):0;
const dateLabel=new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
const moods=[['À plat','sad','m-blue'],['Moyen','moyen','m-yellow'],['Bien','happy','m-pink'],['En forme','great','m-green']];
const preview=todayMeals.length?'<ul class="meal-preview">'+todayMeals.slice(0,3).map((m,i)=>'<li class="meal-preview-item"><span class="meal-illustration meal-illustration-'+(i%3)+'">'+icon('meal')+'</span><span class="meal-preview-details"><strong>'+esc(m.name)+'</strong><small>'+esc(m.quantity||'Portion enregistrée')+'</small></span><span class="meal-preview-cal">≈ '+fmt(m.value)+' <small>kcal</small></span></li>').join('')+'</ul>':'<div class="home-empty-meals"><span class="empty-illustration">'+icon('meal')+'</span><div><strong>Votre journée commence ici</strong><p>Notez votre premier repas quand vous le souhaitez.</p></div></div>';
return '<div class="screen home-screen">'+topbar()+
'<section class="home-greeting"><div><span class="home-overline">VOTRE PETIT COIN BIEN-ÊTRE</span><h1>Bonjour'+(data.name?' '+esc(data.name):'')+' <span class="greeting-sun" aria-hidden="true">✳</span></h1><p>Un jour à la fois, à votre rythme.</p></div><div class="date-stamp">'+esc(dateLabel)+'</div></section>'+
'<section class="hero-summary" aria-label="Résumé de votre journée"><div class="hero-head"><span class="hero-kicker"><span class="hero-kicker-dot"></span>Aujourd’hui, en douceur</span><span class="hero-decoration" aria-hidden="true">✦</span></div><div class="hero-content"><div class="hero-donut" style="--donut-progress:'+percent+'%" role="progressbar" aria-label="Pas du jour" aria-valuenow="'+s+'"'+(goal?' aria-valuemax="'+goal+'"':'')+'><div class="hero-donut-center"><span class="hero-donut-icon">'+icon('steps')+'</span><strong>'+fmt(s)+'</strong><span>pas aujourd’hui</span></div></div><div class="hero-copy"><span class="hero-data-label">Mon activité</span><strong class="hero-data-number">'+(goal?percent+' %':'Libre')+'</strong><span class="hero-data-info">'+(goal?'de mon objectif de '+fmt(goal)+' pas':'Sans objectif imposé')+'</span><div class="hero-small-divider"></div><span class="hero-data-label">Repas notés</span><strong class="hero-calories">'+fmt(kcal)+' <small>kcal</small></strong></div></div><div class="hero-footer"><span>'+icon('heart')+' Chaque petit pas compte</span>'+btn('Voir mon activité '+icon('chevron'),'go:Activité','hero-link')+'</div></section>'+
'<section class="home-metrics" aria-label="Aperçu de votre suivi"><div class="mini-metric mini-metric-rose"><span class="mini-metric-icon">'+icon('meal')+'</span><strong>'+fmt(todayMeals.length)+'</strong><small>repas</small></div><div class="mini-metric mini-metric-gold"><span class="mini-metric-icon">'+icon('scale')+'</span><strong>'+(w?shownWeight(w.value):'—')+'</strong><small>poids'+(w?' ('+unit+')':'')+'</small></div><div class="mini-metric mini-metric-mint"><span class="mini-metric-icon">'+icon('heart')+'</span><strong class="mini-metric-mood">'+(cur?esc(cur.name):'—')+'</strong><small>humeur</small></div></section>'+
'<section class="home-panel mood-panel"><div class="home-section-title"><div><h2>Mon humeur</h2><p>Comment vous sentez-vous ?</p></div>'+btn('Voir tout '+icon('chevron'),'go:Progrès','subtle-link')+'</div><div class="mood-row">'+moods.map(([name,symbol,cls])=>'<button class="mood-tile '+cls+(cur?.name===name?' selected':'')+'" aria-pressed="'+(cur?.name===name)+'" data-action="quickmood:'+name+'"><span class="mood-icon">'+icon(symbol)+'</span><span>'+name+'</span></button>').join('')+'</div></section>'+
'<section class="home-panel meal-panel"><div class="home-section-title"><div><h2>Mes repas du jour</h2><p>Le plaisir de bien manger</p></div>'+btn(icon('plus')+' Ajouter','add:meals','compact-add')+'</div>'+preview+'<div class="home-panel-footer">'+btn('Voir mon journal '+icon('chevron'),'go:Repas','subtle-link')+'</div></section>'+
'<section class="home-panel insight-panel"><div class="insight-icon">'+icon('heart')+'</div><div><h2>À votre rythme.</h2><p>Votre suivi est personnel. Aucun objectif imposé, juste vos petites habitudes à découvrir.</p></div></section>'+
'</div>';
}
function screenMeals(){
const todayMeals=data.meals.filter(x=>x.date===today());
const sum=todayMeals.reduce((s,m)=>s+Number(m.value),0);
const macros=macroFields.map(([key,label])=>{const known=todayMeals.filter(m=>m[key]!==null&&m[key]!==undefined);return {label,value:known.length?Math.round(known.reduce((s,m)=>s+Number(m[key]),0)*10)/10:null}});
return '<div class="screen meals-screen">'+topbar()+
'<section class="page-heading"><div><span class="page-eyebrow">MON ALIMENTATION</span><h1>Mes repas<span class="page-dot">.</span></h1><p>Manger à son rythme, sans pression.</p></div>'+btn(icon('plus')+' Ajouter','add:meals','compact-add')+'</section>'+
'<section class="meal-summary-card"><div class="meal-summary-head"><span>'+icon('meal')+' Aujourd’hui</span><span class="soft-pill">'+fmt(todayMeals.length)+' repas</span></div><div class="meal-summary-total">'+fmt(sum)+' <small>kcal notées</small></div><p>Une estimation pour vos repas enregistrés, sans limite imposée.</p><div class="macro-mini-row">'+macros.map(m=>'<div><span>'+esc(m.label)+'</span><strong>'+(m.value===null?'—':fmt(m.value)+' g')+'</strong></div>').join('')+'</div></section>'+
'<div class="meal-entry-choices"><button type="button" class="meal-entry-choice photo-choice" data-action="addphoto"><span class="choice-icon">'+icon('meal')+'</span><span><strong>Alternatives alimentaires</strong><small>Alternatives sans envoi de photo</small></span>'+icon('chevron')+'</button><button type="button" class="meal-entry-choice manual-choice" data-action="add:meals"><span class="choice-icon">'+icon('plus')+'</span><span><strong>Saisie manuelle</strong><small>Un repas, à votre façon</small></span>'+icon('chevron')+'</button></div>'+
'<section class="data-section meal-history-section"><div class="home-section-title"><div><h2>Mon journal</h2><p>Retrouvez et modifiez vos repas</p></div><span class="soft-pill">'+fmt(data.meals.length)+' au total</span></div>'+list('meals')+'</section></div>';
}
function screenActivity(){
const s=Number(stepsToday()?.value||0),goal=data.stepsGoal;
const pct=goal?Math.round(s/goal*100):null;
const dates=Array.from({length:7},(_,i)=>past(6-i));
const daily=dates.map(day=>({day,value:Number(data.steps.find(x=>x.date===day)?.value||0)}));
const maxSteps=Math.max(1,...daily.map(x=>x.value));
const labels=['D','L','M','M','J','V','S'];
const bars=daily.map((d,i)=>'<div class="steps-bar-column" title="'+esc(d.day)+' : '+fmt(d.value)+' pas"><span class="steps-bar-track"><span class="steps-bar-fill" style="height:'+(Math.round(d.value/maxSteps*88)+ (d.value?5:0))+'%"></span></span><span class="steps-bar-label">'+esc(new Date(d.day+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'short'}).replace('.','').slice(0,2))+'</span></div>').join('');
return '<div class="screen activity-screen">'+topbar()+
'<section class="page-heading"><div><span class="page-eyebrow">MON ACTIVITÉ</span><h1>Mes pas<span class="page-dot">.</span></h1><p>Chaque mouvement compte.</p></div>'+btn(icon('plus')+' Noter','add:steps','compact-add')+'</section>'+
'<section class="activity-hero-card"><div class="activity-hero-heading"><h2>Aujourd’hui</h2><span class="activity-hero-spark">'+icon('steps')+'</span></div><div class="activity-main-ring">'+ringSVG(s,goal)+'</div><p class="activity-hero-caption">'+(goal?(s>=goal?'Votre objectif du jour est atteint.':fmt(s)+' pas sur '+fmt(goal)+' aujourd’hui.'):'Vos pas du jour, sans objectif imposé.')+'</p></section>'+
'<section class="activity-data-grid"><div><span>'+icon('steps')+'</span><strong>'+fmt(s)+'</strong><small>pas notés</small></div><div><span>'+icon('chart')+'</span><strong>'+(goal?Math.min(pct,999)+' %':'—')+'</strong><small>objectif</small></div><div><span>'+icon('heart')+'</span><strong>'+(goal?fmt(goal):'Libre')+'</strong><small>pas visés</small></div></section>'+
'<section class="steps-chart-card"><div class="card-top"><h2>Cette semaine</h2><span class="small-muted">Pas enregistrés</span></div><div class="steps-week-chart" role="img" aria-label="Pas enregistrés sur les sept derniers jours">'+bars+'</div></section>'+
'<section class="health-sync-card"><span class="health-sync-icon">'+icon('heart')+'</span><div class="health-sync-body"><h2>Pas depuis Apple Santé</h2><p>'+(stepsToday()?.source==='sante-raccourcis'?'Dernière synchronisation : '+fmt(s)+' pas aujourd’hui.':'Récupérez vos pas avec un raccourci iPhone. Rien n’est envoyé à nos serveurs.')+'</p></div>'+btn('Connecter Apple Santé','sante-help','compact-outline')+'</section>'+
'<section class="step-goal-card"><div><h2>Mon objectif</h2><p>'+(goal?fmt(goal)+' pas par jour, à mon rythme.':'Aucun objectif imposé.')+'</p></div><div class="goal-buttons">'+btn(goal?'Modifier':'Définir','steps-goal','compact-outline')+(goal?btn('Désactiver','steps-goal-off','quiet-link'):'')+'</div></section>'+
'<section class="data-section"><div class="home-section-title"><div><h2>Historique des pas</h2><p>Mes enregistrements précédents</p></div></div>'+list('steps')+'</section></div>';
}
function weightEncouragement(){
 const current=newest(data.weights),first=sorted(data.weights)[0],goal=data.weightGoal;
 if(!current)return {title:'Votre parcours commence ici',message:'Ajoutez une première mesure pour voir votre évolution, à votre rythme.'};
 if(!goal)return {title:'Chaque étape compte',message:'Vous suivez déjà votre évolution. Un objectif personnel peut être défini, seulement si vous le souhaitez.'};
 const remaining=Math.abs(current.value-goal);
 if(remaining<0.1)return {title:'Votre objectif est atteint !',message:'Votre dernière mesure correspond à votre repère personnel. Prenez le temps de reconnaître votre parcours.'};
 if(!first||first.id===current.id||first.value===current.value)return {title:'Votre parcours prend forme',message:'Votre objectif est enregistré. De nouvelles mesures permettront de visualiser votre évolution.'};
 const gain=Math.abs(first.value-goal)-remaining;
 if(gain>0.05)return {title:'Vous vous rapprochez de votre objectif !',message:'Vous vous êtes rapproché(e) de '+shownWeight(gain)+' '+unit+' de votre repère depuis votre première mesure. Continuez à votre rythme.'};
 return {title:'Chaque étape compte',message:'Les variations font partie du parcours. Continuez à observer votre évolution avec bienveillance.'};
}
function screenProgress(){
const filtered=period==='all'?data.weights:data.weights.filter(x=>x.date>=past(Number(period)-1));
const current=newest(data.weights),old=sorted(data.weights)[0],diff=current&&old&&data.weights.length>1?Number(current.value)-Number(old.value):null;
const changeLabel=diff===null?'Aucune évolution calculée':(diff>0?'+':'')+shownWeight(diff)+' '+unit+' depuis le début';
const goalLabel=data.weightGoal?shownWeight(data.weightGoal)+' '+unit:'À définir';
const goalDetail=current&&data.weightGoal?(Math.abs(current.value-data.weightGoal)<.1?'Votre repère personnel est atteint':'À '+shownWeight(Math.abs(current.value-data.weightGoal))+' '+unit+' de votre repère'):'Un repère personnel, toujours facultatif';
const encouragement=weightEncouragement();
return '<div class="screen progress-screen">'+topbar()+
'<section class="page-heading"><div><span class="page-eyebrow">MON ÉVOLUTION</span><h1>Mes progrès<span class="page-dot">.</span></h1><p>Observer son parcours, avec douceur.</p></div>'+btn(icon('plus')+' Noter','add:weights','compact-add')+'</section>'+
'<details class="weight-more"><summary>Explorer toutes mes mesures</summary><section class="weight-hero-card"><span class="weight-hero-label">Dernière mesure</span><div class="weight-current">'+(current?shownWeight(current.value):'—')+' <small>'+unit+'</small></div><p class="weight-trend">'+(diff===null?icon('heart'):icon('chart'))+' '+esc(changeLabel)+'</p>'+(current?'<span class="weight-date">Mesuré le '+esc(current.date.split('-').reverse().join('/'))+'</span>':'')+'</section>'+
'<section class="weight-chart-card"><div class="card-top"><h2>Ma courbe</h2><span class="chart-badge">'+icon('chart')+'</span></div><div class="filter-row">'+[['7','Semaine'],['30','Mois'],['all','Tout']].map(([v,t])=>btn(t,'period:'+v,period===v?'active':'')).join('')+'</div>'+(filtered.length>=2?chartSVG(filtered,340,175,false,data.weightGoal):'<div class="empty-state">Deux mesures suffisent pour dessiner votre courbe.</div>')+'</section>'+
'</details><section class="weight-goal-card"><div class="weight-goal-icon">'+icon('heart')+'</div><div><span>Mon objectif</span><strong>'+goalLabel+'</strong><small>'+esc(goalDetail)+'</small></div>'+btn(data.weightGoal?'Modifier':'Définir','weight-goal','compact-outline')+(data.weightGoal?btn('Retirer','weight-goal-off','quiet-link'):'')+'</section>'+
'<section class="data-section"><div class="home-section-title"><div><h2>Mes mesures</h2><p>Mes notes de poids</p></div>'+btn(icon('plus')+' Ajouter','add:weights','subtle-link')+'</div>'+list('weights')+'</section>'+
'<section class="data-section"><div class="home-section-title"><div><h2>Mon humeur</h2><p>Un moment pour soi</p></div>'+btn(icon('plus')+' Ajouter','add:moods','subtle-link')+'</div>'+list('moods')+'</section>'+
'<section class="progress-trophy" aria-label="Encouragement sur votre progression"><span class="progress-trophy-icon">'+icon('trophy')+'</span><div class="progress-trophy-text"><span class="progress-trophy-kicker">VOTRE PETITE VICTOIRE</span><h2>'+esc(encouragement.title)+'</h2><p>'+esc(encouragement.message)+'</p></div><span class="progress-trophy-star" aria-hidden="true">✦</span></section></div>';
}
function installHelp(){return '<details class="install-help"><summary>Installer Mon Suivi sur mon iPhone</summary><ol><li>Ouvrez Mon Suivi dans Safari.</li><li>Touchez Partager, puis « Sur l’écran d’accueil » (ou « Ajouter à l’écran d’accueil »).</li><li>Activez « Ouvrir comme app » si proposé, puis touchez Ajouter.</li></ol><p>Avant de changer de navigateur ou de réinstaller, exportez votre suivi dans Profil. Vérifiez ensuite que votre historique est présent.</p></details>'}
function screenProfile(){
const name=data.name?esc(data.name):'Mon espace';
return '<div class="screen profile-screen">'+topbar()+
'<section class="page-heading"><div><span class="page-eyebrow">MON ESPACE</span><h1>Mon profil<span class="page-dot">.</span></h1><p>Tout ce qui compte, au même endroit.</p></div></section>'+
'<section class="profile-hero"><span class="profile-avatar">'+icon('user')+'</span><span class="profile-hero-text"><strong>'+name+'</strong><small>Mes données restent sur cet appareil</small></span><span class="private-chip">'+icon('heart')+' Privé</span></section>'+
'<h2 class="settings-heading">Mes informations</h2><section class="section-card white-card profile-settings-card"><div class="setting-block"><label for="name">Prénom ou pseudonyme</label><div class="name-control"><input id="name" maxlength="60" value="'+esc(data.name)+'" autocomplete="nickname" placeholder="Votre prénom">'+btn('Enregistrer','name','compact-secondary')+'</div></div><div class="setting-block"><label for="unit">Unité du poids</label><select id="unit" aria-label="Unité du poids"><option value="kg" '+(unit==='kg'?'selected':'')+'>Kilogrammes (kg)</option><option value="lb" '+(unit==='lb'?'selected':'')+'>Livres (lb)</option></select></div></section>'+
'<h2 class="settings-heading">Mes données</h2><section class="section-card white-card backup-card"><div class="backup-copy"><span class="backup-icon">'+icon('download')+'</span><div><h3>Ma sauvegarde</h3><p>Exportez ou restaurez votre suivi en toute simplicité.</p></div></div><div class="backup-actions">'+btn(icon('download')+' Exporter','export','backup-btn')+btn(icon('upload')+' Importer','import','backup-btn')+'</div><input type="file" id="import-file" accept=".json,application/json" hidden><div class="privacy-caption">'+icon('heart')+' Aucune synchronisation automatique</div></section>'+
'<h2 class="settings-heading">Confidentialité</h2><section class="settings-list"><button class="settings-list-item" type="button" data-action="go:Confidentialité"><span class="settings-glyph">'+icon('heart')+'</span><span>Politique de confidentialité</span>'+icon('chevron')+'</button><button class="settings-list-item" type="button" data-action="go:Conditions"><span class="settings-glyph">'+icon('chart')+'</span><span>Conditions d’utilisation</span>'+icon('chevron')+'</button><button class="settings-list-item" type="button" data-action="go:À propos"><span class="settings-glyph">'+icon('user')+'</span><span>À propos et informations légales</span>'+icon('chevron')+'</button></section>'+
'<section class="profile-help"><span>'+icon('heart')+'</span><p>Vos données sont conservées sur cet appareil. Exportez une sauvegarde avant de changer de téléphone. Les photos personnelles restent sur cet appareil ; aucune analyse IA n’est activée.</p></section>'+
installHelp()+'<div class="delete-area">'+btn('Effacer mes données de cet appareil','clear','delete-link')+'</div></div>';
}
function render(){
const showNav=!['Accueil','Bienvenue',...Object.keys(legal)].includes(page);
nav.hidden=!showNav;
nav.style.setProperty('--active-tab',Math.max(0,['Aujourd’hui','Repas','Activité','Progrès','Profil'].indexOf(page==='Teddy'?'Progrès':page)));
nav.innerHTML=showNav?[['Aujourd’hui','Aujourd’hui','home'],['Repas','Repas','meal'],['Activité','Activité','steps'],['Progrès','Progrès','chart'],['Profil','Profil','user']].map(([target,label,symbol])=>'<button type="button" data-action="go:'+target+'" aria-label="'+label+'" aria-current="'+((page===target||(page==='Teddy'&&target==='Progrès'))?'page':'false')+'">'+icon(symbol)+'<span>'+label+'</span></button>').join(''):'';
let content='';
if(page==='Accueil')content='<section class="welcome premium-welcome"><header class="welcome-brand"><img class="brand-cat" src="./icons/icon-192.png" width="48" height="48" alt=""><span>Mon <strong>Suivi</strong></span></header><div class="welcome-visual" aria-hidden="true"><div class="welcome-preview"><div class="welcome-preview-top"><span>Mon équilibre</span><span>✦</span></div><div class="welcome-preview-main"><div class="welcome-preview-ring"><div><img class="welcome-cat" src="./icons/icon-192.png" width="64" height="64" alt=""><strong>Moi, à mon rythme</strong><small>Chaque jour compte</small></div></div><div class="welcome-preview-numbers"><span class="preview-label">Une douce routine</span><span class="preview-dash">✦</span><span class="preview-chips"><i></i><i></i><i></i></span></div></div></div><div class="welcome-float-card"><span>'+icon('heart')+'</span><div><strong>Bien-être au quotidien</strong><small>Repas · Poids · Humeur · Pas</small></div></div></div><div class="welcome-content"><span class="welcome-eyebrow">Chaque petit pas compte.</span><h1>Avance à ton rythme,<br><em>célèbre tes progrès.</em></h1><p>Vos repas, vos pas et vos progrès dans un espace doux, privé et simple à utiliser.</p><div class="btn-stack">'+btn(data.consent?'Retrouver mon suivi':'Commencer mon suivi','start','wide')+'</div><p class="welcome-privacy">'+icon('heart')+' Gratuit · Vos données restent sur cet appareil</p>'+installHelp()+'</div></section>';
else if(page==='Bienvenue')content='<section class="setup">'+btn(icon('back'),'go:Accueil','back')+'<h1>Votre espace<br>personnel</h1><p>Suivez votre parcours à votre rythme, sur cet appareil, sans créer de compte en ligne.</p><form id="setup-form"><div class="field"><label for="setup-name">Prénom ou pseudonyme</label><input id="setup-name" name="name" maxlength="60" placeholder="Comment souhaitez-vous être appelé ?" autocomplete="nickname"><p class="explain">Facultatif. Ne renseignez aucune information sensible.</p></div><div class="consent-row"><label><input name="terms" type="checkbox" required><span>J’ai lu les <a href="#" data-action="go:Conditions">conditions d’utilisation</a>.</span></label></div><div class="consent-row"><label><input name="consent" type="checkbox" required><span>J’accepte d’enregistrer localement mes données de suivi (poids, repas, humeur, pas et journal facultatif Teddy), et je peux retirer mon accord et effacer mes données à tout moment.</span></label></div><p class="info-note"><a href="#" data-action="go:Confidentialité">Confidentialité et retrait du consentement</a></p><div class="btn-stack" style="margin-top:24px"><button class="wide" type="submit">Créer mon espace local</button>'+'</div></form>'+footer()+'</section>';
else if(legal[page])content=window.MonSuiviLegal?MonSuiviLegal.screen(page):'<section class="legal-page">'+btn(icon('back')+' Retour','back','ghost')+'<h1>'+esc(page)+'</h1><div class="section-card white-card"><p>'+esc(legal[page])+'</p></div>'+footer()+'</section>';
else if(page==='Aujourd’hui')content=screenHome();
else if(page==='Repas')content=screenMeals();
else if(page==='Activité')content=screenActivity();
else if(page==='Progrès')content=screenProgress();
else if(page==='Profil')content=screenProfile();
else if(page==='Teddy')content=window.MonSuiviTeddyUI?MonSuiviTeddyUI.screen():'';
if(!storageOK)content='<p class="notice-error" role="alert">Sauvegarde locale indisponible. Exportez vos données avant de quitter cette page.</p>'+content;
app.innerHTML=content+(showNav?footer():'');
}
function modal(html){restoreFocus=document.activeElement;dlg.removeAttribute('aria-labelledby');dlg.innerHTML=html;dlg.showModal()}
dlg.addEventListener('close',()=>{if(restoreFocus?.isConnected)restoreFocus.focus();restoreFocus=null});
function openForm(type,id){
const items=data[type],entry=items.find(x=>String(x.id)===String(id))||{},heading={weights:'Noter mon poids',meals:'Ajouter un repas',moods:'Mon humeur',steps:'Mes pas'}[type];
const fields=type==='weights'?'<label>Poids ('+unit+')<input name="value" type="number" inputmode="decimal" min="1" max="'+(unit==='lb'?'1543':'700')+'" step="0.01" required value="'+esc(entry.value?unit==='lb'?(entry.value*unitFactor).toFixed(2):entry.value:'')+'"></label>':type==='meals'?'<label>Repas ou aliment<input name="name" maxlength="150" required value="'+esc(entry.name||'')+'" placeholder="Ex. Déjeuner"></label><label>Quantité et unité<input name="quantity" maxlength="80" required value="'+esc(entry.quantity||'')+'" placeholder="Ex. 1 portion"></label><label>Calories estimées<input name="value" type="number" inputmode="numeric" min="0" max="50000" step="1" required value="'+esc(entry.value??'')+'"></label><p class="modal-explain">Estimation manuelle : aucune analyse nutritionnelle automatique.</p>':type==='steps'?'<label>Nombre de pas<input name="value" type="number" inputmode="numeric" min="0" max="200000" step="1" required value="'+esc(entry.value??'')+'"></label><p class="modal-explain">Saisie manuelle : l’application ne lit pas le podomètre de l’iPhone.</p>':'<label>Humeur<select name="name" required><option value="" '+(entry.name?'':'selected')+'>Choisis ton humeur</option>'+['À plat','Moyen','Bien','En forme'].map(v=>'<option '+(entry.name===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label>Note facultative<textarea name="note" maxlength="300" rows="2">'+esc(entry.note||'')+'</textarea></label>';
modal('<form id="entry-form"><h2>'+heading+'</h2><label>Date<input type="date" name="date" required max="'+today()+'" value="'+esc(entry.date||today())+'"></label>'+fields+'<p id="entry-error" class="notice-error" role="alert" hidden></p><div class="row"><button type="submit">Enregistrer</button>'+btn('Annuler','close','secondary')+'</div></form>');
document.querySelector('#entry-form').addEventListener('submit',event=>{
event.preventDefault();const v=Object.fromEntries(new FormData(event.target));v.id=entry.id||String(Date.now())+'-'+Math.random().toString(36).slice(2,7);
if(type==='weights')v.value=Number(v.value)/(unit==='lb'?unitFactor:1);
if(type==='meals')v.value=Number(v.value);
if(type==='steps')v.value=Number(v.value);
try{const payload=blank();payload[type]=[v];const valid=validatePayload(payload)[type][0];if(type==='steps'){data.steps=items.filter(item=>String(item.id)!==String(entry.id)).filter(x=>x.date!==valid.date||String(x.id)===String(valid.id)).concat(valid)}else data[type]=items.filter(item=>String(item.id)!==String(entry.id)).filter(item=>type!=='moods'||item.date!==valid.date).concat(valid);dlg.close();save()}catch(e){const error=document.querySelector('#entry-error');error.textContent=e.message;error.hidden=false}
});
}
function quickMood(name){if(!['À plat','Moyen','Bien','En forme'].includes(name))return;const old=data.moods.find(x=>x.date===today());let item={id:old?.id||String(Date.now()),date:today(),name,note:old?.note||''};data.moods=data.moods.filter(x=>x.date!==today()).concat(item);save()}
function pointDialog(id){
const rows=sorted(data.weights),i=rows.findIndex(x=>String(x.id)===String(id));if(i<0)return;
const e=rows[i],prev=rows[i-1],diff=prev?Number(e.value)-Number(prev.value):null,fr=e.date.split('-').reverse().join('/');
modal('<h2>Mesure du '+fr+'</h2><div class="weight-value" style="margin:4px 0 10px">'+shownWeight(e.value)+' <small>'+unit+'</small></div><p class="modal-explain">'+(diff===null?'Votre première mesure.':(diff>0?'+':'')+(diff<0?'-':'')+fmt(Math.abs(unit==='lb'?diff*unitFactor:diff))+' '+unit+' par rapport à la mesure précédente.')+'</p><div class="row">'+btn('Modifier','pointedit:weights:'+e.id)+btn('Supprimer','pointdel:weights:'+e.id,'secondary')+btn('Fermer','close','ghost')+'</div>');
}
function openSanteHelp(){
 if(typeof window.MonSuiviHealthGuide==='function'){window.MonSuiviHealthGuide(0);return}
 modal('<div class="sante-help"><h2>Connecter Apple Santé</h2><p>Le site ne peut pas lire Santé directement. Un raccourci iPhone validé est nécessaire ; son lien d’installation n’est pas encore disponible.</p><ol><li>Après installation du raccourci, autoriser uniquement la lecture des pas dans Santé.</li><li>Lancer « Synchroniser mes pas » et comparer le total obtenu à celui de Santé. Plusieurs sources (iPhone et montre) ne doivent pas être additionnées deux fois.</li><li>Le raccourci revient vers Mon Suivi avec le total et la date du jour. Le navigateur utilisé doit contenir ton espace local.</li></ol><p>Une automatisation quotidienne peut ensuite être créée dans Raccourcis. La lecture des données de Santé peut demander de déverrouiller l’iPhone ; l’exécution silencieuse n’est pas garantie.</p><p>Le développeur doit encore créer, valider puis partager le raccourci depuis un iPhone. En attendant, utilise la saisie manuelle.</p><details><summary>Contrat du lien de retour</summary><p class="shortcut-url"><code>https://mon-suivi-six.vercel.app/#sante-pas=NOMBRE&amp;date=AAAA-MM-JJ</code></p><p>Ce modèle technique n’est pas un lien d’installation. Les valeurs sont transmises dans le fragment, retiré ensuite de l’adresse.</p></details>'+btn('Compris','close','secondary')+'</div>');
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
function clearData(){if(!confirm('Effacer définitivement vos données locales ? Pensez à les exporter avant de continuer.'))return;try{for(const key of [KEY,KEY+'-photo-consent',KEY+'-off',KEY+'-backup'])localStorage.removeItem(key)}catch{storageOK=false}photoData=null;photoSessionApproved=false;offResults=[];data=blank();demo=false;unit='kg';go('Accueil')}
document.addEventListener('submit',e=>{if(e.target.id!=='setup-form')return;e.preventDefault();const f=new FormData(e.target);if(!f.has('consent')||!f.has('terms'))return;data=blank();data.name=String(f.get('name')||'').trim().slice(0,60);data.consent=true;data.consentAt=new Date().toISOString();data.consentVersion='1';demo=false;unit='kg';page='Aujourd’hui';save()});
document.addEventListener('submit',e=>{
if(e.target.id==='photo-consent-form'){e.preventDefault();const f=new FormData(e.target);if(!f.has('agree')){const err=document.querySelector('#photo-consent-error');if(err){err.textContent='Cochez la case pour autoriser l’envoi de la photo.';err.hidden=false}return}photoSessionApproved=true;try{localStorage.removeItem(KEY+'-photo-consent')}catch{}dlg.close();analyzePhoto();return}
if(e.target.id==='goal-form'){e.preventDefault();const g=Number(new FormData(e.target).get('goal'));if(!Number.isInteger(g)||g<500||g>100000){const err=document.querySelector('#goal-error');err.textContent='Choisissez un objectif entre 500 et 100 000 pas.';err.hidden=false;return}data.stepsGoal=g;dlg.close();save();return}
if(e.target.id==='wgoal-form'){e.preventDefault();let g=Number(new FormData(e.target).get('goal'));if(unit==='lb')g=g/unitFactor;if(!Number.isFinite(g)||g<=0||g>700){const err=document.querySelector('#wgoal-error');err.textContent='Objectif invalide.';err.hidden=false;return}data.weightGoal=Math.round(g*100)/100;dlg.close();save();return}
});
document.addEventListener('input',e=>{
if(e.target.name==='name'&&mealMode==='confirm'&&photoAI){const slot=document.querySelector('#photo-alt-content');if(slot)slot.innerHTML=photoAlternativesHtml(e.target.value);return}
if(e.target.id!=='off-grams')return;const g=Number(e.target.value),grams=Number.isFinite(g)&&g>0?g:100;const k=document.querySelector('#off-kcal');if(k&&offPicked)k.value=offKcalFor(grams);for(const [key] of macroFields){const input=document.querySelector('#off-'+key);if(input)input.value=macroFor(key,grams)}
});
document.addEventListener('click',e=>{
const el=e.target.closest('[data-action]');if(!el)return;e.preventDefault();
const [action,type,id]=el.dataset.action.split(':');
if(action==='go'){go(type);return}
if(action==='start'){if(data.consent){go('Aujourd’hui')}else go('Bienvenue');return}
if(action==='back'){go(data.consent||demo?'Aujourd’hui':'Accueil');return}
if(action==='add'){type==='meals'?openMealForm():openForm(type);return}
if(action==='addphoto'){openMealForm();mealMode='photo';renderMealDialog();return}
if(action==='edit'){type==='meals'?openMealForm(data.meals.find(x=>String(x.id)===String(id))):openForm(type,id);return}
if(action==='mealmode'){mealMode=type;if(type==='search'||type==='barcode')offResults=[];if(type==='ciqual')ciqualResults=[];renderMealDialog();return}
if(action==='offsearch'){doOffSearch();return}
if(action==='offbarcode'){doOffBarcode();return}
if(action==='ciqualsearch'){doCiqualSearch();return}
if(action==='ciqualpick'){ciqualPick(Number(type));return}
if(action==='offpick'){offPick(Number(type));return}
if(action==='offpick-alt'){offPickAlt(Number(type));return}
if(action==='photoanalyze'){analyzePhoto();return}
if(action==='photo-alt-manual'){showPhotoAlternativesManual();return}
if(action==='photo-compare'){photoCompareProducts();return}
if(action==='photo-consent-off'){photoSessionApproved=false;try{localStorage.removeItem(KEY+'-photo-consent')}catch{}render();return}
if(action==='delete'){if(confirm('Supprimer cette entrée ?')){data[type]=data[type].filter(x=>String(x.id)!==id);save()}return}
if(action==='quickmood'){quickMood(type);return}
if(action==='period'){period=type;render();return}
if(action==='close'){dlg.close();return}
if(action==='point'){pointDialog(type);return}
if(action==='steps-goal'){openStepsGoal();return}
if(action==='sante-help'){openSanteHelp();return}
if(action==='steps-goal-off'){data.stepsGoal=null;save();return}
if(action==='weight-goal'){openWeightGoal();return}
if(action==='weight-goal-off'){data.weightGoal=null;save();return}
if(action==='pointedit'){dlg.close();openForm(type,id);return}
if(action==='pointdel'){dlg.close();if(confirm('Supprimer cette mesure ?')){data[type]=data[type].filter(x=>String(x.id)!==id);save()}return}
if(action==='name'){data.name=document.querySelector('#name').value.trim().slice(0,60);save();return}
if(action==='export'){exportData();return}
if(action==='import'){document.querySelector('#import-file')?.click();return}
if(action==='clear'){clearData();return}
});
document.addEventListener('change',async e=>{
if(e.target.id==='photo-file'){photoPicked(e.target.files?.[0]);e.target.value='';return}
if(e.target.id==='unit'){unit=e.target.value==='lb'?'lb':'kg';if(!demo){data.unit=unit;save()}else render();return}
if(e.target.id!=='import-file')return;
const file=e.target.files?.[0];if(!file)return;
try{
if(file.size>2_000_000)throw Error('Le fichier est trop volumineux (2 Mo maximum).');
let current=null;try{current=localStorage.getItem(KEY)}catch{storageOK=false}try{localStorage.setItem(KEY+'-backup',current||'{}')}catch{}const parsed=validatePayload(JSON.parse(await file.text()));
modal('<h2>Importer votre sauvegarde ?</h2><p>Ce fichier contient '+parsed.weights.length+' mesures, '+parsed.meals.length+' repas, '+parsed.moods.length+' humeurs et '+parsed.steps.length+' jour(s) de pas.</p><p class="notice-error">Attention : votre suivi actuel sera remplacé. Une copie de secours de ce suivi est conservée dans le stockage local de ce navigateur jusqu’au prochain import.</p><div class="row">'+btn('Remplacer mon suivi','confirm-import')+btn('Annuler','close','secondary')+'</div>');
dlg.querySelector('[data-action="confirm-import"]').onclick=()=>{parsed.consent=true;parsed.consentAt=new Date().toISOString();data=parsed;demo=false;unit=data.unit;dlg.close();go('Profil');save()};
}catch(error){alert('Import impossible : '+error.message)}finally{e.target.value=''}
});
render();
importSanteSteps();

