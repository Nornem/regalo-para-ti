// =====================================================================
// main.js — une todo: efectos, interfaz, selección de mangos y animación
// =====================================================================
import * as THREE from 'three';
import {
  renderer, scene, camera, controls, composer, clock, windU, glowTex,
  flyTo, isFlying, camState, updateCamera, updateSun, ajustarCalidad,
} from './motor.js';
import { PUNTOS, VISTA_GENERAL, CENTRO } from './mundo.js';
import { mangos, rosettes, leafGeo, leafTex, COLORS, TAMANO_ARBOL, cosechar, updateArbol } from './arbol.js';
import { TITULO, SUBTITULO, CATEGORIAS, MENSAJES_SECRETOS, COSECHAS_POR_SECRETO } from './contenido.js';
import { clamp01, smooth, mrr, TAU, V3 } from './utils.js';
import { progreso, guardar } from './progreso.js';
import { mesa, cerrarCumple, cumpleAbierto, cumpleClick, updateCumple, initCumple, esCartaCumple } from './cumple.js';
import { heart, corazonClick, updateCorazon } from './corazon.js';
import { updateCiclo } from './ciclo.js';
import { updateFaroles } from './faroles.js';
import { ambiente } from './ambiente.js';
import { mesaR, recuerdosClick, etiquetaRecuerdo, cerrarRecuerdo, recuerdoAbierto, updateRecuerdos, initRecuerdos } from './recuerdos.js';

const $ = (id) => document.getElementById(id);
$('heading').textContent = TITULO;
$('subheading').textContent = SUBTITULO;
$('subheading').hidden = !SUBTITULO;
document.title = TITULO;

// ---------- Polen flotando (árbol y jardín) ----------
const POLLEN = 160;
const polBase = new Float32Array(POLLEN * 3), polPos = new Float32Array(POLLEN * 3);
for (let i = 0; i < POLLEN; i++) {
  const enJardin = i >= 110;
  const r = Math.sqrt(Math.random()) * (enJardin ? 7 : 11), a = Math.random() * TAU;
  if (enJardin) polBase.set([CENTRO.x + Math.cos(a) * r, 0.3 + Math.random() * 3, CENTRO.z + Math.sin(a) * r], i * 3);
  else polBase.set([Math.cos(a) * r * TAMANO_ARBOL, 0.5 + Math.random() * 9 * TAMANO_ARBOL, Math.sin(a) * r * TAMANO_ARBOL], i * 3);
}
const polGeo = new THREE.BufferGeometry();
polGeo.setAttribute('position', new THREE.BufferAttribute(polPos, 3));
// de noche el polen se vuelve luciérnagas
const polMat = new THREE.PointsMaterial({
  map: glowTex, color: '#fffbe2', size: 0.11, transparent: true, depthWrite: false,
  blending: THREE.AdditiveBlending, opacity: 0.6,
});
const POL_DIA = new THREE.Color('#fffbe2'), POL_NOCHE = new THREE.Color('#ffe27a');
scene.add(new THREE.Points(polGeo, polMat));

// ---------- Hojas que caen ----------
const fallers = [];
for (let i = 0; i < 18; i++) {
  const mat = new THREE.MeshStandardMaterial({
    map: leafTex, side: THREE.DoubleSide, transparent: true, roughness: 0.5,
    color: new THREE.Color().setHSL(Math.random() < 0.35 ? mrr(0.11, 0.15) : mrr(0.2, 0.26), 0.7, mrr(0.36, 0.48)),
  });
  const mesh = new THREE.Mesh(leafGeo, mat);
  mesh.scale.setScalar(TAMANO_ARBOL * 0.55);   // hojas que caen: tamaño más discreto
  mesh.castShadow = true;
  scene.add(mesh);
  const f = { mesh };
  resetFaller(f, 3 + Math.random() * 14);
  fallers.push(f);
}
function resetFaller(f, delay = Math.random() * 4) {
  const ro = rosettes[Math.floor(Math.random() * rosettes.length)];
  f.mesh.position.copy(ro.P).multiplyScalar(TAMANO_ARBOL);
  f.mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
  f.vy = 0.35 + Math.random() * 0.4;
  f.phase = Math.random() * 10;
  f.spin = new V3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3);
  f.grounded = 0; f.delay = delay;
  f.mesh.material.opacity = 1; f.mesh.visible = false;
}
// al cosechar, el árbol suelta un par de hojitas cerca del mango
function rustle(pos) {
  let n = 0;
  for (const f of fallers) {
    if (n >= 3) break;
    if (f.delay > 0.5 || f.grounded) {
      f.mesh.position.copy(pos).add(new V3(mrr(-0.8, 0.8), mrr(0.2, 1.2), mrr(-0.8, 0.8)));
      f.delay = 0; f.grounded = 0; f.mesh.visible = true; f.mesh.material.opacity = 1;
      n++;
    }
  }
}

