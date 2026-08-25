import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { svolgiTurno } from '../server/combat/index.js';
import { ARMI, scheda, png, arena, rimetti, tocca } from './aiuti.js';

const ripeti = (n, fn) => { for (let i = 0; i < n; i++) fn(i); };

/** Media del danno inflitto con un certo tipo di munizione contro una certa armatura. */
function dannoMedio({ munizioni, armaturaVP, prove = 400, arma = ARMI.pistola }) {
  const { scontro, pg, nemici } = arena({
    pg: [scheda('T', { car: { RIF: 10 }, abilita: { Pistole: 10 }, armi: [{ ...arma, caricatore: 9999, affidabilita: 'MA' }] })],
    nemici: [png('B', { armaturaVP, COS: 10, FRE: 10 })],
  });
  let tot = 0, colpiti = 0;
  ripeti(prove, () => {
    rimetti(pg[0]); rimetti(nemici[0]); tocca(scontro, pg[0]);
    const r = svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 5, munizioni });
    if (r.voce?.colpito) { colpiti++; tot += r.voce.danniTotali; }
  });
  return { medio: tot / Math.max(1, colpiti), colpiti };
}

describe('tipi di munizione', () => {
  test('contro un bersaglio senza armatura le dirompenti fanno il doppio e le perforanti la meta\'', () => {
    const normale = dannoMedio({ munizioni: 'normale', armaturaVP: 0 }).medio;
    const perf = dannoMedio({ munizioni: 'perforante', armaturaVP: 0 }).medio;
    const dir = dannoMedio({ munizioni: 'dirompente', armaturaVP: 0 }).medio;
    assert.ok(perf < normale, `perforanti (${perf.toFixed(1)}) sotto le normali (${normale.toFixed(1)})`);
    assert.ok(dir > normale, `dirompenti (${dir.toFixed(1)}) sopra le normali (${normale.toFixed(1)})`);
    // Le proporzioni non sono esatte perche' il bonus di Costituzione si applica
    // dopo, uguale per tutti: si controlla il verso e l'ordine di grandezza.
    assert.ok(dir > perf * 2.5, 'lo scarto fra i due estremi e\' netto');
  });

  test('contro un\'armatura pesante le perforanti passano dove le altre no', () => {
    const normale = dannoMedio({ munizioni: 'normale', armaturaVP: 14 }).medio;
    const perf = dannoMedio({ munizioni: 'perforante', armaturaVP: 14 }).medio;
    const dir = dannoMedio({ munizioni: 'dirompente', armaturaVP: 14 }).medio;
    assert.ok(perf > normale, `perforanti (${perf.toFixed(1)}) battono le normali contro il kevlar (${normale.toFixed(1)})`);
    assert.ok(dir < normale, `le dirompenti (${dir.toFixed(1)}) sono le peggiori contro l'armatura`);
  });

  test('le perforanti sono un compromesso: meglio contro l\'armatura, peggio sulla carne', () => {
    const scoperto = dannoMedio({ munizioni: 'perforante', armaturaVP: 0 }).medio;
    const corazzato = dannoMedio({ munizioni: 'perforante', armaturaVP: 14 }).medio;
    const normScoperto = dannoMedio({ munizioni: 'normale', armaturaVP: 0 }).medio;
    const normCorazzato = dannoMedio({ munizioni: 'normale', armaturaVP: 14 }).medio;
    assert.ok(scoperto < normScoperto, 'sulla carne scoperta rendono meno');
    assert.ok(corazzato > normCorazzato, 'contro l\'armatura rendono di piu\'');
  });

  test('senza dichiarare nulla si usano le normali', () => {
    const { scontro, pg, nemici } = arena({
      pg: [scheda('T', { car: { RIF: 10 }, abilita: { Pistole: 8 }, armi: [ARMI.pistola] })],
      nemici: [png('B', { armaturaVP: 0 })],
    });
    tocca(scontro, pg[0]);
    const r = svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 5 });
    if (r.voce?.colpito) assert.equal(r.voce.munizione, 'normale');
  });

  test('il tipo di munizione compare nel diario solo quando non e\' quello comune', () => {
    const { scontro, pg, nemici } = arena({
      pg: [scheda('T', { car: { RIF: 10 }, abilita: { Pistole: 10 }, armi: [{ ...ARMI.pistola, caricatore: 999 }] })],
      nemici: [png('B', { armaturaVP: 0, COS: 10 })],
    });
    const testoCon = (munizioni) => {
      for (let i = 0; i < 30; i++) {
        rimetti(pg[0]); rimetti(nemici[0]); tocca(scontro, pg[0]);
        const r = svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 5, munizioni });
        if (r.voce?.colpito) return r.voce.testo;
      }
      return '';
    };
    assert.ok(!/perforanti|dirompenti/i.test(testoCon('normale')), 'le normali non si annunciano');
    assert.match(testoCon('perforante'), /perforanti/i);
    assert.match(testoCon('dirompente'), /dirompenti/i);
  });
});

