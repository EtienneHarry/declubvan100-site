# Overdracht — de site van De Club van 100

> **Voor Lune**, redacteur en contactpersoon bij De Club van 100. Stand van
> 1 oktober 2026.
>
> Dit document legt uit hoe de site in elkaar zit, wat er nog moet gebeuren
> voordat hij op declubvan.nl staat, en hoe je hem zelf beheert. Waar "de
> bouwer" staat, is dat Etienne Kick van Kick&Work. Technische details voor een
> volgende bouwer staan in `CLAUDE.md` en `livegang.md`.

## In het kort

De site is af en draait op https://declubvan100.vercel.app. Hij staat nog niet
op declubvan.nl: dat adres moet er nog aan gekoppeld worden. Het formulier
staat nog uit; tot het aangaat, zien bezoekers op die plek een regel met het
mailadres.

## De laatste controle

Voor de overdracht is de hele site op 1 oktober 2026 nog een keer doorgelicht:
wat er op de pagina komt, hoe snel, hoe toegankelijk, hoe veilig, en of de
koppelingen met de hosting, het CMS, de mail en het domein goed staan. Wat
eruit kwam en is verholpen, in gewone taal:

- **Afdrukken gaf halflege pagina's.** Tekst die nog niet in beeld was geweest,
  bleef weg op papier en in een pdf — bij de privacyverklaring 28 van de 34
  blokken. Nu staat alles erop, ook de antwoorden van de veelgestelde vragen.
- **Op een telefoon viel de tweede knop op de home half buiten beeld.** Nu
  staan "Aanmelden" en "Inhuren" allebei in het eerste scherm.
- **De teller in "De Club van 100" telde grotendeels onzichtbaar.** Nu zie je
  hem van 0 naar 100 lopen.
- **De foto bovenaan de home laadt eerder en lichter** — op een groot scherm
  194 kB in plaats van 476 kB — en de lettertypes komen sneller binnen.
- **Een adres dat niet bestaat** geeft nu een pagina in de huisstijl in plaats
  van een kale Engelse foutmelding.
- **Het CMS is beter afgeschermd**, en de site heeft er een paar
  beveiligingsinstellingen bij.
- **Het mailadres in de meldingen van het formulier is aan te tikken**, en
  als versturen misgaat ziet de bouwer dat nu terug — zonder dat er
  persoonsgegevens in komen te staan.
- **Een fotobeschrijving hoorde nog bij een oude foto**; die is aangepast. En
  de Engelse koppen worden nu in het Engels voorgelezen.
- **Het CMS laat geen link meer opslaan die nergens heen kan**, en geen kop
  die alleen uit spaties bestaat.

Deze verbeteringen staan klaar en gaan live zodra de bouwer ze publiceert. Wat
níet verholpen is, omdat het een keuze van jullie is, staat verderop bij *Wat
jij nog moet beslissen of aanleveren*.

## Lees dit eerst: zie je "Unsaved" of een lege lijst?

Open je een pagina en staat er **"Unsaved"** bovenaan, of is de lijst met
secties leeg terwijl er inhoud hoort te staan — doe dan dit:

1. **Sla niets op.** Niet op Save drukken.
2. Klik op **Reset**, het pijltje linksboven naast de opslaanknop.
3. De inhoud verschijnt. Nu kun je gewoon verder.

Wat je ziet is een oude, half afgemaakte bewerking die je browser heeft
onthouden — van jou, op deze computer, misschien weken geleden. Die versie legt
zich over wat er werkelijk op de site staat. Reset gooit dat weg en haalt de
echte inhoud terug.

**Druk je in die toestand op Save, dan overschrijf je de pagina met wat je ziet.**
Bij een lege lijst betekent dat: alle secties weg.

Dit is niet iets wat wij hebben ingebouwd en het is niet uit te zetten; het zit
in het CMS zelf. Twijfel je of wat je ziet klopt, klik Reset — je verliest er
nooit iets echts mee, alleen een niet-opgeslagen bewerking.

## Wat er nog moet gebeuren

In deze volgorde. Bij elke stap staat wie hem doet en waarom. De technische
uitwerking voor de bouwer staat in `livegang.md`.

### 1. De accounts op hun plek

*Wie:* de bouwer. *Uitwerking:* livegang, *Vooraf*.

