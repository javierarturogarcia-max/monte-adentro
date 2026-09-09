/**
 * construccion.js — Levantar el rancho.
 *
 * Una sola obra a la vez, que se paga con lo que hay en la despensa y tarda
 * dias en terminarse. Mientras se levanta hay que seguir viviendo: acarrear,
 * cazar, sembrar. Ese es el bucle: traer -> construir -> poder traer mas.
 *
 * Regla dura, la que da forma a todo: ninguna construccion puede pasar del
 * nivel del rancho. Si querés un gallinero de nivel 3, primero el rancho.
 */
import { NIVELES_RANCHO, CONSTRUCCIONES, construccion, nivelRancho, MAX_RANCHO, edadEn } from '../contenido/construcciones.js';
import { OBJETOS } from '../contenido/objetos.js';
import { cuenta, quitar } from './inventario.js';
import { limitar } from '../nucleo/mate.js';

export function crearRancho() {
  const construcciones = {};
  for (const c of CONSTRUCCIONES) construcciones[c.id] = 0;
  return {
    nivel: 1,
    construcciones,
    obra: null,          // {tipo, id, nivel, dias, restante, dia}
    historial: [],       // lo que se ha levantado, con su dia
  };
}

/** Edad del nino ahora mismo. */
export function edad(rancho) { return edadEn(rancho?.nivel || 1); }

/** Nivel maximo al que puede llegar una construccion: el del rancho. */
export function topeDe(rancho, id) {
  const c = construccion(id);
  if (!c) return 0;
  return Math.min(c.niveles.length, Math.max(0, (rancho.nivel || 1) - (c.requiereRancho - 1)));
}

/** El siguiente escalon de algo: {tipo, id, nivel, coste, dias, texto}. */
export function siguienteNivel(rancho, id) {
  if (id === 'rancho') {
    const nivel = (rancho.nivel || 1) + 1;
    const r = nivelRancho(nivel);
    if (!r) return null;
    return { tipo: 'rancho', id: 'rancho', nivel, coste: r.coste, dias: r.dias,
      texto: r.nombre, requiere: r.requiere, definicion: r };
  }
  const c = construccion(id);
  if (!c) return null;
  const actual = rancho.construcciones[id] || 0;
  if (actual >= c.niveles.length) return null;
  const n = c.niveles[actual];
  return { tipo: 'construccion', id, nivel: actual + 1, coste: n.coste, dias: n.dias,
    texto: n.texto, definicion: c, requiereRancho: c.requiereRancho };
}

/**
 * Materiales que faltan para un escalon, mirando la despensa y la canasta.
 * @returns {Array<{id, faltan, nombre}>}
 */
export function faltaPara(paso, despensa, inventario = {}) {
  const faltan = [];
  for (const [id, n] of Object.entries(paso.coste || {})) {
    const hay = cuenta(despensa, id) + cuenta(inventario, id);
    if (hay < n) faltan.push({ id, faltan: n - hay, nombre: OBJETOS[id]?.nombre || id, tiene: hay, pide: n });
  }
  return faltan;
}

/**
 * Comprueba si un escalon se puede empezar hoy.
 * @returns {{ok, motivo, faltan, paso}}
 */
export function puedeEmpezar(rancho, id, despensa, inventario = {}) {
  const paso = siguienteNivel(rancho, id);
  if (!paso) return { ok: false, motivo: 'Ya está en lo más alto.' };
  if (rancho.obra) return { ok: false, motivo: 'Ya hay una obra empezada.', paso };

  if (paso.tipo === 'construccion') {
    if ((rancho.nivel || 1) < paso.requiereRancho) {
      return { ok: false, paso, motivo: `Hace falta el rancho en nivel ${paso.requiereRancho}.` };
    }
    if (paso.nivel > topeDe(rancho, id)) {
      return { ok: false, paso, motivo: 'Para eso hay que subir antes el rancho.' };
    }
  } else {
    // Subir el rancho pide tener antes ciertas cosas levantadas.
    for (const [req, nivel] of Object.entries(paso.requiere || {})) {
      if ((rancho.construcciones[req] || 0) < nivel) {
        const c = construccion(req);
        return { ok: false, paso,
          motivo: `Antes hay que tener ${c ? c.nombre.toLowerCase() : req} en nivel ${nivel}.` };
      }
    }
  }

  const faltan = faltaPara(paso, despensa, inventario);
  if (faltan.length) {
    return { ok: false, paso, faltan,
      motivo: `Falta ${faltan.map((f) => `${f.faltan} ${f.nombre.toLowerCase()}`).join(', ')}.` };
  }
  return { ok: true, paso, faltan: [] };
}