describe('usura delle armature', () => {
  test('ogni colpo che passa consuma un punto di VP nel punto colpito', () => {
    const { scontro, pg, nemici } = arena({
      pg: [scheda('T', { car: { RIF: 10 }, abilita: { Pistole: 10 }, armi: [{ ...ARMI.pistola, caricatore: 999 }] })],
      nemici: [png('B', { armaturaVP: 10, COS: 10, FRE: 10 })],
    });
    let passati = 0;
    const vpPrima = nemici[0].armatura.tronco;
    ripeti(60, () => {
      rimetti(pg[0]); tocca(scontro, pg[0]);
      nemici[0].ferite = 0; nemici[0].morto = false; nemici[0].fuoriCombattimento = false;
      const r = svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 5, parte: 'tronco', modificatori: ['mirato'] });
      if (r.voce?.colpito && r.voce.colpi[0].passato) passati++;
    });
    const consumato = vpPrima - nemici[0].armatura.tronco;
    assert.ok(passati > 0, 'qualche colpo e\' passato');
    assert.equal(consumato, Math.min(vpPrima, passati), `un punto per colpo passato (${passati} passati, ${consumato} consumati)`);
  });

  test('tre colpi fermati consumano un punto di VP', () => {
    // Pistola debole contro armatura pesante: nessun colpo passa.
    const debole = { ...ARMI.pistola, danni: '1D6', caricatore: 999 };
    const { scontro, pg, nemici } = arena({
      pg: [scheda('T', { car: { RIF: 10 }, abilita: { Pistole: 10 }, armi: [debole] })],
      nemici: [png('B', { armaturaVP: 20, COS: 10, FRE: 10 })],
    });
    const vpPrima = nemici[0].armatura.tronco;
    let fermati = 0;
    ripeti(30, () => {
      rimetti(pg[0]); tocca(scontro, pg[0]);
      const r = svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 5, parte: 'tronco', modificatori: ['mirato'] });
      if (r.voce?.colpito) {
        assert.equal(r.voce.colpi[0].passato, false, 'con 1D6 contro VP 20 non passa niente');
        fermati++;
      }
    });
    const consumato = vpPrima - nemici[0].armatura.tronco;
    assert.equal(consumato, Math.floor(fermati / 3), `un punto ogni tre colpi fermati (${fermati} fermati, ${consumato} punti)`);
  });

  test('le dirompenti consumano l\'armatura la meta\'', () => {
    const consumoCon = (munizioni) => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('T', { car: { RIF: 10 }, abilita: { Pistole: 10 }, armi: [{ ...ARMI.pistola, caricatore: 999 }] })],
        nemici: [png('B', { armaturaVP: 30, COS: 10, FRE: 10 })],
      });
      const prima = nemici[0].armatura.tronco;
      ripeti(40, () => {
        rimetti(pg[0]); tocca(scontro, pg[0]);
        nemici[0].ferite = 0; nemici[0].morto = false; nemici[0].fuoriCombattimento = false;
        svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 5, parte: 'tronco', modificatori: ['mirato'], munizioni });
      });
      return prima - nemici[0].armatura.tronco;
    };
    const normale = consumoCon('normale');
    const dirompente = consumoCon('dirompente');
    assert.ok(normale > 0, 'le normali consumano');
    assert.ok(dirompente < normale, `le dirompenti consumano meno (${dirompente} contro ${normale})`);
  });

  test('l\'armatura non scende sotto zero e si consuma solo dove viene colpita', () => {
    const { scontro, pg, nemici } = arena({
      pg: [scheda('T', { car: { RIF: 10 }, abilita: { Pistole: 10 }, armi: [{ ...ARMI.pistola, caricatore: 9999 }] })],
      nemici: [png('B', { armaturaVP: 3, COS: 10, FRE: 10 })],
    });
    ripeti(100, () => {
      rimetti(pg[0]); tocca(scontro, pg[0]);
      nemici[0].ferite = 0; nemici[0].morto = false; nemici[0].fuoriCombattimento = false;
      svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 5, parte: 'braccioDestro', modificatori: ['mirato'] });
    });
    assert.equal(nemici[0].armatura.braccioDestro, 0, 'il braccio colpito resta senza protezione');
    assert.equal(nemici[0].armatura.gambaSinistra, 3, 'la gamba mai colpita e\' intatta');
    assert.ok(Object.values(nemici[0].armatura).every((v) => v >= 0), 'mai valori negativi');
  });

  test('il riparo non si consuma: non e\' addosso al bersaglio', () => {
    const { scontro, pg, nemici } = arena({
      pg: [scheda('T', { car: { RIF: 10 }, abilita: { Pistole: 10 }, armi: [{ ...ARMI.pistola, caricatore: 999 }] })],
      nemici: [png('B', { armaturaVP: 0, COS: 10, FRE: 10 })],
    });
    nemici[0].riparo = 'pesante';
    ripeti(40, () => {
      rimetti(pg[0]); tocca(scontro, pg[0]);
      nemici[0].riparo = 'pesante';
      svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 5 });
    });
    assert.equal(nemici[0].riparo, 'pesante', 'il riparo regge');
    assert.equal(nemici[0].ferite, 0, 'e continua a fermare tutto');
  });
});
