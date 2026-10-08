/*
 * Bewaakt het beveiligingsbeleid dat over twee bestanden verdeeld ligt.
 *
 * Astro's security.csp staat uit. Die vlag is manifest-breed en zet één beleid
 * op elke route, ook op de Keystatic-admin, en die heeft inline stijl nodig.
 * Het beleid staat daarom per pad in vercel.json.
 *
 * Dat splitst een veiligheidsregel over twee bestanden die niets van elkaar
 * weten, en dat gaat stilletjes mis. Twee manieren waarop:
 *
 *   1. Iemand zet een inline <style>, <script> of style-attribuut op een
 *      pagina. Onder de meta-CSP van vroeger rekende Astro daar een hash voor
 *      uit; nu staat er een vaste header met alleen 'self' en breekt het —
 *      alleen in productie, want in dev en preview merk je er niets van.
 *   2. Iemand verbreedt de site-regel in vercel.json, of laat hem overlappen
 *      met de keystatic-regels. Vercel past álle matchende header-regels toe,
 *      dus dan krijgt de site er 'unsafe-inline' bij of krijgt de admin twee
 *      headers en handhaaft de browser de doorsnede.
 *
 *   3. De adminpagina draagt twee inline scripts die niemand hier geschreven
 *      heeft. Keystatic rendert zijn paneel met een client:only-eiland, en
 *      daarvoor zet Astro zijn eigen hydratie-runtime inline in de HTML: het
 *      astro:only-haakje (130 bytes) en de astro-island-definitie (4403
 *      bytes). Onder `script-src 'self'` worden die geblokkeerd en blijft
 *      /keystatic een lege pagina — de headers klopten, de pagina werkte
 *      niet. vite.build.assetsInlineLimit helpt er niet tegen: dit zijn geen
 *      gebundelde assets maar Astro's eigen runtime, die altijd inline gaat.
 *      Ze staan daarom als sha256-hash in de script-src van /keystatic, en
 *      die hashes verschuiven zodra Astro zijn runtime aanpast.
 *
 * Dit script controleert alle drie, na de build.
 *
 * De pad-matching gaat via @vercel/routing-utils, Vercels eigen omzetting van
 * `headers` naar de v3-routes. Zelf een regex bouwen zou hier precies de fout
 * introduceren die we willen uitsluiten.
 */

import { createHash } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { pathToFileURL } from 'node:url';

import { getTransformedRoutes } from '@vercel/routing-utils';

const WORTEL = process.cwd();
const STATIC = join(WORTEL, '.vercel', 'output', 'static');
const SERVER_ENTRY = join(
  WORTEL,
  '.vercel',
  'output',
  'functions',
  '_render.func',
  'dist',
  'server',
  'entry.mjs',
);

/** Paden van de site zelf. Die horen het strakke beleid te krijgen. */
const SITE_PADEN = [
  '/',
  '/contact',
  '/de-100',
  '/opdrachtgevers',
  '/opdrachtgevers/',
  '/voorwaarden',
  '/secties',
  '/_astro/iets.css',
  '/keystaticx',
];

/**
 * De admin. Die hoort het ruimere beleid te krijgen.
 *
 * Mét de varianten met een slotslash, en die staan er niet voor de
 * volledigheid. Tot B16 stond de admin in vercel.json als
 * `/keystatic/:path*`, en daar maakt Vercel een regex van die géén slotslash
 * toelaat — terwijl de site-regel alles onder `keystatic/` juist uitsluit.
 * `/keystatic/` viel daardoor tussen de twee in: live een 200 met de hele
 * admin en geen enkele CSP. Deze poort probeerde die variant niet en stond
 * groen.
 */
const ADMIN_PADEN = [
  '/keystatic',
  '/keystatic/',
  '/keystatic/singleton/home',
  '/keystatic/singleton/home/',
  '/api/keystatic',
  '/api/keystatic/',
  '/api/keystatic/github/oauth',
  '/api/keystatic/github/login/',
];

/*
 * Wat het adminbeleid minstens moet zeggen, naast zijn ruimere style-src.
 *
 * Achter de admin zit schrijftoegang tot de repo. Zonder frame-ancestors kan
 * een andere site het paneel onzichtbaar in een frame laden en een ingelogde
 * redacteur laten klikken; zonder base-uri kan een geïnjecteerde <base> de
 * relatieve scriptpaden omleiden. Alle drie vallen niet terug op default-src,
 * dus ze moeten er letterlijk staan.
 *
 * Bewust GEEN default-src en geen img-src: de admin laadt blob:- en
 * data:-beelden, GitHub-avatars en raw.githubusercontent.com, en een te krappe
 * img-src maakt het paneel stil kapot.
 */
