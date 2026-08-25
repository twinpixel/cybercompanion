import { d10Aperto } from '../lib/dadi.js';
import {
  FUNZIONI, funzionePerId, ICONE, iconaPerId, OPTIONAL, optionalPerId,
  OPTIONAL_VARIABILI, variabilePerId, MODI_FORZA, modoForzaPerId, umPerDifficolta,
  EB_PER_PUNTO, FORZA_MIN, FORZA_MAX, TEMPO,
} from './tabelle.js';

/**
 * Costruzione di un programma per il Net.
 *
 * Un programma e' una somma di scelte: una o piu' Funzioni, una Forza, un'icona
 * e una manciata di optional. Da quella somma escono la difficolta' di
 * scrittura, lo spazio occupato in memoria e il prezzo. Il compito di questo
 * modulo e' fare i conti e dire cosa non torna — non simulare il software.
 */

export function programmaVuoto() {
  return {
    versione: 1,
    nome: '',
    funzioni: [],
    forza: 5,
    modoForza: 'normale',
    bersaglio: '',          // a cosa serve, quando la Forza e' Mirata o Specifica
    icona: 'semplice',
    descrizioneIcona: '',
    optional: [],           // [{ id, volte }]
    variabili: [],          // [{ id, quantita }]
    note: '',
  };
}

const arrotondaSu = (n) => Math.ceil(Number(n) || 0);

/**
 * Calcola difficolta', UM e costo, mostrando ogni addendo.
 *
 * L'arrotondamento e' sempre verso l'alto e va fatto **dopo ogni divisione**,
 * come prescrive il documento: e' la regola che rende ripetibile il conto.
 */
export function calcolaProgramma(spec) {
  const p = { ...programmaVuoto(), ...spec };
  const voci = [];

  // --- funzioni ---
  const funzioni = (p.funzioni || []).map(funzionePerId).filter(Boolean);
  for (const f of funzioni) voci.push({ tipo: 'funzione', nome: f.nome, diff: f.diff });

  // --- forza ---
  const forza = Math.max(FORZA_MIN, Math.min(FORZA_MAX, Number(p.forza) || 0));
  const modo = modoForzaPerId(p.modoForza);
  const contributoForza = arrotondaSu(forza / modo.divisore);
  voci.push({
    tipo: 'forza',
    nome: modo.divisore === 1 ? `Forza ${forza}` : `Forza ${forza} (${modo.nome.toLowerCase()}, /${modo.divisore})`,
    diff: contributoForza,
  });

  // --- icona ---
  const icona = iconaPerId(p.icona);
  if (icona) voci.push({ tipo: 'icona', nome: `Icona ${icona.nome.toLowerCase()}`, diff: icona.diff });

  // --- optional a costo fisso ---
  let dimezzaUm = false;
  for (const scelto of p.optional || []) {
    const o = optionalPerId(typeof scelto === 'string' ? scelto : scelto.id);
    if (!o) continue;
    const volte = Math.max(1, Number(typeof scelto === 'object' ? scelto.volte : 1) || 1);
    if (o.dimezzaUm) dimezzaUm = true;
    voci.push({
      tipo: 'optional',
      nome: volte > 1 ? `${o.nome} x${volte}` : o.nome,
      diff: o.diff * volte,
    });
  }

  // --- optional a costo variabile ---
  for (const scelto of p.variabili || []) {
    const v = variabilePerId(scelto.id);
    if (!v) continue;
    const q = Math.max(v.min, Math.min(v.max, Number(scelto.quantita) || v.min));
    const passi = arrotondaSu(q / v.passo);
    voci.push({ tipo: 'variabile', nome: `${v.nome} (${q} ${v.per})`, diff: passi * v.diffPerPasso });
  }

  const difficolta = Math.max(1, voci.reduce((a, v) => a + v.diff, 0));

  // --- spazio in memoria ---
  const umBase = umPerDifficolta(difficolta);
  const um = dimezzaUm ? Math.max(1, arrotondaSu(umBase / 2)) : umBase;

  // --- prezzo ---
  // Con piu' Funzioni il manuale lascia scegliere fra somma, massimo e media.
  // Qui si prende il massimo: e' la scelta che non premia chi impila Funzioni
  // costose per poi pagarne la media.
  const moltiplicatore = funzioni.length ? Math.max(...funzioni.map((f) => f.costo)) : 1;
  const costo = difficolta * EB_PER_PUNTO * moltiplicatore;

  return {
    difficolta,
    um,
    umBase,
    ottimizzato: dimezzaUm,
    costo,
    moltiplicatoreCosto: moltiplicatore,
    forzaEffettiva: forza,
    voci,
    giorni: Math.max(1, difficolta * TEMPO.giorniPerPunto),
    avvisi: avvisi(p, funzioni),
  };
}

