import { World, RayInteractable, Pressed, createComponent, createSystem, Types } from '@iwsdk/core';
import * as T from 'three';
import { buildWoodland } from './woodland.js';
import { createHandResponse } from './hand-response.js';
import { SYMBOLS, createJourney, beginBreathing, advanceBreathing, collect, canReflect, openReflection, resetJourney, breathLabel } from './journey.mjs';

const $ = id => document.getElementById(id);
const state = createJourney();
state.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const Action = createComponent('SanctuaryAction', { code: { type: Types.Int16, default: 0 } });
let world, orb, orbHalo, water, breathCard, reflectCard, messageCard, replayCard, motionCard, visitCard, soundCard, completionGlow;
const openingText = 'Take a short grounding break: breathe with the light, notice four simple cues, then carry a quiet moment back into your day.';
let groundingCue = '', activeReflectionName='';let finalReflectionCard;
const orbReflections=[
 {title:'Notice what is here',affirmation:'You can be here, just as you are.'},
 {title:'Feel your support',affirmation:'You do not have to hold it all alone.'},
 {title:'Listen to one sound',affirmation:'Let one sound bring you back to now.'},
 {title:'Let something soften',affirmation:'Set down one thing, just for this moment.'}
];
const groundingCues=['Notice one thing you can see.','Feel the support beneath you.','Listen for one sound nearby.','Let your shoulders soften.'];
let elapsed = 0, lastLabel = '', audioContext, audioGain, soundOn = false;
const symbols = new Map(), motes = [], falls = [], interactiveMeshes = [], lightTrails = [];
const palette = [0xcbdde5, 0xa396c4, 0xe0b77b, 0x83c9ca];
const orbitals=[];const handGlows=[];let handResponse,handPulseUntil=0;
let randomSeed = 42;
function rnd() { randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0; return randomSeed / 4294967296; }
function mat(color, roughness = .9) { return new T.MeshStandardMaterial({ color, roughness }); }
const stone = mat(0x52615d), stoneDark = mat(0x303e40), wood = mat(0x514d40), leaf = [mat(0x234741), mat(0x315448), mat(0x405b4b), mat(0x223d3d)];
const gold = new T.MeshStandardMaterial({ color:0xdac08d, metalness:.65, roughness:.35 });
function add(object, x=0,y=0,z=0) { object.position.set(x,y,z); world.scene.add(object); return object; }
function mesh(geometry, material,x=0,y=0,z=0) { return add(new T.Mesh(geometry,material),x,y,z); }
function target(object,code) { world.createTransformEntity(object).addComponent(RayInteractable).addComponent(Action,{code}); interactiveMeshes.push({object,code}); return object; }
function label(lines, width=1.2,height=.22, background=false) {
  const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=Math.round(1024*height/width);
  const ctx=canvas.getContext('2d'), texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const object=new T.Mesh(new T.PlaneGeometry(width,height),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false,side:T.DoubleSide}));
  object.userData.draw=(rows)=>{ctx.clearRect(0,0,canvas.width,canvas.height); if(background){ctx.fillStyle='#142b2cec';ctx.beginPath();ctx.roundRect(4,4,1016,canvas.height-8,26);ctx.fill();ctx.strokeStyle='#d2be8c88';ctx.lineWidth=3;ctx.stroke();} rows=Array.isArray(rows)?rows:[rows];ctx.textAlign='center';ctx.textBaseline='middle';rows.forEach((text,i)=>{ctx.fillStyle=i?'#d3e0d4':'#f1dfb9';ctx.font=Math.min(rows.length>1?46:64,canvas.height/rows.length*.74)+'px Georgia, serif';ctx.fillText(text,512,(i+.5)*canvas.height/rows.length,970)});texture.needsUpdate=true;};
  object.userData.draw(lines);return object;
}
function branch(a,b,r,material) {const delta=new T.Vector3().subVectors(b,a);const o=mesh(new T.CylinderGeometry(r*.65,r,delta.length(),7),material);o.position.copy(a).add(b).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return o;}
function tree(x,z,h,index) {
 const trunk=mat(index%3===0?0x879086:0x4b5547);const lean=(rnd()-.5)*.6;
 branch(new T.Vector3(x,0,z),new T.Vector3(x+lean,h,z),.12+h*.012,trunk);
 for(let j=0;j<4;j++){const a=j*2.4+index;const tip=new T.Vector3(x+Math.cos(a)*h*.27,h*(.65+j*.07),z+Math.sin(a)*h*.22);branch(new T.Vector3(x+lean*.6,h*.55,z),tip,.045,trunk);const crown=mesh(new T.IcosahedronGeometry(h*.31,1),leaf[(index+j)%4]);crown.position.copy(tip);crown.scale.set(1.15,.7,1);}
}
function glowTexture() {const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');const grad=g.createRadialGradient(64,64,0,64,64,64);grad.addColorStop(0,'rgba(255,245,203,.8)');grad.addColorStop(.15,'rgba(255,235,178,.35)');grad.addColorStop(1,'rgba(255,220,150,0)');g.fillStyle=grad;g.fillRect(0,0,128,128);return new T.CanvasTexture(c);}
let glowMap;
function halo(color,size,x,y,z) {const s=new T.Sprite(new T.SpriteMaterial({map:glowMap,color,transparent:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.6}));s.scale.set(size,size,1);add(s,x,y,z);return s;}
function garden(){const environment=buildWoodland(world,{add,mesh,halo,mat});water=environment.water;completionGlow=environment.completionGlow;motes.push(...environment.motes);falls.push(...environment.falls);}
function celestial(index) {
 const positions=[[-3.4,2.3,-5.7],[-.25,3.3,-6.8],[5.1,2.7,-4.8],[1.8,1.8,-3.7]],p=positions[index];
 const group=new T.Group();add(group,...p);
 const material=new T.MeshStandardMaterial({color:palette[index],emissive:palette[index],emissiveIntensity:.9,metalness:.25,roughness:.12,transparent:true,opacity:.65});
 const signalCore=new T.Mesh(new T.SphereGeometry(.27,40,28),material);group.add(signalCore);
 const shell=new T.Mesh(new T.SphereGeometry(.39,40,28),new T.MeshBasicMaterial({color:palette[index],transparent:true,opacity:.07,wireframe:false,blending:T.AdditiveBlending,depthWrite:false}));group.add(shell);
 const ringMaterial=new T.MeshBasicMaterial({color:palette[index],transparent:true,opacity:.45,blending:T.AdditiveBlending,depthWrite:false});let ring,pulse;
 for(let i=0;i<2;i++){const o=new T.Mesh(new T.TorusGeometry(.61+i*.09,.007,6,100),ringMaterial.clone());o.rotation.set(.35+i*.87,.4+i*.72,i*.4);o.scale.x=1.24;group.add(o);orbitals.push({mesh:o,index,speed:.08+i*.05});if(!i)ring=o;if(i===1)pulse=o;}
 for(let j=0;j<14;j++){const a=j*2.3999,rr=.5+(j%7)*.055;const o=halo(palette[index],.025+(j%3)*.009,p[0]+Math.cos(a)*rr,p[1]+Math.sin(a)*rr*.7,p[2]+Math.sin(j)*.3);motes.push({mesh:o,x:o.position.x,y:o.position.y,z:o.position.z,seed:j});}
 const light=halo(palette[index],2.4,...p);light.material.opacity=.35;add(new T.PointLight(palette[index],2,4,2),...p);
 const hit=new T.Mesh(new T.SphereGeometry(.76,18,14),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));hit.position.copy(group.position);target(hit,index+1);
 const caption=label(SYMBOLS[index]+' · select',1.3,.18);add(caption,p[0],p[1]-.95,p[2]);
 const affirmationCard=label([SYMBOLS[index]+' · '+orbReflections[index].title,orbReflections[index].affirmation],3.1,.55,true);add(affirmationCard,p[0],p[1]-.95,p[2]+.45);affirmationCard.visible=false;
 for(let j=0;j<12;j++){const t=j/11,bead=halo(palette[index],.09,p[0]*(1-t)+5*t,p[1]+Math.sin(t*Math.PI)*1.5,p[2]*(1-t)-11.5*t);bead.visible=false;lightTrails.push({mesh:bead,index,phase:t*Math.PI*2});}
 symbols.set(SYMBOLS[index],{group,light,hit,ring,caption,origin:p,index,signalCore,pulse,affirmationCard});
}
function waveform(x,y,z,w=2.4,h=.9) {
 const c=document.createElement('canvas');c.width=1024;c.height=384;const g=c.getContext('2d');g.fillStyle='#14384f33';g.beginPath();g.roundRect(6,6,1012,372,35);g.fill();g.strokeStyle='#a1cddf55';g.lineWidth=3;g.stroke();g.font='24px Arial';g.fillStyle='#9ab5c0';g.fillText('B R E A T H E   /   R E C O N N E C T',40,60);
 for(let j=0;j<7;j++){g.beginPath();g.strokeStyle='rgba(133,237,255,'+(.1+j*.025)+')';g.lineWidth=1.8;for(let i=0;i<940;i++){const xx=40+i,yy=240+Math.sin(i*.012+j*.12)*Math.exp(-Math.pow((i-470)/300,2))*(55-j*2)+j*3;if(!i)g.moveTo(xx,yy);else g.lineTo(xx,yy);}g.stroke();}
 const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,side:T.DoubleSide}),x,y,z);
}
function buildActivities() {
 SYMBOLS.forEach((_,i)=>celestial(i));
 waveform(-3.1,.9,-3.5,1.9,.7);waveform(4,.8,-5,1.2,1.1);
 orb=mesh(new T.SphereGeometry(.24,48,32),new T.MeshStandardMaterial({color:0xe1d7a7,emissive:0xedd4a0,emissiveIntensity:1.15,metalness:.2,roughness:.15}),-1.1,1.45,-5.4);
 orbHalo=halo(0xffdba5,2.5,-1.1,1.45,-5.4);const orbHit=new T.Mesh(new T.SphereGeometry(.48,16,12),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));orbHit.position.copy(orb.position);target(orbHit,10);
 for(let i=0;i<2;i++){const ring=mesh(new T.TorusGeometry(.48+i*.12,.009,8,80),gold,-1.1,1.45,-5.4);ring.rotation.x=i*.6;ring.rotation.y=i*.5;}
 breathCard=label('Breathe with the light',2,.26);add(breathCard,-1.1,2.1,-5.4);
 messageCard=label(['GROUNDING SQUARE','Your space. Your pace.'],3,.55);add(messageCard,0,5.5,-10);
 finalReflectionCard=label(['THE MELTDOWN ROOM',...orbReflections.map(r=>r.affirmation)],4.5,1.4,true);add(finalReflectionCard,.8,2.65,-3.1);finalReflectionCard.visible=false;
 reflectCard=label('11:11 · Awaiting your light',2.3,.38,true);reflectCard.position.set(.8,.64,-2.5);target(reflectCard,11);
 replayCard=label('Start again',.9,.22,true);replayCard.position.set(-.8,.48,-1.5);target(replayCard,12);
 motionCard=label('Reduce motion',1.1,.22,true);motionCard.position.set(.8,.35,-1.35);target(motionCard,13);
 const exit=label('Exit VR',.8,.22,true);exit.position.set(2.2,.48,-1.5);target(exit,14);exit.visible=false;exit.userData.xrOnly=true;
 visitCard=label('Visit The Meltdown Room',2,.3,true);visitCard.position.set(.8,1.05,-2.5);target(visitCard,15);visitCard.visible=false;
 soundCard=label('Sound off',1,.22,true);soundCard.position.set(.8,.12,-1.35);target(soundCard,16);soundCard.visible=false;
}
function refresh() {
 const ready=canReflect(state);$('breathe').textContent=state.breathCompleted?'Breathing complete ✓':state.breathing?'Pause breathing':'Begin breathing · 16 sec';
 $('status').textContent=breathLabel(state);if(groundingCue)document.querySelector('.description').textContent=groundingCue+' '+(orbReflections[SYMBOLS.indexOf(activeReflectionName)]?.affirmation||'');$('breath-progress').value=state.breathElapsed;$('count').textContent=state.collected.length+' of 4 lights gathered';$('reflect').disabled=!ready;$('reflection-label').textContent=ready?'Open your reflection':'Breathe & gather to unlock';
 $('motion').setAttribute('aria-pressed',String(state.reducedMotion));$('motion').textContent=state.reducedMotion?'Motion reduced':'Reduce motion';
 document.querySelectorAll('[data-symbol]').forEach(b=>{const done=state.collected.includes(b.dataset.symbol);b.setAttribute('aria-pressed',String(done));});
 if(!world)return;const immersive=world.renderer.xr.isPresenting;for(const target of interactiveMeshes)if(target.code>=11)target.object.visible=immersive&&(target.code!==15||state.reflectionOpen);messageCard.visible=(immersive||state.reflectionOpen)&&!state.reflectionOpen;finalReflectionCard.visible=immersive&&state.reflectionOpen;
 completionGlow.material.opacity=state.reflectionOpen?.4:ready?.18:0;
 for(const trail of lightTrails)trail.mesh.visible=state.collected.includes(SYMBOLS[trail.index]);
 soundCard.userData.draw(soundOn?'Sound on':'Sound off');
 for(const [name,s] of symbols){const done=state.collected.includes(name);s.group.scale.setScalar(done?.82:1);s.light.material.opacity=done?.2:.35;s.caption.userData.draw(done?name+' ✓':name+' · select');s.affirmationCard.visible=activeReflectionName===name&&!state.reflectionOpen;s.caption.visible=!s.affirmationCard.visible;s.ring.userData.selectedMaterial??=new T.MeshBasicMaterial({color:palette[s.index]});s.ring.material=done?s.ring.userData.selectedMaterial:s.ring.material;}
 breathCard.userData.draw(state.breathCompleted?'A little more space. A little more you.':state.breathing?breathLabel(state):'Breathe with the light');
 reflectCard.userData.draw(state.reflectionOpen?'11:11 · Your quiet moment':ready?'11:11 · Open your reflection':'11:11 · Breathe & gather four lights');motionCard.userData.draw(state.reducedMotion?'Motion reduced':'Reduce motion');
 if(state.reflectionOpen) { const chosen=state.collected.map(name=>orbReflections[SYMBOLS.indexOf(name)].affirmation);finalReflectionCard.userData.draw(['THE MELTDOWN ROOM',...chosen]);$('personal-reflection').textContent=chosen.join('\n');$('personal-reflection').style.whiteSpace='pre-line'; } else messageCard.userData.draw(['GROUNDING SQUARE',ready?'Your reflection is ready.':groundingCue||'Breathe, notice four cues, then reflect.']);
}
async function visitMeltdownRoom(){
 if(world.renderer.xr.isPresenting)await world.renderer.xr.getSession()?.end();
 window.location.assign('https://themeltdownroom.com/');
}
function tone(index=0) {if(!soundOn||!audioContext)return;const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=[261.63,329.63,392,523.25][index%4];g.gain.setValueAtTime(0,audioContext.currentTime);g.gain.linearRampToValueAtTime(.08,audioContext.currentTime+.03);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+1.5);o.connect(g).connect(audioGain);o.start();o.stop(audioContext.currentTime+1.6);}
function execute(code) {
 if(code>=1&&code<=16)handPulseUntil=elapsed+1.2;
 if(code>=1&&code<=4){activeReflectionName=SYMBOLS[code-1];groundingCue=groundingCues[code-1];if(collect(state,activeReflectionName))tone(code-1);}
 else if(code===10){if(state.breathing)state.breathing=false;else beginBreathing(state);}
 else if(code===11){if(openReflection(state)){tone(3);if(!world.renderer.xr.isPresenting&&!$('reflection').open)$('reflection').showModal();}}
 else if(code===12){resetJourney(state);groundingCue='';activeReflectionName='';document.querySelector('.description').textContent=openingText;$('reflection').close();}
 else if(code===13)state.reducedMotion=!state.reducedMotion;
 else if(code===14)world.renderer.xr.getSession()?.end();
 else if(code===15){visitMeltdownRoom().catch(()=>{$('support').textContent='Please exit VR, then use Visit The Meltdown Room.';});}
 else if(code===16)sound();
 refresh();
}
class JourneySystem extends createSystem({pressed:{required:[Action,Pressed]}}) {
 init(){this.queries.pressed.subscribe('qualify',entity=>{execute(entity.getValue(Action,'code'));});}
 update(dt){const delta=Math.min(Math.max(dt,0),.1);elapsed+=delta;
 if(state.breathing){advanceBreathing(state,delta);const next=breathLabel(state);if(next!==lastLabel){lastLabel=next;refresh();}$('breath-progress').value=state.breathElapsed;}
 const phase=(state.breathElapsed%8)/8,scale=state.breathing&&!state.reducedMotion?1+.45*(1-Math.cos(phase*Math.PI*2)):1;orb.scale.setScalar(scale);orbHalo.scale.setScalar(2.5*scale);
 if(!state.reducedMotion){for(const trail of lightTrails)trail.mesh.material.opacity=.5+Math.sin(elapsed*.8+trail.phase)*.2;water.uniforms.time.value=elapsed;for(const m of motes){m.mesh.position.y=m.y+Math.sin(elapsed*.35+m.seed)*.18;m.mesh.material.opacity=.4+Math.sin(elapsed*.6+m.seed)*.2;}for(const orbit of orbitals)orbit.mesh.rotation.z+=delta*orbit.speed;for(const s of symbols.values()){s.group.position.y=s.origin[1]+Math.sin(elapsed*.65+s.index)*.055;s.group.rotation.y=Math.sin(elapsed*.3+s.index)*.15;s.signalCore.scale.setScalar(1+Math.sin(elapsed*2.2+s.index)*.12);s.pulse.scale.setScalar(1+Math.sin(elapsed*1.6+s.index)*.22);}for(const f of falls)f.mesh.position.y=f.y+Math.sin(elapsed*2+f.phase)*.06;}
 if(!world.renderer.xr.isPresenting){for(const [name,s] of symbols){const p=s.hit.position.clone().project(world.camera),b=document.querySelector('[data-symbol="'+name+'"]');b.style.left=((p.x+1)*innerWidth/2)+'px';b.style.top=((1-p.y)*innerHeight/2)+'px';}}
 for(const h of handGlows)h.light.intensity=state.collected.length?2.3:1.2;
 handResponse?.update(Math.max(0,(handPulseUntil-elapsed)/1.2));
 }
}
function musicChord(){
 if(!audioContext||!soundOn)return;
 const now=audioContext.currentTime;
 [130.81,196,261.63,329.63].forEach((frequency,i)=>{
  const voice=audioContext.createOscillator(),gain=audioContext.createGain();
  voice.type='sine';voice.frequency.value=frequency;
  gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(.035,now+1+i*.1);
  gain.gain.exponentialRampToValueAtTime(.0001,now+7);
  voice.connect(gain).connect(audioGain);voice.start(now);voice.stop(now+7.1);
 });
}
async function sound(){try{if(!audioContext){audioContext=new AudioContext();audioGain=audioContext.createGain();audioGain.gain.value=.35;audioGain.connect(audioContext.destination);const buffer=audioContext.createBuffer(1,audioContext.sampleRate*3,audioContext.sampleRate);const data=buffer.getChannelData(0);let n=0;for(let i=0;i<data.length;i++){n=(n+Math.random()*.04-.02)/1.02;data[i]=n;}const stream=audioContext.createBufferSource();stream.buffer=buffer;stream.loop=true;const filter=audioContext.createBiquadFilter();filter.type='lowpass';filter.frequency.value=750;stream.connect(filter).connect(audioGain);stream.start();setInterval(musicChord,6000);}soundOn=!soundOn;if(soundOn)musicChord();await audioContext.resume();audioGain.gain.setTargetAtTime(soundOn?.35:0,audioContext.currentTime,.2);$('sound').textContent=soundOn?'Sound on':'Sound off';$('sound').setAttribute('aria-pressed',String(soundOn));refresh();}catch{$('sound').textContent='Sound unavailable';}}
async function start(){
 world=await World.create($('scene-container'),{xr:{sessionMode:'immersive-vr',offer:'none',features:{handTracking:true}},input:{canvasPointerEvents:true},features:{enableLocomotion:false,enableGrabbing:false}});world.registerComponent(Action);function fitView(){if(world.renderer.xr.isPresenting)return;const portrait=innerWidth<600;world.camera.fov=portrait?70:58;world.camera.aspect=innerWidth/innerHeight;world.camera.position.set(0,portrait?2.5:2.25,portrait?17:4.8);world.camera.rotation.set(-.035,0,0);world.camera.updateProjectionMatrix();}fitView();window.addEventListener('resize',fitView);glowMap=glowTexture();garden();buildActivities();
 // Batch small atmospheric sparks into one draw call; retain the large animated glows.
 const sparks=[];world.scene.traverse(o=>{if(o.isSprite&&o.scale.x<.3)sparks.push(o);});const positions=[],colors=[];for(const o of sparks){positions.push(o.position.x,o.position.y,o.position.z);colors.push(o.material.color.r,o.material.color.g,o.material.color.b);o.removeFromParent();}const sparkGeometry=new T.BufferGeometry();sparkGeometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));sparkGeometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));world.scene.add(new T.Points(sparkGeometry,new T.PointsMaterial({size:.075,map:glowMap,transparent:true,vertexColors:true,depthWrite:false,blending:T.AdditiveBlending,opacity:.48})));
 handResponse=createHandResponse(world,glowMap);world.registerSystem(JourneySystem);
 for(let i=0;i<2;i++){const hand=world.renderer.xr.getHand(i),light=new T.PointLight(0x55faff,1.2,2,2);hand.add(light);const glow=new T.Sprite(new T.SpriteMaterial({map:glowMap,color:0x55faff,transparent:true,opacity:.22,blending:T.AdditiveBlending,depthWrite:false}));glow.scale.set(.27,.27,.27);hand.add(glow);handGlows.push({light,glow});}
 // Desktop buttons and actual IWSDK ray/pinch targets share this one journey.
 $('breathe').onclick=()=>execute(10);$('reflect').onclick=()=>execute(11);$('restart').onclick=()=>execute(12);$('motion').onclick=()=>execute(13);$('sound').onclick=sound;
 document.querySelectorAll('[data-symbol]').forEach((b,i)=>{b.onclick=()=>execute(i+1);b.disabled=false;});$('breathe').disabled=false;$('restart').disabled=false;
 $('close').onclick=()=>$('reflection').close();$('done').onclick=()=>execute(12);$('visit').onclick=visitMeltdownRoom;
 $('launch').onclick=async()=>{try{if(!navigator.xr||!await navigator.xr.isSessionSupported('immersive-vr')){$('support').textContent='VR requires a WebXR headset browser. Everything here is playable with mouse, touch or keyboard.';return;}await world.launchXR();}catch(e){$('support').textContent='VR could not start: '+e.message;}};
 world.renderer.xr.addEventListener('sessionstart',()=>{document.body.classList.add('xr-active');$('reflection').close();refresh();});world.renderer.xr.addEventListener('sessionend',()=>{document.body.classList.remove('xr-active');fitView();for(const t of interactiveMeshes)if(t.code>=11)t.object.visible=false;refresh();});
 $('loading').hidden=true;refresh();
 // Small look-around range avoids forced movement and keeps targets in reach.
 const canvas=world.renderer.domElement;let pointer=null,yaw=0,pitch=0;canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,yaw,pitch};});canvas.addEventListener('pointermove',e=>{if(!pointer||state.reducedMotion||world.renderer.xr.isPresenting)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.hypot(dx,dy)<7)return;yaw=T.MathUtils.clamp(pointer.yaw-dx*.0007,-.22,.22);pitch=T.MathUtils.clamp(pointer.pitch-dy*.0005,-.1,.1);world.camera.rotation.set(pitch,yaw,0,'YXZ');});window.addEventListener('pointerup',()=>pointer=null);
 // Read-only diagnostics support reproducible browser tests without completing activities for them.
 window.grounding={snapshot:()=>({...state,collected:[...state.collected],xr:world.renderer.xr.isPresenting,drawCalls:world.renderer.info.render.calls,visibleHandJoints:handResponse?.visibleJoints||0,activeReflection:activeReflectionName,selectedReflections:state.collected.map(n=>orbReflections[SYMBOLS.indexOf(n)].affirmation),visibleAffirmations:Array.from(symbols.values()).filter(s=>s.affirmationCard.visible).map(s=>SYMBOLS[s.index])}),targets:()=>interactiveMeshes.map(({object,code})=>{const p=object.getWorldPosition(new T.Vector3()).project(world.camera);return {code,x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};})};
}
start().catch(e=>{console.error(e);$('loading').textContent='The 3D sanctuary could not load. Please reload in a WebGL-capable browser.';$('support').textContent=e.message;});




