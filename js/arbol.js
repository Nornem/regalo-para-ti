// =====================================================================
// arbol.js — 🌳 EL ÁRBOL DE MANGO
// El diseño (tronco, ramas, copa, hojas y mangos) es el aprobado:
// este código es el mismo de antes, solo separado en su propio archivo.
// Nuevo: los mangos cosechados desaparecen y rebrotan en otro lugar.
// =====================================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { scene, addWind } from './motor.js';
import {
  setSeed, rand, rr, mrand, mrr, clamp01, smooth, mix, easeOutBack, TAU, V3, UP, hash, randomDir, canvasTex, makeBag,
} from './utils.js';
import { VARIEDADES, MENSAJES_MANGO } from './contenido.js';
import { ambiente } from './ambiente.js';

export const TAMANO_ARBOL = 2;    // tamaño del árbol (los mangos mantienen su tamaño)
export const TOTAL_MANGOS = 18;   // máximo de mangos en el árbol a la vez
export const REBROTE_SEG = 120;   // segundos para que un mango cosechado vuelva a crecer

// corteza: placas y grietas verticales
const barkTex = canvasTex(256, 512, (g) => {
  g.fillStyle = '#a5876c'; g.fillRect(0, 0, 256, 512);
  for (let i = 0; i < 900; i++) {   // placas
    const x = Math.random() * 256, y = Math.random() * 512;
    const l = 38 + Math.random() * 22;
    g.fillStyle = `hsla(${24 + Math.random() * 10}, ${12 + Math.random() * 12}%, ${l}%, 0.35)`;
    g.fillRect(x, y, 6 + Math.random() * 16, 14 + Math.random() * 40);
  }
  for (let i = 0; i < 70; i++) {    // grietas
    let x = Math.random() * 256;
    g.strokeStyle = `rgba(60,42,28,${0.3 + Math.random() * 0.3})`;
    g.lineWidth = 1 + Math.random() * 2.5;
    g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= 512; y += 16) { x += (Math.random() - 0.5) * 6; g.lineTo(x, y); }
    g.stroke();
  }
  for (let i = 0; i < 160; i++) {   // líquenes claros
    g.fillStyle = `rgba(${170 + Math.random() * 40},${170 + Math.random() * 40},150,0.25)`;
    g.beginPath(); g.arc(Math.random() * 256, Math.random() * 512, 1 + Math.random() * 4, 0, TAU); g.fill();
  }
});
barkTex.wrapS = barkTex.wrapT = THREE.RepeatWrapping;

// hoja: nervadura central, nervios laterales y brillo
export const leafTex = canvasTex(128, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, w, 0);
  gr.addColorStop(0, '#a7b38c'); gr.addColorStop(0.22, '#e9eedc');
  gr.addColorStop(0.5, '#ffffff'); gr.addColorStop(0.78, '#e9eedc'); gr.addColorStop(1, '#a7b38c');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const vg = g.createLinearGradient(0, h, 0, 0);
  vg.addColorStop(0, 'rgba(255,255,200,0.35)'); vg.addColorStop(0.4, 'rgba(255,255,255,0)');
  vg.addColorStop(1, 'rgba(60,80,30,0.18)');
  g.fillStyle = vg; g.fillRect(0, 0, w, h);
  g.strokeStyle = 'rgba(255,255,215,0.6)'; g.lineWidth = 1.3;
  for (let y = h - 18; y > 10; y -= 11) {
    g.beginPath(); g.moveTo(w / 2, y); g.quadraticCurveTo(w * 0.75, y - 12, w * 0.98, y - 34); g.stroke();
    g.beginPath(); g.moveTo(w / 2, y); g.quadraticCurveTo(w * 0.25, y - 12, w * 0.02, y - 34); g.stroke();
  }
  g.strokeStyle = 'rgba(255,255,205,1)'; g.lineWidth = 4.5;
  g.beginPath(); g.moveTo(w / 2, h); g.lineTo(w / 2, 0); g.stroke();
});

// Estado exacto de la semilla cuando se diseñó el árbol aprobado:
// así sale idéntico aunque el resto del mundo cambie.
setSeed(762724352);

export const tree = new THREE.Group();
scene.add(tree);

