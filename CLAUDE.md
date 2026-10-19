# declubvan100

De site van De Club van 100. Astro 6 met React 19, Tailwind 4 en TypeScript in
strict-modus. Deployt naar Vercel: alles wordt vooraf gerenderd, een losse route
draait op verzoek met `export const prerender = false;`.

## Het beveiligingsbeleid

**`security.csp` in `astro.config.mjs` staat uit. Het beleid staat per pad in
`vercel.json`.** Dat is een bewuste verhuizing, geen versoepeling.

De reden is de Keystatic-admin — en die reden is nagemeten, niet afgeleid.
Met `security.csp: true` zet Astro een `<meta>` met automatisch berekende hashes
op de statische pagina's, maar **niet op `/keystatic`**: die route draait op
verzoek en leverde byte-identieke HTML op, met en zonder de vlag. De vlag lost
dus niets op precies waar het nodig is. Bovendien komt zo'n meta naast de header
uit `vercel.json`, en dan handhaaft de browser de doorsnede van twee beleiden.

En de admin heeft inline stijl nodig: de UI zit in
`@keystar/ui`, die stijlt met Emotion en levert geen CSS-bestand mee. Gemeten op
`/keystatic`: **414 `<style>`-elementen met `data-emotion`**, samen het hele
paneel. Onder `style-src 'self'` blijft daar niets van over.

Eén beleid voor alles betekende dus kiezen tussen een kale admin of
`'unsafe-inline'` voor de hele site. Per pad hoeft dat niet:

| Bron in `vercel.json` | `Content-Security-Policy` |
|---|---|
| `/:pad(keystatic(?:/.*)?)` | `script-src 'self'` + twee sha256-hashes; `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`; `connect-src 'self' https://api.github.com https://raw.githubusercontent.com`; `form-action 'self' https://github.com`; `font-src 'self' https://fonts.gstatic.com`; `object-src 'none'`; `base-uri 'self'`; `frame-ancestors 'none'` |
| `/:pad(api/keystatic(?:/.*)?)` | hetzelfde, maar `script-src 'self'` zonder hashes |
| al het andere | `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'` |

De twee adminbeleiden hebben bewust geen `default-src` en geen `img-src`: de
admin laadt `blob:`- en `data:`-beelden, avatars van GitHub en bestanden van
`raw.githubusercontent.com`, en een te krappe `img-src` maakt het paneel stil
kapot. `object-src`, `base-uri` en `frame-ancestors` vallen niet terug op
`default-src` en staan er dus letterlijk: achter de admin zit schrijftoegang
tot de repo, en die hoort nergens in een frame te laden.

**De twee hashes op `/keystatic` zijn geen versoepeling maar het tegendeel.**
Keystatic rendert zijn paneel met `<Keystatic client:only="react" />`, en voor
een client:only-eiland zet Astro zijn eigen hydratie-runtime inline in de HTML:
het astro:only-haakje van 130 bytes en de astro-island-definitie van 4403 bytes.
Onder `script-src 'self'` worden die geblokkeerd en blijft `/keystatic` een lege
pagina. `'unsafe-inline'` voor scripts kan hier niet — achter die admin zit
schrijftoegang tot de repo — dus staan ze als hash in het beleid.

`vite.build.assetsInlineLimit` helpt hier niet tegen. Dat werkt op gebundelde
assets; dit is Astro's eigen runtime, die altijd inline gaat.

De hashes verschuiven zodra Astro die runtime aanpast, dus een Astro-upgrade kan
de admin stil leegmaken. `check-csp` rendert de adminpaden daarom uit de
gebouwde serverbundel, hasht wat het vindt, en faalt als een hash ontbreekt —
of als er een in `vercel.json` staat die nergens meer bij hoort.

De `connect-src` en `form-action` staan er voor de GitHub-modus: de admin praat
met `api.github.com`, haalt bestanden van `raw.githubusercontent.com` en stuurt
een formulier naar `github.com` om de App aan te maken.

**Dit werkt; het is op een preview-deploy nagemeten.** De adapter schrijft zijn
eigen routes in `.vercel/output/config.json` en leest `vercel.json` alleen om te
waarschuwen over `trailingSlash` — hij merget er geen headers uit. De vraag was
dus of het platform `vercel.json` nog wel oppakt naast de Build Output API. Dat
doet het: op de preview gaf `/` precies het site-beleid van toen en
`/keystatic` het zijne, één header per pad.

De site verliest hiermee niets. Astro's meta zette `'self'` plus sha256-hashes
per inline script; de gebouwde pagina's hebben nul inline scripts, nul inline
stijlblokken en nul `style`-attributen, dus `'self'` dekt precies hetzelfde af.
Eén uitzondering, en die is geen script: het `application/ld+json`-blok op de
home (zie *Vindbaarheid*). De browser voert dat niet uit, dus de CSP raakt het
niet.

Twee dingen om te onthouden:

- **De site-regel moet de adminpaden uitsluiten.** Vercel stopt niet bij de
  eerste treffer maar past élke matchende header-regel toe. Een site-regel op
  `/(.*)` zou de admin een tweede CSP-header geven en dan handhaaft de browser
  de doorsnede — precies het probleem dat deze splitsing oplost. Vandaar de
  negatieve lookahead in het derde patroon. De regel op `/(.*)` voor de andere
  headers mag wél overal, want daar zit geen CSP in.
- **`source` is path-to-regexp, geen rauwe regex.** `/keystatic(/(.*))?` wordt
  geweigerd; een regex kan alleen als benoemde parameter, `/:pad(…)`. En
  `/keystatic/:path*` is níet goed genoeg: daar maakt Vercel een regex van
  zonder slotslash, terwijl de site-regel alles onder `keystatic/` uitsluit.
  `/keystatic/` viel daardoor tussen de twee in en kreeg live een 200 met de
  hele admin en geen enkele CSP; idem `/keystatic/singleton/home/` en
  `/api/keystatic/github/login/`. De bronnen van nu zijn nagerekend met
  `@vercel/routing-utils`: ze vangen elke variant met en zonder slash, en niet
  `/keystaticx` — precies het complement van de site-regel.

`scripts/check-csp.mjs` bewaakt dit na elke build: elk pad precies één
CSP-header, ook de adminpaden met een slotslash, `'unsafe-inline'` alleen op de
admin, de drie admindirectieven hierboven, en geen inline script, stijlblok of
`style`-attribuut in de gebouwde HTML. `scripts/check-headers.mjs` doet
hetzelfde voor de rest: elke header hooguit één keer per pad, de vaste waardes,
COOP alleen op de site, `/_astro` immutable, `/beeld` nooit, en één EU-regio.

### De andere headers, de cache en de regio

Naast de CSP zet `vercel.json` dit.

| Bron | Header |
|---|---|
| `/(.*)` | `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()` |
| de site-regel | `Cross-Origin-Opener-Policy: same-origin` — niet op de admin, want daar is hij niet met de GitHub-inlog gemeten |
| `/_astro/:path*` | `Cache-Control: public, max-age=31536000, immutable` |
| `/beeld/:path*` | `Cache-Control: public, max-age=86400, stale-while-revalidate=2592000` — zie *Wat er niet mee is opgelost* bij beeld |

**De immutable op `/_astro/*` moet in `vercel.json` staan.** De adapter zet die
regel wel in `.vercel/output/config.json`, maar ná `handle: filesystem`, en daar
komt een bestaand bestand nooit langs: live gaf elke CSS, JS en woff2
`max-age=0`. HTML en de admin krijgen uit `vercel.json` geen `Cache-Control`.

**`"regions": ["fra1"]`.** De functie draaide in `iad1` (`x-vercel-id`
`fra1::iad1`), dus elke inzending en elke admin-aanroep ging naar Washington.
Of een deploy `fra1::fra1` geeft, meet je na de deploy, net als de CSP op
`/keystatic/` en de immutable op een `/_astro`-bestand; zie stap 7 van
`livegang.md`.

### Waar je de headers wel en niet ziet

De headers komen van Vercel, niet uit de HTML. Dat betekent:

- **Lokaal zie je ze nooit.** Niet in `npm run dev` en niet in `npm run preview`
  — dat laatste is `astro preview` en heeft niets met een preview-deploy te
  maken. Een inline stijl gaat daar dus gewoon werken en pas op de deploy stuk.
  `check-csp` is precies daarvoor de vervanging.
- **Op een preview-deploy meten werkt alleen met Deployment Protection uit.**
  Staat die aan, dan krijg je een 302 naar `vercel.com/sso-api` en meet je de
  headers van de inlogpagina in plaats van die van de site. Dat leest als een
  genegeerde `vercel.json` terwijl er niets mis is.

Verder over CSP:

- **Inline stijl wordt geblokkeerd.** De regel "geen `style`-attribuut" wordt
  afgedwongen, niet alleen afgesproken.
- Geen `<ClientRouter />`-viewtransities en geen Shiki-syntaxkleuring;
  `markdown.syntaxHighlight` staat daarom uit.

`design-system.md` beschrijft hoe het design system van de klant hier is
uitgewerkt, inclusief de afwijkingen. De bron zelf is het design system van De
Club van 100 en staat buiten deze repo.

## Vaste regels

1. Kleuren en maten komen uit een token, nooit rauw in de code.
   `src/styles/tokens.css` is de enige plek waar letterlijke waardes mogen
   staan.
2. Tokennamen zijn de afspraak tussen `tokens.css`, `tokens.ts` en de secties.
   Verander waardes, geen namen.
3. Secties krijgen achtergrond, verticale ruimte en breedte als tokennaam en
   halen de klasse uit `tokens.ts`. Geen `className`-prop van buitenaf, geen
   `style`-attribuut, geen spread-attributen.
4. Een sectie werkt met wisselende hoeveelheden inhoud en in elke volgorde. Ze
   schildert haar eigen achtergrond en ruimte en gaat niet uit van buren.
5. `npm run check` moet groen zijn voor je commit.
6. Verzin geen huisstijl. Staat iets niet in het design system, vraag het.

## Werkwijze

Eén commit per stap, met een beschrijvende boodschap in het Nederlands. Elke
commit staat op zichzelf: `npm run check` slaagt erop. Loopt de volgorde van een
opdracht daarmee in de knoop — een bestand dat een ander bestand importeert dat
er nog niet is — dan wissel je de stappen om en zeg je erbij dat je dat gedaan
hebt.

## Controles

`npm run check` draait de hele poort en stopt bij de eerste stap die faalt:

```
oxlint  →  check-tokens  →  check-yaml-commentaar  →  astro check
        →  [npm run build: check-opslag  →  check-resend
                           →  maak-beeldvarianten  →  astro build]
        →  check-csp  →  check-headers  →  check-nesting  →  check-koppen
        →  check-onthul  →  check-beeldpaden  →  check-links
        →  check-meegebundeld  →  check-klassen  →  check-sitemap
```

De laatste tien staan achter de build. Negen lezen de gebouwde uitvoer;
`check-headers` leest alleen `vercel.json` en staat naast `check-csp`, waar hij
bij hoort. Ze bewaken alle tien iets dat stil misgaat: geen foutmelding, geen
kapotte pagina, en lokaal zie je er niets van.

`check-opslag` en `check-resend` zitten in `npm run build` en niet los in de
keten, want `npm run build` is wat Vercel uitvoert. Daar moet `check-opslag`
staan: hij vangt een build op Vercel waar `PUBLIC_KEYSTATIC_OPSLAG=github`
ontbreekt, en dan valt de admin terug op local mode en schrijft naar het
bestandssysteem van een serverless functie. De redacteur ziet dan een geslaagde
melding, er verschijnt nooit een commit, en bij de volgende deploy is haar werk
weg. In github mode eist hij ook de drie geheimen van de GitHub App
(`KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`,
`KEYSTATIC_SECRET`): `@keystatic/astro` zet ze bij de build in de
serverbundel, en een geheim dat dan ontbreekt laat de admin laden en het
inloggen stranden. `PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` krijgt alleen een
waarschuwing. Lokaal is `VERCEL` leeg en doet hij niets — daar hoort local mode.

