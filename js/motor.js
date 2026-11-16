// =====================================================================
// motor.js — render, escena, cámara, luces, niebla, viento y vuelos de cámara
// =====================================================================
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { canvasTex, clamp01, easeInOut, V3 } from './utils.js';

// ---------- Niebla que se espesa hacia afuera, desde donde termina el pasto ----------
// Se suma a la niebla normal: a partir de NIEBLA.desde (donde se acaba el pasto) todo se
// va cubriendo de bruma hasta desaparecer por completo en NIEBLA.hasta (sin horizonte).
export const NIEBLA = { centroX: 0, centroZ: 24, desde: 64, hasta: 100 };   // empieza donde se acaba el pasto
THREE.ShaderChunk.fog_pars_vertex = `
#ifdef USE_FOG
  varying float vFogDepth;
  varying vec3 vFogWorld;
#endif`;
THREE.ShaderChunk.fog_vertex = `
#ifdef USE_FOG
  vFogDepth = - mvPosition.z;
  vFogWorld = ( mvPosition.xyz - viewMatrix[ 3 ].xyz ) * mat3( viewMatrix );
#endif`;
THREE.ShaderChunk.fog_pars_fragment = `
#ifdef USE_FOG
  uniform vec3 fogColor;
  varying float vFogDepth;
  varying vec3 vFogWorld;
  #ifdef FOG_EXP2
    uniform float fogDensity;
  #else
    uniform float fogNear;
    uniform float fogFar;
  #endif
#endif`;
THREE.ShaderChunk.fog_fragment = `
#ifdef USE_FOG
  #ifdef FOG_EXP2
    float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
  #else
    float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
  #endif
  float fogR = length( vFogWorld.xz - vec2( ${NIEBLA.centroX.toFixed(1)}, ${NIEBLA.centroZ.toFixed(1)} ) );
  float fogRad = smoothstep( ${NIEBLA.desde.toFixed(1)}, ${NIEBLA.hasta.toFixed(1)}, fogR );
  fogRad = fogRad * ( 2.0 - fogRad );
  fogFactor = 1.0 - ( 1.0 - fogFactor ) * ( 1.0 - fogRad );
  gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`;

// Celular / tablet: bajamos un poco la calidad para que vaya fluido
export const MOBILE = matchMedia('(pointer: coarse)').matches || innerWidth < 760;

export const renderer = new THREE.WebGLRenderer({ antialias: true });
const PR_MAX = Math.min(devicePixelRatio, MOBILE ? 1.5 : 1.75);   // nitidez máxima
let pr = PR_MAX;
renderer.setPixelRatio(pr);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

export const scene = new THREE.Scene();
export const MIST = new THREE.Color('#e3ebdf');
scene.fog = new THREE.FogExp2(MIST, 0.0042);

export const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 2000);
camera.position.set(0, 40, 85);

export const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 4, 18);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.minDistance = 2.5;
controls.maxDistance = 85;
controls.maxPolarAngle = Math.PI * 0.92;   // permite bajar y mirar la copa desde abajo
controls.autoRotateSpeed = 0.35;
controls.enablePan = true;                  // clic derecho / dos dedos: moverse por el mundo
controls.screenSpacePanning = false;        // el paneo se desliza sobre el suelo
controls.panSpeed = 0.9;

// cielo: degradado + sol/luna + estrellas (los colores los cambia ciclo.js según la hora)
export const skyUniforms = {
  top: { value: new THREE.Color('#c9dbe6') },
  horizon: { value: MIST },
  sunDir: { value: new V3(0.4, 0.8, 0.33).normalize() },
  sunCol: { value: new THREE.Color('#fff1d8') },
  sunAmt: { value: 0 },
  stars: { value: 0 },
  uTime: { value: 0 },
};
scene.add(new THREE.Mesh(
  new THREE.SphereGeometry(1200, 32, 16),
  new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: skyUniforms,
    vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: `uniform vec3 top, horizon, sunDir, sunCol; uniform float sunAmt, stars, uTime; varying vec3 vDir;
      float h(vec3 p){ return fract(sin(dot(p, vec3(12.9898, 78.233, 37.719))) * 43758.5453); }
      void main(){
        vec3 d = normalize(vDir);
        vec3 col = mix(horizon, top, smoothstep(0.05, 0.9, d.y));
        float s = max(dot(d, normalize(sunDir)), 0.0);
        col += sunCol * (pow(s, 6.0) * 0.35 + pow(s, 60.0) * 0.4) * sunAmt;   // resplandor
        col += sunCol * smoothstep(0.9993, 0.9996, s) * 1.6 * sunAmt;           // disco del sol / luna
        vec3 cell = floor(d * 260.0);
        float st = step(0.9965, h(cell));
        float tw = 0.6 + 0.4 * sin(uTime * (1.0 + h(cell + 1.0) * 3.0) + h(cell + 2.0) * 40.0);
        col += vec3(0.9, 0.93, 1.0) * st * tw * stars * smoothstep(0.02, 0.25, d.y);
        gl_FragColor = vec4(col, 1.0);
      }`,
  })
));

