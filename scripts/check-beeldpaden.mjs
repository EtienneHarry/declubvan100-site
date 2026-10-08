/*
 * Bewaakt dat elk beeld waarnaar een pagina verwijst bestaat, en dat een
 * redactionele foto in de map van zijn eigen pagina ligt.
 *
 * Aanleiding zijn twee fouten die allebei stil zijn misgegaan.
 *
 * De eerste is een botsing tussen pagina's. Keystatic vernoemt een upload naar
 * het veldpad, niet naar de bestandsnaam die je aanlevert — `transformFilename`
 * werkt volgens de eigen typen van het pakket alleen binnen markdoc- en
 * mdx-velden. Opdrachtgevers en Voor wie is de club hadden allebei hun
 * beeld-tekst op sectie-index 6, dus allebei schreven ze naar
 * secties/6/value/beeld/bron.jpg. De laatste upload won, zonder melding.
 * Opdrachtgevers toonde daarna de cocktailfoto van de-100 onder een alt-tekst
 * over bediening aan tafel: een pagina die klopt, een foto die laadt, en toch
 * het verkeerde beeld. `directory` staat sindsdien per pagina, en dit script
 * houdt vast dat het zo blijft.
 *
 * De tweede is een verwijzing die achterbleef. /secties hardcodeerde
 * /beeld/staff-wanted.jpg terwijl die foto uit public/beeld verdwenen was. Een
 * ontbrekend beeld breekt de build niet: Astro kopieert public/ zoals het is en
 * de pagina rendert een <img> die 404 geeft. Je ziet het pas in de browser, op
 * die ene pagina, als je ernaartoe scrolt.
 *
 * Twee controles dus, en ze vangen elk een andere fout:
 *
 *   1. BESTAAT — elke /beeld/…-verwijzing in de gebouwde HTML wijst naar een
 *      bestand dat er ook echt staat. Dit geldt voor álle verwijzingen, ook die
 *      uit de code komen: de deurfoto's van het splitscreen in pagina.ts en de
 *      regressiegevallen op /secties horen bij geen enkele pagina, maar moeten
 *      net zo goed bestaan.
 *
 *   2. JUISTE MAP — elke `bron:` in src/content/paginas/<pagina>.yaml begint met
 *      /beeld/<pagina>/. Dit is de botsingsbewaker: twee pagina's kunnen niet
 *      meer naar hetzelfde pad wijzen, want hun paden beginnen verschillend. De
 *      bestandsnaam van de yaml ís de paginanaam — pagina() in
 *      keystatic.config.ts geeft diezelfde `map` door aan `path` en aan
 *      `directory`, dus die twee kunnen niet uit elkaar lopen.
 *
 * Controle 2 geldt met opzet alleen voor de content en niet voor de code. Een
 * beeld in pagina.ts is geen redactionele keuze en wordt nooit door Keystatic
 * overschreven; daar is een paginamap dus geen eis. Wat er wél voor geldt is
 * controle 1.
 *
 * NIET bewezen: dat de foto de júiste foto is. Dat een pad bestaat en in de
 * goede map ligt, zegt niets over wat erop staat — de botsing hierboven gaf een
 * bestaand bestand in een bestaande map, en was toch fout. Alleen een mens die
 * de alt-tekst naast het beeld legt, ziet dat.
 */

import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative, basename } from 'node:path';

const WORTEL = process.cwd();
const STATIC = join(WORTEL, '.vercel', 'output', 'static');
const PAGINAS = join(WORTEL, 'src', 'content', 'paginas');

if (!existsSync(STATIC)) {
  console.error('check-beeldpaden: .vercel/output/static ontbreekt. Draai eerst de build.');
  process.exit(1);
}

const fouten = [];

/* --- 1. Bestaat — elke /beeld/…-verwijzing in de gebouwde HTML ------------- */

/*
 * Pakt het pad uit src="/beeld/…" en srcset, en uit url(/beeld/…) in CSS die
 * inline in de HTML zou staan. De aanhalingstekens zijn de grens, want een
 * bestandsnaam mag spaties bevatten — 'Jor Sep achter.jpg' is er zo een, en op
 * een spatie splitsen zou hem in tweeën knippen.
 */
const BEELD_IN_HTML = /["'(](\/beeld\/[^"')]+)["')]/g;

