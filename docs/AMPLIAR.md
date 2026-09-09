# Cómo ampliar Monte Adentro

**Un niño que se cría en el campo.** Aprende a cazar, a pescar, a rebuscar en el
monte, a sembrar su milpa y a traer agua y leña a una casa donde no hay luz ni
tubería. Cada día que la casa tiene lo que necesita cuenta; cada cosa que
aprende le abre algo que ayer no podía hacer.

Se juega abriendo `index.html` (o `dist/monte-adentro.html`, que es el juego
entero en un solo archivo, sin ninguna dependencia externa).

---

## 1. Cómo se juega

| Acción | Teclado | Mando | Móvil |
|---|---|---|---|
| Moverse | WASD o flechas | palanca izquierda | palanca (mitad izquierda) |
| Mirar | arrastrar el ratón | palanca derecha | arrastrar (mitad derecha) |
| Correr | Shift | L2 / L3 | botón 🏃 |
| Agacharse | C o Ctrl | B | — |
| Interactuar | E o Enter | X | botón ✋ |
| Acción / minijuego | Espacio | A | botón ⚡ |
| Mapa del valle | Q | — | botón 🗺️ |
| El rancho (niveles y obras) | R | — | botón 🛖 |
| Canasta · Diario · Pausa | I · J · Esc | Y · Start | botones de arriba |
| Segunda y tercera opción | 1, 2, 3 | — | tocar la opción |

El bucle del día: levantarse, ver qué falta en la casa, ir al río, subir agua,
juntar leña, buscar comida (monte, río o milpa), cocinar en el fogón, entregar
en casa y dormir. Al cerrar el día se puntúa con estrellas.

**Lo que decide una partida no es la puntería, es el peso.** Un cántaro lleno
son diez kilos y el niño aguanta diecisiete: cada viaje al río es una decisión.

Y por encima de ese día está el bucle largo, que es el juego de verdad: traer
más de lo que se gasta, guardar la sobra en la despensa, levantar con ella la
siguiente obra, y que esa obra permita traer más todavía. Ocho niveles de
rancho, de la choza de palma a los seis años a la casa propia a los veintiuno.

---

## 2. Mapa del código

```
index.html                  página del juego
assets/estilos.css          sistema de diseño de la interfaz
src/
  main.js                   portada, partida nueva / continuar
  partida.js                orquestador: une mundo, reglas, render e interfaz
  nucleo/
    mate.js                 matrices, vectores, ruido
    bucle.js                bucle de paso fijo (1/60 s) + dibujado por cuadro
    reloj.js                hora, día, fases del día
    entrada.js              teclado, ratón, táctil y mando en una sola interfaz
    estado.js               la partida guardada (localStorage, con migraciones)
  mundo/
    terreno.js              el valle: relieve, río tallado, zonas, lugares
    dispersion.js           reparto determinista de árboles, piedras y recursos
    clima.js                estaciones, chubascos, viento, temperatura
    fauna.js                animales: dónde aparecen y cuándo te descubren
  reglas/                   TODO ESTO ES CÓDIGO PURO Y TESTEABLE (sin DOM)
    inventario.js           qué se lleva y cuánto pesa
    necesidades.js          hambre, sed, aguante, ánimo
    habilidades.js          siete oficios, niveles y desbloqueos
    cultivo.js              la milpa: arar, sembrar, regar, plaga, cosecha
    recoleccion.js          rebuscar en el monte y juntar leña
    pesca.js                calidad del sitio, picada y pulso con el pez
    caza.js                 apuntado, viento, desvío y trampas
    cocina.js               fogón y taller
    hogar.js                lo que la casa consume y el aporte del niño
    construccion.js         el rancho: qué se puede levantar, qué cuesta,
                            cuántos días tarda y qué da cuando está
    familia.js              el reparto del día entre los nueve de la casa
    progresion.js           capítulos: cuándo se ofrecen y cómo se comprueban
    acciones.js             qué se puede hacer aquí y qué pasa al hacerlo
  contenido/                LOS DATOS: ampliar el juego es tocar esta carpeta
    objetos.js  cultivos.js  plantas.js  peces.js  recetas.js
    capitulos.js  dialogos.js
    construcciones.js       los ocho niveles del rancho y las nueve obras
  render/
    renderizador.js         elige WebGPU y cae a WebGL2
    webgpu.js  wgsl.js      camino principal
    webgl2.js  glsl.js      respaldo
    malla.js  modelos.js    geometría procedural (no hay archivos de arte)
    escena.js  camara.js  cielo.js
  vista/
    mundo3d.js              convierte la simulación en instancias que dibujar
    personaje.js            el niño, animado por piezas
  ui/
    hud.js  mapa.js  paneles.js  dialogo.js  minijuegos.js  tacto.js  base.js
test/
  reglas.test.js            60 pruebas de las reglas
  mundo.test.js             25 pruebas del valle y del motor
tools/
  empaquetar.mjs            empaquetador propio (sin dependencias)
  build.mjs                 genera dist/monte-adentro.html
  servidor.mjs              servidor estático para desarrollo
```

