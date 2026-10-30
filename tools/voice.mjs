#!/usr/bin/env node
/*
 * 🔊 Herramienta de voz del tutorial.
 *
 * Compara cada guion de js/tour/narration.js con la «huella» del texto con que se grabó su audio
 * (guardada en js/tour/voice-manifest.js) y dice qué audios hay que volver a grabar.
 *
 *   node tools/voice.mjs                  Estado: audios al día, desactualizados, faltantes y costo estimado.
 *   node tools/voice.mjs generate         Regenera SOLO los desactualizados y faltantes con la API de ElevenLabs.
 *   node tools/voice.mjs generate m7-14   Regenera esos archivos concretos (aunque estén al día).
 *   node tools/voice.mjs accept m7-14     Marca como al día un audio que grabaste por otra vía (web de ElevenLabs, etc.).
 *   node tools/voice.mjs accept --all     Marca todos los audios existentes como al día (úsalo solo si sabes que lo están).
 *
 * Opciones de generate:  --yes (no preguntar)   --dry-run (solo mostrar qué haría)   --model <id>
 * La clave de ElevenLabs se lee de la variable de entorno ELEVENLABS_API_KEY. Nunca se guarda en el proyecto.
 * Requiere Node 18 o superior.
 */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import readline from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const P = (...a) => path.join(ROOT, ...a);
const MANIFEST = P('js/tour/voice-manifest.js');
const AUDIO = P('audio');

// ---- Carga labels.js + manifest + narration.js tal como los ve el navegador ----
function load() {
  const window = { ASSET_V: '1' };
  window.GH = {};
  const ctx = vm.createContext({ window, console });
  for (const f of ['js/labels.js', 'js/tour/voice-manifest.js', 'js/tour/narration.js']) {
    if (fs.existsSync(P(f))) vm.runInContext(fs.readFileSync(P(f), 'utf8'), ctx, { filename: f });
  }
  const GH = window.GH;
  const missingLabels = GH.labels.missing();
  return { N: GH.narration, manifest: { ...(GH.voiceManifest || {}) }, missingLabels };
}

function writeManifest(manifest) {
  const keys = Object.keys(manifest).sort();
  const body = keys.map(k => `  ${JSON.stringify(k)}: ${JSON.stringify(manifest[k])}`).join(',\n');
  fs.writeFileSync(MANIFEST, `/* Generado por tools/voice.mjs — no lo edites a mano.
 * Huella del texto con que se grabó cada audio de audio/. Un audio solo suena si su huella coincide con el guion actual. */
window.GH = window.GH || {};
window.GH.voiceManifest = {
${body}
};
`);
}

function analyze({ N, manifest }) {
  const rows = [];
  const files = new Set(fs.existsSync(AUDIO) ? fs.readdirSync(AUDIO).filter(f => f.endsWith('.mp3')).map(f => f.slice(0, -4)) : []);
  const seen = new Set();
  for (const [key, file, text] of N.lines) {
    if (seen.has(file)) { rows.push({ key, file, text, state: 'duplicado' }); continue; }
    seen.add(file);
    const h = N.fingerprint(text);
    const rec = manifest[file];
    let state = 'ok';
    if (!files.has(file)) state = 'falta';
    else if (!rec) state = 'sin huella';
    else if (rec.h !== h) state = 'desactualizado';
    rows.push({ key, file, text, h, state, chars: text.length });
  }
  const orphans = [...files].filter(f => !seen.has(f)).sort();
  return { rows, orphans };
}

function status(data) {
  const { rows, orphans } = analyze(data);
  const by = s => rows.filter(r => r.state === s);
  const ok = by('ok'), stale = by('desactualizado'), missing = by('falta'), noHash = by('sin huella'), dup = by('duplicado');
  console.log(`\n🔊 Voz del tutorial — ${rows.length} guiones (voz ${data.N.voice.name}, modelo ${data.N.voice.model})\n`);
  console.log(`  ✅ Al día:            ${ok.length}`);
  const show = (title, list, why) => {
    if (!list.length) return;
    console.log(`\n  ${title} (${list.length})${why ? ' — ' + why : ''}`);
    for (const r of list) console.log(`     ${r.file.padEnd(14)} ${r.key.padEnd(34)} «${r.text.length > 70 ? r.text.slice(0, 70) + '…' : r.text}»`);
  };
  show('⚠️  Desactualizados', stale, 'el texto cambió desde que se grabó; hoy no suenan');
  show('➕ Faltan', missing, 'no hay MP3; esos pasos van solo con texto');
  show('❔ Sin huella', noHash, 'hay MP3 pero no consta con qué texto se grabó; revisa y usa «accept»');
  show('⛔ Archivo repetido', dup, 'dos guiones usan el mismo archivo; cambia el nombre de uno');
  if (orphans.length) console.log(`\n  🗑️  MP3 que ningún guion usa (${orphans.length}): ${orphans.join(', ')}`);
  if (data.missingLabels.length) console.log(`\n  ⛔ Etiquetas desconocidas en los guiones: ${data.missingLabels.map(k => '{{' + k + '}}').join(', ')} (revisa js/labels.js)`);
  const todo = [...stale, ...missing];
  const chars = todo.reduce((a, r) => a + r.chars, 0);
  if (todo.length) console.log(`\n  Para ponerlos al día: node tools/voice.mjs generate   (${todo.length} audios, unos ${chars.toLocaleString('es')} caracteres ≈ ${chars.toLocaleString('es')} créditos de ElevenLabs)\n`);
  else console.log('\n  Todo al día. 🎉\n');
  return { todo, problems: dup.length + data.missingLabels.length };
}

