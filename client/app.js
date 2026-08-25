/**
 * CyberCompanion — applicazione a pagina singola.
 *
 * Nessun framework: le viste sono funzioni che restituiscono un nodo, e uno
 * stack di viste fa da router (il tasto indietro del browser torna indietro
 * nello stack). Stessa impostazione di harry_squatter.
 */
'use strict';

// ------------------------------------------------------------------ stato --

const CHIAVE_TOKEN = 'cybercompanion_token';
const CHIAVE_SCADENZA = 'cybercompanion_scadenza';
const CHIAVE_BOZZA = 'cybercompanion_bozza';

const stato = {
  token: null,
  cataloghi: null,        // stats, roles, skills, cyberware, gear, weapons, lifepath
  personaggi: [],
  scheda: null,           // scheda in modifica
  idCorrente: null,       // null = non ancora salvata
  modificata: false,
  listaScaduta: false,    // la lista in memoria non riflette piu' il database
};

const CHIAVI_STAT = ['INT', 'RIF', 'TEC', 'FRE', 'FAS', 'FOR', 'MOV', 'COS', 'EMP'];

// ------------------------------------------------------------------- dom ---

const $app = document.getElementById('app');
const $barraSx = document.getElementById('barra-sx');
const $barraTitolo = document.getElementById('barra-titolo');
const $barraDx = document.getElementById('barra-dx');
const $toast = document.getElementById('toast');
const $modaleSfondo = document.getElementById('modale-sfondo');
const $modaleTitolo = document.getElementById('modale-titolo');
const $modaleCorpo = document.getElementById('modale-corpo');
const $modaleAzioni = document.getElementById('modale-azioni');

function el(tag, classe, testo) {
  const n = document.createElement(tag);
  if (classe) n.className = classe;
  if (testo != null) n.textContent = testo;
  return n;
}

function bottone(testo, onClick, classe) {
  const b = el('button', `btn ${classe || ''}`.trim(), testo);
  b.type = 'button';
  b.addEventListener('click', onClick);
  return b;
}

const ICONE = {
  indietro: '←',
  piu: '+',
  meno: '−',
  chiudi: '×',
  freccia: '›',
  cestino: '✖',
};

let timerToast;
function toast(messaggio, opzioni) {
  const o = opzioni || {};
  clearTimeout(timerToast);
  $toast.textContent = messaggio;
  $toast.className = `toast visibile${o.errore ? ' errore' : ''}`;
  timerToast = setTimeout(() => { $toast.className = 'toast'; }, o.durata || 3200);
}

/** Modale generica. `azioni` e' un array di { testo, classe, onClick }. */
function modale(titolo, corpo, azioni) {
  $modaleTitolo.textContent = titolo;
  $modaleCorpo.innerHTML = '';
  $modaleCorpo.append(typeof corpo === 'string' ? el('p', null, corpo) : corpo);
  $modaleAzioni.innerHTML = '';
  for (const a of azioni || [{ testo: 'Chiudi' }]) {
    $modaleAzioni.append(bottone(a.testo, () => {
      if (a.onClick) a.onClick();
      if (!a.mantieni) chiudiModale();
    }, a.classe));
  }
  $modaleSfondo.hidden = false;
  const primo = $modaleCorpo.querySelector('input, select, textarea, button') || $modaleAzioni.querySelector('button');
  if (primo) primo.focus();
}

function chiudiModale() {
  $modaleSfondo.hidden = true;
}

$modaleSfondo.addEventListener('click', (e) => {
  if (e.target === $modaleSfondo) chiudiModale();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$modaleSfondo.hidden) chiudiModale();
});

function conferma(titolo, testo, onSi, etichettaSi) {
  modale(titolo, testo, [
    { testo: 'Annulla', classe: 'btn-fantasma' },
    { testo: etichettaSi || 'Conferma', classe: 'btn-pericolo', onClick: onSi },
  ]);
}

// ----------------------------------------------------------------- router --

// Stack di viste: ogni voce e' { render, titolo }. Il tasto indietro del
// browser fa pop, cosi' su mobile il gesto di ritorno funziona come previsto.
const stack = [];
let ignoraPop = false;

function vaiA(vista) {
  stack.push(vista);
  history.pushState({ profondita: stack.length }, '');
  disegna();
}

function sostituisci(vista) {
  stack.length = 0;
  stack.push(vista);
  history.replaceState({ profondita: 1 }, '');
  disegna();
}

function indietro() {
  if (stack.length > 1) history.back();
}

window.addEventListener('popstate', () => {
  if (ignoraPop) { ignoraPop = false; return; }
  if (stack.length > 1) {
    stack.pop();
    // Una vista puo' avere bisogno di ricaricare i dati quando ci si torna
    // sopra: la lista, per esempio, dopo che una scheda e' stata salvata.
    const vista = stack[stack.length - 1];
    if (vista && vista.alRitorno) vista.alRitorno();
    else disegna();
  } else {
    // La home trattiene il tasto indietro invece di uscire dall'app.
    ignoraPop = true;
    history.pushState({ profondita: 1 }, '');
  }
});

function disegna() {
  const vista = stack[stack.length - 1];
  if (!vista) return;
  $barraSx.innerHTML = '';
  $barraDx.innerHTML = '';
  $app.innerHTML = '';
  $app.scrollTop = 0;
  window.scrollTo(0, 0);
  $barraTitolo.textContent = vista.titolo || 'CyberCompanion';
  if (stack.length > 1) {
    const b = bottone(ICONE.indietro, () => indietro(), 'btn-fantasma btn-icona');
    b.setAttribute('aria-label', 'Indietro');
    $barraSx.append(b);
  }
  $app.append(vista.render());
}

function schermataAttesa(messaggio) {
  const box = el('div', 'caricamento');
  box.append(el('div', 'spinner'), el('div', 'messaggio', messaggio || 'Attendere'));
  return box;
}

// -------------------------------------------------------------------- api --

async function api(percorso, opzioni) {
  const o = opzioni || {};
  const headers = { ...(o.headers || {}) };
  if (o.body) headers['Content-Type'] = 'application/json';
  if (stato.token) headers.Authorization = `Bearer ${stato.token}`;

  const risposta = await fetch(`/api${percorso}`, {
    method: o.method || 'GET',
    headers,
    body: o.body ? JSON.stringify(o.body) : undefined,
  });

  if (risposta.status === 401 && percorso !== '/login') {
    esci('Sessione scaduta, rientra con la password.');
    throw new Error('Non autenticato');
  }

  let dati = null;
  try { dati = await risposta.json(); } catch { /* risposta senza corpo */ }
  if (!risposta.ok) throw new Error((dati && dati.error) || `Errore ${risposta.status}`);
  return dati;
}

async function caricaCataloghi() {
  if (stato.cataloghi) return stato.cataloghi;
  const nomi = ['stats', 'roles', 'skills', 'cyberware', 'gear', 'lifepath'];
  const caricati = await Promise.all(nomi.map((n) => fetch(`/data/${n}.json`).then((r) => r.json())));
  stato.cataloghi = Object.fromEntries(nomi.map((n, i) => [n, caricati[i]]));
  return stato.cataloghi;
}

// Il catalogo armi e' 280 KB: si carica solo quando serve davvero, cioe' quando
// si apre il selettore delle armi.
let promessaArmi = null;
function caricaArmi() {
  if (!promessaArmi) {
    promessaArmi = fetch('/data/weapons.json').then((r) => r.json()).then((d) => d.armi);
  }
  return promessaArmi;
}

// ------------------------------------------------------------- sessione ---

function salvaSessione(token, scade) {
  stato.token = token;
  try {
    localStorage.setItem(CHIAVE_TOKEN, token);
    localStorage.setItem(CHIAVE_SCADENZA, String(scade));
  } catch { /* navigazione privata: la sessione dura solo questa scheda */ }
}

function ripristinaSessione() {
  try {
    const token = localStorage.getItem(CHIAVE_TOKEN);
    const scade = Number(localStorage.getItem(CHIAVE_SCADENZA));
    if (token && scade > Date.now()) { stato.token = token; return true; }
  } catch { /* localStorage non disponibile */ }
  return false;
}

function esci(messaggio) {
  stato.token = null;
  stato.personaggi = [];
  stato.scheda = null;
  stato.idCorrente = null;
  try {
    localStorage.removeItem(CHIAVE_TOKEN);
    localStorage.removeItem(CHIAVE_SCADENZA);
  } catch { /* ignora */ }
  sostituisci(vistaLogin());
  if (messaggio) toast(messaggio, { errore: true });
}

// ------------------------------------------------------------ vista login --

