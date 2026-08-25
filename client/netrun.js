/**
 * Netrunning: la console dei programmi e il tavolo della sessione.
 *
 * La console e' un banco di lavoro — si sceglie una Funzione alla volta e la
 * difficolta' si aggiorna sotto le dita — perche' il conto del manuale e' una
 * somma lunga in cui e' facilissimo sbagliare, e sbagliarla a meta' partita
 * significa fermare il tavolo.
 *
 * Il tavolo e' invece a due posti: il Master allestisce il sistema dal proprio
 * dispositivo, il netrunner entra col codice dal suo e gioca la parte "online"
 * mentre gli altri combattono. Lo stato vero sta nel Durable Object; qui si
 * legge uno snapshot e si rilegge ogni pochi secondi.
 */
'use strict';

const CHIAVE_POSTI = 'cybercompanion_netrun';

const statoNetrun = {
  catalogo: null,        // funzioni, icone, optional, variabili, modi di forza
  catalogoSessione: null,// tipi di nodo, livelli d'allarme
  spec: null,            // programma in costruzione
  specSalvata: null,     // com'era quando e' stato caricato, per il costo della modifica
  idProgramma: null,
  calcolo: null,
  programmi: [],
  vista: null,           // snapshot della sessione
  codice: null,
  posto: null,
  ruolo: null,
  timer: null,
};

/** I 62 programmi del manuale, tradotti dal Worker in specifiche costruibili. */
let promessaLibreria = null;
function caricaLibreria() {
  if (!promessaLibreria) {
    promessaLibreria = api('/netrun/libreria').then((d) => d.programmi);
  }
  return promessaLibreria;
}

/** I sistemi gia' allestiti: sono un asset statico, non passano dall'API. */
let promessaSistemi = null;
function caricaSistemiPronti() {
  if (!promessaSistemi) {
    promessaSistemi = fetch('/data/netrun-sistemi.json').then((r) => r.json()).then((d) => d.sistemi);
  }
  return promessaSistemi;
}

async function caricaCatalogoNetrun() {
  if (!statoNetrun.catalogo) statoNetrun.catalogo = await api('/netrun/catalogo');
  return statoNetrun.catalogo;
}

function programmaVuotoClient() {
  return {
    versione: 1,
    nome: '',
    funzioni: [],
    forza: 5,
    modoForza: 'normale',
    bersaglio: '',
    icona: 'semplice',
    descrizioneIcona: '',
    optional: [],
    variabili: [],
    note: '',
  };
}

// =========================================================== programmi ======

async function apriProgrammi() {
  const attesa = vistaAttesa('Programmi', 'Carico i programmi');
  vaiA(attesa);
  try {
    const [{ programmi }] = await Promise.all([api('/programs'), caricaCatalogoNetrun()]);
    statoNetrun.programmi = programmi;
    rimpiazzaCima(vistaProgrammi(), attesa);
  } catch (err) {
    toast(err.message, { errore: true });
    indietro();
  }
}

function vistaProgrammi() {
  return {
    titolo: 'Programmi',
    alRitorno() { ricaricaProgrammi(); },
    render() {
      const root = el('div');
      root.append(
        el('h1', 'titolo-vista', 'Console del Netrunner'),
        el('p', 'sottotitolo-vista',
          'Programmi scritti da zero: Funzioni, Forza, icona e optional. La difficolta’, le UM e il prezzo si aggiornano a ogni scelta.')
      );

      const azioni = el('div', 'riga-azioni');
      azioni.style.margin = '0 0 20px';
      azioni.append(
        bottone('Nuovo programma', () => apriCostruttore(programmaVuotoClient(), null), 'btn-primario'),
        bottone('Libreria del manuale', () => vaiA(vistaLibreria()))
      );
      root.append(azioni);

      if (!statoNetrun.programmi.length) {
        root.append(el('div', 'vuoto', 'Nessun programma in libreria.'));
        return root;
      }

      for (const p of statoNetrun.programmi) {
        const riga = el('button', 'scheda-riga');
        riga.type = 'button';
        const testi = el('div');
        testi.append(
          el('div', 'nome', p.name),
          el('div', 'meta', `Forza ${p.forza} · Diff ${p.difficolta} · ${p.um} UM · ${p.costo} E$`)
        );
        riga.append(testi);
        if (p.classe) riga.append(el('div', 'classe', p.classe));
        riga.addEventListener('click', () => caricaProgramma(p.id));
        root.append(riga);
      }
      return root;
    },
  };
}

/**
 * I programmi del manuale, pronti da aprire o da copiare.
 *
 * Non sono un elenco da leggere: ognuno arriva con la propria specifica, quindi
 * si apre nel costruttore, si modifica e si carica in un deck come se lo avessi
 * scritto tu. Il conto viene rifatto dalle regole, non copiato dal PDF: dove i
 * due numeri non coincidono la riga lo dice, invece di far finta di niente.
 */
function vistaLibreria() {
  const filtro = { testo: '', classe: '' };

  return {
    titolo: 'Libreria del manuale',
    render() {
      const root = el('div');
      root.append(
        el('h1', 'titolo-vista', 'Libreria del manuale'),
        el('p', 'sottotitolo-vista',
          'I programmi del regolamento, gia' + "\u2019" + ' scomposti in Funzioni, Forza, icona e optional.')
      );

      const cerca = el('input');
      cerca.type = 'text';
      cerca.placeholder = 'Cerca per nome o per quello che fa\u2026';
      root.append(cerca);

      const classi = el('div', 'pillole');
      root.append(classi);

      const lista = el('div');
      lista.append(schermataAttesa('Carico la libreria'));
      root.append(lista);

      caricaLibreria().then((programmi) => {
        const tutteLeClassi = [...new Set(programmi.map((p) => p.classe))].sort();

        const disegnaClassi = () => {
          classi.innerHTML = '';
          for (const c of ['', ...tutteLeClassi]) {
            const b = el('button', `pillola${filtro.classe === c ? ' attiva' : ''}`);
            b.type = 'button';
            b.textContent = c || 'tutti';
            b.addEventListener('click', () => { filtro.classe = c; ridisegna(); });
            classi.append(b);
          }
        };

        const ridisegna = () => {
          disegnaClassi();
          lista.innerHTML = '';
          const t = filtro.testo.trim().toLowerCase();
          const trovati = programmi.filter((p) => (
            (!filtro.classe || p.classe === filtro.classe)
            && (!t || p.nome.toLowerCase().includes(t) || (p.alias || '').toLowerCase().includes(t)
                || p.descrizione.toLowerCase().includes(t))
          ));

          lista.append(el('p', 'campo-aiuto',
            `${trovati.length} programm${trovati.length === 1 ? 'o' : 'i'} su ${programmi.length}.`));

          for (const p of trovati) {
            const carta = el('div', 'pronto');
            const testa = el('div', 'testa');
            testa.append(el('span', 'nome', p.nome));
            if (p.alias) testa.append(el('span', 'handle', `\u201c${p.alias}\u201d`));
            testa.append(el('span', 'classe', p.classe));
            carta.append(testa);
            carta.append(el('div', 'stat-riga',));
            const numeri = carta.querySelector('.stat-riga');
            for (const [k, v] of [['Forza', p.forza], ['Diff', p.difficolta], ['UM', p.um], ['E$', p.costo]]) {
              numeri.append(el('span', 'v', `${k} ${v}`));
            }
            if (p.descrizione) carta.append(el('div', 'sommario', p.descrizione));
            carta.append(el('div', 'campo-aiuto', p.formula));
            if (p.divergenza) {
              carta.append(avviso(
                `Sul manuale questa scheda porta difficolta\u2019 ${p.divergenza.stampata}, ma i suoi stessi addendi ` +
                `sommano ${p.divergenza.calcolata}. Qui vale il conto delle regole.` +
                (p.funzioneDallaClasse ? ' La formula stampata, fra l\u2019altro, dimentica la Funzione del programma.' : '')
              ));
            }

            const azioni = el('div', 'riga-azioni');
            azioni.append(
              bottone('Apri nel costruttore', () => apriCostruttore(JSON.parse(JSON.stringify(p.spec)), null), 'btn-piccolo'),
              bottone('Copia in libreria', async (e) => {
                const b = e.currentTarget;
                b.disabled = true;
                b.textContent = 'Salvo\u2026';
                try {
                  await api('/programs', { method: 'POST', body: { programma: p.spec } });
                  b.textContent = 'Copiato';
                  toast(`${p.nome} e\u2019 nella tua libreria.`);
                } catch (err) {
                  toast(err.message, { errore: true });
                  b.disabled = false;
                  b.textContent = 'Copia in libreria';
                }
              }, 'btn-piccolo btn-primario')
            );
            carta.append(azioni);
            lista.append(carta);
          }
        };

        cerca.addEventListener('input', () => { filtro.testo = cerca.value; ridisegna(); });
        ridisegna();
      }).catch((err) => {
        lista.innerHTML = '';
        lista.append(el('div', 'vuoto', `Libreria non raggiungibile: ${err.message}`));
      });

      return root;
    },
  };
}

