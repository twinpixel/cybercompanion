# Classi

Fonte: `Cyberpunk 2020 ITA - Classi.pdf` (compendio *Full Metal Jacked*).

Ogni classe ha **10 abilita' di classe**, la prima delle quali e' l'abilita'
speciale. I punti abilita' di classe (`INT + RIF`) si possono spendere solo su
queste; tutto il resto va comprato con i punti abilita' libere.

---

## Le 10 classi base

### Rocker
*Artista ribelle che usa la musica per combattere le autorita'.*

Leadership carismatica · Composizione · Conosc. della strada · Individuare ·
Guardaroba – Stile · Lottare · Persuadere – Raggirare · Recitare · Sedurre ·
Suonare strumenti

### Solitario
*Assassino prezzolato, guardia del corpo, killer, mercenario.*

Senso del combattimento · Armi bianche · Atletica · Individuare · Fucili ·
Furtivita' · Lottare *(o Arti marziali)* · Mitra · Pistole · Riparare armi

### Netrunner
*Pirata informatico, incursore cibernetico.*

Hacking · Uso computer · Individuare · Cibertecnologia · Elettronica ·
Istruzione – Conoscenze · Progettare cyberdeck · Programmare · Tecnologia di base ·
**Biblioteconomia**

> **Contraddizione risolta.** Il compendio elenca solo 9 abilita' per il
> Netrunner mentre tutte le altre classi ne hanno 10. E' stata aggiunta
> **Biblioteconomia**, che nell'edizione inglese fa parte delle career skill del
> Netrunner (`Library Search`) e che e' coerente con un personaggio che vive di
> ricerca di informazioni.

### Tecnico
*Meccanico, riparatore, inventore.*

Riparazioni di fortuna · Individuare · Cibertecnologia · Elettronica · Insegnare ·
Istruzione – Conoscenze · Tecnologia di base · **+ 3 abilita' TEC a scelta**

Il Tecnico e' l'unica classe con abilita' di classe non tutte fisse: sceglie tre
abilita' qualsiasi del gruppo Tecnologia e da quel momento contano come abilita'
di classe. L'app fa scegliere le tre abilita' alla creazione.

### Tecnomedico
*Chirurgo rinnegato.*

Tecnomedicina · Biblioteconomia · Individuare · Diagnosticare malattie ·
Farmacologia · Istruzione – Conoscenze · Percepire emozioni · Tecnologia di base ·
Utilizzare serbatoi criogenici · Biologia – Zoologia

### Reporter
*Intrepido cronista in cerca della verita'.*

Credibilita' · Composizione · Individuare · Conosc. della strada ·
Fotografare – Filmare · Intervistare · Istruzione – Conoscenze · Mondanita' ·
Percepire emozioni · Persuadere – Raggirare

### Poliziotto
*Rappresentante della legge nelle strade del XXI secolo.*

Autorita' · Armi bianche · Atletica · Conosc. della strada · Individuare ·
Interrogare · Istruzione – Conoscenze · Lottare · Percepire emozioni · Pistole

### Corporativo
*Pirata del mondo degli affari.*

Risorse · Trucco – Pettinatura · Biblioteconomia · Individuare · Giocare in borsa ·
Guardaroba – Stile · Istruzione – Conoscenze · Mondanita' · Percepire emozioni ·
Persuadere – Raggirare

### Ricettatore
*Mediatore, contrabbandiere, intrallazzatore, informatore.*

Contatti · Armi bianche · Individuare · Falsificare · Intimidire · Lottare ·
Persuadere – Raggirare · Pistole · Scassinare · **Conosc. della strada**

> **Contraddizione risolta.** Il compendio elenca 9 abilita' e non include
> `Conosc. della strada`, che e' assurdo per la classe che *vive* di traffici di
> strada — ed e' presente nella lista inglese del Fixer. Reintegrata.

### Nomade
*Guerriero della strada e zingaro girovago.*

Famiglia · Armi bianche · Atletica · Individuare · Fucili · Guidare autoveicoli ·
Lottare · Resistenza · Sopravvivenza · Tecnologia di base

---

## Classi espanse

Il compendio elenca altre classi tratte da manuali secondari (spazio, subacquea,
militare). Non sono implementate nell'app, ma sono qui per riferimento: aggiungerle
significa solo aggiungere una voce in `server/data/roles.json`.

| Classe | Abilita' speciale | Ambito |
|---|---|---|
| Agente Alfa | Senso del combattimento | Investigatore privato, agente speciale |
| Tecnico Alfa | Riparazioni di fortuna *o* Hacking | Tecnologie avanzate |
| Trooper | Senso del combattimento corazzato | Fanteria in armatura da combattimento |
| Ex-Cybersoldier | Senso del combattimento | Veterano cibernetico |
| Guardia del corpo | Senso del combattimento | Protezione ravvicinata |
| Cacciatore di taglie | Senso del combattimento | Caccia all'uomo |
| Samurai di strada | Senso del combattimento | Mercenario urbano |
| Corporate Operative | Senso del combattimento | Agente corporativo sotto copertura |
| Rogue Hunter | Hacking | Caccia alle IA rinnegate |
| Panzerboy | Vehicle Zen | Pilota di tank e hovercraft |
| Aerojok | Senso del combattimento aereo | Pilota di jet da combattimento |
| Pilota interplanetario | Con. delle colonie orbitali | Spazio |
| Lavorante | Gruppo di lavoro | Operaio orbitale |
| Pilota di shuttle / VTO | Fratellanza | Trasporto spaziale |
| Divemaster | Senso acquatico | Operazioni subacquee |
| Divemaster / Miner | Senso acquatico | Minerario subacqueo |
| Subjoke | Tattica subacquea | Pilota di sommergibili |
| Biotecnico marino | Tecnomedicina | Genetica subacquea |
| Specialista operativo | Senso del combattimento furtivo | Operazioni speciali |
| Specialista assassino | Senso del combattimento furtivo | Eliminazione mirata |
| Specialista tecnico | Riparazioni di fortuna | Supporto tecnico da campo |

> Nota: nel PDF sorgente molte di queste classi hanno la descrizione sbagliata
> (copiata da "Piloti specializzati nei rispettivi mezzi spaziali"), e diversi
> nomi di abilita' sono scritti con refusi (`Senso del Combattimente`,
> `Atlecita`, `Seguire Trecce`). Le descrizioni qui sopra sono state ricostruite
> dal nome della classe e dalle abilita' elencate.
