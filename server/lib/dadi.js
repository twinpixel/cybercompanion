/**
 * Dadi. Usati sia dalla generazione dei personaggi sia dal combattimento.
 *
 * `crypto.getRandomValues` invece di `Math.random`: i tiri sono il cuore
 * dell'applicazione, e un PRNG debole si nota — schede tutte uguali, colpi che
 * cadono sempre nello stesso punto.
 */

export function d(facce) {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return (buf[0] % facce) + 1;
}

export const d6 = () => d(6);
export const d10 = () => d(10);

/** Tira `quanti` dadi da `facce` e somma, con modificatore opzionale. */
export function tira(quanti, facce, mod = 0) {
  let tot = mod;
  for (let i = 0; i < quanti; i++) tot += d(facce);
  return tot;
}

/**
 * Il d10 di Cyberpunk 2020 e' aperto alle due estremita': con un 10 si ritira e
 * si somma, con un 1 si ritira e si sottrae. E' la regola che rende possibile
 * sia il colpo fortunato sia la papera, e senza di essa il combattimento
 * diventa prevedibile.
 *
 * Il numero di ritiri e' limitato: senza limite una sequenza sfortunata di 10
 * potrebbe non finire mai.
 */
export function d10Aperto(maxRitiri = 5) {
  const tiri = [];
  let totale = 0;
  let primo = d10();
  tiri.push(primo);
  totale = primo;

  if (primo === 10) {
    for (let i = 0; i < maxRitiri; i++) {
      const t = d10();
      tiri.push(t);
      totale += t;
      if (t !== 10) break;
    }
  } else if (primo === 1) {
    for (let i = 0; i < maxRitiri; i++) {
      const t = d10();
      tiri.push(t);
      totale -= t;
      if (t !== 10) break;
    }
  }
  return { totale, tiri, critico: primo === 10, papera: primo === 1 };
}

/**
 * Interpreta le notazioni di dado del manuale: "4D6+3", "1D6/2", "2d6+1".
 *
 * Il catalogo armi scrive i danni col calibro accanto — `"4D6+1 (12mmCL)"` — e
 * qualche voce ha anche del testo dopo, come `"1d6+2(4 VP*1/4)"`. La ricerca
 * non e' quindi ancorata alla fine: si prende la **prima** espressione di dado
 * del testo e si ignora il resto. Ancorandola, ogni arma del catalogo avrebbe
 * fatto zero danni.
 */
export function tiraNotazione(notazione) {
  const m = /(\d+)\s*[dD]\s*(\d+)\s*(?:([+-])\s*(\d+))?(?:\s*\/\s*(\d+))?/.exec(String(notazione || ''));
  if (!m) return { totale: 0, tiri: [], valida: false };

  const [, quanti, facce, segno, mod, divisore] = m;
  const tiri = [];
  let somma = 0;
  for (let i = 0; i < Number(quanti); i++) {
    const t = d(Number(facce));
    tiri.push(t);
    somma += t;
  }
  if (mod) somma += segno === '-' ? -Number(mod) : Number(mod);
  if (divisore) somma = Math.floor(somma / Number(divisore));
  return { totale: Math.max(0, somma), tiri, valida: true };
}

/** Mescola una copia dell'array. */
export function mescola(array) {
  const a = [...array];
  for (let i = a.length - 1; i > 0; i--) {
    const j = d(i + 1) - 1;
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pescaDa(array) {
  return array[d(array.length) - 1];
}
