/**
 * Tabelle del combattimento di Cyberpunk 2020.
 *
 * Riferimento: doc/regole/04-tabelle-di-gioco.md e doc/regole/01-caratteristiche.md.
 * Le fasce di distanza non compaiono nei PDF estratti (le tabelle riassuntive
 * riportano solo la scala delle difficolta' e i modificatori di bersaglio):
 * sono quelle del manuale base, ricavate dalla gittata dell'arma.
 */

/**
 * Difficolta' del tiro per colpire in base alla distanza, espressa in frazioni
 * della gittata dell'arma. La prima riga che copre la distanza vince.
 */
export const FASCE_DISTANZA = [
  { id: 'bruciapelo', nome: 'Bruciapelo',  fino: () => 1,             difficolta: 10 },
  { id: 'ravvicinata', nome: 'Ravvicinata', fino: (g) => g / 4,       difficolta: 15 },
  { id: 'media',      nome: 'Media',        fino: (g) => g / 2,       difficolta: 20 },
  { id: 'lunga',      nome: 'Lunga',        fino: (g) => g,           difficolta: 25 },
  { id: 'estrema',    nome: 'Estrema',      fino: (g) => g * 2,       difficolta: 30 },
];

/** Fascia e difficolta' per una distanza e una gittata date. */
export function fasciaPerDistanza(distanza, gittata) {
  const g = Number(gittata) || 0;
  if (!g) return { id: 'ignota', nome: 'Gittata ignota', difficolta: 20, oltre: false };
  for (const f of FASCE_DISTANZA) {
    if (distanza <= f.fino(g)) return { id: f.id, nome: f.nome, difficolta: f.difficolta, oltre: false };
  }
  return { id: 'fuori', nome: 'Fuori gittata', difficolta: 99, oltre: true };
}

/**
 * Modificatori al tiro per colpire, dalle tabelle riassuntive.
 * Sono opzioni che il Master accende sull'azione, non stati permanenti.
 */
export const MODIFICATORI_TIRO = [
  { id: 'mirato',        nome: 'Colpo mirato a una parte del corpo', mod: -4 },
  { id: 'piccolo',       nome: 'Bersaglio molto piccolo',            mod: -6 },
  { id: 'buio',          nome: 'Cattiva illuminazione',              mod: -3 },
  { id: 'inMovimento',   nome: 'Bersaglio in movimento veloce',      mod: -3 },
  { id: 'grande',        nome: 'Bersaglio piu\' grande di un uomo',  mod: +2 },
  { id: 'improvviso',    nome: 'Aprire il fuoco d\'improvviso',      mod: -3 },
  { id: 'ambidestro',    nome: 'Arma nella mano debole',             mod: -3 },
];

/** Localizzazione del colpo: 1d10. */
export const LOCALIZZAZIONI = [
  { min: 1,  max: 1,  id: 'testa',          nome: 'Testa',           moltiplicatore: 2 },
  { min: 2,  max: 4,  id: 'tronco',         nome: 'Tronco',          moltiplicatore: 1 },
  { min: 5,  max: 5,  id: 'braccioDestro',  nome: 'Braccio destro',  moltiplicatore: 1 },
  { min: 6,  max: 6,  id: 'braccioSinistro',nome: 'Braccio sinistro',moltiplicatore: 1 },
  { min: 7,  max: 8,  id: 'gambaDestra',    nome: 'Gamba destra',    moltiplicatore: 1 },
  { min: 9,  max: 10, id: 'gambaSinistra',  nome: 'Gamba sinistra',  moltiplicatore: 1 },
];

export function localizzazioneDaTiro(tiro) {
  return LOCALIZZAZIONI.find((l) => tiro >= l.min && tiro <= l.max) || LOCALIZZAZIONI[1];
}

/** Locazione dal suo identificativo, per il colpo mirato. */
export function localizzazionePerId(id) {
  return LOCALIZZAZIONI.find((l) => l.id === id) || null;
}

/** Bonus di Costituzione: resistenza ai danni e danno in corpo a corpo. */
export const BONUS_COSTITUZIONE = [
  { min: 1,  max: 2,  tipo: 'Molto debole', resistenza: 0,  danno: -2 },
  { min: 3,  max: 4,  tipo: 'Debole',       resistenza: -1, danno: -1 },
  { min: 5,  max: 7,  tipo: 'Medio',        resistenza: -2, danno: 0 },
  { min: 8,  max: 9,  tipo: 'Forte',        resistenza: -3, danno: 1 },
  { min: 10, max: 10, tipo: 'Molto forte',  resistenza: -4, danno: 2 },
  { min: 11, max: 99, tipo: 'Sovrumano',    resistenza: -5, danno: 3 },
];

