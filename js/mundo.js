// =====================================================================
// mundo.js — distribución del bioma: los 3 puntos en triángulo,
// suelo, pasto, jardín central con piedras y flores, y caminitos
// =====================================================================
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { scene, addWind, MOBILE } from './motor.js';
import { setSeed, rand, rr, smooth, fbm, canvasTex, TAU, V3 } from './utils.js';

// ---------- Distribución en triángulo ----------
// El árbol se queda en el origen (0,0,0). El centro del triángulo está a 24 m.
const R = 24;
export const CENTRO = new V3(0, 0, R);
export const TAMANO_MESA_CUMPLE = 2.5;   // escala de toda la mesa de cumpleaños (torta, globos, regalos…)
const KC = TAMANO_MESA_CUMPLE;
export const TAMANO_MESA_RECUERDOS = 3.25; // escala de toda la mesa de recuerdos (35% menos que la anterior)
const KR = TAMANO_MESA_RECUERDOS;
const dirDe = (deg) => new V3(Math.sin(deg * Math.PI / 180), 0, -Math.cos(deg * Math.PI / 180));
const verticeDesdeCentro = (deg) => CENTRO.clone().addScaledVector(dirDe(deg), R);

function vistaHacia(pos, alturaMira, dist, alto) {
  // cámara ubicada del lado del jardín central, mirando hacia el punto
  const dir = pos.clone().sub(CENTRO).setY(0).normalize();
  const target = pos.clone().setY(alturaMira);
  const cam = pos.clone().addScaledVector(dir, -dist).setY(alto);
  return { target, cam };
}

export const PUNTOS = {
  arbol: {
    nombre: '🥭 Árbol de mango', pos: new V3(0, 0, 0), etiquetaY: 19,
    vista: { target: new V3(0, 10, 0), cam: new V3(0, 13, 36) },
  },
  cumple: {
    nombre: '🎂 Cumpleaños', pos: verticeDesdeCentro(120), etiquetaY: 4.4 * KC,
    vista: vistaHacia(verticeDesdeCentro(120), 1.0 * KC, 6 * KC, 3.2 * KC),
  },
  recuerdos: {
    nombre: '💌 Recuerdos', pos: verticeDesdeCentro(-120), etiquetaY: 1.75 * KR,
    vista: vistaHacia(verticeDesdeCentro(-120), 0.9 * KR, 5 * KR, 2.6 * KR),
  },
  centro: {
    nombre: '♡ Corazón', pos: CENTRO.clone(), etiquetaY: 10,
    vista: { target: new V3(0, 4.2, R), cam: new V3(0, 7.5, R + 21) },
  },
};
export const VISTA_GENERAL = { target: new V3(0, 4, 18), cam: new V3(0, 17, 70) };

const JARDIN_R = 6.6;     // radio del círculo de piedras

