/**
 * Gestione del combattimento nel browser.
 *
 * Il motore sta tutto sul Worker (server/combat/): qui si schierano i
 * combattenti, si compone l'azione di chi e' di turno e si legge il diario.
 * Ogni azione e' una chiamata sola, e la risposta riporta lo scontro intero:
 * il client non tiene una copia parallela delle regole.
 */
'use strict';

const SQUADRE = [
  { id: 'pg', nome: 'Personaggi' },
  { id: 'nemici', nome: 'Nemici' },
  { id: 'terzi', nome: 'Terzi' },
];

/** Abilita' che il motore di combattimento legge davvero. */
const ABILITA_COMBATTIVE = [
  'Pistole', 'Fucili', 'Mitra', 'Armi pesanti', 'Armi da tiro',
  'Armi bianche', 'Arti marziali', 'Scherma', 'Lottare',
  'Schivare - Divincolarsi', 'Atletica', 'Riparare armi', 'Tecnologia di base',
];

const statoScontro = {
  elenco: [],
  id: null,
  riga: null,
  scontro: null,
  catalogo: null,
  azione: null,
  perCombattente: null,
};

const nomeSquadra = (id) => (SQUADRE.find((s) => s.id === id) || { nome: id }).nome;

async function caricaCatalogoCombat() {
  if (!statoScontro.catalogo) statoScontro.catalogo = await api('/combat/catalogo');
  return statoScontro.catalogo;
}

/** Grado di ferita per un numero di caselle, dalle tabelle gia' in memoria. */
function gradoDaCaselle(caselle) {
  const gradi = stato.cataloghi.stats.ferite;
  const c = Math.max(0, Number(caselle) || 0);
  if (!c) return null;
  return gradi[Math.min(gradi.length - 1, Math.ceil(c / 4) - 1)];
}

// ------------------------------------------------------------ elenco -------

async function apriScontri() {
  const attesa = vistaAttesa('Scontri', 'Carico gli scontri');
  vaiA(attesa);
  try {
    const [{ scontri }] = await Promise.all([api('/encounters'), caricaCatalogoCombat(), caricaCataloghi()]);
    statoScontro.elenco = scontri;
    rimpiazzaCima(vistaScontri(), attesa);
  } catch (err) {
    toast(err.message, { errore: true });
    indietro();
  }
}

function vistaScontri() {
  return {
    titolo: 'Scontri',
    alRitorno() {
      // Tornando indietro da uno scontro il round e' cambiato: si ricarica.
      ricaricaElencoScontri();
    },
    render() {
      const root = el('div');
      root.append(
        el('h1', 'titolo-vista', 'Scontri'),
        el('p', 'sottotitolo-vista',
          'Schiera personaggi e avversari, tira l’iniziativa e svolgi i turni uno alla volta. Le ferite finiscono sulle schede solo alla chiusura, se lo confermi.')
      );

      const azioni = el('div', 'riga-azioni');
      azioni.style.margin = '0 0 20px';
      azioni.append(
        bottone('Nuovo scontro', () => apriNuovoScontro(), 'btn-primario'),
        bottone('Modelli di PNG', () => gestisciModelli())
      );
      root.append(azioni);

      const scontri = statoScontro.elenco;
      if (!scontri.length) {
        const vuoto = el('div', 'vuoto');
        vuoto.append(
          el('p', null, 'Nessuno scontro aperto.'),
          el('p', null, 'Un nuovo scontro parte dai personaggi salvati piu’ gli avversari che aggiungi al momento.')
        );
        root.append(vuoto);
        return root;
      }

      for (const s of scontri) {
        const riga = el('button', 'scheda-riga');
        riga.type = 'button';
        const testi = el('div');
        testi.append(
          el('div', 'nome', s.name),
          el('div', 'meta', `${s.closed ? 'Chiuso' : `Round ${s.round}`} · ${dataLeggibile(s.updated_at)}`)
        );
        riga.append(testi);
        riga.append(el('div', 'classe', s.closed ? 'chiuso' : 'in corso'));
        riga.addEventListener('click', () => apriScontro(s.id));
        root.append(riga);
      }
      return root;
    },
  };
}

/**
 * Ricarica l'elenco restando dove si e'. Non sostituisce la vista: una risposta
 * che arriva mentre si sta gia' navigando altrove finirebbe sulla schermata
 * sbagliata.
 */
async function ricaricaElencoScontri() {
  try {
    statoScontro.elenco = (await api('/encounters')).scontri;
  } catch (err) {
    toast(err.message, { errore: true });
  }
  disegna();
}

// ------------------------------------------------------- schieramento ------

