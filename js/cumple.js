// =====================================================================
// cumple.js — 🎂 MESA DE CUMPLEAÑOS
// Mesa con mantel, torta con velitas, cupcakes, galletas, macarons,
// jugo de mango, globos y regalos. Interacción: nota → pedir deseo →
// soplar las velas (una sola vez; queda guardado).
// =====================================================================
import * as THREE from 'three';
import { scene, glowTex, flyTo, camState, clock } from './motor.js';
import { PUNTOS, CENTRO, TAMANO_MESA_CUMPLE as K } from './mundo.js';
import { canvasTex, TAU, V3, mrr, clamp01 } from './utils.js';
import { CUMPLE } from './contenido.js';
import { progreso, guardar } from './progreso.js';

const $ = (id) => document.getElementById(id);

// La mesa mira hacia el jardín central (su frente = +z local)
export const mesa = new THREE.Group();
const PM = PUNTOS.cumple.pos;
mesa.position.set(PM.x, 0, PM.z);
mesa.rotation.y = Math.atan2(CENTRO.x - PM.x, CENTRO.z - PM.z);
mesa.scale.setScalar(K);                  // todo el conjunto, 2.5 veces más grande
scene.add(mesa);

const TOP = 0.8;                          // altura de la mesa
const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.7, ...extra });
function put(geo, mat, x, y, z, o = {}) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  if (o.rx) m.rotation.x = o.rx;
  if (o.ry) m.rotation.y = o.ry;
  if (o.rz) m.rotation.z = o.rz;
  if (o.s) Array.isArray(o.s) ? m.scale.set(...o.s) : m.scale.setScalar(o.s);
  m.castShadow = o.cast !== false;
  m.receiveShadow = true;
  (o.parent || mesa).add(m);
  return m;
}

// ---------- Mesa y mantel ----------
{
  const wood = std('#9a6b45', { roughness: 0.8 });
  const leg = new THREE.CylinderGeometry(0.035, 0.03, TOP - 0.02, 8);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    put(leg, wood, Math.cos(a) * 0.72, (TOP - 0.02) / 2, Math.sin(a) * 0.72);
  }
  // mantel con lunares y encaje
  const skirtTex = canvasTex(512, 256, (g, w, h) => {
    g.fillStyle = '#fff6f0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f6cbd8';
    for (let y = 18, row = 0; y < h - 50; y += 30, row++) for (let x = (row % 2) * 16; x < w; x += 32) { g.beginPath(); g.arc(x, y, 4.5, 0, TAU); g.fill(); }
    g.fillStyle = '#f2a9c0'; g.fillRect(0, h - 52, w, 6);                 // cinta
    g.fillStyle = '#ffffff';                                              // encaje (ondas)
    for (let x = 0; x < w; x += 24) { g.beginPath(); g.arc(x + 12, h - 30, 12, 0, Math.PI); g.fill(); }
    g.fillRect(0, h - 44, w, 14);
    g.fillStyle = '#f6dbe3';
    for (let x = 0; x < w; x += 24) { g.beginPath(); g.arc(x + 12, h - 30, 3, 0, TAU); g.fill(); }
  });
  skirtTex.wrapS = THREE.RepeatWrapping; skirtTex.repeat.set(4, 1);
  const skirt = new THREE.CylinderGeometry(1.2, 1.3, 0.46, 96, 6, true);
  const p = skirt.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const t = (0.23 - y) / 0.46, a = Math.atan2(z, x);
    const k = 1 + t * t * 0.04 * Math.sin(a * 14);
    p.setXYZ(i, x * k, y - t * t * 0.02 * (1 + Math.sin(a * 14)), z * k);
  }
  skirt.computeVertexNormals();
  put(skirt, std('#ffffff', { map: skirtTex, side: THREE.DoubleSide, roughness: 0.9 }), 0, TOP - 0.23, 0);
  const topTex = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#fff6f0'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#f8d4df';
    for (let y = 8, row = 0; y < h; y += 22, row++) for (let x = (row % 2) * 11; x < w; x += 22) { g.beginPath(); g.arc(x, y, 3, 0, TAU); g.fill(); }
  });
  put(new THREE.CircleGeometry(1.2, 96), std('#ffffff', { map: topTex, roughness: 0.9 }), 0, TOP + 0.002, 0, { rx: -Math.PI / 2, cast: false });

  // pétalos sueltos sobre el mantel
  const petals = new THREE.InstancedMesh(new THREE.CircleGeometry(0.022, 8), std('#f4b0c5', { side: THREE.DoubleSide }), 34);
  const d = new THREE.Object3D();
  for (let i = 0; i < 34; i++) {
    const a = Math.random() * TAU, r = mrr(0.82, 1.12);
    d.position.set(Math.cos(a) * r, TOP + 0.004 + i * 0.0001, Math.sin(a) * r);
    d.rotation.set(-Math.PI / 2, 0, Math.random() * TAU);
    d.scale.set(1.6, 1, 1);
    d.updateMatrix(); petals.setMatrixAt(i, d.matrix);
  }
  mesa.add(petals);
}

