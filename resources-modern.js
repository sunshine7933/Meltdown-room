(() => {
 'use strict';
 const room=document.getElementById('resources'),drawer=document.getElementById('rsDrawer');if(!room||!drawer)return;
 const shell=room.querySelector('.rs-shell'),close=document.getElementById('rsClose');let returnTo,favorites=false;
 const original=window.renderResources;
 window.renderResources=function(onlyFavorites){if(typeof onlyFavorites==='boolean')favorites=onlyFavorites;return original(favorites);};
 function tab(name){
  favorites=name==='saved';
  const pane=name==='saved'?'browse':name;
  room.querySelectorAll('[data-rs-pane]').forEach(el=>el.hidden=el.dataset.rsPane!==pane);
  room.querySelectorAll('[data-rs-tab]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.rsTab===name)));
  if(name==='saved')window.showResourceFavorites();
  else if(name==='browse'){document.getElementById('resourceCategory').value='All';document.getElementById('resourceSearch').value='';window.renderResources(false);}
  document.getElementById('rsBrowseTitle').textContent=name==='saved'?'Your saved resources.':'Find your next helpful thing.';
  drawer.scrollTop=0;
 }
 function open(name,button){returnTo=button;drawer.hidden=false;shell.inert=true;tab(name);close.focus({preventScroll:true});}
 function hide(){drawer.hidden=true;shell.inert=false;returnTo?.focus({preventScroll:true});}
 room.querySelectorAll('[data-rs-open]').forEach(b=>b.addEventListener('click',()=>open(b.dataset.rsOpen,b)));
 room.querySelectorAll('[data-rs-tab]').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.rsTab)));
 close.addEventListener('click',hide);
 room.addEventListener('click',e=>{if(e.target.closest('[data-resource-category]')){favorites=false;room.querySelectorAll('[data-rs-tab]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.rsTab==='browse')));}if(e.target.closest('[data-resource-favorites]'))favorites=true;},true);
 document.getElementById('resourceCategory').addEventListener('change',()=>{favorites=false;window.renderResources(false);},true);
 document.getElementById('resourceSearch').addEventListener('input',()=>window.renderResources(favorites));
 document.addEventListener('keydown',e=>{
  if(drawer.hidden)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();hide();return;}
  if(e.key==='Tab'){const focusable=[...drawer.querySelectorAll('button,input,select,a[href],summary,[tabindex="0"]')].filter(el=>el.getClientRects().length);const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}
 },true);
 new MutationObserver(()=>{if(!room.classList.contains('active')&&!drawer.hidden){drawer.hidden=true;shell.inert=false;}}).observe(room,{attributes:true,attributeFilter:['class']});
 const doc=new URL(window.location.href);doc.hash='';
 room.querySelectorAll('svg [fill^="url(#"]').forEach(el=>{const value=el.getAttribute('fill');el.setAttribute('fill','url("'+doc.href+value.slice(4,-1)+'")');});
})();
