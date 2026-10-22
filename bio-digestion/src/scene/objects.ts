import * as THREE from 'three';

// Geometrías procedurales: nada se descarga, todo funciona sin internet.

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Textura de ruido/manchas pintada en canvas. */
function spottedTexture(base: string, spot: string, count: number, size = 256, poreAlpha = 0): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  g.fillStyle = base;
  g.fillRect(0, 0, size, size);
  for (let i = 0; i < count; i++) {
    g.globalAlpha = rand(0.08, 0.35);
    g.fillStyle = spot;
    g.beginPath();
    g.ellipse(rand(0, size), rand(0, size), rand(1, 7), rand(1, 5), rand(0, Math.PI), 0, Math.PI * 2);
    g.fill();
  }
  if (poreAlpha > 0) {
    g.globalAlpha = poreAlpha;
    g.fillStyle = '#000';
    for (let i = 0; i < 900; i++) g.fillRect(rand(0, size), rand(0, size), 1.4, 1.4);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

function citrusFaceTexture(rind: string, flesh: string, pith: string, segments: number): THREE.CanvasTexture {
  const s = 256, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  const r = s / 2;
  g.fillStyle = rind; g.fillRect(0, 0, s, s);
  g.fillStyle = pith; g.beginPath(); g.arc(r, r, r * 0.9, 0, Math.PI * 2); g.fill();
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2 + 0.05, a1 = ((i + 1) / segments) * Math.PI * 2 - 0.05;
    g.fillStyle = flesh;
    g.beginPath(); g.moveTo(r, r); g.arc(r, r, r * 0.82, a0, a1); g.closePath(); g.fill();
    g.globalAlpha = 0.25; g.fillStyle = '#fff';
    for (let k = 0; k < 14; k++) {
      const a = rand(a0, a1), d = rand(0.2, 0.75) * r;
      g.beginPath(); g.ellipse(r + Math.cos(a) * d, r + Math.sin(a) * d, 2, 7, a, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
  }
  g.fillStyle = pith; g.beginPath(); g.arc(r, r, r * 0.08, 0, Math.PI * 2); g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Cinta curva genérica: sirve para hojas, cáscaras de plátano y lechuga. */
function ribbon(
  path: (t: number) => THREE.Vector3,
  width: (t: number) => number,
  opts: { segT?: number; segU?: number; curl?: number; wave?: number } = {},
): THREE.BufferGeometry {
  const segT = opts.segT ?? 18, segU = opts.segU ?? 6, curl = opts.curl ?? 0.25, wave = opts.wave ?? 0;
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  const up = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i <= segT; i++) {
    const t = i / segT;
    const p = path(t);
    const tan = path(Math.min(1, t + 0.01)).sub(path(Math.max(0, t - 0.01))).normalize();
    const side = new THREE.Vector3().crossVectors(tan, up).normalize();
    const w = width(t);
    for (let j = 0; j <= segU; j++) {
      const u = j / segU * 2 - 1;
      const edge = Math.abs(u);
      const v = p.clone()
        .addScaledVector(side, u * w)
        .addScaledVector(up, curl * u * u * w + wave * Math.sin(t * 22 + u * 3) * edge * w * 0.4);
      pos.push(v.x, v.y, v.z);
      uv.push(j / segU, t);
    }
  }
  for (let i = 0; i < segT; i++) for (let j = 0; j < segU; j++) {
    const a = i * (segU + 1) + j, b = a + segU + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

// ---------- Materiales compartidos ----------
let M: ReturnType<typeof makeMaterials> | null = null;
function makeMaterials() {
  const orangeTex = spottedTexture('#F08A1C', '#C85E0A', 260, 256, 0.18);
  return {
    orangeOuter: new THREE.MeshStandardMaterial({ map: orangeTex, bumpMap: orangeTex, bumpScale: 0.6, roughness: 0.55, side: THREE.FrontSide }),
    orangeInner: new THREE.MeshStandardMaterial({ color: '#F6E6C4', roughness: 0.85, side: THREE.BackSide }),
    sliceFace: new THREE.MeshStandardMaterial({ map: citrusFaceTexture('#E8780F', '#FFA62B', '#FBE7C0', 10), roughness: 0.4, emissive: '#5a2a00', emissiveIntensity: 0.12 }),
    sliceRind: new THREE.MeshStandardMaterial({ map: orangeTex, roughness: 0.5 }),
    banana: new THREE.MeshStandardMaterial({ map: spottedTexture('#F4D04A', '#6B4513', 90), roughness: 0.6, side: THREE.DoubleSide }),
    bananaStem: new THREE.MeshStandardMaterial({ color: '#5E4A1E', roughness: 0.8 }),
    leaf: new THREE.MeshStandardMaterial({ map: spottedTexture('#2E9E4F', '#1B6B33', 140), roughness: 0.5, side: THREE.DoubleSide }),
    lettuce: new THREE.MeshStandardMaterial({ map: spottedTexture('#9BD45A', '#5FA634', 120), roughness: 0.6, side: THREE.DoubleSide }),
    carrotFace: new THREE.MeshStandardMaterial({ map: citrusFaceTexture('#E0661A', '#F28A2E', '#F7A64C', 1), roughness: 0.5 }),
    carrotRind: new THREE.MeshStandardMaterial({ color: '#D9581A', roughness: 0.6 }),
    seed: new THREE.MeshStandardMaterial({ color: '#3B2A16', roughness: 0.5 }),
    vein: new THREE.MeshStandardMaterial({ color: '#CDEFA0', roughness: 0.6 }),
  };
}
const mats = () => (M ??= makeMaterials());

// ---------- Residuos ----------
export type ResidueKind = 'orangePeel' | 'orangeSlice' | 'banana' | 'leaf' | 'carrot' | 'lettuce';
export const RESIDUE_KINDS: ResidueKind[] = ['orangePeel', 'banana', 'leaf', 'orangeSlice', 'carrot', 'lettuce'];

export function makeResidue(kind: ResidueKind, detail: 'high' | 'low'): THREE.Object3D {
  const m = mats();
  const g = new THREE.Group();
  const seg = detail === 'high' ? 1 : 0.6;
  switch (kind) {
    case 'orangePeel': {
      const geo = new THREE.SphereGeometry(0.34, Math.round(22 * seg), Math.round(14 * seg), rand(0, 6), rand(1.4, 2.1), rand(0.5, 0.8), rand(1.1, 1.6));
      g.add(new THREE.Mesh(geo, m.orangeOuter), new THREE.Mesh(geo, m.orangeInner));
      break;
    }
    case 'orangeSlice': {
      const geo = new THREE.CylinderGeometry(0.3, 0.3, 0.07, Math.round(28 * seg));
      const mesh = new THREE.Mesh(geo, [m.sliceRind, m.sliceFace, m.sliceFace]);
      if (Math.random() > 0.5) mesh.scale.set(1, 1, 1); // rodaja completa
      g.add(mesh);
      break;
    }
    case 'carrot': {
      const geo = new THREE.CylinderGeometry(0.17, 0.15, 0.09, Math.round(22 * seg));
      g.add(new THREE.Mesh(geo, [m.carrotRind, m.carrotFace, m.carrotFace]));
      break;
    }
    case 'banana': {
      // Cáscara abierta: 4 tiras que nacen del tallo y se curvan hacia afuera.
      const petals = 4, len = rand(0.75, 0.95);
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2 + rand(-0.2, 0.2);
        const open = rand(0.9, 1.4);
        const geo = ribbon(
          (t) => new THREE.Vector3(Math.sin(t * open * 1.6) * len * 0.55, -t * len * 0.85 + Math.pow(t, 3) * len * 0.5, 0),
          (t) => 0.1 * Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.08)) + 0.012,
          { segT: Math.round(16 * seg), segU: 4, curl: 0.55 },
        );
        const mesh = new THREE.Mesh(geo, m.banana);
        mesh.rotation.y = a;
        g.add(mesh);
      }
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.22, 8), m.bananaStem);
      stem.position.y = 0.1;
      g.add(stem);
      g.position.y = 0.2;
      break;
    }
    case 'leaf':
    case 'lettuce': {
      const L = kind === 'leaf' ? rand(0.7, 0.9) : rand(0.6, 0.75);
      const W = kind === 'leaf' ? 0.2 : 0.3;
      const bend = rand(0.15, 0.4);
      const geo = ribbon(
        (t) => new THREE.Vector3(0, t * L - L / 2, Math.sin(t * Math.PI) * bend * 0.4),
        (t) => W * Math.pow(Math.sin(Math.PI * t), kind === 'leaf' ? 0.9 : 0.6) + 0.004,
        { segT: Math.round(18 * seg), segU: 6, curl: kind === 'leaf' ? 0.3 : 0.15, wave: kind === 'lettuce' ? 0.6 : 0 },
      );
      g.add(new THREE.Mesh(geo, kind === 'leaf' ? m.leaf : m.lettuce));
      if (kind === 'leaf') {
        const vein = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.012, L * 0.95, 5), m.vein);
        vein.position.z = 0.012;
        g.add(vein);
      }
      break;
    }
  }
  return g;
}

