/**
 * familia.js — Los nueve de la casa y el reparto del trabajo.
 *
 * En la casa son nueve: el padre, la madre y siete hijos —cinco varones y dos
 * hembras—, y el nino es uno de los varones. Ninguno es el protagonista salvo
 * el: los demas son las manos que se pueden mandar.
 *
 * Cada manana se reparte el trabajo. Lo que traen los hermanos entra en la
 * despensa al cerrar el dia, sin que haya que verlo: eso es lo que permite que
 * un nino de seis anos sostenga una casa de nueve, y lo que hace que subir el
 * rancho sea cosa de todos y no de uno.
 *
 * Los nombres de aqui son de relleno hasta que lleguen los de verdad
 * (ver docs/RECUERDOS.md).
 */
import { mezclar, limitar } from '../nucleo/mate.js';

export const TAREAS = {
  agua:  { nombre: 'Traer agua', icono: '🏺', descripcion: 'Bajar al río y subir con lo que aguante.' },
  lena:  { nombre: 'Juntar leña', icono: '🪵', descripcion: 'Ramas secas del monte y de la ribera.' },
  monte: { nombre: 'Rebuscar en el monte', icono: '🌿', descripcion: 'Fruta, hierbas, lo que dé el día.' },
  milpa: { nombre: 'Cuidar la milpa', icono: '🌽', descripcion: 'Regar y limpiar los cuadros.' },
  obra:  { nombre: 'Ayudar en la obra', icono: '🔨', descripcion: 'Adelanta lo que se esté levantando.' },
  casa:  { nombre: 'El oficio de la casa', icono: '🏠', descripcion: 'Cocinar, moler, lavar, cuidar a los chicos.' },
};

/**
 * Quienes son. `fuerza` es cuanto rinde cada uno, `puede` lo que sabe hacer.
 * La madre hace todo el oficio de la casa ademas de trabajar la tierra: por eso
 * rinde en todo, y por eso quitarla del oficio tiene precio.
 */
export const FAMILIA = [
  { id: 'papa', nombre: 'Papá', rol: 'padre', icono: '👨‍🌾', fuerza: 1.6,
    puede: ['milpa', 'obra', 'lena', 'monte'],
    nota: 'Cultiva la tierra. Lo que él hace en un día no lo hace nadie.' },
  { id: 'mama', nombre: 'Mamá', rol: 'madre', icono: '👩‍🌾', fuerza: 1.4,
    puede: ['casa', 'milpa', 'monte', 'agua'], porDefecto: 'casa',
    nota: 'Trabaja la tierra y además hace todo el oficio de la casa.' },
  { id: 'mayor', nombre: 'El mayor', rol: 'hermano', icono: '🧑', fuerza: 1.3, edad: 14,
    puede: ['agua', 'lena', 'milpa', 'obra', 'monte'],
    nota: 'Ya carga como un hombre.' },
  { id: 'hermano2', nombre: 'El segundo', rol: 'hermano', icono: '🧑', fuerza: 1, edad: 11,
    puede: ['agua', 'lena', 'milpa', 'monte'] },
  { id: 'hermana1', nombre: 'La hermana mayor', rol: 'hermana', icono: '👧', fuerza: 1, edad: 12,
    puede: ['casa', 'agua', 'monte', 'milpa'], porDefecto: 'casa' },
  { id: 'hermano3', nombre: 'El tercero', rol: 'hermano', icono: '🧒', fuerza: 0.7, edad: 8,
    puede: ['agua', 'lena', 'monte'] },
  { id: 'hermana2', nombre: 'La chiquita', rol: 'hermana', icono: '👧', fuerza: 0.5, edad: 5,
    puede: ['casa', 'monte'], nota: 'Va detrás de todos, y a veces encuentra cosas.' },
  { id: 'hermano4', nombre: 'El chiquito', rol: 'hermano', icono: '🧒', fuerza: 0.4, edad: 4,
    puede: ['casa', 'monte'], nota: 'Todavía estorba más de lo que ayuda.' },
];

