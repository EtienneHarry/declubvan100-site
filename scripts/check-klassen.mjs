/*
 * Bewaakt dat elke Tailwind-klasse in de bron ook echt CSS oplevert.
 *
 * Aanleiding: `text-tekst-fout` stond in Veld.tsx en deed niets. De semantische
 * laag had `--tekst-fout`, maar `@theme inline` niet — en zonder dat token
 * bestaat de klasse voor Tailwind niet. Elke foutmelding in het formulier zou in
 * de gewone tekstkleur hebben gestaan.
 *
 * Daar valt niets aan te zien. De klasse staat in de HTML, de pagina rendert,
 * er is geen waarschuwing in de build en TypeScript kijkt niet naar
 * klassenamen. Je ziet het pas als iemand opmerkt dat een kleur niet klopt — en
 * bij een foutmelding die alleen verschijnt als er iets misgaat, kan dat lang
 * duren.
 *
 * HOE DIT MEETBAAR IS. Tailwind genereert alleen CSS voor klassen die het kent.
 * Een klasse met een tokennaam die niet bestaat, komt dus niet in de uitvoer.
 * Nagemeten door --color-tekst-fout tijdelijk te verwijderen: `text-tekst-fout`
 * verdween uit de gebouwde CSS, terwijl `text-tekst-stil` gewoon bleef staan.
 *
 * Deze stap vergelijkt dus twee dingen die er allebei al zijn: de klassen in de
 * bron, en de klassen in de gebouwde CSS. Wat in de eerste staat en niet in de
 * tweede, doet niets.
 *
 * DE BACKSLASHES UIT DE CSS WORDEN GESTRIPT en niet nagebootst. Tailwind
 * ontsnapt speciale tekens in een selector: `hover:border-lijn-sterk` wordt
 * `.hover\:border-lijn-sterk`. Door die tekens uit de CSS te halen is de klasse
 * uit de bron er letterlijk in terug te vinden, en hoeft er geen tweede
 * ontsnappingslogica geschreven te worden die na de volgende Tailwind-versie
 * weer anders moet. Het weghalen gebeurt met een tekencode en niet met een
 * backslash in een string — dat is in dit project drie keer misgegaan.
 *
 * WAT HIJ LEEST, sinds B16: elke stringliteral in de bron, met enkele, dubbele
 * of backticks. Tot dan alleen een string direct na `:` of `=` en een
 * class-attribuut, en daardoor zag hij onder meer niets in een template-literal
 * — terwijl `text-tekst-fout`, de klasse waarvoor hij gebouwd is, juist in zo'n
 * literal stond — en niets na `?` of `+`. Nagemeten: elf kleurklassen waren
 * voor deze poort onzichtbaar. In een template-literal worden de `${…}`-delen
 * eruit gehaald en de vaste woorden gecontroleerd.
 *
 * En hij vergelijkt exact. `.text-tekst` telde eerst als gevonden zodra
 * `.text-tekst-zacht` in de CSS stond; nu moet de naam daar ophouden.
 *
 * WAT HIJ NIET ZIET, en dat hoort erbij:
 *
 *   1. Een klasse die pas bij het renderen een naam wordt: `${randen}` in
 *      Veld.tsx is een variabele, en wat erin zit staat elders als volledige
 *      string — en wordt daar gezien.
 *   2. Een opgeknipte naam als `text-${kleur}`. Daar valt niets aan te lezen;
 *      daarom staat de regel in CLAUDE.md.
 *
 * Daarom staat in CLAUDE.md de regel dat een klassenaam altijd volledig wordt
 * opgeschreven. Dat is er niet alleen voor deze poort: Tailwind scant de bron op
 * dezelfde manier en vindt een opgeknipte naam net zomin.
 */

import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const WORTEL = process.cwd();
const SRC = join(WORTEL, 'src');
const CSS_MAP = join(WORTEL, '.vercel', 'output', 'static', '_astro');

if (!existsSync(CSS_MAP)) {
  console.error('check-klassen: de gebouwde CSS ontbreekt. Draai eerst de build.');
  process.exit(1);
}

const BACKSLASH = String.fromCharCode(92);

/* Alle gebouwde CSS aan elkaar, zonder de ontsnappingstekens. */
let css = '';
for (const naam of await readdir(CSS_MAP)) {
  if (naam.endsWith('.css')) css += readFileSync(join(CSS_MAP, naam), 'utf8');
}
css = css.split(BACKSLASH).join('');

