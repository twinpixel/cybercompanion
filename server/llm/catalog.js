/**
 * Catalogo dei provider LLM con piano gratuito, tutti con API compatibile con
 * quella di OpenAI: cambiano solo indirizzo, nome della chiave e modello.
 *
 * Struttura ripresa da `poltrobot` (src/llm/catalog.js).
 *
 * NOTA: limiti e nomi dei modelli cambiano spesso. Se un modello sparisce
 * arriva un 404 o un 400: si controlla la pagina dei modelli del provider e si
 * cambia il valore della variabile <PROVIDER>_MODEL in wrangler.toml — nessuna
 * modifica al codice.
 */

/**
 * Campi che impediscono a un modello di ragionare ad alta voce.
 *
 * I modelli di reasoning raccontano il compito prima di svolgerlo, e qui
 * l'output atteso e' un oggetto JSON: una narrazione davanti al JSON lo rende
 * inservibile. `reasoning-leak.js` la intercetta a valle, ma intercettarla e' il
 * rimedio peggiore — il migliore e' non produrla.
 *
 * Ogni provider ha il suo interruttore e lo chiama a modo suo, quindi c'e' una
 * regola per provider e non si manda nulla dove il campo non e' stato letto
 * nella documentazione di quel provider: un campo non riconosciuto e' un 400.
 * Dove un modello non ragiona non si manda niente, perche' non c'e' niente da
 * spegnere.
 */
export function reasoningControls(name, model) {
  const id = String(model || '');

  if (name === 'groq') {
    // Qwen 3.x: "none" e' la modalita' non pensante documentata, quella che Qwen
    // stessa consiglia per il dialogo generico. Non produce nulla da filtrare.
    if (/qwen3/i.test(id)) return { reasoning_effort: 'none' };
    // gpt-oss: il reasoning non si spegne, si puo' solo tenere fuori dalla
    // risposta e abbassare. `reasoning_format` non e' supportato su questi.
    if (/gpt-oss/i.test(id)) return { include_reasoning: false, reasoning_effort: 'low' };
    return {};
  }

  // OpenRouter ha un campo unico valido per tutti i modelli che instrada.
  // `exclude` invece di `enabled: false`: i modelli il cui reasoning e'
  // obbligatorio rifiutano di essere spenti, e qui basta che non torni indietro.
  if (name === 'openrouter') return { reasoning: { exclude: true } };

  // Cerebras documenta `reasoning_effort` per gpt-oss e niente di equivalente a
  // `include_reasoning` di Groq, quindi si manda solo lo sforzo.
  if (name === 'cerebras' && /gpt-oss/i.test(id)) return { reasoning_effort: 'low' };

  // Gemini accetta `reasoning_effort` sull'endpoint compatibile con OpenAI, ma
  // solo la 2.5 puo' sentirsi dire "none". La 2.0 non ragionava affatto, e sulla
  // 3.x non si puo' spegnere: mandarglielo si guadagnerebbe solo un 400.
  if (name === 'gemini' && /2\.5/.test(id)) return { reasoning_effort: 'none' };

  // Mistral: mistral-small e il resto di quella linea non ragionano. Magistral
  // e' il loro modello di reasoning e non ha un interruttore che valga la pena.
  return {};
}

export const CATALOG = {
  groq: {
    label: 'Groq',
    baseUrl: 'https://api.groq.com/openai/v1',
    envKey: 'GROQ_API_KEY',
    modelVar: 'GROQ_MODEL',
    keyUrl: 'https://console.groq.com/keys',
    model: 'qwen/qwen3.6-27b',
    note: 'Molto veloce, e a questo modello si puo\' dire di non pensare ad alta voce.',
  },

  gemini: {
    label: 'Google Gemini',
    // Anche Google espone un endpoint compatibile con OpenAI: nessun client dedicato.
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
    envKey: 'GEMINI_API_KEY',
    modelVar: 'GEMINI_MODEL',
    keyUrl: 'https://aistudio.google.com/apikey',
    // 2.0-flash e' stato spento il 1 giugno 2026; 2.5-flash e' chiusa alle nuove
    // chiavi. Il bersaglio di migrazione indicato da Google e' 3.6-flash.
    model: 'gemini-3.6-flash',
    note: 'Piano gratuito generoso, se la cava bene con le lingue europee.',
  },

  openrouter: {
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    envKey: 'OPENROUTER_API_KEY',
    modelVar: 'OPENROUTER_MODEL',
    keyUrl: 'https://openrouter.ai/keys',
    model: 'openrouter/free',
    note: 'Un ponte verso molti modelli; openrouter/free instrada su quelli gratuiti.',
  },

  cerebras: {
    label: 'Cerebras',
    baseUrl: 'https://api.cerebras.ai/v1',
    envKey: 'CEREBRAS_API_KEY',
    modelVar: 'CEREBRAS_MODEL',
    keyUrl: 'https://cloud.cerebras.ai',
    model: 'gpt-oss-120b',
    note: 'Molto veloce, con una piccola quota giornaliera.',
  },

  mistral: {
    label: 'Mistral',
    baseUrl: 'https://api.mistral.ai/v1',
    envKey: 'MISTRAL_API_KEY',
    modelVar: 'MISTRAL_MODEL',
    keyUrl: 'https://console.mistral.ai/api-keys',
    model: 'mistral-small-latest',
    note: 'Modelli europei, forti nelle lingue romanze.',
  },
};

export const CATALOG_NAMES = Object.keys(CATALOG);

/**
 * Impostazioni effettive di un provider: catalogo piu' eventuali override.
 * In un Worker non c'e' un config.json: chiavi e modelli arrivano da `env`,
 * cioe' dai secret e dalle [vars] di wrangler.toml.
 */
export function resolveProvider(env, name) {
  const base = CATALOG[name];
  if (!base) return null;
  return {
    name,
    label: base.label,
    baseUrl: (env[`${name.toUpperCase()}_BASE_URL`] || base.baseUrl).replace(/\/+$/, ''),
    model: (env[base.modelVar] || '').trim() || base.model,
    apiKey: (env[base.envKey] || '').trim(),
    envKey: base.envKey,
    keyUrl: base.keyUrl,
    note: base.note,
  };
}