/**
 * Empieza la obra: cobra los materiales (primero de la despensa, luego de lo
 * que lleve encima) y deja el contador de dias corriendo.
 */
export function empezarObra(rancho, id, dia, despensa, inventario = {}) {
  const comprobacion = puedeEmpezar(rancho, id, despensa, inventario);
  if (!comprobacion.ok) return comprobacion;
  const paso = comprobacion.paso;
  for (const [mat, n] of Object.entries(paso.coste || {})) {
    const deDespensa = quitar(despensa, mat, n);
    if (deDespensa < n) quitar(inventario, mat, n - deDespensa);
  }
  rancho.obra = {
    tipo: paso.tipo, id: paso.id, nivel: paso.nivel,
    dias: paso.dias, restante: paso.dias, dia, texto: paso.texto,
  };
  return { ok: true, obra: rancho.obra, paso };
}

/**
 * Un dia de obra. Los ayudantes de la familia adelantan trabajo.
 * @returns {null|{terminada, tipo, id, nivel, efecto, nombre}}
 */
export function avanzarObra(rancho, { ayudantes = 0, dia = 0 } = {}) {
  const obra = rancho.obra;
  if (!obra) return null;
  obra.restante -= 1 + ayudantes * 0.5;
  if (obra.restante > 0) return { terminada: false, restante: obra.restante, obra };

  rancho.obra = null;
  if (obra.tipo === 'rancho') {
    rancho.nivel = obra.nivel;
    const def = nivelRancho(obra.nivel);
    rancho.historial.push({ tipo: 'rancho', nivel: obra.nivel, dia });
    return { terminada: true, tipo: 'rancho', nivel: obra.nivel, nombre: def.nombre,
      icono: def.icono, abre: def.abre, edad: def.edad, definicion: def };
  }
  rancho.construcciones[obra.id] = obra.nivel;
  const c = construccion(obra.id);
  rancho.historial.push({ tipo: 'construccion', id: obra.id, nivel: obra.nivel, dia });
  return { terminada: true, tipo: 'construccion', id: obra.id, nivel: obra.nivel,
    nombre: c.nombre, icono: c.icono, texto: c.niveles[obra.nivel - 1].texto, definicion: c };
}

/**
 * Suma de todo lo que dan el rancho y sus construcciones. Es lo que consulta
 * el resto del juego: cuanta agua ahorra la pila, cuantos huevos pone el
 * gallinero, cuanto mas cabe en la despensa.
 */
export function efectos(rancho) {
  const total = {
    cocinar: 0, capacidadDespensa: 0, cargaExtra: 0, aguaGuardada: 0, aguaAhorrada: 0, aguaDia: 0,
    huevosDia: 0, carneDia: 0, lecheDia: 0, abonoDia: 0, huertaDia: 0,
    plazasMilpa: 0, abrigo: 0, animoCasa: 0, lenaPorReceta: 0, cocinaRapida: 1,
    perdidaCosecha: 0, hornear: false, cocerTeja: false, semillaSegura: false,
    lenaSeca: false, propia: false,
  };
  const aplicar = (e) => {
    if (!e) return;
    for (const [k, v] of Object.entries(e)) {
      if (typeof v === 'boolean') total[k] = total[k] || v;
      else if (k === 'cocinaRapida') total[k] = Math.min(total[k], v);
      else if (k === 'abrigo' || k === 'capacidadDespensa') total[k] = Math.max(total[k], v);
      else total[k] += v;
    }
  };
  for (const r of NIVELES_RANCHO) {
    if (r.nivel <= (rancho.nivel || 1)) aplicar(r.efecto);
  }
  for (const c of CONSTRUCCIONES) {
    const n = rancho.construcciones[c.id] || 0;
    for (let i = 0; i < n; i++) aplicar(c.niveles[i].efecto);
  }
  return total;
}