Dezelfde `check` draait in GitHub Actions bij elke push en pull request, met
`permissions: contents: read`. `npm ci` voert de installatiescripts van elk
pakket uit, en met schrijfrechten had een gecompromitteerd pakket kunnen pushen.
De Node-versie komt daar uit `.nvmrc`; `engines.node` in `package.json` staat op
`24.x`, gelijk eraan, omdat Vercel `.nvmrc` niet leest.

**Poortcode schrijf je rechtstreeks in het `.mjs`-bestand.** Niet via
`node -e`, niet door de code als string in een patch-script te zetten, en niet
met `sed` op een regel met backslashes erin. Dat is geen stijlvoorkeur maar een
regel die er staat omdat het drie keer is misgegaan, elke keer met een escape
die onderweg verdween:

- `[sS]` werd `[sS]` en `</script>` werd `</script>` in een template-literal
- een backslash raakte kwijt in een `sed`-vervanging
- een `node -e` met geneste aanhalingstekens schreef stilletzwijgend niets weg en
  meldde geen fout

De eerste twee vielen meteen om — Node weigert een kapotte regexp — maar dat is
geluk. Dezelfde fout in een patroon dat nog wél geldig is, levert een poort op
die vrolijk groen staat en niets meer controleert. Zie *Vaste regel: een
ongetoetste poort staat mogelijk stil groen* hieronder.

Moet er toch een bestaand bestand gewijzigd worden met een script, zet het
fragment dan in een apart bestand en lees het in, in plaats van het in een
JavaScript-string te zetten.

**Paden: gebruik het echte Windows-pad.** Git Bash en Node zijn het oneens over
`/tmp`. Bash schrijft naar `C:Users<jij>AppDataLocalTemp`, Node leest
`C:	mp` — een map die meestal niet bestaat, dus je krijgt een ENOENT op een
bestand dat je net hebt zien ontstaan. `cygpath -w` zet een bash-pad om, of
gebruik meteen de scratchpad-map die de sessie noemt.

**Schrijf een Tailwind-klassenaam altijd volledig uit.** Niet
`text-${kleur}`, niet `bg-` plus een variabele, en geen naam die uit twee
stukken aan elkaar wordt geplakt. Dat is geen stijlregel maar een voorwaarde om
te werken: Tailwind scant de bron op letterlijke namen en genereert alleen CSS
voor wat het daar tegenkomt. Een opgeknipte naam vindt het niet, en dan staat de
klasse wel in de HTML maar bestaat de regel niet.

Een tabel met volledige namen is de goede vorm — zo doet `src/lib/tokens.ts` het:
de tokennaam wijst naar een complete klassenaam, en die staat er letterlijk.

`scripts/check-klassen.mjs` bewaakt dit door de klassen uit de bron te
vergelijken met de gebouwde CSS. Wat in de eerste staat en niet in de tweede,
doet niets. Hij kijkt naar kleurachtige utilities (`bg-`, `text-`, `border-`,
`rounded-`, `ring-` en verwanten), want daar zit de fout die hij moet vangen:
een semantisch token dat wel in laag 2 van `tokens.css` staat maar niet in
`@theme inline`. Zo verdween `text-tekst-fout` stil uit het formulier.

Hij leest elke stringliteral in de bron — enkele, dubbele en backticks, ook na
`?` of `+` — en vergelijkt exact. Een voorvoegselvergelijking zou `.text-tekst`
als gevonden tellen zodra `.text-tekst-zacht` bestaat.

Wat hij niet ziet is een naam die pas bij het renderen ontstaat: in een
template-literal haalt hij de `${…}`-delen eruit en controleert hij alleen de
vaste woorden. Precies daarom staat de regel hierboven er: wat de poort niet kan
lezen, kan Tailwind ook niet lezen.

### Vaste regel: een ongetoetste poort staat mogelijk stil groen

**Een nieuwe poortstap wordt getoetst met een injectie voordat hij vertrouwd
wordt.** Een bewaker die je schrijft maar niet functioneel toetst, is geen
bewaker: hij draait, zegt niets, en dat lijkt op "er is niets mis" terwijl het
net zo goed "ik kijk nergens naar" kan betekenen.

Het is in dit project vier keer misgegaan. Twee keer door een verloren escape:
in `check-onthul` kookte een template-literal de backslash uit `[\s"']` weg, en
in `check-koppen` belandde de `\b` als backspace-byte in het bestand. Op het
scherm was dat niet van goede code te onderscheiden; `cat -A` liet het zien.
Twee keer keek een poort te smal: `check-klassen` zag elf kleurklassen niet, en
`check-csp` probeerde `/keystatic/` met slotslash niet. Alle vier stonden ze
stil groen.

De toets is klaar als je van alle kanten bewijs hebt:

- **de injectie laat hem omvallen** — bouw de fout na in de gebouwde uitvoer,
  draai de stap, en zie hem falen mét een melding die de goede plek aanwijst;
- **na herstel slaagt hij weer** — anders heb je een poort die altijd faalt, en
  die wordt binnen een week uitgezet;
- **een geval dat er nét buiten valt slaagt ook** — zo weet je dat hij niet
  alles vlagt. Probeer ook de varianten ernaast: een slash erbij, een klasse in
  een template-literal.

Hetzelfde geldt voor elke bewering die je in een commit zet omdat een controle
zweeg: controleer dat de injectie echt is weggeschreven. **Bewaar de toets
niet** in de repo; wat blijft is de poort, en de commit waarin staat dat hij
getoetst is en met welke uitkomst.

### Wie bewaakt wat

| Onderwerp | Bewaker |
|---|---|
| Hexkleuren en px-waarden | `scripts/check-tokens.mjs` |
| Kleur in `public/favicon.svg` die geen tokenwaarde is | `scripts/check-tokens.mjs` |
| Letterlijke lettertypenamen | `scripts/check-tokens.mjs` |
| Propnamen en propwaarden van componenten | TypeScript, via `astro check` |
| Geen `className` of `style` van buitenaf | TypeScript |
| Import via `index.js` | **Niet bewaakt.** `no-restricted-imports` in oxlint staat op `warn`, raakt de relatieve imports van dit project niet, en er bestaat geen enkel `index.js`-barrelbestand om naartoe te importeren |
| Onbekende tokennaam | TypeScript, via de union-types in `tokens.ts` |
| Tailwind-klasse die geen CSS oplevert | `scripts/check-klassen.mjs` — elke stringliteral, exacte vergelijking |
| Kleurklasse uit Tailwinds standaardpalet | bestaat niet meer: `--color-*: initial` in `tokens.css` |
| CSP per pad, ook de adminpaden met een slotslash | `scripts/check-csp.mjs` |
| `object-src`, `base-uri` en `frame-ancestors` op de admin | `scripts/check-csp.mjs` |
| Inline script of stijl in de uitvoer, behalve één geldig `application/ld+json`-blok | `scripts/check-csp.mjs` |
| Hash van elk inline script op de adminpaden | `scripts/check-csp.mjs` |
| Andere headers dan de CSP: één keer per pad, vaste waardes, COOP alleen op de site | `scripts/check-headers.mjs` |
| Cache: `/_astro` immutable, `/beeld` nooit, HTML en admin zonder | `scripts/check-headers.mjs` |
| Eén functieregio, in de EU | `scripts/check-headers.mjs` |
| Build op Vercel zonder github mode, of zonder de drie GitHub App-geheimen | `scripts/check-opslag.mjs` |
| Build op Vercel zonder Resend-sleutel | `scripts/check-resend.mjs` |
| Contentbestand dat niet meegaat in de functie op verzoek | `scripts/check-meegebundeld.mjs` |
| Commentaar in een contentbestand | `scripts/check-yaml-commentaar.mjs` |
| Vertraging per element zonder `style`-attribuut | `scripts/check-csp.mjs` |
| Blokelement binnen een inline-element | `scripts/check-nesting.mjs` |
| Eén `<h1>` vooraan, geen overgeslagen kopniveau, geen lege kop | `scripts/check-koppen.mjs` |
| Lang woord in een display-xl-kop zonder afbreekmogelijkheid | `scripts/check-koppen.mjs` — een waarschuwing, geen fout; in CI een `::warning`-annotatie op de pull request |
| Verborgen onthul-inhoud heeft altijd een uitweg | `scripts/check-onthul.mjs` |
| Verbergen alleen binnen `@media screen`, de printregel van het accordeon, elke stap 0–8 met een eigen vertraging | `scripts/check-onthul.mjs` |
| Beeld dat niet bestaat, of buiten de map van zijn pagina ligt | `scripts/check-beeldpaden.mjs` |
| Interne link zonder pagina, `mailto:` zonder `@`, `tel:` met iets anders dan cijfers | `scripts/check-links.mjs` |
| Link in het CMS die niet met `/`, `https://`, `mailto:` of `tel:` begint | `keystatic.config.ts`, het patroon `LINK` |
| Sitemap en `noindex` die elkaar tegenspreken | `scripts/check-sitemap.mjs` |

De afbreekzeef waarschuwt sinds B16 in plaats van te falen. `check` is een
verplichte controle op `main`, en een lang woord in een kop blokkeerde daarmee
het publiceren van de redacteur voor iets wat misschien niet eens breekt.

`check-links` haalt externe links niet op: een poort mag niet van het netwerk
afhangen. De verzendroute en de admin draaien op verzoek en staan niet in de
statische uitvoer; een link daarheen telt als bestaand.

`_adherence.oxlintrc.json` is samengevoegd uit de adherence-config van De Club
van 100 en die van het Kick&Work-sjabloon. Twee blokken uit die bronnen konden
niet mee, en dat is geen keuze: oxlint 1.77 weigert de hele config zodra ze
erin staan.

- `no-restricted-syntax` — 19 selectors voor kleur, maat, font-family en de
  propscontracten per component. Levert
  `Rule 'no-restricted-syntax' not found in plugin 'eslint'`.
- `x-omelette` — metadata voor de design-system-tooling. Levert
  `unknown field`.

Kleur, maat én font-family worden opgevangen door `check-tokens`, de
propscontracten door TypeScript. Er blijft van die 19 selectors dus niets
onbewaakt.

## De tokenregel

`scripts/check-tokens.mjs` scant `src/` op `.astro`, `.tsx`, `.ts` en `.css` en
faalt met exit 1 op:

- hexkleuren in de vorm `#abc`, `#aabbcc` of `#aabbccdd`
- losse px-waarden, bijvoorbeeld `16px`
- letterlijke lettertypenamen

Niet gemeld: commentaar (`//`, `/* */`, `<!-- -->`), `0px`, HTML-entities als
`&#123;` en andere hexlengtes dan 3, 6 of 8. `//` telt niet als commentaar in
CSS en ook niet direct na een dubbele punt, zodat `https://…` intact blijft.

De fontcontrole kijkt op drie plekken: een `font-family`-declaratie, een
Tailwind-utility met een vrije waarde (`font-[Arial]`), en Tailwinds ingebouwde
familieklassen `font-sans`, `font-serif` en `font-mono`. Toegestaan zijn alleen
`var(--font-…)`, de CSS-brede sleutelwoorden (`inherit` en verwanten), en een
familieklasse waarvoor een `--font-*`-token in `tokens.css` bestaat. Die lijst
wordt uit `tokens.css` gelezen, dus een nieuw fonttoken werkt meteen.

`font-` is in Tailwind dubbel bezet. `font-semibold`, `font-bold` en `font-[600]`
zijn gewichten en worden niet gemeld; alleen vrije waardes die geen `var()` en
geen getal zijn tellen als familienaam.

Enige uitzondering is `src/styles/tokens.css` — daar mogen de waardes letterlijk
staan, want daar worden de tokens gedefinieerd.

Eén bestand buiten `src/` wordt wel gelezen: **`public/favicon.svg`**. Daar
moet elke hex letterlijk een kleur uit `tokens.css` zijn — niet alleen "geen
rauwe waarde", maar precies een tokenwaarde. Dat bestand staat in `public/` en
gaat dus ongemoeid naar de uitvoer; zonder deze tak valt een kleur die daar
afdwaalt nergens op.

