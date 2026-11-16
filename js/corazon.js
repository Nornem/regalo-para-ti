// =====================================================================
// corazon.js — ♡ CORAZÓN GALÁCTICO sobre el jardín central
// El corazón NO es un objeto sólido: su forma la dibujan miles de puntos
// de luz (violeta, rosa y azul). Debajo flota una galaxia en espiral.
// Alrededor sube una hélice de partículas; algunas se desprenden y se
// desvanecen, y aparecen destellos. Todo se anima en la tarjeta gráfica.
// =====================================================================
import * as THREE from 'three';
import { scene, renderer, glowTex, MOBILE } from './motor.js';
import { CENTRO } from './mundo.js';
import { canvasTex, TAU } from './utils.js';
import { progreso, guardar } from './progreso.js';

const TAM = 2.8;                       // escala del corazón (≈ 6.4 m de ancho, 4× el anterior)
const ALTURA = 4.7;                    // altura del centro del corazón
const ALTURA_GALAXIA = 0.75;           // la galaxia flota un poquito sobre el pasto

export const corazon = new THREE.Group();
corazon.position.set(CENTRO.x, ALTURA, CENTRO.z);
scene.add(corazon);
const galaxia = new THREE.Group();
galaxia.position.set(CENTRO.x, ALTURA_GALAXIA, CENTRO.z);
scene.add(galaxia);

// Brillo general (la Etapa 5 lo sube de noche y lo baja de día)
export const corazonUniforms = {
  uTime: { value: 0 },
  uSpiral: { value: 0 },
  uBeat: { value: 0 },
  uGlow: { value: 1 },
  uScale: { value: 1 },
  // 🎨 colores: paleta anterior (0) → nueva (1), que se "derrama" desde el centro
  uA0: { value: new THREE.Color() }, uB0: { value: new THREE.Color() }, uC0: { value: new THREE.Color() },
  uA1: { value: new THREE.Color() }, uB1: { value: new THREE.Color() }, uC1: { value: new THREE.Color() },
  uK0: { value: 1 }, uK1: { value: 1 }, uArco0: { value: 0 }, uArco1: { value: 0 },
  uOla: { value: 99 },
};

const C = {
  rosa: new THREE.Color('#ff6fcf'),
  violeta: new THREE.Color('#9a5cff'),
  azul: new THREE.Color('#3f9dff'),
  blanco: new THREE.Color('#fff2ff'),
};
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;