async function ricaricaProgrammi() {
  try {
    const { programmi } = await api('/programs');
    statoNetrun.programmi = programmi;
  } catch { /* la lista resta quella di prima */ }
  disegna();
}

async function caricaProgramma(id) {
  const attesa = vistaAttesa('Programma', 'Apro il programma');
  vaiA(attesa);
  try {
    const p = await api(`/programs/${id}`);
    if (stack[stack.length - 1] !== attesa) return;
    stack.pop();
    apriCostruttore(p.spec, id);
  } catch (err) {
    toast(err.message, { errore: true });
    indietro();
  }
}

function apriCostruttore(spec, id) {
  statoNetrun.spec = { ...programmaVuotoClient(), ...spec };
  statoNetrun.specSalvata = id ? JSON.parse(JSON.stringify(spec)) : null;
  statoNetrun.idProgramma = id;
  statoNetrun.calcolo = null;
  vaiA(vistaCostruttore());
}

function vistaCostruttore() {
  return {
    titolo: 'Programma',
    render() {
      const p = statoNetrun.spec;
      const cat = statoNetrun.catalogo;
      const root = el('div');

      $barraDx.append(bottone('Salva', () => salvaProgramma(), 'btn-primario btn-piccolo'));

      // --- riquadro dei conti, sempre in vista ---
      const conti = el('div', 'conti');
      root.append(conti);

      const disegnaConti = () => {
        conti.innerHTML = '';
        const c = statoNetrun.calcolo;
        if (!c) {
          conti.append(el('div', 'campo-aiuto', 'Calcolo in corso…'));
          return;
        }
        const numeri = el('div', 'conti-numeri');
        for (const [k, v] of [
          ['Difficolta\'', c.difficolta],
          ['UM', c.ottimizzato ? `${c.um} (era ${c.umBase})` : c.um],
          ['Prezzo', `${c.costo} E$`],
          ['Tempo', `${c.giorni} g`],
        ]) {
          const cella = el('div', 'conto');
          cella.append(el('div', 'k', k), el('div', 'v', String(v)));
          numeri.append(cella);
        }
        conti.append(numeri);

        const voci = el('div', 'conti-voci');
        for (const v of c.voci) {
          voci.append(el('span', 'voce', `${v.nome} ${v.diff >= 0 ? '+' : ''}${v.diff}`));
        }
        conti.append(voci);
        for (const a of c.avvisi || []) conti.append(avviso(a));

        if (statoNetrun.specSalvata) {
          const box = el('div', 'campo-aiuto');
          box.id = 'costo-modifica';
          conti.append(box);
        }
      };
      disegnaConti();

      let attesa = null;
      const ricalcola = () => {
        clearTimeout(attesa);
        attesa = setTimeout(async () => {
          try {
            statoNetrun.calcolo = await api('/netrun/calcola', { method: 'POST', body: { programma: p } });
            disegnaConti();
            aggiornaCostoModifica();
          } catch (err) {
            toast(err.message, { errore: true });
          }
        }, 180);
      };
      ricalcola();

      // --- nome ---
      root.append(campoTestoLibero(p, 'nome', 'Nome del programma', { placeholder: 'Sesamo' }));

      // --- funzioni ---
      root.append(el('h2', 'sezione-titolo', 'Funzioni'));
      root.append(el('p', 'campo-aiuto', 'Che cosa sa fare. Se ne possono impilare piu’ d’una: la difficolta’ si somma, il prezzo prende il moltiplicatore piu’ alto.'));
      const funzioni = el('div', 'scelte');
      for (const f of cat.funzioni) {
        funzioni.append(scelta(f.nome, `${f.desc} (+${f.diff})`, p.funzioni.includes(f.id), () => {
          p.funzioni = p.funzioni.includes(f.id)
            ? p.funzioni.filter((x) => x !== f.id)
            : [...p.funzioni, f.id];
          ricalcola();
          disegna();
        }));
      }
      root.append(funzioni);

      // --- forza ---
      root.append(el('h2', 'sezione-titolo', 'Forza'));
      const forza = el('div', 'griglia griglia-2');
      forza.append(
        campoNumero(p, 'forza', `Forza (${cat.forza.min}–${cat.forza.max})`, {
          min: cat.forza.min, max: cat.forza.max, alCambio: ricalcola,
        }),
        campoSelettore(p, 'modoForza', 'Modo', cat.modiForza.map((m) => ({ id: m.id, nome: m.nome })), {
          alCambio: () => { ricalcola(); disegna(); },
        })
      );
      root.append(forza);
      const modo = cat.modiForza.find((m) => m.id === p.modoForza);
      if (modo) root.append(el('p', 'campo-aiuto', `${modo.desc} La Forza entra nella difficolta’ divisa per ${modo.divisore}.`));
      if (p.modoForza !== 'normale') {
        root.append(campoTestoLibero(p, 'bersaglio', 'Contro che cosa', {
          placeholder: 'Programmi Anti-IC della serie Hellhound',
          alCambio: ricalcola,
        }));
      }

      // --- icona ---
      root.append(el('h2', 'sezione-titolo', 'Icona'));
      const icone = el('div', 'pillole');
      for (const i of cat.icone) {
        const b = el('button', `pillola${p.icona === i.id ? ' attiva' : ''}`);
        b.type = 'button';
        b.textContent = `${i.nome} +${i.diff}`;
        b.title = i.desc;
        b.addEventListener('click', () => { p.icona = i.id; ricalcola(); disegna(); });
        icone.append(b);
      }
      root.append(icone);
      root.append(campoTestoLibero(p, 'descrizioneIcona', 'Che aspetto ha', {
        placeholder: 'Una chiave d’ottone che gira su se’ stessa',
      }));

      // --- optional ---
      root.append(el('h2', 'sezione-titolo', 'Optional'));
      const opzionali = el('div', 'scelte');
      for (const o of cat.optional) {
        const presente = p.optional.find((x) => (typeof x === 'string' ? x : x.id) === o.id);
        const volte = presente ? (typeof presente === 'object' ? Number(presente.volte) || 1 : 1) : 0;
        const nodo = scelta(o.nome, `${o.desc} (${o.diff >= 0 ? '+' : ''}${o.diff})`, !!presente, () => {
          p.optional = presente
            ? p.optional.filter((x) => (typeof x === 'string' ? x : x.id) !== o.id)
            : [...p.optional, { id: o.id, volte: 1 }];
          ricalcola();
          disegna();
        });
        if (presente) {
          const piu = bottone(`×${volte}`, () => {
            const n = volte >= 3 ? 1 : volte + 1;
            p.optional = p.optional.map((x) => (
              (typeof x === 'string' ? x : x.id) === o.id ? { id: o.id, volte: n } : x
            ));
            ricalcola();
            disegna();
          }, 'btn-piccolo');
          piu.title = 'Quante volte prenderlo';
          nodo.append(piu);
        }
        opzionali.append(nodo);
      }
      root.append(opzionali);

      // --- optional a quantita' ---
      root.append(el('h2', 'sezione-titolo', 'Optional a quantita\''));
      for (const v of cat.variabili) {
        const presente = p.variabili.find((x) => x.id === v.id);
        const riga = el('div', 'abilita-riga');
        const testi = el('div');
        testi.style.flex = '1 1 auto';
        testi.append(el('div', 'nome', v.nome), el('div', 'campo-aiuto', v.desc));
        riga.append(testi);
        if (presente) {
          const input = numeroInput(presente.quantita, v.min, v.max, (n) => {
            presente.quantita = n;
            ricalcola();
          });
          input.style.width = '90px';
          riga.append(input, bottone(ICONE.cestino, () => {
            p.variabili = p.variabili.filter((x) => x.id !== v.id);
            ricalcola();
            disegna();
          }, 'btn-fantasma btn-icona btn-piccolo'));
        } else {
          riga.append(bottone('Aggiungi', () => {
            p.variabili = [...p.variabili, { id: v.id, quantita: v.min }];
            ricalcola();
            disegna();
          }, 'btn-piccolo'));
        }
        root.append(riga);
      }

      root.append(campoTestoLibero(p, 'note', 'Note', { multilinea: true, righe: 3 }));

      // --- comandi ---
      root.append(el('hr', 'separatore'));
      const comandi = el('div', 'riga-azioni');
      comandi.append(
        bottone('Salva', () => salvaProgramma(), 'btn-primario'),
        bottone('Tiro di scrittura', () => modaleScrittura())
      );
      if (statoNetrun.idProgramma) {
        comandi.append(bottone('Elimina', () => {
          conferma('Eliminare il programma?', `"${p.nome || 'Senza nome'}" sparisce dalla libreria.`, async () => {
            try {
              await api(`/programs/${statoNetrun.idProgramma}`, { method: 'DELETE' });
              toast('Programma eliminato.');
              indietro();
            } catch (err) {
              toast(err.message, { errore: true });
            }
          }, 'Elimina');
        }, 'btn-pericolo'));
      }
      root.append(comandi);
      return root;
    },
  };
}