function vistaLogin() {
  return {
    titolo: 'CyberCompanion',
    render() {
      const box = el('div', 'login-scatola');
      box.append(
        el('h1', 'login-logo', 'CYBERCOMPANION'),
        el('p', 'login-sottotitolo', 'Schede personaggio · Cyberpunk 2020')
      );

      const form = el('form');
      const campo = el('div', 'campo');
      const label = el('label', null, 'Password condivisa');
      label.htmlFor = 'campo-password';
      const input = el('input');
      input.type = 'password';
      input.id = 'campo-password';
      input.autocomplete = 'current-password';
      input.required = true;
      campo.append(label, input);

      const azione = bottone('Entra', () => {}, 'btn-primario');
      azione.type = 'submit';
      azione.style.width = '100%';

      form.append(campo, azione);
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!input.value) return;
        azione.disabled = true;
        azione.textContent = 'Verifica…';
        try {
          const { token, scade } = await api('/login', { method: 'POST', body: { password: input.value } });
          salvaSessione(token, scade);
          await apriLista();
        } catch (err) {
          toast(err.message, { errore: true });
          input.value = '';
          input.focus();
        } finally {
          azione.disabled = false;
          azione.textContent = 'Entra';
        }
      });

      box.append(form);
      setTimeout(() => input.focus(), 50);
      return box;
    },
  };
}

// ------------------------------------------------------------ vista lista --

async function apriLista() {
  sostituisci({ titolo: 'Personaggi', render: () => schermataAttesa('Carico le schede') });
  try {
    const [{ personaggi }] = await Promise.all([api('/characters'), caricaCataloghi()]);
    stato.personaggi = personaggi;
    stato.listaScaduta = false;
    sostituisci(vistaLista());
  } catch (err) {
    toast(err.message, { errore: true });
    sostituisci(vistaLista());
  }
}

function dataLeggibile(ms) {
  if (!ms) return '';
  const d = new Date(ms);
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: 'short', year: 'numeric' });
}

function vistaLista() {
  return {
    titolo: 'Personaggi',
    alRitorno() {
      if (stato.listaScaduta) apriLista();
      else disegna();
    },
    render() {
      $barraDx.append(bottone('Esci', () => conferma(
        'Uscire?', 'Dovrai reinserire la password condivisa per rientrare.',
        () => esci(), 'Esci'
      ), 'btn-fantasma btn-piccolo'));

      const root = el('div');
      root.append(el('h1', 'titolo-vista', 'Schede'));
      root.append(el('p', 'sottotitolo-vista',
        stato.personaggi.length
          ? `${stato.personaggi.length} personagg${stato.personaggi.length === 1 ? 'io' : 'i'} salvat${stato.personaggi.length === 1 ? 'o' : 'i'}.`
          : 'Nessuna scheda salvata.'));

      const azioni = el('div', 'riga-azioni');
      azioni.style.marginTop = '0';
      azioni.style.marginBottom = '20px';
      azioni.append(
        bottone('Genera personaggio', () => vaiA(vistaGenerazione()), 'btn-primario'),
        bottone('Scheda vuota', () => apriEditor(schedaVuota(), null)),
        bottone('Importa JSON', () => importaJson())
      );
      root.append(azioni);

      if (!stato.personaggi.length) {
        const vuoto = el('div', 'vuoto');
        vuoto.append(
          el('p', null, 'Non c’e’ ancora nessuno.'),
          el('p', null, 'Genera un personaggio completo in un colpo solo, oppure parti da una scheda vuota.')
        );
        root.append(vuoto);
        return root;
      }

      for (const p of stato.personaggi) {
        const riga = el('button', 'scheda-riga');
        riga.type = 'button';
        const testi = el('div');
        const nome = el('div', 'nome');
        nome.append(document.createTextNode(p.name));
        if (p.handle) {
          const h = el('span', 'handle', `  "${p.handle}"`);
          nome.append(h);
        }
        testi.append(nome, el('div', 'meta', `Modificato il ${dataLeggibile(p.updated_at)}`));
        riga.append(testi);
        if (p.role) riga.append(el('div', 'classe', p.role));
        riga.addEventListener('click', () => apriPersonaggio(p.id));
        root.append(riga);
      }
      return root;
    },
  };
}

async function apriPersonaggio(id) {
  vaiA({ titolo: 'Scheda', render: () => schermataAttesa('Apro la scheda') });
  try {
    const p = await api(`/characters/${id}`);
    stack.pop();
    apriEditor(p.data, id);
  } catch (err) {
    toast(err.message, { errore: true });
    indietro();
  }
}

// -------------------------------------------------------- scheda di base ---

function schedaVuota() {
  return {
    versione: 1,
    anagrafica: {
      nome: '', soprannome: '', giocatore: '', natoA: '', eta: 21,
      nazionalita: '', altezza: null, peso: null, lingue: [],
      abbigliamento: '', capelli: '', occhi: '', segniParticolari: '',
      carattere: '', note: '',
    },
    classe: '',
    caratteristiche: Object.fromEntries(CHIAVI_STAT.map((k) => [k, 5])),
    abilita: {},
    abilitaClasseScelte: [],
    cyberware: [],
    armi: [],
    armature: [],
    equipaggiamento: [],
    veicoli: [],
    denaro: { contanti: 0, banca: 0 },
    umanita: { attuale: 50, iniziale: 50 },
    ferite: { caselle: 0 },
    reputazione: 0,
    puntiIncremento: 0,
    background: { origini: null, famiglia: null, infanzia: '', motivazioni: null, testo: '', obiettivo: '' },
    eventi: [],
  };
}

// -------------------------------------------------------- vista generazione */

function vistaGenerazione() {
  return {
    titolo: 'Genera',
    render() {
      const cat = stato.cataloghi;
      const root = el('div');
      root.append(
        el('h1', 'titolo-vista', 'Generazione automatica'),
        el('p', 'sottotitolo-vista',
          'Caratteristiche, abilita’, Lifepath, cyberware ed equipaggiamento escono dalle tabelle del regolamento. Nome, aspetto e storia li scrive un modello linguistico.')
      );

      const scelta = { classe: '', punti: cat.stats.generazione.punti_default, eta: '', richiesta: '' };

      // --- classe ---
      root.append(el('h2', 'sezione-titolo', 'Classe'));
      const griglia = el('div', 'classe-scelta');
      const carte = [];
      const casuale = el('button', 'classe-carta attiva');
      casuale.type = 'button';
      casuale.append(el('div', 'n', 'A caso'), el('div', 's', 'Lascia scegliere ai dadi.'));
      carte.push({ nodo: casuale, id: '' });
      griglia.append(casuale);

      for (const c of cat.roles.classi) {
        const carta = el('button', 'classe-carta');
        carta.type = 'button';
        carta.append(el('div', 'n', c.nome), el('div', 's', c.sottotitolo));
        carte.push({ nodo: carta, id: c.id });
        griglia.append(carta);
      }
      for (const c of carte) {
        c.nodo.addEventListener('click', () => {
          scelta.classe = c.id;
          for (const x of carte) x.nodo.classList.toggle('attiva', x === c);
        });
      }
      root.append(griglia);

      // --- livello di potenza ---
      root.append(el('h2', 'sezione-titolo', 'Livello del personaggio'));
      const pillole = el('div', 'pillole');
      for (const p of cat.stats.generazione.punti) {
        const pil = el('button', `pillola${p.totale === scelta.punti ? ' attiva' : ''}`, `${p.nome} · ${p.totale}`);
        pil.type = 'button';
        pil.addEventListener('click', () => {
          scelta.punti = p.totale;
          for (const n of pillole.children) n.classList.remove('attiva');
          pil.classList.add('attiva');
        });
        pillole.append(pil);
      }
      root.append(pillole);
      root.append(el('p', 'campo-aiuto', 'Punti totali da distribuire sulle nove caratteristiche, da 2 a 10 ciascuna.'));

      // --- eta' e richiesta ---
      root.append(el('h2', 'sezione-titolo', 'Dettagli'));
      const griglia2 = el('div', 'griglia griglia-2');

      const campoEta = el('div', 'campo');
      const lEta = el('label', null, "Eta' (lascia vuoto per tirarla)");
      lEta.htmlFor = 'gen-eta';
      const iEta = el('input');
      iEta.type = 'number'; iEta.id = 'gen-eta'; iEta.min = '16'; iEta.max = '60'; iEta.placeholder = 'a caso';
      campoEta.append(lEta, iEta);

      const campoRic = el('div', 'campo');
      const lRic = el('label', null, 'Richiesta al generatore (facoltativa)');
      lRic.htmlFor = 'gen-richiesta';
      const iRic = el('input');
      iRic.type = 'text'; iRic.id = 'gen-richiesta';
      iRic.placeholder = 'es. un netrunner paranoico che ha tradito la sua corporazione';
      iRic.maxLength = 500;
      campoRic.append(lRic, iRic);

      griglia2.append(campoEta, campoRic);
      root.append(griglia2);
      root.append(el('p', 'campo-aiuto',
        'La richiesta guida solo la parte narrativa: i numeri restano quelli tirati dalle tabelle.'));

      const azioni = el('div', 'riga-azioni');
      const genera = bottone('Genera', async () => {
        scelta.eta = iEta.value;
        scelta.richiesta = iRic.value.trim();
        stack.pop();
        vaiA({ titolo: 'Genera', render: () => schermataAttesa('Tiro i dadi e scrivo la storia') });
        try {
          const { scheda } = await api('/generate', {
            method: 'POST',
            body: {
              classe: scelta.classe || undefined,
              punti: scelta.punti,
              eta: scelta.eta ? Number(scelta.eta) : undefined,
              richiesta: scelta.richiesta || undefined,
            },
          });
          stack.pop();
          apriEditor(scheda, null, { modificata: true });
          if (!scheda.generatoConLLM) {
            toast('Nessun modello linguistico raggiungibile: la scheda ha i numeri ma non la storia.', { durata: 6000 });
          }
        } catch (err) {
          toast(err.message, { errore: true });
          stack.pop();
          disegna();
        }
      }, 'btn-primario');
      azioni.append(genera);
      root.append(azioni);

      return root;
    },
  };
}

