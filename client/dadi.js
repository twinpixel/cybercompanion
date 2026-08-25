/**
 * Lanciadadi sempre a portata di mano.
 *
 * Il tasto sta nella barra alta di ogni schermata: al tavolo un tiro serve in
 * qualsiasi momento, e cercare la vista giusta per farlo e' il modo piu' rapido
 * per rallentare la partita.
 *
 * I tiri girano nel browser, non sul Worker: un tiro di dado non ha bisogno di
 * un giro di rete, e cosi' funziona anche senza campo.
 */
'use strict';

const CHIAVE_STORICO_DADI = 'cybercompanion_dadi';

/** Il set completo. d2 e d3 non esistono come solido, si tirano col d6. */
const FACCE_DADO = [2, 3, 4, 6, 8, 10, 12, 20, 100];

/** Tiri ricorrenti a Cyberpunk 2020, a un tocco. */
const TIRI_RAPIDI = [
  { etichetta: '1D10 aperto', quanti: 1, facce: 10, mod: 0, aperto: true },
  { etichetta: '1D10', quanti: 1, facce: 10, mod: 0, aperto: false },
  { etichetta: '1D6', quanti: 1, facce: 6, mod: 0, aperto: false },
  { etichetta: '2D6', quanti: 2, facce: 6, mod: 0, aperto: false },
  { etichetta: '3D6', quanti: 3, facce: 6, mod: 0, aperto: false },
  { etichetta: '1D100', quanti: 1, facce: 100, mod: 0, aperto: false },
];

const statoDadi = {
  quanti: 1,
  facce: 10,
  modificatore: 0,
  aperto: true,
  storico: [],
  ultimo: null,
};

// ------------------------------------------------------------------ tiri ---

/** Un dado. `crypto` invece di Math.random: gli stessi dadi del server. */
function dado(facce) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] % facce) + 1;
}

/**
 * Il d10 di Cyberpunk 2020 e' aperto alle due estremita': con un 10 si ritira e
 * si somma, con un 1 si ritira e si sottrae. E' la stessa funzione del server
 * (server/lib/dadi.js), ripetuta qui perche' il client non importa moduli.
 */
function d10Aperto(maxRitiri = 5) {
  const tiri = [];
  const primo = dado(10);
  tiri.push(primo);
  let totale = primo;

  if (primo === 10 || primo === 1) {
    const segno = primo === 10 ? 1 : -1;
    for (let i = 0; i < maxRitiri; i++) {
      const t = dado(10);
      tiri.push(t);
      totale += segno * t;
      if (t !== 10) break;
    }
  }
  return { totale, tiri, critico: primo === 10, papera: primo === 1 };
}

/** Interpreta "4D6+1", "1D6/2", "2d10". Come tiraNotazione del server. */
function tiraNotazione(notazione) {
  const m = /(\d+)\s*[dD]\s*(\d+)\s*(?:([+-])\s*(\d+))?(?:\s*\/\s*(\d+))?/.exec(String(notazione || ''));
  if (!m) return { totale: 0, tiri: [], valida: false };
  const [, quanti, facce, segno, mod, divisore] = m;
  const tiri = [];
  let somma = 0;
  for (let i = 0; i < Number(quanti); i++) {
    const t = dado(Number(facce));
    tiri.push(t);
    somma += t;
  }
  if (mod) somma += segno === '-' ? -Number(mod) : Number(mod);
  if (divisore) somma = Math.floor(somma / Number(divisore));
  return { totale: Math.max(0, somma), tiri, valida: true };
}

/**
 * Esegue un tiro secondo la configurazione data e lo mette nello storico.
 * Restituisce { etichetta, totale, tiri, dettaglio, aperti }.
 */
