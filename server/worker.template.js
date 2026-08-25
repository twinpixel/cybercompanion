/**
 * CyberCompanion API — Cloudflare Worker
 *
 * Espone l'API sotto /api/*; tutto il resto e' servito come asset statico dal
 * binding ASSETS (vedi [assets] in wrangler.toml). Rigenera con:
 *   npm run build:worker
 *
 * Bindings richiesti:
 *   DB                      D1, tabella `characters` (vedi migrations/)
 *   AI                      Workers AI, ultimo anello della catena LLM
 *   ASSETS                  frontend statico
 *   GENERATE_RATE_LIMITER   rate limit su /api/generate
 *   LOGIN_RATE_LIMITER      rate limit su /api/login
 *
 * Secret:
 *   APP_PASSWORD            password unica condivisa
 *   SESSION_SECRET          chiave HMAC dei token di sessione
 *   GROQ_API_KEY            chiavi dei provider LLM, tutte facoltative: senza
 *   GEMINI_API_KEY          nessuna la generazione automatica funziona lo
 *   OPENROUTER_API_KEY      stesso, con Workers AI in coda alla catena
 *   CEREBRAS_API_KEY
 *   MISTRAL_API_KEY
 *
 * Variabili:
 *   LLM_PROVIDERS           ordine della catena, separato da virgole
 *   <PROVIDER>_MODEL        modello per provider (vedi server/llm/catalog.js)
 *   SESSION_TTL_HOURS, ALLOWED_ORIGINS
 *
 * La catena LLM sta in server/llm/, con la struttura del repository poltrobot.
 */

import { creaLLM } from './llm/index.js';

/* __EMBED_DATA__ */

const SCHEMA_VERSIONE = 1;
const SESSION_TTL_ORE_DEFAULT = 720;      // 30 giorni
const MAX_SCHEDA_BYTE = 256 * 1024;       // tetto al corpo di una scheda
const MAX_PERSONAGGI = 200;               // "sono solo pochi personaggi"
// ---------------------------------------------------------------- risposte --

function json(dati, status = 200, headerExtra = {}) {
  // Access-Control-Allow-Origin viene aggiunto a valle da gestisciRichiesta().
  return new Response(JSON.stringify(dati), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headerExtra },
  });
}

function errore(messaggio, status = 400) {
  return json({ error: messaggio }, status);
}

// Le richieste del frontend sono same-origin e non passano dal CORS. La
// allow-list serve a non regalare l'endpoint di generazione a siti terzi.
function originConsentita(request, env, url) {
  const origin = request.headers.get('Origin');
  if (!origin || origin === url.origin) return url.origin;

  const configurate = (env?.ALLOWED_ORIGINS || '').split(',').map((o) => o.trim()).filter(Boolean);
  if (configurate.includes(origin)) return origin;

  try {
    const host = new URL(origin).hostname;
    if (host.endsWith('.workers.dev')) return origin;
    if (host === 'localhost' || host === '127.0.0.1') return origin;
  } catch { /* origin malformato: negato */ }
  return null;
}

function preflight(origin) {
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return new Response(null, { status: 204, headers });
}

async function limitaRichieste(limiter, request) {
  if (!limiter?.limit) return true;
  const ip = request.headers.get('CF-Connecting-IP') || 'anonimo';
  const { success } = await limiter.limit({ key: ip });
  return success;
}

// ------------------------------------------------------------ sessione/auth --

const enc = new TextEncoder();

