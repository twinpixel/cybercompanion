import { d10Aperto } from '../lib/dadi.js';
import {
  rifEffettivo, gradoFerita, CASELLE_TOTALI, LOCALIZZAZIONI, AZIONI, RIPARI,
  MODIFICATORI_TIRO, TIPI_MUNIZIONI,
} from './tabelle.js';
import { risolviAzione, descriviStato } from './risolvi.js';
import { decidiAzione, descriviAzione } from './ia.js';

export { decidiAzione, descriviAzione };

export { AZIONI, RIPARI, MODIFICATORI_TIRO, LOCALIZZAZIONI, CASELLE_TOTALI, TIPI_MUNIZIONI };

export const VERSIONE_SCONTRO = 1;

/** Quali locazioni copre un pezzo d'armatura, dal campo `copre` del catalogo. */
function locazioniCoperte(copre) {
  const t = String(copre || '').toLowerCase();
  if (/tutto il corpo/.test(t)) return LOCALIZZAZIONI.map((l) => l.id);
  const ids = [];
  if (/testa/.test(t)) ids.push('testa');
  if (/tronco/.test(t)) ids.push('tronco');
  if (/braccia/.test(t)) ids.push('braccioDestro', 'braccioSinistro');
  if (/gambe/.test(t)) ids.push('gambaDestra', 'gambaSinistra');
  // "Solo danni da fuoco" e simili non proteggono dai proiettili.
  return ids;
}

/**
 * VP per locazione a partire dalle armature indossate.
 * Due pezzi sulla stessa parte non si sommano: vale il migliore, come da
 * regolamento (sovrapporre kevlar non raddoppia la protezione).
 */
export function armaturaPerLocazione(armature) {
  const vp = Object.fromEntries(LOCALIZZAZIONI.map((l) => [l.id, 0]));
  for (const pezzo of armature || []) {
    const valore = Number(pezzo.vp) || 0;
    for (const id of locazioniCoperte(pezzo.copre)) {
      if (valore > vp[id]) vp[id] = valore;
    }
  }
  return vp;
}

let contatore = 0;
function nuovoId(prefisso) {
  contatore += 1;
  return `${prefisso}${Date.now().toString(36)}${contatore.toString(36)}`;
}

/** Costruisce un combattente da una scheda personaggio salvata. */
export function combattenteDaScheda(scheda, characterId, squadra = 'pg') {
  const car = scheda.caratteristiche || {};
  const armi = (scheda.armi || []).map((a) => ({ ...a }));
  const armatura = armaturaPerLocazione(scheda.armature);
  return {
    id: nuovoId('c'),
    origine: 'scheda',
    characterId,
    nome: scheda.anagrafica?.nome || 'Senza nome',
    soprannome: scheda.anagrafica?.soprannome || '',
    squadra,
    caratteristiche: {
      RIF: Number(car.RIF) || 0, COS: Number(car.COS) || 0, TEC: Number(car.TEC) || 0,
      FRE: Number(car.FRE) || 0, INT: Number(car.INT) || 0, MOV: Number(car.MOV) || 0,
    },
    abilita: { ...(scheda.abilita || {}) },
    // Il Senso del combattimento del Solitario si somma all'iniziativa.
    bonusIniziativa: Number(scheda.abilita?.['Senso del combattimento']) || 0,
    armi,
    armatura: { ...armatura },
    armaturaIniziale: { ...armatura },
    usuraArmatura: {},
    colpiInCanna: Object.fromEntries(armi.map((a, i) => [i, Number(a.caricatore) || null])),
    ferite: Number(scheda.ferite?.caselle) || 0,
    feriteIniziali: Number(scheda.ferite?.caselle) || 0,
    stordito: false,
    morto: false,
    fuoriCombattimento: false,
    difesa: null,
    riparo: 'nessuno',
    inceppate: {},
    iniziativa: null,
  };
}

/**
 * Costruisce un combattente da un avversario estemporaneo o da un modello PNG.
 * Un PNG non ha una scheda: bastano le poche voci che il combattimento usa.
 */
