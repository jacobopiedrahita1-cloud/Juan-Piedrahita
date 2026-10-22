import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  GAS_PATH_A, GAS_PATH_B, RESIDUE_KINDS, makeBalloon, makeDigestateTray, makeDigester,
  makeFloor, makeResidue, makeTubes, makeTurbine, rand, softDotTexture,
} from './objects';

/** Estado visual de cada paso de la narrativa (0 = hero, 1..7 = capítulos). */
interface StepState {
  pos: [number, number, number];
  look: [number, number, number];
  shift: number;          // desplazamiento horizontal del encuadre (escritorio)
  my?: number;            // desplazamiento vertical en pantallas angostas (por defecto 0.22)
  residues: 'home' | 'spread' | 'feed' | 'orbit';
  gas: number;            // intensidad del flujo de gas 0..1
  turbine: number;        // velocidad de la turbina 0..1
  balloon: number;        // llenado del globo 0..1
  bubbles: number;
  microbes: number;
  digestate: number;
}

const STEPS: StepState[] = [
  { pos: [1.6, 2.2, 13.2], look: [1.2, 0.9, 0], shift: 0.25, my: 0.27, residues: 'home', gas: 0.7, turbine: 0.45, balloon: 0.9, bubbles: 0.5, microbes: 0, digestate: 0 },
  { pos: [0.4, 1.3, 8.2], look: [0.2, 0.5, 0], shift: 0.22, residues: 'spread', gas: 0.15, turbine: 0.1, balloon: 0.55, bubbles: 0.3, microbes: 0, digestate: 0 },
  { pos: [-0.4, 4.4, 5.6], look: [0, 0.7, 0], shift: -0.2, residues: 'feed', gas: 0.15, turbine: 0.1, balloon: 0.55, bubbles: 0.5, microbes: 0.2, digestate: 0 },
  { pos: [0.5, 0.1, 4.3], look: [0, -0.35, 0], shift: 0.24, residues: 'feed', gas: 0.35, turbine: 0.1, balloon: 0.6, bubbles: 1, microbes: 1, digestate: 0 },
  { pos: [0.7, 2.3, 8.2], look: [1.9, 1.85, -0.2], shift: -0.2, residues: 'feed', gas: 1, turbine: 0.15, balloon: 1, bubbles: 0.7, microbes: 0.3, digestate: 0 },
  { pos: [3.9, 0.4, 4.7], look: [3.9, -0.7, 0.5], shift: 0.24, residues: 'feed', gas: 1, turbine: 1, balloon: 0.85, bubbles: 0.5, microbes: 0, digestate: 0 },
  { pos: [-1.3, 0.25, 4.9], look: [-1.8, -1.2, 0.5], shift: -0.2, residues: 'feed', gas: 0.3, turbine: 0.2, balloon: 0.85, bubbles: 0.3, microbes: 0, digestate: 1 },
  { pos: [1.1, 3.4, 15.5], look: [1.0, 2.6, 0], shift: 0, my: -0.05, residues: 'orbit', gas: 0.8, turbine: 0.6, balloon: 0.95, bubbles: 0.5, microbes: 0, digestate: 0.4 },
];

interface Residue {
  obj: THREE.Object3D;
  home: THREE.Vector3;
  spread: THREE.Vector3;
  feed: THREE.Vector3;
  orbitA: number;
  orbitR: number;
  orbitY: number;
  spin: THREE.Vector3;
  phase: number;
  scale: number;
  curScale: number;
}

export interface SceneController {
  setStep(step: number): void;
  setActive(active: boolean): void;
  quality: 'high' | 'low';
}