// ---------- Torta ----------
const S = TOP + 0.145;                      // superficie del platón
const cake = new THREE.Group();
mesa.add(cake);
function dripRing(r, h, color) {            // glaseado que chorrea por el borde
  const g = new THREE.CylinderGeometry(r, r, h, 96, 6, true);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const drip = 0.5 + 0.5 * Math.sin(a * 9 + 1.3) * Math.sin(a * 5) + 0.3 * Math.sin(a * 17);
    if (y < 0) p.setY(i, y - Math.max(0, drip) * h * 0.9 * ((-y) / (h / 2)));
  }
  g.computeVertexNormals();
  return new THREE.Mesh(g, std(color, { roughness: 0.3, side: THREE.DoubleSide }));
}
{
  const ceramic = std('#fbfbf7', { roughness: 0.25 });
  put(new THREE.CylinderGeometry(0.05, 0.09, 0.12, 24), ceramic, 0, TOP + 0.06, 0, { parent: cake });
  put(new THREE.CylinderGeometry(0.36, 0.33, 0.025, 48), ceramic, 0, TOP + 0.132, 0, { parent: cake });
  const cream = std('#fff4e8', { roughness: 0.55 });
  put(new THREE.CylinderGeometry(0.3, 0.3, 0.22, 64), cream, 0, S + 0.11, 0, { parent: cake });
  const d1 = dripRing(0.304, 0.11, '#f2a2bd'); d1.position.set(0, S + 0.22 - 0.055, 0); d1.castShadow = true; cake.add(d1);
  put(new THREE.CylinderGeometry(0.304, 0.304, 0.012, 64), std('#f2a2bd', { roughness: 0.3 }), 0, S + 0.226, 0, { parent: cake });
  put(new THREE.CylinderGeometry(0.2, 0.2, 0.16, 64), cream, 0, S + 0.312, 0, { parent: cake });
  const d2 = dripRing(0.204, 0.08, '#f5b335'); d2.position.set(0, S + 0.392 - 0.04, 0); d2.castShadow = true; cake.add(d2);
  put(new THREE.CylinderGeometry(0.204, 0.204, 0.01, 64), std('#f5b335', { roughness: 0.3 }), 0, S + 0.397, 0, { parent: cake });
  // perlitas en la base de cada piso
  const pearls = new THREE.InstancedMesh(new THREE.SphereGeometry(0.012, 10, 8), std('#fff6e0', { roughness: 0.2, metalness: 0.3 }), 92);
  const d = new THREE.Object3D();
  let n = 0;
  for (const [r, y, c] of [[0.306, S + 0.012, 56], [0.206, S + 0.236, 36]]) {
    for (let i = 0; i < c; i++) { const a = (i / c) * TAU; d.position.set(Math.cos(a) * r, y, Math.sin(a) * r); d.updateMatrix(); pearls.setMatrixAt(n++, d.matrix); }
  }
  cake.add(pearls);
  // cubitos de mango y frambuesas encima
  const mangoMat = std('#f7a12a', { roughness: 0.35 });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * TAU + 0.3;
    put(new THREE.BoxGeometry(0.034, 0.03, 0.034), mangoMat, Math.cos(a) * 0.165, S + 0.416, Math.sin(a) * 0.165, { parent: cake, ry: a, rz: 0.2 });
  }
  const berry = std('#d23f5c', { roughness: 0.4 });
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * TAU;
    put(new THREE.SphereGeometry(0.018, 12, 10), berry, Math.cos(a) * 0.255, S + 0.24, Math.sin(a) * 0.255, { parent: cake });
  }
}

