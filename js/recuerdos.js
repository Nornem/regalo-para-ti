// =====================================================================
// recuerdos.js — 💌 MESA DE RECUERDOS
// Mesa de madera con sobres, notitas, marcos, polaroids, libros, álbum,
// flores y un farol. Todo se abre/amplía con transiciones suaves.
// El contenido (textos y fotos) se cambia en contenido.js → RECUERDOS.
// =====================================================================
import * as THREE from 'three';
import { scene, glowTex, flyTo, camState, clock } from './motor.js';
import { PUNTOS, CENTRO, TAMANO_MESA_RECUERDOS as K } from './mundo.js';
import { canvasTex, TAU, V3, mrr, clamp01, easeInOut } from './utils.js';
import { RECUERDOS } from './contenido.js';
import { ambiente } from './ambiente.js';

const $ = (id) => document.getElementById(id);

export const mesaR = new THREE.Group();
const PR = PUNTOS.recuerdos.pos;
mesaR.position.set(PR.x, 0, PR.z);
mesaR.rotation.y = Math.atan2(CENTRO.x - PR.x, CENTRO.z - PR.z);   // frente (+z) hacia el jardín
mesaR.scale.setScalar(K);
scene.add(mesaR);

const TOP = 0.78;
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
  (o.parent || mesaR).add(m);
  return m;
}
function grupo(x, y, z, ry = 0, item = null) {
  const g = new THREE.Group();
  g.position.set(x, y, z); g.rotation.y = ry;
  if (item) g.userData.item = item;
  mesaR.add(g);
  return g;
}

// ---------- Fotos: carga con marcador "Tu foto aquí ♡" si falta el archivo ----------
const placeholderURL = (() => {
  const c = document.createElement('canvas'); c.width = 600; c.height = 600;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 600, 600);
  gr.addColorStop(0, '#fde4ec'); gr.addColorStop(1, '#e9e0fb');
  g.fillStyle = gr; g.fillRect(0, 0, 600, 600);
  g.fillStyle = 'rgba(176, 86, 122, .55)';
  g.font = '160px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('♡', 300, 260);
  g.font = 'bold 44px sans-serif';
  g.fillText('Tu foto aquí', 300, 420);
  return c.toDataURL();
})();
const loader = new THREE.TextureLoader();
// encaja la foto en el marco sin deformarla (recorta lo que sobra, como "cover")
function cubrir(tex, aspectoMarco) {
  const img = tex.image;
  const a = img.width / img.height;
  tex.repeat.set(1, 1); tex.offset.set(0, 0);
  if (a > aspectoMarco) { tex.repeat.x = aspectoMarco / a; tex.offset.x = (1 - tex.repeat.x) / 2; }
  else { tex.repeat.y = a / aspectoMarco; tex.offset.y = (1 - tex.repeat.y) / 2; }
  tex.needsUpdate = true;
}
function texturaFoto(i, aspectoMarco, mat) {
  const f = RECUERDOS.fotos[i];
  const url = f ? f.archivo : placeholderURL;
  const listo = (tex) => { tex.colorSpace = THREE.SRGBColorSpace; cubrir(tex, aspectoMarco); mat.map = tex; mat.color.set('#e2e2e2'); mat.needsUpdate = true; };
  loader.load(url, listo, undefined, () => {
    loader.load(placeholderURL, listo);
  });
}

