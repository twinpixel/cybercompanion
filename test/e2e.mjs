/**
 * Prova end-to-end dell'app, dal login al riaprire una scheda salvata.
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
page.on('console', (m) => { if (m.type() === 'error') errori.push(m.text()); });
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

await passo('password giusta porta alla lista', async () => {
  await page.fill('#campo-password', PASSWORD);
  await page.click('button[type=submit]');
  await page.waitForSelector('.titolo-vista', { timeout: 8000 });
  const t = await page.textContent('.titolo-vista');
  if (!/Schede/i.test(t)) throw new Error(`titolo inatteso: ${t}`);
});
await page.screenshot({ path: `${SC}/screenshot-02-lista-vuota.png` });

await passo('la vista di generazione si apre con le 10 classi', async () => {
  await page.click('text=Genera personaggio');
  await page.waitForSelector('.classe-scelta', { timeout: 5000 });
  const n = await page.locator('.classe-carta').count();
  if (n !== 11) throw new Error(`attese 11 carte (10 classi + "a caso"), trovate ${n}`);
});
await page.screenshot({ path: `${SC}/screenshot-03-genera.png`, fullPage: true });

await passo('genera un Solitario', async () => {
  await page.click('.classe-carta:has-text("Solitario")');
  await page.click('.pillola:has-text("Eroico")');
  await page.fill('#gen-eta', '29');
  await page.fill('#gen-richiesta', 'una ex guardia del corpo corporativa in fuga');
  await page.click('button:has-text("Genera")');
  await page.waitForSelector('.pannello', { timeout: 30000 });
});
await page.screenshot({ path: `${SC}/screenshot-04-editor.png`, fullPage: true });

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
await page.screenshot({ path: `${SC}/screenshot-05-abilita.png`, fullPage: true });

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
await page.screenshot({ path: `${SC}/screenshot-06-ferite.png`, fullPage: true });

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
await page.screenshot({ path: `${SC}/screenshot-07-lista-piena.png` });

await passo('riaprendo la scheda i dati sono quelli salvati', async () => {
  await page.locator('.scheda-riga').first().click();
  await page.waitForSelector('.stat-cella', { timeout: 8000 });
  await page.click('summary:has-text("Ferite")');
  await page.waitForSelector('.casella', { timeout: 5000 });
  const piene = await page.locator('.casella.piena').count();
  if (piene !== 6) throw new Error(`ferite non persistite: ${piene}`);
});

console.log('\nerrori di console:', errori.length ? '\n  ' + errori.join('\n  ') : 'nessuno');
await browser.close();