// ---------- Destellos ----------
const bursts = [];
function burst(pos, color = '#ffcf6a', n = 60) {
  const p = new Float32Array(n * 3), v = [];
  for (let i = 0; i < n; i++) {
    p.set([pos.x, pos.y, pos.z], i * 3);
    v.push(new V3(Math.random() - 0.5, Math.random() * 0.8 - 0.1, Math.random() - 0.5).normalize().multiplyScalar(1 + Math.random() * 2.2));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({
    map: glowTex, color, size: 0.2, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  }));
  scene.add(pts);
  bursts.push({ pts, v, life: 0 });
}
const halo = new THREE.Sprite(new THREE.SpriteMaterial({
  map: glowTex, color: '#ffbe5c', transparent: true, depthWrite: false, depthTest: false,
  blending: THREE.AdditiveBlending, opacity: 0,
}));
halo.renderOrder = 10;
scene.add(halo);

// ---------- Aviso breve (toast) ----------
let toastTimer = null;
function toast(text) {
  const el = $('toast');
  el.textContent = text;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 3200);
}

// ---------- Indicadores de los puntos (clic = ir allí) ----------
const etiquetas = Object.entries(PUNTOS).map(([k, p]) => {
  const el = document.createElement('button');
  el.className = 'zona';
  el.textContent = p.nombre;
  el.addEventListener('click', () => irA(k));
  $('labels').appendChild(el);
  return { el, k, aqui: 1, anchor: new V3(p.pos.x, p.etiquetaY, p.pos.z) };
});
// ¿la cámara está mirando ese punto? (mismo objetivo y a una distancia parecida a su vista)
function enZona(k) {
  const v = PUNTOS[k].vista;
  if (controls.target.distanceTo(v.target) > 4) return false;
  const ideal = v.cam.distanceTo(v.target), real = camera.position.distanceTo(controls.target);
  return real > ideal * 0.5 && real < ideal * 1.6;
}
function irA(k) {
  if (panelOpen()) closePanel();
  cerrarCumple(false);
  cerrarRecuerdo(false);
  const v = PUNTOS[k].vista;
  flyTo(v.target, v.cam, 2.2);
  controls.autoRotate = false;
  camState.lastInteract = clock.elapsedTime;
}
$('home').addEventListener('click', () => {
  cerrarCumple(false);
  cerrarRecuerdo(false);
  if (panelOpen()) closePanel();
  flyTo(VISTA_GENERAL.target, VISTA_GENERAL.cam, 2.4);
  camState.lastInteract = clock.elapsedTime;
});
const _p = new V3();
function updateEtiquetas() {
  for (const e of etiquetas) {
    _p.copy(e.anchor).project(camera);
    const dist = camera.position.distanceTo(e.anchor);
    const vis = _p.z < 1 && Math.abs(_p.x) < 1.1 && Math.abs(_p.y) < 1.1;
    const aqui = enZona(e.k) ? 0 : 1;                       // si ya estás en ese punto, su etiqueta se esconde
    e.aqui += (aqui - e.aqui) * 0.12;
    const op = vis ? smooth(7, 15, dist) * e.aqui * (panelOpen() || cumpleAbierto() || recuerdoAbierto() ? 0 : 1) : 0;
    e.el.style.opacity = op.toFixed(2);
    e.el.style.pointerEvents = op > 0.3 ? 'auto' : 'none';
    e.el.style.transform = `translate(${((_p.x * 0.5 + 0.5) * innerWidth).toFixed(1)}px, ${((-_p.y * 0.5 + 0.5) * innerHeight).toFixed(1)}px) translate(-50%, -100%)`;
  }
}