// ---------- Mesa ----------
const woodTex = canvasTex(256, 256, (g) => {
  g.fillStyle = '#b07d52'; g.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 60; i++) {
    g.strokeStyle = `rgba(${90 + Math.random() * 40},${55 + Math.random() * 25},30,${0.15 + Math.random() * 0.2})`;
    g.lineWidth = 1 + Math.random() * 2;
    let y = Math.random() * 256;
    g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= 256; x += 16) { y += (Math.random() - 0.5) * 3; g.lineTo(x, y); }
    g.stroke();
  }
});
{
  const wood = std('#ffffff', { map: woodTex, roughness: 0.65 });
  put(new THREE.BoxGeometry(1.8, 0.05, 1.0), wood, 0, TOP - 0.025, 0);
  const leg = new THREE.BoxGeometry(0.06, TOP - 0.05, 0.06);
  for (const [x, z] of [[-0.82, -0.42], [0.82, -0.42], [-0.82, 0.42], [0.82, 0.42]]) put(leg, wood, x, (TOP - 0.05) / 2, z);
  // camino de mesa de encaje
  const lace = canvasTex(128, 256, (g, w, h) => {
    g.fillStyle = '#fbf5ea'; g.fillRect(0, 0, w, h);
    g.strokeStyle = 'rgba(214, 190, 160, .7)'; g.lineWidth = 1.5;
    for (let y = 10; y < h; y += 20) for (let x = 10; x < w; x += 20) { g.beginPath(); g.arc(x, y, 6, 0, TAU); g.stroke(); }
    g.fillStyle = '#efe2cc'; g.fillRect(0, 0, 8, h); g.fillRect(w - 8, 0, 8, h);
  });
  put(new THREE.BoxGeometry(0.44, 0.004, 1.06), std('#ffffff', { map: lace, roughness: 0.95 }), 0, TOP + 0.002, 0, { cast: false });
}

// ---------- Marcos de fotos (3 tamaños) ----------
const frames = [];
function marco(i, w, h, borde, color, x, z, ry) {
  const g = grupo(x, TOP, z, ry, { tipo: 'foto', i });
  const tilt = -0.14;
  const inner = new THREE.Group(); inner.rotation.x = tilt; g.add(inner);
  const fm = std(color, { roughness: 0.4, metalness: color === '#d8b26a' ? 0.5 : 0 });
  put(new THREE.BoxGeometry(w, h, 0.012), std('#f3ece2'), 0, h / 2, 0, { parent: inner });
  const d = 0.022;
  put(new THREE.BoxGeometry(w, borde, d), fm, 0, h - borde / 2, 0.004, { parent: inner });
  put(new THREE.BoxGeometry(w, borde, d), fm, 0, borde / 2, 0.004, { parent: inner });
  put(new THREE.BoxGeometry(borde, h, d), fm, -w / 2 + borde / 2, h / 2, 0.004, { parent: inner });
  put(new THREE.BoxGeometry(borde, h, d), fm, w / 2 - borde / 2, h / 2, 0.004, { parent: inner });
  const pw = w - borde * 2.2, ph = h - borde * 2.2;
  const pm = new THREE.MeshBasicMaterial({ color: '#d9d9d9' });   // la foto se ve con sus colores reales
  put(new THREE.PlaneGeometry(pw, ph), pm, 0, h / 2, 0.0075, { parent: inner, cast: false });
  texturaFoto(i, pw / ph, pm);
  put(new THREE.BoxGeometry(0.02, h * 0.7, 0.01), fm, 0, h * 0.33, -0.07, { parent: g, rx: 0.32 });   // patita de apoyo
  frames.push(g);
}
marco(0, 0.32, 0.4, 0.035, '#d8b26a', 0.12, -0.32, -0.04);    // grande (dorado)
marco(1, 0.3, 0.22, 0.03, '#ffffff', -0.22, -0.28, 0.12);     // mediano (blanco)
marco(2, 0.17, 0.21, 0.025, '#8a5a3c', 0.43, -0.26, -0.18);   // chico (madera)

// ---------- Polaroids sueltas ----------
function polaroid(i, x, z, ry) {
  const g = grupo(x, TOP + 0.004, z, ry, { tipo: 'foto', i });
  put(new THREE.BoxGeometry(0.16, 0.004, 0.19), std('#fdfcf8', { roughness: 0.6 }), 0, 0, 0, { parent: g });
  const pm = new THREE.MeshBasicMaterial({ color: '#d9d9d9' });
  put(new THREE.PlaneGeometry(0.138, 0.138), pm, 0, 0.0025, -0.014, { parent: g, rx: -Math.PI / 2, cast: false });
  texturaFoto(i, 1, pm);
}
polaroid(3, 0.7, 0.3, 0.3);
polaroid(4, -0.74, 0.28, -0.25);

