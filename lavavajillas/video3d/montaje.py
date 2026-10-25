# -*- coding: utf-8 -*-
"""Montaje final: clips 3D + gráficos animados + subtítulos + sonido → MP4 1080×1920.
Uso: python3 montaje.py salida.mp4 [desde hasta]   (los planos que falten salen en negro)
"""
import json
import os
import subprocess
import sys

AQUI = os.path.dirname(os.path.abspath(__file__))
GRAF_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "graficos")
TL = json.load(open(os.path.join(AQUI, "timeline.json"), encoding="utf-8"))
FPS = 24
OUT = sys.argv[1]
T0 = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
T1 = float(sys.argv[3]) if len(sys.argv) > 3 else TL["total"]


def ass_t(t):
    t = max(0.0, t)
    h = int(t // 3600); m = int(t % 3600 // 60); s = t % 60
    return f"{h}:{m:02d}:{s:05.2f}"


def escribe_ass(path):
    cab = """[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 2
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Sub,Inter Display,66,&H00FFFFFF,&H00FFFFFF,&H00140A05,&H96000000,-1,0,0,0,100,100,0,0,1,5,3,2,80,80,420,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lineas = []
    for s in TL["subs"]:
        a, b = s["a"] - T0, s["b"] - T0
        if b <= 0 or a >= T1 - T0:
            continue
        txt = s["texto"].replace("\n", "\\N")
        lineas.append(f"Dialogue: 0,{ass_t(a)},{ass_t(b)},Sub,,0,0,0,,{{\\fad(70,60)\\fscx94\\fscy94\\t(0,140,\\fscx100\\fscy100)}}{txt}")
    open(path, "w", encoding="utf-8").write(cab + "\n".join(lineas) + "\n")


def main():
    tmp = os.path.join(AQUI, "tmp_montaje"); os.makedirs(tmp, exist_ok=True)
    # 1) base: clips en orden (negro si falta alguno)
    lista = []
    for p in TL["planos"]:
        if p["fin"] <= T0 or p["ini"] >= T1:
            continue
        seg = os.path.join(AQUI, "segs", f"seg_{p['n']:02d}.mp4")
        f0 = int(-(-p["ini"] * FPS // 1)); f1 = round(TL["total"] * FPS) if p["n"] == len(TL["planos"]) else int(-(-p["fin"] * FPS // 1))
        if not os.path.exists(seg):
            seg = os.path.join(tmp, f"negro_{p['n']:02d}.mp4")
            subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"color=c=0x0b0f14:s=576x1024:r={FPS}",
                            "-frames:v", str(f1 - f0), "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", seg], check=True)
        lista.append(f"file '{seg}'")
    open(os.path.join(tmp, "lista.txt"), "w").write("\n".join(lista) + "\n")
    base = os.path.join(tmp, "base.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", os.path.join(tmp, "lista.txt"), "-c", "copy", base], check=True)
    ini_base = min(p["ini"] for p in TL["planos"] if p["fin"] > T0 and p["ini"] < T1)
    off = T0 - ini_base  # recorte dentro de la base
    ini_base_frames = int(-(-ini_base * FPS // 1)) / FPS
    off = T0 - ini_base_frames

    # 2) subtítulos
    ass = os.path.join(tmp, "subs.ass"); escribe_ass(ass)

    # 3) gráficos con fundido y pequeño deslizamiento
    entradas = ["-ss", f"{max(0, off):.3f}", "-t", f"{T1 - T0:.3f}", "-i", base]
    filtros = [f"[0:v]scale=1080:1920:flags=lanczos,unsharp=5:5:0.55:5:5:0,eq=contrast=1.05:saturation=1.07:gamma=0.98,"
               f"vignette=angle=0.55,noise=alls=4:allf=t,setpts=PTS-STARTPTS,format=yuv420p[v0]"]
    k = 0
    for g in TL["graf"]:
        a, b = g["a"] - T0, g["b"] - T0
        if b <= 0 or a >= T1 - T0:
            continue
        a = max(a, 0); dur = b - a
        entradas += ["-loop", "1", "-framerate", str(FPS), "-t", f"{dur:.3f}", "-i", os.path.join(GRAF_DIR, g["file"])]
        i = len([x for x in entradas if x == "-i"]) - 1
        filtros.append(f"[{i}:v]format=rgba,fade=t=in:st=0:d=0.28:alpha=1,fade=t=out:st={max(0, dur - 0.25):.3f}:d=0.25:alpha=1,setpts=PTS-STARTPTS+{a:.3f}/TB[g{k}]")
        filtros.append(f"[v{k}][g{k}]overlay=x=0:y='26*pow(max(0\\,1-(t-{a:.3f})/0.35)\\,2)':eof_action=pass:format=auto[v{k + 1}]")
        k += 1
    filtros.append(f"[v{k}]ass='{ass}':fontsdir=/usr/share/fonts,format=yuv420p[vout]")
    audio = os.path.join(AQUI, "mezcla.wav")
    entradas += ["-ss", f"{T0:.3f}", "-t", f"{T1 - T0:.3f}", "-i", audio]
    ia = len([x for x in entradas if x == "-i"]) - 1
    filtros.append(f"[{ia}:a]loudnorm=I=-14:TP=-1.2:LRA=11,aresample=48000[aout]")
    fc = os.path.join(tmp, "filtros.txt"); open(fc, "w").write(";\n".join(filtros))
    cmd = ["ffmpeg", "-y", "-loglevel", "error"] + entradas + ["-filter_complex_script", fc, "-map", "[vout]", "-map", "[aout]",
           "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-maxrate", "2600k", "-bufsize", "5200k", "-profile:v", "high", "-pix_fmt", "yuv420p", "-r", str(FPS),
           "-c:a", "aac", "-b:a", "192k", "-movflags", "+faststart", "-shortest", OUT]
    subprocess.run(cmd, check=True)
    print("listo:", OUT)


if __name__ == "__main__":
    main()
