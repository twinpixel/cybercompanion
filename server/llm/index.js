import { CATALOG, CATALOG_NAMES } from './catalog.js';
import { creaProviderOpenAi } from './openai-compatible.js';
import { creaProviderWorkersAi } from './workers-ai.js';

// Workers AI ha il suo client; tutti gli altri parlano il dialetto OpenAI.
export const NOMI_PROVIDER = [...CATALOG_NAMES, 'workers-ai'];

const CATENA_DEFAULT = ['groq', 'gemini', 'openrouter', 'cerebras', 'mistral', 'workers-ai'];

export function creaProvider(env, name) {
  if (name === 'workers-ai') return creaProviderWorkersAi(env);
  if (CATALOG[name]) return creaProviderOpenAi(env, name);
  throw new Error(`Provider LLM sconosciuto: "${name}". Disponibili: ${NOMI_PROVIDER.join(', ')}`);
}

/**
 * Costruisce l'ordine della catena. Si scrive nella variabile LLM_PROVIDERS di
 * wrangler.toml come elenco separato da virgole; senza, vale l'ordine di
 * default. I provider senza chiave configurata vengono saltati: tenerli in fila
 * significherebbe pagare un errore certo prima di arrivare al successivo.
 */
export function catenaProvider(env) {
  const elenco = (env.LLM_PROVIDERS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const richiesti = elenco.length ? elenco : CATENA_DEFAULT;
  const visti = new Set();

  return richiesti.filter((name) => {
    if (!name || visti.has(name)) return false;
    visti.add(name);
    if (name === 'workers-ai') return Boolean(env.AI?.run);
    const spec = CATALOG[name];
    return Boolean(spec && (env[spec.envKey] || '').trim());
  });
}

/**
 * Prova i provider in ordine: vince il primo che risponde. Conta con i piani
 * gratuiti, dove ciascuno ha la sua quota: quando il primo la esaurisce si cade
 * sul successivo, e in fondo alla catena c'e' Workers AI, che non si esaurisce.
 *
 * Un provider che continua a fallire finisce in panchina per qualche minuto:
 * senza, ogni generazione pagherebbe il timeout o il 429 prima di cadere oltre.
 *
 * ATTENZIONE: la panchina vive nella memoria dell'isolate del Worker, che
 * Cloudflare crea e distrugge quando vuole. E' quindi un'ottimizzazione a
 * conoscenza parziale, non una garanzia: dopo un riavvio dell'isolate un
 * provider in panchina viene riprovato subito. Va bene cosi' — il costo di una
 * chiamata sprecata e' un secondo, non un errore.
 *
 * `iniettati` serve ai test: una fila di provider finti al posto di quelli veri.
 */
export function creaLLM(env, iniettati = null) {
  const maxFallimenti = Number(env.LLM_SKIP_AFTER_FAILURES ?? 3);
  const panchinaMs = Number(env.LLM_SKIP_FOR_MINUTES ?? 10) * 60_000;

  const providers = (iniettati || catenaProvider(env).map((name) => creaProvider(env, name)))
    .filter(Boolean)
    .map((provider) => ({ provider, fallimenti: 0, inPanchinaFino: 0 }));

  function inPanchina(voce) {
    if (!voce.inPanchinaFino) return false;
    if (Date.now() < voce.inPanchinaFino) return true;
    voce.inPanchinaFino = 0;
    voce.fallimenti = 0;
    return false;
  }

  function segnaFallimento(voce, err, ultimo) {
    voce.fallimenti += 1;
    if (voce.fallimenti >= maxFallimenti && panchinaMs > 0 && !ultimo) {
      voce.inPanchinaFino = Date.now() + panchinaMs;
      console.warn(
        `[LLM] "${voce.provider.name}" ha fallito ${voce.fallimenti} volte di fila: ` +
        `in panchina per ${panchinaMs / 60_000} minuti (${err.message})`
      );
    } else {
      console.warn(`[LLM] "${voce.provider.name}" non ha risposto (${err.message})`);
    }
  }

  return {
    get providers() {
      return providers.map((v) => v.provider);
    },

    vuota() {
      return providers.length === 0;
    },

    /** "groq/qwen3.6-27b → gemini/gemini-3.6-flash → workers-ai/..." */
    descrivi() {
      if (!providers.length) return 'nessun provider configurato';
      return providers.map((v) => `${v.provider.name}/${v.provider.model}`).join(' → ');
    },

    /** Stato della catena, per /api/health e per i test. */
    stato() {
      const ora = Date.now();
      const attivo = providers.find((v) => !v.inPanchinaFino || ora >= v.inPanchinaFino);
      return {
        catena: providers.map((v) => v.provider.name),
        attivo: attivo?.provider.name || null,
        inRipiego: Boolean(attivo) && attivo !== providers[0],
        inPanchina: providers
          .filter((v) => v.inPanchinaFino && ora < v.inPanchinaFino)
          .map((v) => v.provider.name),
        fallimenti: Object.fromEntries(providers.map((v) => [v.provider.name, v.fallimenti])),
      };
    },

    async salute() {
      const esiti = {};
      for (const { provider } of providers) {
        try {
          const info = await provider.salute();
          esiti[provider.name] = { ok: true, modello: provider.model, ...info };
        } catch (err) {
          esiti[provider.name] = { ok: false, errore: err.message };
        }
      }
      return esiti;
    },

    /**
     * Chiede un oggetto JSON al primo provider che risponde.
     * Restituisce null se non risponde nessuno: chi chiama decide se e' fatale.
     */
    async chatJson(sistema, utente, opzioni = {}) {
      const errori = [];

      for (let i = 0; i < providers.length; i += 1) {
        const voce = providers[i];
        const ultimo = i === providers.length - 1;

        // Un provider in panchina si salta, a meno che sia rimasto solo lui.
        if (inPanchina(voce) && !ultimo) continue;

        try {
          const esito = await voce.provider.chatJson(sistema, utente, opzioni);
          voce.fallimenti = 0;
          console.log(`[LLM] risposta da "${voce.provider.name}"${esito.token ? ` (${esito.token} token)` : ''}`);
          return { ...esito, provider: voce.provider.name };
        } catch (err) {
          errori.push(`${voce.provider.name}: ${err.message}`);
          segnaFallimento(voce, err, ultimo);
        }
      }

      if (errori.length) console.warn(`[LLM] nessun provider ha risposto — ${errori.join(' | ')}`);
      return null;
    },
  };
}
