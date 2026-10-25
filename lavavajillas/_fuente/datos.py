# -*- coding: utf-8 -*-
"""Datos del vídeo «Dentro del lavavajillas»: escenas, planos, voces y gráficos."""

TITULO = "DENTRO DEL LAVAVAJILLAS"
SUBTITULO = "Así lava de verdad"
PREFIJO_AUDIO = "LV"

# ---------------------------------------------------------------------------
# Bloques de estilo reutilizables (en inglés, como el resto de prompts del repo)
# ---------------------------------------------------------------------------
DW = ("a modern built-in dishwasher with a brushed stainless-steel tub, light-grey plastic racks, "
      "white porcelain plates standing in the lower rack, clear wine glasses and dark-blue ceramic mugs "
      "in the upper rack, grey plastic spray arms")

ST_IN = ("Ultra-realistic cinematic footage filmed with a waterproof cinema camera inside a running dishwasher, "
         "macro lens, high-speed camera look, crisp individual water droplets and spray, realistic brushed "
         "stainless-steel reflections, cool white LED interior light with a soft blue tint, volumetric mist, "
         "shallow depth of field, photorealistic, 8k. No text, no logos. Vertical 9:16 composition. --ar 9:16")

ST_SECO = ("Ultra-realistic cinematic footage filmed with a cinema camera inside a dishwasher before the wash starts, "
           "macro lens, dry dishes, realistic brushed stainless-steel reflections, cool white LED interior light with a "
           "soft blue tint, shallow depth of field, photorealistic, 8k. No text, no logos. Vertical 9:16 composition. --ar 9:16")

ST_MACRO = ("Photorealistic macro product visualization, engineering cutaway, studio-quality lighting, "
            "realistic water, plastic and metal materials, shallow depth of field, 8k. No text, no logos. "
            "Vertical 9:16 composition. --ar 9:16")

ST_COCINA = ("Photorealistic cinematic shot in a modern kitchen with light oak wood and white cabinets, "
             "soft natural window light, shallow depth of field, 35mm film look, 8k. No text, no logos, "
             "no visible faces. Vertical 9:16 composition. --ar 9:16")

ST_NOCHE = ("Photorealistic cinematic shot in a modern kitchen at night, only lit by the soft glow of the "
            "appliance and a warm under-cabinet light, shallow depth of field, 35mm film look, 8k. No text, "
            "no logos. Vertical 9:16 composition. --ar 9:16")

SENSOR = ("a dishwasher turbidity sensor next to the circulation pump: a small transparent plastic water channel, "
          "on one side a tiny infrared LED glowing deep red, on the other side a small black photodiode receiver "
          "on a green circuit board, wet plastic details")

ANIM = "Smooth, realistic cinematic motion, physically accurate water, no morphing, no text."

NEGATIVO = ("cartoon, illustration, anime, toy-like CGI, plastic-looking water, text, letters, numbers, "
            "watermark, logo, brand names, human faces, deformed plates, melted glass, floating objects, "
            "extra spray arms, warped racks, distorted geometry, blurry, low quality")

# ---------------------------------------------------------------------------
# Escenas
# ---------------------------------------------------------------------------
ESCENAS = [
    ("ESCENA 1", "SE CIERRA LA PUERTA"),
    ("ESCENA 2", "ENTRA EL AGUA"),
    ("ESCENA 3", "FASE 1 · PRELAVADO"),
    ("ESCENA 4", "EL SENSOR QUE MIRA EL AGUA"),
    ("ESCENA 5", "FASE 2 · LAVADO PRINCIPAL"),
    ("ESCENA 6", "FASE 3 · DESAGÜE Y ACLARADO"),
    ("ESCENA 7", "FASE 4 · SECADO"),
    ("ESCENA 8", "LOS PROGRAMAS"),
    ("ESCENA 9", "EL CONSEJO Y EL FINAL"),
]