// ---------- Cámara: vista del árbol al cerrar un mango ----------
function overview() {
  const dir = camera.position.clone().sub(controls.target); dir.y = 0; dir.normalize();
  const target = new V3(0, 5.0 * TAMANO_ARBOL, 0);
  flyTo(target, target.clone().addScaledVector(dir, 19 * TAMANO_ARBOL).add(new V3(0, 1.6 * TAMANO_ARBOL, 0)), 1.6);
}
// entrada: cuando se pone la clave, la cámara baja desde lo alto hasta la vista general
(window.accesoKiara || Promise.resolve()).then(() => flyTo(VISTA_GENERAL.target, VISTA_GENERAL.cam, 4.2));

// ---------- Selección de mangos ----------
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const tooltip = $('tooltip');
let hovered = null, selected = null, downPos = null;
const panel = $('panel');
const panelOpen = () => panel.classList.contains('open');

function pick(e) {
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(mangos.filter((m) => m.pop > 0.5 && m.gone === 0).map((m) => m.mesh), false);
  return hits.length ? hits[0].object.userData.m : null;
}
renderer.domElement.addEventListener('pointermove', (e) => {
  if (e.pointerType === 'touch') return;
  hovered = pick(e);
  const hitMesa = !hovered ? raycaster.intersectObject(mesa, true)[0] : null;
  const sobreMesa = !!hitMesa;
  const hitR = !hovered && !sobreMesa ? raycaster.intersectObject(mesaR, true)[0] : null;
  const sobreCorazon = !hovered && !sobreMesa && !hitR && raycaster.intersectObject(heart, false).length > 0;
  renderer.domElement.style.cursor = hovered || sobreMesa || hitR || sobreCorazon ? 'pointer' : 'grab';
  if (hovered || sobreMesa || hitR || sobreCorazon) {
    tooltip.innerHTML = hovered
      ? `🥭 ${hovered.variety}<small>${hovered === selected ? 'seleccionado' : 'clic para abrir'}</small>`
      : sobreMesa
        ? (esCartaCumple(hitMesa.object)
          ? '💌 Una carta para ti<small>toca para abrir</small>'
          : `🎂 Mesa de cumpleaños<small>${progreso.deseo ? 'el deseo ya fue pedido' : 'toca para celebrar'}</small>`)
        : hitR
          ? `${etiquetaRecuerdo(hitR.object)}<small>toca para abrir</small>`
          : '♡ Corazón galáctico<small>tócalo</small>';
    tooltip.style.left = e.clientX + 'px';
    tooltip.style.top = e.clientY + 'px';
    tooltip.classList.add('show');
  } else tooltip.classList.remove('show');
});
renderer.domElement.addEventListener('pointerleave', () => { hovered = null; tooltip.classList.remove('show'); });
renderer.domElement.addEventListener('pointerdown', (e) => { downPos = [e.clientX, e.clientY]; });
renderer.domElement.addEventListener('pointerup', (e) => {
  if (!downPos || Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]) > 8) return;
  const m = pick(e);
  if (m) { select(m); return; }
  const hitMesa = raycaster.intersectObject(mesa, true)[0];
  if (hitMesa) { cumpleClick(hitMesa.object); return; }
  const hitR = raycaster.intersectObject(mesaR, true)[0];
  if (hitR) { recuerdosClick(hitR.object); return; }
  if (raycaster.intersectObject(heart, false).length) { corazonClick(burst, toast); return; }
  if (cumpleAbierto()) cerrarCumple(); else if (panelOpen()) deselect();
});
addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if ($('secreto').classList.contains('open')) cerrarSecreto();
  else if (recuerdoAbierto()) cerrarRecuerdo();
  else if (cumpleAbierto()) cerrarCumple();
  else deselect();
});

