import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  creaSessione, caricaDifesa, entraNetrunner, azioneRunner, azioneMaster,
  vista, ruoloPerToken, TIPI_NODO, LIVELLI_ALLARME, allarmePerId, UM_DECK_DEFAULT,
} from '../server/netrun/sessione.js';

const prog = (nome, funzione, forza, extra = {}) => ({
  nome, funzioni: [funzione], forza, icona: 'semplice', modoForza: 'normale', ...extra,
});

const SISTEMA = {
  nome: 'Agguato',
  sistema: 'Arasaka Tower, piano 14',
  nodi: [
    { id: 'porta', nome: 'Portale', tipo: 'portale', mura: 4, collegati: ['archivio', 'cpu'] },
    { id: 'archivio', nome: 'Archivio', tipo: 'memoria', mura: 6, collegati: ['porta'], contenuto: 'I dossier', nascosto: 'Anche il registro dei pagamenti' },
    { id: 'cpu', nome: 'CPU', tipo: 'cpu', mura: 8, collegati: ['porta'] },
  ],
};

/** Sessione pronta, col netrunner gia' dentro. */
function pronta(opzioni = {}) {
  const s = creaSessione('prova-1', { ...SISTEMA, ...opzioni });
  const esito = entraNetrunner(s, {
    characterId: 'char-1', nome: 'Vera', INT: 9, hacking: 7,
    programmi: [prog('Jumanji', 'intrusione', 8), prog('Killer VIII', 'anti-icona', 8), prog('Radar', 'individuazione', 3)],
    umDeck: 30,
  });
  return { s, tokenRunner: esito.token, tokenMaster: s.posti.master };
}

