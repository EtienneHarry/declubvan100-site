#!/usr/bin/env node
/*
 * Bewaakt dat de sitemap en de `noindex`-meta hetzelfde zeggen.
 *
 * Dit is precies zo'n stap die iets stils vangt. Een pagina die erbij komt en
 * per ongeluk in GEEN_SITEMAP belandt, staat nergens in de sitemap en niemand
 * ziet dat: de pagina werkt, de build slaagt, en pas maanden later blijkt dat
 * Google hem niet kent. Andersom is erger: een pagina die in de sitemap staat
 * én zichzelf op noindex zet, geeft een zoekmachine twee tegengestelde
 * signalen.
 *
 * Vandaar de drie regels hieronder, en ze gelden allebei op:
 *
 *   1. elke gebouwde pagina zonder noindex staat in de sitemap
 *   2. elke gebouwde pagina met noindex staat er niet in
 *   3. de regel `Sitemap:` in robots.txt wijst naar een bestand dat bestaat,
 *      op hetzelfde domein als de URL's in de sitemap zelf
 */

import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, sep } from 'node:path';

const UITVOER = join('.vercel', 'output', 'static');
const SITEMAP = join(UITVOER, 'sitemap-0.xml');
const INDEX = join(UITVOER, 'sitemap-index.xml');
const ROBOTS = join(UITVOER, 'robots.txt');

if (!existsSync(UITVOER)) {
  console.error(`check-sitemap: ${UITVOER} bestaat niet. Draai eerst de build.`);
  process.exit(1);
}

for (const bestand of [SITEMAP, INDEX, ROBOTS]) {
  if (!existsSync(bestand)) {
    console.error(`check-sitemap: ${bestand} ontbreekt in de gebouwde uitvoer.`);
    process.exit(1);
  }
}

/** Elke index.html onder de uitvoer, als pad zoals een bezoeker het typt. */
function verzamelPaginas(map, basis = '') {
  const gevonden = [];
  for (const item of readdirSync(map, { withFileTypes: true })) {
    if (item.isDirectory()) {
      gevonden.push(...verzamelPaginas(join(map, item.name), `${basis}/${item.name}`));
    } else if (item.name === 'index.html') {
      gevonden.push({ pad: basis === '' ? '/' : basis, bestand: join(map, item.name) });
    }
  }
  return gevonden;
}

/**
 * Een pad zonder sluitende schuine streep, zodat `/contact/` en `/contact`
 * hetzelfde zijn. De wortel blijft `/`.
 */
function normaliseer(pad) {
  const kaal = pad.replace(/\/+$/, '');
  return kaal === '' ? '/' : kaal;
}

const paginas = verzamelPaginas(UITVOER).map((p) => ({
  ...p,
  pad: normaliseer(p.pad.split(sep).join('/')),
}));

if (paginas.length === 0) {
  console.error('check-sitemap: geen enkele index.html gevonden. Dat kan niet kloppen.');
  process.exit(1);
}

const sitemapBron = readFileSync(SITEMAP, 'utf8');
const urls = [...sitemapBron.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());

if (urls.length === 0) {
  console.error('check-sitemap: de sitemap bevat geen enkele <loc>. Dat is nooit de bedoeling.');
  process.exit(1);
}

const herkomsten = new Set(urls.map((u) => new URL(u).origin));
if (herkomsten.size !== 1) {
  console.error(`check-sitemap: de sitemap mengt domeinen: ${[...herkomsten].join(', ')}`);
  process.exit(1);
}
const herkomst = [...herkomsten][0];

const inSitemap = new Set(urls.map((u) => normaliseer(new URL(u).pathname)));

// noindex staat als meta in de HTML. We lezen de gebouwde uitvoer en niet de
// bron, want een prop die per pagina gezet wordt is daar niet te zien.
const NOINDEX = /<meta\s+name="robots"\s+content="[^"]*noindex/i;

const fouten = [];

for (const { pad, bestand } of paginas) {
  const heeftNoindex = NOINDEX.test(readFileSync(bestand, 'utf8'));
  const staatErin = inSitemap.has(pad);

  if (heeftNoindex && staatErin) {
    fouten.push(`${pad} zet noindex en staat tóch in de sitemap — twee tegengestelde signalen.`);
  }
  if (!heeftNoindex && !staatErin) {
    fouten.push(
      `${pad} staat niet in de sitemap en zet ook geen noindex. Zet hem in GEEN_SITEMAP in astro.config.mjs mét een noindex, of haal hem daar juist uit.`,
    );
  }
}

// Een URL in de sitemap die nergens een pagina heeft, is een dode verwijzing.
const padenOpSchijf = new Set(paginas.map((p) => p.pad));
for (const pad of inSitemap) {
  if (!padenOpSchijf.has(pad)) {
    fouten.push(`${pad} staat in de sitemap maar er is geen gebouwde pagina voor.`);
  }
}

// De regel in robots.txt moet naar een bestand wijzen dat er echt is.
const robots = readFileSync(ROBOTS, 'utf8');
const regel = robots.split('\n').find((r) => r.trim().toLowerCase().startsWith('sitemap:'));

if (!regel) {
  fouten.push('robots.txt heeft geen regel `Sitemap:`, dus een crawler moet de sitemap raden.');
} else {
  const opgegeven = regel.slice(regel.indexOf(':') + 1).trim();
  let ontleed;
  try {
    ontleed = new URL(opgegeven);
  } catch {
    fouten.push(`robots.txt verwijst naar '${opgegeven}', en dat is geen absolute URL.`);
  }
  if (ontleed) {
    if (ontleed.origin !== herkomst) {
      fouten.push(
        `robots.txt verwijst naar ${ontleed.origin} terwijl de sitemap zelf ${herkomst} gebruikt.`,
      );
    }
    const doel = join(UITVOER, ...ontleed.pathname.split('/').filter(Boolean));
    if (!existsSync(doel)) {
      fouten.push(`robots.txt verwijst naar ${ontleed.pathname}, maar dat bestand staat niet in de uitvoer.`);
    }
  }
}

if (fouten.length > 0) {
  for (const fout of fouten) console.error(`  ${fout}`);
  console.error(`\ncheck-sitemap: ${fouten.length} probleem(en) tussen de sitemap en de noindex-meta.`);
  process.exit(1);
}

console.log(
  `check-sitemap: ${urls.length} URL's op ${herkomst}, ${paginas.length - urls.length} pagina('s) bewust erbuiten met noindex, en robots.txt wijst naar een bestand dat bestaat.`,
);