const hex = (c) => '#' + c.getHexString();
const esPregunta = (msg) => msg.tipo === 'chiste' || msg.tipo === 'adivinanza';
const PISTA_OCULTA = {
  reflexion: 'Hay una reflexión guardada adentro. Cosecha el mango para leerla.',
  amor: 'Este mango guarda algo bonito para ti. Coséchalo para descubrirlo.',
  animo: 'Adentro hay un mensajito para darte ánimo. Coséchalo para leerlo.',
  dato: 'Este mango sabe algo curioso. Coséchalo para descubrirlo.',
  chiste: 'La respuesta se revela al cosechar el mango.',
  adivinanza: '¿Ya sabes la respuesta? Cosecha el mango para comprobarlo.',
};

// Pinta el panel según el estado del mango: antes (oculto) o después (revelado)
let enPanel = null;   // mango que se está mostrando en el panel
function pintarPanel(m) {
  enPanel = m;
  const msg = m.msg;
  $('cat').textContent = CATEGORIAS[msg.tipo] || '';
  $('variety').textContent = `Mango ${m.variety}`;
  $('question').textContent = esPregunta(msg) ? msg.pregunta : '';
  const abierto = m.harvested;
  $('locked').hidden = abierto;
  $('lockedText').textContent = PISTA_OCULTA[msg.tipo] || 'Cosecha el mango para descubrir su mensaje.';
  const rv = $('reveal');
  rv.hidden = !abierto;
  if (abierto) {
    rv.className = esPregunta(msg) ? 'answer' : '';
    rv.textContent = esPregunta(msg) ? msg.respuesta : `“${msg.texto}”`;
    rv.style.animation = 'none'; void rv.offsetWidth; rv.style.animation = '';   // reinicia la animación
  }
  $('special').textContent = !abierto && secretos.faltan() === 1 ? '✨ Este mango podría guardar algo especial…' : '';
  $('harvest').hidden = abierto;
  $('openSecret').hidden = !(abierto && m.secreto != null);
}

function select(m) {
  cerrarCumple(false);
  cerrarRecuerdo(false);
  selected = m;
  controls.autoRotate = false;
  m.vz += 2.6; m.vx += 1.2;
  const wp = m.mesh.getWorldPosition(new V3());
  burst(wp);
  if (!m.harvested) {
    const out = new V3(wp.x, 0, wp.z).normalize();
    flyTo(wp, wp.clone().addScaledVector(out, 5.0).add(new V3(0, 0.8, 0)), 1.4);
  }
  const y = new THREE.Color().lerpColors(COLORS.green, COLORS.yellow, clamp01(m.ripe * 1.4));
  const o = new THREE.Color().copy(y).lerp(COLORS.red, clamp01(m.ripe * 1.25 - 0.15) * 0.85);
  $('swatch').style.background = `radial-gradient(circle at 70% 75%, ${hex(y)}, ${hex(o)} 80%)`;
  pintarPanel(m);
  panel.classList.remove('open');
  void panel.offsetWidth;            // reinicia la animación al cambiar de mango
  panel.classList.add('open');
}
function closePanel() {
  selected = null;
  panel.classList.remove('open');
}
function deselect() {
  if (!panelOpen()) return;
  closePanel();
  overview();
  camState.lastInteract = clock.elapsedTime;
}
$('close').addEventListener('click', deselect);

// ---------- Progreso y mensajes secretos (se guarda en este navegador: ver progreso.js) ----------
const N = COSECHAS_POR_SECRETO;
const secretos = {
  total: MENSAJES_SECRETOS.length,
  faltan() { return this.completos() ? Infinity : (progreso.secretos + 1) * N - progreso.cosechados; },
  completos() { return progreso.secretos >= this.total; },
};