async function generate(data, files, opts) {
  const { rows } = analyze(data);
  let list = files.length ? rows.filter(r => files.includes(r.file)) : rows.filter(r => r.state === 'desactualizado' || r.state === 'falta');
  const unknown = files.filter(f => !rows.some(r => r.file === f));
  if (unknown.length) { console.error(`No existe ningún guion con archivo: ${unknown.join(', ')}`); process.exit(1); }
  if (!list.length) { console.log('No hay audios por generar. 🎉'); return; }
  const chars = list.reduce((a, r) => a + r.chars, 0);
  const model = opts.model || data.N.voice.model;
  console.log(`\nSe generarán ${list.length} audios (≈ ${chars.toLocaleString('es')} créditos) con la voz ${data.N.voice.name} y el modelo ${model}:`);
  for (const r of list) console.log(`   ${r.file.padEnd(14)} «${r.text.length > 80 ? r.text.slice(0, 80) + '…' : r.text}»`);
  if (opts.dryRun) { console.log('\n(--dry-run: no se generó nada)'); return; }
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) { console.error('\nFalta la variable de entorno ELEVENLABS_API_KEY (tu clave de la API de ElevenLabs).'); process.exit(1); }
  if (!opts.yes) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const ans = (await rl.question('\n¿Continuar? Se gastarán créditos (s/N): ')).trim().toLowerCase(); rl.close();
    if (ans !== 's' && ans !== 'si' && ans !== 'sí') { console.log('Cancelado.'); return; }
  }
  const manifest = data.manifest;
  let done = 0;
  for (const r of list) {
    process.stdout.write(`   ${r.file} … `);
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${data.N.voice.voice_id}?output_format=mp3_44100_128`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text: r.text, model_id: model })
    });
    if (!res.ok) {
      const msg = (await res.text()).slice(0, 300);
      console.log(`error ${res.status}: ${msg}`);
      console.error('\nSe detuvo para no gastar créditos de más. Los audios anteriores quedaron guardados.');
      break;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(path.join(AUDIO, r.file + '.mp3'), buf);
    manifest[r.file] = { h: r.h, chars: r.chars, at: new Date().toISOString().slice(0, 10) };
    writeManifest(manifest);
    done++;
    console.log(`listo (${Math.round(buf.length / 1024)} KB)`);
  }
  console.log(`\n${done} de ${list.length} audios generados. Recuerda ejecutar  python3 tools/bump-version.py  antes de publicar.`);
}

function accept(data, files, all) {
  const { rows } = analyze(data);
  const list = all ? rows.filter(r => r.state !== 'falta' && r.state !== 'duplicado') : rows.filter(r => files.includes(r.file));
  const unknown = all ? [] : files.filter(f => !rows.some(r => r.file === f));
  if (unknown.length) { console.error(`No existe ningún guion con archivo: ${unknown.join(', ')}`); process.exit(1); }
  for (const r of list) {
    if (r.state === 'falta') { console.error(`${r.file}: no hay audio/${r.file}.mp3; primero guarda el MP3.`); process.exit(1); }
    data.manifest[r.file] = { h: r.h, chars: r.chars, at: new Date().toISOString().slice(0, 10) };
  }
  writeManifest(data.manifest);
  console.log(`${list.length} audio(s) marcados como al día.`);
}

// ---- CLI ----
const args = process.argv.slice(2);
const cmd = args[0] && !args[0].startsWith('--') ? args.shift() : 'status';
const flags = new Set(args.filter(a => a.startsWith('--')));
const mi = args.indexOf('--model');
const opts = { yes: flags.has('--yes'), dryRun: flags.has('--dry-run'), model: mi >= 0 ? args[mi + 1] : null };
const files = args.filter((a, i) => !a.startsWith('--') && !(mi >= 0 && i === mi + 1));
const data = load();
if (cmd === 'status') { const r = status(data); process.exitCode = r.todo.length || r.problems ? 1 : 0; }
else if (cmd === 'generate') await generate(data, files, opts);
else if (cmd === 'accept') accept(data, files, flags.has('--all'));
else { console.error(`Comando desconocido: ${cmd}. Usa status, generate o accept.`); process.exit(1); }
