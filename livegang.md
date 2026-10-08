# Livegang

De stappen die niet in code staan, in de volgorde waarin ze moeten. Elke stap
heeft een controle erbij — niet "het staat ingesteld" maar "het werkt", want dat
zijn twee beweringen en de eerste bewijst de tweede niet.

Alles hieronder gaat uit van **`declubvan.nl` als het echte adres**, met `www`
dat ernaartoe doorverwijst. Dat is de keuze, en hij staat al zo in
`astro.config.mjs`: `site: 'https://declubvan.nl'`. Elke canonical, elke
`og:url` en elke regel in de sitemap komt daaruit.

De versie voor de redacteur, in gewone taal en met wie wat doet, staat in
`overdracht.md` onder *Wat er nog moet gebeuren*. Die verwijst per punt naar een
stap hier.

---

## Vooraf: eigenaarschap en de rem op main

Het domein, de omgevingsvariabelen, de callback van de App en de uitnodiging
van de redacteur hangen allemaal aan de repository en het Vercel-project; die
wil je één keer goed zetten en niet na een verhuizing opnieuw.

**Waar het staat.** De repository is `EtienneHarry/declubvan100-site`, en die is
openbaar. Het Vercel-project gaat over naar het Vercel-team DNAsign. Verhuist de
repository later nog eens, dan gaan er drie dingen mee en dat is één klus:
`repo` in `keystatic.config.ts`, de GitHub App (eigendom en installatie op de
repo), en de Git-koppeling van het Vercel-project. De tabel *Accounts en wie ze
heeft* in `overdracht.md` is de lijst om bij te houden.

**Het Vercel-abonnement.** Hobby is volgens Vercels voorwaarden alleen voor
niet-commercieel, persoonlijk gebruik. Dit is een bedrijfssite, dus het project
hoort in een team met een passend abonnement. Stap 6 hangt er ook van af.

**De rem op main.** De hele werkwijze van de redacteur — de dialoog "Create
branch and save", de verplichte `check`, geen rechtstreekse publicatie — staat
op een klassieke branch protection rule (zie *Main is klassiek beschermd* in
`CLAUDE.md`). Op een openbare repo kan dat op elk GitHub-plan. Wordt de repo
ooit privé, dan vraagt die regel een betaald plan; zonder dat valt de rem
**stil** weg: geen foutmelding, geen dialoog, en een Save op `main` staat meteen
live.

**Controleren na een verhuizing of een wijziging van zichtbaarheid:**

```bash
gh api repos/<eigenaar>/declubvan100-site/branches/main/protection \
  --jq '{checks: .required_status_checks.contexts, admins: .enforce_admins.enabled, pr: (.required_pull_request_reviews != null)}'
```

Verwacht: `checks` met `check` erin, `admins: true`, `pr: true` — de waardes
uit de tabel in `CLAUDE.md`. Een 403 of 404 betekent dat er geen regel geldt.
Laat daarna de redacteur één keer op `main` opslaan en kijk of de dialoog
verschijnt (zie stap 4).

**Openbaar betekent: geen geheimen in de repo.** Alle sleutels staan in Vercel,
`.env.example` heeft alleen namen zonder waardes. Houd dat zo.

---

## 1. Het domein aankoppelen

**Bij Vercel**, onder *Settings → Domains* van het project:

| Domein | Instelling |
|---|---|
| `declubvan.nl` | primair |
| `www.declubvan.nl` | *Redirect to* `declubvan.nl`, met 308 |

**Wat er nu staat.** `declubvan.nl` en `www` wijzen allebei met een A-record
naar de hostingserver van Mijndomein. Daar staat een lege standaardpagina, en
HTTPS geeft er een certificaatfout (curl: exit 60). Er staat dus geen site die
verdwijnt als de DNS omgaat.

De nameservers zijn die van Mijndomein. **Laat die staan**: de DNS blijft bij
Mijndomein, en daar staan ook de mail en de records van Resend.

**Wijzig alleen deze twee**, in de DNS van `declubvan.nl` bij Mijndomein:

| Naam | Nu | Wordt |
|---|---|---|
| `@` | `A` → de oude server | `A` → de waarde die Vercel toont |
| `www` | `A` → de oude server | het A-record **verwijderen**, en daarna een `CNAME` → de waarde die Vercel toont |

Een CNAME kan niet naast een ander record met dezelfde naam staan, dus het
A-record van `www` moet eerst weg. Neem de waarden over die Vercel toont op het
moment dat je het domein toevoegt, en niet een waarde uit een oud voorbeeld:
het IP-adres en de CNAME-doel kunnen per project verschillen.

