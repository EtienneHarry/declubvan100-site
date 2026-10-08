/*
 * Bewaakt dat elke interne link in de gebouwde site ergens heen gaat.
 *
 * Elke href in het menu, de voettekst, een knop of een kaart komt uit het CMS,
 * en de redacteur typt hem zelf. Een tikfout — "/contacten", "/opdrachtgever"
 * — leverde een knop op die naar een 404 leidde, en geen enkele poort keek er
 * naar: check-beeldpaden kijkt naar beelden, check-sitemap naar de sitemap.
 * Het CMS weigert sinds B16 een link die niet met /, https://, mailto: of tel:
 * begint; dit is de tweede lijn, die ook ziet of de pagina bestaat.
 *
 * Wat er gecontroleerd wordt:
 *
 *   - elke <a href> die met één / begint, zonder query en anker, moet een
 *     bestand of een pagina in .vercel/output/static hebben — met of zonder
 *     slotslash, want Vercel serveert allebei;
 *   - een mailto: moet een adres met een @ hebben, een tel: alleen cijfers,
 *     spaties en een +.
 *
 * Twee routes draaien op verzoek en staan dus niet in de statische uitvoer:
 * de verzendroute en de admin. Een link daarheen telt als bestaand.
 *
 * Externe links (https://) worden niet opgehaald: een poort die van het
 * netwerk afhangt, faalt op het moment dat een andere site even plat ligt.
 */

import { readFileSync, existsSync, statSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const WORTEL = process.cwd();
const STATIC = join(WORTEL, '.vercel', 'output', 'static');

const OP_VERZOEK = ['/contact/verzenden', '/keystatic', '/api/keystatic'];

if (!existsSync(STATIC)) {
  console.error('check-links: .vercel/output/static ontbreekt. Draai eerst de build.');
  process.exit(1);
}

async function htmlBestanden(map) {
  const uit = [];
  for (const item of await readdir(map, { withFileTypes: true })) {
    const pad = join(map, item.name);
    if (item.isDirectory()) uit.push(...(await htmlBestanden(pad)));
    else if (item.name.endsWith('.html')) uit.push(pad);
  }
  return uit;
}

function isBestand(pad) {
  return existsSync(pad) && statSync(pad).isFile();
}

/** Bestaat er voor dit pad iets in de statische uitvoer? */
function bestaat(pad) {
  const kaal = pad.replace(/\/+$/, '');
  if (kaal === '') return isBestand(join(STATIC, 'index.html'));
  if (OP_VERZOEK.some((route) => kaal === route || kaal.startsWith(`${route}/`))) return true;

  const delen = kaal.split('/').filter(Boolean);
  return (
    isBestand(join(STATIC, ...delen)) ||
    isBestand(join(STATIC, ...delen, 'index.html')) ||
    isBestand(join(STATIC, ...delen.slice(0, -1), `${delen.at(-1)}.html`))
  );
}

const HREF = /<a\b[^>]*?\shref=(?:"([^"]*)"|'([^']*)')/gi;
const fouten = [];
let aantal = 0;

for (const bestand of await htmlBestanden(STATIC)) {
  const html = readFileSync(bestand, 'utf8');
  const naam = relative(WORTEL, bestand);

  for (const m of html.matchAll(HREF)) {
    const href = (m[1] ?? m[2] ?? '').replace(/&amp;/g, '&').trim();
    aantal++;

    if (href.startsWith('mailto:')) {
      if (!/^mailto:[^@\s]+@[^@\s]+\.[^@\s]+/.test(href)) fouten.push(`${naam}: "${href}" is geen geldig mailadres.`);
      continue;
    }

    if (href.startsWith('tel:')) {
      if (!/^tel:\+?[\d\s]+$/.test(href)) fouten.push(`${naam}: "${href}" is geen geldig telefoonnummer.`);
      continue;
    }

    // Alleen interne paden; // is een adres op een ander domein.
    if (!href.startsWith('/') || href.startsWith('//')) continue;

    const pad = decodeURI(href.split('#')[0].split('?')[0]);
    if (pad === '') continue;

    if (!bestaat(pad)) {
      fouten.push(`${naam}: de link "${href}" gaat naar een pagina die niet bestaat.`);
    }
  }
}

if (fouten.length > 0) {
  console.error('check-links: er staan links in de site die nergens heen gaan.\n');
  for (const fout of [...new Set(fouten)]) console.error(`  - ${fout}`);
  console.error('');
  process.exit(1);
}

console.log(`check-links: ${aantal} links nagelopen, elke interne link heeft een pagina, en elk mail- en telefoonadres klopt.`);
