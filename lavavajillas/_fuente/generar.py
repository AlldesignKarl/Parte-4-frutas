# -*- coding: utf-8 -*-
"""Genera GUION, PLANOS, VOCES, FICHAS, README y el .srt de «Dentro del lavavajillas»."""
import json
import os
import re
import sys

from datos import (ANIM, ESCENAS, NEGATIVO, PLANOS, PREFIJO_AUDIO, SUBTITULO, TITULO)
from tiempos import dur_voz, linea_de_tiempo, mmss

OUT = sys.argv[1] if __name__ == "__main__" else None
TL = linea_de_tiempo(PLANOS)
TOTAL = TL[-1]["fin"]

# ---------------------------------------------------------------------------
# Gráficos: numeración G01… en orden de aparición
# ---------------------------------------------------------------------------
GRAF = []          # (archivo, slug, desc, plano)
for n, p in enumerate(PLANOS, 1):
    files = []
    for slug, desc in p["graf"]:
        f = f"G{len(GRAF) + 1:02d}_{slug}.png"
        GRAF.append((f, slug, desc, n))
        files.append((f, desc))
    p["graf_files"] = files


def fmt_s(x):
    s = f"{x:.1f}".rstrip("0").rstrip(".")
    return s.replace(".", ",") if False else s


def srt_t(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


# ---------------------------------------------------------------------------
# Subtítulos
# ---------------------------------------------------------------------------
def trozos(texto, maxc=80):
    partes = re.split(r"(?<=[.?!:;…])\s+(?=\S)", texto.strip())
    out = []
    for parte in partes:
        if len(parte) > maxc:                       # demasiado largo: corta por comas
            sub = re.split(r"(?<=,)\s+", parte)
            out.extend(sub)
        else:
            out.append(parte)
    # junta trozos pequeños mientras quepan
    res = []
    for o in out:
        if res and len(res[-1]) + 1 + len(o) <= maxc:
            res[-1] = res[-1] + " " + o
        else:
            res.append(o)
    return res


def dos_lineas(t, maxl=40):
    if len(t) <= maxl:
        return t
    mejor = None
    for m in re.finditer(" ", t):
        i = m.start()
        a, b = t[:i], t[i + 1:]
        coste = max(len(a), len(b)) + (0 if re.search(r"[,.:;?!]$", a) else 6) + (50 if max(len(a), len(b)) > 42 else 0)
        if mejor is None or coste < mejor[0]:
            mejor = (coste, a, b)
    return mejor[1] + "\n" + mejor[2]


def srt():
    cues = []
    for p, x in zip(PLANOS, TL):
        if not p.get("vo"):
            continue
        ts = trozos(p["vo"])
        pesos = [max(dur_voz(t), 0.3) for t in ts]
        tot = sum(pesos)
        t0 = x["vo_ini"]
        span = x["vo_fin"] - x["vo_ini"]
        for t, w in zip(ts, pesos):
            t1 = t0 + span * w / tot
            cues.append((t0, t1 + 0.15, dos_lineas(t)))
            t0 = t1
    # sin solapes
    fixed = []
    for i, (a, b, t) in enumerate(cues):
        if i + 1 < len(cues):
            b = min(b, cues[i + 1][0])
        fixed.append((a, b, t))
    out = []
    for i, (a, b, t) in enumerate(fixed, 1):
        out.append(f"{i}\n{srt_t(a)} --> {srt_t(b)}\n{t}\n")
    return "\n".join(out)


# ---------------------------------------------------------------------------
# PLANOS.md
# ---------------------------------------------------------------------------
def planos_md():
    L = []
    L.append(f"# {TITULO} · {SUBTITULO}\n")
    L.append(f"## Storyboard y prompts plano a plano · {len(PLANOS)} planos · duración total ≈ {mmss(TOTAL)}\n")
    L.append("Cómo usar este archivo:")
    L.append("1. **Prompt de imagen** → pégalo en tu generador de imágenes (Midjourney, Nano Banana / Gemini, Flux, Leonardo, "
             "Ideogram…). Sube las **imágenes de referencia** de `FICHAS.md` para que el lavavajillas, la vajilla y el sensor "
             "salgan siempre iguales. El `--ar 9:16` es para Midjourney; en las demás elige formato vertical 9:16.")
    L.append("2. **Prompt de animación** → sube la imagen generada a Kling, Hailuo, Veo, Runway o similar (imagen → vídeo) y pega "
             "este texto. Si usas **texto → vídeo** (Veo 3, Sora, Kling), pega el prompt de imagen seguido del de animación.")
    L.append("3. **Gráfico en pantalla** → los textos NO los pide la IA (los escribe mal). Están ya hechos en la carpeta "
             "[`graficos/`](graficos/) como PNG transparentes de 1080×1920: ponlos encima del clip como *Superposición* en "
             "CapCut. Ya están colocados dentro de la zona segura de TikTok / Reels / Shorts.")
    L.append("4. Todo el vídeo va con **voz en off** del narrador (no hay lip-sync). Si la herramienta genera clips de 5 o 10 s, "
             "recórtalos a la duración indicada; si un clip se queda corto, ralentízalo un poco (0,8×) en el montaje.")
    L.append("5. Si en Veo u otra herramienta que genera audio sale alguien hablando, quita el audio del clip: la voz va aparte.\n")
    L.append("**Prompt negativo** (si tu herramienta lo admite):")
    L.append("```\n" + NEGATIVO + "\n```\n")
    L.append("**Truco de realismo:** pide siempre «macro lens», «high-speed camera» y gotas nítidas. Lo que delata a la IA es el "
             "agua «de plástico»: si sale así, vuelve a generar o baja la intensidad del movimiento. Mejor clips cortos y "
             "potentes que largos y raros.\n")
    L.append("---\n")
    for n, (p, x) in enumerate(zip(PLANOS, TL), 1):
        L.append(f"### Plano {n:02d} · {mmss(x['ini'])}–{mmss(x['fin'])} ({fmt_s(x['dur'])} s) · {p['lugar']}\n")
        L.append(f"**Qué pasa:** {p['que']}\n")
        if p["graf_files"]:
            if len(p["graf_files"]) == 1:
                f, d = p["graf_files"][0]
                L.append(f"**🧩 Gráfico en pantalla:** [`graficos/{f}`](graficos/{f}) — {d}\n")
            else:
                L.append("**🧩 Gráficos en pantalla:**")
                for f, d in p["graf_files"]:
                    L.append(f"- [`graficos/{f}`](graficos/{f}) — {d}")
                L.append("")
        L.append("**🖼️ Prompt de imagen:**")
        L.append("```\n" + p["img"] + "\n```\n")
        L.append("**🎬 Prompt de animación:**")
        L.append("```\n" + p["anim"] + "\n```\n")
        if p.get("vo"):
            L.append("**🗣️ Voz:**")
            L.append(f"- **Narrador** · voz en off · _{p['tono']}_: «{p['vo']}»\n")
        L.append(f"**🔊 Sonido:** {p['sonido']}\n")
        L.append("---\n")
    return "\n".join(L).rstrip("-\n") + "\n"


# ---------------------------------------------------------------------------
# GUION.md
# ---------------------------------------------------------------------------
SINOPSIS = ("Metemos la cámara dentro de un lavavajillas y vemos, desde dentro y en cámara superlenta, todo lo que pasa "
            "cuando cierras la puerta: el agua que entra y se ablanda, los brazos que giran solos, el filtro, la pastilla, "
            "las enzimas, el abrillantador y el secado. Y el gran protagonista: el **sensor de turbidez**, que mira el agua "
            "y decide si la vajilla sigue sucia (y sigue lavando) o ya está limpia (y pasa a la siguiente fase). Al final, "
            "los programas explicados en 30 segundos y un consejo que casi nadie conoce.")


def guion_md():
    L = [f"# {TITULO}", f"## {SUBTITULO}\n",
         f"**Duración:** ≈ {mmss(TOTAL)} · **Formato:** vertical 9:16 · **Género:** divulgación / «cómo funciona»\n",
         f"> {SINOPSIS}\n", "---\n"]
    esc_actual = None
    for n, (p, x) in enumerate(zip(PLANOS, TL), 1):
        if p["esc"] != esc_actual:
            esc_actual = p["esc"]
            a, b = ESCENAS[esc_actual]
            L.append(f"\n### {a} — {b}\n")
        L.append(f"*[{mmss(x['ini'])}] Plano {n:02d}.* {p['que']}\n")
        if p.get("vo"):
            L.append(f"**NARRADOR (V.O.)** _({p['tono']})_")
            L.append(f"> {p['vo']}\n")
    L.append("---\n")
    L.append("**FIN**")
    return "\n".join(L) + "\n"


# ---------------------------------------------------------------------------
# VOCES.md
# ---------------------------------------------------------------------------
def voces_md():
    L = [f"# Voces · {TITULO}\n",
         "Herramienta recomendada: **ElevenLabs** (modelo v3, el más expresivo). Todo el vídeo lo cuenta **un solo narrador** "
         "en off: crea la voz **una sola vez** con *Voice Design* y úsala en todas las frases para que suene siempre igual.\n",
         "- Las etiquetas entre corchetes (`[curious]`, `[excited]`…) son *audio tags* de ElevenLabs v3: déjalas, no se leen en "
         "voz alta. Si usas otra herramienta, usa la versión «texto limpio».",
         "- Exporta cada frase en MP3/WAV con el nombre de archivo indicado: así el montaje es muy fácil.",
         "- Los números van escritos con letra («setenta grados») para que la voz los lea bien.",
         "- Las frases marcadas con 🔗 **continúan en el plano siguiente** (empiezan o acaban con «…»). Para que suenen "
         "naturales, genéralas juntas en una sola toma y córtalas en el montaje.",
         f"- Duración pensada: ≈ {mmss(TOTAL)}. Si tu voz sale más lenta y el vídeo pasa de 3:00 (límite de Shorts/Reels), "
         "acelera la voz a 1,05–1,1× en CapCut.\n",
         "## La voz del narrador\n",
         "| Personaje | Cómo suena | Ajustes recomendados |",
         "|---|---|---|",
         "| **Narrador** (voz en off) | Castellano de España. Divulgador cercano y con energía, sonrisa en la voz, ritmo ágil de vídeo corto. Baja el ritmo en las frases clave. | Stability 45% · Similarity 80% · Style 35% |\n",
         "### Descripción para *Voice Design* (elige una y úsala siempre)\n",
         "**Opción A · hombre**",
         "```\nMale, early 30s, native Castilian Spanish accent from Spain. Friendly, energetic science communicator with a "
         "smile in his voice, clear diction, warm mid-low tone, fast-paced but easy to follow, like a popular science "
         "YouTuber. Natural, realistic, studio quality.\n```",
         "**Opción B · mujer**",
         "```\nFemale, early 30s, native Castilian Spanish accent from Spain. Friendly, energetic science communicator with a "
         "smile in her voice, clear diction, warm tone, fast-paced but easy to follow, like a popular science YouTuber. "
         "Natural, realistic, studio quality.\n```\n",
         "## Frases en orden de aparición\n"]
    n_voz = 0
    vo_planos = [(n, p, x) for n, (p, x) in enumerate(zip(PLANOS, TL), 1) if p.get("vo")]
    for idx, (n, p, x) in enumerate(vo_planos):
        n_voz += 1
        sigue = (p["vo"].rstrip().endswith(("...", ",", ":")) and idx + 1 < len(vo_planos))
        viene = p["vo"].lstrip().startswith(("...",)) or p["vo"][:1].islower()
        marca = " · 🔗 continúa en la siguiente" if sigue else (" · 🔗 viene de la anterior" if viene else "")
        L.append(f"### {n_voz:02d}. Narrador · plano {n:02d} · voz en off{marca}")
        L.append(f"Archivo: `{PREFIJO_AUDIO}_{n_voz:02d}_plano{n:02d}_NARRADOR.mp3` · Interpretación: {p['tono']} · "
                 f"Duración aprox.: {x['voz']:.1f} s\n")
        L.append("ElevenLabs v3:")
        L.append("```\n" + f"{p['tag']} {p['vo']}" + "\n```")
        L.append("Texto limpio:")
        L.append("```\n" + p["vo"] + "\n```\n")
    # locución completa
    L.append("## Toda la locución seguida (opcional)\n")
    L.append("Si prefieres generar la narración **de una sola vez** (suena más natural y con el mismo tono de principio a "
             "fin), pega este texto en ElevenLabs v3 y luego corta cada frase en CapCut siguiendo `PLANOS.md`. Si tu plan "
             "no admite tanto texto de golpe, hazlo en dos mitades (corta en «¿Y los programas?»).\n")
    bloque = []
    for n, p, x in vo_planos:
        bloque.append(f"{p['tag']} {p['vo']}")
    L.append("```\n" + "\n\n".join(bloque) + "\n```")
    return "\n".join(L) + "\n"


# ---------------------------------------------------------------------------
# FICHAS.md (referencias para que todo salga igual)
# ---------------------------------------------------------------------------
FICHAS = r"""# Fichas de referencia · DENTRO DEL LAVAVAJILLAS

Aquí no hay personajes: el «protagonista» es **el lavavajillas**. Para que el interior, la vajilla y el sensor salgan
iguales en todos los planos, **genera estas imágenes una sola vez**, quédate con las mejores y súbelas como
**imagen de referencia** cada vez que generes un plano de `PLANOS.md`.

Estilo visual: rodaje real, como si hubiéramos metido una cámara de cine estanca dentro de un lavavajillas funcionando.
Lente macro, cámara de alta velocidad (gotas congeladas y nítidas), acero inoxidable cepillado, luz LED blanca y fría con
un toque azul, niebla y vapor volumétricos. Nada de dibujos ni de CGI con aspecto de juguete. Sin textos ni marcas.

## 1 · El lavavajillas por dentro (la ficha principal)
- **Qué es:** el interior que se ve en casi todos los planos.
- **Cómo es:** cuba de acero inoxidable cepillado, cestas gris claro, platos blancos de porcelana abajo, copas de cristal
  y tazas azul oscuro arriba, brazos aspersores grises, filtro cilíndrico en el centro del fondo, cajetín del detergente
  en la cara interior de la puerta, tira de luz LED blanca arriba.

```
Reference image of the interior of a modern built-in dishwasher, door fully open, seen straight on: brushed stainless-steel tub, light-grey plastic racks, white porcelain plates standing in the lower rack, clear wine glasses and dark-blue ceramic mugs in the upper rack, a cutlery tray on top, a grey plastic spray arm under each rack, a cylindrical mesh filter in the center of the floor, the detergent dispenser on the inner side of the door, a cool white LED strip at the top. Photorealistic product photography, realistic brushed steel reflections, soft studio light, 8k, no text, no logos. --ar 16:9
```

## 2 · La vajilla sucia
- **Qué es:** el «reparto» de manchas. Siempre las mismas: yema de huevo, salsa de tomate, arroz pegado, cerco de café,
  pintalabios en una copa, una olla con salsa quemada.

```
Reference sheet of dirty dishes on a light grey background: a white porcelain plate with dried egg yolk, a white plate smeared with tomato sauce, a white bowl with stuck grains of rice, a dark-blue ceramic mug with a brown coffee ring inside, a clear wine glass with a lipstick mark, a stainless-steel pot with burnt-on sauce, realistic food textures, photorealistic macro product photography, soft even studio light, 8k, no text, no logos. --ar 16:9
```

## 3 · El fondo de la cuba: brazo aspersor y filtro
- **Qué es:** el «motor» de todo. Se usa en los planos del brazo que gira, del filtro y del desagüe.

```
Reference image, close-up of the bottom of a dishwasher tub: the grey plastic lower spray arm with its row of small angled nozzles, the central cylindrical fine stainless-steel mesh filter with its flat filter plate around it, the brushed stainless-steel floor with a shallow film of clear water, cool white LED light, photorealistic macro product photography, 8k, no text, no logos. --ar 16:9
```

## 4 · El sensor de turbidez (corte transversal)
- **Qué es:** la estrella del vídeo. Un canal de plástico transparente por el que pasa el agua; a un lado un LED
  infrarrojo (brillo rojo) y al otro un receptor negro sobre una placa verde. Siempre el mismo diseño en los 3 planos
  (normal, agua turbia, agua limpia).

```
Reference image, photorealistic macro cutaway of a dishwasher turbidity sensor next to the circulation pump: a small transparent plastic water channel, on one side a tiny infrared LED glowing deep red, on the other side a small black photodiode receiver on a green circuit board, a thin beam of light crossing the water between them, wet plastic details, engineering product visualization, studio light, shallow depth of field, 8k, no text, no logos. --ar 16:9
```

## 5 · El panel de mandos (por fuera)
- **Qué es:** el frontal que se ve en la cocina a oscuras y en el plano del dedo eligiendo programa. Pantalla **sin números**
  (los números los ponen los gráficos `G12`/`G13`).

```
Reference image of the front of a freestanding stainless-steel dishwasher in a dark modern kitchen at night: brushed steel door, a matte black control strip with a blank softly glowing display without digits and a row of minimal backlit white program icons without text, soft reflections, photorealistic product photography, 8k, no text, no logos. --ar 16:9
```

## 6 · La cocina
- **Qué es:** el único sitio «de fuera»: madera de roble claro, muebles blancos, luz natural de ventana (de día) o luz cálida
  bajo los muebles (de noche). Nunca se ven caras: solo manos.

```
Reference image of a modern bright kitchen with light oak wood countertops and white cabinets, a built-in dishwasher with its door open and loaded racks, a stainless-steel sink and tap, soft natural window light, photorealistic interior photography, 35mm film look, 8k, no text, no logos, no people. --ar 16:9
```
"""


# ---------------------------------------------------------------------------
# README.md
# ---------------------------------------------------------------------------
def readme_md():
    graf_list = "\n".join(f"| [`{f}`](graficos/{f}) | {n:02d} | {d} |" for f, s, d, n in GRAF)
    return f"""# {TITULO} — {SUBTITULO}

Vídeo divulgativo realista: metemos la cámara **dentro de un lavavajillas** para ver cómo lava de verdad. Formato vertical 9:16 · **≈ {mmss(TOTAL)}** · {len(PLANOS)} planos · un narrador en off.

## Sinopsis

{SINOPSIS}

## Lo que se explica

1. **El agua entra y se ablanda:** el descalcificador (resina + sal) y por qué solo usa 3–4 litros que se reciclan.
2. **Prelavado:** la bomba, los brazos aspersores que giran solos por reacción y el filtro.
3. **El sensor de turbidez:** una luz atraviesa el agua; si sale turbia, a la vajilla le queda suciedad y **sigue lavando** (cambia el agua, calienta más o alarga el lavado y vuelve a medir); si sale limpia, **pasa a la siguiente fase** sin gastar de más. Por eso el programa Auto no dura siempre lo mismo.
4. **Lavado principal:** el cajetín, el agua a 40–70 °C, las enzimas (proteínas y almidón) y el oxígeno activo.
5. **Desagüe y aclarado:** la bomba de desagüe y el abrillantador (el agua resbala en lámina, sin gotas ni manchas).
6. **Secado:** condensación en las paredes, zeolita y apertura automática de la puerta.
7. **Los programas:** las 4 cartas (química, calor, tiempo y fuerza) · Intensivo · Delicado · Rápido · Auto · Eco (y por qué tarda más pero gasta menos).
8. **El consejo:** no aclares los platos antes: el sensor ve agua limpia y lava más flojo. Rasca los restos a la basura.

## 🎬 El vídeo ya hecho (3D)

**[`dentro_del_lavavajillas_3d.mp4`](dentro_del_lavavajillas_3d.mp4)**: versión completa renderizada en 3D, lista para ver y publicar. Vertical 1080×1920 · 24 fps · ≈ 2:40. La cámara va **dentro del lavavajillas**: se ven los brazos aspersores girando y lanzando chorros, el filtro, el descalcificador, el **sensor de turbidez por dentro** (agua turbia → sigue lavando; agua limpia → siguiente fase), el cajetín, el vapor, el secado y los programas, con los gráficos y subtítulos ya puestos, música y efectos.

- La locución es una **voz sintética de prueba** (castellano). Para la versión buena, genera la voz con ElevenLabs siguiendo [`VOCES.md`](VOCES.md) y sustitúyela en CapCut (el texto es el mismo).
- El código que lo genera está en [`video3d/`](video3d/) por si hay que cambiar algo y volver a renderizar.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| [`dentro_del_lavavajillas_3d.mp4`](dentro_del_lavavajillas_3d.mp4) | El vídeo 3D ya montado (con voz de prueba, música, efectos, gráficos y subtítulos). |
| [`GUION.md`](GUION.md) | La narración completa, escena a escena, con tiempos. |
| [`PLANOS.md`](PLANOS.md) | Storyboard plano a plano con **prompt de imagen**, **prompt de animación**, gráfico, voz y sonido. |
| [`VOCES.md`](VOCES.md) | La voz del narrador para ElevenLabs y todas las frases listas para generar (también la locución entera de una vez). |
| [`subtitulos_lavavajillas.srt`](subtitulos_lavavajillas.srt) | Subtítulos sincronizados; impórtalos en CapCut. |
| [`FICHAS.md`](FICHAS.md) | Imágenes de referencia (interior, vajilla, sensor, panel, cocina) para que todo salga siempre igual. |
| [`graficos/`](graficos/) | {len(GRAF)} gráficos PNG transparentes 1080×1920 con todos los textos y esquemas, listos para superponer. |
| [`graficos/_vista_previa.jpg`](graficos/_vista_previa.jpg) | Hoja de contactos para ver todos los gráficos de un vistazo. |
| [`graficos/_fuente/`](graficos/_fuente/) | El diseño de los gráficos (HTML) por si hay que cambiar algún texto y volver a exportarlos. |
| [`video3d/`](video3d/) | El código del vídeo 3D (escena, planos, voz, sonido y montaje) para volver a renderizarlo. |
| [`_fuente/`](_fuente/) | Los datos de los planos y el script que genera estos documentos y el `.srt`. |

## Cómo producir la versión realista con IA (paso a paso)

Si quieres una versión con imagen fotorrealista (Veo, Kling…), aquí tienes todo el kit:

1. **Fichas** (solo la primera vez): genera las imágenes de `FICHAS.md` y guarda las mejores.
2. **Imágenes**: genera la imagen de cada plano de `PLANOS.md` subiendo las fichas como referencia.
3. **Voz**: crea la voz del narrador en ElevenLabs con *Voice Design* y genera las frases de `VOCES.md` (o la locución entera de una vez).
4. **Animación**: pasa cada imagen a vídeo (Kling, Hailuo, Veo, Runway…) con su prompt de animación.
5. **Montaje** (CapCut): ordena los clips, pon la voz, importa el `.srt`, añade cada **gráfico** de `graficos/` como *Superposición* en su plano (con una animación de entrada suave, p. ej. «Desvanecer» o «Deslizar hacia arriba»), mete efectos de sonido y música, y exporta en 1080×1920, 30 fps.

> **Subtítulos y gráficos:** los gráficos ocupan la parte central-alta de la pantalla; coloca los subtítulos en la parte baja (por encima de la zona de la descripción) para que no se pisen.

## Gráficos en pantalla

| Archivo | Plano | Qué pone |
|---|---|---|
{graf_list}

## Música

Electrónica ambiental limpia, tipo documental de ciencia: pulso suave con texturas de agua y burbujas. Arranca casi en silencio cuando se cierra la puerta, sube con el primer chorro y baja a un pulso grave misterioso al llegar al sensor. Cuando el agua sale limpia, «ding» y vuelve con fuerza. En el secado, casi silencio con gotas. En los programas, ritmo más alegre y un remate final cuando se abre la puerta.

## Rigor

Todo lo que se cuenta es cómo funcionan los lavavajillas domésticos actuales. Las cifras (3–4 litros por llenado, 40–70 °C, menos de 1 h el Rápido, 3–4 h el Eco) son las **típicas**: cambian según la marca y el modelo, por eso la narración dice «unos», «según el programa» y «muchos llevan» (el sensor de turbidez viene en los modelos con programa automático, no en todos).

## Texto para publicar

```
¿Qué pasa DENTRO de tu lavavajillas cuando cierras la puerta? 🫧🍽️
Spoiler: tiene un sensor que MIRA el agua y decide si tu vajilla sigue sucia 👀
(y por eso nunca deberías aclarar los platos antes 😅)

#lavavajillas #comofunciona #ciencia #curiosidades #trucosdecasa #limpieza #sabiasque #parati
```
"""


def main():
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, "PLANOS.md"), "w", encoding="utf-8") as f:
        f.write(planos_md())
    with open(os.path.join(OUT, "GUION.md"), "w", encoding="utf-8") as f:
        f.write(guion_md())
    with open(os.path.join(OUT, "VOCES.md"), "w", encoding="utf-8") as f:
        f.write(voces_md())
    with open(os.path.join(OUT, "FICHAS.md"), "w", encoding="utf-8") as f:
        f.write(FICHAS)
    with open(os.path.join(OUT, "README.md"), "w", encoding="utf-8") as f:
        f.write(readme_md())
    with open(os.path.join(OUT, "subtitulos_lavavajillas.srt"), "w", encoding="utf-8") as f:
        f.write(srt())
    with open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "graficos.json"), "w", encoding="utf-8") as f:
        json.dump([dict(file=a, slug=b, desc=c, plano=d) for a, b, c, d in GRAF], f, ensure_ascii=False, indent=1)
    print("total", mmss(TOTAL), "graficos", len(GRAF))


if __name__ == "__main__":
    main()