// ---------- Velitas ----------
const flameTex = canvasTex(64, 128, (g) => {
  g.save(); g.scale(1, 1.9);
  const gr = g.createRadialGradient(32, 40, 0, 32, 40, 30);
  gr.addColorStop(0, 'rgba(255,255,235,1)');
  gr.addColorStop(0.3, 'rgba(255,220,120,0.95)');
  gr.addColorStop(0.62, 'rgba(255,150,60,0.55)');
  gr.addColorStop(1, 'rgba(255,120,40,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 128); g.restore();
});
const stripeTex = canvasTex(32, 64, (g) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 32, 64);
  g.strokeStyle = '#f29bb8'; g.lineWidth = 6;
  for (let y = -32; y < 96; y += 16) { g.beginPath(); g.moveTo(0, y); g.lineTo(32, y + 16); g.stroke(); }
});
const smokeTex = canvasTex(64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(235,235,235,0.9)'); gr.addColorStop(1, 'rgba(235,235,235,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
});
const velas = [];
const VTOP = S + 0.397;
{
  const n = Math.max(1, CUMPLE.velas | 0);
  const candleMat = std('#ffffff', { map: stripeTex, roughness: 0.5 });
  const wickMat = std('#2b2420');
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + 0.4, r = n === 1 ? 0 : 0.095;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    put(new THREE.CylinderGeometry(0.012, 0.012, 0.13, 12), candleMat, x, VTOP + 0.065, z, { parent: cake });
    put(new THREE.CylinderGeometry(0.0022, 0.0022, 0.016, 4), wickMat, x, VTOP + 0.138, z, { parent: cake, cast: false });
    const flame = new THREE.Sprite(new THREE.SpriteMaterial({
      map: flameTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    }));
    flame.center.set(0.5, 0.18);
    flame.position.set(x, VTOP + 0.142, z);
    flame.scale.set(0.045, 0.095, 1);
    cake.add(flame);
    velas.push({ flame, pos: new V3(x, VTOP + 0.15, z), lit: true, vis: 1, th: mrr(0.3, 0.92), acc: 0, ph: Math.random() * 10 });
  }
}
const candleGlow = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, color: '#ffb35c', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.45,
}));
candleGlow.position.set(0, VTOP + 0.2, 0);
candleGlow.scale.setScalar(0.55);
cake.add(candleGlow);
const candleLight = new THREE.PointLight('#ffb050', 3 * K * K, 3.5 * K, 2);
candleLight.position.set(0, VTOP + 0.3, 0);
cake.add(candleLight);
// ---------- ¿Puede pedir deseo? (uno por cumpleaños: el 14 de noviembre) ----------
const DIA_CUMPLE = { mes: 10, dia: 14 };                 // 14/11 (los meses en JS empiezan en 0)
function proximoCumple(desde) {
  const d = new Date(desde);
  let c = new Date(d.getFullYear(), DIA_CUMPLE.mes, DIA_CUMPLE.dia);
  if (d >= c) c = new Date(d.getFullYear() + 1, DIA_CUMPLE.mes, DIA_CUMPLE.dia);
  return c;                                              // si lo pidió el 15/11/2026 → 14/11/2027
}
function fechaDeseo() { return progreso.deseoFecha || new Date(2026, DIA_CUMPLE.mes, DIA_CUMPLE.dia, 12).getTime(); }
function yaPidio() { return progreso.deseo && Date.now() < proximoCumple(fechaDeseo()).getTime(); }
if (yaPidio()) for (const v of velas) { v.lit = false; v.vis = 0; }

// ---------- Cupcakes ----------
function cupcake(liner, frost, x, z) {
  const g = new THREE.Group(); g.position.set(x, TOP, z); mesa.add(g);
  const lg = new THREE.CylinderGeometry(0.07, 0.052, 0.075, 24, 1);
  const p = lg.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const a = Math.atan2(p.getZ(i), p.getX(i)), k = 1 + 0.035 * Math.sign(Math.sin(a * 12));
    p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k);
  }
  lg.computeVertexNormals();
  put(lg, std(liner, { roughness: 0.6 }), 0, 0.0375, 0, { parent: g });
  const fm = std(frost, { roughness: 0.45 });
  put(new THREE.TorusGeometry(0.055, 0.03, 12, 32), fm, 0, 0.085, 0, { parent: g, rx: -Math.PI / 2 });
  put(new THREE.TorusGeometry(0.034, 0.024, 12, 28), fm, 0, 0.115, 0, { parent: g, rx: -Math.PI / 2 });
  put(new THREE.ConeGeometry(0.028, 0.05, 16), fm, 0, 0.145, 0, { parent: g });
  put(new THREE.SphereGeometry(0.019, 12, 10), std('#c8233b', { roughness: 0.2 }), 0.006, 0.178, 0, { parent: g });
}
cupcake('#f6c1d1', '#fff1f5', -0.66, 0.22);
cupcake('#c7e3f2', '#f9d3e1', -0.46, 0.52);
cupcake('#fde7a6', '#e9dcfa', 0.66, 0.22);
cupcake('#d6c6f3', '#fff4dc', 0.46, 0.52);

