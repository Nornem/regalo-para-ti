// =====================================================================
// acceso.js — 🔐 PANTALLA DE ENTRADA CON CLAVE
// • La clave NO está escrita en el código: solo se guarda su "huella".
// • No hay ninguna opción en la pantalla para cambiarla.
// • Se pide CADA VEZ que se abre el enlace (es parte de la experiencia).
//   Solo si recarga la misma pestaña no la vuelve a pedir.
// • Al fallar, muestra mensajes graciosos y una pista (nunca la clave).
// Fondo: puntos de luz que se vierten como agua, dibujan un corazón que
// se queda fijo y, alrededor, otros puntitos forman figuritas.
// =====================================================================
import { MENSAJES_CLAVE } from './contenido.js';

const HUELLA = '1q9ugrv';                 // huella de la clave (8 dígitos)
const RECUERDO = 'mundoKiara.acceso';

function fnv(str) {
  let h = 0x811c9dc5;
  for (const ch of str) { h ^= ch.codePointAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
function huella(d) {
  let h = d;
  for (let i = 0; i < 5000; i++) h = fnv('kiara♡' + h + d).toString(36);
  return h;
}

const params = new URLSearchParams(location.search);
if (params.has('reiniciar')) { try { sessionStorage.removeItem(RECUERDO); } catch { /* nada */ } }
try { localStorage.removeItem(RECUERDO); } catch { /* limpia el recuerdo de versiones anteriores */ }

let abrir;
window.accesoKiara = new Promise((res) => { abrir = res; });

const gate = document.getElementById('gate');
const card = gate.querySelector('.gCard');
const titulo = card.querySelector('h1');
const wrap = document.getElementById('gCodeWrap');
const cajas = [...document.querySelectorAll('#gCode input')];
const msg = document.getElementById('gMsg');

function yaEntro() {
  try { return sessionStorage.getItem(RECUERDO) === HUELLA; } catch { return false; }
}
function entrar(animado) {
  try { sessionStorage.setItem(RECUERDO, HUELLA); } catch { /* sin almacenamiento */ }
  if (!animado) { gate.remove(); abrir(); return; }
  gate.classList.add('ok');
  decir('♡');
  setTimeout(() => { gate.classList.add('salir'); abrir(); }, 1100);
  setTimeout(() => gate.remove(), 2800);
}
function decir(texto) {
  msg.textContent = texto;
  msg.classList.remove('nuevo'); void msg.offsetWidth; msg.classList.add('nuevo');
}

// ---------- mensajes al fallar (nunca dicen la clave) ----------
let fallos = 0, ultimo = -1;
function mensajeFallo() {
  fallos++;
  if (fallos === 1) return MENSAJES_CLAVE.primero;
  if (fallos === 2) return MENSAJES_CLAVE.pista;
  let k;
  do { k = Math.floor(Math.random() * MENSAJES_CLAVE.otros.length); } while (k === ultimo && MENSAJES_CLAVE.otros.length > 1);
  ultimo = k;
  return MENSAJES_CLAVE.otros[k];
}

if (yaEntro()) entrar(false);
else setTimeout(() => cajas[0].focus(), 700);

const codigo = () => cajas.map((c) => c.value).join('');
function revisar() {
  const d = codigo();
  if (d.length < cajas.length) return;
  if (huella(d) === HUELLA) { entrar(true); return; }
  gate.classList.remove('error'); void gate.offsetWidth; gate.classList.add('error');
  decir(mensajeFallo());
  setTimeout(() => { cajas.forEach((c) => { c.value = ''; c.classList.remove('lleno'); }); cajas[0].focus(); }, 650);
}

cajas.forEach((c, i) => {
  c.addEventListener('input', () => {
    const v = c.value.replace(/\D/g, '');
    if (v.length > 1) { pegar(v, i); return; }          // autocompletado / pegado
    c.value = v;
    c.classList.toggle('lleno', !!v);
    if (v && i < cajas.length - 1) cajas[i + 1].focus();
    revisar();
  });
  c.addEventListener('keydown', (e) => {
    if (e.key === 'Backspace' && !c.value && i > 0) { cajas[i - 1].value = ''; cajas[i - 1].classList.remove('lleno'); cajas[i - 1].focus(); e.preventDefault(); }
    if (e.key === 'ArrowLeft' && i > 0) cajas[i - 1].focus();
    if (e.key === 'ArrowRight' && i < cajas.length - 1) cajas[i + 1].focus();
    if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) e.preventDefault();   // solo números
  });
  c.addEventListener('focus', () => c.select());
  c.addEventListener('paste', (e) => {
    e.preventDefault();
    pegar((e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, ''), i);
  });
});
function pegar(digitos, desde) {
  for (let k = 0; k < digitos.length && desde + k < cajas.length; k++) {
    cajas[desde + k].value = digitos[k];
    cajas[desde + k].classList.add('lleno');
  }
  cajas[Math.min(desde + digitos.length, cajas.length - 1)].focus();
  revisar();
}

// =====================================================================
// Fondo animado
// =====================================================================
const cv = document.getElementById('gNet');
const ctx = cv.getContext('2d');
const COLORES = [[255, 143, 208], [190, 140, 255], [124, 196, 255], [130, 235, 220]];
const sprites = COLORES.map(([r, g, b]) => {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const x = c.getContext('2d');
  const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.18, `rgba(${r},${g},${b},0.95)`);
  gr.addColorStop(0.45, `rgba(${r},${g},${b},0.25)`);
  gr.addColorStop(1, `rgba(${r},${g},${b},0)`);
  x.fillStyle = gr; x.fillRect(0, 0, 64, 64);
  return c;
});