/**
 * Controlli di coerenza. Sono **avvisi**, non errori: il documento ripete che
 * l'ultima parola spetta al Master, "anche se andasse contro le regole qui
 * descritte". Bloccare la costruzione sarebbe piu' rigido del regolamento.
 */
function avvisi(p, funzioni) {
  const fuori = [];
  const ids = funzioni.map((f) => f.id);
  const opz = new Set((p.optional || []).map((o) => (typeof o === 'string' ? o : o.id)));
  const varIds = new Set((p.variabili || []).map((v) => v.id));

  if (!funzioni.length) fuori.push('Un programma senza Funzioni non fa niente: scegline almeno una.');
  if (!iconaPerId(p.icona)) fuori.push('Serve un\'icona: nel Net tutto ha una forma.');

  if (ids.includes('assassino') && p.modoForza !== 'mirato') {
    fuori.push('Un Assassino colpisce Demoni, Anti-sistema e programmi d\'Allarme. Per farne uno contro Anti-IC o Neri serve una Forza Mirata.');
  }
  if (ids.includes('anti-icona') && (opz.has('danno2d10') || opz.has('danno3d10'))) {
    fuori.push('Un Anti-IC non puo\' avere Danno 2D10 ne\' 3D10.');
  }
  if (p.modoForza === 'specifico' && (ids.includes('intrusione') || ids.includes('anti-operatore'))) {
    fuori.push('Non esistono programmi di Intrusione o Neri di tipo Specifico.');
  }
  if (opz.has('usaegetta') && opz.has('autoreset')) {
    fuori.push('Usa e getta e Auto-Reset si escludono: dopo l\'uso il programma si cancella e nulla lo ripara.');
  }
  if ((opz.has('int1d3') || opz.has('int1d6')) && !opz.has('fiuto')) {
    fuori.push('Per ridurre l\'INT il programma deve tracciare il segnale fino alla fonte: aggiungi Fiuto.');
  }
  if (opz.has('danno1d10') && funzioni.length >= 2) {
    const volte = (p.optional || []).find((o) => (typeof o === 'object' ? o.id : o) === 'danno1d10');
    const n = typeof volte === 'object' ? Number(volte.volte) || 1 : 1;
    if (n < 2) fuori.push('Con due o piu\' Funzioni, Danno 1D10 va preso due volte.');
  }
  if (ids.includes('demone') && varIds.has('sottoprogrammi')) {
    const s = (p.variabili || []).find((v) => v.id === 'sottoprogrammi');
    const n = Math.max(2, Math.min(5, Number(s?.quantita) || 2));
    fuori.push(`Il Demone ha ${n} sottoprogrammi: la sua Forza effettiva in gioco cala di ${n}, a ${Math.max(0, (Number(p.forza) || 0) - n)}.`);
  }
  if ((p.modoForza === 'mirato' || p.modoForza === 'specifico') && !String(p.bersaglio || '').trim()) {
    fuori.push('Una Forza Mirata o Specifica deve dire contro cosa: scrivilo nel campo bersaglio.');
  }
  return fuori;
}

