(function(){
 'use strict';
 var room=document.getElementById('celebration'),button=document.getElementById('cbMotionToggle'),workspace=document.getElementById('celebrationWorkspace'),history=document.getElementById('cbHistory');if(!room||!button||!workspace)return;
 var preference=window.matchMedia('(prefers-reduced-motion: reduce)'),lastControl=null,successCount=0;
 function paused(){return room.classList.contains('cb-paused')||document.body.classList.contains('still-mode')||(preference.matches&&!room.classList.contains('cb-motion-optin'));}
 function sync(){var off=paused();button.textContent=off?'Play scene':'Pause scene';button.setAttribute('aria-pressed',String(!off));}
 button.addEventListener('click',function(){if(document.body.classList.contains('still-mode')){button.textContent='Exit Still mode first';return;}if(paused()){room.classList.remove('cb-paused');if(preference.matches)room.classList.add('cb-motion-optin');}else room.classList.add('cb-paused');sync();});
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});if(preference.addEventListener)preference.addEventListener('change',sync);
 if(history)history.addEventListener('click',function(){showCelebrations();});
 room.addEventListener('click',function(event){var control=event.target.closest('.cb-ticket,.cb-pick,.cb-more button');if(control)lastControl=control;});
 function polish(){
  var open=workspace.classList.contains('open');workspace.setAttribute('role',open?'dialog':'region');
  if(open)workspace.setAttribute('aria-modal','true');else{workspace.removeAttribute('aria-modal');if(lastControl&&room.classList.contains('active'))lastControl.focus({preventScroll:true});}
  workspace.querySelectorAll('.celebration-bloom:not([data-polished])').forEach(function(node){node.dataset.polished='true';var svg=room.querySelector('.cb-ticket svg').cloneNode(true);svg.classList.add('cb-success-star');svg.setAttribute('role','img');svg.removeAttribute('aria-hidden');svg.setAttribute('aria-label','A star for your celebration');var suffix='-success-'+(++successCount);svg.querySelectorAll('[id]').forEach(function(el){var old=el.id;el.id+=suffix;svg.querySelectorAll('[fill],[stroke]').forEach(function(shape){['fill','stroke'].forEach(function(attr){var value=shape.getAttribute(attr);if(value&&value.includes('#'+old+')'))shape.setAttribute(attr,value.replace('#'+old+')','#'+el.id+')'));});});});node.replaceChildren(svg);});
 }
 new MutationObserver(polish).observe(workspace,{attributes:true,attributeFilter:['class'],childList:true,subtree:true});
 document.addEventListener('keydown',function(event){if(event.key==='Escape'&&workspace.classList.contains('open')){event.preventDefault();event.stopImmediatePropagation();closeCelebrationTool();}},true);
 var prefix=window.location.href.split('#')[0];room.querySelectorAll('svg [fill],svg [stroke]').forEach(function(node){['fill','stroke'].forEach(function(attr){var value=node.getAttribute(attr);if(value&&value.indexOf('url(#cb-')===0)node.setAttribute(attr,value.replace('url(#','url('+prefix+'#'));});});
 sync();
})();
