const $=id=>document.getElementById(id),info=$('info'),settings=$('settings'),area=$('gameArea'),status=$('gameStatus');
const copy={'Cloud Catcher':'Move the net, catch stars, and dodge clouds. Every ten stars earns a token.','Shape Escape':'Match the target by shape and color before time runs out.','Cozy Sort':'Choose a virtual basket, then sort each object into the right place.','Sudoku':'Choose a difficulty and complete a full 1–9 Sudoku.','Mahjong Solitaire':'Match the illustrated tiles in pairs and clear the board.','Word Square':'Trace neighboring letters to find words, Boggle-style.'};
let current='',cleanup=()=>{},profile=JSON.parse(localStorage.getItem('good-vibes-profile')||'{"tokens":0,"stars":0,"scores":{},"rewards":[]}');if(!Array.isArray(profile.rewards))profile.rewards=[];
const save=()=>{localStorage.setItem('good-vibes-profile',JSON.stringify(profile));renderWallet()};
const wallet=document.createElement('div');wallet.className='arcade-wallet';document.querySelector('.top').after(wallet);
const rewardPool=[['🌅','Sunset badge'],['🪶','Phoenix feather'],['🌙','Moon charm'],['🌻','Golden sunflower'],['🦋','Glow butterfly'],['🧭','Trail compass'],['✨','Starlight jar'],['🪴','Tiny terrarium']];
function renderWallet(){const shelf=profile.rewards.length?profile.rewards.map(r=>`<span style="padding:6px 9px;border-radius:999px;background:#ffffff24;border:1px solid #ffffff66;font-weight:800">${r[0]} ${r[1]}</span>`).join(''):'<span style="opacity:.85">Open a chest and your treasures will stay here.</span>';wallet.innerHTML=`<span class="wallet-pill">★ Stars: ${profile.stars}</span><span class="wallet-pill">⬡ Tokens: ${profile.tokens}</span><button class="chest-btn" id="chestBtn">Virtual chest · 5 tokens</button><section style="width:100%;padding:11px 13px;border:1px solid #ffffffbf;border-radius:14px;background:linear-gradient(145deg,#6d3d2dca,#3d2741d4);color:#fff7e7"><strong style="display:block;margin-bottom:7px">My reward shelf</strong><div style="display:flex;gap:8px;flex-wrap:wrap">${shelf}</div></section>`;$('chestBtn').onclick=()=>{if(profile.tokens<5){alert(`You need ${5-profile.tokens} more token${5-profile.tokens===1?'':'s'} to open the chest.`);return}profile.tokens-=5;const unopened=rewardPool.filter(reward=>!profile.rewards.some(owned=>owned[1]===reward[1]));const reward=(unopened.length?unopened:rewardPool)[Math.floor(Math.random()*(unopened.length?unopened:rewardPool).length)];profile.rewards.push(reward);save();alert(`Chest opened! You found ${reward[0]} ${reward[1]}. It is now on your reward shelf.`)}}renderWallet();
const close=()=>{cleanup();info.hidden=true;settings.hidden=true};
const shuffle=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
function leaderboard(){const list=(profile.scores[current]||[]).slice(0,5);const old=area.querySelector('.leaderboard');if(old)old.remove();const box=document.createElement('div');box.className='leaderboard';box.innerHTML='<strong>Local leaderboard</strong>'+(list.length?'<ol>'+list.map(x=>`<li>${x} points</li>`).join('')+'</ol>':'Play once to set the first score.');area.appendChild(box)}
function finish(score,message,tokens=1){profile.scores[current]=[...(profile.scores[current]||[]),Math.max(0,Math.round(score))].sort((a,b)=>b-a).slice(0,5);profile.tokens+=tokens;save();status.textContent=`✓ ${message} Score: ${Math.max(0,Math.round(score))}. +${tokens} token${tokens===1?'':'s'}!`;leaderboard()}
function cloud(){let score=0,caught=0,time=30,netX=50,objects=[],ended=false;area.innerHTML='<div class="cloud-field" id="cloudField"><div class="net" id="net"></div></div>';const field=$('cloudField'),net=$('net');net.style.left=netX+'%';status.textContent='Time: 30 · Score: 0 · Stars: 0';const move=e=>{const r=field.getBoundingClientRect();netX=Math.max(7,Math.min(93,(e.clientX-r.left)/r.width*100));net.style.left=netX+'%'};field.addEventListener('pointermove',move);field.addEventListener('pointerdown',move);function spawn(){const type=Math.random()<.68?'star':'cloud',el=document.createElement('div');el.className='falling '+(type==='cloud'?'cloud-obstacle':'');el.textContent=type==='star'?'✦':'☁';const o={el,type,x:5+Math.random()*88,y:-10,speed:type==='star'?1.2+Math.random():.8+Math.random()*.8};el.style.left=o.x+'%';field.appendChild(el);objects.push(o)}
const motion=setInterval(()=>{objects.forEach(o=>{o.y+=o.speed;o.el.style.top=o.y+'%';if(o.y>73&&o.y<92&&Math.abs(o.x-netX)<10){if(o.type==='star'){score+=10;caught++;profile.stars++;if(profile.stars%10===0)profile.tokens++}else score=Math.max(0,score-15);o.y=110;o.el.remove();save()}else if(o.y>105)o.el.remove()});objects=objects.filter(o=>o.y<=105);status.textContent=`Time: ${time} · Score: ${score} · Stars: ${caught}`},50);const spawner=setInterval(spawn,520);const clock=setInterval(()=>{time--;if(time<=0&&!ended){ended=true;clearInterval(clock);clearInterval(spawner);clearInterval(motion);finish(score,`Net down! You caught ${caught} stars.`,Math.max(1,Math.floor(caught/10))) }},1000);cleanup=()=>{clearInterval(clock);clearInterval(spawner);clearInterval(motion)}}
function shapes(){let score=0,time=30,round=0;const shapes=['●','▲','■','◆','★','⬢'],colors=['#e94235','#1745d1','#159a70','#e78a16'];area.innerHTML='<div class="shape-target" id="shapeTarget"></div><div class="shape-board" id="shapeBoard"></div>';function next(){round++;const shape=shapes[Math.floor(Math.random()*shapes.length)],color=colors[Math.floor(Math.random()*colors.length)];$('shapeTarget').innerHTML=`Match this shape and color:<span class="big-shape" style="color:${color}">${shape}</span>`;let choices=shuffle([{shape,color,ok:true},...Array.from({length:11},()=>({shape:shapes[Math.floor(Math.random()*shapes.length)],color:colors[Math.floor(Math.random()*colors.length)],ok:false}))]);$('shapeBoard').innerHTML=choices.map((x,i)=>`<button class="shape-choice" style="color:${x.color}" data-ok="${x.ok}">${x.shape}</button>`).join('');$('shapeBoard').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(b.dataset.ok==='true'){score+=10;next()}else{score=Math.max(0,score-3);status.textContent=`Time: ${time} · Score: ${score} · Try again`}})}next();const clock=setInterval(()=>{time--;status.textContent=`Time: ${time} · Score: ${score}`;if(time<=0){clearInterval(clock);finish(score,`You solved ${round-1} shape matches.`)}},1000);cleanup=()=>clearInterval(clock)}
function cozy(){
  const cozySets=[
    {name:'Laundry day',groups:{Wardrobe:['👕','🧦','🧢'],Bathroom:['🧼','🪥','🧴'],Bedroom:['🛏️','🧸','🛋️']}},
    {name:'Garden tidy',groups:{Potting:['🪴','🌱','🧤'],'Tool shed':['🪓','🪣','🧹'],Picnic:['🧺','🍎','🧃']}},
    {name:'Craft table',groups:{'Art box':['🎨','🖍️','✂️'],'Paper tray':['📜','✉️','📎'],Display:['🖼️','🏆','🎀']}},
    {name:'Road trip',groups:{'Snack bag':['🥨','🍇','🧃'],'Car kit':['🗺️','🔑','🔦'],Suitcase:['👟','🧥','📚']}},
    {name:'Movie night',groups:{Treats:['🍿','🍫','🥤'],'Blanket pile':['🧣','🧦','🧸'],'Media shelf':['🎬','📀','🎮']}},
    {name:'Beach bag',groups:{'Sand toys':['🏖️','🪣','🐚'],'Swim bag':['🩱','🩴','🕶️'],'Snack cooler':['🍉','🥪','🧃']}}
  ];
  let selected='',done=0,score=0,round=0,lastSet=-1;
  function nextSet(){
    let pick=Math.floor(Math.random()*cozySets.length);
    if(cozySets.length>1)while(pick===lastSet)pick=Math.floor(Math.random()*cozySets.length);
    lastSet=pick;round++;selected='';done=0;score=0;
    const set=cozySets[pick],items=shuffle(Object.entries(set.groups).flatMap(([home,x])=>x.map(icon=>({home,icon}))));
    area.innerHTML=`<p class="hint"><b>${set.name} · Set ${round}</b><br>Pick a basket, then choose an item. Finish a set to unlock a fresh random one.</p><div class="basket-row">${Object.keys(set.groups).map(x=>`<button class="basket" data-bin="${x}">🧺<br>${x}</button>`).join('')}</div><div class="item-shelf">${items.map(x=>`<button class="sort-object" data-home="${x.home}" aria-label="Put ${x.icon} away">${x.icon}</button>`).join('')}</div>`;
    status.textContent=`${set.name} · Sorted: 0 of ${items.length} · Score: 0`;
    area.querySelectorAll('.basket').forEach(b=>b.onclick=()=>{selected=b.dataset.bin;area.querySelectorAll('.basket').forEach(x=>x.classList.toggle('selected',x===b))});
    area.querySelectorAll('.sort-object').forEach(b=>b.onclick=()=>{
      if(!selected){status.textContent='Choose a basket first.';return}
      if(b.dataset.home===selected){
        b.classList.add('sorted');done++;score+=10;status.textContent=`${set.name} · Sorted: ${done} of ${items.length} · Score: ${score}`;
        if(done===items.length){
          finish(score,`${set.name} organized! A fresh set is ready.`,1);
          const next=document.createElement('button');next.className='btn';next.textContent='New random set';next.onclick=nextSet;area.appendChild(next);
        }
      }else{score=Math.max(0,score-2);status.textContent=`Wrong basket. Score: ${score}`}
    });
  }
  nextSet();cleanup=()=>{};
}
function sudoku(){
  area.innerHTML='<div class="difficulty"><button data-d="easy">Easy</button><button data-d="medium">Medium</button><button data-d="hard">Hard</button></div><div id="sudokuHost"><p class="hint">Choose a difficulty.</p></div>';
  let started=0,selected=null,solution=[];
  area.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>start(b.dataset.d));
  function start(diff){
    started=Date.now();
    const blanks={easy:38,medium:48,hard:56}[diff];
    solution=Array.from({length:81},(_,i)=>{const row=Math.floor(i/9),col=i%9;return((row*3+Math.floor(row/3)+col)%9)+1});
    const open=new Set(shuffle([...Array(81).keys()]).slice(0,blanks));
    $('sudokuHost').innerHTML='<div class="sudoku9">'+solution.map((n,i)=>open.has(i)?`<button data-i="${i}" data-v="0"></button>`:`<button class="given" disabled>${n}</button>`).join('')+'</div><div class="number-pad">'+[1,2,3,4,5,6,7,8,9].map(n=>`<button data-n="${n}">${n}</button>`).join('')+'</div>';
    status.textContent=diff[0].toUpperCase()+diff.slice(1)+' Sudoku';
    $('sudokuHost').querySelectorAll('.sudoku9 button:not(.given)').forEach(b=>b.onclick=()=>{selected=b;$('sudokuHost').querySelectorAll('.sudoku9 button').forEach(x=>x.classList.toggle('selected',x===b))});
    $('sudokuHost').querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{
      if(!selected)return;
      const v=+b.dataset.n;
      selected.dataset.v=v;selected.textContent=v;selected.classList.toggle('bad',v!==solution[+selected.dataset.i]);
      const cells=[...$('sudokuHost').querySelectorAll('.sudoku9 button:not(.given)')];
      if(cells.every(x=>+x.dataset.v===solution[+x.dataset.i])){
        const seconds=Math.floor((Date.now()-started)/1000),base={easy:500,medium:750,hard:1000}[diff];
        finish(Math.max(100,base-seconds*2),`${diff} Sudoku solved in ${seconds} seconds.`);
      }
    });
  }
  cleanup=()=>{};
}
function mahjong(){
  area.innerHTML='<div class="difficulty"><button data-m="easy">Easy</button><button data-m="classic">Classic</button><button data-m="challenge">Challenge</button></div><div id="mahjongHost"><p class="hint">Choose a difficulty. Only glowing edge tiles are free.</p></div>';
  let rows=[],first=null,pairs=0,moves=0,time=0,clock=null,totalPairs=0;
  area.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>start(b.dataset.m));
  function start(mode){
    clearInterval(clock);
    totalPairs={easy:8,classic:12,challenge:16}[mode];
    const symbols=['🌸','竹','龍','月','山','鳥','東','南','白','中','水','火','風','雲','梅','松'].slice(0,totalPairs);
    const tiles=shuffle([...symbols,...symbols]);rows=[[],[],[],[]];tiles.forEach((x,i)=>rows[i%4].push({face:x,id:i,matched:false}));
    first=null;pairs=0;moves=0;time=mode==='challenge'?120:0;
    $('mahjongHost').innerHTML='<div class="mahjong-table" id="mahjongTable"></div><div class="game-controls"><button class="btn secondary" id="shuffleTiles">Shuffle remaining</button></div>';
    $('shuffleTiles').onclick=shuffleRemaining;render();
    if(mode==='challenge')clock=setInterval(()=>{time--;updateStatus(mode);if(time<=0){clearInterval(clock);finish(Math.max(0,pairs*50-moves*3),'Time is up. Try the Challenge again.')}},1000);
    updateStatus(mode);
  }
  function freeTiles(){return rows.flatMap(row=>{const left=row.find(x=>!x.matched),right=[...row].reverse().find(x=>!x.matched);return left?[left,...(right&&right!==left?[right]:[])]:[]})}
  function render(){
    const free=new Set(freeTiles().map(x=>x.id));
    $('mahjongTable').innerHTML=rows.map((row,r)=>'<div class="mahjong-row">'+row.map(t=>t.matched?' <span class="mahjong-space"></span>':`<button class="mahjong-tile ${free.has(t.id)?'free':'locked'}" data-id="${t.id}" ${free.has(t.id)?'':'disabled'}>${t.face}</button>`).join('')+'</div>').join('');
    $('mahjongTable').querySelectorAll('.mahjong-tile.free').forEach(b=>b.onclick=()=>pick(+b.dataset.id));
  }
  function pick(id){
    const tile=rows.flat().find(x=>x.id===id);
    if(!first){first=tile;document.querySelector(`[data-id="${id}"]`).classList.add('selected');return}
    if(first.id===tile.id)return;moves++;
    if(first.face===tile.face){first.matched=true;tile.matched=true;pairs++;first=null;render();if(pairs===totalPairs){clearInterval(clock);finish(Math.max(150,totalPairs*70-moves*4+(time||0)*2),'Advanced Mahjong board cleared.')}else if(!hasMove())status.textContent='No exposed match. Use Shuffle remaining.'}
    else{first=null;render();status.textContent='Those exposed tiles do not match.'}
  }
  function hasMove(){const f=freeTiles().map(x=>x.face);return f.some((x,i)=>f.indexOf(x,i+1)>-1)}
  function shuffleRemaining(){const remain=shuffle(rows.flat().filter(x=>!x.matched).map(x=>x.face));let n=0;rows.flat().forEach(x=>{if(!x.matched)x.face=remain[n++]});first=null;moves+=2;render();status.textContent='Remaining tiles shuffled. Two-move penalty.'}
  function updateStatus(mode){status.textContent=`${mode[0].toUpperCase()+mode.slice(1)} · Pairs: ${pairs}/${totalPairs} · Moves: ${moves}${mode==='challenge'?` · Time: ${time}`:''}`}
  cleanup=()=>clearInterval(clock);
}
function words(){
  const letters=['S','T','A','R','U','N','G','L','S','K','Y','O','R','A','Y','W'];
  const valid=new Set(['STAR','SUN','STUN','SUNS','RAG','RAN','TAG','TAN','TAR','RAT','LAG','LOG','LOW','GLOW','SKY','YAK','ARK','ASK','SLAY','GLOWY']);
  let path=[],found=[],score=0,time=90;
  area.innerHTML='<p class="hint">Find as many connected words as you can. Words must have 3 or more letters.</p><div class="word-build" id="wordBuild">&nbsp;</div><div class="boggle-board">'+letters.map((l,i)=>`<button class="boggle-tile" data-i="${i}">${l}</button>`).join('')+'</div><div class="game-controls"><button class="btn" id="submitWord">Submit word</button><button class="btn secondary" id="clearWord">Clear</button></div><div id="foundWords" class="target-words"></div>';
  const update=()=>{status.textContent=`Time: ${time} · Words: ${found.length} · Score: ${score}`;$('foundWords').innerHTML=found.map(w=>`<span class="found">${w}</span>`).join('')};
  const clear=()=>{path=[];$('wordBuild').innerHTML='&nbsp;';area.querySelectorAll('.boggle-tile').forEach(x=>x.classList.remove('selected'))};
  area.querySelectorAll('.boggle-tile').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;if(path.includes(i))return;if(path.length){const p=path.at(-1),ok=Math.abs(Math.floor(p/4)-Math.floor(i/4))<=1&&Math.abs(p%4-i%4)<=1;if(!ok){status.textContent='Choose a neighboring letter.';return}}path.push(i);b.classList.add('selected');$('wordBuild').textContent=path.map(x=>letters[x]).join('')});
  $('clearWord').onclick=clear;
  $('submitWord').onclick=()=>{const word=path.map(x=>letters[x]).join('');if(word.length<3)status.textContent='Words need at least three letters.';else if(valid.has(word)&&!found.includes(word)){found.push(word);score+=word.length*word.length*5;update()}else status.textContent=found.includes(word)?'You already found that word.':'That word is not in this board’s word list.';clear()};
  update();
  const clock=setInterval(()=>{time--;update();if(time<=0){clearInterval(clock);finish(score,`Round complete. You found ${found.length} hidden words.`)}},1000);
  cleanup=()=>clearInterval(clock);
}
const games={'Cloud Catcher':cloud,'Shape Escape':shapes,'Cozy Sort':cozy,'Sudoku':sudoku,'Mahjong Solitaire':mahjong,'Word Square':words};
function launch(name){cleanup();current=name;$('gameTitle').textContent=name;$('gameText').textContent=copy[name];area.innerHTML='';status.textContent='';info.hidden=false;games[name]();leaderboard()}
document.querySelectorAll('[data-close]').forEach(b=>b.onclick=close);document.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>launch(b.dataset.game));$('restartGame').onclick=()=>launch(current);$('settingsBtn').onclick=()=>settings.hidden=false;[info,settings].forEach(o=>o.onclick=e=>{if(e.target===o)close()});document.querySelectorAll('.toggle').forEach(b=>b.onclick=()=>{const next=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',next);b.textContent=next?'ON':'OFF';if(b.id==='calm')document.documentElement.classList.toggle('calm',next)});document.addEventListener('keydown',e=>{if(e.key==='Escape')close()});