function pintarProgreso() {
  $('count').textContent = progreso.cosechados;
  const pill = $('secretPill');
  pill.classList.toggle('can-open', progreso.secretos > 0);
  pill.classList.remove('near');
  if (secretos.completos()) {
    pill.innerHTML = '♡ Descubriste todos los mensajes secretos ✨';
    return;
  }
  const faltan = secretos.faltan();
  const hechos = N - faltan;
  // cuántos lleva, pero nunca cuántos hay en total: eso es un misterio
  const vistos = progreso.secretos ? ` · ${progreso.secretos}<span class="incog">/?</span>` : '';
  if (faltan <= 2) {
    pill.classList.add('near');
    pill.innerHTML = `💌 ¡${faltan === 1 ? 'Falta 1 mango' : 'Faltan 2 mangos'} para un mensaje secreto!${vistos}`;
  } else {
    // el resto del tiempo: misterio (puntitos con incógnitas)
    const dots = Array.from({ length: N }, (_, i) => (i < hechos ? '<i class="on"></i>' : '<i>?</i>')).join('');
    const texto = progreso.cosechados === 0 ? 'Algo se esconde en este árbol…' : '';
    pill.innerHTML = `💌 <span class="dots">${dots}</span>${texto ? ' ' + texto : ''}${vistos}`;
  }
}

let secIdx = 0;
function abrirSecreto(i) {
  secIdx = Math.max(0, Math.min(i, progreso.secretos - 1));
  const s = MENSAJES_SECRETOS[secIdx];
  $('secNum').innerHTML = `${secIdx + 1} <span class="incog">de ?</span>`;
  $('secTexto').textContent = s.texto;
  $('secPrev').disabled = secIdx === 0;
  $('secNext').disabled = secIdx >= progreso.secretos - 1;
  $('secreto').classList.add('open');
  $('secreto').setAttribute('aria-hidden', 'false');
}
function cerrarSecreto() {
  $('secreto').classList.remove('open');
  $('secreto').setAttribute('aria-hidden', 'true');
}
$('secOk').addEventListener('click', cerrarSecreto);
$('secClose').addEventListener('click', cerrarSecreto);
$('secPrev').addEventListener('click', () => abrirSecreto(secIdx - 1));
$('secNext').addEventListener('click', () => abrirSecreto(secIdx + 1));
$('secreto').addEventListener('click', (e) => { if (e.target.id === 'secreto') cerrarSecreto(); });
$('secretPill').addEventListener('click', () => { if (progreso.secretos > 0) abrirSecreto(progreso.secretos - 1); });
$('openSecret').addEventListener('click', () => { if (enPanel && enPanel.secreto != null) abrirSecreto(enPanel.secreto); });
pintarProgreso();
initCumple({ burst, cerrarOtros: () => { if (panelOpen()) closePanel(); cerrarRecuerdo(false); } });
initRecuerdos({ cerrarOtros: () => { if (panelOpen()) closePanel(); cerrarCumple(false); } });

// ---------- Cosechar (la mecánica y animaciones son las mismas) ----------
$('harvest').addEventListener('click', () => {
  const m = selected;
  if (!m || m.harvested) return;
  const wp = m.mesh.getWorldPosition(new V3());
  cosechar(m, clock.elapsedTime);
  burst(wp, '#ffd98a', 70);
  rustle(wp);
  progreso.cosechados++;
  let nuevoSecreto = false;
  if (!secretos.completos() && progreso.cosechados >= (progreso.secretos + 1) * N) {
    m.secreto = progreso.secretos;   // este mango trajo el mensaje secreto
    progreso.secretos++;
    nuevoSecreto = true;
  }
  guardar();
  pintarProgreso();
  $('counter').classList.remove('pop'); void $('counter').offsetWidth; $('counter').classList.add('pop');
  pintarPanel(m);                    // revela el contenido
  if (nuevoSecreto) {
    burst(wp, '#f2a7c8', 90);
    toast('💌 ¡Encontraste un mensaje secreto!');
  } else {
    toast('🥭 ¡Cosechado! En un par de minutos crecerá otro 🌱');
  }
  flyTo(new V3(wp.x * 0.7, 1.2, wp.z * 0.7),
        new V3(wp.x * 0.7, 0, wp.z * 0.7).add(camera.position.clone().sub(controls.target).setY(0).normalize().multiplyScalar(7)).setY(3.2), 1.8);
});
// cuando el mango cosechado termina de desaparecer, el panel se queda abierto para seguir leyendo
function onGone(m) { if (selected === m) selected = null; }

