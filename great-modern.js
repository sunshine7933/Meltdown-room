(()=>{
const room=document.getElementById('great'),grid=room.querySelector('.gm-grid'),panel=room.querySelector('.gm-group-panel'),extra=room.querySelector('.gm-extra'),more=room.querySelector('.gm-all');
let returnTo=null;
const groups={
release:{title:'Let it out',intro:'Choose the kind of space you need.',items:[['rant','Write it out','Put your feelings into words.'],['meltdown','It feels too much','A space for an overwhelming moment.'],['game','Take a play break','Try a quick game.']]},
calm:{title:'Find calm',intro:'There is nothing to finish here.',items:[['calm','Breathing and quiet','Take a gentle pause.'],['outdoor','Step outside','Spend a moment in the outdoor space.']]},
think:{title:'Think it through',intro:'One thought. One small step.',items:[['thinking','Untangle a thought','Write, reflect, or explore your ideas.']]},
support:{title:'Find encouragement',intro:'A little support for this moment.',items:[['hope','A little hope','Find a hopeful moment.'],['companion','Your companion','Spend time with your companion.']]}
};
function go(id){if(typeof window.showScreen==='function'){window.showScreen(id);return}room.querySelector('.gm-status').textContent='Preview destination: '+id;}
function reset(){grid.hidden=false;panel.hidden=true;room.querySelectorAll('[data-modern-group]').forEach(button=>button.setAttribute('aria-expanded','false'));}
room.querySelectorAll('[data-modern-group]').forEach(button=>button.addEventListener('click',()=>{
const group=groups[button.dataset.modernGroup];returnTo=button;extra.hidden=true;more.setAttribute('aria-expanded','false');grid.hidden=true;panel.hidden=false;button.setAttribute('aria-expanded','true');panel.querySelector('h2').textContent=group.title;panel.querySelector('.gm-group-intro').textContent=group.intro;
const options=panel.querySelector('.gm-group-options');options.replaceChildren();group.items.forEach(([id,title,copy])=>{const item=document.createElement('button');item.type='button';item.className='gm-group-option';const strong=document.createElement('strong'),small=document.createElement('span');strong.textContent=title;small.textContent=copy;item.append(strong,small);item.addEventListener('click',()=>go(id));options.append(item);});panel.querySelector('h2').focus({preventScroll:true});
}));
panel.querySelector('.gm-group-back').addEventListener('click',()=>{reset();if(returnTo)returnTo.focus({preventScroll:true});});
more.addEventListener('click',()=>{reset();extra.hidden=!extra.hidden;more.setAttribute('aria-expanded',String(!extra.hidden));});
room.querySelectorAll('[data-modern-room]').forEach(button=>button.addEventListener('click',()=>go(button.dataset.modernRoom)));
const page=new URL(window.location.href);page.hash='';room.querySelectorAll('use[href^="#"]').forEach(icon=>icon.setAttribute('href',page.href+icon.getAttribute('href')));
})();