const ADMIN_DIRECTIVES = {
  'object-src': "'none'",
  'base-uri': "'self'",
  'frame-ancestors': "'none'",
};

const fouten = [];

/* -------------------------------------------------------------------------
   1. Welke CSP krijgt welk pad?
   ------------------------------------------------------------------------- */

const vercelConfig = JSON.parse(readFileSync(join(WORTEL, 'vercel.json'), 'utf8'));
const { routes, error } = getTransformedRoutes({ headers: vercelConfig.headers });

if (error) {
  console.error(`check-csp: vercel.json levert geen geldige routes op — ${error.message}`);
  process.exit(1);
}

/**
 * Vercel stopt niet bij de eerste treffer maar past elke matchende
 * header-regel toe. Daarom verzamelen we ze allemaal in plaats van er één te
 * pakken: twee treffers is precies de fout die we zoeken.
 */
function cspVoor(pad) {
  const gevonden = [];

  for (const route of routes ?? []) {
    if (!route.src || !route.headers) continue;

    const csp = route.headers['Content-Security-Policy'] ?? route.headers['content-security-policy'];
    if (!csp) continue;

    if (new RegExp(route.src).test(pad)) gevonden.push(csp);
  }

  return gevonden;
}

/*
 * Wat de site-CSP minstens moet zeggen.
 *
 * Deze lijst staat er omdat een CSP niet alleen te ruim kan zijn maar ook te
 * kort. Tot B12 stonden er alleen script-src en style-src, en zónder
 * default-src betekent dat: elke directive die er niet staat, wordt niet
 * gehandhaafd. connect-src, img-src, object-src, base-uri en form-action
 * stonden dus wagenwijd open terwijl het beleid er streng uitzag.
 *
 * Alles op 'self' is hier geen voorzichtige gok maar gemeten. De gebouwde site
 * laadt nul externe bronnen: de lettertypen staan als woff2 in /_astro, de
 * foto's in /beeld, en de enige bundel die fetch gebruikt is die van de admin.
 * De drie externe hosts die in de HTML voorkomen — declubvan.nl in canonical
 * en og-tags, w3.org als svg-namespace, instagram.com als link in de voet —
 * zijn geen van drieën een bron die de pagina laadt.
 *
 * Drie directives verdienen een woord, want ze vallen niet terug op
 * default-src en zouden dus stil ontbreken:
 *
 *   base-uri 'self'        een geïnjecteerde <base> kan elk relatief pad van de
 *                          pagina omleiden naar een andere host
 *   form-action 'self'     bepaalt waar een formulier heen mag posten; het
 *                          aanmeldformulier dat nog gebouwd wordt, post naar
 *                          onze eigen route
 *   frame-ancestors 'none' niemand mag de site in een frame zetten; dit werkt
 *                          alleen in een header en niet in een meta-tag, wat
 *                          meteen een reden te meer is dat het beleid hier in
 *                          vercel.json staat
 *
 * object-src 'none' sluit plug-ins uit. Die gebruiken we niet en willen we ook
 * nooit gebruiken, dus 'none' en niet 'self'.
 */
const SITE_DIRECTIVES = {
  'default-src': "'self'",
  'script-src': "'self'",
  'style-src': "'self'",
  'img-src': "'self'",
  'font-src': "'self'",
  'connect-src': "'self'",
  'object-src': "'none'",
  'base-uri': "'self'",
  'form-action': "'self'",
  'frame-ancestors': "'none'",
};

/** Splitst een beleid in een map van directive naar waarde. */
function ontleed(csp) {
  const uit = new Map();

  for (const deel of csp.split(';')) {
    const kaal = deel.trim();
    if (kaal === '') continue;

    const spatie = kaal.indexOf(' ');
    if (spatie === -1) uit.set(kaal, '');
    else uit.set(kaal.slice(0, spatie), kaal.slice(spatie + 1).trim());
  }

  return uit;
}

