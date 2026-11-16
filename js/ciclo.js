// =====================================================================
// ciclo.js — 🌅☀️🌇🌙 CICLO DE DÍA Y NOCHE según la hora del celular
// ⭐ AHORA EL MUNDO ES SIEMPRE DE NOCHE (SIEMPRE_NOCHE = true).
//    Si algún día quieres el ciclo completo otra vez, pon false.
//
// Cuatro ambientes (amanecer, día, atardecer, noche) que se mezclan de
// forma continua: no hay saltos bruscos. Cambia cielo, niebla, luces,
// sol/luna, estrellas, brillo del corazón y faroles.
//
// Para probar: agrega al final de la dirección
//   ?hora=20      → fija las 8 pm (sirve cualquier hora, ej. ?hora=6.5)
//   ?hora=noche   → también: amanecer · dia · atardecer · noche
//   ?ciclo        → un día completo en 2 minutos (para ver las transiciones)
// =====================================================================
import * as THREE from 'three';
import { scene, renderer, hemi, sun, skyUniforms, SUN_OFFSET, bloom } from './motor.js';
import { corazonUniforms } from './corazon.js';
import { ambiente } from './ambiente.js';

export const SIEMPRE_NOCHE = true;

const preset = (o) => ({
  ...o,
  top: new THREE.Color(o.top), horizon: new THREE.Color(o.horizon),
  hemiSky: new THREE.Color(o.hemiSky), hemiGround: new THREE.Color(o.hemiGround), sunCol: new THREE.Color(o.sunCol),
  az: new THREE.Vector3(o.az[0], 0, o.az[1]).normalize(),
});
const AMB = {
  noche: preset({
    // niebla nocturna azul-lavanda
    top: '#0b1534', horizon: '#3b4767', fog: 0.0045, hemiSky: '#7d90cc', hemiGround: '#1e2d22', hemiI: 0.75,
    sunCol: '#b4c6ff', sunI: 0.8, elev: 48, az: [-0.5, -0.7], exp: 1.08, faroles: 1, glow: 1.6, stars: 1, bloom: 0.6, skyGlow: 0.55,
  }),
  amanecer: preset({
    top: '#8eaede', horizon: '#f6c9bd', fog: 0.0052, hemiSky: '#ffdcd0', hemiGround: '#6b7b42', hemiI: 0.95,
    sunCol: '#ffb58a', sunI: 1.9, elev: 9, az: [1, 0.25], exp: 1.02, faroles: 0.25, glow: 1.1, stars: 0.12, bloom: 0.3, skyGlow: 1,
  }),
  dia: preset({
    top: '#c9dbe6', horizon: '#e3ebdf', fog: 0.0042, hemiSky: '#f4f8ff', hemiGround: '#7a9a45', hemiI: 1.3,
    sunCol: '#fff1d8', sunI: 3.0, elev: 55, az: [24, 20], exp: 1.05, faroles: 0, glow: 0.8, stars: 0, bloom: 0.22, skyGlow: 0.25,
  }),
  atardecer: preset({
    top: '#6c84c2', horizon: '#f5b37f', fog: 0.005, hemiSky: '#ffc89e', hemiGround: '#5b6a35', hemiI: 0.85,
    sunCol: '#ff9650', sunI: 2.0, elev: 7, az: [-0.35, -1], exp: 1.0, faroles: 0.7, glow: 1.25, stars: 0.08, bloom: 0.32, skyGlow: 1,
  }),
};
// línea del tiempo (hora → ambiente); entre dos puntos se mezcla suavemente
const LINEA = [[0, 'noche'], [4.8, 'noche'], [6.1, 'amanecer'], [7.6, 'dia'], [16.8, 'dia'], [18.1, 'atardecer'], [19.3, 'noche'], [24, 'noche']];

const params = new URLSearchParams(location.search);
const NOMBRES = { amanecer: 6.1, dia: 12, día: 12, atardecer: 18.1, noche: 22 };
const horaFija = params.has('hora') ? (NOMBRES[params.get('hora')] ?? parseFloat(params.get('hora'))) : null;
const cicloRapido = params.has('ciclo');