**Blijft staan, allemaal:** de `MX`-records van de mailbox
`contact@declubvan.nl`, de SPF- en DMARC-regels, een bestaande
`google-site-verification`-TXT (zie stap 2), de DKIM-regel van Resend
(`resend._domainkey`) en het verzenddomein van Resend (`send`).

Er staan geen AAAA- en geen CAA-records. Er is dus geen oude IPv6-route die
naast Vercel blijft wijzen, en niets dat Vercel verbiedt een certificaat uit te
geven.

> **Zeg het hostingpakket bij Mijndomein niet op** tot bevestigd is dat de
> mailbox er los van staat. De SPF-regel verwijst naar de hosting van
> Mijndomein; of de mailbox aan het pakket vastzit, is niet uit de DNS af te
> lezen.

**Controleren — en dit is de belangrijkste controle van de hele lijst:**

```bash
curl -sI https://declubvan.nl/ | grep -i "^HTTP\|x-robots-tag"
curl -s https://declubvan.nl/ | grep -o '<link rel="canonical"[^>]*>'
```

Verwacht:

- `200`, en curl slaagt zonder `-k` — dus een geldig certificaat. Exit 60 is de
  certificaatfout van de oude server.
- canonical `https://declubvan.nl/`, gelijk aan de URL die je opvroeg
- **geen** `X-Robots-Tag`. Staat die er wel, dan komt de site niet in Google.
  Dat is stil: de site werkt, hij wordt alleen nooit gevonden.

**Waar Vercel `noindex` wél en niet zet.** Niet op elk `*.vercel.app`-adres:
op de productie-alias `declubvan100.vercel.app` staat geen `X-Robots-Tag`;
Vercel zet hem op de unieke deployment-URL's en de preview-URL's. De
productie-alias is dus gewoon indexeerbaar — en daarom de doorverwijzing
hieronder.

En `www`:

```bash
curl -sI https://www.declubvan.nl/ | grep -i "^HTTP\|^location"
```

Verwacht: `308` en `location: https://declubvan.nl/`.

En de mail, want die mag niet geraakt zijn:

```bash
nslookup -type=MX declubvan.nl.
```

Verwacht: nog steeds de mailservers van Mijndomein. Stuur daarna een testmail
naar `contact@declubvan.nl` en laat de redacteur bevestigen dat hij binnenkomt.

### Daarna: het Vercel-adres laten doorverwijzen

Zodra `declubvan.nl` werkt, hoort `declubvan100.vercel.app` er met een 308 naar
door te verwijzen. Anders staat dezelfde site op twee indexeerbare adressen. De
canonical wijst al naar `declubvan.nl`, maar een doorverwijzing is een bevel en
een canonical een hint.

In `vercel.json`, naast `headers`:

```json
"redirects": [
  {
    "source": "/:path((?!keystatic$|keystatic/|api/keystatic$|api/keystatic/).*)",
    "has": [{ "type": "host", "value": "declubvan100.vercel.app" }],
    "destination": "https://declubvan.nl/:path",
    "permanent": true
  }
]
```

- `permanent: true` levert een 308.
- **De `has`-voorwaarde spaart de previews.** Die draaien op hun eigen
  `*.vercel.app`-adres, en daar bekijkt de redacteur haar wijziging voordat ze
  publiceert. Zonder `has` stuurt elke preview door naar de live site.
- **`/keystatic` en `/api/keystatic` zijn uitgezonderd zolang de oude callback
  nog nodig is** — met hetzelfde patroon als de site-regel van de CSP. Is
  inloggen via `declubvan.nl` getest (stap 3) en werkt niemand meer via het
  Vercel-adres, haal de uitzondering dan weg, en daarna de oude callback uit de
  App.
- `check-headers` geeft alleen `headers` aan `getTransformedRoutes`, dus deze
  regel wordt door de poort niet bekeken. Meet hem.

```bash
curl -sI https://declubvan100.vercel.app/opdrachtgevers | grep -i "^HTTP\|^location"
curl -sI https://declubvan100.vercel.app/keystatic | grep -i "^HTTP"
```

Verwacht: `308` met `location: https://declubvan.nl/opdrachtgevers`, en `200`
op de admin zolang de uitzondering staat.

---

## 2. De sitemap aanmelden