/** Scelta a interruttore, con descrizione. */
function scelta(nome, desc, attiva, onClick) {
  const riga = el('div', `scelta${attiva ? ' attiva' : ''}`);
  const b = el('button', 'corpo');
  b.type = 'button';
  b.append(el('div', 'nome', nome), el('div', 'desc', desc));
  b.addEventListener('click', onClick);
  riga.append(b);
  return riga;
}

/**
 * Quanto costa cambiare un programma gia' scritto: il manuale non lascia
 * riscriverlo gratis, e il conto non e' la differenza secca.
 */
async function aggiornaCostoModifica() {
  const box = document.getElementById('costo-modifica');
  if (!box || !statoNetrun.specSalvata) return;
  try {
    const m = await api('/netrun/modifica', {
      method: 'POST',
      body: { prima: statoNetrun.specSalvata, dopo: statoNetrun.spec },
    });
    box.textContent = m.scarto === 0
      ? 'Nessuna modifica rispetto alla versione salvata.'
      : `Modifica: da ${m.prima} a ${m.dopo} di difficolta’. Riscrivere costa un tiro contro ${m.difficolta} ` +
        `(lo scarto e’ ${m.scarto}, ma il minimo e’ un quarto della nuova difficolta’, cioe’ ${m.minimo}).`;
  } catch { /* il costo della modifica e' un di piu': se non arriva, pazienza */ }
}

async function salvaProgramma() {
  const p = statoNetrun.spec;
  if (!p.nome.trim()) { toast('Dai un nome al programma.', { errore: true }); return; }
  if (!p.funzioni.length) { toast('Serve almeno una Funzione.', { errore: true }); return; }
  try {
    if (statoNetrun.idProgramma) {
      await api(`/programs/${statoNetrun.idProgramma}`, { method: 'PUT', body: { programma: p } });
    } else {
      const creato = await api('/programs', { method: 'POST', body: { programma: p } });
      statoNetrun.idProgramma = creato.id;
    }
    statoNetrun.specSalvata = JSON.parse(JSON.stringify(p));
    toast('Programma salvato.');
    aggiornaCostoModifica();
  } catch (err) {
    toast(err.message, { errore: true });
  }
}

function modaleScrittura() {
  const dati = { INT: 8, programmare: 6 };
  const corpo = el('div');
  corpo.append(el('p', 'campo-aiuto',
    'Scrivere un programma e’ un tiro di INT + Programmare + 1D10 aperto contro la sua difficolta’.'));
  corpo.append(campoNumero(dati, 'INT', 'INT', { min: 1, max: 20 }));
  corpo.append(campoNumero(dati, 'programmare', 'Programmare', { min: 0, max: 10 }));
  const esito = el('div', 'conti');
  corpo.append(esito);

  modale('Tiro di scrittura', corpo, [
    { testo: 'Chiudi', classe: 'btn-fantasma' },
    {
      testo: 'Tira', classe: 'btn-primario', mantieni: true,
      onClick: async () => {
        try {
          const r = await api('/netrun/scrivi', {
            method: 'POST',
            body: { programma: statoNetrun.spec, INT: dati.INT, programmare: dati.programmare },
          });
          esito.innerHTML = '';
          const t = r.tiro;
          esito.append(el('div', `dadi-totale${t.riuscito ? '' : ' papera'}`, String(t.totale)));
          esito.append(el('div', 'dadi-dettaglio',
            `${t.termini.dado} (dado) + ${t.termini.INT} (INT) + ${t.termini.programmare} (Programmare) contro ${t.difficolta}`));
          esito.append(el('p', null, t.testo));
        } catch (err) {
          toast(err.message, { errore: true });
        }
      },
    },
  ]);
}

