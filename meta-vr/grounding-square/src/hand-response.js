import * as T from 'three';
// Render only measured XR hand joints; no simulated hand is shown in desktop mode.
export function createHandResponse(world,glowMap){
 const coreMat=new T.MeshBasicMaterial({color:0xb9ffff,transparent:true,opacity:.8,depthWrite:false,blending:T.AdditiveBlending});
 const boneMat=new T.MeshBasicMaterial({color:0x48cbd5,transparent:true,opacity:.45,depthWrite:false,blending:T.AdditiveBlending});
 const joints=new T.InstancedMesh(new T.SphereGeometry(1,10,8),coreMat,50),bones=new T.InstancedMesh(new T.CylinderGeometry(1,1,1,6),boneMat,48);joints.count=bones.count=0;joints.frustumCulled=bones.frustumCulled=false;world.scene.add(joints,bones);
 const sparkGeometry=new T.BufferGeometry();sparkGeometry.setAttribute('position',new T.Float32BufferAttribute(new Float32Array(150),3));const glow=new T.Points(sparkGeometry,new T.PointsMaterial({color:0x47dce7,size:.07,map:glowMap,transparent:true,opacity:.45,blending:T.AdditiveBlending,depthWrite:false}));glow.frustumCulled=false;world.scene.add(glow);
 const dummy=new T.Object3D(),up=new T.Vector3(0,1,0);let visible=0;
 const chains=[['wrist','thumb-metacarpal','thumb-phalanx-proximal','thumb-phalanx-distal','thumb-tip'],...['index','middle','ring','pinky'].map(f=>['wrist',f+'-finger-metacarpal',f+'-finger-phalanx-proximal',f+'-finger-phalanx-intermediate',f+'-finger-phalanx-distal',f+'-finger-tip'])];
 return {get visibleJoints(){return visible;},update(pulse=0){
  let ji=0,bi=0;const session=world.renderer.xr.getSession(),frame=world.renderer.xr.getFrame?.(),ref=world.renderer.xr.getReferenceSpace();
  if(session&&frame&&ref){for(const source of session.inputSources){if(!source.hand)continue;const poses=new Map();for(const [name,space] of source.hand){const pose=frame.getJointPose(space,ref);if(!pose||ji>=50)continue;const p=new T.Vector3().copy(pose.transform.position);poses.set(name,p);dummy.position.copy(p);dummy.quaternion.identity();dummy.scale.setScalar(Math.max(.006,pose.radius||.008));dummy.updateMatrix();joints.setMatrixAt(ji,dummy.matrix);sparkGeometry.attributes.position.setXYZ(ji,p.x,p.y,p.z);ji++;}for(const chain of chains)for(let i=1;i<chain.length;i++){const a=poses.get(chain[i-1]),b=poses.get(chain[i]);if(!a||!b||bi>=48)continue;const d=b.clone().sub(a);dummy.position.copy(a).add(b).multiplyScalar(.5);dummy.quaternion.setFromUnitVectors(up,d.clone().normalize());dummy.scale.set(.0035,d.length(),.0035);dummy.updateMatrix();bones.setMatrixAt(bi++,dummy.matrix);}}}
  visible=ji;joints.count=ji;bones.count=bi;glow.visible=ji>0;sparkGeometry.setDrawRange(0,ji);sparkGeometry.attributes.position.needsUpdate=true;joints.instanceMatrix.needsUpdate=bones.instanceMatrix.needsUpdate=true;coreMat.opacity=.65+pulse*.3;boneMat.opacity=.35+pulse*.35;glow.material.opacity=.28+pulse*.35;glow.material.size=.06+pulse*.025;
 }};
}