// ---------- Biodigestor ----------
export interface Digester {
  group: THREE.Group;
  liquid: THREE.Mesh;
  sludge: THREE.Mesh;
  sludgeMat: THREE.MeshStandardMaterial;
  innerLight: THREE.PointLight;
  chunks: THREE.Object3D[];
  outlet: THREE.Vector3;
  liquidBox: { r: number; y0: number; y1: number };
}

export function makeDigester(detail: 'high' | 'low'): Digester {
  const group = new THREE.Group();
  const segs = detail === 'high' ? 64 : 36;

  // Frasco de vidrio (perfil torneado como el frasco real)
  const profile = [
    [0.0, -1.5], [0.9, -1.5], [1.04, -1.44], [1.08, -1.26], [1.08, 1.06], [1.02, 1.3], [0.9, 1.44], [0.88, 1.5], [0.88, 1.6],
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const jarGeo = new THREE.LatheGeometry(profile, segs);
  const glassBack = new THREE.MeshPhysicalMaterial({ color: '#E8FFF4', roughness: 0.08, metalness: 0, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false });
  const glassFront = new THREE.MeshPhysicalMaterial({ color: '#F2FFF8', roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.2, side: THREE.FrontSide, depthWrite: false, envMapIntensity: 1.6 });
  const back = new THREE.Mesh(jarGeo, glassBack); back.renderOrder = 1;
  const front = new THREE.Mesh(jarGeo, glassFront); front.renderOrder = 4;
  group.add(back, front);

  // Mezcla de residuos y agua
  const liquidBox = { r: 0.98, y0: -1.44, y1: 0.85 };
  const liquidMat = new THREE.MeshStandardMaterial({ color: '#C07A2E', roughness: 0.25, transparent: true, opacity: 0.5, emissive: '#5c2f06', emissiveIntensity: 0.35, depthWrite: false });
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(liquidBox.r, liquidBox.r, liquidBox.y1 - liquidBox.y0, segs), liquidMat);
  liquid.position.y = (liquidBox.y0 + liquidBox.y1) / 2;
  liquid.renderOrder = 2;
  group.add(liquid);

  // Lodo (digestato) en el fondo
  const sludgeMat = new THREE.MeshStandardMaterial({ color: '#4A2E14', roughness: 0.9, emissive: '#B6F24A', emissiveIntensity: 0 });
  const sludge = new THREE.Mesh(new THREE.CylinderGeometry(0.97, 0.97, 0.32, segs), sludgeMat);
  sludge.position.y = -1.28;
  group.add(sludge);

  // Trozos de residuos suspendidos en la mezcla
  const chunks: THREE.Object3D[] = [];
  const n = detail === 'high' ? 22 : 12;
  for (let i = 0; i < n; i++) {
    const kind = RESIDUE_KINDS[i % RESIDUE_KINDS.length];
    const c = makeResidue(kind, 'low');
    const a = (i / n) * Math.PI * 2 * 3 + rand(-0.3, 0.3), d = rand(0.35, 0.78);
    c.position.set(Math.cos(a) * d, -1.0 + (i / n) * 1.65 + rand(-0.1, 0.1), Math.sin(a) * d);
    c.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
    c.scale.setScalar(rand(0.6, 0.9));
    c.userData.base = c.position.clone();
    c.userData.phase = rand(0, 6);
    chunks.push(c);
    group.add(c);
  }

  // Tapa roja y algodón (como el montaje real)
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.93, 0.93, 0.3, segs), new THREE.MeshStandardMaterial({ color: '#C8282E', roughness: 0.42, metalness: 0.05 }));
  lid.position.y = 1.72;
  group.add(lid);
  const ridge = new THREE.Mesh(new THREE.TorusGeometry(0.93, 0.025, 6, segs), new THREE.MeshStandardMaterial({ color: '#A71E23', roughness: 0.5 }));
  ridge.rotation.x = Math.PI / 2; ridge.position.y = 1.6;
  group.add(ridge);
  const cotton = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 1), new THREE.MeshStandardMaterial({ color: '#F4F4EE', roughness: 1, flatShading: true }));
  cotton.position.set(0.35, 1.93, 0); cotton.scale.set(1.2, 0.8, 1.1);
  group.add(cotton);

  // Plataforma de laboratorio
  const base = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.55, 0.12, segs), new THREE.MeshStandardMaterial({ color: '#0E2A1F', roughness: 0.6, metalness: 0.3 }));
  base.position.y = -1.56;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.012, 6, segs), new THREE.MeshBasicMaterial({ color: '#B6F24A', transparent: true, opacity: 0.7 }));
  rim.rotation.x = Math.PI / 2; rim.position.y = -1.5;
  group.add(base, rim);

  const innerLight = new THREE.PointLight('#FFB35C', 2.5, 4, 1.6);
  innerLight.position.set(0, -0.2, 0);
  group.add(innerLight);

  return { group, liquid, sludge, sludgeMat, innerLight, chunks, outlet: new THREE.Vector3(0.35, 1.95, 0), liquidBox };
}

