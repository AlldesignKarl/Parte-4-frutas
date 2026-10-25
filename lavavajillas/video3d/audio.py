# -*- coding: utf-8 -*-
"""Banda sonora del vídeo 3D: música ambiental generada, efectos y mezcla con la voz.
Uso: python audio.py   (numpy, scipy, soundfile)  →  mezcla.wav (48 kHz, estéreo)
"""
import json
import os

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, resample_poly

AQUI = os.path.dirname(os.path.abspath(__file__))
SR = 48000
TL = json.load(open(os.path.join(AQUI, "timeline.json"), encoding="utf-8"))
DUR = TL["total"] + 0.6
N = int(DUR * SR)
P = {p["n"]: p for p in TL["planos"]}
rng = np.random.default_rng(7)


def t_(n, lt=0.0):
    return P[n]["ini"] + lt


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], btype="band", fs=SR, output="sos"), x)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, btype="low", fs=SR, output="sos"), x)


def hp(x, f, order=2):
    return sosfilt(butter(order, f, btype="high", fs=SR, output="sos"), x)


def env_ad(n, a, d):
    e = np.ones(n)
    na, nd = int(a * SR), int(d * SR)
    if na: e[:na] = np.linspace(0, 1, na)
    if nd: e[-nd:] *= np.linspace(1, 0, nd)
    return e


def poner(buf, t, x, g=1.0, pan=0.0):
    i = int(t * SR)
    if i >= buf.shape[0] or i + len(x) <= 0:
        return
    x = x[: buf.shape[0] - i]
    l, r = np.sqrt(0.5 * (1 - pan)), np.sqrt(0.5 * (1 + pan))
    buf[i:i + len(x), 0] += x * g * l
    buf[i:i + len(x), 1] += x * g * r


def ruido(seg):
    return rng.standard_normal(int(seg * SR))


# ---------------------------------------------------------------------------
# Efectos
# ---------------------------------------------------------------------------
def clac(peso=1.0):
    n = int(0.35 * SR); t = np.arange(n) / SR
    golpe = np.sin(2 * np.pi * (90 * np.exp(-t * 18) + 45) * t) * np.exp(-t * 14)
    chasq = hp(ruido(0.35), 1800) * np.exp(-t * 60)
    return (golpe * 0.9 * peso + chasq * 0.5)


def clic():
    n = int(0.08 * SR); t = np.arange(n) / SR
    return hp(ruido(0.08), 2500) * np.exp(-t * 120) * 0.8 + np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 90) * 0.2


def pitido(f, d=0.12, g=0.5):
    n = int(d * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + 0.2 * np.sin(2 * np.pi * 2 * f * t)) * env_ad(n, 0.004, 0.03) * g


def ding(f=1320, d=1.6):
    n = int(d * SR); t = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (2.5 + k * 1.5)) for k, a in [(1, 1), (2.01, 0.35), (2.76, 0.18), (4.1, 0.08)])
    return x * 0.5


def whoosh(d=1.0, f0=300, f1=3000, g=1.0):
    x = ruido(d); n = len(x)
    k = np.linspace(0, 1, n)
    fc = f0 * (f1 / f0) ** k                       # frecuencia central que barre
    out = np.zeros(n)
    centros = np.geomspace(120, 9000, 14)
    for c in centros:
        banda = bp(x, c / 1.35, min(SR / 2 - 200, c * 1.35), 2)
        peso = np.exp(-0.5 * (np.log(fc / c) / 0.45) ** 2)
        out += banda * peso
    return out * np.sin(np.pi * k) ** 1.5 * g * 0.6


def mod_lento(n, rapidez=3.0, prof=0.5):
    """Modulación aleatoria suave (ruido filtrado muy grave), entre 1-prof y 1+prof."""
    m = lp(rng.standard_normal(n), rapidez, 2)
    m = m / (np.abs(m).max() + 1e-9)
    return 1 + prof * m


