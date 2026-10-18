(() => {
 'use strict';
 const room=document.getElementById('learn'),bench=document.getElementById('lmWorkbench'),workspace=document.getElementById('learnWorkspace');if(!room||!bench||!workspace)return;
 const shell=room.querySelector('.lm-shell'),close=document.getElementById('lmClose'),status=document.getElementById('learnStatus'),deskStatus=document.getElementById('lmDeskStatus');let returnTo;
 const doc=new URL(window.location.href);doc.hash='';
 room.querySelectorAll('svg [fill^="url(#"],svg [stroke^="url(#"]').forEach(el=>{for(const a of ['fill','stroke']){const v=el.getAttribute(a);if(v?.startsWith('url(#'))el.setAttribute(a,'url("'+doc.href+v.slice(4,-1)+'")');}});
 function stored(key){try{return JSON.parse(localStorage.getItem(key)||'[]')}catch{return []}}
 function progress(){const count=stored('meltdownLearned').length;document.getElementById('lmProgress').textContent=count?count+' resource'+(count===1?'':'s')+' explored':'Your pace. Your path.';}
 function open(title){if(bench.hidden){returnTo=document.activeElement;shell.inert=true;bench.hidden=false;}document.getElementById('lmWorkbenchTitle').textContent=title;bench.scrollTop=0;close.focus({preventScroll:true});}
 function hide(){bench.hidden=true;shell.inert=false;returnTo?.focus({preventScroll:true});}
 function focusHeading(){const h=workspace.querySelector('h3');if(h){h.tabIndex=-1;h.focus({preventScroll:true});}}
 const originals={shelf:window.openLearnShelf,tools:window.openLearnTools,template:window.openLearnTemplate,question:window.askLearningQuestion,close:window.closeLearnWorkspace,mark:window.markLearned};
 function restoreMarks(name){const learned=stored('meltdownLearned');workspace.querySelectorAll('.learn-resource').forEach((item,index)=>{const button=item.querySelector('button');if(button&&learned.includes(name+'::'+index)){button.disabled=true;button.textContent='Learned ✓';button.setAttribute('aria-label','Already explored: '+item.querySelector('strong').textContent);}});}
 window.openLearnShelf=function(name,button){originals.shelf(name,button);restoreMarks(name);room.querySelectorAll('.learn-shelf').forEach(el=>el.setAttribute('aria-current',el===button?'page':'false'));open('Learning shelves');focusHeading();};
 window.openLearnTools=function(){originals.tools();open('Practical tools');focusHeading();};
 window.openLearnTemplate=function(id){originals.template(id);open('Your private worksheet');focusHeading();};
 window.closeLearnWorkspace=function(){originals.close();hide();if(!/\bsaved\b|\bcleared\b/i.test(status.textContent))status.textContent='Your progress and notes stay on this device.';};
 window.markLearned=function(name,index,button){originals.mark(name,index,button);progress();};
 window.askLearningQuestion=function(){
  originals.question();open('Your question notebook');
  const title=document.getElementById('learnQuestionTitle'),text=document.getElementById('learnQuestionText');title.setAttribute('aria-label','Question topic');text.setAttribute('aria-label','Your private question');
  const note=document.createElement('p');note.textContent='A private place to collect questions for later. Nothing is sent to anyone.';workspace.querySelector('h3').after(note);
  const saved=stored('meltdownLearningQuestions');
  if(saved.length){const details=document.createElement('details');details.className='lm-saved-questions';const summary=document.createElement('summary');summary.textContent='Saved questions ('+saved.length+')';details.append(summary);saved.slice(0,12).forEach(q=>{const article=document.createElement('article');article.className='lm-saved-question';const strong=document.createElement('strong'),p=document.createElement('p'),date=document.createElement('small');strong.textContent=q.title||'A question for later';p.textContent=q.text;date.textContent=new Date(q.date).toLocaleDateString();article.append(strong,p,date);details.append(article);});workspace.append(details);}
  focusHeading();
 };
 window.clearLearnTemplate=function(id){
  if(!window.learnTemplates?.[id])return;
  workspace.querySelector('.lm-confirm')?.remove();const box=document.createElement('div');box.className='lm-confirm';box.setAttribute('role','group');box.setAttribute('aria-label','Clear saved worksheet confirmation');
  const p=document.createElement('p'),yes=document.createElement('button'),no=document.createElement('button');p.textContent='Clear this worksheet from this device?';yes.type=no.type='button';yes.textContent='Clear saved worksheet';no.textContent='Keep worksheet';
  yes.addEventListener('click',()=>{localStorage.removeItem('meltdownLearnTool::'+id);window.openLearnTemplate(id);status.textContent='Worksheet cleared from this device.';});no.addEventListener('click',()=>{box.remove();workspace.querySelector('.learn-template-actions button')?.focus();});box.append(p,yes,no);workspace.append(box);no.focus();
 };
 document.getElementById('lmBrowse').addEventListener('click',()=>{workspace.classList.add('open');workspace.replaceChildren();const h=document.createElement('h3'),p=document.createElement('p');h.textContent='What are you curious about?';p.textContent='Choose a book from the learning shelves. Explore a guide, save your progress, or come back whenever you like.';workspace.append(h,p);room.querySelectorAll('.learn-shelf').forEach(b=>{b.classList.remove('active');b.setAttribute('aria-current','false');});open('Explore the shelves');focusHeading();});
 close.addEventListener('click',()=>window.closeLearnWorkspace());
 document.addEventListener('keydown',e=>{if(bench.hidden)return;if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();window.closeLearnWorkspace();return;}if(e.key==='Tab'){const nodes=[...bench.querySelectorAll('button:not(:disabled),a[href],input,textarea,select,summary,[tabindex="0"]')].filter(el=>el.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}},true);
 new MutationObserver(()=>{deskStatus.textContent=status.textContent;}).observe(status,{childList:true,subtree:true,characterData:true});
 new MutationObserver(()=>{if(!room.classList.contains('active')&&!bench.hidden){bench.hidden=true;shell.inert=false;}}).observe(room,{attributes:true,attributeFilter:['class']});
 progress();
})();
