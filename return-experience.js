/* Optional continuity, stored on this device. No streaks or background polling. */
(()=>{'use strict';
const names={great:'Great Room',rant:'Rant Room',meltdown:'Meltdown Room',thinking:'Thinking Room',calm:'Calm Room',hope:'Hope Room',celebration:'Celebration Room',resources:'Resource Room',learn:'Learning Room',companion:'Companion',outdoor:'Outdoor',explore:'Explore Near Me',game:'Family & Fun',axe:'Archery',plate:'Balloon Garden',crumple:'Paper Toss'};
const key='meltdownReturnExperience';let saved={favorite:'',last:'',visits:0};
try{const value=JSON.parse(localStorage.getItem(key)||'null');if(value&&typeof value==='object')saved={favorite:names[value.favorite]?value.favorite:'',last:names[value.last]?value.last:'',visits:Number.isSafeInteger(value.visits)&&value.visits>0?value.visits:0};}catch{}
const hub=document.getElementById('retreat');if(!hub)return;
function persist(){try{localStorage.setItem(key,JSON.stringify(saved));return true;}catch{return false;}}
function go(id){if(names[id])showScreen(id);}
function icon(path){return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="'+path+'"/></svg>';}
const choices=[['luminousRelease','Unwind','M4 9c3-5 5 5 8 0s5 5 8 0M4 15c3-5 5 5 8 0s5 5 8 0'],['luminousCalm','Play','m7 4 14 8-14 8V4Z'],['luminousThink','My room','m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9L12 3Z']];
for(const [id,label,path]of choices){const button=document.getElementById(id);button.querySelector('.symbol').innerHTML=icon(path);button.lastElementChild.textContent=label;}
const favorite=document.getElementById('luminousThink'),resume=document.getElementById('luminousQuiet');
const personal=document.createElement('div');personal.className='re-personal';
const edit=document.createElement('button');edit.type='button';edit.className='re-change';edit.textContent='Choose my favorite room';
const note=document.createElement('p');note.className='re-note';note.textContent='Your favorite and last room are remembered on this device.';personal.append(edit,note);resume.after(personal);
const dialog=document.createElement('dialog');dialog.className='re-room-picker';dialog.setAttribute('aria-labelledby','rePickerTitle');
const heading=document.createElement('h2');heading.id='rePickerTitle';heading.textContent='A room to call yours.';
const intro=document.createElement('p');intro.textContent='Choose a favorite for a one-tap return. Every room stays on the map.';
const label=document.createElement('label');label.htmlFor='reFavorite';label.textContent='Your favorite room';
const select=document.createElement('select');select.id='reFavorite';for(const [value,text]of Object.entries(names)){const option=document.createElement('option');option.value=value;option.textContent=text;select.append(option);}
const actions=document.createElement('div');actions.className='re-picker-actions';
const save=document.createElement('button');save.type='button';save.textContent='Keep this room';
const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Maybe later';actions.append(save,cancel);dialog.append(heading,intro,label,select,actions);document.body.append(dialog);
function render(){favorite.lastElementChild.textContent=saved.favorite?names[saved.favorite]:'My room';favorite.setAttribute('aria-label',saved.favorite?'Open your favorite: '+names[saved.favorite]:'Choose your favorite room');edit.textContent=saved.favorite?'Change favorite room':'Choose my favorite room';resume.textContent=saved.last?'Continue in '+names[saved.last]+' →':'Meet your companion →';}
function pick(){select.value=saved.favorite||'great';dialog.showModal();select.focus();}
edit.addEventListener('click',pick);cancel.addEventListener('click',()=>dialog.close());save.addEventListener('click',()=>{saved.favorite=select.value;const ok=persist();render();note.textContent=ok?'Your favorite is ready whenever you return.':'Favorite selected for this visit. This browser could not save it.';dialog.close();favorite.focus();});
hub.addEventListener('click',event=>{const b=event.target.closest('button');if(!b)return;const id=b.id;const map=b.dataset.view==='rooms';if(!['luminousRelease','luminousCalm','luminousThink','luminousQuiet'].includes(id)&&!map)return;event.preventDefault();event.stopImmediatePropagation();if(map){showScreen('map');return;}if(id==='luminousRelease')go('calm');if(id==='luminousCalm')go('axe');if(id==='luminousThink'){saved.favorite?go(saved.favorite):pick();}if(id==='luminousQuiet')go(saved.last||'companion');},true);
let current='';function changed(){const room=document.querySelector('.screen.active'),id=room?.id;if(id===current)return;current=id;if(!names[id]){render();return;}saved.last=id;if(id==='companion'){let pet;try{pet=companionSaved();}catch{}if(pet?.name){const presence=document.getElementById('companionPresence');presence.textContent=pet.name+(saved.visits?' is happy to see you again. Fancy a little play?':' is glad you are here. Say hello or share a little play.');}saved.visits=Math.min(100000,saved.visits+1);}persist();render();}
new MutationObserver(records=>{if(records.some(r=>r.target.classList?.contains('screen')))changed();}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
render();changed();
})();
