import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { libreriaProgrammi, programmaDiLibreria, specDaVoce, spezzaFormula } from '../server/netrun/libreria.js';
import { calcolaProgramma, validaProgramma } from '../server/netrun/programma.js';

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let CATALOGO;
let LIBRERIA;
before(async () => {
  CATALOGO = JSON.parse(await fs.readFile(path.join(RADICE, 'server/data/programs.json'), 'utf8'));
  LIBRERIA = libreriaProgrammi(CATALOGO);
});

describe('libreria dei programmi del manuale', () => {
  describe('lettura delle formule', () => {
    test('spezza gli addendi anche dove manca un +', () => {
      // Due schede del PDF scrivono "Resistenza (3) Icona complessa (2)".
      const pezzi = spezzaFormula('Anti-IC (20) + Resistenza (3) Icona complessa (2) = Diff 25');
      assert.deepEqual(pezzi.map((p) => p.etichetta), ['Anti-IC', 'Resistenza', 'Icona complessa']);
      assert.deepEqual(pezzi.map((p) => p.valore), [20, 3, 2]);
    });

    test('tiene la nota fra parentesi accanto al numero', () => {
      const pezzi = spezzaFormula('Assassino (20) + For (2 perche\' mirato su un solo programma)');
      assert.equal(pezzi[1].valore, 2);
      assert.match(pezzi[1].nota, /mirato/);
    });

    test('legge i valori negativi: Usa e getta toglie difficolta\'', () => {
      const pezzi = spezzaFormula('Anti-sistema (15) + Usa e getta (-10) + For (9)');
      assert.equal(pezzi[1].valore, -10);
    });
  });

  describe('traduzione in programmi costruibili', () => {
    test('ogni programma del manuale diventa una specifica valida', () => {
      assert.equal(LIBRERIA.length, 62, 'il catalogo estratto ha 62 programmi');
      for (const p of LIBRERIA) {
        assert.equal(validaProgramma(p.spec), null, `${p.nome}: ${validaProgramma(p.spec)}`);
      }
    });

    test('nessuna etichetta della formula resta senza traduzione', () => {
      const orfane = LIBRERIA.filter((p) => p.sconosciute.length);
      assert.deepEqual(orfane.map((p) => `${p.nome}: ${p.sconosciute.join(', ')}`), []);
    });

    test('la difficolta\' ricalcolata torna, tranne dove il PDF sbaglia il conto', () => {
      // Otto schede del documento non sommano i propri addendi: la traduzione
      // e' giusta, e' l'aritmetica stampata a non tornare. Se questo numero
      // cambia, e' cambiato il convertitore, non il PDF.
      const divergenti = LIBRERIA.filter((p) => p.divergenza).map((p) => p.nome).sort();
      assert.deepEqual(divergenti, [
        'Alien Drone', 'Alien Queen', 'Big One', 'Bodyguard', 'Control Remote',
        'Hellfire', 'Hellwhistle', 'Imp Ii', 'Ninja', 'Sherlock Holmes', 'Stealth 2.0',
      ]);
      // I tre Demoni divergono per un motivo diverso dagli altri otto: la loro
      // formula non stampa la Funzione, che qui viene aggiunta dalla classe.
      for (const nome of ['Big One', 'Bodyguard', 'Imp Ii']) {
        const p = LIBRERIA.find((x) => x.nome === nome);
        assert.equal(p.funzioneDallaClasse, true);
        assert.equal(p.divergenza.calcolata - p.divergenza.stampata, 20, 'i 20 punti della Funzione Demone');
      }
      for (const p of LIBRERIA.filter((x) => !x.divergenza)) {
        assert.equal(p.difficolta, Number(CATALOGO.programmi.find((v) => v.nome === p.nome).difficolta),
          `${p.nome} deve tornare alla difficolta' stampata`);
      }
    });

    test('la somma degli addendi e\' sempre la difficolta\' calcolata', () => {
      for (const p of LIBRERIA) {
        const somma = calcolaProgramma(p.spec).voci.reduce((a, v) => a + v.diff, 0);
        assert.equal(Math.max(1, somma), p.difficolta, `${p.nome}`);
      }
    });

    test('una Forza ridotta viene riconosciuta come bersaglio ristretto', () => {
      const dog = LIBRERIA.find((p) => p.nome === 'Dog-Catcher');
      // "For (3 perche' contro un solo tipo di programmi)" su Forza 6.
      assert.equal(dog.spec.forza, 6);
      assert.equal(dog.spec.modoForza, 'specifico');
      assert.ok(dog.spec.bersaglio, 'un bersaglio ristretto deve dire contro cosa');

      const hell = LIBRERIA.find((p) => p.nome === 'Hellwhistle');
      assert.equal(hell.spec.modoForza, 'mirato', 'mirato su un solo programma');
    });

    test('dove Forza e formula non vanno d\'accordo comanda la formula', () => {
      // Big One e' un Demone: la Forza stampata (6) e' quella effettiva in
      // gioco, gia' scalata dei quattro sottoprogrammi. Quella costruita e' 10.
      const big = LIBRERIA.find((p) => p.nome === 'Big One');
      assert.equal(big.spec.forza, 10);
      // `stampata` conserva il valore grezzo del PDF: in una scheda e' "5/7".
      assert.deepEqual(big.forzaDiscorde, { stampata: '6', usata: 10 });
      const sotto = big.spec.variabili.find((v) => v.id === 'sottoprogrammi');
      assert.equal(sotto.quantita, 4, '20 di difficolta\' sono quattro sottoprogrammi');
      assert.equal(big.difficolta, 45 + 20, 'gli addendi stampati piu\' la Funzione che manca');
    });

    test('gli optional presi piu\' volte contano piu\' volte', () => {
      const doppio = LIBRERIA.find((p) => /x\s*2/i.test(p.formula));
      if (!doppio) return;   // il catalogo potrebbe non averne
      const somma = doppio.spec.funzioni.length + doppio.spec.optional.reduce((a, o) => a + (o.volte || 1), 0);
      assert.ok(somma > 1);
    });

    test('l\'Ottimizzato dimezza le UM anche qui', () => {
      const ottimizzati = LIBRERIA.filter((p) => p.spec.optional.some((o) => o.id === 'ottimizzato'));
      assert.ok(ottimizzati.length, 'nel catalogo ce n\'e\' almeno uno');
      for (const p of ottimizzati) {
        assert.ok(calcolaProgramma(p.spec).ottimizzato, `${p.nome} occupa meta' memoria`);
      }
    });
  });

  describe('ricerca per nome', () => {
    test('trova per nome e per alias, senza badare ad accenti e maiuscole', () => {
      assert.ok(programmaDiLibreria(CATALOGO, 'Patrol'));
      assert.ok(programmaDiLibreria(CATALOGO, 'pattuglia'), 'l\'alias italiano funziona');
      assert.ok(programmaDiLibreria(CATALOGO, 'RAPIDITA-inesistente') === null);
    });

    test('il programma trovato e\' pronto da caricare in un deck', () => {
      const spec = programmaDiLibreria(CATALOGO, 'Hellhound');
      if (!spec) return;
      assert.equal(validaProgramma(spec), null);
      assert.ok(calcolaProgramma(spec).forzaEffettiva > 0);
    });
  });
});
