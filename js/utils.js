// =====================================================================
// utils.js — herramientas compartidas (aleatorio con semilla, ruido,
// suavizados, texturas dibujadas con canvas)
// =====================================================================
import * as THREE from 'three';

// Aleatorio con semilla: el mismo número inicial produce siempre el mismo
// resultado (así el árbol sale idéntico en cada visita).
let seed = 4242;
export const setSeed = (s) => { seed = s; };
export const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
export const rr = (a, b) => a + (b - a) * rand();

// Aleatorio "normal" (cambia en cada visita): para cosas vivas como los mangos que rebrotan
export const mrand = () => Math.random();
export const mrr = (a, b) => a + (b - a) * Math.random();

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
export const mix = (a, b, t) => a + (b - a) * t;
export const easeOutBack = (x) => { const c = 1.4; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
export const easeInOut = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const TAU = Math.PI * 2;
export const V3 = THREE.Vector3;
export const UP = new V3(0, 1, 0);

export function hash(x, y) {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
export function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x, y, o = 4) {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f); n += a; f *= 2.03; a *= 0.5; }
  return s / n;
}
export function randomDir() {
  const u = rand() * 2 - 1, a = rand() * TAU, s = Math.sqrt(1 - u * u);
  return new V3(Math.cos(a) * s, u, Math.sin(a) * s);
}
// gira "dir" un ángulo "ang" hacia un azimut "az" alrededor de sí mismo
export function deviate(dir, az, ang) {
  const t1 = new V3().crossVectors(dir, Math.abs(dir.y) < 0.95 ? UP : new V3(1, 0, 0)).normalize();
  const t2 = new V3().crossVectors(dir, t1);
  return dir.clone().multiplyScalar(Math.cos(ang))
    .addScaledVector(t1, Math.cos(az) * Math.sin(ang))
    .addScaledVector(t2, Math.sin(az) * Math.sin(ang)).normalize();
}

// Textura dibujada con canvas 2D
export function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// "Bolsa" aleatoria: entrega los elementos en desorden sin repetir hasta agotarlos
export function makeBag(items) {
  let pool = [];
  return () => {
    if (!pool.length) {
      pool = items.slice();
      for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    }
    return pool.pop();
  };
}
