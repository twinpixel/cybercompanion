import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { d, d6, d10, tira, d10Aperto, tiraNotazione, mescola, pescaDa } from '../server/lib/dadi.js';

/** Molti tiri servono a distinguere una distribuzione giusta da una fortunata. */
const CAMPIONE = 20_000;
const media = (fn, n = CAMPIONE) => {
  let t = 0;
  for (let i = 0; i < n; i++) t += fn();
  return t / n;
};
const vicina = (valore, atteso, tolleranza, messaggio) =>
  assert.ok(Math.abs(valore - atteso) <= tolleranza,
    `${messaggio}: ${valore.toFixed(3)}, atteso ${atteso} +-${tolleranza}`);

describe('dadi', () => {
  test('d(n) resta nell\'intervallo e copre tutte le facce', () => {
    const visti = new Set();
    for (let i = 0; i < 2000; i++) {
      const v = d(6);
      assert.ok(v >= 1 && v <= 6, `d6 fuori intervallo: ${v}`);
      assert.ok(Number.isInteger(v), 'i dadi danno interi');
      visti.add(v);
    }
    assert.equal(visti.size, 6, 'tutte e sei le facce escono');
  });

  test('d6 e d10 hanno la media attesa', () => {
    vicina(media(d6), 3.5, 0.1, 'media del d6');
    vicina(media(d10), 5.5, 0.15, 'media del d10');
  });

  test('tira(quanti, facce, mod) somma e applica il modificatore', () => {
    vicina(media(() => tira(3, 6)), 10.5, 0.2, 'media di 3d6');
    vicina(media(() => tira(2, 6, 5)), 12, 0.2, 'media di 2d6+5');
    assert.equal(tira(0, 6, 7), 7, 'zero dadi lascia solo il modificatore');
  });

  describe('d10 aperto', () => {
    test('la media resta 5.5 perche\' le esplosioni sono simmetriche', () => {
      vicina(media(() => d10Aperto().totale), 5.5, 0.2, 'media del d10 aperto');
    });

    test('critici e papere sono circa un decimo ciascuno', () => {
      let critici = 0, papere = 0;
      for (let i = 0; i < CAMPIONE; i++) {
        const r = d10Aperto();
        if (r.critico) critici++;
        if (r.papera) papere++;
      }
      vicina(critici / CAMPIONE, 0.1, 0.015, 'quota di critici');
      vicina(papere / CAMPIONE, 0.1, 0.015, 'quota di papere');
    });

    test('puo\' superare 10 e scendere sotto zero', () => {
      let max = -Infinity, min = Infinity;
      for (let i = 0; i < CAMPIONE; i++) {
        const t = d10Aperto().totale;
        max = Math.max(max, t);
        min = Math.min(min, t);
      }
      assert.ok(max > 10, `il tiro aperto supera il 10 (massimo visto: ${max})`);
      assert.ok(min < 1, `il tiro aperto scende sotto 1 (minimo visto: ${min})`);
    });

    test('il primo dado e\' sempre il primo dell\'elenco dei tiri', () => {
      for (let i = 0; i < 500; i++) {
        const r = d10Aperto();
        assert.equal(r.critico, r.tiri[0] === 10);
        assert.equal(r.papera, r.tiri[0] === 1);
      }
    });

    test('il numero di ritiri e\' limitato', () => {
      for (let i = 0; i < CAMPIONE; i++) {
        assert.ok(d10Aperto(3).tiri.length <= 4, 'al massimo il primo dado piu\' i ritiri concessi');
      }
    });
  });

  describe('notazione dei dadi', () => {
    // Il catalogo armi scrive i danni col calibro accanto: se la ricerca fosse
    // ancorata alla fine, ogni arma del gioco farebbe zero danni.
    const casi = [
      ['4D6+3', 17],
      ['4D6+3 (.454)', 17],
      ['2D6+1 (9mm)', 8],
      ['6D10 (.50BMG)', 33],
      ['1D6/2', 1.5],
      ['3d6', 10.5],
      ['1d6+2(4 VP*1/4)', 5.5],
    ];
    for (const [notazione, atteso] of casi) {
      test(`"${notazione}" ha media ${atteso}`, () => {
        vicina(media(() => tiraNotazione(notazione).totale, 8000), atteso, 0.35, notazione);
        assert.equal(tiraNotazione(notazione).valida, true);
      });
    }

    test('le notazioni non interpretabili sono segnalate, non zero silenzioso', () => {
      for (const s of ['Vernice/Droghe', 'NO', '', null, undefined, 'speciale']) {
        const r = tiraNotazione(s);
        assert.equal(r.valida, false, `"${s}" non e' una notazione`);
        assert.equal(r.totale, 0);
      }
    });

    test('la divisione arrotonda per difetto e non scende sotto zero', () => {
      for (let i = 0; i < 500; i++) {
        const r = tiraNotazione('1D6/2');
        assert.ok(r.totale >= 0 && r.totale <= 3, `1D6/2 fuori intervallo: ${r.totale}`);
      }
      assert.equal(tiraNotazione('1D6-100').totale, 0, 'un modificatore enorme non produce danni negativi');
    });
  });

  describe('utilita\'', () => {
    test('mescola non altera l\'originale e conserva gli elementi', () => {
      const originale = [1, 2, 3, 4, 5, 6, 7, 8];
      const copia = [...originale];
      const m = mescola(originale);
      assert.deepEqual(originale, copia, 'l\'array di partenza resta intatto');
      assert.deepEqual([...m].sort((a, b) => a - b), copia, 'stessi elementi');
    });

    test('mescola cambia davvero l\'ordine', () => {
      const base = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      let diversi = 0;
      for (let i = 0; i < 200; i++) {
        if (mescola(base).join() !== base.join()) diversi++;
      }
      assert.ok(diversi > 190, `mescola quasi sempre (${diversi}/200)`);
    });

    test('pescaDa copre tutto l\'array', () => {
      const arr = ['a', 'b', 'c', 'd'];
      const visti = new Set();
      for (let i = 0; i < 500; i++) visti.add(pescaDa(arr));
      assert.equal(visti.size, 4, 'ogni elemento prima o poi esce');
    });
  });
});
