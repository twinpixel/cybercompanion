# Armi

Fonte: `Cyberpunk 2020 - Lista Armi.pdf` — compendio amatoriale che raccoglie le
armi del manuale base e dei supplementi. **660 armi** estratte
automaticamente dal PDF.

La legenda delle colonne e' in
[04-tabelle-di-gioco.md](04-tabelle-di-gioco.md#legenda-delle-colonne-delle-armi).

Gli stessi dati in forma leggibile dal codice:
[`server/data/weapons.json`](../../server/data/weapons.json).

> **Nota sulla qualita' dei dati.** L'estrazione e' automatica e il sorgente ha
> refusi propri: qualche costo riporta caratteri spuri (`600?`, `1050S`), alcune
> armi compaiono due volte come varianti dello stesso modello, un paio di nomi
> sono troncati. I valori di gioco — danni, caricatore, cadenza, gittata — sono
> affidabili.

## Indice

- [PISTOLE](#pistole) — 236 armi
- [FUCILI](#fucili) — 120 armi
- [MITRA](#mitra) — 88 armi
- [SHOTGUN](#shotgun) — 44 armi
- [ARMI PESANTI](#armi-pesanti) — 43 armi
- [LANCIAGRANATE](#lanciagranate) — 5 armi
- [LANCIAMISSILI](#lanciamissili) — 2 armi
- [MM-POD](#mm-pod) — 4 armi
- [LANCIARAZZI](#lanciarazzi) — 1 armi
- [LANCIAFIAMME](#lanciafiamme) — 3 armi
- [ARMI ESOTICHE](#armi-esotiche) — 12 armi
- [ARMI BIANCHE](#armi-bianche) — 102 armi

---

## PISTOLE

| Nome | Tipo | PR | OC | RE | Danni | CL | CD | AF | m | E$ | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| "Challenger" | PST | 0/1 | P/J | P | 1D6+1 (6mmCL) | 8 | 1 | MA | 50 | 300 | Pistola compatta fatta per l’uso nello spazio, e nelle colonie lunari e marziane. Anche a canna lunga Stein & Wasserman |
| "Cheesemaker" | PST | -2 | L | P | 3D6 (20G) | 5 | 1 | ST | 50 | 325 | Per competere con il Militech Cruscher. Vende meglio a causa del prezzo più basso |
| "Fafnir" | PST | 3 | L | R | 5D6AP (.577bMc) | 5 | 1 | MA | 50 | 2320 | Grande, come la sua figura mitologica, spara il potente .577 boomer magnum Norse Technologies |
| "Heimdall" | PST | 2 | L | P | 4D6+3 (.44cbM CL) | 6 | 1 | MA | 50 | 1850 | Identica al Fafnair, con poche differenze stilistiche e diverso calibro Norse Technologies |
| "Mjolnir" | PST | -3 | L/J | P | 8D6 (10mm c) | 4 | 1 | MA | 50 | 1460 | Usata dagli investigatori C -swat, scomponibile in tre piccole parti, per ricomporla 1 round |
| "Scythe" | PST | -2 | L | R | 4D10 (.50C) | 3 | 1 | MA | 50 | 895 | A canna corta, con poca precisione, ma utile contro i cyborgs Stein & Wasserman Bipower PST 0/1 J/ L P 4D6 (.44Mag) 2D6+2 (.45 ACP) 6/2 2/2 IN 50 850 |
| 11mm | PST | 2 | J | P | 3D6 (11mmCL) | 6 | 2 | MA | 50 | 2000 | Venduto con un pacco speciale con gadgets della Glock Company |
| 454 Casull Classic | PST | 2 | J | P | 4D6+3 (.454) | 5 | 1 | MA | 50 | 682 | Popolare per molti nomadi e cacciatori |
| 454 Magnum Disposable | PST | -2 | P | R | 4D6+3 (.454) | 2 | 1 | MA | 40 | 100 |  |
| ACP 22 | PST | -1 | J | E | 1D6+2 (6mm) | 10 | 2 | ST | 50 | 450 | Arma da difesa personale |
| Ameritech Magnum | PST | 1 | J | R | 4D6+3 (.454) | 5 | 2 | MA | 50 | 1000 |  |
| Arasaka "Armitage" | PST | 2 | J | P | 6D6 (14mm) | 5 | 1 | MA | 50 | 560 | Più piccolo del Misa e più potente. Quello che le donne chiedevano, comodo ed occultabile |
| Arasaka "Big Game" | PST | 1 | L | P | 4D6+3 (.454) | 7 | 1 | MA | 50 | 750 | Con mirino laser e grilletto rapido. Disegnata per le squadre d’elite corporative per operazioni nere |
| Arasaka "Briareos" | PST | -2 | L | P | 6D6+2 (7.62mm c) | 4 | 1 | MA | 50 | 1150 | Molto grande per COS>=14. Uno dei più grandi revolver |
| Arasaka "Budo" | PST | 1 | J | P | 4D6+1 (12mmCL) | 8 | 1 | MA | 50 | 580 | Con mirino laser. Preferita dalla Yakuza |
| Arasaka "Coyote" | PST | 1 | P | C | 3D6 (11mmCL) | 10 | 1 | MA | 50 | 580 | Grandi vendite per l’Arasaka, design a pelle di coyote |
| Arasaka "Daisho" | PST | 2/3 | J/N | P | 6D6 (14mmCL) | 10 | 1 | MA | 50 | 1150 | Prende il nome dalle spade samurai e giapponesi, con manico e suppresser per quando vuoi raggiungere e colpire! |
| Arasaka "Master" | PST | 2 | J | C | 4D6+1 (12mmCL) | 12 | 1 | MA | 50 | 650 | Potente e precisa. Non adatta ai principianti |
| Arasaka "Midnighter" | PST | 2 | J | C | 4D6+2 (12mm) | 12 | 1 | MA | 50 | 620 | Con flashlight removibile e mirino laser. Nuova Arasaka nel campo delle pista grosso calibro |
| Arasaka "Misa" | PST | 1 | L | P | 4D6+1 (12mm) | 6 | 1 | MA | 50 | 620 | Piccola, ideale per donne operative, da nascondere nella borsetta. Usata anche dai maschi |
| Arasaka "Muramasa" | PST | -2 | L | P | 8D6 (10mmCL) | 5 | 1 | MA | 50 | 1850 | La risposta Arasaka al Mjolnir, molto pesante e dal rinculo alto. Usta nei circoli C-swat |
| Arasaka "Otomo" | PST | 1 | J | E | 3D6 (11mmCL) | 12 | 1 | MA | 50 | 380 | Arma normale con buona prec. e capacità di colpi |
| Arasaka "Oyabun" | PST | -1 | J | P | 6D6 (14mmCL) | 10 | 1 | MA | 50 | 1850 | Pistola potente, disegnata espressamente per distruggere cyborg |
| Arasaka "Sensei" | PST | 2 | J | C | 4D6+1 (12mm) | 12 | 1 | MA | 50 | 650 | E’ la versione cased della Master. Con silenziatore e flashlight ad infrarossi |
| Arasaka "Urban" | PST | 2 | J | P | 4D6+2 (12mm) | 10 | / | MA | 50 | 780 | La più popolare pistola Arasaka. Con mirino laser e molded grip. Vincitore degli Awards del 2020 come pistola dell’anno |
| Arasaka AG-15 | PST | 1 | J | P | 1D6+2 (9mmBolt) | 10 | 1 | MA | 30 | 440 | Risposta Arasaka all’ Hammer M-11 |
| Arasaka Leh-451 | PST | 2 | J | C | 4D6+2 (.44Mag) | 6 | 1 | MA | 50 | 645 | Per competere con il CA Police Revolver (accetta stesse munizioni). Leggera, usata dalla polizia, specialmente quella di Night City Arasaka P-237 PST MTR 2 J C 4D6+2 (12mm) 12 1/10 MA 50 530 Con mirino laser integrato, comoda, ma con molto rinculo |
| Arasaka R-209 | PST | 2 | L | C | 2D6+1 (9mm) | 25 | 1/3 | MA | 50 | 645 | Molto grossa, ma con tanti colpi e alta raffica |
| Arasaka WSA | PST | 0 | J | C | 2D6+3 (10mm) | 15 | 2 | MA | 50 | 400 | Guardie Arasaka |
| Ares Light Fire 70 | PST | -1 | P | P | 2D6+1 (9mmCL) | 16 | 2 | ST | 50 | 350 | Pistola da 1kg con silenziatore (200 E$) leggero |
| Ares Predator II | PST | 0 | J | P | 4D6+1 (12mmCL) | 15 | 1 | MA | 50 | 550 | La migliore amica dell’uomo |
| Armalite 44 | PST | 0 | J | E | 4D6+1 (12mm) | 8 | 1 | ST | 50 | 450 | Progettata per le gare d’appalto d’armi dell’U.S Army del 1998 |
| Armalite Centaur | PST | 2 | J | P | 1d6+2(4 VP*1/4) | 20 | 1 | MA | 50 | 585 | Per competere con l’MA Silvergun. Usata dall’USAF, a flechette |
| Armalite Centaur | PST | 2 | J | P | 4D6 (.44Mag) | 20 | 1 | MA | 50 | 485 | Con mirino laser, popolare tra i detective, con contro peso montabile per la canna |
| Astra Style 6 | PST | -1 | P | E | 1D6 (5mm) | 6 | 2 | IN | 50 | 75 | Avante P-1135 ad Aghi PST EXO 0 P P Droga 15 2 ST 40 200 Molto leggera, in polimeri, può essere alimentata anche con gas, veleni, etc. |
| Avalon | PST | 0 | J | P | 4D6+3 (12mm) | 12 | 2 | MA | 100 | 650 | In fibra ultraleggera, anche con calcio modificato Constitution Arms MA Varie 5 1 MA 50 525 |
| Barretta "Combat" | PST | 2 | J | C | 4D6+1 (12mm) | 10 | 1 | MA | 50 | 685 | Per forze militari e di polizia, precisa e con un bel stile |
| Beretta model 101 T | PST | 1 | P | P | 2D6+1 (9mmCL) | 10/12 | 2 | MA | 50 | 350 | Preferita dal personale corporativo con mirino laser (150 E$) |
| Beretta model 110 T | PST | 2 | J | P | 2D6+1 (9mmCL) | 16/19 | 2 | MA | 50 | 950 | Con mirino laser |
| Berretta 8000 Cougar | PST | 1 | J | S | 2D6+1 (9mm) | 15 | 2 | MA | 50 | 636 |  |
| Berretta 8000 Cougar | PST | 1 | J | S | 2D6+2 (.45 ACP) | 8 | 2 | MA | 50 | 636 |  |
| Berretta 8000 Cougar | PST | 1 | J | S | 2D6+3 (.40 S&W) | 11 | 2 | MA | 50 | 636 |  |
| Berretta 92 Combat | PST | 2 | J | S | 2D6+1 (9mm) | 15 | 2 | MA | 50 | 1050S | Con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Berretta 92 FS | PST | 1 | J | S | 2D6+1 (9mm) | 15 | 2 | MA | 50 | 626 |  |
| Berretta 96 | PST | 1 | J | S | 2D6+3 (.40 S&W) | 10 | 2 | ST | 50 | 643 |  |
| Berretta 96 Centurion | PST | 0 | J | S | 2D6+3 (.40 S&W) | 10 | 2 | ST | 50 | 643 |  |
| Berretta M97P | PST | 2 | J | P | 2D6+1 (9mm) | 18 | 2 | MA | 50 | 480 |  |
| Blaster Pistol | PST | 1 | J | R | 1D10 (energia) | 1 | 1 | ST | 50 | 2000 | Ricaricabile, ad energia. Può buttare giù porte e spingere bottoni 2D6+3 (.40S&W) 13/ 2 ST 50 606 |
| Browning Ultra Power | PST | 1 | J | P | 3D6 (11mmCL) | 10/12 | 3 | ST | 50 | 775 | Veloce, con mirino laser |
| Budget Arms Auto 3 | PST | -1 | J | E | 3D6 (11mm) | 8 | 2 | IN | 50 | 350 | Costa poco, potente, e qualche volta spara |
| Budget arms C-13 | PST | -1 | P | E | 1D6 (5mm) | 8 | 2 | ST | 50 | 75 | Per difesa personale, da borsetta |
| Budget Arms C-41 | PST | 1 | J | E | 2D6+1 (.41C) | 10 | 3 | MA | 50 | 600 |  |
| BudgetArms LiserNiner | PST | 1 | J/L | P | 2D6+1 (9mm) | 15/35 | 3/20 | ST | 50 | 675 | Con mirino laser |
| Buster | PST | 1/-1 | L/J | P | 5D6@ (.477 ) | 4 | 1 | MA | 50 | 450 | Militech 9110 11mm |
| C.O.P. 357 Derringer | PST | 1 | J | S/C | 2D6+3 (.357Mag) | 2 | 1 | ST | 50 | 257 | Arma da difesa personale per gli agenti di pubblica sicurezza |
| C.O.P..44 | PST | -1 | P | C | 4D6 (.44Mag) | 4 | 1 | ST | 50 | 175 | Invisibile ai metal detectors dell’aeroporto, con canna intercambiabile (a calibro .22) |
| Castech "Colt Navy" | PST | 1 | J | P | 4D6+1 (12mmCL) | 6 | 2 | MA | 50 | 550 | Pistola a doppio colpo, non usa caricatori veloci, in quanto i colpi sono inseriti n el cilindro |
| CCMMC Goax. Xiuxi CM-3 | PST | 0 | J | C | 1D6 (5mm) | 8 | 2 | ST | 50 | 75 | Cina |
| Ceska vz/120 | PST | 1 | J | P | 2D6+1 (9mmCL) | 18 | 2 | MA | 50 | 350 | Usata nell’est-Europa, la migliore pistola importata dall’ Ares americano Claridge Hi-Tek Model X&X-2 PST MTR 2 J C 2D6+3 (10mm) 16/30 1/10 MA 50 420/ Con riduzione al rinculo, richiesta COS robusta per tenerlo continuamente in mano |
| Chief | PST | 0 | J | P | 4D6+3 (.454) | 5 | 1 | MA | 50 | 375 | Per nomadi, classica pistola da cowboy e cacciatori |
| Colt .45 “Peacemaker” | PST | 0 | J | S/R | 2D6+2 (.45C) | 6 | 1 | IN | 50 | 1213/1 | La pistola del West, usata fin dal 1800 Colt 10mm Compact "New |
| Colt "Borg Dropper" | PST | -1 | J | R | 5D6 (5.56mm) | 8 | 1 | MA | 50 | 950 | Accett a anche i caricatori dell’M-16,la poca precisione è dovuta alla canna corta |
| Colt "Cannon" | PST | 2 | L | C | 5D6 (.525M.ex.c) | 5 | 2 | MA | 50 | 760 | Disegnato in origine per la caccia, ma efficace contro cyborg e armature pesanti. Con contro peso per canna, mirino laser e telescopico |
| Colt "Clydesdale" | PST | 1 | J | C | 4D6+1 (12mm) | 14 | 2 | MA | 50 | 630 | Versione potenziata e mifìgliorata esteticamente del classico M191LA1 |
| Colt "Handout" | PST | -1 | J | E | 2D6+2 (9mmCL) | 12 | 1 | ST | 50 | 125 | Molto economica, si consiglia sostituire il mirino perché scadente suppresser e mirino laser |
| Colt "Moose" | PST | -2 | L | R | 5D6 (5.56mm) | 4 | 1 | ST | 50 | 785 | Una delle più larghe armi al mondo. Disegnata per gare da caccia. molto rara |
| Colt 1911A1 e 1991A1 | PST | 1 | J | S | 2D6+2 (.45 ACP) | 7 | 2 | ST | 50 | 538 |  |
| Colt 2011 Automatic Pistol | PST | 1 | J | C | 2D6+2 (.45 ACP) | 12 | 2 | MA | 50 | 400 | Per il centenario dell’antica Colt 1911, ha mantenuto lo stesso design e può avere tutti gli equipaggiamenti |
| Colt 380 Government | PST | 0 | P | S | 2D6+1 (9mm) | 7 | 2 | ST | 50 | 462 |  |
| Colt Alpha-Omega | PST | 2 | J | C | 2D6+2 (.45ACP) | 10 | 2 | MA | 50 | 500 | Pistola semiautomatica sia da 2D6+3 (10mm) .45ACCP che da 10mm |
| Colt American L36 | PST | 1 | J | P | 2D6+3 (10mmCL) | 9/11 | 2 | MA | 50 | 350 | Dal design e stile unici |
| Colt AMT 2000 | PST | 0 | J | C | 4D6+1 (12mm) | 8 | 1 | MA | 50 | 500 | Usata durante le guerre centro americane, usata dall’U.S. Army |
| Colt Anaconda | PST | 1/2 | J/L | S | 4D6 (.44Mag) | 6 | 1 | MA | 50 | 612 | Revolver |
| Colt Delta Elite | PST | 1 | J | S | 2D6+3 (10mm) | 8 | 2 | ST | 50 | 807 |  |
| Colt Detective .38 DS II | PST | 0 | P | S/C | 1D6+2 (.38 C) | 6 | 1 | MA | 50 | 400 | Per molti anni l’arma più usata dalla polizia, ancora molte in circolazione |
| Colt Detective II | PST | -1 | P | C | 2D6+3 (.357Mag) | 5 | 2 | ST | 50 | 325 | Pistola a doppio colpo, piccola ed occultabile, spesso usata come pistola di riserva |
| Colt Enforcement 10 | PST | 1 | J | C | 2D6+3 (10mm) | 14 | 2 | MA | 50 | 550+ |  |
| Colt Government | PST | 1 | J | S | 2D6+2 (.45 ACP) | 8 | 2 | ST | 50 | 735 |  |
| Colt Manhunter | PST | 2 | J | P | 3D6 (11mmCL) | 16 | 2 | MA | 50 | 600 | In tutte le condizioni ambientali Colt Python .357 Mag. PST -1 /1 /2 P/J/L S 2D6+3 (.357Mag) 6 1 MA 50 815 Revolver |
| Colt Rascal | PST | 1 | J | P | 2D6+3 (10mm) | 12/30 | 1/3 | MA | 50 | 380 | Versione riuscita e potenziata del fallito Colt Scamp |
| Colt Serpent | PST | 0 | J | C | 4D6 (.44Mag) | 6 | 2 | ST | 50 | 550 | Pistola a doppio colpo, raffica vicina ad un semiautomatico |
| Colt Venom | PST | 0 | J | C | 2D6 (.38) | 6 | 2 | MA | 50 | 450 | Revolver a doppio colpo, leggero, usata dai corporativi |
| Colt Vermin Derringer | PST | 2 | P | P | 3D6 (11mmCL) | 2 | 2 | MA | 20 | 225 | Dallo stile vecchio più di 150 anni ma potente, a doppia canna |
| Combat Magnum | PST | 1 | J | P | 3D6 (11mm) | 14 | 3 | MA | 50 | 1100 | Usato come arma di scorta venduto insieme al mirino laser |
| Connery LP Avenger | PST | 0 | J | P | 1D6+6 (10mm) | 12 | 2 | MA | 50 | 450 | Per polizia e investigatori, da difesa |
| Connery MP Pendragon | PST | 0 | J | P | 3D6+3 (11mm) | 12 | 2 | MA | 80 | 550 | Più potente e ingombrante della LP Connery RP Sword of |
| Constitutional Arms "Stub" | PST | -1 | P | E | 4D6+1 (12mmCL) | 6 | 1 | MA | 50 | 375 | Piccola e brutta. Arma da backup perfetta 2D6+3 (.40S&W) 15/ 2 ST 50 539 |
| Dai Lung "Han" | PST | 0 | J | P | 2D6+3 (10mm) | 8 | 1 | ST | 50 | 225 | Popolare tra contrabbandieri asiatici, pirati, banditi |
| Dai Lung "Poorman" | PST | 1 | J | E | 2D6+1 (9mm) | 10/30 | 1/3 | ST | 50 | 176 | Venduto tra le forze del terzo mondo, gruppi di terroristi e sulle strade. Economica, fatta di metallo stampato |
| Dai Lung Cybermag 15 | PST | -1 | P | C | 1D6+1 (6mm) | 10 | 2 | IN | 50 | 50 | Honk Kong, classica pistola per bulli di strada e booster |
| Dai Lung Magnum | PST | 1 | J | E | 3D6+1 (.357Mag) | 10 | 2 | IN | 50 | 60 |  |
| Dai Lung Streetmaster | PST | 0 | J | E | 2D6+3 (10mm) | 10 | 2 | IN | 50 | 250 | Hong Kong, adatta per lo sprawl rinculo(COS 12). Forza>12, altrimenti COS-12 danni al braccio |
| Darra-Polytechnic P -12 | PST | 0 | J | C | 4D6+1 (12mmCL) | 10 | 1 | ST | 50 | 785 | Molto popolare grazie al suo prezzo, è larga ma passa inosservata (VP*1/2) 10 1 IN 30 240 Lancia dardi che possono essere avvelenati o drogati. Almeno 2 danni per effetto |
| Desert Eagle 44 | PST | 0 | J | S | 4D6 (.44Mag) | 8 | 1 | ST | 50 | 899 |  |
| Desert Eagle 50 | PST | 0 | J | S | 4D6+2 (.50 AE) | 7 | 1 | ST | 50 | 1249 |  |
| Desert Eagle IIIs | PST | 3 | J | P | 4D6 (.44Mag) | 10 | 2 | MA | 50 | 800 | Disponibile in .357Magnum(-1 colpi), .44Magnum e .50AE(-1 colpi) con smartgun |
| Desert Eagle IIIz | PST | 2 | J | P | 4D6 (.44Mag) | 10 | 2 | MA | 50 | 600 | Disponibile in .357Magnum(-1 colpi), .44Magnum e .50AE(-1 colpi) con mirino laser per professionisti che sulle strade Enertex AKM a Spruzzo PST EXO -2 J C Droga 50 1 MA 10 15 Pistola a spruzzo, come quelle ad acqua |
| Espinoza One Shot | PST | -1 | J | E | 3D6 (.50 short) | 1 | 1 | IN | 50 | 75 |  |
| Fashion Gun 9 | PST | 0 | P | E | 2D6+1 (9mm) | 7 | 2 | IN | 25 | 40 | Federated Arms |
| Federated Arms "SA-58" | PST | 2 | L | P | 2D6+3 (10mm) | 12 | 1 | MA | 50 | 350 | Non bella ma efficace, con mirino laser Federated Arms 454 Super |
| Federated Arms Impact | PST | 1 | J | E | 1D6 (.22) | 10 | 2 | MA | 50 | 60 |  |
| Federated Arms X-22 | PST | 0 | J | E | 1D6+1 (6mm) | 10 | 2 | ST | 50 | 50-150 | Classica pistola usa e getta, in polimeri plastici e diversi colori |
| Federated Arms X-38 | PST | 1 | J | E | 2D6 (.38) | 10 | 2 | ST | 50 | 35 |  |
| Federated Arms X-9 | PST | 0 | J | E | 2D6+1 (9mm) | 12 | 2 | ST | 50 | 300 | Pistola d’ordinanza per l’U.S. Army ed esercito della CEE |
| FN Browning “3 Spot” MP | PST | 1 | J | C | 2D6+3 (10mm) | 24 | 3 | ST | 50 | 425 |  |
| FN FiveSeven | PST | 2 | J | S | 1D6 (5.7x28) | 20 | 3 | MA | 50 | 600? | Glock 100 Competition |
| G-Lock 94 | PST | 1 | J | C | 3D6 (11mm) | 18 | 1/3 | MA | 50 | 380 | Con mirino laser |
| Glock 17 | PST | 1 | J | S | 2D6+1 (9mm) | 15 | 2 | MA | 50 | 609 |  |
| Glock 20 | PST | 1 | J | S | 2D6+3 (10mm) | 15 | 2 | MA | 50 | 670 |  |
| Glock 21 | PST | 1 | J | S | 2D6+2 (.45 ACP) | 13 | 2 | MA | 50 | 670 |  |
| Glock 22 | PST | 1 | J | S | 2D6+3 (.40 S&W) | 15 | 2 | MA | 50 | 670 |  |
| Glock 26 | PST | 0 | P | S | 2D6+1 (9mm) | 12 | 2 | MA | 50 | 680 | Con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Glock 27 | PST | 0 | P | S | 2D6+3 (.40 S&W) | 11 | 2 | MA | 50 | 680 | Con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Glock 29 | PST | 0 | P | S | 2D6+3 (10mm) | 10 | 2 | MA | 50 | 680 | Con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Glock 30 | PST | 2 | P/J | C | 2D6+3 (10mm) | 20/30 | 3 | MA | 50 | 705 | Austria, anche con proiettili AP, può usare anche un 20 rnd con OCC=P |
| Glock 30 (20° secolo ) | PST | 0 | P | S | 2D6+2 (.45 ACP) | 10 | 2 | MA | 50 | 680 | Con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Glock 98 Pocket 10 | PST | -1 | P | P | 2D6+3 (10mmCL) | 6 | 2 | MA | 50 | 600 | Il Glock piú piccolo mai prodotto Goncz-Taurus MP Goncz-Taurus PST PST -1 J J C E 2D6+1 (9mm) 15/30 /15 2/10 ST ST 50 400 Dai nomadi Bat-People, Brasile |
| Gru Max 12mm | PST | 0 | J | R | 4D6+1 (12mmCL) | 10 | 2 | ST | 50 | 600 | San Francisco, design anni ‘70 |
| H&K "Stammer" | PST | 2 | J | C | 3D6 (11mm) | 14 | 1 | MA | 50 | 625 | Con mirino laser e porta di eiezione luminescente. Molto comoda |
| H&K G-6 Asa Pistol | PST | 0 | C | R | 5D6 (6mmC) | 30 | 3/30 | MA | 150 | 1350 | GERMANY, non per tutti! |
| H&K Mk 23 USSOCOM | PST | 2 | J | S | 2D6+2 (.45 ACP) | 12 | 2 | MA | 50 | 850? |  |
| H&K MP-505 | PST | 1 | L | C | 2D6+3 (10mm) | 15 | 1/3 | ST | 50 | 455 | Con mirino removibile, un po’ più piccola ed occultabile delle altre MP |
| H&K P-11 | PST | 0 | J | P | 4D6H (6mmRkt) | 5 | 1 | MA | 50 | 1095 | Per combattimenti sottomarini, range di 30 yards. A 6 yds è 5D6, per ogni yds in più danno scende di 1 dado. Sulla terra range è 40 yds. 25E$/proiettile |
| H&K Socom 2020 | PST | 1 | P | E | 3D6 (11mmCL) | 12 | 1 | MA | 50 | 785 | Come la Socom 2020 del 20° secolo, ma con un calibro più alto |
| H&K USP | PST | 1 | J | S | 2D6+1 (9mm) | 15 | 2 | ST | 50 | 696 |  |
| H&K USP | PST | 0 | J | S | 2D6+2 (.45 ACP) | 12 | 2 | ST | 50 | 696 |  |
| H&K USP | PST | 0 | J | S | 2D6+3 (.40 S&W) | 13 | 2 | ST | 50 | 696 |  |
| H&K VP-80 | PST | 2 | J | C | 3D6 (11mm) | 14 | 1 | MA | 50 | 525 | Successore del VP70, arma standard di molte agenzie di polizia e militari. Quando equipaggiata con manico pieghevole(200 E$), anche 3 clp a raffica |
| Hammer M-11 | PST | 2 | J | P | 1D6+2AP (9mmBolt) | 10 | 2 | ST | 30 | 320 | Lanciadardi con ottimo controllo al rinculo |
| IMI "Bullseye" | PST | 4 | J | P | 2D6+3 (10mm) | 5 | 1 | MA | 50 | 1285 | Con due mirini telescopici, uno per obiettivi vicini, l’altro per lunghe distanze, e un piccolo mirino laser. Molto comoda |
| IMI Desert Eagle 14mm | PST | 2 | J | P | 6D6 (14mm) | 10 | 1 | MA | 50 | 1675 | Pistola grande e pesante, ma dal rinculo dolce 2D6+1 (.41 mag) 4D6 (.44Mag) 4D6+2 (.50 AE) ST 50 600 Pistola usata ad Hollywood negli anni 80, affidabile anche negli ambienti ostili (deserto). Per persone con spalle grandi |
| IMI Gamad | PST | 0/1 | P/J | E | 2D6+3 (10mm) | 7/15 | 2 | MA | 50 | 575 |  |
| Ingram "MAC-2021" | PST | 1 | L | P | 4D6+1 (12mm) | 14/25 | 1/3 | MA | 50 | 750 | La più moderna Ingram a portare il nome MAC. Sia in 25 clp che in pieno automatico |
| Kang Tao Type 97 | PST | 1 | J | E | 2D6+1 (9mm) | 10 | 2 | IN | 50 | 35 | Kendachi Mono Gun PST BNC -3 J J P P 2D6+3 (10mm) 2D6 NO NO IN MA Pistola e monolama insieme, canna corta quindi range 10m. Knife Pistol Type 89 PST BNC -2 J R 1D6/1D6 (.22) 4 4/1 ST 50/1 200 Coltello con 4 canne sulla lama, anche ETE |
| Le Roi Maxi-10 | PST | -1 | J | E | 2D6+3 (10mm) | 10 | 2 | IN | 50 | 150 | 20G 9/1 2/1 MA 50/25 750 Può sparare 10mm o 20g, in una canna separata centrata sul cilindro, realizzata in Virginia |
| Llama Commanche | PST | 0 | J | S/C | 4D6 (.44C) | 6 | 1 | ST | 50 | 200 | Revolver, usato dalla polizia e per difesa personale, con canna lunga, difficile ocultarlo |
| MA 3516 | PST | -1 | J | R | 6D6 (14mm) | 6 | 1 | MA | 50 | 4525 | Richiesti cyberbraccio e alta COS, spinotti d’interfaccia per collegamento per bloccare il braccio, solo su ordini speciali (VP*1/4) 25 2 ST 50 595 Migliore arma a dardi, dopo 200 clp va ricaricato il liquido, ha un codice con smartchip che la rende usabile solo da un’uomo |
| MA Heavy-Flechette (2) | PST | 1 | J | C | 1D6*(1D6+2) (.4UG) | 25 | 2 | ST | 50 | 800? | Versione potenziata |
| MA Sliver Gun | PST | 0 | J | P | 1D6/2*2D6 (2cm frag) | 7 | 2 | IN | 40 | 375 | Come un coltello per il VP, versione per cyberbraccio costa 550E$ e PU=1D6+2 |
| Magnum Opus Big Govern. | PST | 0 | J | P | 4D6+2 (.555 ) | 13 | 1 | MA | 50 | 2000 | Magnum Opus Hellbringer PST 1 J/ L P 7D6+3 (.666Mag) 3 1 MA 50 4000 PR-2 rispetto al .50AE |
| Magnum Opus"Big City" | PST | -1 | L | P | 6D6 (14mmCL) | 10 | 1 | MA | 50 | 650 | In competizione con la Law Giver, stesse note tecniche, ma diversa nel design |
| Malorian Gallant | PST | -1 | L | R | 2D6+3 (10mm) | 10 | 1 | MA | 50 | 1050 | Forma strana e originale. Caricatore quasi a mezzaluna con la canna curva. In numero limitato (5D6/6D6+3/ 7D6/7D6+1) 10 1 MA 50 4225 Più si è distanti e più fa male. Per l’USAF, per distruggere armature e paratie di spacecraft e stazioni lunari/marine Manurhin MR 73 PST -1/ 1/ 2 P/J/L S 2D6+3 (.357Mag) 6 1 MA 50 1500 Revolver |
| Matel Intimidator | PST | 0 | J | E | 2D6+1 (9mm) | 14 | 2 | IN | 50 | 80 | Con speaker vocale, c‘è il 60% chance che si inceppi permanentemente |
| Maudi-Griffin TNX Carbine | PST | 3 | L | R | 6d10 (.50 BMG) | 1 | 1 | MA | 50 | 5395 | La pistola più potente del mondo. Per caricarla di nuovo bisogna rimuovere il bolt |
| Miilitech "Clover" | PST | -1 | J | C | 4D6 (.44Mag) | 14 | 1 | ST | 50 | 285 | Con tre canne, una è il mirino laser, l’altra è un flashlight. Si dice sia stata disegnata per l’uso militare in orbita, ma ha un grosso calibro |
| Militech "Martian" | PST | 2 | J | P | 1D6+2 (9mmBolt) | 10 | 1 | MA | 30 | 750 | Disegnata per l’uso in orbita, perfetta per l’autodifesa al Cristal Palace, ma attenzione! |
| Militech "Officer" | PST | 1 | L | E | 3D6 (11mmCL) | 10 | 1 | MA | 50 | 450 | Disegnata per agenti e funzionari |
| Militech "Rat" | PST | 1 | J | E | 2D6+1 (9mm) | 14 | 1 | MA | 50 | 460 | Stupenda arma per tutte le condizioni (jungla, deserto, fuoco, sott’acqua |
| Militech "Starbuck" | PST | 1 | J | P | 4D6+1 (12mmCL) | 10 | 1 | MA | 50 | 1220 | Con smartchip e microcomputer che informa (anche tramite cyberotti ca) dei colpi rimasti 3D6 (20G) 14- gen 1/3-1 ST 50 360 Accetta una sottocanna a colpo singolo da .20G per situazioni di emergenza Militech 447 Boomer |
| Militech Arms Avenger | PST | 0 | J | E | 2D6+1 (9mm) | 10 | 2 | MA | 50 | 250 | Arma da professionisti, ben fatta e alta prec e alta portata Militech Elect ronics Taser PST EXO 1 J C Stordimento 10 1 ST 10 60 Piccolo come una lampadina tascabile |
| Militech Laser Pistols | PST | 3 | L | R | 1/6D6 (laser) | 12/6 | 1 | MA | 50 | 23565 | Deve essere attaccata alla batteria, standard al laser (1D2+2 danno/round) 8 2 ST 30 300 Antenato civile della Vedova Nera dell’USAF. Colpiscono (1D6+2 frecce)*(1D6/3 danni). Ha lanciafrecce senza caricatore (VP*1/2) 10 2 ST 30 400 Usata nello spazio, 1m raggio. Colpiscono (1D10+2 freccette)* 1D6/2. Senza caricatore |
| Mustang Arms "whisper" | PST | 3 | J | R | 1D6 (.22CL) | 8 | 1 | MA | 50 | 520 | Silenziosissima, pistola perfetta per assassini di quartiere, con display dei colpi e mirino laser Mustang Arms “Mark II” PST 1 J/ L C 3D6 (11mm) 12/20 3 MA 50 425 |
| Mustang Arms Oshi -592 | PST | 1 | P | P | 2D6+1 (9mm) | 10 | 1 | ST | 50 | 435 | Fatta per la sicurezza nelle stazioni orbitali, ma usta anche da donne e bambini. Con mirino laser integrato Nelspot “Wombat” PST EXO -1 J C Droga 20 2 IN 40 200 Arma infernale, spara palle piene d’acido, tintura, droga o veleno. Ad aria compressa |
| Nomad .357 Autoloader | PST | 0 | J | P | 2D6+3 (.357Mag) | 8 | 2 | MA | 50 | 300 |  |
| Nomad .357 Revolver | PST | 0 | J | P | 2D6+3 (.357Mag) | 6 | 2 | MA | 50 | 250 | Nomad .44 Magnum |
| Norinco 167 | PST | 0 | J | P | 2D6+3 (10mm) | 12 | 1 | IN | 50 | 160 | Sembra un’ ammasso di ferraglia, me è economica e popolare sulle strade strade e ne i paesi sottosviluppati |
| Norinco"Eduardo" | PST | 0 | J | R | 2D6+2 (9mm) | 16 | 1 | MA | 50 | 325 | Dal Luger, usato da molte bande giovanili, anche perché dorato e cromato Norse Technologies |
| Norse Technologies "Odin" | PST | 0 | J | P | 6D6+2 (7.62mm c) | 3 | 1 | MA | 50 | 1285 | Disegnato per la C-swat. Efficace per i cyborg leggeri |
| Nova "Otto" | PST | 1 | J | P | 2D6+3 (10mm) | 10 | 1 | MA | 50 | 750 | Fatta nel 2004, ideale per mancini ed ambidestri |
| Nova 338 CityGun | PST | 1 | J | P | 3D6 (.338) | 7 | 3 | MA | 50 | 460 | Resistente ed affidabile, 15E$/scatola da 50 |
| Nova 757 City Hunter | PST | 2 | J | P | 3D6 (11mm) | 18 | 2 | ST | 50 | 480 |  |
| Nova Arms "Blackline" | PST | 1 | J | P | 2D6+3 (10mm) | 12 | 1 | MA | 50 | 350 | Ideale per sicurezza e combattimenti, ma con eiezione dei proiettili a sinistra e grilletto molto sensibile. Molto affidabile |
| Nova Arms "Pocket" | PST | -2 | P | P | 4D6 (.44Mag) | 3 | 1 | MA | 50 | 55 | Molto piccola, minuscola. Usata molto da bande e donne. Il cilindro va ricaricato a mano e costa 10E$ Nova Arms Plasmatic 4D6 (.44Mag) 4D6+3 (.454 casull) 6 2 MA 50 999 1499 1799 |
| Nova X-88 | PST | -1 | J | E | 2D6+2 (9mmCL) | 14 | 1 | ST | 50 | 375 | Quasi un calico, con grilletto rapido, non molto preciso me economico |
| Nova XP-89 | PST | -1 | J | C | 2D6+2 (9mmCL) | 25 | 1/3 | ST | 50 | 525 | Versione avanzata dell’88, quasi un calico, con caricatore sopra la canna |
| P60 “Punisher” | PST | 1 | L | P | 4D6+1 (12mm) | 13 | 2 | MA | 60 | 950 | Usata dall’inquisizione. Una delle migliori pistole a 12mm sul mercato |
| Paintball Pistol | PST | -1 | J | C | Vernice/Droghe | 20 | 2 | IN | 40 | 150 | Copia non licenziata del Nelspot Combat. Arma per principianti |
| Paltik Pistol | PST | 0 | J | P | 4D6+1 (12 mm) | 10 | 1/5 | ST | 50 | 650 | Malaysia, usato solo da persone con COS>8 |
| Para ordnance P12-45 | PST | 1 | J | S | 2D6+2 (.45 ACP) | 14 | 2 | ST | 50 | 700 |  |
| Para ordnance P14-45 | PST | 0 | P | S | 2D6+2 (.45 ACP) | 12 | 2 | ST | 50 | 745 |  |
| Para ordnance P16-40 | PST | 1 | J | S | 2D6+3 (.40 S&W) | 16 | 2 | ST | 50 | 745 |  |
| Para ordnance P18-9 | PST | 1 | J | S | 2D6+1 (9mm) | 18 | 2 | ST | 50 | 745 | Con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Piranha | PST | 2 | L | C | 4D6+1 (12mm) | 11 | 2 | IN | 50 | 650 | A lunga canna non adatta ai lunghi combattimenti, perchè scomoda da tenere in mano per lungo comoda. Intimidatoria |
| Pistol | PST | -1 | J | S | 1D6+2 (dardi) | 1 | 1 | ST | 30 | 100 | Spara dardi con droghe liquide o chimiche, la punta è in titanio con siringa che si apre all’impatto |
| Pistol | PST | 0 | J | R | 2D6+3 (10mmRed) | 24 | 2 | ST | 50 | 600 | Dallo stile Sci-Fi, con manico lucente, per chi ama lo stile danni*1.5 8 2 IN 75 195 Per ogni colpo sparato senza prendere un round di pausa, c’è 1/6 di probabilità cumulativo che l’arma non spari danno*1.5 21 2 ST 50 965 Pistola elettrotermica, -2 prec quando appena estratta |
| Pistol 2015 | PST | 1 | J | P | 2D6+3 (10mm) | 10 | 2 | MA | 50 | 750 | Prodotto nel 2015 dalla Steyr,lo SPP fú rivoluzionario insieme al TMP |
| Remington "Bastard" | PST | 3 | J | R | 5D6 (5.56mm) | 1 | 1 | MA | 50 | 2456 | Fatta per veri cacciatori, è un pezzo d’arte. Comoda precisa e con range di 1000m |
| Remington "Loner" | PST | 2 | N | P | 4D6 (.44Mag) | 6 | 1 | MA | 50 | 550 | Dal manico di un fucile (removibile in 1 min con uno srewdriver). Con suppressor e mirino telescopico |
| Remington "Pinpoint" | PST | 3 | L | P | 2D6+3 (10mm) | 5 | 1 | MA | 50 | 1150 | Aram usata da molti eurosolitari. Estremamente precisa |
| revolver | PST | 0 | J | P | 4D6 (.44Mag) | 6 | 1 | MA | 50 | 375 |  |
| Ronko Bravado | PST | 0 | J | C | 3D6 (11mm) | 15 | 1 | ST | 50 | 425 | Leggera ma forte, può essere accessoriata |
| Ronko Partisan | PST | -2 | P | P | 3D6 (11mm) | 8 | 1 | ST | 50 | 275 | Più piccola della Bravado |
| Ronko Street Master | PST | 1 | J | C | 3D6+1 (.41Mag) | 6 | 2 | IN | 50 | 450 | Con mirino laser(+1 PR), pistola a doppio colpo |
| Rossi 766 | PST | 1 | J | S | 2D6+3 (.357Mag) | 6 | 1 | MA | 50 | 320 | Revolver. Con manico pieghevole, -2PR, allungarlo costa 1 turno Rostovic Wrist Racate PST PES 0 N P 5D6 (30mmHE) 6 3 ST/ P 400 380 Montato solo su cyberbraccio, 5D6*3m, 6 rocket a 200E$ |
| Royal Enfield Ord. Spitfire | PST | 1 | J | P | 4D6 (.44Mag) | 12 | 2 | MA | 50 | 550 |  |
| Ruger "Lawgiver" | PST | 2 | L | C | 6D6 (14mmCL) | 12 | 1 | MA | 50 | 960 | Con flashlight e mirino laser. Molto potente e pesante Ruger GP100 PST -1/ 1/ 2 P/J/L S 2D6+3 (.357Mag) 6 1 MA 50 425 Revolver |
| Ruger H240 | PST | 1 | J | P | 4D6+1 (12mmCL) | 10 | 1 | MA | 50 | 520 | Realizzata nel 2020 e gia sta diventando popolare. Un’altra gemma della Ruger |
| Ruger SP101/SP101DAO | PST | -1 | P | S | 2D6+3 (.357Mag) | 5 | 1 | MA | 50 | 428 | Revolver |
| Ruger Spitz | PST | 1 | J | E | 4D6+1 (12mmCL) | 10 | 1 | MA | 50 | 485 | Pistola comune per corporativi e sicurezza privata Ruger Super Redhawk PST 1/ 2 J/L S 4D6 (.44Mag) 6 1 MA 50 574 Revolver |
| Ruger.500 Magnum | PST | 2 | J | R | 6D6+3 (.500 c.) | 5 | 1 | MA | 50 | 3895 | Sentirai il rinculo fino alle tue scarpe. Munizioni speciali (200E$, scatola da 50) |
| S&W "Bully" | PST | 2 | J | R | 4D6 (.44Mag) | 8 | 1 | MA | 50 | 695 | Dal rinculo alto e canna lunga, ma molto precisa S&W "Coldsnap" PST J J C 3D6+1 (.357Mag) 6 1 MA 50 420 Molto elegante con linea pulita e calibro potente S&W 29 PST 1/ 2 J/L S 4D6 (.44Mag) 6 1 MA 50 554 Revolver |
| S&W 317 Airlite | PST | 0 | P | S | 1D6 (.22LR) | 7 | 2 | MA | 50 | 510 | Revolver. Con manico pieghevole, -2PR, allungarlo costa 1 turno |
| S&W 4006 | PST | 0 | J | S | 2D6+3 (.40 S&W) | 11 | 2 | ST | 50 | 775 |  |
| S&W 4506 | PST | 1 | J | S | 2D6+2 (.45 ACP) | 8 | 2 | ST | 50 | 806 |  |
| S&W 627 Perfor. Center | PST | 2 | J | S | 2D6+3 (.357Mag) | 8 | 1 | MA | 50 | 600? | Revolver |
| S&W 640 Centennial | PST | 0 | P | S | 2D6+3 (.357Mag) | 5 | 1 | MA | 50 | 469 | Revolver |
| S&W 649 | PST | 0 | P | S | 2D6 (.38Spe) | 5 | 1 | MA | 50 | 469 | Revolver S&W 686 Plus PST -1/ 1/ 2 P/J/L S 2D6+3 (.357Mag) 7 1 MA 50 528 Revolver. Con manico pieghevole, -2PR, allungarlo costa 1 turno S&W HP 654 PST J J C 3D6 (11mmCL) 14 1 MA 50 420 Per guardie del corpo operative e non solo S&W Magnum ( 686 ) PST -1/ 1/ 2 P/J/L S/C 2D6+3 (.357Mag) 6 1 MA 50 515 Revolver. Usata dalle guardie confinarie USA e dalla polizia, piccola e affidabile |
| S&W Model C29 | PST | 2 | J | P | 3D6+1 (.41Mag) | 8 | 2 | MA | 50 | 950 | Pistola a doppio colpo, con mirino laser, flash, smart, videocamera, link ed altri accessori 2D6+3 (10mm) 3 MA 50 800 Con mirino laser incorporato, puó essere usata in orbita con munizioni flechette (75$) #000 6 1 ST 50 375 Può sparare anche .410 shotshells(2D6/1D6+2/1D6) e slugs(3D6+1AP). Il #000spara 4D6 clp di 2D6 danni ognuno. Con mirino laser (100E$) ha puntatore rosso Samson Signal Pistol PST PES -2 J P Minigranate 25mm 1 1 ST 100 425 Pistola segnalatrice che lancia minigranate da 25mm |
| Sci Fi Starrior 4 | PST | 0 | J | E | 2D6+1 (9mm) | 12 | 2 | IN | 50 | 60 |  |
| Sci Fi Starrior 7 | PST | 1 | J | E | 2D6+1 (9mm) | 20 | 2 | IN | 50 | 65 | Basato sul laser di Star Wars, ma i polimeri si rompono ad alta pressione |
| Seco LD-120 | PST | 2 | J | P | 2D6+1 (9mmCL) | 12 | 2 | MA | 50 | 500 | Minilaser integrato per i bersagli veloci, dal look letale SGI "Doppleganger" |
| SGI "Wraith" Paintball | PST | 0 | J | C | Vernice/Droghe | 20 | 2/3 | ST | 50 | 400 | Range eccellente per un’arma Pistol paintball (VP*1.5) 18 1 IN 50 750 Dal calibro potente, più largo del .666. Per due mani, -2 PR se usata con una |
| Sig 220 | PST | 1 | J | S | 2D6+2 (.45 ACP) | 7 | 2 | MA | 50 | 805 |  |
| Sig 226 | PST | 1 | J | S | 2D6+1 (9mm) | 15 | 2 | MA | 50 | 825 |  |
| Sig 232 | PST | 0 | P | S | 2D6+1 (9mm) | 7 | 2 | ST | 50 | 300? |  |
| Sig Sap | PST | 2 | J | C | 4D6+1 (12mm) | 12 | 1 | MA | 50 | 845 | Potente ed efficace. Prodotto all’avanguardia della Sig |
| Sooch M2008A2 Tactical | PST | 2 | L | P | 6D6 (.525) | 6 | 2 | MA | 50 | 1725 | Interessante per il calibro e per il vantaggio con ElectroThermic enhancement Stein & Wasserman |
| Standard" | PST | 0 | P | E | 2D6+3 (10mm) | 10 | 1 | MA | 50 | 250 | Pistola semplice e compatta. Usata da molte donne e booster |
| Sternmayer P-41 | PST | 0 | J | C | 2D6+3 (10mm) | 12 | 2 | MA | 50 | 425 |  |
| Sternmayer Type 35 | PST | 0 | J | C | 3D6 (11mm) | 8 | 2 | MA | 50 | 400 | Germania, fabbriche CEE, con basso rinculo |
| Steyer "Razorback" | PST | -1 | L | P | 4D6+3 (.44cbM CL) | 8 | 1 | ST | 50 | 489 | Con alto rinculo, buon range e buon danneggio. Completamente rinchiusa Steyr Special Purpose |
| Stolbovoy ST-2 Pistol | PST | 0 | J | C/R | 2D6+3 (10mm) | 14 | 2 | MA | 50 | 450 |  |
| Streetline Special | PST | -2 | P | P | 1D6+1 (6mm) | 6 | 1 | ST | 15 | 100 | Usata nei bassi livelli urbani, piccolissima! (.45 low-V) 2 2 MA 50 109 Buca fino a VP=5, a doppia canna, carica di 70.000 Volt |
| Sturm Ruger VZ-98 | PST | 1 | P | E | 2D6+3 (10mm) | 10 | 1 | MA | 50 | 190 | Pistola da 10mm molto piccola e compatta |
| Surprising Stranger | PST | 0 | P | E | 2D6+3 (10mm) | 4 | 2 | ST | 25 | 15-50 |  |
| Sword "Dagger" Series S | PST | 0 | J | P | 2D6+1 (9mm) | 9 | 2 | ST | 50 | 175 | Verona Beach, più piccolo della Sword S, con rifinitura cromata |
| Sword "Rapier" Series S | PST | 1 | J | P | 2D6+1 (9mm) | 13 | 3 | MA | 50 | 475 | Verona Beach, con riduzione per il rinculo |
| Sword 9mm Series S | PST | 1 | J | C | 2D6+1 (9mm) | 13 | 2 | MA | 50 | 300 | Tipico di Verona Beach Talmet Industries Tranqui- |
| Tanfoglio T 95F | PST | 1 | J | S | 2D6+1 (9mm) | 15 | 2 | MA | 50 | 425 |  |
| Tanfoglio T 95F | PST | 1 | J | S | 2D6+2 (.45 ACP) | 10 | 2 | MA | 50 | 425 |  |
| Tanfoglio T 95F | PST | 1 | J | S | 2D6+3 (.40 S&W) | 12 | 2 | MA | 50 | 425 |  |
| Tanfoglio T95 Buzz/Stock | PST | 2 | J | S | 2D6+1 (9mm) | 17 | 3 | MA | 50 | 900 | Con manico pieghevole, -2PR, allungarlo costa 1 turno forze di polizia che militari Taurus 44 cp PST 1/ 2 J/L S 4D6 (.44Mag) 6 1 MA 50 457 Revolver |
| Taurus Hunter | PST | 2 | J | P | 4D6 (.44Mag) | 8 | 3 | ST | 50 | 1200 | Pistola a doppio colpo con mirino laser ad alta potenza e riduzione al rinculo Taurus Racing Bull PST 1/ 2 J/L S 4D6+3 (.454) 5 1 MA 50 600? Revolver Techtronica 15 “Microonde” PST EXO 0 J P 1D6 (microonde) 10 2 MA 20 400 Proiettore di microonde grande quanto una torcia elettrica (1/2 stun, ½ danni) 6 1 ST 25 950 Anche per cortocircuiti, non vale l’armatura. Cyberarti bloccati * 1D6+3 turni. Ricarica costa 25E$ |
| Teen Dreem | PST | -1 | J | E | 2D6+1 (9mm) | 10 | 2/10 | IN | 50 | 36 |  |
| Texas Arms 351 Gyrojet | PST | 0 | J | C/P | 2D6+1 (9mmGyro) | 8 | 2 | IN | 50 | 420 | Comune sulla Luna. Segue le linee di principio dell’MK II, militare Tojima Firespitter (non in |
| Towa Type 12 Police Pistol | PST | 3 | J | P | 1D6+1 (6mm) | 8 | 2 | MA | 50 | 450 |  |
| Towa Type 13 Police Pistol | PST | 2 | J | P | 2D6+3 (10mm) | 12 | 2 | MA | 50 | 500 |  |
| Towa Type 14 | PST | 2 | J | P | 2D6+1 (9mm) | 16 | 3/16 | MA | 50 | 520 | Tsunami Arms AirHammer PST EXO 1 J C 1D6+5AP (5.3mmAJ) Usa le Kendachi flechette 5/7 2 ST 50 400 Spaziale, tre opzioni: target (1/2 danno,1/2aria),combat(norm, 1 aria), overload (AFF=UR, +3 danni,3 aria.Sostituire il cilindro 1turno e RIF>15,rinculo +1 e RIF>16, con mirino,smartgun bene VP*3, dan*2 (5D6, 6D6+3, 7D6,7D6+1) 6 2 MA 100 1100 |
| Tsunami Arms XP-65 | PST | 1 | L | P | 2D6+3 (10mm) | 10 | 1 | ST | 50 | 235 | Molto popolare, dovuto al suo look intimidatorio, molto grossa |
| Tsunami Express Racegun | PST | 3 | L | P | 2D6+3 (5.2mmET) | 24 | 3 | MA | 75 | 5300 | Vanguard 10 mm “Snub” |
| vendita) | PST | 3 | J | E/R | 6D6+2 (.44M ETE) | 8 | 1 | MA | 50 | NO | Con ETE, mirino laser e smartlink. Può essere sparata solo quando attaccata ad un braccialetto. A forma di drago e quando spara sembra che sputi fuoco. Non in vendita |
| Walther P 38 | PST | 0 | J | S | 2D6+1 (9mm) | 8 | 2 | ST | 50 | 824 |  |
| Walther P 99 | PST | 1 | J | S | 2D6+1 (9mm) | 16 | 2 | MA | 50 | 1300? |  |
| Walther PPK | PST | -1 | P | S | 1D6+2 (.32ACP) | 8 | 2 | ST | 50 | 651 |  |
| Walther PPK/S | PST | -1 | P | S | 2D6+1 (9mm) | 8 | 2 | ST | 50 | 651 |  |
| WWWA "Yuri" | PST | 1 | J | P | 3D6 (11mmCL) | 12 | 1 | ST | 50 | 465 | Con mirino laser, fatta di |

---

## FUCILI

| Nome | Tipo | PR | OC | RE | Danni | CL | CD | AF | m | E$ | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 00 Kai | FCL | 3 | N | R | 9D6+3AP (7.62NET) | 6 | 1 | MA | 1200 | 3000 | Towa Manufactoring Type FCL PES N P 5D6 (5.56) Granate 25mm 3/45 MA ST 4200 |
| AcuTek Cruncher | FCL | -1 | L | P | 6D6+2 (7.62N) | 15 | 2 | ST | 400 | 725 | Non preciso per la canna corta e mancanza di manico, ma potente ed occultabile AG’17 “Panzerknacker” FCL PES N N R R 6D6+2 (7.62NCL)/ 5D6+3 (6.5mmCL) Granata 40mmH ST IN 1500 1500 Stesso design dell ’ MP-105. perfora l’armatura, con manico pieghevole e lanciagranate AK 47 Kalashnikov FCL -2/ 0 L/N S/E 5D6 (7.56C) 30 20 MA 400 200 Russo, resistente e difficile da controllare. Molto famoso. Anche con manico pieghevole, -2PR, allungarlo costa 1 turno AK 74 FCL -2/ 0 L/N S 5D6 (5.45x39USSR) 30 40 ST 400 500? Anche con manico pieghevole, -2PR, allungarlo costa 1 turno |
| AKR 20 | FCL | 0 | N | C | 5D6 (5.45x39USSR) | 30 | 30 | ST | 400 | 500 | Sovietica, versione aggiornata dell’AKM, in polimeri plastici e fibre di carbonio AN 94 Abakan FCL -1/ 1 L/N S 5D6 (5.45x39USSR) 30 35 MA 400 500? Anche con manico pieghevole, -2PR, allungarlo costa 1 turno APEX Mobile Point Defense System FCL Auto ## N P 2D6+4 (9mmCL) 400 40 ST 200 10000 Spara a tutto ciò che si muove in 200m, ha VP 5, PS 20, 20KG, con telecomando fino a 1000m e target di taglia selezionabili 30/ 3 MA 400 1000? |
| Arasaka Dart Rifle M101 | FCL | 1 | N | S | 2D6 (dardi) | 4 | 1 | ST | 100 | 200 | Versione moderna del vecchio Simpson Dart, usato per catturare grandi prede al NO Fucile laser sconosciuto al pubblico,(solo 9 copie rilasciate) Ricaricare la batteria prende 6 ore, (3D6,100 clp,3/sec; 3D10, 10 clp, 3/sec; 3D10, 2 clp, 3/sec) Granate 40mm 35 1/3/2 MA 500 1459 Con manico retaribile e laser integrato, lancia anche granate da 20mm |
| Arasaka PS400 | FCL | 3 | N | P | 5D6 (5.56N) | 15 | 3 | MA | 400 | 1725 | Con mirino ottico 6x, riduzione al rinculo e manico intercambiabile. Rarità tra le armi Arasaka ETE standard Arasaka Storm FCL 1/-1 P 6D6+2 (7.62N)/ 5D6 40/8 1/3/3 MA 400 1240 Simile all’LBR nel design. Può avere sia il 7.62mm, sia il 10G, e sono selezionabili da un bottone. Con mirino laser integrato Arasaka X-LR-62 Laser al 1 MA Speci al ? Ha trev switch, il primo fa 3D6 per cento clp (se collegato a presa elettrica, illimitato), 5D6 per 30 sec, e 10D6 per 3 sec. Dopo va ricaricata, richiede la metà di tempo dei normali laser Usata da molte forze imperiali BAR Mk Xlb “Invader” BAR Mk Xlb “Invader” FCL PES N N R R 5D6+3 (6.5CL) Granata 37mm ST ST 1350 1350 Arma unica usata da forze imperiali, con lanciagranate, drum-fed, anche per scontri ravvicinati |
| Arasaka WAA | FCL | 1 | N | C | 5D6 (5.56N) | 15/ | 3/30 | MA | 400 | 800 | Fucile d’assalto per guardie 30 Arasaka Granate 40mm 30/1 1/3/2 0-1 MA 400 965 Con mirino telescopico e lanciagranate da 40mm. Molto silenzioso 5D6 (10G) 30/6 1/3/2 5-1 MA 500 935 In 2 versioni:A standard, B più lunga ed ha una sottocanna che spara 6 clp da shotgun. Leggera e sturdy. La preferita dai miltari, tra le nuove serie d’armi |
| Assault Rifle | FCL | 1 | N | P | 5D6+3 (6.5mm) | 30 | 2/20 | MA | 400 | 800 | Verona Beach, usato dagli agenti sugli elicotteri Cyber Tronic AR3000 Assault Rifle FCL PES N N R R 5D6+3 (6.5CL) Granata 37mm ST IN 1500 1500 Fatto con acciaio orbitale, con lanciagranate da 37mm Cyber Tronic CAW2000 Cyber Tronic CAW2000 FCL PES N N R R 5D6 (5.56N) Granata MA ST 1200 1200 Con lanciagranate e baionetta (nascosta nel manico). Non è possibile usarli insieme Cyber Tronic SR3500 danni*1.5 20 1 MA 600 1500 ETE. Pochi esemplari. Con mirino notturno 8x CyberSecurity SA- |
| Automatic Paintball Gun | FCL | -1 | N | C | Vernice/Droghe | 150 | 15 | ST | 75 | 750 | Capacità di colpi più ampia tra i paintball, con ironsight SGI “Will o’ Wisp” Paintball |
| Barret M-90 | FCL | 3 | N | R | 6D10 (12.7BMG) | 10 | 1 | MA | 1000 | 1500 |  |
| Barrett P-50 & P-50B | FCL | 2 | N | R | 6D10 (.50BMG) | 5/10 | 1 | MA | 3000 | 4325 | Lungo 4 piedi e pesante 25 libbre. Range di 1,5 miglia. La B è piu leggera (<25 libbre) Berretta AR 70-90 FCL -1/ 1 L/N S 5D6 (5.56N) 30 40 ST 400 850? Anche con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Blaser Tactical | FCL | 3 | N | S | 6D6-1 (.308Win) | 10 | 1 | MA | 400 | 850? | Su veicoli o fissato a terra |
| Browning 435LMG | FCL | 1 | N | C | 6D6+2 (7.62N) | 30 | 15 | ST | 400 | 1245 | Fucile d’assalto popolare in tutto il mondo, con record nei test di prova MA 200 735 Con manico pieghevole e mirino telescopico. Manico e canna sono removibili (-PR,+OCC) Cannone Laser Militech Electronics FCL EXO 0 N R 1-5D6 (Laser) 10 2 IN 200 8000 Arma speciale militare, non si vede in circolazione CAR-24 CAR-24 FCL PES -2 L N R R 6D6+2 (7.62N) Granata IN ST 1000 La più piccola arma con il 7.62N, +1 PR con manico esteso. Con lanciagranate |
| Carbine | FCL | -1 | L | P | 6D6+2 (7.62NCL) | 30 | 30 | MA | 200 | 1450 | Progettato per le forze antiterroristiche del CAS, usato dalle stesse forze militari |
| Castech Assault Carbine | FCL | 1 | N | P | 5D6 (5.56CL) | 40 | 25 | ST | 200 | 800 | Versione più piccola con un range minore |
| Castech Assault Rifle | FCL | 1 | N | P | 5D6 (5.56CL) | 40 | 25 | ST | 400 | 850 | Può essere ampliato con qualsiasi equipaggiamento |
| Castech Sniper Rifle | FCL | 2 | N | P | 5D6 (5.56CL) | 40 | 25 | ST | 500 | 1400 | Con silenziatore integrato removibile e mirino |
| CCMMC Jinhua M-9 | FCL | 0 | N | P | 6D6+2 (7.62N) | 35 | 25 | ST | 400 | 125 | Chadran Arms Jungle Reaper Con Lanciagranate FCL PES N P 5D6 (5.56N) 25mm MA ST 1550 |
| Colding Arms M516D | FCL | -2 | N | R | 4D6 (12G) | 12 | 2/4 | ST | 60 | 1900 | Variante a doppia canna dell’ M516S. Ristretta a militari e servizi di sicurezza |
| Colding Arms M516S | FCL | 0 | N | C | 4D6 (12G) | 6 | 2 | ST | 60 | 600 | Shotgun standard per servizi di sicurezza. Dal lungo raggio. Molti sono stati rubati allle truppe ESS |
| Colt AR-55 | FCL | 1 | N | E | 6D6+2 (7.62N) | 30 | 1/3/2 | ST | 400 | 695 | Fucile d’assalto standard della 0 Colt 30/ 45 ST 400 850? Anche con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Colt M-1632 | FCL | 2 | N | C | 5D6 (5.56N) | 25 | 1 | MA | 400 | 875 | Sniper con mirino, bipod, e fuoco selettivo |
| Colt M-18 | FCL | 1 | N | C | 5D6 (5.56N) | 35 | 3/30 | MA | 400 | 750+ |  |
| Colt M22 A2 | FCL | 1 | N | P | 5D6 (5.56CL) | 40 | 2/20 | ST | 400 | 1000 | Con lanciagranate da 40mm e riduzione al rinculo |
| Colt M22 A4 | FCL | 0 | N | P | 5D6 (5.56CL) | 40 | 1/20 | ST | 200 | 750 | Si può aggiungere qualsiasi accessorio Colt XM 177 FCL -1/ 1 L/N S 5D6 (5.56N) 20/ 30/ 45 MA 400 850? Solo con manico pieghevole, -2PR, allungarlo costa 1 turno 1000 Compatta e leggera.Puntatore ad infrarossi, caricabile anche con laser e dispositivo radar CrossBow Precision |
| CZ 700 | FCL | 3 | N | S | 6D6-1 (.308Win) | 10 | 1 | MA | 400 | 850? | Su veicoli o fissato a terra |
| Czech vz 88 Assault Rifle | FCL | 2 | N | P | 5D6 (5.5CL) | 25 | 1/20 | ST | 400 | 1800 | Cecoslovacco con mirino laser e riduzione al rinculo,+1 PR e acciaio riciclati. Popolare tra le milizie del terzo mondo, terroristi e bande di strada |
| Darra-Politech. M -9 | FCL | 0/-1 | N/L | P | 4D6+2 (5.5mm) | 40 | 2/25 | ST | 200 | 300 | Terzo mondo, poco stile e no interfaccia, economica, VP*2 e danni*1.5, oppure standard 4D6. Mirino ottico 1.2x e manico pieghevole |
| Ed. | FCL | 1 | N | C | 5D6 (5.56N) | 35 | 30 | MA | 300 | 500 | Usato da vigili urbani e USMC 0V MA 200 1235 Con smartchip, contatore di clp, e scatola delle munizioni attaccata sotto l’arma |
| Erma SR 100 | FCL | 3 | N | S | 7D6+3 (.300 WM) | 8 | 1 | MA | 600 | 1400? | Su veicoli o fissato a terra |
| Erma SR 100 | FCL | 3 | N | S | 6D6-1 (.308Win) | 10 | 1 | MA | 400 | 850? | Su veicoli o fissato a terra |
| Erma SR 100 | FCL | 3 | N | S | 8D6 (.338LM) | 5 | 1 | MA | 500 | 2000? | Su veicoli o fissato a terra |
| FA MAS | FCL | 0 | N | S | 5D6 (5.56N) | 25 | 55 | MA | 400 | 850? | Solo con manico pieghevole, -2PR, allungarlo costa 1 turno Fabrica de Armes |
| Fare’ Sniper T 1000 | FCL | 4 | N | S | 8D6 (.338LM) | 5 | 1 | MA | 500 | 2000? | Su veicoli o fissato a terra ST 400 615 Fucile d’assalto buono ma non preciso. Con manico retraibile |
| Federated Arms LA15 | FCL | 0/1 | N | C | 5D6 (7mmCL) | 30 | 3/25 | MA | 400 | 400 | Nel terzo mondo e nell’Arena, con smrtgun, interface plugs e mirino ottico ST 200 520 Popolare tar i militari del terzo mondo, nomadi e bande cittadine Granate 40mm 40/1 1/3/3 ST 500 840 Troppo pesante per l’uso nelle battaglie! Con lanciagranate da 40mm Granate 40mm 30/1 1/3/3 ST 400 935 Un nuovo fucile dell’ FN, con lanciagranate da 40mm sotto canna |
| FN-FAL | FCL | 0 | L/N | S/C | 6D6+2 (7.56C) | 20 | 20 | MA | 400 | 450 | NATO, letale e resistente. Anche con manico pieghevole, -2PR, allungarlo costa 1 turno FN-FAL II “Stubby” Assault |
| FN-FAL II Assault Carbine | FCL | 0 | N | P | 6D6+2 (7.62NCL) | 60 | 30 | MA | 300 | 1300 | Usato dalle forze della legge, è possibile equipa ggiarlo di tutti gli optional |
| FN-FAL II Base Model | FCL | 1 | N | P | 6D6+2 (7.62NCL) | 60 | 20 | MA | 400 | 1200 | Con riduzione al rinculo ed ElectronicFirng Mechanism(+1 PR al massimo range) |
| FN-FAL II Sniper Version | FCL | 2 | N | P | 6D6+2 (7.62NCL) | 60 | 2 | MA | 500 | 3000 | Con silenziatore e mirino ottico, versione sniper MA 400 1045 Popolare per militari e polizia di tutto il mondo. Efficace in tutte le condizioni (città, jungla, casa) Esiste una versione a canna corta, la MN-24B FN-RAL FCL -2/-1 L / N C 6D6+2 (7.62N) 30 3/30 MA 400 600 Truppe NATO, con adattore per lanciamissili e calcio pieghevole |
| FR-F2 | FCL | 3 | N | S | 6D6-1 (.308Win) | 10 | 1 | MA | 400 | 850? | Su veicoli o fissato a terra |
| FR-F6 | FCL | 3 | N | P | 6D6+2 (7.62N) | 10 | 2 | ST | 500 | 1100 | Galil e Galil Mar FCL -1/ 1 L/N S 5D6 (5.56N) 35/ 35 ST 400 850? Anche con manico pieghevole, -2PR, allungarlo costa 1 turno MA 400 780 Comune tra le squadre d’estrazione e operazioni nere, con manico retraibile e mirino laser integrato Granate 40mm 30/3 1/3/3 ST 400 965 CAWS con lanciagranate da 40mm sotto la canna |
| H&K G-6 | FCL | 1 | N | P | 5D6AP (6mm) | 100 | 30 | MA | 900 | 2050 | Mirino ciberottico 2x e passivo agli IR |
| H&K G12 A3 Z | FCL | 2 | N | R | 5D6 (6mmCL) | 50 | 2/20 | MA | 400 | 2200 | Con mirino laser e sistema a gas,+1 PR in piena raffica |
| H&K G3 | FCL | 2 | N | C | 6D6+2 (7.62N) | 30 | 20 | ST | 400 | 1000? | Usata dalla NATO sin dalla 2° Guerra Mondiale, 30 pollici, 10 libbre |
| H&K G36 | FCL | 2 | N | P | 5D6 (5.56N) | 30 | 20 | MA | 400 | 1000? | Germania, con manico pieghevole |
| H&K G36 E | FCL | 1 | L/N | S | 5D6 (5.56N) | 30 | 40 | MA | 400 | 1000? | Solo con manico pieghevole, -2PR, allungarlo costa 1 turno |
| H&K G36K | FCL | 1/2 | N | P | 5D6 (5.56N) | 30 | 20 | MA | 400 | 1000? | Germania, con manico pieghevole, mirino ottico 1,5x |
| H&K G3A3 | FCL | -1/1 | L/N | S | 6D6-1 (.308Win) | 20 | 35 | MA | 400 | 850? | Anche con manico pieghevole, -2PR, allungarlo costa 1 turno |
| H&K G3K | FCL | 0/1 | N | C | 6D6+2 (7.62N) | 30 | 20 | ST | 400 | 1000? | Versione più corta dell’H&K G3 |
| H&K G3SG1 | FCL | 2 | N | P | 6D6+2 (7.62N) | 10 | 20 | ST | 600 | 1000? | Sniper con canna di precisione, alta rigidità, grilletto da collezione, con artiglio |
| H&K G41A2 | FCL | 2 | N | P | 5D6 (5.56N) | 30 | 2/25 | ST | 400 | 1000? | Per competere con l’M16-A2, con manico fisso |
| H&K G41A3 | FCL | 1/2 | L/N | P | 5D6 (5.56N) | 30 | 2/25 | ST | 400 | 1000? | Per competere con l’M16-A2, con mirino telescopico |
| H&K Goblin | FCL | 1 | N | P | 5D6 (5.56CL) | 40 | 3/20 | MA | 200 | 935 | Per uso urbano con cinghia da spalla |
| H&K HK33E | FCL | 2 | N | C | 5D6 (5.56N) | 30 | 2/20 | ST | 400 | 1000? | In Nord-America, lungo 3 piedi e pesa 8.4 libbre |
| H&K HK33K | FCL | 1/2 | L/N | C | 5D6 (5.56N) | 30 | 2/20 | ST | 400 | 1000? | Più picccolo dell’H&K 3E, versione europea |
| H&K HK33SG1 | FCL | 2 | N | R | 5D6 (5.56N) | 10 | 2/20 | ST | 500 | 1000? | Variante sniper della serie H&K 33, con mirino ottico |
| H&K HK53 | FCL | 0/1 | L | C | 5D6 (5.56N) | 30 | 2/20 | ST | 300 | 900? | Corto come l’MP5 con manico retraibile |
| H&K HK77UK | FCL | 1 | L | P | 2D6+4 (9mmLong) | 30 | 3/30 | MA | 250 | 750 | UK, usata da molte forze militari, con presa per il Miltech 25mm GL, spinotti interfaccia (600 E$) |
| H&K HKG11 | FCL | 2 | N | R | 4D6 (4.7CL) | 45 | 35 | ST | 400 | 1000? | Una delle prime armi con munizioni caseless |
| H&K HKG12A3Z | FCL | 2 | N | R | 5D6 (6mmCL) | 50 | 2/20 | MA | 400 | 2,200 | Versione più leggera del G11, mirino laser integrato (+1 in piena raffica) MA 500 1150 Uso urbano, con mirino laser e manico retraibile e la più alta capacità di danneggio per un’arma della sua classe |
| H&K MG36E | FCL | 2 | N | P | 5D6 (5.56N) | 30 | 20 | MA | 400 | 1000? | Germania, con manico pieghevole, canna resistente al calore MA 400 825 Per uso militare e corporativo. Con manico pieghevole e mirino laser integrato |
| H&K S/SR-53 | FCL | 3 | N | P | 6D6+2 (7.62NCL) | 10 | 1 | MA | 400 | 985 | Sniper comodo e dall’aspetto elegante 1 MA 3000 2000? Su veicoli o fissato a terra |
| Harris Gunworks M96 | FCL | 2 | N | S | 6D10 (.50Browning) | 5 | 2 | MA | 3000 | 2000? | Su veicoli o fissato a terra |
| HG-14 | FCL | 0 | N | C | 4D6 (12G) | 5 | 1 | ST | 50 | 500 | Shotgun ampiamente diffusosi tra le compagnie di sicurezza |
| Impalatore | FCL | 0 | N | R | 4D10 | 10 | 1 | MA | 50 | 1000 | Carabina che spara due lunghe schegge di legno, che possono contenere anche acciaio e argento spruzzatore al napalm, carico solo per 2 colpi |
| Insurgent | FCL | -1 | L | C | 5D6 (5.56CL) | 40 | 40 | IN | 200 | 900 | Con il manico piegato è occultabile sotto una giacca. Non più in produzione |
| Kalishnikov A-80 | FCL | -1 | N | E | 6D6+2 (7.62N) | 35 | 3/25 | ST | 400 | 550 | Russo, in lega leggera, con sistema di mira migliorato 500/ Anche con mani co pieghevole, -2PR, allungarlo costa 1 turno LongBow Tactical Sniper danni*1.5 5 1 MA 500 1100 Verona Beach, PR*2 alle medie e lunghe distanze, tiro mirato 4 round |
| M-16A | FCL | 2 | N | C | 4D6 (5.56C) | 30 | 25 | IN | 400 | 200 | D’ordinanza dell’US Army nel 1960, molto preciso, le versioni civili sono l’AR-15 e l’AR-180 |
| M24 SWS (Remington 700) | FCL | 3 | N | S | 6D6-1 (.308Win) | 5 | 1 | MA | 400 | 850? | (50% elettr., Mort-3 e stun*2D6*30min/ Elettr. Da riparare, stun- 5 o 1D6*10min) 6 1/2 ST 50 3500 Distrugge i componenti elettrici di tutti i tipi (Mort-3/stun -5 / stun -3/stun -1/stun) *** M41A Pulse Rifle M41A Pulse Rifle FCL PES -1 N N R R 5D6+3 (6.5CL) Granate 25mm 4x 2x ST ST 400 1300 1300 Dal popolare M41 Pulse Rifle dei film anni 80/90. Con lanciagranate M50 M50 FCL PES N N P P 6D6+2 (7.62N) Granata IN ST 1100 A lunga canna, con manico pieghevole che non aumenta l’occultabilità. Con lanciagranate MA 400 1265 Il primo fucile d’assalto della Malorians. Con comodità, PR ed AFF senza pari. Buono anche come sniper |
| Manex Assault Carabine | FCL | 2 | L | R | 5D6 (5.56CL) | 30 | 30 | ST | 200 | 1500 | Usato dal CAS per le squadre antiterroristiche, con smartlink e gas venting(+1 PR, in piena raffica) |
| Manex Assault Rifle | FCL | 3 | N | P | 5D6 (5.56CL) | 30 | 20 | ST | 300 | 1800 | Con smartlink, usata da truppe e scelta da molti governi |
| Manex Grenadier | FCL | 2 | N | P | 5D6 (5.56CL) | 30 | 20 | ST | 300 | 2800 | Versione dell’Assault Rifle che può ospitare il lanciagranate Manex Grenadier |
| Manex Sniper Rifle | FCL | 4 | N | R | 6D6+2 (7.62N) | 30 | 3 | ST | 500 | 3800 | Sniper con smartlink, silenziatore e obiettivo Mag2 |
| Mauser SR 93 | FCL | 3 | N | S | 8D6 (.338LM) | 5 | 1 | MA | 500 | 2000? | Su veicoli o fissato a terra |
| Mephisto Sniper Rifle | FCL | 2 | N | P | 7D6+3 (.300 WM) | 13 | 1 | MA | 700 | 1400 | Fucile sniper di alta affidabilità, range e PR. Con mirino notturno 3x fino a 15x, con puntatore laser rosso a corte distanze MA 200 1235 Invitante per l’USAF, ed altre forze militari |
| Militech ATR-97 | FCL | 2 | N | R | 4D10+3 (15mmC) | 8 | 1 | MA | 500 | 1590 | Usata da polizia e militari per combattere il crimine dei cyborg ST 400 1025 La risposta all’Arasaka morita, con impugnatura migliorata, la seconda scelta tra le milizie |
| Militech Cyborg | FCL | 1 | N | P | 7D6+3AP (.300 WM) | 30 | 2 | ST | 500 | 800 | 7.5KG, usata per buttare giù cyborg ad alte distanze, ma più spesso usata dagli stessi ST 50 250 Prima arma a dardi della Militech, molto grande |
| Militech Dragon | FCL | 0 | L | C | 6D6-1 (6.5H) | 35 | 30 | MA | 400 | 700 |  |
| Militech High Power 15 | FCL | 2 | N | P | 2D6+4 (9mmLong) | 180 | 20/60 | ST | 200 | 1600 | Americano, 116cm, militare, con 180(a bande) o 100 clp. 5mmL(2D6+1D3+1) Militech M-31a1 Con Lanciagranate FCL PES N R 4D6 (4.5mm) Granate 25mm 3/30 ST ST 1695 Anche Minilanciagranate |
| Militech Ronin | FCL | 1 | N | C | 5D6 (5.56N) | 35 | 3/30 | MA | 400 | 450 | Solo 3KG, lungo 35 pollici, moderno, leggero e versatile, versione aggiornata del M -16B Militech Ronin Commando Ed. FCL MTR 2 N P 2D6+3 (10mm) 40 40 MA 200 625 Senza rinculo e molto accurato, anche in 9mm(600E$), 11mm (700E$, 35clp, 20rof, AFF=ST), 12mm(800E$, 30clp, 20rof, AFF=ST, +1PR) Militech Ronin Compact |
| Nomad .357 Carbine | FCL | 0/1 | L | C | 2D6+3 (.357C) | 30 | 2/3 | MA | 100 | 400 | Carabina da caccia |
| Nomad .357 Lever Action | FCL | 2 | L | C | 2D6+3 (.357C) | 9 | 2 | MA | 100 | 300 | Carabina a leva |
| Nomad .44 Lever Action | FCL | 1 | L | C | 4D6+2 (.44C) | 8 | 2 | MA | 200 | 650 | Carabina a leva |
| Nomad 7.62 Bolt Action | FCL | 2 | N | C | 6D6+2 (7.62N) | 6 | 1 | MA | 400 | 500 | Carabina da caccia |
| Nomad Long Rifle | FCL | 1 | N | P | 7D10 (15mmBMG) | 9 | 1 | ST | 900 | 3000 |  |
| Omnipol OPV Bull-pup | FCL | 2 | N | S | 6D10 (.50Browning) | 6 | 1 | MA | 3000 | 2000? | Su veicoli o fissato a terra |
| PGM Hecate II | FCL | 2 | N | S | 6D10 (.50Browning) | 7 | 1 | MA | 3000 | 2000? | Su veicoli o fissato a terra HEP (½ danni, ½ stun) No VP e VP-2 1 1 IN 100 90 Molto economica, se si inceppa si rompe, se tiro maldestro per colpire, esplode facendo 2D6 danni al braccio |
| PSG-99 | FCL | 3 | N | P | 6D6+2 (7.62NCL) | 40 | 1 | MA | 500 | 1100 | Con mirino notturno, in competizione anche con le forze speciali corporative, manico aggiustabile Pursuit Security WEBGUN FCL EXO 1 N C Ragnatela (COS e RIF >30) 1 1 ST 30 250 Con mirino ottico, se entrambi i tiri falliscono blocca e RIF*1/2, se solo 1 fallisce blocca * 10- (COS o RIF)min. Può essere tagliato da una spada. Con 100E$ rete al taser |
| RAI Model 500 | FCL | 2 | N | S | 6D10 (.50Browning) | 1 | 1 | MA | 3000 | 2000? | Su veicoli o fissato a terra |
| Rail Gun | FCL | 2 | N | R | 3D10AP | 10 | 1 | ST | 500 | 8000 | Spara proiettili ad uranioad alta velocità, lascia una scia blu |
| Ranger Arm SM3 | FCL | 2 | N | C | 6D6+2 (7.62NCL) | 6 | 1 | MA | 400 | 4000 | Efficace al primo colpio, con silenziatore, completamente scomponibile |
| Reitzwerks LK-4 (al laser) | FCL | 3 | L | P | 6D6AP (laser) | 100 | 20 | MA | 400 | 1450 | In combinazione anche con l’SGML-11, buono nello spazio, penetra il VP |
| Remington gyro | FCL | 2 | N | P | 7D6AP (18mmGyro) | 6 | 1 | ST | 600 | 1000 |  |
| Remington"Survivor" | FCL | 1 | N | C | 6D6+2 (7.62NCL) | 10 | 1 | MA | 400 | 225 | Si smonta in 5 parti , in modo da essre facilmente trasportabile |
| Rifle | FCL | 2 | N | R | 7D6+3 (.300 WM) | 15 | 1 | MA | 600 | 1500 | Con canna più corta di altri fucili sniper, mirino laser per vista notturna 4x e 8x |
| Rifle | FCL | 4 | N | R | 6D6+2 (7.62NCL) | 8 | 2 | MA | 600 | 3000 | Disegnato per scopi militari, la scelta del professionista MA 400 780 Basato sul Walther 3000 sniper. Abbastanza corto da essere considerato un mitra |
| Rugel 100 Sport Rifle | FCL | 1 | N | C | 2D6+4 (9mmCL) | 5 | 1 | MA | 400 | 1300 | Perfetto in qualsiasi condizione ambientale 4D6+2Hep/4D6+3Api/ 1D6Acid 8 1 MA 100 1650 Con adattatore per lanciagranate Il caricatore può avere diversi colpi selezionabili da uno switch Per psycho squadre e C -Swat |
| Sako TRG-41 | FCL | 3 | N | S | 8D6 (.338LM) | 5 | 1 | MA | 500 | 2000? | Su veicoli o fissato a terra MA 400 755 Stile Calico, ergonomico e molto preciso MA 400 1075 Con un calibro più largo dell’MN-24 MA 400 1085 Lavora bene sia come sniper che come fucile d’assalto MA 400 1265 Quasi uguli alle MN-24, tranne che per taglia e per design. La A è standard, B per truppe aeree, C per i Navy Seals |
| Setsuko-Arasaka Model 44 | FCL | 2 | N | P | 5D6+3 (7mmCL) | 50 | 30 | ST | 400 | 750 | Stesse munizioni della Federated Arms LA15, simile all’M16 del 2010 SGI "Geist" Paintball ST 75 550 Arma paintball da assalto, con mirino da caccia 4x SGI “Barghest” Squad |
| SG72001 | FCL | 1 | N | P | 4D6 (12G) | 6 | 2 | ST | 60 | 600 | Sviluppato per polizia, milizia corporazioni .Basato sull’estinto shotgun CyberSec SG700 |
| Sig SG 550 Sniper | FCL | 2 | N | S | 5D6 (5.56N) | 30 | 3 | MA | 400 | 1000? | Sig SG 551 SWAT FCL -1/ 1 L/N S 5D6 (5.56N) 20/ 45 ST 400 1000? Solo con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Sig SG 551 Swat Series 2 | FCL | 1 | N | P | 5D6+3 (6.5CL) | 35 | 25 | MA | 400 | 1500 | Usato da polizia e militari, con mirino elettronico manico pieghevole e baionetta! |
| Sig SSG 3000 | FCL | 3 | N | S | 6D6-1 (.308Win) | 4 | 1 | MA | 400 | 850? | Su veicoli o fissato a terra |
| Simpson Dart Rifle | FCL | -1 | N | S | 2D6+2 (dardi) | 1 | 1 | ST | 100 | 200 | Vecchio fucile da caccia usato per catturare grandi prede |
| Sniper Sistem | FCL | 3 | N | C | Vernice/Droghe | 1 | 1 | ST | 150 | 600 | Arma paintball sniper, a colpo singolo. Range più lungo tra tutt i i paintball e mirino sniper 8x 45 ST 400 1000? Anche con manico pieghevole, -2PR, allungarlo costa 1 turno |
| SR Mk XII “Assailant” | FCL | 2 | N | P | 6D6+2 (7.62N) | 15 | 1 | MA | 500 | 1200 | Usato esclusivamente da truppe imperiali, troppo pesante per uso civile, con mirino notturno |
| SR-50 | FCL | 1 | N | R | 8D6 (.62) | 12 | 2 | MA | 700 | 2050 | Con silenziatore e soppressore di luce, versione estesa dell’M50 Sternmayer CG 13 FCL 1 N ? 5D6 (5.56N) 90 48 MA 400 750 |
| Sternmeyer ASW-68 | FCL | 3 | N | C | 5D6 (5.56CL) | 5 | 1 | MA | 200 | 975 | Sniper con origini dal Kalishnikov |
| Sternmeyer C89 | FCL | -1 | J | P | 5D6 (5.56N) | 15 | 3 | ST | 400 | 750 | Per competere con l’Akutech Cruncher ed il Militech Cruscher, con riduzione al rinculo |
| Sternmeyer M-95A4 | FCL | 1 | N | R | 5D6 (5.56N) | 90 | 3/30 | MA | 400 | 750 | ST 400 595 Largo calibro, ma poca precisione, con manico pieghevole ST 200 745 Piccolo fucile d’assalto per guardie e patrols units |
| Steyr 944 Police Edition | FCL | 0 | N | P | 5D6 (5.56CL) | 40 | 25 | MA | 200 | 795 | Con canna ridotta, rispetto al clasico AUG, anche edizione civile con raffica da 15 |
| Steyr AUG | FCL | 2 | L | S/P | 4D6 (5.56C) | 30 | 20 | MA | 400 | 400 | Con supporto lanciarazzi e mirino telescopico, in polimeri. Solo con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Steyr SSG 69 P II | FCL | 3 | N | S | 6D6-1 (.308Win) | 5/10 | 1 | MA | 400 | 850? | Su veicoli o fissato a terra |
| Stolbovoy St-5 | FCL | -1 | N | C/R | 5D6 (5.45x39USSR) | 30 | 30 | MA | 400 | 900 | ST 400 565 Funziona bene sia come sniper, sia come fucile d’assalto 4D6+2 30 15 ST 400 600 Con mirino laser e baionetta versatile, usata dalle forze di sicurezza Water and Power Tambu 1 “Shogun” GL Tambu 1 “Shogun” GL FCL PES N N R R 6D6+2 (7.62N) Granata MA ST 1000 1000 Per operazioni militari e corporative, con lanciagranate da 40mm |
| Tambu 1 “Shotgun” | FCL | 2 | N | P | 6D6+2 (7.62N) | 26 | 30 | MA | 400 | 900 | Con interno completamente differente dal Tambu 4. Uno dei più compatti fucili Tambu 15 “Archer” Sniper |
| Tambu 4 “Windrider” | FCL | 2 | L | P | 5D6 (5.56N) | 22 | 30 | IN | 300 | 800 | Con canna di lunghezza giusta, occultabile ma inaffidabile Tambu 4 “Windrider” Assault FCL PES N N R R 5D6 (5.56N) Granata 40mm IN IN Non occultabile, con lanciagranate |
| Tambu 50/50 “Airbrush” | FCL | -1 | N | P | 4D6 (12G) | 14 | 4 | IN | 60 | 1200 | Con canna doppia, alto rinculo, ma leggero e potente, non facile da manovrare |
| Tambu 501 “Airbrush” | FCL | 1 | N | P | 4D6 (12G) | 14 | 2 | ST | 60 | 600 | Versione a canna singola del Tambu 50/50, più leggero e manovrabile Towa Manufactoring Type |
| Towa manufactoring Type | FCL | 1 | N | P | 5D6 (5.56N) | 35 | 3/30 | ST | 400 | 1500 | Tsunami Arms ST 200 695 Semplice ed economico fucile d’assalto (5D6+3/6D6+1/7D6/ 7D6+3) 9 3 MA 800 1230 Acquista velocità con la distanza, con smrtgun, laser ottico 4x che punta il target. Più è distante, più fa male U-B Capacitor Laser FCL 2 dipen de R 3D6 2 2 IN 25 950 Da montare sotto la canna di fucili e mitra, un power pack costa 250E$ e raddoppia i clp e pesa 4KG |
| WA 2001 | FCL | 3 | N | S/R | 6D6+2 (7.62N) | 10 | 1 | MA | 1000 | 900 | Walter MA 2100 Sniping |
| Winchester Model 70 | FCL | 3 | N | C | 5D6+1 (.30-06) | 5 | 1 | MA | 500 | 250 | Con mirino telescopico, usato per la caccia al cervo |

---

## MITRA

| Nome | Tipo | PR | OC | RE | Danni | CL | CD | AF | m | E$ | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| .45AP 3 “Ronin” | MTR | 0 | L | P | 2D6+2 (.45AP) | 30 | 20 | MA | 50 | 700 | Dal design molto copiato, munizione standard e 45APC cased KTW VP perforanti MA 200 485 Per forze di polizia e militari MA 150 875 Leggero e semplice, comune nelle forze di sicurezza di tutto il mondo, sia private che federali |
| “StealthPlus” Ed | MTR | 2 | N | P | 2D6+3 (10mm) | 40 | 20 | MA | 200 | 700 | Usato da corporativi, completo di silenziatore, con H&K, MP2013, 9mm/650E$), 45ACP (800E$), molto raro Militech Ronin Commando Ed. MTR FCL 2 N P 2D6+3 (10mm) 40 40 MA 200 625 Senza rinculo e molto accurato, anche in 9mm(600E$), 11mm (700E$, 35clp, 20rof, AFF=ST), 12mm(800E$, 30clp, 20rof, AFF=ST, +1PR) Militech Skorpio 12 MTR 0 L N P 4D6+1 (12mmCL) 28 15 ST 200 1115 Con silenziatore e mirino smontabili. Senza silenziatore è occultabile ma meno accurato |
| Arasaka Honshushot II | MTR | -1 | J | C | 3D6 (11mm) | 25 | 3/15 | MA | 200 | 550 | Prodotto In Giappone, molto affidabile, by Arasaka |
| Arasaka WMA Minami 10 | MTR | 0 | J | E | 2D6+3 (10mm) | 40 | 20 | MA | 200 | 500 | In dotazione alle guardie Arasaka, un buon mitra Ares Crusader Machine |
| Ares Folding SMG II | MTR | 0 | J | P | 2D6+1 (9mmCL) | 30 | 30 | ST | 100 | 600 | Completamente richiudibile su se stesso, per riespanderlo ci vuole un round. Con mirino laser |
| Assault | MTR | 1 | J | E | 1D6 (.22) | 30 | 10/30 | IN | 100 | 160 | Federated Arms Tech |
| Assault II | MTR | 1 | J | C | 1D6+1 (6mm) | 50 | 25 | ST | 150 | 400 | Con caricatore più capiente della prima versione, e non si surriscalda |
| Assault Vulcan | MTR | 1 | L | P | 4D10 (20mm) | 40 | 20 | MA | 400 | 2000 | Spesso montato su veicoli, usato contro esoscheletri e fanteria |
| Barreta "Intruder" | MTR | 1 | L | P | 3D6 (11mmCL) | 30 | 3/15 | ST | 200 | 765 | Dalla forma curva che migliora l’occultabilità MA 50 700 Ambita da molte forze militari |
| Beretta M-24 | MTR | 2 | L | P | 2D6+1 (9mm) | 50 | 25 | MA | 200 | 1250 | Mitra per qualsiasi Solitario! Con smartlink (senza costa 950E$) e riduzione al rinculo |
| Beretta M-70 | MTR | 2 | L | P | 2D6+3 (10 mmCL) | 35 | 20 | ST | 150 | 900 | Con mirino laser e silenziatore Beretta Sheppard MTR 1 L 3D6 (11mmCL) 35 1/3/3 MA 200 587 Usata anche da molte forze di polizia europee. Anche con manico estraibile ed in 15 clp Berretta 1010 MTR 0 P/ J C 2D6+3 (10mm) 15/30 15 ST 100 475 |
| Berretta PM 36 | MTR | 1 | C | C | 3D6 (11mm) | 30 | 3/20 | ST | 200 | 800 | Italia, arma sia accurata che mortale! |
| Bushmaster | MTR | 0 | L | R | 4D6 (5.56C) | 30 | 20 | ST | 200 | 300 | Con supporto lancia granate, con una sola mano, usa i caricatori dell’ M-16A1 1/3/1 ST 200 620 Disponibile con 50 o 100 clp e manico retraibile Calico Light MP-SP MTR 0/ 1/ 1 C/ N R 4D6 (4.7mm) 25 3/25 ST 150/ 250/ 1700 USA, provvisto di mirino laser, assemblare e disassemblare il mitra costa 3 min. |
| calibro Uzi | MTR | 2 | J | C | 2D6+1 (9mmMC) | 30 | 20 | MA | 200 | 250 | Progettato dagli israeliani come arma di esportazione, usato da forze di sicurezza e terroristi |
| CCMC Tuzi-7 | MTR | -2 | J | R | 3D6 (11mm) | 30 | 15 | ST | 200 | 125 | Cina, venduto in tutta Asia |
| Ceska Black Scorpion | MTR | 0 | J | P | 2D6+1 (9mmCL) | 25/35 | 20 | ST | 50 | 750 | Leggera e piccola come una pistola, veloce come un mitra |
| Chadran Arms City Reaper | MTR | 0 | L | P | 3D6 (11mm) | 40 | 20 | MA | 200 | 950 |  |
| Chain Gun | MTR | 1 | N | R | 3D6 (5.7mm) | 200 | 100 | ST | 300 | 4000 | Al primo round ha solamente CDF 10, in piena raffica ha rinculo 9 COBRA TC Special MTR O J E 3D6+3 35 20 MA 200 600 Comune nell’esercito ed in polizia |
| Cyber Tronic P1000 SMG | MTR | 1 | L | P | 4D6+1 (12mm) | 20 | 20 | MA | 150 | 900 | Capolavoro da artigiano, resistente agli impatti |
| Daewoo 11mm Mitsumi | MTR | 0 | C | R | 3D6 (11mm) | 100+ | 3/30 | ST | 200 | 850 | Giappone, puo sparare per tre round di seguito, ma dopo si puo inceppare Fabrique de Armes Bizon 10/25 MTR PES L L P P 2D6+3 (10 mm) Granate 25mm ST ST 200 1225 Combinazione di mitra e lanciagranate da 25mm, di uso però non frequente |
| Federated Arms P6 Auto | MTR | -1 | C | E | 5D6 (6mm) | 30 | 3/15 | ST | 150 | 700 | USA, inaccurato ma uno dei piu precisi Federated Arms Tech |
| FN P90 | MTR | 1 | L | S | 1D6 (5.7x28) | 50 | 50 | MA | 100 | 500? |  |
| Glock Model 99 | MTR | 1 | J | P | 3D6 (11mm) | 12 | 2/30 | MA | 50 | 950 | Può essere esteso con 25 round magazines |
| H&K MP-11 L | MTR | 1 | N | C | 4D6+1 (12mm) | 30 | 3/20 | ST | 300 | 820 | Germania, anche con lanciagranate opzionale |
| H&K MP-2013 | MTR | 1 | J | C | 2D6+3 (10mm) | 35 | 32 | ST | 200 | 450 | Nuova release dell’MP5SD, con silenziatore interno, mercato nero 35 MA 200 900? Due mitra molto simili e con parti interscambiabili, l’MP5K è molto ridotto e con silenziatore |
| H&K MP-5 TX | MTR | 2 | J | P | 2D6+3 (10 mmCL) | 20/30 | 20 | MA | 100 | 950 | Con mirino laser integrato |
| H&K MP-5 TX | MTR | 2 | J | P | 2D6+3 (10 mmCL) | 20/30 | 20 | MA | 100 | 950 | Con mirino laser |
| H&K MP5/10A2 | MTR | 2 | L | P | 2D6+3 (10 mm) | 30 | 20 | MA | 150 | 700 | Usato dall’FBI nel 1984, 27 pollici lungo e 6 libbre di peso |
| H&K MP5/10A3 | MTR | 1/2 | L | P | 2D6+3 (10 mm) | 30 | 2/20 | MA | 150 | 750 | Usato dall’FBI nel 1984, 27 pollici lungo e 6 libbre di peso |
| H&K MP5/40A2 | MTR | 2 | L | P | 2D6+3 (.40S&W) | 30 | 20 | MA | 150 | 700 | Usato dalla polizia |
| H&K MP5/40A3 | MTR | 1/2 | L | P | 2D6+3 (.40S&W) | 30 | 2/20 | MA | 150 | 750 | Usato dalla polizia, con manico pieghevole |
| H&K MP503A3D5 | MTR | -1 | L | R | 5D6 (5.56N) | 30 | 20 | ST | 400 | 1000 | Nato nel 2017, è equipaggiato con cyberottica e mirino laser |
| H&K MP5A1 | MTR | 2 | L | P | 2D6+1 (9mm) | 30 | 2/20 | MA | 150 | 550 | Usato da squadre antiterroristiche |
| H&K MP5A2 | MTR | 3 | L | C | 2D6+1 (9mm) | 30 | 2/20 | MA | 150 | 550 | Antiterrorista, lungo 26.77 pollici, peso di 5.6 libbre |
| H&K MP5A3 | MTR | 2/3 | L | C | 2D6+1 (9mm) | 30 | 2/20 | MA | 150 | 600 | Antiterrorista, 5.6 libbre |
| H&K MP5K | MTR | 1 | J | C | 2D6+1 (9mm) | 30 | 30 | MA | 75 | 550 | Molto compatto e piccolo, 13 pollici |
| H&K MP5K-PDW | MTR | 1/2 | J/L | P | 2D6+1 (9mm) | 30 | 30 | MA | 75 | 750 | Arma da difesa personale, disegnato originariamente per forze aeree e navali |
| H&K MP5SDA2 | MTR | 2 | L | P | 2D6+1 (9mm) | 30 | 2/20 | MA | 150 | 700 | Totalmente silenzioso, lungo 30 pollici |
| H&K MP5SDA3 | MTR | 1/2 | L | P | 2D6+1 (9mm) | 30 | 2/20 | MA | 150 | 750 | Totalmente silenzioso, lungo 30 pollici,manico pieghevole |
| H&K MPK-11 | MTR | 0 | L | C | 4D6+1 (12mm) | 30 | 20 | ST | 200 | 700 | La più usata dai solitari, disponibile in molti disegni, accetta un lanciagranate e adattatore per lanciarazzi |
| H&K MPK-11 KURZ | MTR | -1 | C/J | P | 4D6+1 (12mm) | 30 | 3/20 | ST | 150 | 580 | Germania, potrebbe essere occultato anche da una giacca |
| H&K MPK-20 | MTR | 2 | L | P | 4D6+1 (12mm) | 60 | 3/30 | ST | 200 | 775 | Germania, usato dalle milizie |
| H&K MPK-2020 | MTR | 2 | L | P | 4D6+1 (12mm) | 60 | 20 | ST | 200 | 750 | Comune solo in Europa, usato da forze speciali e antiterrostiche H&K MPK-2020 12 mm VP*1/2, danni*2 60 3/30 ST 50 1150 Germania |
| H&K MPK-9 | MTR | 1 | J | C | 2D6+1 (9mmCL) | 35 | 25 | ST | 150 | 520 | In lega leggera con cannocchiale interno, usato da molti solitari europei |
| H&K MPL | MTR | 0 | L | S | 2D6+1 (9mm) | 32 | 32 | ST | 150 | 700? | ST 200 460 Popolare tra le forze le forze legislative e i circoli antiterroristici |
| H&K UMP-45 | MTR | 1/2 | J/L | C | 2D6+2 (.45ACP) | 10/30 | 20 | MA | 100 | 450 | Con manico molto robusto e pieghevole |
| H&K VP 70-M | MTR | 2 | L | P | 2D6+1 (9mm) | 18 | 2/3 | MA | 50 | 500 | Ristretto a 3 colpi di raffica, altrimenti incontrollabile IMI Gandaii MTR PES N E 2D6+3 (10mm) Granate 25mm/10G 35x2 MA ST MA 200 535 “Un nuovo UZI per un nuovo mondo”. In piena raffica è difficile da controllare |
| Ingram M 11 | MTR | -1 | J | S | 2D6+1 (9mmC) | 32 | 60 | ST | 200 | 650? |  |
| Ingram MAC 10 | MTR | -1 | J | S/C | 2D6+2 (.45C) | 30 | 5 | IN | 200 | 225 | Molto piccolo, ustao da polizia e terroristi, può avere silenziatore, difficile da controllare in raffica |
| Ingram MAC 14 | MTR | -2 | L | E | 4D6+1 (12mm) | 20 | 3/10 | ST | 200 | 650 | USA, versione aggiornata del MAC-10, in lega con caricatore cilindrico |
| Ingram Smartgun | MTR | 3 | L | P | 3D6 (11mmCL) | 32 | 20 | ST | 100 | 1100 | L’arma vincente del samurai di strada. Usata da ragazzi e ragazze MA 200 960 Con riduzione al rinculo, facile da usare con una mano |
| KBP PP -90M | MTR | -1 | J/L | S | 2D6+1 (9mm) | 30 | 45 | ST | 200 | 700? | Chiuso come un parallelepipedo si apre in 1 turno 50 ST 200 600? VP*1/4 10/30 3/35 MA 200 795 Capace di penetrare qualsiasi armatura MA 200 839 Costruita con materiali high tech senza manico è occultabile sotto la giacca, piccola, pesante, ma potente Malorian Arms 3600 Super MTR 0/-1 L ? 4D6+2 (.555 auto) 20 1/3 MA 200 3000 |
| Machine Pistol | MTR | -1 | J | C | Vernice/Droghe | 30 | 3/10 | ST | 30 | 425 | Ricorda l’Ingram M-11, la canna corta daà poca precisione Sherman 55G M-15 Ironfist MTR PES -2 L L R R 4D6+1 (.55) Granate 25mm IN ST 1000 Venduta esclusivamente a forze militari e corporative. Con lanciagranate, il .554 è balisticamente uguale al 12mm MA 200 875 Piccola, poco rinculo, molto comoda ST 200 465 Cecoslovacchia, con manico pieghevole SMG Mk III “Interceptor” SMG Mk III “Interceptor” MTR PES N N R R 4D6+1 (12mm) Granade ST ST 1400 Il mitra standard di molte forze imperiali, con lanciagranate |
| Manex Caldaron Special (Elmo’s Edition) | MTR | 2 | J | R | 3D6 (11mm) | 21 | 15 | ST | 100 | 900+ | Versione senza mirino laser, ma con ultrasuoni interno e smartlink. Più pesante |
| Manex SD 88 | MTR | 1 | L | R | 2D6+3 (10 mmCL) | 24 | 3 | ST | 200 | 900 | Militare, con silenziatore |
| Manex SN77 Model | MTR | 1 | L | C | 2D6+3 (10 mm) | 30 | 30 | ST | 150 | 700 | Primo mitra della Manex, nessun equipaggiamento, finito di produrre nel 2017 |
| Manex SN77 Short | MTR | -1 | J | R | 2D6+3 (10mm) | 30 | 30 | ST | 75 | 1300 | Fu un esperimento andato male, fu sospesa la produzione nel 2015, oggi è da collezione |
| Manex STR 88 | MTR | 1 | L | P | 2D6+3 (10mmCL) | 24 | 3 | ST | 200 | 500 | Versione civile del ManexSD88, pericoloso per i principianti |
| Manex XR77 Basic Model | MTR | 2 | N | P | 2D6+3 (10mm) | 50 | 30 | ST | 150 | 1100 | Con mirino laser (+1 PR), con smartlink (+2 PR, 500E$) |
| Manex XR77 EPS | MTR | 0 | J | P | 2D6+3 (10mm) | 32 | 30 | ST | 75 | 975 | Richiesto da guardie del corpo ed agenzie di sicurezza, con mirino laser (+1 PR), con smartlink (+2 PR, 500E$) |
| Manex XR77 Short | MTR | 1 | L | P | 2D6+3 (10mm) | 32 | 30 | ST | 125 | 900 | Usata da mercenari, agenti privati, forze della legge, con mirino laser (+1 PR), con smartlink (+2 PR, 500E$) |
| Mauser 10mm | MTR | 1 | J | P | 2D6+3 (10mm) | 20 | 1/3/5 | MA | 200 | 900? | Mitra realizzato in Germania MA 200 520 Creata per l’uso nei climi tropici o foreste piovose, trattato con componenti chimici che proteggono dall’umidità MA 200 565 Con manico estraibile e mirino telescopico, sostituibile per 120 E$ con uno low light 2D6+2 (.45ACP) 30 20 ST 200 455 In 8 colori, da poter aggiungere silenziatore, mirino, calibro intercambiabile, lanciagranate e kit cambia colori |
| Militech Mini-Gat | MTR | 0 | L | P | 1D6 (.22CL/5mm) | 120 | 40 | ST | 100 | 695 | Svuota tutto in 3 round, a 5 canne, 120 colpi! Militech Ronin “American |
| Militech Ronin “Stealth” Ed. | MTR | 2 | L | P | 5D6 (6mm) | 40 | 40 | ST | 200 | 500 | Piccolo e completamente silenzioso, usato da squadre anti terroristiche Militech Ronin |
| Militech Spoiler | MTR | 1 | L | C | 3D6 (11mmCL) | 30 | 3/15 | ST | 200 | 745 | Mitra comune, gode di ottima fama |
| MILITECH VIPER | MTR | 0 | J | P | 2D6+3 (10mm) | 40 | 30 | MA | 200 | 600 |  |
| MP-103 “Hellblazer” | MTR | 1 | J | R | 2D6+3 (10mm) | 50 | 20 | MA | 50 | 800 | Più corta dell’MP105, le cartucce non sono intercambiabili |
| MP-105 | MTR | 1 | L | R | 2D6+3 (10mm) | 50 | 30 | MA | 50 | 800 | Dal caricatore brutto ed ingombrante, poco usata nelle strade, ma leggera e con tanti colpi MP-105GW MP-105GW MTR PES -1 L/N L/N R R 2D6+3 (10mm) Granata MA MA 1250 1250 Un MP-105 con silenziatore integrato e lanciagranate a canna corta, e con manico da spalla telescopico |
| Mustang Arms ARS -5C | MTR | 1 | J | C | 2D6+3 (10mm) | 40 | 3/40 | MA | 100 | 600 |  |
| Mustang Arms Mouse | MTR | 2 | L | C | 1D6-1 (22SC) | 25 | 1/3/5 | MA | 100 | 950 | Stessi principi della Whisper. Molto silenziosa, con manico retraibile ST 200 295 Non costosa e comune, preferita dalle bande di strada e nel terzo mondo |
| Nova .338 SM-Gun | MTR | 1 | C | C | 3D6 (.338) | 30 | 3/20 | ST | 200 | 640 | USA,la precisione é 0+ smartlink bonus se usato) |
| PARA | MTR | 1 | J | C | 2D6 (9mmUP) | 40 | 20 | MA | 150 | 700 | Maneggevole e compatto PDM MA 12 (UZI MA 12) MTR -1 J L P 2D6+1 (9mmCL) 30 65 IN 50 300 Prodotto dall’UZI, italiano, raffica sorprendente, ma rinculo massimo (R 12) |
| Pistol | MTR | 1 | L | P | 2D6+1 (9mmCL) | 40 | 20 | ST | 150 | 700 | In piena raffica +1 Precisione ST 150 895 Si ripiega completamente su se stesso come una valigetta, difficile da riconoscere. Puo ospitare diversi optional: radio, cellulare… |
| PSA Mk XIV “Aggressor” | MTR | -1 | J | P | 3D6 (11mm) | 26 | 20 | IN | 70 | 800 | Usata da tutte le unita di corporazioni imperiali, dalle guardie del corpo e quelle da combattimento |
| SCK Model 100 | MTR | 3 | L | P | 3D6 (11mmCL) | 30 | 30 | ST | 100 | 1250 | La più usata dalle forze giapponesi, Tokyo MA 200 495 Buona, comoda, con poco rinculo e lunga durata |
| Setsuko-Arasaka PMS | MTR | 1 | L | P | 1D6+2 (7mm) | 40 | 20 | ST | 150 | 1150 | Con smartlink (senza costa 950E$). Per tecnoninja, polizia e militari SGI "Bansidhe" Paintball |
| Sowet Blackhand | MTR | 1 | C | P | 4D6 (4.7mm) | 30 | 2/20 | ST | 200 | 685 | Sud Africa, molto usata dalla polizia africana ST 200 389 Usata da forze urbane, semplice, economica ed efficace |
| Sternmeyer DP11A | MTR | 1 | C | P | 2D6-5D6 (.375P) | 40 | 10-30 | MA | 250 | 2190 | Germania, cdf e calibro puó essere scelto, una carica di batteria permette 150 colpi e costa 300E$ |
| Sternmeyer SMG 21 | MTR | -1/0 | L | E | 3D6 (11mm) | 30 | 3/15 | MA | 200 | 500 | Germania, usato dalle psycho squadre e dai C-Swat team |
| Steyr 988 Personal | MTR | 2 | N | P | 2D6+3 (10mmCL) | 40 | 20 | ST | 200 | 700 | Molto accurato, disponibile con Weapon smartlink(600 E$) e silenziatore (200 E$) 50 ST 200 600? MA 200 615 Disponibile con foregrip, e per 50E$in più con supppresor. Very cool! |
| Steyr TMP 2015 | MTR | 0 | J | P | 3D6 (11mm) | 10/20 | 2/20 | ST | 50 | 800 | Uno dei più potenti machine pistol sul mercato |
| Stolbovoy StS | MTR | -1 | J | C/R | 2D6+3 (10mm) | 35 | 30 | MA | 100 | 600 | Suranam MTR 0 J/ L C 1D6+4 (.177) 25/50 50 IN 150 375 ST 200 875 A forma di pistola, difficile da controllare in piena raffica, si consiglia quella da 3. Anche con manico pieghevole automatico. Ma +1 danno e –1 AFF (proiettili HotLoad) Dream 2000, con proiettili Hot- Load AP |
| Suranam” | MTR | 2 | L | P | 1D6+4 (.177) | 60 | 30 | ST | 200 | 550 | Completamente silenzioso, leggero e facile da tenere, con munizione leggera e mortale |
| Thompson M1 | MTR | 2 | N | S/C | 2D6+2 (.45ACP) | 30/50 | 20 | ST | 200 | 300 | Mitra dell’US Army nella seconda Guerra Mondiale, facile da usare , resistente, affidabile IN 200 125 Molto economica con suppressor, comune tra pirati e varie gangs ST 200 415 Popolare nelle agenzie anti terroristiche e organizzazioni paramilitare, basso costo, grosso |
| UZI Assault 2008 Model 4 | MTR | 3 | L | P | 2D6+1 (9mm) | 50 | 30 | ST | 200 | 550 | Con presa d’assalto, manico pieghevole e copertura COOL! |
| Uzi miniauto 9 | MTR | 1 | J | E | 2D6+1 (9mm) | 30 | 35 | MA | 150 | 475 | Completamente in polimeri plastici, caricatore elettrico rotante e grilletto regolabile UZI Support 2020 MTR PES -1 N N R R 2D6+1 (9mm) Granate 25mm ST MA 200 1200 Con lanciagranate incorporato e mirino laser IR/UV |
| Vanguard Personal Edition | MTR | 2 | J | P | 2D6+3 (10mmRed) | 24 | 30 | ST | 200 | 900 | Completamente silenziosa ed equipaggiata con luci alla moda |
| Vz61 Scorpion | MTR | 2 | J | S/P | 1D6 (25C) | 20 | 25 | MA | 150 | 150 | Il più piccolo mitra militare, 12 Gauge Pistol SHG -2 J/L ? 4D6 (12G) 9 2 ST 50 1000 |

---

## SHOTGUN

| Nome | Tipo | PR | OC | RE | Danni | CL | CD | AF | m | E$ | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 3-A2 | SHG | 2 | N | P | 4D6 (12G) | 10 | 1/10 | MA | 50 | 1000? | Unico nel design. Si può installare un detonatore, in modo che i proiet. Diventino mine (danni*n° proiet. Rimasti*AP) |
| Arasaka R.Assault 12 | SHG | -1 | N | C | 4D6 (12G) | 20 | 2/10 | ST | 50 | 900 | Usato dagli Arasaka, con un potere di fuoco micidiale |
| Assault Shotgun | SHG | -1 | N | P | 4D6 (12G) | 24 | 10 | ST | 50 | 900 | Uno dei primi shotgun civili, copiatoanche dalla ARASAKA con il WCAA Enfield-Ubichi Last Chance SHG 0 J ? 4D6 (12G) 1 1 IN 50 60 |
| Autoloader | SHG | 0 | N | C | 4D6 (12G) | 10 | 2 | ST | 50 | 350 | Verona Beach, con manico pieghevole |
| Benelli M 3 | SHG | 0 | N | S | 4D6 (12G) | 7/9 | 3 | ST | 50 | 700/80 | Anche con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Benelli M1 e M1 Pratical | SHG | 0 | N | S | 4D6 (12G) | 7/9 | 3 | ST | 50 | 600/90 | Con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Benelli M3 Practical | SHG | 0 | N | S | 4D6 (12G) | 9 | 3 | ST | 50 | 700/80 | Anche con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Benelli M3 T | SHG | -2/0 | L/N | S | 4D6 (12G) | 7 | 3 | ST | 50 | 700/80 | Anche con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Benelli Nova | SHG | 0 | N | S | 4D6 (12G) | 5/3 | 1 | MA | 50 | 700? |  |
| Berretta M 3 P | SHG | -2/0 | L/N | S | 4D6 (12G) | 5 | 3 | ST | 50 | 700? | Solo con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Castech Argus | SHG | 0 | N | C | 4D6 (12G) | 10 | 2 | ST | 50 | 450 | Funzionante e modificabile, con (con mirino laser) (con smart link) (pieghevole) SHG SHG SHG -1 N N L C C C ST ST ST mirino laser, smart link, con manico pieghevole (quando piegato, OCC=L) |
| CAWS | SHG | 0 | N | S/R | 4D6 (12G) | 10 | 10 | ST | 50 | 500 | Con mirino telescopico, progettato negli scontri in centri abitati. Arma antisommossa CCMMC Qi-15 SHG -2 N ? 4D6 (12G) 15 2/10 ST 50 150 Constitution Arms 2e-SS |
| Franchi "Gendarme" | SHG | 0 | N | E | 5D6 (10G) | 5 | 1 | MA | 50 | 435 | Disegnato per poliziotti, senza difetti |
| Franchi King Buck | SHG | -1 | N | P | 6D6 (10Gmag) | 4 | 2/4 | MA | 50 | 800 | Italia, 7KG, a 4 canne, da collezione |
| Franchi P16 | SHG | 1 | L | R | 4D6 (12G) | 20 | 2/10 | ST | 50 | 980 |  |
| Franchi SPAS 12 | SHG | -2/0 | L/N | S | 4D6 (12G) | 7 | 2 | MA | 50 | 700 | Solo con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Franchi SPAS 15 | SHG | 2 | N | P | 4D6 (12G) | 10 | 1 | MA | 50 | 875 | Usato in città, con manico pieghevole che semiautomatico, con muniz. Normali è un ottimo shotgun |
| Gun | SHG | 1 | N | P | 4D6 (12G) | 8 | 2 | ST | 50 | 900 | Miglior shotgun sul mercato, efficace in ogni clima |
| Gunpod | SHG | -1 | N | P | 5D6 (10G) | 18 | 3 | ST | 50 | 700 | Riduzione al rinculo, si piega in 2 (OCC=L se piegato). Se modificato +1 PR in piena raffica Constitution Arms |
| H&K CAWS 11 | SHG | 1 | N | R | 4D6 (12G) | 30 | 10 | ST | 50 | 800 |  |
| H&K ORC | SHG | 1 | L | C | 4D6 (12G) | 6 | 1 | MA | 50 | 800? | Simile all’H&K Goblin, piccolo da mettere sotto cappotto trench |
| Hurricane | SHG | 0 | N | P | 4D6 (12G) | 40 | 4/20 | ST | 70 | 1000 | Constitution Arms SB12 |
| Ithaca Stakeout | SHG | -2 | L | S | 4D6 (12G) | 4 | 1 | MA | 50 | 350 | Solo con manico pieghevole, -2PR, allungarlo costa 1 turno |
| Machine Gun | SHG | 1 | L | P | 3D6 (5.7mm) | 40 | 20 | ST | 200 | 950 | Molto leggero e con molto rinculo Manex Mikado Short Version (mirino laser) Manex Mikado Short Version (smartlink) SHG SHG L L P P 4D6 (12G) 15 2/3 2/3 ST ST 1200 Alta portata e facilità d’uso, in versione standard o piccola, con smartlink o mirino laser Manex Mikado Standard Edition (mirino laser) Manex Mikado Standard Edition (smartlink) SHG SHG N N P P 4D6 (12G) 15 2/3 2/3 ST ST 1250 Alta portata e facilità d’uso, in versione standard o piccola, con smartlink o mirino laser Manex Overlord Short Version (mirino laser) Manex Overlord Short Version (smartlink) SHG SHG L L P P 4D6 (12G) 6 MA MA Shotgun d’assalto urbano, in versione piccola e standard, con smrtlink o mirino laser Manex Overlord Standard Edition (mirino laser) Manex Overlord Standard Edition (smartlink) SHG SHG N N P P 4D6 (12G) 10 MA MA 1000 Shotgun d’assalto urbano, in versione piccola e standard, con smrtlink o mirino laser |
| MetaCorp Warhammer | SHG | -1 | N | P | 4D6+2 (12Gmag) | 16 | 1/3 | MA | 75 | 700 |  |
| Militech "Sasquatch" | SHG | 0 | N | P | 4D6 (12G) | 18 | 1/8 | MA | 50 | 915 | Simile all’arasaka AS-20. Un mostro da combattimento |
| Militech ASG -16D | SHG | 2 | N | C | 4D6 (12G) | 16 | 1 | MA | 50 | 645 | SudAfricano, più usato con cartucce miste 3D6AP/2D6EXPL 21 3/10 ST 50 1000 Doppietta a canna liscia |
| Militech Crusher SSG | SHG | -1/-3 | J | C | 3D6 (20G) | 6 | 2 | ST | 10/25 | 450 | Per scontri ravvicinati, -2 PR a 2metri e –3 PR a 25metri, anche per i danni |
| Militech M 12 | SHG | 0 | N | P | 4D6 (12G) | 20 | 3/10 | MA | 50 | 950 |  |
| Militech Military/Police | SHG | 0/-1 | N/L | C | 4D6 (12G) | 8 | 2 | ST | 50 | 300 | Per polizia e militari, con manico pieghevole |
| Mossberg "Nellie" | SHG | 1 | L | C | 4D6 (12G) | 6 | 1/3/6 | MA | 50 | 650 | Anche con 10 clp. Usato sia da guardie carcerarie che bande di strada Mossberg CMDT Combat |
| Mossberg M590 A1 | SHG | 0 | L | S | 4D6 (12G) | 8 | 1 | MA | 50 | 700? |  |
| Multi_Paintball Scatter Gun | SHG | 0 | L | C | Vernice/Droghe | 5 | 2 | ST | 40 | 400 | Aria compressa |
| Mustang Arms Raider | SHG | 0 | L/N | C | 4D6 (12G) | 5/9 | 2 | ST | 50 | 400 |  |
| Neostead | SHG | 0 | L | S | 4D6 (12G) | 12 | 1 | ST | 50 | 700? | Solo con manico pieghevole, -2PR, allungarlo costa 1 turno Pancor Jackhammer Mark |
| Remington 870 | SHG | 0 | N | S | 4D6 (12G) | 7 | 1 | MA | 50 | 700? |  |
| Remington 870 Maverick | SHG | -2/0 | L/N | S | 4D6 (12G) | 7 | 1 | MA | 50 | 700? | Solo con manico pieghevole, -2PR, allungarlo costa 1 turno e FSAPDS, per perforare veicoli o altri obiettivi con leggero VP |
| Seburo "Sparta" | SHG | 2 | N | P | 5D6 (10G) | 10 | 1/3 | MA | 50 | 875 | Primo shotgun della Seburo, spara proiet. 10G shells SGI “Manitou” |
| Shotgun Blast | SHG | 0 | N | P | 4D6 (12G) | 20 | 2 | ST | 50 | 900 | Per combattimenti ravvicinati |
| Sternmeyer Stakeout 10 | SHG | -2 | L | R | 4D6 (12G) | 10 | 2 | ST | 50 | 450 | Arma leggera adottata da molti dipartimenti di polizia |
| Super Shotgun | SHG | 0 | N | R | 5D6 (10G) | 3 | 1 | ST | 50 | 1500 | Spara due colpi a round (2 canne). Rinculo è 7,5 Sword "LongSword" |
| The GONG | SHG | 0 | L | C | 5D6 (10G) | 6 | 1 | MA | 60 | 1500 | Spara capsule al napalm, usata contro fanteria leggera Tsunami Arms Helix SHG 0 N ? 4D6 (12G) 60 43 MA 50 3000 6D6 (12GET) 40 2/20 MA 70 4500 Usa anche munizioni CAWS |
| Win. 1300 Def. Occultabile | SHG | -2 | L | S | 4D6 (12G) | 7/8 | 1 | MA | 50 | 700? |  |
| Winchester 1300 Defender | SHG | 0 | N | S | 4D6 (12G) | 5/8 | 1 | MA | 50 | 450 | Anche con manico pieghevole, |

---

## ARMI PESANTI

| Nome | Tipo | PR | OC | RE | Danni | CL | CD | AF | m | E$ | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| .50 M2HB QCB | PES | 0 | N | S | 6D10 (.50BMG) | Belt | 30 | MA | 600 | 3000? | Solo su veicoli o fisso a terra, a nastro Arasaka WXA C.A.W. PES 0 N ? 6D6+2 (.308 Winch) 500 20 MA 500 3000 Arasaka X-61 (prototype) PES 4 N VR 5D10 (clp1.5cm) 10 1 P 84375 Railgun molto raro, ogni 20 round di fuoco va ricaricato, molto pericolosa da usare. Ha smartchip e un device di lock. Nel disattivarlo c’è il rischio che l’arma esplodi |
| 20mm | PES | 0 | N | R | 4D10 (20mm) | 10 | 1 | MA | 450 | 2000 | Cannone lungo quasi 2m spara proiettili di uranio impoverito a velocità supersonica Cannoncino Skerrit 5.56mm PES 1 N ? 5D6 (5.56N) 100 10 ST 450 1200 Cannoncino su veicoli Cannoncino Skerrit 7.62mm PES 0 N ? 6D6+2 (7.6N) 100 10 MA 500 1500 Cannoncino su veicoli |
| Arasaka"Barrage" | PES | 2 | N | P | 5D6 (5.56NCL) | 200 | 3/30 | MA | 400 | 2450 | Minigun portatile che spara a 600rpm. Si raccomanda un aggancio per la spalla, o girostabilizzatori per il tronco belt 1/20 ST 400 2200 Scelta dai militari, con mirino laser e riduzione al rinculo,+1 PR in piena raffica |
| ARG-17 | PES | 2 | N | R | 6D10 | 11 | 2 | MA | 500 | 6750 | Combina l’RPGA con il drum e una buona tecnica. E’ quasi perfetto, prezzo a parte |
| Armalite M60-D | PES | -1 | N | C | 6D6+2 (7.6N) | 100 | 2/20 | MA | 500 | 5000? | Americano, 110cm, anche con 7.62N(5D6+2) nella vecchia serie Barrett-Arasaka Light |
| Automatico | PES | 0 | N | R | 6D6 (7.62N) | 200 | 20 | ST | 200 | 12000? | Mont ato su veicoli (Dune - Buggy) |
| B | PES | 1 | N | R | 6D6+2 (.308 Winch) | Belt | 35 | MA | 500 | 2500 | A nastro Towa Type 20 Advanced Combat PES 2 N P 5D6 (5.56N) Granate 40mm MA 400 5000? Giappone, 112cm, con bipod, smartlink, e minilanciagranate, uso militare (fanteria) Towa Type -8 Medium |
| CETME Ameli | PES | -1 | N | S | 5D6 (5.56N) | Belt | 50 | ST | 400 | 3000? | A nastro |
| Colt M70 Minigun | PES | 0 | N | R | 6D6+2 (7.6N) | 160 | 20/40 | MA | 250 | 5000? | Per COS grandi, 4 canne, 1 round per sparare l’intera raffica altrimenti solo 20 clp. Militare, americano 110cm 1/10 MA 500 1230 Usata dalle comunità nomadi, con aggancio per braccio, smartlink VP*1/4 8 1 ST 600 3050 Per prenderla COS>15 o 1D6/3 danni al braccio, con mirino 4x, pesa 23KG Constitution Arms Deluge |
| Costitutional Arms Cyclone | PES | 1 | N | P | 6D6+2 (7.6N) | 100 | 35 | MA | 500 | 1200 | Americano, 102cm, militare, con mirino(bipod) Fabrica de Armes |
| Crown Control | PES | 0 | N | P | 1D2+droghe | 400 | 35 | ST | 60 | 800 | A nastro |
| FN M3P e M3M | PES | 0 | N | S | 6D10 (.50BMG) | Belt | 35 | MA | 600 | 3000? | Solo su veicoli o fisso a terra, a nastro belt 2/20 MA 400 3000 Arma leggera usata dai militari e possibile sui veicoli, con mirino laser e riduzione al rinculo,+1 PR in piena raffica 30 MA 500 6000? Belgio, 128cm, militare, disponibile sia con 100 o 250 clp e in 7.62N o 7.62C |
| FN MG6 | PES | 1 | N | P | 5D6 (5.56N) | 100 | 40 | MA | 450 | 1800 | A nastro |
| FN Minimi ( M249) | PES | -1 | N | S | 5D6 (5.56N) | Belt | 50 | ST | 400 | 3000? | Usa caricatori M16 |
| GE M-214 Minigun | PES | 3 | N | R | 5D6 (5.56NCL) | 500 | 3/200 | MA | 400 | 5375 | Semplice minigun |
| Gun | PES | 1/-1 | N | C | 5D6/6D6+2 (7.62C) | 75 | 3/15 | MA | 450 | 800 | Russia, 95cm, militare, disponibile in 7.62C o 7.62S, caricatore cilindrico fotoni |
| Gun | PES | 1 | N | P | 5D6 (5.56N) | 100 | 10 | MA | 450 | 3000? | Corea, 110cm, militare Towa Manufactoring Type |
| H&K G-6 Advanced Squad | PES | 1 | N | P | 5D6 (6mmC) | 100 | 3/30 | MA | 450 | 6000? | Germania, 115cm, con mirino telescopico passi vo agli IR, militare |
| H&K HK 21E | PES | 1 | N | S | 6D6+2 (.308 Winch) | Belt | 50 | MA | 500 | 3000? | A nastro |
| H&K HK 23E | PES | 1 | N | S | 5D6 (5.56N) | Belt | 50 | MA | 400 | 3000? | A nastro |
| H&K HK11E | PES | 1 | N | P | 6D6+2 (7.6N) | 30/50 | 20 | ST | 400 | 3000? | Light Machine Gun con cambia canna rapido |
| H&K HK13E | PES | 1 | N | P | 5D6 (5.56N) | 30 | 20 | ST | 400 | 3000? | Può usare caricatori sia dell’M16 che dell’ H&K 33 |
| H&K HK21E | PES | 1 | N | P | 6D6+2 (7.6N) | Belt | 25 | ST | 400 | 5000? | Usata da forze europee, cambio canna rapido, con cinghia metallica DMI o DM6(M60) |
| H&K HK23E | PES | 1 | N | C | 5D6 (5.56N) | Belt | 25 | ST | 400 | 3000? | Lungo 40 pollici, con manico fisso |
| H&K HKG-6 | PES | 1 | N | P | 5D6 (6mmCL) | 100 | 30 | MA | 450 | 2050 | Interfaccia intelligente e mirino telescopico 2x e IR H&K MPHK54 Tojima MA 400 2000? Dalla canna corta e manico retraibile, simile all’MP20000 migliorata, grande come una pistola. Non più di 10 a negozio conosciuto |
| Hughes 5.56 Minigun | PES | 1 | N | P | 5D6 (6mmC) | 500 | 100 | MA | 450 | 12000? | Americano, 115cm, molto ustao su veicoli o treppiedi, militare, disponibile con 500 o 1000 clp, a nastro |
| Hughes Rocket Rifle | PES | -1 | N | R | 4D10 (18mmHEAT) | 3 | 1 | ST | 500 | 750 |  |
| Hyper Blaster | PES | 1 | N | R | 2D10 | 100 | 50 | IN | 300 | 10000 | Chaingun ad energia, ricaricabile a 2750 E$ Kalashnikov RPK Machine |
| M 60D MachineGun | PES | 1 | N | P | 6D6+2 (7.6N) | 100 | 20 | MA | 500 | 1000 | A nastro |
| M-2012 HB SAW | PES | 2 | N | P | 5D6+3 (6.5mm) | 100 | 3/30 | MA | 450 | 1600 | Argentina, 126cm, militare con mirino laser e bipod FN Browning MG-6 "One |
| M2A5HB Browning | PES | 0 | N | P | 6D10 (12.7mm) | 100 | 10 | MA | 600 | 2000 | A nastro |
| M60E3 e M60E4 | PES | 0 | N | S | 6D6+2 (.308 Winch) | Belt | 30 | ST | 500 | 3000? | A nastro per grandi sommergibili |
| Machine Gun | PES | 1 | N | P | 6D6+2 (7.6N) | 100 | 3/35 | MA | 500 | 2500 | Giappone, 126cm, con 200 o mirino telescopico, ha anche uno shotgun sottocanna a colpo singolo Calico Light Grenade Launcher PES 0 Granata 25mm 2 2 ST 150 Illegale Lanciagranate per il Calico Light Castech Grenade turno /ST 200 E$ e deve essere installato da un tecnico (50E$). Il range di 150 metri è per le granate da un tecnico (50E$). Il range di 150 metri è per le granate lanciatore di rocket a colpo singolo. Tutti gli optional disponibili H&K MP-11 L Grenade MP-11 L Lanciagranate 25mm PES 1 N ? Granata 1 1 MA 250 1700 Lanciagranate leggero, su veicolo Lanciagranate Militech |
| MG 3 – MG 42/59 | PES | -1 | N | S | 6D6+2 (.308 Winch) | Belt | 50 | ST | 500 | 3000? | A nastro |
| Militech ABR-78 | PES | 1 | N | P | 9D10 (30mm) | 10 | 1 | ST | 1000 | 1600 | Standard con bipod, per chi ha COS>=14 da 0-160m (PR=0,1/3 danni) da 160m+ 5 1 ST 1600 6000 COS>15 per prenderla, o 1D6/2 danni al braccio. Senza esoscheletro BETA 1D6/2 danni Molto illegale (1 colpo 100E$) (PR=1, danni max) 20 MA 400 1000 A nastro Militech M-232 Squad 3/20 MA 550 3000? Americano, 125cm, militare, disponibile in 30 clp o 100 clp(a nastro) |
| Mitragliatore 12.7mm | PES | 0 | N | R | 6D10 (12.7mm) | 100 | 10 | MA | 600 | 2000 | Per veicoli, contro esoscheletri |
| Mitragliatore 14.5mm | PES | 0 | N | R | 7D10 (14.5mm) | 100 | 10 | MA | 500 | 2500 | Per veicoli, devastante! |
| Mitragliatore 20mm | PES | -1 | N | R | 4D10 (20mm /.50) | 200 | 10 | ST | 400 | 8000? | Montata su veicoli Mitragliatore PES |
| Mitragliatrice 7.62 | PES | 0 | N | R | 6D6+2 (7.6N) | 500 | 20 | ST | 200 | 3000? | Coassiale, montata sul davanti dei veicoli (7.62x54USSR) Belt 40 ST 500 3000? Come 30-06 Spg. 20/ ST 150 4000 A doppia canna, non spara a colpo singolo o 3 colpi. In raffica di 40, -1 AFF ad ogni round, per surriscaldamento. 10 KG. Con fissatura alla spalla e fianco (VP*1/4, danni*1/2) 5 1/2 ST 1500 11370 Ad energia cinetica, MOV-1, ingombro+1, pesa 35KG, solo COS>11. Solo per C-Swat, milizie, anche su veicoli, illegale L’unità per i clp (+carica) costa 1200E$, 1 rnd di pausa ogni clp S&W HM "Happy Meat" PES 1 N R 4D6+3PA+1D6 Granata 40mm 3/30 MA 600 3000? Olanda, 122cm, spara proiettili e granate ad alta raffica, militare |
| on One" | PES | 1 | N | R | 5D6 (5.56N) | 100 | 30 | MA | 450 | 3000? | Belgio, 133cm, militare, a nastro |
| Sig 710 | PES | 0 | N | S | 6D6+2 (.308 Winch) | Belt | 50 | ST | 500 | 3000? | A nastro |
| Sternmeyer HIW-34 | PES | 3 | N | C | 6D6+2 (7.6N) | 100 | 1/20 | ST | 500 | 1185 | Con bipod, per buttare giù eserciti, mentre si avanza ST 500 1185 Ha caricatore da 50 ma può essere anche a nastro |
| Sternmeyer M-5A SAW | PES | -1 | N | R | 6D6+2 (7.6N) | 200 | 3/20 | MA | 400 | 3000?/ | 1000 Germania, 114cm, militare con 200 clp a nastro belt 1/10 ST 400 4200 Con mirino laser e riduzione al rinculo,+1 PR in piena raffica Granata 40mm MA 350 900 Americano, 94cm. Solitamente usato su veicoli o treppiedi. Più di 10Kg, a doppia canna, con lanciagranate, militare (fanteria) Sungun 5.56 Ligth Machine |

---

## LANCIAGRANATE

| Nome | Tipo | PR | OC | RE | Danni | CL | CD | AF | m | E$ | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Arms RP | PES | -2 | N | R | 6D10 | 1 | 1 | MA | 1000 | 1500 | Spalleggiabile, con propulsore a razzo, usato nelle guerre centro americane montare sul Manex Gren. Rifle |
| Granata | GRA | 0 | P | P | Vario | 1 | 1 | MA | Lancio | 30 |  |
| Granata ANTI-UOMO | GRA | 0 | P | P | 6D6 | 1 | 1 | ST | Lancio | 200 | Mina posizionale Electronic 10metri di raggio 1 1 ST Lancio 200/ Blocca congegni cibernetici, cancella dati dai chip, crea disorientamento, fonde in 5sec (non esplode) Militech PDU-3 Multip. EXP 0 P P 2D6+5 1 1 ST 2.5 blast 150/ unità Per difesa di un perimetro, si attacca alle pareti. Con scheda di ritardo esplosione, sensori passivi agli IR Mina Limpet EXP 0 L P 8D10 1 1 MA NO 600 Mina antinave che si attacca con un magnete con timer elettrico, anche per veicoli, aircraft ed edifici Mine (tutti i tipi) EXP 0 J P 4D10 1 1 MA NO 350 Mine, possono essere fatte detonare con timer, via filo, con impulsi elettrici o sensori di movimento anti-IR, dura 5 rnd 1 1 MA Lancio 70 Ha 6 secondi di ritardo AGM-91 Hellfire PES 18* N R Missile AGM -91 1 1 MA 3000 10000 Su elicotteri o flyer, contro esoscheletri AGM-94 Milan-C PES 15* N R Missile AGM -94 1 1 MA 2500 3500 Su veicoli terrestri, contro esoscheletri o veicoli AIM-120 AAMRAM PES 21* N R Missile AIM-120 2 1 MA 80000 20000 Installato a terra, attacca bersagli in volo (1800m/round) AIM-9X Sidewinder Beta PES 15* N R Missile AIM-9X 4 1 MA 15000 5000 Contiene 4 missili AIM-9X, contro veicoli o velivoli |
| Militech Minilanciagranate | PES | 1 | L | P | Minigranata | 4 | 2 | ST | 50 | 255 | Anche proiettili per shotgun |
| Militech Minilanciagranate | PES | 0 | N | P | Minigranata | 16 | 2 | ST | 50 | 475 | Anche proiettili per shotgun Militech Minilanciagranate PES -1 L N C P Minigranata/ 10G ST ST 100 255 Può usare sia minigranate che proiettili 10G leggeri che pesanti Rostovic Wrist Racate PES PST 0 N P 5D6 (30mmHE) 6 3 ST/ P 400 380 Montato solo su cyberbraccio, 5D6*3m, 6 rocket a 200E$ Samson Signal Pistol PES PST -2 J P Minigranata 25mm 1 1 ST 100 425 Pistola segnalatrice che lancia minigranate da 25mm THOMPSON 40mm PES 1 N ? Granata 1 1 MA 250 2500 Montato su veicoli MINE E GRANATE DA LANCIO (10*COS) fatta in casa Borsa Esplosiva EXP 0 N P 8D10 * 10 m (1KG C6) 1 1 MA Lancio 7* COS 200 Si lancia la borsa e BOOM! Contiene 1 KG di C6, anche con radiodetonatore Esplosivo al plastico C-6 EXP 0 P P 8D10/kg 1 1 MA NO 100/kg In blocchetti plastici grigi, può essere fatto detonare con timer, via filo, o con impulsi a distanza (HE/Frag) 1 1 ST Lancio 65 Si armano spingendo un bottone ed in 6 sec. BOOM! +2Atletica FEN DZ 25 DetCard EXP 1 P P 1D10 High Energy 1 1 ST 0.25 120 Spezzi la card ed esplode in 20 secondi 5m diametro 1 1 MA Lancio 40 Concussione che stordisce per 1D10 min., vetri rotti fino a 10m (HE/Frag) 1 1 MA Lancio 40 Piccola, da lancio |

---

## LANCIAMISSILI

| Nome | Tipo | PR | OC | RE | Danni | CL | CD | AF | m | E$ | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| CYBERLIMB Launcher | PES | 2 | N | P | Micromissile | 4 | 2 | IN | 200 | 900 | Lanciamicromissili Lancia Cruise Missile PES 25* N R Cruise Missile 1 1 MA 3000 km 150000 |
| Lanciamissili Scorpion 16 | PES | -1 | N | R | 7D10 | 1 | 1 | MA | 1000 | 3000 | Terza generazione dello Stinger, spalleggiabile PES 2 L * P P 4D6 HEAT Micromissile ST 200 900 Spara missili autoguidati, come quello per cyberbraccio, anche versione da montare su cyber braccio altre armi |

---

## MM-POD

| Nome | Tipo | PR | OC | RE | Danni | CL | CD | AF | m | E$ | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Nova Arms "Joe" | PES | 3 | N | P | 11D10(AP Heat) | 1 | 1 | ST | 300 | 1800 | Spara RPG (Rockets 66mm) 4 1 MA 400 2550 Non usare in combattimenti ravvicinati |
| SGML-11 | PES | 2 | N | P | Warhead | 6 | 1 | MA | 200 | 1100 | Spara warheads, con rinculo basso.Ottimo anche in orbita |
| Stinger 4 Rocket Launcher | PES | 4 | N | R | 6D10 | 1 | 1 | MA | 400 | 2000 | Da terra, spara rockets |
| Towa Type 54 | PES | 4 | N | R | 6D10 | 1 | 1 | MA | 400 | 1400 | Lancia dei rocket esplosione, su veicoli |

---

## LANCIARAZZI

| Nome | Tipo | PR | OC | RE | Danni | CL | CD | AF | m | E$ | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Moffin Inc. BAAL | PES | -1 | N | R | 9D10 | 1 | 1 | MA | 1000 | 3500 | Lanciarazzi antisommossa. Poco maneggevole, efficace contro esoscheletri contro veicoli o esoscheletri Km 500000 Su veicoli a terra od in mare, max 2500 tonnellate, terrificante ! 10m, guidati, 3% perdere target, 2 chance per colpire (se 1D10>4) SGML-11, banda di colore blu, VP*1/2 Km 150000 Missile potentissimo terra, aria, mare di incredibile velocità, necessità di coordinate precise SGML-11, banda di colore rossa Hammerstrike (missile veicoli, il radar è difettoso con nebbia e smog Harpoon II Anti-Ship Km 21000 Famoso missile antinave guidato per mezzi terra, aria, mare sottomarine, 160km/ora, può essere guidato (20*colpire SGML-11, no VP e VP–2, nessun VP potrà salvarvi 10m, guidati, 3% perdere target, 2 chance per colpire (se 1D10>4) 130km/ora, può essere guidato (15*colpire, 2250E$) essere guidato (15*colpire, 5250E$) 10m, guidati, 3% perdere target, 2 chance per colpire (se 1D10>4) Missile TOW PES 15* N R 6D10 1 1 ST 1000 800 Montato su torretta, per veicoli, colpisce nel 75%, Armi Pes>15 Missile AGM -91 PES 18* N R 20D10 AP * 4m 1 1 MA 3000 10000 Autoguidato (750m/round) Missile AGM -94 PES 15* N R 12D10 AP * 4m 1 1 MA 2500 2500 Autoguidato (750m/round) Missile AIM-120 PES 21* N R 17D10 AP * 10m 1 1 MA 80000 250000 Su flyer, anche senza lanciamissile (1800m/round) Missile AIM-9X PES 15* N R 15D10 AP * 6m 1 1 MA 15000 15000 Autoguidato, su velivoli anche senza lanciamissile 6D10/2*3m 1 1 MA 500 250 9D10/2*4m 1 1 MA 750 1500 |

---

## LANCIAFIAMME

| Nome | Tipo | PR | OC | RE | Danni | CL | CD | AF | m | E$ | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Dai Lung FD1 | PES | 3 | N | P | Special (fiamma) | 2min. | 2min. | ST | 50 | 395 | Lanciafiamme non molto affidabile, ma economico |
| Lanciafiamme KAF-253 | PES | -2 | N | R | 2D10 | 10 | 1 | ST | 50 | 1500 | Spruzza napalm liquido, viene montato sulle spalle, ingombrante |
| Militech "Burn" | PES | 3 | L | P | Special (fiamma) | 1min. | 1min. | MA | 50 | 885 | Lanciafiamme al napalm, con |

---

## ARMI ESOTICHE

| Nome | Tipo | PR | OC | RE | Danni | CL | CD | AF | m | E$ | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| “Hammerhead” Slamglove | EXO | 5 | L | P | 4D6 | 6 | 1 | ST | 0/10 | 550 | Si fissa all’avambraccio, si usa nei combattimenti corpo a corpo sott’acqua, 10m fuori dall’acqua Arasaka HMWBW -12 EXO PES 2 N R Microonde 1 1 MA 150 12590 Disattiva l’elettronica di un obiettivo anche se schermato fino a 150m, a microonde, deve essere ricaricato per 12 ore dopo ogni uso, ad una speciale batteria |
| “Lancer” Boomstick | EXO | 5 | N | P | 4D6 | 10 | 1 | ST | 0/10 | 700 | Fatta per difesa dagli squali, per combattimenti ravvicinati sott’ acqua, 10m fuori dall’acqua Kendachi Dragon EXO PES 0 J P 2D6*2persone 1° rnd VP<15 1D6*1persona 2° rnd VP<15 4 1 ST 4 660 L’armatura scende di 2 livelli, solo se il VP<15. Va attivata 1 rnd prima (20) 200 Per alte profondità marine, 20m fuori dall’acqua, 10 colpi 30E$ Militech Electronics Taser EXO PST 1 J C Stordimento 10 1 ST 10 60 Piccolo come una lampadina tascabile |
| “Stryker” | EXO | -1 | N | C | 3D6+3 | 12 | 1 | MA | 50 | 220 | In polimeri plastici e lega leggera (1metro)*40min 1 1 IN Lancio 100 Bomba che esplode e blocca, divincolarsi>25, forza>30. (tubo per sbloccarsi 25E$, 10 usi) Bloody Card EXO -1\-3 P R 1D6+3 NO NO MA Tocco 200 Qualsiasi carta (credito, Trauma Team…) c on bordi affilatissimi, che possono essere rimossi Cannone Laser Militech Electronics EXO FCL 0 N R 1-5D6 10 2 IN 200 8000 Arma speciale militare, non si vede in circolazione |
| 20mm Torp Gun | EXO | 2 | L | P | 5D6 | 6 | 2 | MA | 100 | 1200 | Spara torpedi, si armano dopo 5m e hanno 2 possibilità per colpire, 10m/sec, 1m raggio Avante P-1135 ad Aghi EXO PST 0 P P Droga 15 2 ST 40 200 Molto leggera, in polimeri, può essere alimentata anche con gas, veleni, etc. Balestra Eagletech |
| A Real 2Bastard" Sword | EXO | -2 | L | R | 2D6+2 | 1 | 1 | IN | 3 | 260 | E’ una piccola spada o un grosso coltello, spingendo un bottone può essere lanciata con Atletica Anderson Sea Technology |
| Arco EagleTech “Tomcat” | EXO | 0 | N | C | 4D6 | 12 | 1 | MA | 150 | 150 | Stabilizzato e dotato di giroscopi di bilanciamento. Silenzioso e micidilae Armscor “Sea Viper II” |
| CIA Cigarette | EXO | -2 | P | R | 1D6 (.22CL) | 1 | 1 | ST | 3 | 50 | Sigaretta che spara un colpo stringendo il filtro con i denti, o le dita diff., ricarica costa 10/20 per dose, qualsiasi droga, al tocco |
| Eagletech "Nighthawk" | EXO | 3 | N | R | 4D6 (bolt) | 1 | 1 | MA | 50 | 250 | Balestra con mirino telescopico |
| Eagletech "Panther" | EXO | 1 | N | R | 4D6 (bolt) | 1 | 1 | MA | 50 | 195 | Balestra EagleTech Enertex AKM a Spruzzo EXO PST -2 J C Droga 50 1 MA 10 15 Pistola a spruzzo, come quelle ad acqua |
| Fiocina | EXO | -2 | N | C | 2D6 | 3 | 1 | MA | 10 | 250 | Fiocina fucile per sub Gleason Hydrotech |
| Nauseator Riot Control | EXO | 0 | N | P | Ultrasuoni (stun) | 10 | 1 | ST | 15/25 | 1900 | COS>25 per evitare confusione e –4 a tutte le azioni * 1D6 rnd, altrimenti se COS>22(RIF e MOV a –1 * 1D6 rnd), o stun * 1D6min. Generatore di campo (0.6*1.7m) Nelspot “Wombat” EXO PST -1 J C Droga 20 2 IN 40 200 Arma infernale, spara palle piene d’acido, tintura, droga o veleno. Ad aria compressa (20) 40 Per difesa dagli squali, 20m quando fuori dall’acqua, 6 colpi 10E$ Pursuit Security WEBGUN EXO FCL 1 N C Ragnatela (COS e RIF >30) 1 1 ST 30 250 Con mirino ottico, se entrambi i tiri falliscono blocca e RIF*1/2, se solo 1 fallisce blocca * 10- (COS o RIF)min. Può essere tagliato da una spada. Con 100E$ rete al taser (20) Raven Crossbow EXO 2 N\L E/R 2D6+2 frecce C6 (2D10) 6 1 MA 150 5000 Autoricaricante con bottone per piegarla -OCC.Molto silenzioso Può usare frecce esplosive al C6, con detonazione all’impatto o dopo 1sec (100E$/freccia) affilato RIF+Atl>11, lancio è COS*10 TorpGun Segoyovich KR-3 30mm 5m e hanno 2 possibilità per colpire, 10m/sec, 1m raggio, Russo |
| Skunker | EXO | -1 | P | E | Gas | 4 | 1 | MA | 2 | 70 | Fino a 4 dosi di gas non letale. Solo 1 target, 6*1 pollici, in 6 colori. Per 5/10E$, il gas può essere alterato (stench bomb) (TS stun * 10 min) 12 1 MA 2 300 Comune nello spazio (-1 penalizzazione) 4 2 MA Tocco 100 Scarica da 15.000 Volt! Stun –1 Taser MITSUBISHI EXO PST 0 J C flech 1D6/3+scarica, TS (molto difficile) 12 1 ST 5 400 Ottimo nello spazio. Ha un dardo con filo, se non stordito (2D10min), RIF/2 e FRE /2 nel portafoglio NO NO MA 2 65 Contro i ladri da portafoglio, dopo 2m, il ladro deve fare COS molto diff. Per tenere l’oggetto. Chip a distanza nella persona (TS stun*10min) 6 1 ST Tocco 90 Guanto con stessi effetti di un taser Techtronica 15 Microonde EXO PST 0 J P 1D6 10 2 MA 20 400 Proiettore di microonde grande quanto una torcia elettrica U-B Microwavers EXO 0 dipen de P 1D6 4 2 ST 20 500 Da montare sotto la canna di fucili e mitra, un power pack costa 250E$ e raddoppia i clp e pesa 4KG |

---

## ARMI BIANCHE

| Nome | Tipo | PR | OC | RE | Danni | CL | CD | AF | m | E$ | Note |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 3/6 | BNC | 0 | N | C | 3D6+2 | NO | NO | MA | 2/3 | 150 |  |
| A Real 2Bastard Sword | BNC | 0 | L | R | 2D6+2 | NO | NO | IN | 3 | 260 | E’ una piccola spada o un grosso coltello, spingendo un bottone può essere lanciata con Atletica |
| Ba Zhang Shuang Dao (daga) | BNC | 0 | L | C | 1D6 | NO | NO | MA | 1 | 45 |  |
| Bagn Nakhs | BNC | 2 | P | P | 1D3 | NO | NO | MA | 1 | 15 |  |
| Ball and Chain (palla e catena) | BNC | -1 | J | P | 2D6 | NO | NO | MA | 1 | 150 |  |
| Baseball Bat (mazza da baseball) | BNC | 1 | L | C | 2D6-1 | NO | NO | MA | 1 | 20 |  |
| Bastard Sword (spada bastarda) | BNC | 0 | N | P | 3D6 | NO | NO | MA | 1 | 550 |  |
| Battle Axe (ascia da battaglia) | BNC | -1 | N | R | 2D6+3 | NO | NO | MA | 2 | 100 |  |
| Beer Bottle (bottiglia di birra) | BNC | 0 | P | C | 1D3 | NO | NO | IN | Lancio | 1-5 |  |
| Beer Bottlle -Broken (rotta) | BNC | -1 | P | C | 1D3+1 | NO | NO | IN | 1 | Gratis |  |
| Beer Stein (boccale di birra) | BNC | -1 | J | C | 1D6-1 | NO | NO | MA | 1 | 10 |  |
| Billy Club/Truncheon (manganello) | BNC | 0 | L | P | 1D6 | NO | NO | MA | 1 | 10 |  |
| Bo Shuriken | BNC | 0 | P | C | 1D6 | NO | NO | MA | Lancio | 7 |  |
| Bowie Knife (pugnale da caccia grossa) | BNC | 0 | J | C | 1D6+3 | NO | NO | MA | 1 | 65 |  |
| Brass Knuckles (battente in ottone) | BNC | 0 | P | C | 2 | NO | NO | MA | 1 | 10 |  |
| Cable Whip (cavo frusta) | BNC | 0 | J | P | 1D3+3 | NO | NO | MA | 2 | 90 |  |
| Chain (catena) | BNC | -1 | J | C | 1D6+1 | NO | NO | MA | 2 | 10 |  |
| Chain Knife (pugnale seghettato) | BNC | 0 | J | P | 2D6+1 | NO | NO | MA | 1 | 120 |  |
| Chainsaw (motosega) | BNC | -3 | N | C | 4D6 | NO | NO | ST | 2 | 100 |  |
| Chair (sedia) | BNC | -2 | N | C | 2D6-1 | NO | NO | MA | 1 | 40 |  |
| Club (mazza) | BNC | 0 | L | E | 1D6 | NO | NO | MA | 1 | Gratis |  |
| Coltello da sopravvivenza | BNC | 0 | J | C | 1D6 | NO | NO | MA | 1 | 50 |  |
| Crowbar (grimaldello) | BNC | -1 | L | C | 1D6+2 | NO | NO | MA | 1 | 20 |  |
| Danger Ball | BNC | 0 | P | R | 1D6+1 | NO | NO | MA | Lancio | Grn*3 | Pallina da baseball che si trasforma in una granata (3 min. per esplodere) od in un coltello. dose La vittima diventa pallida e con gli occhi neri, dardo drogato dose Metà STUN(1D6*10min svenuto) altrimenti –1 Cons ogni 6 danni(*(1D6+1)*10min) |
| Entrenching Tool (strumento di bellezza) | BNC | 0 | L | C | 2D6 | NO | NO | MA | 1 | 50 |  |
| Excalibur Nightstick | BNC | 0 | J | P | 2D6+3 | NO | NO | MA | 1 | 80 |  |
| Excalibur Nightstick -Mace (pesante) | BNC | 0 | J | P | Gas | NO | NO | ST | 1 | 120? |  |
| Excalibur Nightstick -Taser (leggera) | BNC | 0 | J | P | Stordimento | NO | NO | ST | 1 | 80? |  |
| Fang Tian Ji (lancia) | BNC | 0 | N | P | 3D6 | NO | NO | MA | 2 | 95 |  |
| Flail | BNC | 0 | L | P | 2D6+2 | NO | NO | MA | 2 | 250 |  |
| Great Sword (spada grande) | BNC | 0 | N | P | 4D6 | NO | NO | MA | 2 | 750 | 2D6 (pugno) NO NO MA 1 900 Copre mano ed avambraccio, 3 scompartimenti per opzional cibernetici di ciberarti |
| Hambo (bastone) | BNC | 1 | L | C | 2D6 | NO | NO | MA | 1 | 30 |  |
| Handsaw (sega manuale) | BNC | -2 | N | C | 3D6 | NO | NO | ST | 1 | 250 |  |
| Hatchet (accetta) | BNC | -1 | J | C | 2D6-1 | NO | NO | MA | 1 | 10 |  |
| Haunting Knife (pugnale da caccia) | BNC | 0 | J | C | 1D6+1 | NO | NO | MA | 1 | 35 | Israele, batteria dura 2 ore |
| Javelin (giavellotto) | BNC | 0 | N | P | 1D6 | NO | NO | MA | Lancio | 25 |  |
| Jitte | BNC | 0 | L | C | 2D6 | NO | NO | MA | 1 | 30 |  |
| Jiu Jie Bian (frusta a 9 punte) | BNC | -2 | L | P | 3D6 | NO | NO | MA | 2 | 120 |  |
| Juji Shuriken | BNC | 0 | P | C | 1D3 | NO | NO | MA | Lancio | 3 |  |
| Katana-cheap (semplice) | BNC | 1 | N | P | 2D6+1 | NO | NO | MA | 1 | 100 |  |
| Katana-quality (di qualità) | BNC | 1 | N | P | 3D6 | NO | NO | MA | 1 | 300 |  |
| Katar (pugnale tirapugni) | BNC | 0 | J | P | 1D6+1 | NO | NO | MA | 1 | 65 | Kendachi M33 VP pesante*1/2 NO NO ST 1 860 Con costrutto molecolare che brilla 2000 volte/min. Si attiva dopo 1 turno, 3KG, si rompe con parata <5 Kendachi Mono Gun BNC PST -3 J J P P 2D6 2D6+3 (10 mm) NO NO MA IN Pistola e monolama insieme, canna corta quindi range 10m. |
| Kendachi Mono-Two | BNC | 1 | J/N | P/R | 2D6/4D6 | NO | NO | MA | 1 | 650/ | Set di 2 spade rinforzate con cristallo orbitale, con 50E$ laser tipo star wars. Si rompe su una parata <2 |
| Kendachi Monowhip | BNC | 0 | J | P | 2D6 (VP*1/3) | NO | NO | ST | 1/3 | 350 | Whip(frusta) monomolecolare, con bottone che la può far allungare fino a 4 metri |
| Kendachi Monowire | BNC | 0 | J | P | 3D6 (VP*1/3) | NO | NO | ST | 1 | 60/m | Filo monomolecolare tagliente Knife Pistol Type 89 PST BNC -2 J R 1D6/1D6 (.22) 4 1/4 ST 1/50 200 Coltello con 4 canne sulla lama, anche ETE |
| Kukri | BNC | 0 | J | P | 2D6 | NO | NO | MA | 1 | 120 |  |
| Kusari Kama (falce con catena) | BNC | -1 | L | C | 2D6/3D6 | NO | NO | MA | 2 | 100 |  |
| Large Bottle (damigiana) | BNC | 0 | J | C | 1D3+1 | NO | NO | IN | 1 | 2a20 |  |
| Large Bottle-Broken (rotta) | BNC | -1 | J | C | 1D3+2 | NO | NO | IN | 1 | Gratis |  |
| Lead Pipe (tubo di piombo) | BNC | -1 | J | C | 1D6+2 | NO | NO | MA | 1 | 5 |  |
| Leather Whip (frusta di cuoio) | BNC | 0 | J | C | 1D6 | NO | NO | MA | 3 | 50 |  |
| leg & Knee Spikes (punte gambe e ginocchia) | BNC | 0 | N | C | 1D6+3 | NO | NO | MA | 1 | 20 |  |
| Liu Chi Bang (bastone da 6 inch.) | BNC | 1 | L | C | 3D6+2 | NO | NO | MA | 2 | 40 |  |
| Long Sword (spada lunga) | BNC | 0 | L | P | 2D6+2 | NO | NO | MA | 1 | 300 |  |
| Lumberman's Axe | BNC | -1 | N | C | 2D6+3 | NO | NO | MA | 1 | 20 | (ascia da boscaiolo) |
| M.T. Spring Knife | BNC | 0 | P | C | 1D6 | NO | NO | ST | 1/5 | 125 | Si ricarica in 2 round |
| Mace (randello) | BNC | 0 | L | P | 2D6 | NO | NO | MA | 1 | 150 | maggiori se utilizzata a fendenti |
| Machete | BNC | 0 | L | C | 1D6+3 | NO | NO | MA | 1 | 60 |  |
| Manriki Gusari (catena con pesi) | BNC | 0 | P | P | 2D6+3 | NO | NO | MA | 1 | 30 |  |
| Monokatana Kendachi | BNC | 1 | N | R | 4D6 | NO | NO | MA | 1 | 600 | Versione lunga del monopugnale, katana ad alta tecnologia, con lama lattiginosa e quasi trasparente |
| MonoNaginata | BNC | 0 | N | R | 4D6 | NO | NO | MA | 2 | 700 |  |
| Monopugnale Kendachi | BNC | 1 | P | P | 2D6 | NO | NO | MA | 1 | 200 | Ha la lama ad un solo taglio, in cristallo molto affilata, anche in stile naginata (+100E$) |
| MonoSword Cane (mono spada in legno) | BNC | 1 | L | P | 3D6 | NO | NO | MA | 1 | 255 |  |
| Naginata | BNC | 0 | N | P | 3D6 | NO | NO | MA | 2 | 100 |  |
| Nail Gun (pistola sparachiodi) | BNC | -2 | N | P | 2D6 | 30 | 2 | MA | 10 | 350 |  |
| Nunchaku | BNC | 0 | N | P | 3D6 | NO | NO | MA | 1 | 15 |  |
| Penna pugnale | BNC | -1 | P | E | 1D2 | NO | NO | MA | 1 | 5 |  |
| Plaster Cast (stampo in gesso) | BNC | -2 | J | P | 3 | NO | NO | MA | 1 | 5 |  |
| Pool Cue (stecca da biliardo) | BNC | -1 | N | C | 1D3+2 | NO | NO | MA | 2 | 60 |  |
| Portable Drill-Industrial (trapano portatile -prof.) | BNC | -4 | N | C | 3D6 | NO | NO | ST | 1 | 190 |  |
| Portable Drill-Personal (da bricolage) | BNC | -3 | J | C | 1D6+1 | NO | NO | ST | 1 | 80 |  |
| Power Sword (spada d'energia) | BNC | 0 | L | R | 4D6 | NO | NO | ST | 1 | 860 |  |
| Quarterstaff (asta lunga) | BNC | 1 | N | P | 2D6 | NO | NO | MA | 2 | 100 |  |
| Quarterstaff Homemade (asta fatta a mano) | BNC | -1 | N | P | 2D6 | NO | NO | MA | 2 | 10 |  |
| Quing Long Dao (scimitarra) | BNC | -2 | L | P | 3D6+3 | NO | NO | MA | 1 | 250 |  |
| Rapier (stocco) | BNC | 0 | N | P | 2D6-1 | NO | NO | MA | 1 | 200 |  |
| Recreational Dart (dardo ricreativo) | BNC | 0 | P | C | 1 | NO | NO | MA | Lancio | 5 |  |
| Ri Yue Hu Xing Jian (X) | BNC | -1 | J | P | 1D3/1D6+3 | NO | NO | MA | 1 | 25 |  |
| Saber (sciabola) | BNC | 0 | L | P | 2D6 | NO | NO | MA | 1 | 200 |  |
| Sai (daga) | BNC | 0 | J | C | 2D6+2 | NO | NO | MA | 1 | 20 |  |
| San Jie Gun (asta in 3 parti) | BNC | 0 | N | C | 3D6+2 | NO | NO | MA | 2 | 50 |  |
| Sap Glove (guanto da giardinaggio) | BNC | 0 | P | C | 1 | NO | NO | MA | 1 | 25 |  |
| Scimitarra | BNC | 0 | L | P | 2D6+2 | NO | NO | MA | 1 | 350 |  |
| Short Sword (spada corta) | BNC | 0 | L | P | 2D6-1 | NO | NO | MA | 1 | 190 |  |
| Slamdance Inc. Flex Chux | BNC | 1/0 | L | P | 3D6/2D6 | NO | NO | ST | 1 | 200 | Specie di bastone che premendo un tasto diventa felssibile al centro, come un nunchago, con punte in acciaio |
| Slamdance Inc. Flex Sword | BNC | -1/0 | J/N | P | 1D6/2D6-1 | NO | NO | ST | 1 | 300 | Specie di frusta, che premendo un tasto diventa rigida come una spada Slamdance Inc. Spawn passa VP) NO NO ST Lancio 350 Se fa più di 4 danni e penetra VP, fa 1D6+4 danni in più e può essere tolta con Tecnomed>20 Slamdance Spawnblade BNC 0/ Lancio J P 1D6+BTM (lancio)/ 1D6+4 (Se>4 allora +1D6+3) NO NO ST 1/ Lancio 450 Specie di spada, anche da lancio Se penetra nel corpo si ingrandisce (1D6+3danni),e può essere tolta con tecnomed>20, ogni altro tentativo fa 1D6/2dnn |
| Sledge Hammer (martello da battaglia) | BNC | -2 | N | C | 4D6 | NO | NO | MA | 2 | 20 |  |
| Smart Whip (frusta leggera) | BNC | 0 | J | C | 1D6+2 | NO | NO | ST | 3 | 600 |  |
| Spawn Blade (spada generazionale) | BNC | 1 | J | P | 1D6/1D6+4 | NO | NO | ST | 1 | 450 |  |
| Spear (lancia) | BNC | 0 | N | P | 2D6+1 | NO | NO | MA | 3 | 55 |  |
| Spicked Cestus (……….) | BNC | 0 | P | P | 1D6 | NO | NO | MA | 1 | 20 |  |
| Spiked Boots (stivali chiodati) | BNC | 0 | N | C | 1D6+2 | NO | NO | MA | 1 | 20 |  |
| Spiked Mace (mazza chiodata) | BNC | 0 | L | P | 2D6+2 | NO | NO | MA | 1 | 250 |  |
| Spring Knife (pugnale a scatto) | BNC | 0 | P | C | 1D6 | NO | NO | ST | 5 | 125 |  |
| Swithcblade (?) | BNC | 0 | P | C | 1D3 | NO | NO | MA | 1 | 15 |  |
| Tessen (ventaglio di ferro) | BNC | 0 | J | C | 1D6+2 | NO | NO | MA | 1 | 60 |  |
| The Skull Bruiser Crowbar | BNC | 1 | L | C | 1D10+2 | NO | NO | MA | 1 | 60 | Leva di ferro utile anche per aprire porte e bottiglie |
| Throwing Knife (coltello da lancio) | BNC | 1 | P | C | 1D6-1 | NO | NO | MA | Lancio | 5 |  |
| Tonfa | BNC | 0 | N | P | 2D6 | NO | NO | MA | 1 | 15 |  |
| Wu Cha (lancia) | BNC | -1 | N | P | 2D6/3D6 | NO | NO | MA | 2 | 100 |  |
| Yojihiromata"Sakura" | BNC | -2 | P | R | 3D6 (special) | NO | NO | ST | 1 | 85 | Yo-Yo con filo affilato. Consigliato allenamento |
| Zhi Dao (spada) | BNC | 0 | N | C | 2D5 | NO | NO | MA | 1 | 150 | PR=Precisione; OC=Occultabilità; RE=Reperibilità; CL=Colpi; CD=Raffica; AF=Affidabilità; m=Portata in metri; E$=Eurodollari; PST=Pistole; FCL=Fucili; MTR=Mitra; SHG=Shotgun; PES=Armi Pesanti; GRA=Granate; EXP=Esplosivi; EXO=Esotiche; BNC=Armi Bianche Occultabilità: P=Pantalone(tasca, manica); J=Giacca, Mantello(fondina); L=Cappotto lungo, Soprabito; N=Non occultabile. Reperibilità: E=Eccellente(dappertutto); C=Comune(armerie); P=Scarsa(arma militare rubata, mercato nero); R=Rarità(pezzo unico, arma illegale); S=20° Secolo Affidabilità: IN=Inaffidabile(1D10<=8); ST=Standard(1D10<=5); MA=Molto Affidabile(1D10<=3) |
