# CyberCompanion

Editor di schede personaggio per **Cyberpunk 2020**, edizione italiana.
Crea un personaggio a mano oppure lo genera completo in un colpo solo, lo salva
su Cloudflare D1 e lo esporta in JSON o in PDF stampabile.

Applicazione a pagina singola servita dallo stesso Cloudflare Worker che espone
l'API, deployata da GitHub Actions a ogni push su `main`.

---

## Cosa fa

- **Generazione completamente automatica.** Caratteristiche, abilita', Lifepath,
  cyberware ed equipaggiamento escono dalle tabelle del regolamento; nome,
  aspetto, carattere e storia li scrive un modello linguistico. Senza chiavi LLM
  configurate la scheda esce comunque completa e giocabile, solo senza prosa.
- **Editor completo della cyberscheda.** Anagrafica, le nove caratteristiche con
  i derivati ricalcolati mentre scrivi, abilita' raggruppate per caratteristica
  con il budget `INT + RIF` sempre a vista, cyberware che scala davvero
  l'Umanita', catalogo di 660 armi cercabile, armature, traccia delle ferite
  cliccabile, background e Lifepath.
- **Salvataggio permanente** su Cloudflare D1.
- **Export JSON** (per il backup o per riportare la scheda altrove) e **export
  PDF** della cyberscheda su due pagine A4, pronta da stampare.
- **Accesso a password unica condivisa**: chi la conosce vede e modifica tutte le
  schede. Nessun account da gestire.
- **PWA**: si installa sul telefono e la shell resta consultabile offline.

## Architettura

```
client/          SPA vanilla, nessun framework. Servita come Static Assets.
  app.js         viste come funzioni, stack di viste come router
  pdf.js         generatore PDF minimale, font base-14, zero dipendenze
  scheda-pdf.js  impaginazione della cyberscheda su A4
  data/          generata dal build: i cataloghi di gioco come asset statici
server/
  worker.template.js   API: login, CRUD su D1, generazione
  build.js             inietta i dati nel worker e li copia in client/data/
  data/                sorgente dei dati di gioco, in JSON
  llm/                 catena di provider, struttura ripresa da poltrobot
    catalog.js         provider, modelli, interruttori del reasoning
    openai-compatible.js  un client per tutti: cambiano indirizzo, chiave, modello
    workers-ai.js      ultimo anello, senza chiavi e senza quota
    reasoning-leak.js  recupera il JSON dai modelli che pensano ad alta voce
    index.js           ordine della catena, ripiego, panchina
migrations/      schema D1
doc/             PDF di riferimento e doc/regole/ con la loro estrazione
```

Un solo Worker fa sia da API sia da hosting: `run_worker_first` in
`wrangler.toml` manda al Worker solo `/api/*`, tutto il resto e' servito come
asset statico — che su Cloudflare e' gratis e illimitato, e non consuma
richieste Worker.

I dati di gioco stanno in `server/data/*.json`. Il build ne inietta i piu'
piccoli nel bundle del Worker (servono alla generazione, che gira lato server) e
li copia tutti in `client/data/`, dove la SPA li carica direttamente. Il catalogo
armi, 280 KB, resta cosi' fuori dal bundle.

Il modello di riferimento per questa impostazione e' il repository
`harry_squatter`, da cui sono ripresi la struttura del build, il router a stack
di viste, la cascade LLM e il flusso di deploy.

## Dati di gioco

I dati seguono l'**edizione italiana**, che non e' un calco dei termini inglesi:
le caratteristiche sono `INT RIF TEC FRE FAS FOR MOV COS EMP`, `Awareness/Notice`
e' `Individuare`, `Interface` e' `Hacking`, `System Knowledge` e' `Uso computer`,
`Body` e' `Costituzione`. E' la terminologia stampata sulla scheda che i
giocatori hanno in mano.

