import {
  World, RayInteractable, Pressed, createComponent, createSystem, Types,
} from '@iwsdk/core';
import * as THREE from 'three';
import {
  SYMBOLS, createJourney, beginBreathing, advanceBreathing, collect,
  canReflect, openReflection, resetJourney, breathLabel,
} from './journey.mjs';

// Separate Meta IWSDK prototype; the public Meltdown Room remains unchanged.
const state = createJourney();
state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const info = document.getElementById('message');
const error = document.getElementById('error');
const container = document.getElementById('scene-container');
const Action = createComponent('GroundingAction', { code: { type: Types.Int16, default: 0 } });
const artifactMeshes = new Map();
let orb, titleCard, progressCard, reflectionCard, breathCard, motionCard;
let sparkles = [];
let elapsed = 0;
const tones = [0xe8d4a4, 0xb4cae1, 0xf5dc88, 0xc0aeea];
const actions = { breathe: 10, reflect: 11, replay: 12, motion: 13 };

function makeLabel(lines, width = 3, height = 0.56, options = {}) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024; canvas.height = Math.round(1024 * height / width);
  const context = canvas.getContext('2d');
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, transparent: true, depthWrite: false }),
  );
  mesh.userData.draw = (newLines, variant = {}) => {
    const w = canvas.width, h = canvas.height;
    context.clearRect(0, 0, w, h);
    context.fillStyle = variant.bg ?? options.bg ?? 'rgba(15, 42, 37, .92)';
    context.strokeStyle = variant.border ?? options.border ?? '#ceae78';
    context.lineWidth = 7;
    const radius = Math.min(42, h / 4);
    context.beginPath(); context.roundRect(6, 6, w - 12, h - 12, radius);
    context.fill(); context.stroke();
    const rows = Array.isArray(newLines) ? newLines : [newLines];
    const fontPx = variant.fontSize ?? options.fontSize ?? (rows.length === 1 ? 53 : 48);
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    rows.forEach((line, index) => {
      context.font = (index === 0 ? 'bold ' : 'normal ') + fontPx + 'px Georgia, serif';
      context.fillStyle = index === 0 ? '#fff6e1' : '#e5d9c0';
      context.fillText(line, w / 2, (index + .5) * h / rows.length, w - 55);
    });
    texture.needsUpdate = true;
  };
  mesh.userData.draw(lines);
  return mesh;
}
function position(mesh, x, y, z) { mesh.position.set(x, y, z); return mesh; }
function plant(world, x, z, height, color = 0x365b48) {
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.055, .085, height * .48, 8),
    new THREE.MeshStandardMaterial({ color: 0x604b38, roughness: 1 }));
  trunk.position.set(x, height * .24, z); world.createTransformEntity(trunk);
  for (let i = 0; i < 3; i += 1) {
    const crown = new THREE.Mesh(new THREE.ConeGeometry(.43 - i * .085, height * .47, 9),
      new THREE.MeshStandardMaterial({ color, roughness: 1 }));
    crown.position.set(x, height * (.51 + i * .145), z);
    world.createTransformEntity(crown);
  }
}
function buildGarden(world) {
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 72),
    new THREE.MeshStandardMaterial({ color: 0x244b3d, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -.055;
  world.createTransformEntity(floor);
  const path = new THREE.Mesh(new THREE.CircleGeometry(2.4, 64),
    new THREE.MeshStandardMaterial({ color: 0x67755a, roughness: 1 }));
  path.rotation.x = -Math.PI / 2;
  path.position.set(0, -.045, -2.1);
  world.createTransformEntity(path);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, .035, 8, 80),
    new THREE.MeshBasicMaterial({ color: 0xc7a675 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, -.015, -2.1);
  world.createTransformEntity(ring);
  [-6.0, -4.7, -3.7, 3.7, 4.7, 6.0].forEach((x, i) => {
    plant(world, x, -5.0 + (i % 2) * 1.0, 2.1 + (i % 3) * .3);
  });
  for (let i = 0; i < 24; i += 1) {
    const theta = i * 2.399963;
    const r = 3.3 + (i % 4) * .6;
    const bloom = new THREE.Mesh(new THREE.SphereGeometry(.075, 8, 8),
      new THREE.MeshBasicMaterial({ color: i % 2 ? 0xeec58d : 0xb2cbb5 }));
    bloom.position.set(Math.sin(theta) * r, .12, Math.cos(theta) * r - 1.3);
    world.createTransformEntity(bloom);
  }
  for (let i = 0; i < 18; i += 1) {
    const a = i * 2.4;
    const particle = new THREE.Mesh(new THREE.SphereGeometry(.02 + (i % 3) * .008, 6, 6),
      new THREE.MeshBasicMaterial({ color: 0xf6df9b, transparent: true, opacity: .65 }));
    const origin = new THREE.Vector3(Math.sin(a) * (1.8 + i % 3), .75 + (i % 5) * .38, -2.9 + Math.cos(a) * 1.35);
    particle.position.copy(origin);
    world.createTransformEntity(particle);
    sparkles.push({ mesh: particle, origin, seed: i });
  }
  const archMat = new THREE.MeshStandardMaterial({ color: 0x8a6a47, roughness: .85 });
  for (const x of [-2.75, 2.75]) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(.105, .11, 2.65, 12), archMat);
    post.position.set(x, 1.28, -3.65);
    world.createTransformEntity(post);
  }
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(.10, .10, 5.7, 12), archMat);
  beam.rotation.z = Math.PI / 2;
  beam.position.set(0, 2.62, -3.65); world.createTransformEntity(beam);
  const spot = new THREE.PointLight(0xf0d69b, 30, 9, 2);
  spot.position.set(0, 3.0, -2.3);
  world.createTransformEntity(spot);
  world.createTransformEntity(new THREE.AmbientLight(0xd3e7de, 2));
}
function interactive(world, mesh, code) {
  world.createTransformEntity(mesh)
    .addComponent(RayInteractable)
    .addComponent(Action, { code });
  return mesh;
}
function staticObject(world, mesh) { world.createTransformEntity(mesh); return mesh; }
function createSymbols(world) {
  const symbols = ['☾', '✦', '☼', '☄'];
  const xs = [-1.5, -.5, .5, 1.5];
  SYMBOLS.forEach((symbol, index) => {
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(.3, .34, .20, 24),
      new THREE.MeshStandardMaterial({ color: 0x826849, roughness: .86 }));
    position(pedestal, xs[index], .87, -2.1);
    staticObject(world, pedestal);
    const glyph = makeLabel([symbols[index], symbol], .78, .68, {
      fontSize: 72, bg: '#1e3e37', border: '#c9b285',
    });
    position(glyph, xs[index], 1.42, -2.1);
    interactive(world, glyph, index + 1);
    artifactMeshes.set(symbol, glyph);
    const glow = new THREE.Mesh(new THREE.TorusGeometry(.34, .018, 8, 48),
      new THREE.MeshBasicMaterial({ color: tones[index] }));
    glow.position.set(xs[index], 1.42, -2.15);
    staticObject(world, glow);
  });
}
function refresh() {
  const count = state.collected.length;
  progressCard.userData.draw(['Celestial symbols: ' + count + ' / 4',
    state.breathCompleted ? 'Breathing practice complete' : breathLabel(state)], { fontSize: 46 });
  breathCard.userData.draw(state.breathCompleted ? 'BREATHING ✓' : 'BREATHE');
  reflectionCard.userData.draw(state.reflectionOpen ? 'REFLECTION OPEN' :
    canReflect(state) ? 'UNLOCK 11:11' : '11:11 · LOCKED',
    { bg: canReflect(state) ? '#644c28' : '#213b36', fontSize: 40 });
  motionCard.userData.draw(state.reducedMotion ? 'MOTION: OFF' : 'MOTION: ON', { fontSize: 38 });
  if (state.reflectionOpen) {
    titleCard.userData.draw(['11:11 · A quiet moment', 'You are allowed to begin again.'], { fontSize: 52 });
    info.textContent = 'Reflection unlocked: “You are allowed to begin again.”';
  } else if (canReflect(state)) {
    titleCard.userData.draw(['All four symbols found', 'Your 11:11 reflection is ready'], { fontSize: 48 });
    info.textContent = 'Everything is complete. Select UNLOCK 11:11.';
  } else {
    titleCard.userData.draw(['GROUNDING SQUARE', 'Your space. Your pace.'], { fontSize: 56 });
    info.textContent = 'Breathing: ' + (state.breathCompleted ? 'done' : state.breathing ? 'in progress' : 'not started') + '. Symbols: ' + count + '/4. Select the glowing controls with a hand pinch or mouse click.';
  }
  SYMBOLS.forEach((symbol, index) => {
    artifactMeshes.get(symbol).userData.draw(
      [state.collected.includes(symbol) ? '✓' : ['☾', '✦', '☼', '☄'][index], symbol],
      { bg: state.collected.includes(symbol) ? '#4b6d58' : '#1e3e37', fontSize: 72 });
  });
}
function execute(code) {
  if (code >= 1 && code <= 4) collect(state, SYMBOLS[code - 1]);
  else if (code === actions.breathe) beginBreathing(state);
  else if (code === actions.reflect) openReflection(state);
  else if (code === actions.replay) resetJourney(state);
  else if (code === actions.motion) state.reducedMotion = !state.reducedMotion;
  refresh();
}
class JourneySystem extends createSystem({
  pressed: { required: [Action, Pressed] },
}) {
  init() {
    this.queries.pressed.subscribe('qualify', (entity) => {
      const action = entity.getComponent(Action);
      if (action) execute(action.code);
    });
  }
  update(delta) {
    const cappedDelta = Math.min(Math.max(delta, 0), .1);
    elapsed += cappedDelta;
    if (state.breathing && advanceBreathing(state, cappedDelta)) refresh();
    if (state.breathing) {
      if (!state.reducedMotion) {
        const phase = (state.breathElapsed % 8) / 8;
        orb.scale.setScalar(.9 + .23 * (1 - Math.cos(2 * Math.PI * phase)));
      } else orb.scale.setScalar(1);
      if (Math.floor(state.breathElapsed) !== Math.floor(state.breathElapsed - cappedDelta)) refresh();
    } else orb.scale.setScalar(1);
    if (!state.reducedMotion) {
      sparkles.forEach(({ mesh, origin, seed }) => {
        mesh.position.y = origin.y + Math.sin(elapsed * .8 + seed) * .11;
      });
    } else sparkles.forEach(({ mesh, origin }) => mesh.position.copy(origin));
  }
}
async function start() {
  const projectOptions = (await import('virtual:iwsdk-project')).default;
  const world = await World.create(container, projectOptions);
  world.registerComponent(Action);
  buildGarden(world);
  createSymbols(world);
  titleCard = staticObject(world, position(makeLabel(['GROUNDING SQUARE', 'Your space. Your pace.'], 3.55, .69,
    { fontSize: 56 }), 0, 2.16, -2.7));
  progressCard = staticObject(world, position(makeLabel(['Celestial symbols: 0 / 4', 'Choose BREATHE to begin'], 3.05, .50,
    { fontSize: 46 }), 0, .47, -1.95));
  const breathOrbMaterial = new THREE.MeshStandardMaterial({
    color: 0xc7dcba, emissive: 0x8dbda5, emissiveIntensity: 1.1, roughness: .35,
  });
  orb = staticObject(world, position(new THREE.Mesh(new THREE.IcosahedronGeometry(.25, 2), breathOrbMaterial), 0, 1.43, -2.7));
  const buttons = [
    { code: actions.breathe, x: -1.25, text: 'BREATHE' },
    { code: actions.reflect, x: 0, text: '11:11 · LOCKED' },
    { code: actions.replay, x: 1.25, text: 'START OVER' },
  ];
  buttons.forEach(({ code, x, text }) => {
    const button = position(makeLabel(text, 1.13, .45, { fontSize: 42, bg: '#294b3e' }), x, .98, -1.48);
    interactive(world, button, code);
    if (code === actions.breathe) breathCard = button;
    if (code === actions.reflect) reflectionCard = button;
  });
  motionCard = interactive(world,
    position(makeLabel('MOTION: ON', .92, .31, { fontSize: 38, bg: '#344b49' }), 0, .28, -1.52),
    actions.motion);
  world.registerSystem(JourneySystem);
  refresh();
}
start().catch((cause) => {
  console.error('Grounding Square initialization failed', cause);
  error.hidden = false;
  error.textContent = 'VR scene could not load. Check installation and browser support.';
  info.textContent = 'Please reload after checking the browser console.';
});