// ---------- Galletas y macarons ----------
{
  const plate = new THREE.CylinderGeometry(0.2, 0.17, 0.02, 32);
  const ceramic = std('#fbfbf7', { roughness: 0.25 });
  put(plate, ceramic, 0.6, TOP + 0.01, -0.45);
  put(plate, ceramic, -0.6, TOP + 0.01, -0.45);
  const cookie = new THREE.CylinderGeometry(0.055, 0.055, 0.015, 20);
  const cm = std('#d9a066', { roughness: 0.9 });
  const chips = new THREE.InstancedMesh(new THREE.SphereGeometry(0.008, 6, 5), std('#4a2c1a'), 30);
  const d = new THREE.Object3D();
  let n = 0;
  [[0, 0], [0.09, 0.04], [-0.08, 0.06], [0.03, -0.09], [-0.07, -0.06]].forEach(([cx, cz], i) => {
    const y = TOP + 0.028 + (i === 0 ? 0.016 : 0);
    put(cookie, cm, 0.6 + cx, y, -0.45 + cz, { rx: mrr(-0.08, 0.08), rz: mrr(-0.08, 0.08) });
    for (let k = 0; k < 6; k++) {
      const a = Math.random() * TAU, r = Math.random() * 0.042;
      d.position.set(0.6 + cx + Math.cos(a) * r, y + 0.008, -0.45 + cz + Math.sin(a) * r);
      d.updateMatrix(); chips.setMatrixAt(n++, d.matrix);
    }
  });
  mesa.add(chips);
  const colors = ['#f7b9cc', '#d7c4f2', '#bfe8d2', '#fde6a2', '#ffd0b5', '#c4ddf6'];
  const shell = new THREE.SphereGeometry(0.032, 16, 10);
  const fill = new THREE.CylinderGeometry(0.027, 0.027, 0.012, 16);
  const fillMat = std('#fff8ef');
  colors.forEach((c, i) => {
    const a = (i / 6) * TAU, r = i === 5 ? 0 : 0.1;
    const x = -0.6 + Math.cos(a) * r, z = -0.45 + Math.sin(a) * r, y = TOP + 0.04 + (i === 5 ? 0.03 : 0);
    const m = std(c, { roughness: 0.6 });
    put(shell, m, x, y + 0.012, z, { s: [1, 0.45, 1] });
    put(shell, m, x, y - 0.012, z, { s: [1, 0.45, 1] });
    put(fill, fillMat, x, y, z);
  });
}

// ---------- Jugo de mango ----------
{
  const glassGeo = new THREE.LatheGeometry([
    new THREE.Vector2(0, 0), new THREE.Vector2(0.045, 0), new THREE.Vector2(0.047, 0.006),
    new THREE.Vector2(0.051, 0.15), new THREE.Vector2(0.047, 0.15), new THREE.Vector2(0.043, 0.01), new THREE.Vector2(0, 0.01),
  ], 28);
  const glassMat = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.05, transparent: true, opacity: 0.3, clearcoat: 1, depthWrite: false });
  const juice = std('#f7a531', { roughness: 0.15, transparent: true, opacity: 0.92 });
  const strawMat = std('#ffffff', { map: stripeTex });
  for (const x of [-0.27, 0.27]) {
    put(new THREE.CylinderGeometry(0.043, 0.041, 0.1, 24), juice, x, TOP + 0.062, 0.74, { cast: false });
    put(glassGeo, glassMat, x, TOP, 0.74, { cast: false });
    put(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 8), strawMat, x + 0.015, TOP + 0.14, 0.74, { rz: -0.25 * Math.sign(x) });
  }
}

// ---------- Regalos ----------
function regalo(w, h, dd, color, cinta, x, y, z, ry) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; mesa.add(g);
  put(new THREE.BoxGeometry(w, h, dd), std(color, { roughness: 0.55 }), 0, h / 2, 0, { parent: g });
  const cm = std(cinta, { roughness: 0.35, metalness: 0.15 });
  const s = Math.min(w, dd);
  put(new THREE.BoxGeometry(w + 0.004, h + 0.004, s * 0.14), cm, 0, h / 2, 0, { parent: g });
  put(new THREE.BoxGeometry(s * 0.14, h + 0.004, dd + 0.004), cm, 0, h / 2, 0, { parent: g });
  const bow = new THREE.TorusGeometry(s * 0.16, s * 0.05, 8, 18);
  put(bow, cm, -s * 0.13, h + s * 0.1, 0, { parent: g, rz: 0.5 });
  put(bow, cm, s * 0.13, h + s * 0.1, 0, { parent: g, rz: -0.5 });
  put(new THREE.SphereGeometry(s * 0.07, 10, 8), cm, 0, h + s * 0.04, 0, { parent: g });
  return g;
}
regalo(0.45, 0.35, 0.45, '#f6b9cd', '#ffffff', -1.75, 0, -0.5, 0.3);
regalo(0.3, 0.3, 0.3, '#cdb8f0', '#f3c75a', -1.55, 0, -1.15, -0.2);
regalo(0.5, 0.3, 0.38, '#bfe6cf', '#f29bb8', 1.7, 0, -0.7, -0.35);
regalo(0.28, 0.24, 0.28, '#fde49c', '#b49be0', 1.45, 0, -1.3, 0.5);
regalo(0.14, 0.12, 0.14, '#f8c7d6', '#e9b949', -0.9, TOP, 0.12, 0.4);

