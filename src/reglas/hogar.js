/**
 * hogar.js — La casa: lo que hace falta cada dia y lo que el nino aporta.
 *
 * Este es el nucleo emocional del juego. No hay puntuacion abstracta: hay una
 * casa sin luz y sin agua corriente que necesita cada dia sus litros, su lena y
 * su comida. Lo que el nino trae se apunta como aporte, y de ahi salen las
 * estrellas del dia y el animo de la familia.
 *
 * Regla que sostiene todo el juego: el nino se juzga por lo que trajo EL, no
 * por lo que haya en la despensa. Si no fuera asi, mandar a un hermano por
 * agua le haria el mandado y el dia no valdria nada. Lo que trae la familia va
 * a la despensa como reserva: es con eso con lo que se levanta el rancho.
 */
import { limitar, mezclar } from '../nucleo/mate.js';
import { OBJETOS } from '../contenido/objetos.js';
import { cuenta, quitar, agregar } from './inventario.js';

/**
 * Lo que gasta la casa en un dia. Son NUEVE: el padre, la madre y siete hijos
 * (cinco varones y dos hembras). Nueve personas beben, comen y queman lena, y
 * ese numero es el que hace que el juego no sea un paseo.
 */
export const CONSUMO = { agua: 18, lena: 6, raciones: 9 };

/**
 * Lo que le toca al nino de todo eso. A los seis anos no se le puede pedir la
 * casa entera: se le manda por agua y por lena, y ya. Segun crece, le toca
 * mas, hasta que a los veintiuno la casa es suya.
 *
 * Del resto se encargan los padres y los hermanos, se vea o no.
 *
 * La comida no se le pide hasta que hay fogon: mientras se cocine en el suelo
 * no tiene con que, y un juego no puede reprocharle algo que todavia no puede
 * hacer. Cada exigencia nueva llega junto con lo que hace falta para cumplirla.
 * @param {number} edad
 * @param {{cocina?: boolean}} op cocina: si ya hay fogon levantado
 */
export function cuota(edad = 6, op = {}) {
  const t = limitar((edad - 6) / 15, 0, 1);
  const cocina = op.cocina ?? true;
  return {
    agua: Math.round(mezclar(6, CONSUMO.agua, t)),
    lena: Math.round(mezclar(2, CONSUMO.lena, t)),
    raciones: cocina ? Math.max(1, Math.round(mezclar(1, CONSUMO.raciones, t))) : 0,
  };
}

export function crearHogar() {
  return {
    despensa: {},
    animoFamilia: 62,
    traidoHoy: {},       // lo que trajo EL nino hoy: de ahi sale su cuota
    aporteHoy: 0,
    aporteTotal: 0,
    diasCumplidos: 0,
    diasSeguidos: 0,
    mejorRacha: 0,
    historial: [],       // ultimos dias: {dia, aporte, estrellas, faltas}
  };
}

/** Valor de aporte de un objeto: no todo vale lo mismo para la casa. */
export function valorAporte(id, cantidad = 1) {
  const o = OBJETOS[id];
  if (!o) return 0;
  const base = { agua: 1.1, lena: 2.2, tronco: 5 }[id];
  if (base) return base * cantidad;
  if (o.tipo === 'comida') return (2 + (o.hambre || 0) * 0.16) * cantidad;
  if (o.tipo === 'crudo') return (1.2 + (o.hambre || 0) * 0.1) * cantidad;
  if (o.tipo === 'semilla') return 0.8 * cantidad;
  if (o.tipo === 'material') return 0.6 * cantidad;
  if (o.tipo === 'herramienta') return 3 * cantidad;
  return cantidad;
}

/**
 * Entrega objetos a la casa.
 * @returns {{entregado, aporte}}
 */
export function entregar(hogar, inv, id, cantidad = 1) {
  const hay = Math.min(cantidad, cuenta(inv, id));
  if (!hay) return { entregado: 0, aporte: 0 };
  quitar(inv, id, hay);
  agregar(hogar.despensa, id, hay, 9999);
  if (!hogar.traidoHoy) hogar.traidoHoy = {};
  hogar.traidoHoy[id] = (hogar.traidoHoy[id] || 0) + hay;
  const aporte = valorAporte(id, hay);
  hogar.aporteHoy += aporte;
  hogar.aporteTotal += aporte;
  return { entregado: hay, aporte, id };
}

/** Entrega todo lo entregable de golpe (el gesto de llegar y vaciar la canasta). */
export function entregarTodo(hogar, inv) {
  const resultado = [];
  for (const id of Object.keys({ ...inv })) {
    const o = OBJETOS[id];
    if (!o || o.tipo === 'herramienta') continue;
    const r = entregar(hogar, inv, id, cuenta(inv, id));
    if (r.entregado) resultado.push({ id, cantidad: r.entregado, aporte: r.aporte });
  }
  return resultado;
}

/** Raciones de comida que hay en la despensa (una racion = un plato). */
export function racionesDisponibles(despensa) {
  let r = 0;
  for (const [id, n] of Object.entries(despensa)) {
    const o = OBJETOS[id];
    if (!o) continue;
    if (o.tipo === 'comida' && (o.hambre || 0) >= 12) r += n;
    else if (o.tipo === 'comida') r += n * 0.4;
  }
  return Math.floor(r);
}

