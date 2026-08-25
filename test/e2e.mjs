/**
 * Prova end-to-end dell'app: login, hub, lanciadadi, scheda, combattimento,
 * console dei programmi e sessione di netrun a due dispositivi.
 *
 * Non fa parte del deploy: playwright non e' fra le dipendenze, cosi' `npm ci`
 * in CI resta veloce. Per eseguirlo:
 *
 *   npm install --no-save playwright
 *   npm run db:migrate:local          # una volta sola
 *   npm run cf:dev                    # in un altro terminale
 *   APP_PASSWORD=<quella in .dev.vars> node test/e2e.mjs
 *
 * Nota sul D1 locale: miniflare tiene un database separato per ogni
 * `database_id`. Se cambi quel valore in wrangler.toml, rilancia
 * `npm run db:migrate:local`, altrimenti la tabella `characters` non esiste.
 */
import { chromium } from 'playwright';
import fs from 'fs';

const SC = process.env.SC || '.';
const B = process.env.BASE_URL || 'http://127.0.0.1:8787';
const PASSWORD = process.env.APP_PASSWORD || 'nightcity';
// CHROMIUM_PATH serve solo dove il browser non e' quello scaricato da
// playwright (per esempio in un container che lo ha gia' preinstallato).
const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
);
const ctx = await browser.newContext({ viewport: { width: 1180, height: 900 }, acceptDownloads: true });
const page = await ctx.newPage();

const errori = [];
// Il primo passo sbaglia la password apposta: il 401 che ne segue e' atteso e
// non va contato fra gli errori di console.
const atteso = (m) => /\/api\/login/.test(m.location()?.url || '') && /401/.test(m.text());
page.on('console', (m) => { if (m.type() === 'error' && !atteso(m)) errori.push(m.text()); });
page.on('pageerror', (e) => errori.push(`pageerror: ${e.message}`));

const passo = async (nome, fn) => {
  try { await fn(); console.log(`  ok   ${nome}`); }
  catch (e) { console.log(`  FAIL ${nome}: ${e.message}`); throw e; }
};

await page.goto(B, { waitUntil: 'networkidle' });

await passo('la schermata di login compare', async () => {
  await page.waitForSelector('.login-scatola', { timeout: 5000 });
});
await page.screenshot({ path: `${SC}/screenshot-01-login.png` });

await passo('password sbagliata mostra errore', async () => {
  await page.fill('#campo-password', 'sbagliata');
  await page.click('button[type=submit]');
  await page.waitForSelector('.toast.visibile.errore', { timeout: 5000 });
});

