/**
 * Impagina una scheda personaggio su due pagine A4, riprendendo la struttura
 * della Cyberscheda ufficiale italiana (doc/Cyberpunk 2020 - Cyberscheda.pdf).
 *
 * Pensata per essere stampata: fondo bianco, testo nero, bande scure solo nei
 * titoli. Usa client/pdf.js, quindi nessuna dipendenza esterna.
 */
(function (global) {
  'use strict';

  const NERO = [0, 0, 0];
  const GRIGIO = [0.45, 0.45, 0.45];
  const GRIGIO_CHIARO = [0.85, 0.85, 0.85];
  const FONDO_TENUE = [0.94, 0.94, 0.96];
  const SCURO = [0.05, 0.06, 0.1];
  const BIANCO = [1, 1, 1];
  const ACCENTO = [0, 0.55, 0.72];

  const M = 34;               // margine
  const COLONNA_GRANDE = 527; // larghezza utile

  /** Banda scura con il titolo di sezione. */
  function titoloSezione(doc, y, testo) {
    doc.rettangolo(M, y, COLONNA_GRANDE, 14, { riempimento: SCURO });
    doc.testo(M + 6, y + 10, testo.toUpperCase(), {
      dimensione: 8, grassetto: true, colore: BIANCO, spaziatura: 1.2,
    });
    return y + 20;
  }

  /** Etichetta piccola sopra una riga da compilare, col valore gia' scritto. */
  function campo(doc, x, y, larghezza, etichetta, valore) {
    doc.testo(x, y, etichetta.toUpperCase(), { dimensione: 5.5, colore: GRIGIO, spaziatura: 0.6 });
    doc.testo(x, y + 10, valore == null || valore === '' ? '—' : String(valore), { dimensione: 9 });
    doc.linea(x, y + 13, x + larghezza, y + 13, { colore: GRIGIO_CHIARO, spessore: 0.4 });
    return y + 24;
  }

  /** Riquadro di una caratteristica: sigla, numero grande, nome esteso. */
  function riquadroStat(doc, x, y, sigla, valore, nome) {
    const L = 55, A = 46;
    doc.rettangolo(x, y, L, A, { riempimento: FONDO_TENUE, bordo: NERO, spessore: 0.7 });
    doc.testo(x + L / 2, y + 11, sigla, {
      dimensione: 7.5, grassetto: true, allineamento: 'centro', colore: ACCENTO, spaziatura: 0.8,
    });
    doc.testo(x + L / 2, y + 33, String(valore), { dimensione: 19, grassetto: true, allineamento: 'centro' });
    doc.testo(x + L / 2, y + 42, nome, { dimensione: 5, allineamento: 'centro', colore: GRIGIO });
  }

  /** Riga "etichetta ......... valore" per i valori derivati. */
  function rigaValore(doc, x, y, larghezza, etichetta, valore) {
    doc.testo(x, y, etichetta, { dimensione: 7.5 });
    doc.testo(x + larghezza, y, String(valore), { dimensione: 7.5, grassetto: true, allineamento: 'destra' });
    doc.linea(x, y + 2.5, x + larghezza, y + 2.5, { colore: [0.92, 0.92, 0.92], spessore: 0.3 });
    return y + 11;
  }

  function bonusCostituzione(cos, stats) {
    const f = stats.bonus_costituzione.find((r) => cos >= r.min && cos <= r.max);
    return f || stats.bonus_costituzione[stats.bonus_costituzione.length - 1];
  }

  /** Traccia dei danni: 10 gradi da 4 caselle, con quelle segnate annerite. */
  function tracciaFerite(doc, y, caselleSegnate, stats) {
    const gradi = stats.ferite;
    const larghezzaGrado = COLONNA_GRANDE / gradi.length;
    let indice = 0;

    gradi.forEach((grado, i) => {
      const x = M + i * larghezzaGrado;
      doc.testo(x + larghezzaGrado / 2, y + 6, grado.grado, {
        dimensione: 5, allineamento: 'centro', colore: GRIGIO,
      });
      for (let c = 0; c < grado.caselle; c++) {
        const cx = x + 4 + c * ((larghezzaGrado - 10) / grado.caselle);
        const lato = (larghezzaGrado - 12) / grado.caselle;
        doc.rettangolo(cx, y + 10, lato, lato, {
          bordo: NERO, spessore: 0.5,
          riempimento: indice < caselleSegnate ? [0.15, 0.15, 0.15] : BIANCO,
        });
        indice++;
      }
      doc.testo(x + larghezzaGrado / 2, y + 12 + (larghezzaGrado - 12) / grado.caselle + 6, String(grado.stordimento), {
        dimensione: 5, allineamento: 'centro', colore: GRIGIO,
      });
    });
    return y + 20 + (larghezzaGrado - 12) / 4;
  }

  /** Intestazione di tabella con le colonne date. */
  function intestazioneTabella(doc, y, colonne) {
    doc.rettangolo(M, y, COLONNA_GRANDE, 11, { riempimento: [0.9, 0.9, 0.92] });
    let x = M + 4;
    for (const col of colonne) {
      doc.testo(col.allineamento === 'destra' ? x + col.larghezza - 4 : x, y + 7.5, col.titolo.toUpperCase(), {
        dimensione: 5.5, grassetto: true, colore: [0.25, 0.25, 0.25], spaziatura: 0.5,
        allineamento: col.allineamento,
      });
      x += col.larghezza;
    }
    return y + 15;
  }

  function rigaTabella(doc, y, colonne, valori, alternata) {
    if (alternata) doc.rettangolo(M, y - 7.5, COLONNA_GRANDE, 11, { riempimento: [0.97, 0.97, 0.98] });
    let x = M + 4;
    colonne.forEach((col, i) => {
      const v = valori[i] == null ? '' : String(valori[i]);
      // Tronca invece di mandare a capo: una riga per oggetto tiene la tabella leggibile.
      let testo = v;
      while (testo && doc.larghezzaTesto(testo, 7.5, false) > col.larghezza - 6) testo = testo.slice(0, -1);
      if (testo !== v && testo.length > 1) testo = testo.slice(0, -1) + '…';
      doc.testo(col.allineamento === 'destra' ? x + col.larghezza - 4 : x, y, testo, {
        dimensione: 7.5, allineamento: col.allineamento,
      });
      x += col.larghezza;
    });
    return y + 11;
  }

  function pieDiPagina(doc, numero, totale, nome) {
    doc.linea(M, 812, M + COLONNA_GRANDE, 812, { colore: GRIGIO_CHIARO, spessore: 0.4 });
    doc.testo(M, 822, `CyberCompanion · Cyberpunk 2020 · ${nome || 'scheda'}`, { dimensione: 6, colore: GRIGIO });
    doc.testo(M + COLONNA_GRANDE, 822, `${numero} / ${totale}`, {
      dimensione: 6, colore: GRIGIO, allineamento: 'destra',
    });
  }

  // ------------------------------------------------------------- pagina 1 --

  function paginaUno(doc, scheda, cat) {
    const a = scheda.anagrafica || {};
    const classe = (cat.roles.classi || []).find((c) => c.id === scheda.classe);
    const stat = scheda.caratteristiche || {};

    doc.sfondo(BIANCO);
    doc.rettangolo(0, 0, doc.larghezza, 52, { riempimento: SCURO });
    doc.testo(M, 24, 'CYBERPUNK 2020', {
      dimensione: 15, grassetto: true, colore: BIANCO, spaziatura: 3,
    });
    doc.testo(M, 40, 'CYBERSCHEDA', { dimensione: 7, colore: ACCENTO, spaziatura: 4 });
    doc.testo(M + COLONNA_GRANDE, 26, a.nome || 'Senza nome', {
      dimensione: 13, grassetto: true, colore: BIANCO, allineamento: 'destra',
    });
    if (a.soprannome) {
      doc.testo(M + COLONNA_GRANDE, 40, `"${a.soprannome}"`, {
        dimensione: 8, colore: ACCENTO, allineamento: 'destra',
      });
    }

    let y = 68;
    y = titoloSezione(doc, y, 'Anagrafica');

    const c3 = (COLONNA_GRANDE - 20) / 3;
    const c4 = (COLONNA_GRANDE - 30) / 4;
    let yr = y;
    campo(doc, M, yr, c3, 'Giocatore', a.giocatore);
    campo(doc, M + c3 + 10, yr, c3, 'Classe', classe ? classe.nome : '');
    campo(doc, M + (c3 + 10) * 2, yr, c3, 'Nato a', a.natoA);
    yr += 24;
    campo(doc, M, yr, c4, "Eta'", a.eta);
    campo(doc, M + c4 + 10, yr, c4, "Nazionalita'", a.nazionalita);
    campo(doc, M + (c4 + 10) * 2, yr, c4, 'Altezza (cm)', a.altezza);
    campo(doc, M + (c4 + 10) * 3, yr, c4, 'Peso (kg)', a.peso);
    yr += 24;
    campo(doc, M, yr, COLONNA_GRANDE, 'Lingue conosciute', (a.lingue || []).join(', '));
    yr += 24;
    campo(doc, M, yr, c3, 'Capelli', a.capelli);
    campo(doc, M + c3 + 10, yr, c3, 'Occhi', a.occhi);
    campo(doc, M + (c3 + 10) * 2, yr, c3, 'Segni particolari', a.segniParticolari);
    yr += 24;
    campo(doc, M, yr, COLONNA_GRANDE, 'Abbigliamento', a.abbigliamento);
    yr += 24;

    doc.testo(M, yr, 'CARATTERE', { dimensione: 5.5, colore: GRIGIO, spaziatura: 0.6 });
    yr = doc.paragrafo(M, yr + 9, COLONNA_GRANDE, a.carattere || '—', { dimensione: 8, interlinea: 10, maxRighe: 3 });

    // --- caratteristiche ---
    yr = titoloSezione(doc, yr + 6, 'Caratteristiche');
    const passo = (COLONNA_GRANDE - 55) / 8;
    cat.stats.caratteristiche.forEach((c, i) => {
      riquadroStat(doc, M + i * passo, yr, c.key, stat[c.key] != null ? stat[c.key] : '—', c.nome);
    });
    yr += 54;

    // --- valori derivati e umanita' ---
    const bonus = bonusCostituzione(stat.COS || 0, cat.stats);
    const umanita = scheda.umanita || {};
    const larghezzaCol = (COLONNA_GRANDE - 20) / 3;
    let ya = yr, yb = yr, yc = yr;
    ya = rigaValore(doc, M, ya, larghezzaCol, 'Corsa (MOV x 3)', `${(stat.MOV || 0) * 3} m`);
    ya = rigaValore(doc, M, ya, larghezzaCol, 'Salto (Corsa / 4)', `${Math.floor(((stat.MOV || 0) * 3) / 4)} m`);
    ya = rigaValore(doc, M, ya, larghezzaCol, 'Peso sollevabile', `${(stat.COS || 0) * 40} kg`);

    const x2 = M + larghezzaCol + 10;
    yb = rigaValore(doc, x2, yb, larghezzaCol, 'Tiro salvezza', stat.COS || 0);
    yb = rigaValore(doc, x2, yb, larghezzaCol, 'Bonus resistenza', bonus.resistenza);
    yb = rigaValore(doc, x2, yb, larghezzaCol, 'Bonus danno', bonus.danno > 0 ? `+${bonus.danno}` : bonus.danno);

    const x3 = M + (larghezzaCol + 10) * 2;
    yc = rigaValore(doc, x3, yc, larghezzaCol, "Umanita'", `${umanita.attuale != null ? umanita.attuale : '—'} / ${umanita.iniziale != null ? umanita.iniziale : '—'}`);
    yc = rigaValore(doc, x3, yc, larghezzaCol, 'Reputazione', scheda.reputazione || 0);
    yc = rigaValore(doc, x3, yc, larghezzaCol, 'Punti incremento', scheda.puntiIncremento || 0);
    yr = Math.max(ya, yb, yc) + 4;

    // --- abilita' ---
    yr = titoloSezione(doc, yr, "Abilita'");
    const possedute = scheda.abilita || {};
    const perGruppo = [];
    for (const gruppo of cat.skills.gruppi) {
      const voci = gruppo.skills
        .filter((s) => (possedute[s.nome] || 0) > 0)
        .map((s) => ({ nome: s.nome, livello: possedute[s.nome] }));
      if (voci.length) perGruppo.push({ titolo: gruppo.nome, voci });
    }

    // Tre colonne riempite in verticale, come sulla scheda cartacea.
    const larghezzaAb = (COLONNA_GRANDE - 24) / 3;
    const righe = [];
    for (const g of perGruppo) {
      righe.push({ tipo: 'titolo', testo: g.titolo });
      for (const v of g.voci) righe.push({ tipo: 'voce', ...v });
    }
    const perColonna = Math.ceil(righe.length / 3) || 1;
    righe.forEach((riga, i) => {
      const colonna = Math.floor(i / perColonna);
      const x = M + colonna * (larghezzaAb + 12);
      const yy = yr + (i % perColonna) * 10.5;
      if (riga.tipo === 'titolo') {
        doc.testo(x, yy, riga.testo.toUpperCase(), {
          dimensione: 5.5, grassetto: true, colore: ACCENTO, spaziatura: 0.5,
        });
      } else {
        doc.testo(x, yy, riga.nome, { dimensione: 7 });
        doc.testo(x + larghezzaAb, yy, String(riga.livello), {
          dimensione: 7, grassetto: true, allineamento: 'destra',
        });
        doc.linea(x, yy + 2, x + larghezzaAb, yy + 2, { colore: [0.93, 0.93, 0.93], spessore: 0.3 });
      }
    });
    yr += perColonna * 10.5 + 8;

    // --- ferite e protezioni ---
    yr = titoloSezione(doc, yr, 'Ferite e stordimento');
    yr = tracciaFerite(doc, yr, (scheda.ferite && scheda.ferite.caselle) || 0, cat.stats) + 6;

    yr = titoloSezione(doc, yr, 'Protezioni');
    const loc = cat.stats.localizzazioni;
    const larghezzaLoc = COLONNA_GRANDE / loc.length;
    loc.forEach((l, i) => {
      const x = M + i * larghezzaLoc;
      doc.rettangolo(x, yr, larghezzaLoc - 4, 26, { bordo: GRIGIO, spessore: 0.5 });
      doc.testo(x + (larghezzaLoc - 4) / 2, yr + 8, `${l.parte} (${l.min === l.max ? l.min : `${l.min}-${l.max === 10 ? '0' : l.max}`})`, {
        dimensione: 5, allineamento: 'centro', colore: GRIGIO,
      });
      const vp = (scheda.armature || []).filter((ar) => new RegExp(l.parte.split(' ')[0], 'i').test(ar.copre || '') || /tutto il corpo/i.test(ar.copre || ''))
        .reduce((m, ar) => Math.max(m, ar.vp || 0), 0);
      doc.testo(x + (larghezzaLoc - 4) / 2, yr + 21, vp ? `VP ${vp}` : '—', {
        dimensione: 9, grassetto: true, allineamento: 'centro',
      });
    });
  }

  const FONDO_UTILE = 800;   // sotto questa quota si va a pagina nuova

  /**
   * Garantisce `necessario` punti di spazio verticale: se non ci stanno, apre
   * una pagina nuova e ci ridisegna sopra l'intestazione ridotta.
   * Serve alle schede modificate a mano, che possono avere decine di armi.
   */
  function assicuraSpazio(doc, y, necessario, scheda, cat) {
    if (y + necessario <= FONDO_UTILE) return y;
    doc.nuovaPagina();
    intestazioneRidotta(doc, scheda, cat);
    return 46;
  }

  function intestazioneRidotta(doc, scheda, cat) {
    const classe = (cat.roles.classi || []).find((c) => c.id === scheda.classe);
    doc.sfondo(BIANCO);
    doc.rettangolo(0, 0, doc.larghezza, 30, { riempimento: SCURO });
    doc.testo(M, 20, (scheda.anagrafica && scheda.anagrafica.nome) || 'Senza nome', {
      dimensione: 10, grassetto: true, colore: BIANCO, spaziatura: 1.5,
    });
    doc.testo(M + COLONNA_GRANDE, 20, classe ? classe.nome.toUpperCase() : '', {
      dimensione: 7, colore: ACCENTO, spaziatura: 2, allineamento: 'destra',
    });
  }

  // ------------------------------------------------------------- pagina 2 --

  function paginaDue(doc, scheda, cat) {
    intestazioneRidotta(doc, scheda, cat);
    let y = 46;

    // --- armi ---
    y = titoloSezione(doc, y, 'Armi');
    const colArmi = [
      { titolo: 'Arma', larghezza: 150 },
      { titolo: 'Tipo', larghezza: 34 },
      { titolo: 'Pr', larghezza: 24, allineamento: 'destra' },
      { titolo: 'Occ', larghezza: 26, allineamento: 'destra' },
      { titolo: 'Danni', larghezza: 92 },
      { titolo: 'Cl', larghezza: 26, allineamento: 'destra' },
      { titolo: 'Cd', larghezza: 26, allineamento: 'destra' },
      { titolo: 'Aff', larghezza: 28, allineamento: 'destra' },
      { titolo: 'm', larghezza: 30, allineamento: 'destra' },
      { titolo: 'E$', larghezza: 40, allineamento: 'destra' },
    ];
    y = intestazioneTabella(doc, y, colArmi) + 3;
    const armi = scheda.armi || [];
    if (!armi.length) {
      doc.testo(M + 4, y, 'Nessuna arma.', { dimensione: 7.5, colore: GRIGIO });
      y += 12;
    } else {
      armi.forEach((w, i) => {
        y = assicuraSpazio(doc, y, 11, scheda, cat);
        y = rigaTabella(doc, y, colArmi, [
          (w.inUso ? '\u2022 ' : '') + (w.nome || ''), w.tipo, w.precisione, w.occultabilita,
          w.danni, w.caricatore, w.cadenza, w.affidabilita, w.gittata, w.costo_eb,
        ], i % 2 === 1);
      });
      doc.testo(M + 4, y + 2, '\u2022 = arma in uso', { dimensione: 5.5, colore: GRIGIO });
      y += 10;
    }

    // --- armature ---
    y = assicuraSpazio(doc, y + 4, 46, scheda, cat);
    y = titoloSezione(doc, y, 'Armature');
    const armature = scheda.armature || [];
    if (!armature.length) {
      doc.testo(M + 4, y, 'Nessuna armatura.', { dimensione: 7.5, colore: GRIGIO });
      y += 12;
    } else {
      const colArm = [
        { titolo: 'Armatura', larghezza: 220 },
        { titolo: 'Copre', larghezza: 190 },
        { titolo: 'VP', larghezza: 45, allineamento: 'destra' },
        { titolo: 'Ingombro', larghezza: 60, allineamento: 'destra' },
      ];
      y = intestazioneTabella(doc, y, colArm) + 3;
      armature.forEach((ar, i) => {
        y = rigaTabella(doc, y, colArm, [ar.nome, ar.copre, ar.vp, ar.ingombro], i % 2 === 1);
      });
    }

    // --- cyberware ---
    y = assicuraSpazio(doc, y + 6, 46, scheda, cat);
    y = titoloSezione(doc, y, 'Cyberware');
    const cyber = scheda.cyberware || [];
    if (!cyber.length) {
      doc.testo(M + 4, y, "Nessun impianto: il personaggio e' ancora tutto carne.", {
        dimensione: 7.5, colore: GRIGIO,
      });
      y += 12;
    } else {
      const colCyber = [
        { titolo: 'Impianto', larghezza: 175 },
        { titolo: 'Categoria', larghezza: 110 },
        { titolo: 'PU', larghezza: 32, allineamento: 'destra' },
        { titolo: 'E$', larghezza: 45, allineamento: 'destra' },
        { titolo: 'Effetto', larghezza: 153 },
      ];
      y = intestazioneTabella(doc, y, colCyber) + 3;
      cyber.forEach((c, i) => {
        y = assicuraSpazio(doc, y, 11, scheda, cat);
        y = rigaTabella(doc, y, colCyber, [c.nome, c.categoria, c.pu, c.costo, c.desc], i % 2 === 1);
      });
      const puTotali = cyber.reduce((s, c) => s + (Number(c.pu) || 0), 0);
      doc.testo(M + COLONNA_GRANDE, y + 4, `Umanita' spesa in impianti: ${puTotali} punti`, {
        dimensione: 6.5, colore: GRIGIO, allineamento: 'destra',
      });
      y += 12;
    }

    // --- equipaggiamento e denaro ---
    y = assicuraSpazio(doc, y + 4, 60, scheda, cat);
    y = titoloSezione(doc, y, 'Equipaggiamento');
    const equip = scheda.equipaggiamento || [];
    const meta = COLONNA_GRANDE / 2 - 8;
    let ye = y;
    if (!equip.length) {
      doc.testo(M + 4, ye, 'Niente in tasca.', { dimensione: 7.5, colore: GRIGIO });
      ye += 12;
    } else {
      for (const e of equip) {
        ye = assicuraSpazio(doc, ye, 11, scheda, cat);
        doc.testo(M + 4, ye, `${e.quantita > 1 ? `${e.quantita}x ` : ''}${e.nome}`, { dimensione: 7.5 });
        if (e.note) {
          doc.testo(M + meta, ye, e.note, { dimensione: 6.5, colore: GRIGIO, allineamento: 'destra' });
        }
        doc.linea(M + 4, ye + 2.5, M + meta, ye + 2.5, { colore: [0.93, 0.93, 0.93], spessore: 0.3 });
        ye += 11;
      }
    }

    const denaro = scheda.denaro || {};
    const xd = M + COLONNA_GRANDE / 2 + 8;
    let yd = y;
    yd = rigaValore(doc, xd, yd, meta, 'Contanti', `${denaro.contanti || 0} E$`);
    yd = rigaValore(doc, xd, yd, meta, 'In banca', `${denaro.banca || 0} E$`);
    for (const v of scheda.veicoli || []) {
      yd = rigaValore(doc, xd, yd, meta, 'Veicolo', v.nome || String(v));
    }
    y = Math.max(ye, yd) + 4;

    // --- eventi del passato ---
    const eventi = scheda.eventi || [];
    if (eventi.length) {
      y = assicuraSpazio(doc, y, 46, scheda, cat);
      y = titoloSezione(doc, y, 'Eventi del passato');
      for (const e of eventi) {
        y = assicuraSpazio(doc, y, 11, scheda, cat);
        doc.testo(M + 4, y, `${e.anno} anni`, { dimensione: 7, grassetto: true, colore: ACCENTO });
        doc.testo(M + 52, y, e.dettaglio ? `${e.testo} — ${e.dettaglio}` : e.testo, { dimensione: 7.5 });
        y += 10.5;
      }
      y += 4;
    }

    // --- background ---
    const bg = scheda.background || {};
    y = assicuraSpazio(doc, y, 90, scheda, cat);
    y = titoloSezione(doc, y, 'Origini e motivazioni');
    const mot = bg.motivazioni || {};
    const fam = bg.famiglia || {};
    const orig = bg.origini || {};
    const colonna = (COLONNA_GRANDE - 16) / 2;
    let y1 = y, y2 = y;
    if (orig.etnia) y1 = rigaValore(doc, M, y1, colonna, 'Origini', orig.etnia);
    if (fam.rango) y1 = rigaValore(doc, M, y1, colonna, 'Famiglia', fam.rango);
    if (bg.infanzia) y1 = rigaValore(doc, M, y1, colonna, 'Infanzia', bg.infanzia);
    if (fam.tragedia) y1 = rigaValore(doc, M, y1, colonna, 'Tragedia', fam.tragedia);

    const x2 = M + colonna + 16;
    if (mot.personalita) y2 = rigaValore(doc, x2, y2, colonna, "Carattere", mot.personalita);
    if (mot.cosaContaDiPiu) y2 = rigaValore(doc, x2, y2, colonna, 'Cio che conta', mot.cosaContaDiPiu);
    if (mot.personaPiuCara) y2 = rigaValore(doc, x2, y2, colonna, 'Tiene di piu a', mot.personaPiuCara);
    if (mot.oggettoPiuPrezioso) y2 = rigaValore(doc, x2, y2, colonna, 'Oggetto piu caro', mot.oggettoPiuPrezioso);
    y = Math.max(y1, y2) + 4;

    if (bg.testo) {
      y = assicuraSpazio(doc, y, 80, scheda, cat);
      y = titoloSezione(doc, y, 'Storia');
      y = doc.paragrafo(M + 4, y, COLONNA_GRANDE - 8, bg.testo, { dimensione: 8, interlinea: 11 });
    }
    if (bg.obiettivo) {
      doc.rettangolo(M, y + 2, COLONNA_GRANDE, 22, { riempimento: FONDO_TENUE, bordo: GRIGIO_CHIARO });
      doc.testo(M + 6, y + 11, 'OBIETTIVO', { dimensione: 5.5, grassetto: true, colore: ACCENTO, spaziatura: 0.6 });
      doc.testo(M + 60, y + 12, bg.obiettivo, { dimensione: 8 });
      y += 28;
    }
    if (scheda.anagrafica && scheda.anagrafica.note) {
      y = titoloSezione(doc, y, 'Note');
      doc.paragrafo(M + 4, y, COLONNA_GRANDE - 8, scheda.anagrafica.note, { dimensione: 8, interlinea: 11 });
    }
  }

  // ---------------------------------------------------------------- entry --

  /**
   * @param {object} scheda    la scheda personaggio
   * @param {object} cataloghi { stats, roles, skills } caricati da /data/
   * @returns {Blob} il PDF pronto da scaricare
   */
  function genera(scheda, cataloghi) {
    // Il numero di pagine non e' noto finche' non si e' impaginato tutto (le
    // liste lunghe possono aprirne altre), e il piede di pagina lo deve
    // riportare. Si impagina due volte: la prima serve solo a contare.
    const conta = disegna(scheda, cataloghi, null);
    return disegna(scheda, cataloghi, conta.pagine).doc.blob();
  }

  function disegna(scheda, cataloghi, totalePagine) {
    const doc = global.MiniPDF.crea({ margine: M });
    const nome = (scheda.anagrafica && scheda.anagrafica.nome) || 'Senza nome';
    const piedi = [];

    paginaUno(doc, scheda, cataloghi);
    piedi.push(true);

    doc.nuovaPagina();
    const primaDelle2 = doc.numeroPagine();
    paginaDue(doc, scheda, cataloghi);
    for (let i = primaDelle2; i <= doc.numeroPagine(); i++) piedi.push(true);

    if (totalePagine != null) {
      for (let i = 1; i <= doc.numeroPagine(); i++) {
        doc.suPagina(i, () => pieDiPagina(doc, i, totalePagine, nome));
      }
    }
    return { doc, pagine: doc.numeroPagine() };
  }

  /** Nome file suggerito per il download. */
  function nomeFile(scheda, estensione) {
    const a = scheda.anagrafica || {};
    const base = [a.nome, a.soprannome].filter(Boolean).join(' - ') || 'personaggio';
    return `${base.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9 _-]/g, '').trim().replace(/\s+/g, '_')}.${estensione}`;
  }

  global.SchedaPDF = { genera, nomeFile };
})(typeof window !== 'undefined' ? window : globalThis);