function horaActual(t) {
  if (cicloRapido) return (8 + t * 0.2) % 24;                     // 24 h en 120 s
  if (horaFija !== null && !Number.isNaN(horaFija)) return ((horaFija % 24) + 24) % 24;
  const d = new Date();
  return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
}
export function etiquetaHora(h) {
  if (h >= 5 && h < 7.5) return ['🌅', 'Amanecer'];
  if (h >= 7.5 && h < 17) return ['☀️', 'Día'];
  if (h >= 17 && h < 19.3) return ['🌇', 'Atardecer'];
  return ['🌙', 'Noche'];
}

const tmp = { top: new THREE.Color(), horizon: new THREE.Color(), hemiSky: new THREE.Color(), hemiGround: new THREE.Color(), sunCol: new THREE.Color(), az: new THREE.Vector3() };
const NUM = ['fog', 'hemiI', 'sunI', 'elev', 'exp', 'faroles', 'glow', 'stars', 'bloom', 'skyGlow'];
const mezcla = {};
function mezclar(a, b, k) {
  for (const c of ['top', 'horizon', 'hemiSky', 'hemiGround', 'sunCol']) tmp[c].copy(a[c]).lerp(b[c], k);
  tmp.az.copy(a.az).lerp(b.az, k).normalize();
  for (const n of NUM) mezcla[n] = a[n] + (b[n] - a[n]) * k;
}

let ultimoTexto = '';
export function updateCiclo(t) {
  const h = horaActual(t);
  let i = 0;
  while (i < LINEA.length - 2 && h >= LINEA[i + 1][0]) i++;
  const [h0, n0] = LINEA[i], [h1, n1] = LINEA[i + 1];
  const k = THREE.MathUtils.smoothstep(h, h0, h1);
  if (SIEMPRE_NOCHE && horaFija === null && !cicloRapido) mezclar(AMB.noche, AMB.noche, 0);
  else mezclar(AMB[n0], AMB[n1], k);

  scene.fog.color.copy(tmp.horizon);
  scene.fog.density = mezcla.fog;
  skyUniforms.horizon.value.copy(tmp.horizon);
  skyUniforms.top.value.copy(tmp.top);
  hemi.color.copy(tmp.hemiSky);
  hemi.groundColor.copy(tmp.hemiGround);
  hemi.intensity = mezcla.hemiI;
  sun.color.copy(tmp.sunCol);
  sun.intensity = mezcla.sunI;
  const el = THREE.MathUtils.degToRad(mezcla.elev), R = 62;
  SUN_OFFSET.set(tmp.az.x * Math.cos(el) * R, Math.sin(el) * R, tmp.az.z * Math.cos(el) * R);
  skyUniforms.sunDir.value.copy(SUN_OFFSET).normalize();
  skyUniforms.sunCol.value.copy(tmp.sunCol);
  skyUniforms.sunAmt.value = mezcla.skyGlow;
  skyUniforms.stars.value = mezcla.stars;
  skyUniforms.uTime.value = t;
  renderer.toneMappingExposure = mezcla.exp;
  bloom.strength = mezcla.bloom;
  corazonUniforms.uGlow.value = mezcla.glow;
  ambiente.faroles = mezcla.faroles;
  ambiente.noche = Math.min(1, mezcla.stars * 1.2);
  document.body.classList.toggle('noche', ambiente.noche > 0.45);   // textos claros de noche

  // indicador de hora y ambiente
  const [emoji, nombre] = SIEMPRE_NOCHE && horaFija === null && !cicloRapido ? ['🌙', 'Noche'] : etiquetaHora(h);
  ambiente.estado = nombre;
  const hh = Math.floor(h), mm = Math.floor((h - hh) * 60);
  const texto = `${emoji} ${nombre} · ${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
  const elHora = document.getElementById('hora');       // (el indicador se quitó; si vuelves a ponerlo, se actualiza solo)
  if (elHora && texto !== ultimoTexto) { elHora.textContent = texto; ultimoTexto = texto; }
}