// Tubo con grosor variable que sigue una curva (tronco, ramas y ramitas)
function tube(points, r0, r1, radial = 8, segs = 10, flare = 0) {
  const curve = new THREE.CatmullRomCurve3(points);
  const frames = curve.computeFrenetFrames(segs, false);
  const len = curve.getLength();
  const pos = [], nor = [], uv = [], idx = [];
  const uRep = Math.max(1, Math.round(r0 * 5));
  for (let i = 0; i <= segs; i++) {
    const t = i / segs, P = curve.getPointAt(t);
    const N = frames.normals[i], B = frames.binormals[i];
    const r = mix(r0, r1, Math.pow(t, 0.85)) + flare * Math.pow(1 - t, 7);
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU, s = Math.sin(a), c = -Math.cos(a);
      const nx = c * N.x + s * B.x, ny = c * N.y + s * B.y, nz = c * N.z + s * B.z;
      const ridge = 1 + (flare > 0 ? 0.12 * Math.pow(1 - t, 3) * Math.sin(a * 6) : 0); // contrafuertes
      pos.push(P.x + nx * r * ridge, P.y + ny * r * ridge, P.z + nz * r * ridge);
      nor.push(nx, ny, nz);
      uv.push((j / radial) * uRep, t * len * 0.7);
    }
  }
  for (let i = 0; i < segs; i++) for (let j = 0; j < radial; j++) {
    const a = i * (radial + 1) + j, b = a + radial + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}

const dummy = new THREE.Object3D();
// ---------------------------------------------------------------------
// La copa se arma con "nubes" de hojas (lóbulos) sobre una cúpula,
// cada una sostenida por su propia rama: así se ve la silueta redonda,
// con volúmenes, y las ramas principales asoman por debajo.
// ---------------------------------------------------------------------
const barkGeos = [];
const lobes = [];
function addLobe(az, r, y, R) {
  lobes.push({ c: new V3(Math.cos(az) * r, y, Math.sin(az) * r), R, az });
}
for (let i = 0; i < 9; i++) addLobe((i / 9) * TAU + rr(-0.15, 0.15), rr(3.5, 4.1), rr(5.0, 5.7), rr(1.5, 1.8)); // anillo exterior
for (let i = 0; i < 6; i++) addLobe(((i + 0.5) / 6) * TAU + rr(-0.2, 0.2), rr(1.9, 2.5), rr(6.5, 7.1), rr(1.5, 1.75)); // anillo medio
for (let i = 0; i < 3; i++) addLobe((i / 3) * TAU + rr(-0.3, 0.3), rr(0.3, 0.9), rr(7.7, 8.1), rr(1.4, 1.6));     // cima
const LOBE_FLAT = 0.85;   // los lóbulos son un poco achatados

// tronco
const TRUNK_TOP = new V3(0.12, 3.0, 0.05);
barkGeos.push(tube([new V3(0, -0.05, 0), new V3(0.05, 1.2, 0.02), new V3(-0.04, 2.2, 0.0), TRUNK_TOP], 0.5, 0.36, 22, 18, 0.5));

// raíces
for (let i = 0; i < 8; i++) {
  const a = (i / 8) * TAU + rr(-0.25, 0.25), L = rr(1.3, 2.2);
  const P = (r, y) => new V3(Math.cos(a + r * 0.1) * r, y, Math.sin(a + r * 0.1) * r);
  barkGeos.push(tube([P(0.22, 0.6), P(0.65, 0.25), P(L * 0.6, 0.05), P(L, -0.06)], 0.28, 0.03, 8, 10));
}