export function combattenteDaPng(png, squadra = 'nemici', indice = 0) {
  const armi = (png.armi || []).map((a) => ({ ...a }));
  const nome = indice > 0 ? `${png.nome} ${indice + 1}` : png.nome;
  return {
    id: nuovoId('n'),
    origine: 'png',
    templateId: png.templateId || null,
    nome: nome || 'Avversario',
    soprannome: '',
    squadra,
    caratteristiche: {
      RIF: Number(png.RIF) || 5, COS: Number(png.COS) || 5, TEC: Number(png.TEC) || 5,
      FRE: Number(png.FRE) || 5, INT: Number(png.INT) || 5, MOV: Number(png.MOV) || 5,
    },
    abilita: { ...(png.abilita || {}) },
    bonusIniziativa: Number(png.bonusIniziativa) || 0,
    armi,
    // Un PNG ha un solo valore di armatura, uguale su tutto il corpo: dettagliare
    // le locazioni di cinque teppisti non aggiunge nulla al tavolo.
    armatura: Object.fromEntries(LOCALIZZAZIONI.map((l) => [l.id, Number(png.armaturaVP) || 0])),
    armaturaIniziale: Object.fromEntries(LOCALIZZAZIONI.map((l) => [l.id, Number(png.armaturaVP) || 0])),
    usuraArmatura: {},
    colpiInCanna: Object.fromEntries(armi.map((a, i) => [i, Number(a.caricatore) || null])),
    ferite: Number(png.ferite) || 0,
    feriteIniziali: 0,
    stordito: false,
    morto: false,
    fuoriCombattimento: false,
    difesa: null,
    riparo: 'nessuno',
    inceppate: {},
    iniziativa: null,
  };
}

export function scontroVuoto(nome = 'Nuovo scontro') {
  return {
    versione: VERSIONE_SCONTRO,
    nome,
    // Distanza in metri fra i due schieramenti. Senza una mappa, una distanza
    // sola per tutti e' l'approssimazione che al tavolo si usa comunque; il
    // Master la cambia quando la scena si muove.
    distanza: 10,
    round: 0,
    indiceTurno: 0,
    combattenti: [],
    ordine: [],
    diario: [],
    chiuso: false,
  };
}

/**
 * Tira l'iniziativa e apre il primo round.
 * Iniziativa = d10 aperto + RIF (gia' ridotto dalle ferite) + Senso del combattimento.
 * A parita' vince chi ha il RIF piu' alto; se sono pari anche quelli, l'ordine
 * fra i due resta quello in cui sono stati schierati.
 */
export function tiraIniziativa(scontro) {
  const voci = [];
  for (const c of scontro.combattenti) {
    const rif = rifEffettivo(c.caratteristiche.RIF, c.ferite);
    const dado = d10Aperto();
    c.iniziativa = dado.totale + rif + (c.bonusIniziativa || 0);
    c.difesa = null;
    voci.push({ nome: c.nome, iniziativa: c.iniziativa, dado: dado.totale, rif, bonus: c.bonusIniziativa || 0 });
  }

  scontro.ordine = scontro.combattenti
    .map((c, i) => ({ id: c.id, iniziativa: c.iniziativa, rif: c.caratteristiche.RIF, i }))
    .sort((a, b) => b.iniziativa - a.iniziativa || b.rif - a.rif || a.i - b.i)
    .map((v) => v.id);

  scontro.round = 1;
  scontro.indiceTurno = 0;
  scontro.diario.push({
    round: 1,
    tipo: 'iniziativa',
    testo: 'Iniziativa: ' + voci.sort((a, b) => b.iniziativa - a.iniziativa)
      .map((v) => `${v.nome} ${v.iniziativa}`).join(', ') + '.',
    dettagli: voci,
  });
  return scontro;
}

/** Chi tocca adesso. Salta chi e' fuori combattimento. */
export function turnoCorrente(scontro) {
  if (!scontro.ordine.length) return null;
  for (let i = 0; i < scontro.ordine.length; i++) {
    const idx = (scontro.indiceTurno + i) % scontro.ordine.length;
    const c = scontro.combattenti.find((x) => x.id === scontro.ordine[idx]);
    if (c && !c.fuoriCombattimento) {
      scontro.indiceTurno = idx;
      return c;
    }
  }
  return null;
}