// ------------------------------------------------------------- editor -----

function segnaModificata() {
  stato.modificata = true;
  const salva = document.getElementById('btn-salva');
  if (salva) { salva.disabled = false; salva.textContent = 'Salva'; }
  salvaBozza();
}

// La bozza locale protegge dal browser chiuso per sbaglio: non sostituisce il
// salvataggio su D1, che resta esplicito.
function salvaBozza() {
  if (!stato.scheda) return;
  try {
    localStorage.setItem(CHIAVE_BOZZA, JSON.stringify({ id: stato.idCorrente, scheda: stato.scheda, ts: Date.now() }));
  } catch { /* quota piena o navigazione privata */ }
}

function scartaBozza() {
  try { localStorage.removeItem(CHIAVE_BOZZA); } catch { /* ignora */ }
}

/** Pannello a fisarmonica. `contenuto` e' una funzione, valutata all'apertura. */
function pannello(titolo, contatore, contenuto, aperto) {
  const d = el('details', 'pannello');
  d.open = !!aperto;
  const s = el('summary', 'pannello-testa');
  s.append(el('span', 'freccia', ICONE.freccia), el('span', null, titolo));
  if (contatore != null) s.append(el('span', 'contatore', String(contatore)));
  d.append(s);
  const corpo = el('div', 'pannello-corpo');
  d.append(corpo);

  let costruito = false;
  const costruisci = () => {
    if (costruito) return;
    costruito = true;
    corpo.append(contenuto());
  };
  if (d.open) costruisci();
  d.addEventListener('toggle', () => { if (d.open) costruisci(); });
  return d;
}

/** Campo di testo legato a `oggetto[chiave]`. */
function campoTesto(oggetto, chiave, etichetta, opzioni) {
  const o = opzioni || {};
  const wrap = el('div', 'campo');
  const id = `campo-${chiave}-${Math.random().toString(36).slice(2, 7)}`;
  const l = el('label', null, etichetta);
  l.htmlFor = id;
  const input = el(o.multilinea ? 'textarea' : 'input');
  input.id = id;
  if (!o.multilinea) input.type = o.tipo || 'text';
  if (o.placeholder) input.placeholder = o.placeholder;
  if (o.righe) input.rows = o.righe;
  if (o.min != null) input.min = String(o.min);
  if (o.max != null) input.max = String(o.max);

  const valore = oggetto[chiave];
  input.value = Array.isArray(valore) ? valore.join(', ') : (valore == null ? '' : String(valore));

  input.addEventListener('input', () => {
    if (o.lista) {
      oggetto[chiave] = input.value.split(',').map((s) => s.trim()).filter(Boolean);
    } else if (o.tipo === 'number') {
      oggetto[chiave] = input.value === '' ? null : Number(input.value);
    } else {
      oggetto[chiave] = input.value;
    }
    segnaModificata();
    if (o.alCambio) o.alCambio();
  });

  wrap.append(l, input);
  if (o.aiuto) wrap.append(el('div', 'campo-aiuto', o.aiuto));
  return wrap;
}

function bonusCostituzione(cos) {
  const t = stato.cataloghi.stats.bonus_costituzione;
  return t.find((r) => cos >= r.min && cos <= r.max) || t[t.length - 1];
}

function classeCorrente() {
  return stato.cataloghi.roles.classi.find((c) => c.id === stato.scheda.classe) || null;
}

/** Indice piatto nome-abilita' -> { stat, x2 }. */
function indiceAbilita() {
  const idx = new Map();
  for (const g of stato.cataloghi.skills.gruppi) {
    for (const s of g.skills) idx.set(s.nome, { stat: g.stat, x2: !!s.x2, desc: s.desc, gruppo: g.nome });
  }
  return idx;
}

/** Elenco delle abilita' di classe, comprese le scelte libere del Tecnico. */
function abilitaDiClasse() {
  const c = classeCorrente();
  if (!c) return [];
  return [...c.abilita, ...(stato.scheda.abilitaClasseScelte || [])];
}

function apriEditor(scheda, id, opzioni) {
  const o = opzioni || {};
  stato.scheda = scheda;
  stato.idCorrente = id;
  stato.modificata = !!o.modificata;
  vaiA(vistaEditor());
}

function vistaEditor() {
  return {
    titolo: 'Scheda',
    render() {
      const s = stato.scheda;

      const salva = bottone(stato.modificata ? 'Salva' : 'Salvato', () => salvaScheda(), 'btn-primario btn-piccolo');
      salva.id = 'btn-salva';
      salva.disabled = !stato.modificata;
      $barraDx.append(salva, bottone('⋯', () => menuScheda(), 'btn-fantasma btn-icona btn-piccolo'));
      $barraTitolo.textContent = s.anagrafica.nome || 'Nuova scheda';

      const root = el('div');
      root.append(intestazioneScheda());
      root.append(pannello('Anagrafica', null, sezioneAnagrafica, true));
      root.append(pannello('Caratteristiche', null, sezioneCaratteristiche, true));
      root.append(pannello("Abilita'", Object.keys(s.abilita).length, sezioneAbilita, false));
      root.append(pannello('Cyberware', (s.cyberware || []).length, sezioneCyberware, false));
      root.append(pannello('Armi', (s.armi || []).length, sezioneArmi, false));
      root.append(pannello('Armature ed equipaggiamento', (s.armature || []).length + (s.equipaggiamento || []).length, sezioneEquipaggiamento, false));
      root.append(pannello('Ferite', `${s.ferite.caselle}/40`, sezioneFerite, false));
      root.append(pannello('Background ed eventi', (s.eventi || []).length, sezioneBackground, false));
      return root;
    },
  };
}

function intestazioneScheda() {
  const s = stato.scheda;
  const c = classeCorrente();
  const box = el('div');
  const h = el('h1', 'titolo-vista', s.anagrafica.nome || 'Nuova scheda');
  box.append(h);
  const sotto = [];
  if (s.anagrafica.soprannome) sotto.push(`"${s.anagrafica.soprannome}"`);
  if (c) sotto.push(c.nome);
  if (s.anagrafica.eta) sotto.push(`${s.anagrafica.eta} anni`);
  box.append(el('p', 'sottotitolo-vista', sotto.join(' · ') || 'Compila i campi qui sotto.'));
  return box;
}

// --- anagrafica ---