// ---------- Sobres con carta ----------
const sobres = [];
const sobreTex = (base, linea) => canvasTex(256, 172, (g, w, h) => {
  g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.strokeStyle = linea; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, h); g.lineTo(w / 2, h * 0.45); g.lineTo(w, h); g.stroke();
});
function sobre(i, base, linea, sello, x, z, ry) {
  const g = grupo(x, TOP + 0.003, z, ry, { tipo: 'carta', i });
  const W = 0.24, D = 0.16;
  put(new THREE.BoxGeometry(W, 0.006, D), std('#ffffff', { map: sobreTex(base, linea), roughness: 0.8 }), 0, 0, 0, { parent: g });
  // la carta adentro
  const carta = put(new THREE.BoxGeometry(W * 0.9, 0.002, D * 0.85), std('#fffdf7', { roughness: 0.9 }), 0, 0.002, 0, { parent: g });
  // solapa con bisagra en el borde de atrás
  const bis = new THREE.Group(); bis.position.set(0, 0.0045, -D / 2); g.add(bis);
  const tri = new THREE.Shape();
  tri.moveTo(-W / 2, 0); tri.lineTo(W / 2, 0); tri.lineTo(0, D * 0.62); tri.lineTo(-W / 2, 0);
  const flap = put(new THREE.ShapeGeometry(tri), std(base, { roughness: 0.8, side: THREE.DoubleSide }), 0, 0, 0, { parent: bis, rx: Math.PI / 2 });
  flap.position.set(0, 0, 0);
  put(new THREE.CylinderGeometry(0.018, 0.018, 0.006, 20), std(sello, { roughness: 0.35 }), 0, 0.003, D * 0.6, { parent: bis });
  sobres.push({ g, bis, carta, abierto: 0, meta: 0 });
}
sobre(0, '#f9d9e3', '#efb7c8', '#b5476b', -0.34, 0.26, 0.1);     // para cuando estés feliz
sobre(1, '#dcebf7', '#b8d2ea', '#c94a62', -0.01, 0.25, -0.08);   // para cuando tengas un día difícil

// ---------- Notitas dobladas ----------
const notas = [];
function nota(i, color, x, z, ry) {
  const g = grupo(x, TOP, z, ry, { tipo: 'nota', i });
  const tex = canvasTex(128, 96, (c, w, h) => {
    c.fillStyle = color; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(200, 70, 110, .65)'; c.font = '44px serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('♡', w / 2, h / 2);
  });
  const m = std('#ffffff', { map: tex, side: THREE.DoubleSide, roughness: 0.85 });
  const W = 0.11, H = 0.075, a = 0.5;
  put(new THREE.PlaneGeometry(W, H), m, 0, Math.cos(a) * H / 2, Math.sin(a) * H / 2, { parent: g, rx: -a });
  put(new THREE.PlaneGeometry(W, H), m, 0, Math.cos(a) * H / 2, -Math.sin(a) * H / 2, { parent: g, rx: a });
  notas.push({ g, lift: 0, meta: 0 });
}
nota(0, '#fff3b8', 0.37, 0.3, -0.3);
nota(1, '#ffd9e4', 0.53, 0.1, 0.35);
nota(2, '#d8ecff', 0.8, 0.04, -0.1);