// ---------- Animación ----------
const tmp = new V3();
let started = false;

// mientras está la pantalla de la clave, el escenario se prepara por detrás
// pero casi sin dibujar (así la animación de la clave va fluida)
let enClave = true, cuadroClave = 0;
(window.accesoKiara || Promise.resolve()).then(() => { enClave = false; });

renderer.setAnimationLoop(() => {
  if (enClave && started && (cuadroClave++ % 20) !== 0) return;
  const dt = Math.min(clock.getDelta(), 0.05);
  if (!enClave) ajustarCalidad(dt);
  const t = clock.elapsedTime;
  windU.value = t;

  if (!selected && !isFlying() && t - camState.lastInteract > 12) controls.autoRotate = true;
  updateCiclo(t);
  updateCamera(dt);
  updateSun();
  updateFaroles(t);

  updateArbol(dt, t, { hovered, selected, burst, onGone });
  updateCumple(dt, t);
  updateRecuerdos(dt, t);
  updateCorazon(dt, t);

  if (selected) {
    selected.mesh.getWorldPosition(tmp);
    halo.position.copy(tmp);
    halo.material.opacity += (0.75 - halo.material.opacity) * Math.min(1, dt * 4);
    halo.scale.setScalar(2.3 + Math.sin(t * 2.5) * 0.15);
  } else {
    halo.material.opacity += (0 - halo.material.opacity) * Math.min(1, dt * 4);
  }

  for (let i = 0; i < POLLEN; i++) {
    const b = i * 3;
    polPos[b] = polBase[b] + Math.sin(t * 0.4 + i) * 0.8;
    polPos[b + 1] = polBase[b + 1] + Math.sin(t * 0.7 + i * 1.7) * 0.5;
    polPos[b + 2] = polBase[b + 2] + Math.cos(t * 0.35 + i * 0.6) * 0.8;
  }
  polGeo.attributes.position.needsUpdate = true;
  polMat.color.copy(POL_DIA).lerp(POL_NOCHE, ambiente.noche);
  polMat.size = 0.11 + ambiente.noche * 0.14;
  polMat.opacity = 0.6 + ambiente.noche * 0.35 * (0.7 + 0.3 * Math.sin(t * 3));

  for (const f of fallers) {
    if (f.delay > 0) { f.delay -= dt; if (f.delay <= 0) f.mesh.visible = true; continue; }
    const p = f.mesh.position;
    if (!f.grounded) {
      p.y -= f.vy * dt;
      p.x += Math.sin(t * 1.7 + f.phase) * dt * 0.7;
      p.z += Math.cos(t * 1.3 + f.phase) * dt * 0.5;
      f.mesh.rotation.x += f.spin.x * dt; f.mesh.rotation.y += f.spin.y * dt; f.mesh.rotation.z += f.spin.z * dt;
      if (p.y < 0.05) { p.y = 0.05; f.grounded = 0.001; f.mesh.rotation.set(-Math.PI / 2, 0, Math.random() * 6); }
    } else {
      f.grounded += dt;
      if (f.grounded > 5) f.mesh.material.opacity -= dt * 0.5;
      if (f.mesh.material.opacity <= 0) resetFaller(f);
    }
  }

  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.life += dt;
    const arr = b.pts.geometry.attributes.position.array;
    b.v.forEach((v, j) => {
      v.y -= 1.6 * dt; v.multiplyScalar(0.97);
      arr[j * 3] += v.x * dt; arr[j * 3 + 1] += v.y * dt; arr[j * 3 + 2] += v.z * dt;
    });
    b.pts.geometry.attributes.position.needsUpdate = true;
    b.pts.material.opacity = 1 - b.life / 1.4;
    if (b.life > 1.4) { scene.remove(b.pts); b.pts.geometry.dispose(); b.pts.material.dispose(); bursts.splice(i, 1); }
  }

  updateEtiquetas();
  composer.render();
  if (!started) { started = true; document.body.classList.add('ready'); }
});
