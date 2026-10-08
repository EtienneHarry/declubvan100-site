# Design system — De Club van 100

Dit document beschrijft hoe het design system van De Club van 100 in deze repo
is uitgewerkt, en waar de uitwerking bewust afwijkt van de bron.

**De bron staat buiten deze repo**: het design system van De Club van 100, met
de guidelines voor typografie, contrast, beeld en de bliksemschicht. Dit
document vervangt dat niet. Staat iets hier niet in, dan is de bron leidend;
staat er hier een afwijking genoteerd, dan is die bewust.

`src/styles/tokens.css` is de uitwerking van de tokens. Dat is de enige plek in
`src/` waar letterlijke waardes mogen staan.

---

## Kleur

Warm bruin dominant, met vuur als enige accent. Gemeten uit de mockup die de
klant in augustus 2026 aanleverde; dit hoofdstuk is de uitwerking van die
meting.

**De regel "geen accentkleur" is vervallen.** Ze stond hier tot de restyle, en
haar onderbouwing was dat alle logo's monochroom op `currentColor` staan. Dat
klopt nog steeds — de logo's zijn niet veranderd — maar het was een gevolgtrekking
uit het logo en geen uitspraak over de site. De mockup zet er een rode
INHUREN-knop in, en daarmee is de vraag beantwoord door degene die hem stelde.
Wat blijft staan is de reden achter de oude regel: één accent, en het draagt
nooit tekst. Zie `vuur` hieronder.

Vijf achtergronden, uitspreekbaar zodat ze in een CMS-keuzelijst passen. Drie
donker en twee licht:

| Token | Waarde | Waarvoor |
|---|---|---|
| `bruin` | `#201410` | dominant; het vlak waar de site op staat |
| `inkt` | `#0b0b0b` | het zwarte vlak óp bruin, en de zwarte knop |
| `roet` | `#2c1f1a` | verhoogd vlak op bruin: kaart, invoerveld, sticky balk |
| `papier` | `#fafaf8` | lichte pagina: voorwaarden, privacy, print |
| `mist` | `#e4e4e1` | rustig vlak op papier |

**Meer dan één lichte en één donkere achtergrond per pagina blijft een fout.**
De donkere familie telt er drie, maar een pagina kiest er één. `roet` is dan het
verhoogde vlak binnen die pagina en geen tweede sectieachtergrond.

Tekst: `krijt` / `krijt-zacht` / `krijt-stil` op donker, `inkt` / `grafiet` op
licht, met `cream` als accent op donker. Functionele kleur bestaat alleen in
paren (`fout` + `fout-donker`) en is gedempt.

De semantische aliassen — `--vlak`, `--tekst`, `--lijn`, `--focus-ring` —
kantelen onder `[data-thema="licht"]`. Een sectie op `papier` of `mist` zet dat
attribuut zelf, zodat alles erbinnen meekantelt.

### Contrast, herrekend op de definitieve waardes

Alle verhoudingen hieronder zijn WCAG 2.1, berekend op de waardes zoals ze nu in
`tokens.css` staan — niet op de afgeronde meting uit de brief. AA vraagt 4,5:1
voor gewone tekst en 3:1 voor groot (24px, of 19px vet) en voor UI-randen.

Op de drie donkere vlakken:

| Tekst | op `bruin` | op `inkt` | op `roet` |
|---|---|---|---|
| `krijt` | 17,96 | 19,68 | 15,93 |
| `papier` | 17,19 | 18,83 | 15,25 |
| `mist` | 14,10 | 15,45 | 12,51 |
| `cream` | 11,71 | 12,83 | 10,39 |
| `krijt-zacht` | 10,82 | 11,86 | 9,60 |
| `krijt-stil` | 5,19 | 5,69 | 4,60 |
| `vuur` | **3,18** | **3,48** | **2,82** |
| `grafiet` | **2,68** | **2,93** | **2,37** |

Op de twee lichte vlakken, en op `cream` als vlak:

| Tekst | op `papier` | op `mist` | op `cream` |
|---|---|---|---|
| `inkt` | 18,83 | 15,45 | 12,83 |
| `bruin` | 17,19 | 14,10 | 11,71 |
| `grafiet` | 6,42 | 5,27 | **4,37** |
| `vuur` | 5,41 | **4,44** | **3,69** |
| `krijt-stil` | **3,31** | **2,72** | **2,26** |

Tekst óp `vuur`: `krijt` 5,65 · `papier` 5,41 · `cream` 3,69 · `inkt` 3,48 ·
`bruin` 3,18.

Daaruit volgen zes regels, en die zijn niet onderhandelbaar:

- **`vuur` is nooit tekstkleur op `bruin`.** 3,18:1 haalt AA niet, ook niet voor
  groot. Het is een vlak — een knop, een klein blok — of een **decoratieve
  lijn**: de ovaal staat sinds B10 op `vuur` (de streep sinds B12 op `papier`,
  een rustkeuze en geen contrasteis; de pijl ook op `papier`, omdat hij naar een
  knop wijst die zelf vuur is). Vuur op een lijn mag omdat
  een haal geen tekst is en op `aria-hidden` staat; de tekstcontrasteis geldt er
  niet, en als lijn haalt vuur op elk vlak van de site de 3:1 die WCAG aan
  niet-tekstuele onderdelen stelt (3,18 op bruin, 5,41 op papier). Nooit een
  woord — het verschil tussen een lijn en een letter is precies het verschil
  tussen mogen en niet mogen.
- **Knoptekst op `vuur` is wit.** 5,65:1, en dat geldt voor elke maat. De mockup
  zet er cream-typemachinetekst op; die haalt 3,69:1 en dus alleen de
  groot-tekstdrempel, en alleen zolang die knop groot en gespatieerd blijft.
  Dat is een voorwaarde die een redacteur kan breken zonder het te zien, dus de
  `vuur`-knop staat op wit.
- **`grafiet` mag niet op `cream`** (4,37:1) en `vuur` ook niet (3,69:1). Op een
  creamvlak schrijf je met `inkt` of `bruin`.
- **`krijt-stil` mag nooit op `papier`, `mist` of `cream`.** Gebruik daar
  `grafiet`. Op de drie donkere vlakken mag hij wel, tot en met `roet` (4,60:1).
- **`vuur` op `mist`** haalt 4,44:1 en is dus geen gewone tekst; op `papier`
  haalt het 5,41:1 en mag het wel. Praktisch: houd `vuur` ook op licht een vlak.
- **De randen doen het werk tussen twee donkere vlakken.** `inkt` op `bruin` is
  1,10:1 en `roet` op `bruin` 1,13:1. Dat is met opzet zo klein — het design
  system zegt dat diepte op donker een verhoogd vlak plus een lijn is, en die
  lijn (`--lijn`, 0,16 wit) is hier het enige dat de rand echt zichtbaar maakt.
  Haal je hem weg, dan verdwijnt de kaart in de sectie.

**Afwijking — `roet` is afgeleid en niet gemeten.** De mockup toont geen
verhoogd vlak, en het oude `roet` (`#191919`) is een koud grijs dat naast bruin
uit de toon valt. `#2c1f1a` is 94% `bruin` met 6% `cream`: dezelfde stap omhoog
die `roet` op `inkt` had (1,13 tegen 1,12), zodat de verhouding tussen vlak en
verhoogd vlak niet verandert. `krijt-stil` houdt er 4,60:1 en dat is precies de
ondergrens waarop deze waarde is uitgekozen. Levert de klant alsnog een gemeten
verhoogd vlak, dan wint dat.

### Contrast op een sluier meet je op het slechtste geval

