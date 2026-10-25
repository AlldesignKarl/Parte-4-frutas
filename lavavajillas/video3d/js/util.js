// Utilidades: aleatorio con semilla, suavizados y texturas generadas (todo determinista).
import * as THREE from 'three';

export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export const hash = (i) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
export const ease = (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOut = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const ramp = (t, a, b) => smooth((t - a) / (b - a));
export const lerp3 = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}
function tex(c, { srgb = false, repeat = null } = {}) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); }
  t.anisotropy = 4;
  return t;
}

// Acero cepillado: rayas horizontales finas (sirve de bump y de rugosidad)
export function texCepillado(seed = 1) {
  const r = rng(seed);
  const [c, g] = canvas(512);
  g.fillStyle = '#808080'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 2600; i++) {
    const y = r() * 512, x = r() * 512, len = 40 + r() * 260, v = Math.floor(100 + r() * 60);
    g.strokeStyle = `rgba(${v},${v},${v},${0.15 + r() * 0.35})`;
    g.lineWidth = 0.6 + r() * 1.2;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y + (r() - 0.5) * 1.5); g.stroke();
  }
  return tex(c, { repeat: [3, 3] });
}

// Relieve de la cuba: nervios horizontales suaves + cepillado
export function texNervios(seed = 2) {
  const r = rng(seed);
  const [c, g] = canvas(512);
  const grad = g.createLinearGradient(0, 0, 0, 512);
  for (let k = 0; k <= 8; k++) {
    grad.addColorStop(k / 8, k % 2 ? '#9a9a9a' : '#6a6a6a');
  }
  g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
  g.globalAlpha = 0.5;
  for (let i = 0; i < 1500; i++) {
    const v = Math.floor(90 + r() * 80);
    g.strokeStyle = `rgb(${v},${v},${v})`; g.lineWidth = 0.7;
    const y = r() * 512, x = r() * 512;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 30 + r() * 200, y); g.stroke();
  }
  return tex(c, { repeat: [1, 1] });
}