function eseguiTiro(config) {
  const quanti = Math.max(1, Math.min(20, Number(config.quanti) || 1));
  const facce = Number(config.facce) || 10;
  const mod = Number(config.modificatore) || 0;
  const aperto = !!config.aperto && facce === 10;

  const gruppi = [];
  let somma = 0;
  for (let i = 0; i < quanti; i++) {
    if (aperto) {
      const t = d10Aperto();
      gruppi.push(t);
      somma += t.totale;
    } else {
      const v = dado(facce);
      gruppi.push({ totale: v, tiri: [v], critico: false, papera: false });
    }
  }
  if (!aperto) somma = gruppi.reduce((a, g) => a + g.totale, 0);

  const totale = somma + mod;
  const etichetta = `${quanti}D${facce}${aperto ? ' aperto' : ''}` +
    (mod ? (mod > 0 ? `+${mod}` : String(mod)) : '');

  const dettaglio = gruppi
    .map((g) => (g.tiri.length > 1 ? `${g.totale} [${g.tiri.join(' ')}]` : String(g.totale)))
    .join(' + ') + (mod ? ` ${mod > 0 ? '+' : '−'} ${Math.abs(mod)}` : '');

  const esito = {
    etichetta,
    totale,
    gruppi,
    dettaglio,
    critico: gruppi.some((g) => g.critico),
    papera: gruppi.some((g) => g.papera),
    ora: Date.now(),
  };
  ricordaTiro(esito);
  return esito;
}

function ricordaTiro(esito) {
  statoDadi.ultimo = esito;
  statoDadi.storico.unshift({ etichetta: esito.etichetta, totale: esito.totale, dettaglio: esito.dettaglio, ora: esito.ora });
  statoDadi.storico = statoDadi.storico.slice(0, 20);
  try {
    localStorage.setItem(CHIAVE_STORICO_DADI, JSON.stringify(statoDadi.storico));
  } catch { /* navigazione privata: lo storico dura quanto la scheda */ }
}

function ripristinaStoricoDadi() {
  try {
    const grezzo = localStorage.getItem(CHIAVE_STORICO_DADI);
    if (grezzo) statoDadi.storico = JSON.parse(grezzo).slice(0, 20);
  } catch { /* storico illeggibile: si riparte da zero */ }
}

/**
 * Tiro al volo da un'altra vista: tira una notazione, lo annota nello storico
 * del lanciadadi e lo annuncia. Serve dove il tiro e' gia' deciso dal contesto
 * (i danni di un'arma, i PU di un impianto) e aprire il pannello sarebbe inutile.
 */
function tiroRapido(notazione, etichetta) {
  const esito = tiraNotazione(notazione);
  if (!esito.valida) {
    toast(`Non riesco a leggere "${notazione}".`, { errore: true });
    return null;
  }
  const voce = {
    etichetta: etichetta ? `${etichetta} (${notazione})` : String(notazione),
    totale: esito.totale,
    dettaglio: esito.tiri.join(' + '),
    gruppi: [],
    ora: Date.now(),
  };
  ricordaTiro(voce);
  toast(`${voce.etichetta}: ${esito.totale}`);
  return esito;
}

// ------------------------------------------------------------------- ui ----

function bottoneDadi() {
  const b = bottone('D10', () => apriLanciadadi(), 'btn-fantasma btn-piccolo btn-dadi');
  b.setAttribute('aria-label', 'Lanciadadi');
  b.title = 'Lanciadadi';
  return b;
}

