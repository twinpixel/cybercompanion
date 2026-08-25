/**
 * Riconosce e recupera dai modelli che rispondono con il proprio ragionamento —
 * il commento sul compito — invece che con il risultato.
 *
 * Ripreso da `poltrobot` (src/reasoning-leak.js) e ridotto a cio' che serve qui:
 * in CyberCompanion l'output atteso e' un oggetto JSON, non un messaggio di
 * chat, quindi un ragionamento davanti al JSON non e' un fastidio stilistico ma
 * una risposta inservibile.
 *
 * Si riconosce **dalla forma, non dalle parole di un caso visto**: una fuga
 * parla del compito in terza persona ("l'utente", "il personaggio", "la
 * richiesta") dicendo cosa andrebbe fatto ("devo", "dovrei", "analizziamo").
 * Cercare invece frasi letterali intercetta solo la fuga gia' vista, e la
 * successiva passa.
 */

/** Qualcosa di cui una risposta parla, invece di produrla. */
const SOGGETTO_META =
  /\b(the user|the request|the character|the prompt|the output|the json|the format|the schema)\b|\b(l'utente|la richiesta|il personaggio|il formato|lo schema|il json)\b/i;

/** Decidere cosa scrivere, invece di scriverlo. */
const VERBO_META =
  /\b(wants? me to|is asking|i need to|i should|i must|let'?s (analyze|analyse|think|see)|let me (analyze|analyse|think|see)|first,? i|i'?ll (write|create|generate)|output format)\b|\b(vuole che io|sta chiedendo|mi (sta )?chiedendo|devo (creare|generare|scrivere|rispondere)|dovrei|analizziamo|per prima cosa|generero')\b/i;

/** L'impaginazione di un compito svolto: titoli numerati, etichette in grassetto. */
const STRUTTURA_META = /\*\*(persona|character|output|constraints?|context|format|schema|step)\b/i;

// Sotto questa soglia un testo e' troppo corto per essere un compito svolto, e
// la coppia soggetto/verbo puo' capitare in una frase qualsiasi.
const MIN_CARATTERI = 60;

/** Vero quando il testo e' ragionamento del modello, non il risultato. */
export function isReasoningLeak(testo) {
  if (!testo) return false;
  if (testo.length >= MIN_CARATTERI && SOGGETTO_META.test(testo) && VERBO_META.test(testo)) return true;
  if (STRUTTURA_META.test(testo)) return true;
  if (/^\d+\.\s+\*\*/m.test(testo) && testo.length > 120) return true;
  return false;
}

/**
 * Toglie i tag di pensiero e prova a recuperare il JSON annegato nel ragionamento.
 *
 * L'ordine conta: prima si tolgono i blocchi <think>, poi si cerca l'oggetto
 * JSON. Cercarlo prima significherebbe pescare un JSON di esempio citato
 * *dentro* il ragionamento invece del risultato vero, che viene sempre dopo.
 */
export function ripulisci(grezzo) {
  let testo = (grezzo || '').trim();
  if (!testo) return '';

  testo = testo
    .replace(/<redacted_thinking>[\s\S]*?<\/redacted_thinking>/gi, '')
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    // Un tag aperto e mai chiuso, o una chiusura senza apertura.
    .replace(/[\s\S]*?<\/think>/gi, '')
    // Recinti markdown attorno al JSON.
    .replace(/```(?:json)?\s*([\s\S]*?)```/gi, '$1')
    .trim();

  return testo;
}

/**
 * Estrae un oggetto JSON dal testo di un modello.
 * Restituisce null se non ce n'e' uno interpretabile.
 */
export function estraiJson(grezzo) {
  const testo = ripulisci(grezzo);
  if (!testo) return null;

  try { return JSON.parse(testo); } catch { /* prosegue */ }

  // L'ultimo oggetto bilanciato del testo: se il modello ha ragionato prima, il
  // risultato buono e' quello in fondo, non l'esempio citato a meta' strada.
  for (const candidato of oggettiBilanciati(testo).reverse()) {
    try { return JSON.parse(candidato); } catch { /* prova il precedente */ }
  }
  return null;
}

/** Tutti i blocchi { ... } con le graffe bilanciate, in ordine di apertura. */
function oggettiBilanciati(testo) {
  const trovati = [];
  for (let i = 0; i < testo.length; i++) {
    if (testo[i] !== '{') continue;
    let profondita = 0;
    let inStringa = false;
    let escape = false;
    for (let j = i; j < testo.length; j++) {
      const c = testo[j];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') { inStringa = !inStringa; continue; }
      if (inStringa) continue;
      if (c === '{') profondita++;
      else if (c === '}') {
        profondita--;
        if (profondita === 0) { trovati.push(testo.slice(i, j + 1)); i = j; break; }
      }
    }
  }
  return trovati;
}