// ---------- Circuito de gas ----------
export const GAS_PATH_A = new THREE.CatmullRomCurve3([
  new THREE.Vector3(0.35, 1.95, 0),
  new THREE.Vector3(0.42, 2.55, 0),
  new THREE.Vector3(1.25, 2.85, -0.1),
  new THREE.Vector3(2.3, 2.15, -0.25),
  new THREE.Vector3(2.95, 1.62, -0.3),
]);
export const GAS_PATH_B = new THREE.CatmullRomCurve3([
  new THREE.Vector3(2.98, 1.6, -0.3),
  new THREE.Vector3(3.1, 0.85, -0.05),
  new THREE.Vector3(3.15, 0.15, 0.35),
  new THREE.Vector3(3.3, -0.35, 0.6),
]);
export const BALLOON_NECK = new THREE.Vector3(3.0, 1.62, -0.3);

export function makeTubes(detail: 'high' | 'low'): THREE.Group {
  const g = new THREE.Group();
  const mat = new THREE.MeshPhysicalMaterial({ color: '#E6FFF2', roughness: 0.1, transparent: true, opacity: 0.32, clearcoat: 1, depthWrite: false });
  const s = detail === 'high' ? 80 : 40;
  for (const curve of [GAS_PATH_A, GAS_PATH_B]) {
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, s, 0.065, 12, false), mat);
    m.renderOrder = 5;
    g.add(m);
  }
  // Válvula en T bajo el globo
  const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.24, 16), new THREE.MeshStandardMaterial({ color: '#D8DED9', metalness: 0.7, roughness: 0.3 }));
  valve.position.copy(BALLOON_NECK);
  g.add(valve);
  return g;
}

