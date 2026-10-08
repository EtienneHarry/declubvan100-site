#!/usr/bin/env node
// Bewaakt de tokenregel: in src/ horen geen rauwe hexkleuren, geen losse
// px-waarden en geen letterlijke lettertypenamen. Kleur, maat en font komen uit
// het design system, via var(--token) of een tokenklasse. Enige uitzondering is
// het bestand waar de tokens zelf gedefinieerd staan.

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';

const SRC = 'src';
const UITZONDERING = 'src/styles/tokens.css';
const EXTENSIES = new Set(['.astro', '.tsx', '.ts', '.css']);

// #abc, #aabbcc en #aabbccdd. Andere lengtes zijn geen kleurcode.
// De lookbehind houdt HTML-entities als &#123; erbuiten.
const HEX = /(?<!&)#([0-9a-fA-F]{3,8})(?![0-9a-fA-F])/g;
const GELDIGE_HEX_LENGTES = new Set([3, 6, 8]);

// 12px, 1.5px. Niet 0px, en niet middenin een woord.
const PX = /(?<![\w.])(\d+(?:\.\d+)?)px(?![\w-])/g;

/*
 * Font-family. Drie plekken waar een letterlijke familienaam kan binnenkomen:
 *
 *   1. een font-family-declaratie in CSS of in een stijlblok
 *   2. een Tailwind-utility met een vrije waarde: font-[Arial]
 *   3. een van Tailwinds ingebouwde familieklassen: font-sans/serif/mono
 *
 * Let op dat `font-` in Tailwind dubbel bezet is: font-semibold en font-[600]
 * zijn gewichten, geen families. Daarom kijken we bij 2 alleen naar waardes die
 * geen var() en geen getal zijn, en bij 3 naar precies drie namen.
 */