Regla de oro: **`reglas/` y `contenido/` no tocan el DOM ni el motor gráfico.**
Por eso se pueden probar con `node --test` y por eso el juego se puede seguir
ampliando sin miedo a romper lo que ya funciona.

---

## 3. Añadir un capítulo (lo más habitual)

Todo vive en `src/contenido/capitulos.js`. Un capítulo es un objeto:

```js
{
  id: 'tormenta',                       // único
  titulo: 'La noche del rayo',
  subtitulo: 'Lo que hay que salvar antes de que caiga',
  requiere: ['aguacero'],               // capítulos previos
  dia: 12,                              // opcional: día mínimo de partida
  intro: [
    { quien: 'abuela', texto: 'Ese trueno viene del cerro. Meté todo.' },
    { quien: 'nino',   texto: '¿Y los animales?' },
  ],
  objetivos: [
    { id: 'lena',  texto: 'Guardar 8 leñas',        tipo: 'entregar', objeto: 'lena', meta: 8 },
    { id: 'techo', texto: 'Dormir bajo techo',      tipo: 'accion',   accion: 'dormir', meta: 1 },
  ],
  premio: {
    xp: { fuerza: 60, espiritu: 40 },
    objetos: [{ id: 'candil', cantidad: 1 }],
    sabe: ['reparar'],                  // desbloquea recetas o hallazgos
  },
  cierre: [{ quien: 'papa', texto: 'Aguantó el techo. Aguantaste vos.' }],
  consejo: 'Con el candil se ve algo de noche; sin él, hay que esperar la luna.',
}
```

**Tipos de objetivo** (los evalúa `reglas/progresion.js`):

| tipo | campos | qué mide |
|---|---|---|
| `entregar` | `objeto`, `meta` | unidades llevadas a la casa |
| `entregarCategoria` | `categoria` (`alimento`…), `meta` | idem, por familia |
| `juntar` | `objeto`, `meta` | lo que hay en canasta + despensa |
| `accion` | `accion`, `meta` | veces que se hizo algo (`pescar`, `cazar`, `buscar`, `sembrar`, `regar`, `cosechar`, `lena`, `agua`, `banar`, `jugar_lluvia`, `trampa`, `dormir`) |
| `cocinar` | `receta`, `meta` | veces que se cocinó esa receta |
| `sembrar` | `cultivo`, `meta` | cuadros sembrados de ese cultivo |
| `cosechar` | `meta` | cosechas levantadas |
| `habilidad` | `habilidad`, `meta` | nivel alcanzado |
| `dias` | `meta` | días seguidos cubriendo la casa |
| `estrellas` | `meta` | estrellas acumuladas |
| `valor` | `meta` | valor de cambio de lo que se tiene |
| `lugar` | `lugar` | haber llegado a un sitio del valle |
| `rancho` | `meta` | nivel del rancho alcanzado (1 a 8) |
| `construccion` | `construccion`, `meta` | nivel levantado de esa obra |

Los contadores se miden **desde que empieza el capítulo**, no desde el principio
de la partida: lo que ya habías hecho antes no cuenta.

Después de añadirlo, `npm test` comprueba solo que el capítulo esté bien
formado (ids que existen, personajes definidos, tipos válidos).

### Personajes

Están en `PERSONAJES`, en el mismo archivo. Para añadir uno:

```js
tio: { nombre: 'Tío Goyo', color: '#c9b26e' },
```

Hoy son: `nino` (Vos), `mama`, `papa`, `mayor`, `hermana`, `chiquito`, `abuela`,
`perro` y `narrador`. Los hermanos que hablan son tres, no siete: la historia es
la del niño, y una casa con siete voces no se sigue. Los otros están en el
reparto del día (`reglas/familia.js`), que sí son nueve.

---

## 3 bis. El rancho: los niveles y las obras

Aquí es donde se hace crecer el juego a lo largo. Todo vive en
`src/contenido/construcciones.js`, y también son datos.

**Un nivel del rancho** (la espina; hoy son ocho, de los 6 a los 21 años):