**Een sluier is geen vlak. Het is een laag over onbekend beeld.** Dat klinkt als
een woordspel en het is het verschil tussen een meting die klopt en een die
vleit.

Een vlak heeft één kleur, dus daar is één verhouding uit te rekenen. Een sluier
heeft een dekking, en wat eronder ligt is een foto — en een foto is geen token.
Hij wordt vervangen zodra de redacteur er een andere kiest, en zelfs binnen één
foto verschilt elke plek van de plek ernaast. Er ís dus geen gemiddelde
achtergrond om tegen af te rekenen.

**De regel: reken elke tekst op een sluier af op het slechtst denkbare beeld.**
Voor lichte tekst is dat een foto die op die plek volledig wit is; voor donkere
tekst een die er volledig zwart is. Haalt de tekst het daar, dan haalt hij het
overal. Haalt hij het daar niet, dan is hij op sommige foto's onleesbaar en op
andere niet — en dat is geen ontwerp maar een gok die van de fotokeuze afhangt.

**Wat er misgaat als je het niet zo doet.** Een meting die `rgba(32 20 16 / .62)`
als achtergrondkleur invult, behandelt de sluier alsof hij dekkend is en levert
een veel te gunstig getal op. Dat is precies wat er in B8 gebeurde, en het hield
een fout verborgen die er al vóór de restyle stond: **de vier bovenkoppen in de
splitscreen-deuren stonden in `krijt-stil` op 1,46:1.** Op de dekkende meting
leek dat ruim in orde. Dezelfde plek, dezelfde CSS, twee metingen, en alleen de
strenge liet zien dat een grijze label op een foto in het slechtste geval
onleesbaar is.

De rest van die meting, op `--sluier-donker` vlak over een witte foto:

| Tekstkleur | Slechtste geval | Mag het? |
|---|---|---|
| `krijt` | 5,04 | ja |
| `cream` | 3,29 | alleen groot |
| `krijt-stil` | **1,46** | nee |

Daaruit volgt de regel die `Beeldvlak` nu afdwingt: **op een foto bestaat geen
gedempte tekstkleur.** Het vlak zet altijd een `data-vlak`, en die regel in
`tokens.css` bindt `--tekst-zacht` en `--tekst-stil` aan de hoofdtekstkleur. De
sluier is doorgerekend op één kleur, en dat is de enige die hij draagt; de
hiërarchie komt daar uit maat en gewicht.

**En dus ook: verhoog de dekking niet om een kleur te redden.** Wie `krijt-stil`
leesbaar wil maken op de vlakke sluier, komt uit op een dekking waarop de foto
niet meer te zien is — en dan is de foto een achtergrondkleur geworden met een
plaatje eronder dat niemand nodig had. De goede uitweg is de tekstkleur, niet de
laag.

### Sluiers

Twee tonen, allebei verplicht onder tekst op foto en allebei niet uit te zetten:

| Token | Waarde | Waarvoor |
|---|---|---|
| `--sluier-donker` | `bruin` op 62% | witte tekst op beeld |
| `--sluier-licht` | `cream` op 72% | donkere tekst op beeld, de hero van de mockup |

De donkere is bruin geworden en niet meer inkt: dezelfde dekking, maar op de
nieuwe achtergrond, anders ligt er een koude vlek op een warm vlak. De
verloopvarianten `--sluier-onder` en `--sluier-zij` zijn mee overgezet.

Doorgerekend op de uitersten van een foto — een plek die volledig wit is en een
plek die volledig zwart is, want de foto zelf is geen token:

- **`--sluier-donker`**: wit haalt in het slechtste geval 5,05:1 en in het beste
  19,32:1. Cream haalt in het slechtste geval 3,29:1 en is dus **geen tekstkleur
  op beeld**.
- **`--sluier-licht`**: `inkt` haalt in het slechtste geval 6,69:1 en in het
  beste 14,57:1; `bruin` 6,11:1 en 13,30:1. Allebei ruim boven AA.

## Typografie

Drie families sinds de restyle, alle drie zelf gehost via `@fontsource` en alle
drie via een token. `scripts/check-tokens.mjs` leest de tokennamen uit
`tokens.css` en laat de build vallen op elke letterlijke familienaam daarbuiten,
dus deze drie zijn ook de enige drie die er kunnen zijn.

| Token | Familie | Rol |
|---|---|---|
| `--font-sans` | Montserrat Variable | dragend: koppen én lopende tekst |
| `--font-machine` | Special Elite | labels, knoppen, één uitgelichte regel |
| `--font-hand` | Caveat | één decoratieve regel per pagina |

**De dragende letter is Montserrat, Route A uit de brief.** Woordmerk en site
vallen daarmee samen: Montserrat was al bevestigd als woordmerkletter, en de
sans in de mockup zit er dicht op. Route B — Archivo laten staan — zou het
systeem niet hoeven omzetten, maar de site hoekiger laten ogen dan wat de klant
heeft goedgekeurd.

**De prijs van die keuze is de breedte-as.** Archivo had er twee (gewicht
100–900, breedte 62–125) en de displayniveaus stonden op `wdth 118` en `112`;
dat was het grafische verschil dat de site droeg. Montserrat heeft alleen een
gewichtsas. De twee `font-variation-settings`-regels in laag 4 van `tokens.css`
zijn daarom weg, en de displayniveaus dragen het verschil nu op gewicht (800) en
grootte — `display-xl` loopt tot 8rem, `display-l` tot 5rem.

De brief noemt de dragende letter `--font-basis`. Hier heet hij `--font-sans`,
en dat is geen slordigheid: Tailwind hangt aan die naam zowel de
`font-sans`-utility als de standaardfamilie van de `body`. Onder een andere naam
zou `font-sans` stilletjes Tailwinds eigen stack blijven — precies de val die
`check-tokens` moet vangen.

Leesbreedte is 66ch op licht en 60ch op donker; `maatRegelKlasse` in `tokens.ts`
kiest de juiste per achtergrond.

**Afwijking — knopmaten.** Het design system zet voor `maat="s"` en `maat="l"`
een eigen lettergrootte (`.9375rem` en `1.125rem`). Daar bestaat geen token
voor, dus alle drie de maten staan op `--text-knop` en verschillen alleen in
hoogte en padding.

### De typemachine

Special Elite: een gestempelde slab met de onregelmatigheid van een echte
typemachine. Vier regels, en ze zijn er alle vier om te voorkomen dat hij
lopende tekst wordt:

- **Altijd hoofdletters.**
- **Altijd op `--machine-tracking` (0,14em).** Die spatiëring hoort bij de
  familie en niet bij één maat, dus hij staat als primitief in laag 1 en wordt
  door `--text-bovenkop`, `--text-knop` en de utility `tracking-machine`
  gelezen. In `@theme inline` kon hij niet staan: dat blok bakt zijn waardes in
  de utility en stuurt ze niet als variabele uit, dus een token dat door andere
  tokens gelezen wordt moet een primitief zijn.
- **Alleen labels, knoppen en maximaal één uitgelichte regel per sectie.**
- **Nooit voor lopende tekst langer dan twee regels.** Special Elite is
  monospaced en licht versleten; op regellengte leest hij traag en op een
  telefoon breekt hij lelijk.

  *Eén plek haalt deze regel niet.* De kop op Voor wie is de club? heeft een
  typemachinedeel dat op 1440 drie regels telt en op 375 vijf. Dat is al de
  ingekorte versie — de mockup zet de wissel op de komma en dan wordt het vijf en
  acht. Verder inkorten verandert de zin en schalen vraagt een maat die nergens
  gemeten is, dus het staat er zo.

