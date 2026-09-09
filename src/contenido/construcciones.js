/**
 * construcciones.js — El rancho y todo lo que se levanta en el.
 *
 * ESTA ES LA ESPINA DEL JUEGO. Todo lo demas —acarrear agua, juntar lena,
 * cazar, sembrar— existe para alimentar esto: un rancho que empieza siendo
 * una choza de palma y termina siendo una casa, y un nino de seis anos que
 * termina siendo un hombre con su propia familia.
 *
 * Funciona como el horno de Whiteout Survival: el NIVEL DEL RANCHO manda, y
 * ninguna construccion puede pasar de el. Para subirlo hacen falta materiales,
 * dias de trabajo y tener antes lo que ese nivel pide. Cada nivel envejece al
 * nino y le abre algo que ayer no podia hacer.
 *
 * Para anadir una construccion nueva basta con escribir una entrada aqui.
 */

/**
 * Los ocho niveles del rancho. `edad` es la del nino al alcanzarlo: la
 * historia entera va de los 6 anos a la casa propia.
 */
export const NIVELES_RANCHO = [
  {
    nivel: 1, nombre: 'Choza de palma', edad: 6, icono: '🛖',
    descripcion: 'Cuatro horcones, palma arriba y el suelo de tierra. No hay luz, no hay agua, no hay gas.',
    coste: {}, dias: 0, requiere: {},
    abre: ['Acarrear agua del río', 'Juntar leña', 'Rebuscar en el monte'],
  },
  {
    nivel: 2, nombre: 'Choza con corredor', edad: 7, icono: '🏚️',
    descripcion: 'Un alero delante para que la leña no se moje y se pueda estar cuando llueve.',
    coste: { madera: 8, palma: 10, bejuco: 6 }, dias: 2,
    requiere: { fogon: 1 },
    abre: ['La leña se guarda seca', 'Gallinero'],
    efecto: { lenaSeca: true, capacidadDespensa: 40 },
  },
  {
    nivel: 3, nombre: 'Rancho con troje', edad: 8, icono: '🏠',
    descripcion: 'Un troje de varas para guardar la mazorca. Lo que se cosecha ya no se pierde.',
    coste: { madera: 14, bejuco: 10, palma: 8 }, dias: 3,
    requiere: { gallinero: 1, fogon: 2 },
    abre: ['Guardar la cosecha', 'Dos cuadros más de milpa'],
    efecto: { capacidadDespensa: 90, plazasMilpa: 2 },
  },
  {
    nivel: 4, nombre: 'Paredes de bahareque', edad: 10, icono: '🏠',
    descripcion: 'Vara embarrada con lodo y zacate. Ya no entra el aire de noche.',
    coste: { madera: 20, barro: 24, fibra: 14 }, dias: 4,
    requiere: { troje: 1, pila: 1 },
    abre: ['Corral', 'Se duerme mejor: más aguante al día siguiente'],
    efecto: { abrigo: 0.35, capacidadDespensa: 140 },
  },
  {
    nivel: 5, nombre: 'Casa de adobe', edad: 12, icono: '🏡',
    descripcion: 'Adobes hechos en el patio, uno por uno, secados al sol.',
    coste: { barro: 60, fibra: 24, madera: 18 }, dias: 6,
    requiere: { corral: 1, horno: 1 },
    abre: ['Horno de pan', 'Huerta junto a la casa'],
    efecto: { abrigo: 0.6, capacidadDespensa: 220 },
  },
  {
    nivel: 6, nombre: 'Techo de teja', edad: 14, icono: '🏡',
    descripcion: 'Teja de barro cocido. La primera vez que llueve y no cae una gota dentro.',
    coste: { barro: 80, madera: 26, lena: 30 }, dias: 7,
    requiere: { huerta: 1, pila: 2 },
    abre: ['Pozo: se acaban los viajes al río'],
    efecto: { abrigo: 0.85, capacidadDespensa: 320 },
  },
  {
    nivel: 7, nombre: 'Casa con cuartos', edad: 17, icono: '🏘️',
    descripcion: 'Un cuarto para los varones, otro para las hembras. Ya no duermen todos en el suelo.',
    coste: { adobe: 40, madera: 40, teja: 30 }, dias: 9,
    requiere: { pozo: 1, troje: 2 },
    abre: ['Bajar al pueblo a vender', 'Tu propia parcela'],
    efecto: { abrigo: 1, capacidadDespensa: 460, cargaExtra: 6 },
  },
  {
    nivel: 8, nombre: 'Tu propia casa', edad: 21, icono: '🏡',
    descripcion: 'Levantada por vos, en tu tierra. Y alguien esperando dentro.',
    coste: { adobe: 90, teja: 60, madera: 60 }, dias: 12,
    requiere: { parcela: 1, horno: 2 },
    abre: ['Empieza tu familia', 'El valle es tuyo'],
    efecto: { abrigo: 1, capacidadDespensa: 700, cargaExtra: 10 },
  },
];

/**
 * Lo que se levanta dentro del rancho. Cada construccion tiene sus niveles y
 * ninguno puede pasar del nivel del rancho: esa es la regla que hace que el
 * juego tenga una cuesta clara en vez de mil caminos sueltos.
 */