// ============================================================ sessione ======

function postiSalvati() {
  try { return JSON.parse(localStorage.getItem(CHIAVE_POSTI) || '{}'); } catch { return {}; }
}

function salvaPosto(codice, posto, ruolo) {
  try {
    const tutti = postiSalvati();
    tutti[codice] = { posto, ruolo, ts: Date.now() };
    localStorage.setItem(CHIAVE_POSTI, JSON.stringify(tutti));
  } catch { /* navigazione privata: il posto vale finche' dura la scheda */ }
}

function codiceCasuale() {
  const alfabeto = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const b = new Uint8Array(6);
  crypto.getRandomValues(b);
  return [...b].map((x) => alfabeto[x % alfabeto.length]).join('');
}

async function apriNetrun() {
  const attesa = vistaAttesa('Netrun', 'Carico il netrun');
  vaiA(attesa);
  try {
    const [catalogo] = await Promise.all([api('/netrun/sessioni/catalogo'), caricaCatalogoNetrun()]);
    statoNetrun.catalogoSessione = catalogo;
    rimpiazzaCima(vistaNetrun(), attesa);
  } catch (err) {
    toast(err.message, { errore: true });
    indietro();
  }
}

function vistaNetrun() {
  return {
    titolo: 'Netrun',
    render() {
      const root = el('div');
      root.append(
        el('h1', 'titolo-vista', 'Netrun'),
        el('p', 'sottotitolo-vista',
          'Il Master allestisce il sistema e passa il codice al netrunner, che entra dal proprio dispositivo con i suoi programmi. Il tavolo resta sincronizzato da solo.')
      );

      const azioni = el('div', 'riga-azioni');
      azioni.style.margin = '0 0 20px';
      azioni.append(
        bottone('Allestisci un sistema', () => vaiA(vistaAllestimento()), 'btn-primario'),
        bottone('Entra come netrunner', () => vaiA(vistaIngresso()))
      );
      root.append(azioni);

      const posti = postiSalvati();
      const codici = Object.keys(posti).sort((a, b) => posti[b].ts - posti[a].ts);
      if (codici.length) {
        root.append(el('h2', 'sezione-titolo', 'Sessioni gia’ aperte'));
        for (const codice of codici.slice(0, 10)) {
          const riga = el('button', 'scheda-riga');
          riga.type = 'button';
          const testi = el('div');
          testi.append(el('div', 'nome', codice),
            el('div', 'meta', `${posti[codice].ruolo === 'master' ? 'Master' : 'Netrunner'} · ${dataLeggibile(posti[codice].ts)}`));
          riga.append(testi);
          riga.addEventListener('click', () => entraNelTavolo(codice, posti[codice].posto, posti[codice].ruolo));
          root.append(riga);
        }
      }
      return root;
    },
  };
}

// --- allestimento (Master) ---

function nodoVuoto(i) {
  return { id: `n${i}`, nome: `Nodo ${i + 1}`, tipo: 'memoria', mura: 4, collegati: [], contenuto: '', nascosto: '' };
}

