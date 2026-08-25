import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { programmaDiLibreria } from '../server/netrun/libreria.js';
import { calcolaProgramma, validaProgramma } from '../server/netrun/programma.js';
import { creaSessione, caricaDifesa, entraNetrunner } from '../server/netrun/sessione.js';
import { combattenteDaScheda } from '../server/combat/index.js';

/**
 * Personaggi e sistemi gia' pronti.
 *
 * Sono dati, non codice, e proprio per questo vanno provati: un collegamento
 * che punta a un nodo inesistente o una difesa che cita un programma sbagliato
 * non si vedono leggendo il file, si vedono al tavolo a partita iniziata.
 */

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const leggi = async (nome) => JSON.parse(await fs.readFile(path.join(RADICE, 'server/data', nome), 'utf8'));

const CHIAVI_STAT = ['INT', 'RIF', 'TEC', 'FRE', 'FAS', 'FOR', 'MOV', 'COS', 'EMP'];

let PREGEN;
let SISTEMI;
let PROGRAMMI;
let RUOLI;
let W;

before(async () => {
  [PREGEN, SISTEMI, PROGRAMMI, RUOLI] = await Promise.all([
    leggi('pregen.json'), leggi('netrun-sistemi.json'), leggi('programs.json'), leggi('roles.json'),
  ]);

  // validaScheda vive nel template del Worker: si carica il bundle costruito,
  // come fa la prova della generazione.
  const bundle = path.join(RADICE, 'dist/worker.js');
  const sorgente = await fs.readFile(bundle, 'utf8');
  const provvisorio = path.join(RADICE, 'dist', '_prova-pronti.mjs');
  await fs.writeFile(provvisorio, `${sorgente}\nexport { validaScheda };\n`);
  W = await import(`file://${provvisorio}`);
  await fs.rm(provvisorio, { force: true });
});

describe('personaggi pronti', () => {
  test('ce n\'e\' uno per ogni classe del regolamento', () => {
    const classi = new Set(PREGEN.personaggi.map((p) => p.classe));
    for (const c of RUOLI.classi) {
      assert.ok(classi.has(c.id), `manca un personaggio pronto per ${c.nome}`);
    }
  });

  test('ogni scheda passa la validazione dell\'API', () => {
    for (const p of PREGEN.personaggi) {
      assert.equal(W.validaScheda(p.scheda), null, `${p.nome}: ${W.validaScheda(p.scheda)}`);
    }
  });

  test('caratteristiche nei limiti e nessun buco da rottame', () => {
    for (const p of PREGEN.personaggi) {
      for (const k of CHIAVI_STAT) {
        const v = p.scheda.caratteristiche[k];
        assert.ok(Number.isInteger(v) && v >= 2 && v <= 10, `${p.nome} ${k} = ${v}`);
      }
      // I pronti all'uso devono essere giocabili: un 2 o un 3 in mezzo rende il
      // personaggio inutile in meta' delle scene, e chi lo prende non lo sa.
      const minimo = Math.min(...CHIAVI_STAT.map((k) => p.scheda.caratteristiche[k]));
      assert.ok(minimo >= 4, `${p.nome} ha una caratteristica a ${minimo}`);
    }
  });

  test('l\'Umanita\' resta sopra la soglia della cyberpsicosi', () => {
    for (const p of PREGEN.personaggi) {
      assert.ok(p.scheda.umanita.attuale >= 20, `${p.nome}: Umanita' ${p.scheda.umanita.attuale}`);
    }
  });

  test('hanno tutti identita\', storia e nota per il Master', () => {
    for (const p of PREGEN.personaggi) {
      assert.ok(p.nome && p.soprannome, 'nome e soprannome');
      assert.ok(p.sommario.length > 20, `${p.nome}: sommario troppo corto`);
      assert.ok(p.scheda.background.testo.length > 120, `${p.nome}: storia troppo corta`);
      assert.ok(p.scheda.background.obiettivo, `${p.nome}: senza obiettivo`);
      assert.ok(p.scheda.anagrafica.note.length > 40, `${p.nome}: senza nota per il Master`);
      assert.equal(p.scheda.anagrafica.nome, p.nome, 'il nome e\' anche sulla scheda');
    }
  });

  test('sono armati e sanno fare il proprio mestiere', () => {
    for (const p of PREGEN.personaggi) {
      assert.ok(p.scheda.armi.length > 0, `${p.nome} e' disarmato`);
      assert.ok(Object.keys(p.scheda.abilita).length >= 8, `${p.nome} ha troppe poche abilita'`);
      const classe = RUOLI.classi.find((c) => c.id === p.classe);
      assert.ok(p.scheda.abilita[classe.speciale] >= 1,
        `${p.nome} non ha ${classe.speciale}, l'abilita' che fa la sua classe`);
    }
  });

  test('scendono in campo nel combattimento senza aggiustamenti', () => {
    for (const p of PREGEN.personaggi) {
      const c = combattenteDaScheda(p.scheda, `pre-${p.id}`, 'pg');
      assert.equal(c.nome, p.nome);
      assert.ok(c.caratteristiche.RIF > 0);
      assert.ok(Object.values(c.armatura).some((v) => v >= 0));
    }
  });

  test('i due netrunner hanno di che entrare nel Net', () => {
    const runner = PREGEN.personaggi.filter((p) => p.classe === 'netrunner');
    assert.equal(runner.length, 2, 'due netrunner: uno rapido e uno prudente');
    for (const p of runner) {
      assert.ok(p.scheda.abilita['Hacking'] >= 1, `${p.nome} senza Hacking`);
      assert.ok(p.scheda.caratteristiche.INT >= 8, `${p.nome} con INT bassa`);
      assert.ok(p.scheda.cyberware.some((c) => /interfaccia|neurale/i.test(c.nome)),
        `${p.nome} non ha di che collegarsi`);
    }
  });
});