/*
 * Een attribuut kan één pad zijn (`src`) of een lijst kandidaten (`srcset`).
 * Die tweede vorm is `pad 640w, pad 1024w, pad 1333w`: komma's scheiden de
 * kandidaten, witruimte scheidt binnen een kandidaat de URL van zijn breedte.
 *
 * Zonder deze splitsing leest de controle de hele srcset als één bestandsnaam
 * en meldt hij dat een bestand met drie paden en drie breedtes in zijn naam
 * niet bestaat — wat klopt, maar niets zegt over de varianten zelf. Dat is
 * precies wat er gebeurde toen de srcset erbij kwam.
 *
 * Op witruimte splitsen mag alleen binnen een srcset, en dat is het verschil
 * dat hier telt. `src="/beeld/home/Jor Sep achter.jpg"` is één pad mét spaties;
 * dat blind op witruimte knippen levert `/beeld/home/Jor` op — een bestand dat
 * niet bestaat, gemeld als ontbrekend beeld terwijl er niets mis is.
 *
 * Een srcset-kandidaat is te herkennen aan zijn achtervoegsel: een getal met
 * `w` of `x` erachter, helemaal aan het eind. Alleen dat wordt eraf gehaald.
 * In een srcset hoort een spatie in een pad sowieso niet voor te komen — de
 * browser zou daar net zo hard op struikelen — dus src/lib/beeld.ts codeert ze
 * daar, en de decodeURIComponent verderop maakt ze weer leesbaar.
 */
const BREEDTE_ACHTERVOEGSEL = /\s+\d+(?:\.\d+)?[wx]$/;

function kandidaten(waarde) {
  return waarde
    .split(',')
    .map((deel) => deel.trim().replace(BREEDTE_ACHTERVOEGSEL, ''))
    .filter((pad) => pad.startsWith('/beeld/'));
}

async function* htmlBestanden(map) {
  for (const item of await readdir(map, { withFileTypes: true })) {
    const pad = join(map, item.name);
    if (item.isDirectory()) yield* htmlBestanden(pad);
    else if (item.name.endsWith('.html')) yield pad;
  }
}

let verwijzingen = 0;

for await (const bestand of htmlBestanden(STATIC)) {
  const html = readFileSync(bestand, 'utf8');
  const naam = relative(WORTEL, bestand);

  for (const match of html.matchAll(BEELD_IN_HTML)) {
    for (const kandidaat of kandidaten(match[1])) {
      /* De HTML draagt het pad url-gecodeerd; op schijf staat het niet zo. */
      let pad;
      try {
        pad = decodeURIComponent(kandidaat);
      } catch {
        pad = kandidaat;
      }
      verwijzingen++;

      if (!existsSync(join(STATIC, pad.replace(/^\//, '')))) {
        fouten.push(`${naam}: verwijst naar ${pad}, maar dat bestand staat niet in de uitvoer.`);
      }
    }
  }
}

/* --- 2. Juiste map — elke bron: onder /beeld/<pagina>/ --------------------- */

/*
 * De yaml wordt met een regexp gelezen en niet geparsed. Dat mag hier: `bron:`
 * is een pad dat Keystatic zelf schrijft, altijd op één regel en nooit met een
 * blokscalair. Een parser erbij halen zou een afhankelijkheid toevoegen voor
 * een regel die zich in één patroon laat zeggen.
 */
const BRON = /^\s*bron:\s*(.+?)\s*$/gm;

let gecontroleerd = 0;

for (const bestand of await readdir(PAGINAS)) {
  if (!bestand.endsWith('.yaml')) continue;

  const pagina = basename(bestand, '.yaml');
  const yaml = readFileSync(join(PAGINAS, bestand), 'utf8');
  const verwacht = `/beeld/${pagina}/`;

  for (const match of yaml.matchAll(BRON)) {
    const pad = match[1].replace(/^['"]|['"]$/g, '');
    if (!pad.startsWith('/beeld/')) continue;
    gecontroleerd++;

    if (!pad.startsWith(verwacht)) {
      fouten.push(
        `${bestand}: verwijst naar ${pad}, maar een foto van deze pagina hoort onder ${verwacht} te staan. ` +
          'Twee pagina\'s die buiten hun eigen map schrijven, overschrijven elkaars upload.',
      );
    }
  }
}

/* ------------------------------------------------------------------------- */

if (fouten.length > 0) {
  console.error('check-beeldpaden: een beeld ontbreekt of staat in de verkeerde map.\n');
  for (const fout of fouten) console.error(`  - ${fout}`);
  console.error('');
  process.exit(1);
}

console.log(
  `check-beeldpaden: ${verwijzingen} verwijzingen in de uitvoer bestaan, en ${gecontroleerd} redactionele foto's staan in de map van hun eigen pagina.`,
);
