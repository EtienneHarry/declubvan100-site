/*
 * Bewaakt dat er geen commentaar in de contentbestanden staat.
 *
 * Aanleiding: bij de eerste echte wijziging via Keystatic verdwenen acht regels
 * uitleg uit src/content/paginas/home.yaml. Geen bug, wel onvermijdelijk — het
 * CMS leest de yaml in zijn eigen datamodel en schrijft hem daaruit terug, en
 * commentaar zit niet in dat model. Wat erin stond was precies het soort kennis
 * dat je niet uit de code kunt aflezen: waarom de meta-beschrijving hier
 * letterlijk herhaald wordt, en wat er van de oude homepagina verhuisd is.
 *
 * Dat is de ergste soort stille fout. Er komt geen melding, de site verandert
 * niet, en de redacteur heeft niets fout gedaan — ze klikte op Save. Je merkt
 * het pas maanden later, als iemand zich afvraagt waarom iets zo staat en er
 * niets meer over te vinden is.
 *
 * De regel is daarom: uitleg over de inhoud hoort in CLAUDE.md of bij de code
 * die de inhoud gebruikt, nooit in de yaml zelf. Dit script houdt dat vast.
 *
 * WAT WEL EN NIET COMMENTAAR IS, en dat verschil is de hele moeilijkheid:
 *
 * Twee van de zeven contentbestanden staan vol regels die met # beginnen, en
 * die mogen juist blijven. Het zijn markdown-koppen binnen een blokscalair —
 * `## 1. Algemeen` in de voorwaarden, `## Wie wij zijn` in de privacytekst.
 * Voor yaml is dat gewone tekst binnen een waarde; het CMS raakt ze niet aan en
 * ze horen bij de pagina. Een naïeve zoektocht naar # zou daar zestien keer
 * vals alarm op geven en meteen uitgezet worden.
 *
 * Het script houdt daarom bij waar een blokscalair begint (`tekst: >-`, `|`,
 * en varianten) en slaat alles over dat dieper ingesprongen staat dan de regel
 * die het blok opende. Buiten zo'n blok geldt: een regel waarvan het eerste
 * niet-witruimteteken een # is, is commentaar.
 *
 * BEKENDE GRENS: commentaar achter een waarde op dezelfde regel (`kop: x # y`)
 * wordt niet gemeld. Dat kan niet betrouwbaar zonder de yaml echt te parsen,
 * want een # mag gewoon in een tekstwaarde staan. Hier is dat geen gat maar een
 * afweging: het CMS wist ook dát commentaar, dus het is niet gevaarlijker dan
 * wat hier wel gevangen wordt — het wordt alleen niet gemeld.
 *
 * Er is met opzet geen yaml-parser gebruikt. Het pakket `yaml` zit in
 * node_modules omdat Astro het meebrengt, niet omdat wij het vragen; een poort
 * die daarop leunt kan stilvallen bij een dependency-wijziging die niets met
 * ons te maken heeft.
 */

import { readFileSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const WORTEL = process.cwd();
const CONTENT = join(WORTEL, 'src', 'content');

/* Opent deze regel een blokscalair? `tekst: >-`, `- |`, `kop: |2+`, enzovoort. */
const BLOK_START = /(?:^|:)\s*[|>][-+]?\d*\s*$/;

function indentVan(regel) {
  return regel.length - regel.trimStart().length;
}

async function yamlBestanden(map) {
  const uit = [];

  for (const item of await readdir(map, { withFileTypes: true })) {
    const pad = join(map, item.name);
    if (item.isDirectory()) uit.push(...(await yamlBestanden(pad)));
    else if (item.name.endsWith('.yaml') || item.name.endsWith('.yml')) uit.push(pad);
  }

  return uit;
}

const fouten = [];
let bestanden = 0;
let overgeslagen = 0;

for (const bestand of await yamlBestanden(CONTENT)) {
  const naam = relative(WORTEL, bestand);
  const regels = readFileSync(bestand, 'utf8').split(/\r?\n/);
  bestanden++;

  /* -1 betekent: we zitten niet in een blokscalair. */
  let blokIndent = -1;

  for (const [i, regel] of regels.entries()) {
    const kaal = regel.trim();

    if (blokIndent >= 0) {
      /* Een lege regel breekt een blok niet af. */
      if (kaal === '') continue;

      if (indentVan(regel) > blokIndent) {
        if (kaal.startsWith('#')) overgeslagen++;
        continue;
      }

      blokIndent = -1;
    }

    if (kaal === '') continue;

    if (kaal.startsWith('#')) {
      fouten.push(`${naam}:${i + 1}  ${kaal.length > 60 ? `${kaal.slice(0, 60)}…` : kaal}`);
      continue;
    }

    if (BLOK_START.test(regel)) blokIndent = indentVan(regel);
  }
}

if (fouten.length > 0) {
  console.error('check-yaml-commentaar: commentaar in een contentbestand.\n');
  for (const fout of fouten) console.error(`  - ${fout}`);
  console.error('');
  console.error('  Keystatic wist dit bij de eerstvolgende keer dat de redacteur die pagina');
  console.error('  opslaat, zonder melding. Zet de uitleg in CLAUDE.md of bij de code die de');
  console.error('  inhoud gebruikt.');
  console.error('');
  process.exit(1);
}

console.log(
  `check-yaml-commentaar: ${bestanden} contentbestanden zonder commentaar ` +
    `(${overgeslagen} #-regels binnen een tekstblok met rust gelaten).`,
);
