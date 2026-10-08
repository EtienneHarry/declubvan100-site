/*
 * Bewaakt dat elk contentbestand meegaat in de Vercel-functie.
 *
 * Aanleiding: /contact/verzenden gaf op de deploy een 200 met een lege body,
 * terwijl dezelfde bundel lokaal 108 kB HTML opleverde.
 *
 * De oorzaak zit in hoe de inhoud gelezen wordt. De layout en src/lib/pagina.ts
 * gebruiken Keystatics reader, en die leest het bestandssysteem:
 * createReader(process.cwd(), …). Tijdens de build staat src/content/ er
 * gewoon, dus elke vooraf gerenderde pagina komt er prima uit. In de
 * Vercel-functie staat het er niet, tenzij je het met includeFiles meestuurt —
 * en dan geeft read() null en gooit de layout een Error.
 *
 * DAT MISLUKT OP DE VERVELENDST MOGELIJKE MANIER. Astro streamt de HTML, dus de
 * headers zijn al verstuurd wanneer het renderen omvalt. De bezoeker krijgt geen
 * 500 en geen foutpagina maar een 200 met een afgebroken stream: nul bytes, een
 * wit scherm, en niets in de logs van de build. Precies de soort fout waar dit
 * project er meer van heeft gehad.
 *
 * WAAROM DIT NIET VANZELF OPVALT: alle andere pagina's zijn vooraf gerenderd en
 * blijven werken. Alleen de route op verzoek loopt stuk, en die komt pas langs
 * als een bezoeker het formulier verstuurt.
 *
 * Deze stap controleert daarom de uitkomst en niet de instelling: staat elk
 * bestand uit src/content ook echt in de gebouwde functie? Zo vangt hij zowel
 * een vergeten regel in astro.config.mjs als een adapter die de lijst ooit
 * anders gaat verwerken.
 *
 * Let op dat includeFiles geen globs accepteert: de adapter doet realpath() op
 * elke opgegeven string, dus een patroon met sterren breekt de build af met een
 * ENOENT. De lijst is daarom met de hand bijgehouden, en dat is precies waarom
 * er een bewaker op staat.
 */

import { existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const WORTEL = process.cwd();
const CONTENT = join(WORTEL, 'src', 'content');
const FUNCTIE = join(WORTEL, '.vercel', 'output', 'functions', '_render.func');

if (!existsSync(FUNCTIE)) {
  console.error('check-meegebundeld: de functiebundel ontbreekt. Draai eerst de build.');
  process.exit(1);
}

async function bestanden(map) {
  const uit = [];

  for (const item of await readdir(map, { withFileTypes: true })) {
    const pad = join(map, item.name);
    if (item.isDirectory()) uit.push(...(await bestanden(pad)));
    else if (item.name.endsWith('.yaml') || item.name.endsWith('.yml')) uit.push(pad);
  }

  return uit;
}

const fouten = [];
let gecontroleerd = 0;

for (const bestand of await bestanden(CONTENT)) {
  const relatief = relative(WORTEL, bestand).split(sep).join('/');
  gecontroleerd++;

  if (!existsSync(join(FUNCTIE, relatief))) {
    fouten.push(relatief);
  }
}

if (fouten.length > 0) {
  console.error('check-meegebundeld: contentbestanden ontbreken in de Vercel-functie.\n');
  for (const fout of fouten) console.error(`  - ${fout}`);
  console.error('');
  console.error('  Zet ze in includeFiles in astro.config.mjs. Zonder dat leest de reader ze');
  console.error('  niet op de server, gooit de layout, en krijgt de bezoeker van een route op');
  console.error('  verzoek een 200 met een lege pagina — geen foutmelding, geen 500.');
  console.error('');
  console.error('  Geen glob gebruiken: de adapter doet realpath() op elke string.');
  console.error('');
  process.exit(1);
}

console.log(
  `check-meegebundeld: ${gecontroleerd} contentbestanden gaan mee in de functie op verzoek.`,
);