// ---------- Libros y álbum ----------
{
  put(new THREE.BoxGeometry(0.3, 0.05, 0.22), std('#3f6b4f', { roughness: 0.8 }), -0.55, TOP + 0.025, -0.24, { ry: 0.12 });
  put(new THREE.BoxGeometry(0.29, 0.006, 0.21), std('#f6efe0'), -0.55, TOP + 0.03, -0.24, { ry: 0.12 });
  put(new THREE.BoxGeometry(0.28, 0.045, 0.2), std('#8a3b4a', { roughness: 0.8 }), -0.55, TOP + 0.072, -0.24, { ry: -0.05 });
  const tapa = canvasTex(256, 192, (g, w, h) => {
    g.fillStyle = '#f2b6c9'; g.fillRect(0, 0, w, h);
    g.strokeStyle = '#ffffff'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28);
    g.fillStyle = '#ffffff'; g.font = '80px serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('♡', w / 2, h / 2 - 8);
    g.font = 'bold 26px sans-serif'; g.fillText('Recuerdos', w / 2, h - 40);
  });
  const album = grupo(-0.55, TOP + 0.095, -0.24, 0.08, { tipo: 'album', i: 0 });
  const mats = [std('#f2b6c9'), std('#f2b6c9'), std('#ffffff', { map: tapa }), std('#f2b6c9'), std('#f6efe0'), std('#f6efe0')];
  put(new THREE.BoxGeometry(0.26, 0.04, 0.2), mats, 0, 0.02, 0, { parent: album });
}

// ---------- Jarrón con flores ----------
{
  const vase = new THREE.LatheGeometry([
    [0, 0], [0.05, 0], [0.065, 0.04], [0.06, 0.12], [0.035, 0.18], [0.04, 0.22], [0.034, 0.22],
  ].map(([x, y]) => new THREE.Vector2(x, y)), 32);
  put(vase, std('#f4f1ec', { roughness: 0.25 }), -0.81, TOP, -0.36);
  const stem = std('#5c8f2c');
  const colores = ['#f6a6bd', '#fde2e9', '#ffd2b0', '#f6a6bd', '#ffffff', '#e98aa8', '#fbd3df'];
  colores.forEach((c, i) => {
    const a = (i / colores.length) * TAU, lean = 0.25 + (i % 3) * 0.08, L = 0.2 + (i % 2) * 0.05;
    const dir = new V3(Math.cos(a) * Math.sin(lean), Math.cos(lean), Math.sin(a) * Math.sin(lean));
    const base = new V3(-0.81, TOP + 0.2, -0.36);
    const tip = base.clone().addScaledVector(dir, L);
    const st = put(new THREE.CylinderGeometry(0.003, 0.004, L, 5), stem, 0, 0, 0, { cast: false });
    st.position.copy(base).addScaledVector(dir, L / 2);
    st.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir);
    put(new THREE.SphereGeometry(0.028, 14, 10), std(c, { roughness: 0.6 }), tip.x, tip.y, tip.z, { s: [1, 0.8, 1] });
    put(new THREE.TorusGeometry(0.024, 0.012, 8, 16), std(c, { roughness: 0.6 }), tip.x, tip.y - 0.006, tip.z, { rx: -Math.PI / 2 });
  });
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.006, 6, 5), std('#ffffff'), 40);
  const d = new THREE.Object3D();
  for (let i = 0; i < 40; i++) {
    const a = Math.random() * TAU, r = mrr(0.03, 0.12);
    d.position.set(-0.81 + Math.cos(a) * r * 0.7, TOP + mrr(0.32, 0.46), -0.36 + Math.sin(a) * r * 0.7);
    d.updateMatrix(); dots.setMatrixAt(i, d.matrix);
  }
  mesaR.add(dots);
}

// ---------- Farol pequeño (se encenderá más de noche en la Etapa 5) ----------
export const farolMesa = (() => {
  const g = grupo(0.76, TOP, -0.28, 0.3);
  const brass = std('#b8893c', { metalness: 0.6, roughness: 0.35 });
  put(new THREE.BoxGeometry(0.13, 0.02, 0.13), brass, 0, 0.01, 0, { parent: g });
  for (const [x, z] of [[-0.055, -0.055], [0.055, -0.055], [-0.055, 0.055], [0.055, 0.055]]) {
    put(new THREE.CylinderGeometry(0.005, 0.005, 0.17, 6), brass, x, 0.105, z, { parent: g });
  }
  put(new THREE.ConeGeometry(0.095, 0.06, 4), brass, 0, 0.22, 0, { parent: g, ry: Math.PI / 4 });
  put(new THREE.TorusGeometry(0.022, 0.004, 6, 16), brass, 0, 0.265, 0, { parent: g });
  put(new THREE.BoxGeometry(0.105, 0.16, 0.105), new THREE.MeshPhysicalMaterial({ color: '#fff8ea', roughness: 0.05, transparent: true, opacity: 0.22, depthWrite: false }), 0, 0.1, 0, { parent: g, cast: false });
  put(new THREE.CylinderGeometry(0.018, 0.018, 0.06, 12), std('#fff7e6'), 0, 0.05, 0, { parent: g });
  const glow = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, color: '#ffbe6a', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.35 }));
  glow.position.set(0, 0.11, 0); glow.scale.setScalar(0.11);
  g.add(glow);
  const light = new THREE.PointLight('#ffb46a', 0.8 * K * K, 2.2 * K, 2);
  light.position.set(0, 0.13, 0);
  g.add(light);
  return { g, glow, light };
})();