In de praktijk raakt dat vandaag twee componenten — `Bovenkop` en `Knop` — plus
het nummer op een `Kaart`. De uitgelichte regel bestaat nog niet als component;
komt hij er, dan is `font-machine tracking-machine uppercase` de hele vorm.

### Het handschrift

Caveat, en het is het enige element op deze site dat puur decoratief is. Twee
regels:

- **Maximaal één regel per pagina.** Niet per sectie — per pagina. Twee
  handgeschreven regels op één pagina maken er een sfeerbeeld van in plaats van
  een accent.
- **`aria-hidden` zodra dezelfde boodschap al in gewone tekst op de pagina
  staat.** De mockup doet precies dat: drie bijschriften onder een drieluik, en
  eronder dezelfde tekst nog eens in handschrift. Dat tweede exemplaar is een
  plaatje van een zin, geen zin — een schermlezer hoort hem niet te herhalen.
  Staat de boodschap er níet al, dan is hij wél betekenisdragend, en dan hoort
  hij niet in het handschrift maar in de dragende letter.

Caveat is een gok. De brief zet de zekerheid van deze familie op laag en van
Special Elite op matig; heeft de maker van de mockup de echte namen, dan winnen
die. Omzetten is één regel in `global.css` en één token in `tokens.css`.

**Het dubbellaagse hero-effect** — de witte kop met de donkere offsetlaag
eronder — hoort ook bij dit hoofdstuk maar staat bij `Hero` onder *Componenten*,
want het is een variant van dat sectietype en nergens anders toepasbaar.

## Ruimte

Basiseenheid 4px; alles is een veelvoud. Tailwinds `--spacing` staat daarop, dus
`p-6` is 24px.

Sectieritme in drie vloeiende stappen: `sectie-s`, `sectie-m`, `sectie-l`. De
marge is `clamp(20px, 5vw, 64px)`.

## Grid en layout

Container 1280px, smal 768px, breed 1600px. De breedtetoken levert meteen de
hele container: gecentreerd, met de marge links en rechts.

Hitzone minimaal 44px — `min-h-11` op elke knop en navigatielink.

## Radius en diepte

Hoeken zijn hard: `radius-none` is de standaard. `radius-veld` (2px) alleen voor
invoervelden, `radius-overlay` (4px) alleen voor overlays, `radius-vol` alleen
voor een ronde iconknop of telbadge.

**Op zwart bestaat schaduw niet**: diepte is een verhoogd vlak (`roet`) plus een
lijn. Op `papier` en `mist` mag wél een korte, lichte schaduw — een klikbare
kaart krijgt daar bij hover `shadow-licht-2`.

## Componenten

Gebouwd: `Knop`, `Kaart`, `Bovenkop`, `Teller` (`components/basis/`),
`Beeldvlak` (`components/beeld/`) en `Bliksem` (`components/merk/`). De
propscontracten staan in de bron; hieronder alleen waar de uitwerking afwijkt.

### Wat de restyle aan de bestaande componenten veranderde

**`Knop` heeft er twee varianten bij: `vuur` en `inkt`.** Allebei gevuld, dus
allebei onder dezelfde regel als `vol` — maximaal één per blikveld. `vuur` is de
primaire actie en de enige plek waar die kleur op de site landt; de tekst erop
is wit en niet cream, want cream haalt er 3,69:1. `inkt` is de zwarte knop uit
de mockup, met cream als tekst (12,83:1). `vol` — de witte knop van vóór de
restyle — blijft bestaan omdat het design system hem als primair kent, maar de
mockup gebruikt hem nergens.

De hover van die twee loopt via dekking en niet via een tweede kleur. Een
hovertoken erbij zou een waarde zijn die de mockup niet meet; met dekking laat
de knop een tikje van de sectie erdoor en dat werkt op elke achtergrond dezelfde
kant op. De lijnvariant deed dat al.

**De knoptekst staat in de typemachine**, net als `Bovenkop`, het nummer op een
`Kaart`, de menuknop van de navigatie en de kolomkoppen in de voettekst. Dat
zijn alle labels en knoppen die er zijn; verder komt die familie nergens.

**`Kaart` heeft er een derde variant bij: `kaal`.** Geen lijn, geen verhoogd
vlak, geen binnenruimte — alleen de inhoud, in het raster. `drie-kolommen`
gebruikt hem, en dat is het enige sectietype dat kaarten zet, dus in de praktijk
staat er nergens meer een kader om een kaart.

Dat is geen andere invulling van "diepte op donker", want er is geen diepte
meer: de drie items zijn een opsomming naast elkaar en geen verhoogde vlakken.
De regel hierboven blijft staan voor waar wél diepte nodig is; `verhoogd` en
`vlak` blijven daarvoor bestaan.

*Afwijking, en een bewuste:* het design system beschrijft `Kaart` met een lijn.
Die is er op verzoek van de klant afgehaald nadat de gebouwde pagina naast de
mockup lag — de kaders maakten van drie zinnen drie dozen. Wie ze terugwil,
zet in `DrieKolommen.tsx` de `variant` terug op de standaard.

**`Beeldvlak` heeft een `toon`.** `donker` is de bestaande sluier, `licht` de
bijna-sepia laag uit de hero van de mockup. De lichte zet ook
`data-thema="licht"` op het vlak, zodat alles erbinnen meekantelt — een
bovenkop, een knop, een lijn — en niet alleen de tekstkleur klopt.

De lichte toon zet naast `data-thema="licht"` ook `data-vlak="cream"`. Dat
tweede attribuut haalt `--tekst-zacht` en `--tekst-stil` weg en bindt ze aan de
hoofdtekstkleur: **op cream bestaat geen gedempte tekst**, want grafiet haalt er
4,37:1. De hiërarchie komt daar uit maat en gewicht. Dit was bij de meting op
`/secties` de enige tekst op de hele pagina die onder de drempel viel, en hij
viel er pas in nadat de lichte sluier erbij kwam.

*Afwijking:* de donkere toon heeft drie vormen (`onder`, `zij`, `vlak`), de
lichte één. Dat is geen omissie maar de meting: de mockup zet de lichte sluier
één keer neer, als vlakke laag over de hele hero, en er is geen licht verloop
gemeten. De drie plekken van de lichte toon wijzen daarom alle drie naar
dezelfde vlakke laag.

**`Hero` heeft het dubbellaagse effect uit de mockup.** De witte kop met een
harde donkere laag eronder, als `text-shadow` met een blur van 0 — dat laatste
is het verschil tussen een tweede laag en een slagschaduw. De verschuiving staat
in em (0,045 bij 0,05), dus hij schaalt mee met een kop die van 3,5rem naar 8rem
loopt; in px zou hij op een telefoon een dikke rand zijn en op een breed scherm
een haarlijn.

Hij hangt aan `kopNiveau === 1` en niet aan de prop alleen. Een tweede hero op
dezelfde pagina zakt naar `display-l` en raakt de laag daarmee ook kwijt, zodat
er precies één dubbellaagse kop per pagina overblijft — om dezelfde reden waarom
er precies één `<h1>` is. Op een lichte sectie vervalt hij helemaal:
`--kop-dubbellaags` staat daar op `none`, want de tekst is er zelf al inkt en de
laag zou onder zijn eigen kleur vallen.

Nagemeten op `/secties`, drie heroes met alle drie het vinkje aan: de eerste
staat op 115,2px met `rgb(11, 11, 11) 5.184px 5.76px 0px`, de tweede op 76,8px
met `none`, en dezelfde kop op papier — als eigen lijst, dus weer op 115,2px —
óók met `none`.

