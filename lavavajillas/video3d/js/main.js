// Motor: monta la escena y renderiza el instante t del vídeo (window.renderAt).
import * as THREE from 'three';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { crearLavavajillas, BRAZO_INF, BRAZO_SUP, SUMIDERO } from './modelo.js';
import { Chorros, Salpicaduras, Goteo, Vapor, GotasCerca, GotasPared, Burbujas, Restos } from './agua.js';
import { crearResina, crearSensor, crearFrontal, crearFregadero } from './rigs.js';
import { texPunto, texGota, texNiebla, texCepillado, clamp, lerp } from './util.js';
import { crearPlanos } from './planos.js';

const qs = new URLSearchParams(location.search);
const W = +(qs.get('w') || 576), H = +(qs.get('h') || 1024);

await document.fonts.load('800 112px "Inter Display"');
await document.fonts.load('700 30px "Inter"');
const TL = await (await fetch('timeline.json')).json();

RectAreaLightUniformsLib.init();
const renderer = new THREE.WebGLRenderer({ antialias: qs.get('aa') !== '0', preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.setClearColor(0x05080b);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, W / H, 0.3, 3000);
scene.add(camera);

// --- mapas de entorno ---
const pmrem = new THREE.PMREMGenerator(renderer);
function envInterior() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), new THREE.MeshBasicMaterial({ color: 0x0f1317, side: THREE.BackSide })));
  const panel = (w, h, p, r, color, k) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...p); m.rotation.set(...r); s.add(m);
  };
  panel(80, 5, [0, 49, 28], [Math.PI / 2, 0, 0], 0xf2f8ff, 12);
  panel(80, 2, [0, 49, -20], [Math.PI / 2, 0, 0], 0xe0eeff, 4);
  panel(12, 70, [-49, 0, 10], [0, Math.PI / 2, 0], 0xb8c8d8, 2.2);
  panel(12, 70, [49, 5, -10], [0, -Math.PI / 2, 0], 0xa8b8c8, 1.8);
  panel(70, 30, [0, -10, 49], [0, Math.PI, 0], 0x8a9aaa, 0.7);
  panel(60, 20, [0, -49, 0], [-Math.PI / 2, 0, 0], 0x1c2228, 1);
  return pmrem.fromScene(s, 0.035).texture;
}
const ENV = { interior: envInterior(), estudio: pmrem.fromScene(new RoomEnvironment(), 0.04).texture };

// --- texturas compartidas ---
const T = { punto: texPunto(), gota: texGota(), niebla: texNiebla(3), cepillado: texCepillado(5) };

// --- decorados ---
const M = crearLavavajillas(scene);
const resina = crearResina(scene, T);
const sensor = crearSensor(scene, T);
const frontal = crearFrontal(scene, T);
const fregadero = crearFregadero(scene, T);
const chorroInf = new Chorros(scene, BRAZO_INF, T.punto, { porTobera: 90, vida: 0.2, vel: 380, tam: 0.5 });
const chorroSup = new Chorros(scene, BRAZO_SUP, T.punto, { porTobera: 80, vida: 0.17, vel: 330, tam: 0.45 });
const salp = new Salpicaduras(scene, T.punto, 1400);
const goteo = new Goteo(scene, T.punto, 500);
const niebla = new Vapor(scene, T.niebla, 60, 0xb9d3ea);
const vapor = new Vapor(scene, T.niebla, 70, 0xf4f6f8);
const gotasCerca = new GotasCerca(scene, T.gota, 26);
const gotasPared = new GotasPared(scene);
const burbujas = new Burbujas(scene, T.punto, 420);
const restos = new Restos(scene, 90);
const arroz = new Restos(scene, 70, [0xf6f0e0, 0xefe6cf, 0xfffaf0], new THREE.SphereGeometry(1, 8, 6));