Pas ná stap 1: de sitemap noemt `https://declubvan.nl/…`-adressen, en die moeten
eerst bestaan.

```bash
curl -s https://declubvan.nl/robots.txt
curl -s https://declubvan.nl/sitemap-index.xml
```

De eerste hoort te eindigen met `Sitemap: https://declubvan.nl/sitemap-index.xml`,
de tweede verwijst naar `sitemap-0.xml` met zes URL's: home, opdrachtgevers,
de-100, contact, voorwaarden en privacy. `/secties`, `/contact/bedankt` en
`/contact/verzenden` horen er niet in te staan — die zetten zelf `noindex`, en
`scripts/check-sitemap.mjs` houdt die twee lijsten tegen elkaar.

**Daarna in Google Search Console.** Er staat al een
`google-site-verification`-TXT op `@`, dus iemand bij de Club heeft
waarschijnlijk al een property. Vraag via de redacteur wie, en laat je daar als
gebruiker toevoegen. Daarna:

- **Laat het bestaande record staan.** Haal je het weg, dan vervalt de
  verificatie van wie het daar zette.
- Verifieer de **domeinproperty** (`declubvan.nl`, alle subdomeinen en
  protocollen) met een eigen TXT ernaast. Meerdere TXT-records op `@` kunnen
  naast elkaar.
- Dien `https://declubvan.nl/sitemap-index.xml` in.

**Na een week:** kijk bij *Indexering → Pagina's* welke oude paden Google nog
kent. Er heeft eerder een site op dit domein gestaan, en die paden geven nu een
404. Zet voor elk pad dat nog vertoningen heeft een 308 naar de nieuwe pagina in
`vercel.json`. Een pad zonder vertoningen mag gewoon 404 blijven.

---

## 3. De GitHub App van Keystatic bijwerken

De admin logt in via een GitHub App. Keystatic stuurt bij het inloggen een
`redirect_uri` mee die het uit **de host van de aanvraag** haalt — live gemeten:

```
redirect_uri=https://declubvan100.vercel.app/api/keystatic/github/oauth/callback
```

Op `declubvan.nl` wordt dat dus `https://declubvan.nl/api/keystatic/…`, en
staat dat adres niet in de App, dan weigert GitHub het inloggen.

In de instellingen van de App op GitHub:

| Veld | Waarde |
|---|---|
| Homepage URL | `https://declubvan.nl` |
| Callback URL | **erbij**: `https://declubvan.nl/api/keystatic/github/oauth/callback` |

**De nieuwe callback komt erbij; de oude blijft staan.** Een App kan er
meerdere hebben, en zolang er via het Vercel-adres gewerkt wordt — en zolang de
uitzondering in de doorverwijzing van stap 1 staat — is de oude nodig.

Geen callback voor `www`: die verwijst met een 308 naar `declubvan.nl` en
Keystatic ziet dus nooit `www` als host.

Het pad is niet geraden maar uit de bundel van `@keystatic/core` gehaald; daar
staan precies zes github-routes in, en dit is de callback.

**Na de verhuizing naar `declubvan100-site`:** de App moet op de nieuwe
repository geïnstalleerd zijn, anders kan Keystatic er niet in schrijven. Kijk
in de instellingen van de App onder *Install App* of de repo erbij staat.

**Controleren:**

```bash
curl -s -o /dev/null -w "%{redirect_url}\n" https://declubvan.nl/api/keystatic/github/login
```

Verwacht: een adres op `github.com/login/oauth/authorize` met
`redirect_uri=https%3A%2F%2Fdeclubvan.nl%2Fapi%2Fkeystatic%2Fgithub%2Foauth%2Fcallback`.
Ga daarna naar `https://declubvan.nl/keystatic`, log uit als je nog ingelogd
bent, en log opnieuw in. Je hoort terug te komen op het paneel en niet op een
foutpagina.

> **Een geheim roteren werkt pas na een nieuwe deploy.** `@keystatic/astro`
> leest `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET` en
> `KEYSTATIC_SECRET` met `import.meta.env`, en die waardes worden bij de build
> in de serverbundel gezet. Een nieuw client secret in Vercel invullen en niet
> opnieuw deployen laat de admin met het oude doorwerken — of, als het oude in
> GitHub al is ingetrokken, het inloggen stukgaan.

---

## 4. De redacteur toegang geven

Ze heeft **rol `Write`** nodig op de repository, en niet meer.