// Punto suave para gotas
export function texPunto() {
  const [c, g] = canvas(64);
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  gr.addColorStop(0.6, 'rgba(255,255,255,0.18)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return tex(c);
}

// Gota con brillo (para gotas grandes cerca de cámara)
export function texGota() {
  const [c, g] = canvas(128);
  const gr = g.createRadialGradient(64, 64, 10, 64, 64, 62);
  gr.addColorStop(0, 'rgba(200,235,255,0.10)');
  gr.addColorStop(0.75, 'rgba(220,245,255,0.35)');
  gr.addColorStop(0.92, 'rgba(255,255,255,0.9)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 62, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(255,255,255,0.95)';
  g.beginPath(); g.ellipse(46, 44, 12, 7, -0.7, 0, Math.PI * 2); g.fill();
  return tex(c);
}

// Niebla / vapor: nube de manchas suaves
export function texNiebla(seed = 3) {
  const r = rng(seed);
  const [c, g] = canvas(256);
  for (let i = 0; i < 70; i++) {
    const x = 128 + (r() - 0.5) * 140, y = 128 + (r() - 0.5) * 140, rad = 20 + r() * 60;
    const gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(255,255,255,${0.08 + r() * 0.1})`);
    gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
  }
  // borde suave
  const m = g.createRadialGradient(128, 128, 60, 128, 128, 128);
  m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(1, 'rgba(0,0,0,1)');
  g.globalCompositeOperation = 'destination-out'; g.fillStyle = m; g.fillRect(0, 0, 256, 256);
  return tex(c);
}

// Ruido de valor (para disolver manchas y ondas)
export function texRuido(seed = 4, size = 256, escala = 16) {
  const r = rng(seed);
  const n = escala + 1, grid = [];
  for (let i = 0; i < n * n; i++) grid.push(r());
  const at = (x, y) => grid[(y % escala) * n + (x % escala)];
  const [c, g] = canvas(size);
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0, amp = 0.5, f = 1;
    for (let o = 0; o < 4; o++) {
      const fx = (x / size) * escala * f, fy = (y / size) * escala * f;
      const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = at(x0, y0), b = at(x0 + 1, y0), cc = at(x0, y0 + 1), d = at(x0 + 1, y0 + 1);
      v += amp * ((a * (1 - sx) + b * sx) * (1 - sy) + (cc * (1 - sx) + d * sx) * sy);
      amp *= 0.5; f *= 2;
    }
    const k = (y * size + x) * 4, val = Math.floor(clamp(v) * 255);
    img.data[k] = img.data[k + 1] = img.data[k + 2] = val; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return tex(c, { repeat: [1, 1] });
}

// Mapa de normales de ondas de agua a partir de ruido
export function texOndas(seed = 5) {
  const size = 256, r = rng(seed);
  const [c, g] = canvas(size);
  const h = new Float32Array(size * size);
  const ondas = [];
  for (let i = 0; i < 14; i++) ondas.push([r() * size, r() * size, 6 + r() * 18, r() * 6]);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0;
    for (const [cx, cy, l, ph] of ondas) {
      let dx = Math.abs(x - cx); dx = Math.min(dx, size - dx);
      let dy = Math.abs(y - cy); dy = Math.min(dy, size - dy);
      v += Math.sin(Math.hypot(dx, dy) / l * 6.283 + ph) / (1 + Math.hypot(dx, dy) / 60);
    }
    h[y * size + x] = v;
  }
  const img = g.createImageData(size, size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const hx = h[y * size + (x + 1) % size] - h[y * size + (x + size - 1) % size];
    const hy = h[((y + 1) % size) * size + x] - h[((y + size - 1) % size) * size + x];
    let nx = -hx * 0.9, ny = -hy * 0.9, nz = 1;
    const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    const k = (y * size + x) * 4;
    img.data[k] = (nx * 0.5 + 0.5) * 255; img.data[k + 1] = (ny * 0.5 + 0.5) * 255; img.data[k + 2] = (nz * 0.5 + 0.5) * 255; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return tex(c, { repeat: [3, 3] });
}

// Rejilla (filtro): alpha con agujeros
export function texRejilla(celdas = 40, grosor = 0.42) {
  const [c, g] = canvas(256);
  g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#fff';
  const s = 256 / celdas;
  for (let i = 0; i < celdas; i++) {
    g.fillRect(i * s, 0, s * grosor, 256);
    g.fillRect(0, i * s, 256, s * grosor);
  }
  return tex(c, { repeat: [4, 2] });
}

// Manchas de comida para los platos (mapa de color con alfa)
export function texMancha(tipo, seed = 7) {
  const r = rng(seed);
  const [c, g] = canvas(512);
  const blob = (x, y, rad, color, n = 14, irr = 0.35) => {
    g.fillStyle = color; g.beginPath();
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, rr = rad * (1 - irr / 2 + r() * irr);
      const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
      i ? g.lineTo(px, py) : g.moveTo(px, py);
    }
    g.closePath(); g.fill();
  };
  if (tipo === 'huevo') {
    for (let i = 0; i < 4; i++) blob(230 + r() * 70, 230 + r() * 70, 70 + r() * 40, 'rgba(244,190,40,0.95)', 18, 0.5);
    blob(260, 255, 55, 'rgba(232,150,20,0.95)', 16, 0.45);
    for (let i = 0; i < 40; i++) blob(150 + r() * 220, 150 + r() * 220, 3 + r() * 9, 'rgba(250,215,90,0.9)', 8, 0.6);
    g.strokeStyle = 'rgba(200,120,10,0.8)'; g.lineWidth = 6;
    for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(200 + r() * 150, 200 + r() * 150); g.quadraticCurveTo(250 + r() * 50, 250 + r() * 50, 180 + r() * 200, 180 + r() * 200); g.stroke(); }
  } else if (tipo === 'tomate') {
    g.lineCap = 'round';
    for (let i = 0; i < 9; i++) {
      g.strokeStyle = `rgba(${170 + r() * 50},${30 + r() * 30},${15 + r() * 15},0.92)`;
      g.lineWidth = 18 + r() * 40;
      g.beginPath(); g.moveTo(120 + r() * 120, 140 + r() * 240); g.bezierCurveTo(200 + r() * 100, 100 + r() * 300, 260 + r() * 100, 120 + r() * 280, 330 + r() * 80, 150 + r() * 220); g.stroke();
    }
    for (let i = 0; i < 30; i++) blob(130 + r() * 260, 130 + r() * 260, 4 + r() * 12, 'rgba(190,40,20,0.9)', 8, 0.6);
    for (let i = 0; i < 12; i++) blob(150 + r() * 220, 150 + r() * 220, 4 + r() * 6, 'rgba(60,110,30,0.9)', 6, 0.5); // perejil
  } else if (tipo === 'arroz') {
    blob(256, 256, 120, 'rgba(235,225,200,0.35)', 18, 0.5);
    for (let i = 0; i < 160; i++) {
      const x = 256 + (r() - 0.5) * 260, y = 256 + (r() - 0.5) * 260;
      if (Math.hypot(x - 256, y - 256) > 140) continue;
      g.save(); g.translate(x, y); g.rotate(r() * Math.PI);
      g.fillStyle = `rgba(${245 - r() * 15},${240 - r() * 15},${225 - r() * 20},0.98)`;
      g.beginPath(); g.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.ellipse(-2, -1, 4, 1.5, 0, 0, Math.PI * 2); g.fill();
      g.restore();
    }
    for (let i = 0; i < 20; i++) blob(150 + r() * 220, 150 + r() * 220, 5 + r() * 10, 'rgba(200,120,40,0.7)', 8, 0.5); // sofrito
  } else if (tipo === 'migas') {
    for (let i = 0; i < 60; i++) blob(140 + r() * 240, 140 + r() * 240, 2 + r() * 7, `rgba(${150 + r() * 60},${100 + r() * 50},${50 + r() * 30},0.85)`, 7, 0.6);
    g.strokeStyle = 'rgba(160,90,40,0.45)'; g.lineWidth = 14; g.lineCap = 'round';
    for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(256, 256, 60 + r() * 80, r() * 6, r() * 6 + 1.5); g.stroke(); }
  } else if (tipo === 'quemado') {
    for (let i = 0; i < 10; i++) blob(140 + r() * 230, 140 + r() * 230, 30 + r() * 60, `rgba(${40 + r() * 40},${20 + r() * 20},${10},0.9)`, 16, 0.6);
    for (let i = 0; i < 20; i++) blob(140 + r() * 230, 140 + r() * 230, 6 + r() * 20, 'rgba(110,40,15,0.85)', 10, 0.6);
  }
  return tex(c, { srgb: true });
}

// Placa de circuito para el sensor
export function texPCB(seed = 9) {
  const r = rng(seed);
  const [c, g] = canvas(512);
  g.fillStyle = '#0d4a2c'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(214,170,70,0.95)'; g.lineWidth = 5; g.lineCap = 'round';
  for (let i = 0; i < 40; i++) {
    let x = r() * 512, y = r() * 512; g.beginPath(); g.moveTo(x, y);
    for (let k = 0; k < 4; k++) { if (r() < 0.5) x += (r() - 0.5) * 220; else y += (r() - 0.5) * 220; g.lineTo(x, y); }
    g.stroke();
    g.fillStyle = 'rgba(230,190,90,1)'; g.beginPath(); g.arc(x, y, 8, 0, 6.3); g.fill();
  }
  g.fillStyle = 'rgba(255,255,255,0.7)'; g.font = 'bold 22px "JetBrains Mono"';
  g.fillText('TS-01', 30, 480); g.fillText('IR 940nm', 340, 40);
  return tex(c, { srgb: true });
}

// Azulejo / madera / encimera sencillos
export function texAzulejo() {
  const [c, g] = canvas(512);
  g.fillStyle = '#d8d4cc'; g.fillRect(0, 0, 512, 512);
  g.strokeStyle = '#b8b2a8'; g.lineWidth = 4;
  for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * 64); g.lineTo(512, i * 64); g.stroke(); }
  for (let j = 0; j < 8; j++) for (let i = 0; i <= 4; i++) { const x = i * 128 + (j % 2) * 64; g.beginPath(); g.moveTo(x, j * 64); g.lineTo(x, j * 64 + 64); g.stroke(); }
  return tex(c, { srgb: true, repeat: [3, 3] });
}
export function texMadera(seed = 11) {
  const r = rng(seed);
  const [c, g] = canvas(512);
  g.fillStyle = '#b98a58'; g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 160; i++) {
    const y = r() * 512, v = r();
    g.strokeStyle = `rgba(${120 + v * 60},${80 + v * 40},${40 + v * 20},${0.25 + r() * 0.35})`;
    g.lineWidth = 1 + r() * 4; g.beginPath(); g.moveTo(0, y);
    for (let x = 0; x <= 512; x += 64) g.lineTo(x, y + Math.sin(x / 90 + i) * 6);
    g.stroke();
  }
  return tex(c, { srgb: true, repeat: [2, 1] });
}
export { canvas, tex };
