# -*- coding: utf-8 -*-
"""Estimación de duración de la locución y línea de tiempo de los planos."""
import math
import re

RATE = 5.9          # sílabas por segundo (narrador divulgativo con energía)
LEAD = 0.3          # la voz entra 0,3 s después del corte
TAIL = 0.5          # respiro tras la frase antes del siguiente corte
MIN_PLANO = 2.5

FUERTES = set("aeoáéó")
DEBILES_ACENT = set("íú")
VOCALES = "aeiouáéíóúü"


def silabas_palabra(p):
    p = p.lower()
    p = re.sub(r"y$", "i", p)          # «hay», «muy», «y»
    n = 0
    for grupo in re.findall(f"[{VOCALES}]+", p):
        n += 1
        for a, b in zip(grupo, grupo[1:]):
            if (a in FUERTES and b in FUERTES) or a in DEBILES_ACENT or b in DEBILES_ACENT:
                n += 1                  # hiato
    return max(n, 1) if re.search(f"[a-zñ{VOCALES}]", p) else 0


def silabas(texto):
    return sum(silabas_palabra(w) for w in re.findall(r"[\wáéíóúüñ]+", texto))


def pausas(texto):
    t = texto.strip()
    t = re.sub(r"[.?!…]+$", "", t)      # la puntuación final no suma pausa
    t = t.lstrip(".")                   # «...así que» al principio
    s = 0.0
    s += 0.5 * len(re.findall(r"\.\.\.|…", t))
    t2 = re.sub(r"\.\.\.|…", "", t)
    s += 0.35 * len(re.findall(r"[.?!]", t2))
    s += 0.3 * len(re.findall(r"[:;]", t2))
    s += 0.18 * len(re.findall(r",", t2))
    return s


def dur_voz(texto):
    return silabas(texto) / RATE + pausas(texto)


def redondea(x):
    return math.ceil(x * 10 - 1e-9) / 10


def linea_de_tiempo(planos):
    t = 0.0
    out = []
    for p in planos:
        if p.get("vo"):
            d = dur_voz(p["vo"])
            L = max(MIN_PLANO, redondea(LEAD + d + TAIL + (1.0 if p is planos[-1] else 0)))
            vo_ini, vo_fin = t + LEAD, t + LEAD + d
        else:
            d = 0
            L = p.get("dur", 3)
            vo_ini = vo_fin = None
        out.append(dict(ini=t, fin=t + L, dur=L, voz=d, vo_ini=vo_ini, vo_fin=vo_fin))
        t += L
    return out


def mmss(t):
    t = int(round(t))
    return f"{t // 60}:{t % 60:02d}"


if __name__ == "__main__":
    from datos import PLANOS
    tl = linea_de_tiempo(PLANOS)
    for i, (p, x) in enumerate(zip(PLANOS, tl), 1):
        print(f"{i:02d} {mmss(x['ini'])}-{mmss(x['fin'])} plano {x['dur']:4.1f}s voz {x['voz']:4.1f}s  {p['lugar']}")
    print("TOTAL", mmss(tl[-1]["fin"]), tl[-1]["fin"])
