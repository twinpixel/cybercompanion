/**
 * La libreria dei programmi classici.
 *
 * `server/data/programs.json` contiene 62 programmi del manuale con, accanto a
 * ciascuno, la **formula scomposta** che il documento stampa:
 *
 *   Anti-IC (20) + Rapidita' (2) + For (3) + Icona animata (3) = Diff 28
 *
 * Qui quelle formule vengono ritradotte nelle specifiche che la console sa
 * costruire — Funzioni, Forza, icona, optional — cosi' i programmi del manuale
 * non restano un elenco da leggere: si aprono nel costruttore, si modificano e
 * si caricano nel deck come quelli scritti da zero.
 *
 * La traduzione e' verificata: per ogni programma la difficolta' ricalcolata
 * dalla specifica deve tornare uguale a quella stampata. Dove non torna, e' la
 * scheda del PDF ad avere un errore di conto (il documento e' amatoriale), e la
 * voce se lo porta dietro in `divergenza` invece di nasconderlo.
 */

import { calcolaProgramma } from './programma.js';
import { funzionePerId } from './tabelle.js';

/** Confronta le etichette ignorando accenti, maiuscole, trattini e spazi. */
function normalizza(testo) {
  return String(testo || '')
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // via gli accenti
    .replace(/['’`]/g, '')
    .replace(/[-–—_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Etichetta della formula -> id della Funzione. */
const FUNZIONI_PER_ETICHETTA = {
  'intrusione': 'intrusione',
  'decifrazione': 'decifrazione',
  'individuazione': 'individuazione',
  'allarme': 'allarme',
  'protezione': 'protezione',
  'controllo': 'controllo',
  'utility': 'utility',
  'interazione': 'interazione',
  'evasione': 'evasione',
  'travestimento': 'travestimento',
  'occultamento': 'occultamento',
  'furtivita': 'furtivita',
  'anti sistema': 'anti-sistema',
  'anti ic': 'anti-icona',
  'anti icona': 'anti-icona',
  'assassino': 'assassino',
  'demone': 'demone',
  'anti operatore': 'anti-operatore',
};

const ICONE_PER_ETICHETTA = {
  'icona semplice': 'semplice',
  'icona complessa': 'complessa',
  'icona animata': 'animata',
  'icona videorealistica': 'videorealistica',
  'icona iperrealistica': 'iperrealistica',
};

const OPTIONAL_PER_ETICHETTA = {
  'rapidita': 'rapidita',
  'fiuto': 'fiuto',
  'memoria': 'memoria',
  'ricognizione': 'ricognizione',
  'invisibilita': 'invisibilita',
  'resistenza': 'resistenza',
  'auto reset': 'autoreset',
  'conversazione': 'conversazione',
  'danno 1d10': 'danno1d10',
  'int 1d4': 'int1d4',
  'danni e perdita di int': 'danniEInt',
  'memento': 'memento',
  'liberta di movimento': 'movimento',
  'pseudo intelletto': 'pseudointelletto',
  'danno 2d10': 'danno2d10',
  'int 1d6': 'int1d6',
  'compattatore': 'compattatore',
  'ottimizzato': 'ottimizzato',
  'intelligenza artificiale': 'ia',
  'danno 3d10': 'danno3d10',
  'usa e getta': 'usaegetta',
  // Nel manuale e' "Int -1D3 senza danni": la formula lo scrive cosi' e vale 0.
  'perdita di int': 'int1d3',
};

/**
 * Spezza la formula nei suoi addendi.
 *
 * Non basta dividere sui `+`: due schede del PDF hanno un `+` mancante
 * (`Resistenza (3) Icona complessa (2)`), e affidarsi al solo separatore
 * perderebbe l'addendo successivo. Si taglia percio' **dopo ogni parentesi
 * chiusa**, che e' il vero confine fra una voce e l'altra.
 */
export function spezzaFormula(formula) {
  const corpo = String(formula || '').replace(/=\s*Diff.*$/i, '');
  const pezzi = [];
  const re = /([^+()]+)\(([^)]*)\)/g;
  let m;
  while ((m = re.exec(corpo)) !== null) {
    const etichetta = m[1].replace(/^[\s+]+|[\s+]+$/g, '');
    const dentro = m[2].trim();
    const numero = /-?\d+/.exec(dentro);
    pezzi.push({
      etichetta,
      valore: numero ? Number(numero[0]) : 0,
      nota: dentro.replace(/^-?\d+\s*/, '').trim(),
    });
  }
  return pezzi;
}

/**
 * Ricava Forza e suo modo dal contributo che la formula stampa.
 *
 * La formula stampa il **contributo alla difficolta'**, che coincide con la
 * Forza solo quando il programma e' generico: uno costruito contro un solo tipo
 * di bersagli ha Forza doppia del proprio contributo.
 *
 * Quando i due numeri della scheda sono d'accordo — cioe' la Forza stampata,
 * divisa come prevede uno dei modi, da' proprio quel contributo — si tiene la
 * Forza stampata e il modo che la spiega. Altrimenti comanda la formula: e'
 * l'unica delle due cifre che si puo' verificare, perche' i suoi addendi devono
 * sommare alla difficolta' stampata accanto. La Forza da sola no, e infatti in
 * qualche scheda e' un intervallo ("5/7") o la Forza *effettiva in gioco* di un
 * Demone, gia' scalata dei suoi sottoprogrammi.
 */
function forzaDallaFormula(forzaStampata, contributo, nota) {
  const stampata = Number(forzaStampata);
  if (Number.isFinite(stampata) && stampata > 0) {
    const candidati = [
      { id: 'normale', divisore: 1 },
      { id: 'variabile', divisore: 2 },
      { id: 'specifico', divisore: 2 },
      { id: 'mirato', divisore: 5 },
    ].filter((c) => Math.ceil(stampata / c.divisore) === contributo);

    if (candidati.length) {
      const n = normalizza(nota);
      let scelto = candidati[0];
      if (candidati.some((c) => c.id === 'normale')) scelto = candidati.find((c) => c.id === 'normale');
      else if (/tipo|serie|classe/.test(n)) scelto = candidati.find((c) => c.id === 'specifico') || scelto;
      else if (/un solo programma|preciso|mirato/.test(n)) scelto = candidati.find((c) => c.id === 'mirato') || scelto;
      return { forza: stampata, modo: scelto.id, forzaStampata: stampata };
    }
  }
  return {
    forza: Math.max(1, contributo),
    modo: 'normale',
    forzaStampata: Number.isFinite(stampata) ? stampata : null,
    discorde: forzaStampata,
  };
}

/**
 * Traduce una voce del catalogo nella specifica di un programma costruibile.
 * Restituisce { spec, calcolo, sconosciute, divergenza }.
 */
export function specDaVoce(voce) {
  const spec = {
    versione: 1,
    nome: voce.nome,
    funzioni: [],
    forza: Math.max(1, Number(voce.forza) || 1),   // sovrascritta dalla formula, se la porta
    modoForza: 'normale',
    bersaglio: '',
    icona: 'semplice',
    descrizioneIcona: '',
    optional: [],
    variabili: [],
    note: voce.descrizione || '',
  };

  const sconosciute = [];
  let contributoForza = null;
  let notaForza = '';

  for (const pezzo of spezzaFormula(voce.formula)) {
    // "Assassino x2" e simili: la stessa voce presa piu' volte.
    const conteggio = /\sx\s*(\d+)$/i.exec(pezzo.etichetta);
    const volte = conteggio ? Number(conteggio[1]) : 1;
    const etichetta = normalizza(pezzo.etichetta.replace(/\sx\s*\d+$/i, ''));

    if (etichetta === 'for' || etichetta === 'forza') {
      contributoForza = pezzo.valore;
      notaForza = pezzo.nota;
      continue;
    }
    if (FUNZIONI_PER_ETICHETTA[etichetta]) {
      for (let i = 0; i < volte; i++) spec.funzioni.push(FUNZIONI_PER_ETICHETTA[etichetta]);
      continue;
    }
    if (ICONE_PER_ETICHETTA[etichetta]) {
      spec.icona = ICONE_PER_ETICHETTA[etichetta];
      continue;
    }
    if (OPTIONAL_PER_ETICHETTA[etichetta]) {
      spec.optional.push({ id: OPTIONAL_PER_ETICHETTA[etichetta], volte });
      continue;
    }
    if (etichetta === 'sottoprogrammi') {
      // La formula stampa la difficolta' totale: +5 per sottoprogramma.
      spec.variabili.push({ id: 'sottoprogrammi', quantita: Math.max(2, Math.round(pezzo.valore / 5)) });
      continue;
    }
    sconosciute.push(pezzo.etichetta);
  }

  let forzaDiscorde = null;
  /**
   * Tre Demoni del documento hanno la formula senza la propria Funzione: dopo
   * Compattatore e Sottoprogrammi passano dritti alla Forza. Un programma senza
   * Funzione pero' non fa niente, e la console giustamente lo rifiuta: la
   * Funzione si prende allora dalla classe della scheda, che quei tre la
   * dichiarano. Il conto stampato resta indietro dei 20 punti della Funzione
   * mancante, e la differenza finisce fra le divergenze invece di sparire.
   */
  let funzioneDallaClasse = false;
  if (!spec.funzioni.length && funzionePerId(voce.classe)) {
    spec.funzioni.push(voce.classe);
    funzioneDallaClasse = true;
  }

  if (contributoForza != null) {
    const f = forzaDallaFormula(voce.forza, contributoForza, notaForza);
    spec.forza = f.forza;
    spec.modoForza = f.modo;
    if (f.modo !== 'normale') {
      spec.bersaglio = notaForza || 'Un bersaglio ristretto: vedi la descrizione.';
    }
    if (f.discorde != null) forzaDiscorde = { stampata: f.discorde, usata: f.forza };
  }

  const calcolo = calcolaProgramma(spec);
  const stampata = Number(voce.difficolta) || 0;
  return {
    spec,
    calcolo,
    sconosciute,
    forzaDiscorde,
    funzioneDallaClasse,
    // Il PDF e' amatoriale: dove il conto stampato non torna, si tiene
    // entrambi i numeri invece di far finta che il problema non esista.
    divergenza: stampata && calcolo.difficolta !== stampata
      ? { stampata, calcolata: calcolo.difficolta }
      : null,
  };
}

/** L'intera libreria, pronta per il client. */
export function libreriaProgrammi(catalogo) {
  return (catalogo?.programmi || []).map((voce) => {
    const { spec, calcolo, sconosciute, divergenza, forzaDiscorde, funzioneDallaClasse } = specDaVoce(voce);
    return {
      nome: voce.nome,
      alias: voce.alias || '',
      classe: voce.classe,
      descrizione: voce.descrizione || '',
      forza: spec.forza,
      um: calcolo.um,
      costo: calcolo.costo,
      difficolta: calcolo.difficolta,
      formula: voce.formula,
      spec,
      sconosciute,
      forzaDiscorde,
      funzioneDallaClasse,
      divergenza,
    };
  });
}

/** Cerca un programma della libreria per nome o alias. */
export function programmaDiLibreria(catalogo, nome) {
  const cercato = normalizza(nome);
  const voce = (catalogo?.programmi || []).find(
    (p) => normalizza(p.nome) === cercato || (p.alias && normalizza(p.alias) === cercato)
  );
  return voce ? specDaVoce(voce).spec : null;
}