for (const pad of SITE_PADEN) {
  const treffers = cspVoor(pad);

  if (treffers.length === 0) {
    fouten.push(`${pad} krijgt helemaal geen CSP-header.`);
    continue;
  }

  if (treffers.length > 1) {
    fouten.push(`${pad} krijgt ${treffers.length} CSP-headers; de browser handhaaft dan de doorsnede.`);
    continue;
  }

  if (treffers[0].includes('unsafe-inline')) {
    fouten.push(`${pad} krijgt 'unsafe-inline'. Dat hoort alleen op de adminroutes te staan.`);
    continue;
  }

  const gezet = ontleed(treffers[0]);

  for (const [directive, verwacht] of Object.entries(SITE_DIRECTIVES)) {
    if (!gezet.has(directive)) {
      fouten.push(
        `${pad} mist '${directive}'. Zonder die regel wordt hij niet gehandhaafd — ` +
          `er is geen vangnet behalve default-src, en base-uri, form-action en ` +
          `frame-ancestors vallen daar niet eens op terug.`,
      );
      continue;
    }

    if (gezet.get(directive) !== verwacht) {
      fouten.push(
        `${pad} zet '${directive}' op "${gezet.get(directive)}" in plaats van "${verwacht}". ` +
          'De site laadt nul externe bronnen; wijkt dat af, pas dan eerst deze lijst aan.',
      );
    }
  }
}

for (const pad of ADMIN_PADEN) {
  const treffers = cspVoor(pad);

  if (treffers.length === 0) {
    fouten.push(`${pad} krijgt helemaal geen CSP-header.`);
  } else if (treffers.length > 1) {
    fouten.push(`${pad} krijgt ${treffers.length} CSP-headers; de admin heeft er precies één nodig.`);
  } else if (!treffers[0].includes("style-src 'self' 'unsafe-inline'")) {
    fouten.push(
      `${pad} krijgt geen ruimere style-src. De admin stijlt met Emotion en blijft anders kaal.`,
    );
  } else {
    const gezet = ontleed(treffers[0]);
    for (const [directive, verwacht] of Object.entries(ADMIN_DIRECTIVES)) {
      if (gezet.get(directive) !== verwacht) {
        fouten.push(
          `${pad} zet '${directive}' op "${gezet.get(directive) ?? '(niets)'}" in plaats van "${verwacht}". ` +
            'Achter de admin zit schrijftoegang tot de repo.',
        );
      }
    }
  }
}

/* -------------------------------------------------------------------------
   2. Blijft de gebouwde site binnen 'self'?
   ------------------------------------------------------------------------- */

async function htmlBestanden(map) {
  const uit = [];

  for (const item of await readdir(map, { withFileTypes: true })) {
    const pad = join(map, item.name);
    if (item.isDirectory()) uit.push(...(await htmlBestanden(pad)));
    else if (item.name.endsWith('.html')) uit.push(pad);
  }

  return uit;
}

if (!existsSync(STATIC)) {
  console.error('check-csp: .vercel/output/static ontbreekt. Draai eerst de build.');
  process.exit(1);
}