```js
{
  nivel: 4, edad: 10,
  nombre: 'Paredes de bahareque', icono: '🏡',
  descripcion: 'Varas y barro. Ya no entra el aire por todos lados.',
  coste: { madera: 30, barro: 40, bejuco: 20 },   // sale de la despensa
  dias: 6,                                        // días de obra
  requiere: { pila: 1 },                          // qué hay que tener antes
  abre: ['El corral', 'El horno'],                // se avisa al terminarlo
  efecto: { abrigo: 2, animoCasa: 4 },
}
```

**Una construcción** (hoy nueve, cada una con sus niveles):

```js
{
  id: 'gallinero', nombre: 'El gallinero', icono: '🐓',
  requiereRancho: 2,                    // nivel mínimo de rancho para empezarla
  descripcion: 'Cuatro gallinas y un gallo.',
  niveles: [
    { coste: { madera: 12, bejuco: 8 }, dias: 2,
      texto: 'Cuatro gallinas', efecto: { huevosDia: 1 } },
  ],
}
```

**La regla que da forma a todo:** ninguna construcción pasa del nivel del
rancho. `topeDe(rancho, id)` es `nivel del rancho − (requiereRancho − 1)`, así
que subir el rancho es siempre lo que destraba lo demás. Si al añadir algo se
rompe la cadena, la prueba *«se puede subir de la choza de palma hasta la casa
propia»* lo dice: recorre los ocho niveles levantando lo que haga falta y falla
si queda un callejón sin salida.

**Los efectos** se suman en `efectos(rancho)` (`reglas/construccion.js`). Si
inventás una clave nueva hay que declararla en el objeto `total` de esa función,
o se sumará sobre `undefined` y saldrá `NaN`. Las que hay: `cocinar`,
`capacidadDespensa`, `cargaExtra`, `aguaGuardada`, `aguaAhorrada`, `aguaDia`,
`huevosDia`, `carneDia`, `lecheDia`, `abonoDia`, `huertaDia`, `plazasMilpa`,
`abrigo`, `animoCasa`, `lenaPorReceta`, `cocinaRapida`, `perdidaCosecha`,
`hornear`, `cocerTeja`, `semillaSegura`, `lenaSeca`, `propia`. Las booleanas se
quedan en `true` en cuanto algo las enciende; `cocinaRapida` se queda con la
menor; `abrigo` y `capacidadDespensa` con la mayor; el resto se suman.

**La edad sale del nivel del rancho**, no del calendario: `edadEn(nivel)`. Subir
la casa es crecer. De ahí sale la cuota que se le pide al niño cada día
(`cuota(edad, {cocina})` en `reglas/hogar.js`), que va de los 6 litros de los
seis años a la casa entera a los veintiuno.

## 3 ter. La familia y el reparto del día

`src/reglas/familia.js`. Nueve en la casa contando al niño. Cada persona tiene
`fuerza` y una lista de lo que `puede` hacer, y eso es todo lo que hace falta
para añadir a alguien:

```js
{ id: 'tio', nombre: 'Tío Goyo', rol: 'tio', icono: '👨', fuerza: 1.5,
  puede: ['milpa', 'obra', 'lena'], nota: 'Viene en cosecha y se va.' },
```

Las tareas son `agua`, `lena`, `monte`, `milpa`, `obra` y `casa`. Lo que rinden
está en `rendir(persona, tarea, ctx)`: el agua y la leña por fuerza, el monte
por estación. Al cerrar el día, `trabajoDelDia()` devuelve lo que trajeron, la
fuerza puesta en la obra (que adelanta días) y quién quedó en la casa.

**Cuidado con una cosa al tocar esto:** lo que traiga la familia va a la
despensa, pero **no cuenta como el mandado del niño**. Su cuota se mide contra
`hogar.traidoHoy`, que solo crece cuando entrega él. Si eso se rompe, mandar a
un hermano por agua le hace el mandado y el día deja de significar nada.

---

## 4. Añadir cosas

**Un objeto** → `src/contenido/objetos.js`. Una línea basta; el inventario, la
cocina, el aporte a la casa y las misiones lo recogen solos.

```js
guineo: { nombre: 'Guineo', icono: '🍌', tipo: 'comida', peso: 0.2,
          valor: 3, hambre: 8, animo: 4 },
```

**Que se pueda encontrar** → `src/contenido/plantas.js`:

```js
{ id: 'guineo', objeto: 'guineo', fuente: 'monte', zonas: ['ribera'],
  meses: [6, 7, 8], peso: 4, cantidad: [1, 3], xp: 4 },
```