function sezioneAnagrafica() {
  const a = stato.scheda.anagrafica;
  const box = el('div');

  const g1 = el('div', 'griglia griglia-2');
  g1.append(
    campoTesto(a, 'nome', 'Nome', { alCambio: aggiornaIntestazione }),
    campoTesto(a, 'soprannome', 'Soprannome', { alCambio: aggiornaIntestazione })
  );
  box.append(g1);

  // Classe: cambiarla non tocca le abilita' gia' comprate, cambia solo quali
  // contano come abilita' di classe.
  const wrapClasse = el('div', 'campo');
  const lc = el('label', null, 'Classe');
  const sel = el('select');
  sel.id = 'select-classe';
  lc.htmlFor = sel.id;
  const vuota = el('option', null, '— nessuna —');
  vuota.value = '';
  sel.append(vuota);
  for (const c of stato.cataloghi.roles.classi) {
    const opt = el('option', null, `${c.nome} — ${c.sottotitolo}`);
    opt.value = c.id;
    if (c.id === stato.scheda.classe) opt.selected = true;
    sel.append(opt);
  }
  sel.addEventListener('change', () => {
    stato.scheda.classe = sel.value;
    stato.scheda.abilitaClasseScelte = [];
    segnaModificata();
    aggiornaIntestazione();
  });
  wrapClasse.append(lc, sel);

  const g2 = el('div', 'griglia griglia-2');
  g2.append(wrapClasse, campoTesto(a, 'giocatore', 'Giocatore'));
  box.append(g2);

  const g3 = el('div', 'griglia griglia-4');
  g3.append(
    campoTesto(a, 'eta', "Eta'", { tipo: 'number', min: 1, max: 120, alCambio: aggiornaIntestazione }),
    campoTesto(a, 'altezza', 'Altezza (cm)', { tipo: 'number', min: 50, max: 260 }),
    campoTesto(a, 'peso', 'Peso (kg)', { tipo: 'number', min: 20, max: 300 }),
    campoTesto(a, 'nazionalita', "Nazionalita'")
  );
  box.append(g3);

  const g4 = el('div', 'griglia griglia-2');
  g4.append(
    campoTesto(a, 'natoA', 'Nato a'),
    campoTesto(a, 'lingue', 'Lingue conosciute', { lista: true, aiuto: 'Separate da virgola.' })
  );
  box.append(g4);

  const g5 = el('div', 'griglia griglia-3');
  g5.append(
    campoTesto(a, 'capelli', 'Capelli'),
    campoTesto(a, 'occhi', 'Occhi'),
    campoTesto(a, 'segniParticolari', 'Segni particolari')
  );
  box.append(g5);

  box.append(campoTesto(a, 'abbigliamento', 'Abbigliamento', { multilinea: true, righe: 2 }));
  box.append(campoTesto(a, 'carattere', 'Carattere', { multilinea: true, righe: 3 }));
  box.append(campoTesto(a, 'note', 'Note', { multilinea: true, righe: 3 }));
  return box;
}

function aggiornaIntestazione() {
  const s = stato.scheda;
  const c = classeCorrente();
  const h = document.querySelector('.titolo-vista');
  if (h) h.textContent = s.anagrafica.nome || 'Nuova scheda';
  $barraTitolo.textContent = s.anagrafica.nome || 'Nuova scheda';
  const sotto = document.querySelector('.sottotitolo-vista');
  if (sotto) {
    const parti = [];
    if (s.anagrafica.soprannome) parti.push(`"${s.anagrafica.soprannome}"`);
    if (c) parti.push(c.nome);
    if (s.anagrafica.eta) parti.push(`${s.anagrafica.eta} anni`);
    sotto.textContent = parti.join(' · ') || 'Compila i campi qui sotto.';
  }
}

// --- caratteristiche ---

function sezioneCaratteristiche() {
  const s = stato.scheda;
  const box = el('div');

  const griglia = el('div', 'stat-griglia');
  for (const c of stato.cataloghi.stats.caratteristiche) {
    const cella = el('div', 'stat-cella');
    const input = el('input');
    input.type = 'number';
    input.min = '1';
    input.max = '20';
    input.value = String(s.caratteristiche[c.key] ?? '');
    input.setAttribute('aria-label', c.nome);
    input.addEventListener('input', () => {
      s.caratteristiche[c.key] = Number(input.value) || 0;
      segnaModificata();
      aggiornaDerivate();
    });
    cella.append(el('div', 'sigla', c.key), input, el('div', 'nome', c.nome));
    cella.title = c.desc || '';
    griglia.append(cella);
  }
  box.append(griglia);

  const totale = el('p', 'campo-aiuto');
  totale.id = 'totale-punti';
  box.append(totale);

  const derivate = el('div', 'derivate');
  derivate.id = 'blocco-derivate';
  nodoDerivate = derivate;
  nodoTotalePunti = totale;
  box.append(derivate);

  aggiornaDerivate();
  return box;
}

let nodoDerivate = null;
let nodoTotalePunti = null;

function aggiornaDerivate() {
  const s = stato.scheda;
  const blocco = nodoDerivate;
  if (!blocco) return;
  const st = s.caratteristiche;
  const bonus = bonusCostituzione(st.COS || 0);
  const corsa = (st.MOV || 0) * 3;
  const umanita = s.umanita || {};

  const voci = [
    ['Corsa', `${corsa} m`],
    ['Salto', `${Math.floor(corsa / 4)} m`],
    ['Peso sollevabile', `${(st.COS || 0) * 40} kg`],
    ['Peso trasportabile', `${(st.COS || 0) * 10} kg`],
    ['Tiro salvezza', `${st.COS || 0}`],
    ['Bonus resistenza', `${bonus.resistenza}`],
    ['Bonus danno', bonus.danno > 0 ? `+${bonus.danno}` : `${bonus.danno}`],
    ['Corporatura', bonus.tipo],
    ["Umanita'", `${umanita.attuale ?? '—'} / ${umanita.iniziale ?? '—'}`],
    ['Punti abilita\' di classe', `${(st.INT || 0) + (st.RIF || 0)}`],
  ];

  blocco.innerHTML = '';
  for (const [k, v] of voci) {
    const riga = el('div', 'derivata');
    riga.append(el('span', 'k', k), el('span', 'v', v));
    blocco.append(riga);
  }

  const tot = nodoTotalePunti;
  if (tot) {
    const somma = CHIAVI_STAT.reduce((a, k) => a + (Number(st[k]) || 0), 0);
    tot.textContent = `Totale distribuito: ${somma} punti. `
      + `L'Empatia scende di 1 ogni 10 punti di Umanita' persi col cyberware.`;
  }
}

// --- abilita' ---

function sezioneAbilita() {
  const s = stato.scheda;
  const idx = indiceAbilita();
  const diClasse = abilitaDiClasse();
  const box = el('div');

  // Il pannello viene costruito prima di essere inserito nel documento, quindi
  // qui getElementById non troverebbe ancora nulla: si tiene il riferimento.
  const budget = el('div', 'budget');
  budget.id = 'budget-abilita';
  nodoBudget = budget;
  box.append(budget);

  // Il Tecnico sceglie tre abilita' Tecnologia che contano come di classe.
  const classe = classeCorrente();
  if (classe && classe.scelte_libere) {
    const avviso = el('div', 'campo-aiuto');
    avviso.style.marginBottom = '12px';
    avviso.textContent = `${classe.nome}: ${classe.scelte_libere.etichetta}. `
      + `Scelte: ${(s.abilitaClasseScelte || []).join(', ') || 'nessuna'}.`;
    const scegli = bottone('Scegli le abilita\' di classe', () => selettoreScelteLibere(classe), 'btn-piccolo');
    box.append(avviso, scegli, el('hr', 'separatore'));
  }

  const cerca = el('input');
  cerca.type = 'text';
  cerca.placeholder = 'Filtra le abilita’…';
  cerca.setAttribute('aria-label', 'Filtra le abilita');
  cerca.style.marginBottom = '14px';
  box.append(cerca);

  const contenitore = el('div');
  box.append(contenitore);

  const disegnaLista = () => {
    const filtro = cerca.value.trim().toLowerCase();
    contenitore.innerHTML = '';

    // Prima le abilita' di classe, poi quelle possedute, poi tutto il resto:
    // e' l'ordine in cui servono davvero durante il gioco.
    const sezioni = [
      { titolo: `Abilita' di classe${classe ? ` — ${classe.nome}` : ''}`, nomi: diClasse },
      { titolo: 'Altre abilita\' possedute', nomi: Object.keys(s.abilita).filter((n) => !diClasse.includes(n)) },
    ];
    for (const g of stato.cataloghi.skills.gruppi) {
      // Le abilita' speciali delle altre classi non sono acquistabili: mostrarle
      // qui inviterebbe a comprare Hacking su un Solitario.
      if (g.stat === 'SPECIALE') continue;
      const nomi = g.skills.map((x) => x.nome)
        .filter((n) => !diClasse.includes(n) && !(s.abilita[n] > 0));
      if (nomi.length) sezioni.push({ titolo: g.nome, nomi, chiuso: true });
    }

    for (const sez of sezioni) {
      const nomi = sez.nomi.filter((n) => !filtro || n.toLowerCase().includes(filtro));
      if (!nomi.length) continue;
      contenitore.append(el('h3', 'sezione-titolo', sez.titolo));
      for (const nome of nomi) contenitore.append(rigaAbilita(nome, idx.get(nome), diClasse.includes(nome)));
    }
    aggiornaBudgetAbilita();
  };

  cerca.addEventListener('input', disegnaLista);
  disegnaLista();
  return box;
}

