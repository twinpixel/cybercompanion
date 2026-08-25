import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  fasciaPerDistanza, FASCE_DISTANZA, localizzazioneDaTiro, localizzazionePerId,
  LOCALIZZAZIONI, bonusCostituzione, gradoFerita, rifEffettivo, CASELLE_TOTALI,
  azionePerId, AZIONI, riparoPerId, RIPARI, munizionePerId, TIPI_MUNIZIONI,
} from '../server/combat/tabelle.js';

describe('tabelle di combattimento', () => {
  describe('fasce di distanza', () => {
    test('una pistola con gittata 50 m attraversa tutte le fasce', () => {
      const attesi = [
        [1, 'bruciapelo', 10], [10, 'ravvicinata', 15], [25, 'media', 20],
        [50, 'lunga', 25], [90, 'estrema', 30],
      ];
      for (const [distanza, id, difficolta] of attesi) {
        const f = fasciaPerDistanza(distanza, 50);
        assert.equal(f.id, id, `a ${distanza} m`);
        assert.equal(f.difficolta, difficolta);
        assert.equal(f.oltre, false);
      }
    });

    test('oltre il doppio della gittata il tiro non e\' possibile', () => {
      const f = fasciaPerDistanza(101, 50);
      assert.equal(f.oltre, true, 'segnalato come fuori portata');
    });

    test('le difficolta\' crescono con la distanza', () => {
      const d = FASCE_DISTANZA.map((f) => f.difficolta);
      assert.deepEqual(d, [...d].sort((a, b) => a - b), 'monotone crescenti');
    });

    test('senza gittata nota si ripiega su una difficolta\' media', () => {
      const f = fasciaPerDistanza(10, 0);
      assert.equal(f.oltre, false, 'non blocca il tiro');
      assert.ok(f.difficolta > 0 && f.difficolta < 99);
    });
  });

  describe('localizzazione', () => {
    test('il d10 copre tutte e sei le parti senza buchi', () => {
      const coperte = new Set();
      for (let t = 1; t <= 10; t++) {
        const l = localizzazioneDaTiro(t);
        assert.ok(l, `il tiro ${t} ha una locazione`);
        coperte.add(l.id);
      }
      assert.equal(coperte.size, LOCALIZZAZIONI.length, 'tutte le locazioni raggiungibili');
    });

    test('solo la testa raddoppia il danno', () => {
      for (const l of LOCALIZZAZIONI) {
        assert.equal(l.moltiplicatore, l.id === 'testa' ? 2 : 1, l.nome);
      }
    });

    test('la ricerca per id restituisce la voce completa, non l\'id grezzo', () => {
      const t = localizzazionePerId('testa');
      assert.equal(t.nome, 'Testa', 'il nome e\' leggibile');
      assert.equal(t.moltiplicatore, 2);
      assert.equal(localizzazionePerId('inesistente'), null);
    });

    test('il tronco e\' la parte piu\' probabile', () => {
      const conta = {};
      for (let t = 1; t <= 10; t++) {
        const id = localizzazioneDaTiro(t).id;
        conta[id] = (conta[id] || 0) + 1;
      }
      assert.equal(conta.tronco, 3, 'tre facce su dieci');
      assert.equal(conta.testa, 1, 'la testa e\' una sola');
    });
  });

  describe('bonus di Costituzione', () => {
    test('copre ogni valore da 1 a 30 senza buchi', () => {
      for (let cos = 1; cos <= 30; cos++) {
        assert.ok(bonusCostituzione(cos), `COS ${cos} ha una fascia`);
      }
    });

    test('piu\' Costituzione, piu\' resistenza e piu\' danno', () => {
      const r = [2, 4, 6, 9, 10, 14].map((c) => bonusCostituzione(c));
      for (let i = 1; i < r.length; i++) {
        assert.ok(r[i].resistenza <= r[i - 1].resistenza, 'la resistenza non peggiora salendo');
        assert.ok(r[i].danno >= r[i - 1].danno, 'il bonus danno non cala salendo');
      }
    });

    test('la fascia sovrumana esiste, perche\' il cyberware supera il 10', () => {
      const s = bonusCostituzione(14);
      assert.equal(s.tipo, 'Sovrumano');
      assert.equal(s.resistenza, -5);
    });
  });

  describe('ferite', () => {
    test('quaranta caselle in dieci gradi da quattro', () => {
      assert.equal(CASELLE_TOTALI, 40);
      assert.equal(gradoFerita(0), null, 'zero caselle e\' illeso');
      assert.equal(gradoFerita(1).grado, 'Lieve');
      assert.equal(gradoFerita(4).grado, 'Lieve', 'il quarto e\' ancora lieve');
      assert.equal(gradoFerita(5).grado, 'Grave', 'il quinto passa di grado');
      assert.equal(gradoFerita(40).grado, 'Mortale 6');
    });

    test('oltre le quaranta caselle non si sfonda la tabella', () => {
      assert.equal(gradoFerita(999).grado, 'Mortale 6');
      assert.equal(gradoFerita(-5), null);
    });

    test('lo stordimento peggiora a ogni grado', () => {
      let precedente = -1;
      for (let c = 1; c <= 40; c += 4) {
        const g = gradoFerita(c);
        assert.ok(g.stordimento > precedente, `${g.grado} e' peggio del grado prima`);
        precedente = g.stordimento;
      }
    });

    test('i gradi mortali sono marcati come tali', () => {
      assert.equal(gradoFerita(12).mortale, false, 'critica non e\' ancora mortale');
      assert.equal(gradoFerita(13).mortale, true, 'mortale 0 lo e\'');
    });

    test('il RIF cala con le ferite ma non scende sotto 1', () => {
      assert.equal(rifEffettivo(8, 0), 8, 'illeso: nessun malus');
      assert.equal(rifEffettivo(8, 4), 8, 'ferita lieve: nessun malus');
      assert.equal(rifEffettivo(8, 5), 6, 'grave: -2');
      assert.equal(rifEffettivo(8, 12), 4, 'critica: dimezzato');
      assert.equal(rifEffettivo(8, 13), 2, 'mortale: un terzo');
      assert.equal(rifEffettivo(1, 40), 1, 'non si scende sotto 1');
    });
  });

  describe('azioni, ripari, munizioni', () => {
    test('ogni azione ha id, nome, categoria e descrizione', () => {
      for (const a of AZIONI) {
        assert.ok(a.id && a.nome && a.descrizione, `azione ${a.id} completa`);
        assert.equal(azionePerId(a.id).id, a.id, 'ritrovabile per id');
      }
      assert.equal(azionePerId('inventata'), null);
    });

    test('le azioni richieste dal tavolo ci sono tutte', () => {
      for (const id of ['fuoco', 'raffica', 'automatico', 'mischia', 'schiva', 'para', 'riparo', 'sblocca']) {
        assert.ok(azionePerId(id), `manca l'azione ${id}`);
      }
    });

    test('i ripari salgono di protezione e "nessuno" vale zero', () => {
      assert.equal(riparoPerId('nessuno').vp, 0);
      assert.equal(riparoPerId('sconosciuto').vp, 0, 'un id ignoto vale allo scoperto');
      const vp = RIPARI.map((r) => r.vp);
      assert.deepEqual(vp, [...vp].sort((a, b) => a - b), 'crescenti');
    });

    test('le dirompenti sono l\'esatto opposto delle perforanti', () => {
      const perf = munizionePerId('perforante');
      const dir = munizionePerId('dirompente');
      assert.equal(perf.vpFattore, 0.5);
      assert.equal(dir.vpFattore, 2, 'l\'armatura le ferma il doppio');
      assert.equal(perf.dannoFattore, 0.5);
      assert.equal(dir.dannoFattore, 2, 'su carne scoperta fanno il doppio');
      assert.equal(dir.degrado, 0.5, 'consumano l\'armatura la meta\'');
    });

    test('un id di munizione ignoto ricade sulle normali', () => {
      const n = munizionePerId('bizzarre');
      assert.equal(n.id, 'normale');
      assert.equal(n.vpFattore, 1);
      assert.equal(n.dannoFattore, 1);
    });

    test('tutti i tipi di munizione hanno i tre fattori', () => {
      for (const m of TIPI_MUNIZIONI) {
        for (const k of ['vpFattore', 'dannoFattore', 'degrado']) {
          assert.equal(typeof m[k], 'number', `${m.id}.${k}`);
          assert.ok(m[k] > 0, `${m.id}.${k} positivo`);
        }
      }
    });
  });
});