async function apriNuovoScontro() {
  const attesa = vistaAttesa('Nuovo scontro', 'Carico i personaggi');
  vaiA(attesa);
  try {
    const [{ personaggi }, { modelli }] = await Promise.all([
      api('/characters'), api('/npc-templates'),
    ]);
    rimpiazzaCima(vistaNuovoScontro(personaggi, modelli), attesa);
  } catch (err) {
    toast(err.message, { errore: true });
    indietro();
  }
}

function vistaNuovoScontro(personaggi, modelli) {
  const bozza = {
    nome: 'Scontro a fuoco',
    scelti: new Map(),        // id personaggio -> squadra
    avversari: [],            // { nome, quanti, squadra, ... }
  };

  return {
    titolo: 'Nuovo scontro',
    render() {
      const root = el('div');
      root.append(el('h1', 'titolo-vista', 'Schieramento'));

      root.append(campoTestoLibero(bozza, 'nome', 'Nome dello scontro'));

      // --- personaggi dal database ---
      root.append(el('h2', 'sezione-titolo', 'Personaggi'));
      if (!personaggi.length) {
        root.append(el('div', 'vuoto', 'Nessuna scheda salvata: puoi comunque schierare solo avversari.'));
      }
      for (const p of personaggi) {
        const riga = el('div', 'abilita-riga');
        const chk = el('input');
        chk.type = 'checkbox';
        chk.style.width = 'auto';
        chk.setAttribute('aria-label', `Schiera ${p.name}`);

        const testi = el('div');
        testi.style.flex = '1 1 auto';
        testi.style.minWidth = '0';
        testi.append(el('div', 'nome', p.name + (p.handle ? ` "${p.handle}"` : '')));
        if (p.role) testi.append(el('div', 'campo-aiuto', p.role));

        const squadra = selettore(SQUADRE.map((s) => ({ id: s.id, nome: s.nome })), 'pg', (v) => {
          if (bozza.scelti.has(p.id)) bozza.scelti.set(p.id, v);
        });
        squadra.disabled = true;

        chk.addEventListener('change', () => {
          if (chk.checked) bozza.scelti.set(p.id, squadra.value);
          else bozza.scelti.delete(p.id);
          squadra.disabled = !chk.checked;
        });

        riga.append(chk, testi, squadra);
        root.append(riga);
      }

      // --- avversari ---
      root.append(el('h2', 'sezione-titolo', 'Avversari'));
      const listaAvversari = el('div');
      const ridisegnaAvversari = () => {
        listaAvversari.innerHTML = '';
        if (!bozza.avversari.length) {
          listaAvversari.append(el('div', 'vuoto', 'Nessun avversario.'));
          return;
        }
        bozza.avversari.forEach((a, i) => {
          const riga = el('div', 'abilita-riga');
          const testi = el('div');
          testi.style.flex = '1 1 auto';
          testi.style.minWidth = '0';
          testi.append(el('div', 'nome', a.quanti > 1 ? `${a.nome} ×${a.quanti}` : a.nome));
          testi.append(el('div', 'campo-aiuto',
            `${nomeSquadra(a.squadra)} · RIF ${a.RIF} COS ${a.COS} · VP ${a.armaturaVP} · ` +
            ((a.armi || []).map((w) => w.nome).join(', ') || 'disarmato')));
          const modifica = bottone('Modifica', () => modaleAvversario(a, (agg) => {
            bozza.avversari[i] = agg;
            ridisegnaAvversari();
          }), 'btn-piccolo');
          const rimuovi = bottone(ICONE.cestino, () => {
            bozza.avversari.splice(i, 1);
            ridisegnaAvversari();
          }, 'btn-fantasma btn-icona btn-piccolo');
          rimuovi.setAttribute('aria-label', `Rimuovi ${a.nome}`);
          riga.append(testi, modifica, rimuovi);
          listaAvversari.append(riga);
        });
      };
      ridisegnaAvversari();
      root.append(listaAvversari);

      const azAvv = el('div', 'riga-azioni');
      azAvv.append(
        bottone('Avversario nuovo', () => modaleAvversario(avversarioVuoto(), (a) => {
          bozza.avversari.push(a);
          ridisegnaAvversari();
        }), 'btn-piccolo'),
        bottone('Da un modello', () => scegliModello(modelli, (m) => {
          bozza.avversari.push({ ...avversarioVuoto(), ...m.dati, templateId: m.id });
          ridisegnaAvversari();
        }), 'btn-piccolo')
      );
      root.append(azAvv);

      // --- apertura ---
      root.append(el('hr', 'separatore'));
      const apri = bottone('Apri lo scontro', async () => {
        const personaggiScelti = [...bozza.scelti].map(([id, squadra]) => ({ id, squadra }));
        const totale = personaggiScelti.length + bozza.avversari.reduce((a, x) => a + (Number(x.quanti) || 1), 0);
        if (totale < 2) {
          toast('Servono almeno due combattenti.', { errore: true });
          return;
        }
        apri.disabled = true;
        apri.textContent = 'Apro…';
        try {
          const creato = await api('/encounters', {
            method: 'POST',
            body: { nome: bozza.nome, personaggi: personaggiScelti, avversari: bozza.avversari },
          });
          statoScontro.id = creato.id;
          statoScontro.riga = creato;
          statoScontro.scontro = creato.stato;
          statoScontro.azione = null;
          statoScontro.perCombattente = null;
          rimpiazzaCima(vistaScontro());
        } catch (err) {
          toast(err.message, { errore: true });
          apri.disabled = false;
          apri.textContent = 'Apri lo scontro';
        }
      }, 'btn-primario');
      root.append(apri);
      return root;
    },
  };
}

