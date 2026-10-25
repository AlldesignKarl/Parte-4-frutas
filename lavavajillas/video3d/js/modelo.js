// El lavavajillas por dentro (unidades: centímetros).
// Cuba x∈[-28,28], y∈[0,64], z∈[-26,26]; la puerta está en z=+26 con bisagra abajo.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng, texCepillado, texNervios, texMancha, texRuido, texOndas, texRejilla } from './util.js';

export const CUBA = { w: 56, h: 64, d: 52, x0: -28, x1: 28, z0: -26, z1: 26 };
export const SUMIDERO = { x: 0, z: -2, r: 9 };
export const BRAZO_INF = { x: 0, y: 5.5, z: -2, largo: 24 };
export const BRAZO_SUP = { x: 0, y: 34.2, z: -2, largo: 20 };

const V = (x, y, z) => new THREE.Vector3(x, y, z);

export function crearLavavajillas(scene) {
  const M = {};
  const raiz = new THREE.Group();
  scene.add(raiz);
  M.raiz = raiz;

  // ---------------- materiales ----------------
  const cep = texCepillado(1), nerv = texNervios(2);
  const acero = new THREE.MeshStandardMaterial({ color: 0xbcc4cc, metalness: 0.78, roughness: 0.32, roughnessMap: cep, bumpMap: cep, bumpScale: 0.15 });
  const aceroPared = new THREE.MeshStandardMaterial({ color: 0xb9c1c9, metalness: 0.72, roughness: 0.34, roughnessMap: cep, bumpMap: nerv, bumpScale: 0.9 });
  const plastico = new THREE.MeshStandardMaterial({ color: 0xb7bfc7, roughness: 0.34, metalness: 0.05 });
  const plasticoOsc = new THREE.MeshStandardMaterial({ color: 0x4b535b, roughness: 0.5, metalness: 0.05 });
  const brazoMat = new THREE.MeshStandardMaterial({ color: 0x8a939c, roughness: 0.38, metalness: 0.05 });
  M.mat = { acero, aceroPared, plastico, plasticoOsc, brazoMat };

  // ---------------- cuba ----------------
  const pared = (w, h, pos, rot, mat = aceroPared) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.copy(pos); m.rotation.set(...rot); m.receiveShadow = true; raiz.add(m); return m;
  };
  pared(52, 64, V(-28, 32, 0), [0, Math.PI / 2, 0]);
  pared(52, 64, V(28, 32, 0), [0, -Math.PI / 2, 0]);
  pared(56, 64, V(0, 32, -26), [0, 0, 0]);
  pared(56, 52, V(0, 64, 0), [Math.PI / 2, 0, 0], acero);
  // suelo con hueco del sumidero
  const forma = new THREE.Shape();
  forma.moveTo(-28, -26); forma.lineTo(28, -26); forma.lineTo(28, 26); forma.lineTo(-28, 26); forma.lineTo(-28, -26);
  const hueco = new THREE.Path(); hueco.absarc(SUMIDERO.x, -SUMIDERO.z, SUMIDERO.r, 0, Math.PI * 2, true);
  forma.holes.push(hueco);
  const suelo = new THREE.Mesh(new THREE.ShapeGeometry(forma, 48), acero);
  suelo.rotation.x = -Math.PI / 2; suelo.receiveShadow = true; raiz.add(suelo);
  // marco frontal (junta)
  const marco = (w, h, d, x, y, z) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), acero); m.position.set(x, y, z); raiz.add(m); };
  marco(60, 3, 3, 0, 65.5, 27); marco(3, 68, 3, -29.5, 32, 27); marco(3, 68, 3, 29.5, 32, 27);
  // carriles de las cestas
  for (const s of [-1, 1]) {
    for (const y of [8.5, 37]) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.6, 48), plastico); r.position.set(s * 27.3, y, -1); raiz.add(r);
    }
  }

  // ---------------- sumidero, filtro y tubo hacia el sensor ----------------
  const sumPared = new THREE.Mesh(new THREE.CylinderGeometry(SUMIDERO.r, SUMIDERO.r * 0.92, 6, 48, 1, true), acero);
  sumPared.material = acero.clone(); sumPared.material.side = THREE.BackSide;
  sumPared.position.set(SUMIDERO.x, -3, SUMIDERO.z); raiz.add(sumPared);
  const sumFondo = new THREE.Mesh(new THREE.RingGeometry(3.6, SUMIDERO.r, 48), plasticoOsc);
  sumFondo.rotation.x = -Math.PI / 2; sumFondo.position.set(SUMIDERO.x, -6, SUMIDERO.z); raiz.add(sumFondo);
  const rejilla = texRejilla(36, 0.45);
  const filtroMat = new THREE.MeshStandardMaterial({ color: 0xd5dbe0, metalness: 0.9, roughness: 0.3, alphaMap: rejilla, alphaTest: 0.5, side: THREE.DoubleSide });
  const filtro = new THREE.Mesh(new THREE.CylinderGeometry(4.4, 4.4, 8, 40, 1, true), filtroMat);
  filtro.position.set(SUMIDERO.x, -2, SUMIDERO.z); raiz.add(filtro);
  const asa = new THREE.Mesh(new THREE.TorusGeometry(4.4, 0.45, 8, 40), plastico);
  asa.rotation.x = Math.PI / 2; asa.position.set(SUMIDERO.x, 2, SUMIDERO.z); raiz.add(asa);
  const asaB = new THREE.Mesh(new THREE.BoxGeometry(8.8, 1, 1), plastico); asaB.position.set(SUMIDERO.x, 2.3, SUMIDERO.z); raiz.add(asaB);
  const micro = rejilla.clone(); micro.repeat.set(10, 10); micro.needsUpdate = true;
  const microMat = new THREE.MeshStandardMaterial({ color: 0xcfd6dc, metalness: 0.9, roughness: 0.35, alphaMap: micro, alphaTest: 0.5, side: THREE.DoubleSide });
  const microF = new THREE.Mesh(new THREE.RingGeometry(4.4, SUMIDERO.r, 48), microMat);
  microF.rotation.x = -Math.PI / 2; microF.position.set(SUMIDERO.x, -0.4, SUMIDERO.z); raiz.add(microF);
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(3.6, 3.6, 32, 32, 1, true), plasticoOsc.clone());
  tubo.material.side = THREE.BackSide; tubo.position.set(SUMIDERO.x, -22, SUMIDERO.z); raiz.add(tubo);
  M.filtro = filtro;

  // ---------------- agua del suelo y del sumidero ----------------
  const ondas = texOndas(5);
  M.texOndas = ondas;
  const aguaMat = new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.35, normalMap: ondas, normalScale: new THREE.Vector2(0.5, 0.5), envMapIntensity: 1.6, depthWrite: false });
  const aguaSuelo = new THREE.Mesh(new THREE.ShapeGeometry(forma, 48), aguaMat);
  aguaSuelo.rotation.x = -Math.PI / 2; aguaSuelo.position.y = 0.35; aguaSuelo.renderOrder = 2; raiz.add(aguaSuelo);
  const ondas2 = texOndas(15); ondas2.center.set(0.5, 0.5); ondas2.repeat.set(1, 1);
  const aguaSumMat = aguaMat.clone(); aguaSumMat.normalMap = ondas2; aguaSumMat.opacity = 0.5;
  const aguaSum = new THREE.Mesh(new THREE.CircleGeometry(SUMIDERO.r - 0.1, 48), aguaSumMat);
  aguaSum.rotation.x = -Math.PI / 2; aguaSum.position.set(SUMIDERO.x, -0.1, SUMIDERO.z); aguaSum.renderOrder = 2; raiz.add(aguaSum);
  M.agua = { suelo: aguaSuelo, sum: aguaSum, mat: aguaMat, matSum: aguaSumMat, ondas, ondas2 };

  // ---------------- cestas ----------------
  const cil = new THREE.CylinderGeometry(1, 1, 1, 8, 1);
  const alambres = [];
  const alambre = (a, b, r = 0.28) => alambres.push([a.clone(), b.clone(), r]);
  const rect = (y, x0, x1, z0, z1, r) => {
    alambre(V(x0, y, z0), V(x1, y, z0), r); alambre(V(x1, y, z0), V(x1, y, z1), r);
    alambre(V(x1, y, z1), V(x0, y, z1), r); alambre(V(x0, y, z1), V(x0, y, z0), r);
  };
  const cesta = (y0, alto, filasPuas, altoPua) => {
    const x0 = -25.5, x1 = 25.5, z0 = -23.5, z1 = 22.5;
    rect(y0, x0, x1, z0, z1, 0.32); rect(y0 + alto, x0, x1, z0, z1, 0.32);
    for (let z = z0 + 4; z < z1; z += 4.2) alambre(V(x0, y0, z), V(x1, y0, z), 0.16);
    for (let x = x0 + 4.2; x < x1; x += 4.6) alambre(V(x, y0, z0), V(x, y0, z1), 0.16);
    for (let z = z0; z <= z1 + 0.1; z += (z1 - z0) / 6) { alambre(V(x0, y0, z), V(x0, y0 + alto, z), 0.2); alambre(V(x1, y0, z), V(x1, y0 + alto, z), 0.2); }
    for (let x = x0; x <= x1 + 0.1; x += (x1 - x0) / 6) { alambre(V(x, y0, z0), V(x, y0 + alto, z0), 0.2); if (Math.abs(x) > 25) alambre(V(x, y0, z1), V(x, y0 + alto, z1), 0.2); }
    for (const [xf, incl] of filasPuas) {
      for (let z = z0 + 2.2; z < z1 - 1; z += 3.4) alambre(V(xf, y0, z), V(xf + incl, y0 + altoPua, z), 0.17);
    }
    // ruedas
    for (const s of [-1, 1]) for (const z of [-17, 15]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 1.2, 20), plasticoOsc);
      w.rotation.z = Math.PI / 2; w.position.set(s * 26.6, y0 - 0.2, z); raiz.add(w);
    }
  };
  cesta(9, 12, [[-17.5, 0.6], [-6.5, -0.6], [6.5, 0.6], [17.5, -0.6]], 11);
  cesta(37.5, 10, [[-19.5, 0], [-8.5, 0], [8.5, 0], [19.5, 0]], 5);
  const inst = new THREE.InstancedMesh(cil, plastico, alambres.length);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = V(0, 1, 0);
  alambres.forEach(([a, b, r], i) => {
    const d = b.clone().sub(a), len = d.length();
    q.setFromUnitVectors(up, d.normalize());
    m4.compose(a.clone().add(b).multiplyScalar(0.5), q, V(r, len, r));
    inst.setMatrixAt(i, m4);
  });
  inst.castShadow = true; inst.receiveShadow = true;
  raiz.add(inst);

  // ---------------- platos ----------------
  const R = 11.5;
  const perfil = [[0.01, 0.38], [6.5, 0.38], [8.6, 1.55], [11.3, 2.05], [R, 1.9], [8.6, 1.15], [6.5, 0], [0.01, 0]].map(([x, y]) => new THREE.Vector2(x, y));
  const platoGeo = new THREE.LatheGeometry(perfil, 56);
  const caraGeo = new THREE.LatheGeometry([[0.01, 0.45], [6.5, 0.45], [8.6, 1.62], [11.0, 2.06]].map(([x, y]) => new THREE.Vector2(x, y)), 56);
  { // UV planas para la mancha
    const p = caraGeo.attributes.position, uv = caraGeo.attributes.uv;
    for (let i = 0; i < p.count; i++) uv.setXY(i, p.getX(i) / (2 * R) + 0.5, p.getZ(i) / (2 * R) + 0.5);
    uv.needsUpdate = true;
  }
  const porcelana = new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.12, metalness: 0, envMapIntensity: 1.3 });
  const ruido = texRuido(4, 256, 10);
  const manchas = { huevo: texMancha('huevo', 21), tomate: texMancha('tomate', 22), arroz: texMancha('arroz', 23), migas: texMancha('migas', 24), quemado: texMancha('quemado', 25) };
  M.manchas = manchas; M.ruido = ruido;
  const r = rng(77);
  M.platos = [];
  const tipos = { '-1': ['migas', 'arroz', 'tomate', 'migas', 'tomate', 'huevo'], '1': ['migas', 'tomate', 'migas', 'arroz', 'huevo', 'tomate'] };
  const geoPeq = platoGeo.clone(); geoPeq.scale(0.84, 1, 0.84);
  const caraPeq = caraGeo.clone(); caraPeq.scale(0.84, 1, 0.84);
  for (const lado of [-1, 1]) {
    let k = 0;
    const Rl = lado < 0 ? R : R * 0.84;
    for (let z = -19; z <= 2.1; z += 4.2) {
      const g = new THREE.Group();
      const plato = new THREE.Mesh(lado < 0 ? platoGeo : geoPeq, porcelana);
      plato.castShadow = true; plato.receiveShadow = true;
      g.add(plato);
      const tipo = tipos[lado][k++];
      const mat = new THREE.MeshStandardMaterial({ map: manchas[tipo], transparent: true, roughness: 0.5, alphaMap: ruido, alphaTest: 0.02, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, side: THREE.DoubleSide });
      mat.map = manchas[tipo].clone(); mat.map.needsUpdate = true;
      mat.map.center.set(0.5, 0.5); mat.map.rotation = r() * 6.28;
      const cara = new THREE.Mesh(lado < 0 ? caraGeo : caraPeq, mat);
      cara.renderOrder = 1;
      g.add(cara);
      g.rotation.x = Math.PI / 2 - 0.13;
      g.position.set(lado * (lado < 0 ? 12 : 12.5), 9.6 + Rl, z);
      raiz.add(g);
      M.platos.push({ g, cara, mat, tipo, lado, z });
    }
  }
  // cuenco con arroz delante a la derecha
  const cuencoGeo = new THREE.LatheGeometry([[0.01, 0], [3.5, 0], [3.7, 0.5], [7.2, 5.5], [7.6, 6.6], [7.35, 6.7], [6.9, 5.6], [3.4, 0.9], [0.01, 0.85]].map(([x, y]) => new THREE.Vector2(x, y)), 48);
  const cuenco = new THREE.Group();
  const cm = new THREE.Mesh(cuencoGeo, porcelana); cm.castShadow = true; cuenco.add(cm);
  const arrozC = new THREE.Mesh(new THREE.CircleGeometry(5.6, 40), new THREE.MeshStandardMaterial({ map: manchas.arroz, transparent: true, roughness: 0.6, depthWrite: false }));
  arrozC.rotation.x = -Math.PI / 2; arrozC.position.y = 2.9; arrozC.scale.set(1, 1, 1); cuenco.add(arrozC);
  cuenco.rotation.set(1.05, -0.35, 0); cuenco.position.set(13, 17, 11);
  raiz.add(cuenco);
  M.cuenco = cuenco; M.cuencoMat = arrozC.material;

  // ---------------- copas y tazas (cesta de arriba) ----------------
  const copaPerfil = [[0.01, 0], [3.4, 0], [3.5, 0.25], [0.6, 0.6], [0.35, 1.5], [0.35, 6.5], [1.5, 7.6], [3.3, 9.5], [4.0, 12.5], [3.9, 15.5], [3.6, 18], [3.45, 18], [3.75, 15.5], [3.85, 12.5], [3.15, 9.6], [1.4, 7.9], [0.01, 7.8]].map(([x, y]) => new THREE.Vector2(x, y));
  const copaGeo = new THREE.LatheGeometry(copaPerfil, 40);
  const vidrio = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.03, metalness: 0.1, transparent: true, opacity: 0.13, envMapIntensity: 0.75, side: THREE.DoubleSide, depthWrite: false });
  M.vidrio = vidrio;
  M.copas = [];
  for (let z = -20; z <= 9; z += 5.6) {
    const c = new THREE.Mesh(copaGeo, vidrio);
    c.rotation.x = Math.PI; c.rotation.z = 0.06;
    c.position.set(-14, 37.5 + 18, z); c.renderOrder = 3;
    raiz.add(c); M.copas.push(c);
  }
  // pintalabios en una copa
  const labio = new THREE.Mesh(new THREE.TorusGeometry(3.55, 0.22, 6, 24, 0.9), new THREE.MeshStandardMaterial({ color: 0xb0122a, roughness: 0.5 }));
  labio.rotation.x = Math.PI / 2; labio.position.y = 17.9; M.copas[5].add(labio);
  const tazaPerfil = [[0.01, 0], [3.9, 0], [4.15, 0.3], [4.2, 9.4], [3.95, 9.6], [3.7, 9.4], [3.65, 0.8], [0.01, 0.75]].map(([x, y]) => new THREE.Vector2(x, y));
  const tazaGeo = new THREE.LatheGeometry(tazaPerfil, 40);
  const tazaMat = new THREE.MeshStandardMaterial({ color: 0x1d3c74, roughness: 0.15 });
  const asaGeo = new THREE.TorusGeometry(2.4, 0.55, 10, 24, Math.PI);
  M.tazas = [];
  for (let z = -19; z <= 10; z += 9.5) {
    const t = new THREE.Group();
    const tm = new THREE.Mesh(tazaGeo, tazaMat); tm.castShadow = true; t.add(tm);
    const a = new THREE.Mesh(asaGeo, tazaMat); a.rotation.z = -Math.PI / 2; a.position.set(4.1, 4.8, 0); t.add(a);
    t.rotation.x = Math.PI; t.rotation.z = 0.35;
    t.position.set(13, 37.5 + 9.8, z);
    raiz.add(t); M.tazas.push(t);
  }

  // ---------------- olla y sartén (programa Intensivo) ----------------
  const olla = new THREE.Group();
  const ollaGeo = new THREE.LatheGeometry([[0.01, 0], [9, 0], [9.4, 0.6], [9.4, 13], [9.9, 13.2], [9.9, 13.6], [9.1, 13.4], [9.0, 0.7], [0.01, 0.6]].map(([x, y]) => new THREE.Vector2(x, y)), 48);
  const aceroOlla = new THREE.MeshStandardMaterial({ color: 0xe6eaee, metalness: 0.85, roughness: 0.25, side: THREE.DoubleSide, envMapIntensity: 1.6 });
  olla.add(new THREE.Mesh(ollaGeo, aceroOlla));
  const quem = new THREE.Mesh(new THREE.CircleGeometry(8.9, 40), new THREE.MeshStandardMaterial({ map: manchas.quemado, transparent: true, roughness: 0.8, depthWrite: false }));
  quem.rotation.x = -Math.PI / 2; quem.position.y = 0.75; olla.add(quem);
  M.quemadoMat = quem.material;
  olla.rotation.set(1.05, 0.25, 0); olla.position.set(10, 16.5, 7); olla.scale.setScalar(0.85);
  const sarten = new THREE.Group();
  sarten.add(new THREE.Mesh(new THREE.LatheGeometry([[0.01, 0], [10, 0], [11.5, 3.5], [11.2, 3.6], [9.7, 0.4], [0.01, 0.4]].map(([x, y]) => new THREE.Vector2(x, y)), 48), new THREE.MeshStandardMaterial({ color: 0x3a3d42, metalness: 0.5, roughness: 0.3, side: THREE.DoubleSide })));
  const grasa = new THREE.Mesh(new THREE.CircleGeometry(9.6, 40), new THREE.MeshStandardMaterial({ map: manchas.quemado, transparent: true, roughness: 0.3, depthWrite: false }));
  grasa.rotation.x = -Math.PI / 2; grasa.position.y = 0.45; sarten.add(grasa);
  const mango = new THREE.Mesh(new THREE.BoxGeometry(16, 1.2, 2.4), plasticoOsc); mango.position.set(19, 3.2, 0); sarten.add(mango);
  sarten.rotation.set(1.15, 0, -0.15); sarten.position.set(-12, 15, 8); sarten.scale.setScalar(0.8);
  olla.visible = sarten.visible = false;
  raiz.add(olla, sarten);
  M.olla = olla; M.sarten = sarten;

  // ---------------- brazos aspersores ----------------
  const brazoGeo = (L) => {
    const s = new THREE.Shape();
    s.moveTo(-L, -1.5); s.lineTo(-6, -2.6); s.lineTo(6, -2.6); s.lineTo(L, -1.5);
    s.absarc(L, 0, 1.5, -Math.PI / 2, Math.PI / 2, false);
    s.lineTo(6, 2.6); s.lineTo(-6, 2.6); s.lineTo(-L, 1.5);
    s.absarc(-L, 0, 1.5, Math.PI / 2, Math.PI * 1.5, false);
    const g = new THREE.ExtrudeGeometry(s, { depth: 1.5, bevelEnabled: true, bevelThickness: 0.45, bevelSize: 0.45, bevelSegments: 3, curveSegments: 16 });
    g.rotateX(-Math.PI / 2); g.translate(0, -0.75, 0);
    return g;
  };
  const toberaMat = new THREE.MeshBasicMaterial({ color: 0x1a1d20 });
  const crearBrazo = (cfg) => {
    const g = new THREE.Group();
    const cuerpo = new THREE.Mesh(brazoGeo(cfg.largo), brazoMat); cuerpo.castShadow = true; cuerpo.receiveShadow = true; g.add(cuerpo);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(3, 3.3, 3, 28), brazoMat); hub.position.y = -0.6; g.add(hub);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.8, 20), plasticoOsc); cap.position.y = 1.2; g.add(cap);
    const tob = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.32, 0.32, 0.3, 10), toberaMat, cfg.toberas.length);
    cfg.toberas.forEach((tb, i) => { m4.makeTranslation(tb.p[0], 1.25, tb.p[2]); tob.setMatrixAt(i, m4); });
    g.add(tob);
    g.position.set(cfg.x, cfg.y, cfg.z);
    raiz.add(g);
    return g;
  };
  const toberas = (L, n, inclinacion) => {
    const out = [];
    for (let i = 0; i < n; i++) {
      const rr = 5 + (i / (n - 1)) * (L - 6.5);
      for (const s of [-1, 1]) {
        const w = (i % 2 ? 0.9 : -0.9);
        out.push({ p: [s * rr, 1.2, w], d: [s * 0.08 * (i % 3 - 1), 1, s * inclinacion] });
      }
    }
    return out;
  };
  BRAZO_INF.toberas = toberas(BRAZO_INF.largo, 6, 0.32);
  BRAZO_SUP.toberas = toberas(BRAZO_SUP.largo, 5, 0.3);
  M.brazoInf = crearBrazo(BRAZO_INF);
  M.brazoSup = crearBrazo(BRAZO_SUP);
  // tubo que sube por detrás hasta el brazo de arriba
  const tub = (a, b, rad) => { const d = b.clone().sub(a); const m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad, d.length(), 20), plastico); m.position.copy(a.clone().add(b).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(up, d.normalize()); raiz.add(m); };
  tub(V(0, 2, -24.5), V(0, 33, -24.5), 1.6);
  tub(V(0, 33, -24.5), V(0, 33, -2), 1.4);

  // ---------------- puerta (bisagra abajo) con cajetín ----------------
  const puerta = new THREE.Group();
  puerta.position.set(0, 0, 26.5);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(56, 64), acero);
  panel.rotation.y = Math.PI; panel.position.y = 32; puerta.add(panel);
  const trasera = new THREE.Mesh(new THREE.BoxGeometry(60, 66, 3), new THREE.MeshStandardMaterial({ color: 0xaab2ba, metalness: 0.8, roughness: 0.33, roughnessMap: cep }));
  trasera.position.set(0, 33, 1.6); puerta.add(trasera);
  // cajetín
  const caj = new THREE.Group(); caj.position.set(6, 40, -0.2); puerta.add(caj);
  const marcoC = new THREE.Mesh(new THREE.BoxGeometry(16, 11, 1.2), plastico); marcoC.position.z = -0.3; caj.add(marcoC);
  const hueco2 = new THREE.Mesh(new THREE.BoxGeometry(13, 8.5, 0.6), plasticoOsc); hueco2.position.z = -0.65; caj.add(hueco2);
  const bisagra = new THREE.Group(); bisagra.position.set(0, -4.4, -1.0); caj.add(bisagra);
  const tapa = new THREE.Mesh(new RoundedBoxGeometry(13.2, 8.8, 0.8, 2, 0.3), plastico); tapa.position.set(0, 4.4, -0.2); bisagra.add(tapa);
  const pastilla = new THREE.Group();
  const p1 = new THREE.Mesh(new RoundedBoxGeometry(4.4, 3.0, 1.2, 2, 0.3), new THREE.MeshStandardMaterial({ color: 0xf2f4f6, roughness: 0.75 }));
  const p2 = new THREE.Mesh(new RoundedBoxGeometry(4.4, 3.0, 0.7, 2, 0.25), new THREE.MeshStandardMaterial({ color: 0x2f7fe0, roughness: 0.6 }));
  p1.position.z = 0.25; p2.position.z = -0.6; pastilla.add(p1, p2);
  pastilla.position.set(6, 40, -1.4); puerta.add(pastilla);
  // abrillantador (tapón redondo)
  const tap2 = new THREE.Mesh(new THREE.CylinderGeometry(3, 3, 1.2, 32), plastico); tap2.rotation.x = Math.PI / 2; tap2.position.set(-9, 40, -0.6); puerta.add(tap2);
  const tap3 = new THREE.Mesh(new THREE.CylinderGeometry(1.8, 1.8, 0.6, 24), new THREE.MeshStandardMaterial({ color: 0x2d6fd0, roughness: 0.4 })); tap3.rotation.x = Math.PI / 2; tap3.position.set(-9, 40, -1.3); puerta.add(tap3);
  raiz.add(puerta);
  M.puerta = puerta; M.tapa = bisagra; M.pastilla = pastilla;

  // ---------------- luces ----------------
  const ledMesh = new THREE.Mesh(new THREE.BoxGeometry(46, 0.5, 0.8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
  ledMesh.position.set(0, 63.4, 24.2); raiz.add(ledMesh);
  const led = new THREE.RectAreaLight(0xe9f5ff, 6, 46, 2.5);
  led.position.set(0, 63, 24); led.lookAt(0, 10, -8); raiz.add(led);
  const relleno = new THREE.PointLight(0xc4e2ff, 1, 0, 0); relleno.position.set(0, 46, 6); raiz.add(relleno);
  const relleno2 = new THREE.PointLight(0x9fc8ee, 1, 0, 0); relleno2.position.set(0, 12, 18); raiz.add(relleno2);
  const calor = new THREE.PointLight(0xff8a3c, 0, 0, 0); calor.position.set(0, 8, 0); raiz.add(calor);
  const exterior = new THREE.SpotLight(0xffd2a0, 0, 0, 0.7, 0.6, 0); exterior.position.set(0, 50, 140); exterior.target.position.set(0, 18, -10); raiz.add(exterior, exterior.target);
  const cielo = new THREE.Mesh(new THREE.PlaneGeometry(400, 260), new THREE.MeshBasicMaterial({ color: 0xffd9b0, fog: false }));
  cielo.position.set(0, 40, 170); cielo.rotation.y = Math.PI; raiz.add(cielo);
  const foco = new THREE.SpotLight(0xf4f9ff, 1, 0, 0.95, 0.75, 0);
  foco.position.set(0, 62.5, 23); foco.target.position.set(0, 14, -6);
  foco.castShadow = true; foco.shadow.mapSize.set(1024, 1024); foco.shadow.camera.near = 5; foco.shadow.camera.far = 140; foco.shadow.bias = -0.0004; foco.shadow.normalBias = 0.08; foco.shadow.radius = 3;
  raiz.add(foco, foco.target);
  const extra = new THREE.PointLight(0xf2f7ff, 0, 0, 2); raiz.add(extra);
  // muebles de cocina alrededor (solo para el plano final, visto desde fuera)
  const cocina = new THREE.Group();
  const blancoC = new THREE.MeshStandardMaterial({ color: 0xece9e3, roughness: 0.5 });
  const maderaC = new THREE.MeshStandardMaterial({ color: 0xb58a5c, roughness: 0.45 });
  const caja = (w, h, d, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); cocina.add(m); };
  caja(70, 76, 60, -65.5, 32, -2, blancoC); caja(70, 76, 60, 65.5, 32, -2, blancoC);
  caja(210, 4, 64, 0, 72, 0, maderaC);
  caja(64, 6, 60, 0, 67, -2, blancoC);
  caja(0.5, 70, 1, -65.5, 34, 28.2, new THREE.MeshStandardMaterial({ color: 0x9a9a9a }));
  caja(0.5, 70, 1, 65.5, 34, 28.2, new THREE.MeshStandardMaterial({ color: 0x9a9a9a }));
  caja(400, 1, 300, 0, -4.5, 60, new THREE.MeshStandardMaterial({ color: 0x6b5a4a, roughness: 0.6 }));
  caja(400, 200, 1, 0, 100, -40, new THREE.MeshStandardMaterial({ color: 0xd7d2c9, roughness: 0.8 }));
  cocina.visible = false; raiz.add(cocina);
  M.cocina = cocina;
  M.luces = { ledMesh, led, relleno, relleno2, calor, exterior, cielo, foco, extra };
  return M;
}