*Belangrijk:* **het is een tweede laag en geen contrastmiddel.** De kop moet op
zichzelf al genoeg contrast halen tegen zijn achtergrond; een offset telt in
WCAG niet mee. De mockup zet deze kop wit over de lichte sepia-sluier, en dat
haalt 1,53:1 — die combinatie kan niet zo gebouwd worden, ook niet met een laag
eronder. Waar onze hero wit zet (op `bruin`, of op de donkere sluier) klopt het
contrast wel, en daar doet de laag wat hij hoort te doen: gewicht geven.

**`Accordeon` is het negende sectietype.** Het volgt de disclosure-richtlijn en
niet die van een tablijst, en dat verklaart de twee dingen die eraan ontbreken:

- **Geen pijltoetsen.** Elke vraag is een losse knop en die bereik je met tab, in
  leesvolgorde. Een accordeon die de pijltoetsen kaapt, breekt het scrollen
  ermee — en de richtlijn vraagt ze alleen voor een tablijst, waar de pijlen de
  enige manier zijn om bij het volgende tabblad te komen.
- **Geen `aria-controls`.** De richtlijn kent hem, maar hij vraagt een id dat
  over de hele pagina uniek is, en dat is uit de inhoud niet te maken: twee
  accordeons op één pagina kunnen dezelfde vraag op dezelfde plek hebben. Voor
  een disclosure is `aria-expanded` op de knop het dragende deel, en het paneel
  staat er direct achter in de DOM. De ondersteuning van `aria-controls` in
  schermlezers is bovendien wisselend.

De vraag is een kop met de knop erín, en niet andersom: een kop binnen een knop
maakt van die kop een stuk knoptekst. Het niveau zakt onder de sectiekop mee,
net als een kaartkop, zodat `check-koppen` erover kan oordelen.

**Elke call to action staat op vuur, en de knop ernaast is de open variant.**
Dat is een instructie van de klant en het vervangt de doelgroepcode die hier
eerder stond.

  - **Primair** — `vuur`: vlak in vuur, witte tekst, rand in vuur.
  - **Secundair** — `lijn`: doorzichtige vulling, rand in vuur, cream tekst.

De twee horen zichtbaar bij elkaar: dezelfde kleur, de een dicht en de ander
open. De rangorde zit daarmee in vol tegenover open in plaats van in een tweede
accentkleur, en "één gevulde knop per blikveld" geldt weer overal.

Wat hiermee vervalt, en dat is een echt verlies: de mockup zet AANMELDEN in
zwart en INHUREN in rood, en dat was een code per publiek — je zag aan de kleur
of een knop voor jou was. **De hero verliest daarmee zijn uitzondering.** Daar
stonden de twee deuren van de site naast elkaar, allebei gevuld, met de kleur
als enige onderscheid; nu is de eerste vuur en de tweede open, en wat de twee
deuren scheidt is nog alleen hun tekst.

`knopKleur` en `KNOPKLEUR_TOKENS` zijn daarmee weg — uit `Oproep`, uit
`lib/tokens.ts`, uit het CMS en uit de yaml. Een keuze in het CMS die maar één
goed antwoord heeft, is geen keuze maar een manier om de regel per ongeluk te
breken. De variant `inkt` blijft wel bestaan in `Knop`: dat is de palet-kant,
en `/secties` toont hem nog.

**Afwijking — cream geldt alleen op donker.** De opdracht zegt cream als
tekstkleur voor de open knop, en dat klopt overal waar vandaag een knop staat.
Maar `cream` is een primitief en kantelt niet mee met het thema, dus op een
lichte sectie zou het lichte tekst op een lichte ondergrond zijn. Op een
`[data-thema="licht"]` valt de tekst daarom terug op `--tekst`, dat daar inkt
is — dezelfde constructie als de schaduw in `Kaart`.

**En op een foto is de tekst van de open knop `krijt`.** Sinds B16, om dezelfde
reden als de regel voor tekst op beeld: cream haalt op de sluier in het
slechtste geval 3,29:1 en is geen tekstkleur op beeld. De open knop "Inhuren"
staat in de homehero op de foto, en gemeten op die foto met de sluier erover
zakte cream in de knoppenzone bij 11,7% van de pixels onder 4,5:1 — knoptekst
van 17px vet is geen grote tekst. Krijt haalt op de sluier in het slechtste
geval 5,04:1. De tak hangt aan `[data-vlak="beeld"]`, dat `Beeldvlak` zelf zet
op de donkere toon; op de lichte toon geldt de lichte tak hierboven.

Nagemeten, rechtstreeks uit de tokens:

| | Op bruin | Op papier | Eis |
|---|---|---|---|
| Witte tekst op het vuurvlak | 5,65:1 | 5,65:1 | 4,5:1 |
| Het vuurvlak tegen de sectie | 3,18:1 | 5,41:1 | 3:1 |
| De vuurrand tegen de sectie | 3,18:1 | 5,41:1 | 3:1 |
| Cream tekst op de open knop | 11,71:1 | **1,47:1** | 4,5:1 |
| Inkt tekst op de open knop (lichte tak) | — | 18,83:1 | 4,5:1 |

Die 1,47 is de reden dat de lichte tak er is en niet een detail: cream op papier
is onleesbaar, niet "net te weinig". Alles wat overblijft haalt zijn drempel,
en het krapste getal op de hele site is de 3,18 van vuur tegen bruin — ruim
genoeg voor een niet-tekstueel onderdeel, en dat is wat een knopvlak is.

**Afwijking — `Scheiding` bestaat hier niet meer.** De bron kent hem als
vervanger van de `<hr>`, met de schicht erin. Hij is in B2 gebouwd, in B4
weggehaald omdat geen sectie hem inzette, in B7 teruggekomen als `Naad` op elke
sectiegrens, en in B9 opnieuw verwijderd: de mockup van de restyle heeft geen
scheidingslijnen, en een element aanhouden dat het ontwerp niet toont is
voorraad. De git-geschiedenis heeft hem nog, met de ontwerpbeslissingen erin.

Van de drie rollen van de schicht zijn `groot` en `opsomming` in gebruik.
**Rol 2 (`scheiding`) is met het verdwijnen van de naad opnieuw zonder
gebruiker.** `Bliksem` ondersteunt de rol nog; er is alleen geen element meer
dat hem inzet, en dat blijft zo tot een ontwerp er weer om vraagt.

Alle drie de afwijkingen hebben dezelfde oorzaak: **`security.csp` blokkeert
inline stijl**, en dit project staat geen spread-attributen, `className` of
`style` van buitenaf toe. Een prop die een vrije CSS-waarde doorgeeft kan dus
niet bestaan.

| Component | Weggelaten uit het contract | In plaats daarvan |
|---|---|---|
| `Knop` | `as`, `onClick`, losse DOM-attributen | Alles is statisch voorgerenderd; een handler zou zonder hydratatie toch niet lopen |
| `Beeldvlak` | `hoogte`; `verhouding` als vrije CSS-waarde | `verhouding` is een keuze uit de drie die de beeldrichtlijn noemt: `breed`, `portret`, `vierkant` |
| `Bliksem` | `hoogte`, `dekking` | De rol bepaalt maat en dekking, precies zoals de richtlijn ze beschrijft |

## Motion

Kort en zakelijk. Kleur en lijn op `--duur-1` (120ms), de indruk op `--duur-2`
(180ms), curve `--soepel-uit`. Bij `:active` gaat een knop of klikbare kaart naar
`--indruk` (0.985). Geen bounce, geen veer, geen parallax, geen carrousel.

Twee verschillende duren op één element passen niet in een losse
`duration`-klasse, dus dat gaat via de `transition`-shorthand.

