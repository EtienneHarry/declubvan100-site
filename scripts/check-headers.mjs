/*
 * Bewaakt de headers uit vercel.json die geen CSP zijn. De CSP zelf staat in
 * check-csp; dit is de rest, en dezelfde valkuil.
 *
 * VERCEL PAST ÁLLE MATCHENDE REGELS TOE. Een header die door twee regels op
 * hetzelfde pad gezet wordt, komt er twee keer op, en wat de browser dan doet
 * verschilt per header. check-csp telde dat alleen voor de CSP. Hier wordt het
 * voor elke sleutel geteld, hoofdletterongevoelig, op elk pad dat ertoe doet.
 *
 * Wat er verder vast moet liggen:
 *
 *   overal              nosniff, een Referrer-Policy en een Permissions-Policy.
 *                       Stonden er tot B16 niet, op geen enkel pad.
 *   op de site          Cross-Origin-Opener-Policy: same-origin. Bewust níet op
 *                       de admin: de inlog met GitHub is daar niet mee gemeten,
 *                       en een kapotte inlog kost meer dan deze header oplevert.
 *   /_astro/*           een jaar immutable. De adapter zet die regel wel in
 *                       .vercel/output/config.json, maar ná `handle:
 *                       filesystem`, en daar komt een bestaand bestand nooit
 *                       langs. Live gaf elk bestand max-age=0 (B16, gemeten).
 *   /beeld/*            nooit immutable: Keystatic schrijft een vervangen foto
 *                       naar hetzelfde pad.
 *   HTML en de admin    geen Cache-Control uit vercel.json. Een immutable op
 *                       `/(.*)` zou elke tekstwijziging een jaar verstoppen.
 *
 * En de regio van de functie: één regio, en in de EU. Zonder instelling
 * draaide hij in iad1 (Washington), met elke inzending en elke admin-aanroep
 * een keer over de oceaan.
 *
 * De pad-matching gaat via @vercel/routing-utils, net als in check-csp.
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { getTransformedRoutes } from '@vercel/routing-utils';

const WORTEL = process.cwd();

const SITE_PADEN = ['/', '/contact', '/contact/', '/opdrachtgevers', '/opdrachtgevers/', '/contact/verzenden', '/bestaat-niet'];
const ADMIN_PADEN = ['/keystatic', '/keystatic/', '/keystatic/singleton/home/', '/api/keystatic', '/api/keystatic/github/login/'];
const ASTRO_PAD = '/_astro/iets.css';
const BEELD_PAD = '/beeld/home/iets.jpg';
const ALLE_PADEN = [...SITE_PADEN, ...ADMIN_PADEN, ASTRO_PAD, BEELD_PAD];

const OVERAL = {
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'strict-origin-when-cross-origin',
  'permissions-policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
};

const ALLEEN_SITE = {
  'cross-origin-opener-policy': 'same-origin',
};

const IMMUTABLE = 'public, max-age=31536000, immutable';
const EU_REGIOS = ['fra1', 'cdg1', 'arn1', 'dub1'];

const fouten = [];

const vercelConfig = JSON.parse(readFileSync(join(WORTEL, 'vercel.json'), 'utf8'));
const { routes, error } = getTransformedRoutes({ headers: vercelConfig.headers });

if (error) {
  console.error(`check-headers: vercel.json levert geen geldige routes op — ${error.message}`);
  process.exit(1);
}

/** Per headersleutel (kleine letters) alle waardes die een pad krijgt. */
function headersVoor(pad) {
  const uit = new Map();
  for (const route of routes ?? []) {
    if (!route.src || !route.headers) continue;
    if (!new RegExp(route.src).test(pad)) continue;
    for (const [sleutel, waarde] of Object.entries(route.headers)) {
      const klein = sleutel.toLowerCase();
      uit.set(klein, [...(uit.get(klein) ?? []), waarde]);
    }
  }
  return uit;
}

for (const pad of ALLE_PADEN) {
  const headers = headersVoor(pad);

  for (const [sleutel, waardes] of headers) {
    if (waardes.length > 1) {
      fouten.push(`${pad} krijgt ${sleutel} van ${waardes.length} regels tegelijk. Vercel past ze allemaal toe.`);
    }
  }

  for (const [sleutel, verwacht] of Object.entries(OVERAL)) {
    const gezet = headers.get(sleutel);
    if (!gezet) fouten.push(`${pad} krijgt geen ${sleutel}.`);
    else if (gezet[0] !== verwacht) fouten.push(`${pad} zet ${sleutel} op "${gezet[0]}" in plaats van "${verwacht}".`);
  }
}

for (const pad of SITE_PADEN) {
  const headers = headersVoor(pad);
  for (const [sleutel, verwacht] of Object.entries(ALLEEN_SITE)) {
    const gezet = headers.get(sleutel);
    if (!gezet) fouten.push(`${pad} krijgt geen ${sleutel}.`);
    else if (gezet[0] !== verwacht) fouten.push(`${pad} zet ${sleutel} op "${gezet[0]}" in plaats van "${verwacht}".`);
  }
  if (headers.has('cache-control')) {
    fouten.push(`${pad} krijgt een Cache-Control uit vercel.json ("${headers.get('cache-control')[0]}"). HTML hoort bij Vercels standaard te blijven.`);
  }
}

for (const pad of ADMIN_PADEN) {
  const headers = headersVoor(pad);
  for (const sleutel of Object.keys(ALLEEN_SITE)) {
    if (headers.has(sleutel)) {
      fouten.push(`${pad} krijgt ${sleutel}. Op de admin is dat niet met de GitHub-inlog gemeten; zet hem alleen op de site-regel.`);
    }
  }
  if (headers.has('cache-control')) {
    fouten.push(`${pad} krijgt een Cache-Control uit vercel.json. De admin hoort nooit gecachet te worden.`);
  }
}

const astro = headersVoor(ASTRO_PAD).get('cache-control');
if (!astro || astro[0] !== IMMUTABLE) {
  fouten.push(`${ASTRO_PAD} krijgt "${astro?.[0] ?? '(geen Cache-Control)'}" in plaats van "${IMMUTABLE}". De bestanden hebben een hash in hun naam en horen een jaar in de cache.`);
}

const beeld = headersVoor(BEELD_PAD).get('cache-control');
if (!beeld) {
  fouten.push(`${BEELD_PAD} krijgt geen Cache-Control uit vercel.json.`);
} else if (/immutable/i.test(beeld[0])) {
  fouten.push(`${BEELD_PAD} krijgt immutable. Keystatic schrijft een vervangen foto naar hetzelfde pad; die zou een jaar oud blijven.`);
}

const regios = vercelConfig.regions;
if (!Array.isArray(regios) || regios.length !== 1 || !EU_REGIOS.includes(regios[0])) {
  fouten.push(`vercel.json zet regions op ${JSON.stringify(regios)}; verwacht één EU-regio (${EU_REGIOS.join(', ')}).`);
}

if (fouten.length > 0) {
  console.error('check-headers: de headers kloppen niet.\n');
  for (const fout of fouten) console.error(`  - ${fout}`);
  console.error('');
  process.exit(1);
}

console.log(
  `check-headers: ${ALLE_PADEN.length} paden, elke header hooguit één keer, nosniff/referrer/permissions overal, ` +
    `COOP alleen op de site, /_astro immutable, /beeld niet, en de functie in ${regios[0]}.`,
);