const movil = matchMedia('(pointer: coarse)').matches || innerWidth < 760;
const NH = movil ? 90 : 120;               // puntos del corazón principal
const SLOTS = movil ? 3 : 4;               // figuritas que se forman AL MISMO TIEMPO en distintos lugares
const NPF = 16;                            // puntos por figurita (son pequeñas)
const NF = SLOTS * NPF;
const NL = movil ? 12 : 18;                // puntos sueltos (polvo de estrellas)

// ---------- figuras (contornos normalizados, centro 0,0, radio ~1) ----------
const FIG = {
  corazon: (t) => [16 * Math.pow(Math.sin(t), 3) / 17, -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 17],
  flor: (t) => { const r = 0.32 + 0.68 * Math.abs(Math.cos(2.5 * t)); return [Math.sin(t) * r, -Math.cos(t) * r]; },
  estrella: (t) => {
    const k = (t / (Math.PI * 2)) * 10, i = Math.floor(k) % 10, f = k - Math.floor(k);
    const p = (j) => { const a = (j / 10) * Math.PI * 2, r = j % 2 ? 0.42 : 1; return [Math.sin(a) * r, -Math.cos(a) * r]; };
    const a = p(i), b = p(i + 1);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  },
  infinito: (t) => { const d = 1 + Math.sin(t) ** 2; return [1.25 * Math.cos(t) / d, 1.25 * Math.sin(t) * Math.cos(t) / d]; },
  luna: (t) => {                           // media luna de dibujo ☾ (dos arcos que se juntan en las puntas)
    const a = t / (Math.PI * 2);
    const A1 = 52.4 * Math.PI / 180, A2 = 75.2 * Math.PI / 180;
    let x, y;
    if (a < 0.5) { const u = A1 + (a / 0.5) * (2 * Math.PI - 2 * A1); x = Math.cos(u); y = Math.sin(u); }        // arco de afuera
    else { const u = (2 * Math.PI - A2) - ((a - 0.5) / 0.5) * (2 * Math.PI - 2 * A2); x = 0.4 + 0.82 * Math.cos(u); y = 0.82 * Math.sin(u); }   // arco de adentro
    const r = -0.35;                                                                                                   // un poquito inclinada
    return [(x * Math.cos(r) - y * Math.sin(r)) * 0.95 + 0.1, x * Math.sin(r) + y * Math.cos(r)];
  },
};
const FIGURITAS = ['flor', 'estrella', 'luna', 'corazon', 'infinito'];
function muestrear(f, n) {
  const dens = 900, pts = [];
  for (let k = 0; k <= dens; k++) pts.push(f((k / dens) * Math.PI * 2));
  const acc = [0];
  for (let k = 1; k < pts.length; k++) acc.push(acc[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const L = acc[acc.length - 1], out = [];
  let j = 0;
  for (let m = 0; m < n; m++) {
    const d = (m / n) * L;
    while (acc[j + 1] < d) j++;
    const f2 = (d - acc[j]) / (acc[j + 1] - acc[j] || 1);
    out.push([pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f2, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f2]);
  }
  return out;
}
const corazonPts = muestrear(FIG.corazon, NH);
// orden de dibujo: desde la hendidura de arriba, bajando por ambos lados a la vez hasta la punta
const ordenDibujo = corazonPts.map((_, i) => { const u = i / NH; return Math.min(u, 1 - u) * 2; });
const figuritas = Object.fromEntries(FIGURITAS.map((k) => [k, muestrear(FIG[k], NPF)]));

// ---------- disposición: corazón alrededor del título, casillas debajo ----------
let W = 0, H = 0, DPR = 1;
const lay = { cx: 0, cy: 0, S: 100, zona: { l: 0, t: 0, r: 0, b: 0 }, libre: [] };
function armar() {
  DPR = Math.min(devicePixelRatio || 1, 2);
  W = cv.clientWidth; H = cv.clientHeight;
  cv.width = W * DPR; cv.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const tw = titulo.offsetWidth ? Math.min(titulo.scrollWidth, card.offsetWidth) : W * 0.5;
  const alturaCodigo = wrap.offsetHeight || 110;
  let S = Math.max((tw / 2 + 30) / 0.92, Math.min(W, H) * 0.3);
  S = Math.min(S, W * 0.47, (H * 0.86 - alturaCodigo - 40) / 1.75);
  const top = H * 0.07 + 0.72 * S;                      // centro del corazón
  lay.cx = W / 2; lay.cy = top; lay.S = S;
  // el título queda en la parte ancha del corazón; las casillas, debajo de la punta
  card.style.top = `${top + 0.06 * S - card.offsetHeight / 2}px`;   // centrado dentro del corazón
  const codeTop = top + S + 24;
  wrap.style.top = `${codeTop}px`;
  const r = wrap.querySelector('#gCode').getBoundingClientRect();
  lay.zona = { l: Math.min(r.left, W / 2 - 260) - 16, t: codeTop - 14, r: Math.max(r.right, W / 2 + 260) + 16, b: codeTop + alturaCodigo + 16 };
  // lugares libres para figuritas (lejos del corazón y de las casillas)
  const R = Math.min(W, H) * 0.06;
  lay.R = R;
  lay.libre = [];
  for (let k = 0; k < 600 && lay.libre.length < 16; k++) {
    const x = R + 10 + Math.random() * (W - 2 * R - 20), y = R + 10 + Math.random() * (H - 2 * R - 20);
    const enCorazon = x > lay.cx - S * 1.05 - R && x < lay.cx + S * 1.05 + R && y > lay.cy - S * 0.8 - R && y < lay.cy + S * 1.05 + R;
    const enZona = x > lay.zona.l - R && x < lay.zona.r + R && y > lay.zona.t - R && y < lay.zona.b + R;
    if (!enCorazon && !enZona && !lay.libre.some(([a, b]) => Math.hypot(a - x, b - y) < R * 3)) lay.libre.push([x, y]);
  }
  if (!lay.libre.length) lay.libre.push([R + 14, R + 14], [W - R - 14, R + 14]);
}

// visibilidad: 0 dentro de la zona de la clave (ningún punto por delante), 1 afuera
function visible(x, y) {
  const z = lay.zona;
  const dx = Math.max(z.l - x, 0, x - z.r), dy = Math.max(z.t - y, 0, y - z.b);
  const d = Math.hypot(dx, dy);
  return Math.min(1, d / 26);
}

// ---------- puntos ----------
const N = NH + NF + NL;
let nodos = [];
function crearNodos() {
  // los puntos salen desde las 4 esquinas de la pantalla, como agua que se vierte hacia el centro
  const esquinas = [[-10, -10], [W + 10, -10], [-10, H + 10], [W + 10, H + 10]];
  nodos = Array.from({ length: N }, (_, i) => {
    const [ex, ey] = esquinas[i % 4];
    return {
      x: ex + (Math.random() - 0.5) * 20, y: ey + (Math.random() - 0.5) * 20, esq: i % 4,
      vx: 0, vy: 0, sale: (Math.floor(i / 4) / (N / 4)) * 1.0 + Math.random() * 0.12,
      tipo: i < NH ? 'corazon' : i < NH + NF ? 'figura' : 'suelto',
      k: i < NH ? i : i < NH + NF ? (i - NH) % NPF : 0,
      slot: i >= NH && i < NH + NF ? Math.floor((i - NH) / NPF) : -1,
      ph: Math.random() * 10, c: i % COLORES.length, r: 0.7 + Math.random() * 1.1,
      fx: Math.random(), fy: Math.random(),
    };
  });
}
armar();
crearNodos();
addEventListener('resize', armar);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(armar);   // recalcula cuando cargan las letras
const puntero = { x: -9999, y: -9999 };
const mover = (e) => { const p = e.touches ? e.touches[0] : e; puntero.x = p.clientX; puntero.y = p.clientY; };
gate.addEventListener('pointermove', mover);
gate.addEventListener('touchmove', mover, { passive: true });

// línea de tiempo
const T_VERTER = 2.2;         // se vierten como agua
const T_DIBUJO = 5;           // el corazón se dibuja en ~5 s y luego se queda fijo
const T_FIG = 7;              // cada figurita dura 7 s (se forma, se queda y se suelta)
let unir = 0;
// cada "slot" forma su propia figurita, en su propio lugar, desfasado de los demás
const slots = Array.from({ length: SLOTS }, (_, k) => ({ ciclo: -1, lugar: null, nombre: FIGURITAS[k % FIGURITAS.length], inicio: k * 1.7 }));
function actualizarSlots(t) {
  for (const [k, sl] of slots.entries()) {
    const tf = t - (T_VERTER + 1.2 + sl.inicio);
    const ciclo = tf >= 0 ? Math.floor(tf / T_FIG) : -1;
    if (ciclo !== sl.ciclo && ciclo >= 0) {
      sl.ciclo = ciclo;
      sl.nombre = FIGURITAS[(ciclo + k * 2) % FIGURITAS.length];
      const usados = slots.filter((o) => o !== sl && o.lugar).map((o) => o.lugar);
      const opciones = lay.libre.filter((p) => !usados.some((u) => Math.hypot(u[0] - p[0], u[1] - p[1]) < lay.R * 3));
      const lista = opciones.length ? opciones : lay.libre;
      sl.lugar = lista[Math.floor(Math.random() * lista.length)];
    }
    sl.formada = sl.lugar && tf >= 0 && (tf % T_FIG) / T_FIG < 0.75;
  }
}

const t0 = performance.now();
let tPrev = 0;
function cuadro(now) {
  if (!document.body.contains(gate)) return;
  const t = (now - t0) / 1000;
  const dt = Math.min(0.05, t - tPrev); tPrev = t;
  const paso = dt * 60;
  const { cx, cy, S } = lay;

  actualizarSlots(t);

  ctx.clearRect(0, 0, W, H);
  for (const n of nodos) {
    if (t < n.sale) continue;
    if (t < T_VERTER + 0.4 && !n.cayo) {                    // 💧 se vierten desde las esquinas hacia adentro
      if (!n.lanzado) {
        n.lanzado = true;
        const dx = W / 2 - n.x, dy = H / 2 - n.y, d = Math.hypot(dx, dy) || 1;
        const v = (d / 60) * (0.55 + Math.random() * 0.45);
        const giro = (Math.random() - 0.5) * 0.9;
        n.vx = (dx / d) * v + (-dy / d) * v * giro; n.vy = (dy / d) * v + (dx / d) * v * giro;
      }
      const fr = Math.pow(0.955, paso);
      n.vx *= fr; n.vy *= fr;
    } else {
      n.cayo = true;
      let tx = null, ty = null, k = 0.002;
      if (n.tipo === 'corazon') {
        const empieza = T_VERTER + 0.3 + ordenDibujo[n.k] * T_DIBUJO;   // se dibuja en orden
        if (t >= empieza || unir > 0) {
          const p = corazonPts[n.k];
          tx = cx + p[0] * S + Math.sin(t * 0.9 + n.ph) * 2.5;
          ty = cy + p[1] * S + Math.cos(t * 0.8 + n.ph) * 2.5;
          k = 0.02 + unir * 0.02;
        }
      } else if (n.tipo === 'figura' && unir === 0 && slots[n.slot].lugar) {
        const sl = slots[n.slot];
        if (sl.formada) {                                    // forma su figurita
          const p = figuritas[sl.nombre][n.k];
          tx = sl.lugar[0] + p[0] * lay.R; ty = sl.lugar[1] + p[1] * lay.R; k = 0.014;
        } else {                                             // se suelta un ratito cerca de su lugar
          tx = sl.lugar[0] + Math.sin(t * 0.7 + n.ph) * lay.R * 1.6; ty = sl.lugar[1] + Math.cos(t * 0.6 + n.ph * 1.3) * lay.R * 1.6; k = 0.004;
        }
      }
      if (tx === null) {                                     // flotan suave
        tx = n.fx * W + Math.sin(t * 0.3 + n.ph) * 40; ty = n.fy * H + Math.cos(t * 0.25 + n.ph) * 30; k = 0.0015;
        if (visible(tx, ty) < 1) ty = lay.zona.t - 40;       // nunca se quedan sobre la clave
      }
      n.vx += (tx - n.x) * k * paso; n.vy += (ty - n.y) * k * paso;
      const amort = Math.pow(n.tipo === 'corazon' ? 0.86 : 0.9, paso);
      n.vx *= amort; n.vy *= amort;
    }
    const dx = n.x - puntero.x, dy = n.y - puntero.y, d2 = dx * dx + dy * dy;
    if (d2 < 120 * 120 && d2 > 1) { const d = Math.sqrt(d2), f = (1 - d / 120) * 0.9; n.vx += (dx / d) * f; n.vy += (dy / d) * f; }
    n.x += n.vx * paso; n.y += n.vy * paso;
    n.vis = visible(n.x, n.y);
  }

  // líneas (constelación)
  ctx.globalCompositeOperation = 'lighter';
  const D = Math.min(120, Math.max(70, Math.min(W, H) * 0.12));
  ctx.lineWidth = 0.8;
  const vivos = nodos.filter((n) => t >= n.sale && n.vis > 0.02);
  for (let i = 0; i < vivos.length; i++) {
    const a = vivos[i];
    for (let j = i + 1; j < vivos.length; j++) {
      const b = vivos[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > D) continue;
      const v = Math.min(a.vis, b.vis, visible((a.x + b.x) / 2, (a.y + b.y) / 2));
      if (v <= 0.02) continue;
      const [r, g, bb] = COLORES[a.c];
      ctx.strokeStyle = `rgba(${r},${g},${bb},${((1 - d / D) * (0.3 + unir * 0.4) * v).toFixed(3)})`;
      ctx.setLineDash(d > D * 0.55 ? [3, 4] : []);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
  }
  ctx.setLineDash([]);
  for (const n of vivos) {
    const tw = 0.65 + 0.35 * Math.sin(t * 2.2 + n.ph * 3);
    const sz = (9 + n.r * 9) * tw * (1 + unir * 0.5);
    ctx.globalAlpha = (0.55 + 0.45 * tw) * n.vis;
    ctx.drawImage(sprites[n.c], n.x - sz / 2, n.y - sz / 2, sz, sz);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
  if (gate.classList.contains('ok')) unir = Math.min(1, unir + 0.03 * paso);
  if (gate.isConnected) requestAnimationFrame(cuadro);   // al entrar, la animación se apaga sola
}
requestAnimationFrame(cuadro);