export function makeBalloon(detail: 'high' | 'low'): { group: THREE.Group; body: THREE.Mesh } {
  const group = new THREE.Group();
  const pts: THREE.Vector2[] = [];
  // Cuello + cuerpo elipsoidal (la base de la elipse coincide con el cuello)
  const H = 1.85, cy = 1.0, ry = 0.85, rx = 0.86;
  for (let i = 0; i <= 40; i++) {
    const y = (i / 40) * H;
    const e = Math.max(0, 1 - Math.pow((y - cy) / ry, 2));
    const r = y < 0.16 ? 0.075 : Math.max(y < 0.3 ? 0.075 : 0.001, rx * Math.sqrt(e));
    pts.push(new THREE.Vector2(r, y));
  }
  pts.push(new THREE.Vector2(0.0, H));
  const body = new THREE.Mesh(
    new THREE.LatheGeometry(pts, detail === 'high' ? 48 : 28),
    new THREE.MeshPhysicalMaterial({ color: '#2FBF71', roughness: 0.28, clearcoat: 1, clearcoatRoughness: 0.15, sheen: 0.5, sheenColor: new THREE.Color('#B6F24A'), transparent: true, opacity: 0.93 }),
  );
  body.position.y = 0.1;
  group.add(body);
  const knot = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.035, 8, 16), new THREE.MeshStandardMaterial({ color: '#1E8A52', roughness: 0.4 }));
  knot.rotation.x = Math.PI / 2; knot.position.y = 0.14;
  group.add(knot);
  group.position.copy(BALLOON_NECK).add(new THREE.Vector3(0, 0.08, 0));
  return { group, body };
}

