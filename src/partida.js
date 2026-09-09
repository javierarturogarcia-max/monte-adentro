/**
 * partida.js — El juego en marcha: une mundo, reglas, render e interfaz.
 *
 * Reparto de responsabilidades:
 *   - mundo/*   sabe como es el valle
 *   - reglas/*  sabe que pasa cuando haces algo (y no toca el DOM)
 *   - render/*  sabe pintar
 *   - vista/*   traduce simulacion a instancias
 *   - ui/*      pinta la interfaz y recoge pulsaciones
 *   - este archivo es el unico que los conoce a todos
 */
import { crearRenderizador, matrizSombra } from './render/renderizador.js';
import { Escena } from './render/escena.js';
import { estadoCielo } from './render/cielo.js';
import { Camara } from './render/camara.js';
import { Terreno, LUGARES, NIVEL_AGUA } from './mundo/terreno.js';
import { repartir, cuadrosMilpa, puntosPesca } from './mundo/dispersion.js';
import { Fauna } from './mundo/fauna.js';
import { climaDelDia, climaEn, aguaDelDia, estacionDe, mesDe, describirClima } from './mundo/clima.js';
import { Mundo3D } from './vista/mundo3d.js';
import { Personaje } from './vista/personaje.js';
import { Reloj } from './nucleo/reloj.js';
import { Bucle } from './nucleo/bucle.js';
import { Entrada } from './nucleo/entrada.js';
import { Audio } from './nucleo/audio.js';
import { m4, limitar, mezclar, seguir, TAU } from './nucleo/mate.js';
import { partidaNueva, guardar, cargar, contar, contarEntrega, contarReceta, contarCultivo,
  conocimientos, prepararCuadros } from './nucleo/estado.js';
import { actualizar as actualizarNecesidades, penalizaciones, comer as comerNec, dormir as dormirNec, barras } from './reglas/necesidades.js';
import { peso, cargaMaxima, agregar, cuenta, quitar, transferir } from './reglas/inventario.js';
import { nivel, bono, ganar } from './reglas/habilidades.js';
import { interaccionesCerca, ejecutar, cargaRelativa } from './reglas/acciones.js';
import { avanzarDia as avanzarCultivo } from './reglas/cultivo.js';
import { cerrarDia, cuota } from './reglas/hogar.js';
import { empezarObra, avanzarObra, efectos as efectosRancho, produccionDiaria,
  siguientePaso as siguientePasoRancho, edad as edadDe } from './reglas/construccion.js';
import { trabajoDelDia, fuerzaEn, asignar, faltaEnCasa } from './reglas/familia.js';
import { cocinar } from './reglas/cocina.js';
import { crearLance, tirarAtarraya } from './reglas/pesca.js';
import { crearApuntado, resolverTiro } from './reglas/caza.js';
import { resumen as resumenCapitulos, disponibles as capitulosDisponibles, activar as activarCapitulo,
  intentarCompletar, activo as capituloActivo, evaluarCapitulo } from './reglas/progresion.js';
import { OBJETOS } from './contenido/objetos.js';
import { frasePara, suceso } from './contenido/dialogos.js';
import { Hud } from './ui/hud.js';
import { Paneles } from './ui/paneles.js';
import { Dialogo } from './ui/dialogo.js';
import { Minijuegos } from './ui/minijuegos.js';
import { Tacto } from './ui/tacto.js';
import { Mapa } from './ui/mapa.js';

const VEL_ANDAR = 3.3;
const VEL_CORRER = 6.0;
const VEL_AGACHADO = 1.5;
const VEL_NADAR = 2.1;

export class Partida {
  constructor(op = {}) {
    this.raiz = op.raiz;
    this.lienzo = op.lienzo;
    this.estado = op.estado || partidaNueva();
    this.alSalir = op.alSalir;
    this.listo = false;
  }