**De transitie loopt op `scale` en `translate`, niet op `transform`.** Tailwind 4
zet `active:scale-[…]` en `-translate-y-…` op de losse properties, en een
transitie op `transform` raakt die niet. Tot B16 sprongen de indruk van `Knop`
en de hover van een klikbare `Kaart` daardoor in één beeldje; aan de klassenaam
is dat niet te zien.

Bij `prefers-reduced-motion: reduce` zet `tokens.css` globaal elke duur op 1ms
en laat elke verschuiving vervallen.

### Inslag als karakter, Ploeg als ritme

Dat is het concept achter alles wat op deze site binnenkomt. Een element komt
hard binnen, remt scherp af en staat dan stil: geen naloop, geen veer, geen
overshoot. Maar nooit met z'n allen tegelijk — binnen een sectie volgen ze
elkaar op in een strak ritme.

Het is het gedrag van de bliksemschicht uit het logo, vertaald naar timing. De
schicht is één harde beweging met een scherpe knik erin; hij zwelt niet aan en
hij dijt niet uit. Dezelfde toon als de voice: kort en zeker, niet zacht en niet
traag.

| Token | Waarde | Waarvoor |
|---|---|---|
| `--inslag` | `cubic-bezier(0.12, 0.9, 0.1, 1)` | alles wat binnenkomt |
| `--duur-inslag-dekking` | 340ms | de dekking, en het masker onder een kop |
| `--duur-inslag-hef` | 420ms | de verplaatsing |
| `--ploeg` | 70ms | tussen twee opeenvolgende elementen in één sectie |
| `--inslag-hef` | 24px | de afstand, altijd van onder naar boven |
| `--inslag-masker` | 112% | hoe ver het masker onder een kop doorloopt |
| `--zoom-beeld` | 1.05 | hover op een beeld dat ergens heen gaat |
| `--duur-zoom` | 700ms | diezelfde zoom |

**De curve is de inslag.** Het eerste stuurpunt ligt op `0.12, 0.9`: bij een
achtste van de tijd is negen tiende van de weg al afgelegd. De rest van de duur
is afremmen. Geen van beide stuurpunten komt boven 1 uit, dus er is geen
doorschieten en geen terugveren.

**De verplaatsing gaat altijd omhoog en nooit verder dan 24px.** Naar boven,
want dat is de richting van binnenkomen; 24px, want alles daarboven wordt een
reis in plaats van een inslag. De verplaatsing duurt langer dan de dekking
(420 tegen 340ms), zodat een element eerst helemaal zichtbaar is en dan pas
stilvalt.

**Koppen faden niet, ze komen uit een masker omhoog.** Een kop is het zwaarste
element op een pagina; die hoort tevoorschijn te komen, niet langzaam waar te
worden. Het masker is een `clip-path` die met de kop mee opengaat terwijl hij
omhoog schuift. Hij loopt 12% onder de kop door, want een displaykop staat op
een regelhoogte onder 1 en op precies 100% knipt het masker de staarten van de
`p` en de `g` af.

**Een animatie die niet start mag nooit tot onzichtbare tekst leiden.** Dat is
sinds B11 een regel, en hij is er omdat het één keer stil is misgegaan: de
wachttoestand van een kop was een gepauzeerde animatie op zijn nulhoge masker,
Chrome knipt de intersection-rect van de waarnemer op de clip-path van het
element zélf, en dus haalde een kop de losllaatdrempel van 0,2 nooit — op elke
pagina onzichtbare koppen die wél ruimte innamen. De verborgen begintoestand
verhinderde precies de melding die hem moest opheffen.

Daaruit volgen drie handhavingen:

1. **De wachttoestand mag de meting niet raken.** Hij is `opacity: 0` — geen
   clip-path, geen gepauzeerde animatie. Dekking raakt de intersection-rect
   niet en houdt het element in de toegankelijkheidsboom. De animatie komt pas
   op het element bij 'loopt'; de backwards-vulling houdt het beginbeeldje vast
   zolang de ploegvertraging loopt.
2. **De opening heeft een vangnet.** Wat binnen `data-onthul-entree` na de
   aanloop plus 500ms nog niet is losgelaten, wordt alsnog op klaar gezet en
   staat er dan gewoon. Het eerste scherm mag nooit leeg blijven omdat een
   waarnemer zweeg.
3. **De poort bewaakt de voorwaarden.** `check-onthul` controleert na elke
   build dat elke regel die onthul-inhoud verbergt aan het scriptvlagje hangt
   en dat het loslaatmechanisme plus het vangnet in de gebundelde scripts
   zitten. Wat statisch niet te bewijzen valt — dat de waarnemer echt vuurt —
   is precies waar het vangnet voor is.

**De opening van de pagina animeert, wat er al staat niet.** De
scrollonthulling slaat over wat bij het laden in beeld staat — wie de pagina
opent, kijkt naar iets dat er is. De hero die de pagina opent is daar de
uitzondering op: zijn binnenkomst ís het moment, dus zijn elementen lopen het
gewone ritme met `--aanloop` (300ms) ervoor, zodat de pagina eerst staat en dan
pas de klap valt. Eén uitzondering, aan het sectietype gebonden, en alleen op
kopniveau 1: een tweede hero gedraagt zich als elke andere sectie.

**De ploeg is 70ms.** Elk aanwezig onderdeel van een sectie schuift één stap op:
bovenkop, kop, tekst, dan de items. Onderdelen die er niet zijn tellen niet mee,
dus een sectie zonder bovenkop begint gewoon op nul en heeft geen gat aan het
begin. Kaarten en citaten lopen in datzelfde ritme door.

**De ploeg telt per groep die samen binnenkomt, niet per sectie.** Sinds B16.
`ploeg()` nummert per sectie in de volgorde van de DOM, en dat klopt voor wat
samen in beeld komt: kop, tekst, drie kaarten naast elkaar. Maar op `/privacy`
stonden zeventien alinea's op stap 8, en elk ervan kwam los in beeld: 560ms leeg,
bij elke alinea opnieuw. Nu is wat in één melding van de waarnemer loskomt een
groep, en per sectie gaat de laagste stap van die groep naar 0; de rest schuift
mee. Wat samen binnenkomt houdt zijn ritme, een losse alinea begint meteen.
Gemeten op `/privacy` bij 375: de eerste groepen op 0, 1 en 2, daarna elke alinea
op 0. Het herstappen is een attribuut en geen stijl, dus de CSP blijft heel, en
een haal in een kop leest de nieuwe vertraging vanzelf mee via
`--stap-vertraging`.

**De teller telt vanaf het masker van de kop.** Ook sinds B16. De kop eromheen
komt binnen uit een masker van boven naar onder, met het getal op de tweede
regel; met een eigen klok stond de teller al tussen 45 en 50 voor die regel
zichtbaar werd. Nu staat er een 0 zodra de animatie van de kop begint, en telt
hij naar 100 als het masker klaar is. Komt de kop niet met een animatie binnen —
al in beeld, het vangnet, gereduceerde beweging, papier — dan blijft de 100 uit
de HTML gewoon staan. **Alleen een getal van drie cijfers telt**, want 3ch
(`--maat-teller`) is de breedte die het getal krijgt; een ander getal in de kop
blijft gewone tekst.

### De haal — de ovaal, het onderstreepje en de pijl

De mockup introduceert twee met de hand getekende vormen naast de
bliksemschicht: een ellips om een woordgroep ("1 van de 100", "hele agenda") en
een losse, licht scheve streep onder een kop ("NODIG HEBT.", "BETER IS."). Later
kwam er een derde bij: de pijl naast de belangrijkste knop, zie hieronder.

