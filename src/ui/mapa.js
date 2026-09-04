/**
 * mapa.js — El mapa del valle, dibujado del propio terreno.
 *
 * No es una imagen: se recorre el relieve una sola vez al arrancar y se pinta
 * pixel a pixel con el mismo color que tiene el suelo en el juego, con un
 * sombreado de relieve para que se lean las lomas. Encima van los sitios de
 * siempre (la casa, la milpa, la poza), el nino con su cono de vision y la
 * bandera del objetivo.
 *
 * Va siempre con el norte arriba: girar el mapa con la camara marea y hace
 * imposible acordarse de donde queda nada, que es justo lo que se quiere
 * conseguir aqui.
 */
import { el } from './base.js';
import { limitar } from '../nucleo/mate.js';
import { LUGARES, NIVEL_AGUA } from '../mundo/terreno.js';

const PASO = 2;          // metros por muestra al generar el mapa
const LADO = 168;        // pixeles del mapa pequeno

const SITIOS = [
  { clave: 'casa', icono: '🏠', nombre: 'la casa' },
  { clave: 'milpa', icono: '🌽', nombre: 'la milpa' },
  { clave: 'poza', icono: '💧', nombre: 'la poza' },
  { clave: 'fogon', icono: '🔥', nombre: null },   // pegado a la casa: sin rotulo
  { clave: 'monte', icono: '🌲', nombre: 'el monte' },
];

export class Mapa {
  constructor(raiz, terreno) {
    this.terreno = terreno;
    this.abierto = false;

    this.lienzo = el('canvas', { id: 'mapa-lienzo' });
    this.lienzo.width = LADO;
    this.lienzo.height = LADO;
    this.ctx = this.lienzo.getContext('2d');
    this.rotulo = el('div', { clase: 'mapa-rotulo', texto: 'N' });
    this.caja = el('div', { clase: 'tarjeta', id: 'mapa' }, [this.lienzo, this.rotulo]);
    this.caja.addEventListener('click', () => this.alternar());
    raiz.appendChild(this.caja);

    this.base = this._dibujarValle();
  }

  /** Recorre el terreno una vez y deja el valle pintado en un lienzo aparte. */
  _dibujarValle() {
    const t = this.terreno;
    const n = Math.round(t.lado / PASO);
    const base = document.createElement('canvas');
    base.width = n; base.height = n;
    const ctx = base.getContext('2d');
    const img = ctx.createImageData(n, n);

    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const x = -t.mitad + i * PASO;
        const z = -t.mitad + j * PASO;
        const h = t.altura(x, z);
        let r, g, b;
        if (h < NIVEL_AGUA) {
          // El agua se dibuja mas oscura cuanto mas honda: se ve el cauce.
          const prof = limitar((NIVEL_AGUA - h) / 5, 0, 1);
          r = 0.30 - prof * 0.16; g = 0.52 - prof * 0.22; b = 0.62 - prof * 0.18;
        } else {
          const c = t.colorSuelo(x, z, h);
          // Sombreado de relieve: luz desde el noroeste, como en los mapas.
          const dx = t.altura(x + PASO, z) - t.altura(x - PASO, z);
          const dz = t.altura(x, z + PASO) - t.altura(x, z - PASO);
          const luz = limitar(0.72 + (-dx * 0.5 - dz * 0.5) * 0.12, 0.35, 1.35);
          r = c[0] * luz; g = c[1] * luz; b = c[2] * luz;
        }
        const o = (j * n + i) * 4;
        img.data[o] = limitar(r, 0, 1) * 255;
        img.data[o + 1] = limitar(g, 0, 1) * 255;
        img.data[o + 2] = limitar(b, 0, 1) * 255;
        img.data[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return base;
  }

  /** Mundo -> pixel del mapa que se ve. */
  _aPantalla(x, z, lado) {
    const t = this.terreno;
    return [
      ((x + t.mitad) / t.lado) * lado,
      ((z + t.mitad) / t.lado) * lado,
    ];
  }

  /**
   * @param {object} e {jugador, camara, marcadores, hora, animales}
   */
  actualizar(e) {
    const lado = this.lienzo.width;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, lado, lado);
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(this.base, 0, 0, lado, lado);

    // De noche el mapa se apaga: solo se sabe lo que se tiene cerca.
    const noche = e.hora < 5.2 || e.hora > 19.2;
    if (noche) {
      ctx.fillStyle = 'rgba(8, 10, 22, 0.5)';
      ctx.fillRect(0, 0, lado, lado);
    }

    const [px, pz] = this._aPantalla(e.jugador.x, e.jugador.z, lado);

    // Cono de vision de la camara.
    if (e.camara) {
      const giro = e.camara.giro;
      const abertura = 0.62;
      ctx.beginPath();
      ctx.moveTo(px, pz);
      const largo = lado * (this.abierto ? 0.1 : 0.17);
      for (let a = -abertura; a <= abertura; a += 0.1) {
        // El mundo tiene la Z hacia el sur y la camara mira a -Z con giro 0.
        const ang = giro + a;
        ctx.lineTo(px + Math.sin(ang) * -largo, pz + Math.cos(ang) * -largo);
      }
      ctx.closePath();
      ctx.fillStyle = 'rgba(246, 239, 227, 0.16)';
      ctx.fill();
    }

    // Sitios de siempre.
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `${this.abierto ? 15 : 11}px system-ui, sans-serif`;
    for (const s of SITIOS) {
      const l = LUGARES[s.clave];
      if (!l) continue;
      const [x, y] = this._aPantalla(l.x, l.z, lado);
      ctx.fillText(s.icono, x, y);
      if (this.abierto && s.nombre) {
        ctx.fillStyle = 'rgba(246, 239, 227, 0.85)';
        ctx.font = '10px system-ui, sans-serif';
        ctx.fillText(s.nombre, x, y + 15);
        ctx.font = '15px system-ui, sans-serif';
      }
    }

    // Bandera del objetivo, latiendo.
    for (const m of e.marcadores || []) {
      const [x, y] = this._aPantalla(m.x, m.z, lado);
      const pulso = 3.5 + Math.sin(Date.now() / 260) * 1.6;
      ctx.beginPath();
      ctx.arc(x, y, pulso + 3, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(240, 185, 92, 0.28)';
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#f0b95c';
      ctx.fill();
    }

    // El nino: un triangulo que apunta a donde mira.
    ctx.save();
    ctx.translate(px, pz);
    ctx.rotate(-e.jugador.rumbo + Math.PI);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(4.2, 5);
    ctx.lineTo(0, 3);
    ctx.lineTo(-4.2, 5);
    ctx.closePath();
    ctx.fillStyle = '#f6efe3';
    ctx.strokeStyle = 'rgba(24, 17, 12, 0.85)';
    ctx.lineWidth = 1.4;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  alternar() {
    this.abierto = !this.abierto;
    this.caja.classList.toggle('abierto', this.abierto);
    const lado = this.abierto ? Math.min(520, Math.round(Math.min(innerWidth, innerHeight) * 0.72)) : LADO;
    this.lienzo.width = lado;
    this.lienzo.height = lado;
    this.rotulo.textContent = this.abierto ? 'El valle · norte arriba' : 'N';
    return this.abierto;
  }

  cerrar() { if (this.abierto) this.alternar(); }
}