// 4 brazos principales
const limbs = [];
for (let i = 0; i < 4; i++) {
  const az = (i / 4) * TAU + 0.4 + rr(-0.2, 0.2);
  const start = new V3(TRUNK_TOP.x, TRUNK_TOP.y - rr(0, 0.35), TRUNK_TOP.z);
  const mid = new V3(Math.cos(az) * 0.8, 3.8, Math.sin(az) * 0.8);
  const node = new V3(Math.cos(az) * 1.8, rr(4.5, 4.8), Math.sin(az) * 1.8);
  barkGeos.push(tube([start, mid, node], 0.3, 0.2, 14, 12));
  limbs.push({ az, node });
}
// cada lóbulo recibe una rama desde el brazo más cercano
const angDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
for (const lb of lobes) {
  let limb = limbs[0];
  for (const l of limbs) if (angDiff(l.az, lb.az) < angDiff(limb.az, lb.az)) limb = l;
  const mid = limb.node.clone().lerp(lb.c, 0.5); mid.y += 0.25;
  const end = lb.c.clone(); end.y -= lb.R * 0.15;
  barkGeos.push(tube([limb.node, mid, end], 0.17, 0.07, 9, 10));
  lb.base = end;
  // ramitas dentro del lóbulo
  for (let k = 0; k < 5; k++) {
    const d = randomDir(); d.y = Math.abs(d.y) * 0.6 - 0.1; d.normalize();
    const tip = end.clone().addScaledVector(d, lb.R * rr(0.55, 0.75));
    const m2 = end.clone().lerp(tip, 0.5); m2.y += 0.1;
    barkGeos.push(tube([end, m2, tip], 0.06, 0.02, 5, 5));
  }
}

const trunk = new THREE.Mesh(
  mergeGeometries(barkGeos),
  new THREE.MeshStandardMaterial({ map: barkTex, bumpMap: barkTex, bumpScale: 4, roughness: 0.9, color: '#ffeedd', emissive: '#3a2616', emissiveIntensity: 0.35 })
);
trunk.castShadow = trunk.receiveShadow = true;
tree.add(trunk);

// relleno de cada lóbulo (verde medio, para que no se vean huecos)
const lobeMat = new THREE.MeshStandardMaterial({ color: '#3a6a22', roughness: 0.95 });
const lobeFill = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 3), lobeMat, lobes.length);
lobes.forEach((lb, i) => {
  dummy.position.copy(lb.c); dummy.rotation.set(0, 0, 0);
  dummy.scale.set(lb.R * 0.8, lb.R * 0.8 * LOBE_FLAT, lb.R * 0.8);
  dummy.updateMatrix(); lobeFill.setMatrixAt(i, dummy.matrix);
});
lobeFill.castShadow = lobeFill.receiveShadow = true;
tree.add(lobeFill);

// racimos de hojas (rosetas) sobre la superficie de cada lóbulo
const CANOPY_BASE = new V3(0, 4.2, 0);
export const rosettes = [];
for (const lb of lobes) {
  const out = lb.c.clone().sub(CANOPY_BASE).normalize();
  let tries = 0, made = 0;
  while (made < 70 && tries < 400) {
    tries++;
    const n = randomDir();
    if (n.dot(out) < -0.8) continue;                       // también hojas por debajo (se ven al mirar hacia arriba)
    const k = lb.R * rr(0.88, 1.02);
    const P = new V3(lb.c.x + n.x * k, lb.c.y + n.y * k * LOBE_FLAT, lb.c.z + n.z * k);
    // si queda enterrado dentro de otro lóbulo, no hace falta
    if (lobes.some((o) => o !== lb && P.distanceTo(o.c) < o.R * 0.82)) continue;
    rosettes.push({ P, normal: n.clone(), lobe: lb, n });
    made++;
  }
}

