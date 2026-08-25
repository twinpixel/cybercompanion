/**
 * Tabelle per la scrittura dei programmi del Net.
 *
 * Fonte: doc/Cyberpunk 2020 ITA - Netrunner.pdf, che espande e chiarisce il
 * capitolo del manuale base. Le difficolta' delle Funzioni e degli Optional non
 * sono elencate tutte in una tabella: sono state **ricavate dalle 84 formule
 * scomposte** che il documento riporta accanto a ogni programma d'esempio
 * (`[Intrusione (15) + For (8) + Icona semplice (1) = Diff 24]`), e verificate
 * incrociandole con UM e prezzo stampati sulle stesse schede.
 *
 * Dove le fonti si contraddicono la scelta e' annotata: vedi
 * doc/regole/08-netrunning.md.
 */

/**
 * Funzioni: cosa il programma sa fare. La difficolta' e' il primo addendo.
 * `costo` e' il moltiplicatore del prezzo (10 eb per punto di difficolta').
 */
export const FUNZIONI = [
  { id: 'intrusione',    nome: 'Intrusione',     diff: 15, costo: 1,  desc: 'Sfonda le Mura di un sistema.' },
  { id: 'decifrazione',  nome: 'Decifrazione',   diff: 15, costo: 1,  desc: 'Apre portali e file protetti.' },
  { id: 'individuazione',nome: 'Individuazione', diff: 10, costo: 2,  desc: 'Trova programmi, operatori e strutture nel Net.' },
  { id: 'allarme',       nome: 'Allarme',        diff: 15, costo: 2,  desc: 'Sorveglia e avvisa quando qualcosa entra o cambia.' },
  { id: 'protezione',    nome: 'Protezione',     diff: 10, costo: 1,  desc: 'Para i colpi diretti al netrunner o alla sua icona.' },
  { id: 'controllo',     nome: 'Controllo',      diff: 10, costo: 1,  desc: 'Comanda i dispositivi collegati al sistema.' },
  { id: 'utility',       nome: 'Utility',        diff: 10, costo: 1,  desc: 'Funzioni di servizio: copia, ripara, converte, misura.' },
  { id: 'interazione',   nome: 'Interazione',    diff: 10, costo: 1,  desc: 'Simula una presenza con cui parlare.', notaCosto: 'Il costo si moltiplica ancora per il grado di realismo.' },
  { id: 'evasione',      nome: 'Evasione',       diff: 10, costo: 2,  desc: 'Rende il netrunner piu\' difficile da rintracciare.' },
  { id: 'travestimento', nome: 'Travestimento',  diff: 10, costo: 2,  desc: 'Cambia l\'icona con un\'altra di complessita\' adatta.' },
  { id: 'occultamento',  nome: 'Occultamento',   diff: 15, costo: 2,  desc: 'Scherma la presenza del runner verso programmi e IA.' },
  { id: 'furtivita',     nome: 'Furtivita\'',    diff: 15, costo: 2,  desc: 'Nasconde l\'icona agli altri operatori. Programmi e IA la vedono lo stesso.' },
  { id: 'anti-sistema',  nome: 'Anti-sistema',   diff: 15, costo: 3,  desc: 'Attacca il sistema: memoria, CPU, strutture.' },
  { id: 'anti-icona',    nome: 'Anti-IC',        diff: 20, costo: 4,  desc: 'Attacca gli altri programmi, riducendone la Forza.' },
  { id: 'assassino',     nome: 'Assassino',      diff: 20, costo: 4,  desc: 'De-resetta un tipo ristretto di programmi. Non funziona su Anti-IC e Neri, se non Mirato.' },
  { id: 'demone',        nome: 'Demone',         diff: 20, costo: 4,  desc: 'Resta in esecuzione nel sistema e porta con se\' altri programmi.' },
  { id: 'anti-operatore',nome: 'Anti-operatore', diff: 20, costo: 25, desc: 'Programma Nero: colpisce il cervello del netrunner. Il piu\' caro che esista.' },
];

export const funzionePerId = (id) => FUNZIONI.find((f) => f.id === id) || null;

/**
 * Icone: l'aspetto del programma nel Net. Una sola per programma, obbligatoria.
 */