| File | Contenuto |
|---|---|
| `stats.json` | 9 caratteristiche, derivati, bonus di Costituzione, ferite, localizzazioni |
| `roles.json` | 10 classi con abilita' di classe e abilita' chiave |
| `skills.json` | 93 abilita' raggruppate per caratteristica |
| `lifepath.json` | tabelle di stile, origini, famiglia, infanzia, motivazioni, eventi |
| `cyberware.json` | impianti con costo in Punti Umanita' e prerequisiti |
| `gear.json` | armature, equipaggiamento, tenore di vita, armi d'ordinanza per classe |
| `weapons.json` | 660 armi estratte dalla lista armi |
| `chromebook.json` | 58 voci di equipaggiamento, veicoli e cyberware di marca |

Le regole trascritte dai PDF stanno in [`doc/regole/`](doc/regole/). Dove le
fonti si contraddicevano la contraddizione e' stata risolta e **annotata nel
documento**: vedi per esempio i Punti Vita in
[`01-caratteristiche.md`](doc/regole/01-caratteristiche.md) o le abilita'
mancanti di Netrunner e Ricettatore in [`03-classi.md`](doc/regole/03-classi.md).

---

## Messa in opera

Serve un account Cloudflare (basta il piano gratuito) e questo repository su
GitHub.

### 1. Crea il database D1

Una volta sola, da locale:

```bash
npm install
npx wrangler login
npx wrangler d1 create cybercompanion
```

Il comando stampa un `database_id`. **Annotalo**: serve al passo 3.

`wrangler.toml` tiene al suo posto il segnaposto `PLACEHOLDER_DATABASE_ID`, cosi'
l'id reale non finisce nel repository; il workflow lo sostituisce al momento del
deploy.

### 2. Crea il token API Cloudflare

