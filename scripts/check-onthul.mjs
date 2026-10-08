/*
 * Bewaakt dat verborgen onthul-inhoud altijd een uitweg heeft.
 *
 * Aanleiding: de koppen stonden sitebreed onzichtbaar terwijl ze ruimte
 * innamen. De wachttoestand was een gepauzeerde animatie op een nulhoog
 * masker, Chrome knipt de intersection-rect op de clip-path van het element
 * zelf, en dus haalde geen enkele kop de losllaatdrempel — de verborgen
 * begintoestand verhinderde precies de melding die hem moest opheffen. Dat is
 * de ergste soort fout: geen foutmelding, geen kapotte build, en lokaal in een
 * pane die niet composit zie je er niets van.
 *
 * WAT HIER WEL EN NIET TE BEWIJZEN VALT — en dat verschil is de kern:
 *
 * Statisch bewijsbaar, en dat doet dit script:
 *   1. Elke CSS-regel die onthul-inhoud verbergt (dekking 0, visibility
 *      hidden, een clip-path, of een gepauzeerde animatie op een
 *      onthul-selector) hangt aan [data-beweging='aan'] — het vlagje dat
 *      alleen een draaiend script zet. Zonder JavaScript is er dus niets
 *      verborgen.
 *   2. Er bestaat geen wachttoestand meer die de meting zelf raakt: op een
 *      selector zónder [data-onthul-staat] mag geen clip-path en geen
 *      animation-play-state staan. De wachtstand mag alleen met dekking of
 *      visibility werken, want die raken de intersection-rect niet.
 *   3. Het loslaatmechanisme en het vangnet zitten in de gebundelde scripts:
 *      het vlagje wordt gezet, de staten 'loopt' en 'klaar' worden geschreven,
 *      en de entree-terugval bestaat.
 *   4. In de gebouwde HTML staat geen enkele voorgebakken toestand: nul keer
 *      data-onthul-staat en nul keer data-accordeon-dicht. De HTML is de
 *      zonder-JavaScript-uitvoer en die hoort compleet zichtbaar te zijn.
 *   5. Op papier staat alles er. Elke regel die onthul-inhoud verbergt, staat
 *      binnen een @media met `screen` — een voorkeur als
 *      prefers-reduced-motion geldt ook bij afdrukken, en afdrukken laat geen
 *      waarnemer vuren. En er is een printregel die elk accordeonpaneel
 *      openzet. Zonder die twee kwamen /privacy en /voorwaarden half leeg uit
 *      de printer (B16).
 *   6. Elke data-onthul-stap in de HTML ligt tussen 0 en 8, en elke stap boven
 *      0 heeft een CSS-regel met een animation-delay. beweging.ts en
 *      beweging.css werden alleen door commentaar bij elkaar gehouden; een
 *      stap zonder regel krijgt stil geen vertraging.
 *
 * NIET statisch bewijsbaar: dat de waarnemer in een echte browser ook echt
 * vuurt. Dat hangt aan browser-gedrag (precies wat hier misging) en is alleen
 * in een composittende browser te zien. Daarvoor is het vangnet in
 * OnthulScript de runtime-garantie — en dít script bewijst dat dat vangnet
 * meegebundeld is, zodat het er niet stilletjes uit kan vallen.
 *
 * Eén benoemde uitzondering: [data-haal-lijn] mag ongeclausuleerd verborgen
 * beginnen. Dat is de decoratieve lijn van de ovaal en de streep, binnen een
 * svg die op aria-hidden staat — er kan geen tekst in schuilgaan, en de
 * afweging (zonder script liever geen versiering dan een uitgerekte) staat in
 * src/styles/haal.css.
 */

import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const WORTEL = process.cwd();
const STATIC = join(WORTEL, '.vercel', 'output', 'static');
const ASSETS = join(STATIC, '_astro');

if (!existsSync(STATIC)) {
  console.error('check-onthul: .vercel/output/static ontbreekt. Draai eerst de build.');
  process.exit(1);
}

const fouten = [];

/* -------------------------------------------------------------------------
   1 + 2. De gebouwde CSS: verbergen mag alleen achter het vlagje, en de
   wachtstand mag de meting niet raken.
   ------------------------------------------------------------------------- */

const VERBERGT = /(?:opacity\s*:\s*0(?![.\d])|visibility\s*:\s*hidden|clip-path\s*:|animation-play-state\s*:\s*paused)/;
const RAAKT_METING = /(?:clip-path\s*:|animation-play-state\s*:\s*paused)/;

async function bestandenMet(map, extensie) {
  const uit = [];
  for (const item of await readdir(map, { withFileTypes: true })) {
    const pad = join(map, item.name);
    if (item.isDirectory()) uit.push(...(await bestandenMet(pad, extensie)));
    else if (item.name.endsWith(extensie)) uit.push(pad);
  }
  return uit;
}