// ---------- Luz ----------
export const hemi = new THREE.HemisphereLight('#f4f8ff', '#7a9a45', 1.3);
scene.add(hemi);
export const sun = new THREE.DirectionalLight('#fff1d8', 3.0);
export const SUN_OFFSET = new V3(24, 48, 20);   // dirección del sol (ciclo.js la mueve según la hora)
sun.position.copy(SUN_OFFSET);
sun.castShadow = true;
sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -24, right: 24, top: 24, bottom: -24, near: 1, far: 140 });
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.035;
scene.add(sun);
scene.add(sun.target);
// la zona de sombras sigue a donde estás mirando (así hay sombras en todo el mundo)
export function updateSun() {
  const t = controls.target;
  sun.target.position.set(Math.round(t.x), 0, Math.round(t.z));
  sun.position.copy(sun.target.position).add(SUN_OFFSET);
}

// ---------- Viento (shader compartido por pasto y hojas) ----------
export const windU = { value: 0 };
function windChunk(amp, factor) {
  return `
    #ifdef USE_INSTANCING
      vec3 ip = (modelMatrix * instanceMatrix[3]).xyz;
    #else
      vec3 ip = modelMatrix[3].xyz;
    #endif
    float k = ${factor};
    float w = sin(uTime * 1.6 + ip.x * 0.7 + ip.z * 0.5) * 0.6 + sin(uTime * 3.1 + ip.y * 1.7 + ip.x) * 0.25;
    transformed.x += w * ${amp.toFixed(4)} * k;
    transformed.z += cos(uTime * 1.2 + ip.z * 0.8) * ${(amp * 0.6).toFixed(4)} * k;`;
}
export function addWind(mat, amp, factor, extraFrag) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = windU;
    sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\n' + windChunk(amp, factor));
    if (extraFrag) extraFrag(sh);
  };
}

export const glowTex = canvasTex(64, 64, (g) => {
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,240,190,0.7)');
  gr.addColorStop(1, 'rgba(255,210,130,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
});

// ---------- Post-procesado (brillo suave) ----------
export const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
export const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22, 0.5, 0.93);
composer.addPass(bloom);
composer.addPass(new OutputPass());

composer.setPixelRatio(pr);

export const clock = new THREE.Clock();

// ---------- Calidad adaptativa ----------
// Mide los FPS reales; si la laptop va lenta, baja la resolución interna poco a poco
// (casi no se nota a la vista y el movimiento se siente mucho más fluido).
const medida = { t: 0, n: 0, espera: 2.5 };
export function ajustarCalidad(dt) {
  if (document.hidden) return;
  if (medida.espera > 0) { medida.espera -= dt; return; }    // deja que todo cargue primero
  medida.t += dt; medida.n++;
  if (medida.t < 2.5) return;
  const fps = medida.n / medida.t;
  medida.t = 0; medida.n = 0;
  if (fps < 40 && pr > 1) {
    pr = Math.max(1, pr - 0.25);
    renderer.setPixelRatio(pr); composer.setPixelRatio(pr);
    renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
    medida.espera = 1.5;
  }
}

// ---------- Vuelos de cámara suaves ----------
let tween = null;
export const camState = { lastInteract: -10 };
export function flyTo(target, pos, dur = 1.5) {
  tween = { t: 0, dur, fT: controls.target.clone(), tT: target.clone(), fP: camera.position.clone(), tP: pos.clone() };
}
export const isFlying = () => tween !== null;
controls.addEventListener('start', () => { tween = null; controls.autoRotate = false; camState.lastInteract = clock.elapsedTime; });

// límites para que no te pierdas en la niebla
const BOUNDS = { minX: -62, maxX: 62, minZ: -40, maxZ: 88, minY: 0.5, maxY: 16 };
export function updateCamera(dt) {
  if (tween) {
    tween.t += dt / tween.dur;
    const k = easeInOut(clamp01(tween.t));
    controls.target.lerpVectors(tween.fT, tween.tT, k);
    camera.position.lerpVectors(tween.fP, tween.tP, k);
    if (tween.t >= 1) tween = null;
  }
  controls.update();
  // mantener el punto de mira dentro del mundo (mueve cámara y objetivo juntos)
  const t = controls.target;
  const cx = Math.min(BOUNDS.maxX, Math.max(BOUNDS.minX, t.x)) - t.x;
  const cz = Math.min(BOUNDS.maxZ, Math.max(BOUNDS.minZ, t.z)) - t.z;
  const cy = Math.min(BOUNDS.maxY, Math.max(BOUNDS.minY, t.y)) - t.y;
  if (cx || cy || cz) { t.x += cx; t.y += cy; t.z += cz; camera.position.x += cx; camera.position.y += cy; camera.position.z += cz; }
  if (camera.position.y < 0.7) camera.position.y = 0.7;   // la cámara nunca atraviesa el pasto
}

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.setSize(innerWidth, innerHeight);
});
