import { resolveProvider, reasoningControls } from './catalog.js';
import { estraiJson, isReasoningLeak, ripulisci } from './reasoning-leak.js';

/**
 * Client per qualunque servizio con API compatibile con quella di OpenAI:
 * Groq, Gemini, OpenRouter, Cerebras, Mistral e simili. Cambiano solo
 * indirizzo, chiave e modello, che vengono dal catalogo.
 *
 * Ripreso da `poltrobot` (src/llm/openai-compatible.js).
 */
export function creaProviderOpenAi(env, name) {
  const spec = resolveProvider(env, name);
  if (!spec) throw new Error(`Provider sconosciuto: "${name}"`);
  if (!spec.baseUrl) throw new Error(`Manca l'indirizzo per il provider "${name}"`);

  function intestazioni() {
    const h = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${spec.apiKey}`,
    };
    // OpenRouter usa questi due campi per identificare l'applicazione.
    if (name === 'openrouter') {
      h['HTTP-Referer'] = env.OPENROUTER_APP_URL || 'https://github.com/twinpixel/cybercompanion';
      h['X-Title'] = env.OPENROUTER_APP_NAME || 'CyberCompanion';
    }
    return h;
  }

  return {
    name,
    label: spec.label,
    model: spec.model,
    serveChiave: true,
    haChiave: Boolean(spec.apiKey),
    envKey: spec.envKey,
    keyUrl: spec.keyUrl,

    async salute() {
      if (!spec.apiKey) {
        throw new Error(`${spec.envKey} non impostata (chiave gratuita su ${spec.keyUrl})`);
      }
      // /models e' l'unico endpoint che tutti implementano allo stesso modo.
      let res;
      try {
        res = await fetch(`${spec.baseUrl}/models`, {
          headers: intestazioni(),
          signal: AbortSignal.timeout(10_000),
        });
      } catch (err) {
        throw new Error(`${spec.label} non raggiungibile (${err.message})`);
      }
      if (res.status === 401 || res.status === 403) {
        throw new Error(`${spec.label}: chiave rifiutata (${res.status}) — controlla ${spec.envKey}`);
      }
      if (!res.ok) throw new Error(`${spec.label} ha risposto ${res.status}`);

      const corpo = await res.json().catch(() => null);
      const modelli = (corpo?.data || []).map((m) => m.id);
      // Non fatale: alcuni provider filtrano l'elenco in base alla chiave.
      const elencato = !modelli.length || modelli.includes(spec.model);
      return { modelli: modelli.length, modelloElencato: elencato };
    },

    /**
     * Chiede al modello un oggetto JSON. Restituisce l'oggetto gia' interpretato:
     * qui non serve mai testo libero, e un JSON rotto e' un fallimento del
     * provider come lo sarebbe un 500, quindi deve far scattare la catena.
     */
    async chatJson(sistema, utente, { temperature, maxTokens, timeoutMs } = {}) {
      if (!spec.apiKey) throw new Error(`${spec.envKey} non impostata`);

      // Campi che impediscono a un modello di reasoning di raccontare il compito
      // invece di svolgerlo, piu' quello che la configurazione vuole aggiungere.
      const extra = {
        ...reasoningControls(name, spec.model),
        ...leggiExtraBody(env, name),
      };

      const invia = (campi) =>
        fetch(`${spec.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: intestazioni(),
          signal: AbortSignal.timeout(timeoutMs ?? Number(env.LLM_TIMEOUT_MS) ?? 60_000),
          body: JSON.stringify({
            model: spec.model,
            messages: [
              { role: 'system', content: sistema },
              { role: 'user', content: utente },
            ],
            temperature: temperature ?? Number(env.LLM_TEMPERATURE ?? 0.9),
            max_tokens: maxTokens ?? Number(env.LLM_MAX_TOKENS ?? 1200),
            response_format: { type: 'json_object' },
            ...campi,
          }),
        });

      let res = await invia(extra);

      // I provider rinominano e ritirano questi interruttori senza preavviso. Se
      // uno viene rifiutato, la risposta conta piu' della pulizia della
      // richiesta: si riprova senza, invece di passare al provider successivo.
      const nomi = Object.keys(extra);
      if (!res.ok && res.status === 400 && nomi.length) {
        const dettaglio = await res.clone().text().catch(() => '');
        if (nomi.some((k) => dettaglio.includes(k))) {
          res = await invia({});
        }
      }

      if (!res.ok) {
        const dettaglio = await res.text().catch(() => '');
        if (res.status === 429 || res.status === 402) {
          throw new Error(`${spec.label}: quota del piano gratuito esaurita (${res.status})`);
        }
        if (res.status === 404 || res.status === 400) {
          throw new Error(
            `${spec.label} ${res.status}: modello "${spec.model}" rifiutato. ` +
            `Controlla il nome sulla loro pagina dei modelli. ${dettaglio.slice(0, 150)}`
          );
        }
        throw new Error(`${spec.label} ${res.status}: ${dettaglio.slice(0, 200)}`);
      }

      const corpo = await res.json();
      if (corpo.error) throw new Error(`${spec.label}: ${corpo.error.message || 'errore sconosciuto'}`);
      const grezzo = (corpo?.choices?.[0]?.message?.content || '').trim();
      if (!grezzo) throw new Error(`${spec.label} ha risposto vuoto`);

      const dati = estraiJson(grezzo);
      if (!dati) {
        const perche = isReasoningLeak(ripulisci(grezzo))
          ? 'ha risposto col proprio ragionamento invece che col JSON'
          : 'ha risposto con un JSON non interpretabile';
        throw new Error(`${spec.label} ${perche}`);
      }
      return { dati, token: corpo.usage?.total_tokens ?? null };
    },
  };
}

/**
 * Campi aggiuntivi per provider, da una variabile JSON in wrangler.toml
 * (per esempio GROQ_EXTRA_BODY). Serve a sbloccare un provider senza toccare il
 * codice quando cambia un interruttore: un JSON malformato viene ignorato,
 * perche' far cadere la generazione per una variabile scritta male sarebbe peggio.
 */
function leggiExtraBody(env, name) {
  const grezzo = env[`${name.toUpperCase()}_EXTRA_BODY`];
  if (!grezzo) return {};
  try {
    const v = JSON.parse(grezzo);
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}