// ---------- Caminitos: un anillo alrededor del corazón y uno hacia cada punto ----------
export const ANILLO_R = JARDIN_R + 2.1;   // radio del camino circular alrededor del jardín
export const ANILLO_EXT_R = 38;          // radio del camino de piedra que rodea todo el escenario
const caminos = [];   // puntos muestreados (para no poner pasto encima)
export const curvas = {};                 // curvas de cada camino (para ubicar faroles)
function cinta(curve, cerrada, N, ANCHO = 0.7) {
  const pos = [], uv = [], idx = [];
  let acc = 0, prev = null;
  for (let i = 0; i <= N; i++) {
    const t = i / N, p = curve.getPointAt(t % 1), tg = curve.getTangentAt(t % 1);
    const side = new V3(-tg.z, 0, tg.x).normalize();
    const fade = cerrada ? 1 : smooth(0, 0.06, t) * smooth(1, 0.94, t);
    const w = ANCHO * (0.85 + 0.15 * Math.sin(t * 17 * (cerrada ? 3 : 1))) * fade;
    if (prev) acc += p.distanceTo(prev); prev = p;
    pos.push(p.x - side.x * w, 0.014, p.z - side.z * w, p.x + side.x * w, 0.014, p.z + side.z * w);
    uv.push(0, acc / 2.2, 1, acc / 2.2);
    if (i < N) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    caminos.push(p);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}
function crearCamino(destino, finAntes, curva) {
  const dir = destino.clone().sub(CENTRO).setY(0).normalize();
  const largo = destino.clone().setY(0).distanceTo(CENTRO) - finAntes;
  const ini = CENTRO.clone().addScaledVector(dir, ANILLO_R);      // nace del camino circular
  const fin = CENTRO.clone().addScaledVector(dir, largo);
  const lado = new V3(-dir.z, 0, dir.x);
  const mid = ini.clone().lerp(fin, 0.5).addScaledVector(lado, curva);
  return new THREE.CatmullRomCurve3([ini, ini.clone().lerp(mid, 0.5).addScaledVector(lado, curva * 0.3), mid, fin]);
}
const caminoTex = canvasTex(128, 256, (g, w, h) => {
  const img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const u = x / w, edge = Math.min(u, 1 - u) * 2;              // 0 borde … 1 centro
    const n = Math.random();
    const a = Math.max(0, Math.min(1, (edge - 0.08 + (n - 0.5) * 0.25) * 2.2));
    const i = (y * w + x) * 4;
    const l = 0.9 + n * 0.2;
    img.data[i] = 186 * l; img.data[i + 1] = 172 * l; img.data[i + 2] = 128 * l; img.data[i + 3] = a * 200;
  }
  g.putImageData(img, 0, 0);
  for (let i = 0; i < 260; i++) {           // piedritas
    g.fillStyle = `rgba(${200 + Math.random() * 40},${195 + Math.random() * 40},${180 + Math.random() * 30},0.7)`;
    g.beginPath(); g.arc(20 + Math.random() * 88, Math.random() * h, 0.8 + Math.random() * 1.8, 0, TAU); g.fill();
  }
});
caminoTex.wrapT = THREE.RepeatWrapping;
const caminoMat = new THREE.MeshStandardMaterial({
  map: caminoTex, transparent: true, depthWrite: false, roughness: 1,
  polygonOffset: true, polygonOffsetFactor: -1,
});
for (const [k, finAntes, curva] of [['arbol', 4.8, 1.4], ['cumple', 2.6 * KC, -1.2], ['recuerdos', 1.6 * KR, 1.2]]) {
  curvas[k] = crearCamino(PUNTOS[k].pos, finAntes, curva);
  const m = new THREE.Mesh(cinta(curvas[k], false, 60), caminoMat);
  m.receiveShadow = true;
  scene.add(m);
}
{ // camino circular alrededor del corazón
  const pts = Array.from({ length: 48 }, (_, i) => {
    const a = (i / 48) * TAU;
    return new V3(CENTRO.x + Math.cos(a) * ANILLO_R, 0, CENTRO.z + Math.sin(a) * ANILLO_R);
  });
  curvas.anillo = new THREE.CatmullRomCurve3(pts, true);
  const m = new THREE.Mesh(cinta(curvas.anillo, true, 120, 0.75), caminoMat);
  m.receiveShadow = true;
  scene.add(m);
}
export const distCamino = (x, z) => {
  let d = Infinity;
  for (let i = 0; i < caminos.length; i += 2) { const p = caminos[i]; const dd = (p.x - x) ** 2 + (p.z - z) ** 2; if (dd < d) d = dd; }
  return Math.sqrt(d);
};

// ---------- Suelo ----------
{
  const geo = new THREE.PlaneGeometry(1600, 1600, 200, 200);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position, cols = new Float32Array(p.count * 3);
  const a = new THREE.Color('#5f9a2c'), b = new THREE.Color('#8dbd3c'), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), z = p.getZ(i);
    c.copy(a).lerp(b, smooth(0.3, 0.75, fbm(x * 0.07, z * 0.07)));
    cols.set([c.r, c.g, c.b], i * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  const ground = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  ground.receiveShadow = true;
  scene.add(ground);
}

