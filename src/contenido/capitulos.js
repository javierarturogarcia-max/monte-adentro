/**
 * capitulos.js — La historia, por capitulos.
 *
 * ESTE ES EL ARCHIVO QUE HAY QUE TOCAR PARA QUE EL JUEGO CREZCA.
 * Cada capitulo es un objeto con esta forma:
 *
 *   id         identificador unico
 *   titulo     como aparece en el diario
 *   subtitulo  una linea que resume lo que toca hacer
 *   requiere   ids de capitulos que hay que terminar antes ([] = desde el principio)
 *   dia        dia minimo de partida para que se ofrezca (opcional)
 *   intro      dialogo de apertura: [{quien, texto}]
 *   objetivos  lista de metas comprobables (ver TIPOS mas abajo)
 *   premio     {xp:{habilidad:n}, objetos:[{id,cantidad}], sabe:['id']}
 *   cierre     dialogo al terminar
 *   consejo    pista que se ve en el diario mientras esta activo
 *
 * TIPOS DE OBJETIVO (los evalua reglas/progresion.js):
 *   {tipo:'entregar',  objeto:'agua', meta:9}      llevar a la casa
 *   {tipo:'juntar',    objeto:'lena', meta:3}      tenerlo encima o en la despensa
 *   {tipo:'accion',    accion:'pescar', meta:3}    hacer algo N veces
 *   {tipo:'habilidad', habilidad:'pesca', meta:2}  llegar a nivel N
 *   {tipo:'cocinar',   receta:'tortilla', meta:1}
 *   {tipo:'sembrar',   cultivo:'maiz', meta:2}
 *   {tipo:'cosechar',  meta:1}
 *   {tipo:'dias',      meta:3, condicion:'cumplido'}  dias seguidos cubriendo la casa
 *   {tipo:'lugar',     lugar:'poza'}               llegar a un sitio
 *   {tipo:'estrellas', meta:3}                     dias de 3 estrellas acumulados
 */

/**
 * En la casa son nueve: el padre, la madre y siete hijos —cinco varones y dos
 * hembras—. El nino es uno de los varones, y es el unico que se juega: los
 * demas ayudan, mandan y ensenan, pero la historia es la suya.
 *
 * Los nombres son de relleno hasta que lleguen los de verdad
 * (ver docs/RECUERDOS.md).
 */
export const PERSONAJES = {
  nino:    { nombre: 'Vos', color: '#f5c77e' },
  mama:    { nombre: 'Mamá', color: '#f2a4a4' },
  papa:    { nombre: 'Papá', color: '#8fb8e8' },
  mayor:   { nombre: 'El mayor', color: '#9fd08a' },
  hermana: { nombre: 'La hermana mayor', color: '#8fe0c0' },
  chiquito: { nombre: 'El chiquito', color: '#e0c08f' },
  abuela:  { nombre: 'Abuela', color: '#c9a6e8' },
  perro:   { nombre: 'El perro', color: '#d9b48f' },
  narrador: { nombre: '', color: '#cfd8e3' },
};