/**
 * Loopt de regels van een stylesheet langs als selector/declaratie-paren, mét
 * de @-regels eromheen. Geen echte parser, maar genoeg: een stapel van
 * accoladeniveaus. De context is nodig voor punt 5 — of een regel binnen een
 * `@media screen` staat, zie je niet aan de regel zelf.
 *
 * De selector is wat er sinds de laatste puntkomma vóór de `{` staat, zodat
 * een @charset of een declaratie van een omringende regel er niet in belandt.
 */
function regelsVan(css) {
  const uit = [];
  const stapel = [];
  let buffer = '';
  const zonderCommentaar = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const teken of zonderCommentaar) {
    if (teken === '{') {
      stapel.push(buffer.slice(buffer.lastIndexOf(';') + 1).trim());
      buffer = '';
    } else if (teken === '}') {
      const kop = stapel.pop();
      if (kop !== undefined && !kop.startsWith('@') && buffer.trim()) {
        uit.push({ selector: kop, declaraties: buffer, context: stapel.filter((s) => s.startsWith('@')) });
      }
      buffer = '';
    } else {
      buffer += teken;
    }
  }
  return uit;
}

const alleRegels = [];

const cssBestanden = existsSync(ASSETS) ? await bestandenMet(ASSETS, '.css') : [];

if (cssBestanden.length === 0) {
  fouten.push('geen gebouwde CSS gevonden in _astro/ — dan valt er ook niets te bewaken.');
}

for (const bestand of cssBestanden) {
  const css = readFileSync(bestand, 'utf8');
  const naam = relative(WORTEL, bestand);

  for (const { selector, declaraties, context } of regelsVan(css)) {
    alleRegels.push({ selector, declaraties, context });

    // Alleen selectors die over de onthulling gaan.
    if (!selector.includes('data-onthul')) continue;
    if (!VERBERGT.test(declaraties)) continue;

    // De benoemde uitzondering: de decoratieve lijn zelf.
    if (selector.includes('data-haal-lijn') && !RAAKT_METING.test(declaraties)) continue;

    // 5. Alleen op het scherm. Een @media zonder `screen` geldt ook op papier.
    if (!context.some((kop) => /^@media\b/.test(kop) && /\bscreen\b/.test(kop))) {
      fouten.push(
        `${naam}: "${selector.slice(0, 80)}" verbergt onthul-inhoud buiten een @media screen ` +
          `(context: ${context.join(' > ') || 'geen'}). Op papier vuurt geen waarnemer, dus dit blijft leeg in de afdruk.`,
      );
    }

    if (!selector.includes('data-beweging')) {
      fouten.push(
        `${naam}: "${selector.slice(0, 80)}" verbergt onthul-inhoud zonder [data-beweging]-vlagje. ` +
          'Zonder JavaScript zou dit permanent onzichtbaar zijn.',
      );
    }

    // De wachtstand: verbergen zonder dat er al een staat op het element
    // staat. Die mag de intersection-meting niet raken.
    const isWachtstand = !/data-onthul-staat=/.test(selector);
    if (isWachtstand && RAAKT_METING.test(declaraties)) {
      fouten.push(
        `${naam}: "${selector.slice(0, 80)}" gebruikt clip-path of een gepauzeerde animatie als wachtstand. ` +
          'Chrome knipt de intersection-rect daarop en dan komt de waarnemer nooit; verberg met dekking.',
      );
    }
  }
}

/*
 * 5b. Een printregel die het accordeon openzet. Het dichte paneel staat op
 * 0fr met overflow hidden, en dat geldt op papier net zo goed.
 */
const accordeonOpPapier = alleRegels.some(
  ({ selector, declaraties, context }) =>
    selector.includes('data-accordeon-paneel') &&
    /grid-template-rows\s*:\s*1fr/.test(declaraties) &&
    context.some((kop) => /^@media\b/.test(kop) && /\bprint\b/.test(kop)),
);

if (cssBestanden.length > 0 && !accordeonOpPapier) {
  fouten.push(
    'geen @media print-regel die [data-accordeon-paneel] op grid-template-rows: 1fr zet. ' +
      'Dichtgeklapte antwoorden komen dan niet op papier.',
  );
}

/*
 * En de inhoud zelf: AccordeonScript zet een dicht antwoord op
 * hidden="until-found", en dat zet content-visibility op hidden. Zonder deze
 * regel staat het paneel op papier open en is het leeg.
 */
const inhoudOpPapier = alleRegels.some(
  ({ selector, declaraties, context }) =>
    selector.includes('data-accordeon-paneel') &&
    selector.includes('until-found') &&
    /content-visibility\s*:\s*visible/.test(declaraties) &&
    context.some((kop) => /^@media\b/.test(kop) && /\bprint\b/.test(kop)),
);

if (cssBestanden.length > 0 && !inhoudOpPapier) {
  fouten.push(
    'geen @media print-regel die de until-found-inhoud van een accordeonpaneel op content-visibility: visible zet. ' +
      'Een dicht antwoord staat dan op papier open maar leeg.',
  );
}

/* -------------------------------------------------------------------------
   3. De gebundelde scripts: het vlagje, de staten en het vangnet.
   ------------------------------------------------------------------------- */

