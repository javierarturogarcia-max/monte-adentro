/**
 * audio.js — Todo el sonido del juego, sintetizado.
 *
 * No hay ni un archivo de audio, igual que no hay ni un archivo de arte: el
 * rio, el viento, los pasos, los grillos y el hacha se fabrican con
 * osciladores y ruido filtrado en el momento. Ocupa cero bytes de descarga y
 * suena distinto cada vez, que es justo lo que le falta a un bucle grabado.
 *
 * La capa de ambiente son tres lechos que suben y bajan de volumen segun donde
 * este el nino y que hora sea (rio, viento, bicheria), y encima van los golpes
 * sueltos de cada accion.
 *
 * Los navegadores no dejan sonar nada hasta que la persona toca la pagina, asi
 * que el contexto se crea dormido y se despierta con el primer clic o tecla.
 */
import { limitar, mezclar } from './mate.js';

export class Audio {
  constructor(op = {}) {
    this.activo = false;
    this.volumen = op.volumen ?? 0.75;
    this.ctx = null;
    this.lechos = {};
    this.ultimoPaso = 0;
    this.silenciado = false;
  }

  /** Se llama en el primer gesto del usuario: antes, el navegador no deja. */
  despertar() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return true;
    }
    const Contexto = window.AudioContext || window.webkitAudioContext;
    if (!Contexto) return false;
    try {
      this.ctx = new Contexto();
    } catch { return false; }

    this.maestro = this.ctx.createGain();
    this.maestro.gain.value = this.silenciado ? 0 : this.volumen;
    // Un compresor suave evita que la lluvia mas un trueno saturen.
    this.limitador = this.ctx.createDynamicsCompressor();
    this.limitador.threshold.value = -12;
    this.limitador.ratio.value = 6;
    this.limitador.attack.value = 0.004;
    this.limitador.release.value = 0.18;
    this.maestro.connect(this.limitador).connect(this.ctx.destination);

    this.ruido = this._bufferRuido(3);
    this._montarLechos();
    this.activo = true;
    return true;
  }

  /** Ruido rosa: suena a naturaleza; el blanco suena a television vieja. */
  _bufferRuido(segundos) {
    const n = Math.floor(this.ctx.sampleRate * segundos);
    const buffer = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
    const datos = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < n; i++) {
      const blanco = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + blanco * 0.0555179;
      b1 = 0.99332 * b1 + blanco * 0.0750759;
      b2 = 0.96900 * b2 + blanco * 0.1538520;
      b3 = 0.86650 * b3 + blanco * 0.3104856;
      b4 = 0.55000 * b4 + blanco * 0.5329522;
      b5 = -0.7616 * b5 - blanco * 0.0168980;
      datos[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + blanco * 0.5362) * 0.11;
      b6 = blanco * 0.115926;
    }
    return buffer;
  }

  /** Un lecho continuo: ruido en bucle a traves de un filtro, con su volumen. */
  _lecho(tipo, frecuencia, Q, ganancia = 0) {
    const fuente = this.ctx.createBufferSource();
    fuente.buffer = this.ruido;
    fuente.loop = true;
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = tipo;
    filtro.frequency.value = frecuencia;
    filtro.Q.value = Q;
    const vol = this.ctx.createGain();
    vol.gain.value = ganancia;
    fuente.connect(filtro).connect(vol).connect(this.maestro);
    fuente.start();
    return { fuente, filtro, vol };
  }

  _montarLechos() {
    // Rio: agua corriendo, grave y constante.
    this.lechos.rio = this._lecho('bandpass', 620, 0.7);
    // Viento: soplo ancho que se mueve con la fuerza del viento.
    this.lechos.viento = this._lecho('lowpass', 480, 0.5);
    // Lluvia: mas aguda que el rio, y con cuerpo cuando arrecia.
    this.lechos.lluvia = this._lecho('highpass', 1100, 0.6);
    this.lechos.aguacero = this._lecho('bandpass', 380, 0.4);
  }

  /**
   * Ajusta el ambiente. Se llama unas pocas veces por segundo, no cada cuadro.
   * @param {object} e {distanciaRio, viento, lluvia, hora, dentroAgua, bajoTecho}
   */
  ambiente(e) {
    if (!this.activo) return;
    const t = this.ctx.currentTime;
    const suave = (nodo, valor, tiempo = 0.4) => {
      nodo.gain.cancelScheduledValues(t);
      nodo.gain.setTargetAtTime(valor, t, tiempo / 3);
    };
    const techo = e.bajoTecho ? 0.45 : 1;

    // El rio se oye desde lejos y crece al acercarse.
    const cercaRio = 1 - limitar((e.distanciaRio ?? 999) / 45, 0, 1);
    suave(this.lechos.rio.vol, cercaRio ** 1.8 * 0.34 * techo);
    this.lechos.rio.filtro.frequency.setTargetAtTime(
      mezclar(430, 780, cercaRio), t, 0.5);

    const viento = limitar(e.viento ?? 0.2, 0, 1.4);
    suave(this.lechos.viento.vol, (0.035 + viento * 0.13) * techo);
    this.lechos.viento.filtro.frequency.setTargetAtTime(mezclar(320, 900, viento), t, 0.6);

    const lluvia = limitar(e.lluvia ?? 0, 0, 1);
    suave(this.lechos.lluvia.vol, lluvia * 0.22 * (e.bajoTecho ? 0.7 : 1));
    suave(this.lechos.aguacero.vol, Math.max(0, lluvia - 0.45) * 0.3 * techo);

    this._programarBichos(e);
  }

  /**
   * Pajaros de dia, grillos de noche. Se programan de uno en uno con pausas
   * irregulares: un bucle de chirridos se delata en diez segundos.
   */
  _programarBichos(e) {
    const ahora = this.ctx.currentTime;
    if (this.proximoBicho && ahora < this.proximoBicho) return;
    const hora = e.hora ?? 12;
    const noche = hora < 5.2 || hora > 18.9;
    const callado = (e.lluvia ?? 0) > 0.5;
    this.proximoBicho = ahora + (callado ? 4 : mezclar(0.5, 2.6, Math.random()));
    if (callado || e.bajoTecho) return;

    if (noche) this.grillo();
    else if (Math.random() < 0.75) this.pajaro();
  }

  // ------------------------------------------------------------ golpes sueltos
  /** Envolvente corta sobre un oscilador. */
  _tono({ frecuencia = 440, tipo = 'sine', duracion = 0.18, ganancia = 0.2,
    caidaFrecuencia = 0, retraso = 0, vibrato = 0 } = {}) {
    if (!this.activo) return;
    const t = this.ctx.currentTime + retraso;
    const osc = this.ctx.createOscillator();
    osc.type = tipo;
    osc.frequency.setValueAtTime(frecuencia, t);
    if (caidaFrecuencia) {
      osc.frequency.exponentialRampToValueAtTime(
        Math.max(20, frecuencia + caidaFrecuencia), t + duracion);
    }
    if (vibrato) {
      const lfo = this.ctx.createOscillator();
      const lfoG = this.ctx.createGain();
      lfo.frequency.value = 7;
      lfoG.gain.value = vibrato;
      lfo.connect(lfoG).connect(osc.frequency);
      lfo.start(t); lfo.stop(t + duracion + 0.05);
    }
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(ganancia, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    osc.connect(g).connect(this.maestro);
    osc.start(t);
    osc.stop(t + duracion + 0.05);
  }

  /** Rafaga de ruido filtrado: pasos, chapoteos, hachazos. */
  _rafaga({ frecuencia = 900, Q = 1, duracion = 0.16, ganancia = 0.2,
    tipo = 'bandpass', caida = 0, retraso = 0 } = {}) {
    if (!this.activo) return;
    const t = this.ctx.currentTime + retraso;
    const fuente = this.ctx.createBufferSource();
    fuente.buffer = this.ruido;
    fuente.loop = true;
    // Empezar en un punto al azar del buffer: si no, todos los pasos son igual.
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = tipo;
    filtro.frequency.setValueAtTime(frecuencia, t);
    if (caida) filtro.frequency.exponentialRampToValueAtTime(Math.max(60, frecuencia + caida), t + duracion);
    filtro.Q.value = Q;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(ganancia, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duracion);
    fuente.connect(filtro).connect(g).connect(this.maestro);
    fuente.start(t, Math.random() * 2.5);
    fuente.stop(t + duracion + 0.05);
  }

  /**
   * Un paso. El suelo cambia el sonido: la tierra seca cruje, el pasto susurra,
   * el agua chapotea y la piedra suena dura.
   */
  paso(suelo = 'tierra', fuerte = false) {
    const perfiles = {
      tierra: { frecuencia: 380, Q: 1.1, duracion: 0.11, ganancia: 0.13, caida: -160 },
      pasto:  { frecuencia: 1500, Q: 0.8, duracion: 0.13, ganancia: 0.09, caida: -700 },
      agua:   { frecuencia: 900, Q: 0.6, duracion: 0.22, ganancia: 0.16, caida: -420 },
      piedra: { frecuencia: 620, Q: 2.4, duracion: 0.09, ganancia: 0.14, caida: -220 },
      madera: { frecuencia: 300, Q: 3, duracion: 0.1, ganancia: 0.12, caida: -90 },
    };
    const p = perfiles[suelo] || perfiles.tierra;
    const variacion = mezclar(0.85, 1.2, Math.random());
    this._rafaga({ ...p, frecuencia: p.frecuencia * variacion,
      ganancia: p.ganancia * (fuerte ? 1.5 : 1) });
  }

  chapoteo(fuerza = 1) {
    this._rafaga({ frecuencia: 1200, Q: 0.5, duracion: 0.3 * fuerza, ganancia: 0.2 * fuerza, caida: -900 });
    this._rafaga({ frecuencia: 300, Q: 0.8, duracion: 0.22 * fuerza, ganancia: 0.12 * fuerza, retraso: 0.02 });
  }

  hachazo(bueno = true) {
    this._rafaga({ frecuencia: bueno ? 240 : 400, Q: 2.2, duracion: 0.16, ganancia: 0.26, caida: -120 });
    this._tono({ frecuencia: bueno ? 120 : 180, tipo: 'triangle', duracion: 0.2,
      ganancia: 0.14, caidaFrecuencia: -60 });
    if (bueno) this._rafaga({ frecuencia: 2600, Q: 1, duracion: 0.09, ganancia: 0.07, retraso: 0.01 });
  }

  /** La piedra de la hondilla saliendo. */
  tiro() {
    this._rafaga({ frecuencia: 1800, Q: 0.7, duracion: 0.14, ganancia: 0.15, caida: -1400 });
  }

  /** El anzuelo entrando al agua y el carrete. */
  lance() {
    this._rafaga({ frecuencia: 2400, Q: 0.6, duracion: 0.22, ganancia: 0.1, caida: -1900 });
    this.chapoteo(0.5);
  }

  carrete(intensidad = 1) {
    const ahora = this.ctx ? this.ctx.currentTime : 0;
    if (this.ultimoCarrete && ahora - this.ultimoCarrete < 0.11) return;
    this.ultimoCarrete = ahora;
    this._rafaga({ frecuencia: mezclar(900, 1900, intensidad), Q: 6, duracion: 0.07,
      ganancia: 0.06 + intensidad * 0.05 });
  }

  picada() {
    this._tono({ frecuencia: 640, tipo: 'sine', duracion: 0.1, ganancia: 0.16 });
    this._tono({ frecuencia: 880, tipo: 'sine', duracion: 0.14, ganancia: 0.14, retraso: 0.09 });
  }

  recoger() {
    this._tono({ frecuencia: 520, tipo: 'triangle', duracion: 0.12, ganancia: 0.13, caidaFrecuencia: 240 });
  }

  soltarAgua() {
    this._rafaga({ frecuencia: 700, Q: 0.7, duracion: 0.5, ganancia: 0.14, caida: -430 });
  }

  /** Subir de nivel: tres notas que suben, sin estridencia. */
  logro() {
    [523.25, 659.25, 783.99].forEach((f, i) => {
      this._tono({ frecuencia: f, tipo: 'triangle', duracion: 0.5, ganancia: 0.13, retraso: i * 0.11 });
    });
  }

  aviso(bueno = true) {
    this._tono({ frecuencia: bueno ? 660 : 220, tipo: 'sine', duracion: 0.14,
      ganancia: 0.1, caidaFrecuencia: bueno ? 120 : -60 });
  }

  clic() {
    this._rafaga({ frecuencia: 2200, Q: 3, duracion: 0.045, ganancia: 0.07 });
  }

  pajaro() {
    const base = mezclar(1700, 3100, Math.random());
    const notas = 1 + Math.floor(Math.random() * 3);
    for (let i = 0; i < notas; i++) {
      this._tono({ frecuencia: base * mezclar(0.9, 1.25, Math.random()), tipo: 'sine',
        duracion: 0.09, ganancia: 0.035, caidaFrecuencia: mezclar(-400, 700, Math.random()),
        retraso: i * 0.11, vibrato: 30 });
    }
  }

  grillo() {
    const base = mezclar(3400, 4400, Math.random());
    for (let i = 0; i < 3; i++) {
      this._rafaga({ frecuencia: base, Q: 22, duracion: 0.035, ganancia: 0.03, retraso: i * 0.06 });
    }
  }

  trueno(lejos = 0.5) {
    this._rafaga({ frecuencia: mezclar(90, 260, 1 - lejos), Q: 0.4,
      duracion: mezclar(1.6, 0.7, lejos), ganancia: mezclar(0.34, 0.12, lejos), caida: -60 });
  }

  fuego() {
    if (Math.random() < 0.5) {
      this._rafaga({ frecuencia: mezclar(700, 2200, Math.random()), Q: 3,
        duracion: 0.05, ganancia: 0.04 });
    }
  }

  // -------------------------------------------------------------- ajustes
  silenciar(si) {
    this.silenciado = si;
    if (this.maestro) {
      this.maestro.gain.setTargetAtTime(si ? 0 : this.volumen, this.ctx.currentTime, 0.1);
    }
  }

  ponerVolumen(v) {
    this.volumen = limitar(v, 0, 1);
    if (this.maestro && !this.silenciado) {
      this.maestro.gain.setTargetAtTime(this.volumen, this.ctx.currentTime, 0.1);
    }
  }

  destruir() {
    try { this.ctx?.close(); } catch { /* ya estaba cerrado */ }
    this.activo = false;
  }
}
