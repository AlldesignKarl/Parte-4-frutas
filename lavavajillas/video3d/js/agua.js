// Agua: chorros de los brazos, salpicaduras, goteo, niebla, vapor, gotas en la pared, burbujas y restos.
// Todo es analítico en función del tiempo para que cada fotograma se pueda renderizar por separado.
import * as THREE from 'three';
import { hash, clamp, smooth } from './util.js';

const G = -980; // cm/s²

// Material de partículas con tamaño en cm y alfa por partícula
export function matParticulas(map, color, { aditivo = true, escala = 1 } = {}) {
  return new THREE.ShaderMaterial({
    uniforms: { map: { value: map }, color: { value: new THREE.Color(color) }, uScale: { value: escala } },
    vertexShader: `
      attribute float alpha; attribute float psize; varying float vA;
      uniform float uScale;
      void main(){ vA = alpha; vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = clamp(psize * uScale / -mv.z, 0.0, 512.0); if (alpha <= 0.001) gl_PointSize = 0.0;
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `
      uniform sampler2D map; uniform vec3 color; varying float vA;
      void main(){ vec4 c = texture2D(map, gl_PointCoord); float a = c.a * vA; if (a < 0.003) discard;
        gl_FragColor = vec4(color * c.rgb, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false,
    blending: aditivo ? THREE.AdditiveBlending : THREE.NormalBlending,
  });
}

class Nube {
  constructor(scene, n, map, color, opts = {}) {
    this.n = n;
    this.geo = new THREE.BufferGeometry();
    this.pos = new Float32Array(n * 3); this.alpha = new Float32Array(n); this.size = new Float32Array(n);
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    this.geo.setAttribute('alpha', new THREE.BufferAttribute(this.alpha, 1));
    this.geo.setAttribute('psize', new THREE.BufferAttribute(this.size, 1));
    this.mat = matParticulas(map, color, opts);
    this.pts = new THREE.Points(this.geo, this.mat);
    this.pts.frustumCulled = false;
    this.pts.renderOrder = opts.orden ?? 5;
    scene.add(this.pts);
  }
  set(i, x, y, z, a, s) { this.pos[i * 3] = x; this.pos[i * 3 + 1] = y; this.pos[i * 3 + 2] = z; this.alpha[i] = a; this.size[i] = s; }
  listo() { for (const k of ['position', 'alpha', 'psize']) this.geo.attributes[k].needsUpdate = true; }
  ocultar() { this.alpha.fill(0); this.listo(); }
}


// Estelas: cada partícula se dibuja como un trazo con grosor (de la cabeza a la cola), orientado a cámara
export class Estelas {
  constructor(scene, n, { ancho = 0.12, color = 0xd8f3ff } = {}) {
    this.n = n;
    const geo = new THREE.BufferGeometry();
    this.h = new Float32Array(n * 12); this.t = new Float32Array(n * 12); this.a = new Float32Array(n * 4);
    const se = new Float32Array(n * 8), idx = new Uint32Array(n * 6);
    for (let i = 0; i < n; i++) {
      se.set([0, -1, 0, 1, 1, -1, 1, 1], i * 8);
      idx.set([0, 1, 2, 2, 1, 3].map(k => k + i * 4), i * 6);
    }
    geo.setAttribute('position', new THREE.BufferAttribute(this.h, 3));
    geo.setAttribute('aTail', new THREE.BufferAttribute(this.t, 3));
    geo.setAttribute('aSE', new THREE.BufferAttribute(se, 2));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(this.a, 1));
    geo.setIndex(new THREE.BufferAttribute(idx, 1));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uAncho: { value: ancho }, uScale: { value: 1000 }, uRes: { value: new THREE.Vector2(810, 1440) }, color: { value: new THREE.Color(color) } },
      vertexShader: `
        attribute vec3 aTail; attribute vec2 aSE; attribute float aAlpha;
        uniform float uAncho; uniform float uScale; uniform vec2 uRes;
        varying float vA; varying vec2 vSE;
        void main(){
          vec4 h = projectionMatrix * viewMatrix * vec4(position, 1.0);
          vec4 t = projectionMatrix * viewMatrix * vec4(aTail, 1.0);
          vA = aAlpha; vSE = aSE;
          if (aAlpha <= 0.001 || h.w < 0.5 || t.w < 0.5) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
          vec2 d = (h.xy / h.w - t.xy / t.w) * uRes;
          float len = length(d);
          vec2 dir = len > 0.001 ? d / len : vec2(0.0, 1.0);
          vec2 nrm = vec2(-dir.y, dir.x);
          vec4 p = mix(h, t, aSE.x);
          float wpx = max(uAncho * uScale / p.w, 1.3);
          p.xy += nrm * aSE.y * (wpx / uRes) * p.w;
          p.xy += dir * (aSE.x < 0.5 ? 1.0 : -1.0) * (wpx * 0.5 / uRes) * p.w;
          vA *= min(1.0, 1.3 / wpx * 1.6 + 0.35);
          gl_Position = p;
        }`,
      fragmentShader: `
        uniform vec3 color; varying float vA; varying vec2 vSE;
        void main(){ float a = vA * pow(1.0 - vSE.x, 1.4) * (1.0 - vSE.y * vSE.y);
          gl_FragColor = vec4(color * a, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = 5;
    this.geo = geo;
    scene.add(this.mesh);
  }
  set(i, hx, hy, hz, tx, ty, tz, a) {
    for (let k = 0; k < 4; k++) {
      const j = (i * 4 + k) * 3;
      this.h[j] = hx; this.h[j + 1] = hy; this.h[j + 2] = hz; this.t[j] = tx; this.t[j + 1] = ty; this.t[j + 2] = tz;
      this.a[i * 4 + k] = a;
    }
  }
  listo() { for (const k of ['position', 'aTail', 'aAlpha']) this.geo.attributes[k].needsUpdate = true; }
  ocultar() { this.a.fill(0); this.listo(); }
}

// Chorros de un brazo aspersor (gotas + estelas)
export class Chorros {
  constructor(scene, brazo, texPunto, { porTobera = 90, vida = 0.2, vel = 390, tam = 0.5 } = {}) {
    this.b = brazo; this.vida = vida; this.vel = vel; this.tam = tam;
    this.nt = brazo.toberas.length; this.slots = porTobera;
    this.n = this.nt * porTobera;
    this.gotas = new Nube(scene, this.n, texPunto, 0xd8f3ff);
    this.estelas = new Estelas(scene, this.n, { ancho: 0.13, color: 0xcfeeff });
    this.lineas = this.estelas.mesh;
    // direcciones con algo de dispersión, fijas por partícula
    this.dir = new Float32Array(this.n * 3); this.vj = new Float32Array(this.n); this.fase = new Float32Array(this.n);
    for (let i = 0; i < this.n; i++) {
      const tb = brazo.toberas[i % this.nt];
      let dx = tb.d[0] + (hash(i * 1.7) - 0.5) * 0.09, dy = tb.d[1], dz = tb.d[2] + (hash(i * 2.3) - 0.5) * 0.09;
      const l = Math.hypot(dx, dy, dz); this.dir.set([dx / l, dy / l, dz / l], i * 3);
      this.vj[i] = 0.86 + hash(i * 3.1) * 0.24;
      this.fase[i] = (Math.floor(i / this.nt) + hash(i * 5.9)) / porTobera;
    }
  }
  // ts: tiempo de simulación; ang(ts) ángulo del brazo; inten(ts) intensidad; techo: y máxima
  update(ts, ang, inten, { brillo = 1, techo = 63.5, estela = 0.011, color = null } = {}) {
    const { x: cx, y: cy, z: cz } = this.b;
    const L = this.vida, tbs = this.b.toberas;
    if (color) this.gotas.mat.uniforms.color.value.set(color);
    for (let i = 0; i < this.n; i++) {
      const a = ((ts + this.fase[i] * L) % L + L) % L;
      const birth = ts - a;
      const I = inten(birth);
      let alpha = 0;
      const tb = tbs[i % this.nt];
      const th = ang(birth), c = Math.cos(th), s = Math.sin(th);
      // posición de la tobera y dirección en mundo (rotación y: x' = x c + z s, z' = -x s + z c)
      const px = cx + tb.p[0] * c + tb.p[2] * s, py = cy + tb.p[1], pz = cz - tb.p[0] * s + tb.p[2] * c;
      const d0 = this.dir[i * 3], d1 = this.dir[i * 3 + 1], d2 = this.dir[i * 3 + 2];
      const v = this.vel * this.vj[i] * (0.75 + 0.25 * clamp(I));
      const vx = (d0 * c + d2 * s) * v, vy = d1 * v, vz = (-d0 * s + d2 * c) * v;
      const at = (t) => [px + vx * t, py + vy * t + 0.5 * G * t * t, pz + vz * t];
      const p = at(a), q = at(Math.max(0, a - estela));
      if (I > 0.01 && p[1] < techo && p[1] > 0) alpha = clamp(I) * smooth(a / (L * 0.06)) * (1 - smooth((a / L - 0.7) / 0.3)) * brillo;
      this.gotas.set(i, p[0], p[1], p[2], alpha * 0.9, this.tam * (0.8 + 0.5 * hash(i)));
      this.estelas.set(i, p[0], p[1], p[2], q[0], q[1], q[2], alpha * 0.85);
    }
    this.gotas.listo(); this.estelas.listo();
  }
  ocultar() { this.gotas.ocultar(); this.estelas.ocultar(); }
}

// Salpicaduras al chocar con la vajilla
export class Salpicaduras {
  constructor(scene, texPunto, n = 1400) { this.n = n; this.nube = new Nube(scene, n, texPunto, 0xe6f7ff); this.vida = 0.28; }
  update(ts, inten, { zonas, brillo = 1 }) {
    const L = this.vida;
    for (let i = 0; i < this.n; i++) {
      const fase = hash(i * 7.7) * L;
      const ciclo = Math.floor((ts + fase) / L), a = ts + fase - ciclo * L, b = ts - a;
      const h = (k) => hash(i * 13.1 + ciclo * 7.3 + k);
      const zona = zonas[Math.floor(h(1) * zonas.length) % zonas.length];
      const x0 = zona.x + (h(2) - 0.5) * zona.dx, y0 = zona.y + (h(3) - 0.5) * zona.dy, z0 = zona.z + (h(4) - 0.5) * zona.dz;
      const vx = zona.nx * (60 + 160 * h(5)) + (h(6) - 0.5) * 80, vy = 40 + 140 * h(7), vz = (h(8) - 0.5) * 140;
      const I = inten(b);
      const x = x0 + vx * a, y = y0 + vy * a + 0.5 * G * a * a, z = z0 + vz * a;
      const alpha = I > 0.01 ? clamp(I) * (1 - a / L) * 0.8 * brillo : 0;
      this.nube.set(i, x, y, z, alpha, 0.28 + 0.3 * h(9));
    }
    this.nube.listo();
  }
  ocultar() { this.nube.ocultar(); }
}

// Goteo desde las cestas
export class Goteo {
  constructor(scene, texPunto, n = 500) { this.n = n; this.nube = new Nube(scene, n, texPunto, 0xd6f0ff); this.estelas = new Estelas(scene, n, { ancho: 0.12, color: 0xb8dcf0 }); }
  update(ts, nivel) {
    for (let i = 0; i < this.n; i++) {
      const y0 = hash(i * 3.3) < 0.6 ? 9 + hash(i) * 14 : 37 + hash(i * 2) * 4;
      const L = Math.sqrt(2 * y0 / -G) + 0.02;
      const fase = hash(i * 9.1) * L;
      const ciclo = Math.floor((ts + fase) / L), a = ts + fase - ciclo * L;
      const x = (hash(i * 4.4 + ciclo) - 0.5) * 50, z = (hash(i * 6.6 + ciclo) - 0.5) * 46;
      const y = y0 + 0.5 * G * a * a, al = y > 0.3 ? nivel * 0.55 : 0;
      this.nube.set(i, x, y, z, al, 0.32);
      this.estelas.set(i, x, y, z, x, y0 + 0.5 * G * Math.max(0, a - 0.012) ** 2, z, al * 0.6);
    }
    this.nube.listo(); this.estelas.listo();
  }
  ocultar() { this.nube.ocultar(); this.estelas.ocultar(); }
}

// Niebla y vapor (sprites grandes)
export class Vapor {
  constructor(scene, texNiebla, n = 70, color = 0xdfeaf5) { this.n = n; this.nube = new Nube(scene, n, texNiebla, color, { aditivo: false, orden: 6 }); }
  // caja: zona donde vive; sube: velocidad vertical (cm/s); dens: 0..1
  update(t, dens, { caja = [-26, 26, 2, 62, -24, 24], sube = 6, tam = 34, deriva = 3, alfa = 0.16 } = {}) {
    const [x0, x1, y0, y1, z0, z1] = caja;
    const H = y1 - y0;
    for (let i = 0; i < this.n; i++) {
      const bx = x0 + hash(i * 1.3) * (x1 - x0), bz = z0 + hash(i * 2.9) * (z1 - z0);
      const yy = ((hash(i * 5.1) * H + sube * t) % H + H) % H;
      const x = bx + Math.sin(t * 0.3 + i) * deriva, z = bz + Math.cos(t * 0.27 + i * 1.7) * deriva;
      const borde = Math.min(yy / (H * 0.15), (H - yy) / (H * 0.15), 1);
      this.nube.set(i, x, y0 + yy, z, dens * alfa * borde * (0.6 + 0.4 * hash(i * 8.8)), tam * (0.7 + 0.6 * hash(i * 4.2)) * (1 + 0.4 * yy / H));
    }
    this.nube.listo();
  }
  ocultar() { this.nube.ocultar(); }
}

// Gotas grandes delante de la cámara (desenfocadas, para la cartela)
export class GotasCerca {
  constructor(scene, texGota, n = 26) { this.n = n; this.nube = new Nube(scene, n, texGota, 0xffffff, { aditivo: false, orden: 9 }); }
  update(t, cam, dens) {
    const fw = new THREE.Vector3(); cam.getWorldDirection(fw);
    const right = new THREE.Vector3().crossVectors(fw, cam.up).normalize();
    const upv = new THREE.Vector3().crossVectors(right, fw).normalize();
    for (let i = 0; i < this.n; i++) {
      const d = 6 + hash(i * 3.7) * 16;
      const vy = 2 + hash(i * 1.9) * 5;
      const ox = (hash(i * 2.2) - 0.5) * d * 0.9;
      const oy = (((hash(i * 5.5) * 2 - vy * t * 0.12) % 2) + 2) % 2 - 1;
      const p = cam.position.clone().addScaledVector(fw, d).addScaledVector(right, ox).addScaledVector(upv, oy * d * 0.9);
      this.nube.set(i, p.x, p.y, p.z, dens * (0.5 + 0.5 * hash(i)), 0.5 + hash(i * 9.3) * 1.3);
    }
    this.nube.listo();
  }
  ocultar() { this.nube.ocultar(); }
}

// Gotas de condensación en la pared derecha (instancias)
export class GotasPared {
  constructor(scene, envInt = 2.5, n = 420) {
    this.n = n;
    const mat = new THREE.MeshStandardMaterial({ color: 0xe8f4ff, roughness: 0.02, metalness: 0.2, transparent: true, opacity: 0.42, envMapIntensity: envInt });
    this.mesh = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 14, 10), mat, n);
    this.mesh.frustumCulled = false; scene.add(this.mesh);
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion();
  }
  update(t, crec, { x = 27.75, y0 = 8, y1 = 60, z0 = -24, z1 = 24 } = {}) {
    for (let i = 0; i < this.n; i++) {
      const y = y0 + hash(i * 1.1) * (y1 - y0), z = z0 + hash(i * 2.7) * (z1 - z0);
      const r = (0.12 + hash(i * 3.9) * 0.55) * clamp(crec * (0.6 + hash(i * 7.1)));
      const cae = i % 6 === 0 && r > 0.4 ? Math.max(0, t - 2 - hash(i) * 2) * (8 + hash(i * 4) * 10) : 0;
      this.m.compose(new THREE.Vector3(x, y - cae, z), this.q, new THREE.Vector3(r * 0.45, r * (cae > 0 ? 1.4 : 1), r));
      this.mesh.setMatrixAt(i, this.m);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}

// Burbujas pequeñas que suben (efervescencia)
export class Burbujas {
  constructor(scene, texPunto, n = 400) { this.n = n; this.nube = new Nube(scene, n, texPunto, 0xffffff); }
  update(t, dens, { c = [0, 0, 0], r = 4, alto = 8, vel = 5, tam = 0.25, plano = null } = {}) {
    for (let i = 0; i < this.n; i++) {
      const L = alto / vel, fase = hash(i * 2.1) * L;
      const a = ((t + fase) % L);
      const ang = hash(i * 3.3) * 6.283, rr = Math.sqrt(hash(i * 4.4)) * r;
      let x = c[0] + Math.cos(ang) * rr + Math.sin(t * 3 + i) * 0.15, y = c[1] + a * vel, z = c[2] + Math.sin(ang) * rr;
      if (plano === 'z') { // burbujas sobre una superficie que mira hacia +z
        x = c[0] + Math.cos(ang) * rr; y = c[1] + Math.sin(ang) * rr + a * vel * 0.35; z = c[2] + a * vel * 0.12;
      }
      this.nube.set(i, x, y, z, dens * (1 - a / L) * 0.85, tam * (0.6 + hash(i * 6.2)));
    }
    this.nube.listo();
  }
  ocultar() { this.nube.ocultar(); }
}

// Restos de comida (instancias) que giran hacia el filtro / desagüe o saltan del plato
export class Restos {
  constructor(scene, n = 90, cols = [0xf4ecd8, 0xc0432a, 0x8a5a2b, 0xe9b43c, 0x5a7d2c], geo = new THREE.IcosahedronGeometry(1, 0)) {
    this.n = n;
    const mat = new THREE.MeshStandardMaterial({ roughness: 0.5, vertexColors: false });
    this.mesh = new THREE.InstancedMesh(geo, mat, n);
    for (let i = 0; i < n; i++) this.mesh.setColorAt(i, new THREE.Color(cols[i % cols.length]));
    this.mesh.frustumCulled = false; scene.add(this.mesh);
    this.m = new THREE.Matrix4(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler();
  }
  _set(i, x, y, z, s, rot, alarg = 1) {
    this.e.set(rot, rot * 1.3, rot * 0.7); this.q.setFromEuler(this.e);
    this.m.compose(new THREE.Vector3(x, y, z), this.q, new THREE.Vector3(s, s, s * alarg));
    this.mesh.setMatrixAt(i, this.m);
  }
  // remolino hacia el centro (cx, cz); hunde: si bajan por el desagüe
  remolino(t, { cx = 0, cz = -2, y = 0.5, r0 = 22, rmin = 4.7, vel = 0.25, giro = 1.2, hunde = false }) {
    for (let i = 0; i < this.n; i++) {
      const fase = hash(i * 1.9);
      const p = clamp(fase * 0.6 + t * vel * (0.6 + hash(i * 2.4) * 0.8));
      let rr = Math.max(rmin, r0 * (0.35 + 0.65 * hash(i * 3.7)) * (1 - p));
      const ang = hash(i * 5.3) * 6.283 + t * giro * (1 + 6 / rr);
      let yy = y;
      if (hunde && rr <= rmin + 0.01) { yy = y - (t * vel * 6 - (1 - fase) * 3); rr = rmin * 0.6; }
      this._set(i, cx + Math.cos(ang) * rr, Math.max(yy, -30), cz + Math.sin(ang) * rr, 0.3 + hash(i * 6.6) * 0.45, t * 2 + i, 1.4);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  // granos que saltan de un plato (cámara lenta)
  saltan(ts, { c, n = [1, 0, 0], area = [8, 6], t0 = 0.02 }) {
    for (let i = 0; i < this.n; i++) {
      const tb = t0 + hash(i * 4.1) * 0.06;
      const a = Math.max(0, ts - tb);
      const x0 = c[0] + (hash(i * 2.2) - 0.5) * area[0], y0b = c[1] + (hash(i * 3.3) - 0.5) * area[1];
      const vx = n[0] * (40 + 110 * hash(i * 5.5)) + (hash(i * 7.7) - 0.5) * 70, vy = 30 + 90 * hash(i * 6.6), vz = n[2] * (40 + 110 * hash(i * 5.5));
      this._set(i, x0 + vx * a, y0b + vy * a + 0.5 * G * a * a, c[2] + vz * a, 0.2, a * 20 + i, 2.3);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  // caen a la basura
  caen(t, { c, area = 6, t0 = 0, fondo = -1000 }) {
    for (let i = 0; i < this.n; i++) {
      const tb = t0 + hash(i * 4.1) * 1.8;
      const a = Math.max(0, t - tb);
      let y = c[1] + (hash(i * 9.9) - 0.5) * 2 + 0.5 * G * 0.35 * a * a;
      y = Math.max(y, fondo + hash(i) * 3);
      this._set(i, c[0] + (hash(i * 2.2) - 0.5) * area + a * 6, y, c[2] + (hash(i * 3.3) - 0.5) * area, 0.5 + hash(i * 6.6) * 0.7, a * 4 + i, 1.3);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  ocultar() { this.mesh.visible = false; }
  mostrar() { this.mesh.visible = true; }
}