for (const bestand of await htmlBestanden(STATIC)) {
  const html = readFileSync(bestand, 'utf8');
  const naam = relative(WORTEL, bestand);

  // Astro's meta hoort weg te zijn; anders staan er twee beleiden naast elkaar.
  if (/http-equiv=["']?content-security-policy/i.test(html)) {
    fouten.push(`${naam} bevat nog een CSP-meta. security.csp hoort uit te staan.`);
  }

  /*
   * Alles hieronder zou onder 'self' geblokkeerd worden.
   *
   * Eén uitzondering, en die is smal: een datablok met type
   * application/ld+json, de gestructureerde gegevens op de home. De browser
   * voert dat niet uit, dus de CSP raakt het niet. Maar alleen dat type,
   * letterlijk, en alleen als de inhoud geldige JSON is — elk ander type, ook
   * een leeg type of "module", blijft een inline script en dus een fout. Een
   * kapotte JSON-LD is ook een fout: die doet niets en zegt dat hij werkt.
   */
  for (const [, attributen, inhoud] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\ssrc=/i.test(attributen) || inhoud.trim() === '') continue;

    const type = /\stype=(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attributen);
    const typeWaarde = (type?.[1] ?? type?.[2] ?? type?.[3] ?? '').trim().toLowerCase();

    if (typeWaarde !== 'application/ld+json') {
      fouten.push(`${naam} bevat een inline script. Dat wordt geblokkeerd; zet het in een bestand.`);
      continue;
    }

    try {
      JSON.parse(inhoud);
    } catch (fout) {
      fouten.push(`${naam} bevat een application/ld+json-blok dat geen geldige JSON is: ${fout.message}`);
    }
  }

  if (/<style[^>]*>[\s\S]*?\S[\s\S]*?<\/style>/i.test(html)) {
    fouten.push(`${naam} bevat een inline stijlblok. Dat wordt geblokkeerd.`);
  }

  if (/\sstyle=["'][^"']*\S/i.test(html)) {
    fouten.push(`${naam} bevat een style-attribuut. Dat wordt geblokkeerd.`);
  }
}

/* -------------------------------------------------------------------------
   3. Staan de hashes van de admin-eilanden in het beleid?
   ------------------------------------------------------------------------- */

/*
 * De adminroutes worden op verzoek gerenderd, dus hun HTML staat niet in
 * .vercel/output/static — daar valt niets te lezen. We renderen ze daarom uit
 * de gebouwde serverbundel: dezelfde functie die Vercel straks draait, met een
 * Request erin en een Response eruit. Geen netwerk, geen dev-server, en dus
 * precies de HTML die de bezoeker krijgt.
 *
 * Nagemeten toen deze controle erbij kwam: de twee hashes die hieruit komen
 * zijn letterlijk dezelfde die de browser op de preview-deploy meldde.
 */

const INLINE_SCRIPT = /<script([^>]*)>([\s\S]*?)<\/script>/g;

function inlineScripts(html) {
  return [...html.matchAll(INLINE_SCRIPT)]
    .filter((m) => !/\bsrc=/.test(m[1]))
    .map((m) => m[2])
    .filter((body) => body.trim() !== '');
}

function sha256(body) {
  return `sha256-${createHash('sha256').update(body, 'utf8').digest('base64')}`;
}

if (!existsSync(SERVER_ENTRY)) {
  fouten.push(
    'de serverbundel ontbreekt (.vercel/output/functions/_render.func). Draai eerst de build.',
  );
} else {
  const { default: handler } = await import(pathToFileURL(SERVER_ENTRY).href);
  const gevondenHashes = new Set();

  for (const pad of ADMIN_PADEN) {
    let html;

    try {
      const res = await handler.fetch(new Request(`https://voorbeeld.test${pad}`));
      html = await res.text();
    } catch (fout) {
      fouten.push(`${pad} kon niet gerenderd worden: ${fout.message}`);
      continue;
    }

    const scripts = inlineScripts(html);
    if (scripts.length === 0) continue;

    const treffers = cspVoor(pad);
    if (treffers.length !== 1) continue; // al gemeld hierboven

    for (const body of scripts) {
      const hash = sha256(body);
      gevondenHashes.add(hash);

      if (!treffers[0].includes(`'${hash}'`)) {
        fouten.push(
          `${pad} draagt een inline script van ${body.length} bytes waarvan de hash niet in ` +
            `vercel.json staat. Voeg '${hash}' toe aan de script-src van dit pad, anders blijft ` +
            'de pagina leeg.',
        );
      }
    }
  }

  /*
   * En de andere kant op. Een hash die nergens meer bij hoort is geen gat,
   * maar wel een teken dat de HTML veranderd is zonder dat iemand hier keek —
   * en dan staat de hash die er wél moet zijn er waarschijnlijk niet.
   */
  for (const pad of ADMIN_PADEN) {
    const treffers = cspVoor(pad);
    if (treffers.length !== 1) continue;

    for (const match of treffers[0].matchAll(/'(sha256-[A-Za-z0-9+/=]+)'/g)) {
      if (!gevondenHashes.has(match[1])) {
        fouten.push(
          `${pad} heeft '${match[1]}' in zijn script-src staan, maar geen enkel inline script ` +
            'in de admin levert die hash op. Verouderd, of de HTML is veranderd.',
        );
      }
    }
  }
}

/* ------------------------------------------------------------------------- */

if (fouten.length > 0) {
  console.error('check-csp: het beleid klopt niet.\n');
  for (const fout of fouten) console.error(`  - ${fout}`);
  console.error('');
  process.exit(1);
}

console.log(
  "check-csp: site strak op 'self', admin ruimer, geen pad met twee headers, geen inline script of " +
    'stijl, en de hashes van de admin-eilanden staan in het beleid.',
);