Su [dash.cloudflare.com](https://dash.cloudflare.com) → *My Profile* → *API
Tokens* → *Create Token* → *Custom token*, con questi permessi:

| Tipo | Risorsa | Permesso |
|---|---|---|
| Account | Workers Scripts | Edit |
| Account | D1 | Edit |
| Account | Workers AI | Edit |

Ti serve anche l'**Account ID**, visibile nella barra laterale della dashboard.

### 3. Configura GitHub

In *Settings → Secrets and variables → Actions*.

**Secrets** (scheda *Secrets*):

| Nome | Valore | Obbligatorio |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | il token del passo 2 | si |
| `CLOUDFLARE_ACCOUNT_ID` | l'Account ID Cloudflare | si |
| `APP_PASSWORD` | la password condivisa per entrare nell'app | si |
| `SESSION_SECRET` | `openssl rand -hex 32` | si |
| `GROQ_API_KEY` | da [console.groq.com/keys](https://console.groq.com/keys) | no |
| `GEMINI_API_KEY` | da [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | no |
| `OPENROUTER_API_KEY` | da [openrouter.ai/keys](https://openrouter.ai/keys) | no |
| `CEREBRAS_API_KEY` | da [cloud.cerebras.ai](https://cloud.cerebras.ai) | no |
| `MISTRAL_API_KEY` | da [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys) | no |

**Variables** (scheda *Variables*):

| Nome | Valore |
|---|---|
| `D1_DATABASE_ID` | il `database_id` del passo 1 |

Le chiavi LLM sono tutte facoltative: vedi [La catena LLM](#la-catena-llm).

### 4. Fai partire il deploy

Un push su `main`, oppure *Actions → Deploy to Cloudflare → Run workflow*.
Il workflow applica le migrazioni D1, pubblica Worker e frontend, e carica i
secret sul Worker leggendoli dai secret GitHub.

Al termine l'app risponde su `https://cybercompanion.<tuo-sottodominio>.workers.dev`.

---

## La catena LLM

La struttura e' ripresa dal repository `poltrobot`: un **catalogo dichiarativo**
di provider (`server/llm/catalog.js`) piu' una **catena con panchina**
(`server/llm/index.js`). Tutti i provider parlano il dialetto OpenAI, quindi ne
basta un client solo: cambiano indirizzo, chiave e modello.

```
groq → gemini → openrouter → cerebras → mistral → workers-ai
```

Si prova il primo; chi non ha la chiave configurata **viene saltato prima di
essere chiamato**, cosi' non si paga un errore certo per arrivare al successivo.
In fondo alla catena sta **Workers AI**, il binding `env.AI`: non ha chiavi da
gestire e non ha una quota che finisce a meta' sessione. E' il posto che in
poltrobot occupa Ollama, per la stessa ragione.

Se **nessun provider risponde**, la generazione non fallisce: la scheda esce
completa di numeri, Lifepath, cyberware ed equipaggiamento — manca solo la
prosa, e l'app te lo dice.

L'ordine si cambia con la variabile `LLM_PROVIDERS` in `wrangler.toml`, i
modelli con `<PROVIDER>_MODEL`.

### Panchina

Un provider che fallisce `LLM_SKIP_AFTER_FAILURES` volte di fila resta fuori per
`LLM_SKIP_FOR_MINUTES` minuti. Senza, ogni generazione pagherebbe il suo timeout
o il suo 429 prima di cadere oltre.

La panchina vive nella memoria dell'isolate del Worker, che Cloudflare crea e
distrugge quando vuole: e' un'ottimizzazione a conoscenza parziale, non una
garanzia. Dopo un riavvio dell'isolate un provider in panchina viene riprovato
subito — e va bene cosi', il costo e' un secondo, non un errore.

### Modelli che pensano ad alta voce

I modelli di reasoning raccontano il compito prima di svolgerlo, e qui l'output
atteso e' un oggetto JSON: una narrazione davanti al JSON lo rende inservibile.

`reasoningControls()` in `catalog.js` manda a ciascun provider **il suo**
interruttore — `reasoning_effort` su Groq e Gemini, `reasoning.exclude` su
OpenRouter — e non manda niente dove il campo non e' documentato, perche' un
campo sconosciuto e' un 400. Se un provider rifiuta comunque l'interruttore, la
richiesta viene **rispedita senza**: la risposta conta piu' della pulizia della
richiesta.

Quello che scappa lo intercetta `reasoning-leak.js`, che estrae **l'ultimo**
oggetto JSON bilanciato del testo — l'ultimo, perche' se il modello ha ragionato
prima, il risultato buono e' in fondo e non l'esempio citato a meta' strada.

### Modelli e scadenze

I nomi dei modelli cambiano spesso, e alcuni vengono spenti:

| Provider | Modello | Nota |
|---|---|---|
| Groq | `qwen/qwen3.6-27b` | gli si puo' dire di non pensare ad alta voce |
| Gemini | `gemini-3.6-flash` | **2.0-flash spenta il 1 giugno 2026**, 2.5-flash chiusa alle nuove chiavi |
| OpenRouter | `openrouter/free` | instrada su piu' modelli gratuiti |
| Cerebras | `gpt-oss-120b` | veloce, quota giornaliera piccola |
| Mistral | `mistral-small-latest` | forte nelle lingue romanze |
| Workers AI | `@cf/meta/llama-3.3-70b-instruct-fp8-fast` | binding, nessuna chiave |

Se un modello sparisce arriva un `404` o un `400 modello rifiutato`: si cambia
la variabile `<PROVIDER>_MODEL` in `wrangler.toml`, **senza toccare il codice**.

### Diagnosi

```bash
curl https://<la-tua-app>/api/health              # catena, chi e' attivo, chi in panchina
curl https://<la-tua-app>/api/health?providers=1  # interroga davvero ogni provider
```

Il secondo fa chiamate di rete vere, quindi dice anche se una chiave e'
sbagliata o un modello non esiste piu'.

## Sviluppo locale

```bash
npm install
cp .dev.vars.example .dev.vars     # metti almeno APP_PASSWORD e SESSION_SECRET
npm run db:migrate:local           # crea lo schema nel D1 locale
npm run cf:dev                     # http://127.0.0.1:8787
```

`npm run cf:dev` funziona con il segnaposto lasciato in `wrangler.toml`: per il
D1 locale l'id non deve essere reale, basta che sia stabile. Attenzione pero':
miniflare tiene **un database separato per ogni `database_id`**, quindi se
cambi quel valore devi rilanciare `npm run db:migrate:local`, altrimenti il
Worker risponde `no such table: characters`.

| Comando | Cosa fa |
|---|---|
| `npm run build:worker` | genera `dist/worker.js` e `client/data/` |
| `npm run cf:dev` | server di sviluppo locale |
| `npm run cf:deploy` | build e deploy manuale |
| `npm run db:migrate` | applica le migrazioni al D1 remoto |
| `npm run db:migrate:local` | applica le migrazioni al D1 locale |

### Prova end-to-end

`test/e2e.mjs` guida un Chromium vero dal login fino a riaprire una scheda
salvata: generazione, budget delle abilita', selettore armi, cyberware che
scala l'Umanita', ferite, salvataggio su D1 ed entrambi gli export.

```bash
npm install --no-save playwright     # non e' una dipendenza del progetto
npm run cf:dev                       # in un altro terminale
APP_PASSWORD=<quella in .dev.vars> node test/e2e.mjs
```

Playwright resta fuori da `package.json` di proposito, cosi' `npm ci` in CI non
lo scarica a ogni deploy.

### Modificare i dati di gioco

Cambia il JSON in `server/data/` e rilancia il build: non c'e' altro da toccare.
Aggiungere una classe significa aggiungere una voce a `roles.json`; aggiungere
un impianto, una voce a `cyberware.json`. Il build controlla che il JSON sia
valido e si ferma se non lo e'.

Un vincolo da rispettare: le abilita' citate in `roles.json` devono esistere in
`skills.json`, e `abilita_chiave` deve essere un sottoinsieme di `abilita`.

## API

Tutte le rotte stanno sotto `/api`. A parte `/api/health` e `/api/login`,
richiedono l'header `Authorization: Bearer <token>`.

| Metodo | Rotta | Cosa fa |
|---|---|---|
| `GET` | `/api/health` | stato del Worker, bindings e provider LLM configurati |
| `POST` | `/api/login` | `{ password }` → `{ token, scade }` |
| `GET` | `/api/characters` | elenco delle schede |
| `POST` | `/api/characters` | crea una scheda |
| `GET` | `/api/characters/:id` | legge una scheda |
| `PUT` | `/api/characters/:id` | aggiorna una scheda |
| `DELETE` | `/api/characters/:id` | elimina una scheda |
| `POST` | `/api/generate` | genera una scheda completa |

Il corpo di `/api/generate` accetta `classe`, `punti`, `eta` e `richiesta`, tutti
facoltativi: senza nessuno di essi tira tutto a caso.

## Sicurezza

La password condivisa e' confrontata **a tempo costante**: si confrontano due
HMAC invece delle stringhe grezze, cosi' i tempi di risposta non lasciano
indovinare la password un carattere alla volta. Il token di sessione e' un
payload con scadenza firmato in HMAC-SHA256 con `SESSION_SECRET`; cambiare quel
secret invalida tutte le sessioni in corso.

Login e generazione hanno rate limiter separati (10 e 20 richieste al minuto per
IP). Il CORS accetta la stessa origin, i sottodomini `workers.dev` e localhost;
per autorizzarne altri, imposta la variabile `ALLOWED_ORIGINS` con un elenco
separato da virgole.

Resta una password sola per tutti: chiunque la conosca puo' modificare o
cancellare qualsiasi scheda. E' la scelta giusta per un gruppo di gioco, non per
un servizio aperto al pubblico.

## Materiale di riferimento

I PDF in `doc/` sono materiale di riferimento personale del proprietario del
repository. Cyberpunk 2020 e' opera di R. Talsorian Games; alcuni di quei PDF
sono compendi amatoriali e non materiale ufficiale. **Il repository e' privato:
se dovesse diventare pubblico, `doc/` va rimossa.**

## Licenza

Il codice e' rilasciato sotto licenza MIT (vedi `LICENSE`). La licenza copre il
codice, non il materiale di gioco in `doc/`.