function avversarioVuoto() {
  return {
    nome: 'Teppista', quanti: 1, squadra: 'nemici',
    RIF: 6, COS: 6, TEC: 5, FRE: 5, INT: 5, MOV: 6,
    armaturaVP: 0, bonusIniziativa: 0,
    abilita: { 'Pistole': 4, 'Armi bianche': 3, 'Schivare - Divincolarsi': 3 },
    armi: [],
  };
}

/** Scheda di un avversario: quel poco che il combattimento usa davvero. */
function modaleAvversario(originale, onSalva) {
  const a = JSON.parse(JSON.stringify(originale));
  const corpo = el('div');

  corpo.append(campoTestoLibero(a, 'nome', 'Nome'));

  const numeri = el('div', 'griglia griglia-2');
  numeri.append(
    campoNumero(a, 'quanti', 'Quanti', { min: 1, max: 20 }),
    campoSelettore(a, 'squadra', 'Squadra', SQUADRE)
  );
  corpo.append(numeri);

  corpo.append(el('h3', 'dadi-titolo', 'Caratteristiche'));
  const car = el('div', 'griglia griglia-3');
  for (const k of ['RIF', 'COS', 'TEC', 'FRE', 'INT', 'MOV']) {
    car.append(campoNumero(a, k, k, { min: 1, max: 20 }));
  }
  corpo.append(car);

  const prot = el('div', 'griglia griglia-2');
  prot.append(
    campoNumero(a, 'armaturaVP', 'VP armatura', { min: 0, max: 60, aiuto: 'Uguale su tutto il corpo.' }),
    campoNumero(a, 'bonusIniziativa', 'Bonus iniziativa', { min: 0, max: 10, aiuto: 'Senso del combattimento e simili.' })
  );
  corpo.append(prot);

  corpo.append(el('h3', 'dadi-titolo', 'Abilita\''));
  const abil = el('div', 'griglia griglia-2');
  for (const nome of ABILITA_COMBATTIVE) {
    const proxy = { v: Number(a.abilita?.[nome]) || 0 };
    abil.append(campoNumero(proxy, 'v', nome, {
      min: 0, max: 10,
      alCambio: () => {
        a.abilita = a.abilita || {};
        if (proxy.v > 0) a.abilita[nome] = proxy.v;
        else delete a.abilita[nome];
      },
    }));
  }
  corpo.append(abil);

  corpo.append(el('h3', 'dadi-titolo', 'Armi'));
  const armi = el('div');
  const ridisegnaArmi = () => {
    armi.innerHTML = '';
    if (!(a.armi || []).length) armi.append(el('div', 'vuoto', 'Disarmato.'));
    (a.armi || []).forEach((w, i) => {
      const riga = el('div', 'abilita-riga');
      const testi = el('div');
      testi.style.flex = '1 1 auto';
      testi.append(el('div', 'nome', w.nome),
        el('div', 'campo-aiuto', `${w.danni} · ${w.gittata} m · caric. ${w.caricatore} · CdF ${w.cadenza}`));
      const rim = bottone(ICONE.cestino, () => { a.armi.splice(i, 1); ridisegnaArmi(); },
        'btn-fantasma btn-icona btn-piccolo');
      rim.setAttribute('aria-label', `Rimuovi ${w.nome}`);
      riga.append(testi, rim);
      armi.append(riga);
    });
    const az = el('div', 'riga-azioni');
    az.append(bottone('Aggiungi arma', () => {
      // Il selettore apre una seconda modale: alla chiusura si ritorna qui.
      scegliArmaDalCatalogo('Arma dell\'avversario', (arma) => {
        a.armi = a.armi || [];
        a.armi.push(arma);
        modaleAvversario(a, onSalva);
      });
    }, 'btn-piccolo'));
    armi.append(az);
  };
  ridisegnaArmi();
  corpo.append(armi);

  modale(originale.nome && originale.armi ? 'Avversario' : 'Nuovo avversario', corpo, [
    { testo: 'Annulla', classe: 'btn-fantasma' },
    {
      testo: 'Salva come modello',
      onClick: async () => {
        try {
          const { quanti, squadra, templateId, ...modello } = a;
          await api('/npc-templates', { method: 'POST', body: { modello } });
          toast(`${a.nome} salvato fra i modelli.`);
        } catch (err) {
          toast(err.message, { errore: true });
        }
        onSalva(a);
      },
    },
    { testo: 'Metti in campo', classe: 'btn-primario', onClick: () => onSalva(a) },
  ]);
}

