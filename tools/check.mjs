#!/usr/bin/env node
/*
 * ✅ Revisión del tutorial — ejecuta  node tools/check.mjs  antes de publicar.
 *
 * Comprueba, sin abrir el navegador:
 *  - que cada paso tenga un «id» fijo y que no se repita dentro de su módulo;
 *  - que todas las {{etiquetas}} de los textos y guiones existan en js/labels.js;
 *  - que cada guion de voz apunte a un paso que existe (y avisa de los pasos sin voz);
 *  - que cada elemento que el recorrido resalta (data-tour) exista en alguna pantalla;
 *  - el estado de los audios (igual que  node tools/voice.mjs).
 * Sale con código 1 si encuentra errores.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...a) => path.join(ROOT, ...a);
const read = (f) => fs.readFileSync(P(f), 'utf8');

const window = { ASSET_V: '1' };
const GH = window.GH = { icon: () => '', esc: (s) => String(s), store: {}, bus: { emit() {}, on() {} } };
const ctx = vm.createContext({ window, console, document: { querySelector: () => null } });
for (const f of ['js/labels.js', 'js/tour/content.js', 'js/tour/voice-manifest.js', 'js/tour/narration.js']) vm.runInContext(read(f), ctx, { filename: f });
const C = GH.tourContent, N = GH.narration;

const errors = [], warnings = [];

// 1. Ids de pasos
for (const m of C.modules) {
  const seen = new Set();
  m.steps.forEach((s, i) => {
    if (!s.id) errors.push(`${m.id} paso ${i + 1} («${s.title}») no tiene id.`);
    else if (!/^[a-z0-9-]+$/.test(s.id)) errors.push(`${m.id}:${s.id} — el id solo puede tener minúsculas, números y guiones.`);
    else if (seen.has(s.id)) errors.push(`${m.id}:${s.id} — id repetido en el módulo.`);
    seen.add(s.id);
  });
}

// 2. Etiquetas desconocidas (los textos que se calculan al mostrarse se revisan en su código fuente)
const L = GH.L;
const noComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
for (const f of ['js/tour/content.js', 'js/tour/narration.js']) {
  for (const m of noComments(read(f)).matchAll(/\{\{(\w+)(?::[^}]*)?\}\}/g)) if (!(m[1] in L)) errors.push(`${f}: etiqueta desconocida {{${m[1]}}}.`);
}
for (const k of GH.labels.missing()) errors.push(`Etiqueta desconocida al cargar: {{${k}}}.`);
const viewSrc = ['js/ui.js', ...fs.readdirSync(P('js')).filter(f => /^views-.*\.js$/.test(f)).map(f => 'js/' + f)].map(f => [f, read(f)]);
for (const [f, src] of viewSrc) for (const m of src.matchAll(/\bL\.(\w+)/g)) if (!(m[1] in L)) errors.push(`${f}: L.${m[1]} no existe en js/labels.js.`);
const unused = Object.keys(L).filter(k => !viewSrc.some(([, s]) => s.includes('L.' + k)) && !read('js/tour/content.js').includes('{{' + k) && !read('js/tour/narration.js').includes('{{' + k));
if (unused.length) warnings.push(`Etiquetas que nadie usa: ${unused.join(', ')}.`);

// 3. Guiones ↔ pasos
const special = /^(intro|done|hint|cheer|welcome|badge|level|challenge|grad):/;
const stepKeys = new Set(C.modules.flatMap(m => m.steps.map(s => `${m.id}:${s.id}`)));
for (const [key] of N.lines) if (!special.test(key) && !stepKeys.has(key)) errors.push(`Guion «${key}» no corresponde a ningún paso (¿cambió el id del paso?).`);
const narrated = new Set(N.lines.map(l => l[0]));
const silent = [...stepKeys].filter(k => !narrated.has(k));
if (silent.length) warnings.push(`Pasos sin guion de voz (${silent.length}): ${silent.join(', ')}.`);

// 4. Elementos resaltados (data-tour) que existen en las pantallas
const allViews = viewSrc.map(([, s]) => s).join('\n') + read('js/tour/engine.js') + read('js/tour/game.js');
const exact = new Set([...allViews.matchAll(/data-tour="([^"$]+)"/g), ...allViews.matchAll(/tour: '([^']+)'/g), ...allViews.matchAll(/setAttribute\('data-tour', '([^']+)'\)/g)].map(m => m[1]));
const prefixes = [...allViews.matchAll(/data-tour="([^"$]*)\$\{/g)].map(m => m[1]);
const used = new Set([...noComments(read('js/tour/content.js')).matchAll(/T\('([^']+)'\)/g)].map(m => m[1]));
for (const t of used) if (!exact.has(t) && !prefixes.some(p => p && t.startsWith(p)) && !allViews.includes(`'${t}'`)) errors.push(`El recorrido resalta data-tour="${t}", pero ninguna pantalla lo tiene.`);

// 5. Audios
const files = new Set(fs.readdirSync(P('audio')).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)));
const stale = N.lines.filter(([, f, t]) => files.has(f) && (!(GH.voiceManifest || {})[f] || GH.voiceManifest[f].h !== N.fingerprint(t))).map(l => l[1]);
const missing = N.lines.filter(([, f]) => !files.has(f)).map(l => l[1]);
if (stale.length) warnings.push(`Audios desactualizados (${stale.length}): ${stale.join(', ')} → node tools/voice.mjs`);
if (missing.length) warnings.push(`Audios que faltan (${missing.length}): ${missing.join(', ')} → node tools/voice.mjs generate`);

// Resultado
const steps = C.modules.reduce((a, m) => a + m.steps.length, 0);
console.log(`\nRevisión del tutorial: ${C.modules.length} módulos, ${steps} pasos, ${Object.keys(L).length} etiquetas, ${N.lines.length} guiones de voz.\n`);
for (const w of warnings) console.log('  ⚠️  ' + w);
for (const e of errors) console.log('  ⛔ ' + e);
console.log(errors.length ? `\n${errors.length} error(es). Corrígelos antes de publicar.\n` : `\n✅ Sin errores${warnings.length ? ' (revisa los avisos)' : ''}.\n`);
process.exitCode = errors.length ? 1 : 0;
