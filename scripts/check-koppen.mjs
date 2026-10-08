/*
 * Bewaakt de koppenstructuur van elke gebouwde pagina.
 *
 * Drie regels uit het design system die alle drie stil sneuvelden zolang het
 * kopniveau in de sectie zelf vastlag:
 *
 *   1. elke pagina heeft precies één <h1>
 *   2. de eerste kop op de pagina ís die <h1>
 *   3. het niveau daalt met hoogstens één stap tegelijk, en gaat nooit omhoog
 *      naar een niveau dat al gepasseerd was
 *
 * Geen van die drie levert een foutmelding op als je hem breekt. De pagina
 * rendert, de tekst staat er, en alleen een schermlezer of een audit merkt het.
 *
 * SectieLijst in src/lib/SectionRenderer.tsx rekent het niveau uit over de hele
 * sectielijst. Dit script controleert het resultaat, want die berekening kan
 * ook stukgaan — bijvoorbeeld als iemand een sectie los rendert in plaats van
 * via de lijst.
 *
 * Alleen de <main> telt. De koppen in de voettekst horen bij het frame en niet
 * bij de pagina-inhoud.
 *
 * Sinds B16 ook: 4. een kop is nooit leeg. Een kop van alleen spaties uit het
 * CMS leverde een leeg kopelement op — voor een schermlezer een kop zonder
 * naam. De componenten slaan zo'n kop nu over en het CMS weigert hem, en dit
 * is de derde lijn.
 *
 * WAT FAALT EN WAT WAARSCHUWT. De vier regels hierboven laten de poort
 * vallen. De afbreekzeef verderop niet meer: die is een zeef en geen bewijs,
 * en `check` is een verplichte controle op main. Een lang woord in een kop
 * blokkeerde daarmee het publiceren van de redacteur voor iets wat misschien
 * niet eens breekt. Nu is het een waarschuwing — in GitHub Actions als
 * annotatie op de pull request, zodat hij wel te zien is.
 */

import { readFileSync, existsSync } from 'node:fs';
import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';

const WORTEL = process.cwd();
const STATIC = join(WORTEL, '.vercel', 'output', 'static');

/**
 * Pagina's die bewust buiten de regels vallen. Het sectieoverzicht toont elk
 * geval als een pagina-in-het-klein en heeft er dus meerdere; het staat op
 * noindex en is geen echte pagina.
 */
const OVERSLAAN = ['secties'];

const fouten = [];
const waarschuwingen = [];

function koppenVan(html) {
  const start = html.indexOf('<main');
  const eind = html.indexOf('</main>');
  if (start === -1 || eind === -1) return [];

  const main = html.slice(start, eind);

  return [...main.matchAll(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi)].map((m) => ({
    niveau: Number(m[1][1]),
    tekst: m[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 50),
  }));
}

function controleer(html, naam) {
  const koppen = koppenVan(html);

  if (koppen.length === 0) {
    fouten.push(`${naam}: geen enkele kop in <main>.`);
    return;
  }

  const aantalH1 = koppen.filter((k) => k.niveau === 1).length;

  if (aantalH1 === 0) {
    fouten.push(
      `${naam}: geen <h1>. De pagina begint op h${koppen[0].niveau} ("${koppen[0].tekst}").` +
        ' Zet er een sectie boven die een kop kan dragen.',
    );
  } else if (aantalH1 > 1) {
    const welke = koppen.filter((k) => k.niveau === 1).map((k) => `"${k.tekst}"`);
    fouten.push(`${naam}: ${aantalH1} keer <h1> — ${welke.join(', ')}. Er hoort er één te zijn.`);
  } else if (koppen[0].niveau !== 1) {
    fouten.push(
      `${naam}: de eerste kop is h${koppen[0].niveau} ("${koppen[0].tekst}") terwijl de <h1>` +
        ' verderop staat. Het niveau gaat daarmee halverwege omhoog.',
    );
  }

  // 4. Een lege kop. De zachte afbreekstreep telt niet als inhoud.
  for (const kop of koppen) {
    if (kop.tekst.split(ZACHTE_STREEP).join('').trim() === '') {
      fouten.push(`${naam}: een lege <h${kop.niveau}>. Een kop zonder tekst is voor een schermlezer een kop zonder naam.`);
    }
  }

  // Sprong naar beneden van meer dan één stap.
  for (let i = 1; i < koppen.length; i++) {
    const verschil = koppen[i].niveau - koppen[i - 1].niveau;
    if (verschil > 1) {
      fouten.push(
        `${naam}: van h${koppen[i - 1].niveau} naar h${koppen[i].niveau} bij "${koppen[i].tekst}".` +
          ' Er wordt een niveau overgeslagen.',
      );
      break;
    }
  }
}