// ---------- Jardín central: área más verde con degradado al borde ----------
{
  const tex = canvasTex(256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    gr.addColorStop(0, 'rgba(120,205,70,0.9)');
    gr.addColorStop(0.72, 'rgba(112,196,62,0.75)');
    gr.addColorStop(1, 'rgba(100,180,60,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  });
  const disc = new THREE.Mesh(
    new THREE.CircleGeometry(JARDIN_R + 1.4, 96),
    new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 })
  );
  disc.rotation.x = -Math.PI / 2;
  disc.position.set(CENTRO.x, 0.01, CENTRO.z);
  disc.receiveShadow = true;
  scene.add(disc);
}

// ---------- Marcas suaves donde irán las mesas (Etapas 2 y 3) ----------
{
  const tex = canvasTex(128, 128, (g) => {
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(176,170,110,0.45)');
    gr.addColorStop(0.7, 'rgba(160,165,95,0.3)');
    gr.addColorStop(1, 'rgba(150,160,90,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  });
  const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -1 });
  for (const k of ['cumple', 'recuerdos']) {
    const m = new THREE.Mesh(new THREE.CircleGeometry(k === 'cumple' ? 2.4 * KC : 1.6 * KR, 48), mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(PUNTOS[k].pos.x, 0.012, PUNTOS[k].pos.z);
    m.receiveShadow = true;
    scene.add(m);
  }
}

setSeed(1234);   // semilla propia del mundo (no afecta al árbol)

// ---------- Piedras naturales alrededor del jardín ----------
{
  const N = 66;
  const stones = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.22, 1), new THREE.MeshStandardMaterial({ roughness: 0.9 }), N);
  const d = new THREE.Object3D(), col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU + rr(-0.02, 0.02), r = JARDIN_R + rr(-0.07, 0.07);
    d.position.set(CENTRO.x + Math.cos(a) * r, 0.05, CENTRO.z + Math.sin(a) * r);
    d.rotation.set(rand() * 3, rand() * 3, rand() * 3);
    const s = rr(0.85, 1.45);
    d.scale.set(s * rr(0.9, 1.3), s * rr(0.5, 0.75), s * rr(0.9, 1.2));
    d.updateMatrix();
    stones.setMatrixAt(i, d.matrix);
    stones.setColorAt(i, col.setHSL(rr(0.07, 0.12), rr(0.05, 0.14), rr(0.58, 0.74)));
  }
  stones.castShadow = stones.receiveShadow = true;
  scene.add(stones);
}

// ---------- Camino de piedras que rodea todo el escenario ----------
{
  const g = new THREE.CylinderGeometry(0.42, 0.46, 0.09, 7);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {                          // bordes irregulares
    const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x);
    const k = 1 + 0.12 * Math.sin(a * 3 + 1.7) + 0.06 * Math.sin(a * 5);
    p.setX(i, x * k); p.setZ(i, z * k);
  }
  g.computeVertexNormals();
  const paso = 0.78, N = Math.floor((TAU * ANILLO_EXT_R) / paso);
  const losas = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ roughness: 0.92 }), N);
  const d = new THREE.Object3D(), col = new THREE.Color();
  for (let i = 0; i < N; i++) {
    const a = (i / N) * TAU, r = ANILLO_EXT_R + (i % 2 ? 0.28 : -0.28) + rr(-0.08, 0.08);
    d.position.set(CENTRO.x + Math.cos(a) * r, 0.03, CENTRO.z + Math.sin(a) * r);
    d.rotation.set(rr(-0.03, 0.03), rand() * TAU, rr(-0.03, 0.03));
    const sc = rr(0.82, 1.12);
    d.scale.set(sc * rr(0.9, 1.15), 1, sc * rr(0.85, 1.05));
    d.updateMatrix();
    losas.setMatrixAt(i, d.matrix);
    losas.setColorAt(i, col.setHSL(rr(0.07, 0.11), rr(0.05, 0.12), rr(0.5, 0.66)));
  }
  losas.receiveShadow = true;
  scene.add(losas);
}