function vistaAllestimento() {
  const bozza = {
    codice: codiceCasuale(),
    pronto: null,
    nome: 'Incursione',
    sistema: 'Arasaka, filiale di Night City',
    nodi: [
      { id: 'n0', nome: 'Portale', tipo: 'portale', mura: 4, collegati: ['n1'], contenuto: '', nascosto: '' },
      { id: 'n1', nome: 'Archivio', tipo: 'memoria', mura: 6, collegati: ['n0'], contenuto: 'I file che cercate.', nascosto: '' },
    ],
    difese: [],
  };

  return {
    titolo: 'Allestimento',
    render() {
      const root = el('div');
      root.append(el('h1', 'titolo-vista', 'Allestisci il sistema'));

      const scorciatoia = el('div', 'riga-azioni');
      scorciatoia.style.margin = '0 0 16px';
      scorciatoia.append(bottone('Parti da un sistema pronto', () => scegliSistemaPronto((sistema) => {
        bozza.nome = sistema.nome;
        bozza.sistema = sistema.sistema;
        bozza.nodi = JSON.parse(JSON.stringify(sistema.nodi));
        bozza.difese = sistema.difese.map((d) => ({
          nome: d.programma, nodo: d.nodo, programmaLibreria: d.programma,
        }));
        bozza.pronto = sistema;
        disegna();
        toast(`${sistema.nome}: ${sistema.nodi.length} nodi e ${sistema.difese.length} difese in campo.`);
      }), 'btn-primario'));
      root.append(scorciatoia);

      if (bozza.pronto) {
        const nota = el('div', 'conti');
        nota.append(el('div', 'campo-aiuto', `Sistema pronto \u00b7 difficolt\u00e0 ${bozza.pronto.difficolta} \u00b7 deck consigliato ${bozza.pronto.umDeckConsigliato} UM`));
        nota.append(el('p', null, bozza.pronto.gancio));
        nota.append(el('p', 'campo-aiuto', 'Puoi cambiare tutto: nodi, Mura, collegamenti e difese restano modificabili qui sotto.'));
        root.append(nota);
      }

      const testa = el('div', 'griglia griglia-2');
      testa.append(
        campoTestoLibero(bozza, 'codice', 'Codice della sessione', { aiuto: 'E’ quello che detti al netrunner.' }),
        campoTestoLibero(bozza, 'nome', 'Nome dell’incursione')
      );
      root.append(testa);
      root.append(campoTestoLibero(bozza, 'sistema', 'Sistema'));

      // --- nodi ---
      root.append(el('h2', 'sezione-titolo', 'Nodi'));
      root.append(el('p', 'campo-aiuto',
        'Il netrunner parte dal primo nodo dell’elenco. Le Mura vanno sfondate con un programma d’Intrusione prima di poterci entrare.'));
      const nodi = el('div');
      const ridisegnaNodi = () => {
        nodi.innerHTML = '';
        bozza.nodi.forEach((n, i) => {
          const p = pannello(`${n.nome} (${n.id})`, `Mura ${n.mura}`, () => {
            const box = el('div');
            box.append(campoTestoLibero(n, 'nome', 'Nome'));
            const g = el('div', 'griglia griglia-2');
            g.append(
              campoSelettore(n, 'tipo', 'Tipo', statoNetrun.catalogoSessione.tipiNodo.map((t) => ({ id: t.id, nome: t.nome }))),
              campoNumero(n, 'mura', 'Mura', { min: 0, max: 20 })
            );
            box.append(g);
            box.append(campoTestoLibero(n, 'contenuto', 'Che cosa c’e’', { aiuto: 'Lo vede il netrunner quando ci arriva.' }));
            box.append(campoTestoLibero(n, 'nascosto', 'Nota per il Master', { aiuto: 'Non la vede nessun altro.' }));

            box.append(el('div', 'campo-aiuto', 'Collegato a'));
            const legami = el('div', 'pillole');
            for (const altro of bozza.nodi) {
              if (altro.id === n.id) continue;
              const attivo = n.collegati.includes(altro.id);
              const b = el('button', `pillola${attivo ? ' attiva' : ''}`);
              b.type = 'button';
              b.textContent = altro.nome;
              b.addEventListener('click', () => {
                // I collegamenti sono reciproci: un corridoio si percorre nei due sensi.
                if (attivo) {
                  n.collegati = n.collegati.filter((x) => x !== altro.id);
                  altro.collegati = altro.collegati.filter((x) => x !== n.id);
                } else {
                  n.collegati = [...n.collegati, altro.id];
                  altro.collegati = [...altro.collegati, n.id];
                }
                ridisegnaNodi();
              });
              legami.append(b);
            }
            box.append(legami);

            if (bozza.nodi.length > 1) {
              const rim = bottone('Elimina il nodo', () => {
                bozza.nodi = bozza.nodi.filter((x) => x.id !== n.id);
                for (const altro of bozza.nodi) altro.collegati = altro.collegati.filter((x) => x !== n.id);
                bozza.difese = bozza.difese.filter((d) => d.nodo !== n.id);
                ridisegnaNodi();
              }, 'btn-pericolo btn-piccolo');
              const azioniNodo = el('div', 'riga-azioni');
              azioniNodo.append(rim);
              box.append(azioniNodo);
            }
            return box;
          }, i === 0);
          nodi.append(p);
        });
      };
      ridisegnaNodi();
      root.append(nodi);

      const azNodi = el('div', 'riga-azioni');
      azNodi.append(bottone('Aggiungi nodo', () => {
        bozza.nodi.push(nodoVuoto(bozza.nodi.length));
        ridisegnaNodi();
      }, 'btn-piccolo'));
      root.append(azNodi);

      // --- difese ---
      root.append(el('h2', 'sezione-titolo', 'Difese'));
      root.append(el('p', 'campo-aiuto',
        'Programmi della libreria messi di guardia su un nodo. Restano dormienti finche’ non li attivi o il netrunner non li scopre.'));
      const difese = el('div');
      const ridisegnaDifese = () => {
        difese.innerHTML = '';
        if (!bozza.difese.length) difese.append(el('div', 'vuoto', 'Sistema indifeso.'));
        bozza.difese.forEach((d, i) => {
          const riga = el('div', 'abilita-riga');
          const testi = el('div');
          testi.style.flex = '1 1 auto';
          const nodo = bozza.nodi.find((n) => n.id === d.nodo);
          testi.append(el('div', 'nome', d.nome),
            el('div', 'campo-aiuto',
              (d.programma ? `Forza ${d.programma.forza} · ` : 'dal manuale · ')
              + `su ${nodo ? nodo.nome : d.nodo}`));
          riga.append(testi, bottone(ICONE.cestino, () => {
            bozza.difese.splice(i, 1);
            ridisegnaDifese();
          }, 'btn-fantasma btn-icona btn-piccolo'));
          difese.append(riga);
        });
      };
      ridisegnaDifese();
      root.append(difese);

      const azDifese = el('div', 'riga-azioni');
      azDifese.append(bottone('Dai tuoi programmi', () => {
        scegliProgrammaSalvato('Programma di difesa', (spec) => {
          scegliNodo(bozza.nodi, (nodoId) => {
            bozza.difese.push({ nome: spec.nome, programma: spec, nodo: nodoId });
            ridisegnaDifese();
          });
        });
      }, 'btn-piccolo'));
      azDifese.append(bottone('Dalla libreria del manuale', () => {
        scegliDallaLibreria('Programma di difesa', (spec) => {
          scegliNodo(bozza.nodi, (nodoId) => {
            bozza.difese.push({ nome: spec.nome, programma: spec, nodo: nodoId });
            ridisegnaDifese();
          });
        });
      }, 'btn-piccolo'));
      root.append(azDifese);

      // --- apertura ---
      root.append(el('hr', 'separatore'));
      const apri = bottone('Apri la sessione', async () => {
        apri.disabled = true;
        apri.textContent = 'Apro…';
        try {
          const codice = bozza.codice.trim().toUpperCase();
          const esito = await api(`/netrun/sessioni/${codice}/crea`, {
            method: 'POST',
            body: {
              nome: bozza.nome,
              sistema: bozza.sistema,
              nodi: bozza.nodi,
              // Le difese prese dal manuale viaggiano col solo nome: la
              // specifica intera la ritrova il Worker, che ha il catalogo.
              difese: bozza.difese.map((d) => (d.programmaLibreria
                ? { programmaLibreria: d.programmaLibreria, nodo: d.nodo }
                : { programma: d.programma, nodo: d.nodo })),
            },
          });
          salvaPosto(codice, esito.posto, 'master');
          statoNetrun.codice = codice;
          statoNetrun.posto = esito.posto;
          statoNetrun.ruolo = 'master';
          statoNetrun.vista = esito.vista;
          rimpiazzaCima(vistaTavolo());
        } catch (err) {
          toast(err.message, { errore: true });
          apri.disabled = false;
          apri.textContent = 'Apri la sessione';
        }
      }, 'btn-primario');
      root.append(apri);
      return root;
    },
  };
}

/** I sistemi gia' allestiti, con gancio e difficolta'. */
async function scegliSistemaPronto(onScelta) {
  const corpo = el('div');
  corpo.append(schermataAttesa('Carico i sistemi'));
  modale('Sistemi pronti', corpo, [{ testo: 'Annulla', classe: 'btn-fantasma' }]);

  try {
    const sistemi = await caricaSistemiPronti();
    corpo.innerHTML = '';
    for (const s of sistemi) {
      const carta = el('div', 'pronto');
      const testa = el('div', 'testa');
      testa.append(el('span', 'nome', s.nome), el('span', `classe diff-${s.difficolta}`, s.difficolta));
      carta.append(testa);
      carta.append(el('div', 'sommario', s.sommario));
      carta.append(el('div', 'campo-aiuto', s.gancio));
      const numeri = el('div', 'stat-riga');
      numeri.append(
        el('span', 'v', `${s.nodi.length} nodi`),
        el('span', 'v', `${s.difese.length} difese`),
        el('span', 'v', `deck ${s.umDeckConsigliato} UM`)
      );
      carta.append(numeri);
      const azioni = el('div', 'riga-azioni');
      azioni.append(bottone('Usa questo', () => {
        chiudiModale();
        onScelta(s);
      }, 'btn-piccolo btn-primario'));
      carta.append(azioni);
      corpo.append(carta);
    }
  } catch (err) {
    corpo.innerHTML = '';
    corpo.append(el('div', 'vuoto', `Non riesco a caricarli: ${err.message}`));
  }
}

function scegliNodo(nodi, onScelta) {
  const corpo = el('div');
  for (const n of nodi) {
    const riga = el('div', 'abilita-riga');
    riga.append(el('div', 'nome', n.nome), bottone('Qui', () => {
      chiudiModale();
      onScelta(n.id);
    }, 'btn-piccolo'));
    corpo.append(riga);
  }
  modale('Su quale nodo', corpo, [{ testo: 'Annulla', classe: 'btn-fantasma' }]);
}