Die tak heeft een eigen, strengere regex. De gedeelde hexregel accepteert alleen
lengte 3, 6 en 8, want in een `.tsx` is `#fff0` geen kleur. In SVG wel —
doorzichtig wit — en een injectie met precies die waarde kwam er ongemerkt
doorheen. In de favicon telt daarom elke `#` gevolgd door hexcijfers.

De drie bestanden horen bij elkaar: `favicon.svg`, `favicon.ico` (16 en 32) en
`apple-touch-icon.png` (180). Die laatste is **volledig dekkend en niet
afgerond**, want iOS vult doorzichtigheid met zwart en maskeert zelf.

**Alle drie komen uit `src/assets/logo/merkteken-vierkant.svg`** — de officiele
vierkante uitsnede uit de logoset, schicht gecentreerd met 12% marge. De README
in die map wijst hem voor precies dit doel aan. Er is dus niets aan uitgesneden,
geschaald of afgerond; het vlak eronder is `--vuur`, de schicht `--krijt`, en de
hoeken zijn hard omdat de radiustokens 2px en 4px zijn.

## Tokens

`src/styles/tokens.css` is de tokenlaag, in vier lagen in één bestand:

1. **Primitieven** — de rauwe waardes, één keer, in `:root`.
2. **Semantische laag** — aliassen die onder `[data-thema="licht"]` kantelen.
3. **`@theme inline`** — wat Tailwind tot utilities maakt.
4. **Basis** — reset, links, focus, gereduceerde beweging.

Laag 2 en 4 staan bewust buiten `@theme`: een alias die per thema iets anders
betekent en een CSS-reset zijn geen themetokens. Let op dat `@theme inline` de
`--color-*`- en `--spacing-*`-variabelen niet als CSS-variabele uitstuurt; die
worden in de utility ingebakken. Handgeschreven CSS leunt daarom op de
primitieven uit laag 1.

Laag 4 staat in `@layer base`. Ongelaagde CSS wint van Tailwinds
`@layer utilities`, en dan kan een utility als `no-underline` de linkstijl niet
meer overschrijven.

Vier dingen die je niet moet weghalen:

- **`--color-*: initial` bovenin `@theme inline`.** Tailwinds eigen
  kleurenpalet staat uit. `bg-red-500` en `text-white` bestonden eerst naast de
  tokens en kwamen door beide kleurpoorten: `check-tokens` zoekt hexwaarden,
  geen paletklassen, en `check-klassen` ziet alleen of een klasse CSS oplevert.
  Nu bestaat er geen kleurutility die niet uit een token komt. `transparent` en
  `current` blijven werken.
- **`@import 'tailwindcss' source('../')` in `global.css`.** Tailwind kijkt
  alleen in `src/`. Daarvoor scande hij de hele repo en maakte hij CSS uit dit
  bestand en de poortscripts, waaronder `.font-[Arial]` — precies de rauwe
  lettertypenaam die `check-tokens` in de bron verbiedt.
- **`--hoogte-kopbalk`** (4.5rem), één waarde voor drie lezers: de kopbalk
  zelf, de landingshero die het eerste scherm min de balk vult, en
  `scroll-padding-top`, die een gefocust element onder de sticky balk vandaan
  houdt (WCAG 2.4.11). De hero rekende eerst met `100svh`, en dan viel de
  tweede deur van de home op een telefoon onder de vouw.
- **`color-scheme: dark`** op `html`, en `light` onder `[data-thema='licht']`,
  zodat schuifbalken en automatisch invullen niet licht op de donkere site
  tekenen.

## Koppelbestanden

Er zijn er drie. Alles wat een sectie aan iets anders vastknoopt, staat in één
van deze drie bestanden en nergens anders:

- **`src/lib/tokens.ts`** — tokennaam naar Tailwind-klasse, voor achtergrond,
  verticale ruimte, containerbreedte en leesbreedte. Elke groep heeft een
  union-type, dus een tokennaam die niet bestaat is een compileerfout. Alleen
  klassenamen in dit bestand; een rauwe waarde laat `check-tokens.mjs` de build
  breken.
- **`src/lib/SectionRenderer.tsx`** — sectietype naar component, plus het
  kopniveau over de hele lijst. Een onbekend type toont in ontwikkeling een
  melding met het type erin en rendert in productie niets. De `default`-tak
  bevat een exhaustiviteitscontrole: een type dat wel in de union staat maar
  geen `case` heeft, is een compileerfout.
- **`src/lib/pagina.ts`** — CMS-data naar sectieprops. Zie *De zes pagina's*.

`src/lib/` heeft er nog twee die geen koppelbestand zijn: `site.ts` voor de
basis-URL en `beweging.ts` voor de ploegteller van de scrollonthulling.

## Componenten

React, want `SectionRenderer.tsx` en de secties zijn dat ook.

| Component | Map | Waarvoor |
|---|---|---|
| `Knop` | `components/basis/` | Elke actie. Varianten `vol`, `lijn`, `kaal`; maten `s`, `m`, `l` |
| `Kaart` | `components/basis/` | Alles wat in een raster staat |
| `Bovenkop` | `components/basis/` | Het labeltje boven een sectiekop |
| `Teller` | `components/basis/` | Kop waarin een getal naar boven telt |
| `Beeldvlak` | `components/beeld/` | Elke foto met tekst erop |
| `Bliksem` | `components/merk/` | De schicht, in drie rollen |
| `Koptekst` | `components/basis/` | Vertaalt `[...]` en `{...}` in een sectiekop naar een haal |
| `RijkeInhoud` | `components/basis/` | De kale markdoc-set, gedeeld door rijke tekst en accordeon |
| `Ovaal` | `components/merk/` | De haal om een woordgroep. Max 1 per sectie |
| `Streep` | `components/merk/` | De haal onder een kop. Ook max 1 per sectie |
| `Handschrift` | `components/merk/` | De decoratieve regel. Altijd `aria-hidden`, max 1 per pagina |
| `Pijl` | `components/merk/` | Een korte haal met een punt, naast de belangrijkste knop |
| `Mailbaar` | `components/basis/` | Platte tekst waarin een mailadres een `mailto:`-link wordt; de tekst zelf verandert niet |
| `Veld` | `components/formulier/` | Eén veld: label, invoer en de foutregel eronder |

De logo's staan apart in `src/components/logo/` en zijn Astro-componenten, geen
React: ze worden door de layout gebruikt, niet door secties. Alle vier houden
`fill="currentColor"` en nemen geen props aan.

**Elk bestand in `components/` wordt gebruikt — behalve de logoset.**
`Scheiding` en `KaartenRij` stonden er ongebruikt bij en zijn weggehaald; staat
er weer iets dat nergens geïmporteerd wordt, dan is dat een fout en geen
voorraad. De git-geschiedenis heeft ze nog als je ze terug wilt.

**`src/components/logo/` is de benoemde uitzondering**, en dat is niet
hetzelfde als vergeten opruimen. Van de vier is alleen `LogoHorizontaal`
geïmporteerd, door de layout. De andere drie staan er compleet omdat een logoset
een set is: de bron levert vier merktekens met elk een eigen toepassing —
`Bliksem` als social avatar en watermerk, `Woordmerk` voor waar de schicht al
elders staat, `MerktekenVierkant` als favicon en app-icoon. Drie kwart van de
merktekens van een klant weggooien omdat de site ze deze maand niet toont, is
geen opruimen maar de set slopen; ze horen bij het merk en niet bij de pagina's.

Wat níet onder deze uitzondering valt: het uitbreiden ervan. Komt er een vijfde
bestand in die map dat niet uit de aangeleverde logoset komt, dan geldt de
gewone regel weer.

Eén ding om te weten en niet stilzwijgend te laten: `components/logo/Bliksem.astro`
en `components/merk/Bliksem.tsx` tekenen dezelfde SVG. Ze zijn niet elkaars
dubbele — de eerste is het merkteken uit de set, de tweede is het vormelement
met de drie rollen die de richtlijn eraan hangt, en alleen die tweede wordt
gebruikt. Ze delen `src/assets/logo/bliksem.svg`, dus er is één bron; wie ze ooit
samenvoegt, moet de rollen meenemen en niet andersom.

### Er gaat wél JavaScript naar de browser

Zes bestanden, alle zes uit een Astro-component en alle zes via de layout
(`src/layouts/Basis.astro`) op elke pagina:

| Bestand | Waarvoor |
|---|---|
| `components/navigatie/Navigatie.astro` | De menuknop onder 900px, met focusval |
| `components/basis/TellerScript.astro` | De teller in de openingskop |
| `components/beweging/OnthulScript.astro` | De scrollonthulling |
| `components/merk/HaalScript.astro` | Past de haal op één regel? |
| `components/sections/AccordeonScript.astro` | Klapt de antwoorden dicht en weer open |
| `components/formulier/FormulierScript.astro` | Tijdstempel, controle in de browser en de bezig-stand van het formulier |

`FormulierScript` staat in de layout en niet op `/contact` en
`/opdrachtgevers` alleen: het CMS laat het formulierblok op elke pagina toe, en
een formulier zonder script mist zijn tijdstempel en zijn bezig-stand.

Het `<script type="application/ld+json">` in de layout is geen zevende: dat is
een datablok dat de browser niet uitvoert.

**Een `<script>` hoort in een `.astro`-bestand, nooit in een `.tsx`.** Astro
bundelt een script uit een Astro-component tot een gewoon bestand; een `<script>`
in een React-component belandt inline in de HTML en loopt op `script-src 'self'`
stuk. `Teller` is daarom gesplitst: markup in `Teller.tsx`, script in
`TellerScript.astro`.

**En `vite.build.assetsInlineLimit` staat op 0.** Astro bakt een gebundeld script
anders alsnog in de HTML zodra het onder de grens van 4 kB blijft — het
navigatiescript is 891 bytes en verdween er zo in. Dat is precies het geval dat
`check-csp` ving.

**Beeldvlak dwingt de sluier af.** Er is geen prop die hem weglaat en geen tak
die hem overslaat. Zonder behandeling haalt witte tekst op deze fotografie nooit
betrouwbaar AA, en een foto is geen token: hij wordt vervangen en dan klopt het
contrast niet meer.

## Sectietypes

Tien, allemaal in `src/components/sections/` en gekoppeld in
`SectionRenderer.tsx`:

| Type | Component | Waarvoor |
|---|---|---|
| `hero` | `Hero` | De openingssectie. Enige `<h1>`, enige `display-xl` |
| `splitscreen` | `Splitscreen` | Twee deuren: opdrachtgevers en professionals |
| `kop-tekst` | `KopTekst` | Kop met optionele bovenkop en lopende tekst |
| `beeld-tekst` | `BeeldTekst` | Beeld naast tekst |
| `drie-kolommen` | `DrieKolommen` | Raster van kaarten |
| `citaten` | `Citaten` | Klantquotes |
| `oproep` | `Oproep` | Afsluitend blok met een actie |
| `rijke-tekst` | `RijkeTekst` | Lopende tekst met koppen en lijsten |
| `accordeon` | `Accordeon` | Vragen met een antwoord dat openklapt |
| `formulier` | `Formulier` | Het formulier, in twee varianten: aanmelden en inhuren |

Met beeld loopt de kop door `Beeldvlak` en vervalt de schicht. De grote schicht
is een uitgesneden vlak op een egale achtergrond — over een foto is dat geen
van de drie toegestane rollen, en de sluier zou hem toch opeten.

`hero` heeft sinds B8 één variant erbij: `dubbellaags`, de witte kop met de
harde donkere laag eronder uit de mockup. Die hangt aan `kopNiveau === 1` en
niet aan de prop alleen, dus een tweede hero op dezelfde pagina zakt naar
`display-l` en raakt hem ook kwijt. Op een lichte sectie vervalt hij helemaal.
Zie het componentenhoofdstuk van `design-system.md` voor waarom hij geen
contrastmiddel is.

### Het kopniveau komt uit de lijst, niet uit de sectie

