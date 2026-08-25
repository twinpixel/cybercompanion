import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * I dati di gioco sono JSON scritti a mano: questi test li tengono coerenti fra
 * loro. Sono quelli che si rompono per primi quando si aggiunge una classe o si
 * rinomina un'abilita', ed e' esattamente quello che devono fare.
 */
const DATI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../server/data');
const leggi = (nome) => JSON.parse(fs.readFileSync(path.join(DATI, `${nome}.json`), 'utf8'));

const stats = leggi('stats');
const skills = leggi('skills');
const roles = leggi('roles');
const cyberware = leggi('cyberware');
const gear = leggi('gear');
const lifepath = leggi('lifepath');
const weapons = leggi('weapons');

const nomiAbilita = new Set(skills.gruppi.flatMap((g) => g.skills.map((s) => s.nome)));

describe('dati di gioco', () => {
  test('tutti i file sono JSON validi', () => {
    for (const f of fs.readdirSync(DATI)) {
      if (!f.endsWith('.json')) continue;
      assert.doesNotThrow(() => JSON.parse(fs.readFileSync(path.join(DATI, f), 'utf8')), `${f} non e' JSON valido`);
    }
  });

  describe('caratteristiche', () => {
    test('sono nove, con le sigle italiane della Cyberscheda', () => {
      assert.equal(stats.caratteristiche.length, 9);
      const sigle = stats.caratteristiche.map((c) => c.key);
      assert.deepEqual(sigle, ['INT', 'RIF', 'TEC', 'FRE', 'FAS', 'FOR', 'MOV', 'COS', 'EMP']);
    });

    test('ogni caratteristica ha nome italiano, sigla inglese e descrizione', () => {
      for (const c of stats.caratteristiche) {
        assert.ok(c.nome && c.en && c.desc, `${c.key} incompleta`);
      }
    });

    test('le fasce del bonus di Costituzione non lasciano buchi ne\' sovrapposizioni', () => {
      const fasce = [...stats.bonus_costituzione].sort((a, b) => a.min - b.min);
      for (let i = 1; i < fasce.length; i++) {
        assert.equal(fasce[i].min, fasce[i - 1].max + 1,
          `fra ${fasce[i - 1].max} e ${fasce[i].min} c'e' un buco o una sovrapposizione`);
      }
    });

    test('le localizzazioni coprono esattamente il d10', () => {
      const coperto = new Set();
      for (const l of stats.localizzazioni) {
        for (let t = l.min; t <= l.max; t++) {
          assert.ok(!coperto.has(t), `il tiro ${t} e' coperto due volte`);
          coperto.add(t);
        }
      }
      assert.equal(coperto.size, 10, 'tutti e dieci i risultati hanno una parte del corpo');
    });

    test('la traccia ferite e\' di dieci gradi da quattro caselle', () => {
      assert.equal(stats.ferite.length, 10);
      assert.ok(stats.ferite.every((f) => f.caselle === 4));
    });
  });

  describe('abilita\'', () => {
    test('nessun nome duplicato', () => {
      const tutti = skills.gruppi.flatMap((g) => g.skills.map((s) => s.nome));
      assert.equal(new Set(tutti).size, tutti.length, 'ci sono abilita\' ripetute');
    });

    test('ogni gruppo punta a una caratteristica esistente o a SPECIALE', () => {
      const sigle = new Set([...stats.caratteristiche.map((c) => c.key), 'SPECIALE']);
      for (const g of skills.gruppi) {
        assert.ok(sigle.has(g.stat), `gruppo con caratteristica ignota: ${g.stat}`);
        assert.ok(g.nome, `il gruppo ${g.stat} deve avere un nome`);
      }
    });

    test('le abilita\' speciali sono tutte Difficili', () => {
      const speciali = skills.gruppi.find((g) => g.stat === 'SPECIALE').skills;
      for (const s of speciali) {
        assert.equal(s.x2, true, `${s.nome} deve essere Difficile`);
        assert.ok(s.classe, `${s.nome} deve dire a quale classe appartiene`);
      }
    });
  });

  describe('classi', () => {
    test('sono dieci e hanno tutti i campi', () => {
      assert.equal(roles.classi.length, 10);
      for (const c of roles.classi) {
        for (const campo of ['id', 'nome', 'sottotitolo', 'descrizione', 'speciale', 'abilita', 'abilita_chiave']) {
          assert.ok(c[campo], `${c.id}: manca ${campo}`);
        }
      }
    });

    test('ogni classe arriva a dieci abilita\', contando le scelte libere', () => {
      for (const c of roles.classi) {
        const libere = c.scelte_libere ? c.scelte_libere.quante : 0;
        assert.equal(c.abilita.length + libere, 10,
          `${c.nome}: ${c.abilita.length} fisse + ${libere} a scelta`);
      }
    });

    test('tutte le abilita\' di classe esistono nel catalogo', () => {
      for (const c of roles.classi) {
        for (const nome of c.abilita) {
          assert.ok(nomiAbilita.has(nome), `${c.nome}: abilita' inesistente "${nome}"`);
        }
      }
    });

    test('la prima abilita\' di ogni classe e\' la sua speciale', () => {
      for (const c of roles.classi) {
        assert.equal(c.abilita[0], c.speciale, `${c.nome}: la speciale deve venire per prima`);
      }
    });

    test('ogni abilita\' speciale appartiene a una sola classe, e nessuna resta orfana', () => {
      const speciali = skills.gruppi.find((g) => g.stat === 'SPECIALE').skills;
      for (const s of speciali) {
        const proprietarie = roles.classi.filter((c) => c.speciale === s.nome);
        assert.equal(proprietarie.length, 1, `${s.nome} rivendicata da ${proprietarie.length} classi`);
        assert.equal(proprietarie[0].id, s.classe, `${s.nome}: il campo classe non combacia`);
      }
      assert.equal(speciali.length, roles.classi.length, 'una speciale per classe');
    });

    test('le abilita\' chiave sono un sottoinsieme di quelle di classe', () => {
      for (const c of roles.classi) {
        assert.ok(c.abilita_chiave.length >= 2, `${c.nome}: servono almeno due abilita' chiave`);
        for (const nome of c.abilita_chiave) {
          assert.ok(c.abilita.includes(nome), `${c.nome}: "${nome}" non e' fra le sue abilita'`);
        }
        assert.ok(!c.abilita_chiave.includes(c.speciale), `${c.nome}: la speciale e' gia' trattata a parte`);
      }
    });

    test('il gruppo delle scelte libere del Tecnico esiste', () => {
      for (const c of roles.classi.filter((x) => x.scelte_libere)) {
        const g = skills.gruppi.find((x) => x.stat === c.scelte_libere.da_gruppo);
        assert.ok(g, `${c.nome}: gruppo "${c.scelte_libere.da_gruppo}" inesistente`);
        assert.ok(g.skills.length > c.scelte_libere.quante, 'c\'e\' abbastanza scelta');
      }
    });
  });

  describe('cyberware', () => {
    test('ogni pezzo ha notazione dei Punti Umanita\' interpretabile e costo', () => {
      for (const cat of cyberware.categorie) {
        for (const p of cat.pezzi) {
          assert.match(p.pu, /^\d+D\d+(\/\d+)?$/, `${p.nome}: PU "${p.pu}" non interpretabile`);
          assert.ok(Number.isFinite(p.costo) && p.costo >= 0, `${p.nome}: costo non valido`);
          assert.ok(p.desc, `${p.nome}: manca la descrizione`);
        }
      }
    });

    test('i prerequisiti puntano a pezzi che esistono', () => {
      const nomi = new Set(cyberware.categorie.flatMap((c) => c.pezzi.map((p) => p.nome)));
      for (const cat of cyberware.categorie) {
        for (const p of cat.pezzi) {
          if (p.richiede) assert.ok(nomi.has(p.richiede), `${p.nome} richiede "${p.richiede}", che non esiste`);
        }
      }
    });

    test('nessun nome di impianto duplicato', () => {
      const nomi = cyberware.categorie.flatMap((c) => c.pezzi.map((p) => p.nome));
      assert.equal(new Set(nomi).size, nomi.length);
    });
  });

  describe('equipaggiamento', () => {
    test('le armature hanno VP, ingombro, costo e parte coperta', () => {
      for (const a of gear.armature) {
        assert.ok(Number.isFinite(a.vp) && a.vp > 0, `${a.nome}: VP non valido`);
        assert.ok(Number.isFinite(a.ingombro), `${a.nome}: ingombro non valido`);
        assert.ok(Number.isFinite(a.costo), `${a.nome}: costo non valido`);
        assert.ok(a.copre, `${a.nome}: manca la parte coperta`);
      }
    });

    test('ogni classe ha armi d\'ordinanza, e sono armi vere del catalogo', () => {
      const nomiArmi = new Set(weapons.armi.map((a) => a.nome));
      for (const c of roles.classi) {
        const armi = gear.armi_iniziali[c.id];
        assert.ok(armi?.length, `${c.nome}: nessuna arma d'ordinanza`);
        for (const a of armi) {
          assert.ok(nomiArmi.has(a.nome), `${c.nome}: "${a.nome}" non e' nel catalogo armi`);
          assert.match(String(a.danni), /\d+[dD]\d+/, `${a.nome}: danni "${a.danni}" non interpretabili`);
        }
      }
    });
  });

  describe('tabelle del Lifepath', () => {
    const daDieci = [
      ['stile.abbigliamento', lifepath.stile.abbigliamento],
      ['stile.capelli', lifepath.stile.capelli],
      ['stile.dettagli', lifepath.stile.dettagli],
      ['origini.etnie', lifepath.origini.etnie],
      ['famiglia.rango', lifepath.famiglia.rango],
      ['famiglia.tragedia', lifepath.famiglia.tragedia],
      ['famiglia.status', lifepath.famiglia.status],
      ['infanzia.ambiente', lifepath.infanzia.ambiente],
      ['fratelli.eta', lifepath.fratelli.eta],
      ['fratelli.rapporto', lifepath.fratelli.rapporto],
      ['eventi.annuale', lifepath.eventi.annuale],
      ['eventi.disgrazie', lifepath.eventi.disgrazie],
      ['eventi.fortune', lifepath.eventi.fortune],
      ['eventi.nemici', lifepath.eventi.nemici],
      ['eventi.amici', lifepath.eventi.amici],
      ['eventi.amori', lifepath.eventi.amori],
    ];
    for (const [nome, tabella] of daDieci) {
      test(`${nome} ha dieci voci, una per faccia del d10`, () => {
        assert.equal(tabella.length, 10);
        assert.ok(tabella.every((v) => v != null && v !== ''), 'nessuna voce vuota');
      });
    }

    for (const [nome, tabella] of Object.entries(lifepath.motivazioni)) {
      if (nome.startsWith('_')) continue;
      test(`motivazioni.${nome} ha dieci voci`, () => assert.equal(tabella.length, 10));
    }

    test('gli eventi che rimandano a una sotto-tabella la trovano', () => {
      for (const v of lifepath.eventi.annuale) {
        if (v.tabella) assert.ok(lifepath.eventi[v.tabella], `sotto-tabella "${v.tabella}" mancante`);
      }
    });
  });

  describe('catalogo armi', () => {
    test('sono centinaia e ognuna ha nome, tipo e danni', () => {
      assert.ok(weapons.armi.length > 500, `attese molte armi, trovate ${weapons.armi.length}`);
      for (const a of weapons.armi) {
        assert.ok(a.nome?.trim(), 'arma senza nome');
        assert.ok(a.tipo, `${a.nome}: senza tipo`);
        assert.ok(a.danni != null, `${a.nome}: senza danni`);
      }
    });

    test('l\'affidabilita\' usa solo i tre codici del regolamento', () => {
      for (const a of weapons.armi) {
        assert.ok(['MA', 'ST', 'IN'].includes(a.affidabilita), `${a.nome}: affidabilita' "${a.affidabilita}"`);
      }
    });
  });
});
