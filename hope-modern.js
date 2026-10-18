(function(){
  'use strict';
  var room=document.getElementById('hope'),button=document.getElementById('hmMotionToggle'),workspace=document.getElementById('hopeWorkspace');
  if(!room||!button)return;
  var preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  function paused(){return room.classList.contains('hm-paused')||document.body.classList.contains('still-mode')||(preference.matches&&!room.classList.contains('hm-motion-optin'));}
  function sync(){var off=paused();button.textContent=off?'Play scene':'Pause scene';button.setAttribute('aria-pressed',String(!off));}
  button.addEventListener('click',function(){if(document.body.classList.contains('still-mode')){button.textContent='Exit Still mode first';return;}if(paused()){room.classList.remove('hm-paused');if(preference.matches)room.classList.add('hm-motion-optin');}else room.classList.add('hm-paused');sync();});
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
  if(preference.addEventListener)preference.addEventListener('change',sync);
  var prefix=window.location.href.split('#')[0];
  room.querySelectorAll('svg [fill],svg [stroke]').forEach(function(node){['fill','stroke'].forEach(function(attr){var value=node.getAttribute(attr);if(value&&value.indexOf('url(#hm-')===0)node.setAttribute(attr,value.replace('url(#','url('+prefix+'#'));});});
  if(workspace)new MutationObserver(function(){var open=workspace.classList.contains('open');workspace.setAttribute('role',open?'dialog':'region');if(open)workspace.setAttribute('aria-modal','true');else workspace.removeAttribute('aria-modal');}).observe(workspace,{attributes:true,attributeFilter:['class']});
  sync();
})();
