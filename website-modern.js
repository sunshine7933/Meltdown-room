(()=>{
 const button=document.querySelector('.scene-toggle');
 const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
 let paused=preference.matches;
 function render(){document.body.classList.toggle('website-still',paused||document.hidden);if(button){button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Play water shimmer':'Pause water shimmer';}}
 button?.addEventListener('click',()=>{paused=!paused;render();});
 preference.addEventListener('change',event=>{paused=event.matches;render();});
 document.addEventListener('visibilitychange',render);
 render();
})();