await passo('password giusta porta all\'hub', async () => {
  await page.fill('#campo-password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForSelector('.aree', { timeout: 8000 });
  const aree = await page.locator('.area').count();
  if (aree !== 4) throw new Error(`attese 4 aree nell'hub, trovate ${aree}`);
});
await page.screenshot({ path: `${SC}/screenshot-02-hub.png` });

await passo('il lanciadadi c\'e\' e tira', async () => {
  await page.click('.btn-dadi');
  await page.waitForSelector('.dadi', { timeout: 5000 });
  await page.click('.pillole .pillola:has-text("D6")');
  await page.click('.dadi button.btn-primario');
  const totale = await page.textContent('.dadi-totale');
  const n = Number(totale);
  if (!Number.isFinite(n) || n < 1 || n > 6) throw new Error(`1D6 fuori scala: ${totale}`);
  if (!(await page.locator('.dadi-riga').count())) throw new Error('il tiro non e\' finito nello storico');
  await page.click('.modale-azioni button');
});

await passo('i personaggi pronti si mettono in archivio', async () => {
  await page.click('.area:has(.n:text-is("Schede"))');
  await page.waitForSelector('button:has-text("Personaggi pronti")', { timeout: 8000 });
  await page.click('button:has-text("Personaggi pronti")');
  await page.waitForSelector('.pronto', { timeout: 8000 });
  const quanti = await page.locator('.pronto').count();
  if (quanti !== 12) throw new Error(`attesi 12 personaggi pronti, trovati ${quanti}`);

  await page.locator('.pronto:has-text("Ada Ferraro") button:has-text("Metti in archivio")').click();
  await page.waitForSelector('.pronto:has-text("Ada Ferraro") button:has-text("In archivio")', { timeout: 10000 });
  await page.screenshot({ path: `${SC}/screenshot-16-pronti.png`, fullPage: true });
  await page.goBack();
  await page.waitForSelector('.scheda-riga:has-text("Ada Ferraro")', { timeout: 8000 });
  await page.goBack();
  await page.waitForSelector('.aree', { timeout: 8000 });
});

await passo('si entra nelle schede', async () => {
  await page.click('.area:has(.n:text-is("Schede"))');
  await page.waitForSelector('.titolo-vista', { timeout: 8000 });
  const t = await page.textContent('.titolo-vista');
  if (!/Schede/i.test(t)) throw new Error(`titolo inatteso: ${t}`);
});
await page.screenshot({ path: `${SC}/screenshot-03-lista-vuota.png` });

await passo('la vista di generazione si apre con le 10 classi', async () => {
  await page.click('text=Genera personaggio');
  await page.waitForSelector('.classe-scelta', { timeout: 5000 });
  const n = await page.locator('.classe-carta').count();
  if (n !== 11) throw new Error(`attese 11 carte (10 classi + "a caso"), trovate ${n}`);
});
await page.screenshot({ path: `${SC}/screenshot-04-genera.png`, fullPage: true });

await passo('genera un Solitario', async () => {
  await page.click('.classe-carta:has-text("Solitario")');
  await page.click('.pillola:has-text("Eroico")');
  await page.fill('#gen-eta', '29');
  await page.fill('#gen-richiesta', 'una ex guardia del corpo corporativa in fuga');
  await page.click('button:has-text("Genera")');
  await page.waitForSelector('.pannello', { timeout: 30000 });
});
await page.screenshot({ path: `${SC}/screenshot-05-editor.png`, fullPage: true });

await passo("l'editor mostra le 9 caratteristiche e i valori derivati", async () => {
  const celle = await page.locator('.stat-cella').count();
  if (celle !== 9) throw new Error(`attese 9 caratteristiche, trovate ${celle}`);
  const der = await page.locator('#blocco-derivate .derivata').count();
  if (der < 8) throw new Error(`valori derivati insufficienti: ${der}`);
});

await passo('compilo il nome e la barra si aggiorna', async () => {
  const nome = page.locator('.pannello-corpo input').first();
  await nome.fill('Ilaria Bonetti');
  await page.waitForFunction(() => document.getElementById('barra-titolo').textContent === 'Ilaria Bonetti', null, { timeout: 3000 });
});

await passo("il pannello abilita' mostra il budget e le abilita' di classe", async () => {
  await page.click('summary:has-text("Abilita")');
  await page.waitForSelector('#budget-abilita', { timeout: 5000 });
  const budget = await page.textContent('#budget-abilita');
  if (!/Punti di classe: \d+ \/ \d+/.test(budget)) throw new Error(`budget non calcolato: ${budget}`);
  const diClasse = await page.locator('.abilita-riga.di-classe').count();
  if (diClasse < 10) throw new Error(`abilita' di classe attese >=10, trovate ${diClasse}`);
});
await page.screenshot({ path: `${SC}/screenshot-06-abilita.png`, fullPage: true });

await passo("aumentare un'abilita' aggiorna il budget", async () => {
  const prima = await page.textContent('#budget-abilita');
  await page.locator('.abilita-riga.di-classe').first().locator('button[aria-label^="Aggiungi"]').click();
  const dopo = await page.textContent('#budget-abilita');
  if (prima === dopo) throw new Error('il budget non e\' cambiato');
});

await passo('il selettore armi cerca nel catalogo da 660', async () => {
  await page.click('summary:has-text("Armi")');
  await page.click('button:has-text("Aggiungi arma")');
  await page.waitForSelector('.modale', { timeout: 5000 });
  await page.fill('.modale input[type=text]', 'predator');
  await page.waitForSelector('.modale .abilita-riga:has-text("Predator")', { timeout: 5000 });
  await page.locator('.modale .abilita-riga:has-text("Predator")').first().locator('button').click();
  await page.click('.modale-azioni button');
});

await passo('installare cyberware toglie Umanita', async () => {
  await page.click('summary:has-text("Cyberware")');
  const prima = await page.textContent('.pannello:has(summary:has-text("Cyberware")) .budget');
  await page.click('button:has-text("Installa impianto")');
  await page.waitForSelector('.modale', { timeout: 5000 });
  await page.fill('.modale input[type=text]', 'tatuaggio');
  await page.locator('.modale .abilita-riga').first().locator('button:has-text("Installa")').click();
  await page.click('.modale-azioni button');
  const dopo = await page.textContent('.pannello:has(summary:has-text("Cyberware")) .budget');
  if (prima === dopo) throw new Error("l'Umanita' non e' cambiata");
});

await passo('le ferite si segnano cliccando', async () => {
  await page.click('summary:has-text("Ferite")');
  await page.waitForSelector('.casella', { timeout: 5000 });
  await page.locator('.casella').nth(5).click();
  const piene = await page.locator('.casella.piena').count();
  if (piene !== 6) throw new Error(`attese 6 caselle piene, trovate ${piene}`);
  await page.waitForSelector('.ferite-effetto:not([hidden])', { timeout: 3000 });
});
await page.screenshot({ path: `${SC}/screenshot-07-ferite.png`, fullPage: true });

await passo('salva la scheda su D1', async () => {
  await page.click('#btn-salva');
  await page.waitForFunction(() => document.getElementById('btn-salva').textContent === 'Salvato', null, { timeout: 10000 });
  if (!(await page.locator('#btn-salva').isDisabled())) throw new Error('il bottone dovrebbe restare disabilitato dopo il salvataggio');
});

await passo('esporta il PDF', async () => {
  await page.click('button:has-text("⋯")');
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 15000 }),
    page.click('button:has-text("Esporta PDF")'),
  ]);
  await dl.saveAs(`${SC}/screenshot-export.pdf`);
  const dim = fs.statSync(`${SC}/screenshot-export.pdf`).size;
  if (dim < 5000) throw new Error(`PDF troppo piccolo: ${dim} byte`);
  console.log(`       PDF: ${(dim / 1024).toFixed(1)} KB, nome "${dl.suggestedFilename()}"`);
});