/** Passa al combattente successivo, aprendo un nuovo round quando serve. */
export function avanzaTurno(scontro) {
  if (!scontro.ordine.length) return scontro;
  const attivi = scontro.combattenti.filter((c) => !c.fuoriCombattimento);
  if (attivi.length <= 1) return scontro;

  for (let i = 1; i <= scontro.ordine.length; i++) {
    const idx = (scontro.indiceTurno + i) % scontro.ordine.length;
    const c = scontro.combattenti.find((x) => x.id === scontro.ordine[idx]);
    if (!c || c.fuoriCombattimento) continue;
    if (idx <= scontro.indiceTurno) {
      scontro.round += 1;
      scontro.diario.push({ round: scontro.round, tipo: 'round', testo: `— Round ${scontro.round} —` });
    }
    scontro.indiceTurno = idx;
    return scontro;
  }
  return scontro;
}

/** Squadre ancora in piedi: se ne resta una sola lo scontro e' deciso. */
export function squadreInPiedi(scontro) {
  const vive = new Set(scontro.combattenti.filter((c) => !c.fuoriCombattimento).map((c) => c.squadra));
  return [...vive];
}

/**
 * Svolge il turno del combattente di turno e passa al successivo.
 * Restituisce { scontro, voce } oppure { errore }.
 */
export function svolgiTurno(scontro, azione) {
  if (scontro.chiuso) return { errore: 'Lo scontro e\' chiuso.' };
  if (!scontro.round) return { errore: 'L\'iniziativa non e\' ancora stata tirata.' };

  const diTurno = turnoCorrente(scontro);
  if (!diTurno) return { errore: 'Non c\'e\' nessuno che possa agire.' };
  if (azione.attaccante && azione.attaccante !== diTurno.id) {
    const altro = scontro.combattenti.find((c) => c.id === azione.attaccante);
    return { errore: `Tocca a ${diTurno.nome}, non a ${altro?.nome || 'quel combattente'}.` };
  }

  // `tipo: 'auto'` lascia decidere al motore: e' la scorciatoia per i PNG.
  let scelta = azione;
  if (azione.tipo === 'auto') {
    const proposta = decidiAzione(scontro, diTurno, azione);
    if (!proposta) return { errore: `${diTurno.nome} non ha nessuno contro cui agire.` };
    scelta = { ...proposta, automatica: true };
  }

  const voce = risolviAzione(scontro, { ...scelta, attaccante: diTurno.id });
  if (scelta.automatica) voce.automatica = true;
  if (voce.errore) return { errore: voce.errore };

  scontro.diario.push(voce);

  const squadre = squadreInPiedi(scontro);
  if (squadre.length <= 1) {
    scontro.diario.push({
      round: scontro.round,
      tipo: 'fine',
      testo: squadre.length === 1
        ? `Lo scontro e' deciso: resta in piedi solo "${squadre[0]}".`
        : 'Non resta in piedi nessuno.',
    });
  } else {
    avanzaTurno(scontro);
  }
  return { scontro, voce };
}

/**
 * Riepilogo delle ferite da riportare sulle schede alla chiusura.
 * Solo i combattenti che vengono da una scheda salvata e che hanno subito
 * qualcosa: sui PNG non c'e' niente da scrivere.
 */
export function riepilogoFerite(scontro) {
  return scontro.combattenti
    .filter((c) => c.origine === 'scheda' && c.characterId)
    .map((c) => ({
      characterId: c.characterId,
      combattenteId: c.id,
      nome: c.nome,
      feritePrima: c.feriteIniziali,
      feriteDopo: c.ferite,
      differenza: c.ferite - c.feriteIniziali,
      grado: gradoFerita(c.ferite)?.grado || 'Illeso',
      morto: !!c.morto,
      stato: descriviStato(c),
    }))
    .filter((r) => r.differenza !== 0 || r.morto);
}
