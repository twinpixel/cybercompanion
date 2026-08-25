/**
 * Genera dist/worker.js, il bundle deployabile su Cloudflare.
 * Usage: node server/build.js   (o: npm run build:worker)
 *
 * Fa tre cose:
 *   1. inietta i dati di gioco "piccoli" nel template del Worker — gli servono
 *      per la generazione automatica, che gira lato server;
 *   2. copia tutti i dati in client/data/, cosi' la SPA li carica come asset
 *      statici (gratis e illimitati su Cloudflare) invece di chiederli all'API;
 *   3. copia server/llm/ accanto al bundle: wrangler passa tutto a esbuild, che
 *      segue gli import e li impacchetta;
 *   4. calcola la CACHE_VERSION del service worker dall'hash dei file client,
 *      cosi' cambia da sola quando cambia la shell e nessun client resta
 *      bloccato su una versione vecchia.
 */
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // .../server
const ROOT = path.resolve(__dirname, '..');

const DATA_DIR = path.join(__dirname, 'data');
const LLM_DIR = path.join(__dirname, 'llm');
const TEMPLATE_PATH = path.join(__dirname, 'worker.template.js');
const OUTPUT_DIR = path.join(ROOT, 'dist');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'worker.js');

const CLIENT_DIR = path.join(ROOT, 'client');
const CLIENT_DATA_DIR = path.join(CLIENT_DIR, 'data');
const SW_PATH = path.join(CLIENT_DIR, 'sw.js');

// Dati che il Worker deve avere in pancia: li usa la generazione automatica.
// weapons.json e chromebook.json restano fuori (280 KB) perche' servono solo al
// client, che li carica come asset statici.
const EMBED = ['stats', 'roles', 'skills', 'lifepath', 'cyberware', 'gear'];

// File il cui contenuto determina la versione della cache del service worker.
const SW_HASH_FILES = ['index.html', 'app.js', 'styles.css', 'manifest.webmanifest'];

async function leggiDati() {
  const entries = await fs.readdir(DATA_DIR, { withFileTypes: true });
  const dati = {};
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json')) continue;
    const nome = entry.name.replace(/\.json$/, '');
    const raw = await fs.readFile(path.join(DATA_DIR, entry.name), 'utf-8');
    try {
      dati[nome] = JSON.parse(raw);
    } catch (err) {
      throw new Error(`server/data/${entry.name} non e' JSON valido: ${err.message}`);
    }
  }
  return dati;
}

// Le chiavi che iniziano con "_" sono note per chi legge il file a mano: nel
// bundle sono peso morto.
function senzaCommenti(valore) {
  if (Array.isArray(valore)) return valore.map(senzaCommenti);
  if (valore && typeof valore === 'object') {
    return Object.fromEntries(
      Object.entries(valore)
        .filter(([k]) => !k.startsWith('_'))
        .map(([k, v]) => [k, senzaCommenti(v)])
    );
  }
  return valore;
}

async function copiaDatiNelClient(dati) {
  await fs.rm(CLIENT_DATA_DIR, { recursive: true, force: true });
  await fs.mkdir(CLIENT_DATA_DIR, { recursive: true });
  for (const [nome, contenuto] of Object.entries(dati)) {
    await fs.writeFile(
      path.join(CLIENT_DATA_DIR, `${nome}.json`),
      JSON.stringify(senzaCommenti(contenuto)),
      'utf-8'
    );
  }
  return Object.keys(dati).length;
}

async function timbraServiceWorker() {
  const hash = crypto.createHash('sha256');
  for (const nome of SW_HASH_FILES) {
    try {
      hash.update(await fs.readFile(path.join(CLIENT_DIR, nome)));
    } catch {
      // File opzionale assente: lo ignoriamo nel calcolo.
    }
  }
  const versione = `v-${hash.digest('hex').slice(0, 10)}`;

  const sw = await fs.readFile(SW_PATH, 'utf-8');
  const re = /const CACHE_VERSION = '[^']*';/;
  if (!re.test(sw)) {
    throw new Error("Riga `const CACHE_VERSION = '...';` non trovata in client/sw.js");
  }
  const aggiornato = sw.replace(re, `const CACHE_VERSION = '${versione}';`);
  if (aggiornato !== sw) await fs.writeFile(SW_PATH, aggiornato, 'utf-8');
  return versione;
}

async function main() {
  const [template, dati] = await Promise.all([
    fs.readFile(TEMPLATE_PATH, 'utf-8'),
    leggiDati(),
  ]);

  const mancanti = EMBED.filter((k) => !dati[k]);
  if (mancanti.length) {
    throw new Error(`Dati richiesti assenti in server/data/: ${mancanti.join(', ')}`);
  }

  const daIniettare = Object.fromEntries(EMBED.map((k) => [k, senzaCommenti(dati[k])]));
  const blocco = `const GAME_DATA = ${JSON.stringify(daIniettare)};\n`;

  if (!template.includes('/* __EMBED_DATA__ */')) {
    throw new Error('Placeholder /* __EMBED_DATA__ */ non trovato in server/worker.template.js');
  }

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_PATH, template.replace('/* __EMBED_DATA__ */', blocco), 'utf-8');

  // I moduli LLM restano file separati e vengono importati dal worker: e'
  // wrangler, con esbuild, a impacchettarli seguendo gli import.
  await fs.cp(LLM_DIR, path.join(OUTPUT_DIR, 'llm'), { recursive: true });

  const nFile = await copiaDatiNelClient(dati);
  const versioneSw = await timbraServiceWorker();

  const stat = await fs.stat(OUTPUT_PATH);
  console.log(`Scritto ${path.relative(ROOT, OUTPUT_PATH)} (${(stat.size / 1024).toFixed(1)} KB)`);
  const nLlm = (await fs.readdir(LLM_DIR)).filter((f) => f.endsWith('.js')).length;
  console.log(`Dati nel worker: ${EMBED.join(', ')}`);
  console.log(`Moduli LLM copiati in dist/llm/: ${nLlm}`);
  console.log(`Dati statici in client/data/: ${nFile} file`);
  console.log(`Service worker CACHE_VERSION: ${versioneSw}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
