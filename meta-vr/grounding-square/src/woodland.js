// The sanctuary is real, lightweight scene geometry, including in immersive mode.
import * as T from 'three';

export function buildWoodland(world, {add, mesh, halo, mat}) {
  let seed=771;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
  const stone=mat(0x71817b), darkStone=mat(0x344c49), moss=mat(0x3f6146);
  const bark=mat(0x5a4435), brass=new T.MeshStandardMaterial({color:0xc7a775,metalness:.65,roughness:.4});
  function surfaceTexture(isBark){
    const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');g.fillStyle=isBark?'#b8a18a':'#c2c8b7';g.fillRect(0,0,256,256);
    for(let i=0;i<6500;i++){const n=80+random()*120;g.fillStyle=`rgba(${n},${n},${n},${isBark?.2:.3})`;g.fillRect(random()*256,random()*256,isBark?1:1+random()*4,isBark?8+random()*45:1+random()*3);}
    const t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t;
  }
  bark.map=surfaceTexture(true);stone.map=darkStone.map=moss.map=surfaceTexture(false);
  world.scene.fog=new T.FogExp2(0x647d7c,.025);
  world.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
  world.renderer.toneMapping=T.ACESFilmicToneMapping;
  world.renderer.toneMappingExposure=1.05;
  // A continuous dusk sky, rather than a flat background or a photographic backdrop.
  const sky=mesh(new T.SphereGeometry(120,32,20),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{},vertexShader:'varying vec3 direction;void main(){direction=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec3 direction;
    void main(){vec3 d=normalize(direction);float h=smoothstep(-.08,.75,d.y);
    vec3 c=mix(vec3(.70,.65,.54),vec3(.075,.17,.24),h);
    float sun=pow(max(0.,dot(d,normalize(vec3(-.5,.18,-1.)))),18.);
    c+=vec3(.26,.14,.055)*sun;gl_FragColor=vec4(c,1.);}`}));
  sky.frustumCulled=false;
  add(new T.HemisphereLight(0xe5e3ce,0x294338,2));
  add(new T.DirectionalLight(0xffdfac,3.1),-7,10,-5);
  add(new T.DirectionalLight(0x9edbd9,1.3),5,5,-10);

  // Ground variation is painted procedurally once; there are no external asset downloads.
  const canvas=document.createElement('canvas');canvas.width=canvas.height=512;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#496047';ctx.fillRect(0,0,512,512);
  for(let i=0;i<11000;i++){const v=35+random()*50;ctx.fillStyle=`rgba(${v},${v+18},${v-8},.22)`;ctx.fillRect(random()*512,random()*512,1+random()*5,1+random()*5);}
  const groundMap=new T.CanvasTexture(canvas);groundMap.colorSpace=T.SRGBColorSpace;groundMap.wrapS=groundMap.wrapT=T.RepeatWrapping;groundMap.repeat.set(12,12);
  const ground=mesh(new T.PlaneGeometry(160,160,24,24),new T.MeshStandardMaterial({map:groundMap,roughness:1}),0,-.13,-15);ground.rotation.x=-Math.PI/2;
  const p=ground.geometry.attributes.position;
  for(let i=0;i<p.count;i++){const x=p.getX(i),z=-p.getY(i)-15;const distance=Math.hypot(x,z+4);p.setZ(i,distance<10?0:Math.sin(x*.17)*Math.cos(z*.13)*1.3);}
  ground.geometry.computeVertexNormals();

  // Misty ridgelines frame the clearing and create depth behind the trees.
  for(let layer=0;layer<3;layer++){
    const g=new T.PlaneGeometry(110,18,40,1),positions=g.attributes.position;
    for(let i=0;i<positions.count;i++){const x=positions.getX(i);if(positions.getY(i)>0)positions.setY(i,3+Math.sin(x*.12+layer)*2.8+Math.sin(x*.29)*1.5);else positions.setY(i,-4);}
    mesh(g,new T.MeshBasicMaterial({color:[0x607b78,0x486862,0x365a51][layer],side:T.DoubleSide}),0,0,-64+layer*12);
  }

  // Instanced fern-shaped foliage replaces the oversized solid polygon crowns.
  const leafCanvas=document.createElement('canvas');leafCanvas.width=leafCanvas.height=128;
  const lc=leafCanvas.getContext('2d');
  for(let i=0;i<15;i++){
    const x=64+(random()-.5)*85,y=10+random()*104,w=8+random()*12;
    lc.save();lc.translate(x,y);lc.rotate((random()-.5)*2);lc.fillStyle='#ffffff';lc.beginPath();lc.ellipse(0,0,w,w*.35,0,0,Math.PI*2);lc.fill();lc.restore();
  }
  const leafMap=new T.CanvasTexture(leafCanvas);
  const foliageMaterial=new T.MeshStandardMaterial({map:leafMap,alphaTest:.45,color:0x5f8050,side:T.DoubleSide,roughness:1});
  const leafTransforms=[],trunkTransforms=[],grassTransforms=[],treeBases=[];
  const dummy=new T.Object3D();
  function cylinderBetween(a,b,r1,r2){const delta=new T.Vector3().subVectors(b,a);dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.clone().normalize());dummy.scale.set(r1,delta.length(),r2);dummy.updateMatrix();trunkTransforms.push(dummy.matrix.clone());}
  for(let i=0;i<32;i++){
    const side=i%2?-1:1,x=side*(5.4+random()*16),z=-3-random()*33,h=6+random()*5;
    treeBases.push([x,z]);
    cylinderBetween(new T.Vector3(x,0,z),new T.Vector3(x+.25,h,z),.15,.15);
    for(let b=0;b<5;b++){
      const angle=b*2.4+i,end=new T.Vector3(x+Math.cos(angle)*1.7,h*.65+random()*1.4,z+Math.sin(angle)*1.7);
      cylinderBetween(new T.Vector3(x,h*.52,z),end,.055,.055);
      for(let j=0;j<12;j++){
        dummy.position.copy(end).add(new T.Vector3((random()-.5)*3,(random()-.5)*1.8,(random()-.5)*3));
        dummy.rotation.set(random()*Math.PI,random()*Math.PI,random()*Math.PI);dummy.scale.setScalar(1.1+random()*.9);dummy.updateMatrix();leafTransforms.push(dummy.matrix.clone());
      }
    }
  }
  const trunks=new T.InstancedMesh(new T.CylinderGeometry(.65,1,1,7),bark,trunkTransforms.length);trunkTransforms.forEach((m,i)=>trunks.setMatrixAt(i,m));add(trunks);
  const crowns=new T.InstancedMesh(new T.PlaneGeometry(1,1),foliageMaterial,leafTransforms.length);leafTransforms.forEach((m,i)=>{crowns.setMatrixAt(i,m);crowns.setColorAt(i,new T.Color().setHSL(.22+random()*.08,.24,.35+random()*.2));});add(crowns);
  const shadeCanvas=document.createElement('canvas');shadeCanvas.width=shadeCanvas.height=64;const sc=shadeCanvas.getContext('2d'),gradient=sc.createRadialGradient(32,32,0,32,32,32);gradient.addColorStop(0,'rgba(8,24,18,.55)');gradient.addColorStop(1,'rgba(8,24,18,0)');sc.fillStyle=gradient;sc.fillRect(0,0,64,64);
  const shades=new T.InstancedMesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:new T.CanvasTexture(shadeCanvas),transparent:true,depthWrite:false}),treeBases.length);
  treeBases.forEach(([x,z],i)=>{dummy.position.set(x,-.1,z);dummy.rotation.set(-Math.PI/2,0,0);dummy.scale.set(4,4,1);dummy.updateMatrix();shades.setMatrixAt(i,dummy.matrix);});add(shades);

  // Dense meadow edges use one draw call, leaving the stone terrace and pool clear.
  const blade=new T.PlaneGeometry(.12,.65,1,2),bp=blade.attributes.position;
  for(let i=0;i<bp.count;i++)if(bp.getY(i)>.3)bp.setX(i,0);
  for(let i=0;i<3200;i++){
    const x=(random()-.5)*45,z=5-random()*43;
    if(Math.hypot(x,z-.7)<4.5||Math.hypot((x-1)/1.15,(z+5.8)/.82)<4.3||Math.abs(x-1)<2.6&&z<-8&&z>-12)continue;
    dummy.position.set(x,.16,z);dummy.rotation.set(0,random()*Math.PI,(random()-.5)*.4);dummy.scale.set(.7+random()*.6,.5+random()*.6,1);dummy.updateMatrix();grassTransforms.push(dummy.matrix.clone());
  }
  const grasses=new T.InstancedMesh(blade,new T.MeshStandardMaterial({color:0x748d54,side:T.DoubleSide,roughness:1}),grassTransforms.length);grassTransforms.forEach((m,i)=>{grasses.setMatrixAt(i,m);grasses.setColorAt(i,new T.Color().setHSL(.19+random()*.1,.32,.32+random()*.25));});add(grasses);

  // A quiet turquoise pool with irregular, moving reflections instead of target-like rings.
  const water=new T.ShaderMaterial({uniforms:{time:{value:0}},vertexShader:'varying vec3 p;varying vec3 wp;void main(){p=position;wp=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*viewMatrix*vec4(wp,1.);}',fragmentShader:`varying vec3 p;varying vec3 wp;uniform float time;
    float hash(vec2 q){return fract(sin(dot(q,vec2(127.1,311.7)))*43758.5453);}
    float noise(vec2 q){vec2 i=floor(q),f=fract(q);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}
    void main(){vec2 uv=wp.xz;float n=noise(uv*1.8+vec2(time*.08,-time*.11));float fine=noise(uv*10.+n+time*.14);
    vec3 c=mix(vec3(.025,.18,.19),vec3(.15,.43,.39),n);
    float reflection=pow(max(0.,sin(uv.x*3.6+sin(uv.y*2.3+time*.22)+n*4.)),12.);
    c+=vec3(.42,.37,.21)*reflection*.38;c+=vec3(.3,.53,.45)*pow(fine,8.)*.35;
    float foam=1.-smoothstep(.15,.7,length(wp.xz-vec2(1.,-7.8)));c+=foam*vec3(.16,.24,.22);gl_FragColor=vec4(c,1.);}`});
  const pool=mesh(new T.CircleGeometry(3.55,80),water,1,.02,-5.8);pool.rotation.x=-Math.PI/2;pool.scale.y=.82;
  // Broad rounded banks and mossy cascade stones; no sharp pyramid ground scatter.
  const rockGeometry=new T.IcosahedronGeometry(1,2);
  for(let i=0;i<42;i++){
    const a=i*Math.PI*2/42,r=3.65+random()*.25;
    const rock=mesh(rockGeometry,i%3?stone:moss,1+Math.cos(a)*r,.04,-5.8+Math.sin(a)*r*.82);
    rock.scale.set(.32+random()*.24,.13+random()*.2,.28+random()*.2);rock.rotation.set(random()*.5,random()*6,random()*.2);
  }
  for(let i=0;i<14;i++){
    const x=-.6+random()*3.4,z=-8.9-random()*.5;
    const rock=mesh(rockGeometry,i%3?darkStone:moss,x,.35+random()*1.4,z);rock.scale.set(.65+random()*.45,.5+random()*.7,.55);
  }
  const falls=[];
  const cascadeMaterial=new T.ShaderMaterial({transparent:true,side:T.DoubleSide,depthWrite:false,uniforms:water.uniforms,vertexShader:'varying vec2 uvP;void main(){uvP=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`varying vec2 uvP;uniform float time;void main(){float streak=.5+.5*sin(uvP.x*83.+sin(uvP.y*14.-time*2.)*1.5);float foam=.5+.5*sin(uvP.y*47.-time*5.+uvP.x*8.);float edge=smoothstep(0.,.13,uvP.x)*smoothstep(0.,.13,1.-uvP.x);gl_FragColor=vec4(mix(vec3(.35,.65,.61),vec3(.85,.91,.82),streak*.6+foam*.2),edge*(.32+streak*.28));}`});
  mesh(new T.PlaneGeometry(1.4,2.6,10,16),cascadeMaterial,1,1.4,-8.45);
  mesh(new T.PlaneGeometry(.7,1.35,8,10),cascadeMaterial,1.5,.7,-7.95);
  for(let i=0;i<7;i++){const mist=halo(0xd8e7d9,.8+random()*.7,.5+random()*1.2,.15+random()*.25,-7.9+random()*.3);mist.material.opacity=.1;}

  // Limestone terrace, warm oak bridge, and brass-lined lanterns.
  mesh(new T.CylinderGeometry(4.2,4.3,.2,80),mat(0x8d9784),0,-.12,.7);
  for(const radius of [3.95,4.12]){const ring=mesh(new T.TorusGeometry(radius,.014,5,80),brass,0,-.012,.7);ring.rotation.x=Math.PI/2;}
  for(let i=0;i<15;i++){const plank=mesh(new T.BoxGeometry(1.15,.11,.28),mat(i%2?0x77634b:0x8c7658),1,.06,-1.5-i*.39);plank.rotation.y=Math.sin(i*.45)*.035;}
  for(const [x,z] of [[-3.3,-2],[4.5,-3],[-3,1.8],[4,-7.1]]){
    mesh(new T.CylinderGeometry(.2,.25,.12,16),stone,x,.03,z);
    mesh(new T.CylinderGeometry(.1,.12,.38,8),new T.MeshStandardMaterial({color:0xffd590,emissive:0xffbb59,emissiveIntensity:2.5}),x,.3,z);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;mesh(new T.CylinderGeometry(.012,.012,.4,4),brass,x+Math.cos(a)*.13,.31,z+Math.sin(a)*.13);}
    mesh(new T.ConeGeometry(.23,.14,8),brass,x,.56,z);halo(0xffc981,1.8,x,.3,z);
  }
  // The open gateway is deliberately light and sculptural so the waterfall stays visible.
  const arch=mesh(new T.TorusGeometry(2.05,.055,8,64,Math.PI),brass,1.1,3.2,-8.7);
  for(const x of [-.95,3.15])mesh(new T.CylinderGeometry(.055,.055,3.2,8),brass,x,1.6,-8.7);
  for(let i=0;i<11;i++){const a=i*Math.PI/10;halo(0xffd49a,.38,1.1+Math.cos(a)*2.05,3.2+Math.sin(a)*2.05,-8.65);}
  const completionGlow=halo(0xffdba2,7,1.1,3.1,-8.9);completionGlow.material.opacity=0;
  mesh(new T.SphereGeometry(.58,24,16),new T.MeshBasicMaterial({color:0xffe9be}),-5.3,7.5,-29);halo(0xffdca7,7,-5.3,7.5,-29.2);
  const motes=[];
  for(let i=0;i<24;i++){const x=(random()-.5)*16,y=.4+random()*4,z=-3-random()*15;const mote=halo(0xffe3a7,.07+random()*.07,x,y,z);motes.push({mesh:mote,x,y,z,seed:random()*8});}
  return {water,falls,motes,completionGlow};
}