function rigaAbilita(nome, info, diClasse) {
  const s = stato.scheda;
  const riga = el('div', `abilita-riga${diClasse ? ' di-classe' : ''}`);

  const etichetta = el('div', 'nome');
  etichetta.append(document.createTextNode(nome));
  if (info) etichetta.append(el('span', 'stat-tag', info.stat));
  if (info && info.x2) {
    const d = el('span', 'difficile', ' x2');
    d.title = 'Abilita\' Difficile: costa il doppio in punti';
    etichetta.append(d);
  }
  if (info && info.desc) riga.title = info.desc;
  riga.append(etichetta);

  const totale = el('div', 'totale');
  const contatore = el('div', 'contatore-livello');
  const valore = el('span', 'valore', String(s.abilita[nome] || 0));

  const aggiorna = (delta) => {
    const nuovo = Math.max(0, Math.min(10, (s.abilita[nome] || 0) + delta));
    if (nuovo === 0) delete s.abilita[nome];
    else s.abilita[nome] = nuovo;
    valore.textContent = String(nuovo);
    riga.classList.toggle('posseduta', nuovo > 0);
    aggiornaTotaleRiga();
    segnaModificata();
    aggiornaBudgetAbilita();
  };

  function aggiornaTotaleRiga() {
    const liv = s.abilita[nome] || 0;
    const car = info && info.stat !== 'SPECIALE' ? (s.caratteristiche[info.stat] || 0) : 0;
    // Somma abilita' + caratteristica: e' il numero a cui si aggiunge il d10.
    totale.textContent = liv ? `= ${liv + car}` : '';
    totale.title = liv && car ? `${nome} ${liv} + ${info.stat} ${car}` : '';
  }
  aggiornaTotaleRiga();

  const meno = bottone(ICONE.meno, () => aggiorna(-1), 'btn-fantasma btn-icona btn-piccolo');
  meno.setAttribute('aria-label', `Togli un livello a ${nome}`);
  const piu = bottone(ICONE.piu, () => aggiorna(1), 'btn-fantasma btn-icona btn-piccolo');
  piu.setAttribute('aria-label', `Aggiungi un livello a ${nome}`);

  contatore.append(meno, valore, piu);
  riga.append(totale, contatore);
  return riga;
}

let nodoBudget = null;

/** Conta quanto e' stato speso e lo confronta con il budget del manuale. */
function aggiornaBudgetAbilita() {
  const blocco = nodoBudget;
  if (!blocco) return;
  const s = stato.scheda;
  const idx = indiceAbilita();
  const diClasse = new Set(abilitaDiClasse());

  let spesoClasse = 0, spesoLibere = 0;
  for (const [nome, livello] of Object.entries(s.abilita)) {
    const costo = livello * (idx.get(nome) && idx.get(nome).x2 ? 2 : 1);
    if (diClasse.has(nome)) spesoClasse += costo; else spesoLibere += costo;
  }
  const disponibili = (s.caratteristiche.INT || 0) + (s.caratteristiche.RIF || 0);

  blocco.innerHTML = '';
  const voce = (etichetta, speso, tetto) => {
    const n = el('span', speso > tetto ? 'sopra' : (speso === tetto ? 'ok' : 'speso'),
      `${etichetta}: ${speso} / ${tetto}`);
    blocco.append(n);
  };
  voce('Punti di classe', spesoClasse, disponibili);
  voce('Punti liberi', spesoLibere, disponibili);
  blocco.append(el('span', 'speso', 'INT + RIF per ciascun gruppo · le Difficili costano il doppio'));
}

function selettoreScelteLibere(classe) {
  const gruppo = stato.cataloghi.skills.gruppi.find((g) => g.stat === classe.scelte_libere.da_gruppo);
  const gia = new Set(classe.abilita);
  const scelte = new Set(stato.scheda.abilitaClasseScelte || []);
  const corpo = el('div');
  corpo.append(el('p', 'campo-aiuto',
    `Scegli ${classe.scelte_libere.quante} abilita’ del gruppo ${gruppo.nome}: conteranno come abilita’ di classe.`));

  const lista = el('div');
  for (const sk of gruppo.skills) {
    if (gia.has(sk.nome)) continue;
    const riga = el('label', 'abilita-riga');
    riga.style.cursor = 'pointer';
    const chk = el('input');
    chk.type = 'checkbox';
    chk.checked = scelte.has(sk.nome);
    chk.style.width = 'auto';
    chk.addEventListener('change', () => {
      if (chk.checked) {
        if (scelte.size >= classe.scelte_libere.quante) {
          chk.checked = false;
          toast(`Puoi sceglierne solo ${classe.scelte_libere.quante}.`, { errore: true });
          return;
        }
        scelte.add(sk.nome);
      } else {
        scelte.delete(sk.nome);
      }
    });
    const nome = el('div', 'nome', sk.nome);
    if (sk.x2) nome.append(el('span', 'difficile', ' x2'));
    riga.append(chk, nome);
    lista.append(riga);
  }
  corpo.append(lista);

  modale(`${classe.nome}: abilita' di classe a scelta`, corpo, [
    { testo: 'Annulla', classe: 'btn-fantasma' },
    {
      testo: 'Conferma',
      classe: 'btn-primario',
      onClick: () => {
        stato.scheda.abilitaClasseScelte = [...scelte];
        segnaModificata();
        disegna();
      },
    },
  ]);
}

// --- cyberware ---

function sezioneCyberware() {
  const s = stato.scheda;
  const box = el('div');
  const lista = el('div');

  const ridisegna = () => {
    lista.innerHTML = '';
    const puSpesi = (s.cyberware || []).reduce((a, c) => a + (Number(c.pu) || 0), 0);

    const riepilogo = el('div', 'budget');
    riepilogo.append(
      el('span', 'speso', `Umanita': ${s.umanita.attuale ?? '—'} / ${s.umanita.iniziale ?? '—'}`),
      el('span', puSpesi > 0 ? 'sopra' : 'speso', `Punti spesi in impianti: ${puSpesi}`),
      el('span', 'speso', `EMP risultante: ${Math.max(0, Math.floor((s.umanita.attuale || 0) / 10))}`)
    );
    lista.append(riepilogo);

    if ((s.umanita.attuale || 0) < 20) {
      const avviso = el('div', 'ferite-effetto');
      avviso.textContent = "Sotto i 20 punti di Umanita' il regolamento impone una terapia; sotto 0 il personaggio va in cyberpsicosi.";
      lista.append(avviso);
    }

    if (!(s.cyberware || []).length) {
      lista.append(el('div', 'vuoto', "Nessun impianto: il personaggio e' ancora tutto carne."));
    } else {
      const scorri = el('div', 'tabella-scorri');
      const t = el('table', 'dati');
      const thead = el('thead');
      const trh = el('tr');
      for (const h of ['Impianto', 'Categoria', 'PU', 'E$', 'Effetto', '']) {
        const th = el('th', ['PU', 'E$'].includes(h) ? 'num' : null, h);
        trh.append(th);
      }
      thead.append(trh);
      const tbody = el('tbody');
      (s.cyberware || []).forEach((c, i) => {
        const tr = el('tr');
        tr.append(
          el('td', null, c.nome),
          el('td', null, c.categoria || ''),
          el('td', 'num', String(c.pu ?? '')),
          el('td', 'num', String(c.costo ?? '')),
          el('td', null, c.desc || '')
        );
        const tdAz = el('td', 'num');
        const rimuovi = bottone(ICONE.cestino, () => {
          // Rimuovere l'impianto restituisce i Punti Umanita' spesi: e' una
          // scelta dell'editor, non una regola (nel gioco non tornano).
          s.umanita.attuale = Math.min(s.umanita.iniziale, (s.umanita.attuale || 0) + (Number(c.pu) || 0));
          s.cyberware.splice(i, 1);
          s.caratteristiche.EMP = Math.max(1, Math.floor(s.umanita.attuale / 10));
          segnaModificata();
          ridisegna();
        }, 'btn-fantasma btn-icona btn-piccolo');
        rimuovi.setAttribute('aria-label', `Rimuovi ${c.nome}`);
        tdAz.append(rimuovi);
        tr.append(tdAz);
        tbody.append(tr);
      });
      t.append(thead, tbody);
      scorri.append(t);
      lista.append(scorri);
    }

    const azioni = el('div', 'riga-azioni');
    azioni.append(bottone('Installa impianto', () => selettoreCyberware(ridisegna), 'btn-piccolo'));
    lista.append(azioni);
  };

  ridisegna();
  box.append(lista);
  return box;
}