// ---------- Carta para Kiara (sobre en la mesa, delante de la torta) ----------
const sobreCarta = new THREE.Group();
sobreCarta.position.set(0, TOP + 0.004, 0.56);
sobreCarta.rotation.y = 0.1;
sobreCarta.userData.cartaCumple = true;
mesa.add(sobreCarta);
const solapa = new THREE.Group();
{
  const W = 0.3, D = 0.2;
  const tex = canvasTex(512, 342, (g, w, h) => {
    g.fillStyle = '#fbefe6'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ecd2c0'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(0, h); g.lineTo(w / 2, h * 0.42); g.lineTo(w, h); g.stroke();
    g.fillStyle = '#9a4a62'; g.textAlign = 'center';
    g.font = 'italic 600 54px Georgia, serif';
    g.fillText('Para Kiara ♡', w / 2, h * 0.8);
  });
  put(new THREE.BoxGeometry(W, 0.007, D), std('#ffffff', { map: tex, roughness: 0.8 }), 0, 0, 0, { parent: sobreCarta });
  put(new THREE.BoxGeometry(W * 0.9, 0.002, D * 0.85), std('#fffdf7', { roughness: 0.9 }), 0, 0.002, 0, { parent: sobreCarta });
  solapa.position.set(0, 0.005, -D / 2); sobreCarta.add(solapa);
  const tri = new THREE.Shape();
  tri.moveTo(-W / 2, 0); tri.lineTo(W / 2, 0); tri.lineTo(0, D * 0.6); tri.lineTo(-W / 2, 0);
  put(new THREE.ShapeGeometry(tri), std('#f6dccb', { roughness: 0.8, side: THREE.DoubleSide }), 0, 0, 0, { parent: solapa, rx: Math.PI / 2 });
  put(new THREE.CylinderGeometry(0.022, 0.022, 0.007, 24), std('#c94a62', { roughness: 0.35, emissive: '#5a1020', emissiveIntensity: 0.4 }), 0, 0.004, D * 0.58, { parent: solapa });
}
const brilloCarta = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffc2d6', transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending }));
brilloCarta.scale.setScalar(0.45); brilloCarta.position.set(0, 0.03, 0); sobreCarta.add(brilloCarta);
export const esCartaCumple = (obj) => { for (let o = obj; o; o = o.parent) if (o.userData.cartaCumple) return true; return false; };

// ---------- Globos ----------
const globos = [];
{
  const geo = new THREE.LatheGeometry([
    [0, 0], [0.02, 0], [0.03, 0.03], [0.08, 0.06], [0.17, 0.14], [0.24, 0.26],
    [0.27, 0.38], [0.26, 0.5], [0.21, 0.6], [0.12, 0.665], [0, 0.68],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 32);
  const lineMat = new THREE.LineBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85 });
  const conf = [
    ['#f7a8c4', [-1.75, 0.45, -0.5], [-1.95, 2.6, -1.0]],
    ['#ffd27a', [1.7, 0.3, -0.7], [2.0, 2.45, -1.15]],
    ['#c9b3f0', [-0.85, TOP, -0.8], [-1.05, 3.0, -1.45]],
    ['#a8d8f0', [0.85, TOP, -0.8], [1.1, 3.2, -1.55]],
    ['#fbe3ec', [0, TOP, -1.15], [0.12, 3.5, -1.95]],
    ['#b8e6c9', [-1.55, 0.3, -1.15], [-1.45, 2.25, -1.95]],
  ];
  for (const [color, anchor, pos] of conf) {
    const mat = new THREE.MeshPhysicalMaterial({ color, roughness: 0.25, clearcoat: 0.7, clearcoatRoughness: 0.2, sheen: 0.3 });
    const b = new THREE.Mesh(geo, mat);
    b.castShadow = true;
    b.position.set(...pos);
    mesa.add(b);
    const lg = new THREE.BufferGeometry().setFromPoints(Array.from({ length: 14 }, () => new V3()));
    const line = new THREE.Line(lg, lineMat);
    line.raycast = () => {};          // el hilo no cuenta para los clics
    line.frustumCulled = false;
    mesa.add(line);
    globos.push({ b, line, anchor: new V3(...anchor), base: new V3(...pos), ph: Math.random() * 10 });
  }
}

