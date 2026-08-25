import { d10Aperto, d6, tiraNotazione } from '../lib/dadi.js';
import { calcolaProgramma } from './programma.js';

/**
 * Sessione di netrun: il Master allestisce un sistema, il netrunner ci entra.
 *
 * La struttura e' quella di `spellcaster`: una stanza per sessione, un token di
 * posto che permette di rientrare dopo un ricaricamento, e uno snapshot che il
 * client interroga. Qui i posti sono due e diversi fra loro — chi guida il
 * tavolo e chi ci gioca — e ognuno vede cose che l'altro non vede.
 *
 * Il modello del Net e' volutamente stretto: nodi collegati fra loro, ciascuno
 * con le sue Mura e le sue difese. Non e' una simulazione della Rete, e' quel
 * tanto che serve a far giocare al netrunner la sua parte mentre gli altri
 * combattono.
 */

export const VERSIONE_SESSIONE = 1;

export const TIPI_NODO = [
  { id: 'portale',   nome: 'Portale',   desc: 'La porta d\'ingresso del sistema.' },
  { id: 'cpu',       nome: 'CPU',       desc: 'Il cuore: prenderla significa prendere il sistema.' },
  { id: 'memoria',   nome: 'Memoria',   desc: 'Dove stanno i file. Di solito e\' cio\' per cui si e\' entrati.' },
  { id: 'controllo', nome: 'Controllo', desc: 'Comanda porte, ascensori, telecamere, torrette.' },
  { id: 'io',        nome: 'I/O',       desc: 'Collega il sistema al mondo fisico.' },
];

export const LIVELLI_ALLARME = [
  { id: 'nessuno',  nome: 'Nessuno',  desc: 'Il sistema non si e\' accorto di niente.', modDifese: 0 },
  { id: 'sospetto', nome: 'Sospetto', desc: 'Qualcosa non torna: le difese sono piu\' attente.', modDifese: 2 },
  { id: 'attivo',   nome: 'Allarme',  desc: 'Il sistema sa di avere un intruso e reagisce.', modDifese: 4 },
];

export const allarmePerId = (id) => LIVELLI_ALLARME.find((a) => a.id === id) || LIVELLI_ALLARME[0];

/** Memoria del cyberdeck: quante UM di programmi si possono tenere caricate. */
export const UM_DECK_DEFAULT = 30;

let contatore = 0;
const nuovoId = (p) => `${p}${Date.now().toString(36)}${(contatore += 1).toString(36)}`;

