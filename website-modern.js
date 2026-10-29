(()=>{
 const button=document.querySelector('.scene-toggle');
 const preference=window.matchMedia('(prefers-reduced-motion: reduce)');
 let paused=preference.matches,optedIn=false;
 function render(){document.body.classList.toggle('website-still',paused||document.hidden);document.body.classList.toggle('website-motion-optin',optedIn);if(button){button.setAttribute('aria-pressed',String(paused));button.textContent=paused?'Play water motion':'Pause water motion';}}
 button?.addEventListener('click',()=>{paused=!paused;optedIn=!paused;render();});
 preference.addEventListener('change',event=>{paused=event.matches;optedIn=false;render();});
 document.addEventListener('visibilitychange',render);
 render();
 if('IntersectionObserver' in window){const hero=document.querySelector('.hero');if(hero){const observer=new IntersectionObserver(entries=>document.body.classList.toggle('hero-scene-paused',!entries[0].isIntersecting));observer.observe(hero);}}
})();

// Shared gold icon language, with the existing support tabs and links preserved.
(()=>{
 const paths={
  start:'M3 11 12 3l9 8M6 9v12h12V9M10 21v-7h4v7',
  now:'M12 3 3 7v6c0 4 9 8 9 8s9-4 9-8V7l-9-4ZM12 8v5m0 3h.01',
  calm:'M3 9c3-5 6 5 9 0s6 5 9 0M3 15c3-5 6 5 9 0s6 5 9 0',
  family:'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M16 4a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.87M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
  survivor:'M12 21V10M12 15C4 15 3 9 3 4c7 0 9 3 9 7M12 18c0-7 3-10 9-10 0 7-3 10-9 10',
  story:'M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0'
 };
 function makeIcon(path){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('fill','none');svg.setAttribute('stroke','currentColor');svg.setAttribute('stroke-width','1.5');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');const p=document.createElementNS(svg.namespaceURI,'path');p.setAttribute('d',path);svg.append(p);return svg;}
 for(const [name,path]of Object.entries(paths)){const book=document.getElementById('book-'+name),panel=document.querySelector('#shelf-'+name+' .shelf-icon');book?.prepend(makeIcon(path));panel?.replaceChildren(makeIcon(path));}
 const title=document.querySelector('#resources h2');if(title)title.textContent='A little support. Within reach.';
 const intro=document.querySelector('#resources .lead');if(intro)intro.textContent='Choose what you need today. A place to begin, a calmer moment, or support for you and your family.';
 const shelfTitle=document.querySelector('.bookshelf-top span');if(shelfTitle)shelfTitle.textContent='Your collection of starting places';
 const arrows={primary:'M5 12h14m-5-5 5 5-5 5',secondary:'M12 4v16m-6-6 6 6 6-6'};
 for(const [name,path]of Object.entries(arrows)){document.querySelector('.hero .btn-'+name+' span')?.replaceChildren(makeIcon(path));}
})();

