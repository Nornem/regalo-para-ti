// =====================================================================
// faroles.js — 🏮 FAROLES del bioma (siempre de noche)
// • Faroles de PIEDRA (estilo jardín japonés, con musgo y ventanitas
//   cálidas) a los lados de los caminos y alrededor del corazón.
// • Faroles GRANDES de MADERA (poste con brazo curvo, linterna de vidrio
//   rosa-violeta y un cristal colgante) esparcidos por las afueras.
// Rendimiento: solo unos pocos tienen luz real; el resto brilla con
// resplandor y un círculo de luz en el suelo (se ve igual, cuesta poco).
// =====================================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { scene, glowTex, renderer, MOBILE } from './motor.js';
import { PUNTOS, CENTRO, ANILLO_R, ANILLO_EXT_R, curvas } from './mundo.js';
import { canvasTex, TAU, V3 } from './utils.js';
import { ambiente } from './ambiente.js';

const ESCALA_PIEDRA = 0.96;    // ≈ 1.9 m de alto (20% más chicos)
const ESCALA_MADERA = 2.0;     // ≈ 9 m de alto (el doble)
const EM = ESCALA_MADERA;

// aleatorio con semilla propia (la distribución sale siempre igual)
let s = 777;
const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;

// ---------------------------------------------------------------------
// ¿Dónde van?
// ---------------------------------------------------------------------
const piedras = [];   // { p, rot, luz }
const maderas = [];   // { p, rot, luz }
// Faroles de piedra:
// • un par en cada camino (uno a cada lado), a 3.2 m del camino circular
// • 1 en el camino circular, justo entre cada par de caminos
for (const k of ['arbol', 'cumple', 'recuerdos']) {
  const c = curvas[k];
  const t = Math.min(0.9, 3.2 / c.getLength());
  const p = c.getPointAt(t), tg = c.getTangentAt(t);
  const lado = new V3(-tg.z, 0, tg.x).normalize();
  for (const ladoS of [1, -1]) {
    piedras.push({ p: p.clone().addScaledVector(lado, 1.9 * ladoS), rot: Math.atan2(tg.x, tg.z), luz: ladoS === 1 && k !== 'arbol' });
  }
}
const entradas = ['arbol', 'cumple', 'recuerdos'].map((k) => { const p = curvas[k].getPointAt(0); return Math.atan2(p.z - CENTRO.z, p.x - CENTRO.x); });
for (let i = 0; i < 3; i++) {
  const a = entradas[i], b = entradas[(i + 1) % 3];
  let m = (a + b) / 2; if (Math.abs(b - a) > Math.PI) m += Math.PI;
  const r = ANILLO_R + 1.75;
  piedras.push({ p: new V3(CENTRO.x + Math.cos(m) * r, 0, CENTRO.z + Math.sin(m) * r), rot: -m + Math.PI / 2 });
}
// faroles grandes: ordenados a lo largo del camino de piedra exterior,
// del lado de afuera, con la linterna colgando sobre el camino
{
  const N = 12;
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU + TAU / (N * 2);
    const r = ANILLO_EXT_R + 3.2;                 // la linterna queda colgando sobre el camino
    const p = new V3(CENTRO.x + Math.cos(a) * r, 0, CENTRO.z + Math.sin(a) * r);
    maderas.push({ p, rot: Math.PI - a });          // el brazo apunta hacia el camino
  }
  // los dos más cercanos a las mesas tienen luz real (en computadora)
  for (const k of ['cumple', 'recuerdos']) {
    if (MOBILE) break;
    const q = PUNTOS[k].pos;
    maderas.reduce((best, o) => (o.p.distanceTo(q) < best.p.distanceTo(q) ? o : best)).luz = true;
  }
}