def salpicones(d, densidad=35, g=0.5):
    """Granos cortos de ruido con envolvente Hann: suena a gotas chocando, no a estática."""
    n = int(d * SR); out = np.zeros(n)
    for _ in range(int(d * densidad)):
        m = int((0.012 + rng.random() * 0.03) * SR)
        i0 = int(rng.random() * max(1, n - m))
        f0 = 500 + rng.random() * 2200
        grano = bp(rng.standard_normal(m + 400), f0 * 0.7, f0 * 1.4, 2)[400:] * np.hanning(m)
        out[i0:i0 + m] += grano * (0.3 + 0.7 * rng.random())
    return out * g


def chorro(d, nivel_fn, brillo=1.0):
    """Agua pulverizada: rumor grave-medio que fluctúa + salpicones. Sin agudos de «estática»."""
    n = int(d * SR)
    x = rng.standard_normal(n)
    rumor = lp(hp(np.cumsum(x) * 0.02, 120), 2500, 2)           # ruido marrón: rumor de agua
    rumor = rumor / (np.abs(rumor).max() + 1e-9)
    medio = bp(x, 400, 2200, 2) * 0.35
    t = np.arange(n) / SR
    agua = (rumor * 0.8 + medio) * mod_lento(n, 2.5, 0.35)
    return (agua + salpicones(d, 30, 0.9)) * nivel_fn(t) * brillo * 0.55


def bomba(d, nivel_fn):
    """Motor de la bomba: rumor grave suave (sin zumbido eléctrico)."""
    n = int(d * SR); t = np.arange(n) / SR
    x = lp(rng.standard_normal(n), 180, 2) * 2.5 * mod_lento(n, 1.5, 0.15)
    x += np.sin(2 * np.pi * 49 * t) * 0.12
    return x * nivel_fn(t) * 0.6


def vapor_sss(d, g=1.0):
    n = int(d * SR)
    x = lp(hp(ruido(d), 2500), 9000) * 0.35 * mod_lento(n, 2, 0.3)
    return x * env_ad(n, d * 0.4, d * 0.3) * g


def gorgoteo(d):
    t = np.arange(int(d * SR)) / SR
    x = lp(ruido(d), 700)
    burb = np.zeros_like(t)
    for _ in range(int(d * 14)):
        t0 = rng.random() * d; f = 180 + rng.random() * 500
        i0 = int(t0 * SR); m = int(0.08 * SR)
        tt = np.arange(m) / SR
        seg = np.sin(2 * np.pi * (f + 900 * tt) * tt) * np.exp(-tt * 40)
        burb[i0:i0 + m] += seg[: len(burb) - i0]
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 3.1 * t) * np.sin(2 * np.pi * 0.7 * t)
    return (x * am * 0.8 + burb * 0.5) * env_ad(len(t), 0.4, 0.8)


def grifo(d):
    n = int(d * SR)
    x = (bp(ruido(d), 300, 3000) * 0.5 * mod_lento(n, 6, 0.25) + salpicones(d, 45, 0.6))
    return x * env_ad(n, 0.2, 0.4)


def rascar(d):
    t = np.arange(int(d * SR)) / SR
    x = bp(ruido(d), 2000, 7000) * (0.5 + 0.5 * np.sin(2 * np.pi * 2.2 * t)) ** 2
    return x * env_ad(len(t), 0.05, 0.2) * 0.5


def burbujitas(d, densidad=40, f=(1800, 4200), g=0.18):
    """Burbujas: senos cortos que suben de tono, con envolvente suave (sin chasquidos)."""
    n = int(d * SR); out = np.zeros(n)
    m = int(0.035 * SR); tt = np.arange(m) / SR
    env = np.sin(np.pi * np.minimum(tt / 0.004, 1) / 2) ** 2 * np.exp(-tt * 90)
    for _ in range(int(d * densidad)):
        i0 = int(rng.random() * (n - m)); f0 = f[0] + rng.random() * (f[1] - f[0])
        fase = 2 * np.pi * np.cumsum(f0 * (1 + 2.5 * tt / 0.035)) / SR
        out[i0:i0 + m] += np.sin(fase) * env * (0.4 + 0.6 * rng.random())
    return out * g