// ---------- Florecitas alrededor del círculo ----------
{
  const N = 150;
  const colores = ['#ffffff', '#f7c6d9', '#c9b3f0', '#fff1a6', '#bcd8ff', '#ffd6e6'];
  const stemGeo = new THREE.CylinderGeometry(0.008, 0.011, 1, 4).translate(0, 0.5, 0);
  const headGeo = new THREE.IcosahedronGeometry(0.05, 0).scale(1, 0.55, 1);
  const stems = new THREE.InstancedMesh(stemGeo, new THREE.MeshStandardMaterial({ color: '#5c8f2c', roughness: 0.8 }), N);
  const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ roughness: 0.55 }), N);
  const d = new THREE.Object3D(), col = new THREE.Color();
  let n = 0;
  for (let tries = 0; n < N && tries < 2000; tries++) {
    const outside = rand() < 0.7;
    const r = outside ? rr(JARDIN_R + 0.35, JARDIN_R + 1.0) : rr(JARDIN_R - 1.3, JARDIN_R - 0.35);
    const a = rand() * TAU;
    const x = CENTRO.x + Math.cos(a) * r, z = CENTRO.z + Math.sin(a) * r;
    if (distCamino(x, z) < 0.9) continue;
    const h = rr(0.14, 0.32);
    d.position.set(x, 0, z); d.rotation.set(rr(-0.15, 0.15), 0, rr(-0.15, 0.15)); d.scale.set(1, h, 1);
    d.updateMatrix(); stems.setMatrixAt(n, d.matrix);
    d.position.set(x, h, z); d.rotation.set(0, rand() * TAU, 0); d.scale.setScalar(rr(0.8, 1.3));
    d.updateMatrix(); heads.setMatrixAt(n, d.matrix);
    heads.setColorAt(n, col.set(colores[Math.floor(rand() * colores.length)]));
    n++;
  }
  stems.count = heads.count = n;
  heads.castShadow = true;
  scene.add(stems, heads);
}

// ---------- Flores silvestres esparcidas por el terreno (en manchitas naturales) ----------
{
  const N = MOBILE ? 700 : 1800;
  const colores = ['#ffffff', '#ffd6e8', '#f7a8c8', '#d9c4ff', '#fff2a8', '#bfe0ff'];
  const stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.012, 1, 4).translate(0, 0.5, 0), new THREE.MeshStandardMaterial({ color: '#4f7f2a', roughness: 0.8 }), N);
  // pétalos: un "disco" de 5 pétalos con centro
  const petalos = [];
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * TAU;
    petalos.push(new THREE.SphereGeometry(0.04, 8, 6).scale(1, 0.3, 0.6).translate(0.045, 0, 0).rotateY(a));
  }
  const headGeo = mergeGeometries(petalos);
  const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshStandardMaterial({ roughness: 0.6, emissive: '#ffffff', emissiveIntensity: 0.06 }), N);
  const centros = new THREE.InstancedMesh(new THREE.SphereGeometry(0.022, 8, 6).scale(1, 0.6, 1), new THREE.MeshStandardMaterial({ color: '#ffcf4a', roughness: 0.5 }), N);
  const d = new THREE.Object3D(), col = new THREE.Color();
  const mesasF = [[PUNTOS.cumple.pos, 2.4 * KC], [PUNTOS.recuerdos.pos, 1.6 * KR]];
  let n = 0;
  for (let tries = 0; n < N && tries < N * 30; tries++) {
    const r = Math.sqrt(rand()) * 60, a = rand() * TAU;
    const x = CENTRO.x + Math.cos(a) * r, z = CENTRO.z + Math.sin(a) * r;
    if (fbm(x * 0.05 + 7, z * 0.05 + 3, 3) < 0.55) continue;            // crecen en manchitas
    if (Math.hypot(x, z) < 13) continue;                                  // no bajo el árbol
    if (Math.hypot(x - CENTRO.x, z - CENTRO.z) < ANILLO_R + 1.2) continue; // no dentro del jardín
    if (distCamino(x, z) < 1) continue;
    if (Math.abs(Math.hypot(x - CENTRO.x, z - CENTRO.z) - ANILLO_EXT_R) < 1.1) continue;
    if (mesasF.some(([m, rm]) => Math.hypot(x - m.x, z - m.z) < rm)) continue;
    const h = rr(0.18, 0.42);
    d.position.set(x, 0, z); d.rotation.set(rr(-0.12, 0.12), 0, rr(-0.12, 0.12)); d.scale.set(1, h, 1);
    d.updateMatrix(); stems.setMatrixAt(n, d.matrix);
    const sc = rr(0.7, 1.3);
    d.position.set(x, h, z); d.rotation.set(rr(-0.3, 0.3), rand() * TAU, rr(-0.3, 0.3)); d.scale.setScalar(sc);
    d.updateMatrix(); heads.setMatrixAt(n, d.matrix);
    d.position.y = h + 0.008 * sc; d.updateMatrix(); centros.setMatrixAt(n, d.matrix);
    heads.setColorAt(n, col.set(colores[Math.floor(rand() * colores.length)]));
    n++;
  }
  stems.count = heads.count = centros.count = n;
  heads.castShadow = true;
  scene.add(stems, heads, centros);
}