`fuente` puede ser `frutal`, `mata`, `monte`, `ribera` o `casa`; `meses` vacío
significa todo el año; `requiere` pide un desbloqueo; `trasLluvia: true` lo
limita a los días siguientes a un aguacero.

**Una receta** → `src/contenido/recetas.js` (`tipo: 'fogon'` o `'taller'`).

**Un cultivo** → `src/contenido/cultivos.js` + una malla por etapa en
`src/render/modelos.js` (mira `mataMaiz` como plantilla) + engancharla en
`src/vista/mundo3d.js` (mapa `fn` dentro de `construir`).

**Un animal** → `PERFILES` en `src/mundo/fauna.js` (horas activas, zonas, olfato,
oído, presa que deja) + su malla en `src/render/modelos.js` + su lote en
`src/vista/mundo3d.js` (`lotesFauna`).

**Una acción nueva** → dos sitios en `src/reglas/acciones.js`: ofrecerla en
`interaccionesCerca` y resolverla en `ejecutar`. Devuelve
`{ ok, texto, objetos, xp, habilidad, tiempo, actividad, contador, minijuego }`
y `src/partida.js` se encarga del resto (añadir al inventario, subir nivel, avanzar
el reloj, comprobar el capítulo).

---

## 5. Perillas de equilibrio

| Qué | Dónde |
|---|---|
| Duración del día (16 min reales) | `src/nucleo/reloj.js`, `minutosPorDia` |
| Carga que aguanta el niño | `src/reglas/inventario.js`, `CARGA_BASE` |
| Gasto de hambre, sed y aguante | `src/reglas/necesidades.js`, `ACTIVIDADES` |
| Consumo diario de la casa (nueve personas) | `src/reglas/hogar.js`, `CONSUMO` |
| Lo que se le pide al niño según su edad | `src/reglas/hogar.js`, `cuota()` |
| Coste y días de cada nivel del rancho | `src/contenido/construcciones.js`, `NIVELES_RANCHO` |
| Coste y días de las obras | `src/contenido/construcciones.js`, `CONSTRUCCIONES` |
| Cuánto adelanta un ayudante en la obra | `src/reglas/construccion.js`, `avanzarObra` (0,5 días por ayudante) |
| Lo que rinde cada quien en su tarea | `src/reglas/familia.js`, `rendir()` |
| Curva de niveles | `src/reglas/habilidades.js`, `xpParaNivel` |
| Días y agua de cada cultivo | `src/contenido/cultivos.js` |
| Probabilidad de lluvia por mes | `src/mundo/clima.js`, `LLUVIA_MES` |
| Dificultad de la caza | `src/mundo/fauna.js` (`radioVista`, `olfato`) y `src/reglas/caza.js` |
| Densidad del monte | `src/mundo/dispersion.js`, `FLORA` y `repartir(t, { densidad })` |
| Volumen y mezcla del sonido | `src/nucleo/audio.js` (`ambiente()` y cada golpe) |
| Sitio de la casa, la milpa y la poza | `src/mundo/terreno.js`, `LUGARES` |

---

## 6. Motor gráfico

Dos caminos, mismo resultado:

- **WebGPU** (`src/render/webgpu.js` + `wgsl.js`) — el camino preferente. Pases de
  sombra y de color, MSAA ×4, instancias en buffer de almacenamiento.
- **WebGL2** (`src/render/webgl2.js` + `glsl.js`) — respaldo automático.

Ambos hacen lo mismo: mapa de sombras direccional de 2048² con PCF 3×3, viento
que mueve la vegetación en el vertex shader, agua con olas y espuma de orilla,
cielo procedural con nubes y estrellas, niebla aérea con dispersión hacia el sol
y tonemapping ACES. Los colores se escriben en sRGB y se linealizan al sombrear.

**No hay ni un archivo de arte**: cada árbol, animal, casa y planta se construye
con código en `src/render/modelos.js`. Eso es lo que hace que el juego entero pese
menos de 400 kB en un solo archivo.

Si algo se ve mal en un equipo concreto: Pausa → *Motor* alterna entre
automático, WebGL2 y WebGPU, y *Calidad* baja la hierba y el mapa de sombras.

---

## 7. Pruebas

```bash
npm test                    # las 85 pruebas: reglas del juego y mundo
npm run build               # regenera dist/monte-adentro.html
npm run dev                 # servidor local en http://localhost:4173
npm run verify              # pruebas + empaquetado
```

No hay dependencias que instalar: `npm install` no descarga nada.

Las reglas son puras a propósito: si estas pruebas pasan, el juego es justo
aunque el motor gráfico cambie entero.
