import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

/**
 * Il generatore PDF.
 *
 * client/pdf.js e' pensato per il browser: si appoggia a `globalThis` e non
 * esporta niente. Qui viene eseguito in una sandbox e interrogato sul flusso di
 * contenuto che produce, che e' l'unico modo di verificare cose che a occhio si
 * notano solo stampando.
 */

const RADICE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let MiniPDF;
before(async () => {
  const sorgente = await fs.readFile(path.join(RADICE, 'client/pdf.js'), 'utf8');
  const sandbox = { Blob, Uint8Array, Math, JSON, console };
  sandbox.globalThis = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(sorgente, sandbox);
  MiniPDF = sandbox.MiniPDF;
});

/** Il flusso di contenuto della prima pagina, in chiaro. */
async function flusso(disegna) {
  const doc = MiniPDF.crea();
  disegna(doc);
  const testo = await doc.blob().text();
  return testo;
}

describe('generatore PDF', () => {
  test('produce un PDF con intestazione e xref', async () => {
    const pdf = await flusso((doc) => doc.testo(50, 50, 'Prova'));
    assert.match(pdf, /^%PDF-1\.4/);
    assert.match(pdf, /startxref/);
    assert.match(pdf, /%%EOF\s*$/);
  });

  test('ogni testo dichiara la propria spaziatura, anche quando e\' zero', async () => {
    // `Tc` sopravvive alla fine del blocco BT/ET: e' stato grafico, non un
    // attributo del testo. Ometterlo faceva ereditare a tutto il documento la
    // spaziatura dell'ultimo titolo scritto — testo piu' largo del previsto e
    // allineamenti a destra che sbordavano dal margine.
    const pdf = await flusso((doc) => {
      doc.testo(50, 50, 'TITOLO', { spaziatura: 0.6 });
      doc.testo(50, 70, 'normale');
    });
    const blocchi = pdf.match(/BT [^]*?ET/g);
    assert.equal(blocchi.length, 2);
    assert.match(blocchi[0], /0\.6 Tc/);
    assert.match(blocchi[1], /(^| )0 Tc/, 'il secondo testo deve riportare la spaziatura a zero');
  });

  test('l\'allineamento a destra tiene conto della spaziatura', async () => {
    const senza = MiniPDF.crea();
    const stretto = MiniPDF.larghezzaTesto('Personaggio', 8, false);

    const pdf = await flusso((doc) => {
      doc.testo(300, 50, 'Personaggio', { dimensione: 8, allineamento: 'destra' });
      doc.testo(300, 70, 'Personaggio', { dimensione: 8, allineamento: 'destra', spaziatura: 1 });
    });
    const x = [...pdf.matchAll(/1 0 0 1 ([\d.]+) [\d.]+ Tm/g)].map((m) => Number(m[1]));
    assert.equal(x.length, 2);
    assert.ok(Math.abs(x[0] - (300 - stretto)) < 0.05, 'senza spaziatura parte a destra meno la larghezza');
    // Con 1 punto di spaziatura per carattere, "Personaggio" (11 lettere)
    // occupa 11 punti in piu' e deve percio' partire 11 punti piu' a sinistra.
    assert.ok(Math.abs(x[1] - (x[0] - 11)) < 0.05, `atteso ${x[0] - 11}, trovato ${x[1]}`);
    assert.ok(senza);
  });

  test('l\'allineamento a destra non sfora mai il punto dato', async () => {
    const dim = 7.5;
    const valori = [
      'Ispanoamericana',
      'Hanno perso tutto e sono finiti in strada',
      'Nella media, in un quartiere in decadenza',
      'Un capo di abbigliamento',
    ];
    const margine = 500;
    const pdf = await flusso((doc) => {
      doc.testo(50, 30, 'SEZIONE', { dimensione: 5.5, grassetto: true, spaziatura: 0.6 });
      valori.forEach((v, i) => {
        doc.testo(margine, 50 + i * 11, v, { dimensione: dim, grassetto: true, allineamento: 'destra' });
      });
    });
    const x = [...pdf.matchAll(/1 0 0 1 ([\d.]+) [\d.]+ Tm/g)].map((m) => Number(m[1])).slice(1);
    valori.forEach((v, i) => {
      const fine = x[i] + MiniPDF.larghezzaTesto(v, dim, true);
      assert.ok(fine <= margine + 0.05, `"${v}" finisce a ${fine.toFixed(1)}, oltre il margine ${margine}`);
    });
  });

  test('i caratteri fuori da WinAnsi non fanno saltare il conto', async () => {
    // Il PDF usa la codifica WinAnsi: i caratteri che non ci stanno vengono
    // sostituiti, e la larghezza deve restare quella del sostituto.
    const l = MiniPDF.larghezzaTesto('perche’ è', 8, false);
    assert.ok(Number.isFinite(l) && l > 0);
  });

  test('spezza il testo dentro la larghezza data', () => {
    const righe = MiniPDF.spezza(
      'Una riga lunga abbastanza da doversi spezzare in almeno tre pezzi distinti', 80, 8, false
    );
    assert.ok(righe.length >= 3);
    for (const r of righe) {
      assert.ok(MiniPDF.larghezzaTesto(r, 8, false) <= 80.5, `"${r}" e' piu' larga del consentito`);
    }
  });
});