// ---------- Humo y confeti ----------
const humos = [];
function humo(local) {
  const w = cake.localToWorld(local.clone());
  for (let i = 0; i < 10; i++) {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: smokeTex, transparent: true, depthWrite: false, opacity: 0 }));
    s.position.copy(w);
    s.scale.setScalar(0.04 * K);
    scene.add(s);
    humos.push({ s, life: -i * 0.12, ph: Math.random() * 6 });
  }
}
const CONF = 240;
const confeti = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.035 * K, 0.02 * K), std('#ffffff', { side: THREE.DoubleSide, roughness: 0.6 }), CONF);
for (let i = 0; i < CONF; i++) confeti.setColorAt(i, new THREE.Color('#ffffff'));
confeti.count = 0;
confeti.frustumCulled = false;
scene.add(confeti);
const confData = [];
let confT = -1;
function lanzarConfeti() {
  const c = cake.localToWorld(new V3(0, VTOP + 0.2, 0));
  const pal = ['#f7a8c4', '#ffd27a', '#c9b3f0', '#a8d8f0', '#b8e6c9', '#ffffff', '#f5b335', '#e98aa8'];
  const col = new THREE.Color();
  confData.length = 0;
  for (let i = 0; i < CONF; i++) {
    const a = Math.random() * TAU, sp = mrr(0.6, 1.7) * K;
    confData.push({
      p: c.clone(),
      v: new V3(Math.cos(a) * sp, mrr(2.6, 4.6) * K, Math.sin(a) * sp),
      r: new THREE.Euler(Math.random() * 6, Math.random() * 6, Math.random() * 6),
      w: new V3(mrr(-8, 8), mrr(-8, 8), mrr(-8, 8)),
    });
    confeti.setColorAt(i, col.set(pal[i % pal.length]));
  }
  confeti.instanceColor.needsUpdate = true;
  confeti.count = CONF;
  confT = 0;
}

// =====================================================================
// Interacción
// =====================================================================
let estado = 'cerrado';    // nota · deseo · soplar · hecho · ya
let fuerza = 0, soplando = false, ctx = null, timer = null, reloj = null;
export const cumpleAbierto = () => $('cumple').classList.contains('open');
export function initCumple(c) { ctx = c; }