// ---------------------------------------------------------------------
// Texturas
// ---------------------------------------------------------------------
const stoneTex = canvasTex(256, 256, (g, w, h) => {
  const img = g.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    const v = 120 + Math.random() * 40;
    img.data[i * 4] = v; img.data[i * 4 + 1] = v * 0.98; img.data[i * 4 + 2] = v * 0.92; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 70; i++) {                                         // musgo
    g.fillStyle = `rgba(${70 + Math.random() * 30},${100 + Math.random() * 40},${40 + Math.random() * 20},${0.35 + Math.random() * 0.35})`;
    g.beginPath(); g.ellipse(Math.random() * w, Math.random() * h, 6 + Math.random() * 22, 4 + Math.random() * 10, Math.random() * 3, 0, TAU); g.fill();
  }
  g.strokeStyle = 'rgba(60,55,50,.35)'; g.lineWidth = 2;                 // grietas
  for (let i = 0; i < 14; i++) { g.beginPath(); let x = Math.random() * w, y = Math.random() * h; g.moveTo(x, y); for (let k = 0; k < 5; k++) { x += (Math.random() - 0.5) * 30; y += Math.random() * 20; g.lineTo(x, y); } g.stroke(); }
});
const winTex = canvasTex(128, 128, (g, w, h) => {
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 80);
  gr.addColorStop(0, '#fff2c8'); gr.addColorStop(0.6, '#ffc76a'); gr.addColorStop(1, '#f39a3c');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#3a2618'; g.lineWidth = 12; g.strokeRect(6, 6, w - 12, h - 12);
  g.lineWidth = 6;
  g.beginPath(); g.moveTo(64, 10); g.lineTo(64, 118); g.moveTo(10, 64); g.lineTo(118, 64); g.stroke();
  g.lineWidth = 4;                                                         // florcita
  for (let k = 0; k < 5; k++) { const a = (k / 5) * TAU - Math.PI / 2; g.beginPath(); g.ellipse(64 + Math.cos(a) * 15, 64 + Math.sin(a) * 15, 12, 7, a, 0, TAU); g.stroke(); }
});
const woodTex = canvasTex(64, 256, (g, w, h) => {
  g.fillStyle = '#6e4a2e'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    g.strokeStyle = `rgba(${40 + Math.random() * 30},${25 + Math.random() * 15},${15},${0.3 + Math.random() * 0.3})`;
    g.lineWidth = 1 + Math.random() * 2;
    let x = Math.random() * w;
    g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= h; y += 16) { x += (Math.random() - 0.5) * 3; g.lineTo(x, y); }
    g.stroke();
  }
});
woodTex.wrapS = woodTex.wrapT = THREE.RepeatWrapping;
const poolTex = (r, gC, b) => canvasTex(128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, `rgba(${r},${gC},${b},0.6)`); gr.addColorStop(0.5, `rgba(${r},${gC},${b},0.2)`); gr.addColorStop(1, `rgba(${r},${gC},${b},0)`);
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});

// cilindro entre dos puntos (para palos y cadenas)
function palo(a, b, r0, r1 = r0, seg = 6) {
  const dir = b.clone().sub(a), len = dir.length();
  const g = new THREE.CylinderGeometry(r1, r0, len, seg);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), dir.normalize()));
  const m = a.clone().lerp(b, 0.5);
  return g.translate(m.x, m.y, m.z);
}