/** Tira i Punti Umanita' di un impianto: "2D6", "1D6/2". */
function tiraPU(notazione) {
  const m = /^(\d+)D(\d+)(?:\/(\d+))?$/i.exec(String(notazione || '').trim());
  if (!m) return 0;
  let somma = 0;
  for (let i = 0; i < Number(m[1]); i++) somma += Math.floor(Math.random() * Number(m[2])) + 1;
  return m[3] ? Math.max(1, Math.floor(somma / Number(m[3]))) : somma;
}

function selettoreCyberware(alTermine) {
  const s = stato.scheda;
  const corpo = el('div');
  const cerca = el('input');
  cerca.type = 'text';
  cerca.placeholder = 'Cerca un impianto…';
  cerca.style.marginBottom = '12px';
  corpo.append(cerca);

  const lista = el('div');
  corpo.append(lista);

  const installati = new Set((s.cyberware || []).map((c) => c.nome));

  const disegna_ = () => {
    const filtro = cerca.value.trim().toLowerCase();
    lista.innerHTML = '';
    for (const cat of stato.cataloghi.cyberware.categorie) {
      const pezzi = cat.pezzi.filter((p) => !filtro || p.nome.toLowerCase().includes(filtro) || (p.desc || '').toLowerCase().includes(filtro));
      if (!pezzi.length) continue;
      lista.append(el('h3', 'sezione-titolo', cat.nome));
      for (const p of pezzi) {
        const riga = el('div', 'abilita-riga');
        const info = el('div', 'nome');
        info.append(document.createTextNode(p.nome));
        const dettagli = el('div', 'campo-aiuto', `${p.pu} PU · ${p.costo} E$${p.richiede ? ` · richiede ${p.richiede}` : ''}${p.desc ? ` · ${p.desc}` : ''}`);
        dettagli.style.marginTop = '2px';
        const wrap = el('div');
        wrap.style.flex = '1 1 auto';
        wrap.style.minWidth = '0';
        wrap.append(info, dettagli);
        riga.append(wrap);

        if (installati.has(p.nome)) {
          riga.append(el('span', 'campo-aiuto', 'installato'));
        } else {
          riga.append(bottone('Installa', () => {
            if (p.richiede && !installati.has(p.richiede)) {
              toast(`Serve prima: ${p.richiede}.`, { errore: true });
              return;
            }
            const pu = tiraPU(p.pu);
            s.cyberware.push({ nome: p.nome, categoria: cat.nome, pu, costo: p.costo, desc: p.desc });
            s.umanita.attuale = Math.max(0, (s.umanita.attuale || 0) - pu);
            s.caratteristiche.EMP = Math.max(1, Math.floor(s.umanita.attuale / 10));
            installati.add(p.nome);
            segnaModificata();
            toast(`${p.nome}: ${pu} punti di Umanita' persi.`);
            disegna_();
            if (alTermine) alTermine();
          }, 'btn-piccolo'));
        }
        lista.append(riga);
      }
    }
  };

  cerca.addEventListener('input', disegna_);
  disegna_();
  modale('Installa cyberware', corpo, [{ testo: 'Chiudi', classe: 'btn-fantasma' }]);
}

// --- armi ---

function sezioneArmi() {
  const s = stato.scheda;
  const box = el('div');

  const ridisegna = () => {
    box.innerHTML = '';
    if (!(s.armi || []).length) {
      box.append(el('div', 'vuoto', 'Nessuna arma.'));
    } else {
      const scorri = el('div', 'tabella-scorri');
      const t = el('table', 'dati');
      const trh = el('tr');
      for (const h of ['', 'Arma', 'Tipo', 'Pr', 'Occ', 'Rep', 'Danni', 'Cl', 'Cd', 'Aff', 'm', 'E$', '']) {
        trh.append(el('th', ['Pr', 'Cl', 'Cd', 'm', 'E$'].includes(h) ? 'num' : null, h));
      }
      const thead = el('thead');
      thead.append(trh);
      const tbody = el('tbody');
      (s.armi || []).forEach((w, i) => {
        const tr = el('tr');
        const tdUso = el('td');
        const chk = el('input');
        chk.type = 'checkbox';
        chk.checked = !!w.inUso;
        chk.style.width = 'auto';
        chk.title = 'Arma in uso';
        chk.setAttribute('aria-label', `${w.nome} in uso`);
        chk.addEventListener('change', () => { w.inUso = chk.checked; segnaModificata(); });
        tdUso.append(chk);
        tr.append(tdUso,
          el('td', null, w.nome),
          el('td', null, w.tipo || ''),
          el('td', 'num', String(w.precisione ?? '')),
          el('td', null, w.occultabilita || ''),
          el('td', null, w.reperibilita || ''),
          el('td', null, w.danni || ''),
          el('td', 'num', String(w.caricatore ?? '')),
          el('td', 'num', String(w.cadenza ?? '')),
          el('td', null, w.affidabilita || ''),
          el('td', 'num', String(w.gittata ?? '')),
          el('td', 'num', String(w.costo_eb ?? ''))
        );
        const tdAz = el('td', 'num');
        const rim = bottone(ICONE.cestino, () => { s.armi.splice(i, 1); segnaModificata(); ridisegna(); },
          'btn-fantasma btn-icona btn-piccolo');
        rim.setAttribute('aria-label', `Rimuovi ${w.nome}`);
        tdAz.append(rim);
        tr.append(tdAz);
        tbody.append(tr);
      });
      t.append(thead, tbody);
      scorri.append(t);
      box.append(scorri);
    }
    const azioni = el('div', 'riga-azioni');
    azioni.append(bottone('Aggiungi arma', () => selettoreArmi(ridisegna), 'btn-piccolo'));
    box.append(azioni);
  };

  ridisegna();
  return box;
}

function selettoreArmi(alTermine) {
  const corpo = el('div');
  const cerca = el('input');
  cerca.type = 'text';
  cerca.placeholder = 'Cerca fra 660 armi…';
  cerca.style.marginBottom = '12px';
  const lista = el('div');
  lista.append(schermataAttesa('Carico il catalogo'));
  corpo.append(cerca, lista);
  modale('Aggiungi arma', corpo, [{ testo: 'Chiudi', classe: 'btn-fantasma' }]);

  caricaArmi().then((catalogo) => {
    const disegna_ = () => {
      const filtro = cerca.value.trim().toLowerCase();
      lista.innerHTML = '';
      // Senza filtro mostrarne 660 blocca il telefono: si parte da un estratto.
      const trovate = filtro
        ? catalogo.filter((a) => a.nome.toLowerCase().includes(filtro) || (a.sezione || '').toLowerCase().includes(filtro))
        : catalogo.slice(0, 40);

      if (!filtro) {
        lista.append(el('p', 'campo-aiuto', `Prime 40 di ${catalogo.length}. Scrivi per cercare fra tutte.`));
      } else if (!trovate.length) {
        lista.append(el('div', 'vuoto', 'Nessuna arma corrisponde.'));
      }

      for (const a of trovate.slice(0, 120)) {
        const riga = el('div', 'abilita-riga');
        const wrap = el('div');
        wrap.style.flex = '1 1 auto';
        wrap.style.minWidth = '0';
        const nome = el('div', 'nome', a.nome);
        const det = el('div', 'campo-aiuto',
          `${a.tipo_esteso || a.tipo} · ${a.danni} · caric. ${a.caricatore} · CdF ${a.cadenza} · ${a.gittata} m · ${a.costo_eb} E$`);
        det.style.marginTop = '2px';
        wrap.append(nome, det);
        riga.append(wrap, bottone('Aggiungi', () => {
          const { sezione, tipo_esteso, ...pulita } = a;
          stato.scheda.armi.push({ ...pulita, inUso: stato.scheda.armi.length === 0 });
          segnaModificata();
          toast(`${a.nome} aggiunta.`);
          if (alTermine) alTermine();
        }, 'btn-piccolo'));
        lista.append(riga);
      }
      if (filtro && trovate.length > 120) {
        lista.append(el('p', 'campo-aiuto', `…e altre ${trovate.length - 120}. Restringi la ricerca.`));
      }
    };
    cerca.addEventListener('input', disegna_);
    disegna_();
    cerca.focus();
  }).catch(() => {
    lista.innerHTML = '';
    lista.append(el('div', 'vuoto', 'Catalogo armi non raggiungibile.'));
  });
}

