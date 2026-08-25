import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { creaLLM, catenaProvider, creaProvider, NOMI_PROVIDER } from '../server/llm/index.js';
import { CATALOG, resolveProvider, reasoningControls } from '../server/llm/catalog.js';
import { estraiJson, ripulisci, isReasoningLeak } from '../server/llm/reasoning-leak.js';

/** Provider finto: si comporta come gli dici. */
const finto = (name, comportamento) => {
  const spia = { chiamate: 0 };
  return {
    provider: {
      name, label: name, model: `${name}-modello`,
      async salute() { return { modelli: 1 }; },
      async chatJson() { spia.chiamate += 1; return comportamento(); },
    },
    spia,
  };
};

describe('catalogo dei provider', () => {
  test('ogni voce ha indirizzo, chiave, modello e link per procurarsi la chiave', () => {
    for (const [nome, spec] of Object.entries(CATALOG)) {
      for (const campo of ['label', 'baseUrl', 'envKey', 'modelVar', 'model', 'keyUrl', 'note']) {
        assert.ok(spec[campo], `${nome}.${campo} mancante`);
      }
      assert.match(spec.baseUrl, /^https:\/\//, `${nome} usa https`);
    }
  });

  test('la variabile del modello ha il nome che il resolver si aspetta', () => {
    for (const [nome, spec] of Object.entries(CATALOG)) {
      const risolto = resolveProvider({ [spec.modelVar]: 'modello-di-prova' }, nome);
      assert.equal(risolto.model, 'modello-di-prova', `${spec.modelVar} non viene letto`);
    }
  });

  test('senza override valgono i valori del catalogo', () => {
    const g = resolveProvider({}, 'groq');
    assert.equal(g.model, CATALOG.groq.model);
    assert.equal(g.apiKey, '', 'nessuna chiave, nessun errore');
    assert.equal(resolveProvider({}, 'inesistente'), null);
  });

  test('gemini non punta piu\' a un modello ritirato', () => {
    // 2.0-flash e' stata spenta il 1 giugno 2026, 2.5-flash e' chiusa alle nuove chiavi.
    assert.ok(!/2\.0-flash/.test(CATALOG.gemini.model), 'gemini-2.0-flash non esiste piu\'');
  });

  describe('interruttori del reasoning', () => {
    test('a Groq con Qwen si dice di non pensare', () => {
      assert.deepEqual(reasoningControls('groq', 'qwen/qwen3.6-27b'), { reasoning_effort: 'none' });
    });
    test('a Groq con gpt-oss si abbassa e si esclude dalla risposta', () => {
      const r = reasoningControls('groq', 'gpt-oss-120b');
      assert.equal(r.include_reasoning, false);
      assert.equal(r.reasoning_effort, 'low');
    });
    test('OpenRouter ha un campo unico per tutti i modelli che instrada', () => {
      assert.deepEqual(reasoningControls('openrouter', 'qualunque'), { reasoning: { exclude: true } });
    });
    test('a Gemini 3.x non si manda nulla: non si puo\' spegnere e sarebbe un 400', () => {
      assert.deepEqual(reasoningControls('gemini', 'gemini-3.6-flash'), {});
      assert.deepEqual(reasoningControls('gemini', 'gemini-2.5-flash'), { reasoning_effort: 'none' });
    });
    test('dove il modello non ragiona non si manda niente', () => {
      assert.deepEqual(reasoningControls('mistral', 'mistral-small-latest'), {});
      assert.deepEqual(reasoningControls('cerebras', 'llama-3.3-70b'), {});
    });
  });
});

describe('ordine della catena', () => {
  test('chi non ha la chiave viene saltato prima di essere chiamato', () => {
    assert.deepEqual(catenaProvider({}), [], 'senza chiavi la catena e\' vuota');
    assert.deepEqual(catenaProvider({ GROQ_API_KEY: 'x' }), ['groq']);
    assert.deepEqual(catenaProvider({ GROQ_API_KEY: 'x', AI: { run() {} } }), ['groq', 'workers-ai']);
  });

  test('l\'ordine si detta con LLM_PROVIDERS e i doppioni cadono', () => {
    const ordine = catenaProvider({
      LLM_PROVIDERS: 'mistral, groq, groq, inventato',
      MISTRAL_API_KEY: 'x', GROQ_API_KEY: 'y',
    });
    assert.deepEqual(ordine, ['mistral', 'groq'], 'ordine rispettato, doppioni e sconosciuti scartati');
  });

  test('una chiave fatta di soli spazi non conta', () => {
    assert.deepEqual(catenaProvider({ GROQ_API_KEY: '   ' }), []);
  });

  test('creaProvider conosce tutti i nomi del catalogo piu\' workers-ai', () => {
    for (const nome of NOMI_PROVIDER) {
      assert.ok(creaProvider({ AI: { run() {} } }, nome), `${nome} costruibile`);
    }
    assert.throws(() => creaProvider({}, 'inventato'), /sconosciuto/);
  });
});

describe('ripiego e panchina', () => {
  test('se il primo fallisce risponde il secondo', async () => {
    const a = finto('primo', () => { throw new Error('quota esaurita'); });
    const b = finto('secondo', () => ({ dati: { ok: true }, token: 10 }));
    const llm = creaLLM({}, [a.provider, b.provider]);
    const r = await llm.chatJson('s', 'u');
    assert.equal(r.provider, 'secondo');
    assert.deepEqual(r.dati, { ok: true });
    assert.equal(a.spia.chiamate, 1, 'il primo e\' stato provato');
  });

  test('dopo N fallimenti di fila il provider va in panchina e non viene piu\' chiamato', async () => {
    const a = finto('primo', () => { throw new Error('giu\''); });
    const b = finto('secondo', () => ({ dati: {}, token: 1 }));
    const llm = creaLLM({ LLM_SKIP_AFTER_FAILURES: '2', LLM_SKIP_FOR_MINUTES: '10' }, [a.provider, b.provider]);

    await llm.chatJson('s', 'u');
    await llm.chatJson('s', 'u');
    assert.deepEqual(llm.stato().inPanchina, ['primo']);
    assert.equal(llm.stato().inRipiego, true, 'si sta usando il ripiego');

    const prima = a.spia.chiamate;
    await llm.chatJson('s', 'u');
    await llm.chatJson('s', 'u');
    assert.equal(a.spia.chiamate, prima, 'in panchina non viene piu\' interpellato');
    assert.equal(b.spia.chiamate, 4);
  });

  test('l\'ultimo della catena non va mai in panchina: senza di lui non resta nessuno', async () => {
    const solo = finto('unico', () => { throw new Error('giu\''); });
    const llm = creaLLM({ LLM_SKIP_AFTER_FAILURES: '1' }, [solo.provider]);
    await llm.chatJson('s', 'u');
    await llm.chatJson('s', 'u');
    assert.deepEqual(llm.stato().inPanchina, [], 'resta in fila');
    assert.equal(solo.spia.chiamate, 2, 'e continua a essere provato');
  });

  test('un successo azzera il conto dei fallimenti', async () => {
    let cade = true;
    const a = finto('altalena', () => { if (cade) throw new Error('giu\''); return { dati: {}, token: 1 }; });
    const b = finto('riserva', () => ({ dati: {}, token: 1 }));
    const llm = creaLLM({ LLM_SKIP_AFTER_FAILURES: '3' }, [a.provider, b.provider]);
    await llm.chatJson('s', 'u');
    assert.equal(llm.stato().fallimenti.altalena, 1);
    cade = false;
    await llm.chatJson('s', 'u');
    assert.equal(llm.stato().fallimenti.altalena, 0, 'il contatore riparte da zero');
  });

  test('se non risponde nessuno si ottiene null, non un\'eccezione', async () => {
    const llm = creaLLM({}, [
      finto('x', () => { throw new Error('giu\''); }).provider,
      finto('y', () => { throw new Error('giu\''); }).provider,
    ]);
    assert.equal(await llm.chatJson('s', 'u'), null);
  });

  test('una catena vuota e\' innocua', async () => {
    const llm = creaLLM({}, []);
    assert.equal(llm.vuota(), true);
    assert.equal(await llm.chatJson('s', 'u'), null);
    assert.match(llm.descrivi(), /nessun provider/);
    assert.deepEqual(llm.stato().catena, []);
  });

  test('descrivi() mostra la fila con i modelli', () => {
    const llm = creaLLM({}, [finto('a', () => ({})).provider, finto('b', () => ({})).provider]);
    assert.equal(llm.descrivi(), 'a/a-modello → b/b-modello');
  });

  test('salute() interroga tutti e riporta chi risponde', async () => {
    const buono = finto('buono', () => ({}));
    const rotto = { provider: { name: 'rotto', label: 'rotto', model: 'm', async salute() { throw new Error('chiave rifiutata'); }, async chatJson() {} } };
    const llm = creaLLM({}, [buono.provider, rotto.provider]);
    const s = await llm.salute();
    assert.equal(s.buono.ok, true);
    assert.equal(s.rotto.ok, false);
    assert.match(s.rotto.errore, /chiave rifiutata/);
  });
});

describe('recupero del JSON', () => {
  test('un JSON pulito passa cosi\' com\'e\'', () => {
    assert.deepEqual(estraiJson('{"nome":"Ilaria"}'), { nome: 'Ilaria' });
  });

  test('i recinti markdown vengono tolti', () => {
    assert.deepEqual(estraiJson('```json\n{"nome":"Vera"}\n```'), { nome: 'Vera' });
    assert.deepEqual(estraiJson('```\n{"a":1}\n```'), { a: 1 });
  });

  test('i tag di pensiero vengono tolti', () => {
    assert.deepEqual(estraiJson('<think>rifletto a lungo</think>{"nome":"Kai"}'), { nome: 'Kai' });
    assert.deepEqual(estraiJson('un pensiero senza apertura</think>{"a":2}'), { a: 2 });
  });

  test('si prende l\'ultimo oggetto, non l\'esempio citato nel ragionamento', () => {
    const testo = 'Devo creare il personaggio. Il formato e\' {"esempio": 1}. Ecco il risultato:\n{"nome":"Kai"}';
    assert.deepEqual(estraiJson(testo), { nome: 'Kai' },
      'una regex dalla prima graffa all\'ultima non interpreterebbe nulla');
  });

  test('gli oggetti annidati restano interi', () => {
    const j = estraiJson('preambolo {"a":{"b":{"c":[1,2,3]}},"d":"}"}');
    assert.deepEqual(j, { a: { b: { c: [1, 2, 3] } }, d: '}' }, 'una graffa dentro una stringa non inganna il parser');
  });

  test('solo ragionamento e nessun JSON restituisce null', () => {
    assert.equal(estraiJson("L'utente vuole un personaggio. Devo generare nome e background secondo lo schema."), null);
    assert.equal(estraiJson(''), null);
    assert.equal(estraiJson(null), null);
  });

  test('il ragionamento viene riconosciuto per forma', () => {
    assert.equal(isReasoningLeak("L'utente vuole un personaggio. Devo creare nome e background seguendo lo schema indicato."), true);
    assert.equal(isReasoningLeak('**Persona**: una netrunner\n**Output**: json'), true);
    assert.equal(isReasoningLeak('Ilaria Bonetti'), false, 'un nome non e\' un ragionamento');
    assert.equal(isReasoningLeak(''), false);
  });

  test('ripulisci lascia intatto un testo gia\' pulito', () => {
    assert.equal(ripulisci('  {"a":1}  '), '{"a":1}');
  });
});