// ---------------------------------------------------------------------
// 🌿 Enredaderas: un tallo que sube en espiral desde el piso, con hojitas
// y algunas florcitas. Se arma una sola vez por tipo de farol.
// ---------------------------------------------------------------------
const hojaGeo = (() => {
  const sh = new THREE.Shape();
  sh.moveTo(0, 0); sh.quadraticCurveTo(0.5, 0.35, 0, 1); sh.quadraticCurveTo(-0.5, 0.35, 0, 0);
  const g = new THREE.ShapeGeometry(sh, 4);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, Math.abs(p.getX(i)) * 0.35);     // pliegue
  g.computeVertexNormals();
  return g;
})();
function pintar(g, hex) {
  const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) a.set([c.r, c.g, c.b], i * 3);
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
}
function enredadera(puntos, grosor, nHojas, tamHoja, nFlores) {
  const curva = new THREE.CatmullRomCurve3(puntos);
  const partes = [pintar(new THREE.TubeGeometry(curva, puntos.length * 10, grosor, 5), '#4a6b2a')];
  const m4 = new THREE.Matrix4(), xA = new V3(), yA = new V3(), zA = new V3();
  const hojas = ['#3f7a2e', '#4f8f33', '#2f6427', '#5c9a3a'];
  for (let i = 0; i < nHojas; i++) {
    const t = 0.04 + (i / nHojas) * 0.94 + (rnd() - 0.5) * 0.01;
    const P = curva.getPointAt(t), T = curva.getTangentAt(t);
    const afuera = new V3(P.x, 0, P.z); if (afuera.lengthSq() < 1e-6) afuera.set(1, 0, 0); afuera.normalize();
    const lado = i % 2 ? 1 : -1;
    yA.copy(afuera).multiplyScalar(0.6).addScaledVector(T, 0.35 * lado).add(new V3(0, -0.25 + rnd() * 0.3, 0)).normalize();
    zA.copy(afuera).addScaledVector(yA, -afuera.dot(yA)); if (zA.lengthSq() < 1e-6) zA.set(0, 0, 1); zA.normalize();
    xA.crossVectors(yA, zA);
    m4.makeBasis(xA, yA, zA);
    const sc = tamHoja * (0.7 + rnd() * 0.6);
    m4.scale(new V3(sc, sc, sc)); m4.setPosition(P);
    partes.push(pintar(hojaGeo.clone().applyMatrix4(m4), hojas[i % hojas.length]));
  }
  for (let i = 0; i < nFlores; i++) {
    const t = 0.2 + rnd() * 0.75, P = curva.getPointAt(t);
    const afuera = new V3(P.x, 0, P.z).normalize();
    const f = new THREE.IcosahedronGeometry(tamHoja * 0.35, 0).scale(1, 0.6, 1);
    f.translate(P.x + afuera.x * tamHoja * 0.4, P.y, P.z + afuera.z * tamHoja * 0.4);
    partes.push(pintar(f, rnd() < 0.5 ? '#ffc2dc' : '#ffffff'));
  }
  // todas las piezas deben ser del mismo tipo (con o sin índice) para unirlas
  return mergeGeometries(partes.map((g) => (g.index ? g.toNonIndexed() : g)));
}
const vineMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75 });

// enredadera del farol de piedra: sube desde el pasto, rodea el pilar y trepa a la lámpara
const vinePiedraGeo = enredadera((() => {
  const pts = [new V3(0.48, 0, 0.32), new V3(0.4, 0.1, 0.3), new V3(0.31, 0.22, 0.25)];
  for (let i = 0; i <= 14; i++) {
    const t = i / 14, a = 0.65 + t * TAU * 1.25, r = 0.235 - t * 0.03;
    pts.push(new V3(Math.cos(a) * r, 0.3 + t * 0.58, Math.sin(a) * r));
  }
  const fin = pts[pts.length - 1];
  const ang = Math.atan2(fin.z, fin.x);
  const esq = new V3(Math.sign(Math.cos(ang)) * 0.25, 0, Math.sign(Math.sin(ang)) * 0.25);
  pts.push(new V3(esq.x * 1.25, 0.96, esq.z * 1.25), new V3(esq.x, 1.1, esq.z), new V3(esq.x, 1.32, esq.z), new V3(esq.x * 1.35, 1.47, esq.z * 1.35), new V3(esq.x * 1.6, 1.42, esq.z * 1.6));
  return pts;
})(), 0.016, 70, 0.075, 6);