// --- armature, equipaggiamento, denaro ---

function sezioneEquipaggiamento() {
  const s = stato.scheda;
  const box = el('div');

  const ridisegna = () => {
    box.innerHTML = '';

    // armature
    box.append(el('h3', 'sezione-titolo', 'Armature'));
    if (!(s.armature || []).length) {
      box.append(el('div', 'vuoto', 'Nessuna armatura.'));
    } else {
      (s.armature || []).forEach((a, i) => {
        const riga = el('div', 'abilita-riga');
        const wrap = el('div');
        wrap.style.flex = '1 1 auto';
        wrap.append(el('div', 'nome', a.nome),
          el('div', 'campo-aiuto', `VP ${a.vp} · ingombro ${a.ingombro} · ${a.copre} · ${a.costo} E$`));
        riga.append(wrap, bottone(ICONE.cestino, () => {
          s.armature.splice(i, 1); segnaModificata(); ridisegna();
        }, 'btn-fantasma btn-icona btn-piccolo'));
        box.append(riga);
      });
    }
    const azArm = el('div', 'riga-azioni');
    azArm.append(bottone('Aggiungi armatura', () => selettoreSemplice(
      'Aggiungi armatura',
      stato.cataloghi.gear.armature,
      (a) => `VP ${a.vp} · ingombro ${a.ingombro} · ${a.copre} · ${a.costo} E$`,
      (a) => { s.armature.push({ ...a }); segnaModificata(); ridisegna(); }
    ), 'btn-piccolo'));
    box.append(azArm);

    // equipaggiamento
    box.append(el('h3', 'sezione-titolo', 'Equipaggiamento'));
    if (!(s.equipaggiamento || []).length) {
      box.append(el('div', 'vuoto', 'Niente in tasca.'));
    } else {
      (s.equipaggiamento || []).forEach((e, i) => {
        const riga = el('div', 'abilita-riga');
        const wrap = el('div');
        wrap.style.flex = '1 1 auto';
        wrap.append(el('div', 'nome', `${e.quantita > 1 ? `${e.quantita}x ` : ''}${e.nome}`));
        if (e.note) wrap.append(el('div', 'campo-aiuto', e.note));
        riga.append(wrap, bottone(ICONE.cestino, () => {
          s.equipaggiamento.splice(i, 1); segnaModificata(); ridisegna();
        }, 'btn-fantasma btn-icona btn-piccolo'));
        box.append(riga);
      });
    }
    const azEq = el('div', 'riga-azioni');
    azEq.append(
      bottone('Dal catalogo', () => selettoreSemplice(
        'Aggiungi equipaggiamento',
        stato.cataloghi.gear.equipaggiamento,
        (o) => `${o.categoria} · ${o.costo} E$${o.nota ? ` · ${o.nota}` : ''}`,
        (o) => { s.equipaggiamento.push({ nome: o.nome, quantita: 1, note: o.nota || o.categoria }); segnaModificata(); ridisegna(); }
      ), 'btn-piccolo'),
      bottone('Voce libera', () => {
        const corpo = el('div');
        const oggetto = { nome: '', quantita: 1, note: '' };
        corpo.append(
          campoTesto(oggetto, 'nome', 'Oggetto'),
          campoTesto(oggetto, 'quantita', 'Quantita\'', { tipo: 'number', min: 1 }),
          campoTesto(oggetto, 'note', 'Note')
        );
        modale('Aggiungi una voce', corpo, [
          { testo: 'Annulla', classe: 'btn-fantasma' },
          {
            testo: 'Aggiungi',
            classe: 'btn-primario',
            onClick: () => {
              if (!oggetto.nome.trim()) return;
              s.equipaggiamento.push({ ...oggetto, quantita: Number(oggetto.quantita) || 1 });
              segnaModificata();
              ridisegna();
            },
          },
        ]);
      }, 'btn-piccolo')
    );
    box.append(azEq);

    // denaro
    box.append(el('h3', 'sezione-titolo', 'Denaro'));
    const g = el('div', 'griglia griglia-2');
    g.append(
      campoTesto(s.denaro, 'contanti', 'Contanti (E$)', { tipo: 'number' }),
      campoTesto(s.denaro, 'banca', 'In banca (E$)', { tipo: 'number' })
    );
    box.append(g);
  };

  ridisegna();
  return box;
}

/** Modale di scelta da un elenco piatto. */
function selettoreSemplice(titolo, voci, descrizione, onScelta) {
  const corpo = el('div');
  const cerca = el('input');
  cerca.type = 'text';
  cerca.placeholder = 'Cerca…';
  cerca.style.marginBottom = '12px';
  const lista = el('div');
  corpo.append(cerca, lista);

  const disegna_ = () => {
    const filtro = cerca.value.trim().toLowerCase();
    lista.innerHTML = '';
    for (const v of voci.filter((x) => !filtro || x.nome.toLowerCase().includes(filtro))) {
      const riga = el('div', 'abilita-riga');
      const wrap = el('div');
      wrap.style.flex = '1 1 auto';
      wrap.append(el('div', 'nome', v.nome), el('div', 'campo-aiuto', descrizione(v)));
      riga.append(wrap, bottone('Aggiungi', () => { onScelta(v); toast(`${v.nome} aggiunto.`); }, 'btn-piccolo'));
      lista.append(riga);
    }
  };
  cerca.addEventListener('input', disegna_);
  disegna_();
  modale(titolo, corpo, [{ testo: 'Chiudi', classe: 'btn-fantasma' }]);
}

// --- ferite ---

function sezioneFerite() {
  const s = stato.scheda;
  const box = el('div');
  const gradi = stato.cataloghi.stats.ferite;

  const traccia = el('div', 'ferite');
  const effetto = el('div', 'ferite-effetto');

  const aggiorna = () => {
    traccia.innerHTML = '';
    let indice = 0;
    for (const grado of gradi) {
      const colonna = el('div', 'ferite-grado');
      colonna.append(el('div', 'g', grado.grado));
      const caselle = el('div', 'ferite-caselle');
      for (let i = 0; i < grado.caselle; i++) {
        const mia = indice;
        const b = el('button', `casella${mia < s.ferite.caselle ? ' piena' : ''}`);
        b.type = 'button';
        b.setAttribute('aria-label', `${grado.grado}, casella ${i + 1}`);
        b.addEventListener('click', () => {
          // Cliccare una casella porta il totale a quel punto; ricliccare
          // l'ultima piena la svuota.
          s.ferite.caselle = s.ferite.caselle === mia + 1 ? mia : mia + 1;
          segnaModificata();
          aggiorna();
        });
        caselle.append(b);
        indice++;
      }
      colonna.append(caselle);
      traccia.append(colonna);
    }

    const gradoAttuale = s.ferite.caselle === 0
      ? null
      : gradi[Math.min(gradi.length - 1, Math.ceil(s.ferite.caselle / 4) - 1)];
    effetto.hidden = !gradoAttuale;
    if (gradoAttuale) {
      effetto.textContent = `${gradoAttuale.grado} — ${gradoAttuale.effetto}. `
        + `Tiro di stordimento: d10 contro FRE ${s.caratteristiche.FRE || 0} - ${gradoAttuale.stordimento}.`;
    }
    // Il contatore giusto e' quello del pannello che contiene questa traccia:
    // un querySelector generico prenderebbe il primo pannello della pagina.
    const pann = traccia.closest('details.pannello');
    const cont = pann && pann.querySelector('.contatore');
    if (cont) cont.textContent = `${s.ferite.caselle}/40`;
  };

  aggiorna();
  box.append(traccia, effetto);
  box.append(el('p', 'campo-aiuto',
    'Ogni grado vale 4 caselle. Al primo grado Mortale si tira Salvezza: d10 contro COS, sotto o pari si resta vivi.'));

  const azioni = el('div', 'riga-azioni');
  azioni.append(bottone('Guarisci tutto', () => { s.ferite.caselle = 0; segnaModificata(); aggiorna(); }, 'btn-piccolo'));
  box.append(azioni);
  return box;
}

// --- background ---