function scegliModello(modelli, onScelta) {
  if (!modelli.length) {
    modale('Modelli di PNG', 'Non ne hai ancora salvato nessuno. Crea un avversario e usa "Salva come modello".');
    return;
  }
  const corpo = el('div');
  for (const m of modelli) {
    const riga = el('div', 'abilita-riga');
    const testi = el('div');
    testi.style.flex = '1 1 auto';
    testi.append(el('div', 'nome', m.name),
      el('div', 'campo-aiuto', `${m.categoria || 'senza categoria'} · RIF ${m.dati.RIF} · VP ${m.dati.armaturaVP}`));
    riga.append(testi, bottone('Metti in campo', () => {
      chiudiModale();
      onScelta(m);
    }, 'btn-piccolo'));
    corpo.append(riga);
  }
  modale('Modelli di PNG', corpo, [{ testo: 'Chiudi', classe: 'btn-fantasma' }]);
}

async function gestisciModelli() {
  try {
    const { modelli } = await api('/npc-templates');
    const corpo = el('div');
    if (!modelli.length) corpo.append(el('div', 'vuoto', 'Nessun modello salvato.'));
    for (const m of modelli) {
      const riga = el('div', 'abilita-riga');
      const testi = el('div');
      testi.style.flex = '1 1 auto';
      testi.append(el('div', 'nome', m.name),
        el('div', 'campo-aiuto', `RIF ${m.dati.RIF} · VP ${m.dati.armaturaVP} · ${(m.dati.armi || []).map((w) => w.nome).join(', ') || 'disarmato'}`));
      const rim = bottone(ICONE.cestino, async () => {
        try {
          await api(`/npc-templates/${m.id}`, { method: 'DELETE' });
          riga.remove();
          toast('Modello eliminato.');
        } catch (err) {
          toast(err.message, { errore: true });
        }
      }, 'btn-fantasma btn-icona btn-piccolo');
      rim.setAttribute('aria-label', `Elimina ${m.name}`);
      riga.append(testi, rim);
      corpo.append(riga);
    }
    modale('Modelli di PNG', corpo, [{ testo: 'Chiudi', classe: 'btn-fantasma' }]);
  } catch (err) {
    toast(err.message, { errore: true });
  }
}

// -------------------------------------------------------- vista scontro ----

async function apriScontro(id) {
  const attesa = vistaAttesa('Scontro', 'Carico lo scontro');
  vaiA(attesa);
  try {
    await caricaCatalogoCombat();
    const riga = await api(`/encounters/${id}`);
    statoScontro.id = id;
    statoScontro.riga = riga;
    statoScontro.scontro = riga.stato;
    statoScontro.azione = null;
    statoScontro.perCombattente = null;
    rimpiazzaCima(vistaScontro(), attesa);
  } catch (err) {
    toast(err.message, { errore: true });
    indietro();
  }
}

/** Chi e' di turno secondo lo stato che il client ha in mano. */
function diTurno() {
  const s = statoScontro.scontro;
  if (!s || !s.ordine.length || s.chiuso) return null;
  for (let i = 0; i < s.ordine.length; i++) {
    const idx = (s.indiceTurno + i) % s.ordine.length;
    const c = s.combattenti.find((x) => x.id === s.ordine[idx]);
    if (c && !c.fuoriCombattimento) return c;
  }
  return null;
}

