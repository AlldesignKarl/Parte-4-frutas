// Decorados aparte: descalcificador (macro), sensor de turbidez (debajo del sumidero),
// cocina de noche con el frontal del lavavajillas, y cocina de día con fregadero y cubo de basura.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { rng, hash, clamp, texPCB, texAzulejo, texMadera, texMancha, canvas, tex } from './util.js';
import { matParticulas } from './agua.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

function nube(scene, n, map, color, opts) {
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(n * 3), alpha = new Float32Array(n), size = new Float32Array(n);
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
  geo.setAttribute('psize', new THREE.BufferAttribute(size, 1));
  const pts = new THREE.Points(geo, matParticulas(map, color, opts));
  pts.frustumCulled = false; pts.renderOrder = opts?.orden ?? 5;
  scene.add(pts);
  return {
    n, pos, alpha, size, pts,
    set(i, x, y, z, a, s) { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; alpha[i] = a; size[i] = s; },
    listo() { for (const k of ['position', 'alpha', 'psize']) geo.attributes[k].needsUpdate = true; },
  };
}

const vidrioMat = () => new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, transparent: true, opacity: 0.16, envMapIntensity: 3, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });

// =====================================================================
// Descalcificador
// =====================================================================
export function crearResina(scene, T, O = V(800, 0, 0)) {
  const g = new THREE.Group(); g.position.copy(O); scene.add(g);
  const r = rng(31);
  const cil = new THREE.Mesh(new THREE.CylinderGeometry(9, 9, 34, 48, 1, true), vidrioMat()); cil.renderOrder = 4; g.add(cil);
  const tapa = new THREE.Mesh(new THREE.CylinderGeometry(9.6, 9.6, 2, 48), new THREE.MeshStandardMaterial({ color: 0x5b636b, roughness: 0.4 })); tapa.position.y = 18; g.add(tapa);
  const base = tapa.clone(); base.position.y = -18; g.add(base);
  const entrada = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 30, 24), new THREE.MeshStandardMaterial({ color: 0x9aa3ab, roughness: 0.35 })); entrada.position.set(3, 33, 0); g.add(entrada);
  // bolitas de resina
  const n = 1500, pos = [];
  const bola = new THREE.InstancedMesh(new THREE.SphereGeometry(0.62, 14, 10), new THREE.MeshPhysicalMaterial({ color: 0xd88a22, roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05, emissive: 0x5a2a00, emissiveIntensity: 0.35, envMapIntensity: 1.4 }), n);
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    let x, z;
    do { x = (r() - 0.5) * 17; z = (r() * 1.15 - 0.15) * 8.4; } while (x * x + z * z > 8.2 * 8.2);
    const y = -16.5 + r() * 31;
    const s = 0.85 + r() * 0.35;
    m.compose(V(x, y, z), new THREE.Quaternion(), V(s, s, s)); bola.setMatrixAt(i, m);
    pos.push([x, y, z, s]);
  }
  g.add(bola);
  // cal (motas blancas) que se pegan a las bolitas
  const motas = nube(g, 600, T.punto, 0xffffff, { aditivo: false, orden: 7 });
  const flujo = nube(g, 500, T.punto, 0x9fdcff, { aditivo: true });
  // compartimento de sal
  const sal = new THREE.Group(); sal.position.set(15, -8, 3); g.add(sal);
  const salCaja = new THREE.Mesh(new THREE.BoxGeometry(9, 12, 9), vidrioMat()); salCaja.renderOrder = 4; sal.add(salCaja);
  const nc = 160;
  const cristales = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.25, transparent: true, opacity: 0.88, clearcoat: 1 }), nc);
  const cpos = [];
  for (let i = 0; i < nc; i++) cpos.push([(r() - 0.5) * 7.6, -5.5 + r() * 7, (r() - 0.5) * 7.6, 0.5 + r() * 0.9, r() * 3, r() * 3]);
  sal.add(cristales);
  // luces del decorado
  const luzA = new THREE.PointLight(0xffa040, 2500, 80, 2); luzA.position.set(0, 4, -18); g.add(luzA);
  const luzB = new THREE.SpotLight(0xd6ecff, 9000, 0, 0.6, 0.6, 2); luzB.position.set(-20, 30, 50); luzB.target = cil; g.add(luzB);
  const luzC = new THREE.PointLight(0x8fd0ff, 900, 60, 2); luzC.position.set(18, 10, 12); g.add(luzC);

  return {
    grupo: g, O,
    update(t) {
      for (let i = 0; i < motas.n; i++) {
        const b = pos[Math.floor(hash(i * 3.1) * n)];
        const t0 = hash(i * 1.7) * 6, dur = 1.6 + hash(i * 2.9);
        const k = clamp((t - t0) / dur);
        const sx = b[0] + (hash(i * 4.4) - 0.5) * 3, sy = 17, sz = b[2] + 1;
        const dir = V(hash(i * 5.1) - 0.5, hash(i * 6.2) - 0.5, hash(i * 7.3)).normalize().multiplyScalar(0.62 * b[3]);
        const tx = b[0] + dir.x, ty = b[1] + dir.y, tz = b[2] + dir.z;
        const e = 1 - Math.pow(1 - k, 3);
        motas.set(i, sx + (tx - sx) * e + Math.sin(t * 3 + i) * 0.2 * (1 - k), sy + (ty - sy) * e, sz + (tz - sz) * e, t > t0 ? 0.95 : 0, 0.22 + hash(i) * 0.12);
      }
      motas.listo();
      for (let i = 0; i < flujo.n; i++) {
        const L = 34, ph = hash(i * 2.2) * L;
        const y = 17 - ((t * 14 + ph) % L);
        flujo.set(i, (hash(i * 3.3) - 0.5) * 16, y, (hash(i * 4.4) - 0.1) * 8, 0.35, 0.18);
      }
      flujo.listo();
      cpos.forEach(([x, y, z, s, a, b], i) => {
        const k = Math.max(0.15, 1 - Math.max(0, t - 1) * 0.06 * (0.5 + hash(i)));
        m.compose(V(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(a, b, a * 0.5)), V(s * k, s * k, s * k));
        cristales.setMatrixAt(i, m);
      });
      cristales.instanceMatrix.needsUpdate = true;
    },
  };
}

