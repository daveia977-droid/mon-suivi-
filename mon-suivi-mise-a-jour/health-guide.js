'use strict';
(function(){
 const cfg=()=>window.MON_SUIVI_CONFIG||{};
 const nameOf=()=>cfg().healthShortcutName||'Mon Suivi — Santé';
 const site=()=>location.origin+location.pathname.replace(/index\.html$/,'');
 function show(step=0){
  const config=cfg(),url=config.healthShortcutShareUrl,name=nameOf();
  const launch='shortcuts://run-shortcut?name='+encodeURIComponent(name);
  const ready=config.healthShortcutValidated===true&&typeof url==='string'&&/^https:\/\/www\.icloud\.com\/shortcuts\/[a-z0-9-]+$/i.test(url);
  const install=ready?'<a class="compact-outline" href="'+esc(url)+'" rel="noopener noreferrer">Installer le raccourci</a>':'<button type="button" disabled>Installer le raccourci — lien bientôt disponible</button><details class="shortcut-build"><summary>Créer le raccourci soi-même (10 minutes)</summary><ol>'+
   '<li>Ouvre l’app <strong>Raccourcis</strong> → <strong>+</strong>, nomme-le « '+esc(name)+' ».</li>'+
   '<li>Ajoute <strong>Rechercher des échantillons de santé</strong> : Type <em>Nombre de pas</em>, Date de début <em>aujourd’hui</em>, Regrouper par <em>Jour</em>. Puis <strong>Calculer les statistiques</strong> → <em>Somme</em>. Renomme le résultat « Pas » (Arrondir le nombre).</li>'+
   '<li>Même chose pour <em>Énergie active</em> (Somme → « Kcal »), <em>Eau</em> en ml (Somme → « Eau ») et <em>Distance de marche et de course</em> en km (Somme → « Distance »).</li>'+
   '<li><em>Poids</em> et <em>Fréquence cardiaque au repos</em> : Trier par <em>Date de début</em>, du plus récent, Limite <em>1</em> → « Poids » et « FC ».</li>'+
   '<li>Facultatif, sommeil : <em>Analyse du sommeil</em> depuis hier 18 h, valeur <em>Endormi</em> ; Calculer les statistiques → Somme de la durée en heures → « Sommeil ».</li>'+
   '<li>Ajoute <strong>Date actuelle</strong> puis <strong>Formater la date</strong> : format personnalisé <code>yyyy-MM-dd</code>.</li>'+
   '<li>Ajoute <strong>Texte</strong> avec l’adresse ci-dessous, en remplaçant chaque mot en majuscules par la variable correspondante, puis <strong>Ouvrir les URL</strong>.</li></ol>'+
   '<p class="shortcut-url"><code>'+esc(site())+'#sante=1&amp;date=DATE&amp;pas=PAS&amp;poids=POIDS&amp;sommeil=SOMMEIL&amp;kcal=KCAL&amp;fc=FC&amp;eau=EAU&amp;distance=DISTANCE</code></p><p>Tu peux retirer les mesures que tu ne veux pas partager. Une mesure vide est simplement ignorée.</p></details>';
  const sync=ready||config.healthShortcutLocal!==false?'<a class="compact-outline" href="'+launch+'">Synchroniser maintenant</a>':'';
  const screens=[
   '<h2 id="health-guide-title">Le raccourci Apple Santé</h2><p>Un site web ne peut pas lire Santé directement. L’app <strong>Raccourcis</strong> de l’iPhone fait le pont : en un toucher, elle envoie tes <strong>pas, poids, sommeil, calories actives, rythme cardiaque au repos, eau et distance</strong> à Mon Suivi.</p>'+install,
   '<h2 id="health-guide-title">Autoriser la lecture</h2><p>Au premier lancement, l’iPhone demande l’accès à chaque type de donnée : autorise seulement ce que tu veux partager. Le raccourci ne fait que <strong>lire</strong> : rien n’est écrit dans Santé.</p><p>Les données voyagent dans l’adresse du site, sur ton téléphone, puis sont enregistrées dans ton espace local. Elles ne passent par aucun serveur de Mon Suivi.</p>',
   '<h2 id="health-guide-title">Synchroniser chaque jour</h2>'+sync+'<p>Les valeurs reçues remplacent celles du jour sans s’additionner. Si tu avais noté tes pas à la main, Mon Suivi te demande lequel garder.</p><p>Ouvre toujours le même espace : Safari et l’app installée sur l’écran d’accueil ont des données séparées.</p><details><summary>Automatiser tous les soirs</summary><p>Raccourcis → <strong>Automatisation</strong> → <strong>Heure de la journée</strong> (par ex. 21 h) → choisis « '+esc(name)+' » → <em>Exécuter immédiatement</em>. L’iPhone peut demander de le déverrouiller pour lire Santé.</p></details>'
  ];
  const controls='<div class="row">'+(step?'<button type="button" class="secondary" data-health-step="'+(step-1)+'">Précédent</button>':'')+(step<2?'<button type="button" data-health-step="'+(step+1)+'">Suivant</button>':'<button type="button" data-health-manual>Saisir mes pas à la main</button>')+'<button type="button" class="secondary" data-action="close">Fermer</button></div>';
  modal('<section class="v4-settings health-guide"><p>Apple Santé · Étape '+(step+1)+' sur 3</p>'+screens[step]+controls+'</section>');
  dlg.setAttribute('aria-labelledby','health-guide-title');
  const heading=dlg.querySelector('#health-guide-title');heading.tabIndex=-1;heading.focus();
 }
 window.MonSuiviHealthGuide=show;
 document.addEventListener('click',event=>{
  const control=event.target.closest('[data-health-step],[data-health-manual]');if(!control)return;
  if(control.hasAttribute('data-health-manual')){dlg.close();openForm('steps');return}
  const step=Number(control.dataset.healthStep);if(Number.isInteger(step)&&step>=0&&step<=2)show(step);
 });
})();