/** Turbina + generador con estética de holograma: es una PROPUESTA, no un equipo real del experimento. */
export function makeTurbine(): { group: THREE.Group; rotor: THREE.Group; holoMats: THREE.Material[] } {
  const group = new THREE.Group();
  const holo = new THREE.MeshStandardMaterial({ color: '#12A36B', emissive: '#12A36B', emissiveIntensity: 0.5, transparent: true, opacity: 0.42, roughness: 0.3, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide });
  const wire = new THREE.MeshBasicMaterial({ color: '#B6F24A', wireframe: true, transparent: true, opacity: 0.35 });
  const lines = new THREE.LineBasicMaterial({ color: '#B6F24A', transparent: true, opacity: 0.85 });

  const housingGeo = new THREE.TorusGeometry(0.58, 0.075, 8, 40);
  const housing = new THREE.Mesh(housingGeo, holo);
  group.add(housing, new THREE.Mesh(housingGeo, wire));

  const rotor = new THREE.Group();
  rotor.add(new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 12), holo));
  const bladeGeo = new THREE.BoxGeometry(0.44, 0.13, 0.025);
  bladeGeo.translate(0.28, 0, 0);
  for (let i = 0; i < 7; i++) {
    const b = new THREE.Mesh(bladeGeo, holo);
    b.rotation.z = (i / 7) * Math.PI * 2;
    b.rotateX(0.5);
    rotor.add(b);
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(bladeGeo), lines);
    e.rotation.copy(b.rotation);
    rotor.add(e);
  }
  group.add(rotor);

  // Eje y generador
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8), holo);
  shaft.rotation.z = Math.PI / 2; shaft.position.set(0.45, 0, -0.05);
  group.add(shaft);
  const genGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.62, 24, 1);
  const gen = new THREE.Mesh(genGeo, holo);
  gen.rotation.z = Math.PI / 2; gen.position.set(1.15, 0, -0.05);
  const genEdges = new THREE.LineSegments(new THREE.EdgesGeometry(genGeo, 30), lines);
  genEdges.rotation.copy(gen.rotation); genEdges.position.copy(gen.position);
  group.add(gen, genEdges);
  for (let i = 0; i < 4; i++) {
    const fin = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.012, 6, 28), wire);
    fin.rotation.y = Math.PI / 2; fin.position.set(0.92 + i * 0.15, 0, -0.05);
    group.add(fin);
  }
  // Soportes
  const stand = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.08, 0.6), holo);
  stand.position.set(0.55, -0.62, -0.05);
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.6, 0.08), holo);
  post.position.set(0, -0.32, -0.05);
  group.add(stand, post);

  group.position.set(3.3, -0.9, 0.6);
  return { group, rotor, holoMats: [holo, wire, lines] };
}

/** Salida de digestato: tubería desde el fondo del frasco hasta una bandeja. */
export function makeDigestateTray(): { group: THREE.Group; sludgeMat: THREE.MeshStandardMaterial } {
  const group = new THREE.Group();
  const pipeMat = new THREE.MeshStandardMaterial({ color: '#3A4A44', roughness: 0.4, metalness: 0.6 });
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.95, -1.25, 0.25), new THREE.Vector3(-1.45, -1.22, 0.4), new THREE.Vector3(-1.85, -1.3, 0.55), new THREE.Vector3(-2.0, -1.42, 0.6),
  ]);
  group.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.06, 10, false), pipeMat));
  const tray = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.24, 0.72), new THREE.MeshStandardMaterial({ color: '#22302B', roughness: 0.5, metalness: 0.4 }));
  tray.position.set(-2.3, -1.5, 0.6);
  const sludgeMat = new THREE.MeshStandardMaterial({ color: '#5A3818', roughness: 0.95, emissive: '#B6F24A', emissiveIntensity: 0 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.04, 0.62), sludgeMat);
  top.position.set(-2.3, -1.37, 0.6);
  group.add(tray, top);
  return { group, sludgeMat };
}

/** Piso con sombra de contacto y anillos sutiles de laboratorio. */
export function makeFloor(): THREE.Mesh {
  const s = 512, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(0,0,0,0.55)');
  grd.addColorStop(0.35, 'rgba(0,0,0,0.25)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
  g.strokeStyle = 'rgba(182,242,74,0.10)';
  g.lineWidth = 1.2;
  for (let r = 40; r < s / 2; r += 34) { g.beginPath(); g.arc(s / 2, s / 2, r, 0, Math.PI * 2); g.stroke(); }
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  m.position.set(1, -1.63, 0.2);
  return m;
}

export function softDotTexture(): THREE.CanvasTexture {
  const s = 64, c = document.createElement('canvas');
  c.width = c.height = s;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,0.6)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd; g.fillRect(0, 0, s, s);
  return new THREE.CanvasTexture(c);
}

export { rand };
