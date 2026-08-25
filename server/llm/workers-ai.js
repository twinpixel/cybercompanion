import { estraiJson, isReasoningLeak, ripulisci } from './reasoning-leak.js';

/**
 * Workers AI: il binding `env.AI` di Cloudflare.
 *
 * Nella catena occupa il posto che in `poltrobot` e' di Ollama — l'ultimo — e
 * per la stessa ragione: non ha chiavi da gestire e non ha una quota che si
 * esaurisce nel mezzo di una sessione. Non e' il modello migliore della fila,
 * ma e' quello che c'e' sempre, e una scheda generata con un modello mediocre
 * vale piu' di una scheda non generata.
 */

const MODELLI = [
  '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
  '@cf/meta/llama-4-scout-17b-16e-instruct',
  '@cf/meta/llama-3.2-3b-instruct',
];

export function creaProviderWorkersAi(env) {
  const primario = (env.AI_MODEL || '').trim() || MODELLI[0];
  const modelli = [primario, ...MODELLI.filter((m) => m !== primario)];

  return {
    name: 'workers-ai',
    label: 'Workers AI',
    model: primario,
    serveChiave: false,
    haChiave: true,          // il binding non ha chiavi: o c'e' o non c'e'
    envKey: null,
    keyUrl: 'https://developers.cloudflare.com/workers-ai/',

    async salute() {
      if (!env.AI?.run) throw new Error('Binding AI non configurato in wrangler.toml');
      return { modelli: modelli.length, modelloElencato: true };
    },

    async chatJson(sistema, utente, { temperature, maxTokens } = {}) {
      if (!env.AI?.run) throw new Error('Binding AI non configurato');

      let ultimoErrore;
      // Sul piano gratuito un modello puo' essere negato (errore 5018): in quel
      // caso si prova il successivo prima di dichiarare fallito il provider.
      for (const modello of modelli) {
        try {
          const out = await env.AI.run(modello, {
            messages: [
              { role: 'system', content: sistema },
              { role: 'user', content: utente },
            ],
            max_tokens: maxTokens ?? Number(env.LLM_MAX_TOKENS ?? 1200),
            temperature: temperature ?? Number(env.LLM_TEMPERATURE ?? 0.9),
          });
          const grezzo = (out?.response || out?.result?.response || '').trim();
          if (!grezzo) throw new Error('risposta vuota');

          const dati = estraiJson(grezzo);
          if (!dati) {
            throw new Error(isReasoningLeak(ripulisci(grezzo))
              ? 'ha risposto col proprio ragionamento invece che col JSON'
              : 'JSON non interpretabile');
          }
          return { dati, token: null, modello };
        } catch (err) {
          ultimoErrore = new Error(`Workers AI (${modello}): ${err.message}`);
        }
      }
      throw ultimoErrore ?? new Error('Workers AI non disponibile');
    },
  };
}
