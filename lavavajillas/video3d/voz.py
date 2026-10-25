# -*- coding: utf-8 -*-
"""Genera la locución con Kokoro (voz em_alex) y la línea de tiempo real del vídeo 3D.

Uso: python voz.py [velocidad]   (con kokoro-onnx instalado y el modelo en ./tts o en $KOKORO_DIR)
Salida: voz/NN.wav, voz/narracion.wav y timeline.json
"""
import json
import os
import re
import sys

import numpy as np
import soundfile as sf

AQUI = os.path.dirname(os.path.abspath(__file__))
GEN = os.path.join(AQUI, "..", "_fuente")
TTS = os.environ.get("KOKORO_DIR", os.path.join(AQUI, "tts"))
sys.path.insert(0, GEN)

from datos import PLANOS  # noqa: E402
from generar import GRAF, trozos, dos_lineas  # noqa: E402  (numeración de gráficos y cortes de subtítulos)
from tiempos import silabas, pausas  # noqa: E402
from kokoro_onnx import Kokoro  # noqa: E402

VOZ = "em_alex"
SR = 24000
LEAD, TAIL, FINAL_EXTRA = 0.35, 0.45, 1.6
LIMITE = 178.5

# Gráficos que entran a mitad de la frase (palabra clave) y si sustituyen al anterior
ENTRA_EN = {
    "tiempo_b": ("no mira", True),
    "modo_auto": ("Y Auto", True),
    "cuatro_cartas": ("Juegan", False),
    "condensacion": ("el vapor", False),
    "eco_energia": ("calienta menos", False),
    "consejo_porque": ("Si el agua", False),
    "final": ("¿Qué aparato", False),
}
SOLO_DESDE_CLAVE = {"final"}       # el único gráfico del plano, pero no desde el principio


def texto_tts(t):
    return t.lstrip(".").strip()


def recorta(a, umbral=0.012):
    idx = np.where(np.abs(a) > umbral)[0]
    if len(idx) == 0:
        return a
    i0 = max(0, idx[0] - int(0.03 * SR))
    i1 = min(len(a), idx[-1] + int(0.08 * SR))
    return a[i0:i1]


def peso(t):
    return silabas(t) + 5.9 * pausas(t)


def tiempo_clave(vo, clave, ini, dur):
    i = vo.find(clave)
    assert i >= 0, (vo, clave)
    return ini + dur * peso(vo[:i]) / max(peso(vo), 1e-6)


def main():
    k = Kokoro(os.path.join(TTS, "kokoro-v1.0.onnx"), os.path.join(TTS, "voices-v1.0.bin"))
    os.makedirs(os.path.join(AQUI, "voz"), exist_ok=True)
    speed = float(sys.argv[1]) if len(sys.argv) > 1 else 1.12
    while True:
        audios = []
        for n, p in enumerate(PLANOS, 1):
            a, sr = k.create(texto_tts(p["vo"]), voice=VOZ, speed=speed, lang="es")
            assert sr == SR
            audios.append(recorta(a))
        total = sum(LEAD + len(a) / SR + TAIL for a in audios) + FINAL_EXTRA
        print(f"speed {speed:.2f} → {total:.1f} s", flush=True)
        if total <= LIMITE or speed >= 1.24:
            break
        speed += 0.04

    t = 0.0
    planos, subs, graf = [], [], []
    narr = np.zeros(int((total + 1) * SR), dtype=np.float32)
    for n, (p, a) in enumerate(zip(PLANOS, audios), 1):
        d = len(a) / SR
        L = LEAD + d + TAIL + (FINAL_EXTRA if n == len(PLANOS) else 0)
        vi, vf = t + LEAD, t + LEAD + d
        sf.write(os.path.join(AQUI, "voz", f"{n:02d}.wav"), a, SR)
        i0 = int(vi * SR)
        narr[i0:i0 + len(a)] += a
        planos.append(dict(n=n, lugar=p["lugar"], ini=round(t, 3), fin=round(t + L, 3),
                           vo_ini=round(vi, 3), vo_fin=round(vf, 3)))
        # subtítulos
        ts = trozos(p["vo"])
        pesos = [max(peso(x), 1) for x in ts]
        acc = vi
        for x, w in zip(ts, pesos):
            b = acc + d * w / sum(pesos)
            subs.append(dict(a=round(acc, 3), b=round(b + 0.12, 3), texto=dos_lineas(x)))
            acc = b
        # gráficos del plano
        gs = [g for g in GRAF if g[3] == n]
        for j, (f, slug, desc, _) in enumerate(gs):
            a_ini, b_fin = t + 0.25, t + L - 0.05
            if slug in ENTRA_EN:
                clave, sustituye = ENTRA_EN[slug]
                tc = tiempo_clave(p["vo"], clave, vi, d)
                a_ini = tc - 0.1
                if sustituye and graf:
                    graf[-1]["b"] = round(a_ini + 0.15, 3)
            graf.append(dict(file=f, slug=slug, a=round(a_ini, 3), b=round(b_fin, 3)))
        t += L
    for i in range(len(subs) - 1):
        subs[i]["b"] = min(subs[i]["b"], subs[i + 1]["a"])
    narr = narr[: int(t * SR)]
    sf.write(os.path.join(AQUI, "voz", "narracion.wav"), narr, SR)
    with open(os.path.join(AQUI, "timeline.json"), "w", encoding="utf-8") as fh:
        json.dump(dict(total=round(t, 3), fps=30, speed=speed, planos=planos, subs=subs, graf=graf), fh,
                  ensure_ascii=False, indent=1)
    print("TOTAL", round(t, 2), "s")
    for p in planos:
        print(f"{p['n']:02d} {p['ini']:7.2f}-{p['fin']:7.2f} ({p['fin'] - p['ini']:.2f}) {p['lugar']}")


if __name__ == "__main__":
    main()