export const ICONE = [
  { id: 'semplice',        nome: 'Semplice',        diff: 1, desc: 'Una forma geometrica, un simbolo.' },
  { id: 'complessa',       nome: 'Complessa',       diff: 2, desc: 'Un oggetto riconoscibile, fermo.' },
  { id: 'animata',         nome: 'Animata',         diff: 3, desc: 'Si muove e reagisce.' },
  { id: 'videorealistica', nome: 'Videorealistica', diff: 4, desc: 'Sembra una ripresa.' },
  { id: 'iperrealistica',  nome: 'Iperrealistica',  diff: 5, desc: 'Indistinguibile dal reale.' },
];

export const iconaPerId = (id) => ICONE.find((i) => i.id === id) || null;

/**
 * Optional: cosa si aggiunge al programma. `volte` permette di prenderne piu'
 * di uno dove il regolamento lo consente (per esempio Assassino su piu' classi).
 */
export const OPTIONAL = [
  { id: 'rapidita',      nome: 'Rapidita\'',            diff: 2,  desc: 'Il programma agisce prima degli altri.' },
  { id: 'fiuto',         nome: 'Fiuto',                 diff: 2,  desc: 'Segue il segnale del bersaglio fino alla fonte.' },
  { id: 'memoria',       nome: 'Memoria',               diff: 2,  desc: 'Registra dati freddi: percorsi, infrazioni, programmi attivati.' },
  { id: 'ricognizione',  nome: 'Ricognizione',          diff: 2,  desc: 'Esplora da solo i dintorni.' },
  { id: 'invisibilita',  nome: 'Invisibilita\'',        diff: 3,  desc: 'Il programma non compare finche\' non agisce.' },
  { id: 'resistenza',    nome: 'Resistenza',            diff: 3,  desc: 'Non puo\' essere disattivato da altri programmi.' },
  { id: 'autoreset',     nome: 'Auto-Reset',            diff: 3,  desc: 'Si ripara da solo dopo essere stato de-resettato.' },
  { id: 'conversazione', nome: 'Conversazione',         diff: 3,  desc: 'Sa sostenere un dialogo.' },
  { id: 'danno1d10',     nome: 'Danno 1D10',            diff: 3,  desc: 'Tira 1d10 invece di 1d6. Su un programma con due Funzioni va preso due volte.' },
  { id: 'int1d4',        nome: 'Int -1D4',              diff: 3,  desc: 'Riduce l\'INT del bersaglio di 1d4 invece di 1d3.' },
  { id: 'danniEInt',     nome: 'Danni e perdita di Int',diff: 3,  desc: 'Un Nero che toglie INT e infligge anche danni.' },
  { id: 'memento',       nome: 'Memento',               diff: 5,  desc: 'Ricorda cio\' che ha visto e sa riferirlo.' },
  { id: 'movimento',     nome: 'Liberta\' di movimento',diff: 5,  desc: 'Puo\' uscire dal sistema in cui e\' stato lanciato.' },
  { id: 'pseudointelletto', nome: 'Pseudo intelletto',  diff: 6,  desc: 'Decide da solo entro limiti stretti.' },
  { id: 'danno2d10',     nome: 'Danno 2D10',            diff: 7,  desc: 'Tira 2d10. Vietato agli Anti-IC.' },
  { id: 'int1d6',        nome: 'Int -1D6',              diff: 7,  desc: 'Riduce l\'INT di 1d6. Deve tracciare il segnale.' },
  { id: 'compattatore',  nome: 'Compattatore',          diff: 10, desc: 'Comprime il programma e cio\' che trasporta.' },
  { id: 'ottimizzato',   nome: 'Ottimizzato',           diff: 10, desc: 'Occupa meta\' delle UM, arrotondate per eccesso. Il costo resta quello pieno.', dimezzaUm: true },
  { id: 'ia',            nome: 'Intelligenza artificiale', diff: 12, desc: 'Il programma ragiona davvero.' },
  { id: 'danno3d10',     nome: 'Danno 3D10',            diff: 17, desc: 'Tira 3d10. Vietato agli Anti-IC.' },
  { id: 'usaegetta',     nome: 'Usa e getta',           diff: -10, desc: 'Piu\' facile da scrivere e piu\' piccolo, ma funziona una volta sola: ne\' Reset ne\' Auto-Reset lo recuperano.' },
  { id: 'int1d3',        nome: 'Int -1D3 (senza danni)',diff: 0,  desc: 'Un Nero che non infligge PF ma riduce di 1d3 l\'INT. Richiede Fiuto.' },
];

