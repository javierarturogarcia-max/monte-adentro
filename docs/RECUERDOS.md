# Sus recuerdos

Este archivo es la materia prima del juego. Todo lo que hay ahora en
`src/contenido/capitulos.js` es un andamio: nombres y escenas que me inventé
para que el juego tuviera forma mientras llegaba lo de verdad.

**Escriba como le salga.** No hace falta orden, ni ortografía, ni frases
enteras. Sirve una lista suelta, un audio transcrito, tres líneas hoy y diez
mañana. Yo me encargo de convertirlo en capítulos, diálogos y objetivos.

Lo único que le pido: **cosas concretas**. "Íbamos por agua" vale menos que
"había que bajar por el guayabo grande, y de subida el cántaro se sentía
distinto en la última cuesta". Lo concreto es lo que se puede jugar.

---

## 1. El lugar

- ¿Dónde era? Cantón, caserío, municipio, país.
- ¿Cómo era la casa? De qué estaba hecha, cuántos cuartos, dónde se cocinaba,
  dónde dormía usted.
- ¿De dónde salía el agua? ¿A qué distancia? ¿Cuántos viajes al día?
- ¿Y la luz? ¿Candil, ocote, vela, nada?
- El río o la quebrada: ¿tenía nombre? ¿Había una poza donde se bañaban?
- El monte: ¿qué había allá arriba? ¿A qué le tenían miedo?
- ¿Qué se veía desde la casa al abrir la puerta por la mañana?

## 2. La gente

- Nombres reales de quienes vivían en la casa, y cómo les decían de verdad.
- ¿Quién mandaba los mandados? ¿Quién enseñaba qué?
- ¿Había perro? ¿Cómo se llamaba?
- **Frases.** Esto es oro: lo que decían de verdad. Un regaño, un dicho de la
  abuela, lo que gritaba su mamá desde el corredor. Va tal cual al juego.

## 3. El trabajo

- ¿Cuál fue el **primer** mandado que recuerda? ¿Qué edad tenía?
- ¿Qué se sembraba? ¿En qué mes? ¿Quién araba?
- ¿Cazaba? ¿Con qué? ¿Qué se cazaba y qué no se tocaba?
- ¿Pescaba? ¿Con caña, con atarraya, con la mano?
- ¿Qué se recogía del monte y en qué época? Frutas, hongos, hierbas, leña.
- ¿Qué era lo más pesado? ¿Qué era lo que más costaba?

## 4. La comida

- Qué se comía un día normal. Qué se comía cuando no había.
- Qué se comía en un día bueno.
- ¿Quién cocinaba y en qué?

## 5. Los días que se acuerda

Aquí es donde salen los capítulos. Cada uno de estos puede ser uno:

- El día que se perdió algo, o alguien.
- El día del aguacero grande.
- La primera vez que trajo algo y sintió que servía.
- Un castigo que se acuerda.
- Un día de fiesta.
- El día que se fue de ahí, si se fue.
- Lo que hacían para divertirse cuando no había con qué.

## 6. Lo que quiere que quede

- ¿Qué quiere que sienta quien lo juegue?
- ¿Hay algo que **no** quiere que salga en el juego? Se respeta sin preguntar.
- ¿El niño se llama como usted, o le ponemos otro nombre?

---

## Qué hago yo con esto

| Lo que usted escribe | Dónde acaba en el juego |
|---|---|
| Nombres y frases de la familia | `src/contenido/capitulos.js` y `dialogos.js` |
| Un día que recuerda | un capítulo con sus objetivos y su cierre |
| Comidas concretas | `src/contenido/objetos.js` y `recetas.js` |
| Lo que se sembraba y cuándo | `src/contenido/cultivos.js` y el calendario del clima |
| Animales, frutas, hierbas del monte | `plantas.js`, `peces.js`, `mundo/fauna.js` |
| Cómo era el terreno | `src/mundo/terreno.js`: el cauce, la poza, la loma, la casa |
| Lo que costaba cargar | el peso de las cosas y el aguante del niño |

Cuando haya material, se lo devuelvo en capítulos jugables y usted me dice qué
suena a mentira. Eso es lo que hay que corregir: lo que no se parece a como fue.