Alleen de ovaal staat op `vuur` — de brief noemde papier-op-donker, maar een
witte haal om een witte kop loopt dwars door de letters; zie de vuur-regel in het
kleurhoofdstuk. De streep en de pijl staan op `papier`; waarom, staat bij elk
van de twee. Ze horen bij dezelfde familie als de schicht — één beweging, geen
constructie — en
zijn dus een verwantschap en geen stijlbreuk. De rollen van de schicht blijven
zoals ze waren.

**Dit is de enige beweging op de site die niet op `--inslag` loopt.** De inslag
is een klap die scherp afremt en stilvalt; een haal is een hand die doorstreept.
`--haal` is daarom precies andersom gebouwd:

| Token | Waarde | Waarvoor |
|---|---|---|
| `--haal` | `cubic-bezier(0.35, 0.08, 0.75, 0.6)` | de curve van een pennenstreek |
| `--haal-pauze` | 200ms | stilte tussen binnenkomst en haal |
| `--haal-wacht` | `--duur-inslag-hef` + `--haal-pauze` | 620ms, bovenop de plek in de ploeg |
| `--duur-haal-ovaal` | 450ms | de hele ronde, in één doorlopende haal |
| `--duur-haal-streep` | 350ms | korter, want de streep is korter |
| `--duur-haal-pijl` | 400ms | de schacht van de pijl: langer dan de streep, want er komt een punt achteraan |
| `--duur-haal-pijl-punt` | 180ms | de punt, die begint waar de schacht ophoudt; samen 580ms |
| `--haal-dikte-ovaal` | `4px` | schermdikte van de ovaal (non-scaling-stroke) |
| `--haal-dikte-streep` | `2.5px` | schermdikte van de streep |
| `--haal-dikte-pijl` | `2.5px` | gelijk aan de streep; de viewBox loopt één op één met de pixelmaat |

Het tweede stuurpunt van `--haal` ligt op `0.75, 0.6`, dus de helling waarmee de
curve bij 1 aankomt is 1,6: **de lijn is nog in beweging op het moment dat hij
ophoudt.** `--inslag` doet het omgekeerde en dempt uit op `0.1, 1`.

**Eerst het element, dan de haal.** Het element komt binnen in het gewone ritme
van de ploeg; pas als het stilstaat, 200ms later, wordt de haal eromheen gezet.
Ze horen niet tegelijk te gebeuren — dan is het één effect in plaats van een
aanwijzing achteraf. De vertraging is dus de stap van het element plus
`--haal-wacht`, en die eerste helft komt via `--stap-vertraging` binnen: elke
stapregel in `beweging.css` zet die variabele, en een custom property erft. Een
haal binnen een kop op stap 2 leest daardoor vanzelf 2 × `--ploeg`, zonder dat
iemand die stap nog een keer doorgeeft.

**De ovaal vertrekt links, gaat met de klok mee en trekt over zijn eigen begin
door.** De staart kruist de bovenrand nog een keer en eindigt halverwege de
bovenkant. Dat overschot is het verschil tussen een gebaar en een vorm: een
ellips die netjes aansluit is een figuur, een lijn die er voorbij loopt is een
hand geweest. De haal is niet symmetrisch — rond hem niet af.

**De lijn ligt achter de tekst.** De svg staat op z-index 0 en de tekst-span op
1, en de svg steekt ruim om de tekst heen (19% links, 56% boven, 138% breed,
212% hoog). Samen maken die twee een aanraking onschuldig: de afstand maakt de
kans klein dat de lijn een stok of schreef van de typemachineletter raakt, en
de z-orde zorgt dat wáár het toch gebeurt de lijn wordt onderbroken en niet de
letter.

Drie dingen aan de uitwerking die gemeten zijn en niet bedacht:

- **`vector-effect="non-scaling-stroke"`.** De ovaal spant zich om een
  woordgroep van elke lengte, dus hij rekt in de breedte mee
  (`preserveAspectRatio="none"`). Zonder dit attribuut rekt de lijn mee: dikke
  zijkanten, dunne boven- en onderkant.
- **Breedte én hoogte staan uitgeschreven.** Een svg is een vervangen element
  met een eigen verhouding, en die verhouding wint van een insetpaar zodra de
  andere maat op `auto` staat. Met alleen insets werd het vlak om een kop van
  467×73 pixels 531×319 — de hoogte kwam uit het viewBox. Met alleen een hoogte
  erbij werd het 173×104: toen kwam de bréédte eruit.
- **De dash is een gemeten schermlengte, geen genormaliseerd pad.** De eerste
  uitwerking zette `pathLength="100"` zodat ovaal en streep één keyframe konden
  delen. Chrome bleek pathLength te negeren zodra non-scaling-stroke op het pad
  staat: de dash wordt in schérmruimte gerekend, dus "100" was 100 schermpixels
  — een lijn met een gat van 45 tot 80% en een tekening die het patroon maar
  100px verschoof. Nu meet `HaalScript` de schermlengte van elk pad en zet die
  als `stroke-dasharray` en beginnende `stroke-dashoffset` op het pad zelf;
  `haal.css` zet de offset op 0 zodra de waarnemer het element loslaat en de
  transitie — zelfde curve, zelfde duren, zelfde wachttijd — is het tekenen.

**Bij een woordgroep die over twee regels breekt komt er geen ovaal.** Een
uitgerekte ellips over twee regels heen is geen aanwijzing meer. Dat is niet uit
te rekenen tijdens het bouwen — het hangt aan de vensterbreedte, aan het
lettertype dat al dan niet geladen is en aan wat de redacteur invult — dus
`HaalScript.astro` meet het: een inline element dat over twee regels loopt,
levert twee rechthoeken op. Het meet opnieuw zodra het lettertype binnen is en
bij elke verandering van de vensterbreedte.

*Afwijking:* de lijn begint daardoor verborgen en wordt zichtbaar gemaakt, en
**zonder JavaScript staat er dus geen ovaal.** Dat is de andere kant op dan de
scrollonthulling, waar het uitgangspunt juist is dat er zonder script niets
verborgen blijft. De reden voor het verschil is dat de haal decoratief is en op
`aria-hidden` staat: er gaat geen betekenis verloren, en een ontbrekende
versiering is beter dan een uitgerekte. Bij gereduceerde beweging draait het
script gewoon — het meet alleen, het beweegt niets — dus daar staat de haal er
wél, volledig getekend en meteen.

**Het onderstreepje is de kleine broer.** Zelfde curve, zelfde pasvorm, zelfde
tekenlogica, alleen korter: 350ms tegen 450. Drie dingen zijn anders:

- **Het is één pad dat heen en terug gaat, geen twee losse lijnen.** De pen
  loopt naar rechts langs de onderkant en komt terug langs de bovenkant, dus de
  uiteinden rechts komen vanzelf samen — zoals in de mockup. Links blijft er
  lucht tussen begin en eind: daar is de pen opgetild.
- **Hij staat op `papier` en niet op `vuur`.** De streep staat onder een grote
  witte kop, en een tweede kleur maakt het daar onrustig. De ovaal houdt vuur:
  die wijst iets aan en mag opvallen.
- **Hij hangt ónder de staarten en niet erdoor.** Die inset is gemeten: het
  regelvak van een displaykop staat op een regelhoogte onder 1, dus de letters
  steken er onderuit. Op 0,22em begon de lijn 13,9px bóven de onderkant van de
  letters op een kop van 76,8px en liep hij dwars door de staart van een p en
  een g; op 0,42em begint hij er 4,5px onder, en op een kop van 41px 5,2px.