function sezioneBackground() {
  const s = stato.scheda;
  const bg = s.background || (s.background = {});
  const box = el('div');

  box.append(campoTesto(bg, 'testo', 'Storia', { multilinea: true, righe: 6 }));
  box.append(campoTesto(bg, 'obiettivo', 'Obiettivo attuale', { multilinea: true, righe: 2 }));

  if (bg.origini || bg.famiglia || bg.motivazioni) {
    box.append(el('h3', 'sezione-titolo', 'Lifepath'));
    const derivate = el('div', 'derivate');
    const voce = (k, v) => {
      if (!v) return;
      const r = el('div', 'derivata');
      r.append(el('span', 'k', k), el('span', 'v', v));
      derivate.append(r);
    };
    if (bg.origini) { voce('Origini', bg.origini.etnia); voce('Lingua', bg.origini.lingua); }
    if (bg.famiglia) { voce('Famiglia', bg.famiglia.rango); voce('Status', bg.famiglia.status); voce('Tragedia', bg.famiglia.tragedia); }
    voce('Infanzia', bg.infanzia);
    if (bg.fratelli && bg.fratelli.length) voce('Fratelli', bg.fratelli.map((f) => `${f.chi} (${f.rapporto})`).join('; '));
    if (bg.motivazioni) {
      const m = bg.motivazioni;
      voce('Personalita\'', m.personalita);
      voce('Persona piu\' cara', m.personaPiuCara);
      voce('Cio\' che conta', m.cosaContaDiPiu);
      voce('Come vede gli altri', m.comeVediGliAltri);
      voce('Oggetto piu\' prezioso', m.oggettoPiuPrezioso);
    }
    box.append(derivate);
  }

  box.append(el('h3', 'sezione-titolo', 'Eventi del passato'));
  const lista = el('div');
  const ridisegnaEventi = () => {
    lista.innerHTML = '';
    if (!(s.eventi || []).length) {
      lista.append(el('div', 'vuoto', 'Nessun evento registrato.'));
    }
    (s.eventi || []).forEach((e, i) => {
      const riga = el('div', 'abilita-riga');
      const wrap = el('div');
      wrap.style.flex = '1 1 auto';
      wrap.style.minWidth = '0';
      wrap.append(el('div', 'nome', `${e.anno ? `${e.anno} anni — ` : ''}${e.testo || ''}`));
      if (e.dettaglio) wrap.append(el('div', 'campo-aiuto', e.dettaglio));
      riga.append(wrap, bottone(ICONE.cestino, () => {
        s.eventi.splice(i, 1); segnaModificata(); ridisegnaEventi();
      }, 'btn-fantasma btn-icona btn-piccolo'));
      lista.append(riga);
    });
  };
  ridisegnaEventi();
  box.append(lista);

  const azioni = el('div', 'riga-azioni');
  azioni.append(bottone('Aggiungi evento', () => {
    const evento = { anno: '', testo: '', dettaglio: '' };
    const corpo = el('div');
    corpo.append(
      campoTesto(evento, 'anno', "Eta'", { tipo: 'number', min: 0, max: 120 }),
      campoTesto(evento, 'testo', 'Cosa e\' successo'),
      campoTesto(evento, 'dettaglio', 'Dettaglio')
    );
    modale('Aggiungi un evento', corpo, [
      { testo: 'Annulla', classe: 'btn-fantasma' },
      {
        testo: 'Aggiungi',
        classe: 'btn-primario',
        onClick: () => {
          if (!evento.testo.trim()) return;
          s.eventi.push(evento);
          s.eventi.sort((a, b) => (Number(a.anno) || 0) - (Number(b.anno) || 0));
          segnaModificata();
          ridisegnaEventi();
        },
      },
    ]);
  }, 'btn-piccolo'));
  box.append(azioni);
  return box;
}

// ------------------------------------------------------- salva ed esporta --

async function salvaScheda() {
  const btn = document.getElementById('btn-salva');
  if (btn) { btn.disabled = true; btn.textContent = 'Salvo…'; }
  try {
    if (stato.idCorrente) {
      await api(`/characters/${stato.idCorrente}`, { method: 'PUT', body: { scheda: stato.scheda } });
    } else {
      const creato = await api('/characters', { method: 'POST', body: { scheda: stato.scheda } });
      stato.idCorrente = creato.id;
    }
    stato.modificata = false;
    scartaBozza();
    if (btn) btn.textContent = 'Salvato';
    toast('Scheda salvata.');
    // La lista in memoria e' ormai vecchia. Si marca da ricaricare invece di
    // svuotarla: svuotandola, tornando indietro comparirebbe "nessuna scheda".
    stato.listaScaduta = true;
  } catch (err) {
    toast(err.message, { errore: true });
    if (btn) { btn.disabled = false; btn.textContent = 'Salva'; }
  }
}

function scaricaBlob(blob, nomeFile) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeFile;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

function esportaJson() {
  const blob = new Blob([JSON.stringify(stato.scheda, null, 2)], { type: 'application/json' });
  scaricaBlob(blob, window.SchedaPDF.nomeFile(stato.scheda, 'json'));
  toast('JSON esportato.');
}

function esportaPdf() {
  try {
    const blob = window.SchedaPDF.genera(stato.scheda, stato.cataloghi);
    scaricaBlob(blob, window.SchedaPDF.nomeFile(stato.scheda, 'pdf'));
    toast('PDF esportato.');
  } catch (err) {
    toast(`Non sono riuscito a generare il PDF: ${err.message}`, { errore: true });
  }
}

function importaJson() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json,.json';
  input.addEventListener('change', async () => {
    const file = input.files && input.files[0];
    if (!file) return;
    try {
      const scheda = JSON.parse(await file.text());
      if (!scheda || typeof scheda !== 'object' || !scheda.caratteristiche) {
        throw new Error('Non sembra una scheda di CyberCompanion.');
      }
      // Riempie i campi che una scheda esportata da una versione precedente
      // potrebbe non avere, cosi' l'editor non trova mai undefined.
      apriEditor({ ...schedaVuota(), ...scheda }, null, { modificata: true });
      toast('Scheda importata: e’ ancora da salvare.');
    } catch (err) {
      toast(`File non valido: ${err.message}`, { errore: true });
    }
  });
  input.click();
}

function menuScheda() {
  const corpo = el('div');
  const azioni = [
    ['Esporta JSON', esportaJson],
    ['Esporta PDF', esportaPdf],
  ];
  for (const [testo, fn] of azioni) {
    const b = bottone(testo, () => { chiudiModale(); fn(); });
    b.style.width = '100%';
    b.style.marginBottom = '8px';
    b.style.justifyContent = 'flex-start';
    corpo.append(b);
  }

  if (stato.idCorrente) {
    const elimina = bottone('Elimina la scheda', () => {
      chiudiModale();
      conferma('Eliminare la scheda?',
        `"${stato.scheda.anagrafica.nome || 'Senza nome'}" verra' cancellata dal database. L'operazione non si annulla.`,
        async () => {
          try {
            await api(`/characters/${stato.idCorrente}`, { method: 'DELETE' });
            stato.listaScaduta = true;
            scartaBozza();
            toast('Scheda eliminata.');
            await apriLista();
          } catch (err) {
            toast(err.message, { errore: true });
          }
        }, 'Elimina');
    }, 'btn-pericolo');
    elimina.style.width = '100%';
    elimina.style.justifyContent = 'flex-start';
    corpo.append(el('hr', 'separatore'), elimina);
  }

  modale('Azioni sulla scheda', corpo, [{ testo: 'Chiudi', classe: 'btn-fantasma' }]);
}

// Avvisa prima di perdere modifiche non salvate.
window.addEventListener('beforeunload', (e) => {
  if (stato.modificata) { e.preventDefault(); e.returnValue = ''; }
});

// --------------------------------------------------------------- avvio ----

function bozzaRecuperabile() {
  try {
    const grezza = localStorage.getItem(CHIAVE_BOZZA);
    if (!grezza) return null;
    const b = JSON.parse(grezza);
    // Una bozza piu' vecchia di una settimana e' quasi sempre spazzatura.
    if (!b || !b.scheda || Date.now() - (b.ts || 0) > 7 * 86400_000) return null;
    return b;
  } catch {
    return null;
  }
}

async function avvia() {
  if (!ripristinaSessione()) {
    sostituisci(vistaLogin());
    return;
  }
  await apriLista();

  const bozza = bozzaRecuperabile();
  if (bozza) {
    const nome = (bozza.scheda.anagrafica && bozza.scheda.anagrafica.nome) || 'Senza nome';
    modale('Modifiche non salvate',
      `C’e’ una bozza di "${nome}" rimasta aperta. Vuoi riprenderla?`, [
        { testo: 'Scarta', classe: 'btn-fantasma', onClick: scartaBozza },
        {
          testo: 'Riprendi',
          classe: 'btn-primario',
          onClick: () => apriEditor(bozza.scheda, bozza.id, { modificata: true }),
        },
      ]);
  }
}

avvia();
