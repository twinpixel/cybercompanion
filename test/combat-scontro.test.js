import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  scontroVuoto, combattenteDaScheda, combattenteDaPng, tiraIniziativa,
  turnoCorrente, avanzaTurno, svolgiTurno, riepilogoFerite, squadreInPiedi,
  decidiAzione,
} from '../server/combat/index.js';
import { ARMI, scheda, png, arena, tocca } from './aiuti.js';

describe('svolgimento dello scontro', () => {
  describe('iniziativa', () => {
    test('l\'ordine e\' decrescente e comprende tutti', () => {
      const s = scontroVuoto();
      s.combattenti = [
        combattenteDaScheda(scheda('A', { car: { RIF: 9 } }), 'a', 'pg'),
        combattenteDaPng(png('B', { RIF: 4 }), 'nemici', 0),
        combattenteDaPng(png('C', { RIF: 7 }), 'nemici', 1),
      ];
      tiraIniziativa(s);
      assert.equal(s.round, 1, 'si apre il primo round');
      assert.equal(s.ordine.length, 3);
      const valori = s.ordine.map((id) => s.combattenti.find((c) => c.id === id).iniziativa);
      assert.deepEqual(valori, [...valori].sort((a, b) => b - a), `decrescente: ${valori}`);
    });

    test('il Senso del combattimento si somma all\'iniziativa', () => {
      const conBonus = combattenteDaScheda(
        scheda('Solo', { abilita: { 'Senso del combattimento': 5 } }), 'a', 'pg');
      const senza = combattenteDaScheda(scheda('Altro'), 'b', 'pg');
      assert.equal(conBonus.bonusIniziativa, 5);
      assert.equal(senza.bonusIniziativa, 0);

      const s = scontroVuoto();
      s.combattenti = [conBonus, senza];
      let vinte = 0;
      for (let i = 0; i < 400; i++) {
        tiraIniziativa(s);
        if (s.ordine[0] === conBonus.id) vinte++;
      }
      assert.ok(vinte > 300, `chi ha il bonus vince quasi sempre (${vinte}/400)`);
    });

    test('le ferite abbassano l\'iniziativa', () => {
      const s = scontroVuoto();
      const sano = combattenteDaPng(png('Sano', { RIF: 8 }), 'pg', 0);
      const ferito = combattenteDaPng(png('Ferito', { RIF: 8 }), 'nemici', 0);
      ferito.ferite = 20;
      s.combattenti = [sano, ferito];
      let vinteDalSano = 0;
      for (let i = 0; i < 400; i++) {
        tiraIniziativa(s);
        if (s.ordine[0] === sano.id) vinteDalSano++;
      }
      assert.ok(vinteDalSano > 300, `chi e' illeso e' piu' rapido (${vinteDalSano}/400)`);
    });
  });

  describe('turni e round', () => {
    test('il turno passa da uno all\'altro e apre un round nuovo al giro', () => {
      const { scontro } = arena({ pg: [png('A'), png('B')], nemici: [png('C')] });
      assert.equal(scontro.round, 1);
      const primo = turnoCorrente(scontro).id;
      avanzaTurno(scontro);
      assert.notEqual(turnoCorrente(scontro).id, primo, 'tocca a un altro');
      avanzaTurno(scontro);
      assert.equal(scontro.round, 1, 'ancora nel primo round');
      avanzaTurno(scontro);
      assert.equal(scontro.round, 2, 'chiuso il giro, si apre il secondo');
      assert.equal(turnoCorrente(scontro).id, primo, 'e si riparte da chi ha l\'iniziativa migliore');
    });

    test('chi e\' fuori combattimento viene saltato', () => {
      const { scontro, pg, nemici } = arena({ pg: [png('A'), png('B')], nemici: [png('C')] });
      pg[1].fuoriCombattimento = true;
      const visti = [];
      for (let i = 0; i < 4; i++) { visti.push(turnoCorrente(scontro).id); avanzaTurno(scontro); }
      assert.ok(!visti.includes(pg[1].id), 'chi e\' a terra non agisce');
    });

    test('agire fuori dal proprio turno e\' rifiutato', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('A', { abilita: { Pistole: 5 }, armi: [ARMI.pistola] })],
        nemici: [png('B', { armi: [ARMI.pistola] })],
      });
      tocca(scontro, pg[0]);
      const r = svolgiTurno(scontro, { tipo: 'fuoco', attaccante: nemici[0].id, bersaglio: pg[0].id, armaIdx: 0, distanza: 10 });
      assert.match(r.errore, /Tocca a/, 'il motore fa rispettare l\'ordine');
    });

    test('senza iniziativa tirata non si agisce', () => {
      const s = scontroVuoto();
      s.combattenti = [combattenteDaPng(png('A'), 'pg', 0), combattenteDaPng(png('B'), 'nemici', 0)];
      assert.match(svolgiTurno(s, { tipo: 'riparo' }).errore, /iniziativa/);
    });
  });

  describe('conclusione', () => {
    test('quando resta una sola squadra il diario lo dichiara', () => {
      // Entrambi armati con armi affidabili e a portata: nessuno dei due ha
      // motivo di mettersi al riparo, quindi lo scontro si decide. Con armi che
      // si inceppano spesso il motore manda al riparo chi resta senza risposta,
      // e da li' non si esce piu' (vedi il test sullo stallo qui sotto).
      const { scontro, pg, nemici } = arena({
        pg: [scheda('Solo', { car: { RIF: 10 }, abilita: { Pistole: 10 }, armi: [{ ...ARMI.pistola, caricatore: 999 }] })],
        nemici: [png('T', { armaturaVP: 0, COS: 3, FRE: 3, abilita: { Pistole: 4 }, armi: [{ ...ARMI.pistola, caricatore: 999 }] })],
      });
      scontro.distanza = 5;
      let giri = 0;
      while (squadreInPiedi(scontro).length > 1 && giri < 200) {
        giri++;
        if (!turnoCorrente(scontro)) break;
        const r = svolgiTurno(scontro, { tipo: 'auto' });
        if (r.errore) break;
      }
      assert.ok(squadreInPiedi(scontro).length <= 1, 'lo scontro arriva a una conclusione');
      assert.ok(scontro.diario.some((v) => v.tipo === 'fine'), 'il diario lo registra');
    });

    test('chi non ha nulla con cui rispondere si mette al riparo e ci resta', () => {
      // Limite noto e voluto: il motore non modella gli spostamenti. Un
      // combattente senza armi utili a quella distanza si ripara, e da li' non
      // ha piu' niente da fare. Al tavolo lo sblocca il Master cambiando la
      // distanza dello scontro (POST /api/encounters/:id/distanza).
      const { scontro, nemici } = arena({
        pg: [scheda('Solo', { car: { RIF: 10 }, abilita: { Pistole: 10 }, armi: [ARMI.pistola] })],
        nemici: [png('Disarmato', { armaturaVP: 0, armi: [] })],
      });
      scontro.distanza = 30;

      assert.equal(decidiAzione(scontro, nemici[0]).tipo, 'riparo',
        'da trenta metri e senza armi non puo\' fare altro');

      scontro.indiceTurno = scontro.ordine.indexOf(nemici[0].id);
      svolgiTurno(scontro, { tipo: 'auto' });
      assert.equal(nemici[0].riparo, 'medio', 'il riparo e\' stato preso');
      assert.equal(decidiAzione(scontro, nemici[0]).tipo, 'riparo',
        'e al turno dopo la proposta e\' la stessa: non c\'e\' via d\'uscita');

      // Avvicinandolo torna a poter fare qualcosa: e' la leva del Master.
      scontro.distanza = 1;
      assert.equal(decidiAzione(scontro, nemici[0]).tipo, 'mischia',
        'a un metro carica a mani nude');
    });

    test('il diario racconta ogni tiro, non solo l\'esito', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('A', { abilita: { Pistole: 5 }, armi: [ARMI.pistola] })],
        nemici: [png('B')],
      });
      tocca(scontro, pg[0]);
      const r = svolgiTurno(scontro, { tipo: 'fuoco', bersaglio: nemici[0].id, armaIdx: 0, distanza: 10 });
      const v = r.voce;
      assert.ok(v.tiro?.termini, 'i termini del tiro sono conservati');
      for (const k of ['dado', 'RIF', 'abilita', 'precisioneArma']) {
        assert.equal(typeof v.tiro.termini[k], 'number', `manca il termine ${k}`);
      }
      assert.ok(v.fascia?.nome, 'e la fascia di distanza');
      assert.equal(v.round, 1);
    });
  });

  describe('riepilogo delle ferite', () => {
    test('elenca solo i personaggi da scheda che hanno subito qualcosa', () => {
      const { scontro, pg, nemici } = arena({
        pg: [scheda('Ilaria', { abilita: { Pistole: 5 }, armi: [ARMI.pistola] })],
        nemici: [png('T')],
      });
      assert.deepEqual(riepilogoFerite(scontro), [], 'a inizio scontro non c\'e\' niente da riportare');

      pg[0].ferite = 9;
      nemici[0].ferite = 20;
      const r = riepilogoFerite(scontro);
      assert.equal(r.length, 1, 'solo la scheda, non il png');
      assert.equal(r[0].nome, 'Ilaria');
      assert.equal(r[0].feritePrima, 0);
      assert.equal(r[0].feriteDopo, 9);
      assert.equal(r[0].differenza, 9);
      assert.equal(r[0].grado, 'Critica', 'nove caselle sono il terzo grado');
      assert.ok(r[0].characterId, 'con l\'id della scheda da aggiornare');
    });

    test('un personaggio che entra gia\' ferito segna solo la differenza', () => {
      const { scontro, pg } = arena({
        pg: [scheda('Ferito', { ferite: 6, armi: [ARMI.pistola] })],
        nemici: [png('T')],
      });
      assert.equal(pg[0].ferite, 6, 'entra con le ferite della scheda');
      pg[0].ferite = 15;
      const r = riepilogoFerite(scontro);
      assert.equal(r[0].feritePrima, 6);
      assert.equal(r[0].differenza, 9, 'la differenza e\' quella subita nello scontro');
    });

    test('un morto compare anche se non ha preso danni nello scontro', () => {
      const { scontro, pg } = arena({ pg: [scheda('X', { armi: [] })], nemici: [png('T')] });
      pg[0].morto = true;
      const r = riepilogoFerite(scontro);
      assert.equal(r.length, 1);
      assert.equal(r[0].morto, true);
    });
  });
});
