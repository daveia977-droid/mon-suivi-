'use strict';
(function(){
 const name='Mon Suivi — Mes pas';
 const launch='shortcuts://run-shortcut?name='+encodeURIComponent(name);
 function show(step=0){
  const config=window.MON_SUIVI_CONFIG||{},url=config.healthShortcutShareUrl;
  const ready=config.healthShortcutValidated===true&&typeof url==='string'&&/^https:\/\/www\.icloud\.com\/shortcuts\/[a-z0-9-]+$/i.test(url);
  const install=ready?'<a class="compact-outline" href="'+esc(url)+'" rel="noopener noreferrer">Installer le raccourci</a>':'<p>Le raccourci doit encore être créé et vérifié sur un iPhone. Le lien d’installation n’est pas disponible.</p><button type="button" disabled>Installer le raccourci — en préparation</button>';
  const sync=ready?'<a class="compact-outline" href="'+launch+'">Synchroniser mes pas</a>':'<p>La synchronisation pourra être lancée ici une fois le raccourci validé et son lien configuré.</p>';
  const screens=[
   '<h2 id="health-guide-title">Installer le raccourci</h2><p>L’application Raccourcis sert de pont entre Santé et Mon Suivi. Aucun accès direct à Santé n’est possible depuis le site.</p>'+install,
   '<h2 id="health-guide-title">Autoriser les pas uniquement</h2><p>Au premier lancement dans Raccourcis, autorise uniquement la lecture des pas. Aucune mesure n’est écrite dans Santé.</p><p>Compare le total avec Santé : si une montre et un iPhone enregistrent en même temps, leurs échantillons ne doivent pas être additionnés deux fois.</p>',
   '<h2 id="health-guide-title">Synchroniser et vérifier</h2>'+sync+'<p>Le total reçu remplace celui du jour sans addition. Si tu avais saisi tes pas à la main, Mon Suivi te demande lequel conserver.</p><p>Utilise toujours le même espace de suivi. Safari et la PWA installée peuvent avoir des historiques distincts.</p><details><summary>Automatisation quotidienne</summary><p>Après validation du raccourci, ouvre Raccourcis → Automatisation → Heure de la journée et choisis ce raccourci. Fais un essai avec l’iPhone verrouillé : le déverrouillage ou une confirmation peut rester nécessaire.</p></details>'
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