await passo('esporta il JSON', async () => {
  await page.click('button:has-text("⋯")');
  const [dl] = await Promise.all([
    page.waitForEvent('download', { timeout: 10000 }),
    page.click('button:has-text("Esporta JSON")'),
  ]);
  await dl.saveAs(`${SC}/screenshot-export.json`);
  const j = JSON.parse(fs.readFileSync(`${SC}/screenshot-export.json`, 'utf8'));
  if (j.anagrafica.nome !== 'Ilaria Bonetti') throw new Error('nome non corrispondente nel JSON');
});

await passo('tornando indietro la scheda compare in lista', async () => {
  await page.goBack();
  await page.waitForSelector('.scheda-riga', { timeout: 8000 });
  const testo = await page.textContent('.scheda-riga');
  if (!testo.includes('Ilaria Bonetti')) throw new Error(`riga inattesa: ${testo}`);
});
await page.screenshot({ path: `${SC}/screenshot-08-lista-piena.png` });

await passo('riaprendo la scheda i dati sono quelli salvati', async () => {
  await page.locator('.scheda-riga').first().click();
  await page.waitForSelector('.stat-cella', { timeout: 8000 });
  await page.click('summary:has-text("Ferite")');
  await page.waitForSelector('.casella', { timeout: 5000 });
  const piene = await page.locator('.casella.piena').count();
  if (piene !== 6) throw new Error(`ferite non persistite: ${piene}`);
});


// ==================================================== combattimento =========

await passo('dall\'hub si apre il combattimento', async () => {
  await page.goBack();                       // dalla scheda all'elenco
  await page.goBack();                       // dall'elenco all'hub
  await page.waitForSelector('.aree', { timeout: 8000 });
  await page.click('.area:has(.n:text-is("Combattimento"))');
  await page.waitForSelector('button:has-text("Nuovo scontro")', { timeout: 8000 });
});