def efervescencia(d):
    x = burbujitas(d, 55) + hp(ruido(d), 6000) * 0.015
    return x * env_ad(int(d * SR), 0.15, 0.6)


# ---------------------------------------------------------------------------
# Música ambiental (La menor, 96 BPM)
# ---------------------------------------------------------------------------
def nota(m):
    return 440 * 2 ** ((m - 69) / 12)


def pad(acorde, d, brillo=1200, g=0.12):
    n = int(d * SR); t = np.arange(n) / SR
    x = np.zeros(n)
    for m in acorde:
        for det in (-0.07, 0.0, 0.08):
            f = nota(m + det)
            ph = rng.random() * 6.28
            x += (2 * ((f * t + ph / 6.28) % 1) - 1) * 0.33
    x = lp(x, brillo, 2)
    return x * env_ad(n, min(1.2, d * 0.4), min(1.2, d * 0.4)) * g / len(acorde)


def pluck(m, d=0.9, g=0.12):
    n = int(d * SR); t = np.arange(n) / SR
    f = nota(m)
    x = (np.sin(2 * np.pi * f * t) + 0.3 * np.sin(2 * np.pi * 2 * f * t) + 0.1 * np.sin(2 * np.pi * 3 * f * t)) * np.exp(-t * 5)
    return x * env_ad(n, 0.003, 0.05) * g


def bombo(g=0.5):
    n = int(0.4 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * (48 + 70 * np.exp(-t * 30)) * t) * np.exp(-t * 9) * g


def charles(g=0.08):
    n = int(0.06 * SR); t = np.arange(n) / SR
    return hp(ruido(0.06), 7000) * np.exp(-t * 70) * g