/** Lo que rinde una persona en una tarea, en un dia. */
export function rendir(persona, tarea, ctx = {}) {
  const f = persona.fuerza * mezclar(0.8, 1.2, ctx.suerte ?? 0.5);
  const estacion = ctx.estacion || 'seca';
  switch (tarea) {
    case 'agua':  return [{ id: 'agua', cantidad: Math.round(6 * f) }];
    case 'lena':  return [{ id: 'lena', cantidad: Math.round(3 * f) }];
    case 'monte': {
      const cosas = [];
      const n = Math.max(1, Math.round(2 * f));
      // En invierno el monte da mas; en verano hay que conformarse.
      const tabla = estacion === 'lluvias'
        ? ['hierbas', 'hongos', 'mango', 'guayaba', 'bejuco', 'fibra']
        : ['hierbas', 'jocote', 'fibra', 'ocote', 'bejuco', 'piedra'];
      for (let i = 0; i < n; i++) {
        cosas.push({ id: tabla[Math.floor((ctx.suerte ?? 0.5) * 997 + i * 7) % tabla.length], cantidad: 1 });
      }
      return cosas;
    }
    case 'milpa': return [];   // no trae cosas: cuida los cuadros (lo aplica el juego)
    case 'obra':  return [];   // adelanta dias de obra
    case 'casa':  return [];   // sostiene la casa: sin nadie, el animo cae
    default: return [];
  }
}

export function crearReparto() {
  const reparto = {};
  for (const p of FAMILIA) if (p.porDefecto) reparto[p.id] = p.porDefecto;
  return reparto;
}

export function persona(id) { return FAMILIA.find((p) => p.id === id) || null; }

/** Cambia a alguien de tarea (o lo deja sin nada con tarea = null). */
export function asignar(reparto, id, tarea) {
  const p = persona(id);
  if (!p) return { ok: false, motivo: 'Ese no es de la casa.' };
  if (tarea && !p.puede.includes(tarea)) {
    return { ok: false, motivo: `${p.nombre} no puede con eso.` };
  }
  if (tarea) reparto[id] = tarea; else delete reparto[id];
  return { ok: true, reparto };
}

export function cuantosEn(reparto, tarea) {
  return Object.values(reparto).filter((t) => t === tarea).length;
}

/** Fuerza total puesta en una tarea (los ayudantes de la obra, por ejemplo). */
export function fuerzaEn(reparto, tarea) {
  let total = 0;
  for (const [id, t] of Object.entries(reparto)) {
    if (t !== tarea) continue;
    total += persona(id)?.fuerza || 0;
  }
  return total;
}

/**
 * Lo que trae la familia al cerrar el dia.
 * @returns {{objetos:[], obra:number, casa:number, riegos:number, resumen:[]}}
 */
export function trabajoDelDia(reparto, ctx = {}) {
  const objetos = [];
  const resumen = [];
  let obra = 0, casa = 0, riegos = 0;
  let semilla = 0;
  for (const [id, tarea] of Object.entries(reparto)) {
    const p = persona(id);
    if (!p || !tarea) continue;
    semilla++;
    const suerte = ((ctx.dia || 1) * 37 + semilla * 91) % 100 / 100;
    const traido = rendir(p, tarea, { ...ctx, suerte });
    for (const o of traido) {
      const ya = objetos.find((x) => x.id === o.id);
      if (ya) ya.cantidad += o.cantidad; else objetos.push({ ...o });
    }
    if (tarea === 'obra') obra += p.fuerza;
    if (tarea === 'casa') casa += p.fuerza;
    if (tarea === 'milpa') riegos += p.fuerza;
    resumen.push({ id, nombre: p.nombre, tarea, icono: TAREAS[tarea]?.icono, traido });
  }
  return { objetos, obra, casa, riegos, resumen };
}

/**
 * El animo de la casa depende de que alguien la sostenga. Si se manda a todo
 * el mundo al monte, la casa se cae aunque sobre la comida.
 */
export function faltaEnCasa(reparto) {
  return fuerzaEn(reparto, 'casa') < 1 ? 1 : 0;
}