await passo('si schierano il personaggio salvato e due teppisti', async () => {
  await page.click('button:has-text("Nuovo scontro")');
  await page.waitForSelector('.abilita-riga input[type=checkbox]', { timeout: 8000 });
  await page.locator('.abilita-riga input[type=checkbox]').first().check();

  await page.click('button:has-text("Avversario nuovo")');
  await page.waitForSelector('.modale', { timeout: 5000 });
  await page.locator('.modale .campo input[type=text]').first().fill('Boostergang');
  await page.locator('.modale .campo:has(label:text-is("Quanti")) input').fill('2');
  await page.click('.modale button:has-text("Aggiungi arma")');
  await page.waitForSelector('.modale input[placeholder="Cerca…"]', { timeout: 5000 });
  await page.fill('.modale input[placeholder="Cerca…"]', 'predator');
  await page.locator('.modale .abilita-riga:has-text("Predator")').first().locator('button').click();
  await page.waitForSelector('.modale:has-text("Avversario")', { timeout: 5000 });
  await page.click('.modale-azioni button:has-text("Metti in campo")');
  await page.waitForSelector('.abilita-riga:has-text("Boostergang")', { timeout: 5000 });
});
await page.screenshot({ path: `${SC}/screenshot-09-schieramento.png`, fullPage: true });

await passo('lo scontro si apre con l\'iniziativa gia\' tirata', async () => {
  await page.click('button:has-text("Apri lo scontro")');
  await page.waitForSelector('.combattente', { timeout: 10000 });
  const n = await page.locator('.combattente').count();
  if (n !== 3) throw new Error(`attesi 3 combattenti, trovati ${n}`);
  if (!(await page.locator('.combattente.turno').count())) throw new Error('nessuno e\' di turno');
  const testa = await page.textContent('.pillole');
  if (!/Round 1/.test(testa)) throw new Error(`round inatteso: ${testa}`);
});
await page.screenshot({ path: `${SC}/screenshot-10-scontro.png`, fullPage: true });

await passo('un turno svolto a mano finisce nel diario', async () => {
  const prima = await page.locator('.diario-voce').count();
  await page.click('.azione button:has-text("Svolgi il turno")');
  await page.waitForFunction(
    (n) => document.querySelectorAll('.diario-voce').length > n, prima, { timeout: 10000 }
  );
});

await passo('l\'azione a caso decide da sola', async () => {
  const prima = await page.locator('.diario-voce').count();
  await page.click('.azione button:has-text("Azione a caso")');
  await page.waitForFunction(
    (n) => document.querySelectorAll('.diario-voce').length > n, prima, { timeout: 10000 }
  );
  if (!(await page.locator('.diario-voce .auto').count())) throw new Error('la voce automatica non e\' segnata');
});

await passo('la proposta riempie il pannello senza tirare', async () => {
  const prima = await page.locator('.diario-voce').count();
  await page.click('.azione button:has-text("Proponi")');
  await page.waitForSelector('.toast.visibile:not(.errore)', { timeout: 8000 });
  const dopo = await page.locator('.diario-voce').count();
  if (dopo !== prima) throw new Error('la proposta ha svolto il turno invece di proporlo');
});

await passo('la distanza si cambia dalla barra di stato', async () => {
  await page.click('.pillola:has-text("Distanza")');
  await page.waitForSelector('.modale', { timeout: 5000 });
  await page.fill('.modale input[type=number]', '30');
  await page.click('.modale-azioni button:has-text("Aggiorna")');
  await page.waitForSelector('.pillola:has-text("Distanza 30 m")', { timeout: 8000 });
});

await passo('chiudere lo scontro riporta le ferite sulla scheda', async () => {
  await page.click('#barra-dx button:has-text("⋯")');
  await page.click('.modale button:has-text("Chiudi lo scontro")');
  await page.waitForSelector('.modale:has-text("Chiudere lo scontro")', { timeout: 8000 });
  await page.click('.modale-azioni button:has-text("Chiudi e scrivi")');
  await page.waitForSelector('.pillole:has-text("Chiuso")', { timeout: 8000 });
});
await page.screenshot({ path: `${SC}/screenshot-11-scontro-chiuso.png`, fullPage: true });

// ====================================================== programmi ===========

