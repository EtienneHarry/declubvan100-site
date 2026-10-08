#!/usr/bin/env node
/*
 * Maakt webp-varianten naast elke foto waar een pagina naar verwijst, en
 * schrijft een manifest met wat er gemaakt is.
 *
 * Waarom dit bestaat: Astro's beeldpijplijn werkt op imports die tijdens het
 * bouwen bekend moeten zijn, en een pad dat uit een yaml-bestand komt is dat
 * niet. Zonder deze stap krijgt iedereen het origineel — een telefoon van 375
 * punten haalt een bestand van 1333 bij 2000 op.
 *
 * Waarom bij het bouwen en niet via de beeldoptimalisatie van Vercel: elke
 * fotowijziging van de redacteur gaat via een commit van Keystatic, en die
 * levert een nieuwe build op. Wat zij uploadt komt hier dus net zo goed langs,
 * en dan is lokaal hetzelfde als de deploy. Een endpoint dat alleen op Vercel
 * bestaat, zou lokaal een ander beeld geven dan wat er live staat — en dan kan
 * geen enkele poort er nog iets over zeggen.
 *
 * Drie dingen die niet vanzelf spreken:
 *
 *   - **Alleen foto's waar naar verwezen wordt.** In public/beeld staan er veel
 *     meer dan de site gebruikt. Varianten maken voor een foto die nergens
 *     staat, kost buildtijd en schijfruimte en levert niets op.
 *
 *   - **De extensie blijft in de variantnaam staan.** `Burgers flippen.jpg` en
 *     `Burgers flippen.jpeg` zijn twee verschillende foto's, en met de extensie
 *     eraf leveren ze dezelfde variantnaam op. Dat is gemeten: de tweede werd
 *     stil overgeslagen omdat het bestand er al leek te staan.
 *
 *   - **Het manifest is geen luxe.** Een variant die breder zou zijn dan het
 *     origineel wordt niet gemaakt, want opschalen levert geen scherpte op en
 *     wel bytes. Niet elke foto heeft dus dezelfde varianten, en src/lib/beeld.ts
 *     moet weten welke. Zou die de lijst raden, dan wijst de srcset naar een
 *     bestand dat niet bestaat — precies wat check-beeldpaden vangt.
 *
 * En twee die er in B16 bij kwamen:
 *
 *   - **Er is ook een webp op de volle breedte van het origineel.** Tot B16
 *     stond het origineel zelf als grootste kandidaat in de srcset, en dat koos
 *     elk breed of retinascherm: voor de herofoto van de home een JPEG van
 *     476 kB, drie keer zo zwaar als nodig, voor precies het LCP-element.
 *
 *   - **De foto wordt eerst rechtop gezet.** Een staande telefoonfoto is vaak
 *     liggend opgeslagen met een EXIF-tag die zegt hoe hij gedraaid moet worden.
 *     De browser volgt die tag voor het origineel; sharp deed dat niet, en dan
 *     lag de variant op zijn kant — en stond er de liggende breedte in de
 *     srcset. `.rotate()` zonder hoek draait naar de tag, en de breedte komt
 *     van de rechtgezette foto.
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const BRON = join('public', 'beeld');
const MANIFEST = join('src', 'lib', 'beeldvarianten.json');
const BREEDTES = [640, 1024, 1600];
const KWALITEIT = 72;

if (!existsSync(BRON)) {
  console.log(`maak-beeldvarianten: ${BRON} bestaat niet, niets te doen.`);
  process.exit(0);
}

function verzamel(map, test, uit = []) {
  if (!existsSync(map)) return uit;
  for (const item of readdirSync(map, { withFileTypes: true })) {
    const pad = join(map, item.name);
    if (item.isDirectory()) verzamel(pad, test, uit);
    else if (test(item.name)) uit.push(pad);
  }
  return uit;
}

/**
 * Elk /beeld/…-pad waar de site naar verwijst: uit de content én uit de code.
 * De deurfoto's van het splitscreen staan in pagina.ts en zijn geen
 * redactionele keuze, maar ze moeten net zo goed varianten krijgen.
 */
function verzamelVerwijzingen() {
  const bronnen = verzamel('src', (n) => /\.(yaml|astro|tsx|ts)$/.test(n));
  const gevonden = new Set();
  for (const bestand of bronnen) {
    /*
     * Spaties horen erbij. `/beeld/home/Jor Sep achter.jpg` staat zo in de
     * yaml, en een patroon dat bij de eerste spatie stopt liet die foto
     * stilletjes buiten de varianten vallen — zes in plaats van zeven, zonder
     * melding. Vandaar niet-gulzig tot aan de extensie, met alleen aanhalings-
     * tekens, haakjes en het regeleinde als grens.
     */
    for (const match of readFileSync(bestand, 'utf8').matchAll(/\/beeld\/[^"'\n<>)]+?\.(?:jpe?g|png)/gi)) {
      gevonden.add(match[0]);
    }
  }
  return [...gevonden].sort();
}

/** Het pad van een variant. Moet letterlijk gelijk zijn aan variantPad() in src/lib/beeld.ts. */
function variantPad(webpad, breedte) {
  return `${webpad}-${breedte}.webp`;
}

const verwijzingen = verzamelVerwijzingen();
const manifest = {};
let gemaakt = 0;
let overgeslagen = 0;
let origineelTotaal = 0;
let variantTotaal = 0;
const ontbrekend = [];

for (const webpad of verwijzingen) {
  const bestand = join('public', ...webpad.split('/').filter(Boolean));
  if (!existsSync(bestand)) {
    // Niet hier laten omvallen: check-beeldpaden meldt dit met de goede uitleg
    // en kijkt naar de gebouwde uitvoer in plaats van naar de bron.
    ontbrekend.push(webpad);
    continue;
  }

  const bronStat = statSync(bestand);
  const meta = await sharp(bestand).metadata();
  // EXIF-oriëntatie 5 tot en met 8 is een kwartslag: dan is de hoogte de breedte.
  const rechtop = (meta.orientation ?? 1) >= 5 ? meta.height : meta.width;
  const breedtes = [...BREEDTES.filter((b) => b < rechtop), rechtop];

  manifest[webpad] = { origineel: rechtop, varianten: breedtes };
  origineelTotaal += bronStat.size;

  for (const breedte of breedtes) {
    const doel = join('public', ...variantPad(webpad, breedte).split('/').filter(Boolean));

    if (existsSync(doel) && statSync(doel).mtimeMs >= bronStat.mtimeMs) {
      overgeslagen += 1;
      variantTotaal += statSync(doel).size;
      continue;
    }

    await sharp(bestand).rotate().resize({ width: breedte }).webp({ quality: KWALITEIT }).toFile(doel);
    gemaakt += 1;
    variantTotaal += statSync(doel).size;
  }
}

const nieuw = `${JSON.stringify(manifest, null, 2)}\n`;
const eerder = existsSync(MANIFEST) ? readFileSync(MANIFEST, 'utf8') : '';
if (eerder !== nieuw) writeFileSync(MANIFEST, nieuw);

const kb = (n) => `${Math.round(n / 1024)} kB`;
console.log(
  `maak-beeldvarianten: ${verwijzingen.length} foto('s) in gebruik, ${gemaakt} variant(en) gemaakt en ${overgeslagen} al bij. ` +
    `De originelen zijn samen ${kb(origineelTotaal)}, alle varianten samen ${kb(variantTotaal)}.` +
    (ontbrekend.length > 0 ? ` Let op: ${ontbrekend.length} verwijzing(en) zonder bestand — zie check-beeldpaden.` : ''),
);