export const CAPITULOS = [
  {
    id: 'agua',
    titulo: 'Andá a acarrear agua',
    subtitulo: 'Seis años. En esta choza no hay luz, no hay agua y no hay gas.',
    requiere: [],
    intro: [
      { quien: 'narrador', texto: 'Cuatro horcones, palma arriba y el suelo de tierra. Eso es la casa. Y son nueve los que viven en ella.' },
      { quien: 'mama', texto: 'Ya estás grande. Andá a acarrear agua, que no hay ni para el café.' },
      { quien: 'nino', texto: '¿Con qué la traigo?' },
      { quien: 'mama', texto: 'Con el guacal. Cuando puedas con el cántaro, te lo doy.' },
      { quien: 'mama', texto: 'Y de vuelta, buscá leña. Sin leña no se cocina, y aquí no hay gas.' },
    ],
    objetivos: [
      { id: 'agua', texto: 'Llevar 6 litros de agua a la casa', tipo: 'entregar', objeto: 'agua', meta: 6 },
      { id: 'lena', texto: 'Llevar 2 leñas a la casa', tipo: 'entregar', objeto: 'lena', meta: 2 },
    ],
    premio: { xp: { fuerza: 40 }, objetos: [{ id: 'cantaro', cantidad: 1 }] },
    cierre: [
      { quien: 'mama', texto: 'Mirá vos. Con eso alcanza para hoy.' },
      { quien: 'mama', texto: 'Tomá el cántaro. Aguanta diez litros: son menos viajes, pero pesa más.' },
      { quien: 'narrador', texto: 'Fue el primer mandado. Después vinieron todos los demás.' },
    ],
    consejo: 'El guacal aguanta cuatro litros; el cántaro, diez. Cada litro pesa un kilo: mirá la carga abajo a la izquierda antes de arrancar.',
  },
  {
    id: 'fogon',
    titulo: 'Tres piedras y el comal',
    subtitulo: 'Lo primero que se levanta en un rancho es dónde cocinar',
    requiere: ['agua'],
    intro: [
      { quien: 'mama', texto: 'El fogón se cayó con el agua de anoche. Traé piedra del río y leña seca.' },
      { quien: 'papa', texto: 'Tres piedras bien puestas y el comal encima. Eso es todo, y sin eso no comemos.' },
    ],
    objetivos: [
      { id: 'piedra', texto: 'Llevar 8 piedras a la casa', tipo: 'entregar', objeto: 'piedra', meta: 8 },
      { id: 'obra', texto: 'Levantar el fogón (pestaña Rancho)', tipo: 'construccion', construccion: 'fogon', meta: 1 },
      { id: 'cocinar', texto: 'Hacer tortillas en el fogón', tipo: 'cocinar', receta: 'tortilla', meta: 1 },
    ],
    premio: { xp: { oficio: 45, fuerza: 20 }, sabe: ['cocina'] },
    cierre: [
      { quien: 'mama', texto: 'Ahora sí. Mientras haya fuego, hay casa.' },
      { quien: 'abuela', texto: 'Y el que sabe hacer fuego no pasa hambre en ningún lado.' },
    ],
    consejo: 'En la pestaña Rancho está todo lo que se puede levantar: cada cosa pide materiales y días de trabajo. Manda gente a la obra y se acaba antes.',
  },
  {
    id: 'monte',
    titulo: 'Lo que da el monte',
    subtitulo: 'Aprender a mirar el suelo y los palos',
    requiere: ['agua'],
    intro: [
      { quien: 'abuela', texto: 'Vení, siéntate. ¿Vos sabés cuál mata se come y cuál no?' },
      { quien: 'nino', texto: 'No.' },
      { quien: 'abuela', texto: 'Entonces vas a pasar hambre teniendo el monte lleno. Andá y traéme lo que encontrés; yo te digo qué sirve.' },
    ],
    objetivos: [
      { id: 'buscar', texto: 'Rebuscar 6 veces en el monte o en los palos', tipo: 'accion', accion: 'buscar', meta: 6 },
      { id: 'comida', texto: 'Llevar 5 cosas de comer a la casa', tipo: 'entregarCategoria', categoria: 'alimento', meta: 5 },
    ],
    premio: { xp: { recoleccion: 55 }, sabe: ['hongos'] },
    cierre: [
      { quien: 'abuela', texto: 'Los hongos salen dos días después del aguacero, al pie de los pinos. Los que tienen el sombrero rajado, esos no.' },
      { quien: 'abuela', texto: 'Ya sabés algo que no sabías ayer. Así se hace uno grande.' },
    ],
    consejo: 'Cada mes da su fruta: el mango en marzo, el jocote en junio. Lo que no está en su tiempo, no está.',
  },
  {
    id: 'rio',
    titulo: 'El pulso del río',
    subtitulo: 'Hacer la caña y aguantar el tirón',
    requiere: ['agua'],
    intro: [
      { quien: 'papa', texto: 'Hoy no hay carne. ¿Vas a llorar o vas a pescar?' },
      { quien: 'papa', texto: 'Necesitás pita y una vara. Lo demás es paciencia: el pez pica cuando el sol está bajo, no cuando a vos te da la gana.' },
    ],
    objetivos: [
      { id: 'cana', texto: 'Hacer una caña de pescar', tipo: 'cocinar', receta: 'cana', meta: 1 },
      { id: 'pescar', texto: 'Sacar 3 pescados del río', tipo: 'accion', accion: 'pescar', meta: 3 },
      { id: 'asar', texto: 'Asar un pescado en el fogón', tipo: 'cocinar', receta: 'pescado_asado', meta: 1 },
    ],
    premio: { xp: { pesca: 60, oficio: 25 }, sabe: ['cebo'] },
    cierre: [
      { quien: 'papa', texto: 'Ese guapote lo sacaste vos solo. Acordate del día.' },
      { quien: 'nino', texto: 'Me tembló la mano.' },
      { quien: 'papa', texto: 'A todos nos tiembla. Lo que cuenta es no soltar.' },
    ],
    consejo: 'En la poza honda hay pescado grande. Recogé cuando el pez afloja y soltá cuando tira: si forzás, se revienta la línea.',
  },
  {
    id: 'milpa',
    titulo: 'La milpa',
    subtitulo: 'Sembrar es creer en algo que todavía no se ve',
    requiere: ['monte'],
    intro: [
      { quien: 'papa', texto: 'Con la primera lluvia se siembra. Ni antes ni después.' },
      { quien: 'papa', texto: 'Arás el cuadro, metés la semilla y la cuidás. El maíz aguanta; el frijol perdona. Los dos se pierden si te olvidás.' },
    ],
    objetivos: [
      { id: 'sembrar', texto: 'Sembrar 3 cuadros de la milpa', tipo: 'accion', accion: 'sembrar', meta: 3 },
      { id: 'regar', texto: 'Regar la milpa 5 veces', tipo: 'accion', accion: 'regar', meta: 5 },
      { id: 'cosechar', texto: 'Levantar tu primera cosecha', tipo: 'cosechar', meta: 1 },
    ],
    premio: { xp: { siembra: 90 }, objetos: [{ id: 'azadon', cantidad: 1 }, { id: 'semilla_maiz', cantidad: 6 }], sabe: ['riego'] },
    cierre: [
      { quien: 'mama', texto: 'De aquí salen las tortillas de todo el año, Tino.' },
      { quien: 'papa', texto: 'Y la semilla del año que viene. Guardá siempre semilla. Siempre.' },
    ],
    consejo: 'Mirá el cuadro cada mañana: si dice "sed", regálo; si dice "maleza", limpiálo. La cosecha se decide en esos ratos.',
  },
  {
    id: 'caza',
    titulo: 'Aves y garrobos',
    subtitulo: 'La carne no se compra: se busca',
    requiere: ['monte'],
    intro: [
      { quien: 'papa', texto: 'Hoy no hay carne. Agarrá la hondilla y andate al monte.' },
      { quien: 'papa', texto: 'Aves, las que se dejen. Y garrobo, si aprieta el sol: sale a asolearse a la piedra y se queda quieto, creyendo que no lo ves.' },
      { quien: 'papa', texto: 'Los animales oyen mejor que vos y huelen mucho mejor. Si el viento va de vos hacia ellos, ya perdiste.' },
      { quien: 'papa', texto: 'Agachate. Andá despacio. Y tirá una sola vez.' },
    ],
    objetivos: [
      { id: 'arma', texto: 'Hacer una hondilla', tipo: 'cocinar', receta: 'hondilla', meta: 1 },
      { id: 'cazar', texto: 'Cobrar dos piezas en el monte', tipo: 'accion', accion: 'cazar', meta: 2 },
      { id: 'comida', texto: 'Asar la carne y llevarla a la casa', tipo: 'entregar', objeto: 'carne_asada', meta: 1 },
    ],
    premio: { xp: { caza: 80 }, sabe: ['rastro'] },
    cierre: [
      { quien: 'papa', texto: 'Hoy hay carne por vos.' },
      { quien: 'mama', texto: 'Nueve bocas, y hoy una la llenaste vos.' },
      { quien: 'abuela', texto: 'Del monte se toma lo que hace falta, no más. El que agarra de más, un día no encuentra nada.' },
    ],
    consejo: 'El garrobo sale a la piedra al mediodía y solo cuando aprieta el verano. Se queda quieto: acercate despacio y no lo asustés, porque arranca como un rayo.',
  },
  {
    id: 'corredor',
    titulo: 'El corredor',
    subtitulo: 'Que la leña no se moje y se pueda estar cuando llueve',
    requiere: ['fogon', 'monte'],
    intro: [
      { quien: 'papa', texto: 'Vamos a alargarle el techo por delante. Con eso la leña se guarda seca y cuando llueve no hay que meterse todos adentro.' },
      { quien: 'papa', texto: 'Hace falta madera, palma y bejuco. La palma se corta de las palmeras de la ribera; el bejuco, en el monte.' },
      { quien: 'mayor', texto: 'Yo te ayudo con la madera. Entre los dos se hace en la mitad.' },
    ],
    objetivos: [
      { id: 'madera', texto: 'Llevar 8 maderas a la casa', tipo: 'entregar', objeto: 'madera', meta: 8 },
      { id: 'palma', texto: 'Llevar 10 palmas a la casa', tipo: 'entregar', objeto: 'palma', meta: 10 },
      { id: 'rancho', texto: 'Subir el rancho a nivel 2', tipo: 'rancho', meta: 2 },
    ],
    premio: { xp: { oficio: 60, fuerza: 40, espiritu: 25 } },
    cierre: [
      { quien: 'narrador', texto: 'Esa noche llovió, y por primera vez la leña amaneció seca.' },
      { quien: 'mama', texto: 'Ya tenés siete años y ya se te nota en la casa.' },
    ],
    consejo: 'Manda a tu papá y a tu hermano mayor a la obra desde la pestaña Familia: cada uno adelanta medio día de trabajo.',
  },
  {
    id: 'aguacero',
    titulo: 'El aguacero',
    subtitulo: 'La tormenta que se ve venir desde la loma',
    requiere: ['rio', 'milpa'],
    intro: [
      { quien: 'abuela', texto: 'Mirá el cielo por el lado del monte. Eso que viene negro no es sombra.' },
      { quien: 'mama', texto: 'Meté la leña bajo el corredor antes de que caiga, o mañana comemos frío.' },
      { quien: 'chiquito', texto: '¡Y después salimos a mojarnos! ¿Verdad que sí?' },
    ],
    objetivos: [
      { id: 'lena', texto: 'Tener 6 leñas guardadas antes del aguacero', tipo: 'entregar', objeto: 'lena', meta: 6 },
      { id: 'agua', texto: 'Dejar 12 litros de agua en la casa', tipo: 'entregar', objeto: 'agua', meta: 12 },
      { id: 'jugar', texto: 'Salir a jugar bajo la lluvia', tipo: 'accion', accion: 'jugar_lluvia', meta: 1 },
    ],
    premio: { xp: { espiritu: 70, fuerza: 30 }, sabe: ['cocina'] },
    cierre: [
      { quien: 'hermana', texto: '¡Estás todo enlodado! Y adiviná quién lava.' },
      { quien: 'nino', texto: 'Vos también.' },
      { quien: 'abuela', texto: 'Déjenlos, Rosa. Un aguacero se juega una vez y se acuerda toda la vida.' },
    ],
    consejo: 'Bajo la lluvia el ánimo sube rapidísimo, y con el ánimo alto se aguanta más el día siguiente.',
  },
  {
    id: 'seca',
    titulo: 'La seca',
    subtitulo: 'Cuando el río baja y hay que estirar todo',
    requiere: ['aguacero'],
    intro: [
      { quien: 'papa', texto: 'Se acabó el invierno. Ahora el agua está más lejos y la milpa pide todos los días.' },
      { quien: 'mama', texto: 'Vamos a ver de qué estás hecho, Tino.' },
    ],
    objetivos: [
      { id: 'dias', texto: 'Cubrir lo de la casa 4 días seguidos', tipo: 'dias', meta: 4, condicion: 'cumplido' },
      { id: 'fuerza', texto: 'Llegar a Fuerza 3', tipo: 'habilidad', habilidad: 'fuerza', meta: 3 },
    ],
    premio: { xp: { fuerza: 60, espiritu: 40 }, objetos: [{ id: 'cantaro', cantidad: 1 }], sabe: ['dos_cantaros'] },
    cierre: [
      { quien: 'papa', texto: 'Cuatro días seguidos sin que falte nada. Yo a tu edad no aguantaba dos.' },
      { quien: 'mama', texto: 'Ya no sos el que manda a hacer mandados. Ya sos el que resuelve.' },
    ],
    consejo: 'En la seca conviene madrugar: se carga más fresco y el aguante rinde el doble.',
  },
  {
    id: 'pueblo',
    titulo: 'El camino al pueblo',
    subtitulo: 'Lo que sobra se cambia por lo que falta',
    requiere: ['seca', 'caza'],
    intro: [
      { quien: 'papa', texto: 'El sábado bajamos al pueblo. Llevá lo que te sobre: cuero, pescado seco, maíz.' },
      { quien: 'papa', texto: 'Y aprendé a mirar el precio antes de decir que sí.' },
    ],
    objetivos: [
      { id: 'valor', texto: 'Juntar 140 en cosas para cambiar', tipo: 'valor', meta: 140 },
      { id: 'estrellas', texto: 'Acumular 6 estrellas de días buenos', tipo: 'estrellas', meta: 6 },
    ],
    premio: { xp: { oficio: 80, espiritu: 60 }, objetos: [{ id: 'machete', cantidad: 1 }], sabe: ['barro', 'atarraya'] },
    cierre: [
      { quien: 'narrador', texto: 'El camino al pueblo son dos horas de polvo y una cuesta.' },
      { quien: 'papa', texto: 'Este machete es tuyo. No lo prestés y no lo dejés en el monte.' },
      { quien: 'narrador', texto: 'Tino miró para atrás. Desde la cuesta se veía la casa, la milpa y el hilo del río. Todo eso lo había ayudado a levantar él.' },
      { quien: 'narrador', texto: 'Y todavía le faltaba mucho valle por aprender.' },
    ],
    consejo: 'El cuero del venado y el pescado grande son lo que más se paga. La fruta se pudre: esa se come.',
  },
];

export function capitulo(id) { return CAPITULOS.find((c) => c.id === id) || null; }
export const IDS_CAPITULOS = CAPITULOS.map((c) => c.id);
