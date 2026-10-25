# DENTRO DEL LAVAVAJILLAS — Así lava de verdad

Vídeo divulgativo realista: metemos la cámara **dentro de un lavavajillas** para ver cómo lava de verdad. Formato vertical 9:16 · **≈ 2:59** · 30 planos · un narrador en off.

## Sinopsis

Metemos la cámara dentro de un lavavajillas y vemos, desde dentro y en cámara superlenta, todo lo que pasa cuando cierras la puerta: el agua que entra y se ablanda, los brazos que giran solos, el filtro, la pastilla, las enzimas, el abrillantador y el secado. Y el gran protagonista: el **sensor de turbidez**, que mira el agua y decide si la vajilla sigue sucia (y sigue lavando) o ya está limpia (y pasa a la siguiente fase). Al final, los programas explicados en 30 segundos y un consejo que casi nadie conoce.

## Lo que se explica

1. **El agua entra y se ablanda:** el descalcificador (resina + sal) y por qué solo usa 3–4 litros que se reciclan.
2. **Prelavado:** la bomba, los brazos aspersores que giran solos por reacción y el filtro.
3. **El sensor de turbidez:** una luz atraviesa el agua; si sale turbia, a la vajilla le queda suciedad y **sigue lavando** (cambia el agua, calienta más o alarga el lavado y vuelve a medir); si sale limpia, **pasa a la siguiente fase** sin gastar de más. Por eso el programa Auto no dura siempre lo mismo.
4. **Lavado principal:** el cajetín, el agua a 40–70 °C, las enzimas (proteínas y almidón) y el oxígeno activo.
5. **Desagüe y aclarado:** la bomba de desagüe y el abrillantador (el agua resbala en lámina, sin gotas ni manchas).
6. **Secado:** condensación en las paredes, zeolita y apertura automática de la puerta.
7. **Los programas:** las 4 cartas (química, calor, tiempo y fuerza) · Intensivo · Delicado · Rápido · Auto · Eco (y por qué tarda más pero gasta menos).
8. **El consejo:** no aclares los platos antes: el sensor ve agua limpia y lava más flojo. Rasca los restos a la basura.

## Archivos

| Archivo | Para qué sirve |
|---|---|
| [`GUION.md`](GUION.md) | La narración completa, escena a escena, con tiempos. |
| [`PLANOS.md`](PLANOS.md) | Storyboard plano a plano con **prompt de imagen**, **prompt de animación**, gráfico, voz y sonido. |
| [`VOCES.md`](VOCES.md) | La voz del narrador para ElevenLabs y todas las frases listas para generar (también la locución entera de una vez). |
| [`subtitulos_lavavajillas.srt`](subtitulos_lavavajillas.srt) | Subtítulos sincronizados; impórtalos en CapCut. |
| [`FICHAS.md`](FICHAS.md) | Imágenes de referencia (interior, vajilla, sensor, panel, cocina) para que todo salga siempre igual. |
| [`graficos/`](graficos/) | 34 gráficos PNG transparentes 1080×1920 con todos los textos y esquemas, listos para superponer. |
| [`graficos/_vista_previa.jpg`](graficos/_vista_previa.jpg) | Hoja de contactos para ver todos los gráficos de un vistazo. |
| [`graficos/_fuente/`](graficos/_fuente/) | El diseño de los gráficos (HTML) por si hay que cambiar algún texto y volver a exportarlos. |

## Cómo producirlo (paso a paso)

1. **Fichas** (solo la primera vez): genera las imágenes de `FICHAS.md` y guarda las mejores.
2. **Imágenes**: genera la imagen de cada plano de `PLANOS.md` subiendo las fichas como referencia.
3. **Voz**: crea la voz del narrador en ElevenLabs con *Voice Design* y genera las frases de `VOCES.md` (o la locución entera de una vez).
4. **Animación**: pasa cada imagen a vídeo (Kling, Hailuo, Veo, Runway…) con su prompt de animación.
5. **Montaje** (CapCut): ordena los clips, pon la voz, importa el `.srt`, añade cada **gráfico** de `graficos/` como *Superposición* en su plano (con una animación de entrada suave, p. ej. «Desvanecer» o «Deslizar hacia arriba»), mete efectos de sonido y música, y exporta en 1080×1920, 30 fps.

> **Subtítulos y gráficos:** los gráficos ocupan la parte central-alta de la pantalla; coloca los subtítulos en la parte baja (por encima de la zona de la descripción) para que no se pisen.

## Gráficos en pantalla