await passo('la console dei programmi calcola difficolta\' e prezzo', async () => {
  await page.goBack();                       // all'elenco degli scontri
  await page.goBack();                       // all'hub
  await page.waitForSelector('.aree', { timeout: 8000 });
  await page.click('.area:has(.n:text-is("Programmi"))');
  await page.waitForSelector('button:has-text("Nuovo programma")', { timeout: 8000 });
  await page.click('button:has-text("Nuovo programma")');
  await page.waitForSelector('.conti', { timeout: 8000 });

  await page.locator('.campo:has(label:text-is("Nome del programma")) input').fill('Sesamo');
  await page.click('.scelta:has-text("Intrusione") .corpo');
  await page.waitForFunction(() => {
    const v = document.querySelector('.conto .v');
    return v && Number(v.textContent) >= 15;
  }, null, { timeout: 8000 });

  const difficolta = Number(await page.locator('.conto .v').first().textContent());
  // Intrusione 15 + Forza 5 + icona semplice 1 = 21.
  if (difficolta !== 21) throw new Error(`difficolta' attesa 21, calcolata ${difficolta}`);
});
await page.screenshot({ path: `${SC}/screenshot-12-programma.png`, fullPage: true });

await passo('il tiro di scrittura tira davvero', async () => {
  await page.click('button:has-text("Tiro di scrittura")');
  await page.waitForSelector('.modale', { timeout: 5000 });
  await page.click('.modale-azioni button:has-text("Tira")');
  await page.waitForSelector('.modale .dadi-totale', { timeout: 8000 });
  await page.click('.modale-azioni button:has-text("Chiudi")');
});

await passo('il programma si salva in libreria', async () => {
  await page.click('#barra-dx button:has-text("Salva")');
  await page.waitForSelector('.toast.visibile:not(.errore)', { timeout: 8000 });
  await page.goBack();
  await page.waitForSelector('.scheda-riga:has-text("Sesamo")', { timeout: 8000 });
});

// ========================================================= netrun ===========

let codiceSessione = null;

await passo('la libreria del manuale si apre e si copia', async () => {
  // Si e' nell'elenco dei programmi: il passo precedente ci e' tornato sopra.
  await page.waitForSelector('button:has-text("Libreria del manuale")', { timeout: 8000 });
  await page.click('button:has-text("Libreria del manuale")');
  await page.waitForSelector('.pronto', { timeout: 10000 });

  const quanti = await page.locator('.pronto').count();
  if (quanti !== 62) throw new Error(`attesi 62 programmi del manuale, trovati ${quanti}`);

  await page.fill('input[placeholder^="Cerca per nome"]', 'hellhound');
  await page.waitForFunction(() => document.querySelectorAll('.pronto').length <= 3, null, { timeout: 5000 });

  await page.fill('input[placeholder^="Cerca per nome"]', 'crusher');
  await page.waitForSelector('.pronto:has-text("Crusher")', { timeout: 5000 });
  await page.locator('.pronto:has-text("Crusher") button:has-text("Copia in libreria")').click();
  await page.waitForSelector('.pronto:has-text("Crusher") button:has-text("Copiato")', { timeout: 10000 });
  await page.screenshot({ path: `${SC}/screenshot-17-libreria.png`, fullPage: true });
  await page.goBack();
  await page.waitForSelector('.scheda-riga:has-text("Crusher")', { timeout: 8000 });
});