// geometría de puntos con atributos propios
function nube(n, fill) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const aR = new Float32Array(n), aSize = new Float32Array(n), aKind = new Float32Array(n);
  const aT = new Float32Array(n), aW = new Float32Array(n);
  const c = new THREE.Color();
  for (let i = 0; i < n; i++) {
    const r = fill(i, c);
    pos.set(r.p, i * 3); col.set([c.r, c.g, c.b], i * 3);
    aR[i] = Math.random(); aSize[i] = r.size; aKind[i] = r.kind || 0;
    [aT[i], aW[i]] = papel(c);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  g.setAttribute('aR', new THREE.BufferAttribute(aR, 1));
  g.setAttribute('aSize', new THREE.BufferAttribute(aSize, 1));
  g.setAttribute('aKind', new THREE.BufferAttribute(aKind, 1));
  g.setAttribute('aT', new THREE.BufferAttribute(aT, 1));
  g.setAttribute('aW', new THREE.BufferAttribute(aW, 1));
  return g;
}
// busca qué mezcla de azul→violeta→rosa (+ blanco) da ese color, para poder pintarlo con otra paleta
let tabla = null;                       // las 275 mezclas posibles, calculadas una sola vez
function papel(c) {
  if (!tabla) {
    tabla = [];
    const t = new THREE.Color();
    for (let i = 0; i <= 24; i++) for (let j = 0; j <= 10; j++) {
      const s = i / 24, w = j / 10;
      (s < 0.5 ? t.copy(C.azul).lerp(C.violeta, s * 2) : t.copy(C.violeta).lerp(C.rosa, (s - 0.5) * 2)).lerp(C.blanco, w);
      tabla.push([t.r, t.g, t.b, s, w]);
    }
  }
  let best = Infinity, bs = 0, bw = 0;
  for (const [r, g, b, s, w] of tabla) {
    const d = (r - c.r) ** 2 + (g - c.g) ** 2 + (b - c.b) ** 2;
    if (d < best) { best = d; bs = s; bw = w; }
  }
  return [bs, bw];
}
// GLSL: color de cada punto según la paleta activa (con ola desde el centro y modo arcoíris)
const TEMA = `
  attribute float aT; attribute float aW;
  uniform vec3 uA0; uniform vec3 uB0; uniform vec3 uC0; uniform vec3 uA1; uniform vec3 uB1; uniform vec3 uC1;
  uniform float uK0; uniform float uK1; uniform float uArco0; uniform float uArco1; uniform float uOla; uniform float uTime;
  vec3 pal(vec3 a, vec3 b, vec3 c, float s) { return s < 0.5 ? mix(a, b, s * 2.0) : mix(b, c, (s - 0.5) * 2.0); }
  vec3 arco(float h) { return clamp(abs(mod(h * 6.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0, 0.0, 1.0); }
  vec3 tema(float d) {
    float h = fract(aT * 0.55 + uTime * 0.06 + d * 0.045);
    vec3 r = mix(vec3(1.0), arco(h), 0.62);
    vec3 c0 = mix(pal(uA0, uB0, uC0, aT), r, uArco0) * uK0;
    vec3 c1 = mix(pal(uA1, uB1, uC1, aT), r, uArco1) * uK1;
    float k = clamp((uOla - d) / 1.8, 0.0, 1.0);          // la ola avanza desde el centro
    return mix(mix(c0, c1, k), vec3(1.0, 0.95, 1.0), aW);
  }
`;
// puntito suave con centro brillante (el centro "brilla" con el bloom)
const fragPunto = `
  varying vec3 vColor; varying float vAlpha;
  void main(){
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float a = smoothstep(0.5, 0.05, d);
    float core = 1.0 - smoothstep(0.0, 0.18, d);
    gl_FragColor = vec4(vColor * (0.9 + core * 1.4), a * vAlpha);
  }`;
const matPuntos = (vertexShader) => new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, uniforms: corazonUniforms, vertexShader: TEMA + vertexShader, fragmentShader: fragPunto,
});

