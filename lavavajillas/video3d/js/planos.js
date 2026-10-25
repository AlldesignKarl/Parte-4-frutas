// Los 30 planos: cada uno devuelve el estado de la escena en su tiempo local lt (s).
import { ease, easeOut, smooth, ramp, lerp, lerp3, clamp } from './util.js';

const cam = (p0, p1, l0, l1, k, fov = 70, roll = 0) => ({ pos: lerp3(p0, p1, k), look: lerp3(l0, l1, k), fov, roll });
const ct = (v) => () => v;
const sube = (v, t0, t1) => (t) => v * smooth((t - t0) / (t1 - t0));
const V = { lav: true, resina: false, sensor: false, frontal: false, fregadero: false };
const solo = (k) => Object.assign({}, V, { lav: false }, { [k]: true });

export function crearPlanos({ TL, frontal, fregadero, resina, sensor }) {
  const graf = (slug) => TL.graf.find(g => g.slug === slug);
  const R = resina.O, Sx = sensor.O, F = frontal.O, Fr = fregadero.O;
  const so = (x, y, z) => [Sx.x + x, Sx.y + y, Sx.z + z];
  const fo = (x, y, z) => [F.x + x, F.y + y, F.z + z];
  const fr = (x, y, z) => [Fr.x + x, Fr.y + y, Fr.z + z];
  const ro = (x, y, z) => [R.x + x, R.y + y, R.z + z];
  const orbita = (r, a, y) => so(Math.sin(a) * r, y, Math.cos(a) * r);

  return [
    // 01 · se cierra la puerta
    { estado: (lt, L) => {
      const cierre = ease(lt / 1.5);
      const enc = ramp(lt, 2.0, 2.8);
      return {
        cam: cam([-5, 59.5, -22], [-4, 59, -18], [0, 36, 40], [0, 35, 40], lt / L, 72),
        puerta: 1 - cierre, ext: (1 - cierre) * 0.9, led: enc, envInt: 0.15 + 0.85 * Math.max(enc, 1 - cierre),
        exposicion: lt < 1.5 ? 1 : lt < 2.0 ? 0.4 : 0.4 + 0.6 * enc, niebla: 0.12, sucio: 1,
      };
    } },
    // 02 · cartela (gotas sobre el acero)
    { estado: (lt, L) => ({
      cam: cam([12, 50, 22], [14, 49, 21], [28, 47, 12], [28, 46.5, 11], lt / L, 60),
      gotasPared: 0.9, gotasCerca: 1, led: 0.7, niebla: 0.5, exposicion: 0.95, sucio: 1, extra: { pos: [16, 56, 24], int: 220 },
    }) },
    // 03 · vajilla sucia
    { estado: (lt, L) => {
      const k = ease(lt / L);
      return { cam: { pos: [lerp(13, -11, k), lerp(25, 24, k), 21.5], look: [lerp(12, -12, k), 18.5, 2], fov: 60 }, led: 1, niebla: 0.15, sucio: 1 };
    } },
    // 04 · descalcificador
    { estado: (lt, L) => ({
      ver: solo('resina'), env: 'estudio', envInt: 0.35, fog: 0, fondo: 0x04070b,
      cam: cam(ro(9, 4, 66), ro(5, 1, 44), ro(4, 0, 0), ro(2, -1, 0), ease(lt / L), 40),
    }) },
    // 05 · fondo de la cuba
    { estado: (lt, L) => ({
      cam: cam([5, 7.5, 24], [4, 8.6, 21], [0, 0.5, -2], [0, 3, -3], ease(lt / L), 68),
      led: 1, niebla: 0.2, aguaOpac: 0.42,
    }) },
    // 06 · brazo aspersor
    { estado: (lt, L) => ({
      cam: cam([-4, 15.5, 20], [-3, 13.5, 17], [0, 5, -2], [0, 5, -2], ease(lt / L), 72), extra: { pos: [-2, 14, 16], int: 90 },
      wL: (t) => 5.5 * smooth(t / 1.6), iL: (t) => smooth((t - 0.25) / 1.0), iU: (t) => 0.6 * smooth((t - 1.2) / 1.0), wU: (t) => 4.5 * smooth((t - 0.8) / 1.5),
      niebla: lerp(0.2, 0.6, smooth(lt / L)), goteo: smooth((lt - 1.5) / 2), led: 1,
    }) },
    // 07 · prelavado a cámara lenta
    { estado: (lt, L) => ({
      cam: cam([-5, 12, 17], [-6, 12.5, 15.5], [-12, 20, 2.5], [-12, 20, 2.5], ease(lt / L), 62), extra: { pos: [-4, 22, 16], int: 140 },
      slow: 0.08, wL: ct(5.5), iL: ct(1), salp: 1.6, colorAgua: 0xe4f6ff,
      restos: { modo: 'saltan', c: [-12, 17, 3.5], n: [0.2, 0, 1], area: [14, 9], t0: 0.03 },
      niebla: 0.4, led: 1.1,
    }) },
    // 08 · filtro (desde arriba)
    { estado: (lt, L) => ({
      cam: cam([1.2, 26, 14], [1, 21, 10], [0.5, 0, -2], [0.5, 0, -2], ease(lt / L), 66),
      wL: ct(4.5), iL: ct(0.55), goteo: 1, aguaTurb: 0.55, aguaOpac: 0.5, remolino: 0.35,
      restos: { modo: 'remolino', cx: 0, cz: -2, y: 0.7, r0: 22, rmin: 4.75, vel: 0.22, giro: 0.9 },
      niebla: 0.35,
    }) },
    // 09 · bajando al sensor
    { estado: (lt, L) => {
      const k = ease(lt / L);
      let pos, look;
      if (k < 0.35) { const q = smooth(k / 0.35); pos = lerp3([1.2, 27, 14], [0.8, 6, 3], q); look = lerp3([0.5, 0, -2], [0.2, -4, -2], q); }
      else if (k < 0.55) { const q = smooth((k - 0.35) / 0.2); pos = lerp3([0.8, 6, 3], [0, 3.5, -2], q); look = lerp3([0.2, -4, -2], [0, -20, -2.02], q); }
      else { const q = (k - 0.55) / 0.45; pos = [0, lerp(3.5, -41, q), -2]; look = [0, lerp(3.5, -41, q) - 25, -2.02]; }
      return {
        ver: Object.assign({}, V, { sensor: true }),
        cam: { pos, look, fov: 74 },
        wL: ct(4), iL: ct(0.4), niebla: 0.7, led: 1 - 0.6 * k, turb: 0.35, aguaTurb: 0.4, exposicion: 1,
        sensorCfg: { brillo: 1.2 },
      };
    } },
    // 10 · sensor (normal)
    { estado: (lt, L) => ({
      ver: solo('sensor'), env: 'estudio', envInt: 0.25, fog: 0, fondo: 0x030507,
      cam: { pos: orbita(17, lerp(-0.45, -0.1, ease(lt / L)), 3), look: so(0, -0.3, 0), fov: 48 }, turb: 0.15,
    }) },
    // 11 · sensor: agua turbia
    { estado: (lt, L) => ({
      ver: solo('sensor'), env: 'estudio', envInt: 0.25, fog: 0, fondo: 0x030507,
      cam: { pos: orbita(lerp(14, 11, ease(lt / L)), lerp(0.3, 0.12, ease(lt / L)), 1.2), look: so(0, 0, 0), fov: 46 },
      turb: lerp(0.15, 1, smooth(lt / 1.3)),
    }) },
    // 12 · sigue lavando
    { estado: (lt, L) => ({
      cam: cam([-6, 34, 24.5], [-4.5, 30, 23], [0, 16, -6], [1, 15, -7], ease(lt / L), 72),
      wL: ct(8.5), wU: ct(7.5), iL: ct(1.35), iU: ct(1.2), salp: 1.3, vapor: 0.7, niebla: 0.9, warm: 0.55, sucio: 0.6, goteo: 1, led: 1,
    }) },
    // 13 · sensor: agua limpia
    { estado: (lt, L) => ({
      ver: solo('sensor'), env: 'estudio', envInt: 0.3, fog: 0, fondo: 0x030507,
      cam: { pos: orbita(lerp(15, 12.5, ease(lt / L)), lerp(-0.2, 0.25, ease(lt / L)), 2), look: so(0, -0.2, 0), fov: 46 },
      turb: lerp(1, 0, smooth(lt / 1.1)), sensorCfg: { brillo: 1.25 },
    }) },
    // 14 · panel de mandos de noche
    { estado: (lt, L, P) => {
      const tb = graf('tiempo_b');
      return {
        ver: solo('frontal'), env: 'estudio', envInt: 0.12, fog: 0, fondo: 0x020304,
        cam: cam(fo(24, 72, 44), fo(20, 74, 26), fo(18, 74.5, 0), fo(18, 74.5, 0), ease(lt / L), 40),
        frontal: { texto: P.ini + lt >= tb.a + 0.15 ? '1:48' : '2:15', encendidos: 5, foco: 4 },
      };
    } },
    // 15 · cajetín
    { estado: (lt, L) => {
      const ab = easeOut((lt - 0.45) / 0.22), c = Math.max(0, lt - 0.6);
      return {
        cam: cam([-2, 30, 10], [0, 32, 13], [6, 39, 25], [6, 38.5, 25], ease(lt / L), 62), extra: { pos: [-3, 34, 12], int: 260 },
        tapa: 1.75 * ab, pastilla: lt > 0.6 ? { dx: c * 4, dy: -0.5 * 980 * c * c * 0.55, dz: c * 32, r: c * 9 } : null,
        wU: ct(5), iU: ct(0.9), wL: ct(5), iL: ct(0.7), vapor: 0.3, niebla: 0.5, led: 1,
      };
    } },
    // 16 · el agua se calienta
    { estado: (lt, L) => ({
      cam: cam([-4.5, 42, 24.5], [-4, 39, 23.5], [2, 16, -8], [2, 15, -8], ease(lt / L), 72),
      wL: ct(6), wU: ct(5.5), iL: ct(1), iU: ct(1), vapor: lerp(0.15, 1, smooth(lt / L)), warm: smooth(lt / L), niebla: 0.6,
      tinte: 0xffd6b0, led: 1, sucio: 0.75,
    }) },
    // 17 · enzimas (macro sobre el huevo)
    { estado: (lt, L) => ({
      cam: cam([-11.5, 22.6, 8.6], [-12, 22, 7.4], [-12, 21.2, 2.4], [-12, 21.2, 2.4], ease(lt / L), 58), extra: { pos: [-8, 26, 9], int: 90 },
      disolver: { idx: 5, v: lerp(0.03, 0.97, ease((lt - 0.6) / 5.6)) }, sucio: 1,
      burbujas: { dens: 1, c: [-12, 21, 2.9], r: 7.5, alto: 6, vel: 3, tam: 0.22, plano: 'z' },
      iL: ct(0.35), wL: ct(4), warm: 0.6, vapor: 0.35, niebla: 0.3, led: 1.05,
    }) },
    // 18 · desagüe
    { estado: (lt, L) => ({
      cam: cam([5, 13, 13], [4, 10, 9], [0, -1, -2.5], [0, -2, -2.5], ease(lt / L), 64),
      aguaTurb: 0.75, aguaOpac: 0.5 * (1 - smooth((lt - 0.4) / 2.6)), sumNivel: lerp(-0.1, -5.5, smooth((lt - 0.6) / 3.2)), remolino: 1.6,
      restos: { modo: 'remolino', cx: 0, cz: -2, y: 0.4, r0: 16, rmin: 3, vel: 0.3, giro: 2.2, hunde: true },
      goteo: 0.7, niebla: 0.35, sucio: 0.4,
    }) },
    // 19 · aclarado
    { estado: (lt, L) => ({
      cam: cam([8, 36, 23], [3, 31, 20], [-4, 16, -8], [-5, 15, -8], ease(lt / L), 72),
      sucio: 0, wL: ct(6), wU: ct(6), iL: ct(1), iU: ct(1), brillo: 1.35, colorAgua: 0xf0fbff, led: 1.3, exposicion: 1.1, vapor: 0.35, niebla: 0.45, tinte: 0xe6f6ff,
    }) },
    // 20 · abrillantador (lámina sobre la copa)
    { estado: (lt, L) => ({
      cam: cam([-7, 49, 17], [-8.5, 48, 14.5], [-14, 47, 8], [-14, 46.5, 8], ease(lt / L), 54),
      lamina: lerp(-1, 19, smooth((lt - 0.3) / 2.8)), sucio: 0, iU: ct(0.35), wU: ct(3), led: 1.2, niebla: 0.25, exposicion: 1.05,
    }) },
    // 21 · condensación en la pared
    { estado: (lt, L) => ({
      cam: cam([15, 32, 23], [17, 31, 21], [28, 30, 10], [28, 29.5, 9], ease(lt / L), 60),
      gotasPared: lerp(0.25, 1.15, smooth(lt / (L * 0.8))), vapor: 0.7, vaporCfg: { caja: [5, 27, 6, 58, -20, 20], sube: 3, tam: 26, alfa: 0.16 },
      niebla: 0.2, led: 0.9, warm: 0.25, sucio: 0, extra: { pos: [17, 40, 25], int: 260 },
    }) },
    // 22 · la puerta se abre sola
    { estado: (lt, L) => ({
      ver: solo('frontal'), env: 'estudio', envInt: 0.15, fog: 0, fondo: 0x020304,
      cam: cam(fo(-34, 78, 170), fo(-26, 74, 148), fo(0, 62, 0), fo(0, 62, 0), ease(lt / L), 46),
      frontal: { texto: '0:00', encendidos: 5, foco: -1, abre: 0.12 * easeOut((lt - 0.6) / 0.8), vaporD: smooth((lt - 1.0) / 1.2) },
    }) },
    // 23 · elegir programa (iconos)
    { estado: (lt, L) => {
      const n = Math.min(5, Math.floor(lt / 0.55) + 1);
      return {
        ver: solo('frontal'), env: 'estudio', envInt: 0.12, fog: 0, fondo: 0x020304,
        cam: cam(fo(-10, 64, 58), fo(-11, 66, 50), fo(-11.5, 80, 0), fo(-11.5, 80, 0), ease(lt / L), 44),
        frontal: { texto: '', encendidos: n, foco: n - 1 },
      };
    } },
    // 24 · Intensivo
    { estado: (lt, L) => ({
      cam: cam([1, 30, 25], [0.5, 27, 24], [0, 15, 4], [0, 14, 4], ease(lt / L), 70), extra: { pos: [0, 30, 22], int: 120 },
      olla: true, wL: ct(9.5), iL: ct(1.6), wU: ct(6), iU: ct(0.8), salp: 1.5, vapor: 0.95, warm: 0.95, brillo: 1.15, niebla: 0.7, tinte: 0xffd2a8, sucio: lerp(0.9, 0.4, lt / L),
    }) },
    // 25 · Delicado
    { estado: (lt, L) => ({
      cam: cam([-5, 50, 23], [-6, 48, 20], [-14, 46, 2], [-14, 46, 3], ease(lt / L), 62),
      wU: ct(2.2), iU: ct(0.18), brillo: 0.6, goteo: 0.9, sucio: 0, led: 0.95, niebla: 0.3, salp: 0.3, extra: { pos: [-6, 52, 22], int: 120 },
    }) },
    // 26 · Rápido y Auto
    { estado: (lt, L) => {
      const k = ease(lt / L);
      return {
        cam: { pos: lerp3([13, 20, 23], [-10, 34, 21], k), look: lerp3([-4, 16, -6], [6, 20, -8], k), fov: 74, roll: lerp(-0.06, 0.05, k) },
        wL: ct(11), wU: ct(10), iL: ct(1.2), iU: ct(1.1), estela: 0.022, salp: 1.2, niebla: 0.6, sucio: 0.2, led: 1.1,
      };
    } },
    // 27 · Eco
    { estado: (lt, L) => ({
      cam: cam([-9, 38, 23], [-7, 35, 21], [2, 15, -8], [2, 15, -8], ease(lt / L), 70),
      wL: ct(3), wU: ct(2.5), iL: ct(0.55), iU: ct(0.5), vapor: 0.35, niebla: 0.55, tinte: 0xc0ffdc, warm: 0.12, sucio: 0.3, led: 0.95,
    }) },
    // 28 · cocina: aclarar bajo el grifo (el error)
    { estado: (lt, L) => ({
      ver: solo('fregadero'), env: 'estudio', envInt: 0.45, fog: 0, fondo: 0xdfe8ee,
      cam: cam(fr(30, 120, 42), fr(23, 113, 31), fr(0, 82, -17), fr(0, 81, -17), ease(lt / L), 50),
      fregadero: { grifo: 1, inclina: 0 }, exposicion: 0.62,
    }) },
    // 29 · rascar a la basura
    { estado: (lt, L) => ({
      ver: solo('fregadero'), env: 'estudio', envInt: 1.0, fog: 0, fondo: 0xdfe8ee,
      cam: cam(fr(98, 104, 66), fr(96, 98, 60), fr(88, 25, 40), fr(88, 22, 40), ease(lt / L), 54),
      fregadero: { grifo: 0, inclina: 0.75 * smooth(lt / 1.2) },
      restos: { modo: 'caen', c: [Fr.x + 86, 63, Fr.z + 38], area: 6, t0: 0.6, fondo: 6.5 }, exposicion: 0.7, envInt: 0.5,
    }) },
    // 30 · final: se abre la puerta (desde la cocina)
    { estado: (lt, L) => {
      const ab = ease((lt - 0.4) / 1.9);
      return {
        cocina: true, env: 'estudio', envInt: 0.35, fog: 0, fondo: 0x0a0a0a,
        cam: cam([6, 40, 92], [2, 34, 74], [0, 28, 0], [0, 26, 0], ease(lt / L), 58),
        puerta: ab, ext: 0.5 + 0.3 * ab, led: 1.1, sucio: 0, brillo: 1, extra: { pos: [0, 55, 60], int: 900 },
        vapor: ab * lerp(1, 0.5, smooth((lt - 2.5) / 4)),
        vaporCfg: { caja: [-24, 24, 10, 70, 6, 34], sube: 10, tam: 30, alfa: 0.28 }, niebla: 0.25, exposicion: 0.85,
      };
    } },
  ];
}