// enredadera del farol grande de madera: espiral por el poste y sigue por el brazo
const vineMaderaGeo = enredadera((() => {
  const pts = [new V3(0.45, 0, 0.25), new V3(0.3, 0.12, 0.18)];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30, a = 0.5 + t * TAU * 3.2, r = 0.22 - t * 0.04;
    pts.push(new V3(Math.cos(a) * r, 0.25 + t * 3.75, Math.sin(a) * r));
  }
  pts.push(new V3(0.1, 4.12, 0.1), new V3(0.45, 4.32, 0.09), new V3(0.85, 4.34, -0.08), new V3(1.15, 4.26, 0.07));
  return pts;
})(), 0.022, 150, 0.09, 12);

// ---------------------------------------------------------------------
// Farol de PIEDRA
// ---------------------------------------------------------------------
const stoneGeo = mergeGeometries([
  new THREE.BoxGeometry(0.78, 0.14, 0.78).translate(0, 0.07, 0),
  new THREE.BoxGeometry(0.58, 0.12, 0.58).translate(0, 0.2, 0),
  new THREE.CylinderGeometry(0.17, 0.21, 0.62, 8).translate(0, 0.57, 0),
  new THREE.BoxGeometry(0.66, 0.1, 0.66).translate(0, 0.93, 0),
  new THREE.BoxGeometry(0.5, 0.05, 0.5).translate(0, 1.0, 0),
  ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => new THREE.BoxGeometry(0.08, 0.4, 0.08).translate(x * 0.2, 1.22, z * 0.2)),
  new THREE.BoxGeometry(0.5, 0.05, 0.5).translate(0, 1.44, 0),
  new THREE.BoxGeometry(0.82, 0.07, 0.82).translate(0, 1.5, 0),
  new THREE.ConeGeometry(0.64, 0.32, 4).rotateY(Math.PI / 4).translate(0, 1.69, 0),
  new THREE.BoxGeometry(0.16, 0.1, 0.16).translate(0, 1.88, 0),
  new THREE.SphereGeometry(0.09, 10, 8).scale(1, 1.4, 1).translate(0, 2.0, 0),
]);
const winGeo = mergeGeometries([0, 1, 2, 3].map((k) => {
  const g = new THREE.PlaneGeometry(0.33, 0.34);
  g.translate(0, 0, 0.205);
  g.rotateY((k * Math.PI) / 2);
  return g.translate(0, 1.22, 0);
}));
const NP = piedras.length;
const vinesP = new THREE.InstancedMesh(vinePiedraGeo, vineMat, NP);
const stone = new THREE.InstancedMesh(stoneGeo, new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.95 }), NP);
const winMat = new THREE.MeshStandardMaterial({ map: winTex, emissiveMap: winTex, emissive: '#ffffff', emissiveIntensity: 2.4, side: THREE.DoubleSide, roughness: 0.8 });
const wins = new THREE.InstancedMesh(winGeo, winMat, NP);
const inner = new THREE.InstancedMesh(new THREE.BoxGeometry(0.3, 0.3, 0.3).translate(0, 1.22, 0), new THREE.MeshBasicMaterial({ color: '#ffd28a' }), NP);
const poolPMat = new THREE.MeshBasicMaterial({ map: poolTex(255, 190, 120), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const poolsP = new THREE.InstancedMesh(new THREE.CircleGeometry(3.6, 32).rotateX(-Math.PI / 2), poolPMat, NP);
stone.castShadow = stone.receiveShadow = true;

// ---------------------------------------------------------------------
// Farol GRANDE de MADERA
// ---------------------------------------------------------------------
const H = new V3(1.5, 3.9, 0);              // de dónde cuelga la linterna
const L = new V3(1.5, 3.2, 0);              // centro de la linterna
const woodGeo = mergeGeometries([
  palo(new V3(0, 0, 0), new V3(0, 4.3, 0), 0.17, 0.13, 7),
  new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new V3(-0.02, 4.0, 0), new V3(0.6, 4.3, 0), new V3(1.3, 4.18, 0), new V3(1.62, 3.95, 0)]), 20, 0.075, 7),
  palo(new V3(0.02, 3.2, 0), new V3(0.8, 4.2, 0), 0.05),
]);
const metalGeo = mergeGeometries([
  new THREE.TorusGeometry(0.06, 0.016, 6, 14).translate(H.x, H.y - 0.02, 0),
  palo(new V3(H.x, H.y - 0.08, 0), new V3(L.x, L.y + 0.58, 0), 0.012),
  new THREE.TorusGeometry(0.06, 0.018, 6, 14).translate(L.x, L.y + 0.6, 0),
  new THREE.ConeGeometry(0.34, 0.26, 6).translate(L.x, L.y + 0.44, 0),
  new THREE.CylinderGeometry(0.31, 0.31, 0.04, 6).translate(L.x, L.y + 0.31, 0),
  new THREE.CylinderGeometry(0.31, 0.24, 0.07, 6).translate(L.x, L.y - 0.32, 0),
  ...Array.from({ length: 6 }, (_, k) => { const a = (k / 6) * TAU; return palo(new V3(L.x + Math.cos(a) * 0.28, L.y - 0.3, Math.sin(a) * 0.28), new V3(L.x + Math.cos(a) * 0.28, L.y + 0.3, Math.sin(a) * 0.28), 0.014); }),
]);
const NM = maderas.length;
const vinesM = new THREE.InstancedMesh(vineMaderaGeo, vineMat, NM);
const wood = new THREE.InstancedMesh(woodGeo, new THREE.MeshStandardMaterial({ map: woodTex, roughness: 0.85 }), NM);
const metal = new THREE.InstancedMesh(metalGeo, new THREE.MeshStandardMaterial({ color: '#4a3a2a', roughness: 0.4, metalness: 0.6 }), NM);
const glassMat = new THREE.MeshStandardMaterial({ color: '#f6d8ff', emissive: '#e7a4ff', emissiveIntensity: 1.3, transparent: true, opacity: 0.55, roughness: 0.15, depthWrite: false });
const glass = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.28, 0.28, 0.58, 6).translate(L.x, L.y, 0), glassMat, NM);
const core = new THREE.InstancedMesh(new THREE.SphereGeometry(0.12, 12, 10).translate(L.x, L.y, 0), new THREE.MeshBasicMaterial({ color: '#ffe6ff' }), NM);
const crystalMat = new THREE.MeshStandardMaterial({ color: '#c98bff', emissive: '#c77dff', emissiveIntensity: 1.6, roughness: 0.15, metalness: 0.1 });
const crystal = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.1).scale(1, 1.9, 1).translate(L.x, L.y - 0.56, 0), crystalMat, NM);
const rocks = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.4, 1), new THREE.MeshStandardMaterial({ map: stoneTex, roughness: 0.95 }), NM * 3);
const poolMMat = new THREE.MeshBasicMaterial({ map: poolTex(225, 150, 255), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
const poolsM = new THREE.InstancedMesh(new THREE.CircleGeometry(6, 40).rotateX(-Math.PI / 2), poolMMat, NM);
// florcitas rosadas al pie de cada farol grande
const NF = NM * 12;
const fStems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.01, 0.014, 1, 4).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: '#4f7f2a' }), NF);
const fHeads = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.075, 0).scale(1, 0.5, 1), new THREE.MeshStandardMaterial({ color: '#ff8fd0', emissive: '#ff5fb8', emissiveIntensity: 0.35, roughness: 0.6 }), NF);
wood.castShadow = metal.castShadow = rocks.castShadow = true;
wood.receiveShadow = rocks.receiveShadow = true;