/**
 * Lo que le falta al nino de su parte del dia. Se mide contra lo que trajo EL
 * hoy: el trabajo de los hermanos llena la despensa, pero no le hace el
 * mandado. Para la comida se admite lo que haya guardado, porque un plato se
 * sirve de la despensa aunque lo haya traido otro.
 */
export function faltantes(hogar, edad = 6, op = {}) {
  const c = cuota(edad, op);
  const traido = hogar.traidoHoy || {};
  return {
    agua: Math.max(0, c.agua - (traido.agua || 0)),
    lena: Math.max(0, c.lena - (traido.lena || 0)),
    raciones: Math.max(0, c.raciones - racionesDisponibles(hogar.despensa)),
    cuota: c,
    traido: { agua: traido.agua || 0, lena: traido.lena || 0,
      raciones: racionesDisponibles(hogar.despensa) },
  };
}

/**
 * Cierre del dia: la casa consume lo que hay y se juzga el dia.
 * @returns {{estrellas, faltas, texto, animoFamilia}}
 */
export function cerrarDia(hogar, dia, op = {}) {
  const edad = op.edad ?? 6;
  const c = cuota(edad, op);
  const falta = faltantes(hogar, edad, op);
  const consumido = {
    agua: Math.min(c.agua, cuenta(hogar.despensa, 'agua')),
    lena: Math.min(c.lena, cuenta(hogar.despensa, 'lena')),
  };
  quitar(hogar.despensa, 'agua', consumido.agua);
  quitar(hogar.despensa, 'lena', consumido.lena);

  // La comida se consume empezando por lo que menos aguanta guardado.
  let raciones = c.raciones - falta.raciones;
  const orden = Object.keys(hogar.despensa)
    .filter((id) => OBJETOS[id]?.tipo === 'comida')
    .sort((a, b) => (OBJETOS[a].hambre || 0) - (OBJETOS[b].hambre || 0));
  for (const id of orden) {
    while (raciones > 0 && cuenta(hogar.despensa, id) > 0) { quitar(hogar.despensa, id, 1); raciones--; }
  }

  const pedidos = (c.agua > 0 ? 1 : 0) + (c.lena > 0 ? 1 : 0) + (c.raciones > 0 ? 1 : 0);
  const faltas = (falta.agua > 0 ? 1 : 0) + (falta.lena > 0 ? 1 : 0) + (falta.raciones > 0 ? 1 : 0);
  const cubierto = pedidos ? 1 - faltas / pedidos : 1;
  // Lo que se considera "un buen dia" sube con la edad: a los seis basta con
  // el agua y la lena; de grande se espera mucho mas.
  const generosidad = limitar(hogar.aporteHoy / mezclar(26, 80, limitar((edad - 6) / 15, 0, 1)), 0, 1.35);
  const estrellas = faltas === 0
    ? (generosidad > 1 ? 3 : generosidad > 0.6 ? 2 : 1)
    : (faltas === 1 && pedidos > 1 ? 1 : 0);

  // Si no queda nadie sosteniendo la casa, el animo cae aunque sobre la comida.
  const sinCasa = op.faltaEnCasa ? 6 : 0;
  hogar.animoFamilia = limitar(
    hogar.animoFamilia + (faltas === 0 ? 7 : -9 * faltas) + generosidad * 4 - sinCasa, 0, 100);
  if (faltas === 0) {
    hogar.diasCumplidos++;
    hogar.diasSeguidos++;
    hogar.mejorRacha = Math.max(hogar.mejorRacha, hogar.diasSeguidos);
  } else {
    hogar.diasSeguidos = 0;
  }

  const texto = faltas === 0
    ? (estrellas === 3 ? 'Hoy sobró. Tu mamá te guardó lo mejor del plato.'
      : 'La casa tuvo lo necesario. Se cena tranquilo.')
    : `Faltó ${[falta.agua ? 'agua' : null, falta.lena ? 'leña' : null, falta.raciones ? 'comida' : null]
        .filter(Boolean).join(' y ')}.`;

  const parte = { dia, aporte: Math.round(hogar.aporteHoy), estrellas, faltas, cubierto, texto,
    cuota: c, edad, consumido };
  hogar.historial.push(parte);
  if (hogar.historial.length > 60) hogar.historial.shift();
  hogar.aporteHoy = 0;
  hogar.traidoHoy = {};
  return { ...parte, animoFamilia: hogar.animoFamilia };
}

/** Frase de la familia segun como va la cosa. */
export function humorFamilia(hogar) {
  const a = hogar.animoFamilia;
  if (a > 82) return 'En la casa se ríe. Tu papá dice que ya eres de ayuda de verdad.';
  if (a > 60) return 'La casa va bien. Tu mamá te manda a lavarte antes de comer.';
  if (a > 38) return 'Se aguanta, pero hay que traer más.';
  if (a > 18) return 'Hay caras largas. Falta de todo.';
  return 'La cosa está fea. Nadie dice nada, y eso es peor.';
}