/*
 * Elke stringliteral: '…' en "…" op één regel, `…` over meerdere. Dat dekt ook
 * class="…" in een .astro-bestand en className="…" in JSX.
 */
const STRINGLITERAL = /'([^'\n]*)'|"([^"\n]*)"|`([^`]*)`/g;

/* De expressies in een template-literal. Wat ertussen staat, is geen naam. */
const EXPRESSIE = /\$\{[^}]*\}/g;

/*
 * Staat de klasse letterlijk in de CSS, en houdt de naam daar ook op? Na de
 * naam mag geen teken komen dat nog bij een klassenaam hoort — anders telt
 * `.text-tekst` als gevonden omdat `.text-tekst-zacht` er staat.
 */
const LOOPT_DOOR = /[\w/-]/;

function staatInCss(klasse) {
  const zoek = `.${klasse}`;
  let van = 0;
  for (;;) {
    const plek = css.indexOf(zoek, van);
    if (plek === -1) return false;
    const volgend = css[plek + zoek.length] ?? '';
    if (!LOOPT_DOOR.test(volgend)) return true;
    van = plek + 1;
  }
}

async function bronBestanden(map) {
  const uit = [];

  for (const item of await readdir(map, { withFileTypes: true })) {
    const pad = join(map, item.name);
    if (item.isDirectory()) uit.push(...(await bronBestanden(pad)));
    else if (/\.(tsx?|astro)$/.test(item.name)) uit.push(pad);
  }

  return uit;
}

/*
 * Ziet dit eruit als een Tailwind-klasse? Alleen wat op een utility lijkt wordt
 * gecontroleerd; losse woorden uit een gewone string vallen af, anders meldt
 * deze stap elke zin die toevallig in een attribuut staat.
 */
const PREFIXEN = [
  'bg-', 'text-', 'border-', 'rounded-', 'ring-', 'outline-', 'fill-', 'stroke-',
  'from-', 'via-', 'to-', 'shadow-', 'divide-', 'decoration-', 'accent-', 'caret-',
];

/*
 * SVG-attributen die met een van de voorvoegsels hierboven beginnen. Sinds hij
 * elke string leest, ziet hij ook `setAttribute('stroke-dasharray', …)` in
 * HaalScript — een attribuutnaam, geen klasse.
 */
const GEEN_KLASSE = new Set([
  'stroke-dasharray', 'stroke-dashoffset', 'stroke-width', 'stroke-linecap', 'stroke-linejoin',
  'stroke-opacity', 'fill-opacity', 'fill-rule', 'text-anchor', 'text-rendering',
]);

function isUtility(klasse) {
  if (GEEN_KLASSE.has(klasse)) return false;
  if (klasse.includes('${')) return false;
  if (klasse.length < 3) return false;
  // Een half woord uit een opgeknipte naam ("text-" in `text-${kleur}`).
  if (klasse.endsWith('-') || klasse.endsWith(':')) return false;

  const kaal = klasse.slice(klasse.lastIndexOf(':') + 1);
  return PREFIXEN.some((p) => kaal.startsWith(p));
}

const fouten = new Map();
let gezien = 0;

for (const bestand of await bronBestanden(SRC)) {
  const inhoud = readFileSync(bestand, 'utf8');
  const naam = relative(WORTEL, bestand);

  const stukken = [];
  for (const m of inhoud.matchAll(STRINGLITERAL)) {
    const stuk = m[1] ?? m[2] ?? m[3]?.replace(EXPRESSIE, ' ') ?? '';
    if (stuk.trim() !== '') stukken.push(stuk);
  }

  for (const stuk of stukken) {
    for (const klasse of stuk.split(/\s+/)) {
      if (!isUtility(klasse)) continue;
      gezien++;

      if (!staatInCss(klasse)) {
        if (!fouten.has(klasse)) fouten.set(klasse, naam);
      }
    }
  }
}

if (fouten.size > 0) {
  console.error('check-klassen: klassen die geen CSS opleveren.\n');
  for (const [klasse, bestand] of fouten) console.error(`  - ${klasse}   (${bestand})`);
  console.error('');
  console.error('  Deze klassen staan in de bron maar niet in de gebouwde CSS, dus ze doen');
  console.error('  niets. Meestal ontbreekt het token in het @theme-blok van tokens.css:');
  console.error('  de semantische laag heeft het wel, maar zonder --color-… ernaast kent');
  console.error('  Tailwind de naam niet.');
  console.error('');
  process.exit(1);
}

console.log(`check-klassen: ${gezien} kleurklassen in de bron leveren allemaal CSS op.`);
