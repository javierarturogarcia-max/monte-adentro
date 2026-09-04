# 🌄 Monte Adentro

**Un niño que se cría en el campo.** Aprende a cazar con hondilla, a leer el río
para pescar, a rebuscar comida en el monte, a sembrar y cuidar su milpa, y a
subir agua y leña a una casa donde no hay luz ni tubería. Cada día que la casa
tiene lo que necesita cuenta; cada cosa que aprende le abre algo que ayer no
podía hacer.

Juego 3D completo, **sin una sola dependencia y sin un solo archivo de arte**:
el motor gráfico, el empaquetador y hasta los árboles están escritos aquí.

---

## Empezar

```bash
npm run dev     # servidor local en http://localhost:4173
npm test        # 68 pruebas (reglas del juego y mundo)
npm run build   # genera dist/monte-adentro.html, el juego en un solo archivo
```

`npm install` no descarga nada: no hay dependencias. También se puede abrir
`index.html` en cualquier servidor estático, o `dist/monte-adentro.html` con
doble clic —sin servidor y sin conexión.

**Hace falta** un navegador con WebGL2 (cualquiera de los últimos años). En
Chrome o Edge de escritorio entra por WebGPU y va más fino.

---

## Cómo se juega

| Acción | Teclado | Mando | Móvil |
|---|---|---|---|
| Moverse | WASD o flechas | palanca izquierda | palanca (mitad izquierda) |
| Mirar | arrastrar el ratón | palanca derecha | arrastrar (mitad derecha) |
| Correr | Shift | L2 / L3 | botón 🏃 |
| Agacharse | C o Ctrl | B | — |
| Interactuar | E o Enter | X | botón ✋ |
| Acción / minijuego | Espacio | A | botón ⚡ |
| Mapa del valle | Q | — | botón 🗺️ |
| Canasta · Diario · Pausa | I · J · Esc | Y · Start | botones de arriba |
| Segunda y tercera opción | 1, 2, 3 | — | tocar la opción |

El bucle del día: levantarse, ver qué falta en la casa, ir al río, subir agua,
juntar leña, buscar comida, cocinar en el fogón, entregar en casa y dormir. Al
cerrar el día se puntúa con estrellas.

**Lo que decide una partida no es la puntería, es el peso.** Un cántaro lleno
son diez kilos y el niño aguanta diecisiete: cada viaje al río es una decisión.

---

## Qué hay dentro

| | |
|---|---|
| **Motor** | WebGPU (WGSL) con respaldo automático a WebGL2 (GLSL), con el mismo sombreado en los dos: mapa de sombras direccional 2048² con PCF, instanciación, MSAA ×4, viento en el vertex shader, agua con olas y espuma de orilla, cielo procedural con nubes y estrellas, niebla aérea con dispersión hacia el sol y tonemapping ACES |
| **Arte** | Ninguno: cada árbol, animal, casa y planta se construye con código en `src/render/modelos.js` |
| **Sonido** | Tampoco hay archivos: el río, el viento, la lluvia, los pasos según el suelo, los pájaros de día, los grillos de noche, el fogón y cada acción se sintetizan con WebAudio |
| **Orientación** | Mapa del valle dibujado del propio relieve, con la casa, la poza, la milpa, el cono de visión y la bandera del objetivo (tecla Q) |
| **Mundo** | Valle de 240 × 240 m generado de una semilla, con río tallado, monte, potrero y milpa. La misma semilla da el mismo valle en cualquier dispositivo |
| **Simulación** | Ciclo día/noche, dos estaciones, chubascos por hora, crecimiento de cultivos día a día con humedad, maleza y plaga, y fauna que te oye y te huele según de dónde venga el viento |
| **Historia** | 8 capítulos con objetivos comprobables, escritos como datos para poder ampliarlos |
| **Estrategia** | El peso que se carga, el mes que es, la hora a la que pica el pez y la dirección del viento |
| **Acción** | El pulso con el pez, el tiro con la hondilla y el hacha rajando leña |
| **Tamaño** | 385 kB en un solo archivo, funciona sin conexión |

---

## El código

```
index.html            la página del juego
assets/estilos.css    sistema de diseño de la interfaz
src/
  main.js             portada, partida nueva / continuar
  partida.js          orquestador: une mundo, reglas, render e interfaz
  nucleo/             bucle de paso fijo, reloj, entrada, estado, sonido, matemáticas
  mundo/              terreno, dispersión, clima, fauna
  reglas/             inventario, necesidades, habilidades, cultivo, caza,
                      pesca, recolección, cocina, hogar, progresión, acciones
  contenido/          objetos, cultivos, plantas, peces, recetas, capítulos
  render/             WebGPU + WebGL2, shaders, geometría procedural, cámara
  vista/              simulación → instancias que dibujar; el niño animado
  ui/                 HUD, mapa del valle, paneles, diálogo, minijuegos, táctil
test/                 68 pruebas con node --test
tools/                empaquetador propio, build y servidor de desarrollo
```

Regla de oro: **`reglas/` y `contenido/` no tocan el DOM ni el motor gráfico.**
Por eso se pueden probar sin navegador, y por eso el juego se puede ampliar sin
miedo a romper lo que ya funciona.

---

## Ampliarlo

La historia y todo el catálogo son **datos**, no código. Añadir un capítulo es
escribir un objeto en `src/contenido/capitulos.js` con su diálogo, sus objetivos
comprobables y su premio. Lo mismo con objetos, cultivos, recetas, animales y lo
que da el monte.

👉 **[docs/AMPLIAR.md](docs/AMPLIAR.md)** — guía completa: tipos de objetivo,
dónde se toca cada cosa y las perillas de equilibrio.

Y la historia que se está escribiendo aquí no es inventada: sale de recuerdos
reales. Lo que hay hoy en `capitulos.js` es un andamio hasta que lleguen.

👉 **[docs/RECUERDOS.md](docs/RECUERDOS.md)** — dónde volcarlos, y qué parte del
juego toca cada cosa que se cuente.

---

## Publicarlo en internet

El sitio es estático. Con el repositorio en público y *Settings → Pages →
Source: GitHub Actions*, el flujo `.github/workflows/paginas.yml` (que se lanza
a mano desde la pestaña **Actions**) lo deja en
`https://<usuario>.github.io/monte-adentro/`.

---

## Privacidad

La partida se guarda en `localStorage`, en el propio navegador. No hay servidor,
no hay cuenta y no sale nada del dispositivo.

## Licencia

MIT — ver [LICENSE](LICENSE).