  // ------------------------------------------------------------- arranque
  async iniciar() {
    const e = this.estado;
    this.terreno = new Terreno({ semilla: e.semilla });
    this.reparto = repartir(this.terreno, { densidad: e.ajustes.calidad === 'baja' ? 0.6 : 1 });
    this.puntosPesca = puntosPesca(this.terreno);
    prepararCuadros(e, cuadrosMilpa(this.terreno));

    this.renderizador = await crearRenderizador(this.lienzo, {
      motor: e.ajustes.motor || 'auto',
      sombra: e.ajustes.sombras !== false,
      ladoSombra: e.ajustes.calidad === 'baja' ? 1024 : 2048,
    });
    this.lienzo = this.renderizador.lienzo;

    this.escena = new Escena();
    this.mundo3d = new Mundo3D(this.escena, this.terreno, this.reparto, { calidad: e.ajustes.calidad });
    this.personaje = new Personaje(this.escena, {});
    this.mundo3d.ponerRancho(e.rancho?.nivel || 1, e.rancho?.construcciones || {});
    this.fauna = new Fauna(this.terreno, e.semilla);
    this.camara = new Camara();
    this.reloj = new Reloj({ dia: e.dia, hora: e.hora });
    this.entrada = new Entrada(this.lienzo);
    this.audio = new Audio({ volumen: e.ajustes.volumen ?? 0.75 });
    this.audio.silenciar(e.ajustes.sonido === false);
    // El navegador no deja sonar nada hasta que hay un gesto: el clic de
    // "Empezar" ya cuenta, y si el juego se recupero de un guardado se
    // despierta con lo primero que toque el jugador.
    this.audio.despertar();
    for (const evento of ['pointerdown', 'keydown']) {
      addEventListener(evento, () => this.audio.despertar(), { once: true });
    }

    // El nino empieza en el patio de la casa si es partida nueva.
    const inicio = e.jugador.x || e.jugador.z
      ? [e.jugador.x, e.jugador.z]
      : [LUGARES.casa.x + 3, LUGARES.casa.z + 6];
    this.jugador = {
      x: inicio[0], z: inicio[1], y: this.terreno.altura(inicio[0], inicio[1]),
      rumbo: e.jugador.rumbo || 0, velocidad: 0, agachado: false, nadando: false,
      pose: 'normal', ruido: 0.4,
    };
    this.perro = { x: this.jugador.x + 1.5, z: this.jugador.z + 1, y: 0, rumbo: 0, fase: 0 };

    this.hud = new Hud(this.raiz);
    this.paneles = new Paneles(this.raiz, this._accionesPanel());
    this.dialogo = new Dialogo(this.raiz);
    this.minijuegos = new Minijuegos(this.raiz);
    this.tacto = new Tacto(this.raiz, this.entrada);
    this.mapa = new Mapa(this.raiz, this.terreno);
    this.hud.ponerBotones([
      { texto: '🧺 Canasta', titulo: 'Tecla I', alPulsar: () => this.abrirPanel('inventario') },
      { texto: '📖 Diario', titulo: 'Tecla J', alPulsar: () => this.abrirPanel('diario') },
      { texto: '🛖 Rancho', titulo: 'Tecla R · lo que se puede levantar', clase: 'primario',
        alPulsar: () => { this.abrirPanel('rancho'); this.audio.clic(); } },
      { texto: '🗺️ Mapa', titulo: 'Tecla Q', alPulsar: () => { this.mapa.alternar(); this.audio.clic(); } },
      { texto: '⏸', titulo: 'Tecla Esc', alPulsar: () => this.abrirPanel('pausa') },
    ]);

    this.planClima = climaDelDia(e.semilla, this.reloj.dia);
    this.clima = climaEn(this.planClima, this.reloj.hora);
    this.fauna.poblar(this.reloj.hora, this.clima);
    this.luzProy = m4();
    this.tiempoRender = 0;
    this.horaAnterior = Math.floor(this.reloj.hora);
    this.opciones = [];
    this.mensajeCuadro = null;
    this.lluviaReciente = false;
    this.acumuladoGuardado = 0;
    this.vientoSuave = [0, 0, 0];

    // La camara mira hacia el valle desde el patio, y se deja ya calculada:
    // sin esta primera actualizacion la matriz seria la identidad y el primer
    // fotograma saldria vacio.
    this.camara.giro = this.camara.giroDeseado =
      Math.atan2(this.jugador.x - LUGARES.poza.x, this.jugador.z - LUGARES.poza.z);
    this._actualizarCamara(1 / 60);
    this.camara.objetivoSuave = [this.jugador.x, this.jugador.y + 1.05, this.jugador.z];

    this._redimensionar();
    addEventListener('resize', () => this._redimensionar());
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this.guardar();
    });

    this.bucle = new Bucle({
      simular: (dt) => this.simular(dt),
      dibujar: (dt) => this.dibujar(dt),
      alFallar: (err) => this._fallo(err),
    });
    this.listo = true;
    this.bucle.arrancar();
    this._arrancarHistoria();
    return this;
  }

  _fallo(err) {
    console.error('[monte adentro]', err);
    this.hud?.aviso(`Algo se rompió: ${err.message}`, 'malo', 9000);
  }

  _redimensionar() {
    const dpr = Math.min(devicePixelRatio || 1, this.estado.ajustes.calidad === 'alta' ? 2 : 1.35);
    const ancho = Math.max(1, Math.floor(this.lienzo.clientWidth * dpr));
    const alto = Math.max(1, Math.floor(this.lienzo.clientHeight * dpr));
    this.renderizador.redimensionar(ancho, alto);
    this.camara.aspecto = ancho / alto;
    this.tacto.mostrar(matchMedia('(pointer: coarse)').matches);
  }

  // ------------------------------------------------------------ historia
  _arrancarHistoria() {
    const e = this.estado;
    if (!e.capitulos.activo) {
      const posibles = capitulosDisponibles(e);
      if (posibles.length) {
        const cap = posibles[0];
        activarCapitulo(e, cap.id);
        this.dialogo.mostrar(cap.intro, () => {
          this.hud.aviso(`Capítulo: ${cap.titulo}`, 'premio', 5000);
          this._recordarControles();
        });
      }
    }
  }

  /**
   * La primera vez que se juega, los controles se recuerdan dentro del juego.
   * Sin esto hay que acordarse de lo que decia la portada, y lo primero que
   * hace cualquiera es quedarse quieto sin saber que tecla tocar.
   */
  _recordarControles() {
    if (this.estado.contadores.pasos > 6) return;
    const tactil = matchMedia('(pointer: coarse)').matches;
    const guia = tactil
      ? ['Palanca abajo a la izquierda para caminar', 'Arrastrá en la pantalla para mirar alrededor',
        'El botón ✋ hace lo que diga el cartel de abajo']
      : ['W A S D para caminar · Shift para correr', 'Arrastrá con el ratón para mirar alrededor',
        'Acercate a algo y pulsá E: abajo sale lo que podés hacer'];
    guia.forEach((texto, i) => setTimeout(() => this.hud.aviso(texto, 'neutro', 7000), 900 + i * 2600));
  }

  _comprobarCapitulo() {
    const fin = intentarCompletar(this.estado);
    if (!fin) return;
    const textos = fin.premios.map((p) => {
      if (p.tipo === 'objeto') return `${p.cantidad} × ${p.nombre}`;
      if (p.tipo === 'xp') return `+${p.xp} de ${p.habilidad}`;
      return 'algo nuevo que sabés hacer';
    });
    this.dialogo.mostrar(fin.capitulo.cierre, () => {
      this.hud.aviso(`Capítulo terminado: ${fin.capitulo.titulo}`, 'premio', 6000);
      if (textos.length) this.hud.aviso(textos.join(' · '), 'bueno', 6000);
      for (const s of fin.subidas) this.hud.aviso(`¡Subiste a ${s.habilidad} ${s.nivel}!`, 'premio', 5000);
      this.guardar();
      setTimeout(() => this._arrancarHistoria(), 900);
    });
  }

  // ------------------------------------------------------------ simulacion
  simular(dt) {
    if (this.dialogo.activo || this.paneles.abierto) {
      // El mundo se para mientras se habla o se mira un panel: es un juego de
      // decidir, no de que te pillen leyendo el inventario.
      this.dialogo.actualizar(dt);
      if (this.entrada.consumir('interactuar') || this.entrada.consumir('accion')) this.dialogo.avanzar();
      if (this.entrada.consumir('pausa')) { this.dialogo.cerrar(); this.paneles.cerrar(); this.mapa.cerrar(); }
      // La camara sigue viva: el valle se ve detras de la conversacion.
      this._actualizarCamara(dt);
      return;
    }

    const e = this.estado;
    const mirada = this.entrada.tomarMirada();
    this.camara.girar(mirada.dx, mirada.dy);
    if (mirada.rueda) this.camara.acercar(mirada.rueda * 0.9);

    if (this.minijuegos.activo) {
      const antes = this.minijuegos.lance?.estado;
      const golpes = this.minijuegos.dados;
      const mando = {
        accion: this.entrada.activa('accion'),
        pulso: this.entrada.consumir('accion') || this.entrada.consumir('interactuar'),
        cancelar: this.entrada.consumir('pausa'),
      };
      this.minijuegos.actualizar(dt, mando);
      this._sonarMinijuego(antes, golpes, mando);
      this._avanzarTiempo(dt, 'quieto');
      this._actualizarCamara(dt);
      return;
    }

    this._mover(dt);
    this._avanzarTiempo(dt, this._actividad());
    this._actualizarCamara(dt);

    this.fauna.actualizar(dt, {
      jugador: { x: this.jugador.x, z: this.jugador.z, ruido: this.jugador.ruido, agachado: this.jugador.agachado },
      clima: this.clima, tiempo: this.tiempoRender,
    });
    this._moverPerro(dt);
    this._interacciones(dt);
    this._teclas();
  }

  _actividad() {
    const j = this.jugador;
    if (j.nadando) return 'nadar';
    if (j.velocidad > VEL_ANDAR + 0.4) return 'correr';
    if (j.velocidad > 0.2) return cargaRelativa(this.estado) > 0.7 ? 'cargar' : 'andar';
    return 'quieto';
  }

  _mover(dt) {
    const j = this.jugador;
    const dir = this.entrada.direccion;
    const pen = penalizaciones(this.estado.jugador.necesidades);
    const carga = cargaRelativa(this.estado);
    const frenoCarga = 1 - limitar(carga, 0, 1.2) * 0.34;

    j.agachado = this.entrada.activa('agachar');
    const quiereCorrer = this.entrada.activa('correr') && this.estado.jugador.necesidades.aguante > 4 && !j.agachado;

    let vel = j.nadando ? VEL_NADAR : j.agachado ? VEL_AGACHADO : (quiereCorrer ? VEL_CORRER : VEL_ANDAR);
    vel *= pen.velocidad * frenoCarga;
    // La camara se abre al correr y se cierra al agacharse: es el truco mas
    // viejo del oficio para que la velocidad se sienta en el cuerpo.
    if (!this.minijuegos.activo) {
      const grados = j.nadando ? 56 : quiereCorrer && dir.x + dir.y !== 0 ? 66 : j.agachado ? 53 : 58;
      this.camara.fovDeseado = grados * (Math.PI / 180);
    }

    const fuerza = Math.hypot(dir.x, dir.y);
    if (fuerza > 0.02) {
      const frente = this.camara.frente, derecha = this.camara.derecha;
      const dx = frente[0] * -dir.y + derecha[0] * dir.x;
      const dz = frente[2] * -dir.y + derecha[2] * dir.x;
      const l = Math.hypot(dx, dz) || 1;
      const nx = j.x + (dx / l) * vel * fuerza * dt;
      const nz = j.z + (dz / l) * vel * fuerza * dt;
      j.rumbo = Math.atan2(dx, dz);
      this._intentarMover(nx, nz);
      j.velocidad = vel * fuerza;
      contar(this.estado, 'pasos', vel * fuerza * dt);
    } else {
      j.velocidad = mezclar(j.velocidad, 0, 1 - Math.exp(-16 * dt));
      if (j.velocidad < 0.05) j.velocidad = 0;
    }

    const suelo = this.terreno.altura(j.x, j.z);
    const profundidad = NIVEL_AGUA - suelo;
    const nadabaAntes = j.nadando;
    j.nadando = profundidad > 0.95;
    if (j.nadando !== nadabaAntes) {
      this.audio.chapoteo(j.nadando ? 1 : 0.6);
      this.mundo3d.salpicar(j.x, NIVEL_AGUA, j.z, j.nadando ? 12 : 7);
    }
    this._pasos(dt, profundidad);
    j.y = j.nadando ? NIVEL_AGUA - 0.42 : suelo;
    // El ruido que hace: es lo que oyen y huelen los animales.
    j.ruido = limitar((j.velocidad / VEL_CORRER) * (j.agachado ? 0.35 : 1) + (j.nadando ? 0.4 : 0), 0, 1);
    j.pose = this.jugadorPose || (carga > 0.75 ? 'cargar' : 'normal');
  }

  /**
   * Los pasos suenan por distancia recorrida, no por tiempo: asi la cadencia
   * sale sola al andar, al correr y al ir cargado, sin sincronizar nada.
   */
  _pasos(dt, profundidad) {
    const j = this.jugador;
    if (j.velocidad < 0.4) { this.distanciaPaso = 0; return; }
    this.distanciaPaso = (this.distanciaPaso || 0) + j.velocidad * dt;
    const zancada = j.agachado ? 0.85 : mezclar(1.25, 1.85, limitar(j.velocidad / VEL_CORRER, 0, 1));
    if (this.distanciaPaso < zancada) return;
    this.distanciaPaso = 0;
    const zona = this.terreno.zona(j.x, j.z);
    const suelo = profundidad > -0.25 ? 'agua'
      : this.terreno.pendiente(j.x, j.z) > 0.45 ? 'piedra'
      : zona === 'milpa' || zona === 'casa' ? 'tierra' : 'pasto';
    this.audio.paso(suelo, j.velocidad > VEL_ANDAR + 0.5);
    if (suelo !== 'agua' && !j.agachado) {
      // Polvo del pie: poco, pero es lo que hace que el paso "pese".
      this.mundo3d.polvo(j.x, j.y, j.z, suelo === 'tierra' ? 3 : 1);
    }
  }

  _intentarMover(nx, nz) {
    const j = this.jugador;
    const t = this.terreno;
    const puede = (x, z) => t.dentro(x, z) && t.pendiente(x, z) < 0.74;
    if (puede(nx, nz)) { j.x = nx; j.z = nz; return; }
    // Deslizar por la pared en vez de quedarse clavado.
    if (puede(nx, j.z)) { j.x = nx; return; }
    if (puede(j.x, nz)) { j.z = nz; }
  }

  _moverPerro(dt) {
    const p = this.perro, j = this.jugador;
    const d = Math.hypot(j.x - p.x, j.z - p.z);
    const objetivo = 2.2;
    if (d > objetivo) {
      const v = limitar((d - objetivo) * 1.6, 0, 6.5);
      const a = Math.atan2(j.z - p.z, j.x - p.x);
      const nx = p.x + Math.cos(a) * v * dt;
      const nz = p.z + Math.sin(a) * v * dt;
      if (this.terreno.dentro(nx, nz) && !this.terreno.enAgua(nx, nz)) { p.x = nx; p.z = nz; }
      p.rumbo = a;
      p.fase += dt * 9;
    } else {
      p.fase += dt * 1.5;
    }
    p.y = this.terreno.altura(p.x, p.z);
  }

  _actualizarCamara(dt) {
    const j = this.jugador;
    this.camara.actualizar({
      objetivo: [j.x, j.y + 1.05, j.z], dt,
      alturaEn: (x, z) => Math.max(this.terreno.altura(x, z), NIVEL_AGUA - 0.2),
    });
  }

  // --------------------------------------------------------------- tiempo
  _avanzarTiempo(dt, actividad) {
    const e = this.estado;
    const paso = this.reloj.avanzar(dt);
    e.jugada += dt;
    this.tiempoRender += dt;

    actualizarNecesidades(e.jugador.necesidades, paso.horas, {
      actividad,
      temperatura: this.clima.temperatura,
      cargaRelativa: cargaRelativa(e),
      mojado: this.clima.lluvia > 0.2 || this.jugador.nadando,
    });

    this.clima = climaEn(this.planClima, this.reloj.hora);
    // El viento se mueve suave para que las plantas no den saltos.
    const objetivoViento = [this.clima.viento.x, this.clima.viento.z, this.clima.viento.fuerza * 0.85];
    for (let k = 0; k < 3; k++) this.vientoSuave[k] = seguir(this.vientoSuave[k], objetivoViento[k], 1.2, dt);

    const horaEntera = Math.floor(this.reloj.hora);
    if (horaEntera !== this.horaAnterior) {
      this.horaAnterior = horaEntera;
      this._cadaHora();
    }
    if (paso.cambioDia) this._nuevoDia();

    this.acumuladoAmbiente = (this.acumuladoAmbiente || 0) + dt;
    if (this.acumuladoAmbiente > 0.3) {
      this.acumuladoAmbiente = 0;
      this._ambienteSonoro();
    }

    this.acumuladoGuardado += dt;
    if (this.acumuladoGuardado > 45) { this.acumuladoGuardado = 0; this.guardar(); }
  }

  /** Le dice al motor de sonido donde esta el nino y que tiempo hace. */
  _ambienteSonoro() {
    const j = this.jugador;
    const { d } = this.terreno.distanciaCauce(j.x, j.z);
    const dCasa = Math.hypot(j.x - LUGARES.casa.x, j.z - LUGARES.casa.z);
    this.audio.ambiente({
      distanciaRio: d,
      viento: this.clima.viento.fuerza,
      lluvia: this.clima.lluvia,
      hora: this.reloj.hora,
      bajoTecho: dCasa < 5,
    });
    // El fogon crepita si estas cerca y esta encendido.
    const dFogon = Math.hypot(j.x - LUGARES.fogon.x, j.z - LUGARES.fogon.z);
    if (dFogon < 7 && (this.reloj.esNoche || this.clima.lluvia > 0.3)) this.audio.fuego();
    // Truenos: sueltos, no en bucle.
    if (this.clima.tormenta && Math.random() < 0.02) {
      this.audio.trueno(Math.random());
      this.camara.sacudir(0.35);
    }
  }

  _cadaHora() {
    this.fauna.poblar(this.reloj.hora, this.clima);
    const nec = this.estado.jugador.necesidades;
    const aviso = penalizaciones(nec).aviso;
    if (aviso && Math.random() < 0.6) this.hud.aviso(aviso, 'malo');
    else {
      const frase = frasePara({
        hora: this.reloj.hora, clima: this.clima, necesidades: nec,
        estacion: this.clima.estacion, aguaEnCasa: cuenta(this.estado.hogar.despensa, 'agua'),
      });
      if (frase && Math.random() < 0.45) this.hud.aviso(`${frase.texto}`, 'neutro', 4600);
    }
    if (Math.floor(this.reloj.hora) === 19) this.hud.aviso(suceso('anochecer'), 'neutro', 5000);
    if (Math.floor(this.reloj.hora) === 6) this.hud.aviso(suceso('amanecer'), 'neutro', 5000);
  }

  /** Cambio de dia por medianoche (sin dormir): pasa igual, pero se nota. */
  _nuevoDia() {
    this.estado.dia = this.reloj.dia;
    this._cerrarDia({ durmiendo: false });
  }

  _cerrarDia({ durmiendo }) {
    const e = this.estado;
    const dia = this.reloj.dia - (durmiendo ? 1 : 1);
    const agua = aguaDelDia(this.planClima);
    const estacion = estacionDe(this.reloj.dia);

    // --- lo que hizo la familia mientras el nino andaba en lo suyo
    const trabajo = trabajoDelDia(e.reparto, { dia, estacion });
    for (const o of trabajo.objetos) agregar(e.hogar.despensa, o.id, o.cantidad, 9999);

    // --- lo que produce el rancho solo: huevos, leche, abono, la huerta
    const producido = produccionDiaria(e.rancho);
    for (const o of producido) agregar(e.hogar.despensa, o.id, o.cantidad, 9999);

    // --- la milpa: el agua de la lluvia mas la que echen los que la cuidan
    const riegoFamilia = trabajo.riegos * 0.35;
    for (const q of e.cuadros) {
      if (riegoFamilia > 0 && q.cultivo) {
        q.humedad = limitar(q.humedad + riegoFamilia * 0.25, 0, 1.35);
        if (trabajo.riegos >= 1) q.maleza = Math.max(0, q.maleza - 0.4);
      }
      avanzarCultivo(q, { agua, temperatura: this.clima.temperatura, estacion, rnd: Math.random });
    }

    // --- un dia de obra
    const terminada = avanzarObra(e.rancho, { ayudantes: trabajo.obra, dia });
    if (terminada?.terminada) this._obraTerminada(terminada);

    const parte = cerrarDia(e.hogar, dia, {
      edad: edadDe(e.rancho), faltaEnCasa: faltaEnCasa(e.reparto),
      cocina: efectosRancho(e.rancho).cocinar > 0,
    });
    parte.familia = trabajo.resumen;
    parte.producido = [...trabajo.objetos, ...producido];
    parte.obra = terminada;
    e.contadores.estrellas += parte.estrellas;
    if (parte.estrellas === 3) e.contadores.dias3estrellas++;

    this.lluviaReciente = agua > 0.25;
    this.planClima = climaDelDia(e.semilla, this.reloj.dia);
    this.clima = climaEn(this.planClima, this.reloj.hora);
    this.fauna.poblar(this.reloj.hora, this.clima);
    e.dia = this.reloj.dia;
    this.guardar();

    this.paneles.abrir('resumen', { parte, hogar: e.hogar, aprendido: [], estado: e });
    this._comprobarCapitulo();
  }

  /** Se acabo una obra: cambia el rancho, suena y se cuenta. */
  _obraTerminada(fin) {
    const e = this.estado;
    this.mundo3d.ponerRancho(e.rancho.nivel, e.rancho.construcciones);
    this.audio.logro();
    if (fin.tipo === 'rancho') {
      this.hud.aviso(`${fin.icono} ${fin.nombre}. Ya tenés ${fin.edad} años.`, 'premio', 8000);
      for (const a of fin.abre || []) this.hud.aviso(`Ahora podés: ${a}`, 'premio', 6500);
      this.dialogo.mostrar([
        { quien: 'narrador', texto: `Se terminó: ${fin.nombre.toLowerCase()}.` },
        { quien: 'papa', texto: fin.definicion.descripcion },
      ], () => this.guardar());
    } else {
      this.hud.aviso(`${fin.icono} ${fin.nombre}: ${fin.texto}`, 'premio', 7000);
    }
    this.guardar();
  }

  dormir() {
    const e = this.estado;
    const horas = this.reloj.saltarA(5.6);
    dormirNec(e.jugador.necesidades, horas);
    contar(e, 'dormir');
    this.jugador.x = LUGARES.casa.x + 2.5;
    this.jugador.z = LUGARES.casa.z + 5;
    this._cerrarDia({ durmiendo: true });
  }

  // ---------------------------------------------------------- interaccion
  _interacciones(dt) {
    const ctx = this._contexto();
    this.opciones = interaccionesCerca(ctx);
    this.hud.mostrarContexto(this.opciones, (op) => this.hacer(op));
    this.tacto.iconoAccion(this.opciones[0]?.icono || '⚡');
    // Un clic seco al entrar en el alcance de algo nuevo: avisa sin texto.
    const primera = this.opciones.find((o) => !o.desactivada);
    const firma = primera ? primera.id + (primera.objetivo?.id ?? '') : '';
    if (firma && firma !== this.ultimoAlcance) this.audio.clic();
    this.ultimoAlcance = firma;
  }

  /** Lo que hay que marcar en el suelo: aquello con lo que se puede actuar. */
  _alcanceMarcado() {
    const vistos = new Set();
    const marcas = [];
    for (const o of this.opciones) {
      if (o.desactivada) continue;
      const p = o.objetivo;
      if (!p || p.x == null || vistos.has(p.id ?? `${p.x},${p.z}`)) continue;
      vistos.add(p.id ?? `${p.x},${p.z}`);
      marcas.push({ x: p.x, z: p.z, radio: o.id === 'cazar' ? 1.3 : 0.9 });
      if (marcas.length >= 4) break;
    }
    return marcas;
  }

  _contexto() {
    return {
      estado: this.estado,
      terreno: this.terreno,
      fauna: this.fauna,
      recursos: this.reparto.recursos,
      jugador: this.jugador,
      clima: this.clima,
      hora: this.reloj.hora,
      dia: this.reloj.dia,
      mes: mesDe(this.reloj.dia),
      sabe: conocimientos(this.estado),
      lluviaReciente: this.lluviaReciente || this.clima.lluvia > 0.1,
      rnd: Math.random,
    };
  }

  _teclas() {
    const t = this.entrada;
    if (t.consumir('interactuar') && this.opciones.length) {
      const primera = this.opciones.find((o) => !o.desactivada);
      if (primera) this.hacer(primera);
    }
    for (let i = 1; i <= 3; i++) {
      if (t.consumir(String(i))) {
        const op = this.opciones[i];
        if (op && !op.desactivada) this.hacer(op);
      }
    }
    if (t.consumir('mapa')) { this.mapa.alternar(); this.audio.clic(); }
    if (t.consumir('inventario')) this.abrirPanel('inventario');
    if (t.consumir('diario')) this.abrirPanel('diario');
    if (t.consumir('rancho')) this.abrirPanel('rancho');
    if (t.consumir('pausa')) this.abrirPanel('pausa');
    if (t.consumir('accion') && this.opciones.length) {
      const primera = this.opciones.find((o) => !o.desactivada);
      if (primera) this.hacer(primera);
    }
  }

  /** Ejecuta una opcion del menu de contexto. */
  hacer(op) {
    if (!op) return;
    const e = this.estado;
    if (op.menu) {
      if (op.menu === 'sembrar') this.cuadroElegido = op.objetivo;
      this.abrirPanel(op.menu);
      return;
    }
    const ctx = this._contexto();
    const r = ejecutar(op, ctx);
    this._aplicar(r, op);
  }

  _aplicar(r, op) {
    const e = this.estado;
    if (!r) return;
    if (r.dormir) { this.dormir(); return; }
    // Pesca, caza y atarraya SON el minijuego: no dan nada por si mismas.
    // Rajar lena, en cambio, ya rinde y el minijuego solo anade el extra por
    // buen pulso, asi que primero se cobra lo seguro.
    if (r.minijuego && !r.objetos) { this._abrirMinijuego(r.minijuego, op); return; }
    if (!r.ok) { this.hud.aviso(r.texto || 'No se pudo.', 'malo'); this.audio.aviso(false); return; }

    // objetos
    let sobra = 0;
    for (const o of r.objetos || []) {
      const res = agregar(e.jugador.inventario, o.id, o.cantidad, nivel(e.jugador.habilidades, 'fuerza'));
      sobra += res.rechazado;
    }
    if (r.objetos?.length) this.audio.recoger();
    if (sobra > 0) { this.hud.aviso('No te cabe todo: vas muy cargado.', 'malo'); this.audio.aviso(false); }

    // entregas a la casa
    if (r.entregas) {
      for (const x of r.entregas) {
        const o = OBJETOS[x.id];
        const categoria = o?.tipo === 'comida' || o?.tipo === 'crudo' ? 'alimento' : o?.tipo;
        contarEntrega(e, x.id, x.cantidad, categoria);
      }
      this.hud.aviso(`${r.texto} (+${Math.round(r.aporte)} de aporte)`, 'bueno');
      this.audio.logro();
    } else if (r.texto) {
      this.hud.aviso(r.texto, 'bueno');
    }

    if (r.contador) contar(e, r.contador);
    if (r.cultivo) contarCultivo(e, r.cultivo);
    if (r.xp && r.habilidad) this._ganarXP(r.habilidad, r.xp);
    if (r.tiempo) this._pasarMinutos(r.tiempo, r.actividad);
    this._comprobarCapitulo();
    if (r.minijuego) this._abrirMinijuego(r.minijuego, op);
  }

  _ganarXP(habilidad, xp) {
    const res = ganar(this.estado.jugador.habilidades, habilidad, xp);
    if (res.subio) {
      this.audio.logro();
      this.hud.aviso(`¡${habilidad} nivel ${res.nivel}!`, 'premio', 5200);
      for (const d of res.desbloqueos) this.hud.aviso(`Ahora sabés: ${d.texto}`, 'premio', 6200);
    }
  }

  /** Adelanta el reloj por una tarea que lleva su tiempo. */
  _pasarMinutos(minutos, actividad = 'trabajar') {
    const horas = minutos / 60;
    this.reloj.hora += horas;
    while (this.reloj.hora >= 24) { this.reloj.hora -= 24; this.reloj.dia++; this._nuevoDia(); }
    actualizarNecesidades(this.estado.jugador.necesidades, horas, {
      actividad, temperatura: this.clima.temperatura, cargaRelativa: cargaRelativa(this.estado),
    });
  }

  // --------------------------------------------------------- minijuegos
  _abrirMinijuego(tipo, op) {
    const e = this.estado;
    const hab = e.jugador.habilidades;
    if (tipo === 'pesca') {
      const punto = this._puntoPescaCercano();
      this.jugadorPose = 'pescar';
      const lance = crearLance({
        hondura: punto?.hondura ?? 0.3, hora: this.reloj.hora, lluvia: this.clima.lluvia,
        cebo: conocimientos(e).has('cebo'), bono: bono(hab, 'pesca'),
      }, Math.random);
      this.audio.lance();
      this.minijuegos.iniciarPesca(lance, (res) => {
        this.jugadorPose = null;
        if (res.cancelado) return;
        if (res.ok) {
          this.audio.chapoteo(0.8);
          for (const o of res.objetos) agregar(e.jugador.inventario, o.id, o.cantidad, nivel(hab, 'fuerza'));
          contar(e, 'pescar');
          this.hud.aviso(`¡${res.texto}!`, 'bueno', 4200);
          this._ganarXP('pesca', res.xp);
        } else {
          this.hud.aviso(res.texto || 'Se escapó.', 'malo');
          this._ganarXP('pesca', 2);
        }
        this._pasarMinutos(18, 'trabajar');
        this._comprobarCapitulo();
      });
      return;
    }
    if (tipo === 'atarraya') {
      const punto = this._puntoPescaCercano();
      const res = tirarAtarraya({ hondura: punto?.hondura ?? 0.3, hora: this.reloj.hora,
        lluvia: this.clima.lluvia, bono: bono(hab, 'pesca') }, Math.random);
      for (const o of res.objetos) agregar(e.jugador.inventario, o.id, o.cantidad, nivel(hab, 'fuerza'));
      if (res.ok) {
        contar(e, 'pescar', res.capturas.length);
        this.hud.aviso(`La atarraya trajo ${res.capturas.length} peces.`, 'bueno');
      } else this.hud.aviso('La atarraya salió vacía.', 'malo');
      this._ganarXP('pesca', res.xp);
      this.estado.jugador.necesidades.aguante = limitar(this.estado.jugador.necesidades.aguante - res.aguante, 0, 100);
      this._pasarMinutos(20, 'trabajar');
      this._comprobarCapitulo();
      return;
    }
    if (tipo === 'caza') {
      const animal = op.objetivo;
      const distancia = Math.hypot(animal.x - this.jugador.x, animal.z - this.jugador.z);
      const pen = penalizaciones(e.jugador.necesidades);
      this.jugadorPose = 'apuntar';
      const arma = conocimientos(e).has('tiro_largo') ? 'hondilla_larga' : 'hondilla';
      const ap = crearApuntado({
        arma, distancia, bono: bono(hab, 'caza'), punteria: pen.punteria,
        viento: this.clima.viento, agachado: this.jugador.agachado, fase: Math.random() * TAU,
      });
      this.camara.fovDeseado = 40 * (Math.PI / 180);
      this.minijuegos.iniciarCaza(ap, animal, (res) => {
        this.jugadorPose = null;
        this.camara.fovDeseado = 58 * (Math.PI / 180);
        if (res.cancelado) return;
        if (!res.disparo) { this.hud.aviso(res.texto || 'No tiraste.', 'malo'); return; }
        this.audio.tiro();
        quitar(e.jugador.inventario, 'piedra', 1);
        const tiro = resolverTiro({
          animal: animal.perfil, desvio: res.desvio, distancia, arma,
          bono: bono(hab, 'caza'), rnd: Math.random,
        });
        this.hud.aviso(tiro.texto, tiro.limpio ? 'bueno' : 'malo', 4600);
        if (tiro.limpio && tiro.presa) {
          const presa = this.fauna.cobrar(animal);
          agregar(e.jugador.inventario, presa.objeto, presa.cantidad, nivel(hab, 'fuerza'));
          if (conocimientos(e).has('destazar') && animal.tipo === 'venado') {
            agregar(e.jugador.inventario, 'cuero', 1, nivel(hab, 'fuerza'));
          }
          contar(e, 'cazar');
        } else {
          animal.sospecha = 1.3;
          animal.estado = 'huir';
          animal.temporizador = 5;
        }
        this._ganarXP('caza', tiro.xp);
        this._pasarMinutos(12, 'trabajar');
        this._comprobarCapitulo();
      });
      return;
    }
    if (tipo === 'lena') {
      this.jugadorPose = 'trabajar';
      this.minijuegos.iniciarLena(3, (res) => {
        this.jugadorPose = null;
        if (res.cancelado) return;
        const extra = res.aciertos;
        this.camara.sacudir(0.12 + extra * 0.06);
        if (extra > 0) {
          agregar(e.jugador.inventario, 'lena', extra, nivel(hab, 'fuerza'));
          this.hud.aviso(`${extra} leña${extra > 1 ? 's' : ''} de más por los buenos golpes.`, 'bueno');
        }
        this._ganarXP('fuerza', 3 + extra * 2);
        this._comprobarCapitulo();
      });
    }
  }

  /** El pulso del minijuego: la picada, el carrete y cada hachazo. */
  _sonarMinijuego(estadoAntes, golpesAntes, mando) {
    const m = this.minijuegos;
    if (m.modo === 'pesca' && m.lance) {
      if (estadoAntes !== 'picando' && m.lance.estado === 'picando') this.audio.picada();
      if (m.lance.estado === 'luchando' && mando.accion) this.audio.carrete(m.lance.tension);
    } else if (m.modo === 'lena' && m.dados > (golpesAntes || 0)) {
      const bueno = m.marcador > 0.42 && m.marcador < 0.58;
      this.audio.hachazo(bueno);
      this.camara.sacudir(bueno ? 0.28 : 0.12);
    }
  }

  _puntoPescaCercano() {
    let mejor = null, mejorD = 1e9;
    for (const p of this.puntosPesca) {
      const d = Math.hypot(p.x - this.jugador.x, p.z - this.jugador.z);
      if (d < mejorD) { mejorD = d; mejor = p; }
    }
    return mejorD < 26 ? mejor : null;
  }

  // -------------------------------------------------------------- paneles
  abrirPanel(tipo) {
    const e = this.estado;
    this.paneles.abrir(tipo, {
      estado: e,
      nivelFuerza: nivel(e.jugador.habilidades, 'fuerza'),
      sabe: conocimientos(e),
      progreso: resumenCapitulos(e),
      estacion: estacionDe(this.reloj.dia),
      motor: this.renderizador.nombre,
    });
  }

  _accionesPanel() {
    return {
      alCerrar: () => this.entrada.limpiar(),
      alComer: (id) => {
        const e = this.estado;
        if (!cuenta(e.jugador.inventario, id)) return;
        quitar(e.jugador.inventario, id, 1);
        comerNec(e.jugador.necesidades, OBJETOS[id]);
        this.hud.aviso(`Te comiste: ${OBJETOS[id].nombre}`, 'bueno');
      },
      alTomar: (id) => {
        const e = this.estado;
        transferir(e.hogar.despensa, e.jugador.inventario, id, 1, nivel(e.jugador.habilidades, 'fuerza'));
      },
      alCocinar: (idReceta) => {
        const e = this.estado;
        const r = cocinar(idReceta, e.jugador.inventario, {
          sabe: conocimientos(e), despensa: e.hogar.despensa,
          nivelFuerza: nivel(e.jugador.habilidades, 'fuerza'),
        });
        if (!r.ok) { this.hud.aviso(r.motivo || 'Faltan cosas.', 'malo'); return; }
        contarReceta(e, idReceta);
        this._ganarXP('oficio', r.xp);
        this._pasarMinutos(r.minutos, 'trabajar');
        this.hud.aviso(`Hiciste ${r.texto}`, 'bueno');
        this._comprobarCapitulo();
      },
      alSembrar: (idCultivo) => {
        if (!this.cuadroElegido) return;
        this.hacer({ id: 'sembrar', objetivo: this.cuadroElegido, cultivo: idCultivo });
        this.cuadroElegido = null;
      },
      alEmpezarCapitulo: (id) => {
        const cap = activarCapitulo(this.estado, id);
        if (cap.ok) this.dialogo.mostrar(cap.capitulo.intro, () => this.guardar());
      },
      alAjustar: (clave, valor) => {
        this.estado.ajustes[clave] = valor;
        this.guardar();
        // El sonido se aplica en el acto; lo grafico necesita reconstruir.
        if (clave === 'sonido') { this.audio.silenciar(!valor); if (valor) this.audio.clic(); }
        else if (clave === 'volumen') { this.audio.ponerVolumen(valor); this.audio.clic(); }
        else this.hud.aviso('Se aplica al volver a entrar al juego.', 'neutro', 5000);
      },
      alConstruir: (id) => {
        const e = this.estado;
        const r = empezarObra(e.rancho, id, this.reloj.dia, e.hogar.despensa, e.jugador.inventario);
        if (!r.ok) { this.hud.aviso(r.motivo, 'malo', 5000); this.audio.aviso(false); return; }
        this.audio.hachazo(true);
        this.hud.aviso(`Empezó la obra: ${r.obra.texto} (${r.obra.dias} día${r.obra.dias > 1 ? 's' : ''})`, 'premio', 6000);
        this.guardar();
      },
      alAsignar: (idPersona, tarea) => {
        const r = asignar(this.estado.reparto, idPersona, tarea);
        if (!r.ok) { this.hud.aviso(r.motivo, 'malo'); return; }
        this.audio.clic();
        this.guardar();
      },
      alGuardar: () => { this.guardar(); this.hud.aviso('Partida guardada.', 'bueno'); },
      alReiniciar: () => { if (confirm('¿Empezar de nuevo? Se pierde la partida.')) this.alSalir?.('nueva'); },
      alAmanecer: () => { this.hud.aviso(suceso('amanecer'), 'neutro', 4200); },
    };
  }

  // --------------------------------------------------------------- dibujo
  dibujar(dt) {
    const e = this.estado;
    const cielo = estadoCielo(this.reloj.hora, this.clima);
    const j = this.jugador;

    this.escena.reiniciarDinamicos();
    this.mundo3d.emitirMilpa(e.cuadros);
    this.mundo3d.emitirFauna(this.fauna);
    this.mundo3d.emitirPerro(this.perro);
    this.mundo3d.emitirSenales(this._marcadores());
    this.mundo3d.emitirAlcance(this._alcanceMarcado());
    this.mundo3d.emitirParticulas({
      dt, camara: this.camara, clima: this.clima, hora: this.reloj.hora,
      fogonEncendido: this.reloj.esNoche || this.clima.lluvia > 0.3,
    });
    this.mundo3d.emitirChispas(dt);

    this.personaje.actualizar(dt, {
      x: j.x, y: j.y, z: j.z, rumbo: j.rumbo, velocidad: j.velocidad,
      agachado: j.agachado, nadando: j.nadando, pose: this.jugadorPose || j.pose,
      carga: cargaRelativa(e),
    });
    this.personaje.emitir();

    matrizSombra([j.x, j.y, j.z], cielo.dirSol, 38, this.luzProy);
    this.renderizador.dibujar(this.escena, {
      camara: this.camara, cielo, tiempo: this.tiempoRender, luzProy: this.luzProy,
      viento: this.vientoSuave, agitacion: limitar(0.2 + this.clima.lluvia * 0.7, 0, 1),
    });

    this.mapa.actualizar({
      jugador: j, camara: this.camara, hora: this.reloj.hora,
      marcadores: this._marcadoresMapa(),
    });

    const efec = efectosRancho(e.rancho);
    this.hud.actualizar({
      reloj: this.reloj, dia: this.reloj.dia, clima: this.clima,
      necesidades: e.jugador.necesidades,
      peso: peso(e.jugador.inventario),
      cargaMaxima: cargaMaxima(e.jugador.inventario, nivel(e.jugador.habilidades, 'fuerza')) + efec.cargaExtra,
      rancho: {
        nivel: e.rancho.nivel, edad: edadDe(e.rancho), obra: e.rancho.obra,
        paso: siguientePasoRancho(e.rancho, e.hogar.despensa, e.jugador.inventario),
      },
      capitulo: capituloActivo(e) ? { capitulo: capituloActivo(e), ...evaluarCapitulo(capituloActivo(e), e) } : null,
    });
    this.dialogo.actualizar(dt);
  }

  /** Los sitios del objetivo, sin filtrar por distancia: el mapa los quiere todos. */
  _marcadoresMapa() {
    return this._marcadores(0);
  }

  /** Banderas que apuntan a donde hay que ir para el objetivo activo. */
  _marcadores(distanciaMinima = 14) {
    const cap = capituloActivo(this.estado);
    if (!cap) return [];
    const ev = evaluarCapitulo(cap, this.estado);
    const sitios = [];
    for (const o of ev.objetivos) {
      if (o.hecho) continue;
      const def = cap.objetivos.find((x) => x.id === o.id);
      if (!def) continue;
      if (def.tipo === 'entregar' || def.tipo === 'entregarCategoria') sitios.push(LUGARES.casa);
      else if (def.accion === 'pescar' || def.objeto === 'agua') sitios.push(LUGARES.poza);
      else if (def.accion === 'buscar' || def.accion === 'cazar') sitios.push(LUGARES.monte);
      else if (['sembrar', 'regar', 'cosechar'].includes(def.accion) || def.tipo === 'sembrar' || def.tipo === 'cosechar') sitios.push(LUGARES.milpa);
      else if (def.tipo === 'cocinar') sitios.push(LUGARES.fogon);
    }
    // En el mundo solo se planta bandera en lo que esta lejos: de cerca estorba.
    return sitios
      .filter((s) => Math.hypot(s.x - this.jugador.x, s.z - this.jugador.z) > distanciaMinima)
      .slice(0, 3);
  }

  // -------------------------------------------------------------- guardado
  guardar() {
    const e = this.estado;
    e.dia = this.reloj.dia;
    e.hora = this.reloj.hora;
    e.jugador.x = this.jugador.x;
    e.jugador.z = this.jugador.z;
    e.jugador.rumbo = this.jugador.rumbo;
    guardar(e);
  }

  destruir() {
    this.bucle?.parar();
    this.entrada?.destruir();
    this.renderizador?.destruir();
  }
}