function vistaScontro() {
  return {
    titolo: 'Scontro',
    render() {
      const s = statoScontro.scontro;
      const root = el('div');

      $barraDx.append(bottone('⋯', () => menuScontro(), 'btn-fantasma btn-icona'));

      root.append(el('h1', 'titolo-vista', s.nome));

      const stato_ = el('div', 'pillole');
      stato_.style.marginBottom = '16px';
      stato_.append(
        etichetta(s.chiuso ? 'Chiuso' : `Round ${s.round}`),
        pillolaAzione(`Distanza ${s.distanza} m`, () => cambiaDistanza())
      );
      const vive = [...new Set(s.combattenti.filter((c) => !c.fuoriCombattimento).map((c) => c.squadra))];
      stato_.append(etichetta(vive.length > 1 ? `${vive.map(nomeSquadra).join(' contro ')}` : 'Scontro deciso'));
      root.append(stato_);

      // --- ordine di iniziativa ---
      const attuale = diTurno();
      root.append(el('h2', 'sezione-titolo', 'Ordine di iniziativa'));
      const ordine = el('div', 'combattenti');
      for (const id of s.ordine) {
        const c = s.combattenti.find((x) => x.id === id);
        if (c) ordine.append(cartaCombattente(c, attuale && c.id === attuale.id));
      }
      root.append(ordine);

      // --- azione ---
      if (!s.chiuso && attuale) {
        root.append(el('h2', 'sezione-titolo', `Tocca a ${attuale.nome}`));
        root.append(pannelloAzione(attuale));
      } else if (s.chiuso) {
        root.append(el('div', 'vuoto', 'Lo scontro e’ chiuso. Resta il diario.'));
      }

      // --- diario ---
      root.append(el('h2', 'sezione-titolo', 'Diario'));
      const diario = el('div', 'diario');
      const voci = [...s.diario].reverse().slice(0, 60);
      if (!voci.length) diario.append(el('div', 'vuoto', 'Ancora niente.'));
      for (const v of voci) {
        const riga = el('div', `diario-voce${v.tipo === 'fine' || v.tipo === 'chiusura' ? ' forte' : ''}`);
        riga.append(el('span', 'r', `R${v.round}`), el('span', 't', v.testo || ''));
        if (v.automatica) riga.append(el('span', 'auto', 'auto'));
        diario.append(riga);
      }
      root.append(diario);
      return root;
    },
  };
}

function cartaCombattente(c, diTurnoOra) {
  const carta = el('div', `combattente${diTurnoOra ? ' turno' : ''}${c.fuoriCombattimento ? ' fuori' : ''}`);

  const testa = el('div', 'testa');
  testa.append(el('span', 'ini', c.iniziativa == null ? '—' : String(c.iniziativa)));
  testa.append(el('span', 'nome', c.nome));
  testa.append(el('span', `squadra sq-${c.squadra}`, nomeSquadra(c.squadra)));
  carta.append(testa);

  const grado = gradoDaCaselle(c.ferite);
  const stati = [];
  stati.push(`${c.ferite}/${statoScontro.catalogo.caselleTotali} ${grado ? grado.grado.toLowerCase() : 'illeso'}`);
  if (c.stordito) stati.push('stordito');
  if (c.morto) stati.push('morto');
  else if (c.fuoriCombattimento) stati.push('fuori combattimento');
  if (c.riparo && c.riparo !== 'nessuno') {
    const r = statoScontro.catalogo.ripari.find((x) => x.id === c.riparo);
    stati.push(`al riparo (${r ? r.nome.toLowerCase() : c.riparo})`);
  }
  if (c.difesa) stati.push(c.difesa.tipo === 'schiva' ? 'pronto a schivare' : 'in parata');
  const inceppate = Object.keys(c.inceppate || {}).filter((k) => c.inceppate[k]);
  for (const k of inceppate) stati.push(`${c.armi[k]?.nome || 'arma'} inceppata`);
  carta.append(el('div', 'stato', stati.join(' · ')));

  // Barra delle ferite: 10 gradi da 4 caselle, come sulla scheda.
  const barra = el('div', 'barra-ferite');
  for (let i = 0; i < statoScontro.catalogo.caselleTotali; i++) {
    barra.append(el('span', `tacca${i < c.ferite ? ' piena' : ''}${(i + 1) % 4 === 0 ? ' fine-grado' : ''}`));
  }
  carta.append(barra);

  // Armatura: si mostra solo dove e' cambiata o dove c'e'.
  const pezzi = statoScontro.catalogo.localizzazioni
    .map((l) => ({ l, vp: c.armatura?.[l.id] || 0, iniziale: c.armaturaIniziale?.[l.id] || 0 }))
    .filter((x) => x.iniziale > 0);
  if (pezzi.length) {
    const arm = el('div', 'armatura');
    for (const p of pezzi) {
      const consumata = p.vp < p.iniziale;
      arm.append(el('span', `vp${consumata ? ' consumata' : ''}`,
        `${p.l.nome} ${p.vp}${consumata ? `/${p.iniziale}` : ''}`));
    }
    carta.append(arm);
  }

  if ((c.armi || []).length) {
    const armi = el('div', 'armi-riga');
    c.armi.forEach((w, i) => {
      const colpi = c.colpiInCanna?.[i];
      armi.append(el('span', 'arma', `${w.nome}${colpi == null ? '' : ` ${colpi}`}`));
    });
    carta.append(armi);
  }
  return carta;
}

// ------------------------------------------------------- pannello azione ---