/** Scelta rapida da un elenco dei 62 programmi del manuale. */
async function scegliDallaLibreria(titolo, onScelta) {
  const corpo = el('div');
  const cerca = el('input');
  cerca.type = 'text';
  cerca.placeholder = 'Cerca\u2026';
  cerca.style.marginBottom = '12px';
  const lista = el('div');
  lista.append(schermataAttesa('Carico la libreria'));
  corpo.append(cerca, lista);
  modale(titolo, corpo, [{ testo: 'Chiudi', classe: 'btn-fantasma' }]);

  try {
    const programmi = await caricaLibreria();
    const ridisegna = () => {
      const t = cerca.value.trim().toLowerCase();
      lista.innerHTML = '';
      const trovati = programmi.filter((p) => !t || p.nome.toLowerCase().includes(t)
        || (p.alias || '').toLowerCase().includes(t) || p.classe.includes(t));
      for (const p of trovati.slice(0, 60)) {
        const riga = el('div', 'abilita-riga');
        const testi = el('div');
        testi.style.flex = '1 1 auto';
        testi.style.minWidth = '0';
        testi.append(el('div', 'nome', p.nome),
          el('div', 'campo-aiuto', `${p.classe} \u00b7 Forza ${p.forza} \u00b7 ${p.um} UM \u00b7 ${p.costo} E$`));
        riga.append(testi, bottone('Scegli', () => {
          chiudiModale();
          onScelta(JSON.parse(JSON.stringify(p.spec)));
        }, 'btn-piccolo'));
        lista.append(riga);
      }
      if (!trovati.length) lista.append(el('div', 'vuoto', 'Nessun programma corrisponde.'));
    };
    cerca.addEventListener('input', ridisegna);
    ridisegna();
    cerca.focus();
  } catch (err) {
    lista.innerHTML = '';
    lista.append(el('div', 'vuoto', err.message));
  }
}

async function scegliProgrammaSalvato(titolo, onScelta) {
  const corpo = el('div');
  corpo.append(schermataAttesa('Carico la libreria'));
  modale(titolo, corpo, [{ testo: 'Annulla', classe: 'btn-fantasma' }]);
  try {
    const { programmi } = await api('/programs');
    corpo.innerHTML = '';
    if (!programmi.length) {
      corpo.append(el('div', 'vuoto', 'La libreria e’ vuota: scrivi prima un programma nella console.'));
      return;
    }
    for (const p of programmi) {
      const riga = el('div', 'abilita-riga');
      const testi = el('div');
      testi.style.flex = '1 1 auto';
      testi.append(el('div', 'nome', p.name),
        el('div', 'campo-aiuto', `${p.classe || 'programma'} · Forza ${p.forza} · ${p.um} UM`));
      riga.append(testi, bottone('Scegli', async () => {
        try {
          const completo = await api(`/programs/${p.id}`);
          chiudiModale();
          onScelta(completo.spec);
        } catch (err) {
          toast(err.message, { errore: true });
        }
      }, 'btn-piccolo'));
      corpo.append(riga);
    }
  } catch (err) {
    corpo.innerHTML = '';
    corpo.append(el('div', 'vuoto', err.message));
  }
}

// --- ingresso (netrunner) ---

function vistaIngresso() {
  const dati = {
    codice: '',
    nome: '',
    INT: 8,
    hacking: 6,
    umDeck: statoNetrun.catalogoSessione.umDeckDefault,
    scelti: [],
  };

  return {
    titolo: 'Entra nel Net',
    render() {
      const root = el('div');
      root.append(el('h1', 'titolo-vista', 'Entra nel Net'));

      root.append(campoTestoLibero(dati, 'codice', 'Codice della sessione', {
        placeholder: 'Quello che ti detta il Master',
      }));
      root.append(campoTestoLibero(dati, 'nome', 'Come ti chiami nel Net'));

      const g = el('div', 'griglia griglia-3');
      g.append(
        campoNumero(dati, 'INT', 'INT', { min: 1, max: 20 }),
        campoNumero(dati, 'hacking', 'Hacking', { min: 0, max: 10 }),
        campoNumero(dati, 'umDeck', 'UM del deck', { min: 1, max: 200 })
      );
      root.append(g);

      root.append(el('h2', 'sezione-titolo', 'Programmi caricati'));
      root.append(el('p', 'campo-aiuto',
        'Il deck ha uno spazio: i programmi che non ci stanno restano fuori, e la sessione te lo dice.'));
      const lista = el('div');
      const ridisegna = () => {
        lista.innerHTML = '';
        if (!dati.scelti.length) lista.append(el('div', 'vuoto', 'Deck vuoto.'));
        dati.scelti.forEach((s, i) => {
          const riga = el('div', 'abilita-riga');
          const testi = el('div');
          testi.style.flex = '1 1 auto';
          testi.append(el('div', 'nome', s.nome), el('div', 'campo-aiuto', `Forza ${s.forza}`));
          riga.append(testi, bottone(ICONE.cestino, () => {
            dati.scelti.splice(i, 1);
            ridisegna();
          }, 'btn-fantasma btn-icona btn-piccolo'));
          lista.append(riga);
        });
      };
      ridisegna();
      root.append(lista);

      const az = el('div', 'riga-azioni');
      az.append(bottone('Dai tuoi programmi', () => scegliProgrammaSalvato('Carica nel deck', (spec) => {
        dati.scelti.push(spec);
        ridisegna();
      }), 'btn-piccolo'));
      az.append(bottone('Dalla libreria del manuale', () => scegliDallaLibreria('Carica nel deck', (spec) => {
        dati.scelti.push(spec);
        ridisegna();
      }), 'btn-piccolo'));
      root.append(az);

      root.append(el('hr', 'separatore'));
      const entra = bottone('Collegati', async () => {
        const codice = dati.codice.trim().toUpperCase();
        if (!codice) { toast('Serve il codice della sessione.', { errore: true }); return; }
        entra.disabled = true;
        entra.textContent = 'Mi collego…';
        try {
          const salvato = postiSalvati()[codice];
          const esito = await api(`/netrun/sessioni/${codice}/entra`, {
            method: 'POST',
            headers: salvato ? { 'X-Posto': salvato.posto } : {},
            body: {
              nome: dati.nome, INT: dati.INT, hacking: dati.hacking,
              umDeck: dati.umDeck, programmi: dati.scelti,
            },
          });
          salvaPosto(codice, esito.posto, 'runner');
          statoNetrun.codice = codice;
          statoNetrun.posto = esito.posto;
          statoNetrun.ruolo = 'runner';
          statoNetrun.vista = esito.vista;
          rimpiazzaCima(vistaTavolo());
        } catch (err) {
          toast(err.message, { errore: true });
          entra.disabled = false;
          entra.textContent = 'Collegati';
        }
      }, 'btn-primario');
      root.append(entra);
      return root;
    },
  };
}

async function entraNelTavolo(codice, posto, ruolo) {
  const attesa = vistaAttesa('Tavolo', 'Riprendo la sessione');
  vaiA(attesa);
  try {
    const { vista } = await api(`/netrun/sessioni/${codice}`, { headers: { 'X-Posto': posto } });
    statoNetrun.codice = codice;
    statoNetrun.posto = posto;
    statoNetrun.ruolo = ruolo;
    statoNetrun.vista = vista;
    rimpiazzaCima(vistaTavolo(), attesa);
  } catch (err) {
    toast(err.message, { errore: true });
    indietro();
  }
}

// --- il tavolo ---

/**
 * Il tavolo si rilegge da solo: senza, il netrunner resterebbe a fissare il
 * proprio turno finito mentre il Master ha gia' risposto.
 */
