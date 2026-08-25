/** Fabbriche condivise dai test del combattimento. */
import { combattenteDaScheda, combattenteDaPng, scontroVuoto, tiraIniziativa } from '../server/combat/index.js';

export const ARMI = {
  pistola: { nome: 'Ares Predator II', tipo: 'PST', precisione: 0, danni: '4D6+1 (12mmCL)', caricatore: 15, cadenza: 1, gittata: 50, affidabilita: 'MA' },
  pistolaScadente: { nome: 'Dai Lung', tipo: 'PST', precisione: 0, danni: '2D6+3 (10mm)', caricatore: 8, cadenza: 1, gittata: 50, affidabilita: 'IN' },
  mitra: { nome: 'Uzi miniauto 9', tipo: 'MTR', precisione: 1, danni: '2D6+1 (9mm)', caricatore: 30, cadenza: 35, gittata: 150, affidabilita: 'MA' },
  katana: { nome: 'Katana', tipo: 'BNC', precisione: 1, danni: '3D6', caricatore: 'NO', cadenza: 'NO', gittata: 1, affidabilita: 'MA' },
};

export function scheda(nome, { car = {}, abilita = {}, armi = [], armature = [], ferite = 0 } = {}) {
  return {
    anagrafica: { nome },
    caratteristiche: { INT: 6, RIF: 7, TEC: 6, FRE: 7, FAS: 5, FOR: 5, MOV: 6, COS: 7, EMP: 5, ...car },
    abilita, armi, armature,
    ferite: { caselle: ferite },
  };
}

export function png(nome, extra = {}) {
  return {
    nome, RIF: 6, COS: 6, FRE: 5, TEC: 5, INT: 5, MOV: 6, armaturaVP: 4,
    abilita: { Pistole: 3, Mitra: 3, 'Armi bianche': 3, Lottare: 3 },
    armi: [], ...extra,
  };
}

/**
 * Prepara uno scontro con un ordine di iniziativa fissato, cosi' i test non
 * dipendono da chi ha tirato meglio.
 */
export function arena({ pg = [], nemici = [], distanza = 10 } = {}) {
  const s = scontroVuoto('prova');
  s.distanza = distanza;
  const a = pg.map((x, i) => (x.anagrafica ? combattenteDaScheda(x, `char-${i}`, 'pg') : combattenteDaPng(x, 'pg', i)));
  const b = nemici.map((x, i) => (x.anagrafica ? combattenteDaScheda(x, `nem-${i}`, 'nemici') : combattenteDaPng(x, 'nemici', i)));
  s.combattenti = [...a, ...b];
  tiraIniziativa(s);
  // Ordine deterministico: prima i pg, poi i nemici.
  s.ordine = s.combattenti.map((c) => c.id);
  s.indiceTurno = 0;
  return { scontro: s, pg: a, nemici: b };
}

/** Rimette in piedi un combattente e ricarica le sue armi, fra una prova e l'altra. */
export function rimetti(c) {
  c.ferite = 0;
  c.morto = false;
  c.fuoriCombattimento = false;
  c.stordito = false;
  c.difesa = null;
  c.inceppate = {};
  c.usuraArmatura = {};
  c.armatura = { ...c.armaturaIniziale };
  for (const i of Object.keys(c.colpiInCanna || {})) {
    if (c.colpiInCanna[i] != null) c.colpiInCanna[i] = Number(c.armi[i]?.caricatore) || 99;
  }
}

/** Punta l'indice di turno sul combattente indicato. */
export function tocca(scontro, comb) {
  scontro.indiceTurno = scontro.ordine.indexOf(comb.id);
  return scontro;
}