function bozzaAzione(comb) {
  const armaDaFuoco = (comb.armi || []).findIndex((w) => Number(w.gittata) > 3);
  return {
    tipo: armaDaFuoco >= 0 ? 'fuoco' : 'mischia',
    armaIdx: armaDaFuoco >= 0 ? armaDaFuoco : (comb.armi || []).length ? 0 : -1,
    bersaglio: null,
    munizioni: 'normale',
    modificatori: [],
    parte: 'tronco',
    riparo: 'medio',
    colpi: null,
    manovra: 'pugno',
    distanza: statoScontro.scontro.distanza,
  };
}

function pannelloAzione(comb) {
  if (!statoScontro.azione || statoScontro.perCombattente !== comb.id) {
    statoScontro.azione = bozzaAzione(comb);
    statoScontro.perCombattente = comb.id;
  }
  const a = statoScontro.azione;
  const cat = statoScontro.catalogo;
  const s = statoScontro.scontro;

  const box = el('div', 'azione');
  const corpo = el('div');

  const ridisegna = () => {
    corpo.innerHTML = '';
    const def = cat.azioni.find((x) => x.id === a.tipo);

    // --- che cosa fa ---
    const tipi = el('div', 'pillole');
    for (const az of cat.azioni) {
      const p = el('button', `pillola${az.id === a.tipo ? ' attiva' : ''}`);
      p.type = 'button';
      p.textContent = az.nome;
      p.addEventListener('click', () => { a.tipo = az.id; ridisegna(); });
      tipi.append(p);
    }
    corpo.append(tipi);
    if (def) corpo.append(el('p', 'campo-aiuto', def.descrizione));

    const attacco = def && def.categoria === 'attacco';

    // --- arma ---
    // Sbloccare e ricaricare non hanno un bersaglio, ma hanno un'arma.
    if (attacco || (def && def.categoria === 'utilita')) {
      const armi = (comb.armi || []).map((w, i) => ({
        id: String(i),
        nome: `${w.nome} — ${w.danni}` +
          (comb.colpiInCanna?.[i] == null ? '' : ` (${comb.colpiInCanna[i]} colpi)`) +
          (comb.inceppate?.[i] ? ' — inceppata' : ''),
      }));
      if (a.tipo === 'mischia') armi.unshift({ id: '-1', nome: 'A mani nude' });

      if (!armi.length) {
        corpo.append(el('p', 'campo-aiuto', `${comb.nome} non ha armi: resta il corpo a corpo a mani nude.`));
      } else {
        corpo.append(campoConEtichetta('Arma', selettore(armi, String(a.armaIdx), (v) => {
          a.armaIdx = Number(v);
          ridisegna();
        })));
      }

      const arma = comb.armi?.[a.armaIdx];
      if (arma && (a.tipo === 'raffica' || a.tipo === 'automatico') && Number(arma.cadenza) < 3) {
        corpo.append(avviso(`${arma.nome} ha cadenza ${arma.cadenza || 1}: non e’ un’arma automatica.`));
      }
      if (arma && comb.inceppate?.[a.armaIdx] && a.tipo !== 'sblocca') {
        corpo.append(avviso(`${arma.nome} e’ inceppata: prima va sbloccata.`));
      }
      if (a.tipo === 'mischia' && a.armaIdx < 0) {
        corpo.append(campoConEtichetta('Manovra', selettore(
          [{ id: 'pugno', nome: 'Pugno (1D6/2)' }, { id: 'calcio', nome: 'Calcio (1D6)' }],
          a.manovra, (v) => { a.manovra = v; }
        )));
      }
    }

    // --- bersaglio ---
    if (attacco) {
      const nemici = s.combattenti.filter((c) => !c.fuoriCombattimento && c.id !== comb.id);
      if (!a.bersaglio || !nemici.some((c) => c.id === a.bersaglio)) {
        const primo = nemici.find((c) => c.squadra !== comb.squadra) || nemici[0];
        a.bersaglio = primo ? primo.id : null;
      }
      corpo.append(campoConEtichetta('Bersaglio', selettore(
        nemici.map((c) => ({
          id: c.id,
          nome: `${c.nome} (${nomeSquadra(c.squadra)}) — ${c.ferite} caselle`,
        })),
        a.bersaglio, (v) => { a.bersaglio = v; }
      )));
    }

    // --- distanza, munizioni, colpi ---
    if (attacco && def.aDistanza) {
      const griglia = el('div', 'griglia griglia-2');
      griglia.append(campoConEtichetta('Distanza (m)', numeroInput(a.distanza, 0, 2000, (v) => { a.distanza = v; })));
      griglia.append(campoConEtichetta('Munizioni', selettore(
        MUNIZIONI_CLIENT, a.munizioni, (v) => { a.munizioni = v; ridisegna(); }
      )));
      corpo.append(griglia);
      const mun = MUNIZIONI_CLIENT.find((m) => m.id === a.munizioni);
      if (mun && mun.desc) corpo.append(el('p', 'campo-aiuto', mun.desc));

      if (a.tipo === 'automatico') {
        const arma = comb.armi?.[a.armaIdx];
        const max = Math.max(1, Number(arma?.cadenza) || 1);
        if (a.colpi == null) a.colpi = max;
        corpo.append(campoConEtichetta(`Colpi da sparare (max ${max})`,
          numeroInput(a.colpi, 1, max, (v) => { a.colpi = v; })));
      }
    }

    // --- riparo ---
    if (a.tipo === 'riparo') {
      corpo.append(campoConEtichetta('Riparo', selettore(
        cat.ripari.map((r) => ({ id: r.id, nome: `${r.nome} (VP ${r.vp})` })),
        a.riparo, (v) => { a.riparo = v; }
      )));
    }

    // --- modificatori ---
    if (attacco) {
      corpo.append(el('div', 'campo-aiuto', 'Modificatori al tiro'));
      const mods = el('div', 'pillole');
      for (const m of cat.modificatori) {
        const attivo = a.modificatori.includes(m.id);
        const p = el('button', `pillola${attivo ? ' attiva' : ''}`);
        p.type = 'button';
        p.textContent = `${m.nome} ${m.mod > 0 ? '+' : ''}${m.mod}`;
        p.addEventListener('click', () => {
          a.modificatori = attivo
            ? a.modificatori.filter((x) => x !== m.id)
            : [...a.modificatori, m.id];
          ridisegna();
        });
        mods.append(p);
      }
      corpo.append(mods);

      if (a.modificatori.includes('mirato')) {
        corpo.append(campoConEtichetta('Dove miri', selettore(
          cat.localizzazioni.map((l) => ({ id: l.id, nome: l.moltiplicatore > 1 ? `${l.nome} (danni ×${l.moltiplicatore})` : l.nome })),
          a.parte, (v) => { a.parte = v; }
        )));
      }
    }

    // --- comandi ---
    const comandi = el('div', 'riga-azioni');
    comandi.append(bottone('Svolgi il turno', () => svolgi(a), 'btn-primario'));
    comandi.append(bottone('Azione a caso', () => svolgi({ tipo: 'auto', distanza: a.distanza })));
    comandi.append(bottone('Proponi', () => proponi(comb)));
    comandi.append(bottone('Passa', () => passaTurno()));
    corpo.append(comandi);
    corpo.append(el('p', 'campo-aiuto',
      '"Azione a caso" lascia decidere al motore: bersaglio, arma e modo di sparare. "Proponi" fa la stessa scelta ma la scrive qui sopra, cosi’ puoi cambiarla prima di tirare.'));
  };

  ridisegna();
  box.append(corpo);
  return box;
}