describe('sistemi pronti per il netrun', () => {
  test('ogni sistema ha nodi, un gancio e una difficolta\' dichiarata', () => {
    assert.ok(SISTEMI.sistemi.length >= 8, 'una scelta ampia');
    for (const s of SISTEMI.sistemi) {
      assert.ok(s.id && s.nome && s.sistema, `${s.id}: identita' incompleta`);
      assert.match(s.difficolta, /^(facile|media|difficile|letale)$/);
      assert.ok(s.gancio.length > 20, `${s.id}: senza gancio`);
      assert.ok(s.sommario.length > 20, `${s.id}: senza sommario`);
      assert.ok(s.nodi.length >= 2, `${s.id}: un sistema di un nodo solo non e' un sistema`);
      assert.equal(s.nodi[0].tipo, 'portale', `${s.id}: il primo nodo e' quello d'ingresso`);
    }
  });

  test('i collegamenti esistono e valgono nei due sensi', () => {
    for (const s of SISTEMI.sistemi) {
      const per = new Map(s.nodi.map((n) => [n.id, n]));
      assert.equal(per.size, s.nodi.length, `${s.id}: due nodi con lo stesso id`);
      for (const n of s.nodi) {
        for (const c of n.collegati) {
          const altro = per.get(c);
          assert.ok(altro, `${s.id}: ${n.id} punta a ${c}, che non esiste`);
          // Un corridoio si percorre nei due sensi: senza reciprocita' il
          // netrunner entra in un nodo e non ne esce piu'.
          assert.ok(altro.collegati.includes(n.id), `${s.id}: ${n.id} -> ${c} non e' reciproco`);
        }
      }
    }
  });

  test('da ogni nodo si arriva a ogni altro', () => {
    for (const s of SISTEMI.sistemi) {
      const per = new Map(s.nodi.map((n) => [n.id, n]));
      const visti = new Set([s.nodi[0].id]);
      const coda = [s.nodi[0].id];
      while (coda.length) {
        for (const c of per.get(coda.pop()).collegati) {
          if (!visti.has(c)) { visti.add(c); coda.push(c); }
        }
      }
      assert.equal(visti.size, s.nodi.length, `${s.id}: qualche nodo e' irraggiungibile`);
    }
  });

  test('le Mura crescono man mano che ci si addentra', () => {
    for (const s of SISTEMI.sistemi) {
      for (const n of s.nodi) {
        assert.ok(Number.isInteger(n.mura) && n.mura >= 0 && n.mura <= 20, `${s.id}/${n.id}: Mura ${n.mura}`);
      }
      const massimo = Math.max(...s.nodi.map((n) => n.mura));
      assert.ok(massimo >= s.nodi[0].mura, `${s.id}: il portale non puo' essere il nodo piu' duro`);
    }
  });

  test('ogni difesa cita un programma che esiste e un nodo che esiste', () => {
    for (const s of SISTEMI.sistemi) {
      const ids = new Set(s.nodi.map((n) => n.id));
      for (const d of s.difese) {
        assert.ok(ids.has(d.nodo), `${s.id}: difesa su un nodo inesistente (${d.nodo})`);
        const spec = programmaDiLibreria(PROGRAMMI, d.programma);
        assert.ok(spec, `${s.id}: "${d.programma}" non e' nel catalogo del manuale`);
        assert.equal(validaProgramma(spec), null, `${s.id}: ${d.programma} non e' costruibile`);
      }
    }
  });

  test('un sistema pronto apre davvero una sessione giocabile', () => {
    const ncpd = SISTEMI.sistemi.find((s) => s.id === 'ncpd');
    const sessione = creaSessione('PROVA1', { nome: ncpd.nome, sistema: ncpd.sistema, nodi: ncpd.nodi });
    for (const d of ncpd.difese) {
      const esito = caricaDifesa(sessione, programmaDiLibreria(PROGRAMMI, d.programma), d.nodo);
      assert.ok(!esito.errore, esito.errore);
      assert.ok(esito.difesa.forza > 0, `${d.programma} deve avere una Forza`);
    }
    assert.equal(sessione.sistema.difese.length, ncpd.difese.length);

    const entrata = entraNetrunner(sessione, {
      nome: 'Prova', INT: 9, hacking: 6, umDeck: ncpd.umDeckConsigliato,
      programmi: [programmaDiLibreria(PROGRAMMI, 'Crusher'), programmaDiLibreria(PROGRAMMI, 'Buckler')],
    });
    assert.ok(entrata.token, entrata.errore);
    assert.equal(sessione.stato, 'in corso');
    assert.equal(sessione.runner.deck.caricati.length, 2, 'il deck consigliato tiene i programmi di base');
  });

  test('il deck consigliato basta a portarsi dietro qualcosa di utile', () => {
    for (const s of SISTEMI.sistemi) {
      const crusher = calcolaProgramma(programmaDiLibreria(PROGRAMMI, 'Crusher'));
      assert.ok(s.umDeckConsigliato >= crusher.um * 2,
        `${s.id}: ${s.umDeckConsigliato} UM non bastano nemmeno a due programmi`);
    }
  });
});
