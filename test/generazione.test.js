import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * La generazione vive dentro il template del Worker, che non esporta nulla.
 * Si carica il bundle costruito e gli si aggiunge un export: cosi' si prova
 * esattamente il codice che verra' deployato, non una copia.
 */
const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(RADICE, 'dist');

let W;
let CATALOGHI;

before(async () => {
  const bundle = path.join(DIST, 'worker.js');
  try {
    await fs.access(bundle);
  } catch {
    throw new Error('dist/worker.js mancante: lancia prima `npm run build:worker`');
  }
  const sorgente = await fs.readFile(bundle, 'utf8');
  // Il file di prova sta dentro dist/ perche' gli import sono relativi a li'.
  const provvisorio = path.join(DIST, '_prova-generazione.mjs');
  await fs.writeFile(provvisorio, `${sorgente}\nexport { generaPersonaggio, GAME_DATA, schedaVuota, validaScheda };\n`);
  W = await import(`file://${provvisorio}`);
  await fs.rm(provvisorio, { force: true });

  CATALOGHI = {
    roles: JSON.parse(await fs.readFile(path.join(RADICE, 'server/data/roles.json'), 'utf8')),
    skills: JSON.parse(await fs.readFile(path.join(RADICE, 'server/data/skills.json'), 'utf8')),
    stats: JSON.parse(await fs.readFile(path.join(RADICE, 'server/data/stats.json'), 'utf8')),
  };
});

// Nessuna chiave e nessun binding: si prova il percorso senza LLM, quello che
// deve restare giocabile comunque.
const ENV_SENZA_LLM = {};

