(function(){
  'use strict';
  var room=document.getElementById('calm'),button=document.getElementById('cmMotionToggle');
  if(!room||!button)return;
  var preference=window.matchMedia('(prefers-reduced-motion: reduce)');
  function paused(){return room.classList.contains('cm-paused')||document.body.classList.contains('still-mode')||(preference.matches&&!room.classList.contains('cm-motion-optin'));}
  function sync(){var off=paused();button.textContent=off?'Play scene':'Pause scene';button.setAttribute('aria-pressed',String(!off));}
  button.addEventListener('click',function(){
    if(document.body.classList.contains('still-mode')){button.textContent='Exit Still mode first';return;}
    if(paused()){room.classList.remove('cm-paused');if(preference.matches)room.classList.add('cm-motion-optin');}else room.classList.add('cm-paused');
    sync();
  });
  new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});
  if(preference.addEventListener)preference.addEventListener('change',sync);
  // Resolve SVG paint references inside Reddit's base-URL document.
  var prefix=window.location.href.split('#')[0];
  room.querySelectorAll('svg [fill],svg [stroke]').forEach(function(node){['fill','stroke'].forEach(function(attr){var value=node.getAttribute(attr);if(value&&value.indexOf('url(#cm-')===0)node.setAttribute(attr,value.replace('url(#','url('+prefix+'#'));});});
  sync();
})();