function mostrar(ids, visible) { for (const id of ids) $(id).hidden = !visible; }
function pintar() {
  const t = $('cTexto'), b = $('cBtn');
  const carta = CUMPLE.carta || {};
  $('cTitulo').textContent = CUMPLE.titulo;
  mostrar(['cHold', 'cHint', 'cRespira', 'cFirma', 'cCuenta'], false);
  b.hidden = false;
  t.classList.remove('gracioso', 'notaPastel');
  $('cumple').classList.toggle('ancho', estado === 'nota');
  if (estado === 'nota') {                                // la nota del pastel = la carta 1
    t.textContent = carta.texto || ''; t.classList.add('notaPastel');
    if (carta.firma) { $('cFirma').textContent = carta.firma; $('cFirma').hidden = false; }
    b.textContent = yaPidio() ? 'Cerrar la carta ♡' : 'Pedir un deseo ✨';
  }
  if (estado === 'deseo') { t.textContent = CUMPLE.invitacion; b.hidden = true; mostrar(['cRespira'], true); }
  if (estado === 'soplar') {
    t.textContent = CUMPLE.soplar; b.hidden = true;
    mostrar(['cHold', 'cHint'], true);
    $('cHint').textContent = 'También puedes tocar las velitas una por una.';
  }
  if (estado === 'hecho') { t.textContent = CUMPLE.despues; b.textContent = 'Cerrar'; mostrar(['cCuenta'], true); }
  if (estado === 'ya') { t.textContent = CUMPLE.yaPedido; t.classList.add('gracioso'); b.textContent = 'Está bien 🙈'; mostrar(['cCuenta'], true); }
  clearInterval(reloj);
  if (estado === 'hecho' || estado === 'ya') { contar(); reloj = setInterval(contar, 1000); }
  t.style.animation = 'none'; void t.offsetWidth; t.style.animation = '';
  $('cumple').scrollTop = 0;
}
// ---------- Cuenta regresiva hasta el próximo cumpleaños ----------
const dos = (n) => String(n).padStart(2, '0');
function contar() {
  const falta = proximoCumple(fechaDeseo()).getTime() - Date.now();
  if (falta <= 0) { $('cCuentaTxt').textContent = CUMPLE.cuentaLista; $('cCuenta').querySelector('.reloj').hidden = true; return; }
  $('cCuenta').querySelector('.reloj').hidden = false;
  $('cCuentaTxt').textContent = CUMPLE.cuenta;
  const s = Math.floor(falta / 1000);
  $('cDias').textContent = Math.floor(s / 86400);
  $('cHoras').textContent = dos(Math.floor(s / 3600) % 24);
  $('cMin').textContent = dos(Math.floor(s / 60) % 60);
  $('cSeg').textContent = dos(s % 60);
}
function enfocarTorta() {
  const target = cake.localToWorld(new V3(0, S + 0.28, 0));
  const cam = cake.localToWorld(new V3(0, S + 0.95, 2.3));
  flyTo(target, cam, 1.8);
}
export function abrirCumple(desdeCarta = false) {
  if (cumpleAbierto()) return;
  if (ctx) ctx.cerrarOtros();
  if (!yaPidio() && progreso.deseo) for (const v of velas) { v.lit = true; v.acc = 0; }   // ¡nuevo cumpleaños!
  estado = desdeCarta || !yaPidio() ? 'nota' : 'ya';     // la carta siempre se puede volver a leer
  pintar();
  $('cumple').classList.add('open');
  enfocarTorta();
}
export function cerrarCumple(volver = true) {
  if (!cumpleAbierto()) return;
  $('cumple').classList.remove('open');
  clearTimeout(timer);
  clearInterval(reloj);
  soplando = false;
  if (estado === 'deseo' || estado === 'soplar') {        // no terminó: las velitas se recuperan
    fuerza = 0;
    for (const v of velas) { v.lit = true; v.acc = 0; }
  }
  estado = 'cerrado';
  if (volver) { const v = PUNTOS.cumple.vista; flyTo(v.target, v.cam, 1.6); }
  camState.lastInteract = clock.elapsedTime;
}
// clic sobre la mesa en el mundo 3D
export function cumpleClick(obj) {
  const carta = obj && esCartaCumple(obj);
  if (!cumpleAbierto()) { abrirCumple(carta); return; }
  if (carta && estado !== 'deseo' && estado !== 'soplar') { estado = 'nota'; pintar(); return; }
  if (estado === 'soplar') {                                // tocar una velita la apaga
    const v = velas.find((x) => x.lit);
    if (v) apagar(v);
  } else if (estado === 'hecho') {
    estado = 'ya'; pintar();
  }
}

$('cBtn').addEventListener('click', () => {
  if (estado === 'nota' && yaPidio()) { cerrarCumple(); return; }
  if (estado === 'nota') {
    estado = 'deseo'; pintar();
    timer = setTimeout(() => { if (estado === 'deseo') { estado = 'soplar'; pintar(); } }, 4500);
  } else cerrarCumple();
});
$('cumpleClose').addEventListener('click', () => cerrarCumple());
const hold = $('cHold');
hold.addEventListener('pointerdown', (e) => { e.preventDefault(); soplando = true; hold.classList.add('on'); });
for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) hold.addEventListener(ev, () => { soplando = false; hold.classList.remove('on'); });
hold.addEventListener('contextmenu', (e) => e.preventDefault());

function apagar(v) {
  if (!v.lit) return;
  v.lit = false;
  humo(v.pos);
  if (velas.every((x) => !x.lit)) terminar();
}
function terminar() {
  estado = 'hecho';
  progreso.deseo = true;
  progreso.deseoFecha = Date.now();
  guardar();
  soplando = false;
  setTimeout(() => {
    lanzarConfeti();
    if (ctx) ctx.burst(cake.localToWorld(new V3(0, VTOP + 0.2, 0)), '#ffd98a', 90);
    if (cumpleAbierto()) pintar();
  }, 650);
}