Waarom niet `Maintain` of `Admin`: met `Write` kan Keystatic namens haar een
branch maken en een pull request openen, en dat is alles wat de admin doet.
`main` blijft beschermd, dus ze kan niet rechtstreeks publiceren — en die
bescherming is precies wat haar werkwijze draagt. Zie *Main is klassiek
beschermd* in `CLAUDE.md`: haal je die regel weg, dan kan ze main in de
branch-kiezer selecteren en staat haar wijziging meteen live.

Na de uitnodiging: laat haar **eerst één keer een wijziging maken en opslaan**
terwijl je meekijkt. Dan zie je of de dialoog "Create branch and save"
verschijnt. Blijft die uit en krijgt ze in plaats daarvan
`[GraphQL] Repository rule violations found`, dan staat de bescherming als
*ruleset* ingesteld in plaats van als klassieke regel — even veilig, maar een
doodlopende weg zonder knop. `CLAUDE.md` legt uit waarom.

Wijs haar op het eerste blok van `overdracht.md`: een oud, niet-opgeslagen
concept in de browser kan het bestand op schijf overschaduwen, en dan toont het
paneel een lege lijst terwijl de yaml vol staat. `Reset` haalt het terug.

**Na het samenvoegen blijft Keystatic op de werkversie staan.** De branch staat
in de URL van het paneel, dus wie na een Merge gewoon doorklikt, werkt verder op
een branch die achterloopt op `main`. `overdracht.md` zegt haar daarom na elke
publicatie bovenin weer `main` te kiezen.

De repo-instelling *Automatically delete head branches* staat uit. Aanzetten
zou de oude werkversies opruimen en is een instelling in de repo, geen code.
Doe je het, meet dan eenmalig wat Keystatic doet als de branch waar het paneel
op staat verdwenen is.

---

## 5. Het formulier openzetten

De teksten van het formulier en de aanvulling op de privacyverklaring zijn
goedgekeurd. Er staat inhoudelijk niets meer in de weg.

Deze stap heeft drie delen in vaste volgorde.

### 5a. Eerst: Resend nalopen

In het Resend-dashboard, *Domains*:

- `declubvan.nl` staat op **Verified**. Staat het op *Pending* of *Failed*, dan
  weigert Resend elke verzending vanaf `formulier@declubvan.nl` en krijgt elke
  bezoeker de foutmelding.
- **Noteer de regio** die bij het domein staat: daar wordt de mail verwerkt.
  Leg hem vast bij de verwerkersovereenkomst met Resend, zodat de vraag waar
  de gegevens heen gaan een antwoord heeft.

### 5b. Openzetten

Zolang `FORMULIER_ACTIEF` op Production afwezig is, toont de sectie één regel
met het mailadres en weigert `/contact/verzenden` elke inzending zonder te
controleren en zonder iets te versturen. Openzetten gaat zo:

1. In Vercel, *Settings → Environment Variables*: `FORMULIER_ACTIEF` = `ja`,
   alleen op **Production**.
2. **Opnieuw deployen.** Dit is de stap die vergeten wordt. De secties zijn
   vooraf gerenderd en lezen de variabele tijdens de build, dus zonder nieuwe
   build blijft de melding staan terwijl de instelling goed is. Dat leest als
   een storing en is het niet.

**Controleren:**

```bash
curl -s https://declubvan.nl/contact | grep -c "<input"
```

Verwacht: meer dan nul. Staat er `0`, dan is er niet opnieuw gebouwd.

### 5c. Proefinzending, en wat je daarna controleert

**Eén echte inzending per variant**, samen met de redacteur — aanmelden op
`/contact`, inhuren op `/opdrachtgevers`. Of de Resend-sleutel geldig is en het
afzenderdomein geverifieerd, blijkt alleen uit een verzending die echt aankomt.
`scripts/check-resend.mjs` vangt alleen dat de sleutel ontbreekt, niet dat hij
niet werkt.

Daarna drie plekken:

- **Resend → Logs:** beide verzendingen op `delivered`.
- **De ontvangen mail**, de headers ("origineel weergeven"): in
  `Authentication-Results` een `dkim=pass` voor `declubvan.nl`. Alleen een pass
  voor een ander domein is niet genoeg — DMARC kijkt naar het afzenderdomein.
- **De map Ongewenst** van `contact@declubvan.nl`. Laat de redacteur die
  nalopen; een mail die daar belandt, telt voor haar als niet aangekomen.