// ---------- Pasto ----------
{
  const blade = new THREE.PlaneGeometry(0.075, 0.6, 1, 5);
  blade.translate(0, 0.3, 0);
  const bp = blade.attributes.position;
  for (let i = 0; i < bp.count; i++) {
    const y = bp.getY(i) / 0.6;
    bp.setX(i, bp.getX(i) * (1 - y * 0.95));
    bp.setZ(i, y * y * 0.14);
  }
  blade.computeVertexNormals();
  const gMat = new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.8 });
  addWind(gMat, 0.32, 'position.y');
  const N = MOBILE ? 48000 : 125000;   // pasto en un área más amplia
  const grass = new THREE.InstancedMesh(blade, gMat, N);
  const d = new THREE.Object3D(), col = new THREE.Color();
  const mesas = [[PUNTOS.cumple.pos, 2.2 * KC], [PUNTOS.recuerdos.pos, 1.4 * KR]];
  let n = 0;
  for (let tries = 0; n < N && tries < N * 2; tries++) {
    // 18% del pasto se concentra bajo el árbol (como estaba antes), el resto en todo el mundo
    const bajoArbol = rand() < 0.1;
    const r = bajoArbol ? 1.8 + Math.pow(rand(), 0.8) * 14 : Math.pow(rand(), 0.6) * 82, ang = rand() * TAU;
    const cx = bajoArbol ? 0 : CENTRO.x, cz = bajoArbol ? 0 : CENTRO.z;
    const x = cx + Math.cos(ang) * r, z = cz + Math.sin(ang) * r;
    if (Math.hypot(x, z) < 1.8) continue;                      // tronco del árbol
    const dc = distCamino(x, z);
    if (dc < 0.5) continue;                                     // sobre el camino
    const dExt = Math.abs(Math.hypot(x - CENTRO.x, z - CENTRO.z) - ANILLO_EXT_R);
    if (dExt < 0.75) continue;                                  // bajo el camino de piedra exterior
    const dj = Math.hypot(x - CENTRO.x, z - CENTRO.z);
    if (Math.abs(dj - JARDIN_R) < 0.22) continue;               // bajo las piedras
    let h = rr(0.6, 1.6);
    if (dc < 0.9) h *= 0.5;                                     // pasto pisado a los lados del camino
    if (dExt < 1.2) h *= 0.55;
    for (const [m, rm] of mesas) if (Math.hypot(x - m.x, z - m.z) < rm) h *= 0.55;
    d.position.set(x, 0, z);
    d.rotation.set(0, rand() * TAU, 0);
    d.scale.set(1, h, 1);
    d.updateMatrix();
    grass.setMatrixAt(n, d.matrix);
    const patch = fbm(x * 0.07, z * 0.07);
    const lush = smooth(JARDIN_R + 1.2, JARDIN_R - 0.5, dj);  // jardín: verde más vivo
    col.setHSL(rr(0.2, 0.26) + lush * 0.03, rr(0.55, 0.75) + lush * 0.1, rr(0.3, 0.42) + patch * 0.08 + lush * 0.07);
    grass.setColorAt(n, col);
    n++;
  }
  grass.count = n;
  grass.receiveShadow = true;
  scene.add(grass);
}