**De pijl is de derde.** Een korte haal met een punt, naast de eerste knop van
een oproep: de ovaal omcirkelt, de streep bevestigt, de pijl wijst. Zelfde
curve, zelfde `aria-hidden`. Wat anders is:

- **Hij staat op `papier` en niet op `vuur`.** Vuur zou de familie zijn, maar hij
  wijst naar een knop die zelf vuur is, en twee keer dezelfde kleur naast elkaar
  laat de aanwijzing met het aangewezene concurreren. Net als de streep heeft hij
  geen lichte tak.
- **Twee paden, eerst de schacht en dan de punt.** Allebei met
  `pathLength="1"`, dus een dasharray van 1 is precies het hele pad en valt er
  niets te meten — `HaalScript` slaat een pad met `pathLength` over. Geen
  non-scaling-stroke: de svg is 40 bij 40 pixels met een viewBox van 40 bij 40,
  dus de dikte in de CSS is meteen de dikte op het scherm. De schacht duurt
  400ms, de punt 180ms en begint waar de schacht ophoudt.
- **Maximaal één per pagina, en dat wordt afgedwongen.** `SectieLijst` geeft
  hem aan de eerste oproep die erom vraagt én een knop heeft; een oproep zonder
  knop verbruikt de beurt niet.

**Maximaal één ovaal en één streep per sectie.** Dezelfde soort regel als bij de
schicht en net zomin af te dwingen in code: twee ovalen in één blikveld maken er
een stijlmiddel van in plaats van een aanwijzing. Het verschil tussen de twee zit
in de pagina: een ovaal wijst iets aan en verdient schaarste over de hele
pagina, een streep bevestigt een slotzin en mag dus in meer secties staan.

**De ovaal en de streep verschuiven niets.** Allebei staan ze absoluut
gepositioneerd buiten de stroom. Voor de pijl geldt dat niet: die is een gewoon
flex-item van 40px vóór de knop en neemt zijn eigen ruimte in. Het tekenen zelf
verschuift ook bij hem niets, maar zijn svg staat net als de andere op
`display: none` tot `HaalScript` de pasvorm heeft gezet, en op dat moment
schuift de knop ernaast één keer op.

Nagemeten op `/secties` met vier halen: de paginahoogte is 35646px in
alle drie de toestanden — vóór de meting, met alles verborgen en met alles
zichtbaar — en `offsetTop`, `offsetLeft`, `offsetWidth` en `offsetHeight` van
elke alinea en elke kop zijn in die drie toestanden identiek.

**Op beeld dat ergens heen gaat staat een lichte zoom.** 1.05 in 700ms, en dus
ruim trager dan een binnenkomst — die is over voor de zoom halverwege is. Alleen
waar het beeld klikbaar is of naar iets verwijst; een foto die nergens heen
gaat, hoort niet te reageren op een muis.

*Afwijking:* de bron geeft voor deze zoom geen eigen curve. Hij loopt daarom op
`--soepel-uit`, de bestaande uitloopcurve van het design system; er is geen
nieuwe waarde bij verzonnen. Hoort hier een eigen curve, dan komt die uit de
bron.

Bij `prefers-reduced-motion: reduce` staat alles er meteen. Geen verplaatsing,
geen vertraging, geen masker, geen zoom en geen tellende kop. Dat is niet één
regel maar drie: `beweging.css` staat helemaal binnen
`screen and (prefers-reduced-motion: no-preference)`, het script zet zijn vlagje
niet, en de tokens hierboven vallen in `tokens.css` terug op 1ms en 0px.

**Op papier staat alles er.** Dat `screen` in die mediaquery is er sinds B16, en
het is een reparatie. Een voorkeur voor beweging geldt ook bij afdrukken, en
afdrukken laat geen waarnemer vuren: wat nog niet in beeld was geweest, stond op
papier en in een pdf op dekking nul. Gemeten met print-emulatie op de live
deploy: op `/privacy` 28 van de 34 blokken leeg, op `/voorwaarden` 13 van de 18,
en op `/de-100` en `/opdrachtgevers` geen enkel FAQ-antwoord. Nu geldt op papier
hetzelfde als zonder JavaScript:

- de wachtstand van de scrollonthulling en het tekenblok van `haal.css` staan
  binnen `@media screen and (prefers-reduced-motion: no-preference)`
- een printregel in `global.css` zet elk accordeonpaneel open, ongelaagd zodat
  hij wint van de Tailwind-utility die het dichtzet
- de haal staat niet op papier: de pasvorm is op het scherm gemeten, en een
  afdruk heeft een andere regelbreedte

`check-onthul` bewaakt de eerste twee: dat onthul-inhoud alleen binnen
`@media screen` verborgen wordt, en dat de printregel van het accordeon er staat.
Dat de haal op papier wegblijft, bewaakt hij niet.

**Afwijking — spinner en skelet staan op `motion-safe`.** De bron laat de
spinner bij gereduceerde beweging op 2,4s draaien en zet de skelet-animatie uit.
Die 2,4s haalt het niet: de globale regel eromheen zet `animation-duration` met
`!important` op 1ms, en dat wint. Het gevolg zou zijn dat de spinner juist
razendsnel gaat tollen bij precies de bezoeker die om minder beweging vraagt.

Daarom draaien spinner en skelet nu binnen
`@media (prefers-reduced-motion: no-preference)`. Wie gereduceerde beweging
vraagt krijgt een stilstaande ring en een stilstaand skelet — geen beweging in
plaats van te snelle beweging. De laadstatus blijft zichtbaar via `aria-busy` en
de vorm zelf.

## Beeld

Eigen fotografie, geen stock. Full-bleed of tot de containerrand. Verhoudingen
16:9 (`breed`), 4:5 (`portret`), 1:1 (`vierkant`).

**Tekst op beeld loopt altijd via `Beeldvlak`**, dat de sluier afdwingt. Zonder
behandeling haalt witte tekst op deze fotografie nooit betrouwbaar AA, en een
foto is geen token: hij wordt vervangen en dan klopt het contrast niet meer.

**De drie verhoudingen staan in `tokens.ts`, niet in een component.** Ze zijn
een tokennaam naar een klasse, net als achtergrond en ruimte, en ze gelden voor
elk vlak waar een foto in valt. `Beeldvlak` bood ze al aan; `BeeldTekst` had
16:9 hardgecodeerd en dat was de uitzondering, geen regel. Nu lezen beide
dezelfde tabel.

Dat is geen overbodige keuze. Het merendeel van de aangeleverde fotografie is
staand (1333×2000); in een liggend vlak van 16:9 verdwijnt daar gemeten **63%
van de hoogte**. Er komt geen vervorming bij kijken — `object-cover` snijdt
netjes weg — en juist daardoor valt het niet op: op portretten snijdt het
midden de hoofden eraf. De standaard blijft `breed`, zodat bestaande inhoud niet
verschuift.

`BeeldTekst` gaat bewust níet via `Beeldvlak`. Daar staat de tekst náást het
beeld en niet erop, dus de sluier heeft er geen functie en zou de foto alleen
verduisteren. Wat gedeeld wordt is de verhoudingstabel, niet het component.

**Op een foto bestaat geen gedempte tekstkleur.** `Beeldvlak` zet daarom altijd
`data-vlak`, en die regel in `tokens.css` bindt `--tekst-zacht` en `--tekst-stil`
aan de hoofdtekstkleur. Waarom dat moet en met welke cijfers staat bij *Contrast
op een sluier meet je op het slechtste geval*, in het kleurhoofdstuk — daar
staat ook de fout die dit blootlegde: vier bovenkoppen op 1,46:1.