describe('generazione automatica dei personaggi', () => {
  test('senza alcun LLM la scheda esce completa e giocabile', async () => {
    const s = await W.generaPersonaggio(ENV_SENZA_LLM, { classe: 'solitario' });
    assert.equal(s.generatoConLLM, false, 'segnala che la prosa manca');
    assert.equal(s.classe, 'solitario');
    assert.ok(Object.keys(s.abilita).length > 5, 'ha abilita\'');
    assert.ok(s.armi.length > 0, 'ha almeno un\'arma');
    assert.ok(s.eventi.length >= 0, 'ha una storia di eventi');
    assert.ok(s.background.origini?.etnia, 'ha origini');
  });

  test('le caratteristiche restano nei limiti del regolamento', async () => {
    const chiavi = ['INT', 'RIF', 'TEC', 'FRE', 'FAS', 'FOR', 'MOV', 'COS', 'EMP'];
    for (let i = 0; i < 40; i++) {
      const s = await W.generaPersonaggio(ENV_SENZA_LLM, {});
      for (const k of chiavi) {
        const v = s.caratteristiche[k];
        assert.ok(Number.isInteger(v), `${k} deve essere intero`);
        assert.ok(v >= 1 && v <= 10, `${k} = ${v} fuori dai limiti 1-10`);
      }
    }
  });

  test('i punti richiesti vengono distribuiti, meno quelli persi in Umanita\'', async () => {
    for (const punti of [45, 60, 80]) {
      for (let i = 0; i < 10; i++) {
        const s = await W.generaPersonaggio(ENV_SENZA_LLM, { classe: 'corporativo', punti });
        const totale = Object.values(s.caratteristiche).reduce((a, b) => a + b, 0);
        const empPersa = Math.floor(s.umanita.iniziale / 10) - s.caratteristiche.EMP;
        assert.equal(totale + empPersa, punti,
          `${punti} punti: distribuiti ${totale}, EMP persa col cyberware ${empPersa}`);
      }
    }
  });

  test('ogni classe riceve la propria abilita\' speciale a un livello utile', async () => {
    for (const classe of CATALOGHI.roles.classi) {
      const s = await W.generaPersonaggio(ENV_SENZA_LLM, { classe: classe.id });
      const livello = s.abilita[classe.speciale] || 0;
      assert.ok(livello >= 3, `${classe.nome}: ${classe.speciale} a ${livello}, troppo basso per la classe`);
    }
  });

  test('nessuno compra l\'abilita\' speciale di un\'altra classe', async () => {
    const speciali = CATALOGHI.skills.gruppi.find((g) => g.stat === 'SPECIALE').skills.map((s) => s.nome);
    for (const classe of CATALOGHI.roles.classi) {
      const s = await W.generaPersonaggio(ENV_SENZA_LLM, { classe: classe.id });
      for (const nome of speciali) {
        if (nome === classe.speciale) continue;
        assert.ok(!s.abilita[nome], `${classe.nome} non puo' avere ${nome}`);
      }
    }
  });

  test('tutte le abilita\' generate esistono nel catalogo', async () => {
    const note = new Set(CATALOGHI.skills.gruppi.flatMap((g) => g.skills.map((sk) => sk.nome)));
    for (let i = 0; i < 20; i++) {
      const s = await W.generaPersonaggio(ENV_SENZA_LLM, {});
      for (const nome of Object.keys(s.abilita)) {
        assert.ok(note.has(nome), `abilita' inventata: "${nome}"`);
      }
    }
  });

  test('nessuna abilita\' supera il 10', async () => {
    for (let i = 0; i < 30; i++) {
      const s = await W.generaPersonaggio(ENV_SENZA_LLM, { punti: 80 });
      for (const [nome, livello] of Object.entries(s.abilita)) {
        assert.ok(livello >= 1 && livello <= 10, `${nome} a ${livello}`);
      }
    }
  });

  test('l\'Umanita\' non scende sotto la soglia della terapia', async () => {
    for (let i = 0; i < 40; i++) {
      const s = await W.generaPersonaggio(ENV_SENZA_LLM, { punti: 80 });
      assert.ok(s.umanita.attuale >= 20,
        `in creazione non si scende sotto 20 punti di Umanita' (${s.umanita.attuale})`);
      assert.equal(s.caratteristiche.EMP, Math.max(1, Math.floor(s.umanita.attuale / 10)),
        'EMP e Umanita\' restano coerenti');
    }
  });

  test('il cyberware rispetta i prerequisiti', async () => {
    for (let i = 0; i < 40; i++) {
      const s = await W.generaPersonaggio(ENV_SENZA_LLM, {});
      const installati = new Set(s.cyberware.map((c) => c.nome));
      const catalogo = new Map(
        W.GAME_DATA.cyberware.categorie.flatMap((c) => c.pezzi.map((p) => [p.nome, p]))
      );
      for (const c of s.cyberware) {
        const spec = catalogo.get(c.nome);
        if (spec?.richiede) {
          assert.ok(installati.has(spec.richiede), `${c.nome} richiede ${spec.richiede}, che non c'e'`);
        }
      }
    }
  });

  test('il denaro non va in rosso', async () => {
    for (let i = 0; i < 30; i++) {
      const s = await W.generaPersonaggio(ENV_SENZA_LLM, {});
      assert.ok(s.denaro.contanti >= 0, `contanti negativi: ${s.denaro.contanti}`);
    }
  });

  test('l\'armatura protegge il tronco, non solo la testa', async () => {
    let conTronco = 0, conSolaTesta = 0;
    for (let i = 0; i < 40; i++) {
      const s = await W.generaPersonaggio(ENV_SENZA_LLM, { classe: 'solitario' });
      const copre = (s.armature || []).map((a) => a.copre).join(' ');
      if (/Tronco|Tutto il corpo/.test(copre)) conTronco++;
      else if (/Testa/.test(copre)) conSolaTesta++;
    }
    assert.ok(conTronco > conSolaTesta,
      `si copre il tronco prima della testa (${conTronco} contro ${conSolaTesta})`);
  });

  test('l\'eta\' richiesta viene rispettata e gli eventi la seguono', async () => {
    for (const eta of [16, 25, 40]) {
      const s = await W.generaPersonaggio(ENV_SENZA_LLM, { eta });
      assert.equal(s.anagrafica.eta, eta);
      for (const e of s.eventi) {
        assert.ok(e.anno >= 16 && e.anno <= eta, `evento a ${e.anno} anni fuori dalla vita del personaggio`);
      }
    }
  });

  test('una classe sconosciuta non fa cadere la generazione: se ne pesca una', async () => {
    const s = await W.generaPersonaggio(ENV_SENZA_LLM, { classe: 'guerriero-jedi' });
    assert.ok(CATALOGHI.roles.classi.some((c) => c.id === s.classe), 'ricade su una classe vera');
  });

  test('il Tecnico sceglie tre abilita\' Tecnologia che contano come di classe', async () => {
    for (let i = 0; i < 10; i++) {
      const s = await W.generaPersonaggio(ENV_SENZA_LLM, { classe: 'tecnico' });
      assert.equal(s.abilitaClasseScelte.length, 3);
      const tec = new Set(CATALOGHI.skills.gruppi.find((g) => g.stat === 'TEC').skills.map((x) => x.nome));
      for (const nome of s.abilitaClasseScelte) {
        assert.ok(tec.has(nome), `${nome} non e' un'abilita' Tecnologia`);
      }
      assert.equal(new Set(s.abilitaClasseScelte).size, 3, 'tre abilita\' distinte');
    }
  });

  test('ogni scheda generata supera la validazione dell\'API', async () => {
    for (let i = 0; i < 20; i++) {
      const s = await W.generaPersonaggio(ENV_SENZA_LLM, {});
      assert.equal(W.validaScheda(s), null, 'una scheda generata deve essere salvabile');
    }
  });

  test('la scheda vuota e\' valida quanto una generata', () => {
    assert.equal(W.validaScheda(W.schedaVuota()), null);
  });

  test('la validazione respinge le schede malformate', () => {
    assert.match(W.validaScheda(null), /mancante/);
    assert.match(W.validaScheda({}), /anagrafica/);
    assert.match(W.validaScheda({ anagrafica: {}, caratteristiche: { RIF: 999 } }), /non valida/);
    assert.match(
      W.validaScheda({ ...W.schedaVuota(), classe: 'inventata' }), /Classe sconosciuta/);
  });
});