const jsBestanden = existsSync(ASSETS) ? await bestandenMet(ASSETS, '.js') : [];
const bundel = jsBestanden.map((b) => readFileSync(b, 'utf8')).join('\n');

/**
 * Waar dit op zoekt, bestaat in OnthulScript onder deze letterlijke namen.
 * Hernoemt iemand ze, dan valt deze poort — en dat is de bedoeling: dan hoort
 * hier bewust bijgewerkt te worden, niet stilzwijgend.
 */
const VEREIST_IN_SCRIPT = [
  ['beweging="aan"', /beweging\s*=\s*["']aan["']/],
  ["onthulStaat='loopt'", /onthulStaat\s*=\s*["']loopt["']/],
  ["onthulStaat='klaar'", /onthulStaat\s*=\s*["']klaar["']/],
  ['het entree-vangnet', /data-onthul-entree/],
];

for (const [naam, patroon] of VEREIST_IN_SCRIPT) {
  if (!patroon.test(bundel)) {
    fouten.push(
      `de gebundelde scripts missen ${naam}. Zonder dat blijft verborgen onthul-inhoud verborgen.`,
    );
  }
}

/* -------------------------------------------------------------------------
   4. De gebouwde HTML: geen voorgebakken toestand.
   ------------------------------------------------------------------------- */

let paginas = 0;

/**
 * Als attribuut, niet als tekenreeks. Dezelfde namen staan ook in
 * Tailwind-klassen — `[[data-accordeon-dicht]_&]:rotate-0` — en daar zijn ze
 * juist goed: dat is de stijl die op het attribuut wácht. Een echt attribuut
 * begint na witruimte; in een klassenaam staat er altijd een blokhaak voor.
 */
// Opgebouwd met String.raw: een gewone template-literal kookte de backslash
// hier eerder weg en dan matchte de klasse [s"'] in plaats van witruimte —
// een poort die nergens op valt. De functionele toets hieronder in de
// git-geschiedenis (injectie moet hem laten omvallen) ving dat.
const alsAttribuut = (naam) => new RegExp(String.raw`[\s"']` + naam + String.raw`(?=[\s=>])`);
const ONTHUL_STAAT = alsAttribuut('data-onthul-staat');
const ACCORDEON_DICHT = alsAttribuut('data-accordeon-dicht');

/*
 * 6. De stappen. Een attribuut, dus na witruimte; de waarde tussen
 * aanhalingstekens zoals Astro hem schrijft.
 */
const STAP_ATTRIBUUT = /\sdata-onthul-stap="([^"]*)"/g;
const MAX_STAP = 8;
const gebruikteStappen = new Set();

for (const bestand of await bestandenMet(STATIC, '.html')) {
  const html = readFileSync(bestand, 'utf8');
  const naam = relative(WORTEL, bestand);
  paginas++;

  for (const [, waarde] of html.matchAll(STAP_ATTRIBUUT)) {
    const stap = Number(waarde);
    if (!Number.isInteger(stap) || stap < 0 || stap > MAX_STAP) {
      fouten.push(`${naam}: data-onthul-stap="${waarde}" ligt buiten 0 tot en met ${MAX_STAP}.`);
      continue;
    }
    gebruikteStappen.add(stap);
  }

  if (ONTHUL_STAAT.test(html)) {
    fouten.push(`${naam}: bevat een voorgebakken data-onthul-staat. De HTML hoort de zonder-JavaScript-uitvoer te zijn.`);
  }

  if (ACCORDEON_DICHT.test(html)) {
    fouten.push(`${naam}: bevat data-accordeon-dicht als attribuut. Zonder JavaScript horen alle antwoorden open te staan.`);
  }
}

/*
 * 6b. Elke gebruikte stap boven 0 heeft een regel met een vertraging. Stap 0
 * heeft er bewust geen: die begint meteen.
 */
for (const stap of [...gebruikteStappen].sort((a, b) => a - b)) {
  if (stap === 0) continue;
  const selectorVanStap = new RegExp(String.raw`data-onthul-stap=["']?` + stap + String.raw`["']?\]`);
  const heeftRegel = alleRegels.some(
    ({ selector, declaraties }) => selectorVanStap.test(selector) && /animation-delay\s*:/.test(declaraties),
  );
  if (!heeftRegel) {
    fouten.push(
      `stap ${stap} wordt in de HTML gebruikt, maar de gebouwde CSS heeft geen [data-onthul-stap="${stap}"]-regel met animation-delay.`,
    );
  }
}

/* ------------------------------------------------------------------------- */

if (fouten.length > 0) {
  console.error('check-onthul: verborgen inhoud zonder uitweg.\n');
  for (const fout of fouten) console.error(`  - ${fout}`);
  console.error('');
  process.exit(1);
}

console.log(
  `check-onthul: ${paginas} pagina's — verbergen hangt aan het scriptvlagje en geldt alleen op het scherm, de wachtstand raakt de meting niet, het accordeon staat open op papier, stappen ${[...gebruikteStappen].sort((a, b) => a - b).join(',')} hebben elk hun vertraging, en loslaten plus vangnet zitten in de bundel.`,
);
