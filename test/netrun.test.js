import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  programmaVuoto, calcolaProgramma, difficoltaModifica, tiroScrittura,
  validaProgramma, catalogoNetrun,
} from '../server/netrun/programma.js';
import {
  FUNZIONI, ICONE, OPTIONAL, OPTIONAL_VARIABILI, MODI_FORZA,
  umPerDifficolta, UM_MAX, FORZA_MAX,
} from '../server/netrun/tabelle.js';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalogo = JSON.parse(fs.readFileSync(path.join(RADICE, 'server/data/programs.json'), 'utf8'));

describe('tabelle del netrunning', () => {
  test('ogni funzione ha difficolta\', moltiplicatore di costo e descrizione', () => {
    for (const f of FUNZIONI) {
      assert.ok(f.id && f.nome && f.desc, `${f.id} incompleta`);
      assert.ok(Number.isInteger(f.diff) && f.diff > 0, `${f.id}: difficolta' non valida`);
      assert.ok(Number.isInteger(f.costo) && f.costo > 0, `${f.id}: moltiplicatore non valido`);
    }
  });

  test('il programma Nero e\' di gran lunga il piu\' caro', () => {
    const nero = FUNZIONI.find((f) => f.id === 'anti-operatore');
    const altri = FUNZIONI.filter((f) => f.id !== 'anti-operatore');
    assert.ok(altri.every((f) => f.costo < nero.costo), 'x25 contro tutti gli altri');
  });

  test('le icone costano da 1 a 5 e crescono col realismo', () => {
    const d = ICONE.map((i) => i.diff);
    assert.deepEqual(d, [1, 2, 3, 4, 5]);
  });

  test('gli optional hanno tutti un id univoco', () => {
    const ids = OPTIONAL.map((o) => o.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  test('"Usa e getta" e\' l\'unico optional che abbassa la difficolta\'', () => {
    const negativi = OPTIONAL.filter((o) => o.diff < 0);
    assert.deepEqual(negativi.map((o) => o.id), ['usaegetta']);
  });

  describe('unita\' di memoria', () => {
    // Dati letti dalle schede stampate nel PDF: difficolta' e UM insieme.
    const stampati = [[14, 1], [15, 1], [18, 2], [20, 2], [22, 3], [25, 3], [27, 4], [30, 4],
                      [32, 5], [35, 5], [38, 6], [40, 6], [44, 7], [45, 7], [50, 8], [54, 9]];
    for (const [diff, um] of stampati) {
      test(`difficolta' ${diff} occupa ${um} UM`, () => assert.equal(umPerDifficolta(diff), um));
    }

    test('la coda della tabella stampata nell\'espansione combacia', () => {
      for (const [diff, um] of [[41, 7], [46, 8], [51, 9], [56, 10], [61, 11], [66, 12], [71, 13]]) {
        assert.equal(umPerDifficolta(diff), um, `difficolta' ${diff}`);
      }
    });

    test('non si scende sotto 1 UM ne\' si supera il tetto', () => {
      assert.equal(umPerDifficolta(0), 1);
      assert.equal(umPerDifficolta(1), 1);
      assert.equal(umPerDifficolta(500), UM_MAX);
    });

    test('le UM non calano mai al crescere della difficolta\'', () => {
      let precedente = 0;
      for (let d = 1; d <= 200; d++) {
        const um = umPerDifficolta(d);
        assert.ok(um >= precedente, `difficolta' ${d}: le UM sono calate`);
        precedente = um;
      }
    });
  });
});

describe('costruzione dei programmi', () => {
  test('somma funzione, Forza, icona e optional', () => {
    const r = calcolaProgramma({
      funzioni: ['intrusione'], forza: 8, icona: 'semplice',
    });
    assert.equal(r.difficolta, 15 + 8 + 1, 'Intrusione 15 + Forza 8 + Icona 1');
    assert.equal(r.um, 3);
    assert.equal(r.costo, 24 * 10 * 1);
    assert.equal(r.voci.length, 3, 'ogni addendo e\' mostrato');
  });

  test('mostra ogni addendo con nome e valore, cosi\' il conto e\' verificabile', () => {
    const r = calcolaProgramma({ funzioni: ['anti-sistema'], forza: 7, icona: 'semplice', optional: ['rapidita'] });
    const nomi = r.voci.map((v) => v.nome);
    assert.ok(nomi.some((n) => /Anti-sistema/.test(n)));
    assert.ok(nomi.some((n) => /Forza 7/.test(n)));
    assert.ok(nomi.some((n) => /Rapidita/.test(n)));
    assert.equal(r.voci.reduce((a, v) => a + v.diff, 0), r.difficolta, 'gli addendi tornano col totale');
  });

  test('la Forza Mirata si divide per cinque, arrotondando per eccesso', () => {
    const generico = calcolaProgramma({ funzioni: ['assassino'], forza: 8, icona: 'semplice' });
    const mirato = calcolaProgramma({ funzioni: ['assassino'], forza: 8, icona: 'semplice', modoForza: 'mirato', bersaglio: 'Killer VIII' });
    assert.equal(generico.difficolta - mirato.difficolta, 8 - Math.ceil(8 / 5), 'a parita\' di Forza costa molto meno');
  });

  test('la Forza Specifica e la Variabile si dividono per due', () => {
    for (const modo of ['specifico', 'variabile']) {
      const r = calcolaProgramma({ funzioni: ['decifrazione'], forza: 7, icona: 'semplice', modoForza: modo, bersaglio: 'portali' });
      assert.equal(r.difficolta, 15 + Math.ceil(7 / 2) + 1, `modo ${modo}`);
    }
  });

  test('Ottimizzato dimezza le UM per eccesso ma non tocca il prezzo', () => {
    const base = { funzioni: ['intrusione'], forza: 4, icona: 'animata', optional: ['danno3d10'] };
    const senza = calcolaProgramma(base);
    const con = calcolaProgramma({ ...base, optional: [...base.optional, 'ottimizzato'] });
    assert.equal(con.difficolta, senza.difficolta + 10, 'costa dieci punti di difficolta\' in piu\'');
    assert.equal(con.um, Math.ceil(con.umBase / 2));
    assert.equal(con.ottimizzato, true);
    assert.equal(con.costo, con.difficolta * 10 * 1, 'il prezzo resta quello pieno');
  });

  test('"Usa e getta" rende il programma piu\' facile', () => {
    const base = { funzioni: ['anti-sistema'], forza: 9, icona: 'iperrealistica', optional: ['rapidita', 'danno1d10'] };
    const con = calcolaProgramma({ ...base, optional: [...base.optional, 'usaegetta'] });
    const senza = calcolaProgramma(base);
    assert.equal(senza.difficolta - con.difficolta, 10);
  });

  test('un optional preso piu\' volte conta piu\' volte', () => {
    const uno = calcolaProgramma({ funzioni: ['assassino'], forza: 5, icona: 'semplice', optional: [{ id: 'rapidita', volte: 1 }] });
    const tre = calcolaProgramma({ funzioni: ['assassino'], forza: 5, icona: 'semplice', optional: [{ id: 'rapidita', volte: 3 }] });
    assert.equal(tre.difficolta - uno.difficolta, 4, 'due Rapidita\' in piu\' a 2 punti l\'una');
  });

  test('gli optional variabili scalano con la quantita\'', () => {
    const r = calcolaProgramma({
      funzioni: ['utility'], forza: 3, icona: 'semplice',
      variabili: [{ id: 'trasporto', quantita: 30 }],
    });
    assert.equal(r.difficolta, 10 + 3 + 1 + 15, '30 UM di dati sono tre scatti da 5');
  });

  test('i sottoprogrammi di un Demone costano 5 l\'uno', () => {
    const due = calcolaProgramma({ funzioni: ['demone'], forza: 6, icona: 'animata', variabili: [{ id: 'sottoprogrammi', quantita: 2 }] });
    const cinque = calcolaProgramma({ funzioni: ['demone'], forza: 6, icona: 'animata', variabili: [{ id: 'sottoprogrammi', quantita: 5 }] });
    assert.equal(cinque.difficolta - due.difficolta, 15);
  });

  test('con piu\' Funzioni il prezzo segue la piu\' cara', () => {
    const r = calcolaProgramma({ funzioni: ['utility', 'anti-operatore'], forza: 3, icona: 'semplice' });
    assert.equal(r.moltiplicatoreCosto, 25, 'il Nero traina il prezzo');
    assert.equal(r.costo, r.difficolta * 10 * 25);
  });

  test('la Forza resta nei limiti anche se le si chiede di piu\'', () => {
    const su = calcolaProgramma({ funzioni: ['utility'], forza: 99, icona: 'semplice' });
    assert.equal(su.forzaEffettiva, FORZA_MAX);
    const giu = calcolaProgramma({ funzioni: ['utility'], forza: -5, icona: 'semplice' });
    assert.equal(giu.forzaEffettiva, 1);
  });

  test('un programma vuoto non fa cadere il calcolo', () => {
    const r = calcolaProgramma(programmaVuoto());
    assert.ok(r.difficolta >= 1);
    assert.ok(r.avvisi.some((a) => /senza Funzioni/.test(a)));
  });
});

describe('avvisi di coerenza', () => {
  const avvisiDi = (spec) => calcolaProgramma(spec).avvisi.join(' | ');

  test('un Assassino non Mirato non puo\' puntare Anti-IC o Neri', () => {
    assert.match(avvisiDi({ funzioni: ['assassino'], forza: 5, icona: 'semplice' }), /Mirata/);
    assert.doesNotMatch(
      avvisiDi({ funzioni: ['assassino'], forza: 5, icona: 'semplice', modoForza: 'mirato', bersaglio: 'Ninja' }),
      /Anti-IC o Neri/);
  });

  test('un Anti-IC non puo\' avere i danni potenziati', () => {
    assert.match(avvisiDi({ funzioni: ['anti-icona'], forza: 5, icona: 'semplice', optional: ['danno2d10'] }), /non puo' avere Danno/);
    assert.match(avvisiDi({ funzioni: ['anti-icona'], forza: 5, icona: 'semplice', optional: ['danno3d10'] }), /non puo' avere Danno/);
  });

  test('Intrusione e Neri non esistono in versione Specifica', () => {
    assert.match(avvisiDi({ funzioni: ['intrusione'], forza: 5, icona: 'semplice', modoForza: 'specifico', bersaglio: 'x' }), /Specifico/);
    assert.match(avvisiDi({ funzioni: ['anti-operatore'], forza: 5, icona: 'semplice', modoForza: 'specifico', bersaglio: 'x' }), /Specifico/);
  });

  test('Usa e getta e Auto-Reset si escludono', () => {
    assert.match(avvisiDi({ funzioni: ['utility'], forza: 3, icona: 'semplice', optional: ['usaegetta', 'autoreset'] }), /si escludono/);
  });

  test('togliere INT richiede Fiuto per tracciare il segnale', () => {
    assert.match(avvisiDi({ funzioni: ['anti-operatore'], forza: 5, icona: 'semplice', optional: ['int1d6'] }), /Fiuto/);
    assert.doesNotMatch(avvisiDi({ funzioni: ['anti-operatore'], forza: 5, icona: 'semplice', optional: ['int1d6', 'fiuto'] }), /Fiuto/);
  });

  test('una Forza Mirata senza bersaglio dichiarato viene segnalata', () => {
    assert.match(avvisiDi({ funzioni: ['assassino'], forza: 5, icona: 'semplice', modoForza: 'mirato' }), /bersaglio/);
  });

  test('un Demone con sottoprogrammi ricorda che la Forza cala', () => {
    assert.match(
      avvisiDi({ funzioni: ['demone'], forza: 8, icona: 'animata', variabili: [{ id: 'sottoprogrammi', quantita: 3 }] }),
      /Forza effettiva in gioco cala di 3, a 5/);
  });

  test('un programma corretto non produce avvisi', () => {
    assert.equal(avvisiDi({ funzioni: ['intrusione'], forza: 8, icona: 'semplice' }), '');
  });
});

describe('ricostruzione del catalogo del manuale', () => {
  test('il catalogo estratto non e\' vuoto e ha i valori stampati', () => {
    assert.ok(catalogo.programmi.length > 50, `attesi molti programmi, trovati ${catalogo.programmi.length}`);
    for (const p of catalogo.programmi) {
      assert.ok(p.nome && p.classe && p.formula, `${p.nome}: voce incompleta`);
      assert.ok(p.difficolta > 0 && p.um > 0 && p.costo > 0, `${p.nome}: valori mancanti`);
    }
  });

  test('le UM calcolate seguono la formula, per ogni programma', () => {
    for (const p of catalogo.programmi) {
      const ottimizzato = /ttimizzat/i.test(p.formula);
      const attese = ottimizzato ? Math.ceil(umPerDifficolta(p.difficolta) / 2) : umPerDifficolta(p.difficolta);
      assert.equal(p.umCalcolate, attese, `${p.nome}: Diff ${p.difficolta}`);
    }
  });

  test('il prezzo calcolato segue difficolta\' x10 x moltiplicatore della Funzione', () => {
    const perClasse = new Map(FUNZIONI.map((f) => [f.id, f.costo]));
    for (const p of catalogo.programmi) {
      const molt = perClasse.get(p.classe);
      assert.ok(molt, `${p.nome}: classe "${p.classe}" senza moltiplicatore`);
      assert.equal(p.costoCalcolato, p.difficolta * 10 * molt, `${p.nome}`);
    }
  });

  test('le divergenze col PDF sono marcate, non nascoste', () => {
    // Il documento e' amatoriale e qualche scheda ha errori di conto: dove il
    // valore stampato non torna, la voce conserva entrambi e lo dichiara.
    for (const p of catalogo.programmi) {
      const attesi = [];
      if (p.umCalcolate !== p.um) attesi.push('um');
      if (p.costoCalcolato !== p.costo) attesi.push('costo');
      assert.deepEqual(p.divergenze || [], attesi, `${p.nome}: le divergenze devono essere dichiarate`);
    }
    const conDivergenze = catalogo.programmi.filter((p) => p.divergenze);
    assert.ok(conDivergenze.length < catalogo.programmi.length / 2,
      `le divergenze restano l'eccezione (${conDivergenze.length} su ${catalogo.programmi.length})`);
  });

  test('ogni classe del catalogo corrisponde a una Funzione conosciuta', () => {
    const note = new Set(FUNZIONI.map((f) => f.id));
    const ignote = [...new Set(catalogo.programmi.map((p) => p.classe))].filter((c) => !note.has(c));
    assert.deepEqual(ignote, [], `classi non riconosciute: ${ignote.join(', ')}`);
  });
});

describe('modifica di un programma', () => {
  const base = { funzioni: ['intrusione'], forza: 5, icona: 'semplice' };

  test('un ritocco costa lo scarto, ma mai meno di un quarto del nuovo', () => {
    const r = difficoltaModifica(base, { ...base, forza: 6 });
    assert.equal(r.scarto, 1);
    assert.equal(r.difficolta, r.minimo, 'lo scarto e\' minore del minimo, quindi vince il minimo');
    assert.ok(r.difficolta > 1);
  });

  test('un cambiamento grosso costa lo scarto', () => {
    const r = difficoltaModifica(base, { ...base, forza: 15, optional: ['danno3d10', 'ia'] });
    assert.equal(r.difficolta, r.scarto, 'lo scarto supera il minimo');
    assert.ok(r.dopo > r.prima);
  });

  test('non cambiare niente costa comunque qualcosa', () => {
    const r = difficoltaModifica(base, base);
    assert.equal(r.scarto, 0);
    assert.ok(r.difficolta > 0, 'rimettere le mani in un programma non e\' gratis');
  });
});

describe('scrittura del programma', () => {
  test('un bravo programmatore riesce quasi sempre su un programma semplice', () => {
    // Con INT 9 e Programmare 8 servirebbe un d10 sopra -2, ma il dado e'
    // aperto verso il basso: una papera seguita da altri tiri alti puo' far
    // fallire anche un maestro. La soglia tiene conto di quella coda.
    let riusciti = 0;
    for (let i = 0; i < 400; i++) {
      if (tiroScrittura({ INT: 9, programmare: 8 }, 15).riuscito) riusciti++;
    }
    assert.ok(riusciti > 350, `${riusciti}/400`);
  });

  test('un principiante fallisce quasi sempre su un programma difficile', () => {
    let riusciti = 0;
    for (let i = 0; i < 400; i++) {
      if (tiroScrittura({ INT: 4, programmare: 1 }, 50).riuscito) riusciti++;
    }
    assert.ok(riusciti < 20, `${riusciti}/400`);
  });

  test('chi supera di molto la soglia ci mette meno tempo', () => {
    const giorniMedi = (INT, prog, diff) => {
      let tot = 0, n = 0;
      for (let i = 0; i < 400; i++) {
        const r = tiroScrittura({ INT, programmare: prog }, diff);
        if (r.riuscito) { tot += r.giorni; n++; }
      }
      return tot / Math.max(1, n);
    };
    const maestro = giorniMedi(10, 10, 20);
    const mediocre = giorniMedi(6, 3, 20);
    assert.ok(maestro < mediocre, `il maestro ci mette meno (${maestro.toFixed(1)} contro ${mediocre.toFixed(1)} giorni)`);
  });

  test('un fallimento non produce giorni', () => {
    for (let i = 0; i < 200; i++) {
      const r = tiroScrittura({ INT: 1, programmare: 0 }, 90);
      if (!r.riuscito) {
        assert.equal(r.giorni, null);
        assert.match(r.testo, /Fallito/);
      }
    }
  });

  test('il tiro mostra i suoi termini', () => {
    const r = tiroScrittura({ INT: 7, programmare: 5 }, 20);
    assert.equal(r.termini.INT, 7);
    assert.equal(r.termini.programmare, 5);
    assert.equal(r.totale, r.termini.dado + 7 + 5);
  });
});

describe('validazione', () => {
  const valido = { nome: 'Test', funzioni: ['intrusione'], forza: 5, icona: 'semplice', modoForza: 'normale' };

  test('un programma completo passa', () => assert.equal(validaProgramma(valido), null));

  test('respinge cio\' che non sta in piedi', () => {
    assert.match(validaProgramma(null), /mancante/);
    assert.match(validaProgramma({ ...valido, nome: '' }), /nome/);
    assert.match(validaProgramma({ ...valido, funzioni: [] }), /almeno una Funzione/);
    assert.match(validaProgramma({ ...valido, funzioni: ['inventata'] }), /Funzione sconosciuta/);
    assert.match(validaProgramma({ ...valido, forza: 99 }), /Forza/);
    assert.match(validaProgramma({ ...valido, icona: 'olografica' }), /Icona sconosciuta/);
    assert.match(validaProgramma({ ...valido, optional: ['teletrasporto'] }), /Optional sconosciuto/);
    assert.match(validaProgramma({ ...valido, variabili: [{ id: 'boh', quantita: 1 }] }), /variabile sconosciuto/);
  });
});

describe('catalogo per il client', () => {
  test('contiene tutto cio\' che serve a costruire un programma', () => {
    const c = catalogoNetrun();
    assert.equal(c.funzioni.length, FUNZIONI.length);
    assert.equal(c.icone.length, ICONE.length);
    assert.equal(c.optional.length, OPTIONAL.length);
    assert.equal(c.variabili.length, OPTIONAL_VARIABILI.length);
    assert.equal(c.modiForza.length, MODI_FORZA.length);
    assert.ok(c.forza.min >= 1 && c.forza.max === FORZA_MAX);
  });
});