describe('sessione di netrun', () => {
  describe('creazione', () => {
    test('nasce in attesa, col Master che ha gia\' il suo posto', () => {
      const s = creaSessione('x', SISTEMA);
      assert.equal(s.stato, 'attesa');
      assert.equal(s.sistema.nodi.length, 3);
      assert.ok(s.posti.master, 'il token del Master c\'e\' subito');
      assert.equal(s.posti.runner, null, 'quello del netrunner arriva quando entra');
      assert.equal(s.sistema.allarme, 'nessuno');
    });

    test('senza nodi ne mette uno d\'ufficio, invece di restare vuota', () => {
      const s = creaSessione('x', { nome: 'Vuota' });
      assert.equal(s.sistema.nodi.length, 1);
      assert.equal(s.sistema.nodi[0].tipo, 'portale');
    });

    test('un tipo di nodo sconosciuto ricade su memoria', () => {
      const s = creaSessione('x', { nodi: [{ id: 'a', nome: 'A', tipo: 'inventato' }] });
      assert.equal(s.sistema.nodi[0].tipo, 'memoria');
    });

    test('il Master carica difese sui nodi', () => {
      const s = creaSessione('x', SISTEMA);
      const esito = caricaDifesa(s, prog('Ninja', 'anti-icona', 7), 'archivio');
      assert.ok(esito.difesa, 'la difesa e\' stata creata');
      assert.equal(esito.difesa.forza, 7);
      assert.equal(esito.difesa.attivo, false, 'dormiente finche\' non scatta');
      assert.equal(esito.difesa.scoperto, false);
      assert.match(caricaDifesa(s, prog('X', 'protezione', 3), 'inesistente').errore, /Nodo non trovato/);
    });
  });

  describe('ingresso del netrunner', () => {
    test('entra, carica il deck e la sessione parte', () => {
      const { s, tokenRunner } = pronta();
      assert.equal(s.stato, 'in corso');
      assert.ok(tokenRunner, 'riceve il proprio token');
      assert.equal(s.runner.nome, 'Vera');
      assert.equal(s.runner.posizione, 'porta', 'entra dal primo nodo');
      assert.equal(s.runner.deck.caricati.length, 3);
    });

    test('il deck ha un tetto di memoria: cio\' che non ci sta resta fuori', () => {
      const s = creaSessione('x', SISTEMA);
      entraNetrunner(s, {
        nome: 'Vera', INT: 8, hacking: 6, umDeck: 4,
        programmi: [prog('Piccolo', 'utility', 2), prog('Enorme', 'anti-operatore', 15, { optional: ['danno3d10', 'ia'] })],
      });
      assert.equal(s.runner.deck.caricati.length, 1, 'entra solo il piccolo');
      assert.equal(s.runner.deck.scartati.length, 1);
      assert.equal(s.runner.deck.scartati[0].nome, 'Enorme');
      assert.ok(s.runner.deck.usate <= 4, 'il tetto e\' rispettato');
      assert.match(s.diario.at(-1).testo, /Non entrati per mancanza di spazio/);
    });

    test('il posto del netrunner non si prende in due', () => {
      const { s } = pronta();
      const secondo = entraNetrunner(s, { nome: 'Intruso', INT: 5, hacking: 5, programmi: [] });
      assert.match(secondo.errore, /gia' occupato/);
    });

    test('chi ha il token puo\' rientrare dopo un ricaricamento', () => {
      const { s, tokenRunner } = pronta();
      const rientro = entraNetrunner(s, { nome: 'Vera', INT: 9, hacking: 7, programmi: [prog('Jumanji', 'intrusione', 8)], token: tokenRunner });
      assert.ok(!rientro.errore, rientro.errore);
      assert.equal(rientro.token, tokenRunner, 'lo stesso posto');
    });
  });

  describe('turni', () => {
    test('si comincia dal netrunner e poi si alterna', () => {
      const { s } = pronta();
      assert.equal(s.turno, 'runner');
      azioneRunner(s, { tipo: 'passa' });
      assert.equal(s.turno, 'master');
      assert.equal(s.round, 1, 'il round si chiude col Master');
      azioneMaster(s, { tipo: 'passa' });
      assert.equal(s.turno, 'runner');
      assert.equal(s.round, 2);
    });

    test('agire fuori turno e\' rifiutato', () => {
      const { s } = pronta();
      assert.match(azioneMaster(s, { tipo: 'passa' }).errore, /Non e' il turno del Master/);
      azioneRunner(s, { tipo: 'passa' });
      assert.match(azioneRunner(s, { tipo: 'passa' }).errore, /Non e' il turno del netrunner/);
    });
  });

  describe('movimento e Mura', () => {
    test('non si entra in un nodo con le Mura in piedi', () => {
      const { s } = pronta();
      const r = azioneRunner(s, { tipo: 'muovi', nodo: 'archivio' });
      assert.match(r.errore, /Mura in piedi/);
    });

    test('non si salta a un nodo non collegato', () => {
      const { s } = pronta();
      s.sistema.nodi.find((n) => n.id === 'archivio').mura = 0;
      s.sistema.nodi.find((n) => n.id === 'archivio').violato = true;
      // dal portale l'archivio e' collegato, quindi si passa
      assert.ok(!azioneRunner(s, { tipo: 'muovi', nodo: 'archivio' }).errore);
      // ma dall'archivio la CPU non lo e'
      s.turno = 'runner';
      s.sistema.nodi.find((n) => n.id === 'cpu').mura = 0;
      s.sistema.nodi.find((n) => n.id === 'cpu').violato = true;
      assert.match(azioneRunner(s, { tipo: 'muovi', nodo: 'cpu' }).errore, /non si arriva/);
    });

    test('un programma di Intrusione abbatte le Mura, e allora si passa', () => {
      const { s } = pronta();
      const prg = s.runner.deck.caricati.find((p) => p.classe === 'intrusione');
      let colpi = 0;
      const archivio = s.sistema.nodi.find((n) => n.id === 'archivio');
      while (archivio.mura > 0 && colpi < 100) {
        colpi++;
        s.turno = 'runner';
        azioneRunner(s, { tipo: 'esegui', programma: prg.id, bersaglioTipo: 'mura', nodo: 'archivio' });
      }
      assert.equal(archivio.mura, 0, `le Mura cadono (${colpi} tentativi)`);
      assert.equal(archivio.violato, true);
      s.turno = 'runner';
      assert.ok(!azioneRunner(s, { tipo: 'muovi', nodo: 'archivio' }).errore, 'ora si passa');
    });

    test('sfondare Mura gia\' cadute e\' rifiutato', () => {
      const { s } = pronta();
      const prg = s.runner.deck.caricati[0];
      s.sistema.nodi.find((n) => n.id === 'porta').mura = 0;
      assert.match(
        azioneRunner(s, { tipo: 'esegui', programma: prg.id, bersaglioTipo: 'mura', nodo: 'porta' }).errore,
        /non ha piu' Mura/);
    });
  });

  describe('scontro fra programmi', () => {
    test('un programma del runner riduce la Forza di una difesa', () => {
      const { s } = pronta();
      const dif = caricaDifesa(s, prog('Chiller', 'anti-icona', 4), 'porta').difesa;
      const attacco = s.runner.deck.caricati.find((p) => p.classe === 'anti-icona');
      let giri = 0;
      while (dif.forza > 0 && giri < 100) {
        giri++;
        s.turno = 'runner';
        azioneRunner(s, { tipo: 'esegui', programma: attacco.id, bersaglioTipo: 'difesa', bersaglio: dif.id });
      }
      assert.equal(dif.forza, 0, `la difesa cade (${giri} scambi)`);
      assert.equal(dif.scoperto, true, 'e a quel punto e\' certamente scoperta');
      s.turno = 'runner';
      assert.match(
        azioneRunner(s, { tipo: 'esegui', programma: attacco.id, bersaglioTipo: 'difesa', bersaglio: dif.id }).errore,
        /gia' fuori uso/);
    });

    test('una difesa de-resetta un programma del runner', () => {
      const { s } = pronta();
      const dif = caricaDifesa(s, prog('Ninja', 'anti-icona', 9), 'porta').difesa;
      const vittima = s.runner.deck.caricati.find((p) => p.classe === 'individuazione');
      let giri = 0;
      while (!vittima.deresettato && giri < 200) {
        giri++;
        s.turno = 'master';
        azioneMaster(s, { tipo: 'colpisci', difesa: dif.id, bersaglio: vittima.id });
      }
      assert.equal(vittima.deresettato, true, `il programma cade (${giri} scambi)`);
      s.turno = 'runner';
      assert.match(
        azioneRunner(s, { tipo: 'esegui', programma: vittima.id, bersaglioTipo: 'mura', nodo: 'porta' }).errore,
        /de-resettato/);
    });

    test('l\'allarme rende le difese piu\' dure da battere', () => {
      const quotaCon = (allarme) => {
        let vinte = 0;
        for (let i = 0; i < 300; i++) {
          const { s } = pronta();
          s.sistema.allarme = allarme;
          const dif = caricaDifesa(s, prog('Guardia', 'anti-icona', 6), 'porta').difesa;
          const attacco = s.runner.deck.caricati.find((p) => p.classe === 'anti-icona');
          const r = azioneRunner(s, { tipo: 'esegui', programma: attacco.id, bersaglioTipo: 'difesa', bersaglio: dif.id });
          if (r.voce?.scontro?.vinto) vinte++;
        }
        return vinte;
      };
      const quiete = quotaCon('nessuno');
      const allarme = quotaCon('attivo');
      assert.ok(quiete > allarme, `col sistema in allarme si passa meno (${quiete} contro ${allarme} su 300)`);
    });
  });

  describe('programma Nero', () => {
    test('colpisce il cervello del netrunner e puo\' ucciderlo', () => {
      const { s } = pronta();
      const nero = caricaDifesa(s, prog('Hellhound', 'anti-operatore', 12), 'porta').difesa;
      let giri = 0;
      while (s.runner.dentro && giri < 400) {
        giri++;
        s.turno = 'master';
        azioneMaster(s, { tipo: 'colpisci', difesa: nero.id, danni: '2D6' });
      }
      assert.equal(s.runner.dentro, false, `il netrunner ci lascia le penne (${giri} colpi)`);
      assert.equal(s.stato, 'chiusa');
      assert.ok(s.runner.ferite >= 40);
      assert.ok(s.diario.some((v) => v.tipo === 'nero'), 'il diario lo racconta');
    });

    test('puo\' anche togliere INT', () => {
      const { s } = pronta();
      const nero = caricaDifesa(s, prog('Hellhound', 'anti-operatore', 12), 'porta').difesa;
      for (let i = 0; i < 60 && s.runner.dentro; i++) {
        s.turno = 'master';
        azioneMaster(s, { tipo: 'colpisci', difesa: nero.id, danni: '1D6', intPersa: '1D3' });
      }
      assert.ok(s.runner.intPersa > 0, 'l\'INT persa viene registrata');
    });

    test('una difesa non Nera che colpisce il runner lo rivela e basta', () => {
      const { s } = pronta();
      const dif = caricaDifesa(s, prog('Watchdog', 'individuazione', 12), 'porta').difesa;
      for (let i = 0; i < 40 && !s.runner.rilevato; i++) {
        s.turno = 'master';
        azioneMaster(s, { tipo: 'colpisci', difesa: dif.id });
      }
      assert.equal(s.runner.rilevato, true);
      assert.equal(s.runner.ferite, 0, 'ma non gli fa male');
    });
  });

  describe('scansione e allarme', () => {
    test('scrutare puo\' rivelare le difese dormienti del nodo', () => {
      let trovate = 0;
      for (let i = 0; i < 60; i++) {
        const { s } = pronta();
        caricaDifesa(s, prog('Trappola', 'allarme', 5), 'porta');
        azioneRunner(s, { tipo: 'scruta' });
        if (s.sistema.difese[0].scoperto) trovate++;
      }
      assert.ok(trovate > 30, `con INT 9 e Hacking 7 si trova spesso (${trovate}/60)`);
    });

    test('il Master alza l\'allarme e lo si legge nel diario', () => {
      const { s } = pronta();
      azioneRunner(s, { tipo: 'passa' });
      azioneMaster(s, { tipo: 'allarme', livello: 'attivo' });
      assert.equal(s.sistema.allarme, 'attivo');
      assert.match(s.diario.at(-1).testo, /Allarme del sistema/);
      assert.equal(allarmePerId('attivo').modDifese, 4);
      assert.equal(allarmePerId('inventato').id, 'nessuno', 'un livello ignoto vale quiete');
    });
  });

  describe('uscita e chiusura', () => {
    test('il netrunner puo\' scollegarsi', () => {
      const { s } = pronta();
      azioneRunner(s, { tipo: 'disconnetti' });
      assert.equal(s.stato, 'chiusa');
      assert.equal(s.runner.dentro, false);
      assert.match(azioneRunner(s, { tipo: 'passa' }).errore, /non e' in corso/);
    });

    test('il Master puo\' chiudere la sessione', () => {
      const { s } = pronta();
      azioneRunner(s, { tipo: 'passa' });
      azioneMaster(s, { tipo: 'chiudi' });
      assert.equal(s.stato, 'chiusa');
    });
  });

  describe('cosa vede chi', () => {
    test('il Master vede tutto, il netrunner solo cio\' che ha scoperto', () => {
      const { s } = pronta();
      caricaDifesa(s, prog('Agguato', 'anti-icona', 7), 'archivio');
      const vM = vista(s, 'master');
      const vR = vista(s, 'runner');
      assert.equal(vM.sistema.difese.length, 1, 'il Master vede la difesa dormiente');
      assert.equal(vR.sistema.difese.length, 0, 'il netrunner no');
      assert.equal(vR.sistema.difeseNascoste, 1, 'ma sa che qualcosa c\'e\'');
    });

    test('il contenuto di un nodo si vede solo arrivandoci', () => {
      const { s } = pronta();
      const primaVista = vista(s, 'runner').sistema.nodi.find((n) => n.id === 'archivio');
      assert.equal(primaVista.contenuto, '', 'da fuori non si legge');
      const archivio = s.sistema.nodi.find((n) => n.id === 'archivio');
      archivio.mura = 0; archivio.violato = true;
      const dopo = vista(s, 'runner').sistema.nodi.find((n) => n.id === 'archivio');
      assert.equal(dopo.contenuto, 'I dossier');
    });

    test('cio\' che il Master si tiene per se\' non arriva mai al netrunner', () => {
      const { s } = pronta();
      const archivio = s.sistema.nodi.find((n) => n.id === 'archivio');
      archivio.mura = 0; archivio.violato = true;
      const vR = JSON.stringify(vista(s, 'runner'));
      assert.ok(!vR.includes('registro dei pagamenti'), 'il campo nascosto resta nascosto');
      assert.ok(JSON.stringify(vista(s, 'master')).includes('registro dei pagamenti'));
    });

    test('nessuna vista contiene i token dei posti', () => {
      const { s, tokenRunner, tokenMaster } = pronta();
      for (const ruolo of ['master', 'runner']) {
        const v = JSON.stringify(vista(s, ruolo));
        assert.ok(!v.includes(tokenRunner), `il token del netrunner non compare nella vista ${ruolo}`);
        assert.ok(!v.includes(tokenMaster), `il token del Master non compare nella vista ${ruolo}`);
      }
    });
  });

  describe('riconoscimento del posto', () => {
    test('ogni token da\' il proprio ruolo, gli altri niente', () => {
      const { s, tokenRunner, tokenMaster } = pronta();
      assert.equal(ruoloPerToken(s, tokenMaster), 'master');
      assert.equal(ruoloPerToken(s, tokenRunner), 'runner');
      assert.equal(ruoloPerToken(s, 'inventato'), null);
      assert.equal(ruoloPerToken(s, null), null);
      assert.equal(ruoloPerToken(s, ''), null);
    });

    test('i due token sono diversi fra loro', () => {
      const { tokenRunner, tokenMaster } = pronta();
      assert.notEqual(tokenRunner, tokenMaster);
      assert.ok(tokenMaster.length >= 32, 'abbastanza lungo da non indovinarsi');
    });
  });

  describe('tabelle', () => {
    test('i tipi di nodo e i livelli d\'allarme hanno id, nome e descrizione', () => {
      for (const t of [...TIPI_NODO, ...LIVELLI_ALLARME]) {
        assert.ok(t.id && t.nome && t.desc, `${t.id} incompleto`);
      }
    });

    test('l\'allarme peggiora la vita al netrunner, non la migliora', () => {
      const mod = LIVELLI_ALLARME.map((l) => l.modDifese);
      assert.deepEqual(mod, [...mod].sort((a, b) => a - b), 'crescenti');
      assert.equal(mod[0], 0, 'in quiete nessun modificatore');
    });

    test('il deck ha una dimensione predefinita sensata', () => {
      assert.ok(UM_DECK_DEFAULT >= 10 && UM_DECK_DEFAULT <= 100);
    });
  });
});