**Afwijking — de hero gebruikt óók de vlakke sluier.** De beeldrichtlijn wijst
`onder` toe aan "hero, tekst onderaan", en dat klopt zolang die tekst één regel
is. De hero uit de mockup is dat niet: bovenkop, displaykop, een zin en twee
knoppen beslaan samen meer dan de helft van het vlak. Gemeten op 1137×640 met
het verloop:

| Regel | Bovenkant, vanaf onder | Dekking daar | Wit op een witte foto |
|---|---|---|---|
| bovenkop | 54% | 0,53 | **3,75** |
| displaykop | 49% | 0,59 | 4,54 |
| lopende zin | 29% | 0,77 | 8,52 |
| knoppen | 10% | 0,87 | 12,2 |

De bovenkop zakt daar onder AA. Met de vlakke sluier is het overal 0,62 en haalt
wit in datzelfde geval 5,04:1. Dat is dezelfde afweging die de splitscreen-deur
al maakte, om precies dezelfde reden: zodra de tekst het vlak vult, staat de
bovenste helft ervan op het doorzichtige deel van het verloop.

**De sluier uit de mockup haalt het niet.** De hero op p1 zet witte tekst op de
lichte sepia-laag. Doorgerekend: wit op `--sluier-licht` haalt tussen 1,35:1 en
2,95:1, afhankelijk van wat er op de foto staat — nergens genoeg, ook niet voor
groot. Er zijn twee uitwegen en allebei geven ze iets op: donkere tekst op die
lichte sluier haalt 6,67 tot 14,55:1 maar verliest de dubbellaagse kop, want die
vervalt op een licht thema; witte tekst op de donkere sluier haalt 5,04 tot
19,3:1 en houdt de dubbellaagse kop. Dat tweede is het geworden.

**Afwijking — splitscreen gebruikt de vlakke sluier.** De beeldtabel wijst
splitscreen `--sluier-zij` toe, bedoeld voor tekst in de linkerhelft. Een deur
is op mobiel ongeveer 335px breed; daar heeft tekst de volle breedte nodig en
staat de rechterhelft op het doorzichtige deel van dat verloop. Gemeten op
375px besloeg de tekst 88% van het vlak. Daarom `--sluier-donker` (62% over
alles), de regel die de bron aan "kaart met tekst over beeld" hangt — en een
splitscreen-deur ís dat functioneel. Wit haalt daar in het slechtste geval
5,05:1; die 5,4 uit B2 was op de oude sluier, die op inkt stond.

In de repo staat één foto, `src/assets/photo/proost-tap.png`, gebruikt als
og:image en in het sectieoverzicht. De overige zeven zitten in de bron. Let op:
deze beelden komen uit een pdf en zijn niet de originelen.

## Voice

Jij en wij, altijd. Zeg het in de helft van de woorden. Toon in plaats van
beweren: niet "onze mensen zijn ervaren", wel "iedereen die hier staat, heeft
honderd avonden achter een bar gestaan".

Het getal is het argument. Nooit vaag over geld, tijd of wat je krijgt — in deze
branche is concreet zijn geen stijlkeuze maar een merkbelofte.

Hoofdletters alleen op `bovenkop`, knoptekst en displaykoppen van maximaal drie
woorden. Geen emoji, geen uitroeptekens.

Knoppen schrijf je als wat de bezoeker zelf zou zeggen: "Stuur maar", niet
"Verzenden". Foutmeldingen zeggen wat er nú moet gebeuren, niet wat stuk is.
Optionele velden krijgen "— mag je overslaan"; verplichte velden krijgen geen
sterretje.

**Die veldregel geldt voor de site, niet voor de admin.** In het CMS krijgen
verplichte velden wél een sterretje, want Keystatic zet dat er zelf bij zodra
een veld validatie heeft. Dat laten we staan.

De afweging is niet dat de regel daar minder waard is, maar dat validatie er
meer waard is. Het sterretje is de zichtbare kant van een controle die
tegenhoudt dat een sectie zonder kop of een foto zonder alt-tekst wordt
opgeslagen. Bij alt-tekst is dat het verschil tussen een afspraak en een regel:
laten we de validatie weg om het sterretje kwijt te raken, dan verdwijnt precies
de controle die de toegankelijkheid bewaakt.

De twee publieken verschillen ook. De bezoeker vult een formulier in en heeft
rust nodig; de redacteur beheert een site en heeft juist baat bij een duidelijk
onderscheid tussen wat moet en wat mag. Het "— mag je overslaan" bij optionele
velden staat er in de admin gewoon bij, dus de andere helft van de afspraak
loopt daar wel door.

De volledige woordenlijst en de microcopy-tabel staan in de bron.

### Afwijking van de microcopy-tabel: geen reactietijd

De bron zet in de rij *Na versturen* de tekst **"Binnen. Je hoort binnen een dag
van ons."** Die belofte staat niet op de site, en dat is een bewuste afwijking:
er is niemand die hem waarmaakt. De klant heeft geen reactietijd toegezegd en
er is geen dienstverband of dienstrooster dat er een dekt.

Het getal is hier het probleem én de reden dat het opvalt. "Het getal is het
argument" werkt maar één kant op: een concrete belofte die niet wordt nagekomen,
kost meer vertrouwen dan een vage die wordt nagekomen. Een reactietijd is
bovendien geen tekstkeuze maar een afspraak over werk, en die hoort van de klant
te komen.

Op drie plekken stond hij en op alle drie is hij vervangen door **"Je hoort van
ons."** — waar en zonder termijn. Twee van die plekken bestaan sindsdien niet
meer: in B13 kwam op Contact en op Voor ondernemers het formulier in de plaats
van de oproep.

| Plek | Was | Daarna | Nu |
|---|---|---|---|
| Contact, hero | Mail ons wat je nodig hebt. Je hoort binnen een dag van ons. | Mail ons wat je nodig hebt. Je hoort van ons. | ongewijzigd |
| Contact, oproep | …Mail ons tot die tijd, dan hoor je binnen een dag van ons. | …Mail ons tot die tijd, dan hoor je van ons. | De oproep is het aanmeldformulier geworden. Dezelfde zin leeft door in de melding die er staat zolang het formulier uit staat: "Het formulier staat er bijna. Mail ons zolang op contact@declubvan.nl, dan hoor je van ons." |
| Voor ondernemers, oproep | Mail wat het is en wanneer. Je hoort binnen een dag van ons. | Mail wat het is en wanneer. Je hoort van ons. | De oproep is het inhuren-formulier geworden; de zin is vervallen. |

**Dit is de eindtekst en geen plaatshouder meer.** Lange tijd stond hier dat de
termijn er alsnog in zou gaan zodra de klant er een noemde. Die vraag is gesteld
en beantwoord: **er komt geen reactietermijn.** De site noemt er dus nergens een,
en de zinnen die er nog staan blijven zoals ze zijn.

Dat maakt de afwijking van de bron definitief. "Het getal is het argument" blijft
gelden voor alles wat wél vaststaat — honderd professionals, uitbetaling op
donderdag — maar een reactietijd is geen tekstkeuze en die is er niet.

**De succesboodschap van het formulier volgt dezelfde regel.** De bron geeft er
`<Melding toon="goed">Binnen. Je hoort binnen een dag van ons.</Melding>` voor;
op de site staat **"Binnen. Je hoort van ons."** Wie eraan werkt, neemt die zin
over uit deze paragraaf en niet uit de bron.

Wat wél blijft staan is de FAQ-regel op Voor ondernemers dat er "soms dezelfde
dag nog" iemand geregeld kan worden. Dat is geen belofte over reageren maar een
uitspraak over beschikbaarheid, hij staat zo in de brontekst van de klant, en
hij is met "soms" al voorwaardelijk geformuleerd.