**Render een sectie nooit los.** `SectieLijst` in `SectionRenderer.tsx` is de
enige juiste ingang: alleen daar is te zien wat er vóór een sectie staat, en dat
bepaalt het kopniveau. Een losse `SectionRenderer` valt terug op niveau 2 en
levert dus een pagina zonder `<h1>` op.

De eerste sectie die een kop kán dragen krijgt niveau 1, de rest niveau 2. Wat
een sectie binnenin heeft zakt mee: kaartkoppen hangen onder de sectiekop, en in
rijke tekst landt een `##` op het niveau eronder.

`draagtPaginakop()` bepaalt wie in aanmerking komt. `splitscreen` en `citaten`
slaan hun beurt over — twee koppen naast elkaar is geen paginakop en citaten
hebben er geen. `drie-kolommen`, `rijke-tekst` en `accordeon` doen alleen mee
als ze een sectiekop hebben, en sinds B16 de `hero` ook: een opening zonder kop
kreeg eerst toch de `<h1>`-rol en leverde een leeg kopelement op.

Een lege kop levert in geen enkele sectie meer een leeg kopelement op, en een
`splitscreen` zonder deuren rendert niets in plaats van een leeg vlak.

Daarmee gelden deze drie vanzelf, en `check-koppen` houdt ze vast:

- elke pagina heeft precies één `<h1>`, en die staat vooraan
- een tweede hero levert geen tweede `<h1>` en geen tweede `display-xl`; die
  zakt naar een gewone sectiekop op `display-l`
- het niveau gaat nooit omhoog halverwege de pagina

Staat er geen enkele sectie die een kop kan dragen, dan heeft de pagina geen
`<h1>`. Dat wordt niet stilletjes gerepareerd — er valt niets te kiezen — maar
`check-koppen` laat de build erop vallen.

### Het accordeon

Staat er sinds B8 en is het negende type. Vijf dingen die je niet moet weghalen:

- **Open is de begintoestand.** In de HTML staat elk antwoord uitgeklapt, met
  `aria-expanded="true"`; `AccordeonScript` klapt ze bij het laden dicht. Zonder
  JavaScript is de sectie dus een gewone lijst met vragen en antwoorden. Draai
  je het om, dan levert een uitgevallen script twaalf vragen op die niet
  opengaan — dezelfde fout die de scrollonthulling met zijn vlagje vermijdt.
  Nagemeten in de gebouwde HTML: nul keer `data-accordeon-dicht`.
- **`hidden="until-found"` op een dicht antwoord, met `inert` als terugval.**
  Het paneel staat op `grid-template-rows: 0fr` met `overflow: hidden`, en dat
  haalt de links erin niet uit de tab-volgorde. Tot B16 stond er daarom alleen
  `inert` op, maar dat haalt het antwoord ook uit Ctrl+F. Nu krijgt de inhoud ná
  het dichtklappen `hidden="until-found"`: niet te bereiken met tab, wel te
  vinden, en bij een treffer vuurt `beforematch` en klapt het script dat item
  open. Gemeten met een tekstfragment naar "altijd op donderdag": precies dat
  antwoord opent. Pas ná de transitie, want `until-found` zet
  `content-visibility` op `hidden` en dan springt het paneel dicht; tijdens de
  transitie houdt `inert` de tab-volgorde schoon. Een browser zonder
  `beforematch` houdt `inert`, zoals het was.
- **De printregel in `global.css`.** Op papier staat elk paneel open
  (`grid-template-rows: 1fr`) en wordt `until-found`-inhoud zichtbaar gezet.
  Ongelaagd, zodat hij wint van de Tailwind-utility die het paneel dichtzet.
  Zonder die regel kwamen de veelgestelde vragen zonder één antwoord uit de
  printer. `check-onthul` eist hem.
- **Het paneel animeert op `grid-template-rows`, van `0fr` naar `1fr`.** Dat is
  de enige manier om naar de eigen hoogte van de inhoud te lopen zonder die
  hoogte te kennen — en kennen kan niet, want een hoogte in een
  `style`-attribuut wordt door de CSP geblokkeerd.
- **Het vlagje `data-accordeon-stil` op `<html>`.** Zonder dat klapt elk
  antwoord bij het laden zichtbaar omhoog, want het dichtzetten gebeurt op een
  element dat een transitie heeft. Het script haalt het vlagje weg na twee
  beeldjes.

Geen `aria-controls` en geen pijltoetsen, allebei met opzet: zie het
componentenhoofdstuk van `design-system.md`. Het plusteken tekent in Windows
hoog contrast in `CanvasText`; anders verdween het daar.

### Een nieuwe sectie toevoegen

Een nieuwe sectie landt op vijf plekken. Sla er één over en je merkt het pas
laat:

1. `src/components/sections/<Naam>.tsx` — de sectie zelf, volgens regel 3 en 4,
   met haar onderdelen in de ploeg. Zie *De beweging*.
2. `src/lib/SectionRenderer.tsx` — het type in de union, een `case` in de
   switch, én een tak in `draagtPaginakop()`.
3. `src/lib/pagina.ts` — een `case` die het CMS-blok naar sectieprops vertaalt.
4. `keystatic.config.ts` — een blok met dezelfde naam, met labels en
   beschrijvingen in het Nederlands.
5. `src/pages/secties.astro` — vier keer renderen, onder de omstandigheden waar
   een sjabloon op stukloopt.

Nummer 2 en 3 hebben allebei een exhaustiviteitscontrole, dus die vergeet je
niet: dat is meteen een compileerfout. Nummer 4 en 5 niet — een sectietype
zonder blok in het CMS is onzichtbaar voor de redacteur, en zonder variant in
het overzicht ongetest.

Nieuwe kleuren of maten horen eerst in `tokens.css` en dan in `tokens.ts`, niet
rechtstreeks in de sectie.

### Het sectieoverzicht

`src/pages/secties.astro` is de beheerbaarheidstest: elk type onder een te lange
kop, een lege tekst, weinig items en veel items. Daarnaast staan er vaste
regressiegevallen, elk voor een fout die een keer stil is misgegaan: de
overflow in `Beeldvlak`, een staande foto op 4:5 tegenover 16:9, de drie
manieren waarop de koppenvolgorde sneuvelde, en de teller — sinds B16 ook met
een getal van vier cijfers, dat niet hoort te tellen. Haal die niet weg — ze
staan er omdat het een keer fout ging, niet ter illustratie.

De formuliergevallen op deze pagina staan in productie dicht. Ze stonden hard op
actief en postten naar de echte route; met `FORMULIER_ACTIEF=ja` kon een bot via
deze testpagina mail laten versturen.

De pagina routeert zodat je hem kunt bekijken en is afgeschermd met een
`noindex`-meta plus `Disallow: /secties` in `public/robots.txt`.

Elk geval gaat als eigen `SectieLijst` door de renderer en heeft dus zijn eigen
`<h1>`. Op een echte pagina zou dat fout zijn; hier is het de bedoeling, en
`check-koppen` slaat deze pagina daarom over.

Meet responsieve fouten, kijk er niet naar. De meeste zijn niet zichtbaar op
een screenshot; ze komen uit `getBoundingClientRect()` in de browser. Let op dat het `md:`-breekpunt op de
viewport slaat: met een klassieke scrollbar is een venster van 768 een viewport
van 753, en dan vuurt `md:` niet.

## De beweging

Staat er sinds B7. Het concept is **Inslag als karakter, Ploeg als ritme**:
elementen komen hard binnen met een scherpe afremming en zonder naloop, maar
nooit tegelijk. Het motion-hoofdstuk van `design-system.md` legt uit waarom elke
waarde is wat hij is; hier staat hoe het in elkaar zit.

Drie bestanden, en dat zijn ze alle drie:

| Bestand | Wat erin staat |
|---|---|
| `src/styles/tokens.css` | de waardes: curve, twee duren, de stap, de afstand, het masker, de zoom |
| `src/styles/beweging.css` | het mechanisme: de animaties en de vertraging per stap |
| `src/components/beweging/OnthulScript.astro` | de waarnemer die zegt wanneer |

De haal — de ovaal en het onderstreepje uit B8 — hangt eraan maar staat er
naast; zie *De haal* hieronder.

Een sectie doet mee door twee attributen op een element te zetten:
`data-onthul="blok"` of `="kop"`, en `data-onthul-stap="0"` tot en met `8`. Het
nummer komt uit `ploeg()` in `src/lib/beweging.ts`, een teller per sectie: elk
aanwezig onderdeel schuift één stap op, en wat ontbreekt telt niet mee. Roep hem
aan in de volgorde waarin de onderdelen in het ritme horen — bij `beeld-tekst`
staat het beeld soms vooraan in de DOM en telt het toch als laatste mee, want
daar is het het item.

**De ploeg wordt in de browser herrekend, per melding van de waarnemer.** Wat in
één melding loskomt is een groep; per sectie gaat de laagste stap van die groep
naar 0 en schuift de rest mee. Wat samen binnenkomt houdt zijn ritme, een losse
alinea begint meteen. Daarvoor stonden op `/privacy` zeventien alinea's op stap
8, en elk kwam los in beeld na 560 ms leeg. Gemeten op `/privacy` bij 375: de
eerste groep 0, 1, 2 en daarna elke alinea op 0. Het blijft een attribuut, dus
de CSP blijft heel.

Negen dingen die je niet moet weghalen:

- **Alles hangt aan `data-beweging="aan"` op `<html>`.** Dat attribuut zet het
  script, en alleen als de bezoeker geen gereduceerde beweging vraagt. Zonder
  JavaScript blijft het weg en staat er dus niets verborgen. Een begintoestand
  die niet aan dat vlagje hangt, maakt van een uitgevallen script een lege
  pagina.
- **Het verbergen staat in `@media screen and (prefers-reduced-motion:
  no-preference)`**, niet alleen in de voorkeur. Een voorkeur geldt ook bij
  afdrukken, en afdrukken laat geen waarnemer vuren: gemeten op de live deploy
  stonden op `/privacy` 28 van de 34 blokken leeg op papier, op `/voorwaarden`
  13 van de 18. Het tekenblok van `haal.css` staat om dezelfde reden op
  `screen`. `check-onthul` bewaakt dat het verbergen alleen binnen
  `@media screen` staat.
- **De opening animeert op CSS alleen, met een aanloop.** Kop en blokken binnen
  `[data-onthul-entree]` — de hero op kopniveau 1 zet dat attribuut — krijgen
  hun animatie rechtstreeks uit `beweging.css`, zonder vlagje en zonder
  waarnemer, met `--aanloop` (300ms) erbij. `OnthulScript` zet er `entree` op
  en laat ze verder met rust. Wachtten ze op het script, dan stond de hero
  eerst zichtbaar, verdween hij als het vlagje kwam en kwam hij pas na de
  aanloop terug: op een trage verbinding een flits en een gat. Alleen een haal
  in de opening loopt nog via de waarnemer, want die tekent op `loopt`.
- **Wat bij het laden ergens in beeld staat, staat er meteen.** Elk stukje
  telt, niet een vijfde: een blok dat net boven de vouw uitsteekt heeft de
  bezoeker al gezien, en met die vijfde verdween het weer tot er gescrold werd.
- **De teller hangt aan de kop, niet aan een eigen klok.** Bij `animationstart`
  van de kop zet `TellerScript` een 0, bij `animationend` van het masker telt hij
  naar het eindgetal. Met een eigen klok zat de klim achter het masker: het
  getal werd pas rond 45 tot 50 zichtbaar. Komt de kop zonder animatie binnen —
  al in beeld, vangnet, gereduceerde beweging, papier — dan vuurt er niets en
  blijft het getal gewoon staan. Het getal staat één keer in de HTML; de
  schermlezerskopie bestaat alleen tijdens het tellen, want anders las de kop
  voor crawlers en bij kopiëren als "De Club van 100100". Alleen een getal van
  precies drie cijfers telt, want `--maat-teller` reserveert 3ch.
- **Focus op iets wat nog verborgen staat, zet het meteen op klaar.** Een veld
  onderin een groot blok kan focus krijgen voordat dat blok de drempel haalt;
  `focusin` voorkomt dat iemand typt in een veld dat niet te zien is.
