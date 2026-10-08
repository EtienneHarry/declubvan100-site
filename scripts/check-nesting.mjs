/*
 * Zoekt blokelementen die in een inline-element staan.
 *
 * Aanleiding: de rijke tekst zat een tijd volledig in een <span>. De wortel van
 * de markdoc-boom heet `article` en viel in de terugvaltak van de renderer, die
 * toen een <span> opleverde. Daar zaten vervolgens <h2> en <ul> in.
 *
 * Dat is ongeldige HTML — een span is phrasing content en mag geen flow content
 * bevatten — maar je merkt er niets van. De browser rendert het gewoon, en de
 * vergelijking op tekst, koppen en sectievolgorde gaf nul verschil. Precies het
 * soort fout dat blijft zitten tot iemand een validator draait.
 *
 * Dit script kijkt daarom naar de gebouwde HTML en niet naar de bron: het gaat
 * om wat er echt uitkomt, niet om wat een component van plan was.
 */

import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const WORTEL = process.cwd();
const STATIC = join(WORTEL, '.vercel', 'output', 'static');

/**
 * Inline-elementen die geen blokelement mogen bevatten. Dit is niet de hele
 * lijst uit de specificatie maar wat dit project daadwerkelijk uitstuurt; een
 * langere lijst zou schijnzekerheid geven.
 *
 * `a` staat er bewust niet bij. Dat element heeft in HTML5 een transparant
 * inhoudsmodel: het mag alles bevatten wat op die plek is toegestaan, zolang er
 * niets interactiefs in zit. Een klikbare Kaart met een <h3> en een <p> erin is
 * dus geldig, en die zou anders vals alarm geven.
 */
const INLINE = ['span', 'strong', 'em', 'b', 'i', 'small', 'label', 'button'];

/** Blokelementen die daar niet in horen. */
const BLOK = [
  'div',
  'p',
  'section',
  'article',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'figure',
  'blockquote',
  'header',
  'footer',
  'main',
  'nav',
];

const fouten = [];

/**
 * Loopt de tags langs met een stapel. Geen echte parser, maar genoeg: we hoeven
 * alleen te weten of er een blok opent terwijl er een inline openstaat.
 */
function controleer(html, naam) {
  const stapel = [];
  const tagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g;
  // Deze sluiten zichzelf en horen dus niet op de stapel.
  const leeg = new Set(['br', 'img', 'input', 'meta', 'link', 'hr', 'source', 'path', 'circle']);

  let m;
  while ((m = tagRegex.exec(html))) {
    const sluit = m[1] === '/';
    const tag = m[2].toLowerCase();
    const zelfsluitend = m[3].trimEnd().endsWith('/');

    if (leeg.has(tag) || zelfsluitend) continue;

    if (sluit) {
      // Terug tot de bijbehorende opening. Onbalans negeren we; dat is niet
      // waar dit script over gaat.
      const index = stapel.lastIndexOf(tag);
      if (index !== -1) stapel.length = index;
      continue;
    }

    if (BLOK.includes(tag)) {
      const inlineOuder = stapel.findLast((t) => INLINE.includes(t));
      if (inlineOuder) {
        fouten.push(
          `${naam}: <${tag}> staat in <${inlineOuder}>. Een inline-element mag geen blokelement bevatten.`,
        );
      }
    }

    stapel.push(tag);
  }
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

if (!existsSync(STATIC)) {
  console.error('check-nesting: .vercel/output/static ontbreekt. Draai eerst de build.');
  process.exit(1);
}

for (const bestand of await htmlBestanden(STATIC)) {
  // De SVG's van het logo hebben hun eigen inhoudsmodel; die slaan we over.
  const html = readFileSync(bestand, 'utf8').replace(/<svg[\s\S]*?<\/svg>/gi, '');
  controleer(html, relative(WORTEL, bestand));
}

if (fouten.length > 0) {
  console.error('check-nesting: ongeldige nesting gevonden.\n');
  for (const fout of [...new Set(fouten)]) console.error(`  - ${fout}`);
  console.error('');
  process.exit(1);
}

console.log('check-nesting: geen blokelement binnen een inline-element.');