export function bonusCostituzione(cos) {
  const v = Number(cos) || 0;
  return BONUS_COSTITUZIONE.find((r) => v >= r.min && v <= r.max) || BONUS_COSTITUZIONE[BONUS_COSTITUZIONE.length - 1];
}

/** Gradi di ferita: 10 gradi da 4 caselle, 40 in totale. */
export const GRADI_FERITA = [
  { grado: 'Lieve',     stordimento: 0, effetto: 'Nessuno',                        malusRif: 0,  mortale: false },
  { grado: 'Grave',     stordimento: 1, effetto: '-2 a RIF',                       malusRif: -2, mortale: false },
  { grado: 'Critica',   stordimento: 2, effetto: 'RIF, INT e FRE dimezzate',       divisore: 2,  mortale: false },
  { grado: 'Mortale 0', stordimento: 3, effetto: 'RIF, INT e FRE ridotte a 1/3',   divisore: 3,  mortale: true },
  { grado: 'Mortale 1', stordimento: 4, effetto: 'RIF, INT e FRE ridotte a 1/3',   divisore: 3,  mortale: true },
  { grado: 'Mortale 2', stordimento: 5, effetto: 'RIF, INT e FRE ridotte a 1/3',   divisore: 3,  mortale: true },
  { grado: 'Mortale 3', stordimento: 6, effetto: 'RIF, INT e FRE ridotte a 1/3',   divisore: 3,  mortale: true },
  { grado: 'Mortale 4', stordimento: 7, effetto: 'RIF, INT e FRE ridotte a 1/3',   divisore: 3,  mortale: true },
  { grado: 'Mortale 5', stordimento: 8, effetto: 'RIF, INT e FRE ridotte a 1/3',   divisore: 3,  mortale: true },
  { grado: 'Mortale 6', stordimento: 9, effetto: 'RIF, INT e FRE ridotte a 1/3',   divisore: 3,  mortale: true },
];

export const CASELLE_TOTALI = GRADI_FERITA.length * 4;

/** Grado di ferita corrispondente a un certo numero di caselle segnate. */
export function gradoFerita(caselle) {
  const c = Math.max(0, Math.min(CASELLE_TOTALI, Number(caselle) || 0));
  if (c === 0) return null;
  return GRADI_FERITA[Math.min(GRADI_FERITA.length - 1, Math.ceil(c / 4) - 1)];
}

/** RIF effettivo dopo i malus da ferita. */
export function rifEffettivo(rif, caselle) {
  const g = gradoFerita(caselle);
  if (!g) return Number(rif) || 0;
  const base = Number(rif) || 0;
  if (g.divisore) return Math.max(1, Math.floor(base / g.divisore));
  return Math.max(1, base + (g.malusRif || 0));
}

/**
 * Le azioni che il motore sa risolvere.
 *
 * `abilita` elenca le abilita' ammesse, in ordine di preferenza: si usa la prima
 * che il combattente possiede. `difesa` dice quali abilita' il bersaglio puo'
 * opporre, quando l'azione e' un confronto.
 */
