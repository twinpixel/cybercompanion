import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { decidiAzione, descriviAzione, svolgiTurno, combattenteDaPng } from '../server/combat/index.js';
import { ARMI, png, arena } from './aiuti.js';

/** Conta quante volte ciascun tipo di azione viene proposto. */
function distribuzione(scontro, comb, prove = 300) {
  const conta = {};
  for (let i = 0; i < prove; i++) {
    const a = decidiAzione(scontro, comb);
    conta[a?.tipo || 'nulla'] = (conta[a?.tipo || 'nulla'] || 0) + 1;
  }
  return conta;
}

describe('scelta automatica dell\'azione', () => {
  test('con una pistola a media distanza spara colpi singoli', () => {
    const { scontro, nemici } = arena({ pg: [png('Eroe')], nemici: [png('T', { armi: [ARMI.pistola] })], distanza: 15 });
    const d = distribuzione(scontro, nemici[0]);
    assert.ok((d.fuoco || 0) > 250, `quasi sempre fuoco singolo: ${JSON.stringify(d)}`);
    assert.equal(d.raffica, undefined, 'una pistola non fa raffiche');
  });

  test('con un\'arma automatica alterna le tre modalita\'', () => {
    const { scontro, nemici } = arena({ pg: [png('Eroe')], nemici: [png('T', { armi: [ARMI.mitra] })], distanza: 30 });
    const d = distribuzione(scontro, nemici[0]);
    for (const tipo of ['fuoco', 'raffica', 'automatico']) {
      assert.ok(d[tipo] > 0, `usa anche "${tipo}": ${JSON.stringify(d)}`);
    }
    assert.ok(d.fuoco > d.automatico, 'il fuoco pieno resta l\'eccezione, non la regola');
  });

  test('il fuoco automatico non svuota il caricatore in un\'azione', () => {
    const { scontro, nemici } = arena({ pg: [png('Eroe')], nemici: [png('T', { armi: [ARMI.mitra] })], distanza: 30 });
    for (let i = 0; i < 300; i++) {
      const a = decidiAzione(scontro, nemici[0]);
      if (a.tipo === 'automatico') {
        assert.ok(a.colpi <= 10, `al massimo dieci colpi per volta, non ${a.colpi}`);
      }
    }
  });

  test('un\'arma automatica dura molti turni invece di finire in due', () => {
    // Il numero di turni e' casuale: dipende da quante volte esce il fuoco
    // pieno. Su una sola prova la coda bassa arriva a tre turni, quindi
    // l'asserzione sta sulla **mediana** di molte prove, che e' stabile.
    const turniPerCaricatore = () => {
      const { scontro, pg, nemici } = arena({
        pg: [png('Eroe', { armi: [] })], nemici: [png('T', { armi: [ARMI.mitra] })], distanza: 30,
      });
      let turni = 0;
      while ((nemici[0].colpiInCanna[0] ?? 0) > 0 && turni < 60) {
        turni++;
        scontro.indiceTurno = scontro.ordine.indexOf(nemici[0].id);
        pg[0].ferite = 0; pg[0].morto = false; pg[0].fuoriCombattimento = false;
        if (svolgiTurno(scontro, { tipo: 'auto' }).errore) break;
      }
      return turni;
    };

    const prove = Array.from({ length: 80 }, turniPerCaricatore).sort((a, b) => a - b);
    const mediana = prove[Math.floor(prove.length / 2)];
    assert.ok(mediana >= 7,
      `un caricatore da 30 dura in media parecchi turni, non due (mediana ${mediana}, minimo ${prove[0]})`);
    assert.ok(prove[0] >= 2, 'e nemmeno nel caso peggiore si svuota in un turno solo');
  });

  test('addosso e senza armi da fuoco va in corpo a corpo', () => {
    const { scontro, nemici } = arena({ pg: [png('Eroe')], nemici: [png('T', { armi: [ARMI.katana] })], distanza: 1 });
    const a = decidiAzione(scontro, nemici[0]);
    assert.equal(a.tipo, 'mischia');
    assert.equal(a.armaIdx, 0, 'usa la katana');
  });

  test('a mani nude sceglie pugno o calcio', () => {
    const { scontro, nemici } = arena({ pg: [png('Eroe')], nemici: [png('T', { armi: [] })], distanza: 1 });
    const visti = new Set();
    for (let i = 0; i < 100; i++) {
      const a = decidiAzione(scontro, nemici[0]);
      assert.equal(a.tipo, 'mischia');
      assert.equal(a.armaIdx, -1);
      visti.add(a.manovra);
    }
    assert.deepEqual([...visti].sort(), ['calcio', 'pugno'], 'usa entrambe');
  });

  test('con l\'arma inceppata cerca soprattutto di liberarla', () => {
    const { scontro, nemici } = arena({ pg: [png('Eroe')], nemici: [png('T', { armi: [ARMI.pistola] })], distanza: 15 });
    nemici[0].inceppate = { 0: true };
    const d = distribuzione(scontro, nemici[0]);
    assert.ok((d.sblocca || 0) > 150, `per lo piu' sblocca: ${JSON.stringify(d)}`);
  });

  test('senza munizioni e con il nemico lontano si mette al riparo', () => {
    const { scontro, nemici } = arena({ pg: [png('Eroe')], nemici: [png('T', { armi: [ARMI.pistola] })], distanza: 40 });
    nemici[0].colpiInCanna[0] = 0;
    const a = decidiAzione(scontro, nemici[0]);
    assert.equal(a.tipo, 'riparo', 'non carica a mani nude da quaranta metri');
  });

  test('non spara oltre la portata dell\'arma', () => {
    const { scontro, nemici } = arena({ pg: [png('Eroe')], nemici: [png('T', { armi: [ARMI.pistola] })], distanza: 300 });
    for (let i = 0; i < 50; i++) {
      const a = decidiAzione(scontro, nemici[0]);
      assert.notEqual(a.tipo, 'fuoco', 'una pistola non arriva a 300 m');
    }
  });

  test('sceglie l\'arma che arriva piu\' lontano', () => {
    const { scontro, nemici } = arena({
      pg: [png('Eroe')], nemici: [png('T', { armi: [ARMI.pistola, ARMI.mitra] })], distanza: 120,
    });
    const a = decidiAzione(scontro, nemici[0]);
    assert.equal(a.armaIdx, 1, 'a 120 m serve il mitra, non la pistola');
  });

  test('preferisce finire chi e\' gia\' ferito, ma non sempre', () => {
    const { scontro, pg, nemici } = arena({
      pg: [png('Sano'), png('Ferito')], nemici: [png('T', { armi: [ARMI.pistola] })], distanza: 15,
    });
    pg[1].ferite = 14;
    let suFerito = 0;
    for (let i = 0; i < 400; i++) {
      if (decidiAzione(scontro, nemici[0]).bersaglio === pg[1].id) suFerito++;
    }
    assert.ok(suFerito > 220, `bersaglia spesso il ferito (${suFerito}/400)`);
    assert.ok(suFerito < 380, 'ma resta imprevedibile');
  });

  test('senza nemici in piedi non propone nulla', () => {
    const { scontro, pg, nemici } = arena({ pg: [png('Eroe')], nemici: [png('T', { armi: [ARMI.pistola] })] });
    pg[0].fuoriCombattimento = true;
    assert.equal(decidiAzione(scontro, nemici[0]), null);
    assert.match(descriviAzione(scontro, null), /nessuna azione/);
  });

  test('la proposta e\' leggibile prima di essere eseguita', () => {
    const { scontro, nemici } = arena({ pg: [png('Eroe')], nemici: [png('T', { armi: [ARMI.pistola] })], distanza: 10 });
    const a = decidiAzione(scontro, nemici[0]);
    const testo = descriviAzione(scontro, a);
    assert.match(testo, /Eroe/, 'nomina il bersaglio');
    assert.ok(testo.length > 10, 'e dice cosa sta per fare');
  });

  test('"auto" risolve il turno e marca la voce come automatica', () => {
    const { scontro, nemici } = arena({ pg: [png('Eroe')], nemici: [png('T', { armi: [ARMI.pistola] })], distanza: 10 });
    scontro.indiceTurno = scontro.ordine.indexOf(nemici[0].id);
    const r = svolgiTurno(scontro, { tipo: 'auto' });
    assert.ok(!r.errore, r.errore);
    assert.equal(r.voce.automatica, true);
    assert.ok(r.voce.testo.length > 0, 'e finisce nel diario come le altre');
  });
});
