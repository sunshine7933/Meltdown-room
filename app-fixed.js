const frame=document.getElementById('app');
const loading=document.getElementById('loading');
const ROOM_IMAGE_FALLBACKS={
  'meltdown-room.png':'meltdown-room.jpg',
  'thinking-room.png':'thinking-room.jpg',
  'founder-locked-assets/hope-room.png':'founder-locked-assets/hope-room.jpg',
};

function enhanceRoom(){
  if(loading){loading.classList.add('done');loading.hidden=true;}
  const w=frame?frame.contentWindow:window,d=frame?frame.contentDocument:document;
  if(!d||!d.body)return;

  const style=d.createElement('style');
  style.textContent=`
    :root{--mr-water:#5c91a3;--mr-water2:#77afbd;--mr-gold:#d9b478}
    button,a,[role="button"]{touch-action:manipulation;-webkit-tap-highlight-color:transparent}
    button{min-width:44px;min-height:44px}
    .controls button,.nav button,.toolbar button,[class*="control"] button,[class*="nav"] button{min-height:44px!important}
    button[class*="hotspot"]{min-height:44px!important}\n    .home-hotspot,.great-hotspot{box-sizing:border-box!important;min-width:0!important;max-width:none!important;padding-left:0!important;padding-right:0!important}
    .mr-global-nav{position:fixed;left:50%;bottom:max(10px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:99999;display:flex;gap:8px;align-items:center;padding:7px 9px;border:1px solid rgba(216,185,130,.5);border-radius:999px;background:rgba(22,15,10,.88);backdrop-filter:blur(12px);box-shadow:0 8px 30px rgba(0,0,0,.38)}
    .mr-global-nav button{position:relative;overflow:hidden;min-height:44px!important;padding:9px 13px!important;border-radius:999px!important;border:1px solid rgba(203,231,238,.65)!important;color:#fff!important;background:linear-gradient(135deg,rgba(80,139,157,.95),rgba(48,96,111,.95))!important;font:800 13px system-ui!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.32),0 3px 12px rgba(0,0,0,.22)!important}
    .mr-global-nav button::before{content:"";position:absolute;inset:-60% -20%;background:linear-gradient(115deg,transparent 35%,rgba(255,255,255,.28) 50%,transparent 65%);transform:translateX(-70%);animation:mrShimmer 4.6s ease-in-out infinite;pointer-events:none}
    @keyframes mrShimmer{0%,65%{transform:translateX(-70%)}85%,100%{transform:translateX(70%)}}
    .mr-ripple{position:absolute!important;border-radius:50%!important;pointer-events:none!important;background:rgba(255,255,255,.38)!important;transform:scale(0);animation:mrRipple .5s ease-out forwards!important}
    @keyframes mrRipple{to{transform:scale(4);opacity:0}}
    .screen.mr-enter{animation:mrRoomIn .32s ease-out}
    @keyframes mrRoomIn{from{opacity:.35;transform:scale(.995)}to{opacity:1;transform:scale(1)}}
    .mr-memorial-room{box-sizing:border-box;min-height:100vh;overflow:auto;padding:clamp(18px,4vw,46px) clamp(14px,4vw,44px) 110px;color:#f7e3bd;background:radial-gradient(circle at 50% 0,rgba(116,87,52,.34),transparent 42%),linear-gradient(180deg,#24170f,#130d09 72%);font-family:Georgia,serif}
    .mr-memorial-shell{width:min(940px,100%);margin:0 auto}
    .mr-memorial-kicker{text-align:center;text-transform:uppercase;letter-spacing:.19em;color:#d9b478;font:800 12px system-ui;margin:5px 0 8px}
    .mr-memorial-room h1{text-align:center;margin:0;font-size:clamp(34px,7vw,64px);line-height:1;color:#fff0ce;text-shadow:0 3px 18px rgba(0,0,0,.65)}
    .mr-memorial-intro{max-width:700px;margin:14px auto 7px;text-align:center;font-size:clamp(16px,2.4vw,20px);line-height:1.55;color:#ead9ba}
    .mr-memorial-private{max-width:680px;margin:0 auto 22px;text-align:center;color:#b7d6de;font:700 13px/1.5 system-ui}
    .mr-memorial-candles{display:flex;justify-content:center;gap:14px;margin:19px 0 25px;opacity:.95}
    .mr-memorial-candles span{position:relative;width:13px;height:31px;border-radius:3px 3px 2px 2px;background:linear-gradient(#f7dfae,#b78b54);box-shadow:inset 0 0 4px rgba(255,255,255,.4)}
    .mr-memorial-candles span::before{content:"";position:absolute;left:50%;top:-16px;width:10px;height:17px;border-radius:60% 40% 60% 40%;background:radial-gradient(circle at 50% 65%,#fff8bb 0 19%,#efb34e 43%,rgba(222,114,34,.35) 67%,transparent 70%);transform:translateX(-50%) rotate(7deg);filter:drop-shadow(0 0 7px rgba(243,183,74,.78));animation:mrCandle 2.6s ease-in-out infinite alternate}
    .mr-memorial-candles span:nth-child(2n)::before{animation-delay:-1.1s}.mr-memorial-candles span:nth-child(3n)::before{animation-delay:-1.8s}
    @keyframes mrCandle{from{transform:translateX(-50%) rotate(-5deg) scale(.95)}to{transform:translateX(-50%) rotate(6deg) scale(1.06)}}
    .mr-memorial-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:14px;margin:0 auto 23px}
    .mr-memorial-card{width:100%;min-height:145px!important;padding:18px!important;text-align:left;border-radius:16px!important;border:1px solid rgba(217,180,120,.48)!important;color:#f8e6c7!important;background:linear-gradient(145deg,rgba(68,48,31,.96),rgba(36,26,18,.96))!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.08),0 10px 24px rgba(0,0,0,.28)!important}
    .mr-memorial-card strong{display:block;margin-bottom:10px;color:#f3cc8a;font:800 15px system-ui;text-transform:uppercase;letter-spacing:.07em}
    .mr-memorial-card span{display:block;color:#e4d2b4;font:16px/1.45 Georgia,serif}
    .mr-memorial-card .empty{color:#b9cdd1;font-style:italic}
    .mr-memorial-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:12px 0 4px}
    .mr-memorial-actions button,.mr-memorial-editor-actions button{padding:10px 15px!important;border-radius:999px!important;border:1px solid rgba(217,180,120,.55)!important;color:#fff4dc!important;background:#513720!important;font:800 13px system-ui!important}
    .mr-memorial-actions button.primary,.mr-memorial-editor-actions button.primary{background:linear-gradient(135deg,#4d8191,#315c68)!important;border-color:#a9d0da!important}
    .mr-memorial-status{min-height:24px;text-align:center;color:#b9d7dd;font:700 13px/1.4 system-ui;margin-top:12px}
    .mr-memorial-editor{position:fixed;inset:0;z-index:100001;display:none;place-items:center;padding:18px;background:rgba(12,8,6,.78);backdrop-filter:blur(8px)}
    .mr-memorial-editor.open{display:grid}
    .mr-memorial-editor-box{box-sizing:border-box;width:min(680px,100%);max-height:min(80vh,700px);overflow:auto;padding:22px;border:1px solid rgba(217,180,120,.65);border-radius:19px;background:linear-gradient(160deg,#322216,#17100b);box-shadow:0 24px 70px rgba(0,0,0,.58)}
    .mr-memorial-editor h2{margin:0 0 7px;color:#ffe7bd;font:700 clamp(25px,5vw,38px) Georgia,serif}
    .mr-memorial-editor p{color:#d8c8aa;line-height:1.5}
    .mr-memorial-editor textarea{box-sizing:border-box;width:100%;min-height:210px;resize:vertical;padding:14px;border:1px solid #8e6b43;border-radius:12px;color:#2b2119;background:#f3e4c4;font:17px/1.5 Georgia,serif}
    .mr-memorial-editor-actions{display:flex;flex-wrap:wrap;gap:9px;margin-top:13px}
    .mr-memorial-editor-actions .danger{background:#66372f!important}
    @media(max-width:520px){.mr-global-nav{max-width:96vw;gap:5px;padding:5px 6px}.mr-global-nav button{font-size:11px!important;padding:7px 8px!important}.mr-memorial-room{padding-bottom:105px}.mr-memorial-grid{grid-template-columns:1fr 1fr}.mr-memorial-card{min-height:130px!important;padding:13px!important}.mr-memorial-card span{font-size:14px}}
    @media(max-width:390px){.mr-memorial-grid{grid-template-columns:1fr}.mr-global-nav button{font-size:10px!important;padding:6px 7px!important}}
    body.still-mode .mr-global-nav button::before,body.still-mode .mr-memorial-candles span::before{animation:none!important}
    /* Keep the persistent QA navigation from intercepting room-specific bottom controls. */
    body:has([role="dialog"].open) .mr-global-nav{display:none!important}
    /* Match the percentage hotspot layer to the Founder-Locked Meltdown artwork's 1402:1122 aspect ratio. */
    .meltdown-stage{width:min(100%,calc((100vh - 118px) * 1.2495543672))!important}
    .meltdown-stage>.scene{width:100%!important;margin-inline:auto!important}
    /* Dragging the flame should burn the paper, never select its text. */
    .burn-fireplace,.burn-paper{-webkit-user-select:none!important;user-select:none!important}
    #accountButton,#stillModeButton{min-height:44px!important}
    /* The Thinking Room calls this a Water Hourglass: use quiet liquid levels instead of shrinking sand wedges. */
    .hourglass-visual{filter:drop-shadow(0 9px 9px rgba(0,0,0,.42))!important}
    .hourglass-visual::before,.hourglass-visual::after{border-color:#9f7448!important;background:linear-gradient(90deg,rgba(255,255,255,.34),rgba(194,229,234,.09) 28% 72%,rgba(255,255,255,.25))!important;box-shadow:inset 0 0 12px rgba(196,232,237,.24),inset 2px 0 2px rgba(255,255,255,.22)!important}
    .hourglass-top-sand,.hourglass-bottom-sand{overflow:hidden;background:transparent!important;transform:none!important}
    .hourglass-top-sand::before,.hourglass-bottom-sand::before{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(139,196,209,.88),rgba(66,132,151,.94));box-shadow:inset 0 3px 0 rgba(222,247,249,.38);will-change:transform}
    .hourglass-top-sand::after,.hourglass-bottom-sand::after{content:"";position:absolute;left:8%;right:8%;height:3px;border-radius:50%;background:rgba(224,249,250,.45);filter:blur(.2px);will-change:transform}
    .hourglass-top-sand::after{top:2px}.hourglass-bottom-sand::after{bottom:2px}
    .hourglass-stream{left:62px!important;width:2px!important;border-radius:2px!important;background:linear-gradient(90deg,#8ccbd5,#4e9bad)!important;box-shadow:0 0 3px rgba(130,207,219,.45)!important}
    .hourglass-visual.running{animation:hourglassTurn .8s ease, mrWaterGlow 5s .8s ease-in-out infinite!important}
    .hourglass-visual.running .hourglass-top-sand,.hourglass-visual.running .hourglass-bottom-sand{animation:none!important}
    .hourglass-visual.running .hourglass-top-sand::before{animation:mrWaterDrain var(--sand-time) .8s linear forwards}
    .hourglass-visual.running .hourglass-top-sand::after{animation:mrWaterMeniscusDown var(--sand-time) .8s linear forwards}
    .hourglass-visual.running .hourglass-bottom-sand::before{animation:mrWaterFill var(--sand-time) .8s linear forwards}
    .hourglass-visual.running .hourglass-bottom-sand::after{animation:mrWaterMeniscusUp var(--sand-time) .8s linear forwards}
    @keyframes mrWaterDrain{from{transform:translateY(0)}to{transform:translateY(98%)}}
    @keyframes mrWaterFill{from{transform:translateY(92%)}to{transform:translateY(0)}}
    @keyframes mrWaterMeniscusDown{from{transform:translateY(0)}to{transform:translateY(51px)}}
    @keyframes mrWaterMeniscusUp{from{transform:translateY(51px)}to{transform:translateY(0)}}
    @keyframes mrWaterGlow{50%{filter:drop-shadow(0 7px 10px rgba(73,145,163,.34))}}
    body.still-mode .hourglass-visual.running,body.still-mode .hourglass-visual.running *{animation-play-state:paused!important}
    /* Subtle hearth light over the existing Founder-Locked Great Room fireplace. */
    #great .scene-wrap{position:relative}
    .mr-great-twinkle{position:absolute;left:50%;top:50.5%;width:clamp(54px,8.8vw,114px);height:clamp(54px,8.8vw,114px);transform:translate(-50%,-50%);pointer-events:none;z-index:2;mix-blend-mode:screen;filter:blur(.15px)}
    .mr-great-twinkle span{position:absolute;left:50%;bottom:12%;width:34%;height:58%;border-radius:58% 42% 62% 38%;transform-origin:50% 100%;background:radial-gradient(ellipse at 50% 78%,rgba(255,250,176,.9) 0 12%,rgba(255,179,54,.65) 30%,rgba(231,86,22,.24) 54%,transparent 70%);filter:drop-shadow(0 0 8px rgba(255,139,35,.58));animation:mrHearthTwinkle 1.75s ease-in-out infinite alternate}
    .mr-great-twinkle span:nth-child(2){left:31%;bottom:9%;width:27%;height:45%;animation-duration:2.25s;animation-delay:-.9s}
    .mr-great-twinkle span:nth-child(3){left:64%;bottom:10%;width:24%;height:40%;animation-duration:1.95s;animation-delay:-1.35s}
    .mr-great-twinkle::after{content:"";position:absolute;left:13%;right:13%;bottom:4%;height:32%;border-radius:50%;background:radial-gradient(ellipse,rgba(255,118,28,.34),transparent 68%);animation:mrEmberPulse 2.4s ease-in-out infinite}
    @keyframes mrHearthTwinkle{0%{opacity:.38;transform:translateX(-50%) scale(.86,1.02) rotate(-2deg)}55%{opacity:.72;transform:translateX(-50%) scale(1.04,.92) rotate(2deg)}100%{opacity:.48;transform:translateX(-50%) scale(.92,1.08) rotate(-1deg)}}
    @keyframes mrEmberPulse{50%{opacity:.45;transform:scale(1.08)}}
    body.still-mode .mr-great-twinkle span,body.still-mode .mr-great-twinkle::after{animation:none!important;opacity:.42!important}
    @media(prefers-reduced-motion:reduce){.mr-great-twinkle span,.mr-great-twinkle::after{animation:none!important;opacity:.42!important}}
    /* QA mobile clearance: keep room controls above the fixed navigation and phone safe area. */
    .screen.active{box-sizing:border-box;padding-bottom:90px!important}
    .screen.active > .controls{bottom:calc(74px + env(safe-area-inset-bottom))!important}
    /* Respect the device-level reduced-motion preference across every room. */
    @media(prefers-reduced-motion:reduce){
      *,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;transition-duration:.001ms!important;scroll-behavior:auto!important}
      .mr-great-twinkle span,.mr-great-twinkle::after{animation:none!important;opacity:.42!important}
    }
    /* Founder correction: realistic brown granular sand with a warm illuminated glass. */
    .hourglass-visual{filter:drop-shadow(0 0 10px rgba(255,205,119,.72)) drop-shadow(0 9px 9px rgba(0,0,0,.5))!important}
    .hourglass-visual::before,.hourglass-visual::after{border-color:#c7955d!important;background:linear-gradient(90deg,rgba(255,255,255,.42),rgba(255,224,166,.09) 25% 72%,rgba(255,255,255,.32))!important;box-shadow:inset 0 0 18px rgba(255,224,159,.38),0 0 13px rgba(246,184,82,.48)!important}
    .hourglass-top-sand::before,.hourglass-bottom-sand::before{background-color:#9a6334!important;background-image:radial-gradient(circle at 18% 24%,#e1b169 0 1px,transparent 1.4px),radial-gradient(circle at 72% 42%,#6f3f21 0 1px,transparent 1.5px),radial-gradient(circle at 42% 76%,#c88949 0 1.2px,transparent 1.7px),linear-gradient(180deg,#bd8045,#7b4829)!important;background-size:7px 7px,9px 9px,8px 8px,100% 100%!important;box-shadow:inset 0 3px 0 rgba(250,211,147,.42),inset 0 -3px 7px rgba(74,35,18,.35)!important}
    .hourglass-top-sand::after,.hourglass-bottom-sand::after{background:rgba(242,196,122,.62)!important;box-shadow:0 0 5px rgba(255,205,119,.52)!important}
    .hourglass-stream{background:linear-gradient(90deg,#6e3e22,#d79a52,#754326)!important;box-shadow:0 0 5px rgba(238,174,86,.74)!important}
    .hourglass-visual.running{animation:hourglassTurn .8s ease,mrSandGlow 2.8s .8s ease-in-out infinite!important}
    @keyframes mrSandGlow{50%{filter:drop-shadow(0 0 20px rgba(255,196,96,.92)) drop-shadow(0 8px 9px rgba(0,0,0,.45))}}
    .mr-great-stage{position:relative;width:min(100%,calc((100vh - 118px) * 1.5));margin:auto;line-height:0}
    .mr-great-stage>.scene{width:100%!important;max-height:calc(100vh - 118px)!important;margin:auto}
    .mr-great-hotspot{min-width:0!important;position:absolute;z-index:5;bottom:5.8%;height:18.8%;border:0!important;background:transparent!important;opacity:0;min-height:44px!important;padding:0!important}
    .mr-great-hotspot:focus-visible{opacity:.2!important;background:#fff!important;outline:3px solid #ffe2a8!important}
    .mr-home-companion{display:block!important;width:min(92%,420px)!important;margin:14px auto 92px!important;padding:14px 22px!important;border:1px solid rgba(246,215,161,.82)!important;border-radius:999px!important;color:#fff4d8!important;background:linear-gradient(135deg,#9a562d,#5f3624)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),0 7px 22px rgba(0,0,0,.34)!important;font:900 clamp(15px,2.4vw,18px) system-ui!important;letter-spacing:.05em!important}
    .mr-home-companion:hover,.mr-home-companion:focus-visible{filter:brightness(1.14);outline:3px solid rgba(255,226,168,.72)!important;outline-offset:3px}\n    .mr-account-policy-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px;padding-top:13px;border-top:1px solid rgba(217,180,120,.35)}\n    .mr-account-policy-links a{flex:1 1 150px;min-height:44px;display:grid;place-items:center;padding:9px 12px;border:1px solid rgba(119,175,189,.58);border-radius:12px;color:#dff7ff!important;background:rgba(69,118,133,.18);font:800 13px system-ui;text-align:center;text-decoration:none}\n    .mr-game-puzzle-note{margin:12px 0 16px;padding:11px 14px;border:1px solid rgba(217,180,120,.48);border-radius:12px;color:#f6dfb7;background:rgba(80,48,27,.6);font:600 14px/1.45 system-ui}\n  `;
  d.head.appendChild(style);

  // Reserve a row for persistent controls so they never cover the room heading or artwork.
  const responsiveStyle=d.createElement('style');
  responsiveStyle.textContent=`
    body{padding-top:60px}
    .screen{min-height:calc(100vh - 60px)}
    .topbar{top:60px}
    body:has(#meltdown.active){padding-top:0}
    .mr-thinking-actions{display:none}
    @media(max-width:600px){
      #thinking .thinking-hotspot{display:none}
      #thinking .thinking-stage{overflow:visible}
      #thinking .thinking-tool{position:fixed;inset:64px 10px 90px;z-index:150;max-height:calc(100dvh - 154px)}
      #thinking .thinking-tool h2{margin:48px 0 12px}
      .mr-thinking-actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px;padding:14px 10px 22px;line-height:1.4}
      .mr-thinking-actions button{min-height:48px;padding:12px 10px;border:1px solid #a9d0da;border-radius:14px;color:#fff4d8;background:linear-gradient(135deg,#4d8191,#315c68);font:700 16px/1.3 system-ui;overflow-wrap:anywhere}
      .mr-thinking-actions button:focus-visible{outline:3px solid #ffe2a8;outline-offset:3px}
    }
  `;
  d.head.appendChild(responsiveStyle);
  const thinkingRoom=d.getElementById('thinking');
  if(thinkingRoom&&thinkingRoom.querySelector('.scene-wrap')&&!thinkingRoom.querySelector('.mr-thinking-actions')){
    const actions=d.createElement('nav');
    actions.className='mr-thinking-actions';
    actions.setAttribute('aria-label','Thinking Room activities');
    thinkingRoom.querySelectorAll('.thinking-hotspot').forEach(hotspot=>{
      const button=d.createElement('button');
      button.type='button';
      button.textContent=hotspot.getAttribute('aria-label');
      button.addEventListener('click',()=>{
        hotspot.click();
        const close=thinkingRoom.querySelector('.thinking-tool.open .thinking-close');
        if(close)close.focus();
      });
      actions.appendChild(button);
    });
    thinkingRoom.querySelector('.scene-wrap').after(actions);
  }

  const greatSceneWrap=d.querySelector('#great .scene-wrap');
  if(greatSceneWrap&&!greatSceneWrap.querySelector('.mr-great-twinkle')){
    const twinkle=d.createElement('div');
    twinkle.className='mr-great-twinkle';
    twinkle.setAttribute('aria-hidden','true');
    twinkle.innerHTML='<span></span><span></span><span></span>';
    greatSceneWrap.appendChild(twinkle);
  }

  /* Match Home's nine pictured tiles exactly, including the dedicated Memorial Room and Explore/Map. */
  const homeTiles=[['Enter the property','entrance'],['Open the Great Room','great'],['Open the Rant Room','rant'],['Open the Meltdown Room','meltdown'],['Open the Thinking Room','thinking'],['Open the Calm Room','calm'],['Open the Hope Room','hope'],['Open the Celebration Room','celebration'],['Open Property Map','map']];
  const homeStage=d.querySelector('.home-stage');
  if(homeStage){
    const old=[...homeStage.querySelectorAll('.home-hotspot')];
    old.forEach((button,index)=>{
      const tile=homeTiles[index];
      if(!tile)return button.remove();
      button.style.left=(index*100/homeTiles.length)+'%';
      button.style.width=(100/homeTiles.length)+'%';
      button.setAttribute('aria-label',tile[0]);
      button.removeAttribute('onclick');
      button.addEventListener('click',()=>tile[1]==='memorial'?openMemorialRoom():navigateToId(tile[1]));
    });
    for(let index=old.length;index<homeTiles.length;index++){
      const tile=homeTiles[index],button=d.createElement('button');
      button.className='home-hotspot';button.type='button';button.style.left=(index*100/homeTiles.length)+'%';
      button.style.top='82%';button.style.width=(100/homeTiles.length)+'%';button.style.height='14%';
      button.setAttribute('aria-label',tile[0]);
      button.addEventListener('click',()=>tile[1]==='memorial'?openMemorialRoom():navigateToId(tile[1]));
      homeStage.appendChild(button);
    }
  }

  /* Give the existing Companion Experience a clear, direct entrance from Home. */
  const homeScreen=d.getElementById('home');
  if(homeScreen&&!homeScreen.querySelector('.mr-home-companion')){
    const companionButton=d.createElement('button');
    companionButton.type='button';
    companionButton.className='mr-home-companion';
    companionButton.setAttribute('aria-label','Open Companion Experience');
    companionButton.textContent='COMPANION';
    companionButton.addEventListener('click',()=>navigateToId('companion'));
    const homeEntry=[...homeScreen.children].find(el=>el.tagName==='BUTTON'&&!el.classList.contains('home-hotspot'));
    if(homeEntry&&homeEntry.nextSibling)homeScreen.insertBefore(companionButton,homeEntry.nextSibling);
    else homeScreen.appendChild(companionButton);
  }

  /* Touch-friendly puzzle engine. Large advertised challenges use progressive, playable boards. */
  const puzzleLevels={25:[5,5],50:[6,6],100:[7,7],500:[8,8]};
  const gameScreen=d.getElementById('game');
  let touchPuzzle=null;
  function shuffleTouchPuzzle(){
    const p=touchPuzzle;
    for(let n=0;n<p.count*12;n++){
      const blank=p.tiles.indexOf(-1),r=Math.floor(blank/p.cols),c=blank%p.cols,moves=[];
      if(r>0)moves.push(blank-p.cols);if(r<p.rows-1)moves.push(blank+p.cols);
      if(c>0)moves.push(blank-1);if(c<p.cols-1)moves.push(blank+1);
      const pick=moves[Math.floor(Math.random()*moves.length)];
      p.tiles[blank]=p.tiles[pick];p.tiles[pick]=-1;
    }
  }
  function renderTouchPuzzle(message){
    const p=touchPuzzle,box=d.getElementById('gameWorkspace');if(!p||!box)return;
    box.innerHTML='';
    const heading=d.createElement('h3');heading.textContent=p.advertised+'-Piece Puzzle Challenge';box.appendChild(heading);
    const help=d.createElement('p');help.textContent='Slide a piece beside the empty space. This '+p.count+'-tile board keeps the challenge usable on phones and tablets.';box.appendChild(help);
    const board=d.createElement('div');board.className='puzzle-board';board.style.gridTemplateColumns='repeat('+p.cols+',1fr)';board.style.gridTemplateRows='repeat('+p.rows+',1fr)';
    p.tiles.forEach((tile,index)=>{
      const button=d.createElement('button');button.type='button';
      if(tile<0){button.className='puzzle-tile blank';button.setAttribute('aria-label','Empty puzzle space');}
      else{
        button.className='puzzle-tile';button.setAttribute('aria-label','Puzzle piece '+(tile+1));
        const row=Math.floor(tile/p.cols),col=tile%p.cols;
        button.style.setProperty('background-size',(p.cols*100)+'% '+(p.rows*100)+'%','important');
        button.style.setProperty('background-position',(col/(p.cols-1)*100)+'% '+(row/(p.rows-1)*100)+'%','important');
        button.addEventListener('click',()=>moveTouchPuzzle(index));
      }
      board.appendChild(button);
    });
    box.appendChild(board);
    const shuffle=d.createElement('button');shuffle.type='button';shuffle.textContent='SHUFFLE AGAIN';
    shuffle.addEventListener('click',()=>{shuffleTouchPuzzle();renderTouchPuzzle('Puzzle shuffled again.')});box.appendChild(shuffle);
    const status=d.getElementById('gameWorkspaceStatus');
    if(status)status.textContent=message||p.advertised+'-piece challenge ready as a '+p.count+'-tile touch-friendly board.';
  }
  function moveTouchPuzzle(index){
    const p=touchPuzzle,blank=p.tiles.indexOf(-1),r=Math.floor(index/p.cols),c=index%p.cols,br=Math.floor(blank/p.cols),bc=blank%p.cols;
    if(Math.abs(r-br)+Math.abs(c-bc)!==1){const status=d.getElementById('gameWorkspaceStatus');if(status)status.textContent='Choose a piece beside the empty space.';return}
    p.tiles[blank]=p.tiles[index];p.tiles[index]=-1;
    const solved=p.tiles.every((tile,i)=>i===p.count-1?tile===-1:tile===i);
    renderTouchPuzzle(solved?'Puzzle complete — you did it!':'Piece moved.');
  }
  function startTouchPuzzle(advertised){
    const dims=puzzleLevels[advertised]||puzzleLevels[25],count=dims[0]*dims[1];
    touchPuzzle={advertised,rows:dims[0],cols:dims[1],count,tiles:Array.from({length:count},(_,i)=>i)};
    touchPuzzle.tiles[count-1]=-1;shuffleTouchPuzzle();renderTouchPuzzle();
  }
  if(gameScreen){
    const chooseHeading=[...gameScreen.querySelectorAll('h2,h3')].find(el=>/choose your fun/i.test(el.textContent||''));
    if(chooseHeading&&!gameScreen.querySelector('.mr-game-puzzle-note')){
      const note=d.createElement('p');note.className='mr-game-puzzle-note';
      note.textContent='Puzzle challenge sizes are optimized for phones and tablets so every piece stays large enough to move.';
      chooseHeading.parentNode.insertBefore(note,chooseHeading.nextSibling);
    }
    [...gameScreen.querySelectorAll('button[onclick*="openGameTool"][onclick*="puzzle"]')].forEach(button=>{
      const call=button.getAttribute('onclick')||'',match=call.match(/puzzle['"],\s*(\d+)/);if(!match)return;
      const advertised=Number(match[1]),dims=puzzleLevels[advertised]||puzzleLevels[25],count=dims[0]*dims[1];
      button.removeAttribute('onclick');
      button.setAttribute('aria-label','Start '+advertised+'-piece puzzle challenge, optimized as a '+count+'-tile touch board');
      button.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();startTouchPuzzle(advertised)},true);
    });
  }

    /* Wire the eight room tiles painted into the Founder-Locked Great Room scene. */
  if(greatSceneWrap&&!greatSceneWrap.querySelector('.mr-great-stage')){
    const img=greatSceneWrap.querySelector('img.scene');
    if(img){
      const stage=d.createElement('div');stage.className='mr-great-stage';
      greatSceneWrap.insertBefore(stage,img);stage.appendChild(img);
      const routes=[['Rant Room','rant'],['Meltdown Room','meltdown'],['Thinking Room','thinking'],['Calm Room','calm'],['Hope Room','hope'],['Celebration Room','celebration'],['Family & Fun','game'],['Property Map','map']];
      routes.forEach((route,index)=>{
        const button=d.createElement('button');button.type='button';button.className='mr-great-hotspot';
        button.style.left=(index*100/routes.length)+'%';button.style.width=(100/routes.length)+'%';
        button.setAttribute('aria-label','Open '+route[0]);
        button.addEventListener('click',()=>navigateToId(route[1]));
        stage.appendChild(button);
      });
    }
  }

  function screens(){return [...d.querySelectorAll('.screen')];}
  function activeScreen(){return d.querySelector('.screen.active')||screens().find(x=>getComputedStyle(x).display!=='none');}
  function activate(el){
    if(!el)return false;
    const ss=screens();
    if(ss.length){ss.forEach(s=>s.classList.remove('active'));el.classList.add('active','mr-enter');setTimeout(()=>el.classList.remove('mr-enter'),380);w.scrollTo(0,0);return true}
    el.scrollIntoView({behavior:d.body.classList.contains('still-mode')?'auto':'smooth',block:'start'});return true;
  }
  function navigateTo(el){
    if(el&&el.id==='home'&&d.getElementById('retreat'))el=d.getElementById('retreat');
    if(!el)return false;
    if(el.id&&typeof w.showScreen==='function'){
      try{
        w.showScreen(el.id);
        if(el.classList.contains('active')){try{w.scrollTo(0,0)}catch(_e){};return true}
      }catch(_e){}
    }
    return activate(el);
  }
  function navigateToId(id){
    const el=d.getElementById(id);
    return navigateTo(el);
  }
  function buttonByText(re){return [...d.querySelectorAll('button,a,[role="button"]')].find(x=>re.test((x.textContent||x.getAttribute('aria-label')||'').trim()));}
  function findGreatRoom(){
    return d.querySelector('.screen[id*="great" i],.screen[data-room*="great" i],.screen[data-name*="great" i]') ||
      screens().find(s=>/great\s*room/i.test(s.textContent||'')) ||
      screens().find(s=>[...s.querySelectorAll('img')].some(i=>/great-room/i.test(i.getAttribute('src')||'')));
  }
  function goGreatRoom(){
    const target=findGreatRoom();
    if(navigateTo(target))return;
    const b=buttonByText(/^(great room|return to great room|back to great room|hub)$/i);if(b)b.click();
  }
  function goHome(){
    if(navigateToId('home'))return;
    const b=buttonByText(/^(home|property|entrance|welcome|main)$/i);if(b){b.click();return}
    const ss=screens();if(ss[0])navigateTo(ss[0]);else location.href='index.html';
  }

  function escapeHTML(value){return String(value||'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
  const history=[];let lastActive=activeScreen(),suppressNextHistory=false;
  const observer=new MutationObserver(()=>{
    const a=activeScreen();
    if(a&&a!==lastActive){
      if(lastActive&&!suppressNextHistory)history.push(lastActive);
      suppressNextHistory=false;
      lastActive=a;
      a.classList.add('mr-enter');setTimeout(()=>a.classList.remove('mr-enter'),380);
    }
  });
  observer.observe(d.body,{subtree:true,attributes:true,attributeFilter:['class','style']});

  const nav=d.createElement('div');nav.className='mr-global-nav';nav.setAttribute('aria-label','Room navigation');
  nav.innerHTML='<button type="button" data-act="back" aria-label="Go back">← Back</button><button type="button" data-act="hub" aria-label="Return to Great Room">Great Room</button><button type="button" data-act="home" aria-label="Return home">Home</button>';
  d.body.appendChild(nav);
  nav.addEventListener('click',e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.act==='hub')goGreatRoom();
    if(b.dataset.act==='home')goHome();
    if(b.dataset.act==='back'){
      const prev=history.pop();
      if(prev){suppressNextHistory=true;navigateTo(prev)}else goGreatRoom();
    }
  });

  d.addEventListener('pointerdown',e=>{
    const b=e.target.closest('button,.mr-global-nav button');if(!b)return;
    const r=b.getBoundingClientRect(),dot=d.createElement('span');dot.className='mr-ripple';
    const size=Math.max(r.width,r.height);dot.style.width=dot.style.height=size+'px';dot.style.left=(e.clientX-r.left-size/2)+'px';dot.style.top=(e.clientY-r.top-size/2)+'px';
    if(getComputedStyle(b).position==='static')b.style.position='relative';b.style.overflow='hidden';b.appendChild(dot);setTimeout(()=>dot.remove(),550);
  },{passive:true});

  function repairImage(img){
    const raw=(img.getAttribute('src')||'').replace(/^\.\//,'');
    const replacement=ROOM_IMAGE_FALLBACKS[raw];
    if(replacement&&img.dataset.mrFallback!=='1'){img.dataset.mrFallback='1';img.src=replacement}
  }
  d.querySelectorAll('img').forEach(img=>img.addEventListener('error',()=>repairImage(img),{once:false}));

  // The Property Map must use the recovered Founder-Locked map, not the Home hero image.
  const propertyMap=d.querySelector('#map .map-stage img.scene');
  if(propertyMap&&/(^|\/)home\.png(?:\?|$)/i.test(propertyMap.getAttribute('src')||'')){
    propertyMap.src='founder-locked-assets/living-property-map.png?v=qa-20260901';
    propertyMap.alt='The Founder-Locked Living Property map';
  }

  // Make small controls consistently tappable without changing Founder-Locked artwork.
  d.querySelectorAll('button,[role="button"]').forEach(el=>{
    const existing=(el.getAttribute('aria-label')||'').trim();
    const visibleText=(el.textContent||'').replace(/\s+/g,' ').trim();
    if(!existing&&!visibleText)el.setAttribute('aria-label',el.title||'Control');
  });

  // Make the Celebration Room's smallest affirmation hotspot visibly respond.
  const youMatterButton=Array.from(d.querySelectorAll('#celebration button')).find(b=>/YOU MATTER ALWAYS/i.test((b.textContent||b.getAttribute('aria-label')||'').trim()));
  if(youMatterButton&&!youMatterButton.dataset.mrFixed){
    youMatterButton.dataset.mrFixed='true';
    youMatterButton.addEventListener('click',()=>{
      w.requestAnimationFrame(()=>{
        const celebration=d.getElementById('celebration');
        if(!celebration)return;
        let note=celebration.querySelector('#mrYouMatterNote');
        if(!note){note=d.createElement('p');note.id='mrYouMatterNote';note.setAttribute('role','status');note.style.cssText='margin:14px auto 96px;width:min(680px,90%);padding:14px 18px;text-align:center;border:1px solid rgba(217,180,120,.5);border-radius:16px;background:rgba(38,23,14,.82);color:#fff1cf;font:700 16px/1.45 Georgia,serif';celebration.appendChild(note);}
        note.textContent='You matter—on the hard days, the quiet days, and every day in between.';
        note.scrollIntoView({behavior:d.body.classList.contains('still-mode')?'auto':'smooth',block:'nearest'});
      });
    });
  }


  // Repair two Learning Cabin utility buttons that were present but inert.
  const learningScreen=d.getElementById('learn');
  if(learningScreen){
    const learningButtons=Array.from(learningScreen.querySelectorAll('button'));
    const exactLearningButton=label=>learningButtons.find(b=>(b.textContent||'').trim().toUpperCase()===label);
    const continueLearning=exactLearningButton('CONTINUE MY LEARNING');
    if(continueLearning&&!continueLearning.dataset.mrFixed){
      continueLearning.dataset.mrFixed='true';
      continueLearning.addEventListener('click',()=>{
        const featured=exactLearningButton('FEATURED RESOURCE')||exactLearningButton('AUTISM AND NEURODIVERSITY');
        if(featured)featured.click();
        w.requestAnimationFrame(()=>{const status=learningScreen.querySelector('[role="status"]');if(status)status.textContent='Your next trusted learning shelf is open.'});
      });
    }
    const originalLearningPath=exactLearningButton('MY LEARNING PATH');
    if(originalLearningPath&&!originalLearningPath.dataset.mrFixed){
      const learningPath=originalLearningPath.cloneNode(true);
      learningPath.dataset.mrFixed='true';
      originalLearningPath.replaceWith(learningPath);
      learningPath.addEventListener('click',event=>{
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        const workspace=learningScreen.querySelector('#learnWorkspace,.learn-workspace,[class*="learnWorkspace"]');
        if(!workspace)return;
        workspace.classList.add('open');
        workspace.innerHTML='<h3>My Learning Path</h3><p>Choose one small next step. You can return to any shelf whenever you are ready.</p><ol style="text-align:left;max-width:620px;margin:12px auto;line-height:1.65"><li>Understand needs and strengths.</li><li>Try one practical support tool.</li><li>Save questions for an expert.</li><li>Notice and celebrate progress.</li></ol><button type="button" id="mrLearningPathStart">OPEN FEATURED RESOURCE</button><button type="button" id="mrLearningPathClose">CLOSE</button>';
        workspace.querySelector('#mrLearningPathStart').addEventListener('click',()=>{const featured=exactLearningButton('FEATURED RESOURCE');if(featured)featured.click()});
        workspace.querySelector('#mrLearningPathClose').addEventListener('click',()=>{workspace.classList.remove('open');workspace.innerHTML=''});
        const status=learningScreen.querySelector('[role="status"]');if(status)status.textContent='Your learning path is ready.';
      });
    }
  }

  // The Learning Cabin controls are created after frame load; attach the QA repair when they exist.
  function ensureLearningPathButton(){
    const screen=d.getElementById('learn');
    if(!screen)return false;
    const original=Array.from(screen.querySelectorAll('button')).find(b=>(b.getAttribute('aria-label')||b.textContent||'').trim().toUpperCase()==='MY LEARNING PATH');
    if(!original)return false;
    if(original.dataset.mrLateFixed)return true;
    const button=original.cloneNode(true);
    button.dataset.mrLateFixed='true';
    original.replaceWith(button);
    button.addEventListener('click',event=>{
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      const workspace=screen.querySelector('#learnWorkspace,.learn-workspace,[class*="learnWorkspace"]');
      if(!workspace)return;
        workspace.classList.add('open');
      workspace.innerHTML='<h3>My Learning Path</h3><p>Choose one small next step. You can return to any shelf whenever you are ready.</p><ol style="text-align:left;max-width:620px;margin:12px auto;line-height:1.65"><li>Understand needs and strengths.</li><li>Try one practical support tool.</li><li>Save questions for an expert.</li><li>Notice and celebrate progress.</li></ol><button type="button" id="mrLearningPathStart">OPEN FEATURED RESOURCE</button><button type="button" id="mrLearningPathClose">CLOSE</button>';
      workspace.querySelector('#mrLearningPathStart').addEventListener('click',()=>{const featured=Array.from(screen.querySelectorAll('button')).find(b=>(b.getAttribute('aria-label')||b.textContent||'').trim().toUpperCase()==='FEATURED RESOURCE');if(featured)featured.click()});
      workspace.querySelector('#mrLearningPathClose').addEventListener('click',()=>{workspace.classList.remove('open');workspace.innerHTML=''});
      const status=screen.querySelector('[role="status"]');if(status)status.textContent='Your learning path is ready.';
    },true);
    return true;
  }
  ensureLearningPathButton();
  let learningPathTries=0;
  const learningPathTimer=w.setInterval(()=>{learningPathTries++;if(ensureLearningPathButton()||learningPathTries>=20)w.clearInterval(learningPathTimer)},250);

  // Permanent delegated repair survives Learning Cabin redraws.
  d.addEventListener('click',event=>{
    const button=event.target.closest&&event.target.closest('#learn button');
    if(!button||(button.getAttribute('aria-label')||button.textContent||'').trim().toUpperCase()!=='MY LEARNING PATH')return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    const screen=d.getElementById('learn');
    const workspace=screen&&screen.querySelector('#learnWorkspace,.learn-workspace,[class*="learnWorkspace"]');
    if(!workspace)return;
        workspace.classList.add('open');
    workspace.innerHTML='<h3>My Learning Path</h3><p>Choose one small next step. You can return to any shelf whenever you are ready.</p><ol style="text-align:left;max-width:620px;margin:12px auto;line-height:1.65"><li>Understand needs and strengths.</li><li>Try one practical support tool.</li><li>Save questions for an expert.</li><li>Notice and celebrate progress.</li></ol><button type="button" id="mrLearningPathStart">OPEN FEATURED RESOURCE</button><button type="button" id="mrLearningPathClose">CLOSE</button>';
    workspace.querySelector('#mrLearningPathStart').addEventListener('click',()=>{const featured=Array.from(screen.querySelectorAll('button')).find(b=>(b.getAttribute('aria-label')||b.textContent||'').trim().toUpperCase()==='FEATURED RESOURCE');if(featured)featured.click()});
    workspace.querySelector('#mrLearningPathClose').addEventListener('click',()=>{workspace.classList.remove('open');workspace.innerHTML=''});
    const status=screen.querySelector('[role="status"]');if(status)status.textContent='Your learning path is ready.';
  },true);

  // Route the cabin's shared inline continueLearning() call by the button that invoked it.
  const originalContinueLearning=typeof w.continueLearning==='function'?w.continueLearning.bind(w):null;
  w.continueLearning=function(){
    if(d.querySelector('#learn.learning-modern')&&originalContinueLearning)return originalContinueLearning();
    const active=d.activeElement;
    {
      const screen=d.getElementById('learn');
      const workspace=screen&&screen.querySelector('#learnWorkspace,.learn-workspace,[class*="learnWorkspace"]');
      if(workspace){
        workspace.innerHTML='<h3>My Learning Path</h3><p>Choose one small next step. You can return to any shelf whenever you are ready.</p><ol style="text-align:left;max-width:620px;margin:12px auto;line-height:1.65"><li>Understand needs and strengths.</li><li>Try one practical support tool.</li><li>Save questions for an expert.</li><li>Notice and celebrate progress.</li></ol><button type="button" id="mrLearningPathStart">OPEN FEATURED RESOURCE</button><button type="button" id="mrLearningPathClose">CLOSE</button>';
        workspace.querySelector('#mrLearningPathStart').addEventListener('click',()=>{const featured=Array.from(screen.querySelectorAll('button')).find(b=>(b.getAttribute('aria-label')||b.textContent||'').trim().toUpperCase()==='FEATURED RESOURCE');if(featured)featured.click()});
        workspace.querySelector('#mrLearningPathClose').addEventListener('click',()=>{workspace.classList.remove('open');workspace.innerHTML=''});
        const status=screen.querySelector('[role="status"]');if(status)status.textContent='Your learning path is ready.';
        return;
      }
    }
    if(originalContinueLearning)return originalContinueLearning();
  };

  // Remove the cabin's stale inline action before a Learning Path click is dispatched.
  d.addEventListener('pointerdown',event=>{
    const button=event.target.closest&&event.target.closest('#learn button');
    if(button&&(button.getAttribute('aria-label')||button.textContent||'').trim().toUpperCase()==='MY LEARNING PATH')button.removeAttribute('onclick');
  },true);

  // Escape closes the Memorial editor first; otherwise it uses app-aware Great Room navigation.
  d.addEventListener('keydown',e=>{
    if(e.key!=='Escape')return;
    goGreatRoom();
  });
}
if(frame){frame.addEventListener('load',enhanceRoom);}else if(document.readyState==='complete'){enhanceRoom();}else{window.addEventListener('load',enhanceRoom,{once:true});}