/**
 * Difficolta' per modificare un programma gia' scritto.
 *
 * Il documento dice che editare ha una sua difficolta' ma non la quantifica.
 * Regola adottata: si paga **lo scarto** fra le due versioni, e mai meno di un
 * quarto della difficolta' della nuova. Cosi' ritoccare un dettaglio costa
 * poco, ma non si arriva gratis a un programma potente partendo da uno banale.
 */
export function difficoltaModifica(primaSpec, dopoSpec) {
  const prima = calcolaProgramma(primaSpec).difficolta;
  const dopo = calcolaProgramma(dopoSpec).difficolta;
  const scarto = Math.abs(dopo - prima);
  const minimo = arrotondaSu(dopo / 4);
  return { prima, dopo, scarto, difficolta: Math.max(minimo, scarto), minimo };
}

/**
 * Tiro per scrivere il programma: d10 aperto + INT + Programmare contro la
 * difficolta'. Chi supera di molto la soglia ci mette meno tempo.
 */
export function tiroScrittura({ INT = 0, programmare = 0 }, difficolta) {
  const dado = d10Aperto();
  const totale = dado.totale + Number(INT) + Number(programmare);
  const scarto = totale - difficolta;
  const riuscito = scarto >= 0;
  // Un margine ampio accorcia i tempi; il minimo resta un giorno.
  const giorni = riuscito
    ? Math.max(1, Math.ceil((difficolta * TEMPO.giorniPerPunto) / Math.max(1, 1 + Math.floor(scarto / 5))))
    : null;
  return {
    riuscito, totale, difficolta, scarto, dado, giorni,
    termini: { dado: dado.totale, INT: Number(INT), programmare: Number(programmare) },
    testo: riuscito
      ? `Riuscito: ${totale} contro ${difficolta}. Il programma e' pronto in ${giorni} giorn${giorni === 1 ? 'o' : 'i'}.`
      : `Fallito: ${totale} contro ${difficolta}. Il lavoro va rifatto da capo.`,
  };
}

/** Validazione prima di salvare su D1. */
export function validaProgramma(p) {
  if (!p || typeof p !== 'object') return 'Programma mancante';
  if (typeof p.nome !== 'string' || !p.nome.trim()) return 'Il programma deve avere un nome';
  if (p.nome.length > 120) return 'Nome troppo lungo';
  if (!Array.isArray(p.funzioni) || !p.funzioni.length) return 'Serve almeno una Funzione';
  for (const id of p.funzioni) {
    if (!funzionePerId(id)) return `Funzione sconosciuta: ${id}`;
  }
  const forza = Number(p.forza);
  if (!Number.isFinite(forza) || forza < FORZA_MIN || forza > FORZA_MAX) {
    return `La Forza deve stare fra ${FORZA_MIN} e ${FORZA_MAX}`;
  }
  if (!iconaPerId(p.icona)) return `Icona sconosciuta: ${p.icona}`;
  if (!modoForzaPerId(p.modoForza)) return `Modo della Forza sconosciuto: ${p.modoForza}`;
  for (const o of p.optional || []) {
    const id = typeof o === 'string' ? o : o?.id;
    if (!optionalPerId(id)) return `Optional sconosciuto: ${id}`;
  }
  for (const v of p.variabili || []) {
    if (!variabilePerId(v?.id)) return `Optional variabile sconosciuto: ${v?.id}`;
  }
  if (JSON.stringify(p).length > 32 * 1024) return 'Programma troppo grande';
  return null;
}

/** Tutto cio' che serve al client per costruire un programma, in una chiamata. */
export function catalogoNetrun() {
  return {
    funzioni: FUNZIONI,
    icone: ICONE,
    optional: OPTIONAL,
    variabili: OPTIONAL_VARIABILI,
    modiForza: MODI_FORZA,
    forza: { min: FORZA_MIN, max: FORZA_MAX },
  };
}