// ---------------------------------------------------------------------
// Colocar todo
// ---------------------------------------------------------------------
const d = new THREE.Object3D();
const glows = [], luces = [], orbitCentros = [];
piedras.forEach((o, i) => {
  d.position.set(o.p.x, 0, o.p.z); d.rotation.set(0, o.rot, 0); d.scale.setScalar(ESCALA_PIEDRA); d.updateMatrix();
  stone.setMatrixAt(i, d.matrix); wins.setMatrixAt(i, d.matrix); inner.setMatrixAt(i, d.matrix); vinesP.setMatrixAt(i, d.matrix);
  d.scale.setScalar(1); d.position.y = 0.026; d.updateMatrix(); poolsP.setMatrixAt(i, d.matrix);
  const gy = 1.22 * ESCALA_PIEDRA;
  const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffbf70', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.7 }));
  g.position.set(o.p.x, gy, o.p.z); g.scale.setScalar(2.4 * ESCALA_PIEDRA / 1.2);
  scene.add(g); glows.push({ g, base: 0.7, ph: rnd() * 10 });
  if (o.luz) { const l = new THREE.PointLight('#ffb86b', 34, 15, 2); l.position.set(o.p.x, gy, o.p.z); scene.add(l); luces.push({ l, base: 34, ph: rnd() * 10 }); }
});
let fi = 0;
maderas.forEach((o, i) => {
  d.position.set(o.p.x, 0, o.p.z); d.rotation.set(0, o.rot, 0); d.scale.setScalar(ESCALA_MADERA); d.updateMatrix();
  for (const im of [wood, metal, glass, core, crystal, vinesM]) im.setMatrixAt(i, d.matrix);
  const centro = L.clone().applyMatrix4(d.matrix);
  d.scale.setScalar(EM); d.position.y = 0.026; d.updateMatrix(); poolsM.setMatrixAt(i, d.matrix);
  for (let k = 0; k < 3; k++) {                                         // rocas
    const a = o.rot + k * 2.1 + rnd(), r = (0.45 + rnd() * 0.35) * EM;
    d.position.set(o.p.x + Math.cos(a) * r, 0.08, o.p.z + Math.sin(a) * r);
    d.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3);
    const sc = (0.6 + rnd() * 0.7) * Math.sqrt(EM); d.scale.set(sc * 1.2, sc * 0.6, sc); d.updateMatrix();
    rocks.setMatrixAt(i * 3 + k, d.matrix);
  }
  for (let k = 0; k < 12; k++) {                                        // flores
    const a = rnd() * TAU, r = (0.7 + rnd() * 1.1) * EM, h = 0.18 + rnd() * 0.22;
    const x = o.p.x + Math.cos(a) * r, z = o.p.z + Math.sin(a) * r;
    d.position.set(x, 0, z); d.rotation.set(0, 0, 0); d.scale.set(1, h, 1); d.updateMatrix(); fStems.setMatrixAt(fi, d.matrix);
    d.position.set(x, h, z); d.rotation.set(0, rnd() * 3, 0); d.scale.setScalar(0.8 + rnd() * 0.6); d.updateMatrix(); fHeads.setMatrixAt(fi, d.matrix);
    fi++;
  }
  const g = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#e49bff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.85 }));
  g.position.copy(centro); g.scale.setScalar(3.8 * EM);
  scene.add(g); glows.push({ g, base: 0.85, ph: rnd() * 10 });
  orbitCentros.push(centro);
  if (o.luz) { const l = new THREE.PointLight('#e59bff', 90 * EM, 22 * EM, 2); l.position.copy(centro); scene.add(l); luces.push({ l, base: 90 * EM, ph: rnd() * 10 }); }
});
vinesP.castShadow = vinesM.castShadow = true;
scene.add(stone, wins, inner, poolsP, wood, metal, glass, core, crystal, rocks, poolsM, fStems, fHeads, vinesP, vinesM);

