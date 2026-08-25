/**
 * Mattoni d'interfaccia condivisi fra le viste.
 *
 * Sono qui, e non in app.js, perche' li usano tutte e tre le parti
 * dell'applicazione — schede, combattimento, netrun — e tenerli con l'editor
 * li avrebbe legati alla scheda in modifica: i campi dell'editor scrivono in
 * `stato.scheda` e segnano la bozza come sporca, questi lavorano su qualunque
 * oggetto gli si passi.
 */
'use strict';

/**
 * Sostituisce la vista in cima allo stack senza toccare la cronologia.
 *
 * `attesa` e' la schermata di caricamento che ci si aspetta di trovare in cima:
 * se nel frattempo l'utente e' tornato indietro, la risposta che arriva tardi
 * non deve sostituire la vista su cui e' finito.
 */
function rimpiazzaCima(vista, attesa) {
  if (!stack.length) { vaiA(vista); return; }
  if (attesa && stack[stack.length - 1] !== attesa) return;
  stack[stack.length - 1] = vista;
  disegna();
}

/** Schermata di caricamento da passare a `vaiA` e poi a `rimpiazzaCima`. */
function vistaAttesa(titolo, messaggio) {
  return { titolo, render: () => schermataAttesa(messaggio) };
}

/** <label> + nodo, con l'aspetto dei campi dell'editor. */
function campoConEtichetta(etichettaTesto, nodo, aiuto) {
  const wrap = el('div', 'campo');
  const id = `c-${Math.random().toString(36).slice(2, 8)}`;
  const l = el('label', null, etichettaTesto);
  l.htmlFor = id;
  nodo.id = id;
  wrap.append(l, nodo);
  if (aiuto) wrap.append(el('div', 'campo-aiuto', aiuto));
  return wrap;
}

/** <select> da un elenco di { id, nome }. */
function selettore(voci, valore, onCambio) {
  const s = el('select');
  for (const v of voci) {
    const o = el('option', null, v.nome);
    o.value = v.id;
    s.append(o);
  }
  s.value = valore == null ? '' : String(valore);
  s.addEventListener('change', () => onCambio(s.value));
  return s;
}

function numeroInput(valore, min, max, onCambio) {
  const i = el('input');
  i.type = 'number';
  if (min != null) i.min = String(min);
  if (max != null) i.max = String(max);
  i.value = valore == null ? '' : String(valore);
  i.addEventListener('input', () => {
    let v = Number(i.value);
    if (!Number.isFinite(v)) return;
    if (min != null && v < min) v = min;
    if (max != null && v > max) v = max;
    onCambio(v);
  });
  return i;
}

/** Campo di testo legato a un oggetto qualunque. */
function campoTestoLibero(oggetto, chiave, etichettaTesto, opzioni) {
  const o = opzioni || {};
  const input = el(o.multilinea ? 'textarea' : 'input');
  if (!o.multilinea) input.type = 'text';
  if (o.righe) input.rows = o.righe;
  if (o.placeholder) input.placeholder = o.placeholder;
  input.value = oggetto[chiave] == null ? '' : String(oggetto[chiave]);
  input.addEventListener('input', () => {
    oggetto[chiave] = input.value;
    if (o.alCambio) o.alCambio(input.value);
  });
  return campoConEtichetta(etichettaTesto, input, o.aiuto);
}

function campoNumero(oggetto, chiave, etichettaTesto, opzioni) {
  const o = opzioni || {};
  const input = numeroInput(oggetto[chiave], o.min, o.max, (v) => {
    oggetto[chiave] = v;
    if (o.alCambio) o.alCambio(v);
  });
  return campoConEtichetta(etichettaTesto, input, o.aiuto);
}

function campoSelettore(oggetto, chiave, etichettaTesto, voci, opzioni) {
  const o = opzioni || {};
  const s = selettore(voci, oggetto[chiave], (v) => {
    oggetto[chiave] = v;
    if (o.alCambio) o.alCambio(v);
  });
  return campoConEtichetta(etichettaTesto, s, o.aiuto);
}

/** Etichetta statica, per i numeri di stato in cima a una vista. */
function etichetta(testo, classe) {
  return el('span', `etichetta ${classe || ''}`.trim(), testo);
}

/** Etichetta cliccabile: stessa forma, ma apre qualcosa. */
function pillolaAzione(testo, onClick) {
  const b = el('button', 'pillola');
  b.type = 'button';
  b.textContent = testo;
  b.addEventListener('click', onClick);
  return b;
}

function avviso(testo) {
  return el('div', 'avviso', testo);
}

/**
 * Sceglie un'arma dal catalogo e la passa a chi l'ha chiesta.
 * Il catalogo e' di 660 voci: senza filtro se ne mostra solo un estratto,
 * altrimenti il telefono impiega un secondo a disegnare la lista.
 */
function scegliArmaDalCatalogo(titolo, onScelta, opzioni) {
  // `chiudiDopo: false` lascia la modale aperta: nell'editor si armano i
  // personaggi due o tre pezzi alla volta, e riaprire ogni volta il catalogo da
  // 660 voci sarebbe una perdita di tempo.
  const chiudiDopo = !opzioni || opzioni.chiudiDopo !== false;
  const corpo = el('div');
  const cerca = el('input');
  cerca.type = 'text';
  cerca.placeholder = 'Cerca…';
  cerca.style.marginBottom = '12px';
  const lista = el('div');
  lista.append(schermataAttesa('Carico il catalogo'));
  corpo.append(cerca, lista);
  modale(titolo, corpo, [{ testo: 'Chiudi', classe: 'btn-fantasma' }]);

  caricaArmi().then((catalogo) => {
    const ridisegna = () => {
      const filtro = cerca.value.trim().toLowerCase();
      lista.innerHTML = '';
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
        wrap.append(
          el('div', 'nome', a.nome),
          el('div', 'campo-aiuto',
            `${a.tipo_esteso || a.tipo} · ${a.danni} · caric. ${a.caricatore} · CdF ${a.cadenza} · ${a.gittata} m · ${a.costo_eb} E$`)
        );
        riga.append(wrap, bottone('Scegli', () => {
          const { sezione, tipo_esteso, ...pulita } = a;
          if (chiudiDopo) chiudiModale();
          onScelta(pulita);
        }, 'btn-piccolo'));
        lista.append(riga);
      }
      if (filtro && trovate.length > 120) {
        lista.append(el('p', 'campo-aiuto', `…e altre ${trovate.length - 120}. Restringi la ricerca.`));
      }
    };
    cerca.addEventListener('input', ridisegna);
    ridisegna();
    cerca.focus();
  }).catch(() => {
    lista.innerHTML = '';
    lista.append(el('div', 'vuoto', 'Catalogo armi non raggiungibile.'));
  });
}