/** Lo que produce el rancho solo, cada dia, sin que el nino haga nada. */
export function produccionDiaria(rancho) {
  const e = efectos(rancho);
  const salida = [];
  if (e.huevosDia >= 1) salida.push({ id: 'huevo', cantidad: Math.floor(e.huevosDia) });
  if (e.lecheDia >= 1) salida.push({ id: 'leche', cantidad: Math.floor(e.lecheDia) });
  if (e.carneDia >= 1) salida.push({ id: 'carne_conejo', cantidad: Math.floor(e.carneDia) });
  if (e.abonoDia >= 1) salida.push({ id: 'abono', cantidad: Math.floor(e.abonoDia) });
  if (e.huertaDia >= 1) salida.push({ id: 'tomate', cantidad: Math.floor(e.huertaDia) });
  if (e.aguaDia >= 1) salida.push({ id: 'agua', cantidad: Math.floor(e.aguaDia) });
  return salida;
}

/**
 * Que conviene hacer ahora. Es lo que se le enseña al jugador para que nunca
 * este parado sin saber a que dedicarse: el equivalente del "siguiente
 * objetivo" que todo juego de progresion tiene siempre a la vista.
 */
export function siguientePaso(rancho, despensa, inventario = {}) {
  if (rancho.obra) {
    return { estado: 'obra', obra: rancho.obra,
      texto: `${rancho.obra.texto}: faltan ${Math.ceil(rancho.obra.restante)} día(s)` };
  }
  const opciones = [];
  for (const c of CONSTRUCCIONES) {
    const paso = siguienteNivel(rancho, c.id);
    if (!paso) continue;
    if ((rancho.nivel || 1) < paso.requiereRancho) continue;
    if (paso.nivel > topeDe(rancho, c.id)) continue;
    const faltan = faltaPara(paso, despensa, inventario);
    opciones.push({ paso, faltan, listo: faltan.length === 0 });
  }
  const pasoRancho = siguienteNivel(rancho, 'rancho');
  if (pasoRancho) {
    const comprobacion = puedeEmpezar(rancho, 'rancho', despensa, inventario);
    opciones.unshift({ paso: pasoRancho, faltan: comprobacion.faltan || [],
      listo: comprobacion.ok, motivo: comprobacion.motivo });
  }
  const listo = opciones.find((o) => o.listo);
  if (listo) {
    return { estado: 'listo', paso: listo.paso,
      texto: `Ya se puede levantar: ${listo.paso.texto}` };
  }
  // Nada listo: se dice que es lo que menos falta para conseguir.
  const cerca = opciones
    .map((o) => ({ ...o, deuda: o.faltan.reduce((s, f) => s + f.faltan, 0) }))
    .filter((o) => o.faltan.length)
    .sort((a, b) => a.deuda - b.deuda)[0];
  if (!cerca) return { estado: 'nada', texto: 'No queda nada por levantar.' };
  return {
    estado: 'falta', paso: cerca.paso, faltan: cerca.faltan,
    texto: `Para ${cerca.paso.texto.toLowerCase()} falta ${cerca.faltan
      .map((f) => `${f.faltan} ${f.nombre.toLowerCase()}`).join(', ')}`,
  };
}

/** Cuanto se ha levantado, de 0 a 1. Para la barra de progreso general. */
export function progreso(rancho) {
  let hecho = (rancho.nivel || 1) - 1;
  let total = MAX_RANCHO - 1;
  for (const c of CONSTRUCCIONES) {
    hecho += rancho.construcciones[c.id] || 0;
    total += c.niveles.length;
  }
  return limitar(hecho / total, 0, 1);
}