const MUNIZIONI_CLIENT = [
  { id: 'normale', nome: 'Normali', desc: '' },
  { id: 'perforante', nome: 'Perforanti', desc: 'Dimezzano il VP dell’armatura, ma anche il danno che passa.' },
  { id: 'dirompente', nome: 'Dirompenti', desc: 'L’armatura le ferma il doppio, ma su carne scoperta fanno il doppio dei danni.' },
];

async function svolgi(azione) {
  const comb = diTurno();
  if (!comb) return;
  const corpo = { ...azione, attaccante: comb.id };
  try {
    const esito = await api(`/encounters/${statoScontro.id}/azione`, { method: 'POST', body: corpo });
    statoScontro.scontro = esito.stato;
    statoScontro.azione = null;
    statoScontro.perCombattente = null;
    disegna();
    if (esito.voce && esito.voce.testo) toast(esito.voce.testo, { durata: 5000 });
  } catch (err) {
    toast(err.message, { errore: true });
  }
}

async function passaTurno() {
  try {
    const esito = await api(`/encounters/${statoScontro.id}/passa`, { method: 'POST', body: {} });
    statoScontro.scontro = esito.stato;
    statoScontro.azione = null;
    statoScontro.perCombattente = null;
    disegna();
  } catch (err) {
    toast(err.message, { errore: true });
  }
}

/** Chiede al motore che cosa farebbe e riempie il pannello con la sua scelta. */
async function proponi(comb) {
  try {
    const p = await api(`/encounters/${statoScontro.id}/proposta?distanza=${statoScontro.scontro.distanza}`);
    statoScontro.azione = {
      ...bozzaAzione(comb),
      ...p.azione,
      modificatori: p.azione.modificatori || [],
    };
    statoScontro.perCombattente = comb.id;
    disegna();
    toast(p.descrizione || 'Proposta pronta.', { durata: 5000 });
  } catch (err) {
    toast(err.message, { errore: true });
  }
}

// ------------------------------------------------------------- comandi -----