await passo('il Master allestisce un sistema e apre la sessione', async () => {
  await page.goBack();                       // all'hub
  await page.waitForSelector('.aree', { timeout: 8000 });
  codiceSessione = null;
  await page.click('.area:has(.n:text-is("Netrun"))');
  await page.waitForSelector('button:has-text("Allestisci un sistema")', { timeout: 8000 });
  await page.click('button:has-text("Allestisci un sistema")');
  await page.waitForSelector('.pannello', { timeout: 8000 });

  codiceSessione = await page.locator('.campo:has(label:text-is("Codice della sessione")) input').inputValue();
  if (!/^[A-Z0-9]{6}$/.test(codiceSessione)) throw new Error(`codice inatteso: ${codiceSessione}`);

  // Un sistema gia' allestito: nodi, Mura e programmi di guardia in un colpo.
  await page.click('button:has-text("Parti da un sistema pronto")');
  await page.waitForSelector('.modale .pronto', { timeout: 8000 });
  const sistemi = await page.locator('.modale .pronto').count();
  if (sistemi !== 10) throw new Error(`attesi 10 sistemi pronti, trovati ${sistemi}`);
  await page.locator('.modale .pronto:has-text("Distretto NCPD") button:has-text("Usa questo")').click();
  await page.waitForSelector('.pannello:has-text("Centrale")', { timeout: 8000 });
  const difese = await page.locator('.abilita-riga:has-text("dal manuale")').count();
  if (difese !== 4) throw new Error(`il distretto NCPD ha 4 difese, trovate ${difese}`);

  await page.click('button:has-text("Dai tuoi programmi")');
  await page.waitForSelector('.modale .abilita-riga:has-text("Sesamo")', { timeout: 8000 });
  await page.locator('.modale .abilita-riga:has-text("Sesamo")').first().locator('button').click();
  await page.waitForSelector('.modale:has-text("Su quale nodo")', { timeout: 5000 });
  await page.locator('.modale .abilita-riga').first().locator('button').click();
  await page.waitForSelector('.abilita-riga:has-text("Sesamo")', { timeout: 5000 });

  await page.click('button:has-text("Apri la sessione")');
  await page.waitForSelector('.nodo', { timeout: 10000 });
  if (!(await page.locator('.avviso:has-text("non e")').count())) {
    throw new Error('la sessione dovrebbe essere in attesa del netrunner');
  }
});
await page.screenshot({ path: `${SC}/screenshot-13-netrun-master.png`, fullPage: true });

await passo('il netrunner entra dal proprio dispositivo', async () => {
  const ctx2 = await browser.newContext({ viewport: { width: 900, height: 900 } });
  const runner = await ctx2.newPage();
  runner.on('pageerror', (e) => errori.push(`pageerror (netrunner): ${e.message}`));
  await runner.goto(B, { waitUntil: 'networkidle' });
  await runner.fill('#campo-password', PASSWORD);
  await runner.click('button[type=submit]');
  await runner.waitForSelector('.aree', { timeout: 8000 });
  await runner.click('.area:has(.n:text-is("Netrun"))');
  await runner.click('button:has-text("Entra come netrunner")');
  await runner.waitForSelector('.campo:has(label:text-is("Codice della sessione"))', { timeout: 8000 });
  await runner.locator('.campo:has(label:text-is("Codice della sessione")) input').fill(codiceSessione);
  await runner.locator('.campo:has(label:text-is("Come ti chiami nel Net")) input').fill('Spettro');

  await runner.click('button:has-text("Dai tuoi programmi")');
  await runner.waitForSelector('.modale .abilita-riga:has-text("Sesamo")', { timeout: 8000 });
  await runner.locator('.modale .abilita-riga:has-text("Sesamo")').first().locator('button').click();

  await runner.click('button:has-text("Collegati")');
  await runner.waitForSelector('.nodo', { timeout: 10000 });
  await runner.screenshot({ path: `${SC}/screenshot-14-netrun-runner.png`, fullPage: true });

  // Il netrunner apre il turno: esegue il proprio programma sulle Mura.
  await runner.click('.azione button:has-text("Esegui il programma")');
  await runner.waitForSelector('.toast.visibile:not(.errore)', { timeout: 10000 });
  const diario = await runner.textContent('.diario');
  if (!/Sesamo/.test(diario)) throw new Error(`il diario non racconta l'esecuzione: ${diario}`);

  // E il Master lo vede comparire senza toccare niente: il tavolo si rilegge.
  await page.waitForSelector('.diario-voce:has-text("Spettro")', { timeout: 15000 });
  await page.screenshot({ path: `${SC}/screenshot-15-netrun-master-2.png`, fullPage: true });

  // Tocca al sistema: il Master risponde.
  await page.waitForSelector('.azione button:has-text("Colpisci")', { timeout: 15000 });
  await page.click('.azione button:has-text("Colpisci")');
  await page.waitForSelector('.toast.visibile:not(.errore)', { timeout: 10000 });
  await ctx2.close();
});

console.log('\nerrori di console:', errori.length ? '\n  ' + errori.join('\n  ') : 'nessuno');
await browser.close();
if (errori.length) process.exit(1);