export const AZIONI = [
  {
    id: 'fuoco',
    nome: 'Fuoco singolo',
    categoria: 'attacco',
    aDistanza: true,
    descrizione: 'Un colpo con un\'arma da fuoco.',
    abilita: ['Pistole', 'Fucili', 'Mitra', 'Armi pesanti', 'Armi da tiro'],
  },
  {
    id: 'raffica',
    nome: 'Raffica da tre',
    categoria: 'attacco',
    aDistanza: true,
    richiedeAutomatico: true,
    modTiro: +2,
    descrizione: 'Tre colpi in rapida successione: +2 al tiro, 1D6/2 colpi a segno.',
    abilita: ['Mitra', 'Fucili', 'Pistole', 'Armi pesanti'],
  },
  {
    id: 'automatico',
    nome: 'Fuoco automatico',
    categoria: 'attacco',
    aDistanza: true,
    richiedeAutomatico: true,
    descrizione: 'Svuota il caricatore: i colpi a segno sono lo scarto fra tiro e difficolta\'.',
    abilita: ['Mitra', 'Armi pesanti', 'Fucili'],
  },
  {
    id: 'mischia',
    nome: 'Corpo a corpo',
    categoria: 'attacco',
    aDistanza: false,
    descrizione: 'Arma bianca, pugno o calcio contro un bersaglio adiacente.',
    abilita: ['Armi bianche', 'Arti marziali', 'Scherma', 'Lottare'],
    difesa: ['Schivare - Divincolarsi', 'Armi bianche', 'Arti marziali', 'Lottare'],
  },
  {
    id: 'schiva',
    nome: 'Schivare',
    categoria: 'difesa',
    descrizione: 'Fino al prossimo turno il bersaglio oppone Schivare al corpo a corpo. Contro le armi da fuoco non serve: non si schiva un proiettile.',
    abilita: ['Schivare - Divincolarsi', 'Atletica'],
  },
  {
    id: 'para',
    nome: 'Parare',
    categoria: 'difesa',
    descrizione: 'Fino al prossimo turno il bersaglio oppone la propria arma al corpo a corpo.',
    abilita: ['Armi bianche', 'Arti marziali', 'Scherma', 'Lottare'],
  },
  {
    id: 'sblocca',
    nome: 'Sbloccare l\'arma',
    categoria: 'utilita',
    descrizione: 'Un\'arma inceppata non spara finche\' non la si libera: tiro di TEC contro difficolta\' Normale.',
    abilita: ['Riparare armi', 'Tecnologia di base'],
    difficolta: 15,
  },
  {
    id: 'ricarica',
    nome: 'Ricaricare',
    categoria: 'utilita',
    descrizione: 'Un caricatore nuovo: l\'arma torna piena. Costa un\'azione, come sbloccarla.',
  },
  {
    id: 'riparo',
    nome: 'Mettersi al riparo',
    categoria: 'difesa',
    descrizione: 'Il riparo aggiunge il proprio VP a quello dell\'armatura finche\' ci si resta dietro.',
  },
];

export function azionePerId(id) {
  return AZIONI.find((a) => a.id === id) || null;
}

/** Ripari tipici e il loro valore di protezione. */
export const RIPARI = [
  { id: 'nessuno',   nome: 'Allo scoperto',            vp: 0 },
  { id: 'leggero',   nome: 'Riparo leggero (legno, cartongesso)', vp: 10 },
  { id: 'medio',     nome: 'Riparo medio (auto, bancone)',        vp: 20 },
  { id: 'pesante',   nome: 'Riparo pesante (muro, cassonetto)',   vp: 35 },
];

export function riparoPerId(id) {
  return RIPARI.find((r) => r.id === id) || RIPARI[0];
}

/**
 * Tipi di munizione.
 *
 * Le **perforanti** sono quelle del manuale: bucano meglio l'armatura ma
 * deformano meno, quindi dimezzano sia il VP sia il danno che passa.
 * Le **dirompenti** sono il loro opposto, secondo la regola della casa: contro
 * l'armatura valgono la meta', ma su carne scoperta raddoppiano.
 *
 * `vpFattore` moltiplica il valore di protezione, `dannoFattore` il danno che
 * ha superato l'armatura, `degrado` quanto la munizione consuma l'armatura.
 */
export const TIPI_MUNIZIONI = [
  {
    id: 'normale', nome: 'Normali',
    vpFattore: 1, dannoFattore: 1, degrado: 1,
    desc: 'Munizioni comuni: nessun effetto particolare.',
  },
  {
    id: 'perforante', nome: 'Perforanti',
    vpFattore: 0.5, dannoFattore: 0.5, degrado: 1,
    desc: 'Dimezzano il VP dell\'armatura, ma anche il danno che riescono a passare.',
  },
  {
    id: 'dirompente', nome: 'Dirompenti',
    vpFattore: 2, dannoFattore: 2, degrado: 0.5,
    desc: 'L\'opposto delle perforanti: l\'armatura le ferma il doppio e le consuma la meta\', ma su carne scoperta fanno il doppio dei danni.',
  },
];

export function munizionePerId(id) {
  return TIPI_MUNIZIONI.find((m) => m.id === id) || TIPI_MUNIZIONI[0];
}

/**
 * Usura delle armature — regola della casa, non del manuale, che nel
 * regolamento base tratta il VP come un valore fisso.
 *
 * Ogni colpo che **passa** consuma un punto di VP nel punto colpito; ogni tre
 * colpi **fermati** ne consumano un altro. Il tipo di munizione moltiplica il
 * consumo: le dirompenti, essendo meno penetranti, logorano la meta'.
 */
export const USURA = {
  perColpoPassato: 1,
  perColpoFermato: 1 / 3,
};

/** Danni delle manovre a mani nude: si sommano al bonus danno della Costituzione. */
export const MANOVRE_NUDE = [
  { id: 'pugno',  nome: 'Pugno',  danni: '1D6/2' },
  { id: 'calcio', nome: 'Calcio', danni: '1D6' },
];