**Een mislukte verzending staat in de log.** De route schrijft een regel die
met `formulier:` begint naar de Vercel-functielogs: de status, de foutnaam van
Resend en de variant, en nooit een naam, adres of bericht. Filter in Vercel op
`formulier:` als iemand meldt dat het formulier een foutmelding gaf.

---

## 6. Een rem op het formulier: rate limit in de Vercel Firewall

Alleen als het abonnement het toestaat — zie *Vooraf*.

Een regel in de Firewall van het project: **POST op `/contact/verzenden`,
bijvoorbeeld 5 per minuut per IP-adres.** Dat is ruim boven wat een mens doet,
ook iemand die twee keer een fout verbetert, en het houdt een bot tegen die het
formulier volspamt. De honeypot en de tijdsdrempel vangen bots die zich
verraden; deze regel remt de hoeveelheid, ook van wat daar doorheen komt.

**Controleren:**

```bash
for i in 1 2 3 4 5 6 7; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST -d "variant=aanmelden" https://declubvan.nl/contact/verzenden
done
```

Verwacht: eerst `200` — de pagina met wat er nog ontbreekt, want alle verplichte
velden zijn leeg, dus er gaat geen mail uit — en na de limiet `429` of `403`,
afhankelijk van de actie die je in de regel kiest.

---

## 7. De headers nameten na de deploy

`vercel.json` regelt de CSP op de admin met én zonder slotslash, de vaste
beveiligingsheaders, de cache van `/_astro` en de regio van de functie. De poort
(`check-csp`, `check-headers`) rekent ze na, maar alleen de deploy zegt of het
platform ze ook stuurt.

Voor de domeinkoppeling werkt alles hieronder ook op `declubvan100.vercel.app`;
de headers komen uit `vercel.json` en niet van het domein.

**De admin, met en zonder slotslash:**

```bash
curl -sI https://declubvan.nl/keystatic/ | grep -i "^HTTP\|content-security-policy"
curl -sI https://declubvan.nl/keystatic  | grep -i "^HTTP\|content-security-policy"
```

Verwacht: op allebei precies één `Content-Security-Policy`, met
`'unsafe-inline'` in `style-src` en `frame-ancestors 'none'`.

**De cache van `/_astro`:**

```bash
css=$(curl -s https://declubvan.nl/ | grep -o '/_astro/[^"]*\.css' | head -1)
curl -sI "https://declubvan.nl$css" | grep -i "cache-control"
```

Verwacht: `public, max-age=31536000, immutable`.

**De regio van de functie:**

```bash
curl -sI https://declubvan.nl/contact/verzenden | grep -i "^HTTP\|x-vercel-id"
```

Verwacht: `303` en een `x-vercel-id` met `fra1::fra1` — de functie
draait in Frankfurt via `"regions": ["fra1"]` in `vercel.json`. Staat er nog
`iad1`, zet dan de *Function Region* in Vercel onder *Settings → Functions*.

**De vaste headers:**

```bash
curl -sI https://declubvan.nl/          | grep -i "x-content-type-options\|referrer-policy\|permissions-policy\|cross-origin-opener-policy"
curl -sI https://declubvan.nl/keystatic | grep -i "x-content-type-options\|referrer-policy\|permissions-policy\|cross-origin-opener-policy"
```

Verwacht: de eerste drie op allebei, `Cross-Origin-Opener-Policy` alleen op de
site.

---

## 8. De laatste ronde

- **`/secties` is afgeschermd** met een `noindex`-meta én `Disallow` in
  `robots.txt`. Hij blijft bereikbaar voor wie de URL kent; dat is de bedoeling.
- **`npm audit --omit=dev`** meldt drie advisories op Astro die allemaal Astro 7
  vragen. Alle drie gaan over View Transitions, `transition:*` en
  spread-attributen, en dit project gebruikt geen van drieën — spread-attributen
  zijn zelfs bij afspraak verboden. De blootstelling is nu nul. Niet oplossen
  met `npm audit fix --force`: dat tilt de repo naar Astro 7 en
  `@astrojs/vercel` 11.
- **Snelheid opnieuw meten op het echte domein**, met PageSpeed Insights op
  elke pagina. De nulstand, gemeten met headless Chrome op de deploy
  (telefoonprofiel 375 px, vertraagd 4G, 4× tragere CPU): LCP op vijf pagina's
  binnen 1,2–1,5 s; op de home bij een eerste koude lading 2,8 s, boven de grens
  van 2,5 s. CLS tijdens het laden overal onder 0,02. Verschuiving tijdens het
  scrollen is nog niet gemeten.