- **Het script meet eerst alles en zet daarna pas het vlagje.** In die volgorde
  krijgt wat al in beeld staat de verborgen toestand nooit te zien: op het
  moment dat `beweging.css` gaat gelden, staat er al `klaar` op. Andersom
  flikkert de hele bovenkant van de pagina.
- **Het is een animatie en geen transitie.** Met `animation-fill-mode: backwards`
  valt een element na afloop terug op zijn eigen stijl. Een transitie zou het
  masker van een kop permanent moeten aanhouden, en dat knipt de staarten van
  een `p` en een `g` af.
- **De vertraging staat als attribuutselector**, één regel per stap. Een
  `style`-attribuut per element zou de CSP breken; `beweging.css` en
  `beweging.ts` klemmen daarom allebei op acht. `check-onthul` eist dat elke
  `data-onthul-stap` in de uitvoer tussen 0 en 8 ligt en een eigen
  `animation-delay` heeft.
- **De waarnemer kent twee drempels, `0` en `0.2`.** Die eerste is er voor een
  element dat zelf hoger is dan het venster — een splitscreen-deur met een lange
  kop op een telefoon. Dat haalt die 0.2 nooit en zou zonder de tweede drempel
  helemaal geen melding meer krijgen, en dus voorgoed onzichtbaar blijven.

### Geen scheidingslijn tussen secties

De mockup heeft geen scheidingslijnen op de sectiegrenzen, en de site dus ook
niet. Daarmee is rol 2 van de bliksemschicht (`scheiding`) zonder gebruiker.
`Bliksem` ondersteunt de rol nog; er is alleen geen plek die hem inzet.

### De haal — de ovaal en het onderstreepje

Staat er sinds B8, en het is de enige beweging op de site die **niet** op
`--inslag` loopt. De inslag is een klap die scherp afremt en stilvalt; een haal
is een hand die doorstreept, dus `--haal` is nog in beweging op het moment dat
hij ophoudt. Het motion-hoofdstuk van `design-system.md` legt de waardes uit.

Drie bestanden en twee componenten:

| Bestand | Wat erin staat |
|---|---|
| `src/styles/tokens.css` | de waardes: de curve, de pauze, twee duren, de dikte |
| `src/styles/haal.css` | het mechanisme: de pasvorm, de kleur, het tekenen |
| `src/components/merk/HaalScript.astro` | de meting: past de tekst op één regel? |
| `src/components/merk/Ovaal.tsx` | het pad van de ellips |
| `src/components/merk/Streep.tsx` | het pad van de streep |

Vijf dingen die je niet moet weghalen:

- **`haal.css` staat apart van `beweging.css`** omdat maar één van de drie
  dingen die hij doet beweging is. De pasvorm en de kleur staan buiten het
  `no-preference`-blok, want een ovaal om een woordgroep die over twee regels
  breekt is voor iedereen verkeerd. Op papier staat de haal er sinds B16 niet:
  de pasvorm is op het scherm gemeten, en een afdruk heeft een andere
  regelbreedte.
- **De vertraging komt via `--stap-vertraging`.** Elke stapregel in
  `beweging.css` zet die variabele en leest hem daarna zelf; een custom property
  erft, dus een haal binnen een kop op stap 2 telt er vanzelf zijn eigen
  wachttijd bij op. Haal die variabele weg en elke haal heeft een eigen
  stap-prop nodig door alle acht sectietypes heen.
- **De lijn begint verborgen en wordt zichtbaar gemaakt.** Dat is de andere kant
  op dan de scrollonthulling, en het is bewust: de haal is decoratief en staat
  op `aria-hidden`, dus zonder JavaScript is een ontbrekende versiering beter
  dan een uitgerekte. Bij gereduceerde beweging draait `HaalScript` gewoon — dat
  meet alleen — dus daar staat de haal er wél, volledig getekend en meteen.
- **De dash van de ovaal en de streep komt uit een gemeten attribuut, niet uit
  `pathLength`.** In B9 bleek `stroke-dasharray="100"` naast
  `vector-effect="non-scaling-stroke"` geen heel pad maar honderd schermpixels
  te zijn: gemeten met `isPointInStroke` gaf dat gaten van 45 tot 80% en een
  tekening die onzichtbaar bleef. `HaalScript` meet daarom de schermlengte en
  zet die als presentatie-attribuut (geen `style`, dus geen CSP-conflict); het
  tekenen is een transitie naar de 0 die `haal.css` zet. Non-scaling-stroke
  zelf blijft: die houdt de lijn overal even dik terwijl het vlak in de breedte
  uitrekt. Bij een resize meet `HaalScript` alleen opnieuw als de breedte
  veranderde, niet bij het in- en uitschuiven van de adresbalk.

  **Dat gedrag is in B13 niet meer te reproduceren.** Op Chromium 152
  honoreerde `pathLength` de dash in álle geprobeerde combinaties: met en
  zonder non-scaling-stroke, uniform geschaald, en niet-uniform uitgerekt tot
  acht keer met `preserveAspectRatio="none"`. Steeds precies de helft zichtbaar
  bij `dasharray` gelijk aan de helft van `pathLength`.

  Wat dat betekent is niet zeker — de browser kan het gerepareerd hebben, of de
  waarneming van toen had een tweede oorzaak die niet is gevonden. Daarom is de
  meting van de ovaal en de streep blijven staan: die werkt, en hem vervangen
  op grond van één browserversie is de verkeerde ruil. De pijl gebruikt sinds
  B13 wél `pathLength`, maar die hoeft de vraag niet te beantwoorden: zijn
  viewBox loopt één op één met zijn pixelmaat, dus hij heeft geen
  non-scaling-stroke nodig.
- **Breedte én hoogte staan uitgeschreven op de svg.** Een svg is een vervangen
  element met een eigen verhouding, en die wint van een insetpaar zodra de
  andere maat op `auto` staat. Gemeten om een kop van 467×73: met alleen insets
  werd het vlak 531×319, met alleen een hoogte erbij 173×104.
- **De haal heeft een eigen waarnemer in `OnthulScript`.** Die telt de
  onderste kwart van het venster niet mee en wil de helft van de haal erboven
  zien. Op de gewone drempel tekende hij zich onderaan het scherm, waar
  niemand kijkt, en stond hij er al als je ernaartoe scrolde. Een haal buiten
  de opening staat ook bij het laden nooit meteen klaar; hij wordt pas
  waargenomen als het lettertype binnen is en de pagina getekend. Staat de kop
  eromheen er al, dan zet het script `data-haal-kort` en wacht de lijn alleen
  nog `--haal-pauze`. Onderaan de pagina, waar die lijn niet te halen is, gaat
  hij los zodra er tot de bodem gescrold is.

**Lees een duur-token nooit met een losse `parseFloat`.** In de geminificeerde
CSS staat `.52s` en niet `520ms`, en `parseFloat` maakt daar 0,52 van. De
teller telde zo in één beeldje naar 100, en het vangnet van de opening ging te
vroeg af. Gebruik `duurInMs()` uit `src/lib/duur.ts`; die kijkt naar de
eenheid.

De zoom bij hover zit in `Beeldvlak` achter `zoom`, en staat alleen aan waar het
beeld ergens heen gaat: in de praktijk een splitscreen-deur mét knop. Let op dat
Tailwind 4 `scale-[…]` op de losse `scale`-property zet — een transitie op
`transform` raakt die niet en dan springt de zoom in één beeldje. Dat is niet te
zien aan de klassenaam. Dezelfde fout zat tot B16 in de indruk van `Knop` en de
hover van een klikbare `Kaart`: `scale` en `translate` zijn in Tailwind 4 losse
properties.

### Beweging meet je niet in een pane die niet composit

De Browser-pane rendert alleen als hij in beeld staat. Staat hij dicht, dan is
`document.visibilityState` `hidden`, vuurt `requestAnimationFrame` niet, gaat
geen enkele `IntersectionObserver` af en levert een `layout-shift`-waarnemer nul
regels op. Een CLS van 0 betekent daar dus niets, en een onthulling die niet
afgaat is geen bewijs dat ze stuk is.

Wat je daar wél kunt meten, en dat is meer dan het klinkt:

- **Layout tegenover verf.** `offsetTop`, `offsetLeft`, `offsetWidth` en
  `offsetHeight` negeren transforms; `getBoundingClientRect()` niet. Verschillen
  die alleen in de tweede zitten, zijn per definitie geen layout-verschuiving.
- **De eindtoestand.** Zet `data-onthul-staat="klaar"` op alles en vergelijk.
- **De gereduceerde-bewegingstak.** Haal `data-beweging` van `<html>` af: dat is
  precies wat het script bij `reduce` doet, dus wat je dan ziet, is wat die
  bezoeker krijgt.
- **Welke eigenschappen bewegen.** Loop `document.styleSheets` langs en lees uit
  de keyframes welke properties er in staan. Let op dat je in `@layer`-blokken
  moet afdalen, anders mis je alles wat Tailwind genereert.

## De zes pagina's

`index.astro`, `opdrachtgevers.astro`, `de-100.astro`, `contact.astro`,
`voorwaarden.astro` en `privacy.astro`. Elk paginabestand is nog maar een paar
regels: het leest zijn inhoud met `leesPagina()` uit `src/lib/pagina.ts` en laat
`SectieLijst` de secties tekenen.

De inhoud staat als yaml in `src/content/paginas/`, één bestand per pagina, en
wordt beheerd via Keystatic. Een singleton zonder contentveld schrijft naar
`<pad>.yaml` — niet naar `<pad>/index.yaml`, dat is een makkelijke misser.


**Zet geen uitleg in de yaml zelf.** Keystatic leest een contentbestand in zijn
eigen datamodel en schrijft het daaruit terug; commentaar zit niet in dat model
en is dus weg zodra de redacteur die pagina opslaat. Geen melding, geen
zichtbaar verschil — je merkt het pas als iemand zich afvraagt waarom iets zo
staat. `scripts/check-yaml-commentaar.mjs` houdt dat tegen. Markdown-koppen
binnen een tekstveld (`## Wie wij zijn` in de privacytekst) zijn gewone inhoud
en blijven gewoon staan.

Wat er in `home.yaml` aan uitleg stond en hier is komen te staan:

- **De beschrijving staat er letterlijk, ook al lijkt dat dubbel.** Home leunde
  vroeger op de standaard uit de layout, en die komt uit de site-instellingen.
  Zonder de eigen regel verandert de meta-beschrijving stilletjes zodra iemand
  de site-instellingen aanpast.
- **Home is sinds B9 een landingspagina.** Het eerste scherm is de hero uit de
  mockup, daaronder één blok met de kernpropositie, en verder niets. De twee
  knoppen zijn de twee deuren van de site. Wat er eerder onder stond is verhuisd
  of vervallen; de git-geschiedenis heeft het nog.

`src/lib/pagina.ts` vertaalt CMS-data naar sectieprops. Drie dingen lopen daar
uit elkaar: `Weergave` wordt afgevlakt tot losse props, een leeg knopobject
verdwijnt in plaats van een knop zonder tekst op te leveren, en de deurfoto's
van het splitscreen komen uit de code omdat ze geen redactionele keuze zijn.