// lámina de agua sobre una copa (abrillantador)
const copaLamina = M.copas[5];
const laminaMat = new THREE.ShaderMaterial({
  uniforms: { f: { value: 0 }, k: { value: 0 } },
  vertexShader: `varying float vY; varying vec3 vN; varying vec3 vV; void main(){ vY = position.y; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
  fragmentShader: `uniform float f; uniform float k; varying float vY; varying vec3 vN; varying vec3 vV;
    void main(){ float fr = pow(1.0 - abs(dot(vN, vV)), 2.0); float mojado = 1.0 - smoothstep(f - 0.8, f + 0.3, vY);
      float frente = exp(-pow((vY - f) / 0.45, 2.0)); float a = (mojado * (0.01 + 0.05 * fr) + frente * 0.12) * k;
      gl_FragColor = vec4(vec3(0.85, 0.95, 1.0) * a, 1.0);
    }`,
  transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.FrontSide,
});
const lamina = new THREE.Mesh(copaLamina.geometry, laminaMat); lamina.scale.setScalar(1.025); lamina.renderOrder = 4; copaLamina.add(lamina);

const HUEVO = M.manchas.huevo.clone(); HUEVO.needsUpdate = true; HUEVO.center.set(0.5, 0.5); HUEVO.repeat.set(0.62, 0.62);
for (const p of M.platos) p.mapa = p.mat.map;
const ctx = { THREE, M, T, resina, sensor, frontal, fregadero, TL, SUMIDERO };
const PLANOS = crearPlanos(ctx);

// ---------------------------------------------------------------------------
// Integración del ángulo de los brazos (tabla por plano)
// ---------------------------------------------------------------------------
const tablas = new Map();
function tablaAngulo(key, w, desde, hasta) {
  if (tablas.has(key)) return tablas.get(key);
  const dt = 1 / 600, n = Math.ceil((hasta - desde) / dt) + 2;
  const th = new Float64Array(n);
  let a = desde < 0 ? w(0) * desde : 0;
  for (let i = 0; i < n; i++) { th[i] = a; const t = desde + i * dt; a += (t < 0 ? w(0) : w(t)) * dt; }
  const f = (t) => { const x = (t - desde) / dt; const i = clamp(Math.floor(x), 0, n - 2); const r = x - i; return th[i] * (1 - r) + th[i + 1] * r; };
  tablas.set(key, f);
  return f;
}

const DEF = () => ({
  ver: { lav: true, resina: false, sensor: false, frontal: false, fregadero: false },
  cam: { pos: [0, 30, 20], look: [0, 25, 0], fov: 70 },
  env: 'interior', envInt: 1, fondo: 0x05080b, fog: 0.005, fogColor: 0x0b1520,
  led: 1, warm: 0, ext: 0, puerta: 0, tinte: 0xdcecff,
  slow: 1, wL: () => 0, wU: () => 0, iL: () => 0, iU: () => 0, brillo: 1, estela: 0.011, colorAgua: 0xd8f3ff,
  salp: 1, goteo: 0, niebla: 0.25, vapor: 0, vaporCfg: {}, nieblaCfg: {},
  cocina: false, sucio: 1, disolver: null, aguaTurb: 0, aguaOpac: 0.35, sumNivel: -0.1, remolino: 0,
  olla: false, tapa: 0, pastilla: null, gotasPared: -1, gotasCerca: 0, burbujas: null, restos: null,
  turb: 0, frontal: {}, fregadero: {}, lamina: -1, exposicion: 1,
});

let actual = -1;
function planoEn(t) {
  for (let i = 0; i < TL.planos.length; i++) if (t < TL.planos[i].fin) return i;
  return TL.planos.length - 1;
}

const tmpCol = new THREE.Color();
const FOG = new THREE.FogExp2(0x0b1520, 0.005);
window.renderAt = (t) => {
  const i = planoEn(t), P = TL.planos[i], lt = t - P.ini, L = P.fin - P.ini;
  const S = Object.assign(DEF(), PLANOS[i].estado(lt, L, P));
  if (i !== actual) { actual = i; }

  // visibilidad de decorados
  M.raiz.visible = S.ver.lav; resina.grupo.visible = S.ver.resina; sensor.grupo.visible = S.ver.sensor;
  frontal.grupo.visible = S.ver.frontal; fregadero.grupo.visible = S.ver.fregadero;
  const interior = S.ver.lav;
  for (const o of [chorroInf.gotas.pts, chorroInf.lineas, chorroSup.gotas.pts, chorroSup.lineas, salp.nube.pts, goteo.nube.pts, goteo.estelas.mesh, niebla.nube.pts, vapor.nube.pts, gotasPared.mesh]) o.visible = interior;
  gotasCerca.nube.pts.visible = S.gotasCerca > 0;
  burbujas.nube.pts.visible = !!S.burbujas;
  restos.mesh.visible = !!S.restos && S.restos.modo !== 'saltan';
  arroz.mesh.visible = !!S.restos && S.restos.modo === 'saltan';

  // cámara
  camera.fov = S.cam.fov; camera.updateProjectionMatrix();
  camera.position.set(...S.cam.pos);
  const dir = new THREE.Vector3(...S.cam.look).sub(camera.position).normalize();
  camera.up.set(0, 1, 0);
  if (Math.abs(dir.y) > 0.97) camera.up.set(0, 0, -1);
  camera.lookAt(...S.cam.look);
  if (S.cam.roll) camera.rotateZ(S.cam.roll);
  camera.updateMatrixWorld();
  const pxPorCm = H / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
  for (const m of [chorroInf.gotas.mat, chorroSup.gotas.mat, salp.nube.mat, goteo.nube.mat, niebla.nube.mat, vapor.nube.mat, gotasCerca.nube.mat, burbujas.nube.mat]) m.uniforms.uScale.value = pxPorCm;
  for (const r of [resina, sensor, frontal, fregadero]) r.grupo.traverse(o => { if (o.isPoints) o.material.uniforms.uScale.value = pxPorCm; });
  for (const e of [chorroInf.estelas, chorroSup.estelas, goteo.estelas]) { e.mat.uniforms.uScale.value = pxPorCm; e.mat.uniforms.uRes.value.set(W, H); }

  // entorno, niebla, exposición
  scene.environment = ENV[S.env]; scene.environmentIntensity = S.envInt;
  renderer.setClearColor(S.fondo);
  scene.fog = S.fog > 0 ? FOG : null; FOG.color.set(S.fogColor); FOG.density = S.fog;
  renderer.toneMappingExposure = S.exposicion;

  // luces del interior
  const Lz = M.luces;
  Lz.led.visible = false; Lz.ledMesh.material.color.setScalar(Math.max(0.02, S.led) * 2.2);
  tmpCol.set(S.tinte);
  Lz.relleno.color.copy(tmpCol); Lz.relleno.intensity = 0.28 * S.led;
  Lz.relleno2.visible = false;
  Lz.foco.color.copy(tmpCol).lerp(new THREE.Color(0xffffff), 0.6); Lz.foco.intensity = 7 * S.led; Lz.relleno.intensity = 0.36 * S.led;
  Lz.calor.intensity = 1.6 * S.warm; Lz.calor.visible = S.warm > 0.001;
  Lz.exterior.intensity = 6 * S.ext; Lz.exterior.visible = S.ext > 0.001; Lz.cielo.material.color.setRGB(1.0 * S.ext + 0.02, 0.86 * S.ext + 0.02, 0.69 * S.ext + 0.02);
  M.puerta.rotation.x = S.puerta * Math.PI / 2;
  M.cocina.visible = !!S.cocina; Lz.cielo.visible = !S.cocina;
  Lz.extra.intensity = S.extra ? S.extra.int : 0; Lz.extra.visible = !!S.extra; if (S.extra) Lz.extra.position.set(...S.extra.pos);

  // brazos y chorros (tiempo de simulación)
  const ts = lt * S.slow;
  const angL = tablaAngulo(i + 'L', S.wL, -0.6, L * S.slow + 0.1), angU = tablaAngulo(i + 'U', S.wU, -0.6, L * S.slow + 0.1);
  M.brazoInf.rotation.y = angL(ts); M.brazoSup.rotation.y = angU(ts);
  if (interior) {
    chorroInf.update(ts, angL, S.iL, { brillo: S.brillo, estela: S.estela, color: S.colorAgua, techo: 63 });
    chorroSup.update(ts, angU, S.iU, { brillo: S.brillo, estela: S.estela, color: S.colorAgua, techo: 63 });
    const zonas = [{ x: -10, y: 20, z: -1, dx: 1, dy: 20, dz: 38, nx: 1 }, { x: 10, y: 20, z: -1, dx: 1, dy: 20, dz: 38, nx: -1 },
      { x: -14, y: 39, z: 0, dx: 8, dy: 2, dz: 40, nx: 0.3 }, { x: 13, y: 39, z: 0, dx: 8, dy: 2, dz: 40, nx: -0.3 }];
    const iS = (b) => S.salp * Math.max(S.iL(b), S.iU(b) * 0.7);
    salp.update(ts, iS, { zonas, brillo: S.brillo });
    goteo.update(lt, S.goteo);
    niebla.update(lt, S.niebla, Object.assign({ sube: 1.5, tam: 40, alfa: 0.13, deriva: 5 }, S.nieblaCfg));
    vapor.update(lt, S.vapor, Object.assign({ sube: 7, tam: 30, alfa: 0.2 }, S.vaporCfg));
    gotasPared.mesh.visible = S.gotasPared >= 0;
    if (S.gotasPared >= 0) gotasPared.update(lt, S.gotasPared);
  }
  if (S.gotasCerca > 0) gotasCerca.update(lt, camera, S.gotasCerca);
  if (S.burbujas) burbujas.update(lt, S.burbujas.dens, S.burbujas);
  if (S.restos) {
    const R = S.restos;
    if (R.modo === 'remolino') restos.remolino(lt, R);
    if (R.modo === 'saltan') arroz.saltan(ts, R);
    if (R.modo === 'caen') restos.caen(lt, R);
  }

  // agua del suelo y sumidero
  const A = M.agua;
  A.ondas.offset.set(lt * 0.03, lt * 0.02); A.ondas2.rotation = -lt * S.remolino;
  tmpCol.setRGB(lerp(0.75, 0.55, S.aguaTurb), lerp(0.9, 0.42, S.aguaTurb), lerp(1.0, 0.25, S.aguaTurb));
  A.mat.color.copy(tmpCol); A.matSum.color.copy(tmpCol);
  A.mat.opacity = S.aguaOpac * (1 + S.aguaTurb); A.matSum.opacity = Math.min(0.92, 0.45 + S.aguaTurb * 0.5);
  A.suelo.visible = S.aguaOpac > 0.005;
  A.sum.position.y = S.sumNivel;

  // vajilla
  for (const p of M.platos) { p.mat.opacity = S.sucio; p.mat.alphaTest = 0.02; p.g.visible = true; }
  if (S.disolver) { const p = M.platos[S.disolver.idx]; p.mat.map = HUEVO; p.mat.alphaTest = S.disolver.v; p.mat.opacity = 1; }
  else { /* restaura la mancha original */ for (const p of M.platos) if (p.mat.map === HUEVO) p.mat.map = p.mapa; }
  M.olla.visible = M.sarten.visible = S.olla;
  M.cuenco.visible = !S.olla;
  M.cuencoMat.opacity = S.sucio;
  M.quemadoMat.opacity = S.sucio;
  M.tapa.rotation.x = -S.tapa;
  M.pastilla.visible = true;
  if (S.pastilla) { const q = S.pastilla; M.pastilla.position.set(6 + q.dx, 40 + q.dy, -1.4 - q.dz); M.pastilla.rotation.set(q.r, q.r * 0.6, q.r * 0.3); }
  else { M.pastilla.position.set(6, 40, -1.4); M.pastilla.rotation.set(0, 0, 0); }
  lamina.visible = S.lamina >= 0; laminaMat.uniforms.f.value = Math.max(0, S.lamina); laminaMat.uniforms.k.value = 1;

  // decorados
  if (S.ver.resina) resina.update(lt);
  if (S.ver.sensor) sensor.update(lt, S.turb, S.sensorCfg || {});
  if (S.ver.frontal) frontal.update(lt, S.frontal);
  if (S.ver.fregadero) fregadero.update(lt, S.fregadero);

  renderer.render(scene, camera);
  return i;
};
window.TL = TL;
window.dbg = { renderer, scene, camera, M };
window.listo = true;