function b64url(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function daB64url(testo) {
  const s = testo.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(s + '='.repeat((4 - (s.length % 4)) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

async function hmac(segreto, messaggio) {
  const chiave = await crypto.subtle.importKey(
    'raw', enc.encode(segreto), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  return new Uint8Array(await crypto.subtle.sign('HMAC', chiave, enc.encode(messaggio)));
}

// Confronto a tempo costante: confrontare due HMAC invece delle stringhe grezze
// evita di far trapelare la password un carattere alla volta dai tempi.
async function ugualiInTempoCostante(a, b, segreto) {
  const [ha, hb] = await Promise.all([hmac(segreto, a), hmac(segreto, b)]);
  let diff = ha.length ^ hb.length;
  for (let i = 0; i < ha.length; i++) diff |= ha[i] ^ hb[i];
  return diff === 0;
}

async function creaToken(env) {
  const ore = Number(env.SESSION_TTL_HOURS) || SESSION_TTL_ORE_DEFAULT;
  const payload = b64url(enc.encode(JSON.stringify({ exp: Date.now() + ore * 3600_000 })));
  const firma = b64url(await hmac(env.SESSION_SECRET, payload));
  return { token: `${payload}.${firma}`, scade: Date.now() + ore * 3600_000 };
}

async function tokenValido(env, token) {
  if (!token || !env.SESSION_SECRET) return false;
  const [payload, firma] = token.split('.');
  if (!payload || !firma) return false;

  const attesa = b64url(await hmac(env.SESSION_SECRET, payload));
  if (!(await ugualiInTempoCostante(firma, attesa, env.SESSION_SECRET))) return false;

  try {
    const { exp } = JSON.parse(new TextDecoder().decode(daB64url(payload)));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

function tokenDallaRichiesta(request) {
  const h = request.headers.get('Authorization') || '';
  return h.startsWith('Bearer ') ? h.slice(7).trim() : '';
}

// --------------------------------------------------------------- schede D1 --

// Il corpo della scheda vive in `data` come JSON; name/handle/role sono
// duplicati in colonne dedicate perche' la lista non deserializzi tutto.
function estraiIndice(scheda) {
  const a = scheda?.anagrafica || {};
  const classe = GAME_DATA.roles.classi.find((c) => c.id === scheda?.classe);
  return {
    name: (a.nome || 'Senza nome').toString().slice(0, 120),
    handle: (a.soprannome || '').toString().slice(0, 120),
    role: classe ? classe.nome : '',
  };
}

async function listaPersonaggi(env) {
  const { results } = await env.DB.prepare(
    'SELECT id, name, handle, role, created_at, updated_at FROM characters ORDER BY updated_at DESC'
  ).all();
  return results || [];
}

async function leggiPersonaggio(env, id) {
  const riga = await env.DB.prepare(
    'SELECT id, name, handle, role, data, created_at, updated_at FROM characters WHERE id = ?'
  ).bind(id).first();
  if (!riga) return null;
  return { ...riga, data: JSON.parse(riga.data) };
}

async function creaPersonaggio(env, scheda) {
  const { count } = await env.DB.prepare('SELECT COUNT(*) AS count FROM characters').first();
  if (count >= MAX_PERSONAGGI) {
    throw Object.assign(new Error(`Limite di ${MAX_PERSONAGGI} personaggi raggiunto`), { status: 409 });
  }
  const id = crypto.randomUUID();
  const ora = Date.now();
  const { name, handle, role } = estraiIndice(scheda);
  await env.DB.prepare(
    'INSERT INTO characters (id, name, handle, role, data, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, name, handle, role, JSON.stringify(scheda), ora, ora).run();
  return { id, name, handle, role, created_at: ora, updated_at: ora };
}

async function aggiornaPersonaggio(env, id, scheda) {
  const ora = Date.now();
  const { name, handle, role } = estraiIndice(scheda);
  const res = await env.DB.prepare(
    'UPDATE characters SET name = ?, handle = ?, role = ?, data = ?, updated_at = ? WHERE id = ?'
  ).bind(name, handle, role, JSON.stringify(scheda), ora, id).run();
  return res.meta.changes > 0 ? { id, name, handle, role, updated_at: ora } : null;
}

async function cancellaPersonaggio(env, id) {
  const res = await env.DB.prepare('DELETE FROM characters WHERE id = ?').bind(id).run();
  return res.meta.changes > 0;
}

// -------------------------------------------------------------------- dadi --

function d(facce) {
  // crypto.getRandomValues invece di Math.random: la generazione automatica e'
  // il cuore dell'app, non vogliamo schede tutte uguali per PRNG debole.
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] % facce) + 1;
}

const d10 = () => d(10);
const d6 = () => d(6);

function pescaDa(array) {
  return array[d(array.length) - 1];
}

// Tira `quanti` dadi da `facce` e somma, con modificatore opzionale.
function tira(quanti, facce, mod = 0) {
  let tot = mod;
  for (let i = 0; i < quanti; i++) tot += d(facce);
  return tot;
}

// Interpreta le notazioni dei Punti Umanita' del manuale: "2D6", "1D6/2".
function tiraPU(notazione) {
  const m = /^(\d+)D(\d+)(?:\/(\d+))?$/i.exec((notazione || '').trim());
  if (!m) return 0;
  const somma = tira(Number(m[1]), Number(m[2]));
  return m[3] ? Math.max(1, Math.floor(somma / Number(m[3]))) : somma;
}

function mescola(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = d(i + 1) - 1;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// -------------------------------------------------- generazione automatica --

// Quali caratteristiche contano per ogni classe. La distribuzione dei punti le
// favorisce, cosi' un Netrunner generato a caso non esce con INT 3.
const PRIORITA_CLASSE = {
  solitario:   ['RIF', 'COS', 'FRE'],
  poliziotto:  ['RIF', 'FRE', 'COS'],
  nomade:      ['RIF', 'COS', 'TEC'],
  netrunner:   ['INT', 'TEC', 'RIF'],
  tecnico:     ['TEC', 'INT', 'RIF'],
  tecnomedico: ['TEC', 'INT', 'EMP'],
  reporter:    ['INT', 'EMP', 'FAS'],
  corporativo: ['INT', 'FRE', 'FAS'],
  ricettatore: ['FRE', 'INT', 'EMP'],
  rocker:      ['FAS', 'EMP', 'FRE'],
};

const CHIAVI_STAT = ['INT', 'RIF', 'TEC', 'FRE', 'FAS', 'FOR', 'MOV', 'COS', 'EMP'];

/**
 * Distribuisce `totale` punti sulle 9 caratteristiche rispettando il vincolo
 * 2-10. Le caratteristiche prioritarie della classe entrano nell'urna piu'
 * volte, quindi tendono a crescere prima delle altre.
 */
function generaCaratteristiche(classeId, totale) {
  const min = GAME_DATA.stats.generazione.min;
  const max = GAME_DATA.stats.generazione.max;
  const stat = Object.fromEntries(CHIAVI_STAT.map((k) => [k, min]));

  let restanti = totale - min * CHIAVI_STAT.length;
  const priorita = PRIORITA_CLASSE[classeId] || [];

  // Urna pesata: le prioritarie compaiono 4 volte, le altre 1.
  const urna = CHIAVI_STAT.flatMap((k) => Array(priorita.includes(k) ? 4 : 1).fill(k));

  let giriAVuoto = 0;
  while (restanti > 0 && giriAVuoto < 500) {
    const k = pescaDa(urna);
    if (stat[k] >= max) { giriAVuoto++; continue; }
    stat[k]++;
    restanti--;
    giriAVuoto = 0;
  }
  // Se le prioritarie sono sature i punti avanzati vanno dove c'e' spazio.
  for (const k of mescola(CHIAVI_STAT)) {
    while (restanti > 0 && stat[k] < max) { stat[k]++; restanti--; }
  }
  return stat;
}

function derivate(stat) {
  const fascia = GAME_DATA.stats.bonus_costituzione.find((f) => stat.COS >= f.min && stat.COS <= f.max)
    || GAME_DATA.stats.bonus_costituzione[GAME_DATA.stats.bonus_costituzione.length - 1];
  const corsa = stat.MOV * 3;
  return {
    corsa,
    salto: Math.floor(corsa / 4),
    sollevabile: stat.COS * 40,
    trasporto: stat.COS * 10,
    salvezza: stat.COS,
    bonusResistenza: fascia.resistenza,
    bonusDanno: fascia.danno,
    tipoCorporatura: fascia.tipo,
  };
}

// Indice piatto nome-abilita' -> { stat, x2 }, comodo per i costi.
function indiceAbilita() {
  const idx = new Map();
  for (const g of GAME_DATA.skills.gruppi) {
    for (const s of g.skills) idx.set(s.nome, { stat: g.stat, x2: !!s.x2 });
  }
  return idx;
}

// Abilita' che quasi chiunque cresciuto a Night City ha raccolto per strada:
// entrano nel sorteggio delle abilita' libere con peso maggiore, cosi' i
// personaggi generati non escono con Geologia 3 e Individuare 0.
const ABILITA_COMUNI = [
  'Individuare', "Conosc. della strada", 'Atletica', 'Lottare',
  'Guidare autoveicoli', 'Pronto soccorso', 'Istruzione - Conoscenze',
  'Schivare - Divincolarsi', "Furtivita'", 'Percepire emozioni', 'Pistole',
];

/**
 * Costruisce l'urna da cui si pescano le abilita' libere. Le comuni pesano 4,
 * quelle legate alle caratteristiche forti della classe pesano 2, tutte le
 * altre 1: restano possibili, ma smettono di essere equiprobabili.
 */
function urnaAbilitaLibere(classeId, idx, giaPrese) {
  const priorita = PRIORITA_CLASSE[classeId] || [];
  const urna = [];
  for (const [nome, info] of idx) {
    if (info.stat === 'SPECIALE' || giaPrese.includes(nome)) continue;
    // Le abilita' Difficili non si imparano per caso: entrano solo se legate a
    // una caratteristica forte della classe. Senza questo filtro escono Rocker
    // con Utilizzare serbatoi criogenici 2.
    if (info.x2 && !priorita.includes(info.stat)) continue;
    let peso = 1;
    if (priorita.includes(info.stat)) peso = 2;
    if (ABILITA_COMUNI.includes(nome)) peso = 4;
    for (let i = 0; i < peso; i++) urna.push(nome);
  }
  return urna;
}

/**
 * Spende i punti abilita' secondo il manuale: INT+RIF sulle abilita' di classe,
 * altrettanti su abilita' libere. Le abilita' Difficili costano il doppio per
 * livello.
 *
 * I punti di classe si distribuiscono a giri successivi invece che a caso: al
 * primo giro tutte le abilita' della classe salgono di un livello, poi solo
 * alcune. Cosi' un Solitario ha sempre Pistole, invece di avere per sorteggio
 * Riparare armi 5 e nient'altro.
 */
function generaAbilita(classe, stat) {
  const idx = indiceAbilita();
  const abilita = {};
  const MAX_LIVELLO = 10;

  const costoDi = (nome) => (idx.get(nome)?.x2 ? 2 : 1);

  const compra = (nome, livelli) => {
    if (!idx.has(nome)) return 0;
    const attuale = abilita[nome] || 0;
    const effettivi = Math.min(livelli, MAX_LIVELLO - attuale);
    if (effettivi <= 0) return 0;
    abilita[nome] = attuale + effettivi;
    return effettivi * costoDi(nome);
  };

  // Le abilita' di classe del Tecnico includono tre abilita' TEC a scelta.
  const abilitaClasse = [...classe.abilita];
  const scelteLibere = [];
  if (classe.scelte_libere) {
    const gruppo = GAME_DATA.skills.gruppi.find((g) => g.stat === classe.scelte_libere.da_gruppo);
    const disponibili = gruppo.skills.map((s) => s.nome).filter((n) => !abilitaClasse.includes(n));
    for (const nome of mescola(disponibili).slice(0, classe.scelte_libere.quante)) {
      abilitaClasse.push(nome);
      scelteLibere.push(nome);
    }
  }

  // --- punti di classe ---
  // Il manuale da' INT+RIF punti: pochi. Spalmarli su tutte e dieci le abilita'
  // produce un personaggio incapace di fare il proprio mestiere, quindi si
  // concentrano come fa un giocatore vero — speciale e abilita' chiave prima,
  // il resto a raccogliere gli avanzi.
  let budget = stat.INT + stat.RIF;

  const livelliSpeciale = Math.max(3, Math.min(5, Math.floor(budget / 3 / costoDi(classe.speciale))));
  budget -= compra(classe.speciale, livelliSpeciale);

  const chiave = (classe.abilita_chiave || []).filter((n) => abilitaClasse.includes(n));
  for (const nome of mescola(chiave)) {
    if (budget <= 0) break;
    const costo = costoDi(nome);
    // Ogni abilita' chiave si prende circa una quota equa di cio' che resta.
    const quota = Math.max(1, Math.floor(budget / (chiave.length * costo)));
    budget -= compra(nome, Math.min(5, quota + d(2) - 1));
  }

  // Cio' che avanza copre le altre abilita' di classe, un livello per giro.
  const altre = abilitaClasse.filter((n) => n !== classe.speciale && !chiave.includes(n));
  for (let giro = 0; giro < 3 && budget > 0; giro++) {
    let speso = false;
    for (const nome of mescola(altre)) {
      const costo = costoDi(nome);
      if (budget < costo) continue;
      if (giro >= 1 && d10() > 5) continue;
      budget -= compra(nome, 1);
      speso = true;
    }
    if (!speso) break;
  }

  // --- punti liberi ---
  let liberi = stat.INT + stat.RIF;
  liberi -= compra('Lingue', 2);   // tutti parlano almeno la lingua di famiglia

  const urna = urnaAbilitaLibere(classe.id, idx, abilitaClasse);
  let tentativi = 0;
  while (liberi > 0 && tentativi < 300) {
    tentativi++;
    const nome = pescaDa(urna);
    const costo = costoDi(nome);
    if (liberi < costo) continue;
    // Le libere restano basse: sono cio' che si e' imparato di straforo.
    if ((abilita[nome] || 0) >= 4) continue;
    liberi -= compra(nome, 1);
  }

  return { abilita, scelteLibere };
}

/** Tira il Lifepath: stile, origini, famiglia, infanzia, motivazioni, eventi. */
function generaLifepath(eta) {
  const L = GAME_DATA.lifepath;
  const scegli = (arr) => arr[d10() - 1];

  const origine = scegli(L.origini.etnie);
  const tiroGenitori = d10();
  const tragedia = tiroGenitori >= L.famiglia.soglia_tragedia ? scegli(L.famiglia.tragedia) : null;

  // Fratelli: un 10 significa figlio unico.
  const tiroFratelli = d10();
  const nFratelli = tiroFratelli === 10 ? 0 : Math.ceil(tiroFratelli / 2);
  const fratelli = Array.from({ length: nFratelli }, () => ({
    chi: scegli(L.fratelli.eta),
    rapporto: scegli(L.fratelli.rapporto),
  }));

  // Un tiro per ogni anno dai 16 all'eta' attuale.
  const anni = Math.max(0, Math.min(30, (eta || 21) - 16));
  const eventi = [];
  for (let i = 0; i < anni; i++) {
    const voce = scegli(L.eventi.annuale);
    const evento = { anno: 16 + i, tipo: voce.tipo, testo: voce.testo };
    if (voce.tabella) {
      const dettaglio = scegli(L.eventi[voce.tabella]);
      evento.dettaglio = typeof dettaglio === 'string'
        ? dettaglio
        : `${dettaglio.chi} — ${dettaglio.motivo || dettaglio.legame}`;
    }
    eventi.push(evento);
  }

  return {
    stile: {
      abbigliamento: scegli(L.stile.abbigliamento),
      capelli: scegli(L.stile.capelli),
      dettagli: scegli(L.stile.dettagli),
    },
    origini: { etnia: origine.etnia, lingua: origine.lingua },
    famiglia: {
      rango: scegli(L.famiglia.rango),
      status: scegli(L.famiglia.status),
      genitoriVivi: !tragedia,
      tragedia,
    },
    infanzia: scegli(L.infanzia.ambiente),
    fratelli,
    motivazioni: {
      personalita: scegli(L.motivazioni.personalita),
      personaPiuCara: scegli(L.motivazioni.persona_piu_cara),
      cosaContaDiPiu: scegli(L.motivazioni.cosa_conta_di_piu),
      comeVediGliAltri: scegli(L.motivazioni.come_vedi_gli_altri),
      oggettoPiuPrezioso: scegli(L.motivazioni.oggetto_piu_prezioso),
    },
    eventi,
  };
}

/**
 * Installa cyberware finche' il budget e l'Umanita' reggono. Rispetta i
 * prerequisiti: niente prese d'interfaccia senza processore neurale.
 */
function generaCyberware(classeId, budget, umanitaIniziale) {
  const tutti = GAME_DATA.cyberware.categorie.flatMap((c) =>
    c.pezzi.map((p) => ({ ...p, categoria: c.nome }))
  );
  const perNome = new Map(tutti.map((p) => [p.nome, p]));

  // Ogni classe compra prima cio' che le serve per lavorare.
  const desiderata = {
    netrunner:   ['Processore neurale', 'Prese d\'interfaccia', 'Alloggio per chip', 'Cyberottica (occhio)'],
    solitario:   ['Processore neurale', 'Cyberottica (occhio)', 'Opzione: mirino', 'Kerenzikov', 'Pelle intrecciata'],
    poliziotto:  ['Processore neurale', 'Cyberottica (occhio)', 'Opzione: visore notturno', 'Pelle intrecciata'],
    tecnico:     ['Processore neurale', 'Prese d\'interfaccia', 'Cyberbraccio', 'Opzione: mano attrezzo'],
    tecnomedico: ['Processore neurale', 'Cyberottica (occhio)', 'Opzione: teleobiettivo', 'Anticorpi potenziati'],
    nomade:      ['Cyberudito (orecchio)', 'Opzione: radio', 'Filtri nasali'],
    reporter:    ['Cyberottica (occhio)', 'Opzione: microvideo', 'Cyberudito (orecchio)', 'Opzione: radio'],
    corporativo: ['Orologio dermale', 'Cyberudito (orecchio)', 'Opzione: innesto telefonico'],
    ricettatore: ['Cyberudito (orecchio)', 'Opzione: rilevatore di cimici', 'Cyberottica (occhio)'],
    rocker:      ['Tatuaggio luminoso', 'Capelli tecnologici', 'Cyberudito (orecchio)'],
  };

  const installati = [];
  let denaro = budget;
  let umanita = umanitaIniziale;
  const nomiInstallati = new Set();

  const prova = (pezzo) => {
    if (!pezzo || nomiInstallati.has(pezzo.nome)) return false;
    if (pezzo.costo > denaro) return false;
    // Non si scende sotto 20 punti di Umanita' in creazione: sotto quella
    // soglia il manuale impone una terapia, non un personaggio giocante.
    const pu = tiraPU(pezzo.pu);
    if (umanita - pu < 20) return false;
    if (pezzo.richiede && !nomiInstallati.has(pezzo.richiede)) {
      if (!prova(perNome.get(pezzo.richiede))) return false;
    }
    denaro -= pezzo.costo;
    umanita -= pu;
    nomiInstallati.add(pezzo.nome);
    installati.push({ nome: pezzo.nome, categoria: pezzo.categoria, pu, costo: pezzo.costo, desc: pezzo.desc });
    return true;
  };

  for (const nome of desiderata[classeId] || []) prova(perNome.get(nome));

  // Con quel che avanza, un pezzo a caso ogni tanto.
  for (const pezzo of mescola(tutti).slice(0, 4)) {
    if (denaro < 500) break;
    prova(pezzo);
  }

  return { installati, denaroResiduo: denaro, umanita };
}

/**
 * Assegna armi, armatura ed equipaggiamento compatibili col portafoglio.
 * Tiene sempre da parte una riserva di contanti: un personaggio che parte con
 * 35 eb in tasca non puo' nemmeno pagarsi una notte al coperto.
 */
function generaEquipaggiamento(classeId, denaro) {
  const RISERVA = 250;
  let residuo = denaro;
  const spendibile = () => Math.max(0, residuo - RISERVA);

  const armi = [];
  for (const arma of (GAME_DATA.gear.armi_iniziali[classeId] || []).slice(0, 1 + d(2))) {
    const costo = Number(String(arma.costo_eb).replace(/[^\d]/g, '')) || 0;
    if (costo > spendibile()) continue;
    residuo -= costo;
    armi.push({ ...arma, inUso: armi.length === 0 });
  }

  // L'armatura si sceglie per parte del corpo, non per VP assoluto: senza
  // questo vincolo tutti finirebbero con un elmetto di nylon (VP 20) e il
  // tronco scoperto, perche' e' il pezzo col numero piu' alto che costa poco.
  const armature = [];
  const migliorePer = (filtro) => GAME_DATA.gear.armature
    .filter((a) => filtro(a) && a.costo <= spendibile())
    .sort((a, b) => b.vp - a.vp)[0];

  const tronco = migliorePer((a) => /Tronco|Tutto il corpo/.test(a.copre));
  if (tronco) { residuo -= tronco.costo; armature.push(tronco); }

  const testa = migliorePer((a) => a.copre === 'Testa');
  if (testa) { residuo -= testa.costo; armature.push(testa); }

  const equipaggiamento = [];
  for (const oggetto of mescola(GAME_DATA.gear.equipaggiamento)) {
    if (equipaggiamento.length >= 5) break;
    if (oggetto.costo > spendibile()) continue;
    residuo -= oggetto.costo;
    equipaggiamento.push({ nome: oggetto.nome, quantita: 1, note: oggetto.nota || oggetto.categoria });
  }

  return { armi, armature, equipaggiamento, residuo };
}

// ------------------------------------------------------------- prompt LLM --

const SISTEMA_NARRATIVA = `Sei un game master di Cyberpunk 2020 che rifinisce schede personaggio.
Ricevi i dati gia' tirati sui dadi e devi solo dare loro un volto e una voce.

Regole ferree:
- Rispondi SOLO con un oggetto JSON valido, senza testo attorno.
- Scrivi in italiano.
- Non inventare numeri: caratteristiche, abilita', equipaggiamento e cyberware sono gia' decisi e non vanno toccati.
- Il tono e' quello del genere: Night City, 2020, corporazioni onnipotenti, tecnologia sporca, nessun eroe.
- Niente riferimenti al videogioco Cyberpunk 2077 e ai suoi personaggi.

Formato della risposta:
{
  "nome": "nome e cognome",
  "soprannome": "lo handle di strada, una o due parole",
  "natoA": "citta' di nascita",
  "nazionalita": "nazionalita'",
  "altezza": 175,
  "peso": 70,
  "occhi": "colore degli occhi",
  "segniParticolari": "una riga",
  "carattere": "due o tre righe che spieghino come si comporta",
  "background": "tre o quattro frasi di storia personale, coerenti con gli eventi elencati",
  "obiettivo": "cosa vuole ottenere adesso, una frase"
}`;

function promptNarrativa(classe, stat, lifepath, eta, cyberware, richiesta) {
  const righeEventi = lifepath.eventi.length
    ? lifepath.eventi.map((e) => `  ${e.anno} anni: ${e.testo}${e.dettaglio ? ` — ${e.dettaglio}` : ''}`).join('\n')
    : '  nessun evento degno di nota';

  return `Classe: ${classe.nome} — ${classe.sottotitolo}
Eta': ${eta}
Caratteristiche: ${CHIAVI_STAT.map((k) => `${k} ${stat[k]}`).join(', ')}

Origini: ${lifepath.origini.etnia}, parla ${lifepath.origini.lingua}
Famiglia: ${lifepath.famiglia.rango}. ${lifepath.famiglia.status}.${lifepath.famiglia.tragedia ? ` ${lifepath.famiglia.tragedia}.` : ''}
Infanzia: ${lifepath.infanzia}
Fratelli: ${lifepath.fratelli.length ? lifepath.fratelli.map((f) => `${f.chi} (${f.rapporto})`).join('; ') : 'figlio unico'}

Aspetto gia' tirato (rispettalo):
  Abbigliamento: ${lifepath.stile.abbigliamento}
  Capelli: ${lifepath.stile.capelli}
  Dettagli: ${lifepath.stile.dettagli}

Personalita': ${lifepath.motivazioni.personalita}
Tiene di piu' a: ${lifepath.motivazioni.personaPiuCara}
Cio' che conta: ${lifepath.motivazioni.cosaContaDiPiu}
Vede gli altri cosi': ${lifepath.motivazioni.comeVediGliAltri}
Oggetto piu' prezioso: ${lifepath.motivazioni.oggettoPiuPrezioso}

Cyberware installato: ${cyberware.length ? cyberware.map((c) => c.nome).join(', ') : 'nessuno, e ancora tutto carne'}

Eventi dai 16 anni:
${righeEventi}
${richiesta ? `\nRichiesta specifica del giocatore, da rispettare: ${richiesta}` : ''}`;
}

// ------------------------------------------------- scheda completa --------

// Denaro iniziale: il manuale lo lega alla classe e al suo tenore di vita.
const DENARO_INIZIALE = {
  corporativo: 6000, netrunner: 4000, tecnomedico: 4000, solitario: 3500,
  tecnico: 3000, poliziotto: 2500, reporter: 2500, ricettatore: 2500,
  nomade: 2000, rocker: 1500,
};

function schedaVuota() {
  return {
    versione: SCHEMA_VERSIONE,
    anagrafica: {
      nome: '', soprannome: '', giocatore: '', natoA: '', eta: 21,
      nazionalita: '', altezza: null, peso: null, lingue: [],
      abbigliamento: '', capelli: '', occhi: '', segniParticolari: '',
      carattere: '', note: '',
    },
    classe: '',
    caratteristiche: Object.fromEntries(CHIAVI_STAT.map((k) => [k, 5])),
    abilita: {},
    abilitaClasseScelte: [],
    cyberware: [],
    armi: [],
    armature: [],
    equipaggiamento: [],
    veicoli: [],
    denaro: { contanti: 0, banca: 0 },
    umanita: { attuale: 50, iniziale: 50 },
    ferite: { caselle: 0 },
    reputazione: 0,
    puntiIncremento: 0,
    background: { origini: null, famiglia: null, infanzia: '', motivazioni: null, testo: '', obiettivo: '' },
    eventi: [],
  };
}

/**
 * Genera una scheda completa. Tutta la parte numerica esce dalle tabelle del
 * regolamento; l'LLM aggiunge solo nome, aspetto e background — e se non e'
 * disponibile la scheda resta comunque giocabile.
 */
async function generaPersonaggio(env, opzioni = {}) {
  const classe = GAME_DATA.roles.classi.find((c) => c.id === opzioni.classe)
    || pescaDa(GAME_DATA.roles.classi);

  const puntiValidi = GAME_DATA.stats.generazione.punti.map((p) => p.totale);
  const punti = puntiValidi.includes(Number(opzioni.punti))
    ? Number(opzioni.punti)
    : GAME_DATA.stats.generazione.punti_default;

  const eta = Math.min(60, Math.max(16, Number(opzioni.eta) || 17 + d(12)));

  const stat = generaCaratteristiche(classe.id, punti);
  const { abilita, scelteLibere } = generaAbilita(classe, stat);
  const lifepath = generaLifepath(eta);

  const denaroPartenza = DENARO_INIZIALE[classe.id] || 2500;
  const umanitaIniziale = stat.EMP * 10;
  const cyber = generaCyberware(classe.id, Math.floor(denaroPartenza * 0.6), umanitaIniziale);
  const gear = generaEquipaggiamento(classe.id, cyber.denaroResiduo + Math.floor(denaroPartenza * 0.4));

  // L'Empatia scende con l'Umanita' persa: e' la regola che rende il cyberware
  // una scelta e non un elenco della spesa.
  stat.EMP = Math.max(1, Math.floor(cyber.umanita / 10));

  const scheda = schedaVuota();
  Object.assign(scheda, {
    classe: classe.id,
    caratteristiche: stat,
    abilita,
    abilitaClasseScelte: scelteLibere,
    cyberware: cyber.installati,
    armi: gear.armi,
    armature: gear.armature,
    equipaggiamento: gear.equipaggiamento,
    denaro: { contanti: gear.residuo, banca: 0 },
    umanita: { attuale: cyber.umanita, iniziale: umanitaIniziale },
    eventi: lifepath.eventi,
  });
  Object.assign(scheda.anagrafica, {
    eta,
    lingue: ['Inglese di strada', lifepath.origini.lingua].filter((v, i, a) => a.indexOf(v) === i),
    abbigliamento: `${lifepath.stile.abbigliamento}. ${lifepath.stile.dettagli}.`,
    capelli: lifepath.stile.capelli,
  });
  Object.assign(scheda.background, {
    origini: lifepath.origini,
    famiglia: lifepath.famiglia,
    infanzia: lifepath.infanzia,
    fratelli: lifepath.fratelli,
    motivazioni: lifepath.motivazioni,
  });

  const esito = await creaLLM(env).chatJson(
    SISTEMA_NARRATIVA,
    promptNarrativa(classe, stat, lifepath, eta, cyber.installati, opzioni.richiesta)
  );
  const narrativa = esito?.dati || null;

  if (narrativa) {
    const s = (v, max = 400) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    const n = (v, min, max) => {
      const x = Number(v);
      return Number.isFinite(x) ? Math.min(max, Math.max(min, Math.round(x))) : null;
    };
    Object.assign(scheda.anagrafica, {
      nome: s(narrativa.nome, 120) || 'Senza nome',
      soprannome: s(narrativa.soprannome, 60),
      natoA: s(narrativa.natoA, 120),
      nazionalita: s(narrativa.nazionalita, 80),
      altezza: n(narrativa.altezza, 120, 230),
      peso: n(narrativa.peso, 35, 200),
      occhi: s(narrativa.occhi, 60),
      segniParticolari: s(narrativa.segniParticolari, 300),
      carattere: s(narrativa.carattere, 600),
    });
    scheda.background.testo = s(narrativa.background, 1500);
    scheda.background.obiettivo = s(narrativa.obiettivo, 300);
    scheda.generatoConLLM = true;
    scheda.generatoDa = esito.provider;
  } else {
    // Nessun LLM raggiungibile: la scheda e' comunque completa e giocabile,
    // mancano solo i campi che nessuna tabella puo' tirare.
    scheda.anagrafica.nome = 'Senza nome';
    scheda.anagrafica.carattere = lifepath.motivazioni.personalita;
    scheda.background.testo = '';
    scheda.generatoConLLM = false;
    scheda.generatoDa = null;
  }

  return scheda;
}

// ------------------------------------------------------- validazione input --

function validaScheda(corpo) {
  if (!corpo || typeof corpo !== 'object') return 'Corpo della scheda mancante';
  if (typeof corpo.anagrafica !== 'object' || corpo.anagrafica === null) return 'Sezione anagrafica mancante';
  if (typeof corpo.caratteristiche !== 'object' || corpo.caratteristiche === null) return 'Sezione caratteristiche mancante';
  for (const k of CHIAVI_STAT) {
    const v = corpo.caratteristiche[k];
    if (!Number.isFinite(v) || v < 1 || v > 30) return `Caratteristica ${k} non valida`;
  }
  if (corpo.classe && !GAME_DATA.roles.classi.some((c) => c.id === corpo.classe)) {
    return `Classe sconosciuta: ${corpo.classe}`;
  }
  if (JSON.stringify(corpo).length > MAX_SCHEDA_BYTE) return 'Scheda troppo grande';
  return null;
}

async function corpoJson(request) {
  try {
    return { dati: await request.json() };
  } catch {
    return { errore: 'Body JSON non valido' };
  }
}

// ------------------------------------------------------------------ router --

async function gestisciRichiesta(request, env, ctx) {
  const inizio = Date.now();
  const url = new URL(request.url);
  const { pathname, searchParams } = url;
  const origin = originConsentita(request, env, url);

  if (request.method === 'OPTIONS') return preflight(origin);

  // Tutto cio' che non e' /api/* e' un asset statico: lo serve il binding
  // ASSETS. In pratica non ci arriva quasi mai, perche' wrangler.toml manda al
  // Worker solo /api/* (run_worker_first).
  if (!pathname.startsWith('/api/')) {
    return env.ASSETS ? env.ASSETS.fetch(request) : errore('Not found', 404);
  }

  let risposta;
  try {
    if (pathname === '/api/health' && request.method === 'GET') {
      const llm = creaLLM(env);
      const dettaglio = { ok: true, versioneSchema: SCHEMA_VERSIONE, db: !!env.DB };
      dettaglio.llm = { descrizione: llm.descrivi(), ...llm.stato() };
      // ?providers=1 interroga davvero ogni provider: utile per capire se una
      // chiave e' sbagliata, ma sono chiamate di rete, quindi non di default.
      if (searchParams.get('providers') === '1') dettaglio.llm.providers = await llm.salute();
      risposta = json(dettaglio);
    } else if (pathname === '/api/login' && request.method === 'POST') {
      if (!(await limitaRichieste(env.LOGIN_RATE_LIMITER, request))) {
        risposta = errore('Troppi tentativi, riprova tra un minuto', 429);
      } else if (!env.APP_PASSWORD || !env.SESSION_SECRET) {
        risposta = errore('Server non configurato: mancano APP_PASSWORD o SESSION_SECRET', 503);
      } else {
        const { dati, errore: err } = await corpoJson(request);
        if (err) {
          risposta = errore(err, 400);
        } else if (typeof dati?.password !== 'string') {
          risposta = errore('Password mancante', 400);
        } else if (!(await ugualiInTempoCostante(dati.password, env.APP_PASSWORD, env.SESSION_SECRET))) {
          risposta = errore('Password errata', 401);
        } else {
          risposta = json(await creaToken(env));
        }
      }
    } else {
      // Da qui in poi serve una sessione valida.
      if (!(await tokenValido(env, tokenDallaRichiesta(request)))) {
        risposta = errore('Non autenticato', 401);
      } else if (!env.DB) {
        risposta = errore('Database non configurato', 503);
      } else {
        risposta = await rotteProtette(request, env, url, pathname);
      }
    }
  } catch (err) {
    console.error(pathname, err);
    risposta = errore(err.message || 'Errore interno', err.status || 500);
  }

  if (risposta && !risposta.headers.get('Access-Control-Allow-Origin')) {
    const headers = new Headers(risposta.headers);
    if (origin) headers.set('Access-Control-Allow-Origin', origin);
    headers.append('Vary', 'Origin');
    risposta = new Response(risposta.body, { status: risposta.status, statusText: risposta.statusText, headers });
  }

  console.log(`${request.method} ${pathname} ${risposta.status} ${Date.now() - inizio}ms`);
  return risposta;
}

async function rotteProtette(request, env, url, pathname) {
  const idPersonaggio = pathname.match(/^\/api\/characters\/([0-9a-f-]{36})$/i)?.[1];

  if (pathname === '/api/characters' && request.method === 'GET') {
    return json({ personaggi: await listaPersonaggi(env) });
  }

  if (pathname === '/api/characters' && request.method === 'POST') {
    const { dati, errore: err } = await corpoJson(request);
    if (err) return errore(err, 400);
    const invalido = validaScheda(dati?.scheda);
    if (invalido) return errore(invalido, 400);
    return json(await creaPersonaggio(env, dati.scheda), 201);
  }

  if (idPersonaggio && request.method === 'GET') {
    const p = await leggiPersonaggio(env, idPersonaggio);
    return p ? json(p) : errore('Personaggio non trovato', 404);
  }

  if (idPersonaggio && request.method === 'PUT') {
    const { dati, errore: err } = await corpoJson(request);
    if (err) return errore(err, 400);
    const invalido = validaScheda(dati?.scheda);
    if (invalido) return errore(invalido, 400);
    const aggiornato = await aggiornaPersonaggio(env, idPersonaggio, dati.scheda);
    return aggiornato ? json(aggiornato) : errore('Personaggio non trovato', 404);
  }

  if (idPersonaggio && request.method === 'DELETE') {
    return (await cancellaPersonaggio(env, idPersonaggio))
      ? json({ eliminato: idPersonaggio })
      : errore('Personaggio non trovato', 404);
  }

  if (pathname === '/api/generate' && request.method === 'POST') {
    if (!(await limitaRichieste(env.GENERATE_RATE_LIMITER, request))) {
      return errore('Troppe generazioni, riprova tra un minuto', 429);
    }
    const { dati, errore: err } = await corpoJson(request);
    if (err) return errore(err, 400);
    const scheda = await generaPersonaggio(env, {
      classe: dati?.classe,
      punti: dati?.punti,
      eta: dati?.eta,
      richiesta: typeof dati?.richiesta === 'string' ? dati.richiesta.slice(0, 500) : '',
    });
    return json({ scheda });
  }

  return errore('Not found', 404);
}

export default {
  async fetch(request, env, ctx) {
    return gestisciRichiesta(request, env, ctx);
  },
};
