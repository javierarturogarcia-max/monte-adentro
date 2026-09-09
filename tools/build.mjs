/**
 * build.mjs — Empaqueta el juego en un unico archivo.
 *
 * Produce dos artefactos en dist/:
 *   monte-adentro.html  el juego entero (HTML + CSS + JS en linea). Se puede
 *                       abrir con doble clic, sin servidor y sin conexion.
 *   artifact.html       el mismo juego sin <!doctype>/<html>/<head>/<body>,
 *                       para incrustarlo donde el contenedor ya aporta el
 *                       esqueleto de la pagina.
 *
 * El empaquetado lo hace tools/empaquetar.mjs, que no depende de nada.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { empaquetar, RAIZ } from './empaquetar.mjs';

const FUENTE = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700;9..144,900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;

const juego = empaquetar(resolve(RAIZ, 'src/main.js'));
const css = readFileSync(resolve(RAIZ, 'assets/estilos.css'), 'utf8');
const pkg = JSON.parse(readFileSync(resolve(RAIZ, 'package.json'), 'utf8'));

const AUTOR = 'Javier Arturo García Mineros';
const REPO = 'https://github.com/javierarturogarcia-max/monte-adentro';

/**
 * La autoria va DENTRO del archivo, no solo en el repositorio. El juego
 * empaquetado viaja solo —se manda por mensaje, se copia a una memoria, se
 * abre sin conexion—, asi que cada copia tiene que decir de quien es.
 */
const AVISO = `<!--
  Monte Adentro — un juego de ${AUTOR}, sobre su propia infancia en el campo.

  © 2026 ${AUTOR}.

  LA HISTORIA (capitulos, dialogos, personajes, textos y los recuerdos en que
  se basan) es obra suya: TODOS LOS DERECHOS RESERVADOS. No se reutiliza, no
  se adapta y no se vende sin su permiso escrito.

  EL CODIGO (motor grafico, reglas, interfaz) es libre bajo licencia MIT.

  Condiciones completas: ${REPO}
-->`;

// El juego se monta solo dentro de #app (ver src/main.js).
const ARRANQUE = `<div id="app"></div>
<script>
${juego.codigo}
</script>`;

const html = `<!DOCTYPE html>
<html lang="es">
${AVISO}
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover">
<title>Monte Adentro — el juego del niño del campo</title>
<meta name="description" content="${pkg.description}">
<meta name="author" content="${AUTOR}">
<meta name="copyright" content="© 2026 ${AUTOR}. La historia: todos los derechos reservados. El código: MIT.">
<link rel="license" href="${REPO}/blob/main/LICENSE">
<meta name="theme-color" content="#14100c">
<meta name="color-scheme" content="dark">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌄</text></svg>">
${FUENTE}
<style>
${css}
</style>
</head>
<body>
${ARRANQUE}
</body>
</html>`;

if (!existsSync(resolve(RAIZ, 'dist'))) mkdirSync(resolve(RAIZ, 'dist'));
writeFileSync(resolve(RAIZ, 'dist/monte-adentro.html'), html);

const fragmento = `<title>Monte Adentro</title>
${AVISO}
<meta name="author" content="${AUTOR}">
${FUENTE}
<style>
${css}
</style>
${ARRANQUE}`;
writeFileSync(resolve(RAIZ, 'dist/artifact.html'), fragmento);

const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(1)} kB`;
console.log(`Modulos empaquetados: ${juego.modulos}`);
console.log(`  dist/monte-adentro.html  ${kb(html)}`);
console.log(`  dist/artifact.html       ${kb(fragmento)}`);