// =====================================================================
// Sensor de turbidez (debajo del sumidero, al final del tubo)
// =====================================================================
export function crearSensor(scene, T, O = V(0, -50, -2)) {
  const g = new THREE.Group(); g.position.copy(O); scene.add(g);
  // cámara oscura
  const caja = new THREE.Mesh(new THREE.BoxGeometry(70, 28, 56), new THREE.MeshStandardMaterial({ color: 0x1a2027, roughness: 0.85, side: THREE.BackSide }));
  caja.position.set(0, 1, 6); g.add(caja);
  // placa
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(30, 20, 0.5), new THREE.MeshStandardMaterial({ map: texPCB(9), roughness: 0.5, metalness: 0.2 }));
  pcb.receiveShadow = false;
  pcb.position.set(0, 0, -5); g.add(pcb);
  // canal transparente
  const canal = new THREE.Mesh(new RoundedBoxGeometry(24, 5.6, 5, 3, 0.6), vidrioMat()); canal.material.opacity = 0.22; canal.renderOrder = 4; g.add(canal);
  const aguaMat = new THREE.MeshStandardMaterial({ color: 0x9fdcff, transparent: true, opacity: 0.1, roughness: 0.2, depthWrite: false });
  const agua = new THREE.Mesh(new THREE.BoxGeometry(23.4, 5, 4.4), aguaMat); agua.renderOrder = 3; g.add(agua);
  const plasO = new THREE.MeshStandardMaterial({ color: 0x3f474f, roughness: 0.45 });
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 8, 24), plasO); c.rotation.z = Math.PI / 2; c.position.set(s * 16, 0, 0); g.add(c); }
  // bomba
  const bomba = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 10, 40), new THREE.MeshStandardMaterial({ color: 0x59626b, roughness: 0.35, metalness: 0.3 }));
  bomba.rotation.x = Math.PI / 2; bomba.position.set(-27, 0, 0); g.add(bomba);
  // emisor (arriba) y receptor (abajo)
  const negro = new THREE.MeshStandardMaterial({ color: 0x14171a, roughness: 0.35 });
  const emisor = new THREE.Mesh(new RoundedBoxGeometry(4, 3, 4, 2, 0.4), negro); emisor.position.set(0, 4.4, 0); g.add(emisor);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.9, 20, 12), new THREE.MeshBasicMaterial({ color: 0xff3020 })); led.position.set(0, 2.85, 0); g.add(led);
  const receptor = new THREE.Mesh(new RoundedBoxGeometry(4, 3, 4, 2, 0.4), negro); receptor.position.set(0, -4.4, 0); g.add(receptor);
  const ojo = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 1.8), new THREE.MeshBasicMaterial({ color: 0x220000 })); ojo.position.set(0, -2.85, 0); g.add(ojo);
  const indicador = new THREE.Mesh(new THREE.SphereGeometry(0.5, 12, 8), new THREE.MeshBasicMaterial({ color: 0x30ff90 })); indicador.position.set(5, -6.5, -4.5); g.add(indicador);
  // haz
  const hazMat = new THREE.ShaderMaterial({
    uniforms: { turb: { value: 0 }, fuerza: { value: 1 }, halo: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv = uv; vN = normalize(normalMatrix*normal); vec4 mv = modelViewMatrix*vec4(position,1.0); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float turb; uniform float fuerza; uniform float halo; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float s = 1.0 - vUv.y; float k = exp(-s * turb * 6.5); float edge = pow(abs(dot(vN, vV)), mix(1.5, 0.6, halo));
        vec3 c = mix(vec3(1.0,0.25,0.15), vec3(1.0,0.8,0.75), edge*0.6);
        gl_FragColor = vec4(c * k * fuerza * edge * mix(1.1, 0.18, halo), 1.0);
        #include <colorspace_fragment>
      }`,
    transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const haz = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 5.2, 24, 1, true), hazMat); haz.renderOrder = 8; g.add(haz);
  const halo = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 5.2, 24, 1, true), hazMat.clone()); halo.material.uniforms.halo.value = 1; halo.renderOrder = 8; g.add(halo);
  const disp = nube(g, 6, T.niebla, 0xff5a3a, { aditivo: true, orden: 9 });
  const motas = nube(g, 420, T.punto, 0x6b4526, { aditivo: false, orden: 6 });
  const burb = nube(g, 120, T.punto, 0xffffff, { aditivo: true, orden: 6 });
  const luzRoja = new THREE.PointLight(0xff3020, 60, 30, 1.5); luzRoja.position.set(0, 1.5, 3); g.add(luzRoja);
  const clave = new THREE.PointLight(0x9cc8ff, 1800, 0, 2); clave.position.set(-14, 12, 26); g.add(clave);
  const contra = new THREE.PointLight(0x4f8cff, 700, 0, 2); contra.position.set(16, 8, -2); g.add(contra);
  return {
    grupo: g, O,
    update(t, turb, { brillo = 1 } = {}) {
      const tb = clamp(turb);
      aguaMat.color.setRGB(0.62 + (0.42 - 0.62) * tb, 0.86 + (0.28 - 0.86) * tb, 1.0 + (0.14 - 1.0) * tb);
      aguaMat.opacity = 0.08 + 0.8 * tb;
      hazMat.uniforms.turb.value = tb; halo.material.uniforms.turb.value = tb;
      hazMat.uniforms.fuerza.value = brillo * (1 - 0.45 * tb); halo.material.uniforms.fuerza.value = brillo * (0.6 - 0.25 * tb);
      const recibido = Math.exp(-tb * 6.5);
      ojo.material.color.setRGB(0.15 + 0.85 * recibido, 0.05 + 0.6 * recibido, 0.04 + 0.5 * recibido);
      indicador.material.color.setRGB(tb > 0.5 ? 1 : 0.2, tb > 0.5 ? 0.3 : 1, tb > 0.5 ? 0.2 : 0.55);
      luzRoja.intensity = 60 * brillo;
      for (let i = 0; i < disp.n; i++) disp.set(i, (hash(i) - 0.5) * 3, 1.6 - i * 0.25, 0, tb * 0.16 * brillo, 6 + i * 1.5);
      disp.listo();
      for (let i = 0; i < motas.n; i++) {
        const x = ((hash(i * 1.3) * 23 + t * (4 + hash(i * 2.2) * 3)) % 23) - 11.5;
        motas.set(i, x, (hash(i * 3.3) - 0.5) * 4.6, (hash(i * 4.4) - 0.5) * 4, tb * 0.9, 0.25 + hash(i * 5.5) * 0.35);
      }
      motas.listo();
      for (let i = 0; i < burb.n; i++) {
        const x = ((hash(i * 7.3) * 23 + t * 5) % 23) - 11.5;
        burb.set(i, x, (hash(i * 8.3) - 0.5) * 4.4 + Math.sin(t * 4 + i) * 0.1, (hash(i * 9.4) - 0.5) * 3.8, (1 - tb) * 0.45, 0.14 + hash(i) * 0.1);
      }
      burb.listo();
    },
  };
}

// =====================================================================
// Cocina de noche: frontal del lavavajillas con panel
// =====================================================================
export function crearFrontal(scene, T, O = V(2000, 0, 0)) {
  const g = new THREE.Group(); g.position.copy(O); scene.add(g);
  const acero = new THREE.MeshStandardMaterial({ color: 0xc9d0d6, metalness: 0.92, roughness: 0.28, roughnessMap: T.cepillado, bumpMap: T.cepillado, bumpScale: 0.12 });
  const blanco = new THREE.MeshStandardMaterial({ color: 0xe9e7e2, roughness: 0.55 });
  const box = (w, h, d, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); g.add(m); return m; };
  box(400, 1, 200, 0, -12.5, 20, new THREE.MeshStandardMaterial({ color: 0x3b3430, roughness: 0.6 }));
  const pared = box(400, 260, 1, 0, 100, -62, new THREE.MeshStandardMaterial({ map: texAzulejo(), roughness: 0.4 }));
  box(240, 4, 66, 0, 82, -27, new THREE.MeshStandardMaterial({ map: texMadera(11), roughness: 0.45 }));
  for (const s of [-1, 1]) {
    const c = box(89, 92, 60, s * 75, 34, -28, blanco);
    box(0.4, 80, 0.4, s * 75, 38, 2.2, new THREE.MeshStandardMaterial({ color: 0x9a9a9a }));
    box(18, 1.2, 1.6, s * 52, 74, 3, acero);
  }
  box(240, 70, 34, 0, 165, -45, blanco);
  // frontal del lavavajillas
  const puerta = new THREE.Group(); g.add(puerta);
  const hoja = new THREE.Mesh(new THREE.BoxGeometry(59.6, 70, 3), acero); hoja.position.set(0, 35, 1.5); puerta.add(hoja);
  const tira = new THREE.Mesh(new THREE.BoxGeometry(59.6, 9, 3.2), new THREE.MeshPhysicalMaterial({ color: 0x0b0d10, roughness: 0.12, clearcoat: 1, metalness: 0.2 }));
  tira.position.set(0, 74.5, 1.5); puerta.add(tira);
  const [cv, cx] = canvas(1024, 160);
  const dispTex = tex(cv, { srgb: true });
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(59, 9.2), new THREE.MeshBasicMaterial({ map: dispTex, transparent: true }));
  disp.position.set(0, 74.5, 3.15); puerta.add(disp);
  const asa = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 44, 20), acero); asa.rotation.z = Math.PI / 2; asa.position.set(0, 64, 6.5); puerta.add(asa);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 4, 12), acero); p.rotation.x = Math.PI / 2; p.position.set(s * 20, 64, 4.5); puerta.add(p); }
  box(59.6, 12, 2, 0, -6, -2, new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.6 }));
  const brillo = new THREE.Mesh(new THREE.PlaneGeometry(56, 70), new THREE.MeshBasicMaterial({ color: 0xffd2a0 })); brillo.position.set(0, 40, -3); g.add(brillo);
  const vapor = nube(g, 50, T.niebla, 0xf1f4f8, { aditivo: false, orden: 7 });
  // luces
  const bajo = new THREE.RectAreaLight(0xffc48a, 9, 200, 6); bajo.position.set(0, 128, -40); bajo.lookAt(0, 80, -20); g.add(bajo);
  const tiraLuz = box(200, 0.6, 2, 0, 129.5, -40, new THREE.MeshBasicMaterial({ color: 0xffc48a }));
  const glow = new THREE.PointLight(0xa8dcff, 160, 40, 1.5); glow.position.set(8, 76, 10); g.add(glow);
  const luna = new THREE.DirectionalLight(0x7f9cc8, 0.35); luna.position.set(-200, 200, 300); g.add(luna, luna.target); luna.target.position.copy(O);
  let ultimo = '';
  const iconos = ['olla', 'copa', 'hoja', 'rayo', 'auto'];
  function dibuja(texto, encendidos, foco) {
    const key = texto + '|' + encendidos + '|' + foco;
    if (key === ultimo) return; ultimo = key;
    cx.clearRect(0, 0, 1024, 160);
    cx.fillStyle = 'rgba(0,0,0,0)';
    // iconos de programas
    iconos.forEach((ic, i) => {
      const x = 90 + i * 110, y = 80, on = i < encendidos, f = i === foco;
      cx.strokeStyle = f ? '#ffffff' : on ? 'rgba(200,235,255,0.95)' : 'rgba(150,170,190,0.25)';
      cx.fillStyle = cx.strokeStyle; cx.lineWidth = 6; cx.lineCap = 'round'; cx.lineJoin = 'round';
      if (f || on) { cx.shadowColor = 'rgba(140,215,255,0.9)'; cx.shadowBlur = f ? 26 : 12; } else cx.shadowBlur = 0;
      cx.beginPath();
      if (ic === 'olla') { cx.rect(x - 28, y - 10, 56, 32); cx.moveTo(x - 38, y - 10); cx.lineTo(x + 38, y - 10); cx.moveTo(x - 12, y - 22); cx.lineTo(x + 12, y - 22); }
      if (ic === 'copa') { cx.moveTo(x - 20, y - 30); cx.lineTo(x + 20, y - 30); cx.quadraticCurveTo(x + 20, y + 2, x, y + 4); cx.quadraticCurveTo(x - 20, y + 2, x - 20, y - 30); cx.moveTo(x, y + 4); cx.lineTo(x, y + 26); cx.moveTo(x - 14, y + 28); cx.lineTo(x + 14, y + 28); }
      if (ic === 'hoja') { cx.moveTo(x - 26, y + 26); cx.quadraticCurveTo(x - 26, y - 30, x + 28, y - 30); cx.quadraticCurveTo(x + 28, y + 26, x - 26, y + 26); cx.moveTo(x - 26, y + 26); cx.lineTo(x + 10, y - 10); }
      if (ic === 'rayo') { cx.moveTo(x + 8, y - 34); cx.lineTo(x - 16, y + 4); cx.lineTo(x + 2, y + 4); cx.lineTo(x - 6, y + 34); cx.lineTo(x + 18, y - 6); cx.lineTo(x, y - 6); cx.closePath(); }
      if (ic === 'auto') { cx.arc(x, y, 30, 0, Math.PI * 2); cx.moveTo(x - 14, y + 16); cx.lineTo(x, y - 18); cx.lineTo(x + 14, y + 16); cx.moveTo(x - 8, y + 4); cx.lineTo(x + 8, y + 4); }
      cx.stroke();
    });
    cx.shadowBlur = 0;
    if (texto) {
      cx.font = '800 112px "Inter Display"'; cx.textAlign = 'right'; cx.textBaseline = 'middle';
      cx.shadowColor = 'rgba(120,210,255,0.95)'; cx.shadowBlur = 30; cx.fillStyle = '#eaf8ff';
      cx.fillText(texto, 990, 86);
      cx.shadowBlur = 0; cx.font = '700 30px "Inter"'; cx.fillStyle = 'rgba(160,220,255,0.85)'; cx.textAlign = 'left';
      cx.fillText('AUTO', 640, 50);
    }
    dispTex.needsUpdate = true;
  }
  return {
    grupo: g, O, puerta,
    update(t, { texto = '2:15', encendidos = 5, foco = -1, abre = 0, vaporD = 0 } = {}) {
      dibuja(texto, encendidos, foco);
      puerta.rotation.x = abre;
      brillo.visible = abre > 0.001;
      for (let i = 0; i < vapor.n; i++) {
        const L = 4, ph = hash(i * 2.1) * L, a = (t + ph) % L;
        vapor.set(i, (hash(i * 3.1) - 0.5) * 46 + Math.sin(t + i) * 3, 72 + a * 10, 6 + a * 7, vaporD * 0.45 * Math.sin(Math.PI * a / L), 12 + a * 6);
      }
      vapor.listo();
    },
  };
}

// =====================================================================
// Cocina de día: fregadero con grifo y cubo de basura
// =====================================================================
export function crearFregadero(scene, T, O = V(-2000, 0, 0)) {
  const g = new THREE.Group(); g.position.copy(O); scene.add(g);
  const acero = new THREE.MeshStandardMaterial({ color: 0xd0d6dc, metalness: 0.95, roughness: 0.22, roughnessMap: T.cepillado });
  const blanco = new THREE.MeshStandardMaterial({ color: 0xf1efea, roughness: 0.5 });
  const piedra = new THREE.MeshStandardMaterial({ color: 0xe8e6e1, roughness: 0.25 });
  const box = (w, h, d, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); g.add(m); return m; };
  box(400, 1, 300, 0, -0.5, 40, new THREE.MeshStandardMaterial({ map: texMadera(13), roughness: 0.5 }));
  box(400, 300, 1, 0, 150, -62, new THREE.MeshStandardMaterial({ map: texAzulejo(), roughness: 0.35 }));
  const ventana = box(90, 70, 0.5, 0, 140, -61, new THREE.MeshBasicMaterial({ color: 0xf4fbff }));
  box(4, 70, 3, 0, 140, -60, blanco); box(90, 4, 3, 0, 140, -60, blanco);
  box(200, 64, 60, 0, 32, -30, blanco); box(200, 22, 2, 0, 75, -1, blanco);
  // encimera con hueco
  box(200, 4, 22, 0, 88, -51, piedra); box(200, 4, 20, 0, 88, 10, piedra);
  box(75, 4, 40, -62.5, 88, -20, piedra); box(75, 4, 40, 62.5, 88, -20, piedra);
  const cubeta = new THREE.Mesh(new THREE.BoxGeometry(50, 22, 40), acero.clone()); cubeta.material.side = THREE.BackSide; cubeta.position.set(0, 79, -20); g.add(cubeta);
  // grifo
  const curva = new THREE.CatmullRomCurve3([V(0, 89, -38), V(0, 120, -38), V(0, 128, -31), V(0, 125, -21), V(0, 119, -18)]);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curva, 60, 1.4, 16), acero));
  const base = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 3, 4, 24), acero); base.position.set(0, 91, -38); g.add(base);
  const palanca = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.2, 9), acero); palanca.position.set(0, 106, -33); palanca.rotation.x = -0.5; g.add(palanca);
  // chorro del grifo
  const chorroMat = new THREE.ShaderMaterial({
    uniforms: { t: { value: 0 } },
    vertexShader: `varying vec2 vUv; varying vec3 vN; varying vec3 vV; void main(){ vUv=uv; vN=normalize(normalMatrix*normal); vec4 mv=modelViewMatrix*vec4(position,1.0); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float t; varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main(){ float f = 1.0 - abs(dot(vN, vV)); float bands = 0.75 + 0.25*sin(vUv.y*80.0 + t*40.0) * sin(vUv.x*25.0);
        float a = (0.12 + 0.75*pow(f, 1.6)) * bands; gl_FragColor = vec4(vec3(0.9,0.97,1.0)*(0.7+0.5*f), a);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false,
  });
  const chorro = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.9, 38, 20, 1, true), chorroMat); chorro.position.set(0, 99, -18); g.add(chorro);
  // plato bajo el grifo
  const platoGeo = new THREE.LatheGeometry([[0.01, 0.38], [6.5, 0.38], [8.6, 1.55], [11.3, 2.05], [11.5, 1.9], [8.6, 1.15], [6.5, 0], [0.01, 0]].map(([x, y]) => new THREE.Vector2(x, y)), 56);
  const porc = new THREE.MeshPhysicalMaterial({ color: 0xf3f1ec, roughness: 0.16, clearcoat: 0.9 });
  const plato = new THREE.Group(); plato.add(new THREE.Mesh(platoGeo, porc));
  const mancha = new THREE.Mesh(new THREE.CircleGeometry(8.5, 40), new THREE.MeshStandardMaterial({ map: texMancha('tomate', 41), transparent: true, depthWrite: false, roughness: 0.4 }));
  mancha.rotation.x = -Math.PI / 2; mancha.position.y = 0.46; plato.add(mancha);
  plato.position.set(0, 78, -18); plato.rotation.set(0.55, 0, 0.12); g.add(plato);
  const salp = nube(g, 500, T.punto, 0xeaf7ff, { aditivo: true });
  // cubo de basura (para «rasca los restos»)
  const cubo = new THREE.Group(); cubo.position.set(90, 0, 40); g.add(cubo);
  cubo.add(new THREE.Mesh(new THREE.CylinderGeometry(15, 14, 44, 48, 1, true), acero));
  const bolsa = new THREE.Mesh(new THREE.CylinderGeometry(14.4, 13.5, 43, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.7, side: THREE.BackSide })); cubo.add(bolsa);
  cubo.children.forEach(c => c.position.y = 22);
  const fondo = new THREE.Mesh(new THREE.CircleGeometry(13.6, 40), new THREE.MeshStandardMaterial({ color: 0x0e0f11 })); fondo.rotation.x = -Math.PI / 2; fondo.position.y = 6; cubo.add(fondo);
  const tapa = new THREE.Mesh(new THREE.CylinderGeometry(15.4, 15.4, 1, 48), acero); tapa.position.set(0, 52, -15); tapa.rotation.x = -1.35; cubo.add(tapa);
  const plato2 = new THREE.Group(); plato2.add(new THREE.Mesh(platoGeo, porc));
  const m2 = mancha.clone(); m2.material = new THREE.MeshStandardMaterial({ map: texMancha('arroz', 42), transparent: true, depthWrite: false }); plato2.add(m2);
  plato2.position.set(84, 66, 34); g.add(plato2);
  const tenedor = new THREE.Group();
  const mango = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.35, 15), acero); mango.position.z = 7; tenedor.add(mango);
  for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.3, 4), acero); d.position.set(-0.45 + i * 0.3, 0, -2); tenedor.add(d); }
  g.add(tenedor);
  // luz de día
  const sol = new THREE.DirectionalLight(0xfff1dc, 2.4); sol.position.set(-40, 220, -160); sol.target.position.set(0, 80, 0); g.add(sol, sol.target);
  const rel = new THREE.PointLight(0xffffff, 6000, 0, 2); rel.position.set(30, 160, 80); g.add(rel);
  return {
    grupo: g, O, cuboPos: V(90, 0, 40).add(O),
    update(t, { grifo = 1, inclina = 0 } = {}) {
      chorroMat.uniforms.t.value = t;
      chorro.visible = grifo > 0;
      const imp = V(0, 80.2, -18);
      for (let i = 0; i < salp.n; i++) {
        const L = 0.3, ph = hash(i * 1.9) * L, a = (t + ph) % L, cyc = Math.floor((t + ph) / L);
        const ang = hash(i * 2.7 + cyc) * 6.283, v = 30 + hash(i * 3.1 + cyc) * 70;
        salp.set(i, imp.x + Math.cos(ang) * v * a, imp.y + (25 + hash(i * 4.3 + cyc) * 50) * a - 490 * a * a, imp.z + Math.sin(ang) * v * a + 2, grifo * 0.6 * (1 - a / L), 0.22 + hash(i) * 0.2);
      }
      salp.listo();
      plato2.rotation.set(0.25 + inclina, 0, -0.35 - inclina * 0.6);
      tenedor.position.set(84 - 6 + Math.sin(t * 3) * 2 - t * 1.2, 68 + 1.5, 34 + 2 + Math.sin(t * 6) * 3);
      tenedor.rotation.set(0.6, 0.9 + Math.sin(t * 3) * 0.2, 0.2);
    },
  };
}