// ---------- Animación ----------
const _a = new V3(), _b = new V3(), _m = new V3(), _d = new THREE.Object3D();
export function updateCumple(dt, t) {
  // el sobre: se abre mientras lee, y brilla suavecito para invitar a tocarlo
  const leyendo = cumpleAbierto() && estado === 'nota';
  solapa.rotation.x += ((leyendo ? -2.2 : 0) - solapa.rotation.x) * Math.min(1, dt * 4);
  sobreCarta.position.y = TOP + 0.004 + (leyendo ? 0.03 : 0.006 + Math.sin(t * 2) * 0.006);
  brilloCarta.material.opacity = (leyendo ? 0.15 : 0.28) + Math.sin(t * 2.4) * 0.1;
  // soplido: la fuerza sube mientras sopla y baja si se detiene
  if (estado === 'soplar') {
    const on = soplando;
    fuerza += ((on ? 1 : 0) - fuerza) * Math.min(1, dt * (on ? 1.5 : 2.6));
    for (const v of velas) {
      if (!v.lit) continue;
      if (fuerza > v.th) { v.acc += dt; if (v.acc > 0.28) apagar(v); } else v.acc = Math.max(0, v.acc - dt);
    }
  } else fuerza += (0 - fuerza) * Math.min(1, dt * 3);

  let encendidas = 0;
  for (const v of velas) {
    v.vis += ((v.lit ? 1 : 0) - v.vis) * Math.min(1, dt * (v.lit ? 3 : 14));
    if (v.lit) encendidas++;
    const fl = 0.85 + 0.12 * Math.sin(t * 17 + v.ph) + 0.08 * Math.sin(t * 29 + v.ph * 2);
    const lean = fuerza * (0.7 + 0.3 * Math.sin(t * 20 + v.ph));
    v.flame.scale.set(0.045 * (1 + lean * 0.4), 0.095 * fl * (1 - lean * 0.45) * v.vis + 0.0001, 1);
    v.flame.material.rotation = -lean * 0.9;
    v.flame.material.opacity = v.vis;
    v.flame.visible = v.vis > 0.02;
  }
  const k = encendidas / velas.length;
  candleLight.intensity = 3 * K * K * k * (0.85 + 0.15 * Math.sin(t * 13));
  candleGlow.material.opacity = 0.45 * k * (0.9 + 0.1 * Math.sin(t * 9));

  // globos flotando
  for (const g of globos) {
    const p = g.b.position;
    p.set(g.base.x + Math.sin(t * 0.9 + g.ph) * 0.07, g.base.y + Math.sin(t * 1.1 + g.ph) * 0.09, g.base.z + Math.cos(t * 0.8 + g.ph) * 0.06);
    g.b.rotation.z = Math.sin(t * 0.7 + g.ph) * 0.08;
    g.b.rotation.x = Math.cos(t * 0.6 + g.ph) * 0.06;
    const pos = g.line.geometry.attributes.position;
    _a.copy(g.anchor); _b.copy(p);
    _m.lerpVectors(_a, _b, 0.5); _m.y -= 0.25; _m.x += Math.sin(t * 1.3 + g.ph) * 0.08;
    for (let i = 0; i < pos.count; i++) {
      const s = i / (pos.count - 1), u = 1 - s;
      pos.setXYZ(i, u * u * _a.x + 2 * u * s * _m.x + s * s * _b.x, u * u * _a.y + 2 * u * s * _m.y + s * s * _b.y, u * u * _a.z + 2 * u * s * _m.z + s * s * _b.z);
    }
    pos.needsUpdate = true;
  }

  // humo de las velitas
  for (let i = humos.length - 1; i >= 0; i--) {
    const h = humos[i];
    h.life += dt;
    if (h.life < 0) continue;
    h.s.position.y += dt * 0.35 * K;
    h.s.position.x += Math.sin(t * 2 + h.ph) * dt * 0.05 * K;
    h.s.scale.setScalar((0.04 + h.life * 0.09) * K);
    h.s.material.opacity = 0.45 * clamp01(h.life * 4) * clamp01(1 - h.life / 2.4);
    if (h.life > 2.4) { scene.remove(h.s); h.s.material.dispose(); humos.splice(i, 1); }
  }

  // confeti
  if (confT >= 0) {
    confT += dt;
    const fade = clamp01(1 - (confT - 6) / 1.5);
    for (let i = 0; i < confData.length; i++) {
      const c = confData[i];
      if (c.p.y > 0.03) {
        c.v.y -= 3.2 * K * dt; c.v.multiplyScalar(1 - 0.9 * dt);
        c.v.x += Math.sin(t * 3 + i) * dt * 0.6 * K;
        c.p.addScaledVector(c.v, dt);
        c.r.x += c.w.x * dt; c.r.y += c.w.y * dt; c.r.z += c.w.z * dt;
      } else { c.p.y = 0.03; c.r.x = -Math.PI / 2; }
      _d.position.copy(c.p); _d.rotation.copy(c.r); _d.scale.setScalar(Math.max(0.001, fade));
      _d.updateMatrix(); confeti.setMatrixAt(i, _d.matrix);
    }
    confeti.instanceMatrix.needsUpdate = true;
    if (confT > 7.6) { confT = -1; confeti.count = 0; }
  }
}
