import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { svolgiTurno, CASELLE_TOTALI, armaturaPerLocazione } from '../server/combat/index.js';
import { ARMI, scheda, png, arena, rimetti, tocca } from './aiuti.js';

const ripeti = (n, fn) => { for (let i = 0; i < n; i++) fn(i); };

describe('risoluzione del combattimento', () => {
  describe('armatura per locazione', () => {
    test('due pezzi sulla stessa parte non si sommano: vale il migliore', () => {
      const vp = armaturaPerLocazione([
        { nome: 'Kevlar medio', vp: 14, copre: 'Tronco' },
        { nome: 'Maglietta di kevlar', vp: 4, copre: 'Tronco' },
      ]);
      assert.equal(vp.tronco, 14, 'sovrapporre kevlar non raddoppia la protezione');
    });

    test('"Tutto il corpo" copre ogni locazione', () => {
      const vp = armaturaPerLocazione([{ nome: 'Armatura medievale', vp: 14, copre: 'Tutto il corpo' }]);
      assert.ok(Object.values(vp).every((v) => v === 14));
    });

    test('"Solo danni da fuoco" non ferma i proiettili', () => {
      const vp = armaturaPerLocazione([{ nome: 'Salamandra', vp: 20, copre: 'Solo danni da fuoco' }]);
      assert.ok(Object.values(vp).every((v) => v === 0), 'non protegge dalle armi');
    });

    test('le parti non coperte restano a zero', () => {
      const vp = armaturaPerLocazione([{ nome: 'Elmetto', vp: 20, copre: 'Testa' }]);
      assert.equal(vp.testa, 20);
      assert.equal(vp.tronco, 0);
      assert.equal(vp.gambaDestra, 0);
    });
  });

  describe('fuoco', () => {
    test('oltre la portata massima il tiro e\' rifiutato, non mancato', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('Tiratrice', { abilita: { Pistole: 5 }, armi: [ARMI.pistola] })],
        nemici: [png('Bersaglio')],
      });
      const r = svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 500 });
      assert.ok(r.errore, 'errore esplicito invece di un colpo a vuoto');
      assert.match(r.errore, /oltre la portata/);
    });

    test('un tiratore capace a distanza ravvicinata colpisce quasi sempre', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('Tiratrice', { car: { RIF: 9 }, abilita: { Pistole: 6 }, armi: [ARMI.pistola] })],
        nemici: [png('Bersaglio', { armaturaVP: 0 })],
      });
      let colpiti = 0;
      ripeti(300, () => {
        rimetti(pg[0]); rimetti(nemici[0]); tocca(scontro, pg[0]);
        const r = svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 10 });
        if (r.voce?.colpito) colpiti++;
      });
      assert.ok(colpiti > 240, `colpisce almeno l'80% delle volte (${colpiti}/300)`);
    });

    test('la difficolta\' cresce con la distanza e i colpi calano', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('Tiratrice', { car: { RIF: 6 }, abilita: { Pistole: 3 }, armi: [ARMI.pistola] })],
        nemici: [png('Bersaglio', { armaturaVP: 0 })],
      });
      const quotaA = (distanza) => {
        let colpiti = 0;
        ripeti(400, () => {
          rimetti(pg[0]); rimetti(nemici[0]); tocca(scontro, pg[0]);
          if (svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza }).voce?.colpito) colpiti++;
        });
        return colpiti / 400;
      };
      const vicino = quotaA(1), medio = quotaA(25), lontano = quotaA(90);
      assert.ok(vicino > medio, `bruciapelo (${vicino.toFixed(2)}) meglio di media distanza (${medio.toFixed(2)})`);
      assert.ok(medio > lontano, `media (${medio.toFixed(2)}) meglio di estrema (${lontano.toFixed(2)})`);
    });

    test('sparare consuma munizioni, e ad arma scarica il tiro e\' rifiutato', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('Tiratrice', { abilita: { Pistole: 5 }, armi: [{ ...ARMI.pistola, caricatore: 2 }] })],
        nemici: [png('Bersaglio', { COS: 10, armaturaVP: 40 })],
      });
      tocca(scontro, pg[0]);
      svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 10 });
      assert.equal(pg[0].colpiInCanna[0], 1);
      tocca(scontro, pg[0]);
      svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 10 });
      assert.equal(pg[0].colpiInCanna[0], 0);
      tocca(scontro, pg[0]);
      const r = svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 10 });
      assert.match(r.errore, /scarica/);
    });

    test('la raffica costa tre colpi e ne mette a segno da uno a tre', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('Tiratrice', { car: { RIF: 9 }, abilita: { Mitra: 7 }, armi: [ARMI.mitra] })],
        nemici: [png('Bersaglio', { armaturaVP: 0, COS: 10 })],
      });
      ripeti(80, () => {
        rimetti(pg[0]); rimetti(nemici[0]); tocca(scontro, pg[0]);
        const r = svolgiTurno(scontro, { tipo: 'raffica', bersaglio: nemici[0].id, armaIdx: 0, distanza: 20 });
        assert.equal(pg[0].colpiInCanna[0], 27, 'tre colpi sparati');
        if (r.voce?.colpito) {
          assert.ok(r.voce.colpi.length >= 1 && r.voce.colpi.length <= 3, `da 1 a 3 a segno, non ${r.voce.colpi.length}`);
        }
      });
    });

    test('la raffica e\' rifiutata se in canna non ci sono tre colpi', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('T', { abilita: { Mitra: 5 }, armi: [{ ...ARMI.mitra, caricatore: 2 }] })],
        nemici: [png('B')],
      });
      tocca(scontro, pg[0]);
      const r = svolgiTurno(scontro, { tipo: 'raffica', bersaglio: nemici[0].id, armaIdx: 0, distanza: 20 });
      assert.match(r.errore, /servono 3 colpi/);
    });

    test('il fuoco automatico spende solo i colpi dichiarati', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('T', { abilita: { Mitra: 5 }, armi: [ARMI.mitra] })],
        nemici: [png('B', { COS: 10, armaturaVP: 40 })],
      });
      tocca(scontro, pg[0]);
      svolgiTurno(scontro, { tipo: 'automatico', bersaglio: nemici[0].id, armaIdx: 0, distanza: 20, colpi: 10 });
      assert.equal(pg[0].colpiInCanna[0], 20, 'dieci colpi, non tutto il caricatore');
    });

    test('senza dichiarare i colpi, il fuoco automatico usa la cadenza piena', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('T', { abilita: { Mitra: 5 }, armi: [ARMI.mitra] })],
        nemici: [png('B', { COS: 10, armaturaVP: 40 })],
      });
      tocca(scontro, pg[0]);
      svolgiTurno(scontro, { tipo: 'automatico', bersaglio: nemici[0].id, armaIdx: 0, distanza: 20 });
      assert.equal(pg[0].colpiInCanna[0], 0, 'svuota il caricatore');
    });

    test('il colpo mirato va dove e\' stato mirato e la testa raddoppia', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('Cecchino', { car: { RIF: 10 }, abilita: { Pistole: 10 }, armi: [ARMI.pistola] })],
        nemici: [png('Bersaglio', { armaturaVP: 0, COS: 10 })],
      });
      let colpiti = 0, allaTesta = 0, somma = 0;
      ripeti(150, () => {
        rimetti(pg[0]); rimetti(nemici[0]); tocca(scontro, pg[0]);
        const r = svolgiTurno(scontro, {
          tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 5,
          modificatori: ['mirato'], parte: 'testa',
        });
        if (r.voce?.colpito) {
          colpiti++; somma += r.voce.danniTotali;
          if (r.voce.colpi[0].locazione === 'Testa') allaTesta++;
        }
      });
      assert.equal(allaTesta, colpiti, 'ogni colpo a segno arriva alla testa');
      assert.ok(somma / colpiti > 20, `il raddoppio si vede nel danno medio (${(somma / colpiti).toFixed(1)})`);
    });
  });

  describe('inceppamento', () => {
    test('un\'arma inceppata non spara finche\' non la si libera', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('T', { car: { TEC: 8 }, abilita: { Pistole: 3, 'Riparare armi': 5 }, armi: [{ ...ARMI.pistolaScadente, caricatore: 999 }] })],
        nemici: [png('Sacco', { COS: 10, armaturaVP: 50 })],
      });
      let inceppata = false;
      for (let i = 0; i < 600 && !inceppata; i++) {
        tocca(scontro, pg[0]);
        if (svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 10 }).voce?.inceppata) {
          inceppata = true;
        }
      }
      assert.ok(inceppata, 'un\'arma inaffidabile prima o poi si inceppa');
      assert.equal(pg[0].inceppate[0], true, 'lo stato resta registrato');

      tocca(scontro, pg[0]);
      const bloccato = svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 10 });
      assert.match(bloccato.errore, /inceppata/, 'il fuoco e\' rifiutato');

      let liberata = false;
      for (let i = 0; i < 40 && !liberata; i++) {
        tocca(scontro, pg[0]);
        if (svolgiTurno(scontro, { tipo: 'sblocca', armaIdx: 0 }).voce?.riuscito) liberata = true;
      }
      assert.ok(liberata, 'con un tiro di TEC si libera');
      tocca(scontro, pg[0]);
      assert.ok(!svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 10 }).errore,
        'e si torna a sparare');
    });

    test('sbloccare un\'arma che non e\' inceppata e\' un errore', () => {
      const { scontro, pg } = arena({
        pg: [scheda('T', { armi: [ARMI.pistola] })], nemici: [png('B')],
      });
      tocca(scontro, pg[0]);
      assert.match(svolgiTurno(scontro, { tipo: 'sblocca', armaIdx: 0 }).errore, /non e' inceppata/);
    });
  });

  describe('corpo a corpo', () => {
    test('il bersaglio si difende sempre, anche senza dichiararlo', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('Spadaccino', { abilita: { 'Armi bianche': 6 }, armi: [ARMI.katana] })],
        nemici: [png('Bersaglio')],
      });
      tocca(scontro, pg[0]);
      const r = svolgiTurno(scontro, { tipo: 'mischia', bersaglio: nemici[0].id, armaIdx: 0 });
      assert.ok(r.voce.difesa, 'c\'e\' sempre un tiro di difesa contrapposto');
      assert.equal(typeof r.voce.difesa.totale, 'number');
    });

    test('dichiarare la difesa la rende piu\' efficace', () => {
      const conta = (dichiara) => {
        let fermati = 0;
        ripeti(400, () => {
          const { scontro, pg, nemici } = arena({
            pg: [scheda('A', { abilita: { 'Armi bianche': 4 }, armi: [ARMI.katana] })],
            nemici: [png('B', { abilita: { 'Schivare - Divincolarsi': 4 } })],
          });
          if (dichiara) { tocca(scontro, nemici[0]); svolgiTurno(scontro, { tipo: 'schiva' }); }
          tocca(scontro, pg[0]);
          const r = svolgiTurno(scontro, { tipo: 'mischia', bersaglio: nemici[0].id, armaIdx: 0 });
          if (r.voce && !r.voce.colpito) fermati++;
        });
        return fermati;
      };
      const senza = conta(false), con = conta(true);
      assert.ok(con > senza, `dichiarare la difesa serve (${con} contro ${senza} su 400)`);
    });

    test('a mani nude si tira comunque, con pugno o calcio', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('Pugile', { car: { COS: 10 }, abilita: { Lottare: 6 } })],
        nemici: [png('B', { armaturaVP: 0, COS: 10 })],
      });
      let colpiti = 0;
      ripeti(100, () => {
        rimetti(pg[0]); rimetti(nemici[0]); tocca(scontro, pg[0]);
        const r = svolgiTurno(scontro, { tipo: 'mischia', bersaglio: nemici[0].id, armaIdx: -1, manovra: 'pugno' });
        if (r.voce?.colpito) colpiti++;
      });
      assert.ok(colpiti > 20, `qualche pugno arriva (${colpiti}/100)`);
    });
  });

  describe('difese e riparo', () => {
    test('schivare non protegge dai proiettili', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('T', { abilita: { Pistole: 5 }, armi: [ARMI.pistola] })],
        nemici: [png('B', { abilita: { 'Schivare - Divincolarsi': 9 } })],
      });
      tocca(scontro, nemici[0]);
      svolgiTurno(scontro, { tipo: 'schiva' });
      assert.equal(nemici[0].difesa.tipo, 'schiva');
      tocca(scontro, pg[0]);
      const r = svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 10 });
      assert.equal(r.voce.difesa, undefined, 'contro il fuoco non c\'e\' tiro di difesa');
    });

    test('piu\' il riparo e\' solido, meno danno passa', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('T', { car: { RIF: 9 }, abilita: { Pistole: 8 }, armi: [{ ...ARMI.pistola, caricatore: 999 }] })],
        nemici: [png('B', { armaturaVP: 0, COS: 10 })],
      });
      const medio = (riparo) => {
        let tot = 0;
        ripeti(250, () => {
          // Anche il tiratore va rimesso a posto: senza, la sua arma si inceppa
          // a meta' prova e da li' in poi ogni colpo viene rifiutato.
          rimetti(pg[0]); rimetti(nemici[0]); nemici[0].riparo = riparo; tocca(scontro, pg[0]);
          svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 10 });
          tot += nemici[0].ferite;
        });
        return tot / 250;
      };
      const scoperto = medio('nessuno'), leggero = medio('leggero'), pesante = medio('pesante');
      assert.ok(scoperto > leggero, `allo scoperto (${scoperto.toFixed(1)}) si prende piu\' che dietro un riparo leggero (${leggero.toFixed(1)})`);
      assert.ok(leggero > pesante, 'un riparo pesante protegge ancora di piu\'');
      assert.ok(pesante < 1, 'un muro ferma una pistola');
    });
  });

  describe('controlli sul bersaglio', () => {
    test('il danno accumulato porta a stordimento, morte e fine del combattimento', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('T', { car: { RIF: 10 }, abilita: { Pistole: 10 }, armi: [{ ...ARMI.pistola, caricatore: 999 }] })],
        nemici: [png('B', { armaturaVP: 0, COS: 5, FRE: 3 })],
      });
      let storditi = 0, morti = 0;
      ripeti(200, () => {
        rimetti(pg[0]); rimetti(nemici[0]); tocca(scontro, pg[0]);
        const r = svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 5 });
        if (r.voce?.controlli?.some((c) => c.tipo === 'stordimento' && !c.superato)) storditi++;
        if (nemici[0].morto) morti++;
      });
      assert.ok(storditi > 30, `lo stordimento scatta spesso (${storditi}/200)`);
      assert.ok(morti > 0, `un 12mm alla testa uccide (${morti}/200)`);
    });

    test('le ferite non superano mai le quaranta caselle', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('T', { car: { RIF: 10 }, abilita: { Mitra: 10 }, armi: [{ ...ARMI.mitra, caricatore: 999 }] })],
        nemici: [png('B', { armaturaVP: 0, COS: 10 })],
      });
      ripeti(60, () => {
        rimetti(pg[0]); tocca(scontro, pg[0]);
        svolgiTurno(scontro, { tipo: 'automatico', bersaglio: nemici[0].id, armaIdx: 0, distanza: 5, colpi: 30 });
        assert.ok(nemici[0].ferite <= CASELLE_TOTALI, `mai oltre ${CASELLE_TOTALI}: ${nemici[0].ferite}`);
      });
    });

    test('non si spara a chi e\' gia\' fuori combattimento, ne\' a se stessi', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('T', { abilita: { Pistole: 5 }, armi: [ARMI.pistola] })],
        nemici: [png('B')],
      });
      nemici[0].fuoriCombattimento = true;
      tocca(scontro, pg[0]);
      assert.match(svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 10 }).errore,
        /gia' fuori combattimento/);
      nemici[0].fuoriCombattimento = false;
      tocca(scontro, pg[0]);
      assert.match(svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: pg[0].id, armaIdx: 0, distanza: 10 }).errore,
        /se stesso/);
    });
  });
});