# ---------------------------------------------------------------------------
# Planos
#   esc: índice de escena (0..)
#   lugar: etiqueta corta del sitio
#   que: qué pasa (castellano)
#   img / anim: prompts
#   vo: narración (texto limpio) · tag: audio tag ElevenLabs v3 · tono: interpretación
#   graf: lista de (archivo, descripción) de gráficos de superposición
#   sonido
#   dur: duración fija (solo para planos sin voz)
# ---------------------------------------------------------------------------
PLANOS = [
    dict(
        esc=0, lugar="Dentro del lavavajillas",
        que="Plano subjetivo desde dentro: la puerta se cierra, oscuridad total y se enciende la luz LED interior, que descubre la vajilla sucia.",
        img=("Point-of-view from deep inside a dishwasher looking out at the door as it closes: the last thin sliver of warm "
             "kitchen light at the top of the door gap, the dark interior just lit by a cool white LED strip, a row of dirty "
             "white porcelain plates with food residue in the lower rack in the foreground, brushed stainless-steel walls, "
             f"dark and mysterious mood, {DW}. {ST_SECO}"),
        anim=("The door swings shut and the warm kitchen light disappears; a beat of total darkness; then the cool white LED "
              f"light fades on and reveals the dirty plates. Very slow push-in. {ANIM}"),
        vo="Esto es lo que pasa dentro de tu lavavajillas cuando cierras la puerta.",
        tag="[intriguing, intimate]", tono="intrigante, cercano",
        graf=[],
        sonido="«Clac» de la puerta al cerrarse, un segundo de silencio y zumbido eléctrico al encenderse la luz.",
    ),
    dict(
        esc=0, lugar="Cartela de título",
        que="Cartela con el título sobre gotas de agua en acero inoxidable.",
        img=("Title card background, no text: extreme close-up of water droplets beading on a dark brushed stainless-steel "
             "surface, cool blue rim light, a fine mist of spray drifting across the frame, lots of empty dark space in the "
             f"center for a title. {ST_IN}"),
        anim=f"The droplets tremble and slowly slide down; mist drifts through a soft beam of light. {ANIM}",
        vo="Y te aviso: es mucho más listo de lo que crees.",
        tag="[playful, confident]", tono="pícaro, seguro",
        graf=[("titulo", "Título «DENTRO DEL LAVAVAJILLAS · Así lava de verdad»")],
        sonido="Golpe grave + «whoosh» de agua.",
    ),
    dict(
        esc=1, lugar="La vajilla sucia",
        que="Travelling lento por la vajilla sucia: yema de huevo seca, tomate, arroz pegado, un cerco de café, pintalabios en una copa.",
        img=("Slow tracking macro shot along the racks of the dishwasher: a white plate with dried egg yolk, a plate smeared "
             "with tomato sauce, a bowl with stuck grains of rice, a dark-blue mug with a brown coffee ring, a wine glass with "
             f"a lipstick mark, realistic dried food residue textures, {DW}. {ST_SECO}"),
        anim=f"Slow lateral dolly along the dirty dishes, rack focus from the egg yolk to the coffee mug. {ANIM}",
        vo="Huevo, tomate, arroz, café... y cada mancha se quita de una forma distinta.",
        tag="[curious]", tono="curioso, enumerando",
        graf=[("manchas", "Etiquetas: PROTEÍNA (huevo) · GRASA (tomate) · ALMIDÓN (arroz) · TANINOS (café)")],
        sonido="Ambiente grave, gotitas sueltas.",
    ),
    dict(
        esc=1, lugar="Descalcificador (macro)",
        que="El agua entra y atraviesa el descalcificador: miles de bolitas de resina atrapan la cal; al lado, la sal se disuelve.",
        img=("Photorealistic macro cutaway of a dishwasher water softener: a translucent chamber filled with thousands of tiny "
             "glossy amber resin beads, water flowing between them, tiny white limescale mineral specks being captured and "
             "sticking to the beads; next to it a compartment with coarse white dishwasher salt crystals slowly dissolving "
             f"into brine. {ST_MACRO}"),
        anim=("Fresh water streams in from a pipe at the top and flows through the amber resin beads; tiny white mineral specks "
              f"drift in and stick to the beads; the salt crystals slowly dissolve; slow push-in. {ANIM}"),
        vo="Entra el agua, pero antes pasa por el descalcificador: una resina que atrapa la cal. La sal que le echas sirve para limpiarla.",
        tag="[explaining, clear]", tono="explicativo, claro",
        graf=[("descalcificador", "DESCALCIFICADOR · la resina atrapa la cal · la sal la regenera")],
        sonido="Burbujeo suave, agua corriendo por un tubo.",
    ),
    dict(
        esc=1, lugar="Fondo de la cuba",
        que="Plano bajo en el fondo: solo una capa de agua de pocos centímetros alrededor del filtro.",
        img=("Low-angle shot at the very bottom of a dishwasher tub: a shallow pool of clear water, only a few centimeters "
             "deep, covering the brushed stainless-steel floor around the central cylindrical mesh filter, the grey lower "
             "spray arm just above the water, the plates of the lower rack towering above, reflections on the water "
             f"surface. {ST_IN}"),
        anim=f"Gentle ripples on the shallow pool; the water swirls slowly toward the filter; the camera slowly cranes up. {ANIM}",
        vo="Y usa poquísima agua: tres o cuatro litros, que se reciclan una y otra vez.",
        tag="[amazed]", tono="sorprendido",
        graf=[("litros", "≈ 3–4 L · se recirculan una y otra vez")],
        sonido="Agua moviéndose suave, zumbido grave.",
    ),
    dict(
        esc=2, lugar="Brazo aspersor",
        que="Arranca la bomba: el brazo aspersor de abajo empieza a girar solo, empujado por sus propios chorros.",
        img=("Close-up from below the lower rack of a dishwasher: the grey plastic lower spray arm starting to spin, powerful "
             "angled jets of water shooting upward from its nozzles, fan-shaped sprays hitting the dirty plates above, motion "
             f"blur on the arm, sparkling backlit droplets. {ST_IN}"),
        anim=("The pump kicks in; the spray arm starts rotating on its own, pushed by its angled jets, speeding up to a steady "
              f"spin; the jets sweep across the plates. {ANIM}"),
        vo="La bomba lanza el agua a los brazos aspersores, que giran solos, empujados por sus propios chorros.",
        tag="[energetic, explaining]", tono="enérgico, explicativo",
        graf=[("brazo", "BRAZO ASPERSOR · gira por reacción, nadie lo empuja")],
        sonido="Arranque de la bomba (zumbido que sube) y chorros.",
    ),
    dict(
        esc=2, lugar="Prelavado (cámara lenta)",
        que="Cámara superlenta: un chorro de agua fría golpea un plato y hace saltar los granos de arroz.",
        img=("Extreme slow-motion close-up inside a dishwasher: a jet of cold clear water hitting a white porcelain plate and "
             "knocking loose grains of rice and crumbs into the air, every droplet frozen and razor-sharp, backlit by a cool "
             f"LED light. {ST_IN}"),
        anim=f"Super slow motion: the jet strikes the plate, rice grains and crumbs fly off and fall away. {ANIM}",
        vo="Prelavado: agua fría que arranca todo lo que está suelto.",
        tag="[clear]", tono="claro, rítmico",
        graf=[("fase1", "Rótulo de fase: FASE 1 · PRELAVADO")],
        sonido="Chorro a cámara lenta, grave y amortiguado.",
    ),
    dict(
        esc=2, lugar="Filtro",
        que="El agua sucia cae al filtro del fondo, que se queda con los restos de comida.",
        img=("Top-down close-up of a dishwasher's central cylindrical fine stainless-steel mesh filter in the sump: dirty water "
             "cascading down into it, grains of rice, small pieces of food and seeds trapped against the mesh, swirling "
             f"water. {ST_IN}"),
        anim=f"Dirty water pours down into the filter; food bits get caught against the mesh while the water passes through. {ANIM}",
        vo="Los restos caen al filtro, y así no vuelven a los platos.",
        tag="[explaining]", tono="explicativo",
        graf=[("filtro", "FILTRO · atrapa los restos")],
        sonido="Agua cayendo por un desagüe, gorgoteo.",
    ),
    dict(
        esc=3, lugar="Bajando al sensor",
        que="La cámara baja entre la niebla hacia el fondo, más allá del filtro, donde están la bomba y el sensor.",
        img=("Camera diving down through dense mist toward the sump at the bottom of a dishwasher, past the cylindrical filter, "
             "into the dark compartment below where the circulation pump and a small glowing red sensor light are hidden, "
             f"mysterious discovery mood. {ST_IN}"),
        anim=("The camera dives down through the mist, slips past the filter and approaches a small red glow in the dark below. "
              f"{ANIM}"),
        vo="Y aquí viene lo más listo: muchos llevan un sensor de turbidez.",
        tag="[mysterious, excited]", tono="misterioso, con emoción",
        graf=[],
        sonido="«Whoosh» de descenso, la música baja y queda un pulso grave.",
    ),
    dict(
        esc=3, lugar="Sensor de turbidez (macro)",
        que="El sensor por dentro: una luz cruza el agua y un receptor mide cuánta llega al otro lado.",
        img=(f"Photorealistic macro cutaway of {SENSOR}, a thin visible beam of light crossing the flowing water between the LED "
             f"and the receiver. {ST_MACRO}"),
        anim=f"Water flows through the transparent channel; the thin light beam crosses from the LED to the receiver; slow orbit around the sensor. {ANIM}",
        vo="Una luz atraviesa el agua, y un receptor mide cuánta llega.",
        tag="[explaining, slow]", tono="explicativo, pausado",
        graf=[("sensor_esquema", "Esquema: EMISOR → AGUA → RECEPTOR")],
        sonido="Pitido electrónico suave, agua fluyendo.",
    ),
    dict(
        esc=3, lugar="Sensor: agua turbia",
        que="Agua turbia y marrón: la luz se dispersa y casi no llega al receptor.",
        img=(f"Photorealistic macro cutaway of {SENSOR}; the water in the channel is cloudy and murky brown with tiny floating "
             "food particles, the light beam is scattered into a hazy glow and fades out before reaching the receiver, the "
             f"receiver barely lit, slightly ominous red tone. {ST_MACRO}"),
        anim=f"Murky water with floating particles flows through the channel; the beam scatters into haze and fades before the receiver. {ANIM}",
        vo="Si el agua sale turbia, llega poca luz: a la vajilla aún le queda suciedad...",
        tag="[serious]", tono="serio, con intención",
        graf=[("sensor_sucia", "HUD: LUZ RECIBIDA 28 % · AGUA TURBIA")],
        sonido="Pitido grave de «aviso», agua espesa.",
    ),
    dict(
        esc=3, lugar="Sigue lavando",
        que="El lavavajillas no para: los dos brazos giran más rápido, más vapor, más chorro.",
        img=("Inside a dishwasher during an intense wash: both spray arms spinning hard, dense sprays of hot water and steam "
             "filling the tub, dirty plates with some residue still on them being blasted, dramatic backlit mist, powerful "
             f"energy, {DW}. {ST_IN}"),
        anim=f"The sprays intensify, steam thickens and the arms spin faster; the camera pushes through the mist. {ANIM}",
        vo="...así que sigue: cambia el agua, calienta más o alarga el lavado. Y vuelve a medir.",
        tag="[determined, energetic]", tono="decidido, enérgico",
        graf=[("sensor_sigue", "SIGUE LAVANDO: cambia el agua · calienta más · alarga el lavado · vuelve a medir")],
        sonido="La bomba sube de vueltas, chorros más fuertes.",
    ),
    dict(
        esc=3, lugar="Sensor: agua limpia",
        que="Agua cristalina: la luz cruza entera y el receptor se ilumina.",
        img=(f"Photorealistic macro cutaway of {SENSOR}; the water in the channel is crystal clear, a sharp bright beam goes "
             f"straight across and the receiver glows brightly, clean fresh feeling with a hint of cyan light. {ST_MACRO}"),
        anim=f"Crystal-clear water flows; the beam passes straight and sharp and the receiver lights up brightly. {ANIM}",
        vo="Pero si sale limpia, la luz pasa entera: ya no queda nada. Salta a la siguiente fase, sin gastar de más.",
        tag="[relieved, satisfied]", tono="satisfecho, aliviado",
        graf=[("sensor_limpia", "HUD: LUZ RECIBIDA 96 % · AGUA LIMPIA → SIGUIENTE FASE")],
        sonido="«Ding» limpio de confirmación.",
    ),
    dict(
        esc=3, lugar="Panel de mandos",
        que="El panel del lavavajillas brilla en la cocina a oscuras; el tiempo restante se recalcula.",
        img=("Front control panel of a freestanding stainless-steel dishwasher in a dark kitchen at night: a matte black display "
             "strip glowing with soft white light, a blank screen with no digits, a few backlit minimal program icons, "
             f"reflections on the brushed steel. {ST_NOCHE}"),
        anim=f"The display glow pulses softly; slow push-in toward the screen; the kitchen stays dark. {ANIM}",
        vo="Por eso el programa Auto no siempre dura lo mismo: no mira el reloj... mira el agua.",
        tag="[knowing, slow]", tono="cómplice, frase clave (más lenta)",
        graf=[("tiempo_a", "TIEMPO RESTANTE 2:15"),
              ("tiempo_b", "TIEMPO RESTANTE 1:48 · recalculado por el sensor (corta de A a B a mitad de la frase)")],
        sonido="Pitido corto del panel; el lavado se oye amortiguado a través de la puerta.",
    ),
    dict(
        esc=4, lugar="Cajetín del detergente",
        que="Se abre de golpe la tapa del cajetín y la pastilla cae al agua caliente.",
        img=("Close-up of the detergent dispenser on the inner side of a dishwasher door: the small lid has just sprung open and "
             "a white-and-blue dishwasher tablet is tumbling out into the hot water spray, droplets and steam, brushed steel "
             f"and grey plastic. {ST_IN}"),
        anim=f"The lid pops open with a snap; the tablet tumbles out, hits the water and starts fizzing and dissolving. {ANIM}",
        vo="Se abre el cajetín y cae la pastilla,",
        tag="[excited]", tono="con chispa",
        graf=[("fase2", "Rótulo de fase: FASE 2 · LAVADO PRINCIPAL")],
        sonido="¡Clac! del cajetín y efervescencia.",
    ),
    dict(
        esc=4, lugar="El agua se calienta",
        que="Sube el vapor y la luz pasa de azul frío a tono cálido mientras el agua se calienta.",
        img=("Inside a dishwasher: hot water spraying and thick steam rising and swirling, condensation forming on the glasses, "
             f"heat shimmer, the light warmer than usual with soft amber tones mixing with the cool LED, {DW}. {ST_IN}"),
        anim=f"Steam builds up and swirls; the light slowly shifts from cool blue to a warmer amber as the water heats up. {ANIM}",
        vo="mientras el agua se calienta: de cuarenta a setenta grados, según el programa.",
        tag="[explaining]", tono="explicativo",
        graf=[("temperatura", "Termómetro 40–70 °C")],
        sonido="Siseo de vapor, chorros constantes.",
    ),
    dict(
        esc=4, lugar="Enzimas: huevo y arroz",
        que="Macro: la yema de huevo seca se ablanda y se va con el agua; al fondo, el cerco de café de una taza se aclara.",
        img=("Extreme macro of a white porcelain plate under hot water inside a dishwasher: dried egg yolk residue and a few "
             "stuck grains of rice softening, lifting and dissolving into the water in tiny flakes, foamy detergent "
             "micro-bubbles, glistening wet surface; in the soft-focus background a dark-blue mug with a fading brown coffee "
             f"ring. {ST_IN}"),
        anim=("Time-lapse feel: the egg residue softens, breaks into flakes and washes away; the rice grains loosen and slide "
              f"off; in the background the coffee ring fades. {ANIM}"),
        vo="Y entran las enzimas: unas deshacen las proteínas del huevo; otras, el almidón del arroz. Y el oxígeno activo blanquea el café.",
        tag="[fascinated]", tono="fascinado",
        graf=[("enzimas", "PROTEASA → proteínas · AMILASA → almidón · OXÍGENO ACTIVO → café y té")],
        sonido="Burbujeo y efervescencia sutil.",
    ),
    dict(
        esc=5, lugar="Desagüe",
        que="El agua sucia gira en remolino y se va por el fondo.",
        img=("Close-up of a dishwasher sump: murky grey-brown water with foam swirling in a vortex and being sucked down around "
             f"the filter toward the drain, a few food bits spinning, wet brushed stainless-steel floor. {ST_IN}"),
        anim=f"The dirty water swirls into a vortex and drains away quickly, leaving the wet stainless-steel floor. {ANIM}",
        vo="Con el visto bueno del sensor, el desagüe se lleva el agua sucia.",
        tag="[clear]", tono="claro",
        graf=[("desague", "BOMBA DE DESAGÜE · fuera el agua sucia")],
        sonido="Gorgoteo fuerte de la bomba de desagüe.",
    ),
    dict(
        esc=5, lugar="Aclarado",
        que="Agua limpia y brillante rocía la vajilla, que ya reluce.",
        img=("Inside a dishwasher: clean crystal-clear water spraying in bright sparkling arcs across shiny clean plates and "
             f"glasses, fresh bright light, backlit droplets sparkling like diamonds, {DW}. {ST_IN}"),
        anim=f"Clean water sprays across the dishes in bright sparkling arcs; slow dolly along the rack. {ANIM}",
        vo="Entra agua limpia para aclarar, y en el último aclarado, bien caliente, el abrillantador...",
        tag="[fresh, upbeat]", tono="fresco, animado",
        graf=[("fase3", "Rótulo de fase: FASE 3 · ACLARADO")],
        sonido="Chorros limpios y brillantes.",
    ),
    dict(
        esc=5, lugar="Abrillantador",
        que="Macro de una copa: el agua resbala en una lámina fina en vez de quedarse en gotas.",
        img=("Extreme close-up of a clear wine glass upside down in the upper rack of a dishwasher: hot rinse water sliding off "
             "in a smooth thin transparent sheet instead of beading into droplets, perfectly clear spotless shiny glass, "
             f"crisp rim light. {ST_IN}"),
        anim=f"The water slides off the glass in one smooth sheet and the glass is left spotless and shiny. {ANIM}",
        vo="...que hace que el agua resbale en lámina, sin gotas ni manchas.",
        tag="[satisfied]", tono="satisfecho",
        graf=[("abrillantador", "SIN abrillantador: gotas → manchas · CON: lámina → brillo")],
        sonido="Agua resbalando y un «shine» brillante.",
    ),
    dict(
        esc=6, lugar="Condensación",
        que="El vapor de la vajilla caliente se condensa en gotas en la pared de acero, más fría, y resbala.",
        img=("Close-up of the brushed stainless-steel side wall of a dishwasher after a hot rinse: warm steam drifting from the "
             "hot clean plates and condensing into droplets on the cooler steel wall, droplets merging and running down in "
             f"streaks, quiet calm mood. {ST_IN}"),
        anim=f"Steam drifts toward the wall and condenses into droplets that merge and run down slowly. {ANIM}",
        vo="Para secar, física pura: el vapor se condensa en las paredes, más frías, y resbala al fondo.",
        tag="[calm, explaining]", tono="tranquilo, explicativo",
        graf=[("fase4", "Rótulo de fase: FASE 4 · SECADO"),
              ("condensacion", "CONDENSACIÓN · vajilla caliente + paredes frías")],
        sonido="Casi silencio: gotas resbalando y leves crujidos del metal enfriándose.",
    ),
    dict(
        esc=6, lugar="Puerta automática",
        que="En la cocina, la puerta del lavavajillas se abre sola unos centímetros y sale el vapor.",
        img=("Kitchen at dusk, a built-in dishwasher whose door has automatically opened a few centimeters at the top, a soft "
             f"plume of steam escaping from the gap into the dim kitchen, warm glow from inside. {ST_NOCHE}"),
        anim=f"The door clicks and opens a few centimeters by itself; steam rolls out slowly and curls upward. {ANIM}",
        vo="Algunos usan zeolita, que atrapa la humedad; otros abren la puerta solos al terminar.",
        tag="[curious]", tono="curioso",
        graf=[("secado", "ZEOLITA · atrapa humedad y suelta calor / PUERTA AUTOMÁTICA · deja salir el vapor")],
        sonido="«Clic» de la puerta y vapor saliendo.",
    ),
    dict(
        esc=7, lugar="Panel: elegir programa",
        que="Un dedo pulsa un botón del panel y los iconos de programa se iluminan uno a uno.",
        img=("Close-up of a finger touching a backlit button on the sleek matte black control panel of a modern dishwasher, a "
             f"row of minimal glowing white program icons without any text, soft reflections, dark background. {ST_NOCHE}"),
        anim=f"The finger taps the button; the program icons light up one by one. {ANIM}",
        vo="¿Y los programas? Juegan con cuatro cartas: química, calor, tiempo y fuerza del agua.",
        tag="[engaging]", tono="cercano, enumerando",
        graf=[("programas", "Rótulo: LOS PROGRAMAS"),
              ("cuatro_cartas", "Las 4 cartas: QUÍMICA · TEMPERATURA · TIEMPO · FUERZA DEL AGUA")],
        sonido="Pitidos al pulsar.",
    ),
    dict(
        esc=7, lugar="Modo Intensivo",
        que="Una olla con salsa quemada y una sartén grasienta reciben chorros calientes a tope.",
        img=("Inside a dishwasher: a large stainless-steel pot with burnt-on sauce and a greasy frying pan in the lower rack being "
             f"blasted by powerful hot water jets, thick steam, droplets flying, intense energy. {ST_IN}"),
        anim=f"Powerful hot jets blast the pot and the pan; burnt residue starts to break off; steam swirls. {ANIM}",
        vo="Intensivo: setenta grados para ollas y sartenes.",
        tag="[powerful]", tono="potente",
        graf=[("modo_intensivo", "Tarjeta INTENSIVO · 70 °C · ollas y sartenes")],
        sonido="Chorros fuertes, bomba a tope.",
    ),
    dict(
        esc=7, lugar="Modo Delicado",
        que="Copas de cristal fino bajo una lluvia suave de agua.",
        img=("Inside the upper rack of a dishwasher: a row of delicate thin crystal wine glasses held in place, a gentle soft "
             f"rain of water drizzling over them, calm and elegant mood, soft light. {ST_IN}"),
        anim=f"A gentle drizzle falls softly over the crystal glasses; slow elegant dolly. {ANIM}",
        vo="Delicado: unos cuarenta, y agua suave para las copas.",
        tag="[soft]", tono="suave",
        graf=[("modo_delicado", "Tarjeta DELICADO · 40 °C · copas y cristal")],
        sonido="Lluvia suave, tintineo de cristal.",
    ),
    dict(
        esc=7, lugar="Modo Rápido y Auto",
        que="Unas tazas y platitos casi limpios con chorros rápidos y enérgicos.",
        img=("Inside a dishwasher: a few lightly used coffee mugs and small plates, fast energetic sprays, motion blur, quick "
             f"dynamic feel, {DW}. {ST_IN}"),
        anim=f"Fast, energetic sprays sweep over the mugs; quick dynamic camera move. {ANIM}",
        vo="Rápido: menos de una hora, para poca suciedad. Y Auto... decide el sensor.",
        tag="[quick, playful]", tono="rápido, guiño al final",
        graf=[("modo_rapido", "Tarjeta RÁPIDO · 45 °C · menos de 1 h"),
              ("modo_auto", "Tarjeta AUTO · 45–65 °C · decide el sensor (entra en «Y Auto...»)")],
        sonido="Chorros rápidos; «ding» al decir «sensor».",
    ),
    dict(
        esc=7, lugar="Modo Eco",
        que="Lavado tranquilo y templado, sin prisa, con una luz suave.",
        img=("Inside a dishwasher during a calm low-energy wash: a gentle warm mist, slow soft sprays over the dishes, peaceful "
             f"atmosphere, soft light with a subtle green tint, {DW}. {ST_IN}"),
        anim=f"Slow, calm sprays; gentle mist drifts; time-lapse feel with the light softly shifting. {ANIM}",
        vo="¿Y Eco? Tarda más, pero gasta menos: calienta menos el agua, que es lo que más consume... y lava más despacio.",
        tag="[intriguing]", tono="intrigante",
        graf=[("modo_eco", "Tarjeta ECO · 50 °C · ≈ 3–4 h · el que menos gasta"),
              ("eco_energia", "Calentar el agua = lo que más gasta → menos grados, más tiempo (entra en «calienta menos»)")],
        sonido="Ambiente tranquilo, chorros lentos.",
    ),
    dict(
        esc=8, lugar="Cocina: el error",
        que="Unas manos aclaran un plato bajo el grifo antes de meterlo en el lavavajillas.",
        img=("Close-up of hands rinsing a dirty plate under a running kitchen tap next to an open dishwasher, water pouring "
             f"down the sink. {ST_COCINA}"),
        anim=f"The hands rinse the plate under the running tap; water pours down the sink. {ANIM}",
        vo="Un consejo: no aclares los platos antes. Si el agua sale limpia, el sensor cree que no hay nada que lavar... y lava más flojo.",
        tag="[friendly, warning]", tono="amistoso, de aviso",
        graf=[("consejo_no", "✕ NO LOS ACLARES ANTES"),
              ("consejo_porque", "Agua limpia desde el principio → el sensor lava más flojo (entra en «Si el agua sale limpia»)")],
        sonido="Grifo abierto, agua cayendo al fregadero.",
    ),
    dict(
        esc=8, lugar="Cocina: rascar",
        que="Un tenedor rasca las sobras del plato a la basura; detrás, el lavavajillas abierto y cargado.",
        img=("Close-up of a hand scraping leftover food from a white plate into a kitchen bin with a fork, the open dishwasher "
             f"with loaded racks softly out of focus in the background. {ST_COCINA}"),
        anim=f"The fork scrapes the leftovers into the bin; the hand then turns toward the dishwasher. {ANIM}",
        vo="Rasca los restos a la basura, y deja que él haga el resto.",
        tag="[warm, confident]", tono="cálido, seguro",
        graf=[("consejo_si", "✓ RASCA LOS RESTOS A LA BASURA")],
        sonido="Tenedor rascando el plato.",
    ),
    dict(
        esc=8, lugar="Final: se abre la puerta",
        que="Se abre la puerta al terminar: sale una nube de vapor y aparece la vajilla reluciente.",
        img=("View from inside a dishwasher at the end of the cycle as the door opens: a cloud of steam rolling out toward a "
             "warm-lit kitchen, sparkling clean white plates and gleaming glasses in the racks catching the light, magical "
             f"clean feeling, {DW}. {ST_IN}"),
        anim=("The door opens downward, steam billows out toward the camera and clears to reveal sparkling clean dishes; slow "
              f"pull-back. {ANIM}"),
        vo="Unos litros, un poco de química y un sensor que mira el agua. ¿Qué aparato abrimos ahora?",
        tag="[warm, engaging]", tono="cálido, invitando a comentar",
        graf=[("final", "¿Qué aparato abrimos ahora? · Te leo en comentarios")],
        sonido="«Clic» de la puerta, vapor, «ding» final y la música sube.",
    ),
]