function fermaSondaggioNetrun() {
  if (statoNetrun.timer) {
    clearInterval(statoNetrun.timer);
    statoNetrun.timer = null;
  }
}

function avviaSondaggioNetrun() {
  fermaSondaggioNetrun();
  statoNetrun.timer = setInterval(async () => {
    if (!$modaleSfondo.hidden) return;   // non ridisegnare sotto una modale aperta
    try {
      const { vista } = await api(`/netrun/sessioni/${statoNetrun.codice}`, {
        headers: { 'X-Posto': statoNetrun.posto },
      });
      // Si ridisegna solo se qualcosa e' cambiato: altrimenti ogni tre secondi
      // il pannello aperto si richiuderebbe sotto le dita.
      const prima = statoNetrun.vista;
      const cambiato = !prima
        || prima.round !== vista.round
        || prima.turno !== vista.turno
        || prima.stato !== vista.stato
        || (prima.diario[0] || {}).testo !== (vista.diario[0] || {}).testo;
      statoNetrun.vista = vista;
      if (cambiato) disegna();
    } catch { /* rete ballerina: si riprova al giro dopo */ }
  }, 3000);
}

function vistaTavolo() {
  return {
    titolo: 'Tavolo del Net',
    render() {
      const v = statoNetrun.vista;
      const master = v.ruolo === 'master';
      const root = el('div');

      $barraDx.append(bottone('Codice', () => modale('Codice della sessione',
        el('div', 'dadi-totale', statoNetrun.codice),
        [{ testo: 'Chiudi', classe: 'btn-fantasma' }]), 'btn-fantasma btn-piccolo'));

      root.append(el('h1', 'titolo-vista', v.nome));

      const stato_ = el('div', 'pillole');
      stato_.style.marginBottom = '16px';
      const allarme = statoNetrun.catalogoSessione.livelliAllarme.find((a) => a.id === v.sistema.allarme);
      stato_.append(
        etichetta(v.sistema.nome),
        etichetta(`Round ${v.round}`),
        etichetta(v.stato === 'chiusa' ? 'Sessione chiusa' : (v.turno === 'runner' ? 'Tocca al netrunner' : 'Tocca al sistema')),
        etichetta(`Allarme: ${allarme ? allarme.nome.toLowerCase() : v.sistema.allarme}`)
      );
      root.append(stato_);

      if (v.stato === 'attesa') {
        root.append(avviso(`Il netrunner non e’ ancora entrato. Passagli il codice: ${statoNetrun.codice}`));
      }

      // --- mappa ---
      root.append(el('h2', 'sezione-titolo', 'Sistema'));
      const mappa = el('div', 'nodi');
      for (const n of v.sistema.nodi) {
        const qui = v.runner && v.runner.posizione === n.id;
        const carta = el('div', `nodo${qui ? ' qui' : ''}${n.violato ? ' violato' : ''}`);
        carta.append(el('div', 'testa', n.nome));
        const dett = [];
        dett.push(n.tipo);
        dett.push(n.mura > 0 ? `Mura ${n.mura}` : 'Mura cadute');
        if (qui) dett.push('il netrunner e’ qui');
        carta.append(el('div', 'stato', dett.join(' · ')));
        if (n.contenuto) carta.append(el('div', 'contenuto', n.contenuto));
        if (master && n.nascosto) carta.append(el('div', 'nascosto', n.nascosto));
        const difeseQui = v.sistema.difese.filter((d) => d.nodo === n.id);
        if (difeseQui.length) {
          const el_ = el('div', 'difese');
          for (const d of difeseQui) {
            el_.append(el('span', `difesa${d.forza <= 0 ? ' spenta' : ''}${d.attivo ? ' attiva' : ''}`,
              `${d.nome} F${d.forza}${d.forza < d.forzaIniziale ? `/${d.forzaIniziale}` : ''}`));
          }
          carta.append(el_);
        }
        mappa.append(carta);
      }
      root.append(mappa);
      if (!master && v.sistema.difeseNascoste) {
        const n = v.sistema.difeseNascoste;
        root.append(el('p', 'campo-aiuto',
          `Qualcosa che non hai ancora visto si muove nel sistema: ${n} ` +
          (n === 1 ? 'programma non identificato.' : 'programmi non identificati.')));
      }

      // --- netrunner ---
      if (v.runner) {
        root.append(el('h2', 'sezione-titolo', v.runner.nome));
        const riga = el('div', 'pillole');
        riga.append(
          etichetta(`Ferite ${v.runner.ferite}/40`),
          etichetta(`INT persa ${v.runner.intPersa}`),
          etichetta(v.runner.dentro ? 'collegato' : 'scollegato'),
          etichetta(v.runner.rilevato ? 'individuato' : 'in ombra')
        );
        root.append(riga);

        const deck = el('div', 'deck');
        deck.append(el('div', 'campo-aiuto', `Deck: ${v.runner.deck.usate}/${v.runner.deck.um} UM`));
        for (const p of v.runner.deck.caricati) {
          deck.append(el('span', `programma${p.deresettato ? ' spento' : ''}${p.attivo ? ' attivo' : ''}`,
            `${p.nome} F${p.forza}${p.forza < p.forzaIniziale ? `/${p.forzaIniziale}` : ''}`));
        }
        root.append(deck);
      }

      // --- azioni ---
      if (v.stato === 'in corso') {
        const tocca = (master && v.turno === 'master') || (!master && v.turno === 'runner');
        root.append(el('h2', 'sezione-titolo', tocca ? 'Tocca a te' : 'In attesa'));
        root.append(tocca
          ? (master ? azioniMaster(v) : azioniRunner(v))
          : el('div', 'vuoto', master ? 'Il netrunner sta muovendo.' : 'Il sistema sta rispondendo.'));
      } else if (master && v.stato === 'attesa') {
        const az = el('div', 'riga-azioni');
        az.append(
          bottone('Guardia dai tuoi programmi', () => caricaDifesaInSessione(v, false), 'btn-piccolo'),
          bottone('Guardia dal manuale', () => caricaDifesaInSessione(v, true), 'btn-piccolo')
        );
        root.append(az);
      }

      // --- diario ---
      root.append(el('h2', 'sezione-titolo', 'Diario'));
      const diario = el('div', 'diario');
      for (const voce of v.diario) {
        const riga = el('div', `diario-voce${voce.chi === 'master' ? ' master' : ''}`);
        riga.append(el('span', 'r', `R${voce.round}`), el('span', 't', voce.testo));
        diario.append(riga);
      }
      root.append(diario);

      avviaSondaggioNetrun();
      return root;
    },
  };
}

async function azioneNetrun(azione) {
  try {
    const esito = await api(`/netrun/sessioni/${statoNetrun.codice}/azione`, {
      method: 'POST',
      headers: { 'X-Posto': statoNetrun.posto },
      body: { azione },
    });
    statoNetrun.vista = esito.vista;
    disegna();
    if (esito.voce && esito.voce.testo) toast(esito.voce.testo, { durata: 5000 });
  } catch (err) {
    toast(err.message, { errore: true });
  }
}