// hoja de mango: ancha-lanceolada, con pliegue en la nervadura y curvatura
function makeLeafGeo() {
  const L = 0.85, SEG = 14, pos = [], uv = [], idx = [];
  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG;
    const w = t < 0.06 ? 0.014 : 0.155 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.78)), 0.8) * (1 - 0.2 * t) + 0.004;
    const y = t * L, arch = -0.2 * y * y;
    for (let s = -1; s <= 1; s++) {
      const x = s * w;
      pos.push(x, y, arch + Math.abs(x) * 0.42);
      uv.push(0.5 + s * 0.5, t);
    }
  }
  for (let i = 0; i < SEG; i++) for (let s = 0; s < 2; s++) {
    const a = i * 3 + s, b = a + 3;
    idx.push(a, a + 1, b, a + 1, b + 1, b);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
export const leafGeo = makeLeafGeo();

function leafFragment(sh) {
  sh.fragmentShader = sh.fragmentShader
    .replace('#include <color_fragment>', `#include <color_fragment>
      if (!gl_FrontFacing) diffuseColor.rgb = diffuseColor.rgb * vec3(1.1, 1.18, 0.8) + vec3(0.03, 0.04, 0.0);`)
    .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
      totalEmissiveRadiance += diffuseColor.rgb * vec3(0.07, 0.09, 0.02);`);
}
const leafMat = new THREE.MeshStandardMaterial({ map: leafTex, side: THREE.DoubleSide, roughness: 0.4 });
addWind(leafMat, 0.12, '(position.y + 0.25)', leafFragment);

let leafCount = 0;
const leaves = new THREE.InstancedMesh(leafGeo, leafMat, rosettes.length * 10);
{
  const t1 = new V3(), t2 = new V3(), dir = new V3(), zA = new V3(), xA = new V3();
  const X = new V3(1, 0, 0), m4 = new THREE.Matrix4(), sv = new V3();
  const col = new THREE.Color(), base = new THREE.Color();
  for (const ro of rosettes) {
    const nrm = ro.normal;
    t1.crossVectors(nrm, Math.abs(nrm.y) < 0.9 ? UP : X).normalize();
    t2.crossVectors(nrm, t1);
    const per = 7 + Math.floor(rand() * 3);
    const rot = rand() * TAU;
    const hTop = clamp01((ro.P.y - 4.3) / 4.5);        // 0 abajo de la copa, 1 en la cima

    // brotes nuevos cobrizos/naranjas en la parte alta (como en el mango real)
    const bronze = ro.lobe.c.y > 6.3 && nrm.y > 0.45 && rand() < 0.14;
    let size = rr(0.9, 1.25);
    if (bronze) { base.setHSL(rr(0.03, 0.07), rr(0.72, 0.85), rr(0.42, 0.5)); size *= 1.1; }
    else {
      const roll = rand();
      if (roll < 0.22) base.setHSL(rr(0.17, 0.2), rr(0.75, 0.88), rr(0.42, 0.5));  // verde lima, hojas jóvenes
      else base.setHSL(rr(0.21, 0.27), rr(0.62, 0.8), rr(0.3, 0.4));              // verde mango
    }
    // volumen: la parte de abajo de cada lóbulo y de la copa, más oscura
    const local = mix(0.5, 1.0, (nrm.y + 1) / 2);
    const global = mix(0.72, 1.08, hTop);
    const shade = bronze ? 1 : local * global;

    for (let j = 0; j < per; j++) {
      const th = rot + (j / per) * TAU + rr(-0.2, 0.2);
      const lift = bronze ? rr(0.0, 0.2) : rr(0.08, 0.4);
      dir.copy(t1).multiplyScalar(Math.cos(th)).addScaledVector(t2, Math.sin(th))
        .multiplyScalar(Math.cos(lift)).addScaledVector(nrm, Math.sin(lift));
      dir.y -= bronze ? rr(0.5, 0.8) : rr(0.18, 0.42);
      dir.normalize();
      zA.copy(nrm).addScaledVector(dir, -nrm.dot(dir));
      if (zA.lengthSq() < 1e-4) zA.copy(t1);
      zA.normalize();
      xA.crossVectors(dir, zA).normalize();
      m4.makeBasis(xA, dir, zA);
      const s = size * rr(0.78, 1.15);
      m4.scale(sv.set(s, s, s));
      m4.setPosition(ro.P);
      leaves.setMatrixAt(leafCount, m4);
      col.copy(base).offsetHSL(rr(-0.012, 0.012), 0, rr(-0.035, 0.035)).multiplyScalar(shade);
      leaves.setColorAt(leafCount, col);
      leafCount++;
    }
  }
}
leaves.count = leafCount;
leaves.castShadow = leaves.receiveShadow = true;
tree.add(leaves);

/* ---------- Mangos: grandes, cuelgan bajo los lóbulos (de 1 en 1 o de 2 en 2) ---------- */
export const COLORS = {
  green: new THREE.Color('#86a83a'), yellow: new THREE.Color('#f7c63e'),
  orange: new THREE.Color('#f38a26'), red: new THREE.Color('#d92b36'),
};
function mangoGeometry(ripe, blushSide) {
  const g = new THREE.SphereGeometry(0.3, 44, 32);
  const p = g.attributes.position, v = new V3();
  const colors = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  const freckle = new THREE.Color('#fff0b0');
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const y = v.y / 0.3;
    v.y *= 1.32;
    v.x *= 1 - 0.08 * y;
    v.z *= 0.88;
    v.x += 0.07 * y * y - 0.025;
    if (y < -0.55) v.x += (-(y + 0.55)) * 0.1;
    if (y > 0.85) v.y -= (y - 0.85) * 0.12;
    p.setXYZ(i, v.x, v.y, v.z);

    const t = (1 - y) / 2;                                  // 0 arriba … 1 abajo
    c.lerpColors(COLORS.orange, COLORS.yellow, smooth(0.25, 0.95, t));
    c.lerp(COLORS.green, (1 - ripe) * 0.55);
    const side = (v.x * Math.cos(blushSide) + v.z * Math.sin(blushSide)) / 0.3;
    const blush = ripe * clamp01(side * 0.55 + 0.5) * clamp01(1.15 - t * 1.4);
    c.lerp(COLORS.red, blush * 0.85);
    if (y > 0.78) c.lerp(COLORS.green, (y - 0.78) * 3 * (1 - ripe * 0.6));   // hombro verdoso junto al tallo
    if (hash(i * 7, 13) > 0.94) c.lerp(freckle, 0.3);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  g.computeVertexNormals();
  return g;
}

// dónde colgar: bajo los lóbulos del anillo exterior y medio
const anchors = [];
for (const lb of lobes) {
  if (lb.c.y > 6.2) continue;            // solo los lóbulos de afuera
  const outH = new V3(lb.c.x, 0, lb.c.z).normalize();
  for (let k = 0; k < 3; k++) {
    const a = rr(-1.2, 1.2);
    const dirH = outH.clone().applyAxisAngle(UP, a);
    const P = lb.c.clone().addScaledVector(dirH, lb.R * rr(0.35, 0.65));
    P.y -= lb.R * LOBE_FLAT * rr(0.62, 0.8);
    anchors.push({ P, out: dirH });
  }
}
for (let i = anchors.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [anchors[i], anchors[j]] = [anchors[j], anchors[i]]; }
const chosen = [];
for (const a of anchors) if (!chosen.some((c) => c.P.distanceTo(a.P) < 1.3)) chosen.push(a);

// ---------------------------------------------------------------------
// Tallos y mangos. El orden en que se usan los números aleatorios es
// exactamente el del diseño aprobado, así los 18 mangos iniciales salen
// en los mismos lugares, con los mismos colores y tamaños.
// ---------------------------------------------------------------------
const stalkGeos = [];
const stemMat = new THREE.MeshStandardMaterial({ color: '#6f6a2c', roughness: 0.8 });
export const mangos = [];
const tallos = [];        // tallos con "lugares" para mangos
const sueltos = [];       // lugares bonitos que aún no tienen tallo (para rebrotes)
const pendientes = [];    // rebrotes programados
const nuevoMensaje = makeBag(MENSAJES_MANGO);
const SEMILLA = { rand, rr };            // aleatorio fijo (diseño)
const LIBRE = { rand: mrand, rr: mrr };  // aleatorio de cada visita (rebrotes)
let nextId = 0;

function puntosTallo(an, L) {
  const A = an.P.clone(); A.y += 0.35;
  const E = an.P.clone().addScaledVector(an.out, 0.06); E.y -= L;
  const M = A.clone().lerp(E, 0.5).addScaledVector(an.out, 0.05);
  return { A, E, M };
}

function crearMango(st, j, R, spawnT) {
  const i = nextId++;
  const k = st.k;
  const ripe = R.rr(0.72, 1);
  const tilt = k > 1 ? R.rr(0.35, 0.45) : R.rr(0, 0.08);
  const az = st.az0 + (j / k) * TAU;
  const pivot = new THREE.Group();
  pivot.position.copy(st.E);
  if (k > 1) { pivot.position.x += Math.sin(az) * 0.12; pivot.position.z += Math.cos(az) * 0.12; }
  pivot.scale.setScalar(0.001);
  const pedLen = R.rr(0.08, 0.16);
  const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, pedLen, 6), stemMat);
  ped.position.y = -pedLen / 2;
  ped.castShadow = true;
  pivot.add(ped);
  const mat = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.22,
    sheen: 0.25, sheenColor: new THREE.Color('#ffe2b0'),
    emissive: new THREE.Color('#ff9a3c'), emissiveIntensity: 0,
  });
  const mesh = new THREE.Mesh(mangoGeometry(ripe, R.rand() * TAU), mat);
  const baseScale = R.rr(1.35, 1.6);
  mesh.position.y = -pedLen - 0.37 * baseScale;
  mesh.rotation.y = R.rand() * TAU;
  mesh.scale.setScalar(baseScale);
  mesh.castShadow = true;
  pivot.add(mesh);
  tree.add(pivot);
  const m = {
    i, pivot, mesh, mat, baseScale, ripe, msg: nuevoMensaje(),
    bx: Math.sin(az) * tilt, bz: Math.cos(az) * tilt,
    variety: VARIEDADES[Math.floor(R.rand() * VARIEDADES.length)],
    brix: Math.round(12 + ripe * 10),
    weight: Math.round(R.rr(380, 720) / 10) * 10,
    hover: 0, sel: 0, pop: 0,
    ax: 0, az: 0, vx: 0, vz: 0, phase: R.rand() * 10,
    harvested: false, fall: null, restT: 0, gone: 0,
    spawnT, tallo: st, slot: j,
  };
  st.slots[j] = m;
  mesh.userData.m = m;
  mangos.push(m);
  return m;
}

let made = 0, usados = 0;
for (const an of chosen) {
  if (made >= TOTAL_MANGOS) break;
  usados++;
  const k = Math.min(TOTAL_MANGOS - made, rand() < 0.6 ? 1 : 2);
  const L = rr(0.15, 0.4);
  const { A, E, M } = puntosTallo(an, L);
  stalkGeos.push(tube([A, M, E], 0.03, 0.022, 5, 6));
  const st = { E, az0: rand() * TAU, k, slots: new Array(k).fill(null) };
  tallos.push(st);
  for (let j = 0; j < k; j++) { crearMango(st, j, SEMILLA, 2.4 + made * 0.06); made++; }
}
for (const an of chosen.slice(usados)) sueltos.push(an);
if (stalkGeos.length) {
  const stalks = new THREE.Mesh(mergeGeometries(stalkGeos), stemMat);
  stalks.castShadow = true;
  tree.add(stalks);
}

// ---------------------------------------------------------------------
// Vida de los mangos: cosechar → cae → desaparece → rebrota en otro lugar
// ---------------------------------------------------------------------
export function cosechar(m, now) {
  if (m.harvested) return;
  m.harvested = true;
  m.tallo.slots[m.slot] = null;
  scene.attach(m.mesh);          // se separa del árbol conservando su posición
  tree.remove(m.pivot);
  m.pivot.children[0].geometry.dispose();
  m.fall = { v: new V3((Math.random() - 0.5) * 0.8, 0.6, (Math.random() - 0.5) * 0.8), spin: (Math.random() - 0.5) * 5, rest: false, hit: false };
  pendientes.push({ at: now + REBROTE_SEG, excluir: m.tallo });
}

function rebrotar(excluir, now, ctx) {
  const libres = [];
  for (const st of tallos) st.slots.forEach((s, j) => { if (!s) libres.push({ st, j }); });
  let pool = libres.filter((o) => o.st !== excluir).concat(sueltos.map((an) => ({ an })));
  if (!pool.length) pool = libres;
  if (!pool.length) return;
  const op = pool[Math.floor(Math.random() * pool.length)];
  let st = op.st, j = op.j;
  if (op.an) {                       // lugar nuevo: le crece un tallo
    sueltos.splice(sueltos.indexOf(op.an), 1);
    const { A, E, M } = puntosTallo(op.an, mrr(0.15, 0.4));
    const stalk = new THREE.Mesh(tube([A, M, E], 0.03, 0.022, 5, 6), stemMat);
    stalk.castShadow = true;
    tree.add(stalk);
    st = { E, az0: Math.random() * TAU, k: 1, slots: [null] };
    tallos.push(st);
    j = 0;
  }
  const m = crearMango(st, j, LIBRE, now + 0.3);
  m.vz += 1.5;
  ctx.burst(tree.localToWorld(st.E.clone()), '#d8f7a8', 26);
}

const _w = new V3();
export function updateArbol(dt, t, ctx) {
  const g = clamp01((t - 0.2) / 2.6);
  tree.scale.setScalar(Math.max(0.001, easeOutBack(g)) * TAMANO_ARBOL);
  tree.rotation.z = Math.sin(t * 0.5) * 0.006;
  tree.rotation.x = Math.sin(t * 0.37) * 0.005;

  for (let idx = mangos.length - 1; idx >= 0; idx--) {
    const m = mangos[idx];
    if (!m.harvested) {
      m.pop = clamp01((t - m.spawnT) / 0.7);
      m.pivot.scale.setScalar(Math.max(0.001, easeOutBack(m.pop)) / TAMANO_ARBOL);
      const wind = Math.sin(t * 1.5 + m.phase) * 0.5 + Math.sin(t * 2.7 + m.phase * 2) * 0.2;
      m.vz += (-14 * m.az - 1.6 * m.vz + wind) * dt;
      m.vx += (-14 * m.ax - 1.6 * m.vx + wind * 0.5) * dt;
      m.az += m.vz * dt; m.ax += m.vx * dt;
      m.pivot.rotation.set(m.bx + m.ax * 0.5, 0, m.bz + m.az * 0.5);
    }

    m.hover += ((ctx.hovered === m ? 1 : 0) - m.hover) * Math.min(1, dt * 10);
    m.sel += ((ctx.selected === m ? 1 : 0) - m.sel) * Math.min(1, dt * 6);
    const vanish = 1 - clamp01(m.gone) ** 2;
    m.mesh.scale.setScalar(m.baseScale * (1 + 0.14 * m.hover + 0.1 * m.sel) * Math.max(0.001, vanish));
    // de noche los mangos tienen un brillito cálido propio para encontrarlos fácil
    m.mat.emissiveIntensity = 0.16 * ambiente.noche + 0.28 * m.hover + m.sel * (0.25 + 0.15 * Math.sin(t * 3));

    if (m.fall && !m.fall.rest) {
      const f = m.fall;
      f.v.y -= 9.8 * dt;
      m.mesh.position.addScaledVector(f.v, dt);
      m.mesh.rotation.x += f.spin * dt;
      if (m.mesh.position.y < 0.4) {
        m.mesh.position.y = 0.4;
        if (!f.hit) { f.hit = true; ctx.burst(m.mesh.position, '#fff1c4', 30); }
        if (Math.abs(f.v.y) > 0.9) { f.v.y *= -0.38; f.v.x *= 0.6; f.v.z *= 0.6; f.spin *= 0.5; }
        else { f.v.set(0, 0, 0); f.rest = true; }
      }
    } else if (m.fall && m.fall.rest) {
      const goal = Math.round((m.mesh.rotation.x - Math.PI / 2) / Math.PI) * Math.PI + Math.PI / 2;
      m.mesh.rotation.x += (goal - m.mesh.rotation.x) * Math.min(1, dt * 5);
      m.mesh.rotation.z += (0 - m.mesh.rotation.z) * Math.min(1, dt * 5);
      m.restT += dt;
      if (m.restT > 2.2) {                         // se desvanece con un destello
        if (m.gone === 0) ctx.burst(m.mesh.getWorldPosition(_w), '#ffe7a6', 40);
        m.gone += dt / 0.8;
        if (m.gone >= 1) {
          scene.remove(m.mesh);
          m.mesh.geometry.dispose(); m.mat.dispose();
          mangos.splice(idx, 1);
          ctx.onGone(m);
        }
      }
    }
  }

  for (let i = pendientes.length - 1; i >= 0; i--) {
    if (t >= pendientes[i].at) {
      const p = pendientes.splice(i, 1)[0];
      if (mangos.filter((x) => !x.harvested).length < TOTAL_MANGOS) rebrotar(p.excluir, t, ctx);
    }
  }
}
