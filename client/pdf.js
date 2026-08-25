/**
 * Generatore PDF minimale, senza dipendenze.
 *
 * Basta per una scheda personaggio: testo, righe, rettangoli e riquadri, con i
 * font base-14 gia' presenti in ogni lettore PDF (Helvetica e Courier). Non
 * serve incorporare font, quindi il file resta sotto i 30 KB e non c'e' nessuna
 * libreria da caricare da una CDN — cosa che il Worker bloccherebbe comunque.
 *
 * Tutto il documento viene costruito come stringa latin-1, un carattere per
 * byte: cosi' le posizioni nella tabella xref, che sono offset in byte,
 * coincidono con gli indici nella stringa.
 */
(function (global) {
  'use strict';

  const A4 = { larghezza: 595.28, altezza: 841.89 };

  // WinAnsiEncoding coincide con latin-1 tranne che nella fascia 0x80-0x9F,
  // dove stanno i caratteri tipografici che l'italiano usa di continuo.
  const WINANSI_EXTRA = {
    '€': 0x80, '‚': 0x82, 'ƒ': 0x83, '„': 0x84,
    '…': 0x85, '†': 0x86, '‡': 0x87, 'ˆ': 0x88,
    '‰': 0x89, 'Š': 0x8A, '‹': 0x8B, 'Œ': 0x8C,
    'Ž': 0x8E, '‘': 0x91, '’': 0x92, '“': 0x93,
    '”': 0x94, '•': 0x95, '–': 0x96, '—': 0x97,
    '˜': 0x98, '™': 0x99, 'š': 0x9A, '›': 0x9B,
    'œ': 0x9C, 'ž': 0x9E, 'Ÿ': 0x9F,
  };

  function inWinAnsi(testo) {
    let out = '';
    for (const ch of String(testo == null ? '' : testo)) {
      const code = ch.codePointAt(0);
      if (code >= 0x20 && code <= 0x7e) out += ch;
      else if (WINANSI_EXTRA[ch] != null) out += String.fromCharCode(WINANSI_EXTRA[ch]);
      else if (code >= 0xa0 && code <= 0xff) out += ch;
      else if (ch === '\t') out += '    ';
      else out += '?';   // fuori tabella: meglio un punto interrogativo di un byte rotto
    }
    return out;
  }

  const escapePdf = (s) => s.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');

  // Larghezze dei glifi Helvetica in millesimi di em. Servono per allineare a
  // destra, centrare e mandare a capo: senza, ogni testo andrebbe a occhio.
  const W_HELVETICA = [
    278,278,355,556,556,889,667,191,333,333,389,584,278,333,278,278,
    556,556,556,556,556,556,556,556,556,556,278,278,584,584,584,556,
    1015,667,667,722,722,667,611,778,722,278,500,667,556,833,722,778,
    667,778,722,667,611,722,667,944,667,667,611,278,278,278,469,556,
    333,556,556,500,556,556,278,556,556,222,222,500,222,833,556,556,
    556,556,333,500,278,556,500,722,500,500,500,334,260,334,584,
  ];
  const W_HELVETICA_BOLD = [
    278,333,474,556,556,889,722,238,333,333,389,584,278,333,278,278,
    556,556,556,556,556,556,556,556,556,556,333,333,584,584,584,611,
    975,722,722,722,722,667,611,778,722,278,556,722,611,833,722,778,
    667,778,722,667,611,722,667,944,667,667,611,333,278,333,584,556,
    333,556,611,556,611,556,333,611,611,278,278,556,278,889,611,611,
    611,611,389,556,333,611,556,778,556,556,500,389,280,389,584,
  ];

  function larghezzaCarattere(code, grassetto) {
    const tabella = grassetto ? W_HELVETICA_BOLD : W_HELVETICA;
    if (code >= 0x20 && code <= 0x7e) return tabella[code - 0x20];
    // Le lettere accentate hanno la larghezza della lettera base.
    if (code >= 0xc0) {
      const base = 'AAAAAAACEEEEIIIIDNOOOOO*OUUUUYTsaaaaaaaceeeeiiiidnooooo/ouuuuyty';
      const ch = base[code - 0xc0];
      if (ch && ch !== '*' && ch !== '/') return larghezzaCarattere(ch.charCodeAt(0), grassetto);
    }
    return grassetto ? 556 : 500;
  }

  function larghezzaTesto(testo, dimensione, grassetto) {
    let mille = 0;
    const s = inWinAnsi(testo);
    for (let i = 0; i < s.length; i++) mille += larghezzaCarattere(s.charCodeAt(i), grassetto);
    return (mille / 1000) * dimensione;
  }

  /** Manda a capo il testo entro `larghezza`, spezzando sugli spazi. */
  function spezza(testo, larghezza, dimensione, grassetto) {
    const righe = [];
    for (const paragrafo of String(testo || '').split('\n')) {
      let riga = '';
      for (const parola of paragrafo.split(/\s+/).filter(Boolean)) {
        const prova = riga ? `${riga} ${parola}` : parola;
        if (larghezzaTesto(prova, dimensione, grassetto) <= larghezza) {
          riga = prova;
        } else {
          if (riga) righe.push(riga);
          riga = parola;
        }
      }
      righe.push(riga);
    }
    return righe;
  }

  function creaDocumento(opzioni) {
    const o = opzioni || {};
    const pagine = [];
    let corrente = null;

    const doc = {
      larghezza: A4.larghezza,
      altezza: A4.altezza,
      margine: o.margine != null ? o.margine : 34,

      nuovaPagina() {
        corrente = { ops: [] };
        pagine.push(corrente);
        return doc;
      },

      /** Sfondo pieno della pagina corrente. */
      sfondo(colore) {
        doc.rettangolo(0, 0, A4.larghezza, A4.altezza, { riempimento: colore });
        return doc;
      },

      /**
       * Scrive testo. `y` e' misurato dall'alto, come ci si aspetta scrivendo
       * un layout; internamente viene convertito nel sistema del PDF, che ha
       * l'origine in basso a sinistra.
       */
      testo(x, y, contenuto, opz) {
        const p = opz || {};
        const dim = p.dimensione || 9;
        const grassetto = !!p.grassetto;
        const font = p.monospazio ? 'F3' : (grassetto ? 'F2' : 'F1');
        const s = escapePdf(inWinAnsi(contenuto));
        if (!s) return doc;

        // La spaziatura fra i caratteri allarga il testo, e va contata nella
        // larghezza: senza, un testo allineato a destra viene disegnato piu' a
        // destra di dove dovrebbe finire, tanto piu' quanto e' lungo.
        const spaziatura = p.spaziatura || 0;
        const larghezza = larghezzaTesto(contenuto, dim, grassetto)
          + spaziatura * inWinAnsi(contenuto).length;

        let px = x;
        if (p.allineamento === 'destra') px = x - larghezza;
        else if (p.allineamento === 'centro') px = x - larghezza / 2;

        const c = p.colore || [0, 0, 0];
        // `Tc` va sempre dichiarato, anche a zero: nel PDF fa parte dello stato
        // grafico e sopravvive alla fine del blocco di testo. Ometterlo faceva
        // ereditare la spaziatura dell'ultimo titolo a tutto cio' che veniva
        // dopo, che percio' veniva disegnato piu' largo di quanto misurato.
        corrente.ops.push(
          `BT /${font} ${dim} Tf ${c[0]} ${c[1]} ${c[2]} rg` +
          ` ${spaziatura} Tc` +
          ` 1 0 0 1 ${px.toFixed(2)} ${(A4.altezza - y).toFixed(2)} Tm (${s}) Tj ET`
        );
        return doc;
      },

      /** Testo su piu' righe. Restituisce la `y` raggiunta. */
      paragrafo(x, y, larghezza, contenuto, opz) {
        const p = opz || {};
        const dim = p.dimensione || 9;
        const interlinea = p.interlinea || dim * 1.35;
        let cy = y;
        for (const riga of spezza(contenuto, larghezza, dim, !!p.grassetto)) {
          if (p.maxRighe && cy > y + p.maxRighe * interlinea) break;
          doc.testo(x, cy, riga, p);
          cy += interlinea;
        }
        return cy;
      },

      linea(x1, y1, x2, y2, opz) {
        const p = opz || {};
        const c = p.colore || [0, 0, 0];
        corrente.ops.push(
          `${c[0]} ${c[1]} ${c[2]} RG ${(p.spessore || 0.5).toFixed(2)} w ` +
          `${x1.toFixed(2)} ${(A4.altezza - y1).toFixed(2)} m ${x2.toFixed(2)} ${(A4.altezza - y2).toFixed(2)} l S`
        );
        return doc;
      },

      rettangolo(x, y, larghezza, altezza, opz) {
        const p = opz || {};
        const rect = `${x.toFixed(2)} ${(A4.altezza - y - altezza).toFixed(2)} ${larghezza.toFixed(2)} ${altezza.toFixed(2)} re`;
        if (p.riempimento) {
          const f = p.riempimento;
          corrente.ops.push(`${f[0]} ${f[1]} ${f[2]} rg ${rect} f`);
        }
        if (p.bordo) {
          const b = p.bordo;
          corrente.ops.push(`${b[0]} ${b[1]} ${b[2]} RG ${(p.spessore || 0.5).toFixed(2)} w ${rect} S`);
        }
        return doc;
      },

      larghezzaTesto,
      spezza,

      numeroPagine() { return pagine.length; },

      /** Torna a disegnare su una pagina gia' chiusa (indice da 1). */
      suPagina(indice, disegna) {
        const precedente = corrente;
        corrente = pagine[indice - 1];
        try { disegna(); } finally { corrente = precedente; }
        return doc;
      },

      /** Serializza il documento. Restituisce un Blob application/pdf. */
      blob() {
        const oggetti = [];
        const aggiungi = (corpo) => { oggetti.push(corpo); return oggetti.length; };

        const idPagine = 2;
        aggiungi(`<< /Type /Catalog /Pages ${idPagine} 0 R >>`);   // 1
        aggiungi('');                                              // 2, riempito dopo

        const idFont = [];
        for (const base of ['Helvetica', 'Helvetica-Bold', 'Courier']) {
          idFont.push(aggiungi(`<< /Type /Font /Subtype /Type1 /BaseFont /${base} /Encoding /WinAnsiEncoding >>`));
        }
        const risorse =
          `<< /Font << /F1 ${idFont[0]} 0 R /F2 ${idFont[1]} 0 R /F3 ${idFont[2]} 0 R >> >>`;

        const idPagina = [];
        for (const pagina of pagine) {
          const flusso = pagina.ops.join('\n');
          const idContenuto = aggiungi(`<< /Length ${flusso.length} >>\nstream\n${flusso}\nendstream`);
          idPagina.push(aggiungi(
            `<< /Type /Page /Parent ${idPagine} 0 R /MediaBox [0 0 ${A4.larghezza} ${A4.altezza}] ` +
            `/Resources ${risorse} /Contents ${idContenuto} 0 R >>`
          ));
        }
        oggetti[idPagine - 1] =
          `<< /Type /Pages /Kids [${idPagina.map((i) => `${i} 0 R`).join(' ')}] /Count ${idPagina.length} >>`;

        let pdf = '%PDF-1.4\n';
        const offset = [];
        oggetti.forEach((corpo, i) => {
          offset.push(pdf.length);
          pdf += `${i + 1} 0 obj\n${corpo}\nendobj\n`;
        });

        const inizioXref = pdf.length;
        pdf += `xref\n0 ${oggetti.length + 1}\n0000000000 65535 f \n`;
        for (const off of offset) pdf += `${String(off).padStart(10, '0')} 00000 n \n`;
        pdf += `trailer\n<< /Size ${oggetti.length + 1} /Root 1 0 R >>\nstartxref\n${inizioXref}\n%%EOF`;

        // Ogni carattere della stringa e' un byte: gli offset di xref tornano.
        const byte = new Uint8Array(pdf.length);
        for (let i = 0; i < pdf.length; i++) byte[i] = pdf.charCodeAt(i) & 0xff;
        return new Blob([byte], { type: 'application/pdf' });
      },
    };

    return doc.nuovaPagina();
  }

  global.MiniPDF = { crea: creaDocumento, A4, larghezzaTesto, spezza };
})(typeof window !== 'undefined' ? window : globalThis);