export const optionalPerId = (id) => OPTIONAL.find((o) => o.id === id) || null;

/**
 * Optional a costo variabile: la difficolta' dipende da una quantita'.
 * Trasporto: +5 ogni 10 UM di dati. Sottoprogrammi: +5 ciascuno, da 2 a 5.
 */
export const OPTIONAL_VARIABILI = [
  {
    id: 'trasporto', nome: 'Trasporto', per: 'UM di dati', passo: 10, diffPerPasso: 5,
    min: 10, max: 200, desc: 'Il programma trasporta dati: +5 di difficolta\' ogni 10 UM.',
  },
  {
    id: 'sottoprogrammi', nome: 'Sottoprogrammi', per: 'sottoprogrammi', passo: 1, diffPerPasso: 5,
    min: 2, max: 5, desc: 'Un Demone "vuoto" che carica programmi a scelta. La sua Forza cala di uno per ogni sottoprogramma.',
  },
];

export const variabilePerId = (id) => OPTIONAL_VARIABILI.find((o) => o.id === id) || null;

/**
 * Come la Forza entra nella difficolta'. Un programma costruito contro un
 * bersaglio ristretto rende di piu' a parita' di difficolta': e' il compromesso
 * fra potenza e versatilita'.
 */
export const MODI_FORZA = [
  { id: 'normale',   nome: 'Generico',  divisore: 1, desc: 'Funziona contro tutto cio\' che la Funzione prevede.' },
  { id: 'variabile', nome: 'Variabile', divisore: 2, desc: 'Piu\' efficace contro un bersaglio preciso, ma colpisce anche gli altri.' },
  { id: 'specifico', nome: 'Specifico', divisore: 2, desc: 'Solo contro una serie o un tipo di bersagli. Vietato a Intrusione e ai Neri.' },
  { id: 'mirato',    nome: 'Mirato',    divisore: 5, desc: 'Solo contro un programma preciso. E\' l\'unico modo di fare un Assassino contro Anti-IC o Neri.' },
];

export const modoForzaPerId = (id) => MODI_FORZA.find((m) => m.id === id) || MODI_FORZA[0];

export const FORZA_MIN = 1;
export const FORZA_MAX = 15;

/**
 * Unita' di memoria occupate, in base alla difficolta'.
 *
 * Il documento stampa solo la coda della tabella (41-45 = 7 UM in su). Il resto
 * e' stato ricavato da 66 schede di programmi con difficolta' e UM entrambe
 * stampate, e le due meta' combaciano in una formula sola:
 *
 *     UM = ceil(difficolta' / 5) - 2,  con minimo 1 e massimo 13
 *
 * Verificata su tutte le schede: Diff 15 -> 1, 20 -> 2, 25 -> 3, 30 -> 4,
 * 45 -> 7, 50 -> 8, 54 -> 9, e il tetto di 13 UM da 71 in su.
 */
export const UM_MIN = 1;
export const UM_MAX = 13;

export function umPerDifficolta(difficolta) {
  const d = Math.max(0, Math.ceil(Number(difficolta) || 0));
  return Math.min(UM_MAX, Math.max(UM_MIN, Math.ceil(d / 5) - 2));
}

/** Prezzo base per punto di difficolta', prima del moltiplicatore della Funzione. */
export const EB_PER_PUNTO = 10;

/**
 * Difficolta' del tiro per scrivere il programma, e giorni di lavoro.
 * Il tiro e' d10 aperto + INT + Programmare contro la difficolta' del programma.
 */
export const TEMPO = {
  _nota: 'Il manuale non fissa una tabella unica dei tempi. Regola adottata: un giorno di lavoro per ogni punto di difficolta\', diviso per quanto il programmatore supera la soglia. Chi e\' molto bravo scrive in fretta.',
  giorniPerPunto: 1,
};
