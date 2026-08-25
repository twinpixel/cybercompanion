import { d10, d10Aperto, tiraNotazione } from '../lib/dadi.js';
import {
  fasciaPerDistanza, MODIFICATORI_TIRO, localizzazioneDaTiro, localizzazionePerId,
  bonusCostituzione, gradoFerita, rifEffettivo, azionePerId, riparoPerId,
  CASELLE_TOTALI, MANOVRE_NUDE, munizionePerId, USURA,
} from './tabelle.js';

/**
 * Risoluzione di una singola azione di combattimento.
 *
 * Le funzioni qui dentro **modificano** i combattenti passati (ferite, colpi,
 * stato difensivo) e restituiscono una voce di diario che racconta ogni tiro:
 * al tavolo il Master deve poter rispondere a "come ha fatto a mancarmi?", e un
 * risultato senza i numeri che lo hanno prodotto non e' verificabile.
 */

const SOGLIA_INCEPPAMENTO = { MA: 1, ST: 2, IN: 3 };

/** Prima abilita' posseduta fra quelle ammesse, con il suo livello. */
export function abilitaMigliore(comb, ammesse) {
  let scelta = { nome: null, livello: 0 };
  for (const nome of ammesse || []) {
    const liv = Number(comb.abilita?.[nome]) || 0;
    if (liv > scelta.livello) scelta = { nome, livello: liv };
  }
  // Nessuna abilita' posseduta: si tira lo stesso, con la sola caratteristica.
  if (!scelta.nome && (ammesse || []).length) scelta = { nome: ammesse[0], livello: 0 };
  return scelta;
}