De bedoeling is dat alle tekst door de klant is aangeleverd of goedgekeurd. Een
paar zinnen zijn dat nog niet ("Zeg het maar.", "Meld je", "Jij regelt de
rest.", "Wat opdrachtgevers zeggen" en een zin op `/de-100`), en een paar
formulierteksten zijn na de goedkeuring bijgekomen of veranderd, waaronder de
404-pagina. Daarnaast liggen er inhoudelijke vragen: de bovenkop op de home
spreekt de zin eronder tegen, twee meta-beschrijvingen komen uit de
schrijfvoorbeelden van het bureau, en de toestemming voor twee klantcitaten
ontbreekt. Dat zijn tekst- en inhoudskeuzes, dus ze zijn niet zelf opgelost. De
lijst en de exacte zinnen staan in `overdracht.md` onder *Wat jij nog moet
beslissen of aanleveren*. Verzin er in de tussentijd geen nieuwe bij.

De voorwaarden en de privacyverklaring zijn letterlijk overgenomen van wat de
klant aanleverde. Punt 6 van de voorwaarden linkt naar `/privacy`.

Achtergronden per pagina: de vier donkere pagina's staan sinds B8 overal op
`bruin`, voorwaarden en privacy overal op `papier`. Meer dan één lichte en één
donkere achtergrond per pagina is volgens het design system een fout; `roet` en
`mist` zijn verhoogde vlakken bínnen een sectie (`Kaart`), geen tweede
sectieachtergrond, en `inkt` is sinds B8 het zwarte vlak óp bruin — een knop of
een blok, geen paginakleur.

## Vindbaarheid

De sitemap komt van `@astrojs/sitemap` en staat als `sitemap-index.xml` plus
`sitemap-0.xml` in de uitvoer. Welke paden eruit blijven, staat in
`GEEN_SITEMAP` bovenin `astro.config.mjs`.

**Een route op verzoek wordt gewoon meegenomen.** Dat is gemeten en niet
afgeleid: `/contact/verzenden` stond er bij de eerste build in, terwijl dat een
POST-eindpunt is met `prerender = false`. Hij staat daarom expliciet in de
lijst.

**De sitemap en de `noindex`-meta moeten hetzelfde zeggen.** Een pagina die in
de sitemap staat en zichzelf op noindex zet, geeft een zoekmachine twee
tegengestelde signalen; een pagina die nergens in staat en ook geen noindex
heeft, is waarschijnlijk vergeten. `scripts/check-sitemap.mjs` houdt die twee
lijsten tegen elkaar en controleert er de `Sitemap:`-regel in `robots.txt` bij:
absolute URL, hetzelfde domein als de sitemap zelf, en een bestand dat bestaat.

**De canonical en de sitemap staan zonder slotslash**, gelijk aan elke link op
de site en in het CMS. Elke pagina geeft met en zonder slash een 200, en tot B16
zei de canonical "met" terwijl alle links "zonder" waren. De sitemap volgt via
`serialize` in `astro.config.mjs`; de home blijft `/`.

**Een eigen 404: `src/pages/404.astro`.** Daarvoor kreeg een onbekend adres de
functie en Astro's eigen pagina: Engels, zonder navigatie, met een inline
stijlblok dat de CSP blokkeert. Nu routeert de adapter naar het statische
`404.html` met status 404, zonder functie-aanroep. `noindex` en in
`GEEN_SITEMAP`. Hij staat niet in het CMS en hoort niet bij de zes pagina's.

**Gestructureerde gegevens op de home**: een `Organization` als
`<script type="application/ld+json">`, met naam, URL, logo, mail, telefoon,
adres, KvK, btw en Instagram, alles uit de site-instellingen. Een leeg veld valt
weg, en een `<` wordt ge-escapet zodat tekst uit het CMS het blok niet kan
afsluiten. `check-csp` laat precies dit type door, en alleen met geldige JSON.

**Open Graph is compleet**: `og:site_name`, de afmetingen en het type van het
deelbeeld, en een alt erbij. De Instagram-link gaat rechtstreeks naar
`www.instagram.com`, zonder de 301 ertussen.

**`X-Robots-Tag: noindex` op een `*.vercel.app`-adres komt van Vercel, niet van
ons** — maar niet op elk. Het platform zet hem op de unieke deployment- en
preview-URL's; op de productie-alias `declubvan100.vercel.app` staat hij
níet. Een noindex op een preview betekent dus niet dat de site
zelf op noindex staat. Meet dit na het aankoppelen van het domein opnieuw — op
het echte domein hoort hij weg te zijn, en dat is de controle die zegt of de
site gevonden kan worden. Zie stap 1 van `livegang.md`.

## Het formulier

Staat er sinds B13, in twee varianten. **Aanmelden** staat op `/contact`,
**inhuren** op `/opdrachtgevers`. Ze delen naam, e-mailadres, telefoon en
bericht; aanmelden vraagt daarnaast naar horeca-ervaring (optioneel) en waar je
enthousiast van wordt, inhuren naar de zaak of het bedrijf.

> **De privacyverklaring is aangevuld en dat is akkoord.** De twee alinea's
> over de extra velden staan in `privacy.yaml`. Daarmee dekt de verklaring alle
> velden die het formulier vraagt. De zin "Meer vragen we niet." staat achter
> die nieuwe alinea's, want anders spreekt de verklaring zichzelf tegen.

### De schakelaar: `FORMULIER_ACTIEF`

**Zonder deze variabele doet het formulier niets.** De sectie toont dan één
regel — "Het formulier staat er bijna. Mail ons zolang op contact@declubvan.nl"
— in plaats van de velden, en `/contact/verzenden` weigert de inzending zonder
te controleren en zonder iets te versturen. Alleen de waarde `ja` zet hem open.

**Uit is een geldige toestand, en geen poortstap dwingt hem af.** Dat is het
verschil met `check-resend` en `check-opslag`: die vangen een vergissing — een
build op Vercel waar een noodzakelijke variabele ontbreekt. Deze niet. Er zijn
goede redenen om hem uit te laten staan, en de poort hoort daar niets van te
vinden.

**De inhoudelijke blokkade is weg.** De aanvulling op de privacyverklaring, de
labels, de foutmeldingen, de knopteksten en de koppen zijn goedgekeurd. Daarmee
vraagt het formulier niets meer dat de verklaring niet noemt. De schakelaar
blijft staan: moet het formulier ooit even dicht, dan is dat een
instelling en geen code.

Na die goedkeuring zijn er wel een paar formulierteksten bijgekomen of
veranderd — onder meer "Er mist nog iets. Onder de velden staat wat er nog moet
gebeuren." in plaats van "…wat hieronder rood staat?" (WCAG 1.4.1), en de
toevoeging "— of mail naar contact@declubvan.nl." bij een verzendfout. Die staan
op de lijst voor de klant; zie *De zes pagina's*.

Wat er nog moet gebeuren is één handeling in Vercel en geen code: zet
`FORMULIER_ACTIEF` op `ja` voor Production en **deploy opnieuw**. Zonder die
tweede stap blijft de melding staan terwijl de instelling goed is — zie
hieronder waarom, en stap 5 van `livegang.md` voor de controle erbij.

Hij wordt op twee momenten gelezen, en dat is geen slordigheid: de secties zijn
vooraf gerenderd en lezen hem tijdens de build, de route draait op verzoek en
leest hem per aanvraag. Op Vercel zijn dat dezelfde waarden, maar een wijziging
werkt pas zichtbaar na een nieuwe build — de route weigert meteen, de melding op
de pagina verschijnt na de deploy.

### Eén bron voor de velden

`src/lib/formulier-velden.ts` zegt welke velden er zijn, hoe ze heten, wat er
staat als ze leeg zijn en hoe lang ze mogen worden. Drie plekken lezen daaruit:

| Wie | Waarvoor |
|---|---|
| `Formulier.tsx` | rendert de velden |
| `src/lib/formulier.ts` | controleert ze op de server |
| `FormulierScript.astro` | controleert ze in de browser |

Stonden die drie los, dan lopen ze uit elkaar zodra er een veld bij komt — en
dan keurt de server iets af wat de browser goedvond. Wijzigt Lune een zin, dan is
dit het enige bestand dat mee hoeft.

**De velden staan niet in het CMS.** Daar zijn alleen de variant, de kop en de
zin erboven kiesbaar. De velden hangen aan wat de privacyverklaring belooft, en
dat is geen redactionele keuze.

### Drie routes, en maar één ervan draait op verzoek

| Route | Draait | Doet |
|---|---|---|
| `/contact`, `/opdrachtgevers` | vooraf gerenderd | tonen het formulier |
| `/contact/verzenden` | **op verzoek** | controleert, verstuurt, verwijst door |
| `/contact/bedankt` | vooraf gerenderd | de bevestiging |

`/contact/verzenden` is de enige route in dit project met
`export const prerender = false;`. `output: 'static'` blijft staan. De pagina's
die iedereen bezoekt hoeven niets te weten; alleen de afhandeling heeft een
server nodig.

Na een geslaagde inzending volgt een **303** naar de bedankpagina, geen 302: na
een POST hoort de doorverwijzing een GET te worden, anders post de browser de
inzending nog een keer bij het verversen.

**Geen persoonsgegevens in de URL.** Een afgekeurde inzending is daarom geen
doorverwijzing maar een gerenderde pagina: de ingevulde waardes komen uit de
POST-body en gaan nooit door de adresbalk, waar ze in de browsergeschiedenis en
in serverlogs zouden blijven staan.

Wat er sinds B16 van buiten wordt opgevangen:

- **Een body die geen formulier is**, krijgt een 303 naar `/contact`.
  `formData()` gooit bij elk ander content-type, en dat werd een 500.
- **De pagina met ingevulde gegevens krijgt `Cache-Control: no-store`**, zodat
  hij ook in de back/forward-cache van een gedeelde computer niet blijft staan.
- **Teruggezette waardes worden op de veldlengte afgekapt.** De browser houdt
  zich aan `maxLength`, een POST van buiten niet: een bericht van 3 MB leverde
  een pagina van 3 MB op.
- **Regeleindes tellen als LF**, zoals `maxLength` en het script doen. Een
  browser verstuurt CRLF, en dan keurde de server een bericht af dat de browser
  goedvond.

### De validatie staat op drie plekken, en dat is geen dubbel werk

**In de HTML** staan `required` en `type="email"`. Dat is het vangnet voor wie
geen JavaScript heeft: de browser houdt dan zelf een leeg of onvolledig veld
tegen, in de taal van de bezoeker.

(Een eerdere versie zette `noValidate` in de HTML, met als reden dat Chrome
Engelse meldingen toont. Dat klopte niet — die meldingen volgen de taal van de
browser, en wat er gemeten werd kwam uit de omgeving van de meter.)

**In het script** wordt `noValidate` bij het laden gezet en de controle
overgenomen, zodat de melding onder het veld komt te staan met
`aria-describedby` eraan — op dezelfde plek als een serverfout, in plaats van in
een ballonnetje dat bij de eerste klik verdwijnt.

**Op de server** wordt alles opnieuw gecontroleerd. De twee andere zijn
hulpmiddelen voor de bezoeker en geen grendel: een POST kan overal vandaan komen
en die attributen zijn dan nooit langsgekomen.

### Vier toestanden

Leeg, bezig, gelukt en fout. Zonder JavaScript werken er drie via gewone
paginanavigatie. Het script voegt toe:

- de **bezig**-stand op de knop, die meteen op slot gaat zodat niemand twee keer
  verstuurt
- de **focus** naar het eerste veld dat aandacht vraagt, na een afgekeurde
  inzending — de bezoeker staat anders bovenaan een pagina die er hetzelfde
  uitziet als daarvoor
- de **status** in een `role="status"`, zodat een schermlezer hoort wat er
  gebeurde. Leeg staat die regel op `empty:sr-only` en niet op `hidden`:
  `display: none` haalt hem uit de toegankelijkheidsboom, en een live region die
  tegelijk met zijn inhoud verschijnt, wordt door veel schermlezers niet
  voorgelezen
- na de **terugknop** gaat de verzendknop weer van slot en komt er een nieuwe
  tijdstempel; de pagina komt anders uit de back/forward-cache met de knop nog
  op "bezig"

Het mailadres in de meldingen en op de bedankpagina is een link, via
`Mailbaar`; de goedgekeurde tekst zelf verandert daarvoor niet. De ids krijgen
de variant ervoor (`aanmelden-naam`), want het CMS laat twee formulierblokken op
één pagina toe en dan waren er dubbele ids. De `name` blijft de kale veldnaam:
daar leest de server op.

Een veld dat al is afgekeurd wordt opnieuw gecontroleerd zodra de bezoeker het
verlaat. Bij blur en niet bij elke toetsaanslag: meetypen met iemand die nog
bezig is, levert meldingen op over een veld dat nog niet af is.

### Twee hordes tegen bots, en ze vangen verschillende

**De honeypot** is een veld dat een mens nooit ziet en dus nooit invult. Hij
werkt altijd, ook zonder JavaScript, en staat op `hidden` via een klasse — een
`style`-attribuut zou door de CSP geblokkeerd worden, en dan stond het veld
gewoon zichtbaar in het formulier. Zijn naam staat als `HONINGPOT` in
`formulier-velden.ts` en is met opzet betekenisloos, met de opt-outs van de grote
wachtwoordbeheerders erbij. Hij heette `bedrijfsnaam`, precies waar autofill op
afgaat, terwijl inhuren er een echt bedrijfsveld naast heeft: werd dat veld bij
een mens behulpzaam gevuld, dan kreeg die de bedankpagina en kwam het bericht
nooit aan.

**Een afgewezen bot krijgt de gelukt-melding te zien.** Honeypot en tijdsdrempel
leiden allebei naar dezelfde 303 naar de bedankpagina als een geslaagde
inzending — maar `verstuur()` wordt niet aangeroepen, dus er gaat geen mail uit.
Dat het er van buiten hetzelfde uitziet is het punt: een bot die een foutmelding
krijgt, weet dat hij ergens tegenaan liep en past zich aan.

**De tijdsdrempel** meet hoe lang iemand over het invullen deed, met een
ondergrens van drie seconden. Die kan niet uit de server komen: de pagina is
vooraf gerenderd, dus een tijdstempel in de HTML is de bouwtijd en niet de
laadtijd. `FormulierScript` zet hem bij het laden.

**Ontbreekt die tijdstempel, dan wordt de inzending níet geweigerd.** Anders
sluit je iedereen buiten die geen JavaScript draait. Bots zonder script lopen
tegen de honeypot, bots mét script tegen de drempel.

**Let op de klokmarge.** De tijdstempel komt uit de browser en het verschil wordt
op de server uitgerekend; die twee lopen vrijwel nooit gelijk. Elke negatieve
waarde gold eerst als "uit de toekomst" en dus als onbruikbaar — en daarmee
stond de drempel bij een groot deel van de bezoekers uit. Gemeten op de deploy:
een klok die 1446 ms voorliep, en de inzending ging er ongehinderd doorheen. Een
klein negatief verschil betekent nu "net geladen, dus te snel"; pas boven twee
minuten vervalt de drempel. Dat is de goede kant om op te falen.

Geen captcha. Die legt de last bij de bezoeker en werpt een drempel op voor
precies de mensen die zich willen melden.

### Versturen gaat via Resend

`RESEND_API_KEY` staat in `.env.example` en in alle drie de Vercel-omgevingen.
Hij wordt met `process.env` gelezen en niet met `import.meta.env`: Vite bakt dat
laatste als object-literal in de bundel, dus het geheim zou onversleuteld in het
gebundelde bestand belanden én alleen werken als de variabele al bij de build
bestond. Nagemeten — met de variabele gezet tijdens de build stond de sleutel er
letterlijk in.
`scripts/check-resend.mjs` laat een build op Vercel omvallen zodra de sleutel
ontbreekt, maar of hij geldig is en het domein geverifieerd, blijkt alleen uit
een echte verzending.

**Het onderwerp zegt welke soort het is** — `Aanmelding — {naam}` of
`Personeelsaanvraag — {zaak}`. Dat is geen opmaak: de privacyverklaring bewaart
aanmeldingen twaalf maanden en aanvragen zes, en die twee termijnen zijn alleen
toe te passen als ze in de mailbox uit elkaar te houden zijn.

**De mail is platte tekst.** Er is geen `html`-veld, dus er valt niets te
escapen: wat de bezoeker typt komt letterlijk in de body en wordt nergens als
opmaak gelezen.

**Het onderwerp wordt wél geschoond.** Daar staat een naam of een zaaknaam in,
en een regeleinde daarin is het recept voor header-injectie — wat na de CR of LF
komt kan door een mailserver als een nieuwe header gelezen worden. Alle
controletekens gaan eruit en de rest wordt ingekort. Of Resend dat zelf afvangt
weten we niet, en daar wachten we niet op. Sinds B16 filtert het op
Unicode-categorie (`Cc`, `Cf`, `Zl`, `Zp`) en niet op codepunt onder de 32:
dat liet leesrichtingswissels als U+202E, tekens zonder breedte en U+2028/2029
door — een onderwerp dat in de mailbox iets anders toont dan er staat, terwijl
de twee bewaartermijnen aan dat onderwerp hangen.

**Een mislukte verzending komt in de log, en alleen dat.** Tot B16 werd de
status van Resend weggegooid: een niet-geverifieerd domein of een vol quotum gaf
de bezoeker een foutmelding en de Vercel-log een geslaagde 200. Nu logt
`verstuur()` de status en de foutnaam van Resend, een ontbrekende sleutel en een
netwerkfout, en een stille afwijzing (honeypot, te snel) komt als waarschuwing
met alleen de reden. Elke regel begint met `formulier:`, dus in de Vercel-log
filter je daarop. Er staat nooit een naam, adres of bericht in, ook niet als
Resend het adres in zijn eigen foutmelding zet.

`fetch` naar Resend heeft een time-out van tien seconden. Een hangende API liet
anders de functie wachten tot Vercel hem afbrak, en dan kreeg de bezoeker
Vercels eigen foutpagina en was de ingevulde tekst kwijt.

`Reply-To` is het adres van de inzender, zodat een antwoord rechtstreeks bij hem
aankomt in plaats van bij het formulieradres.

**Geen bevestigingsmail naar de inzender.** Een formulier dat post stuurt naar
een adres dat de afzender zelf invult, is een open doorgeefluik: iemand vult het
adres van een ander in, schrijft wat hij wil, en de mail komt van ons domein. De
bevestiging staat daarom op het scherm.

Mislukt het versturen, dan krijgt de bezoeker het mailadres te lezen en blijft
zijn tekst staan. Hij kan er niets aan doen, dus hij leest niet dat hij iets fout
deed.

## De navigatie

Staat er sinds B4, in `src/components/navigatie/Navigatie.astro`. Boven 900px
een rij links, daaronder een menuknop met uitklappaneel. De links komen uit de
site-instellingen in het CMS.

Astro-component en geen React, net als de logo's: het hoort bij de layout, en zo
gaat er geen React naar de browser voor één menu.

Vijf dingen die je niet moet weghalen:

- **900px is een token**, `--breakpoint-nav` in `tokens.css`, met de variant
  `nav:`. Het valt tussen `md` en `lg` en heeft daarom een eigen naam.
- **Het script kent dat getal niet.** Het kijkt of de menuknop nog zichtbaar is
  (`offsetParent === null`); die staat op `nav:hidden`, dus zodra hij weg is
  zijn we boven het breekpunt. Het getal op twee plekken zetten zou de
  tokencontrole terecht laten vallen.
- **De knop zit in de focusval.** Hij is ook de sluitknop; laat je hem eruit,
  dan loop je met shift+tab het menu uit zonder het te sluiten. Escape sluit én
  geeft de focus terug aan de knop — zonder dat laatste valt de focus terug op
  `<body>` en begint de volgende tab weer bovenaan.
- **Het mobiele paneel staat binnen de `<nav>`.** Het stond ernaast in de
  header, en dan bevatte het landmark "Hoofdnavigatie" op een telefoon alleen de
  knop.
- **Het menu sluit bij `pageshow` uit de back/forward-cache.** Wie via het menu
  naar een andere pagina ging en terugbladerde, kreeg het menu nog open, met de
  focusval actief.

De focusval is gemeten met echte toetsaanslagen, niet met synthetische events:
die laatste verplaatsen de focus niet, dus daar meet je niets mee.

De huidige pagina is krijt én onderstreept: alleen krijt tegen krijt-zacht is
1,66:1, en als kleur het enige verschil is moet dat 3:1 zijn (WCAG 1.4.1).

## Niet upgraden: Keystatic staat vast op 0.6.4

**`@keystatic/core` en `@keystatic/astro` staan exact gepind, zonder caret en
zonder tilde, met een `overrides`-blok erbij.** Draai hier geen `npm update`
overheen zonder eerst te meten.

Op **0.6.5 opent een rij in een `fields.blocks`-lijst niet meer**. Klikken,
dubbelklikken en Enter doen niets, er komt geen dialoog en er staat niets in de
console. Daarmee is elke bestaande sectie op elke pagina onbewerkbaar: je kunt
alleen nog toevoegen, verwijderen en verslepen. Het CMS is dan stil kapot — de
admin laadt, de lijst staat er, en pas als je iets wilt wijzigen merk je het.

Reproductie (gemeten 11 augustus 2026):

- een singleton met één `fields.blocks` met twee triviale varianten, elk een
  object met één tekstveld, zonder `itemLabel`
- op **0.6.4**: klikken op een rij opent "Edit &lt;variantnaam&gt;" met de velden erin
- op **0.6.5**: er gebeurt niets

Het ligt niet aan ons schema. Een gewone `fields.array` — van een tekstveld óf
van een object, met of zonder `itemLabel` — opent op beide versies gewoon. Het
verschil zit in `fields.blocks`. In die stap gaat `@keystar/ui` van 0.9.2 naar
0.9.3; `react-aria` is in beide 3.50.0, dus dat is het niet.

Gemeld als [Thinkmill/keystatic#1593](https://github.com/Thinkmill/keystatic/issues/1593).
**Zodra dat issue dicht is, kan de pin eraf** — meet dan opnieuw of een
blocks-rij opengaat voordat je hem weghaalt.


### Main is klassiek beschermd, en dat is geen willekeur

**De bescherming op `main` moet een klassieke branch protection rule zijn, geen
ruleset.** Allebei werken ze — GitHub weigert de commit en er komt niets op main
— maar Keystatic 0.6.4 reageert op precies twee GraphQL-fouttypes:

```
BRANCH_PROTECTION_RULE_VIOLATION      klassieke regel  → herkend
STALE_DATA                                             → herkend
REPOSITORY_RULE_VIOLATION             ruleset          → niet herkend
```

Meer staat er niet in de bundel. Bij de klassieke regel opent Keystatic een
dialoog — "Changes must be made via pull request to this branch. Create a new
branch to save changes." — met een invoerveld en een knop *Create branch and
save*. De redacteur typt een naam en is klaar; wat ze typt krijgt `redactie/`
ervoor.

Met een ruleset valt de fout door naar de generieke foutweergave en leest ze
`[GraphQL] Repository rule violations found`. Even veilig, maar een doodlopende
weg: er is geen knop en geen uitweg.

Dit is gemeten, niet afgeleid. Er stond eerst een ruleset met exact dezelfde
regels, en daarop bleef de dialoog uit.

De ingestelde regel op `main`:

| Instelling | Waarde |
|---|---|
| pull request verplicht | ja, 0 goedkeuringen |
| verplichte status check | `check` |
| strict (branch moet bij zijn) | nee |
| geldt ook voor admins | ja |
| force-push | niet toegestaan |
| verwijderen | niet toegestaan |

Haal je die regel weg, dan kan de redacteur main in de branch-kiezer selecteren
en rechtstreeks live publiceren. Keystatic heeft daar geen eigen rem voor; de
hele werkwijze hangt aan deze instelling.

`delete_branch_on_merge` staat uit, dus de `redactie/`-branches blijven na het
samenvoegen staan. De repo is openbaar, en daar kan een klassieke regel op elk
GitHub-plan. Wordt hij ooit privé, dan vraagt branchbescherming een betaald
plan en valt de rem anders stil weg. Na een verhuizing of een wijziging van
zichtbaarheid: zie *Vooraf* in `livegang.md` voor de controle.

### Wat het CMS zelf tegenhoudt

Sinds B16 weigert `keystatic.config.ts` twee dingen die anders stil live gingen:

- **Een link die nergens heen kan.** Elke link — knop, kaart, menu,
  voettekst — moet voldoen aan het patroon `LINK`: beginnen met `/`, `https://`,
  `mailto:` of `tel:`, of leeg zijn waar dat mag. Een tikfout als `contact` of
  `www.iets.nl` werd anders een dode link. `check-links` is de tweede lijn: die
  ziet ook of de pagina bestaat.
- **Een kop van alleen spaties.** `length: { min: 1 }` liet die door; de
  verplichte koppen gebruiken nu `VERPLICHTE_KOP`, met een patroon `\S`.

Verder kreeg een kaart in `drie-kolommen` het veld *Taal van de kop*
(standaard Nederlands), zodat een Engelse kop `lang="en"` krijgt en een
schermlezer hem met een Engelse stem voorleest; de drie koppen op
*Voor wie is de club?* staan op Engels. *Twee deuren* neemt er hooguit twee,
want er liggen twee foto's vast in de code. En het formulierblok heet
**Formulier** en niet meer Aanmeldformulier, want het doet ook inhuren.

**Een Keystatic-geheim roteren vraagt een nieuwe deploy.** `@keystatic/astro`
zet de geheimen van de GitHub App bij de build in de serverbundel. Een nieuwe
waarde in Vercel doet dus niets tot er opnieuw gebouwd is. Ontbreekt er bij die
build een, dan laat `check-opslag` hem vallen.

### Een oud lokaal concept overschaduwt het bestand

Los van de pin, en niet opgelost. Keystatic bewaart een niet-opgeslagen
bewerking in IndexedDB. Kom je later terug op die pagina, dan toont de admin dat
concept in plaats van het bestand op schijf, met `Unsaved` erboven. Was het
concept van vóór de inhoud, dan zie je een lege lijst — en `Save` schrijft die
leegte dan over de echte secties heen.

We zagen het op opdrachtgevers: vijf secties in de yaml, "Empty list" in het
paneel. `Reset` bracht ze meteen terug.

**Er is geen instelling om dit uit te zetten.** `CommonConfig` kent alleen
`locale`, `cloud` en `ui`, en er zit geen vervaltermijn op een concept — in de
bundel is geen verloop- of `maxAge`-logica te vinden die eraan hangt.
`showDraftRestore` klinkt als een optie maar is een interne functie voor de
melding. Bouw er dus niets omheen: een eigen laag zou de opslag van het pakket
moeten opruimen en gaat bij de eerste update stuk.

De redacteur is er wel voor gewaarschuwd — het staat als eerste blok in
`overdracht.md`, als handeling. Gemeld als
[Thinkmill/keystatic#1594](https://github.com/Thinkmill/keystatic/issues/1594).

### Waarom `vite` ook in overrides staat

Niet hetzelfde probleem, wel dezelfde soort. `astro` wil vite 7,
`@tailwindcss/vite` en `@vitejs/plugin-react` trekken vite 8 naar boven. Met
allebei in de boom komen de types uit twee majors en valt `astro check` om op
`Type 'Plugin<any>[]' is not assignable to type 'PluginOption'` in
`astro.config.mjs`. De override dwingt vite 7 af, wat elke peer-range toelaat.

Dit kwam pas boven bij een verse installatie zonder lockfile. Met de lockfile
erbij merk je het niet, en dat is precies waarom het hier staat.

## Beeld gaat langs Astro's pijplijn heen, en dat is opgelost

De secties tonen een foto met een gewone `<img>` en niet met Astro's
`<Image>`-component. Dat is geen slordigheid maar een gevolg: de beeldpijplijn
werkt op imports die tijdens het bouwen bekend moeten zijn, en een pad dat uit
een yaml-bestand komt is dat niet. Zodra de redacteur een foto kiest, kan die
niet meer door die pijplijn.

**Sinds B14 staat er een eigen pijplijn naast.** Drie bestanden:

| Bestand | Wat het doet |
|---|---|
| `scripts/maak-beeldvarianten.mjs` | maakt webp-varianten en schrijft het manifest |
| `src/lib/beeldvarianten.json` | welke breedtes er per foto zijn, plus de breedte van het origineel |
| `src/lib/beeld.ts` | zet daar een `srcset` uit samen |

De generator draait in `npm run build`, vóór `astro build`, zodat
`check-beeldpaden` de varianten ziet staan. Breedtes zijn 640, 1024 en 1600,
alleen die kleiner zijn dan het origineel, en sinds B16 ook een webp op de volle
breedte van het origineel. Hij importeert `sharp` rechtstreeks, en daarom staat
`sharp` sinds B16 in `dependencies`; eerst zat het alleen als optionele
afhankelijkheid van `astro` in de boom.

**Waarom bij het bouwen en niet via Vercels beeldoptimalisatie.** Die is
uitgeprobeerd en werkt: `imageService: true` op de adapter schrijft het
`images`-blok met acht breedtes in `.vercel/output/config.json`, en
`/_vercel/image?url=…&w=…` had het gedaan. Toch niet gekozen, om één reden: dat
endpoint bestaat alleen op de deploy. Lokaal zou elk beeld een 404 geven of een
ander bestand opleveren dan wat er live staat, en dan kan geen enkele poort er
nog iets over zeggen. Bij het bouwen is lokaal hetzelfde als productie.

Dat dit ook de uploads van de redacteur dekt, is geen toeval maar de reden dat
het kan: elke fotowijziging gaat via een commit van Keystatic, en die levert een
nieuwe build op.

Vijf dingen die je niet moet weghalen:

- **Het manifest.** Een variant die breder zou zijn dan het origineel wordt niet
  gemaakt — opschalen kost bytes en levert geen scherpte. Niet elke foto heeft
  dus dezelfde varianten, en `beeld.ts` moet weten welke. Zou die het raden, dan
  wijst de srcset naar een bestand dat niet bestaat.
- **De extensie blijft in de variantnaam staan.** `Burgers flippen.jpg` en
  `Burgers flippen.jpeg` zijn twee foto's; met de extensie eraf leveren ze
  dezelfde variantnaam op. Gemeten: de tweede werd stil overgeslagen.
- **De paden in een `srcset` zijn url-gecodeerd.** Een srcset splitst op komma's
  én op witruimte, dus `/beeld/home/Jor Sep achter.jpg` zou de browser lezen als
  de URL `/beeld/home/Jor` met breedte `Sep`. Het `src`-attribuut blijft
  ongecodeerd; daar is de hele waarde de URL.
- **`sizes` komt uit `src/lib/breekpunten.ts`**, die de waardes uit `tokens.css`
  leest. Zonder `sizes` gaat de browser uit van de volle vensterbreedte en haalt
  hij ook voor een kaart van een derde de grootste variant op. En de waardes
  moeten uit de tokenlaag komen: `--breakpoint-sm` is hier **600px** en niet de
  640 van Tailwind, en dat verschil was zonder `check-tokens` meegegaan.
- **De foto wordt eerst rechtop gezet.** Een staande telefoonfoto is vaak
  liggend opgeslagen met een EXIF-tag die zegt hoe hij gedraaid moet worden. De
  browser volgt die tag voor het origineel; sharp deed dat niet, en dan lag
  elke variant op zijn kant, met de liggende breedte in de srcset. `.rotate()`
  zonder hoek draait naar de tag, en het manifest krijgt de rechtgezette breedte.

**De grootste kandidaat in de srcset is de webp op volle breedte**, niet meer
het origineel. Dat koos elk breed of retinascherm: voor de herofoto een JPEG van
476 kB, nu een webp van 194 kB. `src` blijft het origineel, als terugval. Een
manifest zonder die volle variant zet het origineel er zoals eerst als grootste
kandidaat in, anders zou een breed scherm het op 1024 moeten doen.

**Voorrang voor de herofoto, de rest lui.** De foto van de hero die de pagina
opent krijgt `fetchpriority="high"` via de prop `voorrang` op `Beeldvlak`. Elke
andere foto laadt met `loading="lazy"` en `decoding="async"`: de kaartfoto's op
`/de-100` werden meteen opgehaald en concurreerden met de lettertypes van het
eerste scherm. Die lettertypes — de latin-subsets van Montserrat en Special
Elite — worden in de layout voorgeladen, naar hetzelfde gehashte bestand als de
`@font-face`. `BeeldTekst` gebruikt sinds B16 ook de srcset, met `sizes` op
`md` 50vw.

De nulstand van vóór deze reparaties, gemeten met headless Chrome op
`declubvan100.vercel.app`, telefoonprofiel 375 px met vertraagd 4G en 4×
tragere CPU: LCP 1,2–1,5 s op vijf pagina's, de home bij een koude eerste
lading 2,8 s, CLS overal onder 0,02, geen CSP-schendingen, geen scriptfouten en
geen horizontale overloop. Desktop: LCP 0,26–0,62 s. Wat de reparaties
opleveren is nog niet gemeten; zie stap 8 van `livegang.md`.

### Wat er niet mee is opgelost

**De foto's in `public/beeld` hebben geen hash in hun naam**, dus ze kunnen geen
`immutable`-cacheheader krijgen zoals `/_astro/*` die uit `vercel.json` krijgt
(niet van de adapter: zie *De andere headers, de cache en de regio*).
Keystatic schrijft een vervangen foto naar hetzelfde pad, dus `immutable` zou
een jaar lang de oude foto blijven serveren. `vercel.json` geeft `/beeld/*`
daarom een dag vers met een maand `stale-while-revalidate`: een terugkerende
bezoeker haalt niets opnieuw op, en een vervangen foto is binnen een dag overal
door.

## Bekende beperking — de admin is half Nederlands

`keystatic.config.ts` staat op `locale: 'nl-NL'`. Dat helpt, maar niet overal.

Keystatic heeft een eigen woordenboek van 27 strings en die zijn voor `nl-NL`
allemaal ingevuld — datumnotatie en relatieve tijd komen er goed uit
("4 seconden geleden"). Wat je daarnaast in het paneel ziet staat niet in dat
woordenboek maar hard in de componentbibliotheek eromheen, en daar is geen
taalinstelling voor. Engels blijven dus onder meer: `Add`, `Empty list`,
`Add the first item to see it here.`, `Unsaved`, `Create` en
`Restored draft from`.

**Ook de foutmeldingen bij verplichte velden.** Die werken wél — het veld krijgt
`aria-invalid`, `aria-required` en de melding hangt er via `aria-describedby`
aan, dus een schermlezer krijgt hem netjes mee. Maar de tekst is Engels en plakt
aan ons Nederlandse label vast: "Wat staat er op de foto must not be empty",
"Foto is required". Ze zijn wel te begrijpen, en ze staan onder het veld waar
het misgaat.

Dit is dezelfde beperking als hierboven, geen aparte. Bouw er geen eigen
validatielaag omheen: die zou de bestaande koppeling met `aria-describedby`
moeten nabouwen, en dat is precies het deel dat nu goed zit.

Alles wat wij zelf schrijven — veldlabels, beschrijvingen, de namen van de
sectietypes, de tekst in de keuzelijsten, en de meldingen bij de patronen
`LINK` en `VERPLICHTE_KOP` — is wel Nederlands.

**Bouw hier geen eigen vertaallaag omheen.** Die zou tegen de UI van een pakket
aan gaan zitten dat we niet beheren, en bij elke update opnieuw stuk kunnen. Een
redacteur die een paar keer per jaar inlogt, komt hier langs.

## Bekende beperking

`npm audit --omit=dev` meldt zes kwetsbare pakketten (5 high, 1 low). Van de
acht advisories op `astro` zelf zijn er vijf verholpen door de upgrade naar
Astro 6; drie blijven staan en die vragen allemaal Astro 7:

| Advisory | Gepatcht vanaf |
|---|---|
| XSS via unescaped spread attribute names | 7.0.6 |
| XSS via `transition:*` op gehydrateerde eilanden | 7.0.4 |
| Reflected XSS via View Transition-animatieproperties | 7.1.0 |

Daarnaast `esbuild` (low, alleen de dev-server op Windows), `sharp`,
`path-to-regexp` en `@vercel/routing-utils`.

De drie resterende astro-advisories gaan over View Transitions, `transition:*`
en spread-attributen. Dit project gebruikt geen van drieën — spread-attributen
zijn zelfs bij afspraak verboden — dus de blootstelling is nu nul. Dat verandert
zodra je ze wel inzet.

Niet oplossen met `npm audit fix --force`: dat tilt de repo naar Astro 7 en
`@astrojs/vercel` 11. Overleg eerst.
