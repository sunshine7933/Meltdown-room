import { World, RayInteractable, Pressed, createComponent, createSystem, Types } from '@iwsdk/core';
import * as T from 'three';
import { buildWoodland } from './woodland.js';
import { SYMBOLS, createJourney, beginBreathing, advanceBreathing, collect, canReflect, openReflection, resetJourney, breathLabel } from './journey.mjs';

const $ = id => document.getElementById(id);
const state = createJourney();
state.reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const Action = createComponent('SanctuaryAction', { code: { type: Types.Int16, default: 0 } });
let world, orb, orbHalo, water, breathCard, reflectCard, messageCard, replayCard, motionCard, visitCard, soundCard, completionGlow;
const openingText = 'Take a short grounding break: breathe with the light, notice four simple cues, then carry a quiet moment back into your day.';
let groundingCue = '';
const groundingCues=['Notice one thing you can see.','Feel the support beneath you.','Listen for one sound nearby.','Let your shoulders soften.'];
let elapsed = 0, lastLabel = '', audioContext, audioGain, soundOn = false;
const symbols = new Map(), motes = [], falls = [], interactiveMeshes = [], lightTrails = [];
const palette = [0xd6e9e5, 0xf2d597, 0xeeb878, 0xc5b8e8];
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
  object.userData.draw=(rows)=>{ctx.clearRect(0,0,canvas.width,canvas.height); if(background){ctx.fillStyle='#142b2cec';ctx.beginPath();ctx.roundRect(4,4,1016,canvas.height-8,26);ctx.fill();ctx.strokeStyle='#d2be8c88';ctx.lineWidth=3;ctx.stroke();} rows=Array.isArray(rows)?rows:[rows];ctx.textAlign='center';ctx.textBaseline='middle';rows.forEach((text,i)=>{ctx.fillStyle=i?'#d3e0d4':'#f1dfb9';ctx.font=(rows.length>1?'46':'64')+'px Georgia, serif';ctx.fillText(text,512,(i+.5)*canvas.height/rows.length,970)});texture.needsUpdate=true;};
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
 const group=new T.Group(), material=new T.MeshStandardMaterial({color:palette[index],emissive:palette[index],emissiveIntensity:1.5,metalness:.35,roughness:.24});
 if(index===0){const shape=new T.Shape();shape.moveTo(.12,.28);shape.bezierCurveTo(-.4,.25,-.4,-.25,.12,-.28);shape.bezierCurveTo(-.12,-.08,-.12,.08,.12,.28);group.add(new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.08,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.018,bevelThickness:.02}),material));}
 if(index===1){const shape=new T.Shape();for(let j=0;j<10;j++){const a=Math.PI/2+j*Math.PI/5,r=j%2?.13:.3;const x=Math.cos(a)*r,y=Math.sin(a)*r;if(j===0)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();group.add(new T.Mesh(new T.ExtrudeGeometry(shape,{depth:.07,bevelEnabled:true,bevelSize:.018,bevelThickness:.02,bevelSegments:2}),material));}
 if(index===2){group.add(new T.Mesh(new T.SphereGeometry(.17,24,16),material));for(let j=0;j<12;j++){const a=j*Math.PI/6;const ray=new T.Mesh(new T.CylinderGeometry(.018,.018,.09,6),material);ray.position.set(Math.cos(a)*.26,Math.sin(a)*.26,0);ray.rotation.z=a-Math.PI/2;group.add(ray);}}
 if(index===3){group.add(new T.Mesh(new T.IcosahedronGeometry(.18,2),material));for(let j=0;j<3;j++){const tail=new T.Mesh(new T.ConeGeometry(.025,.45-j*.08,6),material);tail.rotation.z=-.8;tail.position.set(.17+j*.04,.17-j*.05,-.02);group.add(tail);}}
 const positions=[[-1.45,1.22,-3.25],[.02,1.14,-3.65],[1.52,1.14,-3.65],[2.98,1.22,-3.25]],p=positions[index];
 add(group,...p);const light=halo(palette[index],1.3,...p);
 const hit=new T.Mesh(new T.SphereGeometry(.43,16,12),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));hit.position.copy(group.position);target(hit,index+1);
 const ring=mesh(new T.TorusGeometry(.38,.012,6,56),gold,p[0],p[1],p[2]-.12);
 const base=mesh(new T.SphereGeometry(.38,16,10),mat(0x9ba99b),p[0],.13,p[2]);base.scale.set(1,.42,1);const stem=mesh(new T.CylinderGeometry(.045,.075,.62,12),gold,p[0],.48,p[2]);
 const caption=label(SYMBOLS[index],.72,.16);add(caption,p[0],.72,p[2]+.09);
 for(let j=0;j<10;j++){
 const t=j/9,bead=halo(palette[index],.12,p[0]*(1-t)+1.1*t,p[1]+Math.sin(t*Math.PI)*1.2+t*1.5,p[2]*(1-t)-8.4*t);
 bead.visible=false;lightTrails.push({mesh:bead,index,phase:t*Math.PI*2});
}
 symbols.set(SYMBOLS[index],{group,light,hit,ring,caption,origin:p,index});
}
function buildActivities() {
 SYMBOLS.forEach((_,i)=>celestial(i));
 orb=mesh(new T.SphereGeometry(.24,48,32),new T.MeshStandardMaterial({color:0xe1d7a7,emissive:0xedd4a0,emissiveIntensity:2.3,metalness:.2,roughness:.15}),.8,2.1,-5);
 orbHalo=halo(0xffdba5,2.5,.8,2.1,-5);const orbHit=new T.Mesh(new T.SphereGeometry(.48,16,12),new T.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false}));orbHit.position.copy(orb.position);target(orbHit,10);
 for(let i=0;i<2;i++){const ring=mesh(new T.TorusGeometry(.48+i*.12,.009,8,80),gold,.8,2.1,-5);ring.rotation.x=i*.6;ring.rotation.y=i*.5;}
 breathCard=label('Breathe with the light',2,.26);add(breathCard,.8,2.78,-5);
 messageCard=label(['GROUNDING SQUARE','Your space. Your pace.'],3,.55);add(messageCard,1.1,4.5,-8.3);
 reflectCard=label('11:11 · Awaiting your light',2.3,.38,true);reflectCard.position.set(.8,.64,-2.5);target(reflectCard,11);
 replayCard=label('Start again',.9,.22,true);replayCard.position.set(-.8,.48,-1.5);target(replayCard,12);
 motionCard=label('Reduce motion',1.1,.22,true);motionCard.position.set(.8,.35,-1.35);target(motionCard,13);
 const exit=label('Exit VR',.8,.22,true);exit.position.set(2.2,.48,-1.5);target(exit,14);exit.visible=false;exit.userData.xrOnly=true;
 visitCard=label('Visit The Meltdown Room',2,.3,true);visitCard.position.set(.8,1.05,-2.5);target(visitCard,15);visitCard.visible=false;
 soundCard=label('Sound off',1,.22,true);soundCard.position.set(.8,.12,-1.35);target(soundCard,16);soundCard.visible=false;
}
function refresh() {
 const ready=canReflect(state);$('breathe').textContent=state.breathCompleted?'Breathing complete ✓':state.breathing?'Pause breathing':'Begin breathing · 16 sec';
 $('status').textContent=breathLabel(state);if(groundingCue)document.querySelector('.description').textContent=groundingCue;$('breath-progress').value=state.breathElapsed;$('count').textContent=state.collected.length+' of 4 lights gathered';$('reflect').disabled=!ready;$('reflection-label').textContent=ready?'Open your reflection':'Breathe & gather to unlock';
 $('motion').setAttribute('aria-pressed',String(state.reducedMotion));$('motion').textContent=state.reducedMotion?'Motion reduced':'Reduce motion';
 document.querySelectorAll('[data-symbol]').forEach(b=>{const done=state.collected.includes(b.dataset.symbol);b.setAttribute('aria-pressed',String(done));});
 if(!world)return;const immersive=world.renderer.xr.isPresenting;for(const target of interactiveMeshes)if(target.code>=11)target.object.visible=immersive&&(target.code!==15||state.reflectionOpen);messageCard.visible=immersive||state.reflectionOpen;
 completionGlow.material.opacity=state.reflectionOpen?.75:ready?.3:0;
 for(const trail of lightTrails)trail.mesh.visible=state.collected.includes(SYMBOLS[trail.index]);
 soundCard.userData.draw(soundOn?'Sound on':'Sound off');
 for(const [name,s] of symbols){const done=state.collected.includes(name);s.group.scale.setScalar(done?.65:1);s.light.material.opacity=done?.22:.6;s.caption.userData.draw(done?name+' ✓':name);s.ring.userData.selectedMaterial??=new T.MeshBasicMaterial({color:palette[s.index]});s.ring.material=done?s.ring.userData.selectedMaterial:gold;}
 breathCard.userData.draw(state.breathCompleted?'A little more space. A little more you.':state.breathing?breathLabel(state):'Breathe with the light');
 reflectCard.userData.draw(state.reflectionOpen?'11:11 · Your quiet moment':ready?'11:11 · Open your reflection':'11:11 · Breathe & gather four lights');motionCard.userData.draw(state.reducedMotion?'Motion reduced':'Reduce motion');
 if(state.reflectionOpen) messageCard.userData.draw(['A QUIET MOMENT, YOURS','You are allowed to begin again.']);else messageCard.userData.draw(['GROUNDING SQUARE',ready?'Your reflection is ready.':groundingCue||'Breathe, notice four cues, then reflect.']);
}
async function visitMeltdownRoom(){
 if(world.renderer.xr.isPresenting)await world.renderer.xr.getSession()?.end();
 window.location.assign('https://themeltdownroom.com/');
}
function tone(index=0) {if(!soundOn||!audioContext)return;const o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=[261.63,329.63,392,523.25][index%4];g.gain.setValueAtTime(0,audioContext.currentTime);g.gain.linearRampToValueAtTime(.08,audioContext.currentTime+.03);g.gain.exponentialRampToValueAtTime(.001,audioContext.currentTime+1.5);o.connect(g).connect(audioGain);o.start();o.stop(audioContext.currentTime+1.6);}
function execute(code) {
 if(code>=1&&code<=4){if(collect(state,SYMBOLS[code-1])){groundingCue=groundingCues[code-1];tone(code-1);}}
 else if(code===10){if(state.breathing)state.breathing=false;else beginBreathing(state);}
 else if(code===11){if(openReflection(state)){tone(3);if(!world.renderer.xr.isPresenting&&!$('reflection').open)$('reflection').showModal();}}
 else if(code===12){resetJourney(state);groundingCue='';document.querySelector('.description').textContent=openingText;$('reflection').close();}
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
 if(!state.reducedMotion){for(const trail of lightTrails)trail.mesh.material.opacity=.5+Math.sin(elapsed*.8+trail.phase)*.2;water.uniforms.time.value=elapsed;for(const m of motes){m.mesh.position.y=m.y+Math.sin(elapsed*.35+m.seed)*.18;m.mesh.material.opacity=.4+Math.sin(elapsed*.6+m.seed)*.2;}for(const s of symbols.values()){s.group.position.y=s.origin[1]+Math.sin(elapsed*.65+s.index)*.055;s.group.rotation.y=Math.sin(elapsed*.3+s.index)*.15;}for(const f of falls)f.mesh.position.y=f.y+Math.sin(elapsed*2+f.phase)*.06;}
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
 world=await World.create($('scene-container'),{xr:{sessionMode:'immersive-vr',offer:'none',features:{handTracking:true}},input:{canvasPointerEvents:true},features:{enableLocomotion:false,enableGrabbing:false}});world.registerComponent(Action);world.camera.fov=65;world.camera.position.set(0,1.7,2);world.camera.updateProjectionMatrix();glowMap=glowTexture();garden();buildActivities();world.registerSystem(JourneySystem);
 // Desktop buttons and actual IWSDK ray/pinch targets share this one journey.
 $('breathe').onclick=()=>execute(10);$('reflect').onclick=()=>execute(11);$('restart').onclick=()=>execute(12);$('motion').onclick=()=>execute(13);$('sound').onclick=sound;
 document.querySelectorAll('[data-symbol]').forEach((b,i)=>{b.onclick=()=>execute(i+1);b.disabled=false;});$('breathe').disabled=false;$('restart').disabled=false;
 $('close').onclick=()=>$('reflection').close();$('done').onclick=()=>execute(12);$('visit').onclick=visitMeltdownRoom;
 $('launch').onclick=async()=>{try{if(!navigator.xr||!await navigator.xr.isSessionSupported('immersive-vr')){$('support').textContent='VR requires a WebXR headset browser. Everything here is playable with mouse, touch or keyboard.';return;}await world.launchXR();}catch(e){$('support').textContent='VR could not start: '+e.message;}};
 world.renderer.xr.addEventListener('sessionstart',()=>{document.body.classList.add('xr-active');$('reflection').close();refresh();});world.renderer.xr.addEventListener('sessionend',()=>{document.body.classList.remove('xr-active');for(const t of interactiveMeshes)if(t.code>=11)t.object.visible=false;refresh();});
 $('loading').hidden=true;refresh();
 // Small look-around range avoids forced movement and keeps targets in reach.
 const canvas=world.renderer.domElement;let pointer=null,yaw=0,pitch=0;canvas.addEventListener('pointerdown',e=>{pointer={x:e.clientX,y:e.clientY,yaw,pitch};});canvas.addEventListener('pointermove',e=>{if(!pointer||state.reducedMotion||world.renderer.xr.isPresenting)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;if(Math.hypot(dx,dy)<7)return;yaw=T.MathUtils.clamp(pointer.yaw-dx*.0007,-.22,.22);pitch=T.MathUtils.clamp(pointer.pitch-dy*.0005,-.1,.1);world.camera.rotation.set(pitch,yaw,0,'YXZ');});window.addEventListener('pointerup',()=>pointer=null);
 // Read-only diagnostics support reproducible browser tests without completing activities for them.
 window.grounding={snapshot:()=>({...state,collected:[...state.collected],xr:world.renderer.xr.isPresenting,drawCalls:world.renderer.info.render.calls}),targets:()=>interactiveMeshes.map(({object,code})=>{const p=object.getWorldPosition(new T.Vector3()).project(world.camera);return {code,x:(p.x+1)*innerWidth/2,y:(1-p.y)*innerHeight/2};})};
}
start().catch(e=>{console.error(e);$('loading').textContent='The 3D sanctuary could not load. Please reload in a WebGL-capable browser.';$('support').textContent=e.message;});