De repository (de map met alle teksten, foto's en code) is
`EtienneHarry/declubvan100-site` en is **openbaar**: iedereen kan de code en
de teksten van de site lezen, maar alleen wie toegang heeft kan iets wijzigen.
Er staan geen wachtwoorden of sleutels in; die staan bij de hosting. Het
materiaal dat jullie hebben aangeleverd staat er niet in, alleen wat al op de
site staat.

De hosting bij Vercel gaat over naar het Vercel-team van DNAsign. Het gratis
Hobby-abonnement is volgens de voorwaarden van Vercel niet bedoeld voor
commercieel gebruik; in een team kan het project op een passend abonnement.

De rem die zorgt dat niets live gaat zonder jouw klik op Merge, werkt op een
openbare repository zonder betaald GitHub-plan. De bouwer controleert na de
verhuizing dat de rem er nog is.

### 2. Het domein koppelen bij Mijndomein

*Wie:* wie bij de Club kan inloggen bij Mijndomein, samen met de bouwer.
*Uitwerking:* livegang, stap 1.

Pas dan staat de site op declubvan.nl. Er gaat niets verloren: op declubvan.nl
staat nu alleen een lege standaardpagina van de server, geen site. Er
veranderen twee regels — waar declubvan.nl naartoe wijst en waar
www.declubvan.nl naartoe wijst. Al het andere blijft staan: de mail, en de
regels die het formulier nodig heeft om te kunnen mailen. Het domein blijft
ook gewoon bij Mijndomein; je verhuist niets.

**Zeg het hostingpakket bij Mijndomein niet op** voordat vaststaat dat de
mailbox contact@declubvan.nl daar los van staat. Anders kan je mail
meeverdwijnen.

### 3. Inloggen in het CMS via het nieuwe adres testen

*Wie:* eerst de bouwer, dan jij. *Uitwerking:* livegang, stap 3.

De bouwer zet het nieuwe adres in de inlog-app van GitHub; zonder die
instelling loopt inloggen op declubvan.nl vast. Daarna log je één keer in op
https://declubvan.nl/keystatic terwijl de bouwer meekijkt.

### 4. Je eigen toegang

*Wie:* jij, met de bouwer. *Uitwerking:* livegang, stap 4.

Op dit moment heeft alleen de bouwer toegang tot de repository. Maak een
GitHub-account aan als je dat nog niet hebt, en accepteer de uitnodiging die de
bouwer je stuurt, met de rol *Write*. Doe de eerste wijziging samen, zodat
jullie zien dat alles gaat zoals hieronder bij *Zo gaat een wijziging de deur
uit* staat.

### 5. Het formulier openzetten

*Wie:* de bouwer zet het aan, de proef doen jullie samen.
*Uitwerking:* livegang, stap 5.

De bouwer zet het formulier aan en publiceert de site opnieuw. Dan doen jullie
samen één proefinzending per formulier: aanmelden op Contact en personeel
aanvragen op Voor ondernemers. Jij kijkt of beide mails binnenkomen op
contact@declubvan.nl — ook in de map Ongewenst. Of het versturen echt werkt,
blijkt alleen uit een mail die aankomt.

**Stuur de site pas rond als dit gelukt is.**

### 6. Google Search Console

*Wie:* jij vraagt rond, de bouwer doet de rest. *Uitwerking:* livegang, stap 2.

In Search Console zie je hoe Google de site vindt. Er staat al een
controleregel van Google op het domein, dus waarschijnlijk heeft iemand van de
Club al een account. Vraag rond wie; die persoon voegt de bouwer toe als
gebruiker. De bouwer meldt dan de lijst met pagina's aan (de sitemap), en ziet
na een week welke adressen van de oude site Google nog kent.

### 7. Een rem tegen spam op het formulier

*Wie:* de bouwer. *Uitwerking:* livegang, stap 6.

Een limiet in Vercel op het aantal inzendingen per minuut, als het abonnement
dat toestaat. Een bot die het formulier wil volspammen loopt daartegenaan; een
mens merkt er niets van.

### 8. Snelheid meten op het echte adres

*Wie:* de bouwer. *Uitwerking:* livegang, stap 8.

Na de livegang, met PageSpeed Insights. Er is al een nulstand van 1 oktober,
gemeten zoals een telefoon op een trage verbinding de site laadt: op vijf van
de zes pagina's staat de inhoud er binnen anderhalve seconde, op de home bij
een eerste bezoek in 2,8 seconde — iets boven de 2,5 die Google als grens
aanhoudt. Tijdens het laden verspringt er vrijwel niets.

## Wat jij nog moet beslissen of aanleveren

Staat er *CMS* bij, dan kun je het zelf aanpassen. De rest gaat via de bouwer.

| Vraag | Waarom het ertoe doet | Waar |
|---|---|---|
| **Wat zegt het eerste scherm?** De bovenkop op de home is "Meer dan een uitzendbureau. Echte mensen.", de zin eronder begint met "Geen uitzendbureau, maar…". Welke geldt? | Ze spreken elkaar tegen, en het is het eerste wat iemand leest. "Geen uitzendbureau, maar…" staat ook in de omschrijving voor zoekmachines van Home en in de site-instellingen. | CMS: Home → Openingssectie; Home → Omschrijving voor zoekmachines; Site-instellingen → Waar de site over gaat |
| **Eigen omschrijvingen voor zoekmachines** voor Voor wie is de club? en Voor ondernemers | Die twee komen uit voorbeeldzinnen in de stijlgids, niet van jullie. Die van Voor wie is de club? zegt "Iedereen die hier staat, heeft honderd avonden achter een bar gestaan", terwijl de pagina zegt dat ervaring mooi meegenomen is maar geen eis. Een goede omschrijving is 50 tot 160 tekens en zegt wat de bezoeker er kan doen. | CMS: De 100 en Opdrachtgevers → Omschrijving voor zoekmachines |
| **Een titel voor de home** met wat jullie doen en waar | Nu staat er alleen "De Club van 100". Een titel met de dienst en de plaats erin helpt om gevonden te worden door wie jullie naam nog niet kent. | CMS: Home → Titel van de pagina |
| **De voorwaarden:** een langere omschrijving, en een datum | De omschrijving is nu één korte zin, en aan de voorwaarden is niet te zien welke versie geldt. | CMS: Voorwaarden → Omschrijving voor zoekmachines; de datum kan in de openingssectie, zoals bij de privacyverklaring |
| **Mogen de twee klantcitaten openbaar?** | Bij De Speld en Stadslab Groningen staat in het aangeleverde materiaal "Openbaar gebruik nog te bevestigen". Zonder hun akkoord horen ze er niet op. | CMS: Opdrachtgevers → Citaten |
| **Akkoord op teksten die niet uit jullie materiaal komen:** "Zeg het maar." (kop op Contact); de bovenkop "Meld je" en de zin "Denk je dat jij een van de betere achter de bar van de stad bent, laat het weten." (Voor wie is de club?); "Jij regelt de rest." (Home); "Wat opdrachtgevers zeggen" (Voor ondernemers). En de formulierteksten die na je goedkeuring van 29 september zijn bijgekomen: de foutpagina, de pagina "Even terug", de extra zin op de bedankpagina, de toevoeging "— of mail naar contact@declubvan.nl" bij een fout aan onze kant, en de nieuwe pagina voor adressen die niet bestaan | Alles op de site hoort jouw woorden of jouw akkoord te hebben. | De exacte zinnen staan hieronder, bij *De teksten die nog op je akkoord wachten*. De eerste vier: CMS. De formulierteksten: via de bouwer |
| **Welke kop boven het formulier op Voor ondernemers?** Goedgekeurd was "Vertel wat je nodig hebt"; er staat nu de afsluiter uit het ontwerp, "Goede mensen op het moment dat je ze nodig hebt." | Wat er staat, is niet wat je hebt goedgekeurd. | CMS: Opdrachtgevers → Formulier → Kop |
| **Waar gaat de knop "Aanmelden" op de home heen?** Nu naar Voor wie is de club?, waar eerst de uitleg staat. Het formulier zelf staat op Contact. | Eerst uitleg, of meteen naar het formulier: allebei kan. | CMS: Home → Openingssectie → Knop → Waar de knop heen gaat |
| **Het menulabel "Contact"** leidt naar een pagina die vooral een aanmeldpagina is. De contactkaarten zijn op jouw verzoek weggehaald; de gegevens staan onderaan elke pagina. Zo laten? | Wie op Contact klikt, verwacht misschien een adres of nummer en vindt een aanmeldformulier. | CMS: Site-instellingen → Menu bovenaan |
| **De veelgestelde vragen:** een indicatie van tarief en loon noemen? Mogen "Wat verdien ik?" en "Hoe word ik uitbetaald en wanneer?" samen? Mag "inzetbaar" eruit? | Het merk zegt "nooit vaag over geld", en nu noemt geen van beide lijsten een bedrag. De twee uitbetaalvragen zeggen grotendeels hetzelfde. "Inzetbaar" staat op de lijst met woorden die het merk niet gebruikt. | CMS: De 100 en Opdrachtgevers → Vragen en antwoorden |
| **"De Club" als korte naam:** overal met hoofdletters? | Zo staat het nu op de site ("bij De Club passen"). Moet het anders, dan is dit het moment. | CMS: verspreid over de pagina's |
| **Mijndomein in de privacyverklaring?** Bij naam noemen, net als Vercel en Resend? En is de verwerkersovereenkomst met Mijndomein geregeld? | Nu staat er "De partij waar onze mailbox draait". De overeenkomsten met Vercel en Resend zijn geaccepteerd; van Mijndomein weten we het niet. | CMS: Privacyverklaring → Lopende tekst |
| **Een nummer in de foutmelding?** "Probeer het zo nog een keer, of bel gewoon even" noemt geen nummer. | Wie het formulier niet kan versturen, moet het nummer dan zelf zoeken. | Via de bouwer |
| **De typemachineregel op Voor wie is de club?** beslaat drie regels op een computer en vijf op een telefoon. Het ontwerp staat er twee toe. Korter, of zo laten? | Uit een eerdere ronde. | CMS: De 100 → Lopende tekst → Kop |
| **De foto "lachende man met kopje"** uit het ontwerp ontbreekt. Nu staat er een lachende man zonder kopje. Hebben jullie het origineel? | Uit een eerdere ronde. | CMS: De 100 → Kaarten naast elkaar |
| **De typemachine- en de handschriftletter** zijn een benadering. Weet de maker van het ontwerp welke letters het echt zijn? | Uit een eerdere ronde. | Via de bouwer |
| **365Werk.** De privacyverklaring noemt 365Werk niet. Dat klopt zolang er van de site niets naar 365Werk gaat. Gaan gegevens uit een aanmelding later wel naar 365Werk? | Dan is de vraag of de verklaring dat moet noemen. | Privacyverklaring |

### De teksten die nog op je akkoord wachten

Dit zijn de exacte zinnen bij de vraag *Akkoord op teksten* hierboven. Per zin staat erbij
waar hij staat: staat er *CMS*, dan pas je hem zelf aan; de rest gaat via de
bouwer.

**Teksten die niet uit jullie materiaal komen**

| Zin | Waar |
|---|---|
| Zeg het maar. | CMS, Contact: kop van de openingssectie |
| Meld je | CMS, Voor wie is de club?: bovenkop van het slotblok |
| Denk je dat jij een van de betere achter de bar van de stad bent, laat het weten. | CMS, Voor wie is de club?: tekst van datzelfde slotblok |
| Jij regelt de rest. | CMS, Home: tweede zin onder de kop "Wij regelen de mensen." |
| Wat opdrachtgevers zeggen | CMS, Voor ondernemers: bovenkop boven de citaten |

**De pagina na een afgekeurde inzending.** Die ziet alleen wie verstuurt
terwijl een veld nog niet goed is, wie verstuurt en dan een mislukte verzending
krijgt, of wie verstuurt terwijl het formulier uit staat.

| Zin | Wanneer |
|---|---|
| Even terug | De kop, als het formulier openstaat |
| Nog even geduld | De kop, als het formulier uit staat |
| Er ging iets mis. Hieronder staat wat er nog moet gebeuren. | Het versturen zelf mislukte |
| Er mist nog iets. Onder de velden staat wat er nog moet gebeuren. | Een of meer velden zijn afgekeurd |

Die laatste verving "…wat hieronder rood staat". Wie geen rood ziet, had daar
niets aan; de melding staat nu als tekst onder elk veld.

**De bedankpagina.** De kop is de goedgekeurde "Binnen. Je hoort van ons."; de
zin eronder is erbij gekomen:

> We hebben je bericht ontvangen. Wil je er iets aan toevoegen, mail dan naar
> contact@declubvan.nl.

**Een fout aan onze kant.** Achter de goedgekeurde zin "Er ging iets mis bij
ons. Probeer het zo nog een keer, of bel gewoon even" staat nu "— of mail naar
contact@declubvan.nl." Dat staat er zodat wie na een mislukte verzending
alsnog ergens terecht moet, een adres heeft: "bel gewoon even" noemt geen
nummer.

**De statusregel.** Houdt het formulier een inzending tegen, dan zegt een regel
die een voorleesprogramma voorleest "Er mist nog iets." of "Er missen nog *n*
dingen."

**De pagina voor adressen die niet bestaan.**

| Zin | Herkomst |
|---|---|
| Nog niks te zien hier. | De microcopy-tabel van het design system, waar hij voor een lege lijst staat |
| Ik zoek personeel | De hoofdknop voor opdrachtgevers uit het design system |
| Ik wil bij jullie werken | De hoofdknop voor professionals uit het design system |
| Dit adres bestaat niet, of niet meer. Kies hieronder waar je heen wilt. | Nieuw geschreven |

## Accounts en wie ze heeft

| Dienst | Waarvoor | Nu bij | Na overdracht | Let op |
|---|---|---|---|---|
| **GitHub** — repository `EtienneHarry/declubvan100-site`, openbaar | Alle teksten, foto's en code. Wat je in het CMS opslaat, komt hier terecht | account van de bouwer | account van de bouwer | Openbaar: iedereen kan lezen, alleen wie toegang heeft kan wijzigen. Geen geheimen in de repository |
| **GitHub App** van het CMS | Laat je met je GitHub-account inloggen in het CMS | account van de bouwer | account van de bouwer | Hangt aan de repository; moet op `declubvan100-site` geïnstalleerd zijn |
| **Vercel** — project `declubvan100` | De hosting: bouwt de site, maakt de voorvertoningen, en zet hem op declubvan100.vercel.app. Het formulier en het CMS draaien op servers in Frankfurt | account van de bouwer | Vercel-team DNAsign | Hobby is niet voor commercieel gebruik; in het team op een passend abonnement |
| **Resend** | Verstuurt de mails van het formulier, als formulier@declubvan.nl | navragen bij de bouwer | *in te vullen* | Het gratis plan heeft een limiet per dag en per maand. Verzonden mails staan een tijd in het verzendlogboek |
| **Mijndomein** | Het domein declubvan.nl, de DNS (waar het adres naartoe wijst) en de mailbox contact@declubvan.nl | waarschijnlijk de Club zelf | *in te vullen* | Het hostingpakket niet opzeggen voordat vaststaat dat de mailbox er los van staat |
| **Google Search Console** | Zien hoe Google de site vindt | onbekend; er staat al een controleregel van Google op het domein | *in te vullen* | Vraag rond wie het account heeft |

**Verhuist de repository later naar een ander account, dan moeten drie dingen mee:**
de instelling in het CMS die zegt waar de site staat, de GitHub App en het
Vercel-project. Dat is één klus voor de bouwer, geen drie losse.

## De site uitgelegd

### Zes pagina's

| In het menu | In het CMS | Adres |
|---|---|---|
| Home | Home | `/` |
| Voor ondernemers | Opdrachtgevers | `/opdrachtgevers` |
| Voor wie is de club? | De 100 | `/de-100` |
| Contact | Contact | `/contact` |
| Voorwaarden (onderaan) | Voorwaarden | `/voorwaarden` |
| Privacy (onderaan) | Privacyverklaring | `/privacy` |

Daarnaast zijn er twee pagina's die niet in het CMS staan: de **bedankpagina**
die iemand ziet na het versturen van het formulier ("Binnen. Je hoort van
ons."), en een **foutpagina** voor adressen die niet bestaan. Een tekst daarop
wijzigen gaat via de bouwer.

### Een pagina is een stapel secties

Van boven naar beneden, in de volgorde die je in het CMS ziet. Er zijn tien
soorten:

- **Openingssectie** — de grote kop bovenaan, eventueel met foto. Eén per pagina.
- **Twee deuren** — twee blokken naast elkaar, voor opdrachtgevers en voor
  professionals. De foto's daarin liggen vast.
- **Kop met tekst** — een kop met een stuk tekst eronder.
- **Beeld naast tekst** — een foto met tekst ernaast.
- **Kaarten naast elkaar** — een rij kaarten, met of zonder foto.
- **Citaten** — uitspraken van klanten.
- **Oproep** — een afsluitend blok met een knop.
- **Lopende tekst** — langere tekst met tussenkopjes en lijstjes.
- **Vragen en antwoorden** — vragen die openklappen als je erop klikt.
- **Formulier** — het formulier, voor aanmelden of voor personeel aanvragen.

### Beweging

Tekst en foto's komen in beeld als je naar beneden scrollt, kort na elkaar. Wie
op de computer of telefoon heeft ingesteld dat die minder beweging wil, krijgt
alles meteen te zien. Wie een pagina afdrukt, krijgt alles op papier.

### Het formulier

Er zijn er twee: **aanmelden** op Contact, voor wie bij de club wil, en
**personeel aanvragen** op Voor ondernemers.

**Wat er met een inzending gebeurt.** Die komt als mail binnen op
contact@declubvan.nl. In het onderwerp staat welke soort het is:

```
Aanmelding — Sanne de Vries
Personeelsaanvraag — Café De Kroon
```

Druk je op Beantwoorden, dan gaat je antwoord naar de persoon zelf en niet naar
het formulier.

**De site slaat niets op.** Een kopie van de inzending staat alleen in je
mailbox, en tijdelijk in het verzendlogboek van Resend, de dienst die de mail
verstuurt.

**De bewaartermijnen zijn een afspraak in je mailbox.** De privacyverklaring
belooft dat aanmeldingen twaalf maanden bewaard worden en aanvragen van
opdrachtgevers zes. De site ruimt niets op; dat doe je zelf, en aan het
onderwerp zie je welke termijn geldt.

**Bots worden tegengehouden zonder puzzel.** Er is geen "ik ben geen
robot"-vraag. Een onzichtbaar veld en een minimale invultijd vangen ze; een bot
krijgt de bedankpagina te zien, maar er gaat geen mail uit.

**Wat je zelf kunt aanpassen.** In het CMS staat het formulier als een sectie,
*Formulier*. Je kiest daar bij
*Waarvoor is dit formulier?* welke van de twee het is, en je past de kop en de
zin erboven aan. **De velden zelf liggen vast.** Ze hangen aan de
privacyverklaring: die belooft dat de site niet meer vraagt dan er staat. Wil
je een vraag erbij of eraf, vraag het de bouwer; die past het formulier en de
verklaring tegelijk aan.

### Privacy en veiligheid

Op de site staan geen cookies en geen bezoekersstatistieken, en dus ook geen
cookiemelding. Alles gaat over een beveiligde verbinding. Het CMS zit achter
inloggen met GitHub, en wat je daar wijzigt gaat pas live als je zelf op Merge
drukt.

### Foto's

Een foto vervang je in het CMS: open de pagina en de sectie, en kies bij
*Foto* een andere uit de map, of sleep een nieuwe naar het veld. Daarna
publiceer je zoals altijd. Bij de volgende publicatie maakt de site er zelf
kleinere versies van, zodat een telefoon niet de grote hoeft te laden.

**Pas bij een nieuwe foto altijd "Wat staat er op de foto" aan.** Dat is de
zin voor wie de foto niet ziet, zoals iemand met een voorleesprogramma, en voor
Google. Pas je hem niet aan, dan blijft de oude zin staan bij een foto waar hij
niet meer bij hoort. Bij de laatste controle bleek dat nog op één plek zo te
zijn.

### Het jaartal onderaan

Het jaartal onderaan elke pagina wordt bijgewerkt zodra de site opnieuw
gepubliceerd wordt. Publiceert niemand iets in januari, vraag de bouwer dan om
een nieuwe publicatie; anders staat er tot de eerstvolgende wijziging het oude
jaar.

## Zo gaat een wijziging de deur uit

Je wijzigingen komen niet meteen op de site. Ze gaan eerst naar een eigen
werkversie, daar kun je ze bekijken, en pas als ze goed zijn gaan ze live. Dat
klinkt omslachtig, maar het scheelt je precies één klik en het betekent dat je
nooit per ongeluk iets kapots publiceert.

### Waar je inlogt

Het CMS zit op `/keystatic`, achter het adres van de site:

- nu: https://declubvan100.vercel.app/keystatic
- na de livegang: https://declubvan.nl/keystatic

Je logt in met je **GitHub-account** — dezelfde knop, elke keer, vanaf elke
computer. Je hoeft niets te installeren. De eerste keer vraagt GitHub of je de
app toegang geeft tot de site. Dat mag. Daarna blijf je ingelogd.

Wachtwoord kwijt? Dat herstel je bij GitHub zelf, met *Forgot password?* op
de inlogpagina van GitHub. Toegang tot de site regelt de bouwer.

### Stap voor stap

**1. Begin op `main`.** Bovenin het CMS staat een keuzelijst met werkversies;
`main` is de echte site. Kies die, open de pagina, wijzig wat je wilt en klik
op **Save**.

**2. Je krijgt een venster met de vraag om een naam.** Boven het invoerveld
staat:

> Changes must be made via pull request to this branch.
> Create a new branch to save changes.

Er is niets misgegaan: dit is de rem die zorgt dat niets meteen live gaat. Typ
een korte naam voor wat je aan het doen bent — `nieuwe-openingstekst`,
`foto-contact`, `prijzen-2027`. Kleine letters en streepjes in plaats van
spaties. Klik op **Create branch and save**.

Dat is je eigen werkversie. De site verandert er niet van.

**3. Bekijk hoe het eruitziet.** Bovenin staat nu een knop met een pijltje,
**Create pull request**. Die opent een nieuw tabblad op GitHub met een formulier;
klik daar op de groene knop om het aan te maken.

Op de pagina die je dan krijgt verschijnt binnen een minuut een bericht van
Vercel met een link achter **Visit Preview**. Dat is jouw versie van de site,
met alles erin wat je hebt gewijzigd. Klik erop en kijk rond — ook op je
telefoon.

Ondertussen controleert de computer je wijziging automatisch. Dat duurt ongeveer
een minuut. Zolang dat loopt is de publiceerknop grijs — dat hoort zo, je hoeft
niets te doen behalve even wachten.

**4. Publiceren.** Klopt het? Klik op **Merge pull request** en bevestig. Binnen
een paar minuten staat het op de echte site.

**5. Ga terug naar `main`.** Na het publiceren blijft het CMS in je oude
werkversie staan. Kies bovenin weer `main` voordat je aan iets nieuws begint.
Doe je dat niet, dan komt je volgende wijziging in een werkversie die achterloopt
op de site.

Klopt het bij stap 3 niet? Ga terug naar het CMS — je staat nog in je
werkversie — wijzig verder en sla opnieuw op. Dat gaat zonder venster, en de
voorvertoning gaat vanzelf mee.

Wil je het helemaal niet meer? Klik op **Close pull request**. Er is dan niets
gebeurd.

### Als de controle rood wordt

Dan staat er een rood kruisje op de pagina van GitHub en blijft de
publiceerknop grijs. Je werk is niet weg: het staat bewaard in je werkversie.
Bel of mail de bouwer en stuur de link van die pagina mee.

De controle wordt bijvoorbeeld rood als een link naar een pagina gaat die niet
bestaat — een tikfout als `/opdrachtgever` in plaats van `/opdrachtgevers`. In
de melding op GitHub staat welke link het is; pas hem aan in het CMS en sla
opnieuw op.

Eén ding houd je zelf in de gaten: een heel lang woord in de grootste kop van
een pagina, die in de openingssectie, kan op een telefoon midden in het woord
breken. De controle houdt je daar niet meer voor tegen, dus kijk in de
voorvertoning op je telefoon. Breekt een woord verkeerd, kort het dan in of
vraag de bouwer om een afbreekpunt.

### Wie publiceert

Dat mag je zelf. Er is niemand die eerst hoeft te kijken — de knop staat er en
je mag hem gebruiken.

Twijfel je over een tekst, overleg dan even vóór je publiceert. Niet omdat het
systeem het eist, maar omdat terugdraaien meer werk is dan even vragen.

## Wat waar staat

| Wat je wilt wijzigen | Waar |
|---|---|
| De tekst van een pagina | Pagina's → de pagina die je zoekt |
| De volgorde van secties | Dezelfde pagina, sleep de secties |
| Wat Google toont | Pagina's → de pagina → Titel van de pagina, en Omschrijving voor zoekmachines |
| Menu bovenaan | Hele site → Site-instellingen → Menu bovenaan |
| Kolommen onderaan | Hele site → Site-instellingen → Kolommen onderaan |
| Adres, KvK, btw, telefoon, Instagram | Hele site → Site-instellingen → Contactgegevens |
| De kop en de zin boven een formulier | De pagina → Formulier |
| Een vraag in de veelgestelde vragen | De pagina → Vragen en antwoorden |
| Een Engelse kop op een kaart | De pagina → Kaarten naast elkaar → de kaart → Taal van de kop: Engels |

**Het mailadres staat op meer plekken dan één.** In het CMS: bij
Site-instellingen → Contactgegevens → E-mailadres, in de omschrijving voor
zoekmachines van Contact, en drie keer in de tekst van de privacyverklaring.
Daarnaast staat het in de code: het formulier stuurt ernaartoe, en de meldingen
van het formulier en de bedankpagina noemen het. Een ander mailadres is dus
werk voor de bouwer, niet alleen voor jou.

## Een ovaal, een streep of typemachineletter in een kop

In het ontwerp vallen sommige woorden in een kop op: met een met de hand
getrokken ovaal eromheen, een schuine streep eronder, of in de
typemachineletter. Die zet je zelf, in de tekst van de kop, met tekens
eromheen. Er is geen knopje voor.

**Een ovaal: vierkante haken.**

    Geen nummertjes, maar [1 van de 100]

Op de pagina staat er dan "Geen nummertjes, maar 1 van de 100", met een ovaal om
die laatste vier woorden. De haken zelf zie je niet.

**Een streep: accolades.**

    Omdat groter niet altijd {beter is.}

Op de pagina staat er "Omdat groter niet altijd beter is.", met een streep onder
de laatste twee woorden.

**Typemachineletter: sterretjes.**

    Echte mensen. *Geen nummertjes, maar [1 van de 100].*

Zo staat het op Voor ondernemers. "Echte mensen." staat in de gewone letter, de
rest in de typemachineletter, met een ovaal om "1 van de 100". De
typemachineletter staat altijd in hoofdletters; die zet de site zelf, dus je
typt gewoon.

Vijf dingen om te weten:

- **Eén van elk per kop.** Een ovaal, een streep en een stuk typemachine mogen
  samen in één kop. Zet je er een tweede van dezelfde soort in, dan blijft die
  staan zoals je hem typte — mét haakjes en al. Zie je op de pagina ergens
  `[woorden]` staan, dan is dat het.
- **Een ovaal of streep mag binnen de sterretjes**, zoals in het voorbeeld.
  Andersom niet: sterretjes binnen een ovaal blijven gewoon sterretjes.
- **Vergeet je het sluitteken, dan gebeurt hetzelfde.** `Kosten [vanaf 2026`
  levert precies die letters op. Er gaat niets stuk en er verdwijnt niets; het
  is alleen zichtbaar niet gelukt.
- **Kort houden.** Een ovaal om een halve zin wordt een ovaal over twee regels,
  en dan verdwijnt hij vanzelf — uitgerekt over twee regels wijst hij nergens
  meer naar. Twee tot vier woorden werkt. Voor de typemachineletter staat het
  ontwerp twee regels toe.
- **Alleen in de kop van een sectie.** Niet in de bovenkop, niet in de lopende
  tekst, niet in de koppen van Twee deuren en niet in de koppen van losse
  kaarten. Daar blijven de tekens gewoon staan.

**De pijl bij een oproep.** In een Oproep staat het vinkje *Handgetekende pijl
naar de eerste knop*. Er staat er hooguit één op een pagina: vink je hem bij
twee oproepen aan, dan krijgt de bovenste hem.

## Handelingen om op te letten

**Een link begint met een schuine streep of met https://.** Een pagina op de
site schrijf je als `/contact`, een andere site als `https://…`, een mailadres
als `mailto:…` en een telefoonnummer als `tel:…`. Typ je iets anders, dan laat
het CMS je niet opslaan en zegt het onder het veld wat er mist.

**Een leeg veld verdwijnt, het laat geen gat achter.** Haal je bijvoorbeeld het
telefoonnummer weg, dan noemt de site nergens meer een nummer — er blijft geen
lege regel of streepje staan.

**Vergeet je iets verplichts, dan gaat het venster niet dicht.** Onder het veld
dat mist verschijnt een melding, en die is Engels. `must not be empty` betekent
dat het veld leeg is, `is required` dat er nog niets gekozen is. Een sterretje
achter het label betekent dat je het veld niet kunt overslaan.

**Een vraag toevoegen aan de vragenlijst.** Op Voor ondernemers en Voor wie is
de club? staat een sectie "Vragen en antwoorden". Klik erop, klik op Add onder
Vragen, en typ de vraag en het antwoord. Ze staan op de pagina in de volgorde
waarin ze hier staan, dus zet de vraag die het vaakst gesteld wordt bovenaan.

**Sommige versieringen horen één keer per pagina:** de grote bliksemschicht,
de handgeschreven regel en de pijl. Het CMS zegt het ook bij het vinkje.

**"Kop met een donkere laag eronder" werkt maar op één plek.** Dat vinkje staat
bij elke openingssectie, maar je ziet het alleen op de openingssectie die
bovenaan de pagina staat, en alleen op een donkere achtergrond. Zet je het aan
op een openingssectie halverwege de pagina of op een lichte pagina, dan gebeurt
er niets. Dat is geen storing: die kop is dan kleiner en de laag hoort daar niet
bij.

## Wat je niet zelf kunt

- **Een pagina toevoegen of weghalen.** De zes pagina's liggen vast; een nieuwe
  erbij is werk voor de bouwer.
- **Kleuren kiezen.** De achtergrond is een keuzelijst, doorgerekend op
  leesbaarheid. **Bruin** is voor de gewone pagina's, **Papier** voor de
  leespagina's (Voorwaarden en Privacy). **Inkt, Roet en Mist** zijn geen
  achtergrond voor een hele sectie: dat zijn vlakken die binnen een sectie
  gebruikt worden.
- **De koppen groter of kleiner maken.** Dat volgt de plek van de sectie.
- **De velden van het formulier, en de teksten van de bedankpagina, de
  foutpagina en de meldingen van het formulier.** Die staan in de code.
- **Het mailadres overal wijzigen.** Zie *Wat waar staat*.

## Als er iets misgaat

| Wat je ziet | Wat je doet |
|---|---|
| "Unsaved" bovenaan, of een lege lijst waar secties horen | Niet opslaan. Klik op Reset; zie *Lees dit eerst* |
| Een rood kruisje bij de controle, de publiceerknop blijft grijs | Niets aan doen; je werk staat bewaard. Bel de bouwer en stuur de link mee |
| Het CMS laat je niet inloggen | Kijk of je op het goede adres zit (eindigt op `/keystatic`). Lukt het dan nog niet: bel de bouwer |
| Een venster gaat niet dicht, met een Engelse melding onder een veld | Een verplicht veld is leeg; vul het in |
| Iemand meldt dat het formulier een foutmelding gaf | Het bericht is dan niet aangekomen. Vraag diegene te mailen naar contact@declubvan.nl, en bel de bouwer: die kan zien wat er misging |
| Er komen geen formuliermails meer binnen | Kijk eerst in de map Ongewenst. Staan ze daar ook niet: bel de bouwer |
| Een nieuwe tekst of foto staat na het publiceren nog niet op de site | Wacht een paar minuten en ververs de pagina. Een vervangen foto kan tot een dag in de browser van een bezoeker blijven hangen. Staat het er de volgende dag nog niet: bel de bouwer |
| Je ziet `[woorden]`, `{woorden}` of `*woorden*` op de pagina | Een tweede markering of een vergeten sluitteken in een kop; zie *Een ovaal, een streep of typemachineletter* |

**De bouwer:** Etienne Kick, Kick&Work — (contactgegevens bouwer).
