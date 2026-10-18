/* Scene details follow the artwork. Only the visible room animates. */
(() => {
  'use strict';
  const configs = {
    retreat: { art: 'luminous-sanctuary.webp', clouds: [78,29,17,13], water: [50,75,46,25], cascade: [17,29,8,21] },
    great: { art: 'great-room-2026.webp', water: [42,87,42,16], waterClip:'polygon(20% 78%,28% 80%,39% 84%,53% 90%,65% 96%,70% 99%,44% 99%,34% 93%,26% 89%,18% 83%)', wheel:[38.8,37.5,1.1,2.7], fire: [83,45,8,6] },
    rant: { art: 'rant-room-2026.webp', clouds: [32,22,13,15], water: [29,94,33,10], fire: [5,44,5,5], rain: 'polygon(21% 2%,55% 3%,54% 50%,21% 53%)' },
    meltdown: { art: 'meltdown-room-2026.webp', clouds: [72,36,25,10], water: [50,90,47,14] },
    thinking: { native: true, art:'thinking-room-2026.webp', water:[53,89,36,14], paused:'tm-room-paused', optin:'tm-user-motion' },
    calm: { native:true, art:'calm-room-2026.webp', water:[71,80,35,25], paused:'cm-paused', optin:'cm-motion-optin' },
    hope: { native:true, art:'hope-room-2026.webp', water:[40,84,32,12], paused:'hm-paused', optin:'hm-motion-optin' },
    celebration: { native:true, art:'celebration-room-2026.webp', water:[60,89,40,12], paused:'cb-paused', optin:'cb-motion-optin' },
    map: { native:true, art:'property-lake-2026.webp', water:[65,76,30,20], paused:'rd-paused', optin:'rd-motion-optin' },
    entrance: { image:'.scene', water:[7,51,8,17], clouds:[86,14,10,8], glow:[35,29,3,5] },
    learn: { art:'learning-room-2026.webp', clouds:[43,31,12,9], water:[27,84,22,10], waterMasks:[[27,84,22,10],[42,58,13,5]], waterClips:['polygon(12% 74%,35% 74%,48% 78%,52% 84%,46% 91%,30% 97%,9% 97%,1% 91%,2% 84%)','polygon(28% 54%,56% 54%,55% 60%,36% 63%,29% 59%)'], glow:[93,13,2,4] },
    resources: { art:'resource-room-2026.webp', clouds:[70,18,10,9], water:[45,84,20,13], waterMasks:[[45,84,20,13],[74,47,12,4]], waterClips:['polygon(17% 96%,29% 85%,48% 73%,65% 66%,67% 72%,61% 83%,49% 98%)','polygon(64% 43%,85% 43%,85% 48%,73% 51%,64% 47%)'] },
    outdoor: { art:'outdoor-lake-2026.webp', surface:'#outdoorStage', clouds:[37,21,24,18], water:[75,70,26,22], waterClip:'polygon(37% 48%,96% 47%,96% 91%,82% 89%,56% 72%,40% 63%)', breeze:[73,20,16,17], paused:'od-paused' },
    explore: { art:'explore-riverside-2026.webp', surface:'#exScene', clouds:[50,16,24,15], water:[70,76,27,17], waterClip:'polygon(44% 58%,97% 58%,99% 97%,75% 97%,60% 83%,48% 69%)', breeze:[26,16,12,12] },
    game: { art:'family-lounge-2026.webp', surface:'#fmScenery', clouds:[58,17,14,10], water:[68,42,10,4], waterClip:'polygon(57% 37%,78% 37%,78% 47%,59% 47%)', breeze:[89,16,6,12] },
    companion: { art:'companion-garden-2026.webp', clouds:[74,19,14,11], water:[85,82,13,10], breeze:[53,26,6.5,12], waterClip:'polygon(75% 75%,95% 74%,99% 84%,95% 94%,83% 96%,77% 88%)' },
    axe: { art:'outdoor-lake-2026.webp', surface:'#arScene', clouds:[37,21,24,18], water:[75,70,26,22], waterClip:'polygon(37% 48%,96% 47%,96% 91%,82% 89%,56% 72%,40% 63%)', breeze:[73,20,16,17] }
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const states = new Map();
  let active, audioContext, audioSource, audioGain;
  const scriptURL = document.currentScript.src;
  const mask = ([x,y,rx,ry]) => `radial-gradient(ellipse ${rx}% ${ry}% at ${x}% ${y}%,#000 20%,#000b 65%,transparent 100%)`;
  function element(cls, parent) { const el=document.createElement('div');el.className=cls;parent.append(el);return el; }
  function mount(id) {
    const room=document.getElementById(id),config=configs[id];
    if (!room||!config) return;
    const state={room,config,userPaused:false,optin:false,sound:false}; states.set(id,state);
    const image=config.image&&(room.querySelector(config.image)||room.querySelector('img'));
    const ambient=config.ambient&&room.querySelector(config.ambient);
    if (ambient) { ambient.classList.add('ls-ambient-object');state.ambient=ambient; }
    const surface=(config.surface&&room.querySelector(config.surface))||room.querySelector('.hm-motion,.cb-motion,.cm-motion')||room;
    const host=element('ls-scene-layer',surface);host.setAttribute('aria-hidden','true');
    if(config.native)host.style.zIndex='0';
    if(image)host.classList.add('ls-image-layer');
    const art=element('ls-art',host);state.host=host;state.art=art;state.image=image;
    const src=config.art?new URL(config.art,scriptURL).href:image?.currentSrc||image?.src;
    if(src){
      const preload=new Image();preload.onload=()=>{state.natural=[preload.naturalWidth,preload.naturalHeight];layout(state);};preload.src=src;
      if(!config.native) for(const type of ['clouds','water','cascade','breeze']) if(config[type]) {
        const clips=type==='water'?(config.waterClips||[config.waterClip]):[null];
        clips.forEach((shape,index)=>{
          const clip=element('ls-detail-clip',art);
          if(shape){clip.style.clipPath=shape;clip.dataset.sceneRegion=shape;}
          clip.style.maskImage=mask(type==='water'&&config.waterMasks?config.waterMasks[index]:config[type]);
          const layer=element('ls-texture ls-'+type,clip);layer.style.backgroundImage=`url("${src}")`;
        });
      }
      if(config.wheel){
        const [x,y,rx,ry]=config.wheel,wheel=element('ls-wheel',art);
        Object.assign(wheel.style,{left:(x-rx)+'%',top:(y-ry)+'%',width:rx*2+'%',height:ry*2+'%'});
        const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 100 100');svg.setAttribute('preserveAspectRatio','none');
        svg.innerHTML='<circle cx="50" cy="50" r="47" fill="#211d13" stroke="#6e5939" stroke-width="6"/><circle cx="50" cy="50" r="39" fill="none" stroke="#8b7650" stroke-width="2"/>'+Array.from({length:12},(_,i)=>'<path d="M50 50V7" transform="rotate('+i*30+' 50 50)" stroke="#806a45" stroke-width="4"/>').join('')+'<circle cx="50" cy="50" r="7" fill="#9e865b" stroke="#4f381e" stroke-width="3"/>';
        wheel.append(svg);
      }
      if(config.fire){
        const [x,y,rx,ry]=config.fire;const fire=element('ls-fire',art);
        Object.assign(fire.style,{left:(x-rx)+'%',top:(y-ry)+'%',width:rx*2+'%',height:ry*2+'%'});
        for(let i=0;i<5;i++){const flame=element('ls-flame',fire);flame.style.setProperty('--i',i);}
      }
      if(config.rain){
        const rain=element('ls-rain',art);rain.style.clipPath=config.rain;
        for(let i=0;i<18;i++){const drop=element('ls-raindrop',rain);drop.style.left=(22+(i*7.13)%31)+'%';drop.style.top=(3+(i*11.2)%39)+'%';drop.style.setProperty('--delay',(-i*.63)+'s');drop.style.setProperty('--duration',(6+i%5)+'s');}
      }
      if(config.glow){const glow=element('ls-lantern',art);glow.style.maskImage=mask(config.glow);}
      if(config.water){const ripple=element('ls-touch-ripple',art);ripple.style.left=config.water[0]+'%';ripple.style.top=config.water[1]+'%';state.ripple=ripple;}
    }
    const controls=document.createElement('details');controls.className='ls-scene-controls';
    const summary=document.createElement('summary');summary.textContent='Scene effects';controls.append(summary);
    const menu=element('ls-scene-menu',controls);
    function button(label,fn){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',fn);menu.append(b);return b;}
    state.toggle=button('Pause scene',()=>{
      const stopped=!running(state);
      if(stopped&&document.body.classList.contains('still-mode')){state.message.textContent='Turn off Still mode to enable motion.';return;}
      state.userPaused=!stopped;state.optin=stopped;
      if(config.paused){room.classList.toggle(config.paused,!stopped);if(stopped)room.classList.add(config.optin);}
      state.message.textContent='';sync();
    });
    state.touch=button(config.fire?'Warm the fire':config.rain?'Touch the window':config.water?'Make a ripple':config.clouds?'Feel the breeze':'Gentle glow',()=>{
      if(!running(state)){state.message.textContent='Play the scene to interact with its motion.';return;}
      room.classList.remove('ls-touched');void room.offsetWidth;room.classList.add('ls-touched');
      clearTimeout(state.touchTimer);state.touchTimer=setTimeout(()=>room.classList.remove('ls-touched'),2400);
    });
    if(config.fire) state.soundButton=button('Fire sound · Off',async()=>{
      try{if(!state.sound){await prepareAudio();await audioContext.resume();}state.sound=!state.sound;sync();}
      catch(error){state.message.textContent='Sound is unavailable in this browser.';console.warn('Scene sound:',error.message);}
    });
    state.message=document.createElement('p');state.message.className='ls-message';state.message.setAttribute('role','status');menu.append(state.message);
    room.append(controls);state.controls=controls;
    state.resize=new ResizeObserver(()=>layout(state));state.resize.observe(room);if(image)state.resize.observe(image);
    room.classList.add('ls-living-room');layout(state);return state;
  }
  function layout(state){
    const {room,host,art,image,natural}=state;if(!natural)return;
    const box=host.parentElement.getBoundingClientRect();let w=box.width,h=box.height,x=0,y=0;
    if(image){
      const r=image.getBoundingClientRect(),scale=Math.min(r.width/natural[0],r.height/natural[1]);
      w=natural[0]*scale;h=natural[1]*scale;x=r.left-box.left+(r.width-w)/2;y=r.top-box.top+(r.height-h)/2;
    }else{
      const scale=Math.max(w/natural[0],h/natural[1]),nw=natural[0]*scale,nh=natural[1]*scale;
      const target=(state.config.surface&&room.querySelector(state.config.surface))||room.querySelector('.scenery,.hm-scene,.cb-scene,#calmStage')||room;
      let pos=getComputedStyle(target||room).backgroundPosition.split(' ');const px=parseFloat(pos[0])/100||.5,py=parseFloat(pos[1])/100||.5;
      x=(w-nw)*px;y=(h-nh)*py;w=nw;h=nh;
    }
    Object.assign(art.style,{width:w+'px',height:h+'px',left:x+'px',top:y+'px'});
  }
  function running(s){return !s.userPaused&&!s.room.classList.contains(s.config.paused||'ls-never')&&!document.body.classList.contains('still-mode')&&(!reduced.matches||s.optin||s.room.classList.contains(s.config.optin||'ls-never'));}
  function sync(){
    const current=document.querySelector('.screen.active');
    if(current?.id!==active?.room.id){if(active)active.controls.open=false;active=states.get(current?.id)||mount(current?.id);}
    for(const s of states.values()){
      const play=s===active&&running(s)&&!document.hidden;
      s.host.classList.toggle('ls-running',play);s.room.classList.toggle('ls-scene-paused',!play);
      s.toggle.textContent=running(s)?'Pause scene':'Play scene';s.toggle.setAttribute('aria-pressed',String(running(s)));
      if(s.soundButton){s.soundButton.textContent='Fire sound · '+(s.sound?'On':'Off');s.soundButton.setAttribute('aria-pressed',String(s.sound));}
    }
    if(audioGain)audioGain.gain.setTargetAtTime(active?.sound&&running(active)&&!document.hidden?0.1:0,audioContext.currentTime,.18);
  }
  async function prepareAudio(){
    if(audioContext)return;
    const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('No audio');audioContext=new Audio();
    const rate=audioContext.sampleRate,buffer=audioContext.createBuffer(1,rate*6,rate),data=buffer.getChannelData(0);
    let seed=91827,low=0;const random=()=>{seed=(seed*16807)%2147483647;return seed/2147483647;};
    for(let i=0;i<data.length;i++){low=.985*low+.015*(random()*2-1);data[i]=low*.7;}
    for(let n=0;n<85;n++){const start=Math.floor(random()*(data.length-1800)),length=250+Math.floor(random()*1500),level=.08+random()*.25;for(let j=0;j<length;j++)data[start+j]+=(random()*2-1)*Math.exp(-j/(length*.18))*level;}
    audioSource=audioContext.createBufferSource();audioSource.buffer=buffer;audioSource.loop=true;
    const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=2200;
    audioGain=audioContext.createGain();audioGain.gain.value=0;audioSource.connect(filter).connect(audioGain).connect(audioContext.destination);audioSource.start();
  }
  const observer=new MutationObserver(records=>{if(records.some(r=>r.target===document.body||r.target.classList?.contains('screen')))sync();});
  observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class']});
  document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',()=>{for(const s of states.values())s.optin=false;sync();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active?.controls.open){active.controls.open=false;e.stopImmediatePropagation();active.controls.querySelector('summary').focus();}},true);
  // Standalone room previews use the same room navigation as the embedded app.
  const previewURL=new URL(window.location.href),previewRoom=previewURL.hash.slice(1);
  if(previewURL.pathname.endsWith('/app.html')&&configs[previewRoom]&&typeof window.showScreen==='function')window.showScreen(previewRoom);
  sync();
})();