/*
 * De zeef op afbreken: een lang woord in een displaykop hoort een zachte
 * afbreekstreep te hebben.
 *
 * DIT IS EEN ZEEF EN GEEN BEWIJS, en dat verschil is de kern. Of een woord
 * echt middenin breekt, hangt af van de gerenderde tekstbreedte, en die volgt
 * uit fontshaping — glyphbreedtes, kerning, de variabele as. Dat is hier niet
 * uit te rekenen zonder een woff2-parser en een shaping-machine in de poort te
 * trekken. Wat wél kan is de kandidaten eruit lichten.
 *
 * De drempel komt uit twee gemeten grensgevallen en niet uit een schatting. Op
 * 375 is de tekstkolom 335px (375 min twee keer de marge van 20px) en staat
 * display-xl op 56px. Daar past "verklaring" (10 tekens, ~287px) wél op een
 * regel en breekt "ondernemers" (11 tekens, ~383px) middenin. De grens ligt dus
 * op elf, en niet op de tien die een schatting met de gemiddelde glyphbreedte
 * van 35px opleverde — die schatting gaf vals alarm op een kop die aantoonbaar
 * goed rendert.
 *
 * Wat deze zeef dus niet vangt: een woord van tien tekens dat toevallig uit
 * alleen brede glyphs bestaat — tien keer een m is 570px en breekt wél.
 * Daarvoor is een controle in de browser nodig: die meet de
 * echte regelovergangen in plaats van tekens te tellen. Deze zeef leunt bewust
 * naar zwijgen, want een poort die vals alarm geeft op goede content wordt
 * weggeklikt in plaats van gelezen.
 *
 * Alleen display-xl. Op display-l (40px op 375) passen er ruim dertien tekens
 * en het is daar nog nooit misgegaan; een zeef die te vaak vals alarm geeft,
 * wordt weggeklikt in plaats van gelezen.
 */
const ZACHTE_STREEP = String.fromCharCode(0xad);
const MAX_STUK = 11;

function zeefAfbreking(html, naam) {
  for (const m of html.matchAll(/<(h[1-6])\s[^>]*class="([^"]*)"[^>]*>([\s\S]*?)<\/\1>/gi)) {
    if (!m[2].includes('text-display-xl')) continue;

    const tekst = m[3].replace(/<[^>]+>/g, '');

    for (const woord of tekst.split(/[^\p{L}\p{N}\xAD]+/u)) {
      if (!woord) continue;

      const langsteStuk = Math.max(...woord.split(ZACHTE_STREEP).map((deel) => deel.length));
      if (langsteStuk < MAX_STUK) continue;

      waarschuwingen.push(
        `${naam}: "${woord.split(ZACHTE_STREEP).join('·')}" in een display-xl-kop heeft ` +
          `${langsteStuk} tekens zonder afbreekmogelijkheid. Op 375 passen er ongeveer tien; ` +
          'meet het in de browser en zet er een zachte afbreekstreep in als het breekt — ' +
          String.raw`in de yaml als \xAD, zoals "Voor onder\xADnemers.".`,
      );
    }
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
  console.error('check-koppen: .vercel/output/static ontbreekt. Draai eerst de build.');
  process.exit(1);
}

let nagekeken = 0;

for (const bestand of await htmlBestanden(STATIC)) {
  const naam = relative(WORTEL, bestand);
  if (OVERSLAAN.some((pad) => naam.includes(pad))) continue;

  const html = readFileSync(bestand, 'utf8');
  controleer(html, naam);
  zeefAfbreking(html, naam);
  nagekeken++;
}

/*
 * De waarschuwingen eerst, en los van de uitslag. In GitHub Actions als
 * `::warning::`-regel: die verschijnt als gele annotatie op de pull request,
 * waar de redacteur hem ziet zonder dat de knop op slot gaat.
 */
for (const waarschuwing of waarschuwingen) {
  if (process.env.GITHUB_ACTIONS === 'true') console.log(`::warning title=Lang woord in een kop::${waarschuwing}`);
  else console.warn(`check-koppen: let op — ${waarschuwing}`);
}

if (fouten.length > 0) {
  console.error('check-koppen: de koppenstructuur klopt niet.\n');
  for (const fout of fouten) console.error(`  - ${fout}`);
  console.error('');
  process.exit(1);
}

console.log(
  `check-koppen: ${nagekeken} pagina's, elk één <h1> vooraan, geen overgeslagen niveau, geen lege kop` +
    (waarschuwingen.length > 0
      ? `, en ${waarschuwingen.length} waarschuwing(en) over een lang woord in een display-xl-kop.`
      : ', en geen lang woord in een display-xl-kop zonder afbreekmogelijkheid.'),
);