// ---------- 1) El corazón hecho de puntos ----------
// Forma 3D clásica de corazón: (x² + 9/4 z² + y² − 1)³ − x²y³ − 9/80 z²y³ ≤ 0
const F = (x, y, z) => Math.pow(x * x + 2.25 * z * z + y * y - 1, 3) - x * x * y * y * y - 0.1125 * z * z * y * y * y;
const dentro = (x, y, z) => F(x, y, z) <= 0;
function puntoEnBorde() {
  // dirección al azar desde el centro → se busca el borde (bisección)
  for (;;) {
    const d = new THREE.Vector3(gauss(), gauss() + 0.05, gauss() * 0.7).normalize();
    let lo = 0, hi = 2;
    if (!dentro(d.x * 0.05, d.y * 0.05 + 0.1, d.z * 0.05)) continue;
    for (let k = 0; k < 22; k++) { const m = (lo + hi) / 2; if (dentro(d.x * m, d.y * m + 0.1, d.z * m)) lo = m; else hi = m; }
    return [d.x * lo, d.y * lo + 0.1, d.z * lo];
  }
}
function puntoDentro() {
  for (;;) {
    const x = (Math.random() - 0.5) * 2.4, y = -1.05 + Math.random() * 2.35, z = (Math.random() - 0.5) * 1.5;
    if (dentro(x, y, z)) return [x, y, z];
  }
}
const NH = MOBILE ? 5200 : 10000;
const heartGeo = nube(NH, (i, c) => {
  const r = Math.random();
  const kind = r < 0.72 ? 0 : r < 0.92 ? 1 : 2;           // borde · interior · se desprende
  let [x, y, z] = kind === 1 ? puntoDentro() : puntoEnBorde();
  if (kind === 0) { const j = 1 + gauss() * 0.025; x *= j; y *= j; z *= j; }
  // color: rosa arriba, violeta al medio, azul abajo y en los costados
  const tv = THREE.MathUtils.clamp((y + 1) / 2.2, 0, 1);
  c.copy(C.azul).lerp(C.violeta, THREE.MathUtils.smoothstep(tv, 0.1, 0.55)).lerp(C.rosa, THREE.MathUtils.smoothstep(tv, 0.55, 0.95));
  c.lerp(C.azul, Math.min(0.5, Math.abs(x) * 0.35));
  if (Math.random() < 0.08) c.lerp(C.blanco, 0.7);
  return { p: [x * TAM, y * TAM, z * TAM], size: (kind === 1 ? 0.05 : 0.065) + Math.random() * 0.06, kind };
});
const heartPts = new THREE.Points(heartGeo, matPuntos(`
  attribute float aR; attribute float aSize; attribute float aKind; attribute vec3 aColor;
  uniform float uBeat; uniform float uScale; uniform float uGlow;
  varying vec3 vColor; varying float vAlpha;
  void main(){
    vec3 p = position;
    p += 0.05 * vec3(sin(uTime * 1.3 + aR * 40.0), sin(uTime * 1.1 + aR * 57.0), cos(uTime * 1.2 + aR * 33.0));
    p *= 1.0 + uBeat;
    float a = 0.7 + 0.3 * sin(uTime * (2.0 + aR * 3.0) + aR * 80.0);   // titileo
    if (aKind > 1.5) {                                                  // se desprende y se desvanece
      float u = fract(aR * 7.0 + uTime * 0.07);
      p += normalize(position + vec3(0.0, 0.5, 0.0)) * u * 2.6 + vec3(0.0, u * 2.0, 0.0);
      a *= (1.0 - u) * smoothstep(0.0, 0.08, u);
    }
    vAlpha = a * (0.7 + 0.3 * uGlow);
    vColor = tema(length(position));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * uScale * 2.75 / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`));
heartPts.frustumCulled = false;
corazon.add(heartPts);

// brillo suave en el centro del corazón
const halo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, color: '#c58bff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.28,
}));
halo.scale.setScalar(9);
corazon.add(halo);

// zona invisible para poder tocar el corazón
export const heart = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 12), new THREE.MeshBasicMaterial({ visible: false }));
heart.scale.set(1.25 * TAM, 1.15 * TAM, 0.75 * TAM);
heart.position.y = 0.1 * TAM;
corazon.add(heart);

// ---------- 2) La galaxia en espiral debajo ----------
const NG = MOBILE ? 4200 : 8000, NB = MOBILE ? 700 : 1400;
const BRAZOS = 3, RG = 5.4;
const galaxyGeo = nube(NG + NB, (i, c) => {
  if (i >= NG) {                                          // núcleo brillante
    const r = Math.abs(gauss()) * 0.9, a = Math.random() * TAU;
    c.copy(C.blanco).lerp(C.rosa, Math.random() * 0.5);
    return { p: [Math.cos(a) * r, gauss() * 0.22 * (1 - r / 1.6), Math.sin(a) * r], size: 0.05 + Math.random() * 0.06 };
  }
  const t = Math.pow(Math.random(), 0.8);
  const r = 0.35 + t * RG;
  const brazo = i % BRAZOS;
  const ang = (brazo / BRAZOS) * TAU + r * 0.95 + gauss() * 0.32 * (1.15 - t * 0.6);
  const rr = r + gauss() * 0.18;
  c.copy(C.blanco).lerp(C.rosa, THREE.MathUtils.smoothstep(t, 0.0, 0.25))
    .lerp(C.violeta, THREE.MathUtils.smoothstep(t, 0.25, 0.6)).lerp(C.azul, THREE.MathUtils.smoothstep(t, 0.6, 1.0));
  return { p: [Math.cos(ang) * rr, gauss() * 0.05 * (1 - t * 0.5), Math.sin(ang) * rr], size: 0.035 + Math.random() * 0.05 + (1 - t) * 0.03 };
});
const galaxyPts = new THREE.Points(galaxyGeo, matPuntos(`
  attribute float aR; attribute float aSize; attribute vec3 aColor;
  uniform float uSpiral; uniform float uScale; uniform float uGlow;
  varying vec3 vColor; varying float vAlpha;
  void main(){
    float ang = -uSpiral * 0.22;                      // la galaxia gira (sentido invertido)
    float s = sin(ang), co = cos(ang);
    vec3 p = vec3(position.x * co - position.z * s, position.y, position.x * s + position.z * co);
    p.y += 0.04 * sin(uTime * 1.5 + aR * 30.0);
    vAlpha = (0.65 + 0.35 * sin(uTime * (1.5 + aR * 2.5) + aR * 70.0)) * (0.7 + 0.3 * uGlow);
    vColor = tema(3.6 + length(position));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * uScale * 2.75 / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`));