export function createScene(canvas: HTMLCanvasElement, opts: { reducedMotion: boolean; onReady: () => void }): SceneController {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const small = () => innerWidth < 900;
  const quality: 'high' | 'low' = coarse || innerWidth < 760 || (navigator.hardwareConcurrency ?? 8) <= 4 ? 'low' : 'high';

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  let dprCap = quality === 'high' ? 2 : 1.5;
  renderer.setPixelRatio(Math.min(devicePixelRatio, dprCap));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.55;
  scene.fog = new THREE.Fog('#06140F', 14, 30);

  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 80);

  // Luces
  scene.add(new THREE.HemisphereLight('#DFFFEF', '#0B2219', 0.7));
  const key = new THREE.DirectionalLight('#FFF3DF', 2.1);
  key.position.set(4, 7, 6);
  const rim = new THREE.DirectionalLight('#B6F24A', 1.6);
  rim.position.set(-6, 3, -5);
  const fill = new THREE.DirectionalLight('#7FE0B5', 0.5);
  fill.position.set(-3, -1, 6);
  scene.add(key, rim, fill);

  // Objetos
  const world = new THREE.Group();
  scene.add(world);
  const digester = makeDigester(quality);
  const balloon = makeBalloon(quality);
  const turbine = makeTurbine();
  const tray = makeDigestateTray();
  world.add(digester.group, makeTubes(quality), balloon.group, turbine.group, tray.group, makeFloor());

  // Residuos flotantes
  const residues: Residue[] = [];
  const nRes = quality === 'high' ? 18 : 11;
  const center = new THREE.Vector3(1.0, 0.9, 0);
  for (let i = 0; i < nRes; i++) {
    const kind = RESIDUE_KINDS[i % RESIDUE_KINDS.length];
    const obj = makeResidue(kind, quality);
    // Distribuidos a ambos lados, evitando el centro del sistema
    const side = i % 2 === 0 ? -1 : 1;
    const home = new THREE.Vector3(
      side < 0 ? rand(-3.4, -1.7) : rand(4.6, 6.4),
      rand(-1.0, 3.6),
      side < 0 ? rand(-3.0, 0.6) : rand(-2.2, 2.2),
    );
    const a = (i / nRes) * Math.PI * 2;
    const spread = new THREE.Vector3(Math.cos(a) * rand(2.4, 3.6) + 0.1, Math.sin(a) * rand(1.6, 2.2) + 0.7, rand(0.6, 2.4));
    const feed = new THREE.Vector3(rand(-0.4, 0.4), rand(-0.6, 0.6), rand(-0.4, 0.4));
    const scale = rand(0.8, 1.25);
    obj.position.copy(home);
    obj.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
    obj.scale.setScalar(scale);
    world.add(obj);
    residues.push({
      obj, home, spread, feed, scale, curScale: scale,
      orbitA: a, orbitR: rand(5.2, 6.4), orbitY: rand(-0.6, 0.6),
      spin: new THREE.Vector3(rand(-0.4, 0.4), rand(-0.5, 0.5), rand(-0.3, 0.3)),
      phase: rand(0, Math.PI * 2),
    });
  }

  // Partículas
  const dot = softDotTexture();
  const mkPoints = (n: number, color: string, size: number, opacity: number, additive = true) => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    const mat = new THREE.PointsMaterial({ color, size, map: dot, transparent: true, opacity, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending, sizeAttenuation: true });
    const pts = new THREE.Points(geo, mat);
    pts.frustumCulled = false;
    pts.renderOrder = 6;
    return pts;
  };

  // Gas recorriendo el circuito
  const nGas = quality === 'high' ? 170 : 80;
  const gas = mkPoints(nGas, '#C6FF5A', 0.13, 0.9);
  const gasData = Array.from({ length: nGas }, (_, i) => ({ t: Math.random(), path: i % 3 === 0 ? 1 : 0, speed: rand(0.06, 0.11), j: new THREE.Vector3(rand(-1, 1), rand(-1, 1), rand(-1, 1)).multiplyScalar(0.03) }));
  world.add(gas);

  // Burbujas en la mezcla
  const nBub = quality === 'high' ? 70 : 34;
  const bubbles = mkPoints(nBub, '#FFF4D6', 0.07, 0.8);
  const bubData = Array.from({ length: nBub }, () => ({ a: rand(0, 6.28), r: rand(0, 0.85), y: rand(digester.liquidBox.y0, digester.liquidBox.y1), v: rand(0.25, 0.6) }));
  world.add(bubbles);

  // "Microorganismos" conceptuales
  const nMic = quality === 'high' ? 110 : 50;
  const microbes = mkPoints(nMic, '#9BFF6E', 0.06, 0);
  const micData = Array.from({ length: nMic }, () => ({ p: new THREE.Vector3(rand(-0.8, 0.8), rand(-1.3, 0.75), rand(-0.8, 0.8)), ph: rand(0, 6.28) }));
  world.add(microbes);

  // Esporas ambientales
  const nSpore = quality === 'high' ? 260 : 110;
  const spores = mkPoints(nSpore, '#B6F24A', 0.05, 0.45);
  const sporeData = Array.from({ length: nSpore }, () => ({ p: new THREE.Vector3(rand(-9, 11), rand(-2, 7), rand(-8, 4)), ph: rand(0, 6.28), s: rand(0.1, 0.35) }));
  scene.add(spores);

  // ---------- Estado e interpolación ----------
  const cur = {
    pos: new THREE.Vector3(...STEPS[0].pos), look: new THREE.Vector3(...STEPS[0].look), shift: STEPS[0].shift, my: STEPS[0].my ?? 0.22,
    gas: 0.7, turbine: 0.45, balloon: 0.9, bubbles: 0.5, microbes: 0, digestate: 0,
  };
  let step = 0;
  let target = STEPS[0];
  const pointer = new THREE.Vector2();
  const pointerCur = new THREE.Vector2();
  let width = 1, height = 1;

  function framed(s: StepState) {
    const pos = new THREE.Vector3(...s.pos), look = new THREE.Vector3(...s.look);
    if (small()) {
      // En vertical alejamos la cámara para que el sistema quepa en el ancho
      const k = Math.min(1.9, Math.max(1.15, 1.25 / (width / height)));
      pos.sub(look).multiplyScalar(k).add(look);
    }
    return { pos, look, shift: small() ? 0 : s.shift, my: small() ? s.my ?? 0.22 : 0 };
  }

  function resize() {
    width = innerWidth; height = innerHeight;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (opts.reducedMotion) snap();
    requestRender();
  }

  function applyViewOffset() {
    const sx = -cur.shift * width;
    const sy = height * cur.my;
    camera.setViewOffset(width, height, sx, sy, width, height);
  }

  function snap() {
    const f = framed(target);
    cur.pos.copy(f.pos); cur.look.copy(f.look); cur.shift = f.shift; cur.my = f.my;
    cur.gas = target.gas; cur.turbine = target.turbine; cur.balloon = target.balloon;
    cur.bubbles = target.bubbles; cur.microbes = target.microbes; cur.digestate = target.digestate;
  }

  const tmp = new THREE.Vector3();
  let time = 0;
  function update(dt: number) {
    const motion = opts.reducedMotion ? 0 : 1;
    time += dt * motion;
    const f = framed(target);
    const k = opts.reducedMotion ? 1 : 1 - Math.exp(-dt * 2.6);
    const kv = opts.reducedMotion ? 1 : 1 - Math.exp(-dt * 2.0);
    cur.pos.lerp(f.pos, k);
    cur.look.lerp(f.look, k);
    cur.shift += (f.shift - cur.shift) * k;
    cur.my += (f.my - cur.my) * k;
    cur.gas += (target.gas - cur.gas) * kv;
    cur.turbine += (target.turbine - cur.turbine) * kv;
    cur.balloon += (target.balloon - cur.balloon) * kv;
    cur.bubbles += (target.bubbles - cur.bubbles) * kv;
    cur.microbes += (target.microbes - cur.microbes) * kv;
    cur.digestate += (target.digestate - cur.digestate) * kv;

    // Cámara con leve reacción al cursor
    pointerCur.lerp(pointer, opts.reducedMotion ? 0 : 1 - Math.exp(-dt * 3));
    camera.position.copy(cur.pos).add(tmp.set(pointerCur.x * 0.45, -pointerCur.y * 0.28, 0));
    camera.lookAt(cur.look);
    applyViewOffset();

    // Residuos
    for (const r of residues) {
      let goal: THREE.Vector3;
      let sGoal = r.scale;
      switch (target.residues) {
        case 'home': goal = tmp.copy(r.home); break;
        case 'spread': goal = tmp.copy(r.spread); break;
        case 'feed': {
          goal = tmp.copy(r.feed).add(digester.outlet).setY(digester.outlet.y + 0.3 + r.feed.y);
          const d = r.obj.position.distanceTo(goal);
          sGoal = d < 1.2 ? 0 : r.scale * 0.7;
          break;
        }
        case 'orbit': {
          const a = r.orbitA + time * 0.12;
          goal = tmp.set(center.x + Math.cos(a) * r.orbitR, center.y + r.orbitY + Math.sin(a * 2) * 0.3, center.z + Math.sin(a) * r.orbitR * 0.45);
          break;
        }
      }
      if (motion) goal.y += Math.sin(time * 0.8 + r.phase) * 0.18;
      const kr = opts.reducedMotion ? 1 : 1 - Math.exp(-dt * (target.residues === 'feed' ? 1.4 : 1.1));
      r.obj.position.lerp(goal, kr);
      r.curScale += (sGoal - r.curScale) * (opts.reducedMotion ? 1 : 1 - Math.exp(-dt * 2.2));
      r.obj.scale.setScalar(Math.max(r.curScale, 0.0001));
      r.obj.visible = r.curScale > 0.01;
      r.obj.rotation.x += r.spin.x * dt * motion;
      r.obj.rotation.y += r.spin.y * dt * motion;
      r.obj.rotation.z += r.spin.z * dt * motion;
    }

    // Trozos dentro de la mezcla
    for (const c of digester.chunks) {
      const b = c.userData.base as THREE.Vector3;
      c.position.y = b.y + Math.sin(time * 0.6 + c.userData.phase) * 0.06;
      c.rotation.y += dt * 0.08 * motion;
    }

    // Gas
    const gp = gas.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < nGas; i++) {
      const d = gasData[i];
      d.t += dt * d.speed * (0.35 + cur.gas * 1.4) * motion;
      if (d.t > 1) d.t -= 1;
      const p = (d.path === 0 ? GAS_PATH_A : GAS_PATH_B).getPointAt(d.t, tmp).add(d.j);
      gp.setXYZ(i, p.x, p.y, p.z);
    }
    gp.needsUpdate = true;
    (gas.material as THREE.PointsMaterial).opacity = 0.15 + cur.gas * 0.85;

    // Burbujas
    const bp = bubbles.geometry.attributes.position as THREE.BufferAttribute;
    const lb = digester.liquidBox;
    for (let i = 0; i < nBub; i++) {
      const d = bubData[i];
      d.y += dt * d.v * (0.4 + cur.bubbles) * motion;
      if (d.y > lb.y1 - 0.02) { d.y = lb.y0 + 0.3; d.a = rand(0, 6.28); d.r = rand(0, 0.85); }
      bp.setXYZ(i, Math.cos(d.a) * d.r + Math.sin(time * 3 + i) * 0.015, d.y, Math.sin(d.a) * d.r);
    }
    bp.needsUpdate = true;
    (bubbles.material as THREE.PointsMaterial).opacity = 0.25 + cur.bubbles * 0.6;

    // Microorganismos
    const mp = microbes.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < nMic; i++) {
      const d = micData[i];
      mp.setXYZ(i, d.p.x + Math.sin(time * 1.3 + d.ph) * 0.05, d.p.y + Math.cos(time * 1.1 + d.ph) * 0.05, d.p.z + Math.sin(time * 0.9 + d.ph * 2) * 0.05);
    }
    mp.needsUpdate = true;
    (microbes.material as THREE.PointsMaterial).opacity = cur.microbes * 0.95;

    // Esporas
    const sp = spores.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < nSpore; i++) {
      const d = sporeData[i];
      sp.setXYZ(i, d.p.x + Math.sin(time * d.s + d.ph) * 0.6, d.p.y + Math.sin(time * d.s * 0.7 + d.ph * 2) * 0.4, d.p.z);
    }
    sp.needsUpdate = true;

    // Globo, turbina, digestato
    const fill = 0.62 + cur.balloon * 0.38;
    balloon.body.scale.set(fill, 0.75 + cur.balloon * 0.25, fill);
    balloon.body.position.y = 0.1 + Math.sin(time * 1.2) * 0.02 * motion;
    turbine.rotor.rotation.z -= dt * (0.4 + cur.turbine * 7) * motion;
    (turbine.holoMats[0] as THREE.MeshStandardMaterial).emissiveIntensity = 0.35 + cur.turbine * 0.6 + Math.sin(time * 4) * 0.05 * motion;
    digester.sludgeMat.emissiveIntensity = cur.digestate * (0.18 + Math.sin(time * 2.4) * 0.06 * motion);
    tray.sludgeMat.emissiveIntensity = cur.digestate * (0.25 + Math.sin(time * 2.4) * 0.08 * motion);
    digester.innerLight.intensity = 1.6 + cur.bubbles * 2.2 + Math.sin(time * 1.7) * 0.3 * motion;
  }

  // ---------- Bucle ----------
  let active = true;
  let raf = 0;
  let last = performance.now();
  let pendingStatic = false;
  let frames = 0, slowAccum = 0, downgraded = false;

  function frame(now: number) {
    raf = 0;
    const dt = Math.max(0, Math.min(0.1, (now - last) / 1000));
    last = now;
    update(dt);
    renderer.render(scene, camera);
    // Si el equipo va lento, reducimos resolución una vez
    if (!downgraded && frames < 150) {
      frames++;
      if (dt > 0.034) slowAccum++;
      if (frames === 150 && slowAccum > 70) { downgraded = true; dprCap = 1; renderer.setPixelRatio(1); resize(); }
    }
    if (active && !opts.reducedMotion && !document.hidden) raf = requestAnimationFrame(frame);
  }
  function start() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }
  function requestRender() {
    if (opts.reducedMotion || !active) {
      if (pendingStatic) return;
      pendingStatic = true;
      requestAnimationFrame(() => { pendingStatic = false; update(0.016); renderer.render(scene, camera); });
    }
  }

  addEventListener('resize', resize);
  addEventListener('pointermove', (e) => {
    if (coarse) return;
    pointer.set(e.clientX / innerWidth * 2 - 1, e.clientY / innerHeight * 2 - 1);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && active && !opts.reducedMotion) start(); });

  resize();
  snap();
  // Compilar antes de mostrar evita tirones en el primer frame
  renderer.compile(scene, camera);
  update(0.016);
  renderer.render(scene, camera);
  if (!opts.reducedMotion) start();
  opts.onReady();

  return {
    quality,
    setStep(s: number) {
      const n = Math.max(0, Math.min(STEPS.length - 1, s));
      if (n === step) return;
      step = n;
      target = STEPS[n];
      if (opts.reducedMotion) { snap(); requestRender(); }
    },
    setActive(a: boolean) {
      if (a === active) return;
      active = a;
      if (a && !opts.reducedMotion) start();
      else if (a) requestRender();
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    },
  };
}

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}
