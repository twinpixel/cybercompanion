# Caratteristiche, valori derivati e ferite

Fonte: `Cyberpunk 2020 - Cyberscheda.pdf` (scheda ufficiale italiana) e
`Cyberpunk 2020 - Tabelle riassuntive.pdf`.

## Le 9 caratteristiche

La scheda italiana usa sigle proprie, diverse da quelle inglesi. L'app usa
**queste**, perche' sono quelle stampate sulla scheda.

| Sigla | Nome | Inglese | Cosa misura |
|---|---|---|---|
| INT | Intelligenza | INT | Ragionare, ricordare, risolvere problemi |
| RIF | Riflessi | REF | Velocita' di reazione e coordinazione. La piu' importante in combattimento |
| TEC | Tecnologia | TECH | Abilita' manuale nel costruire, riparare, manomettere |
| FRE | Freddezza | COOL | Autocontrollo sotto pressione, resistenza allo stordimento |
| FAS | Fascino | ATTR | Aspetto fisico e capacita' di farsi notare |
| FOR | Fortuna | LUCK | Punti spendibili sui tiri, si ricaricano a ogni sessione |
| MOV | Movimento | MA | Quanto si e' veloci a spostarsi |
| COS | Costituzione | BODY | Robustezza fisica: danni assorbiti e peso sollevato |
| EMP | Empatia | EMP | Contatto con gli altri. Cala installando cyberware |

Valori: **da 2 a 10** in creazione. Oltre 10 solo con cyberware o bioingegneria.

## Generazione

Due metodi, entrambi supportati dall'app:

- **Casuale**: 9d10, un dado per caratteristica, nell'ordine in cui si tirano.
- **A punti**: un totale da distribuire liberamente rispettando il vincolo 2-10.

| Tipo di personaggio | Punti totali |
|---|---|
| Sfigato | 45 |
| Nella media | 50 |
| Capace | 60 |
| Eroico | 70 |
| Leggendario | 80 |

L'app usa **60 punti** come default: e' il livello a cui il regolamento colloca
un personaggio giocante competente.

## Valori derivati

Non si scelgono: si calcolano.

| Valore | Formula | Unita' |
|---|---|---|
| Corsa | MOV x 3 | m per turno |
| Salto | Corsa / 4 | m |
| Peso sollevabile | COS x 40 | kg |
| Peso trasportabile | COS x 10 | kg |
| Umanita' | EMP x 10 | punti, scende col cyberware |
| Tiro salvezza | COS | si tira d10 sotto o pari |
| Bonus resistenza | tabella COS | si sottrae ai danni subiti |
| Bonus danno | tabella COS | si somma ai danni in corpo a corpo |
| Reputazione | assegnata dal Master | livelli |

### Tabella del bonus di Costituzione

| COS | Bonus resistenza | Bonus danno |
|---|---|---|
| 2 | 0 | -2 |
| 3-4 | -1 | -1 |
| 5-7 | -2 | 0 |
| 8-9 | -3 | +1 |
| 10 | -4 | +2 |
| **11+** | **-5** | **+3** |

> **Contraddizione risolta.** Le tabelle riassuntive italiane si fermano a COS 10,
> ma il cyberware (Muscoli innestati, Reticolo di muscoli e ossa) porta
> regolarmente la Costituzione sopra 10, e l'edizione inglese prevede la fascia
> "Superhuman" a -5. La riga `11+` e' stata aggiunta estendendo la progressione;
> il bonus danno `+3` segue lo stesso passo delle righe precedenti.

## Umanita' ed Empatia

Ogni pezzo di cyberware costa **Punti Umanita' (PU)**, tirati sui dadi indicati.

```
EMP attuale = parte intera di (Umanita' attuale / 10)
```

Quando l'Umanita' scende sotto 0 il personaggio va in **cyberpsicosi** e passa
sotto il controllo del Master. Sotto 20 punti e' obbligatoria una terapia.

## Ferite e stordimento

La traccia danni ha **10 gradi da 4 caselle ciascuno**, per 40 caselle totali.

| Grado | Caselle | Stordimento |
|---|---|---|
| Lieve | 4 | 0 |
| Grave | 4 | 1 |
| Critica | 4 | 2 |
| Mortale 0 | 4 | 3 |
| Mortale 1 | 4 | 4 |
| Mortale 2 | 4 | 5 |
| Mortale 3 | 4 | 6 |
| Mortale 4 | 4 | 7 |
| Mortale 5 | 4 | 8 |
| Mortale 6 | 4 | 9 |

### Effetti

| Grado | Effetto |
|---|---|
| Lieve | Nessuno |
| Grave | -2 a RIF |
| Critica | RIF, INT e FRE dimezzate |
| Mortale (qualsiasi) | RIF, INT e FRE ridotte a 1/3 |

Al raggiungimento di un grado Mortale si tira **Salvezza**: d10 contro COS, sotto
o pari si resta vivi. Il tiro di **stordimento** e' d10 contro FRE meno il valore
di stordimento del grado raggiunto.

> **Contraddizione risolta.** La Cyberscheda riporta in un riquadro
> `PUNTI VITA (COSx4)`, che con COS media 5-7 darebbe 20-28 punti — incompatibile
> con la traccia da 40 caselle stampata sulla stessa pagina, e con i gradi di
> ferita che vi si appoggiano. E' una regola della casa di quella scheda.
> **L'app usa la traccia standard da 40 caselle** e non calcola `COS x 4`.

## Localizzazione dei colpi

Si tira 1d10.

| 1d10 | Parte del corpo |
|---|---|
| 1 | Testa |
| 2-4 | Tronco |
| 5 | Braccio destro |
| 6 | Braccio sinistro |
| 7-8 | Gamba destra |
| 9-0 | Gamba sinistra |

Ogni parte ha il proprio valore di protezione (VP) dell'armatura indossata.
I danni alla testa vanno **moltiplicati per 2** dopo l'armatura.
