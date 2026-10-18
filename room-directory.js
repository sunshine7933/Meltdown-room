(function(){
 'use strict';
 document.addEventListener('click',function(event){var button=event.target.closest('[data-directory-room]');if(!button)return;var id=button.getAttribute('data-directory-room');if(document.getElementById(id)&&typeof window.showScreen==='function')window.showScreen(id);});
})();


/* Lakeside scene playback */
(function(){
 'use strict';
 var room=document.getElementById('map'),button=document.getElementById('rdMotionToggle');if(!room||!button)return;
 var preference=window.matchMedia('(prefers-reduced-motion: reduce)');
 function paused(){return room.classList.contains('rd-paused')||document.body.classList.contains('still-mode')||(preference.matches&&!room.classList.contains('rd-motion-optin'));}
 function sync(){var off=paused();button.textContent=off?'Play scene':'Pause scene';button.setAttribute('aria-pressed',String(!off));}
 button.addEventListener('click',function(){if(document.body.classList.contains('still-mode')){button.textContent='Exit Still mode first';return;}if(paused()){room.classList.remove('rd-paused');if(preference.matches)room.classList.add('rd-motion-optin');}else room.classList.add('rd-paused');sync();});
 new MutationObserver(sync).observe(document.body,{attributes:true,attributeFilter:['class']});if(preference.addEventListener)preference.addEventListener('change',sync);sync();
})();