function numero(v, def = 0) {
  const n = Number(String(v ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : def;
}

/** VP dell'armatura in una locazione, piu' quello dell'eventuale riparo. */
function protezione(comb, locId) {
  const armatura = numero(comb.armatura?.[locId], 0);
  const riparo = riparoPerId(comb.riparo || 'nessuno').vp;
  return { armatura, riparo, totale: armatura + riparo };
}

/**
 * Consuma l'armatura nel punto colpito, secondo la regola della casa: un punto
 * di VP per ogni colpo che passa, uno ogni tre colpi fermati.
 *
 * L'usura si accumula come frazione e scende di un punto quando arriva a uno:
 * cosi' il "ogni tre colpi" funziona anche quando il tipo di munizione lo
 * moltiplica per mezzo. Il riparo non si consuma — non e' addosso al bersaglio,
 * e tenerne il conto sposterebbe il gioco dal personaggio all'arredamento.
 */
function consumaArmatura(bersaglio, locId, passato, degrado) {
  const attuale = Number(bersaglio.armatura?.[locId]) || 0;
  if (attuale <= 0) return { consumato: 0, vpRimasto: 0 };

  bersaglio.usuraArmatura = bersaglio.usuraArmatura || {};
  const incremento = (passato ? USURA.perColpoPassato : USURA.perColpoFermato) * degrado;
  const accumulata = (bersaglio.usuraArmatura[locId] || 0) + incremento;

  const punti = Math.floor(accumulata);
  bersaglio.usuraArmatura[locId] = accumulata - punti;
  if (!punti) return { consumato: 0, vpRimasto: attuale };

  bersaglio.armatura[locId] = Math.max(0, attuale - punti);
  return { consumato: attuale - bersaglio.armatura[locId], vpRimasto: bersaglio.armatura[locId] };
}

/**
 * Applica un colpo. L'ordine e' quello della scheda: prima l'armatura, poi il
 * raddoppio per la testa, infine il bonus di resistenza della Costituzione.
 * Il tipo di munizione interviene due volte: sul VP e sul danno che lo supera.
 */
function applicaColpo(bersaglio, danniGrezzi, loc, munizione) {
  const mun = munizionePerId(munizione);
  const p = protezione(bersaglio, loc.id);
  const bonus = bonusCostituzione(bersaglio.caratteristiche?.COS);

  const vpEffettivo = Math.floor(p.totale * mun.vpFattore);
  let danni = Math.max(0, danniGrezzi - vpEffettivo);
  const passato = danni > 0;

  if (passato) {
    danni = Math.floor(danni * mun.dannoFattore) * (loc.moltiplicatore || 1);
    // `resistenza` e' negativo: sommarlo e' sottrarlo.
    danni = Math.max(0, danni + bonus.resistenza);
  }

  const usura = consumaArmatura(bersaglio, loc.id, passato, mun.degrado);

  const prima = Number(bersaglio.ferite) || 0;
  bersaglio.ferite = Math.min(CASELLE_TOTALI, prima + danni);

  return {
    grezzi: danniGrezzi,
    munizione: mun.id,
    armatura: p.armatura,
    riparo: p.riparo,
    vpEffettivo,
    passato,
    moltiplicatore: loc.moltiplicatore || 1,
    resistenza: bonus.resistenza,
    inflitti: danni,
    armaturaConsumata: usura.consumato,
    armaturaRimasta: usura.vpRimasto,
    feritePrima: prima,
    feriteDopo: bersaglio.ferite,
  };
}

/**
 * Controlli che scattano dopo aver subito danni: stordimento a ogni nuovo grado
 * di ferita, tiro salvezza quando si entra nei gradi Mortali.
 */
function controlliDopoIlDanno(bersaglio, feritePrima) {
  const esiti = [];
  const gradoPrima = gradoFerita(feritePrima);
  const gradoDopo = gradoFerita(bersaglio.ferite);
  if (!gradoDopo || gradoDopo.grado === gradoPrima?.grado) return esiti;

  // Stordimento: d10 contro FRE meno il valore del grado raggiunto.
  const fre = Number(bersaglio.caratteristiche?.FRE) || 0;
  const soglia = fre - gradoDopo.stordimento;
  const tiro = d10();
  const superato = tiro <= soglia;
  bersaglio.stordito = !superato;
  esiti.push({
    tipo: 'stordimento', tiro, soglia, superato,
    testo: superato
      ? `regge il colpo (stordimento ${tiro} su ${soglia})`
      : `resta stordito (stordimento ${tiro} su ${soglia})`,
  });

  // Tiro salvezza: solo entrando in un grado Mortale.
  if (gradoDopo.mortale) {
    const cos = Number(bersaglio.caratteristiche?.COS) || 0;
    const t = d10();
    const vivo = t <= cos;
    if (!vivo) { bersaglio.morto = true; bersaglio.fuoriCombattimento = true; }
    esiti.push({
      tipo: 'salvezza', tiro: t, soglia: cos, superato: vivo,
      testo: vivo ? `sopravvive (salvezza ${t} su ${cos})` : `MUORE (salvezza ${t} su ${cos})`,
    });
  }
  if (bersaglio.ferite >= CASELLE_TOTALI) {
    bersaglio.morto = true;
    bersaglio.fuoriCombattimento = true;
    esiti.push({ tipo: 'fine', testo: 'ha esaurito la traccia dei danni' });
  }
  return esiti;
}

/** Somma dei modificatori scelti sull'azione. */
function sommaModificatori(idElencati) {
  const scelti = (idElencati || [])
    .map((id) => MODIFICATORI_TIRO.find((m) => m.id === id))
    .filter(Boolean);
  return { totale: scelti.reduce((a, m) => a + m.mod, 0), scelti };
}

/** Tiro d'attacco completo, con dettaglio dei termini. */
function tiroAttacco(comb, { abilita, precisione = 0, modificatori = 0, bonusAzione = 0 }) {
  const rif = rifEffettivo(comb.caratteristiche?.RIF, comb.ferite);
  const dado = d10Aperto();
  const totale = dado.totale + rif + abilita.livello + numero(precisione, 0) + modificatori + bonusAzione;
  return {
    totale,
    dado,
    termini: {
      dado: dado.totale, RIF: rif, abilita: abilita.livello,
      precisioneArma: numero(precisione, 0), modificatori, bonusAzione,
    },
  };
}

/** L'arma si e' inceppata? Si controlla solo su una papera. */
function inceppamento(arma, dado) {
  if (!dado.papera) return null;
  const soglia = SOGLIA_INCEPPAMENTO[String(arma?.affidabilita || 'ST').toUpperCase()] ?? 2;
  const tiro = d10();
  return tiro <= soglia ? { tiro, soglia } : null;
}

// --------------------------------------------------------------- attacchi --

/** Fuoco singolo, raffica da tre e fuoco automatico. */
function risolviFuoco(attaccante, bersaglio, azione, opzioni) {
  const def = azionePerId(azione.tipo);
  const arma = attaccante.armi?.[azione.armaIdx ?? 0];
  if (!arma) return { errore: `${attaccante.nome} non ha quell'arma.` };

  const gittata = numero(arma.gittata, 0);
  const distanza = Math.max(0, numero(azione.distanza, 10));
  const fascia = fasciaPerDistanza(distanza, gittata);
  if (fascia.oltre) {
    return { errore: `${distanza} m sono oltre la portata massima di ${arma.nome} (${gittata * 2} m).` };
  }

  const idx = azione.armaIdx ?? 0;
  if (attaccante.inceppate?.[idx]) {
    return { errore: `${arma.nome} e' inceppata: serve un'azione per sbloccarla.` };
  }

  const munizioni = attaccante.colpiInCanna?.[azione.armaIdx ?? 0];
  const disponibili = munizioni == null ? Infinity : munizioni;
  if (disponibili <= 0) return { errore: `${arma.nome} e' scarica.` };

  const cadenza = numero(arma.cadenza, 1) || 1;
  let colpiSparati = 1;
  if (azione.tipo === 'raffica') colpiSparati = 3;
  if (azione.tipo === 'automatico') {
    // Quanti colpi spendere: si puo' dichiarare meno della cadenza massima, ed
    // e' quasi sempre la scelta giusta. Svuotare il caricatore a ogni azione
    // lascia senza munizioni dopo due turni.
    const richiesti = numero(azione.colpi, 0) || cadenza;
    colpiSparati = Math.max(1, Math.min(cadenza, richiesti, disponibili));
  }
  if (azione.tipo === 'raffica' && disponibili < 3) {
    return { errore: `Per una raffica servono 3 colpi, in canna ce ne sono ${disponibili}.` };
  }

  const abilita = abilitaMigliore(attaccante, def.abilita);
  const mods = sommaModificatori(azione.modificatori);
  const mirato = (azione.modificatori || []).includes('mirato');
  // Il caricatore montato sull'arma, se il Master non dichiara altro.
  const munizione = azione.munizioni || arma.munizioni || 'normale';
  const tiro = tiroAttacco(attaccante, {
    abilita,
    precisione: arma.precisione,
    modificatori: mods.totale,
    bonusAzione: def.modTiro || 0,
  });

  // Le munizioni escono comunque, anche se il tiro fallisce o l'arma si inceppa.
  if (munizioni != null) attaccante.colpiInCanna[azione.armaIdx ?? 0] = Math.max(0, disponibili - colpiSparati);

  const bloccata = inceppamento(arma, tiro.dado);
  if (bloccata) {
    attaccante.inceppate = { ...(attaccante.inceppate || {}), [idx]: true };
    return {
      colpito: false, inceppata: true, tiro, fascia, abilita, colpiSparati,
      testo: `${attaccante.nome} spara con ${arma.nome} e l'arma si inceppa (${bloccata.tiro} su ${bloccata.soglia}).`,
    };
  }

  const scarto = tiro.totale - fascia.difficolta;
  if (scarto < 0) {
    return {
      colpito: false, tiro, fascia, abilita, colpiSparati, scarto,
      testo: `${attaccante.nome} manca ${bersaglio.nome} con ${arma.nome} ` +
             `(${tiro.totale} contro ${fascia.difficolta}, distanza ${fascia.nome.toLowerCase()}).`,
    };
  }

  // Quanti colpi vanno a segno.
  let aSegno = 1;
  if (azione.tipo === 'raffica') {
    aSegno = Math.max(1, Math.min(3, tiraNotazione('1D6/2').totale));
  } else if (azione.tipo === 'automatico') {
    aSegno = Math.max(1, Math.min(colpiSparati, scarto));
  }

  const colpi = [];
  const controlli = [];
  const feritePrima = Number(bersaglio.ferite) || 0;

  for (let i = 0; i < aSegno; i++) {
    if (bersaglio.morto) break;
    // Il colpo mirato vale per il primo proiettile; gli altri di una raffica
    // partono troppo in fretta perche' la mira regga.
    const scelta = mirato && i === 0 ? localizzazionePerId(azione.parte) : null;
    const loc = scelta || localizzazioneDaTiro(d10());
    const danno = tiraNotazione(arma.danni);
    const esito = applicaColpo(bersaglio, danno.totale, loc, munizione);
    colpi.push({ locazione: loc.nome, dadiDanno: danno.tiri, ...esito });
  }
  controlli.push(...controlliDopoIlDanno(bersaglio, feritePrima));

  const totInflitti = colpi.reduce((a, c) => a + c.inflitti, 0);
  const usurate = colpi.filter((c) => c.armaturaConsumata > 0);
  const dove = colpi.map((c) => c.locazione).join(', ');
  const conta = aSegno > 1 ? `${colpi.length} colpi a segno` : 'colpo a segno';
  const nota = usurate.length
    ? ` Armatura consumata: ${usurate.map((c) => `${c.locazione.toLowerCase()} a VP ${c.armaturaRimasta}`).join(', ')}.`
    : '';

  return {
    colpito: true, tiro, fascia, abilita, colpiSparati, scarto, colpi, controlli,
    danniTotali: totInflitti, munizione,
    testo: `${attaccante.nome} colpisce ${bersaglio.nome} con ${arma.nome}` +
           `${munizione !== 'normale' ? ` (${munizionePerId(munizione).nome.toLowerCase()})` : ''}: ` +
           `${conta} (${dove}), ${totInflitti} caselle.${nota} ${descriviStato(bersaglio)}` +
           (controlli.length ? ` ${bersaglio.nome} ${controlli.map((c) => c.testo).join(', ')}.` : ''),
  };
}

/** Corpo a corpo: confronto fra il tiro dell'attaccante e la difesa del bersaglio. */
function risolviMischia(attaccante, bersaglio, azione) {
  const def = azionePerId('mischia');
  const arma = azione.armaIdx != null && azione.armaIdx >= 0
    ? attaccante.armi?.[azione.armaIdx]
    : null;
  const manovra = arma ? null : (MANOVRE_NUDE.find((m) => m.id === azione.manovra) || MANOVRE_NUDE[0]);

  const abilita = abilitaMigliore(attaccante, arma ? def.abilita : ['Arti marziali', 'Lottare']);
  const mods = sommaModificatori(azione.modificatori);
  const tiro = tiroAttacco(attaccante, {
    abilita,
    precisione: arma?.precisione || 0,
    modificatori: mods.totale,
  });

  // Il bersaglio si difende sempre; se aveva dichiarato schivata o parata ha
  // speso il turno a farlo, e vale +3.
  const abilitaDifesa = abilitaMigliore(bersaglio, def.difesa);
  const bonusDifesa = bersaglio.difesa?.tipo === 'schiva' || bersaglio.difesa?.tipo === 'para' ? 3 : 0;
  const rifDif = rifEffettivo(bersaglio.caratteristiche?.RIF, bersaglio.ferite);
  const dadoDif = d10Aperto();
  const totaleDifesa = dadoDif.totale + rifDif + abilitaDifesa.livello + bonusDifesa;

  if (tiro.totale <= totaleDifesa) {
    return {
      colpito: false, tiro, difesa: { totale: totaleDifesa, dado: dadoDif, abilita: abilitaDifesa, bonus: bonusDifesa },
      testo: `${attaccante.nome} attacca ${bersaglio.nome} in corpo a corpo e viene fermato ` +
             `(${tiro.totale} contro ${totaleDifesa}${bonusDifesa ? ', difesa dichiarata' : ''}).`,
    };
  }

  const bonusDanno = bonusCostituzione(attaccante.caratteristiche?.COS).danno;
  const notazione = arma ? arma.danni : manovra.danni;
  const danno = tiraNotazione(notazione);
  const grezzi = Math.max(0, danno.totale + bonusDanno);
  const loc = localizzazionePerId(azione.parte) || localizzazioneDaTiro(d10());

  const feritePrima = Number(bersaglio.ferite) || 0;
  const esito = applicaColpo(bersaglio, grezzi, loc, 'normale');
  const controlli = controlliDopoIlDanno(bersaglio, feritePrima);

  const con = arma ? arma.nome : manovra.nome.toLowerCase();
  return {
    colpito: true, tiro, difesa: { totale: totaleDifesa, dado: dadoDif, abilita: abilitaDifesa, bonus: bonusDifesa },
    colpi: [{ locazione: loc.nome, dadiDanno: danno.tiri, bonusDanno, ...esito }],
    controlli, danniTotali: esito.inflitti,
    testo: `${attaccante.nome} colpisce ${bersaglio.nome} con ${con} (${loc.nome.toLowerCase()}): ` +
           `${esito.inflitti} caselle. ${descriviStato(bersaglio)}` +
           (controlli.length ? ` ${bersaglio.nome} ${controlli.map((c) => c.testo).join(', ')}.` : ''),
  };
}

/** Sbloccare un'arma inceppata: tiro di TEC contro difficolta' Normale. */
function risolviSblocco(attaccante, azione) {
  const def = azionePerId('sblocca');
  const idx = azione.armaIdx ?? 0;
  const arma = attaccante.armi?.[idx];
  if (!arma) return { errore: 'Arma non trovata.' };
  if (!attaccante.inceppate?.[idx]) return { errore: `${arma.nome} non e' inceppata.` };

  const abilita = abilitaMigliore(attaccante, def.abilita);
  const tec = Number(attaccante.caratteristiche?.TEC) || 0;
  const dado = d10Aperto();
  const totale = dado.totale + tec + abilita.livello;
  const riuscito = totale >= def.difficolta;
  if (riuscito) {
    const restanti = { ...attaccante.inceppate };
    delete restanti[idx];
    attaccante.inceppate = restanti;
  }
  return {
    riuscito, tiro: { totale, dado, termini: { dado: dado.totale, TEC: tec, abilita: abilita.livello } },
    testo: riuscito
      ? `${attaccante.nome} libera ${arma.nome} (${totale} contro ${def.difficolta}).`
      : `${attaccante.nome} armeggia con ${arma.nome} senza riuscirci (${totale} contro ${def.difficolta}).`,
  };
}

/** Azioni difensive: non tirano nulla, impostano uno stato fino al turno dopo. */
function risolviDifesa(attaccante, azione) {
  if (azione.tipo === 'riparo') {
    const r = riparoPerId(azione.riparo);
    attaccante.riparo = r.id;
    return { testo: `${attaccante.nome} si mette al riparo: ${r.nome.toLowerCase()} (VP ${r.vp}).` };
  }
  const def = azionePerId(azione.tipo);
  const abilita = abilitaMigliore(attaccante, def.abilita);
  attaccante.difesa = { tipo: azione.tipo, abilita: abilita.nome, livello: abilita.livello };
  const come = azione.tipo === 'schiva' ? 'a schivare' : 'a parare';
  return {
    testo: `${attaccante.nome} si prepara ${come} con ${abilita.nome} ${abilita.livello}. ` +
           `Fino al suo prossimo turno chi lo attacca in corpo a corpo trova +3 di difesa.`,
  };
}

export function descriviStato(comb) {
  if (comb.morto) return `${comb.nome} e' fuori combattimento.`;
  const g = gradoFerita(comb.ferite);
  if (!g) return `${comb.nome} e' illeso.`;
  return `${comb.nome}: ${comb.ferite}/${CASELLE_TOTALI}, ${g.grado.toLowerCase()}${comb.stordito ? ', stordito' : ''}.`;
}

/**
 * Punto d'ingresso: risolve un'azione e restituisce la voce di diario.
 * `scontro` viene modificato.
 */
export function risolviAzione(scontro, azione) {
  const trova = (id) => scontro.combattenti.find((c) => c.id === id);
  const attaccante = trova(azione.attaccante);
  if (!attaccante) return { errore: 'Combattente non trovato.' };
  if (attaccante.fuoriCombattimento) return { errore: `${attaccante.nome} e' fuori combattimento.` };

  const def = azionePerId(azione.tipo);
  if (!def) return { errore: `Azione sconosciuta: ${azione.tipo}` };

  // Chi agisce non e' piu' in posizione difensiva.
  attaccante.difesa = null;

  let esito;
  if (def.categoria === 'utilita') {
    esito = risolviSblocco(attaccante, azione);
    if (esito.errore) return esito;
  } else if (def.categoria === 'difesa') {
    esito = risolviDifesa(attaccante, azione);
  } else {
    const bersaglio = trova(azione.bersaglio);
    if (!bersaglio) return { errore: 'Bersaglio non trovato.' };
    if (bersaglio.fuoriCombattimento) return { errore: `${bersaglio.nome} e' gia' fuori combattimento.` };
    if (bersaglio.id === attaccante.id) return { errore: 'Un combattente non puo\' prendere di mira se stesso.' };

    esito = def.aDistanza
      ? risolviFuoco(attaccante, bersaglio, azione, {})
      : risolviMischia(attaccante, bersaglio, azione);
    if (esito.errore) return esito;
    esito.bersaglio = bersaglio.id;
  }

  // Lo stordimento dura un turno: si perde il proprio, poi passa.
  if (attaccante.stordito) attaccante.stordito = false;

  return {
    round: scontro.round,
    attaccante: attaccante.id,
    azione: azione.tipo,
    nomeAzione: def.nome,
    ...esito,
  };
}