function cambiaDistanza() {
  const corpo = el('div');
  const input = numeroInput(statoScontro.scontro.distanza, 0, 2000, () => {});
  corpo.append(campoConEtichetta('Metri fra gli schieramenti', input));
  corpo.append(el('p', 'campo-aiuto',
    'La distanza vale per tutti: senza una mappa e’ l’approssimazione che al tavolo si usa comunque.'));
  modale('Distanza', corpo, [
    { testo: 'Annulla', classe: 'btn-fantasma' },
    {
      testo: 'Aggiorna', classe: 'btn-primario',
      onClick: async () => {
        try {
          const { distanza } = await api(`/encounters/${statoScontro.id}/distanza`, {
            method: 'POST', body: { distanza: Number(input.value) },
          });
          statoScontro.scontro.distanza = distanza;
          if (statoScontro.azione) statoScontro.azione.distanza = distanza;
          disegna();
        } catch (err) {
          toast(err.message, { errore: true });
        }
      },
    },
  ]);
}

function menuScontro() {
  const corpo = el('div');
  const voci = [
    ['Cambia la distanza', () => cambiaDistanza()],
    ['Ritira l’iniziativa', () => ritiraIniziativa()],
    ['Chiudi lo scontro', () => chiudiScontro()],
  ];
  for (const [testo, fn] of voci) {
    const b = bottone(testo, () => { chiudiModale(); fn(); });
    b.style.width = '100%';
    b.style.marginBottom = '8px';
    b.style.justifyContent = 'flex-start';
    corpo.append(b);
  }
  const elimina = bottone('Elimina lo scontro', () => {
    chiudiModale();
    conferma('Eliminare lo scontro?', 'Sparisce dal database, diario compreso.', async () => {
      try {
        await api(`/encounters/${statoScontro.id}`, { method: 'DELETE' });
        toast('Scontro eliminato.');
        indietro();
      } catch (err) {
        toast(err.message, { errore: true });
      }
    }, 'Elimina');
  }, 'btn-pericolo');
  elimina.style.width = '100%';
  elimina.style.justifyContent = 'flex-start';
  corpo.append(el('hr', 'separatore'), elimina);
  modale('Scontro', corpo, [{ testo: 'Chiudi', classe: 'btn-fantasma' }]);
}

async function ritiraIniziativa() {
  try {
    const esito = await api(`/encounters/${statoScontro.id}/iniziativa`, { method: 'POST', body: {} });
    statoScontro.scontro = esito.stato;
    statoScontro.azione = null;
    disegna();
    toast('Iniziativa ritirata.');
  } catch (err) {
    toast(err.message, { errore: true });
  }
}

/**
 * Chiusura: prima si guarda che cosa finirebbe sulle schede, poi si decide.
 * E' l'unico punto in cui il combattimento tocca i personaggi salvati, e va
 * confermato a mano: un turno tirato per prova non deve lasciare cicatrici.
 */
async function chiudiScontro() {
  let riepilogo = [];
  try {
    ({ ferite: riepilogo } = await api(`/encounters/${statoScontro.id}/riepilogo`));
  } catch (err) {
    toast(err.message, { errore: true });
    return;
  }

  const corpo = el('div');
  if (!riepilogo.length) {
    corpo.append(el('p', null, 'Nessun personaggio salvato ha cambiato stato: non c’e’ niente da scrivere.'));
  } else {
    corpo.append(el('p', null, 'Sulle schede finirebbe questo:'));
    for (const r of riepilogo) {
      const riga = el('div', 'abilita-riga');
      const testi = el('div');
      testi.style.flex = '1 1 auto';
      testi.append(el('div', 'nome', r.nome));
      testi.append(el('div', 'campo-aiuto',
        `${r.feritePrima} → ${r.feriteDopo} caselle (${r.differenza > 0 ? '+' : ''}${r.differenza}) · ${r.grado}${r.morto ? ' · morto' : ''}`));
      riga.append(testi);
      corpo.append(riga);
    }
  }

  const chiudi = async (riportaFerite) => {
    try {
      const esito = await api(`/encounters/${statoScontro.id}/chiudi`, { method: 'POST', body: { riportaFerite } });
      statoScontro.scontro = esito.stato;
      stato.listaScaduta = riportaFerite;
      disegna();
      toast(riportaFerite
        ? `Scontro chiuso, ferite riportate su ${esito.scritte.length} scheda/e.`
        : 'Scontro chiuso senza toccare le schede.');
    } catch (err) {
      toast(err.message, { errore: true });
    }
  };

  modale('Chiudere lo scontro?', corpo, [
    { testo: 'Annulla', classe: 'btn-fantasma' },
    { testo: 'Chiudi e basta', onClick: () => chiudi(false) },
    { testo: 'Chiudi e scrivi', classe: 'btn-primario', onClick: () => chiudi(true) },
  ]);
}
