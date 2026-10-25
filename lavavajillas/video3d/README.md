# Vídeo 3D · cómo se genera

El vídeo `../dentro_del_lavavajillas_3d.mp4` se genera entero con código: una escena 3D (Three.js) que se dibuja fotograma a fotograma en un Chromium sin pantalla, una voz sintética, música y efectos generados, y un montaje con ffmpeg.

| Archivo | Qué hace |
|---|---|
| `js/modelo.js` | El lavavajillas por dentro: cuba de acero, cestas, platos con manchas, copas, tazas, brazos aspersores, filtro, cajetín, puerta y luces. |
| `js/agua.js` | Chorros de los brazos (gotas + estelas), salpicaduras, goteo, niebla, vapor, condensación, burbujas y restos de comida. Todo depende solo del tiempo, así que cada fotograma se puede dibujar suelto. |
| `js/rigs.js` | Decorados aparte: descalcificador, sensor de turbidez (bajo el sumidero), frontal con el panel de noche y cocina con fregadero y cubo. |
| `js/planos.js` | Los 30 planos: cámara, brazos, agua, luces y efectos de cada uno. |
| `js/main.js` | Monta la escena y expone `window.renderAt(t)`. |
| `timeline.json` | Inicio y fin de cada plano, de cada frase, de cada subtítulo y de cada gráfico (sale de `voz.py`). |
| `voz.py` | Genera la locución con Kokoro (voz `em_alex`, castellano) y calcula `timeline.json` a partir de su duración real. |
| `render.js` | Renderiza planos a clips MP4 (`segs/seg_NN.mp4`). |
| `audio.py` | Música ambiental, efectos y mezcla con la voz (`mezcla.wav`). |
| `montaje.py` | Junta los clips, escala a 1080×1920, añade los gráficos de `../graficos/` con fundido, quema los subtítulos y pone el sonido. |

## Volver a generarlo

```bash
npm install                                   # three.js
python voz.py 1.0                             # locución + timeline.json (necesita kokoro-onnx y su modelo)
python -m http.server 8765 --bind 127.0.0.1 & # sirve index.html
node render.js 24 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30
python audio.py
python montaje.py ../dentro_del_lavavajillas_3d.mp4
```

Para cambiar un plano, edita `js/planos.js`, vuelve a renderizar solo ese plano (`node render.js 24 17`) y repite el montaje. Para revisar un instante concreto sin renderizarlo todo, abre `http://127.0.0.1:8765/index.html` y llama a `renderAt(segundos)` desde la consola.

Para usar otra voz (p. ej. la de ElevenLabs): pon cada frase en `voz/NN.wav`, ajusta `timeline.json` si cambian las duraciones y vuelve a ejecutar `audio.py` y `montaje.py`.
