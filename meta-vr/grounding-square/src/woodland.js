import * as T from 'three';

// Real spatial geometry stays immersive in WebXR; no photographic backdrop.
export function buildWoodland(world,{add,mesh,halo,mat}) {
 let seed=771;const r=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 world.scene.fog=new T.FogExp2(0x18283d,.013);world.renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));world.renderer.toneMapping=T.ACESFilmicToneMapping;world.renderer.toneMappingExposure=1.65;
 mesh(new T.SphereGeometry(110,40,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 p;void main(){vec3 d=normalize(p);float h=smoothstep(-.1,.7,d.y);vec3 c=mix(vec3(.19,.18,.24),vec3(.025,.055,.15),h);c+=vec3(.045,.025,.07)*pow(max(0.,dot(d,normalize(vec3(.1,.4,-1.)))),7.);gl_FragColor=vec4(c,1.);}`}));
 add(new T.HemisphereLight(0xd9f2ff,0x234d43,3.4));add(new T.DirectionalLight(0xdaf5ff,3.1),-7,12,2);add(new T.DirectionalLight(0xffc27c,2.3),8,5,-12);
 const rockMat=mat(0x44545a),moss=mat(0x37654d),bark=mat(0x35483c),gold=new T.MeshStandardMaterial({color:0xd49d59,metalness:.7,roughness:.28});
 const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle='#8a9692';ctx.fillRect(0,0,256,256);for(let i=0;i<14000;i++){let n=50+r()*150;ctx.fillStyle=`rgba(${n},${n},${n},.28)`;ctx.fillRect(r()*256,r()*256,1+r()*6,1+r()*9);}const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;rockMat.map=moss.map=bark.map=tex;
 const rockGeo=new T.IcosahedronGeometry(1,3);const rp=rockGeo.attributes.position;for(let i=0;i<rp.count;i++){const x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i),n=1+.11*Math.sin(x*19+y*8)*Math.sin(y*16+z*13)+.05*Math.sin(z*32+x*20);rp.setXYZ(i,x*n,y*n,z*n);}rockGeo.computeVertexNormals();
 function rock(x,y,z,sx,sy,sz){const o=mesh(rockGeo,r()>.28?rockMat:moss,x,y,z);o.scale.set(sx,sy,sz);o.rotation.set(r()*.5,r()*6,r()*.4);return o;}
 mesh(new T.CylinderGeometry(32,34,1,72),mat(0x0b1b20),0,-1,-12);
 for(let i=0;i<65;i++){const side=i%2?-1:1;rock(side*(side>0?9+r()*9:5+r()*9)-2,1+r()*4.5,-15-r()*8,1+r()*1.8,2+r()*3,1+r()*2);}
 for(let i=0;i<35;i++){const a=r()*Math.PI*2;rock(Math.cos(a)*11,-.1+r()*.3,-6+Math.sin(a)*10,.6+r()*1.5,.3+r()*.65,.7+r()*1.5);}
 const water=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec3 wp;void main(){wp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}',fragmentShader:`varying vec3 wp;uniform float time;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1)),f.x),f.y);}void main(){vec2 p=wp.xz;float n=noise(p*2.+vec2(time*.07,-time*.13));float rip=pow(noise(vec2(p.x*2.8,p.y*26.-time*.55)+n*1.7),4.);float cyan=exp(-pow((p.x+2.6+sin(p.y*2.)*.7)/2.9,2.));float violet=exp(-pow((p.x-.4+sin(p.y*1.2)*.5)/.9,2.));float amber=exp(-pow((p.x-5.+sin(p.y*2.)*.8)/1.3,2.));vec3 col=vec3(.012,.075,.11)+vec3(.03,.22,.25)*cyan*(.15+rip)+vec3(.12,.06,.2)*violet*rip+vec3(.32,.15,.05)*amber*rip;float ring=pow(.5+.5*sin(length(p-vec2(2.,-2.))*9.-time*1.5+n*1.4),20.)*exp(-length(p-vec2(2.,-2.))*.6);col+=vec3(.03,.18,.19)*ring*.4;gl_FragColor=vec4(col,1.);}`});
 const pool=mesh(new T.CircleGeometry(14,100),water,0,.02,-6);pool.rotation.x=-Math.PI/2;
 const cascade=new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:false,blending:T.AdditiveBlending,uniforms:water.uniforms,vertexShader:'varying vec2 v;void main(){v=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 v;uniform float time;float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+1.),f.x),f.y);}void main(){float broad=n(vec2(v.x*24.,v.y*9.+time*.9));float fine=n(vec2(v.x*160.,v.y*38.+time*3.));float churn=n(vec2(v.x*63.+broad*2.,v.y*18.+time*1.6));float wobble=.015*sin(v.y*12.)+.04*churn;float e=smoothstep(.01,.15,v.x+wobble)*smoothstep(.01,.15,1.-v.x-wobble);e*=1.-smoothstep(.84,1.,v.y+n(vec2(v.x*15.,0.))*.12);vec3 c=mix(vec3(.015,.13,.19),vec3(.23,.65,.7),broad*.55+fine*.25+churn*.3);gl_FragColor=vec4(c,e*(.5+fine*.4));}`});
 function cascadeRibbon(w,h,x,y,z){const geo=new T.PlaneGeometry(w,h,50,50),p=geo.attributes.position;for(let i=0;i<p.count;i++){const xx=p.getX(i),yy=p.getY(i);p.setXYZ(i,xx*(.96+.04*Math.sin(yy*.8))+.02*Math.sin(yy*3.+xx),yy+.13*Math.sin(xx*6.)*(yy/h+.5),.08*Math.sin(xx*4.+yy));}geo.computeVertexNormals();mesh(geo,cascade,x,y,z);}const lipCliff=rock(-3,3.7,-14.1,2.15,3.65,.6);lipCliff.rotation.set(0,0,0);cascadeRibbon(4.2,7.5,-3,4,-13);cascadeRibbon(2.4,2.4,-2.5,1.25,-11.8);for(let i=0;i<10;i++)rock(-5+i*.43,7.35+Math.sin(i*1.7)*.22,-13.25,.42,.3,.5);halo(0x0bffff,9,-3,3.8,-13.3).material.opacity=.12;add(new T.PointLight(0x7cefff,36,22,2),-3,2,-10);
 const falls=[],motes=[];for(let i=0;i<14;i++){const x=-6+r()*9,y=.2+r()*1.3,z=-10+r()*4;const mist=halo(0x7ddadf,2+r()*3,x,y,z);mist.material.opacity=.035+r()*.05;falls.push({mesh:mist,y,phase:r()*6});}
 // Nested warm arches create an unmistakable entrance on the right bank.
 const portal=new T.Group();add(portal,5,0,-11.5);const glowMat=new T.MeshBasicMaterial({color:0xffbd69,transparent:true,opacity:.85});
 for(let i=0;i<5;i++){const z=-i*.63,w=1.65-i*.12,h=3.2;const curve=new T.CatmullRomCurve3([new T.Vector3(-w,0,z),new T.Vector3(-w,h*.62,z),new T.Vector3(-w*.7,h,z),new T.Vector3(0,h+1.1,z),new T.Vector3(w*.7,h,z),new T.Vector3(w,h*.62,z),new T.Vector3(w,0,z)]);portal.add(new T.Mesh(new T.TubeGeometry(curve,70,.035,6,false),glowMat));const frame=new T.Mesh(new T.TubeGeometry(curve,70,.15,8,false),rockMat);frame.position.z=-.09;portal.add(frame);}
 mesh(new T.PlaneGeometry(2.1,4),new T.MeshBasicMaterial({color:0xffb462,transparent:true,opacity:.23,side:T.DoubleSide}),5,2,-14.5);halo(0xff9f43,6,5,2,-13.5).material.opacity=.32;add(new T.PointLight(0xffbc68,55,16,2),5,2.5,-10);for(let i=0;i<8;i++)mesh(new T.BoxGeometry(3.8-i*.14,.15,.55),rockMat,5,.05+i*.14,-8.3-i*.5);
 // Architectural stonework: paired columns, keystone, and warm recessed doorway.
 const portalStone=new T.MeshStandardMaterial({color:0x73877c,roughness:.85,metalness:.03});
 const insetStone=new T.MeshStandardMaterial({color:0x283e39,roughness:.92});
 for(const x of [3.35,6.65]){
   mesh(new T.CylinderGeometry(.42,.52,3.4,10),portalStone,x,1.7,-11.3);
   mesh(new T.CylinderGeometry(.58,.56,.3,10),portalStone,x,3.5,-11.3);
   mesh(new T.CylinderGeometry(.62,.57,.25,10),portalStone,x,.2,-11.3);
   for(let y=.65;y<3.4;y+=.65)mesh(new T.BoxGeometry(.85,.07,.76),rockMat,x,y,-11.3);
 }
 const doorway=mesh(new T.PlaneGeometry(2.65,3.45),insetStone,5,2.02,-11.85);
 const doorGlow=mesh(new T.PlaneGeometry(2.35,3.12),new T.MeshBasicMaterial({color:0xeeb877,transparent:true,opacity:.24,side:T.DoubleSide}),5,2.06,-11.78);
 for(let i=0;i<11;i++){const a=Math.PI*(i/10),x=5+1.62*Math.cos(a),y=3.48+1.55*Math.sin(a);const stoneBlock=mesh(new T.BoxGeometry(.5,.45,.8),portalStone,x,y,-11.3);stoneBlock.rotation.z=a-Math.PI/2;}
 const keystone=mesh(new T.BoxGeometry(.72,.68,.96),portalStone,5,5.13,-11.3);
 for(const x of [2.95,7.05]){mesh(new T.CylinderGeometry(.09,.11,1.5,8),gold,x,1.15,-10.8);mesh(new T.SphereGeometry(.18,12,8),lanternMat,x,1.96,-10.8);}
  const tc=document.createElement('canvas');tc.width=1024;tc.height=128;const g=tc.getContext('2d');g.textAlign='center';g.fillStyle='#fff1d5';g.font='500 70px Georgia';g.fillText('THE MELTDOWN ROOM',512,75);const t=new T.CanvasTexture(tc);add(new T.Mesh(new T.PlaneGeometry(5.6,.9),new T.MeshBasicMaterial({map:t,transparent:true,depthWrite:false,depthTest:false})),5,5.2,-11.15);const completionGlow=halo(0xffd39c,5,5,2,-12.5);completionGlow.material.opacity=0;

 // Asymmetric falls: no horizontal floating rock bars across the water.
 // Offset rock shelves are anchored into the cliff on either bank.
 for(let tier=0;tier<3;tier++){
   const y=6.7-tier*2.35,z=-12.8+tier*.65;
   const left=-5.45-tier*.14,right=-.75+tier*.17;
   rock(left,y-.55,z,1.4,.65,1.05);
   rock(right,y-.72,z-.2,1.12,.62,.92);
   cascadeRibbon(3.85-tier*.28,2.35,-3.05+tier*.15,y-1.35,z+.38);
 }
 // Natural-looking mist and reflected blue highlights near the base.
 for(let i=0;i<12;i++){const x=-5.2+r()*4.4,z=-10.8+r()*1.4;const spray=halo(0x89e9ff,.3+r()*.48,x,.15+r()*.45,z);spray.material.opacity=.04+r()*.035;}
 // Mossy terraces frame the water without covering the interactive gems.
 for(let j=0;j<22;j++){const x=(j%2?-1:1)*(3.7+r()*2.2),y=.15+r()*1.1,z=-4-r()*11;rock(x,y,z,.65+r()*.55,.4+r()*.45,.7+r()*.5);}
  // Moonlit atmosphere, lanterns and wildflowers.
 const starsGeo=new T.BufferGeometry(),starPositions=[];for(let i=0;i<380;i++){const a=r()*Math.PI*2,h=18+r()*55,rad=45+r()*40;starPositions.push(Math.cos(a)*rad,h,Math.sin(a)*rad-18);}
 starsGeo.setAttribute('position',new T.Float32BufferAttribute(starPositions,3));add(new T.Points(starsGeo,new T.PointsMaterial({color:0xd9f4ff,size:.25,transparent:true,opacity:.92,depthWrite:false})));
 mesh(new T.SphereGeometry(3.4,28,20),new T.MeshBasicMaterial({color:0xfff4d8}),-23,34,-52);
 // Keep the moon crisp; a giant transparent halo overwhelms mobile compositing.
 const lanternMat=new T.MeshStandardMaterial({color:0xffd394,emissive:0xffb45b,emissiveIntensity:2.3});
 for(const [x,z] of [[-6,-5],[-7,-10],[7,-7],[8,-13],[1,-4]]){mesh(new T.CylinderGeometry(.055,.065,1.35,8),bark,x,.65,z);mesh(new T.BoxGeometry(.35,.5,.35),lanternMat,x,1.4,z);halo(0xffc46d,2.6,x,1.4,z).material.opacity=.25;}
 const flowerMat=[new T.MeshBasicMaterial({color:0xffb3d8}),new T.MeshBasicMaterial({color:0xb7d4ff}),new T.MeshBasicMaterial({color:0xfbe2a0})],flowerGeo=new T.IcosahedronGeometry(.085,0);
 for(let i=0;i<120;i++){const x=(r()>.5?1:-1)*(5+r()*9),z=-1-r()*19;mesh(flowerGeo,flowerMat[i%3],x,.2+r()*.5,z);}
 // Flowering vines and fern clusters soften the waterfall banks and portal.
 const fernMat=new T.MeshStandardMaterial({color:0x2f9b74,side:T.DoubleSide,roughness:.8});
 const fernGeo=new T.ConeGeometry(.25,1.1,5,1,true);
 for(let i=0;i<75;i++){const side=i%2?-1:1,x=side*(3.8+r()*5.5),z=-2-r()*16,y=.18+r()*.32;
   const frond=mesh(fernGeo,fernMat,x,y+.48,z);frond.rotation.z=(r()-.5)*.8;frond.scale.set(.7+r()*.9,.6+r()*.6,.6+r()*.9);
 }
 const vineMat=new T.MeshStandardMaterial({color:0x3c9164,roughness:1});
 for(const x of [3.5,6.5]){for(let j=0;j<12;j++){const y=.35+j*.32,ang=j*1.3;const leaf=mesh(new T.IcosahedronGeometry(.18,0),j%3===0?flowerMat[0]:vineMat,x+Math.sin(ang)*.32,y,-11.05+Math.cos(ang)*.22);leaf.scale.set(.75,1.5,.45);}}
   // Dense canopy uses instancing, rather than solid low-poly tree crowns.
 const lc=document.createElement('canvas');lc.width=lc.height=128;const lg=lc.getContext('2d');lg.fillStyle='white';for(let i=0;i<22;i++){lg.save();lg.translate(15+r()*100,10+r()*110);lg.rotate(r()*6);lg.beginPath();lg.ellipse(0,0,9+r()*7,3,0,0,Math.PI*2);lg.fill();lg.restore();}const leafMat=new T.MeshStandardMaterial({map:new T.CanvasTexture(lc),alphaTest:.4,color:0x5d8b64,side:T.DoubleSide,roughness:1});const transforms=[],branches=[],dummy=new T.Object3D();
 function branch(a,b,rad){const d=new T.Vector3().subVectors(b,a);dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());dummy.scale.set(rad,d.length(),rad);dummy.updateMatrix();branches.push(dummy.matrix.clone());}
 for(let i=0;i<50;i++){let x=(i%2?-1:1)*(7+r()*17),z=-2-r()*34,h=7+r()*9;branch(new T.Vector3(x,0,z),new T.Vector3(x*.9,h,z),.23+r()*.17);for(let j=0;j<6;j++){let end=new T.Vector3(x+Math.cos(j*2+i)*2.6,h*.7+r()*2,z+Math.sin(j*2+i)*2.5);branch(new T.Vector3(x*.94,h*.6,z),end,.055);for(let k=0;k<10;k++){dummy.position.copy(end).add(new T.Vector3((r()-.5)*4,(r()-.5)*2,(r()-.5)*4));dummy.rotation.set(r()*3,r()*6,r()*3);dummy.scale.setScalar(1+r());dummy.updateMatrix();transforms.push(dummy.matrix.clone());}}}
 const trunks=new T.InstancedMesh(new T.CylinderGeometry(.6,1,1,7),bark,branches.length);branches.forEach((v,i)=>trunks.setMatrixAt(i,v));add(trunks);const leaves=new T.InstancedMesh(new T.PlaneGeometry(1.4,1.4),leafMat,transforms.length);transforms.forEach((v,i)=>leaves.setMatrixAt(i,v));add(leaves);
 for(let i=0;i<45;i++){let x=(r()-.5)*21,y=.2+r()*7,z=-2-r()*20;const o=halo(i%3?0x75e9ed:0xffba6a,.035+r()*.08,x,y,z);motes.push({mesh:o,x,y,z,seed:r()*9});}for(let i=0;i<3;i++){const x=[-8,6,10][i],z=-7-i;for(let j=0;j<6;j++)halo(0xffb95a,.07,x+Math.sin(j)*.13,1+j*.38,z);}
 return {water,falls,motes,completionGlow};
}