def musica():
    m = np.zeros((N, 2))
    bpm = 96; beat = 60 / bpm; compas = 4 * beat
    prog = [[57, 64, 67, 71, 72], [53, 60, 64, 69, 76], [48, 55, 64, 67, 74], [55, 62, 67, 71, 74]]  # Am9 Fmaj7 Cadd9 G
    misterio = [[45, 52, 57, 60], [46, 53, 58, 62]]
    # secciones por planos
    s_sensor = (t_(9), P[13]["ini"] + 1.0)
    s_secado = (t_(21), P[22]["fin"])
    t = 0.0; k = 0
    while t < DUR:
        en_sensor = s_sensor[0] <= t < s_sensor[1]
        ac = misterio[k % 2] if en_sensor else prog[k % 4]
        br = 700 if en_sensor else (1000 if t < t_(6) else 1700)
        poner(m, t, pad(ac, compas * 1.25, br, 0.10 if t > t_(2) else 0.07), 1.0, -0.2)
        poner(m, t, pad([a + 12 for a in ac[:3]], compas * 1.25, br * 0.8, 0.035), 1.0, 0.3)
        t += compas; k += 1
    # pulso rítmico desde que arranca la bomba, salvo en el sensor y el secado
    t = t_(6, 1.0)
    i = 0
    while t < P[30]["ini"] + 1.0:
        quieto = s_sensor[0] <= t < s_sensor[1] or s_secado[0] <= t < s_secado[1]
        if not quieto:
            if i % 4 == 0: poner(m, t, bombo(0.32), 1.0)
            if i % 2 == 1: poner(m, t, charles(0.05), 1.0, 0.4)
        elif s_sensor[0] <= t < s_sensor[1] and i % 4 == 0:
            poner(m, t, bombo(0.22), 1.0)  # latido grave
        t += beat / 2 * 2 / 2; i += 1
    # arpegios en lavado, aclarado y programas
    for a, b in [(t_(15), P[20]["fin"]), (t_(23), P[29]["fin"])]:
        t = a; j = 0
        while t < b:
            ac = prog[int((t // compas)) % 4]
            poner(m, t, pluck(ac[j % len(ac)] + 12, 0.8, 0.06), 1.0, (-0.5, 0.5)[j % 2])
            t += beat / 2; j += 1
    # final: acorde abierto
    poner(m, P[30]["ini"] + 0.4, pad([57, 64, 69, 71, 76], 7, 2400, 0.16), 1.0)
    return m


# ---------------------------------------------------------------------------
# Efectos colocados por plano
# ---------------------------------------------------------------------------
def efectos():
    e = np.zeros((N, 2))
    # 01 puerta que se cierra, silencio, luz
    poner(e, t_(1, 1.45), clac(1.2), 0.9)
    n = int(1.2 * SR); tt = np.arange(n) / SR
    poner(e, t_(1, 2.0), np.sin(2 * np.pi * 220 * tt) * np.exp(-tt * 2.5) * env_ad(n, 0.25, 0.3) * 0.25 + np.sin(2 * np.pi * 330 * tt) * np.exp(-tt * 3) * env_ad(n, 0.3, 0.3) * 0.15, 0.4)
    # 02 título
    poner(e, t_(2, 0.0), whoosh(1.2, 200, 4000), 0.5)
    poner(e, t_(2, 0.05), bombo(0.6), 0.7)
    # 04 entra el agua
    d = P[4]["fin"] - P[4]["ini"]
    poner(e, t_(4, 0.1), clic(), 0.5)
    poner(e, t_(4, 0.15), chorro(d, lambda t: np.ones_like(t)) * env_ad(int(d * SR), 0.3, 1.0) * 1.2, 0.6, -0.3)
    # agua pulverizada + bomba: niveles por plano (inicio, fin)
    niveles = {6: (0, 1), 7: (0.5, 0.5), 8: (0.5, 0.5), 9: (0.4, 0.2), 12: (1.2, 1.2), 15: (0.8, 0.8), 16: (0.9, 1.0), 17: (0.35, 0.35),
               19: (1, 1), 20: (0.3, 0.3), 24: (1.3, 1.3), 25: (0.25, 0.25), 26: (1.1, 1.1), 27: (0.45, 0.45)}
    for n_, (a, b) in niveles.items():
        d = P[n_]["fin"] - P[n_]["ini"]
        if n_ == 6:
            f = lambda t, d=d: np.clip((t - 0.3) / 1.2, 0, 1)
        else:
            f = lambda t, d=d, a=a, b=b: (a + (b - a) * t / d) * np.clip(t / 0.05, 0, 1) * np.clip((d - t) / 0.05, 0, 1)
        lento = 0.35 if n_ == 7 else 1.0
        x = chorro(d, f, 1.0)
        if n_ == 7: x = lp(x, 1500)  # cámara lenta: sonido grave y amortiguado
        poner(e, t_(n_), x * lento, 0.45)
        poner(e, t_(n_), bomba(d, f) * 0.5, 0.35)
    # 08/18 agua cayendo y desagüe
    d8 = P[8]["fin"] - P[8]["ini"]
    poner(e, t_(8), (lp(ruido(d8), 900) * 0.3 * mod_lento(int(d8 * SR), 3, 0.4) + salpicones(d8, 20, 0.5)), 0.4)
    poner(e, t_(18, 0.3), gorgoteo(P[18]["fin"] - P[18]["ini"] - 0.3), 0.6)
    # 09 bajada
    poner(e, t_(9, 0.0), whoosh(P[9]["fin"] - P[9]["ini"], 2500, 150, 1.0), 0.6)
    # sensor
    poner(e, t_(10, 0.4), pitido(1760, 0.1, 0.4), 0.5)
    poner(e, t_(10, 0.6), pitido(1760, 0.1, 0.4), 0.5)
    poner(e, t_(11, 1.0), pitido(330, 0.45, 0.6), 0.55)
    poner(e, t_(11, 1.6), pitido(330, 0.45, 0.6), 0.55)
    poner(e, t_(13, 1.0), ding(1568, 2.0), 0.6)
    # 14 panel
    poner(e, t_(14, 0.3), pitido(2093, 0.07, 0.4), 0.4)
    tb = next(g for g in TL["graf"] if g["slug"] == "tiempo_b")["a"]
    poner(e, tb + 0.1, pitido(2637, 0.07, 0.4), 0.4)
    # 15 cajetín
    poner(e, t_(15, 0.45), clac(0.6), 0.8, 0.3)
    poner(e, t_(15, 0.8), efervescencia(2.0), 0.5, 0.2)
    # 16 vapor
    poner(e, t_(16, 0.3), vapor_sss(P[16]["fin"] - P[16]["ini"]), 0.5)
    # 17 burbujas
    poner(e, t_(17, 0.2), efervescencia(P[17]["fin"] - P[17]["ini"]), 0.45)
    # 20 brillo
    poner(e, t_(20, 1.5), ding(2637, 1.2), 0.25)
    # 21 gotas
    for k in range(10):
        poner(e, t_(21, 0.5 + k * 0.5 + rng.random() * 0.3), pitido(900 + rng.random() * 900, 0.05, 0.2), 0.25, rng.random() - 0.5)
    # 22 puerta automática
    poner(e, t_(22, 0.6), clic(), 0.7)
    poner(e, t_(22, 1.0), vapor_sss(3.5, 0.8), 0.5)
    # 23 iconos
    for k in range(5):
        poner(e, t_(23, k * 0.55 + 0.05), pitido(1568 + k * 196, 0.07, 0.35), 0.4)
    # 26 «ding» del sensor (modo Auto)
    ta = next(g for g in TL["graf"] if g["slug"] == "modo_auto")["a"]
    poner(e, ta + 0.4, ding(1760, 1.2), 0.35)
    # 28 grifo · 29 rascar
    poner(e, t_(28, 0.0), grifo(P[28]["fin"] - P[28]["ini"]), 0.5, -0.2)
    poner(e, t_(29, 0.4), rascar(1.6), 0.45)
    for k in range(6):
        poner(e, t_(29, 0.9 + k * 0.3), clac(0.15) * 0.5, 0.3)
    # 30 final
    poner(e, t_(30, 0.35), clic(), 0.7)
    poner(e, t_(30, 0.6), vapor_sss(4.0, 1.0), 0.55)
    poner(e, t_(30, 0.8), whoosh(1.6, 400, 2500), 0.4)
    poner(e, P[30]["fin"] - 2.6, ding(1318, 2.5), 0.4)
    poner(e, P[30]["fin"] - 2.6, ding(1975, 2.5), 0.25)
    return e


def main():
    voz, sr = sf.read(os.path.join(AQUI, "voz", "narracion.wav"))
    voz = resample_poly(voz, SR, sr)
    v = np.zeros(N); v[: min(N, len(voz))] = voz[:N]
    # ecualización suave de la voz: quita graves, un poco de presencia
    v = hp(v, 90) + bp(v, 2500, 5000) * 0.25
    mus = musica(); efx = efectos()
    # ducking según la envolvente de la voz
    envv = np.sqrt(np.maximum(lp(v ** 2, 6), 0))
    envv = envv / (envv.max() + 1e-9)
    duck = 1 - 0.55 * np.clip(envv * 6, 0, 1)
    duck = lp(duck, 4)
    mezcla = np.zeros((N, 2))
    mezcla += np.stack([v, v], 1) * 1.0
    mezcla += mus * duck[:, None] * 0.55
    mezcla += efx * (0.55 + 0.45 * duck)[:, None]
    # fundido final
    nf = int(1.2 * SR); mezcla[-nf:] *= np.linspace(1, 0, nf)[:, None]
    mezcla /= np.abs(mezcla).max() + 1e-9
    mezcla *= 0.89
    sf.write(os.path.join(AQUI, "mezcla.wav"), mezcla.astype(np.float32), SR)
    sf.write(os.path.join(AQUI, "musica_efectos.wav"), ((mus * 0.55 + efx * 0.8) / (np.abs(mus * 0.55 + efx * 0.8).max() + 1e-9) * 0.8).astype(np.float32), SR)
    print("ok", round(N / SR, 2), "s")


if __name__ == "__main__":
    main()