const FONT_DECLARATIE = /font-family\s*:\s*([^;{}"]+)/g;
const FONT_VRIJE_WAARDE = /\bfont-\[([^\]]+)\]/g;
const FONT_FAMILIEKLASSE = /\bfont-(sans|serif|mono)\b/g;

// Alleen var(--font-…) telt als tokenverwijzing.
const FONT_VAR = /^\s*var\(\s*--font-[a-z0-9-]+\s*\)\s*$/i;
// CSS-brede sleutelwoorden bakken geen familie in.
const CSS_SLEUTELWOORDEN = new Set(['inherit', 'initial', 'unset', 'revert', 'revert-layer']);

/**
 * Leest welke fontfamilies het design system kent, uit de tokenlaag zelf.
 * `--font-sans` levert de klasse `font-sans`. Zo blijft deze controle kloppen
 * zodra er een fonttoken bij komt of verdwijnt.
 *
 * De koppeling staat bewust niet in src/lib/tokens.ts: dat bestand koppelt
 * achtergrond, ruimte, breedte en leesbreedte, en heeft geen fontgroep.
 */
function leesFontFamilies() {
  if (!existsSync(UITZONDERING)) return new Set();
  const bron = readFileSync(UITZONDERING, 'utf8');
  return new Set([...bron.matchAll(/--font-([a-z0-9-]+)\s*:/gi)].map((m) => m[1].toLowerCase()));
}

const TOEGESTANE_FAMILIES = leesFontFamilies();

/**
 * Vervangt commentaar door spaties, zodat regelnummers en kolommen kloppen.
 *
 * `//` telt niet als commentaar in CSS, en ook niet direct na een dubbele punt
 * — anders zou de `//` in `https://…` de rest van de regel wegvagen.
 */
function maskeerCommentaar(bron, { regelCommentaar, htmlCommentaar }) {
  const uit = [];
  let inBlok = false;
  let inHtml = false;

  for (const regel of bron.split('\n')) {
    let gemaskeerd = '';
    let i = 0;

    while (i < regel.length) {
      if (inBlok) {
        const eind = regel.indexOf('*/', i);
        if (eind === -1) {
          gemaskeerd += ' '.repeat(regel.length - i);
          i = regel.length;
        } else {
          gemaskeerd += ' '.repeat(eind + 2 - i);
          i = eind + 2;
          inBlok = false;
        }
        continue;
      }

      if (inHtml) {
        const eind = regel.indexOf('-->', i);
        if (eind === -1) {
          gemaskeerd += ' '.repeat(regel.length - i);
          i = regel.length;
        } else {
          gemaskeerd += ' '.repeat(eind + 3 - i);
          i = eind + 3;
          inHtml = false;
        }
        continue;
      }

      const blok = regel.indexOf('/*', i);
      const html = htmlCommentaar ? regel.indexOf('<!--', i) : -1;

      let lijn = -1;
      if (regelCommentaar) {
        let zoek = i;
        for (;;) {
          const p = regel.indexOf('//', zoek);
          if (p === -1) break;
          if (p > 0 && regel[p - 1] === ':') {
            zoek = p + 2;
            continue;
          }
          lijn = p;
          break;
        }
      }

      const kandidaten = [blok, html, lijn].filter((p) => p !== -1);
      if (kandidaten.length === 0) {
        gemaskeerd += regel.slice(i);
        break;
      }

      const eerste = Math.min(...kandidaten);
      gemaskeerd += regel.slice(i, eerste);

      if (eerste === lijn) {
        gemaskeerd += ' '.repeat(regel.length - eerste);
        break;
      }

      i = eerste;
      if (eerste === blok) inBlok = true;
      else inHtml = true;
    }

    uit.push(gemaskeerd);
  }

  return uit;
}

function verzamelBestanden(map) {
  return readdirSync(map, { recursive: true, withFileTypes: true })
    .filter((item) => item.isFile() && EXTENSIES.has(extname(item.name)))
    .map((item) => join(item.parentPath ?? item.path, item.name).split('\\').join('/'));
}

function controleer(pad) {
  const ext = extname(pad);
  const regels = maskeerCommentaar(readFileSync(pad, 'utf8'), {
    regelCommentaar: ext !== '.css',
    htmlCommentaar: ext === '.astro',
  });

  const gevonden = [];

  regels.forEach((regel, index) => {
    for (const match of regel.matchAll(HEX)) {
      if (!GELDIGE_HEX_LENGTES.has(match[1].length)) continue;
      gevonden.push({ pad, regel: index + 1, kolom: match.index + 1, waarde: match[0] });
    }

    for (const match of regel.matchAll(PX)) {
      if (Number.parseFloat(match[1]) === 0) continue;
      gevonden.push({ pad, regel: index + 1, kolom: match.index + 1, waarde: match[0] });
    }

    for (const match of regel.matchAll(FONT_DECLARATIE)) {
      const waarde = match[1].trim();
      if (FONT_VAR.test(waarde)) continue;
      if (CSS_SLEUTELWOORDEN.has(waarde.toLowerCase())) continue;
      gevonden.push({
        pad,
        regel: index + 1,
        kolom: match.index + 1,
        waarde: `font-family: ${waarde}`,
        reden: 'alleen var(--font-…)',
      });
    }

    for (const match of regel.matchAll(FONT_VRIJE_WAARDE)) {
      const inhoud = match[1].trim();
      if (inhoud.startsWith('var(')) continue;
      // font-[600] en font-[1.5] zijn gewichten, geen families.
      if (/^[\d.]+$/.test(inhoud)) continue;
      gevonden.push({
        pad,
        regel: index + 1,
        kolom: match.index + 1,
        waarde: match[0],
        reden: 'alleen var(--font-…)',
      });
    }

    for (const match of regel.matchAll(FONT_FAMILIEKLASSE)) {
      if (TOEGESTANE_FAMILIES.has(match[1])) continue;
      gevonden.push({
        pad,
        regel: index + 1,
        kolom: match.index + 1,
        waarde: match[0],
        reden: `geen --font-${match[1]} in ${UITZONDERING}`,
      });
    }
  });

  return gevonden;
}

/*
 * De favicon staat buiten src/ en dus buiten elke andere controle: alles in
 * public/ gaat ongemoeid naar de uitvoer. Een kleur die daar van het design
 * system afdwaalt wordt nergens opgemerkt — hij staat alleen in het tabblad,
 * en niemand vergelijkt die met een token. Vandaar deze aparte tak: elke hex in
 * favicon.svg moet letterlijk een kleur zijn die tokens.css definieert.
 */
const FAVICON = 'public/favicon.svg';

/*
 * In de favicon telt elke hex, ook lengte 4 en 5. De gedeelde HEX laat die door
 * omdat ze in src/ geen kleur zijn, maar `#fff0` is in SVG wel degelijk een
 * kleur — doorzichtig wit — en zou hier dus ongemerkt passeren. Aangetoond met
 * een injectie: met de gedeelde HEX gaf `#fff0` exit 0.
 */
const HEX_ELKE_LENGTE = /#([0-9a-fA-F]+)/g;

/** #abc en #AABBCC zijn dezelfde kleur. Vergelijk op zes kleine letters. */
function normaliseerHex(cijfers) {
  const klein = cijfers.toLowerCase();
  if (klein.length !== 3) return klein;
  return klein[0] + klein[0] + klein[1] + klein[1] + klein[2] + klein[2];
}

/** Elke hexwaarde die de tokenlaag definieert. */
function leesTokenKleuren() {
  if (!existsSync(UITZONDERING)) return new Set();
  const kleuren = new Set();
  for (const match of readFileSync(UITZONDERING, 'utf8').matchAll(HEX)) {
    if (!GELDIGE_HEX_LENGTES.has(match[1].length)) continue;
    kleuren.add(normaliseerHex(match[1]));
  }
  return kleuren;
}

function controleerFavicon() {
  if (!existsSync(FAVICON)) return [];
  const toegestaan = leesTokenKleuren();
  const gevonden = [];

  readFileSync(FAVICON, 'utf8')
    .split('\n')
    .forEach((regel, index) => {
      for (const match of regel.matchAll(HEX_ELKE_LENGTE)) {
        if (toegestaan.has(normaliseerHex(match[1]))) continue;
        gevonden.push({
          pad: FAVICON,
          regel: index + 1,
          kolom: match.index + 1,
          waarde: match[0],
          reden: `geen kleur uit ${UITZONDERING}`,
        });
      }
    });

  return gevonden;
}

if (!existsSync(SRC)) {
  process.exit(0);
}

const overtredingen = [
  ...verzamelBestanden(SRC).filter((pad) => pad !== UITZONDERING).flatMap(controleer),
  ...controleerFavicon(),
].sort((a, b) => a.pad.localeCompare(b.pad) || a.regel - b.regel || a.kolom - b.kolom);

if (overtredingen.length > 0) {
  for (const { pad, regel, kolom, waarde, reden } of overtredingen) {
    console.error(`${pad}:${regel}:${kolom}  ${waarde}${reden ? `  — ${reden}` : ''}`);
  }
  console.error(
    `\n${overtredingen.length} rauwe waarde(n) gevonden. Gebruik een design-system-token; alleen ${UITZONDERING} mag ze letterlijk bevatten.`,
  );
  process.exit(1);
}

console.log(
  'check-tokens: geen rauwe hexkleuren, px-waarden of lettertypenamen in src/, en elke kleur in de favicon komt uit de tokenlaag.',
);