export const CONSTRUCCIONES = [
  {
    id: 'fogon', nombre: 'El fogón', icono: '🔥', requiereRancho: 1,
    descripcion: 'Tres piedras y el comal. Sin fogón no se come caliente.',
    niveles: [
      { coste: { piedra: 8, lena: 4 }, dias: 1, texto: 'Tres piedras y el comal',
        efecto: { cocinar: 1 } },
      { coste: { piedra: 14, barro: 10, lena: 6 }, dias: 2, texto: 'Poyo de barro: cunde más la leña',
        efecto: { lenaPorReceta: -1, cocinaRapida: 0.75 } },
      { coste: { barro: 24, adobe: 10, madera: 6 }, dias: 3, texto: 'Cocina de humo con chimenea',
        efecto: { lenaPorReceta: -1, cocinaRapida: 0.55, animoCasa: 4 } },
    ],
  },
  {
    id: 'gallinero', nombre: 'El gallinero', icono: '🐔', requiereRancho: 2,
    descripcion: 'Las gallinas ponen si tienen dónde. Huevo cada mañana sin salir de casa.',
    niveles: [
      { coste: { madera: 10, bejuco: 8, palma: 6 }, dias: 2, texto: 'Cuatro gallinas',
        efecto: { huevosDia: 2 } },
      { coste: { madera: 16, bejuco: 12, maiz: 10 }, dias: 3, texto: 'Ocho gallinas y un gallo',
        efecto: { huevosDia: 4, carneDia: 0.2 } },
      { coste: { madera: 24, adobe: 12, maiz: 20 }, dias: 4, texto: 'Gallinero grande, con ponedero',
        efecto: { huevosDia: 7, carneDia: 0.4 } },
    ],
  },
  {
    id: 'troje', nombre: 'El troje', icono: '🌽', requiereRancho: 3,
    descripcion: 'Donde se guarda la mazorca para que aguante el año. Lo que no se guarda, se pierde.',
    niveles: [
      { coste: { madera: 14, bejuco: 10 }, dias: 3, texto: 'Varas y bejuco: aguanta una cosecha',
        efecto: { capacidadDespensa: 60, semillaSegura: true } },
      { coste: { madera: 26, adobe: 14, palma: 10 }, dias: 5, texto: 'Troje grande, techado',
        efecto: { capacidadDespensa: 160, semillaSegura: true, perdidaCosecha: -0.5 } },
    ],
  },
  {
    id: 'pila', nombre: 'La pila', icono: '🪣', requiereRancho: 3,
    descripcion: 'Un depósito junto a la choza. Cada viaje al río rinde el doble.',
    niveles: [
      { coste: { barro: 20, piedra: 16, fibra: 8 }, dias: 3, texto: 'Pila de barro: guarda 40 litros',
        efecto: { aguaGuardada: 40 } },
      { coste: { barro: 34, piedra: 28, adobe: 10 }, dias: 4, texto: 'Pila de piedra: guarda 90 litros',
        efecto: { aguaGuardada: 90, aguaAhorrada: 2 } },
    ],
  },
  {
    id: 'corral', nombre: 'El corral', icono: '🐄', requiereRancho: 4,
    descripcion: 'Para el marrano y, si un día se puede, una vaca.',
    niveles: [
      { coste: { madera: 26, bejuco: 16 }, dias: 4, texto: 'Corral de varas: un marrano',
        efecto: { carneDia: 0.5, abonoDia: 1 } },
      { coste: { madera: 40, piedra: 24, maiz: 30 }, dias: 6, texto: 'Corral grande: marranos y una vaca',
        efecto: { carneDia: 1, abonoDia: 2, lecheDia: 2 } },
    ],
  },
  {
    id: 'horno', nombre: 'El horno', icono: '🍞', requiereRancho: 4,
    descripcion: 'De barro, en el patio. Pan, y también se cuecen las tejas.',
    niveles: [
      { coste: { barro: 30, piedra: 20, lena: 20 }, dias: 4, texto: 'Horno de barro',
        efecto: { hornear: true } },
      { coste: { barro: 50, adobe: 20, lena: 30 }, dias: 6, texto: 'Horno grande: se cuecen tejas y adobes',
        efecto: { hornear: true, cocerTeja: true } },
    ],
  },
  {
    id: 'huerta', nombre: 'La huerta', icono: '🍅', requiereRancho: 5,
    descripcion: 'Junto a la casa, para lo que se come diario: tomate, chile, hierbas.',
    niveles: [
      { coste: { madera: 12, fibra: 10, abono: 6 }, dias: 3, texto: 'Cuatro tablones',
        efecto: { huertaDia: 2 } },
      { coste: { madera: 20, fibra: 18, abono: 14 }, dias: 4, texto: 'Huerta cercada y regada',
        efecto: { huertaDia: 4 } },
    ],
  },
  {
    id: 'pozo', nombre: 'El pozo', icono: '💧', requiereRancho: 6,
    descripcion: 'Cavar hasta dar con el agua. El día que sale, se acaban los viajes al río.',
    niveles: [
      { coste: { piedra: 60, madera: 30, bejuco: 20 }, dias: 10, texto: 'Se acabó el acarreo',
        efecto: { aguaDia: 20, aguaAhorrada: 10 } },
    ],
  },
  {
    id: 'parcela', nombre: 'Tu parcela', icono: '🌾', requiereRancho: 7,
    descripcion: 'Tierra tuya, no de tus padres. Aquí empieza lo tuyo.',
    niveles: [
      { coste: { madera: 30, maiz: 40, frijol: 20 }, dias: 8, texto: 'Seis cuadros propios',
        efecto: { plazasMilpa: 6, propia: true } },
    ],
  },
];

export function construccion(id) { return CONSTRUCCIONES.find((c) => c.id === id) || null; }
export function nivelRancho(n) { return NIVELES_RANCHO.find((r) => r.nivel === n) || null; }
export const MAX_RANCHO = NIVELES_RANCHO.length;

/** Edad del nino segun el nivel del rancho al que ha llegado. */
export function edadEn(nivel) {
  return (nivelRancho(Math.min(nivel, MAX_RANCHO)) || NIVELES_RANCHO[0]).edad;
}