// ---------------------------------------------------------------------
// 🥭 Dos fuentes de piedra con agua luminosa a los costados del árbol:
// la luz sale del agua hacia arriba e ilumina los mangos bajo la copa
// (luz fija, sin parpadeo)
// ---------------------------------------------------------------------
const aguaU = { uTime: { value: 0 }, uScale: { value: 1 } };
const aguaMat = new THREE.ShaderMaterial({
  uniforms: aguaU,
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `
    uniform float uTime; varying vec2 vUv;
    void main(){
      float r = length(vUv - 0.5) * 2.0;
      float ondas = 0.5 + 0.5 * sin(r * 26.0 - uTime * 2.0);
      vec3 centro = vec3(1.0, 0.96, 0.86), borde = vec3(1.0, 0.82, 0.55);
      vec3 col = mix(centro, borde, smoothstep(0.0, 1.0, r));
      float brillo = 1.55 * (1.0 - 0.45 * r) + ondas * 0.12 * (1.0 - r);
      gl_FragColor = vec4(col * brillo, 1.0);
    }`,
});
const fuenteGeo = new THREE.LatheGeometry([
  [0, 0], [0.78, 0], [0.84, 0.08], [0.8, 0.5], [0.86, 0.56], [0.84, 0.64], [0.7, 0.64], [0.66, 0.58], [0.64, 0.5], [0, 0.5],
].map(([x, y]) => new THREE.Vector2(x, y)), 40);
const fuenteMat = new THREE.MeshStandardMaterial({ map: stoneTex, color: '#e2d8c8', roughness: 0.85, emissive: '#3a2a18', emissiveIntensity: 0.25 });
// haz de luz suave que sube del agua: se desvanece hacia arriba y en los bordes (sin bordes duros)
const hazMat = new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
  uniforms: aguaU,
  vertexShader: `
    varying float vH; varying float vEdge;
    void main(){
      vH = uv.y;
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vec3 n = normalize(normalMatrix * normal);
      vEdge = abs(dot(n, normalize(-mv.xyz)));
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform float uTime; varying float vH; varying float vEdge;
    void main(){
      float sube = pow(1.0 - vH, 1.6);                         // fuerte abajo, se apaga arriba
      float suave = pow(vEdge, 2.2);                           // bordes difusos
      float vida = 0.9 + 0.1 * sin(vH * 18.0 - uTime * 1.5);   // pulsos de luz subiendo
      gl_FragColor = vec4(vec3(1.0, 0.86, 0.6), 0.16 * sube * suave * vida);
    }`,
});
// motitas de luz que suben del agua
const MOT = 14;
const motPos = new Float32Array(2 * MOT * 3), motPh = new Float32Array(2 * MOT);
const focos = [];
[1, -1].forEach((lado, li) => {
  const base = new V3(3.5 * lado, 0, 1.4);                 // a los costados del tronco
  const mira = new V3(7.6 * lado, 8.8, 2.6);
  const fuente = new THREE.Mesh(fuenteGeo, fuenteMat);
  fuente.position.copy(base); fuente.castShadow = fuente.receiveShadow = true;
  const agua = new THREE.Mesh(new THREE.CircleGeometry(0.64, 48).rotateX(-Math.PI / 2), aguaMat);
  agua.position.set(base.x, 0.56, base.z);
  const spot = new THREE.SpotLight('#ffe2b0', 420, 26, 0.62, 0.55, 2);
  spot.position.set(base.x, 0.7, base.z);
  spot.target.position.copy(mira);
  const dir = mira.clone().sub(base).normalize();
  const largo = 8.5;
  const hazGeo = new THREE.CylinderGeometry(2.4, 0.62, largo, 40, 1, true).translate(0, largo / 2, 0);
  const haz = new THREE.Mesh(hazGeo, hazMat);
  haz.position.set(base.x, 0.58, base.z);
  haz.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir);
  scene.add(fuente, agua, haz, spot, spot.target);
  focos.push({ spot });
  for (let k = 0; k < MOT; k++) {
    const a = rnd() * TAU, r = rnd() * 0.5;
    motPos.set([base.x + Math.cos(a) * r, 0.58, base.z + Math.sin(a) * r], (li * MOT + k) * 3);
    motPh[li * MOT + k] = rnd();
  }
});
{
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(motPos, 3));
  g.setAttribute('aPh', new THREE.BufferAttribute(motPh, 1));
  const motas = new THREE.Points(g, new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: aguaU,
    vertexShader: `
      attribute float aPh; uniform float uTime; uniform float uScale; varying float vA;
      void main(){
        float u = fract(aPh + uTime * 0.12);
        vec3 p = position + vec3(sin(uTime + aPh * 20.0) * 0.08, u * 3.2, cos(uTime * 0.8 + aPh * 17.0) * 0.08);
        vA = smoothstep(0.0, 0.1, u) * (1.0 - u);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = 0.06 * uScale * 2.75 / -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `varying float vA; void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(1.0, 0.92, 0.75) * 1.3, smoothstep(0.5, 0.0, d) * vA); }`,
  }));
  motas.frustumCulled = false;
  scene.add(motas);
}

// chispitas mágicas que giran alrededor de cada linterna grande
const ORB = 16;
const orbPos = new Float32Array(NM * ORB * 3), orbPh = new Float32Array(NM * ORB);
orbitCentros.forEach((c, i) => { for (let k = 0; k < ORB; k++) { orbPos.set([c.x, c.y, c.z], (i * ORB + k) * 3); orbPh[i * ORB + k] = rnd(); } });
const orbGeo = new THREE.BufferGeometry();
orbGeo.setAttribute('position', new THREE.BufferAttribute(orbPos, 3));
orbGeo.setAttribute('aPh', new THREE.BufferAttribute(orbPh, 1));
const orbU = { uTime: { value: 0 }, uScale: { value: 1 } };
const orbs = new THREE.Points(orbGeo, new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: orbU,
  vertexShader: `
    attribute float aPh; uniform float uTime; uniform float uScale; varying float vA;
    void main(){
      float a = uTime * (0.7 + aPh * 0.6) + aPh * 6.2831;
      float r = (0.55 + 0.12 * sin(uTime * 2.0 + aPh * 10.0)) * ${EM.toFixed(2)};
      vec3 p = position + vec3(cos(a) * r, sin(uTime * 1.3 + aPh * 20.0) * 0.4 * ${EM.toFixed(2)}, sin(a) * r);
      vA = 0.55 + 0.45 * sin(uTime * 4.0 + aPh * 30.0);
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      gl_PointSize = 0.07 * ${Math.sqrt(EM).toFixed(2)} * uScale * 2.75 / -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying float vA;
    void main(){ float d = length(gl_PointCoord - 0.5); gl_FragColor = vec4(vec3(1.0, 0.75, 1.0) * 1.4, smoothstep(0.5, 0.0, d) * vA); }`,
}));
orbs.frustumCulled = false;
scene.add(orbs);
const escala = () => { orbU.uScale.value = aguaU.uScale.value = renderer.getPixelRatio() * innerHeight * 0.5; };
escala();
addEventListener('resize', escala);

// ---------------------------------------------------------------------
// Animación: titileo suave (y se apagan si algún día vuelve el día)
// ---------------------------------------------------------------------
export function updateFaroles(t) {
  const f = ambiente.faroles;
  orbU.uTime.value = t;
  for (const o of focos) o.spot.intensity = f * 420;            // fuentes del árbol: luz constante
  aguaU.uTime.value = t;
  winMat.emissiveIntensity = f * (2.2 + 0.25 * Math.sin(t * 7.1) + 0.12 * Math.sin(t * 13.3));
  glassMat.emissiveIntensity = 0.2 + f * 1.2;
  crystalMat.emissiveIntensity = 0.3 + f * (1.4 + 0.3 * Math.sin(t * 2));
  poolPMat.opacity = f * 0.6;
  poolMMat.opacity = f * 0.55;
  orbs.visible = f > 0.05;
  inner.visible = f > 0.05;
  core.visible = f > 0.05;
  for (const o of glows) o.g.material.opacity = f * o.base * (0.9 + 0.1 * Math.sin(t * 6 + o.ph));
  for (const o of luces) o.l.intensity = f * o.base * (0.92 + 0.08 * Math.sin(t * 6 + o.ph));
}