galaxia.add(galaxyPts);

// resplandor del núcleo y luz sobre el pasto
const nucleo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, color: '#ffc4f0', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5,
}));
nucleo.scale.setScalar(3.2);
galaxia.add(nucleo);
const poolTex = canvasTex(128, 128, (g) => {
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(225,160,255,0.5)');
  gr.addColorStop(0.55, 'rgba(160,140,255,0.16)');
  gr.addColorStop(1, 'rgba(120,150,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
});
const pool = new THREE.Mesh(
  new THREE.CircleGeometry(6.2, 64),
  new THREE.MeshBasicMaterial({ map: poolTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false })
);
pool.rotation.x = -Math.PI / 2;
pool.position.set(CENTRO.x, 0.03, CENTRO.z);
scene.add(pool);

// ---------- 3) Hélice ascendente alrededor del corazón ----------
const NS = MOBILE ? 220 : 380;
const spiralGeo = nube(NS, (i, c) => {
  c.copy([C.violeta, C.rosa, C.azul, C.blanco][i % 4]);
  return { p: [i % 3, Math.random() < 0.16 ? 1 : 0, 0.07 + Math.random() * 0.06], size: 0.07 + Math.random() * 0.08 };
});
const spiral = new THREE.Points(spiralGeo, matPuntos(`
  attribute float aR; attribute float aSize; attribute vec3 aColor;
  uniform float uSpiral; uniform float uScale; uniform float uGlow;
  varying vec3 vColor; varying float vAlpha;
  void main(){
    float brazo = position.x, suelta = position.y, vel = position.z;
    float u = fract(aR + uSpiral * vel);                         // sube desde la galaxia
    float ang = brazo * 2.0944 - u * 11.0 - uSpiral * 0.5;   // hélice en sentido invertido
    float r = mix(4.4, 3.0, u) + suelta * u * u * 4.0;
    float y = mix(-4.0, 4.6, u) + suelta * u * 1.5;
    vec3 p = vec3(cos(ang) * r, y, sin(ang) * r);
    vAlpha = smoothstep(0.0, 0.1, u) * (1.0 - smoothstep(suelta > 0.5 ? 0.5 : 0.82, 1.0, u));
    vAlpha *= (0.6 + 0.4 * sin(uSpiral * 7.0 + aR * 91.0)) * (0.7 + 0.3 * uGlow);
    vColor = tema(length(p));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_PointSize = aSize * uScale * 2.75 / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`));
spiral.frustumCulled = false;
corazon.add(spiral);

// ---------- 4) Destellos que aparecen y desaparecen ----------
const NSP = MOBILE ? 30 : 50;
const sparkGeo = nube(NSP, (i, c) => {
  const a = Math.random() * TAU, r = 3.6 + Math.random() * 3;
  c.copy([C.blanco, C.rosa, C.azul][i % 3]);
  return { p: [Math.cos(a) * r, (Math.random() - 0.45) * 8, Math.sin(a) * r], size: 0.22 + Math.random() * 0.25 };
});
corazon.add(new THREE.Points(sparkGeo, new THREE.ShaderMaterial({
  transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: corazonUniforms,
  vertexShader: TEMA + `
    attribute float aR; attribute float aSize; attribute vec3 aColor;
    uniform float uScale; uniform float uGlow;
    varying vec3 vColor; varying float vAlpha;
    void main(){
      float s = max(0.0, sin(uTime * (0.6 + aR * 1.2) + aR * 40.0));
      vAlpha = pow(s, 10.0) * (0.6 + 0.4 * uGlow);
      vColor = tema(length(position));
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * uScale * 2.75 * (0.6 + 0.4 * vAlpha) / -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    varying vec3 vColor; varying float vAlpha;
    void main(){
      vec2 c = gl_PointCoord - 0.5;
      float star = max(0.0, 1.0 - abs(c.x * c.y) * 140.0) * (1.0 - length(c) * 2.0);
      float dot0 = 1.0 - smoothstep(0.0, 0.14, length(c));
      gl_FragColor = vec4(vColor * 1.6, clamp(star + dot0, 0.0, 1.0) * vAlpha);
    }`,
})));

// ---------- 🎨 Colores del corazón (cambian al tocarlo) ----------
// [azul, violeta, rosa] = los 3 "papeles" del degradado · k = brillo · halo/núcleo/luz en el pasto
const TEMAS = [
  { nombre: 'rosa', a: '#3f9dff', b: '#9a5cff', c: '#ff6fcf', k: 1, halo: '#c58bff', nucleo: '#ffc4f0', luz: '#ffffff' },   // original
  { nombre: 'lila', a: '#6a5cff', b: '#a77bff', c: '#e2b6ff', k: 1, halo: '#b38cff', nucleo: '#ecd6ff', luz: '#e6dcff' },
  { nombre: 'dorado', a: '#d9733a', b: '#f0a94a', c: '#ffdf96', k: 0.82, halo: '#f2b360', nucleo: '#ffe6b5', luz: '#ffe2b8' },
  { nombre: 'aqua', a: '#2f6bff', b: '#35c4e6', c: '#a6fff0', k: 0.95, halo: '#6fd7f0', nucleo: '#c9fff6', luz: '#c6f2ff' },
  { nombre: 'vino', a: '#6a1d58', b: '#c2185b', c: '#ff6f91', k: 1.05, halo: '#e0507e', nucleo: '#ffc0d0', luz: '#ffc6d6' },
  { nombre: 'perla', a: '#8ea6ff', b: '#d6ccff', c: '#fff4fa', k: 0.75, halo: '#e4dcff', nucleo: '#ffffff', luz: '#f2eeff' },
];
const ARCO = TEMAS.length;              // 🌈 color secreto: tocarlo muchas veces seguidas
const U = corazonUniforms;
const actual = { a: new THREE.Color(), b: new THREE.Color(), c: new THREE.Color(), k: 1, arco: 0 };
const brillos = { halo: new THREE.Color('#c58bff'), nucleo: new THREE.Color('#ffc4f0'), luz: new THREE.Color('#ffffff') };
const brillosMeta = { halo: new THREE.Color(), nucleo: new THREE.Color(), luz: new THREE.Color() };
let temaIdx = Number.isInteger(progreso.colorCorazon) && progreso.colorCorazon >= 0 && progreso.colorCorazon <= ARCO ? progreso.colorCorazon : 0;

function datosTema(i) {
  const t = TEMAS[i === ARCO ? 0 : i];
  return { a: new THREE.Color(t.a), b: new THREE.Color(t.b), c: new THREE.Color(t.c), k: i === ARCO ? 0.95 : t.k, arco: i === ARCO ? 1 : 0, t };
}
function ponerTema(i, animado) {
  const d = datosTema(i);
  if (animado) {                          // lo que se ve ahora pasa a ser la paleta "anterior"
    const k = Math.min(1, Math.max(0, U.uOla.value / 12));
    U.uA0.value.lerpColors(U.uA0.value, U.uA1.value, k); U.uB0.value.lerpColors(U.uB0.value, U.uB1.value, k);
    U.uC0.value.lerpColors(U.uC0.value, U.uC1.value, k);
    U.uK0.value += (U.uK1.value - U.uK0.value) * k; U.uArco0.value += (U.uArco1.value - U.uArco0.value) * k;
    U.uOla.value = -2;
  } else {
    U.uA0.value.copy(d.a); U.uB0.value.copy(d.b); U.uC0.value.copy(d.c); U.uK0.value = d.k; U.uArco0.value = d.arco;
    U.uOla.value = 99;
  }
  U.uA1.value.copy(d.a); U.uB1.value.copy(d.b); U.uC1.value.copy(d.c); U.uK1.value = d.k; U.uArco1.value = d.arco;
  Object.assign(actual, d);
  brillosMeta.halo.set(i === ARCO ? '#f3c2ff' : d.t.halo);
  brillosMeta.nucleo.set(i === ARCO ? '#fff2fb' : d.t.nucleo);
  brillosMeta.luz.set(i === ARCO ? '#fff0ff' : d.t.luz);
  if (!animado) for (const k in brillos) brillos[k].copy(brillosMeta[k]);
}
ponerTema(temaIdx, false);

// ---------- Tocar el corazón: late fuerte, todo gira más rápido y cambia de color ----------
let boost = 0, spiralT = 0;
const toques = [];
export function corazonClick(burst, avisar) {
  boost = 1;
  const ahora = performance.now();
  toques.push(ahora);
  while (toques.length && ahora - toques[0] > 3500) toques.shift();
  let secreto = false;
  if (toques.length >= 7 && temaIdx !== ARCO) { temaIdx = ARCO; secreto = true; toques.length = 0; }
  else temaIdx = temaIdx === ARCO ? 0 : (temaIdx + 1) % TEMAS.length;
  ponerTema(temaIdx, true);
  progreso.colorCorazon = temaIdx;
  if (secreto && avisar) {
    avisar(progreso.arcoVisto ? '🌈 El color secreto del corazón' : '✨ ¡Descubriste el color secreto del corazón!');
    progreso.arcoVisto = true;
  }
  guardar();
  if (burst) {
    const p = corazon.getWorldPosition(new THREE.Vector3());
    if (temaIdx === ARCO) { for (const c of ['#ff9ad5', '#ffd27a', '#9ff0d0', '#9cc8ff', '#d2a8ff']) burst(p, c, 30); }
    else { burst(p, '#' + actual.c.getHexString(), 90); burst(p, '#' + actual.a.getHexString(), 50); }
  }
}

function escala() { corazonUniforms.uScale.value = renderer.getPixelRatio() * innerHeight * 0.5; }
escala();
addEventListener('resize', escala);

// latido doble (pum-pum… pausa)
const latido = (t) => {
  const p = (t % 1.6) / 1.6;
  return Math.exp(-Math.pow((p - 0.08) * 22, 2)) + 0.6 * Math.exp(-Math.pow((p - 0.24) * 22, 2));
};
export function updateCorazon(dt, t) {
  boost = Math.max(0, boost - dt * 0.6);
  spiralT += dt * (1 + boost * 3);
  corazonUniforms.uTime.value = t;
  corazonUniforms.uSpiral.value = spiralT;
  const b = latido(t) * 0.035 + boost * 0.08 * Math.abs(Math.sin(t * 10));
  corazonUniforms.uBeat.value = b;
  corazon.position.y = ALTURA + Math.sin(t * 0.9) * 0.3;          // flota suave
  heartPts.rotation.y = -t * 0.18;                                 // gira despacito (sentido invertido)
  heart.rotation.y = heartPts.rotation.y;
  galaxia.position.y = ALTURA_GALAXIA + Math.sin(t * 0.9 + 1) * 0.08;
  // la ola de color avanza y los brillos la siguen
  if (U.uOla.value < 99) { U.uOla.value += dt * 9; if (U.uOla.value > 14) U.uOla.value = 99; }
  for (const k in brillos) brillos[k].lerp(brillosMeta[k], Math.min(1, dt * 1.6));
  halo.material.color.copy(brillos.halo);
  nucleo.material.color.copy(brillos.nucleo);
  pool.material.color.copy(brillos.luz);
  const g = corazonUniforms.uGlow.value;
  halo.material.opacity = (0.22 + b * 2) * (0.5 + 0.5 * g);
  nucleo.material.opacity = (0.45 + b * 2) * (0.5 + 0.5 * g);
  pool.material.opacity = (0.8 + b * 3) * (0.5 + 0.5 * g);
}
