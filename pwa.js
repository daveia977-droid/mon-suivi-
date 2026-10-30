'use strict';
(function(){
 if(!('serviceWorker' in navigator)||!window.isSecureContext)return;
 let registration=null,accepted=false,reloading=false,dismissed=false,lastCheck=0;
 const dirtyForms=new Set();
 document.addEventListener('input',e=>{dirtyForms.add(e.target.closest('form')||e.target)});
 document.addEventListener('submit',e=>{setTimeout(()=>{if(!document.querySelector('dialog[open]'))dirtyForms.delete(e.target)},0)});
 const busy=()=>{
  for(const item of dirtyForms){const dialog=item.closest('dialog');if(!item.isConnected||(dialog&&!dialog.open))dirtyForms.delete(item)}
  return !!document.querySelector('dialog[open]')||dirtyForms.size>0;
 };
 function offer(){
  if(dismissed||!registration?.waiting||document.querySelector('#pwa-update'))return;
  document.querySelector('#v4-mood-prompt')?.remove();
  const panel=document.createElement('section');panel.id='pwa-update';panel.className='v4-notice';panel.setAttribute('role','status');
  panel.innerHTML='<strong>Une nouvelle version de Mon Suivi est disponible.</strong><p id="pwa-update-detail">Vos données enregistrées sont conservées.</p><div class="row"><button type="button" id="pwa-apply">Mettre à jour</button><button type="button" id="pwa-later" class="secondary">Plus tard</button></div>';
  document.body.append(panel);
  panel.querySelector('#pwa-later').onclick=()=>{dismissed=true;panel.remove()};
  panel.querySelector('#pwa-apply').onclick=()=>{
   if(busy()){panel.querySelector('#pwa-update-detail').textContent='Termine ou ferme ta saisie avant de mettre à jour.';return}
   if(!registration.waiting){panel.remove();return}
   accepted=true;panel.querySelector('#pwa-apply').disabled=true;
   registration.waiting.postMessage({type:'APPLY_UPDATE'});
  };
 }
 navigator.serviceWorker.addEventListener('controllerchange',()=>{
  if(accepted&&!reloading&&!busy()){reloading=true;location.reload()}
 });
 async function check(){
  if(!registration||document.visibilityState!=='visible'||Date.now()-lastCheck<60000)return;
  lastCheck=Date.now();try{await registration.update();offer()}catch{}
 }
 window.addEventListener('load',async()=>{
  try{
   registration=await navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'});
   offer();
   registration.addEventListener('updatefound',()=>{
    const worker=registration.installing;
    worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)offer()});
   });
   check();
  }catch{}
 });
 document.addEventListener('visibilitychange',check);
 window.addEventListener('online',check);
})();