| Archivo | Plano | Qué pone |
|---|---|---|
| [`G01_titulo.png`](graficos/G01_titulo.png) | 02 | Título «DENTRO DEL LAVAVAJILLAS · Así lava de verdad» |
| [`G02_manchas.png`](graficos/G02_manchas.png) | 03 | Etiquetas: PROTEÍNA (huevo) · GRASA (tomate) · ALMIDÓN (arroz) · TANINOS (café) |
| [`G03_descalcificador.png`](graficos/G03_descalcificador.png) | 04 | DESCALCIFICADOR · la resina atrapa la cal · la sal la regenera |
| [`G04_litros.png`](graficos/G04_litros.png) | 05 | ≈ 3–4 L · se recirculan una y otra vez |
| [`G05_brazo.png`](graficos/G05_brazo.png) | 06 | BRAZO ASPERSOR · gira por reacción, nadie lo empuja |
| [`G06_fase1.png`](graficos/G06_fase1.png) | 07 | Rótulo de fase: FASE 1 · PRELAVADO |
| [`G07_filtro.png`](graficos/G07_filtro.png) | 08 | FILTRO · atrapa los restos |
| [`G08_sensor_esquema.png`](graficos/G08_sensor_esquema.png) | 10 | Esquema: EMISOR → AGUA → RECEPTOR |
| [`G09_sensor_sucia.png`](graficos/G09_sensor_sucia.png) | 11 | HUD: LUZ RECIBIDA 28 % · AGUA TURBIA |
| [`G10_sensor_sigue.png`](graficos/G10_sensor_sigue.png) | 12 | SIGUE LAVANDO: cambia el agua · calienta más · alarga el lavado · vuelve a medir |
| [`G11_sensor_limpia.png`](graficos/G11_sensor_limpia.png) | 13 | HUD: LUZ RECIBIDA 96 % · AGUA LIMPIA → SIGUIENTE FASE |
| [`G12_tiempo_a.png`](graficos/G12_tiempo_a.png) | 14 | TIEMPO RESTANTE 2:15 |
| [`G13_tiempo_b.png`](graficos/G13_tiempo_b.png) | 14 | TIEMPO RESTANTE 1:48 · recalculado por el sensor (corta de A a B a mitad de la frase) |
| [`G14_fase2.png`](graficos/G14_fase2.png) | 15 | Rótulo de fase: FASE 2 · LAVADO PRINCIPAL |
| [`G15_temperatura.png`](graficos/G15_temperatura.png) | 16 | Termómetro 40–70 °C |
| [`G16_enzimas.png`](graficos/G16_enzimas.png) | 17 | PROTEASA → proteínas · AMILASA → almidón · OXÍGENO ACTIVO → café y té |
| [`G17_desague.png`](graficos/G17_desague.png) | 18 | BOMBA DE DESAGÜE · fuera el agua sucia |
| [`G18_fase3.png`](graficos/G18_fase3.png) | 19 | Rótulo de fase: FASE 3 · ACLARADO |
| [`G19_abrillantador.png`](graficos/G19_abrillantador.png) | 20 | SIN abrillantador: gotas → manchas · CON: lámina → brillo |
| [`G20_fase4.png`](graficos/G20_fase4.png) | 21 | Rótulo de fase: FASE 4 · SECADO |
| [`G21_condensacion.png`](graficos/G21_condensacion.png) | 21 | CONDENSACIÓN · vajilla caliente + paredes frías |
| [`G22_secado.png`](graficos/G22_secado.png) | 22 | ZEOLITA · atrapa humedad y suelta calor / PUERTA AUTOMÁTICA · deja salir el vapor |
| [`G23_programas.png`](graficos/G23_programas.png) | 23 | Rótulo: LOS PROGRAMAS |
| [`G24_cuatro_cartas.png`](graficos/G24_cuatro_cartas.png) | 23 | Las 4 cartas: QUÍMICA · TEMPERATURA · TIEMPO · FUERZA DEL AGUA |
| [`G25_modo_intensivo.png`](graficos/G25_modo_intensivo.png) | 24 | Tarjeta INTENSIVO · 70 °C · ollas y sartenes |
| [`G26_modo_delicado.png`](graficos/G26_modo_delicado.png) | 25 | Tarjeta DELICADO · 40 °C · copas y cristal |
| [`G27_modo_rapido.png`](graficos/G27_modo_rapido.png) | 26 | Tarjeta RÁPIDO · 45 °C · menos de 1 h |
| [`G28_modo_auto.png`](graficos/G28_modo_auto.png) | 26 | Tarjeta AUTO · 45–65 °C · decide el sensor (entra en «Y Auto...») |
| [`G29_modo_eco.png`](graficos/G29_modo_eco.png) | 27 | Tarjeta ECO · 50 °C · ≈ 3–4 h · el que menos gasta |
| [`G30_eco_energia.png`](graficos/G30_eco_energia.png) | 27 | Calentar el agua = lo que más gasta → menos grados, más tiempo (entra en «calienta menos») |
| [`G31_consejo_no.png`](graficos/G31_consejo_no.png) | 28 | ✕ NO LOS ACLARES ANTES |
| [`G32_consejo_porque.png`](graficos/G32_consejo_porque.png) | 28 | Agua limpia desde el principio → el sensor lava más flojo (entra en «Si el agua sale limpia») |
| [`G33_consejo_si.png`](graficos/G33_consejo_si.png) | 29 | ✓ RASCA LOS RESTOS A LA BASURA |
| [`G34_final.png`](graficos/G34_final.png) | 30 | ¿Qué aparato abrimos ahora? · Te leo en comentarios |

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
