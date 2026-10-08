# declubvan100-site

De site van De Club van 100: horeca- en eventprofessionals in en rond
Groningen. Astro 6 met React 19, Tailwind 4 en TypeScript in strict-modus. De
inhoud staat als yaml in `src/content/` en wordt beheerd met Keystatic. Deployt
naar Vercel; alles wordt vooraf gerenderd, behalve de verzendroute van het
formulier en de admin.

## Waar je verder leest

| Document | Voor wie | Waarover |
|---|---|---|
| `CLAUDE.md` | de bouwer | hoe de site in elkaar zit, de vaste regels en de poort |
| `overdracht.md` | Lune, de redacteur | de inhoud beheren, in gewone taal |
| `livegang.md` | de bouwer | de stappen naar het echte domein, met per stap een controle |
| `design-system.md` | de bouwer | hoe het design system van de klant hier is uitgewerkt |

## Beginnen

Node 24. Dat staat in `.nvmrc` en in `engines` in `package.json`; Vercel leest
alleen die laatste.

```bash
npm ci
npm run dev
```

`npm ci` en niet `npm install`: dan krijg je precies de versies uit de
lockfile, net als de CI-workflow. Keystatic staat met opzet vast op 0.6.4;
waarom staat in `CLAUDE.md`.

De admin staat lokaal op `/keystatic`, in local mode: wat je opslaat gaat
rechtstreeks naar de yaml op schijf. Op Vercel draait hij in GitHub-modus. De
variabelen daarvoor, en die van het formulier, staan zonder waardes in
`.env.example`; lokaal hoeft er niets in.

## Commando's

| Commando | Doet |
|---|---|
| `npm run dev` | Dev-server, met de admin op `/keystatic` |
| `npm run build` | `check-opslag` → `check-resend` → `maak-beeldvarianten` → `astro build`. Dit is wat Vercel uitvoert |
| `npm run preview` | De build lokaal bekijken. Niet te verwarren met een preview-deploy |
| `npm run lint` | oxlint |
| `npm run check` | De hele poort, zie hieronder |

`npm run check` moet groen zijn voor je commit, en draait ook in GitHub Actions
bij elke push en pull request. Hij stopt bij de eerste stap die faalt:

```
lint  →  check-tokens  →  check-yaml-commentaar  →  astro check
      →  build  →  check-csp  →  check-headers  →  check-nesting
      →  check-koppen  →  check-onthul  →  check-beeldpaden  →  check-links
      →  check-meegebundeld  →  check-klassen  →  check-sitemap
```

De stappen na de build lezen de gebouwde uitvoer, op `check-headers` na: die
leest alleen `vercel.json`. Wat elke stap bewaakt, staat in `CLAUDE.md` onder
*Controles*.

## De headers zie je lokaal niet

De Content-Security-Policy en de andere headers staan per pad in `vercel.json`,
niet in de HTML: de site krijgt `script-src 'self'; style-src 'self'`, de admin
een eigen beleid. `security.csp` in `astro.config.mjs` staat met opzet uit.

Die headers komen van Vercel. In `npm run dev` en `npm run preview` zijn ze er
niet, dus een inline stijl werkt daar gewoon en loopt pas op de deploy stuk.
`check-csp` en `check-headers` zijn daarvoor de vervanging: ze rekenen
`vercel.json` en de gebouwde uitvoer na. Of het platform de headers ook echt
stuurt, meet je na een deploy met `curl`; zie stap 7 van `livegang.md`.

## Waar het staat

| Wat | Waar |
|---|---|
| Repository | `EtienneHarry/declubvan100-site` op GitHub, openbaar |
| Hosting | Vercel, project `declubvan100`, over te dragen aan het Vercel-team DNAsign |
| Adres | https://declubvan.nl, nu nog https://declubvan100.vercel.app |

De repository is openbaar. Er staan geen geheimen in: alle sleutels staan als
omgevingsvariabele in Vercel, en `.env.example` noemt alleen de namen. Houd dat
zo. De volledige tabel met accounts staat in `overdracht.md`.

Gebouwd door Etienne Kick, Kick&Work, in opdracht van De Club van 100.