function azioniRunner(v) {
  const box = el('div', 'azione');
  const qui = v.sistema.nodi.find((n) => n.id === v.runner.posizione);
  const scelta = { programma: null, bersaglioTipo: 'mura', bersaglio: null, nodo: qui ? qui.id : null };

  const attivi = v.runner.deck.caricati.filter((p) => !p.deresettato);
  if (attivi.length) {
    scelta.programma = attivi[0].id;
    box.append(campoConEtichetta('Programma', selettore(
      attivi.map((p) => ({ id: p.id, nome: `${p.nome} — Forza ${p.forza}` })),
      scelta.programma, (val) => { scelta.programma = val; }
    )));
  } else {
    box.append(avviso('Nessun programma utilizzabile: sono tutti de-resettati.'));
  }

  // Bersagli possibili: le Mura dei nodi raggiungibili e le difese scoperte.
  const bersagli = [];
  for (const n of v.sistema.nodi) {
    if (n.mura > 0) bersagli.push({ id: `mura:${n.id}`, nome: `Mura di ${n.nome} (Forza ${n.mura})` });
  }
  for (const d of v.sistema.difese) {
    if (d.forza > 0) bersagli.push({ id: `difesa:${d.id}`, nome: `${d.nome} (Forza ${d.forza})` });
  }
  if (bersagli.length) {
    const primo = bersagli[0].id;
    const applica = (val) => {
      const [tipo, id] = val.split(':');
      scelta.bersaglioTipo = tipo === 'mura' ? 'mura' : 'difesa';
      if (tipo === 'mura') { scelta.nodo = id; scelta.bersaglio = null; }
      else { scelta.bersaglio = id; }
    };
    applica(primo);
    box.append(campoConEtichetta('Bersaglio', selettore(bersagli, primo, applica)));
  }

  const comandi = el('div', 'riga-azioni');
  comandi.append(bottone('Esegui il programma', () => {
    if (!scelta.programma) { toast('Serve un programma.', { errore: true }); return; }
    azioneNetrun({ tipo: 'esegui', ...scelta });
  }, 'btn-primario'));

  // Spostamenti: solo dove si arriva davvero.
  const raggiungibili = v.sistema.nodi.filter((n) => (
    n.id !== v.runner.posizione
    && (!qui || !qui.collegati.length || qui.collegati.includes(n.id))
    && (n.mura <= 0 || n.violato)
  ));
  comandi.append(bottone('Spostati', () => {
    if (!raggiungibili.length) {
      toast('Da qui non si va da nessuna parte: prima le Mura.', { errore: true });
      return;
    }
    scegliNodo(raggiungibili, (nodoId) => azioneNetrun({ tipo: 'muovi', nodo: nodoId }));
  }));
  comandi.append(bottone('Scruta il nodo', () => azioneNetrun({ tipo: 'scruta' })));
  comandi.append(bottone('Passa', () => azioneNetrun({ tipo: 'passa' })));
  comandi.append(bottone('Scollegati', () => conferma(
    'Scollegarsi?', 'L’incursione finisce qui.',
    () => azioneNetrun({ tipo: 'disconnetti' }), 'Scollegati'
  ), 'btn-pericolo'));
  box.append(comandi);
  box.append(el('p', 'campo-aiuto',
    'Scrutare rivela i programmi in agguato nel nodo in cui ti trovi: e’ un tiro di INT + Hacking contro le difese del sistema.'));
  return box;
}

function azioniMaster(v) {
  const box = el('div', 'azione');
  const vive = v.sistema.difese.filter((d) => d.forza > 0);
  const scelta = {
    difesa: vive.length ? vive[0].id : null,
    bersaglio: '',
    livello: v.sistema.allarme,
    danni: '1D6',
    intPersa: '',
  };

  if (vive.length) {
    box.append(campoConEtichetta('Difesa', selettore(
      vive.map((d) => ({
        id: d.id,
        nome: `${d.nome} — Forza ${d.forza} su ${v.sistema.nodi.find((n) => n.id === d.nodo)?.nome || d.nodo}` +
          (d.attivo ? ' (attiva)' : ' (dormiente)'),
      })),
      scelta.difesa, (val) => { scelta.difesa = val; }
    )));

    const bersagli = [{ id: '', nome: 'Il netrunner stesso' }];
    for (const p of (v.runner?.deck.caricati || [])) {
      if (!p.deresettato) bersagli.push({ id: p.id, nome: `${p.nome} (Forza ${p.forza})` });
    }
    box.append(campoConEtichetta('Contro', selettore(bersagli, '', (val) => { scelta.bersaglio = val; })));

    const g = el('div', 'griglia griglia-2');
    g.append(
      campoTestoLibero(scelta, 'danni', 'Danni del Nero', { aiuto: 'Vale solo se la difesa e’ Anti-operatore.' }),
      campoTestoLibero(scelta, 'intPersa', 'INT persa', { aiuto: 'Per esempio 1D6. Vuoto: nessuna perdita.' })
    );
    box.append(g);
  } else {
    box.append(el('p', 'campo-aiuto', 'Nessuna difesa in piedi.'));
  }

  box.append(campoConEtichetta('Allarme', selettore(
    statoNetrun.catalogoSessione.livelliAllarme.map((a) => ({ id: a.id, nome: `${a.nome} (difese ${a.modDifese >= 0 ? '+' : ''}${a.modDifese})` })),
    scelta.livello, (val) => { scelta.livello = val; }
  )));

  const comandi = el('div', 'riga-azioni');
  comandi.append(bottone('Colpisci', () => {
    if (!scelta.difesa) { toast('Serve una difesa.', { errore: true }); return; }
    azioneNetrun({
      tipo: 'colpisci', difesa: scelta.difesa,
      bersaglio: scelta.bersaglio || undefined,
      danni: scelta.danni, intPersa: scelta.intPersa || undefined,
    });
  }, 'btn-primario'));
  comandi.append(bottone('Attiva', () => {
    if (!scelta.difesa) { toast('Serve una difesa.', { errore: true }); return; }
    azioneNetrun({ tipo: 'attiva', difesa: scelta.difesa });
  }));
  comandi.append(bottone('Alza l’allarme', () => azioneNetrun({ tipo: 'allarme', livello: scelta.livello })));
  comandi.append(bottone('Passa', () => azioneNetrun({ tipo: 'passa' })));
  comandi.append(bottone('Nuova difesa', () => caricaDifesaInSessione(v, true)));
  comandi.append(bottone('Chiudi la sessione', () => conferma(
    'Chiudere la sessione?', 'Il netrunner viene espulso dal sistema.',
    () => azioneNetrun({ tipo: 'chiudi' }), 'Chiudi'
  ), 'btn-pericolo'));
  box.append(comandi);
  return box;
}

/** Il Master mette in campo un altro programma di guardia a partita iniziata. */
function caricaDifesaInSessione(v, dallaLibreria) {
  const scegli = dallaLibreria ? scegliDallaLibreria : scegliProgrammaSalvato;
  scegli('Programma di difesa', (spec) => {
    scegliNodo(v.sistema.nodi, async (nodoId) => {
      try {
        const esito = await api(`/netrun/sessioni/${statoNetrun.codice}/difesa`, {
          method: 'POST',
          headers: { 'X-Posto': statoNetrun.posto },
          body: { programma: spec, nodo: nodoId },
        });
        statoNetrun.vista = esito.vista;
        disegna();
        toast(`${spec.nome} e’ di guardia.`);
      } catch (err) {
        toast(err.message, { errore: true });
      }
    });
  });
}