// =====================================================================
// Interacción: abrir cartas, notas y fotos con transiciones suaves
// =====================================================================
let ctx = null;
export function initRecuerdos(c) { ctx = c; }
const overlay = $('recuerdo');
export const recuerdoAbierto = () => overlay.classList.contains('open');
let actual = null;             // { tipo, i }
let pendiente = null;
const abiertas = new Set();    // cartas con pregunta que ya abrió (se vuelve a preguntar al cerrar)
$('rcAbrir').addEventListener('click', () => {
  if (!actual || actual.tipo !== 'carta') return;
  abiertas.add(actual.i);
  pintar(actual);
  const t = $('rcTexto'); t.classList.remove('revela'); void t.offsetWidth; t.classList.add('revela');
});
$('rcNo').addEventListener('click', () => cerrarRecuerdo());

function itemDe(obj) {
  for (let o = obj; o; o = o.parent) if (o.userData && o.userData.item) return { obj: o, item: o.userData.item };
  return null;
}
export function etiquetaRecuerdo(obj) {
  const r = itemDe(obj);
  if (!r) return '💌 Mesa de recuerdos';
  return { carta: '💌 Una carta', nota: '📝 Una notita', foto: '📷 Una foto', album: '📖 Álbum de recuerdos' }[r.item.tipo];
}

function enfocar(obj) {
  const p = obj.getWorldPosition(new V3());
  const front = new V3(0, 0, 1).applyQuaternion(mesaR.quaternion);
  flyTo(p.clone().add(new V3(0, 0.15 * K, 0)), p.clone().addScaledVector(front, 0.9 * K).add(new V3(0, 0.75 * K, 0)), 1.1);
}
// clic en la mesa (obj = lo que se tocó)
export function recuerdosClick(obj) {
  const r = itemDe(obj);
  if (!r) { const v = PUNTOS.recuerdos.vista; flyTo(v.target, v.cam, 1.6); return; }
  if (ctx) ctx.cerrarOtros();
  enfocar(r.obj);
  const { tipo, i } = r.item;
  clearTimeout(pendiente);
  if (tipo === 'carta') { sobres[i].meta = 1; pendiente = setTimeout(() => abrir({ tipo, i }), 1000); }
  else if (tipo === 'nota') { notas[i].meta = 1; pendiente = setTimeout(() => abrir({ tipo, i }), 700); }
  else if (tipo === 'album') pendiente = setTimeout(() => abrir({ tipo: 'foto', i: 0, album: true }), 600);
  else pendiente = setTimeout(() => abrir({ tipo, i }), 600);
}