function segreto() {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

// ------------------------------------------------------------ costruzione --

export function creaSessione(id, opzioni = {}) {
  const nodi = (opzioni.nodi || []).map((n, i) => ({
    id: n.id || `n${i}`,
    nome: n.nome || `Nodo ${i + 1}`,
    tipo: TIPI_NODO.some((t) => t.id === n.tipo) ? n.tipo : 'memoria',
    mura: Math.max(0, Number(n.mura) || 0),
    muraIniziali: Math.max(0, Number(n.mura) || 0),
    collegati: Array.isArray(n.collegati) ? n.collegati : [],
    contenuto: String(n.contenuto || '').slice(0, 300),
    // Cio' che il Master sa e il netrunner no, finche' non ci arriva.
    nascosto: String(n.nascosto || '').slice(0, 300),
    violato: false,
  }));

  // Senza nodi il sistema non esiste: se ne mette uno d'ufficio.
  if (!nodi.length) {
    nodi.push({ id: 'n0', nome: 'Portale', tipo: 'portale', mura: 4, muraIniziali: 4, collegati: [], contenuto: '', nascosto: '', violato: false });
  }

  return {
    versione: VERSIONE_SESSIONE,
    id,
    nome: String(opzioni.nome || 'Nuova incursione').slice(0, 120),
    stato: 'attesa',
    round: 1,
    turno: 'runner',
    sistema: {
      nome: String(opzioni.sistema || 'Sistema senza nome').slice(0, 120),
      allarme: 'nessuno',
      nodi,
      difese: [],
    },
    runner: null,
    posti: { master: segreto(), runner: null },
    diario: [{ round: 1, tipo: 'apertura', testo: `Sessione "${opzioni.nome || 'Nuova incursione'}" aperta. In attesa del netrunner.` }],
  };
}

/** Il Master carica un programma difensivo su un nodo. */
export function caricaDifesa(sessione, spec, nodoId) {
  const calcolo = calcolaProgramma(spec);
  const nodo = sessione.sistema.nodi.find((n) => n.id === nodoId);
  if (!nodo) return { errore: 'Nodo non trovato.' };

  const difesa = {
    id: nuovoId('d'),
    nome: spec.nome || 'Programma',
    classe: (spec.funzioni || [])[0] || 'protezione',
    forza: calcolo.forzaEffettiva,
    forzaIniziale: calcolo.forzaEffettiva,
    um: calcolo.um,
    nodo: nodoId,
    // Un programma dormiente non e' visibile finche' non scatta.
    attivo: false,
    scoperto: false,
    spec,
  };
  sessione.sistema.difese.push(difesa);
  return { difesa };
}

/** Il netrunner entra e carica il proprio deck. */
export function entraNetrunner(sessione, { characterId, nome, INT, hacking, programmi, umDeck, token }) {
  if (sessione.stato === 'chiusa') return { errore: 'La sessione e\' chiusa.' };

  // Chi ha gia' il posto puo' rientrare col proprio token; gli altri no.
  if (sessione.runner && sessione.posti.runner && token !== sessione.posti.runner) {
    return { errore: 'Il posto del netrunner e\' gia\' occupato.' };
  }

  const tetto = Math.max(1, Number(umDeck) || UM_DECK_DEFAULT);
  const caricati = [];
  let usate = 0;
  const scartati = [];

  for (const spec of programmi || []) {
    const calcolo = calcolaProgramma(spec);
    if (usate + calcolo.um > tetto) {
      scartati.push({ nome: spec.nome, um: calcolo.um });
      continue;
    }
    usate += calcolo.um;
    caricati.push({
      id: nuovoId('p'),
      nome: spec.nome || 'Programma',
      classe: (spec.funzioni || [])[0] || 'utility',
      forza: calcolo.forzaEffettiva,
      forzaIniziale: calcolo.forzaEffettiva,
      um: calcolo.um,
      attivo: false,
      deresettato: false,
      spec,
    });
  }

  const primo = sessione.sistema.nodi[0];
  sessione.runner = {
    characterId: characterId || null,
    nome: String(nome || 'Netrunner').slice(0, 120),
    INT: Math.max(1, Number(INT) || 5),
    hacking: Math.max(0, Number(hacking) || 0),
    deck: { um: tetto, usate, caricati, scartati },
    posizione: primo.id,
    ferite: 0,
    intPersa: 0,
    rilevato: false,
    dentro: true,
  };
  sessione.posti.runner = sessione.posti.runner || segreto();
  sessione.stato = 'in corso';
  sessione.diario.push({
    round: sessione.round,
    tipo: 'ingresso',
    testo: `${sessione.runner.nome} entra nel sistema da ${primo.nome}. ` +
           `Deck: ${usate}/${tetto} UM, ${caricati.length} programm${caricati.length === 1 ? 'o' : 'i'}.` +
           (scartati.length ? ` Non entrati per mancanza di spazio: ${scartati.map((s) => s.nome).join(', ')}.` : ''),
  });
  return { token: sessione.posti.runner };
}

// -------------------------------------------------------------- risoluzione --

/** Tiro contrapposto fra due Forze: chi vince infligge la differenza in danni. */
function scontroDiForze(attaccante, difensore, modDifensore = 0) {
  const a = d10Aperto();
  const d = d10Aperto();
  const totA = a.totale + attaccante;
  const totD = d.totale + difensore + modDifensore;
  return {
    attaccante: { dado: a.totale, forza: attaccante, totale: totA },
    difensore: { dado: d.totale, forza: difensore, modificatore: modDifensore, totale: totD },
    vinto: totA > totD,
    scarto: totA - totD,
  };
}

const nodoDi = (sessione, id) => sessione.sistema.nodi.find((n) => n.id === id) || null;
const programmaDi = (sessione, id) => sessione.runner?.deck.caricati.find((p) => p.id === id) || null;
const difesaDi = (sessione, id) => sessione.sistema.difese.find((d) => d.id === id) || null;

/**
 * Azione del netrunner. Restituisce { voce } oppure { errore }.
 * La sessione viene modificata.
 */
export function azioneRunner(sessione, azione) {
  if (sessione.stato !== 'in corso') return { errore: 'La sessione non e\' in corso.' };
  if (!sessione.runner?.dentro) return { errore: 'Il netrunner non e\' collegato.' };
  if (sessione.turno !== 'runner') return { errore: 'Non e\' il turno del netrunner.' };

  const r = sessione.runner;
  const qui = nodoDi(sessione, r.posizione);
  const mod = allarmePerId(sessione.sistema.allarme).modDifese;
  let voce;

  switch (azione.tipo) {
    case 'muovi': {
      const meta = nodoDi(sessione, azione.nodo);
      if (!meta) return { errore: 'Nodo inesistente.' };
      if (meta.id === qui.id) return { errore: 'Sei gia\' li\'.' };
      if (qui.collegati.length && !qui.collegati.includes(meta.id)) {
        return { errore: `Da ${qui.nome} non si arriva a ${meta.nome}.` };
      }
      if (meta.mura > 0 && !meta.violato) {
        return { errore: `${meta.nome} ha ancora le Mura in piedi (Forza ${meta.mura}): serve un programma d'Intrusione.` };
      }
      r.posizione = meta.id;
      voce = { tipo: 'movimento', testo: `${r.nome} si sposta in ${meta.nome}.` };
      break;
    }

    case 'esegui': {
      const p = programmaDi(sessione, azione.programma);
      if (!p) return { errore: 'Programma non caricato nel deck.' };
      if (p.deresettato) return { errore: `${p.nome} e' stato de-resettato: va rilanciato da capo.` };

      // Contro le Mura del nodo, oppure contro un programma di difesa.
      if (azione.bersaglioTipo === 'mura') {
        const nodo = nodoDi(sessione, azione.nodo || r.posizione);
        if (!nodo) return { errore: 'Nodo inesistente.' };
        if (nodo.mura <= 0) return { errore: `${nodo.nome} non ha piu' Mura.` };
        const s = scontroDiForze(p.forza, nodo.mura, mod);
        if (s.vinto) {
          const danno = tiraNotazione('1D6').totale;
          nodo.mura = Math.max(0, nodo.mura - danno);
          if (nodo.mura === 0) nodo.violato = true;
          voce = {
            tipo: 'intrusione', scontro: s,
            testo: `${p.nome} (Forza ${p.forza}) apre una breccia nelle Mura di ${nodo.nome}: -${danno}, ` +
                   (nodo.mura === 0 ? 'le Mura cadono.' : `restano a Forza ${nodo.mura}.`),
          };
        } else {
          voce = { tipo: 'intrusione', scontro: s, testo: `${p.nome} non passa le Mura di ${nodo.nome} (${s.attaccante.totale} contro ${s.difensore.totale}).` };
        }
      } else {
        const d = difesaDi(sessione, azione.bersaglio);
        if (!d) return { errore: 'Difesa non trovata.' };
        if (d.forza <= 0) return { errore: `${d.nome} e' gia' fuori uso.` };
        const s = scontroDiForze(p.forza, d.forza, mod);
        if (s.vinto) {
          const danno = tiraNotazione('1D6').totale;
          d.forza = Math.max(0, d.forza - danno);
          d.scoperto = true;
          voce = {
            tipo: 'attacco', scontro: s,
            testo: `${p.nome} colpisce ${d.nome}: -${danno} alla Forza` +
                   (d.forza === 0 ? `, ${d.nome} e' de-resettato.` : `, resta a ${d.forza}.`),
          };
        } else {
          voce = { tipo: 'attacco', scontro: s, testo: `${p.nome} manca ${d.nome} (${s.attaccante.totale} contro ${s.difensore.totale}).` };
        }
      }
      p.attivo = true;
      break;
    }

    case 'scruta': {
      // Individuazione: rivela le difese dormienti del nodo in cui ci si trova.
      const dado = d10Aperto();
      const totale = dado.totale + r.INT + r.hacking;
      const difficolta = 15 + mod;
      const qui2 = nodoDi(sessione, r.posizione);
      const nascoste = sessione.sistema.difese.filter((d) => d.nodo === qui2.id && !d.scoperto);
      if (totale >= difficolta) {
        for (const d of nascoste) d.scoperto = true;
        voce = {
          tipo: 'scansione',
          testo: nascoste.length
            ? `${r.nome} scandaglia ${qui2.nome} (${totale} contro ${difficolta}) e trova: ${nascoste.map((d) => d.nome).join(', ')}.`
            : `${r.nome} scandaglia ${qui2.nome} (${totale} contro ${difficolta}): non c'e' niente in agguato.`,
        };
      } else {
        voce = { tipo: 'scansione', testo: `${r.nome} non cava un ragno dal buco (${totale} contro ${difficolta}).` };
      }
      break;
    }

    case 'disconnetti': {
      r.dentro = false;
      sessione.stato = 'chiusa';
      voce = { tipo: 'uscita', testo: `${r.nome} si scollega. L'incursione finisce qui.` };
      break;
    }

    case 'passa':
      voce = { tipo: 'attesa', testo: `${r.nome} non fa niente e resta in ascolto.` };
      break;

    default:
      return { errore: `Azione sconosciuta: ${azione.tipo}` };
  }

  voce.round = sessione.round;
  voce.chi = 'runner';
  sessione.diario.push(voce);
  if (sessione.stato === 'in corso') sessione.turno = 'master';
  return { voce };
}

/** Azione del Master: sveglia le difese, alza l'allarme, colpisce il runner. */
export function azioneMaster(sessione, azione) {
  if (sessione.stato !== 'in corso') return { errore: 'La sessione non e\' in corso.' };
  if (sessione.turno !== 'master') return { errore: 'Non e\' il turno del Master.' };

  const r = sessione.runner;
  const mod = allarmePerId(sessione.sistema.allarme).modDifese;
  let voce;

  switch (azione.tipo) {
    case 'allarme': {
      const liv = allarmePerId(azione.livello);
      sessione.sistema.allarme = liv.id;
      voce = { tipo: 'allarme', testo: `Allarme del sistema: ${liv.nome.toLowerCase()}. ${liv.desc}` };
      break;
    }

    case 'attiva': {
      const d = difesaDi(sessione, azione.difesa);
      if (!d) return { errore: 'Difesa non trovata.' };
      d.attivo = true;
      d.scoperto = true;
      voce = { tipo: 'attivazione', testo: `${d.nome} (Forza ${d.forza}) si attiva in ${nodoDi(sessione, d.nodo)?.nome || 'un nodo'}.` };
      break;
    }

    case 'colpisci': {
      const d = difesaDi(sessione, azione.difesa);
      if (!d) return { errore: 'Difesa non trovata.' };
      if (d.forza <= 0) return { errore: `${d.nome} e' fuori uso.` };
      if (!r?.dentro) return { errore: 'Il netrunner non e\' collegato.' };
      d.scoperto = true;
      d.attivo = true;

      // Il bersaglio e' un programma del runner, oppure il runner stesso se la
      // difesa e' un Nero.
      const bersaglio = azione.bersaglio ? programmaDi(sessione, azione.bersaglio) : null;
      const difesaRunner = bersaglio ? bersaglio.forza : r.INT + r.hacking;
      const s = scontroDiForze(d.forza + mod, difesaRunner);

      if (!s.vinto) {
        voce = { tipo: 'difesa', scontro: s, testo: `${d.nome} manca il bersaglio (${s.attaccante.totale} contro ${s.difensore.totale}).` };
        break;
      }

      if (bersaglio) {
        const danno = tiraNotazione('1D6').totale;
        bersaglio.forza = Math.max(0, bersaglio.forza - danno);
        if (bersaglio.forza === 0) bersaglio.deresettato = true;
        voce = {
          tipo: 'difesa', scontro: s,
          testo: `${d.nome} colpisce ${bersaglio.nome}: -${danno} alla Forza` +
                 (bersaglio.deresettato ? `, ${bersaglio.nome} e' de-resettato.` : `, resta a ${bersaglio.forza}.`),
        };
      } else if (d.classe === 'anti-operatore') {
        // Programma Nero: colpisce il cervello. Danni in caselle, e INT persa.
        const danno = tiraNotazione(azione.danni || '1D6').totale;
        r.ferite = Math.min(40, r.ferite + danno);
        const int = azione.intPersa ? tiraNotazione(azione.intPersa).totale : 0;
        r.intPersa += int;
        r.rilevato = true;
        voce = {
          tipo: 'nero', scontro: s,
          testo: `${d.nome} arriva al cervello di ${r.nome}: ${danno} caselle di danno` +
                 (int ? `, -${int} a INT` : '') + `. Ferite: ${r.ferite}/40.`,
        };
        if (r.ferite >= 40) {
          r.dentro = false;
          sessione.stato = 'chiusa';
          voce.testo += ` ${r.nome} non si sveglia piu'.`;
        }
      } else {
        r.rilevato = true;
        voce = { tipo: 'difesa', scontro: s, testo: `${d.nome} individua ${r.nome}: la sua posizione non e' piu' un segreto.` };
      }
      break;
    }

    case 'passa':
      voce = { tipo: 'attesa', testo: 'Il sistema resta immobile.' };
      break;

    case 'chiudi':
      sessione.stato = 'chiusa';
      voce = { tipo: 'chiusura', testo: 'Il Master chiude la sessione.' };
      break;

    default:
      return { errore: `Azione sconosciuta: ${azione.tipo}` };
  }

  voce.round = sessione.round;
  voce.chi = 'master';
  sessione.diario.push(voce);
  if (sessione.stato === 'in corso') {
    sessione.turno = 'runner';
    sessione.round += 1;
  }
  return { voce };
}

// ----------------------------------------------------------------- vista ---

/**
 * Cosa vede chi guarda. Il Master vede tutto; il netrunner vede solo i nodi in
 * cui e' stato e le difese che ha scoperto — altrimenti la tensione sparisce e
 * il gioco diventa un elenco.
 */
export function vista(sessione, ruolo) {
  const master = ruolo === 'master';
  const r = sessione.runner;
  const visitati = new Set(sessione.diario.filter((v) => v.tipo === 'movimento' || v.tipo === 'ingresso').map(() => null));

  const nodi = sessione.sistema.nodi.map((n) => {
    const qui = r && r.posizione === n.id;
    if (master) return { ...n };
    // Il netrunner vede struttura e Mura, ma non cosa c'e' dentro finche' non ci arriva.
    return {
      id: n.id, nome: n.nome, tipo: n.tipo, mura: n.mura, muraIniziali: n.muraIniziali,
      collegati: n.collegati, violato: n.violato,
      contenuto: n.violato || qui ? n.contenuto : '',
      qui,
    };
  });

  const difese = sessione.sistema.difese
    .filter((d) => master || d.scoperto)
    .map((d) => (master ? { ...d } : {
      id: d.id, nome: d.nome, classe: d.classe, forza: d.forza,
      forzaIniziale: d.forzaIniziale, nodo: d.nodo, attivo: d.attivo,
    }));

  return {
    id: sessione.id,
    nome: sessione.nome,
    stato: sessione.stato,
    round: sessione.round,
    turno: sessione.turno,
    ruolo,
    sistema: {
      nome: sessione.sistema.nome,
      allarme: sessione.sistema.allarme,
      nodi,
      difese,
      difeseNascoste: master ? 0 : sessione.sistema.difese.filter((d) => !d.scoperto).length,
    },
    runner: r ? {
      nome: r.nome, posizione: r.posizione, ferite: r.ferite, intPersa: r.intPersa,
      rilevato: r.rilevato, dentro: r.dentro,
      deck: { um: r.deck.um, usate: r.deck.usate, caricati: r.deck.caricati.map((p) => ({
        id: p.id, nome: p.nome, classe: p.classe, forza: p.forza,
        forzaIniziale: p.forzaIniziale, um: p.um, attivo: p.attivo, deresettato: p.deresettato,
      })) },
    } : null,
    diario: [...sessione.diario].reverse().slice(0, 100),
  };
}

/** Chi sta guardando, dato il token. Nessun token: nessun ruolo. */
export function ruoloPerToken(sessione, token) {
  if (!token) return null;
  if (token === sessione.posti.master) return 'master';
  if (token === sessione.posti.runner) return 'runner';
  return null;
}