function apriLanciadadi() {
  const corpo = el('div', 'dadi');

  // --- esito, in cima: e' cio' che si guarda ---
  const box = el('div', 'dadi-esito');
  const numero = el('div', 'dadi-totale', '—');
  const dettaglio = el('div', 'dadi-dettaglio', 'Scegli il dado e tira.');
  box.append(numero, dettaglio);
  corpo.append(box);

  const mostra = (esito) => {
    numero.textContent = String(esito.totale);
    numero.className = `dadi-totale${esito.critico ? ' critico' : ''}${esito.papera ? ' papera' : ''}`;
    dettaglio.textContent = `${esito.etichetta} = ${esito.dettaglio}` +
      (esito.critico ? ' — critico!' : '') + (esito.papera ? ' — papera!' : '');
    disegnaStorico();
  };

  // --- dado ---
  corpo.append(el('h3', 'dadi-titolo', 'Dado'));
  const facce = el('div', 'pillole');
  const bottoniFacce = new Map();
  for (const f of FACCE_DADO) {
    const p = el('button', 'pillola');
    p.type = 'button';
    p.textContent = `D${f}`;
    p.addEventListener('click', () => {
      statoDadi.facce = f;
      aggiornaScelte();
    });
    bottoniFacce.set(f, p);
    facce.append(p);
  }
  corpo.append(facce);

  // --- quantita' e modificatore ---
  const griglia = el('div', 'dadi-numeri');
  const quanti = passo('Quanti', () => statoDadi.quanti, (v) => {
    statoDadi.quanti = Math.max(1, Math.min(20, v));
    aggiornaScelte();
  });
  const mod = passo('Modificatore', () => statoDadi.modificatore, (v) => {
    statoDadi.modificatore = Math.max(-30, Math.min(30, v));
    aggiornaScelte();
  }, true);
  griglia.append(quanti.nodo, mod.nodo);
  corpo.append(griglia);

  // --- d10 aperto ---
  const apertoRiga = el('label', 'dadi-aperto');
  const spunta = el('input');
  spunta.type = 'checkbox';
  spunta.checked = statoDadi.aperto;
  spunta.addEventListener('change', () => {
    statoDadi.aperto = spunta.checked;
    aggiornaScelte();
  });
  apertoRiga.append(spunta, el('span', null, 'D10 aperto: con un 10 si ritira e si somma, con un 1 si ritira e si sottrae.'));
  corpo.append(apertoRiga);

  // --- tiri rapidi ---
  corpo.append(el('h3', 'dadi-titolo', 'Tiri rapidi'));
  const rapidi = el('div', 'pillole');
  for (const t of TIRI_RAPIDI) {
    rapidi.append(bottone(t.etichetta, () => {
      statoDadi.quanti = t.quanti;
      statoDadi.facce = t.facce;
      statoDadi.modificatore = t.mod;
      statoDadi.aperto = t.aperto;
      aggiornaScelte();
      mostra(eseguiTiro(statoDadi));
    }, 'btn-piccolo'));
  }
  corpo.append(rapidi);

  // --- tira ---
  const tira = bottone('Tira', () => mostra(eseguiTiro(statoDadi)), 'btn-primario');
  tira.style.width = '100%';
  tira.style.marginTop = '14px';
  corpo.append(tira);

  // --- storico ---
  corpo.append(el('h3', 'dadi-titolo', 'Ultimi tiri'));
  const storico = el('div', 'dadi-storico');
  corpo.append(storico);

  function disegnaStorico() {
    storico.innerHTML = '';
    if (!statoDadi.storico.length) {
      storico.append(el('div', 'campo-aiuto', 'Nessun tiro ancora.'));
      return;
    }
    for (const v of statoDadi.storico) {
      const riga = el('div', 'dadi-riga');
      riga.append(
        el('span', 'e', v.etichetta),
        el('span', 'd', v.dettaglio),
        el('span', 't', String(v.totale))
      );
      storico.append(riga);
    }
  }

  function aggiornaScelte() {
    for (const [f, p] of bottoniFacce) p.classList.toggle('attiva', f === statoDadi.facce);
    quanti.aggiorna();
    mod.aggiorna();
    spunta.checked = statoDadi.aperto;
    // Il tiro aperto ha senso solo sul d10: sugli altri dadi la regola non
    // esiste, e lasciare la casella attiva farebbe credere il contrario.
    apertoRiga.classList.toggle('spento', statoDadi.facce !== 10);
    spunta.disabled = statoDadi.facce !== 10;
    tira.textContent = `Tira ${statoDadi.quanti}D${statoDadi.facce}` +
      (statoDadi.aperto && statoDadi.facce === 10 ? ' aperto' : '') +
      (statoDadi.modificatore ? (statoDadi.modificatore > 0 ? `+${statoDadi.modificatore}` : String(statoDadi.modificatore)) : '');
  }

  aggiornaScelte();
  disegnaStorico();
  if (statoDadi.ultimo) mostra(statoDadi.ultimo);

  modale('Lanciadadi', corpo, [{ testo: 'Chiudi', classe: 'btn-fantasma' }]);
}

/** Contatore −/valore/+ riutilizzabile. */
function passo(etichetta, leggi, scrivi, conSegno) {
  const nodo = el('div', 'dadi-passo');
  nodo.append(el('div', 'k', etichetta));
  const riga = el('div', 'contatore-livello');
  const valore = el('div', 'valore');
  const meno = bottone(ICONE.meno, () => scrivi(leggi() - 1), 'btn-piccolo btn-icona');
  const piu = bottone(ICONE.piu, () => scrivi(leggi() + 1), 'btn-piccolo btn-icona');
  riga.append(meno, valore, piu);
  nodo.append(riga);
  const aggiorna = () => {
    const v = leggi();
    valore.textContent = conSegno && v > 0 ? `+${v}` : String(v);
  };
  aggiorna();
  return { nodo, aggiorna };
}

ripristinaStoricoDadi();