function contar(tipo) {
  if (tipo === 'carta') return RECUERDOS.cartas.length;
  if (tipo === 'nota') return RECUERDOS.notas.length;
  return RECUERDOS.fotos.length;
}
function pintar(item) {
  const { tipo, i } = item;
  $('rCarta').hidden = tipo !== 'carta';
  $('rNota').hidden = tipo !== 'nota';
  $('rFoto').hidden = tipo !== 'foto';
  if (tipo === 'carta') {
    const c = RECUERDOS.cartas[i] || {};
    $('rcTitulo').textContent = c.titulo || '';
    const cerrada = c.preguntar && !abiertas.has(i);   // cartas que primero preguntan
    $('rcPuerta').hidden = !cerrada;
    if (cerrada) { $('rcPregunta').textContent = c.preguntar.texto; $('rcAbrir').textContent = c.preguntar.boton || 'Abrir'; }
    $('rcTexto').hidden = !!cerrada;
    $('rcTexto').textContent = c.texto || '';
    $('rcFirma').textContent = c.firma || '';
    $('rcFirma').hidden = !c.firma || !!cerrada;
  } else if (tipo === 'nota') {
    $('rnTexto').textContent = RECUERDOS.notas[i] || '';
  } else {
    const f = RECUERDOS.fotos[i] || {};
    const img = $('rfImg');
    img.onerror = () => { img.onerror = null; img.src = placeholderURL; };
    img.src = f.archivo || placeholderURL;
    $('rfPie').textContent = f.pie || '';
    $('rfPie').hidden = !f.pie;
  }
  const n = contar(tipo);
  $('rCount').textContent = n > 1 ? `${i + 1} / ${n}` : '';
  $('rPrev').hidden = $('rNext').hidden = n < 2;
  const box = $('rBox');
  box.dataset.tipo = tipo;
  box.classList.remove('swap'); void box.offsetWidth; box.classList.add('swap');
}
function abrir(item) {
  actual = item;
  pintar(item);
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
}
export function cerrarRecuerdo(volver = true) {
  clearTimeout(pendiente);
  for (const s of sobres) s.meta = 0;
  for (const n of notas) n.meta = 0;
  if (!recuerdoAbierto()) return;
  abiertas.clear();
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  actual = null;
  if (volver) { const v = PUNTOS.recuerdos.vista; flyTo(v.target, v.cam, 1.4); }
  camState.lastInteract = clock.elapsedTime;
}
function mover(paso) {
  if (!actual) return;
  const n = contar(actual.tipo);
  if (n < 2) return;
  const i = (actual.i + paso + n) % n;
  if (actual.tipo === 'carta') { sobres.forEach((s, k) => { s.meta = k === i ? 1 : 0; }); }
  if (actual.tipo === 'nota') { notas.forEach((s, k) => { s.meta = k === i ? 1 : 0; }); }
  actual = { ...actual, i };
  pintar(actual);
}
$('rClose').addEventListener('click', () => cerrarRecuerdo());
$('rPrev').addEventListener('click', () => mover(-1));
$('rNext').addEventListener('click', () => mover(1));
overlay.addEventListener('click', (e) => { if (e.target === overlay) cerrarRecuerdo(); });
addEventListener('keydown', (e) => {
  if (!recuerdoAbierto()) return;
  if (e.key === 'ArrowRight') mover(1);
  if (e.key === 'ArrowLeft') mover(-1);
});

// ---------- Animación ----------
export function updateRecuerdos(dt, t) {
  for (const s of sobres) {
    s.abierto += (s.meta - s.abierto) * Math.min(1, dt * 4);
    const k = easeInOut(clamp01(s.abierto));
    s.bis.rotation.x = -k * 2.5;                        // la solapa se levanta
    s.carta.position.set(0, 0.004 + k * 0.03, -k * 0.09); // la carta asoma
    s.carta.rotation.x = -k * 0.35;
  }
  for (const n of notas) {
    n.lift += (n.meta - n.lift) * Math.min(1, dt * 5);
    n.g.position.y = TOP + n.lift * 0.05;
    n.g.rotation.z = Math.sin(t * 3) * 0.04 * n.lift;
  }
  // el farol titila suavecito
  const f = 0.9 + 0.1 * Math.sin(t * 7.3) + 0.05 * Math.sin(t * 13.1);   // titila suavecito
  const noche = ambiente.faroles;                     // de noche brilla más
  farolMesa.glow.material.opacity = 0.32 * f;
  farolMesa.light.intensity = 0.22 * K * K * f * (0.8 + 0.4 * noche);   // luz suave: no tapa las fotos
}
