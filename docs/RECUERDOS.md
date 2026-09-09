# Sus recuerdos

Este archivo es la materia prima del juego.

---

## Lo que ya está dentro

Esto no hace falta volver a contarlo: ya está construido y es la base de todo
lo demás.

| Lo que contó | Dónde está en el juego |
|---|---|
| Tenía **seis años** | El juego empieza ahí. La edad sale del nivel del rancho: `edadEn()` en `contenido/construcciones.js` |
| El primer mandado: *«andá a acarrear agua, ve a buscar leña»* | El capítulo 1, `agua`, en `contenido/capitulos.js`. Seis litros y dos leñas |
| *«ir a cazar aves para comer, garrobos para comer»* | Aves y garrobos en `mundo/fauna.js`. El garrobo sale al mediodía, con calor, en el monte y la ribera |
| **No había gas, ni luz, ni agua** | No hay electricidad en el valle; el agua se acarrea del río. Sin fogón no se cocina, y hasta que no lo hay no se le pide comida |
| La casa era una **choza** | El nivel 1 del rancho: choza de palma. La malla de la casa cambia en los ocho niveles (`render/modelos.js`, `choza()`) |
| Algunos **árboles frutales** | Mango, jocote y guayaba en `contenido/plantas.js`, repartidos cerca de la casa |
| **Los dos padres cultivaban**, y la madre además hacía todo el oficio | En `reglas/familia.js`: papá y mamá pueden `milpa`; mamá empieza en `casa` y también puede monte y agua |
| **Siete hijos: cinco varones y dos hembras** | Los nueve de la casa, en `FAMILIA`. El consumo diario es de nueve personas |
| *«cómo el niño va avanzando, con ayuda de sus padres y de los hermanos»* | El reparto del día: ellos traen y adelantan la obra, pero el mandado del niño lo hace él |
| *«hasta llegar a hacerse adulto y con su propia familia»* | Los ocho niveles, de los 6 a los 21 años. El último es «Tu propia casa» |
| *«como Whiteout Survival pero en el campo, iniciar casi de la nada»* | Se empieza con un guacal y una choza de palma. Todo lo demás se levanta |

Lo que sigue es lo que **falta** por saber. Cada respuesta se convierte en algo
concreto del juego.

---

## Cómo contarlo

**Escriba como le salga.** No hace falta orden, ni ortografía, ni frases
enteras. Sirve una lista suelta, un audio transcrito, tres líneas hoy y diez
mañana. Yo me encargo de convertirlo en capítulos, diálogos y objetivos.

Lo único que le pido: **cosas concretas**. "Íbamos por agua" vale menos que
"había que bajar por el guayabo grande, y de subida el cántaro se sentía
distinto en la última cuesta". Lo concreto es lo que se puede jugar.

---

## 1. El lugar

- ¿Dónde era? Cantón, caserío, municipio, país.
- La choza: ¿de qué era el techo, de qué las paredes? ¿Dónde dormían nueve?
  ¿Dónde se cocinaba?
- ¿Cómo fue cambiando la casa con los años? Eso es la espina del juego: los ocho
  niveles de ahora me los inventé yo (corredor, troje, bahareque, adobe, teja,
  cuartos). **Dígame cómo fue de verdad y los cambio.**
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

- El primer mandado ya lo sé (agua y leña, a los seis). ¿Cuál fue el **segundo**?
  ¿Qué le costó más aprender?
- ¿Cuántos viajes de agua al día, y en qué se cargaba? ¿Cántaro, guacal, cubeta?
- ¿Qué se sembraba? ¿En qué mes? ¿Quién araba?
- Los garrobos: ¿cómo se cazaban? ¿Con hondilla, con perro, con lazo? ¿A qué
  hora salían de verdad? ¿Cómo se comían?
- Las aves: ¿cuáles? ¿Con qué se tiraba?
- ¿Qué **no** se tocaba, aunque hubiera?
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
| **Cómo fue cambiando la casa** | los ocho niveles del rancho, en `contenido/construcciones.js` |
| Quién hacía qué en la casa | el reparto del día, en `reglas/familia.js` |

Cuando haya material, se lo devuelvo en capítulos jugables y usted me dice qué
suena a mentira. Eso es lo que hay que corregir: lo que no se parece a como fue.
